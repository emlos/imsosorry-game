import { evaluateCondition, validateCondition } from "./conditions.js";
import { runEffects } from "./effects.js";
import { DEFAULT_TILE_SIZE, MAPS } from "./maps.js";
import {
    INTERACTION_HANDLERS,
    INTERACTION_TRIGGERS,
    validateInteractionCondition,
} from "./interactions.js";
import { Player } from "./player.js";
import { SOUNDS } from "./sounds.js";
import { EMPTY_TILE_ID, TILES } from "./tiles.js";

function cloneLayers(layers) {
    return Object.fromEntries(
        Object.entries(layers).map(([layerName, layer]) => [
            layerName,
            layer.map((row) => [...row]),
        ]),
    );
}

export class Game {
    constructor(canvas, authoredMaps) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");
        this.ctx.imageSmoothingEnabled = false;

        this.authoredMaps = authoredMaps;
        this.maps = [];
        this.mapsById = new Map();
        this.entitiesByMap = new Map();
        this.activeSpatialData = null;

        const initialMap = authoredMaps[0];
        const initialEntry = initialMap.entries[initialMap.initialEntryId];

        this.state = {
            version: 1,

            player: {
                mapId: initialMap.id,
                col: initialEntry.col,
                row: initialEntry.row,
                facing: { ...initialEntry.facing },
                spriteId: "default",
            },

            flags: {},

            inventory: [],

            maps: Object.fromEntries(
                authoredMaps.map((map) => [
                    map.id,
                    {
                        entities: {},
                        layers: cloneLayers(map.layers),
                    },
                ]),
            ),
        };

        this.images = new Map();
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

        const entitiesByMap = new Map();

        this.maps.forEach((map, index) => {
            const entities = this.validateMap(map, index === 0);
            const entityDefinitions = new Map();

            for (const entity of entities) {
                entityDefinitions.set(entity.interaction.id, entity);
                this.state.maps[map.id].entities[entity.interaction.id] = {
                    removed: false,
                };
            }

            this.entitiesByMap.set(map.id, entityDefinitions);

            const spatialData = this.buildSpatialData(map);
            this.validateEntries(map, spatialData);
            entitiesByMap.set(map.id, entities);
        });

        for (const [mapId, entities] of entitiesByMap) {
            for (const entity of entities) {
                const interaction = entity.interaction;
                const handler = INTERACTION_HANDLERS.get(interaction.handler);

                handler.validateReferences?.({
                    game: this,
                    interaction,
                    sourceMapId: mapId,
                });
            }
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
        const interactionIds = new Set();
        const entities = [];
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

                    const interaction = tile.interaction;
                    if (!interaction) return;

                    if (interactionIds.has(interaction.id)) {
                        throw new Error(
                            `Duplicate interaction ID "${interaction.id}" in map "${map.id}".`,
                        );
                    }

                    if (
                        this.layerCreatesCollision(layerName, tile) &&
                        (interaction.trigger === "touch" || interaction.trigger === "both")
                    ) {
                        throw new Error(
                            `Interaction "${interaction.id}" in "${map.id}" cannot use ` +
                                `${interaction.trigger} on a colliding tile.`,
                        );
                    }

                    interactionIds.add(interaction.id);
                    entities.push({
                        interaction,
                        tile,
                        tileId,
                        layerName,
                        anchor: { col: colIndex, row: rowIndex },
                    });
                });
            });
        }

        if (walkableBaseCells === 0) {
            throw new Error(`Map "${map.id}" has no walkable base cells.`);
        }

        return entities;
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
            const validSize =
                Array.isArray(tile.size) &&
                tile.size.length === 2 &&
                tile.size.every((value) => Number.isFinite(value) && value > 0);

            if (!validSize) {
                throw new Error(`Tile ${String(tileId)} in "${mapId}" has an invalid size.`);
            }
        }

        if (tile.sprites !== undefined) {
            if (!tile.sprites || typeof tile.sprites !== "object" || Array.isArray(tile.sprites)) {
                throw new Error(`Tile ${String(tileId)} in "${mapId}" has invalid sprites.`);
            }

            for (const [spriteId, path] of Object.entries(tile.sprites)) {
                if (spriteId.length === 0 || typeof path !== "string" || path.length === 0) {
                    throw new Error(
                        `Tile ${String(tileId)} in "${mapId}" has invalid sprite "${spriteId}".`,
                    );
                }
            }
        }

        if (tile.condition) {
            validateCondition(tile.condition, `Condition for tile ${String(tileId)} in "${mapId}"`);
        }

        const interaction = tile.interaction;
        if (!interaction) return;

        if (
            typeof interaction.id !== "string" ||
            interaction.id.length === 0 ||
            typeof interaction.handler !== "string" ||
            interaction.handler.length === 0
        ) {
            throw new Error(`Tile ${String(tileId)} in "${mapId}" has an invalid interaction.`);
        }

        if (!INTERACTION_TRIGGERS.has(interaction.trigger)) {
            throw new Error(
                `Interaction "${interaction.id}" in "${mapId}" must use ` +
                    'trigger: "action", "touch", or "both".',
            );
        }

        validateInteractionCondition(interaction, mapId);

        const handler = INTERACTION_HANDLERS.get(interaction.handler);
        if (!handler) {
            throw new Error(
                `Interaction "${interaction.id}" in "${mapId}" references ` +
                    `unknown handler "${interaction.handler}".`,
            );
        }

        handler.validateDefinition({
            game: this,
            interaction,
            mapId,
            tileId,
        });
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
        const entities = this.entitiesByMap.get(mapId);
        if (!entities?.has(entityId)) {
            throw new Error(`${label} references missing entity "${entityId}" in "${mapId}".`);
        }
    }

    validateEntitySpriteReference(mapId, entityId, spriteId, label) {
        this.validateEntityReference(mapId, entityId, label);

        const entity = this.entitiesByMap.get(mapId).get(entityId);
        if (!entity.tile.sprites || !Object.hasOwn(entity.tile.sprites, spriteId)) {
            throw new Error(
                `${label} references missing sprite "${spriteId}" for entity ` +
                    `"${entityId}" in "${mapId}".`,
            );
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

        if (row >= map.gridSize.height || col >= map.gridSize.width) {
            throw new Error(`${label} references tile position ${col},${row} outside "${mapId}".`);
        }

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
        const layers = this.state.maps[map.id].layers;

        for (const [layerName, layer] of Object.entries(layers)) {
            layer.forEach((row, rowIndex) => {
                row.forEach((tileId, colIndex) => {
                    if (tileId === EMPTY_TILE_ID) return;

                    const tile = map.tiles[tileId];
                    if (!this.isTilePresent(map.id, tile)) return;

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
                              mapId: map.id,
                              tileId,
                              tile,
                              anchor: { col: colIndex, row: rowIndex },
                              interaction: tile.interaction,
                          }
                        : null;

                    for (const occupied of this.getOccupiedCells(colIndex, rowIndex, tile)) {
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

        return {
            walkable,
            collision,
            interactions,
            bounds: {
                width: map.gridSize.width * DEFAULT_TILE_SIZE,
                height: map.gridSize.height * DEFAULT_TILE_SIZE,
            },
        };
    }

    isTilePresent(mapId, tile) {
        if (tile.condition && !this.evaluateCondition(tile.condition)) {
            return false;
        }

        if (tile.interaction && this.isEntityRemoved(mapId, tile.interaction.id)) {
            return false;
        }

        return true;
    }

    getOccupiedCells(col, row, tile) {
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

                if (tile.sprites) {
                    for (const path of Object.values(tile.sprites)) {
                        paths.add(path);
                    }
                }
            }
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

    removeEntity(mapId, entityId) {
        this.state.maps[mapId].entities[entityId].removed = true;
    }

    isEntityRemoved(mapId, entityId) {
        return this.state.maps[mapId].entities[entityId].removed;
    }

    setEntitySprite(mapId, entityId, spriteId) {
        this.state.maps[mapId].entities[entityId].spriteId = spriteId;
    }

    getEntityImagePath(mapId, tile) {
        if (!tile.interaction) return tile.path;

        const entityState = this.state.maps[mapId].entities[tile.interaction.id];
        if (!Object.hasOwn(entityState, "spriteId")) return tile.path;

        return tile.sprites[entityState.spriteId];
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

        this.player.render(this.ctx, this.camera);
    }

    renderLayer(layer) {
        layer.forEach((row, rowIndex) => {
            row.forEach((tileId, colIndex) => {
                if (tileId === EMPTY_TILE_ID) return;

                const tile = this.activeMap.tiles[tileId];
                if (!this.isTilePresent(this.activeMap.id, tile)) return;

                const path = this.getEntityImagePath(this.activeMap.id, tile);
                const image = this.images.get(path);
                if (!image) return;

                const [width, height] = tile.size ?? [DEFAULT_TILE_SIZE, DEFAULT_TILE_SIZE];
                const drawX = colIndex * DEFAULT_TILE_SIZE - this.camera.x;
                const drawY = rowIndex * DEFAULT_TILE_SIZE - this.camera.y;

                this.ctx.drawImage(image, drawX, drawY, width, height);
            });
        });
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

const canvas = document.querySelector("#game");
export const game = new Game(canvas, MAPS);

canvas.addEventListener("game-interaction", (event) => {
    console.log("Interaction signal:", event.detail);
});

game.start().catch((error) => {
    console.error(error);
    document.querySelector("#status").textContent = error.message;
});
