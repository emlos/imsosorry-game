import { AudioSystem } from "./audio.js";
import { evaluateCondition, validateCondition, validateConditionReferences } from "./conditions.js";
import { DialogueBox } from "./dialogue.js";
import {
    runEffects,
    validateEffectsDefinition,
    validateEffectsReferences,
    visitEffects,
} from "./effects.js";
import { InputController } from "./input.js";
import { InventoryPanel } from "./inventory.js";
import {
    INTERACTION_HANDLERS,
    validateInteractionDefinition,
    validateInteractionReferences,
} from "./interactions.js";
import { Player } from "./player.js";
import { MUSIC, SOUNDS } from "./sounds.js";
import { PLAYER_SPRITES, SPRITES } from "./sprites.js";
import { DEFAULT_TILE_SIZE, EMPTY_TILE_ID, TILES } from "./tiles.js";
import { SAVE_VERSION } from "./saves.js";
import {
    requireArray,
    requireBoolean,
    requireExactKeys,
    requireInteger,
    requireNonEmptyArray,
    requireNonNegativeInteger,
    requireObject,
    requirePlainObject,
    requirePositiveInteger,
    requirePositiveNumber,
    requireString,
} from "./validation.js";

const OPPOSITE_EDGE = {
    north: "south",
    south: "north",
    east: "west",
    west: "east",
};

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

function createRuntimeState(maps) {
    const initialMap = maps[0];
    const initialEntry = initialMap.entries[initialMap.initialEntryId];

    return {
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
        maps: Object.fromEntries(maps.map((map) => [map.id, createMapState(map)])),
    };
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

        this.state = createRuntimeState(authoredMaps);

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
        await Promise.all([this.audio.prepare(), this.preloadAllImages()]);

        const initialMap = this.maps[0];
        this.transitionTo({
            mapId: initialMap.id,
            entryId: initialMap.initialEntryId,
        });

        requestAnimationFrame((time) => this.loop(time));
    }

    prepareMaps() {
        requireNonEmptyArray(this.authoredMaps, "Map definitions");

        this.validateSpriteDefinitions();
        this.validatePlayerSpriteDefinitions();
        this.prepareItems();

        this.maps = this.authoredMaps.map((map) => ({
            ...map,
            tiles: this.mergeTiles(map.tiles),
        }));

        for (const map of this.maps) {
            requireString(map.id, "Map ID");

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

        this.validateItemReferences();

        for (const map of this.maps) {
            this.validateMapReferences(map);
        }

        const initialSpatialDataByMap = new Map(
            this.maps.map((map) => [map.id, this.buildSpatialData(map)]),
        );

        for (const map of this.maps) {
            this.validateEntries(map, initialSpatialDataByMap.get(map.id));
            this.validateExitReferences(map, initialSpatialDataByMap);
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
        requireObject(this.authoredItems, "Item definitions");

        for (const [itemId, item] of Object.entries(this.authoredItems)) {
            const label = `Item "${itemId}"`;
            if (itemId.length === 0) {
                throw new Error("Item definitions contain an empty ID.");
            }

            requireObject(item, label);

            requireExactKeys(
                item,
                new Set(["name", "icon", "description", "usable", "effects"]),
                label,
            );

            for (const property of ["name", "icon", "description"]) {
                requireString(item[property], `${label}.${property}`);
            }

            requireBoolean(item.usable, `${label}.usable`);

            if (item.usable) {
                validateEffectsDefinition(item.effects, `Effects for ${label}`);
            } else if (Object.hasOwn(item, "effects")) {
                throw new Error(`${label} cannot define effects while usable is false.`);
            }

            this.itemDefinitions.set(itemId, item);
        }
    }

    validateItemReferences() {
        for (const [itemId, item] of this.itemDefinitions) {
            if (!item.usable) continue;
            validateEffectsReferences(this, item.effects, null, `Effects for Item "${itemId}"`);
        }
    }

    validateMap(map, isInitialMap) {
        requireObject(map.entries, `Map "${map.id}" entries`);
        requireObject(map.layers, `Map "${map.id}" layers`);
        requireArray(map.entities, `Map "${map.id}" entities`);
        requireArray(map.exits, `Map "${map.id}" exits`);

        const baseLayer = map.layers.base;
        requireNonEmptyArray(baseLayer, `Map "${map.id}" base layer`);

        const width = baseLayer[0]?.length;
        const height = baseLayer.length;

        requirePositiveInteger(width, `Map "${map.id}" base layer width`);

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
                    const cellLabel = `Tile cell ${colIndex},${rowIndex} in layer "${layerName}" of map "${map.id}"`;
                    requireInteger(tileId, cellLabel);
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

                    const placementLabel =
                        `Tile ${String(tileId)} at ${colIndex},${rowIndex} in layer ` +
                        `"${layerName}" of map "${map.id}"`;
                    this.validateTileLayerCompatibility(map, layerName, tileId, placementLabel);
                    this.validateTileFootprint(map, colIndex, rowIndex, tile, placementLabel);

                    if (layerName === "base") {
                        walkableBaseCells += 1;
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
        this.validateExitRangeOverlaps(map);
    }

    validateExitDefinition(exit, map, index) {
        const label = `Exit ${index} in "${map.id}"`;
        requireObject(exit, label);

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
            exit.edge === "east" || exit.edge === "west" ? map.gridSize.height : map.gridSize.width;
        if (exit.range[1] >= axisLimit) {
            throw new Error(`${label}.range exceeds the ${exit.edge} edge of "${map.id}".`);
        }

        requireString(exit.targetMapId, `${label}.targetMapId`);

        if (Object.hasOwn(exit, "entryId")) {
            requireExactKeys(exit, new Set(["edge", "range", "targetMapId", "entryId"]), label);
            requireString(exit.entryId, `${label}.entryId`);
            return;
        }

        if (Object.hasOwn(exit, "targetPosition")) {
            requireExactKeys(
                exit,
                new Set(["edge", "range", "targetMapId", "targetPosition"]),
                label,
            );
            requireObject(exit.targetPosition, `${label}.targetPosition`);
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
            new Set(["edge", "range", "targetMapId", "targetEdge", "preserveAxis", "offset"]),
            label,
        );

        if (exit.preserveAxis !== true) {
            throw new Error(`${label}.preserveAxis must be true.`);
        }

        if (!edges.has(exit.targetEdge)) {
            throw new Error(`${label}.targetEdge must be north, south, east, or west.`);
        }

        if (exit.targetEdge !== OPPOSITE_EDGE[exit.edge]) {
            throw new Error(
                `${label}.targetEdge must be the opposite edge (${exit.edge} to ` +
                    `${OPPOSITE_EDGE[exit.edge]}).`,
            );
        }

        requireInteger(exit.offset, `${label}.offset`);
    }

    validateExitRangeOverlaps(map) {
        for (let firstIndex = 0; firstIndex < map.exits.length; firstIndex += 1) {
            const first = map.exits[firstIndex];

            for (
                let secondIndex = firstIndex + 1;
                secondIndex < map.exits.length;
                secondIndex += 1
            ) {
                const second = map.exits[secondIndex];
                if (first.edge !== second.edge) continue;

                const overlaps =
                    first.range[0] <= second.range[1] && second.range[0] <= first.range[1];
                if (!overlaps) continue;

                throw new Error(
                    `Exit ${secondIndex} in "${map.id}" overlaps exit ${firstIndex} on the ` +
                        `${first.edge} edge.`,
                );
            }
        }
    }

    validateExitReferences(map, initialSpatialDataByMap) {
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
                this.validateTransitionCell(
                    initialSpatialDataByMap.get(exit.targetMapId),
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

            const targetSpatialData = initialSpatialDataByMap.get(exit.targetMapId);
            for (let sourceAxis = exit.range[0]; sourceAxis <= exit.range[1]; sourceAxis += 1) {
                const targetPosition = this.getPreservedExitPosition(exit, sourceAxis);
                this.validateTransitionCell(
                    targetSpatialData,
                    targetPosition.col,
                    targetPosition.row,
                    `${label} destination for source axis ${sourceAxis}`,
                );
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
        const label = `Tile ${String(tileId)} in "${mapId}"`;
        requireObject(tile, label);
        requireString(tile.path, `${label}.path`);

        if (tile.collision !== undefined) {
            requireBoolean(tile.collision, `${label}.collision`);
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
        requireObject(entity, label);

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

        requireString(entity.id, `${label}.id`);

        const entityLabel = `Entity "${entity.id}" in "${map.id}"`;
        requireBoolean(entity.active, `${entityLabel}.active`);

        this.validateMapPosition(map.id, entity.col, entity.row, entityLabel);
        this.validateSpriteReference(entity.spriteId, entityLabel);

        requireBoolean(entity.collision, `${entityLabel}.collision`);

        if (entity.interaction !== null) {
            validateInteractionDefinition(entity.interaction, `interaction for ${entityLabel}`);
        }

        this.validateEntityCollisionInteraction(entity.collision, entity.interaction, entityLabel);

        if (entity.condition) {
            validateCondition(entity.condition, `Condition for ${entityLabel}`);
        }

        if (!Object.hasOwn(this.state.maps[map.id].entities, entity.id)) {
            throw new Error(`${entityLabel} has no runtime state.`);
        }
    }

    validateMapReferences(map) {
        const validatedTileIds = new Set();

        for (const layer of Object.values(map.layers)) {
            for (const row of layer) {
                for (const tileId of row) {
                    if (tileId === EMPTY_TILE_ID || validatedTileIds.has(tileId)) continue;
                    validatedTileIds.add(tileId);

                    const interaction = map.tiles[tileId].interaction;
                    const condition = map.tiles[tileId].condition;
                    if (condition) {
                        validateConditionReferences(
                            this,
                            condition,
                            `Condition for tile ${String(tileId)} in "${map.id}"`,
                        );
                    }

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
            if (entity.condition) {
                validateConditionReferences(
                    this,
                    entity.condition,
                    `Condition for entity "${entity.id}" in "${map.id}"`,
                );
            }

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
            const label = `Sprite "${spriteId}"`;
            requireObject(sprite, label);
            requireExactKeys(sprite, new Set(["path", "size"]), label);
            requireString(sprite.path, `${label}.path`);

            this.validateSize(sprite.size, `Sprite "${spriteId}"`);
        }
    }

    validatePlayerSpriteDefinitions() {
        for (const [spriteId, sprite] of this.playerSpriteDefinitions) {
            const label = `Player sprite "${spriteId}"`;
            requireObject(sprite, label);

            if (sprite.kind === "shape") {
                requireExactKeys(sprite, new Set(["kind", "fillStyle", "strokeStyle"]), label);

                requireString(sprite.fillStyle, `${label}.fillStyle`);
                requireString(sprite.strokeStyle, `${label}.strokeStyle`);
                continue;
            }

            if (sprite.kind === "image") {
                requireExactKeys(sprite, new Set(["kind", "path", "size"]), label);
                requireString(sprite.path, `${label}.path`);
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

        requireNonNegativeInteger(col, `${label}.col`);
        requireNonNegativeInteger(row, `${label}.row`);

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
        requireInteger(tileId, `${label}.tileId`);

        if (tileId !== EMPTY_TILE_ID && !map.tiles[tileId]) {
            throw new Error(`${label} references unknown tile ID ${String(tileId)} in "${mapId}".`);
        }

        this.validateTileLayerCompatibility(map, layerName, tileId, label);
        if (tileId !== EMPTY_TILE_ID) {
            this.validateTileFootprint(map, col, row, map.tiles[tileId], label);
        }
    }

    validateTileFootprint(map, col, row, tile, label) {
        for (const occupied of this.getOccupiedTileCells(col, row, tile)) {
            if (
                occupied.col < 0 ||
                occupied.row < 0 ||
                occupied.col >= map.gridSize.width ||
                occupied.row >= map.gridSize.height
            ) {
                throw new Error(`${label} extends outside map "${map.id}".`);
            }
        }
    }

    validateTileLayerCompatibility(map, layerName, tileId, label) {
        if (tileId === EMPTY_TILE_ID) return;

        const tile = map.tiles[tileId];
        if (layerName === "base" && tile.size) {
            throw new Error(`${label} cannot place a sized tile on the base layer.`);
        }

        if (
            tile.interaction &&
            this.layerCreatesCollision(layerName, tile) &&
            tile.interaction.triggers.includes("touch")
        ) {
            throw new Error(
                `${label} cannot place a tile with a touch interaction on a colliding layer.`,
            );
        }
    }

    validateEntityCollisionInteraction(collision, interaction, label) {
        if (collision && interaction && interaction.triggers.includes("touch")) {
            throw new Error(`${label} cannot combine collision with a touch interaction.`);
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

    buildSpatialData(map, runtimeState = this.state) {
        const walkable = new Set();
        const collision = new Set();
        const interactions = new Map();
        const visibleEntities = [];
        const layers = runtimeState.maps[map.id].layers;

        for (const [layerName, layer] of Object.entries(layers)) {
            layer.forEach((row, rowIndex) => {
                row.forEach((tileId, colIndex) => {
                    if (tileId === EMPTY_TILE_ID) return;

                    const tile = map.tiles[tileId];
                    if (!this.isTilePresent(tile, runtimeState)) return;

                    const anchorKey = `${colIndex},${rowIndex}`;
                    if (layerName === "base") {
                        walkable.add(anchorKey);
                    }

                    const interactionActive =
                        tile.interaction &&
                        (!tile.interaction.condition ||
                            this.evaluateCondition(tile.interaction.condition, runtimeState));

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
            const state = this.getEntityState(map.id, definition.id, runtimeState);
            if (!this.isEntityPresent(definition, state, runtimeState)) continue;

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

            const interaction = definition.interaction;
            if (
                interaction &&
                (!interaction.condition ||
                    this.evaluateCondition(interaction.condition, runtimeState))
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

    isTilePresent(tile, runtimeState = this.state) {
        return !tile.condition || this.evaluateCondition(tile.condition, runtimeState);
    }

    isEntityPresent(definition, state, runtimeState = this.state) {
        if (!state.active) return false;
        return !definition.condition || this.evaluateCondition(definition.condition, runtimeState);
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

    collectUsedTileIdsByMap() {
        const usedTileIdsByMap = new Map(this.maps.map((map) => [map.id, new Set()]));

        for (const map of this.maps) {
            const usedTileIds = usedTileIdsByMap.get(map.id);
            for (const layer of Object.values(map.layers)) {
                for (const row of layer) {
                    for (const tileId of row) {
                        if (tileId !== EMPTY_TILE_ID) usedTileIds.add(tileId);
                    }
                }
            }
        }

        const collectSetTileReferences = (effects, sourceMapId) => {
            visitEffects(effects, (effect) => {
                if (effect.type !== "setTile" || effect.tileId === EMPTY_TILE_ID) return;
                const targetMapId = effect.mapId ?? sourceMapId;
                usedTileIdsByMap.get(targetMapId).add(effect.tileId);
            });
        };

        for (const item of this.itemDefinitions.values()) {
            if (item.usable) collectSetTileReferences(item.effects, null);
        }

        for (const map of this.maps) {
            for (const entity of map.entities) {
                if (entity.interaction?.handler === "effects") {
                    collectSetTileReferences(entity.interaction.effects, map.id);
                }
            }
        }

        const scannedTilesByMap = new Map(this.maps.map((map) => [map.id, new Set()]));
        let foundUnscannedTile = true;
        while (foundUnscannedTile) {
            foundUnscannedTile = false;

            for (const map of this.maps) {
                const scannedTileIds = scannedTilesByMap.get(map.id);
                for (const tileId of usedTileIdsByMap.get(map.id)) {
                    if (scannedTileIds.has(tileId)) continue;
                    scannedTileIds.add(tileId);
                    foundUnscannedTile = true;

                    const interaction = map.tiles[tileId].interaction;
                    if (interaction?.handler === "effects") {
                        collectSetTileReferences(interaction.effects, map.id);
                    }
                }
            }
        }

        return usedTileIdsByMap;
    }

    async preloadAllImages() {
        const paths = new Set();
        const usedTileIdsByMap = this.collectUsedTileIdsByMap();

        for (const map of this.maps) {
            for (const tileId of usedTileIdsByMap.get(map.id)) {
                paths.add(map.tiles[tileId].path);
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

    createSaveData() {
        if (this.mode !== "world" || this.player.isMoving) {
            throw new Error("Cannot save or export unless the game is idle in world mode.");
        }

        const maps = {};

        for (const map of this.maps) {
            const runtimeMap = this.state.maps[map.id];
            const layerChanges = {};

            for (const [layerName, authoredLayer] of Object.entries(map.layers)) {
                const patches = [];
                const runtimeLayer = runtimeMap.layers[layerName];

                authoredLayer.forEach((row, rowIndex) => {
                    row.forEach((tileId, colIndex) => {
                        const runtimeTileId = runtimeLayer[rowIndex][colIndex];
                        if (runtimeTileId !== tileId) {
                            patches.push({ col: colIndex, row: rowIndex, tileId: runtimeTileId });
                        }
                    });
                });

                if (patches.length > 0) {
                    layerChanges[layerName] = patches;
                }
            }

            const entityChanges = {};
            for (const definition of map.entities) {
                const runtimeEntity = runtimeMap.entities[definition.id];
                const changes = {};

                if (runtimeEntity.active !== definition.active) {
                    changes.active = runtimeEntity.active;
                }
                if (runtimeEntity.col !== definition.col || runtimeEntity.row !== definition.row) {
                    changes.col = runtimeEntity.col;
                    changes.row = runtimeEntity.row;
                }
                if (runtimeEntity.spriteId !== definition.spriteId) {
                    changes.spriteId = runtimeEntity.spriteId;
                }
                if (runtimeEntity.collision !== definition.collision) {
                    changes.collision = runtimeEntity.collision;
                }
                if (Object.keys(changes).length > 0) {
                    entityChanges[definition.id] = changes;
                }
            }

            const mapChanges = {};
            if (Object.keys(layerChanges).length > 0) mapChanges.layers = layerChanges;
            if (Object.keys(entityChanges).length > 0) mapChanges.entities = entityChanges;
            if (Object.keys(mapChanges).length > 0) maps[map.id] = mapChanges;
        }

        const saveData = {
            version: SAVE_VERSION,
            savedAt: new Date().toISOString(),
            player: structuredClone(this.state.player),
            flags: structuredClone(this.state.flags),
            inventory: structuredClone(this.state.inventory),
            maps,
        };

        return saveData;
    }

    prepareSaveData(rawSaveData) {
        requirePlainObject(rawSaveData, "Save data");
        requireExactKeys(
            rawSaveData,
            new Set(["version", "savedAt", "player", "flags", "inventory", "maps"]),
            "Save data",
        );

        if (rawSaveData.version !== SAVE_VERSION) {
            throw new Error(`Unsupported save version "${String(rawSaveData.version)}".`);
        }

        requireString(rawSaveData.savedAt, "Save data.savedAt");
        const savedDate = new Date(rawSaveData.savedAt);
        if (Number.isNaN(savedDate.getTime()) || savedDate.toISOString() !== rawSaveData.savedAt) {
            throw new Error("Save data.savedAt must be an ISO timestamp.");
        }

        const candidate = createRuntimeState(this.maps);
        this.applySavedPlayer(candidate, rawSaveData.player);
        this.applySavedFlags(candidate, rawSaveData.flags);
        this.applySavedInventory(candidate, rawSaveData.inventory);
        this.applySavedMaps(candidate, rawSaveData.maps);

        const activeMap = this.mapsById.get(candidate.player.mapId);
        const spatialData = this.buildSpatialData(activeMap, candidate);
        this.validateTransitionCell(
            spatialData,
            candidate.player.col,
            candidate.player.row,
            "Saved player position",
        );

        return {
            saveData: structuredClone(rawSaveData),
            state: candidate,
            spatialData,
        };
    }

    applySavedPlayer(candidate, player) {
        requirePlainObject(player, "Save data.player");
        requireExactKeys(
            player,
            new Set(["mapId", "col", "row", "facing", "spriteId", "movementSpeed"]),
            "Save data.player",
        );
        requireString(player.mapId, "Save data.player.mapId");

        if (!this.mapsById.has(player.mapId)) {
            throw new Error(`Save data.player references missing map "${player.mapId}".`);
        }

        this.validateEntry(player, "Save data.player");
        this.validateMapPosition(player.mapId, player.col, player.row, "Save data.player position");
        this.validatePlayerSpriteReference(player.spriteId, "Save data.player");

        requirePositiveNumber(player.movementSpeed, "Save data.player.movementSpeed");

        candidate.player = structuredClone(player);
    }

    applySavedFlags(candidate, flags) {
        requirePlainObject(flags, "Save data.flags");

        for (const [flag, value] of Object.entries(flags)) {
            requireString(flag, "Save flag ID");
            requireBoolean(value, `Save flag "${flag}"`);
        }

        candidate.flags = structuredClone(flags);
    }

    applySavedInventory(candidate, inventory) {
        requirePlainObject(inventory, "Save data.inventory");

        for (const [itemId, itemState] of Object.entries(inventory)) {
            this.validateItemReference(itemId, "Saved inventory");
            requirePlainObject(itemState, `Saved item "${itemId}"`);
            requireExactKeys(itemState, new Set(["quantity"]), `Saved item "${itemId}"`);

            requirePositiveInteger(itemState.quantity, `Saved item "${itemId}".quantity`);
        }

        candidate.inventory = structuredClone(inventory);
    }

    applySavedMaps(candidate, savedMaps) {
        requirePlainObject(savedMaps, "Save data.maps");

        for (const [mapId, mapChanges] of Object.entries(savedMaps)) {
            const map = this.mapsById.get(mapId);
            if (!map) {
                throw new Error(`Save data references missing map "${mapId}".`);
            }

            requirePlainObject(mapChanges, `Saved map "${mapId}"`);
            requireExactKeys(mapChanges, new Set(["layers", "entities"]), `Saved map "${mapId}"`);
            if (Object.keys(mapChanges).length === 0) {
                throw new Error(`Saved map "${mapId}" contains no mutable state.`);
            }

            if (Object.hasOwn(mapChanges, "layers")) {
                this.applySavedLayerChanges(candidate, map, mapChanges.layers);
            }
            if (Object.hasOwn(mapChanges, "entities")) {
                this.applySavedEntityChanges(candidate, map, mapChanges.entities);
            }
        }
    }

    applySavedLayerChanges(candidate, map, layers) {
        requirePlainObject(layers, `Saved layers for "${map.id}"`);
        if (Object.keys(layers).length === 0) {
            throw new Error(`Saved layers for "${map.id}" cannot be empty.`);
        }

        for (const [layerName, patches] of Object.entries(layers)) {
            if (!Object.hasOwn(map.layers, layerName)) {
                throw new Error(`Saved map "${map.id}" references missing layer "${layerName}".`);
            }
            requireNonEmptyArray(patches, `Saved layer "${map.id}.${layerName}"`);

            const changedCells = new Set();
            patches.forEach((patch, index) => {
                const label = `Saved layer "${map.id}.${layerName}"[${index}]`;
                requirePlainObject(patch, label);
                requireExactKeys(patch, new Set(["col", "row", "tileId"]), label);

                requireInteger(patch.col, `${label}.col`);
                requireInteger(patch.row, `${label}.row`);
                requireInteger(patch.tileId, `${label}.tileId`);

                this.validateTileReference(
                    map.id,
                    layerName,
                    patch.col,
                    patch.row,
                    patch.tileId,
                    label,
                );

                const cellKey = `${patch.col},${patch.row}`;
                if (changedCells.has(cellKey)) {
                    throw new Error(`${label} duplicates tile cell ${cellKey}.`);
                }
                changedCells.add(cellKey);
                candidate.maps[map.id].layers[layerName][patch.row][patch.col] = patch.tileId;
            });
        }
    }

    applySavedEntityChanges(candidate, map, entities) {
        requirePlainObject(entities, `Saved entities for "${map.id}"`);
        if (Object.keys(entities).length === 0) {
            throw new Error(`Saved entities for "${map.id}" cannot be empty.`);
        }

        for (const [entityId, changes] of Object.entries(entities)) {
            this.validateEntityReference(map.id, entityId, `Saved map "${map.id}"`);
            requirePlainObject(changes, `Saved entity "${map.id}.${entityId}"`);
            requireExactKeys(
                changes,
                new Set(["active", "col", "row", "spriteId", "collision"]),
                `Saved entity "${map.id}.${entityId}"`,
            );
            if (Object.keys(changes).length === 0) {
                throw new Error(`Saved entity "${map.id}.${entityId}" contains no changes.`);
            }

            const hasCol = Object.hasOwn(changes, "col");
            const hasRow = Object.hasOwn(changes, "row");
            if (hasCol !== hasRow) {
                throw new Error(
                    `Saved entity "${map.id}.${entityId}" must save col and row together.`,
                );
            }

            const runtimeEntity = candidate.maps[map.id].entities[entityId];

            if (Object.hasOwn(changes, "active")) {
                requireBoolean(changes.active, `Saved entity "${map.id}.${entityId}".active`);
                runtimeEntity.active = changes.active;
            }

            if (hasCol) {
                this.validateMapPosition(
                    map.id,
                    changes.col,
                    changes.row,
                    `Saved entity "${map.id}.${entityId}" position`,
                );
                runtimeEntity.col = changes.col;
                runtimeEntity.row = changes.row;
            }

            if (Object.hasOwn(changes, "spriteId")) {
                this.validateSpriteReference(
                    changes.spriteId,
                    `Saved entity "${map.id}.${entityId}"`,
                );
                runtimeEntity.spriteId = changes.spriteId;
            }

            if (Object.hasOwn(changes, "collision")) {
                requireBoolean(changes.collision, `Saved entity "${map.id}.${entityId}".collision`);
                runtimeEntity.collision = changes.collision;
            }

            const definition = this.entityDefinitionsByMap.get(map.id).get(entityId);
            this.validateEntityCollisionInteraction(
                runtimeEntity.collision,
                definition.interaction,
                `Saved entity "${map.id}.${entityId}"`,
            );
        }
    }

    applyPreparedSave(prepared) {
        if (!prepared || !prepared.state || !prepared.spatialData) {
            throw new Error("Prepared save data is invalid.");
        }

        this.dialogueBox.reset();
        this.inventoryPanel.hide();
        this.audio.stopMusic();
        this.input.clearMovement();

        this.state = prepared.state;
        this.player = new Player(DEFAULT_TILE_SIZE, this.state.player);
        this.activeSpatialData = prepared.spatialData;
        this.selectedItemId = Object.keys(this.state.inventory)[0] ?? null;
        this.mode = "world";
        this.eventLogElement.textContent = "";

        this.refreshInventoryPanel();
        this.updateCamera();
        this.setStatus(`Map: ${this.state.player.mapId} -- Save loaded`);
    }

    playSound(soundId) {
        this.audio.playSound(soundId);
    }

    async playMusic(musicId) {
        return this.audio.playMusic(musicId);
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

        const mapId = transition.mapId;
        const map = this.mapsById.get(mapId);
        const usesEntry = Object.hasOwn(transition, "entryId");
        const position = usesEntry ? map.entries[transition.entryId] : transition.position;
        const statusTarget = usesEntry
            ? `Entry: ${transition.entryId}`
            : `Position: ${position.col},${position.row}`;

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

    refreshSpatialDataAfterMutation(mapId, label) {
        if (this.state.player.mapId !== mapId) return;

        const spatialData = this.buildSpatialData(this.mapsById.get(mapId));
        this.validateTransitionCell(
            spatialData,
            this.player.col,
            this.player.row,
            `${label} would invalidate the player position`,
        );
        this.activeSpatialData = spatialData;
    }

    get activeMap() {
        return this.mapsById.get(this.state.player.mapId);
    }

    get activeMapState() {
        return this.state.maps[this.state.player.mapId];
    }

    applySpatialMutation(mapId, label, mutate, rollback) {
        try {
            mutate();
            this.refreshSpatialDataAfterMutation(mapId, label);
        } catch (error) {
            rollback();
            throw error;
        }
    }

    setFlag(flag, value) {
        requireString(flag, "Flag ID");
        requireBoolean(value, `Flag "${flag}" value`);

        const hadFlag = Object.hasOwn(this.state.flags, flag);
        const previousValue = this.state.flags[flag];
        this.applySpatialMutation(
            this.state.player.mapId,
            `Setting flag "${flag}"`,
            () => {
                this.state.flags[flag] = value;
            },
            () => {
                if (hadFlag) {
                    this.state.flags[flag] = previousValue;
                } else {
                    delete this.state.flags[flag];
                }
            },
        );
    }

    toggleFlag(flag) {
        this.setFlag(flag, !this.hasFlag(flag));
    }

    getFlag(flag) {
        return this.state.flags[flag];
    }

    hasFlag(flag) {
        return this.getFlag(flag) === true;
    }

    addItem(itemId, quantity) {
        this.validateItemReference(itemId, "Adding item");
        requirePositiveInteger(quantity, `Item "${itemId}" quantity`);

        const previousItemState = this.state.inventory[itemId]
            ? { ...this.state.inventory[itemId] }
            : null;
        this.applySpatialMutation(
            this.state.player.mapId,
            `Adding item "${itemId}"`,
            () => {
                const itemState = this.state.inventory[itemId];
                if (itemState) {
                    itemState.quantity += quantity;
                } else {
                    this.state.inventory[itemId] = { quantity };
                }
            },
            () => {
                if (previousItemState) {
                    this.state.inventory[itemId] = previousItemState;
                } else {
                    delete this.state.inventory[itemId];
                }
            },
        );

        this.refreshInventoryPanel();
    }

    removeItem(itemId, quantity) {
        this.validateItemReference(itemId, "Removing item");
        requirePositiveInteger(quantity, `Item "${itemId}" quantity`);

        const itemState = this.state.inventory[itemId];
        if (!itemState || itemState.quantity < quantity) {
            throw new Error(`Cannot remove ${quantity} of item "${itemId}".`);
        }

        const previousItemState = { ...itemState };
        const previousSelectedItemId = this.selectedItemId;
        this.applySpatialMutation(
            this.state.player.mapId,
            `Removing item "${itemId}"`,
            () => {
                itemState.quantity -= quantity;
                if (itemState.quantity === 0) {
                    delete this.state.inventory[itemId];
                    if (this.selectedItemId === itemId) {
                        this.selectedItemId = Object.keys(this.state.inventory)[0] ?? null;
                    }
                }
            },
            () => {
                this.state.inventory[itemId] = previousItemState;
                this.selectedItemId = previousSelectedItemId;
            },
        );

        this.refreshInventoryPanel();
    }

    hasItem(itemId) {
        const itemState = this.state.inventory[itemId];
        return itemState !== undefined && itemState.quantity > 0;
    }

    openInventory() {
        if (this.mode !== "world" || this.player.isMoving) return false;

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

    evaluateCondition(condition, runtimeState = this.state) {
        return evaluateCondition(runtimeState, condition);
    }

    runEffects(effects, { mapId }) {
        runEffects(this, effects, mapId);
    }

    setPlayerSprite(spriteId) {
        this.validatePlayerSpriteReference(spriteId, "Setting player sprite");
        this.state.player.spriteId = spriteId;
    }

    setPlayerMoveSpeed(tilesPerSecond) {
        requirePositiveNumber(tilesPerSecond, "Player movement speed");
        this.state.player.movementSpeed = tilesPerSecond;
    }

    getEntityState(mapId, entityId, runtimeState = this.state) {
        return runtimeState.maps[mapId].entities[entityId];
    }

    setEntityActive(mapId, entityId, active) {
        this.validateEntityReference(mapId, entityId, "Setting entity active state");
        requireBoolean(active, `Entity "${entityId}" active state`);

        const state = this.getEntityState(mapId, entityId);
        const previousActive = state.active;
        this.applySpatialMutation(
            mapId,
            `Changing active state for entity "${entityId}" in "${mapId}"`,
            () => {
                state.active = active;
            },
            () => {
                state.active = previousActive;
            },
        );
    }

    setEntityPosition(mapId, entityId, col, row) {
        this.validateEntityReference(mapId, entityId, "Moving entity");
        this.validateMapPosition(mapId, col, row, `Entity "${entityId}" position`);

        const state = this.getEntityState(mapId, entityId);
        const previousPosition = { col: state.col, row: state.row };
        this.applySpatialMutation(
            mapId,
            `Moving entity "${entityId}" in "${mapId}"`,
            () => {
                state.col = col;
                state.row = row;
            },
            () => {
                state.col = previousPosition.col;
                state.row = previousPosition.row;
            },
        );
    }

    setEntitySprite(mapId, entityId, spriteId) {
        this.validateEntityReference(mapId, entityId, "Setting entity sprite");
        this.validateSpriteReference(spriteId, `Entity "${entityId}"`);
        this.getEntityState(mapId, entityId).spriteId = spriteId;
    }

    setEntityCollision(mapId, entityId, collision) {
        this.validateEntityReference(mapId, entityId, "Setting entity collision");
        requireBoolean(collision, `Entity "${entityId}" collision`);

        const state = this.getEntityState(mapId, entityId);
        const definition = this.entityDefinitionsByMap.get(mapId).get(entityId);
        this.validateEntityCollisionInteraction(
            collision,
            definition.interaction,
            `Entity "${entityId}" in "${mapId}"`,
        );

        const previousCollision = state.collision;
        this.applySpatialMutation(
            mapId,
            `Changing collision for entity "${entityId}" in "${mapId}"`,
            () => {
                state.collision = collision;
            },
            () => {
                state.collision = previousCollision;
            },
        );
    }

    setTile(mapId, layerName, col, row, tileId) {
        const label = `Tile update at ${col},${row} in layer "${layerName}" of "${mapId}"`;
        this.validateTileReference(mapId, layerName, col, row, tileId, label);

        const layer = this.state.maps[mapId].layers[layerName];
        const previousTileId = layer[row][col];
        this.applySpatialMutation(
            mapId,
            label,
            () => {
                layer[row][col] = tileId;
            },
            () => {
                layer[row][col] = previousTileId;
            },
        );
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

        if (interaction.message) {
            this.logEvent(interaction.message);
        }

        handler.execute({
            game: this,
            target,
            sourceMapId,
            triggerSource,
        });

        const detail = {
            mapId: sourceMapId,
            triggerSource,
            kind: target.kind,
        };
        if (target.kind === "entity") {
            detail.entityId = target.entityId;
        } else {
            detail.tileId = target.tileId;
        }

        this.canvas.dispatchEvent(
            new CustomEvent("game-interaction", {
                detail: Object.freeze(detail),
            }),
        );

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

        // Keep the loop alive even if the current update or render throws.
        requestAnimationFrame((nextTime) => this.loop(nextTime));

        this.update(deltaMs);
        this.render();
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
