import { AudioSystem } from "./audio.js";
import { evaluateCondition, validateCondition } from "./conditions.js";
import { DialogueBox } from "./dialogue.js";
import { runEffects, validateEffectsDefinition } from "./effects.js";
import { InputController } from "./input.js";
import { InventoryPanel } from "./inventory.js";
import { DEFAULT_TILE_SIZE } from "./maps.js";
import {
    INTERACTION_HANDLERS,
    validateInteractionDefinition,
    validateInteractionReferences,
} from "./interactions.js";
import { Player } from "./player.js";
import { MUSIC, SOUNDS } from "./sounds.js";
import { PLAYER_SPRITES, SPRITES } from "./sprites.js";
import { EMPTY_TILE_ID, TILES } from "./tiles.js";

function cloneLayers(layers) {
    return Object.fromEntries(
        Object.entries(layers).map(([layerName, layer]) => [
            layerName,
            layer.map((row) => [...row]),
        ]),
    );
}

function createEntityState(entity) {
    return {
        active: entity.active,
        col: entity.col,
        row: entity.row,
        spriteId: entity.spriteId,
        collision: entity.collision,
        interaction: structuredClone(entity.interaction),
    };
}

function createMapState(map) {
    return {
        layers: cloneLayers(map.layers),
        entities: Object.fromEntries(
            map.entities.map((entity) => [entity.id, createEntityState(entity)]),
        ),
    };
}

function requireExactKeys(value, allowedKeys, label) {
    for (const key of Object.keys(value)) {
        if (!allowedKeys.has(key)) {
            throw new Error(`${label} contains unsupported property "${key}".`);
        }
    }
}

export class Game {
    constructor(canvas, authoredMaps, authoredItems) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");
        this.ctx.imageSmoothingEnabled = false;

        this.authoredMaps = authoredMaps;
        this.authoredItems = authoredItems;
        this.maps = [];
        this.mapsById = new Map();
        this.entityDefinitionsByMap = new Map();
        this.itemDefinitions = new Map();
        this.activeSpatialData = null;

        const initialMap = authoredMaps[0];
        const initialEntry = initialMap.entries[initialMap.initialEntryId];

        this.state = {
            version: 5,

            player: {
                mapId: initialMap.id,
                col: initialEntry.col,
                row: initialEntry.row,
                facing: { ...initialEntry.facing },
                spriteId: "default",
                movementSpeed: 4.5,
            },

            flags: {},

            inventory: {},

            maps: Object.fromEntries(authoredMaps.map((map) => [map.id, createMapState(map)])),
        };

        this.images = new Map();
        this.spriteDefinitions = new Map(Object.entries(SPRITES));
        this.playerSpriteDefinitions = new Map(Object.entries(PLAYER_SPRITES));
        this.audio = new AudioSystem(SOUNDS, MUSIC);
        this.dialogueBox = new DialogueBox(document.querySelector("#dialogue"));
        this.mode = "world";
        this.selectedItemId = null;
        this.camera = { x: 0, y: 0 };
        this.player = new Player(DEFAULT_TILE_SIZE, this.state.player);
        this.lastTime = performance.now();

        this.statusElement = document.querySelector("#status");
        this.eventLogElement = document.querySelector("#event-log");
        this.inventoryPanel = new InventoryPanel({
            rootElement: document.querySelector("#inventory"),
            openButton: document.querySelector("#open-inventory"),
            onOpen: () => this.openInventory(),
            onClose: () => this.closeInventory(),
            onUse: () => this.useSelectedItem(),
            onSelect: (itemId) => this.selectInventoryItem(itemId),
        });
        this.input = new InputController(this);
    }

    async start() {
        this.prepareMaps();
        this.audio.prepare();
        await this.preloadAllImages();

        const initialMap = this.maps[0];
        this.transitionTo({
            mapId: initialMap.id,
            entryId: initialMap.initialEntryId,
        });

        requestAnimationFrame((time) => this.loop(time));
    }

    prepareMaps() {
        if (!Array.isArray(this.authoredMaps) || this.authoredMaps.length === 0) {
            throw new Error("At least one map is required.");
        }

        this.validateSpriteDefinitions();
        this.validatePlayerSpriteDefinitions();
        this.prepareItems();

        this.maps = this.authoredMaps.map((map) => ({
            ...map,
            tiles: this.mergeTiles(map.tiles),
        }));

        for (const map of this.maps) {
            if (typeof map.id !== "string" || map.id.length === 0) {
                throw new Error("Every map must have a non-empty string ID.");
            }

            if (this.mapsById.has(map.id)) {
                throw new Error(`Duplicate map ID: "${map.id}".`);
            }

            this.mapsById.set(map.id, map);
        }

        this.maps.forEach((map, index) => {
            this.validateMap(map, index === 0);
            this.entityDefinitionsByMap.set(
                map.id,
                new Map(map.entities.map((entity) => [entity.id, entity])),
            );
        });

        for (const map of this.maps) {
            this.validateMapInteractionReferences(map);
            const spatialData = this.buildSpatialData(map);
            this.validateEntries(map, spatialData);
            this.validateExitReferences(map);
        }
    }

    mergeTiles(overrides) {
        const tiles = { ...TILES };

        for (const [tileId, override] of Object.entries(overrides)) {
            tiles[tileId] = {
                ...(tiles[tileId] ?? {}),
                ...override,
            };
        }

        return tiles;
    }

    prepareItems() {
        if (
            !this.authoredItems ||
            typeof this.authoredItems !== "object" ||
            Array.isArray(this.authoredItems)
        ) {
            throw new Error("Item definitions must be an object.");
        }

        for (const [itemId, item] of Object.entries(this.authoredItems)) {
            const label = `Item "${itemId}"`;
            if (itemId.length === 0) {
                throw new Error("Item definitions contain an empty ID.");
            }

            if (!item || typeof item !== "object" || Array.isArray(item)) {
                throw new Error(`${label} must be an object.`);
            }

            requireExactKeys(
                item,
                new Set(["name", "icon", "description", "usable", "effects"]),
                label,
            );

            for (const property of ["name", "icon", "description"]) {
                if (typeof item[property] !== "string" || item[property].length === 0) {
                    throw new Error(`${label}.${property} must be a non-empty string.`);
                }
            }

            if (typeof item.usable !== "boolean") {
                throw new Error(`${label}.usable must be a boolean.`);
            }

            if (item.usable) {
                validateEffectsDefinition(item.effects, `Effects for ${label}`);
            } else if (Object.hasOwn(item, "effects")) {
                throw new Error(`${label} cannot define effects while usable is false.`);
            }

            this.itemDefinitions.set(itemId, item);
        }
    }

    validateMap(map, isInitialMap) {
        if (!map.entries || typeof map.entries !== "object" || Array.isArray(map.entries)) {
            throw new Error(`Map "${map.id}" has no entries object.`);
        }

        if (!map.layers || typeof map.layers !== "object" || Array.isArray(map.layers)) {
            throw new Error(`Map "${map.id}" has no layers object.`);
        }

        if (!Array.isArray(map.entities)) {
            throw new Error(`Map "${map.id}" has no entities array.`);
        }

        if (!Array.isArray(map.exits)) {
            throw new Error(`Map "${map.id}" has no exits array.`);
        }

        const baseLayer = map.layers.base;
        if (!Array.isArray(baseLayer) || baseLayer.length === 0) {
            throw new Error(`Map "${map.id}" has no base layer.`);
        }

        const width = baseLayer[0]?.length;
        const height = baseLayer.length;

        if (!Number.isInteger(width) || width <= 0) {
            throw new Error(`Map "${map.id}" has an empty base layer.`);
        }

        map.gridSize = { width, height };

        if (
            isInitialMap &&
            (typeof map.initialEntryId !== "string" ||
                !Object.hasOwn(map.entries, map.initialEntryId))
        ) {
            throw new Error(`Initial map "${map.id}" has an invalid initialEntryId.`);
        }

        for (const [entryId, entry] of Object.entries(map.entries)) {
            this.validateEntry(entry, `Entry "${entryId}" in "${map.id}"`);
        }

        const validatedTileIds = new Set();
        let walkableBaseCells = 0;

        for (const [layerName, layer] of Object.entries(map.layers)) {
            if (!Array.isArray(layer) || layer.length !== height) {
                throw new Error(
                    `Layer "${layerName}" in map "${map.id}" must contain ${height} rows.`,
                );
            }

            layer.forEach((row, rowIndex) => {
                if (!Array.isArray(row) || row.length !== width) {
                    throw new Error(
                        `Row ${rowIndex} in layer "${layerName}" of map ` +
                            `"${map.id}" must contain ${width} cells.`,
                    );
                }

                row.forEach((tileId, colIndex) => {
                    if (tileId === EMPTY_TILE_ID) return;

                    const tile = map.tiles[tileId];
                    if (!tile) {
                        throw new Error(
                            `Unknown tile ID ${String(tileId)} at ${colIndex},${rowIndex} ` +
                                `in layer "${layerName}" of map "${map.id}".`,
                        );
                    }

                    if (!validatedTileIds.has(tileId)) {
                        this.validateTile(tileId, tile, map.id);
                        validatedTileIds.add(tileId);
                    }

                    if (layerName === "base") {
                        if (tile.size) {
                            throw new Error(
                                `Base tile ${String(tileId)} in "${map.id}" has a size. ` +
                                    "Base tiles must occupy one grid cell.",
                            );
                        }

                        walkableBaseCells += 1;
                    }

                    if (
                        tile.interaction &&
                        this.layerCreatesCollision(layerName, tile) &&
                        (tile.interaction.trigger === "touch" ||
                            tile.interaction.trigger === "both")
                    ) {
                        throw new Error(
                            `Tile ${String(tileId)} in "${map.id}" cannot use ` +
                                `${tile.interaction.trigger} interaction on a colliding layer.`,
                        );
                    }
                });
            });
        }

        if (walkableBaseCells === 0) {
            throw new Error(`Map "${map.id}" has no walkable base cells.`);
        }

        const entityIds = new Set();
        for (const entity of map.entities) {
            this.validateEntityDefinition(entity, map);

            if (entityIds.has(entity.id)) {
                throw new Error(`Duplicate entity ID "${entity.id}" in map "${map.id}".`);
            }

            entityIds.add(entity.id);
        }

        map.exits.forEach((exit, index) => this.validateExitDefinition(exit, map, index));
    }

    validateExitDefinition(exit, map, index) {
        const label = `Exit ${index} in "${map.id}"`;
        if (!exit || typeof exit !== "object" || Array.isArray(exit)) {
            throw new Error(`${label} must be an object.`);
        }

        const edges = new Set(["north", "south", "east", "west"]);
        if (!edges.has(exit.edge)) {
            throw new Error(`${label}.edge must be north, south, east, or west.`);
        }

        if (
            !Array.isArray(exit.range) ||
            exit.range.length !== 2 ||
            !exit.range.every(Number.isInteger) ||
            exit.range[0] < 0 ||
            exit.range[1] < exit.range[0]
        ) {
            throw new Error(`${label}.range must contain two ordered non-negative integers.`);
        }

        const axisLimit =
            exit.edge === "east" || exit.edge === "west"
                ? map.gridSize.height
                : map.gridSize.width;
        if (exit.range[1] >= axisLimit) {
            throw new Error(`${label}.range exceeds the ${exit.edge} edge of "${map.id}".`);
        }

        if (typeof exit.targetMapId !== "string" || exit.targetMapId.length === 0) {
            throw new Error(`${label}.targetMapId must be a non-empty string.`);
        }

        if (Object.hasOwn(exit, "entryId")) {
            requireExactKeys(exit, new Set(["edge", "range", "targetMapId", "entryId"]), label);
            if (typeof exit.entryId !== "string" || exit.entryId.length === 0) {
                throw new Error(`${label}.entryId must be a non-empty string.`);
            }
            return;
        }

        if (Object.hasOwn(exit, "targetPosition")) {
            requireExactKeys(
                exit,
                new Set(["edge", "range", "targetMapId", "targetPosition"]),
                label,
            );
            requireExactKeys(
                exit.targetPosition,
                new Set(["col", "row", "facing"]),
                `${label}.targetPosition`,
            );
            this.validateEntry(exit.targetPosition, `${label}.targetPosition`);
            return;
        }

        requireExactKeys(
            exit,
            new Set([
                "edge",
                "range",
                "targetMapId",
                "targetEdge",
                "preserveAxis",
                "offset",
            ]),
            label,
        );

        if (exit.preserveAxis !== true) {
            throw new Error(`${label}.preserveAxis must be true.`);
        }

        if (!edges.has(exit.targetEdge)) {
            throw new Error(`${label}.targetEdge must be north, south, east, or west.`);
        }

        const horizontalSource = exit.edge === "east" || exit.edge === "west";
        const horizontalTarget = exit.targetEdge === "east" || exit.targetEdge === "west";
        if (horizontalSource !== horizontalTarget) {
            throw new Error(`${label}.targetEdge must preserve the same movement axis.`);
        }

        if (!Number.isInteger(exit.offset)) {
            throw new Error(`${label}.offset must be an integer.`);
        }
    }

    validateExitReferences(map) {
        map.exits.forEach((exit, index) => {
            const label = `Exit ${index} in "${map.id}"`;
            const targetMap = this.mapsById.get(exit.targetMapId);
            if (!targetMap) {
                throw new Error(`${label} references missing map "${exit.targetMapId}".`);
            }

            if (Object.hasOwn(exit, "entryId")) {
                this.validateEntryReference(exit.targetMapId, exit.entryId, label);
                return;
            }

            if (Object.hasOwn(exit, "targetPosition")) {
                this.validateMapPosition(
                    exit.targetMapId,
                    exit.targetPosition.col,
                    exit.targetPosition.row,
                    `${label}.targetPosition`,
                );
                return;
            }

            const targetAxisLimit =
                exit.targetEdge === "east" || exit.targetEdge === "west"
                    ? targetMap.gridSize.height
                    : targetMap.gridSize.width;
            const firstTargetAxis = exit.range[0] + exit.offset;
            const lastTargetAxis = exit.range[1] + exit.offset;
            if (firstTargetAxis < 0 || lastTargetAxis >= targetAxisLimit) {
                throw new Error(`${label} preserves its axis outside "${exit.targetMapId}".`);
            }
        });
    }

    validateTransitionCell(spatialData, col, row, label) {
        const key = `${col},${row}`;
        if (!spatialData.walkable.has(key)) {
            throw new Error(`${label} is not on the walkable base.`);
        }
        if (spatialData.collision.has(key)) {
            throw new Error(`${label} is blocked by collision.`);
        }
    }

    getEdgePosition(map, edge, axis) {
        if (edge === "west") return { col: 0, row: axis };
        if (edge === "east") return { col: map.gridSize.width - 1, row: axis };
        if (edge === "north") return { col: axis, row: 0 };
        return { col: axis, row: map.gridSize.height - 1 };
    }

    getPreservedExitPosition(exit, sourceAxis) {
        const targetMap = this.mapsById.get(exit.targetMapId);
        const targetAxis = sourceAxis + exit.offset;
        const position = this.getEdgePosition(targetMap, exit.targetEdge, targetAxis);
        this.validateMapPosition(
            exit.targetMapId,
            position.col,
            position.row,
            `Preserved exit target`,
        );
        return position;
    }

    validateTile(tileId, tile, mapId) {
        if (!tile || typeof tile !== "object" || Array.isArray(tile)) {
            throw new Error(`Tile ${String(tileId)} in "${mapId}" is invalid.`);
        }

        if (typeof tile.path !== "string" || tile.path.length === 0) {
            throw new Error(`Tile ${String(tileId)} in "${mapId}" has no image path.`);
        }

        if (tile.collision !== undefined && typeof tile.collision !== "boolean") {
            throw new Error(`Tile ${String(tileId)} in "${mapId}" has an invalid collision value.`);
        }

        if (tile.size !== undefined) {
            this.validateSize(tile.size, `Tile ${String(tileId)} in "${mapId}"`);
        }

        if (tile.condition) {
            validateCondition(tile.condition, `Condition for tile ${String(tileId)} in "${mapId}"`);
        }

        if (tile.interaction) {
            validateInteractionDefinition(
                tile.interaction,
                `interaction on tile ${String(tileId)} in "${mapId}"`,
            );
        }
    }

    validateEntityDefinition(entity, map) {
        const label = `Entity in "${map.id}"`;
        if (!entity || typeof entity !== "object" || Array.isArray(entity)) {
            throw new Error(`${label} must be an object.`);
        }

        requireExactKeys(
            entity,
            new Set([
                "id",
                "active",
                "col",
                "row",
                "spriteId",
                "collision",
                "interaction",
                "condition",
            ]),
            label,
        );

        if (typeof entity.id !== "string" || entity.id.length === 0) {
            throw new Error(`${label} must define a non-empty string ID.`);
        }

        const entityLabel = `Entity "${entity.id}" in "${map.id}"`;
        if (typeof entity.active !== "boolean") {
            throw new Error(`${entityLabel}.active must be a boolean.`);
        }

        this.validateMapPosition(map.id, entity.col, entity.row, entityLabel);
        this.validateSpriteReference(entity.spriteId, entityLabel);

        if (typeof entity.collision !== "boolean") {
            throw new Error(`${entityLabel}.collision must be a boolean.`);
        }

        if (entity.interaction !== null) {
            validateInteractionDefinition(entity.interaction, `interaction for ${entityLabel}`);

            if (
                entity.collision &&
                (entity.interaction.trigger === "touch" || entity.interaction.trigger === "both")
            ) {
                throw new Error(
                    `${entityLabel} cannot use ${entity.interaction.trigger} interaction ` +
                        "while collision is enabled.",
                );
            }
        }

        if (entity.condition) {
            validateCondition(entity.condition, `Condition for ${entityLabel}`);
        }

        if (!Object.hasOwn(this.state.maps[map.id].entities, entity.id)) {
            throw new Error(`${entityLabel} has no runtime state.`);
        }
    }

    validateMapInteractionReferences(map) {
        const validatedTileIds = new Set();

        for (const layer of Object.values(map.layers)) {
            for (const row of layer) {
                for (const tileId of row) {
                    if (tileId === EMPTY_TILE_ID || validatedTileIds.has(tileId)) continue;
                    validatedTileIds.add(tileId);

                    const interaction = map.tiles[tileId].interaction;
                    if (interaction) {
                        validateInteractionReferences(
                            this,
                            interaction,
                            map.id,
                            `interaction on tile ${String(tileId)} in "${map.id}"`,
                        );
                    }
                }
            }
        }

        for (const entity of map.entities) {
            if (!entity.interaction) continue;

            validateInteractionReferences(
                this,
                entity.interaction,
                map.id,
                `interaction for entity "${entity.id}" in "${map.id}"`,
            );
        }
    }

    validateSize(size, label) {
        const validSize =
            Array.isArray(size) &&
            size.length === 2 &&
            size.every((value) => Number.isFinite(value) && value > 0);

        if (!validSize) {
            throw new Error(`${label} has an invalid size.`);
        }
    }

    validateSpriteDefinitions() {
        for (const [spriteId, sprite] of this.spriteDefinitions) {
            if (!sprite || typeof sprite !== "object" || Array.isArray(sprite)) {
                throw new Error(`Sprite "${spriteId}" is invalid.`);
            }

            requireExactKeys(sprite, new Set(["path", "size"]), `Sprite "${spriteId}"`);

            if (typeof sprite.path !== "string" || sprite.path.length === 0) {
                throw new Error(`Sprite "${spriteId}" has no image path.`);
            }

            this.validateSize(sprite.size, `Sprite "${spriteId}"`);
        }
    }

    validatePlayerSpriteDefinitions() {
        for (const [spriteId, sprite] of this.playerSpriteDefinitions) {
            const label = `Player sprite "${spriteId}"`;
            if (!sprite || typeof sprite !== "object" || Array.isArray(sprite)) {
                throw new Error(`${label} is invalid.`);
            }

            if (sprite.kind === "shape") {
                requireExactKeys(sprite, new Set(["kind", "fillStyle", "strokeStyle"]), label);

                if (
                    typeof sprite.fillStyle !== "string" ||
                    sprite.fillStyle.length === 0 ||
                    typeof sprite.strokeStyle !== "string" ||
                    sprite.strokeStyle.length === 0
                ) {
                    throw new Error(`${label} must define fillStyle and strokeStyle.`);
                }
                continue;
            }

            if (sprite.kind === "image") {
                requireExactKeys(sprite, new Set(["kind", "path", "size"]), label);
                if (typeof sprite.path !== "string" || sprite.path.length === 0) {
                    throw new Error(`${label} has no image path.`);
                }
                this.validateSize(sprite.size, label);
                continue;
            }

            throw new Error(`${label} has unsupported kind "${String(sprite.kind)}".`);
        }
    }

    validateEntry(entry, label) {
        const validPosition =
            entry &&
            Number.isInteger(entry.col) &&
            Number.isInteger(entry.row) &&
            entry.col >= 0 &&
            entry.row >= 0;

        if (!validPosition) {
            throw new Error(`${label} must contain non-negative integer col and row values.`);
        }

        const facing = entry.facing;
        const cardinalFacing =
            facing &&
            Number.isInteger(facing.dc) &&
            Number.isInteger(facing.dr) &&
            Math.abs(facing.dc) + Math.abs(facing.dr) === 1;

        if (!cardinalFacing) {
            throw new Error(`${label} must define a cardinal facing direction.`);
        }
    }

    validateEntries(map, spatialData) {
        for (const [entryId, entry] of Object.entries(map.entries)) {
            const key = `${entry.col},${entry.row}`;

            if (!spatialData.walkable.has(key)) {
                throw new Error(`Entry "${entryId}" in "${map.id}" is not on the walkable base.`);
            }

            if (spatialData.collision.has(key)) {
                throw new Error(`Entry "${entryId}" in "${map.id}" is blocked by collision.`);
            }
        }
    }

    validateEntryReference(mapId, entryId, label) {
        const map = this.mapsById.get(mapId);
        if (!map) {
            throw new Error(`${label} references missing map "${mapId}".`);
        }

        if (!Object.hasOwn(map.entries, entryId)) {
            throw new Error(`${label} references missing entry "${entryId}" in "${mapId}".`);
        }
    }

    validateEntityReference(mapId, entityId, label) {
        const entities = this.entityDefinitionsByMap.get(mapId);
        if (!entities?.has(entityId)) {
            throw new Error(`${label} references missing entity "${entityId}" in "${mapId}".`);
        }
    }

    validateMapPosition(mapId, col, row, label) {
        const map =
            this.mapsById.get(mapId) ?? this.maps.find((candidate) => candidate.id === mapId);
        if (!map) {
            throw new Error(`${label} references missing map "${mapId}".`);
        }

        if (!Number.isInteger(col) || !Number.isInteger(row) || col < 0 || row < 0) {
            throw new Error(`${label} must use non-negative integer col and row values.`);
        }

        if (col >= map.gridSize.width || row >= map.gridSize.height) {
            throw new Error(`${label} references position ${col},${row} outside "${mapId}".`);
        }
    }

    validateSpriteReference(spriteId, label) {
        if (typeof spriteId !== "string" || !this.spriteDefinitions.has(spriteId)) {
            throw new Error(`${label} references missing sprite "${String(spriteId)}".`);
        }
    }

    validatePlayerSpriteReference(spriteId, label) {
        if (typeof spriteId !== "string" || !this.playerSpriteDefinitions.has(spriteId)) {
            throw new Error(`${label} references missing player sprite "${String(spriteId)}".`);
        }
    }

    validateItemReference(itemId, label) {
        if (typeof itemId !== "string" || !this.itemDefinitions.has(itemId)) {
            throw new Error(`${label} references missing item "${String(itemId)}".`);
        }
    }

    validateTileReference(mapId, layerName, col, row, tileId, label) {
        const map = this.mapsById.get(mapId);
        if (!map) {
            throw new Error(`${label} references missing map "${mapId}".`);
        }

        const layer = map.layers[layerName];
        if (!layer) {
            throw new Error(`${label} references missing layer "${layerName}" in "${mapId}".`);
        }

        this.validateMapPosition(mapId, col, row, label);

        if (tileId !== EMPTY_TILE_ID && !map.tiles[tileId]) {
            throw new Error(`${label} references unknown tile ID ${String(tileId)} in "${mapId}".`);
        }
    }

    validateSoundReference(soundId, label) {
        if (!this.audio.hasSound(soundId)) {
            throw new Error(`${label} references missing sound "${soundId}".`);
        }
    }

    validateMusicReference(musicId, label) {
        if (!this.audio.hasMusic(musicId)) {
            throw new Error(`${label} references missing music "${musicId}".`);
        }
    }

    layerCreatesCollision(layerName, tile) {
        if (layerName === "base") return false;
        if (layerName === "obstacles") return tile.collision !== false;
        return tile.collision === true;
    }

    buildSpatialData(map) {
        const walkable = new Set();
        const collision = new Set();
        const interactions = new Map();
        const visibleEntities = [];
        const layers = this.state.maps[map.id].layers;

        for (const [layerName, layer] of Object.entries(layers)) {
            layer.forEach((row, rowIndex) => {
                row.forEach((tileId, colIndex) => {
                    if (tileId === EMPTY_TILE_ID) return;

                    const tile = map.tiles[tileId];
                    if (!this.isTilePresent(tile)) return;

                    const anchorKey = `${colIndex},${rowIndex}`;
                    if (layerName === "base") {
                        walkable.add(anchorKey);
                    }

                    const interactionActive =
                        tile.interaction &&
                        (!tile.interaction.condition ||
                            this.evaluateCondition(tile.interaction.condition));

                    const target = interactionActive
                        ? {
                              kind: "tile",
                              mapId: map.id,
                              tileId,
                              tile,
                              anchor: { col: colIndex, row: rowIndex },
                              interaction: tile.interaction,
                          }
                        : null;

                    for (const occupied of this.getOccupiedTileCells(colIndex, rowIndex, tile)) {
                        const key = `${occupied.col},${occupied.row}`;

                        if (this.layerCreatesCollision(layerName, tile)) {
                            collision.add(key);
                        }

                        if (target) {
                            interactions.set(key, target);
                        }
                    }
                });
            });
        }

        for (const definition of map.entities) {
            const state = this.getEntityState(map.id, definition.id);
            if (!this.isEntityPresent(definition, state)) continue;

            visibleEntities.push({
                mapId: map.id,
                entityId: definition.id,
                definition,
                state,
            });

            const key = `${state.col},${state.row}`;
            if (state.collision) {
                collision.add(key);
            }

            const interaction = state.interaction;
            if (
                interaction &&
                (!interaction.condition || this.evaluateCondition(interaction.condition))
            ) {
                interactions.set(key, {
                    kind: "entity",
                    mapId: map.id,
                    entityId: definition.id,
                    definition,
                    state,
                    anchor: { col: state.col, row: state.row },
                    interaction,
                });
            }
        }

        return {
            walkable,
            collision,
            interactions,
            entities: visibleEntities,
            bounds: {
                width: map.gridSize.width * DEFAULT_TILE_SIZE,
                height: map.gridSize.height * DEFAULT_TILE_SIZE,
            },
        };
    }

    isTilePresent(tile) {
        return !tile.condition || this.evaluateCondition(tile.condition);
    }

    isEntityPresent(definition, state) {
        if (!state.active) return false;
        return !definition.condition || this.evaluateCondition(definition.condition);
    }

    getOccupiedTileCells(col, row, tile) {
        const [widthPx, heightPx] = tile.size ?? [DEFAULT_TILE_SIZE, DEFAULT_TILE_SIZE];
        const widthInTiles = Math.ceil(widthPx / DEFAULT_TILE_SIZE);
        const heightInTiles = Math.ceil(heightPx / DEFAULT_TILE_SIZE);
        const cells = [];

        for (let dy = 0; dy < heightInTiles; dy += 1) {
            for (let dx = 0; dx < widthInTiles; dx += 1) {
                cells.push({ col: col + dx, row: row + dy });
            }
        }

        return cells;
    }

    async preloadAllImages() {
        const paths = new Set();

        for (const map of this.maps) {
            for (const tile of Object.values(map.tiles)) {
                paths.add(tile.path);
            }
        }

        for (const sprite of this.spriteDefinitions.values()) {
            paths.add(sprite.path);
        }

        for (const sprite of this.playerSpriteDefinitions.values()) {
            if (sprite.kind === "image") {
                paths.add(sprite.path);
            }
        }

        for (const item of this.itemDefinitions.values()) {
            paths.add(item.icon);
        }

        await Promise.all([...paths].map((path) => this.loadImage(path)));
    }

    loadImage(path) {
        if (this.images.has(path)) {
            return Promise.resolve(this.images.get(path));
        }

        return new Promise((resolve, reject) => {
            const image = new Image();

            image.onload = () => {
                this.images.set(path, image);
                resolve(image);
            };

            image.onerror = () => {
                reject(new Error(`Failed to load image: ${path}`));
            };

            image.src = path;
        });
    }

    playSound(soundId) {
        this.audio.playSound(soundId);
    }

    playMusic(musicId) {
        this.audio.playMusic(musicId);
    }

    stopMusic() {
        this.audio.stopMusic();
    }

    showText({ pages, speaker, afterClose, mapId }) {
        if (this.mode !== "world") {
            throw new Error(`Cannot open dialogue while game mode is "${this.mode}".`);
        }

        this.mode = "dialogue";
        this.input.clearMovement();

        this.dialogueBox.open({
            pages: [...pages],
            speaker,
            onClose: () => {
                this.mode = "world";

                if (afterClose !== null) {
                    this.runEffects(afterClose, { mapId });
                }
            },
        });
    }

    advanceDialogue() {
        if (this.mode !== "dialogue") {
            throw new Error("Cannot advance dialogue while dialogue mode is inactive.");
        }

        this.dialogueBox.advance();
    }

    transitionTo(transition) {
        if (this.mode === "dialogue") {
            throw new Error("Cannot transition while dialogue is open.");
        }

        if (!transition || typeof transition !== "object" || Array.isArray(transition)) {
            throw new Error("Transition must be an object.");
        }

        const usesEntry = Object.hasOwn(transition, "entryId");
        const usesPosition = Object.hasOwn(transition, "position");
        if (usesEntry === usesPosition) {
            throw new Error("Transition must define exactly one of entryId or position.");
        }

        const mapId = transition.mapId;
        const map = this.mapsById.get(mapId);
        if (!map) {
            throw new Error(`Transition references missing map "${String(mapId)}".`);
        }

        let position;
        let statusTarget;

        if (usesEntry) {
            requireExactKeys(transition, new Set(["mapId", "entryId"]), "Transition");
            this.validateEntryReference(mapId, transition.entryId, "Transition");
            position = map.entries[transition.entryId];
            statusTarget = `Entry: ${transition.entryId}`;
        } else {
            requireExactKeys(transition, new Set(["mapId", "position"]), "Transition");
            requireExactKeys(
                transition.position,
                new Set(["col", "row", "facing"]),
                "Transition position",
            );
            this.validateEntry(transition.position, "Transition position");
            this.validateMapPosition(
                mapId,
                transition.position.col,
                transition.position.row,
                "Transition position",
            );
            position = transition.position;
            statusTarget = `Position: ${position.col},${position.row}`;
        }

        const spatialData = this.buildSpatialData(map);
        this.validateTransitionCell(spatialData, position.col, position.row, "Transition position");

        this.inventoryPanel.hide();
        this.mode = "world";
        this.state.player.mapId = mapId;
        this.player.setPosition(position.col, position.row);
        this.player.setFacing(position.facing.dc, position.facing.dr);
        this.activeSpatialData = spatialData;

        this.updateCamera();
        this.setStatus(`Map: ${mapId} -- ${statusTarget}`);
    }

    rebuildActiveSpatialData() {
        this.activeSpatialData = this.buildSpatialData(this.activeMap);
    }

    get activeMap() {
        return this.mapsById.get(this.state.player.mapId);
    }

    get activeMapState() {
        return this.state.maps[this.state.player.mapId];
    }

    setFlag(flag, value) {
        if (typeof flag !== "string" || flag.length === 0) {
            throw new Error("Flag ID must be a non-empty string.");
        }
        this.state.flags[flag] = value;
    }

    toggleFlag(flag) {
        if (typeof flag !== "string" || flag.length === 0) {
            throw new Error("Flag ID must be a non-empty string.");
        }
        this.state.flags[flag] = !this.hasFlag(flag);
    }

    getFlag(flag) {
        return this.state.flags[flag];
    }

    hasFlag(flag) {
        return this.getFlag(flag) === true;
    }

    addItem(itemId, quantity) {
        this.validateItemReference(itemId, "Add item");
        if (!Number.isInteger(quantity) || quantity <= 0) {
            throw new Error("Item quantity must be a positive integer.");
        }

        const itemState = this.state.inventory[itemId];
        if (itemState) {
            itemState.quantity += quantity;
        } else {
            this.state.inventory[itemId] = {
                quantity,
                active: false,
            };
        }

        this.refreshInventoryPanel();
    }

    removeItem(itemId, quantity) {
        this.validateItemReference(itemId, "Remove item");
        if (!Number.isInteger(quantity) || quantity <= 0) {
            throw new Error("Item quantity must be a positive integer.");
        }
        const itemState = this.state.inventory[itemId];

        if (!itemState || itemState.quantity < quantity) {
            throw new Error(`Cannot remove ${quantity} of item "${itemId}".`);
        }

        itemState.quantity -= quantity;
        if (itemState.quantity === 0) {
            delete this.state.inventory[itemId];
            if (this.selectedItemId === itemId) {
                this.selectedItemId = Object.keys(this.state.inventory)[0] ?? null;
            }
        }

        this.refreshInventoryPanel();
    }

    consumeItem(itemId, quantity) {
        this.removeItem(itemId, quantity);
    }

    hasItem(itemId) {
        const itemState = this.state.inventory[itemId];
        return itemState !== undefined && itemState.quantity > 0;
    }

    setItemActive(itemId, active) {
        this.validateItemReference(itemId, "Set item active");
        if (typeof active !== "boolean") {
            throw new Error("Item active state must be a boolean.");
        }
        const itemState = this.state.inventory[itemId];
        if (!itemState) {
            throw new Error(`Cannot set inactive inventory item "${itemId}".`);
        }
        itemState.active = active;
        this.refreshInventoryPanel();
    }

    openInventory() {
        if (this.mode !== "world") return false;

        const ownedItemIds = Object.keys(this.state.inventory);
        if (this.selectedItemId === null || !this.hasItem(this.selectedItemId)) {
            this.selectedItemId = ownedItemIds[0] ?? null;
        }

        this.mode = "inventory";
        this.input.clearMovement();
        this.refreshInventoryPanel();
        this.inventoryPanel.show();
        return true;
    }

    closeInventory() {
        if (this.mode !== "inventory") return false;

        this.inventoryPanel.hide();
        this.mode = "world";
        this.input.clearMovement();
        return true;
    }

    selectInventoryItem(itemId) {
        if (this.mode !== "inventory" || !this.hasItem(itemId)) return false;
        this.selectedItemId = itemId;
        this.refreshInventoryPanel();
        return true;
    }

    moveInventorySelection(step) {
        const itemIds = Object.keys(this.state.inventory);
        if (itemIds.length === 0) return false;

        const currentIndex = Math.max(0, itemIds.indexOf(this.selectedItemId));
        const nextIndex = (currentIndex + Math.sign(step) + itemIds.length) % itemIds.length;
        this.selectedItemId = itemIds[nextIndex];
        this.refreshInventoryPanel();
        return true;
    }

    useSelectedItem() {
        if (this.mode !== "inventory" || this.selectedItemId === null) return false;

        const item = this.itemDefinitions.get(this.selectedItemId);
        if (!item.usable) return false;

        const sourceMapId = this.state.player.mapId;
        this.closeInventory();
        this.runEffects(item.effects, { mapId: sourceMapId });
        return true;
    }

    refreshInventoryPanel() {
        this.inventoryPanel.render(this.state.inventory, this.itemDefinitions, this.selectedItemId);
    }

    evaluateCondition(condition) {
        return evaluateCondition(this, condition);
    }

    runEffects(effects, { mapId }) {
        if (!this.mapsById.has(mapId)) {
            throw new Error(`Effects reference missing map "${mapId}".`);
        }

        runEffects(this, effects, mapId);
    }

    setPlayerSprite(spriteId) {
        this.validatePlayerSpriteReference(spriteId, "Set player sprite");
        this.state.player.spriteId = spriteId;
    }

    setPlayerMoveSpeed(tilesPerSecond) {
        if (!Number.isFinite(tilesPerSecond) || tilesPerSecond <= 0) {
            throw new Error("Player movement speed must be a positive number.");
        }
        this.state.player.movementSpeed = tilesPerSecond;
    }

    getEntityState(mapId, entityId) {
        return this.state.maps[mapId].entities[entityId];
    }

    setEntityActive(mapId, entityId, active) {
        this.getEntityState(mapId, entityId).active = active;
    }

    setEntityPosition(mapId, entityId, col, row) {
        const state = this.getEntityState(mapId, entityId);
        state.col = col;
        state.row = row;
    }

    setEntitySprite(mapId, entityId, spriteId) {
        this.getEntityState(mapId, entityId).spriteId = spriteId;
    }

    setEntityCollision(mapId, entityId, collision) {
        this.getEntityState(mapId, entityId).collision = collision;
    }

    setEntityInteraction(mapId, entityId, interaction) {
        this.validateEntityReference(mapId, entityId, "Entity interaction update");

        if (interaction !== null) {
            const label = `interaction update for entity "${entityId}" in "${mapId}"`;
            validateInteractionDefinition(interaction, label);
            validateInteractionReferences(this, interaction, mapId, label);
        }

        this.getEntityState(mapId, entityId).interaction = structuredClone(interaction);

        if (this.state.player.mapId === mapId) {
            this.rebuildActiveSpatialData();
        }
    }

    setTile(mapId, layerName, col, row, tileId) {
        this.state.maps[mapId].layers[layerName][row][col] = tileId;
    }

    canPlayerEnter(col, row) {
        const key = `${col},${row}`;
        return (
            this.activeSpatialData.walkable.has(key) && !this.activeSpatialData.collision.has(key)
        );
    }

    attemptPlayerMovement(dc, dr) {
        if (this.mode !== "world" || this.player.isMoving) return false;

        this.player.setFacing(dc, dr);

        const targetCol = this.player.col + dc;
        const targetRow = this.player.row + dr;

        if (this.canPlayerEnter(targetCol, targetRow)) {
            this.player.startMove(targetCol, targetRow);
            return true;
        }

        const exitAttempt = this.getExitAttempt(targetCol, targetRow, dc, dr);
        if (!exitAttempt) return false;

        const exit = this.activeMap.exits.find(
            (candidate) =>
                candidate.edge === exitAttempt.edge &&
                exitAttempt.axis >= candidate.range[0] &&
                exitAttempt.axis <= candidate.range[1],
        );
        if (!exit) return false;

        this.executeEdgeExit(exit, exitAttempt.axis, { dc, dr });
        return true;
    }

    getExitAttempt(targetCol, targetRow, dc, dr) {
        const { width, height } = this.activeMap.gridSize;
        const outside = targetCol < 0 || targetCol >= width || targetRow < 0 || targetRow >= height;

        if (!outside) {
            const targetKey = `${targetCol},${targetRow}`;
            if (this.activeSpatialData.walkable.has(targetKey)) return null;

            const targetsBoundary =
                (dc === -1 && targetCol === 0) ||
                (dc === 1 && targetCol === width - 1) ||
                (dr === -1 && targetRow === 0) ||
                (dr === 1 && targetRow === height - 1);
            if (!targetsBoundary) return null;
        }

        if (dc === -1) return { edge: "west", axis: targetRow };
        if (dc === 1) return { edge: "east", axis: targetRow };
        if (dr === -1) return { edge: "north", axis: targetCol };
        return { edge: "south", axis: targetCol };
    }

    executeEdgeExit(exit, sourceAxis, movementDirection) {
        if (Object.hasOwn(exit, "entryId")) {
            this.transitionTo({ mapId: exit.targetMapId, entryId: exit.entryId });
            return;
        }

        if (Object.hasOwn(exit, "targetPosition")) {
            this.transitionTo({
                mapId: exit.targetMapId,
                position: structuredClone(exit.targetPosition),
            });
            return;
        }

        const position = this.getPreservedExitPosition(exit, sourceAxis);
        this.transitionTo({
            mapId: exit.targetMapId,
            position: {
                ...position,
                facing: { ...movementDirection },
            },
        });
    }

    handleActionInteraction() {
        if (this.mode !== "world") return false;

        const target = this.player.getInteraction(this.activeSpatialData.interactions, "action");

        if (!target) {
            this.logEvent("Nothing responds.");
            return false;
        }

        return this.triggerInteraction(target, "action");
    }

    handleTouchInteraction() {
        if (this.mode !== "world") return false;

        const target = this.player.getInteraction(this.activeSpatialData.interactions, "touch");
        if (!target) return false;

        return this.triggerInteraction(target, "touch");
    }

    triggerInteraction(target, triggerSource) {
        const sourceMapId = target.mapId;
        const interaction = target.interaction;

        if (interaction.condition && !this.evaluateCondition(interaction.condition)) {
            this.rebuildActiveSpatialData();
            return false;
        }

        const handler = INTERACTION_HANDLERS.get(interaction.handler);

        this.canvas.dispatchEvent(
            new CustomEvent("game-interaction", {
                detail: {
                    mapId: sourceMapId,
                    triggerSource,
                    ...target,
                },
            }),
        );

        if (interaction.message) {
            this.logEvent(interaction.message);
        }

        handler.execute({
            game: this,
            target,
            sourceMapId,
            triggerSource,
        });

        return true;
    }

    update(deltaMs) {
        const completedMove = this.player.update(deltaMs);

        if (completedMove) {
            this.handleTouchInteraction();
        }

        if (this.mode === "world" && !this.player.isMoving) {
            const direction = this.input.getActiveMovementDirection();

            if (direction) {
                this.attemptPlayerMovement(direction.dc, direction.dr);
            }
        }

        this.updateCamera();
    }

    updateCamera() {
        const desiredX = this.player.x + DEFAULT_TILE_SIZE / 2 - this.canvas.width / 2;
        const desiredY = this.player.y + DEFAULT_TILE_SIZE / 2 - this.canvas.height / 2;

        const maxX = Math.max(0, this.activeSpatialData.bounds.width - this.canvas.width);
        const maxY = Math.max(0, this.activeSpatialData.bounds.height - this.canvas.height);

        this.camera.x = Math.max(0, Math.min(desiredX, maxX));
        this.camera.y = Math.max(0, Math.min(desiredY, maxY));
    }

    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        for (const layer of Object.values(this.activeMapState.layers)) {
            this.renderLayer(layer);
        }

        this.renderEntities();

        const playerSprite = this.playerSpriteDefinitions.get(this.state.player.spriteId);
        const playerImage =
            playerSprite.kind === "image" ? this.images.get(playerSprite.path) : null;
        this.player.render(this.ctx, this.camera, playerSprite, playerImage);
    }

    renderLayer(layer) {
        layer.forEach((row, rowIndex) => {
            row.forEach((tileId, colIndex) => {
                if (tileId === EMPTY_TILE_ID) return;

                const tile = this.activeMap.tiles[tileId];
                if (!this.isTilePresent(tile)) return;

                const image = this.images.get(tile.path);
                if (!image) return;

                const [width, height] = tile.size ?? [DEFAULT_TILE_SIZE, DEFAULT_TILE_SIZE];
                const drawX = colIndex * DEFAULT_TILE_SIZE - this.camera.x;
                const drawY = rowIndex * DEFAULT_TILE_SIZE - this.camera.y;

                this.ctx.drawImage(image, drawX, drawY, width, height);
            });
        });
    }

    renderEntities() {
        for (const entity of this.activeSpatialData.entities) {
            const sprite = this.spriteDefinitions.get(entity.state.spriteId);
            const image = this.images.get(sprite.path);
            if (!image) continue;

            const [width, height] = sprite.size;
            const drawX = entity.state.col * DEFAULT_TILE_SIZE - this.camera.x;
            const drawY = entity.state.row * DEFAULT_TILE_SIZE - this.camera.y;

            this.ctx.drawImage(image, drawX, drawY, width, height);
        }
    }

    loop(time) {
        const deltaMs = Math.min(time - this.lastTime, 50);
        this.lastTime = time;

        this.update(deltaMs);
        this.render();

        requestAnimationFrame((nextTime) => this.loop(nextTime));
    }

    setStatus(text) {
        this.statusElement.textContent = text;
    }

    logEvent(text) {
        const existing = this.eventLogElement.textContent.trim();
        const lines = existing ? existing.split("\n") : [];
        lines.unshift(text);

        this.eventLogElement.textContent = lines.slice(0, 8).join("\n");
    }
}
