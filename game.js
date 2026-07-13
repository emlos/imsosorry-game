import { evaluateCondition, validateCondition } from "./conditions.js";
import { runEffects } from "./effects.js";
import { DEFAULT_TILE_SIZE } from "./maps.js";
import {
    INTERACTION_HANDLERS,
    validateInteractionDefinition,
    validateInteractionReferences,
} from "./interactions.js";
import { Player } from "./player.js";
import { SOUNDS } from "./sounds.js";
import { SPRITES } from "./sprites.js";
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
    constructor(canvas, authoredMaps) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");
        this.ctx.imageSmoothingEnabled = false;

        this.authoredMaps = authoredMaps;
        this.maps = [];
        this.mapsById = new Map();
        this.entityDefinitionsByMap = new Map();
        this.activeSpatialData = null;

        const initialMap = authoredMaps[0];
        const initialEntry = initialMap.entries[initialMap.initialEntryId];

        this.state = {
            version: 2,

            player: {
                mapId: initialMap.id,
                col: initialEntry.col,
                row: initialEntry.row,
                facing: { ...initialEntry.facing },
                spriteId: "default",
            },

            flags: {},

            inventory: [],

            maps: Object.fromEntries(authoredMaps.map((map) => [map.id, createMapState(map)])),
        };

        this.images = new Map();
        this.spriteDefinitions = new Map(Object.entries(SPRITES));
        this.soundDefinitions = new Map(Object.entries(SOUNDS));
        this.soundTemplates = new Map();
        this.camera = { x: 0, y: 0 };
        this.player = new Player(DEFAULT_TILE_SIZE, this.state.player);

        this.movementDirections = new Map([
            ["ArrowUp", { dc: 0, dr: -1 }],
            ["KeyW", { dc: 0, dr: -1 }],
            ["ArrowDown", { dc: 0, dr: 1 }],
            ["KeyS", { dc: 0, dr: 1 }],
            ["ArrowLeft", { dc: -1, dr: 0 }],
            ["KeyA", { dc: -1, dr: 0 }],
            ["ArrowRight", { dc: 1, dr: 0 }],
            ["KeyD", { dc: 1, dr: 0 }],
        ]);
        this.keysPressed = new Set();
        this.movementKeyOrder = [];
        this.lastTime = performance.now();

        this.statusElement = document.querySelector("#status");
        this.eventLogElement = document.querySelector("#event-log");

        this.bindInput();
    }

    async start() {
        this.prepareMaps();
        this.prepareSounds();
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
        if (!this.soundDefinitions.has(soundId)) {
            throw new Error(`${label} references missing sound "${soundId}".`);
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

    prepareSounds() {
        for (const [soundId, sound] of this.soundDefinitions) {
            if (
                !sound ||
                typeof sound !== "object" ||
                typeof sound.path !== "string" ||
                sound.path.length === 0 ||
                typeof sound.volume !== "number" ||
                sound.volume < 0 ||
                sound.volume > 1
            ) {
                throw new Error(`Sound "${soundId}" has an invalid definition.`);
            }

            const audio = new Audio(sound.path);
            audio.preload = "auto";
            this.soundTemplates.set(soundId, audio);
        }
    }

    playSound(soundId) {
        const sound = this.soundDefinitions.get(soundId);
        const audio = this.soundTemplates.get(soundId).cloneNode();
        audio.volume = sound.volume;
        audio.play().catch((error) => {
            console.warn(`Could not play sound "${soundId}".`, error);
        });
    }

    transitionTo({ mapId, entryId }) {
        this.validateEntryReference(mapId, entryId, "Transition");

        const map = this.mapsById.get(mapId);
        const entry = map.entries[entryId];

        this.state.player.mapId = mapId;
        this.player.setPosition(entry.col, entry.row);
        this.player.setFacing(entry.facing.dc, entry.facing.dr);
        this.activeSpatialData = this.buildSpatialData(map);

        this.clearMovementInput();
        this.updateCamera();
        this.setStatus(`Map: ${mapId} -- Entry: ${entryId}`);
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
        this.state.flags[flag] = value;
    }

    getFlag(flag) {
        return this.state.flags[flag];
    }

    hasFlag(flag) {
        return this.getFlag(flag) === true;
    }

    addItem(itemId) {
        if (!this.hasItem(itemId)) {
            this.state.inventory.push(itemId);
        }
    }

    removeItem(itemId) {
        this.state.inventory = this.state.inventory.filter(
            (storedItemId) => storedItemId !== itemId,
        );
    }

    hasItem(itemId) {
        return this.state.inventory.includes(itemId);
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

    bindInput() {
        window.addEventListener("keydown", (event) => {
            if (this.movementDirections.has(event.code)) {
                event.preventDefault();

                if (!event.repeat && !this.keysPressed.has(event.code)) {
                    this.keysPressed.add(event.code);
                    this.movementKeyOrder = this.movementKeyOrder.filter(
                        (code) => code !== event.code,
                    );
                    this.movementKeyOrder.push(event.code);
                }

                return;
            }

            const isInteractionKey =
                event.code === "KeyZ" || event.code === "Enter" || event.code === "NumpadEnter";

            if (isInteractionKey && !event.repeat) {
                event.preventDefault();
                this.handleActionInteraction();
            }
        });

        window.addEventListener("keyup", (event) => {
            if (!this.movementDirections.has(event.code)) return;

            this.keysPressed.delete(event.code);
            this.movementKeyOrder = this.movementKeyOrder.filter((code) => code !== event.code);
        });

        window.addEventListener("blur", () => this.clearMovementInput());
    }

    clearMovementInput() {
        this.keysPressed.clear();
        this.movementKeyOrder.length = 0;
    }

    getActiveMovementDirection() {
        for (let index = this.movementKeyOrder.length - 1; index >= 0; index -= 1) {
            const code = this.movementKeyOrder[index];

            if (this.keysPressed.has(code)) {
                return this.movementDirections.get(code);
            }
        }

        return null;
    }

    canPlayerEnter(col, row) {
        const key = `${col},${row}`;
        return (
            this.activeSpatialData.walkable.has(key) && !this.activeSpatialData.collision.has(key)
        );
    }

    handleActionInteraction() {
        const target = this.player.getInteraction(this.activeSpatialData.interactions, "action");

        if (!target) {
            this.logEvent("Nothing responds.");
            return false;
        }

        return this.triggerInteraction(target, "action");
    }

    handleTouchInteraction() {
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

        if (!this.player.isMoving) {
            const direction = this.getActiveMovementDirection();

            if (direction) {
                this.player.tryMove(direction.dc, direction.dr, (col, row) =>
                    this.canPlayerEnter(col, row),
                );
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
        this.player.render(this.ctx, this.camera);
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
