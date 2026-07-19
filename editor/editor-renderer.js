import { drawImageVisual, resolveAnimationId, resolveVisualFrame } from "../animation.js";
import { SPRITES } from "../sprites.js";
import { EMPTY_TILE_ID, TILE_SIZE } from "../tiles.js";
import {
    getEntityOccupiedCells,
    getEntityVisualDefinition,
    getMapSize,
    getOccupiedTileCells,
    mergeTileDefinitions,
} from "./editor-model.js";

function assetUrl(path) {
    const normalized = path.startsWith("./") ? path.slice(2) : path;
    return new URL(`../${normalized}`, import.meta.url).href;
}

function layerCreatesCollision(layerName, tile) {
    if (layerName === "base") return false;
    if (layerName === "obstacles") return tile.collision !== false;
    return tile.collision === true;
}

export class EditorRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");
        this.ctx.imageSmoothingEnabled = false;
        this.images = new Map();
        this.animationTimeMs = 0;
        this.lastTime = performance.now();
    }

    async loadDefinitions(map) {
        const paths = new Set();
        for (const tile of Object.values(mergeTileDefinitions(map))) paths.add(tile.path);
        for (const sprite of Object.values(SPRITES)) paths.add(sprite.path);
        await Promise.all([...paths].map((path) => this.loadImage(path)));
    }

    loadImage(path) {
        if (this.images.has(path)) return this.images.get(path).promise;
        const image = new Image();
        const record = { image, promise: null, status: "loading" };
        const promise = new Promise((resolve, reject) => {
            image.addEventListener(
                "load",
                () => {
                    record.status = "ready";
                    resolve(image);
                },
                { once: true },
            );
            image.addEventListener(
                "error",
                () => {
                    record.status = "missing";
                    reject(new Error(`Could not load editor image "${path}".`));
                },
                { once: true },
            );
        });
        record.promise = promise;
        this.images.set(path, record);
        image.src = assetUrl(path);
        return promise;
    }

    getVisualImageStatus(visual) {
        if (!visual?.path) return "missing";
        return this.images.get(visual.path)?.status ?? "missing";
    }

    advance(time) {
        const delta = Math.min(time - this.lastTime, 50);
        this.lastTime = time;
        this.animationTimeMs += Math.max(0, delta);
    }

    resizeForMap(map) {
        const { width, height } = getMapSize(map);
        const nextWidth = width * TILE_SIZE;
        const nextHeight = height * TILE_SIZE;
        if (this.canvas.width !== nextWidth) this.canvas.width = nextWidth;
        if (this.canvas.height !== nextHeight) this.canvas.height = nextHeight;
        this.ctx.imageSmoothingEnabled = false;
    }

    render(map, options = {}) {
        this.currentMap = map;
        this.resizeForMap(map);
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        const tiles = mergeTileDefinitions(map);
        const visibleLayers = options.visibleLayers ?? new Set(Object.keys(map.layers));

        if (visibleLayers.has("base")) {
            this.renderLayer(map.layers.base, tiles);
        }

        const drawables = [];
        let sequence = 0;
        if (visibleLayers.has("obstacles")) {
            this.collectTileDrawables(map.layers.obstacles, tiles, drawables, () => sequence++);
        }

        for (const entity of map.entities) {
            const occupiedCells = getEntityOccupiedCells(map, entity);
            drawables.push({
                kind: "entity",
                entity,
                depthY: (Math.max(...occupiedCells.map((cell) => cell.row)) + 1) * TILE_SIZE,
                sequence: sequence++,
            });
        }

        drawables.sort((a, b) => a.depthY - b.depthY || a.sequence - b.sequence);
        for (const drawable of drawables) {
            if (drawable.kind === "tile") {
                this.renderTile(drawable.tile, drawable.col, drawable.row);
            } else {
                this.renderEntity(drawable.entity);
            }
        }

        if (visibleLayers.has("foreground") && map.layers.foreground) {
            this.renderLayer(map.layers.foreground, tiles);
        }

        if (options.showCollision) this.renderCollisionOverlay(map, tiles, visibleLayers);
        if (options.showFootprints) this.renderFootprintOverlay(map, tiles, options.activeLayer);
        if (options.showTriggers) this.renderTriggers(map, options.selectedTriggerId);
        if (options.showEntries !== false) this.renderEntries(map, options.selectedEntryId);
        if (options.showExits !== false) this.renderExits(map, options.selectedExitIndex);
        if (options.selectedEntityId) this.renderEntitySelection(map, options.selectedEntityId);
        if (options.rectanglePreview) this.renderRectanglePreview(options.rectanglePreview);
        if (options.triggerPreview) this.renderTriggerPreview(options.triggerPreview);
        if (options.showGrid !== false) this.renderGrid(map);
    }

    renderLayer(layer, tiles) {
        if (!layer) return;
        layer.forEach((row, rowIndex) => {
            row.forEach((tileId, colIndex) => {
                if (tileId === EMPTY_TILE_ID) return;
                const tile = tiles[tileId];
                if (tile) this.renderTile(tile, colIndex, rowIndex);
            });
        });
    }

    collectTileDrawables(layer, tiles, drawables, nextSequence) {
        if (!layer) return;
        layer.forEach((row, rowIndex) => {
            row.forEach((tileId, colIndex) => {
                if (tileId === EMPTY_TILE_ID) return;
                const tile = tiles[tileId];
                if (!tile) return;
                const cells = getOccupiedTileCells(colIndex, rowIndex, tile);
                const bottomRow = Math.max(...cells.map((cell) => cell.row));
                drawables.push({
                    kind: "tile",
                    tile,
                    col: colIndex,
                    row: rowIndex,
                    depthY: (bottomRow + 1) * TILE_SIZE,
                    sequence: nextSequence(),
                });
            });
        });
    }

    renderTile(tile, col, row) {
        const record = this.images.get(tile.path);
        if (!record?.image.complete) return;
        const cells = getOccupiedTileCells(col, row, tile);
        const bottomRow = Math.max(...cells.map((cell) => cell.row));
        const [width, height] = tile.size ?? [TILE_SIZE, TILE_SIZE];
        const drawX = col * TILE_SIZE;
        const drawY = (bottomRow + 1) * TILE_SIZE - height;
        const animationId = resolveAnimationId(tile, [tile.defaultAnimation]);
        const frame = resolveVisualFrame(tile, animationId, this.animationTimeMs);
        drawImageVisual(
            this.ctx,
            record.image,
            { ...tile, size: [width, height] },
            frame,
            drawX,
            drawY,
        );
    }

    renderEntity(entity) {
        const visual = getEntityVisualDefinition(this.currentMap, entity.visual);
        if (!visual) return;
        const record = this.images.get(visual.path);
        if (!record?.image.complete) return;
        const [width, height] = visual.size ?? [TILE_SIZE, TILE_SIZE];
        let drawX;
        let drawY;

        if (entity.visual.type === "tile") {
            const occupiedCells = getEntityOccupiedCells(this.currentMap, entity);
            const bottomRow = Math.max(...occupiedCells.map((cell) => cell.row));
            drawX = entity.col * TILE_SIZE;
            drawY = (bottomRow + 1) * TILE_SIZE - height;
        } else {
            drawX = entity.col * TILE_SIZE + (TILE_SIZE - width) / 2;
            drawY = entity.row * TILE_SIZE + TILE_SIZE - height;
        }

        const animationId = resolveAnimationId(visual, [visual.defaultAnimation]);
        const frame = resolveVisualFrame(visual, animationId, this.animationTimeMs);
        this.ctx.save();
        if (entity.active === false) this.ctx.globalAlpha = 0.45;
        drawImageVisual(
            this.ctx,
            record.image,
            { ...visual, size: [width, height], transform: entity.transform },
            frame,
            drawX,
            drawY,
        );
        this.ctx.restore();
    }

    renderGrid(map) {
        const { width, height } = getMapSize(map);
        const ctx = this.ctx;
        ctx.save();
        ctx.strokeStyle = "rgba(255,255,255,0.22)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let col = 0; col <= width; col += 1) {
            const x = col * TILE_SIZE + 0.5;
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height * TILE_SIZE);
        }
        for (let row = 0; row <= height; row += 1) {
            const y = row * TILE_SIZE + 0.5;
            ctx.moveTo(0, y);
            ctx.lineTo(width * TILE_SIZE, y);
        }
        ctx.stroke();
        ctx.restore();
    }

    renderCollisionOverlay(map, tiles, visibleLayers) {
        const ctx = this.ctx;
        ctx.save();
        ctx.fillStyle = "rgba(255, 64, 64, 0.28)";
        for (const [layerName, layer] of Object.entries(map.layers)) {
            if (!visibleLayers.has(layerName)) continue;
            layer.forEach((row, rowIndex) => {
                row.forEach((tileId, colIndex) => {
                    if (tileId === EMPTY_TILE_ID) return;
                    const tile = tiles[tileId];
                    if (!tile || !layerCreatesCollision(layerName, tile)) return;
                    for (const cell of getOccupiedTileCells(colIndex, rowIndex, tile)) {
                        ctx.fillRect(
                            cell.col * TILE_SIZE,
                            cell.row * TILE_SIZE,
                            TILE_SIZE,
                            TILE_SIZE,
                        );
                    }
                });
            });
        }
        for (const entity of map.entities) {
            if (entity.active === false || !entity.collision) continue;
            for (const cell of getEntityOccupiedCells(map, entity)) {
                ctx.fillRect(cell.col * TILE_SIZE, cell.row * TILE_SIZE, TILE_SIZE, TILE_SIZE);
            }
        }
        ctx.restore();
    }

    renderFootprintOverlay(map, tiles, activeLayer) {
        const layer = map.layers[activeLayer];
        if (!layer) return;
        const ctx = this.ctx;
        ctx.save();
        ctx.strokeStyle = "rgba(255, 220, 80, 0.9)";
        ctx.lineWidth = 2;
        layer.forEach((row, rowIndex) => {
            row.forEach((tileId, colIndex) => {
                if (tileId === EMPTY_TILE_ID) return;
                const tile = tiles[tileId];
                if (!tile) return;
                const footprint = tile.footprint ?? [[0, 0]];
                if (footprint.length === 1 && footprint[0][0] === 0 && footprint[0][1] === 0)
                    return;
                for (const cell of getOccupiedTileCells(colIndex, rowIndex, tile)) {
                    ctx.strokeRect(
                        cell.col * TILE_SIZE + 2,
                        cell.row * TILE_SIZE + 2,
                        TILE_SIZE - 4,
                        TILE_SIZE - 4,
                    );
                }
            });
        });
        for (const entity of map.entities) {
            if (entity.visual?.type !== "tile") continue;
            const cells = getEntityOccupiedCells(map, entity);
            if (cells.length === 1) continue;
            for (const cell of cells) {
                ctx.strokeRect(
                    cell.col * TILE_SIZE + 2,
                    cell.row * TILE_SIZE + 2,
                    TILE_SIZE - 4,
                    TILE_SIZE - 4,
                );
            }
        }
        ctx.restore();
    }

    renderEntries(map, selectedEntryId) {
        const ctx = this.ctx;
        ctx.save();
        ctx.font = "bold 13px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        for (const [entryId, entry] of Object.entries(map.entries)) {
            const centerX = entry.col * TILE_SIZE + TILE_SIZE / 2;
            const centerY = entry.row * TILE_SIZE + TILE_SIZE / 2;
            ctx.fillStyle =
                entryId === selectedEntryId ? "rgba(0, 230, 255, 0.9)" : "rgba(0, 180, 220, 0.75)";
            ctx.beginPath();
            ctx.arc(centerX, centerY, 10, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = "#081419";
            const arrow =
                entry.facing.dr < 0
                    ? "↑"
                    : entry.facing.dr > 0
                      ? "↓"
                      : entry.facing.dc < 0
                        ? "←"
                        : "→";
            ctx.fillText(arrow, centerX, centerY + 0.5);
        }
        ctx.restore();
    }

    renderExits(map, selectedExitIndex) {
        const ctx = this.ctx;
        const { width, height } = getMapSize(map);
        ctx.save();
        ctx.lineWidth = 5;
        map.exits.forEach((exit, index) => {
            ctx.strokeStyle =
                index === selectedExitIndex
                    ? "rgba(255, 235, 80, 0.95)"
                    : "rgba(255, 150, 40, 0.8)";
            const start = exit.range[0] * TILE_SIZE;
            const end = (exit.range[1] + 1) * TILE_SIZE;
            ctx.beginPath();
            if (exit.edge === "north") {
                ctx.moveTo(start, 2.5);
                ctx.lineTo(end, 2.5);
            } else if (exit.edge === "south") {
                ctx.moveTo(start, height * TILE_SIZE - 2.5);
                ctx.lineTo(end, height * TILE_SIZE - 2.5);
            } else if (exit.edge === "west") {
                ctx.moveTo(2.5, start);
                ctx.lineTo(2.5, end);
            } else {
                ctx.moveTo(width * TILE_SIZE - 2.5, start);
                ctx.lineTo(width * TILE_SIZE - 2.5, end);
            }
            ctx.stroke();
        });
        ctx.restore();
    }

    renderTriggers(map, selectedTriggerId) {
        const ctx = this.ctx;
        ctx.save();
        ctx.font = "bold 11px sans-serif";
        ctx.textAlign = "left";
        ctx.textBaseline = "top";

        for (const [index, trigger] of (map.triggers ?? []).entries()) {
            const selected = trigger.id === selectedTriggerId;
            const x = trigger.region.col * TILE_SIZE;
            const y = trigger.region.row * TILE_SIZE;
            const width = trigger.region.width * TILE_SIZE;
            const height = trigger.region.height * TILE_SIZE;

            ctx.fillStyle = selected ? "rgba(180, 100, 255, 0.30)" : "rgba(130, 80, 220, 0.20)";
            ctx.strokeStyle = selected ? "rgba(225, 185, 255, 0.98)" : "rgba(180, 125, 245, 0.82)";
            ctx.lineWidth = selected ? 3 : 2;
            ctx.fillRect(x, y, width, height);
            ctx.strokeRect(x + 1, y + 1, width - 2, height - 2);

            const label = `${index + 1}. ${trigger.id}`;
            const labelWidth = Math.min(width - 4, ctx.measureText(label).width + 8);
            if (labelWidth > 4 && height >= 16) {
                ctx.fillStyle = "rgba(24, 12, 38, 0.82)";
                ctx.fillRect(x + 2, y + 2, labelWidth, 15);
                ctx.fillStyle = "#f3eaff";
                ctx.fillText(label, x + 5, y + 4, Math.max(0, width - 10));
            }

            if (selected) this.renderTriggerHandles(trigger);
        }

        ctx.restore();
    }

    renderTriggerHandles(trigger) {
        const x = trigger.region.col * TILE_SIZE;
        const y = trigger.region.row * TILE_SIZE;
        const width = trigger.region.width * TILE_SIZE;
        const height = trigger.region.height * TILE_SIZE;
        const points = [
            [x, y],
            [x + width / 2, y],
            [x + width, y],
            [x, y + height / 2],
            [x + width, y + height / 2],
            [x, y + height],
            [x + width / 2, y + height],
            [x + width, y + height],
        ];

        this.ctx.fillStyle = "#f3eaff";
        this.ctx.strokeStyle = "#4d236d";
        this.ctx.lineWidth = 1;
        for (const [centerX, centerY] of points) {
            this.ctx.fillRect(centerX - 4, centerY - 4, 8, 8);
            this.ctx.strokeRect(centerX - 4.5, centerY - 4.5, 9, 9);
        }
    }

    renderEntitySelection(map, entityId) {
        const entity = map.entities.find((candidate) => candidate.id === entityId);
        if (!entity) return;
        this.ctx.save();
        this.ctx.strokeStyle = "rgba(0, 255, 180, 0.95)";
        this.ctx.lineWidth = 2;
        for (const cell of getEntityOccupiedCells(map, entity)) {
            this.ctx.strokeRect(
                cell.col * TILE_SIZE + 1,
                cell.row * TILE_SIZE + 1,
                TILE_SIZE - 2,
                TILE_SIZE - 2,
            );
        }
        this.ctx.restore();
    }

    renderRectanglePreview(preview) {
        const minCol = Math.min(preview.start.col, preview.end.col);
        const maxCol = Math.max(preview.start.col, preview.end.col);
        const minRow = Math.min(preview.start.row, preview.end.row);
        const maxRow = Math.max(preview.start.row, preview.end.row);
        this.ctx.save();
        this.ctx.fillStyle = "rgba(90, 180, 255, 0.25)";
        this.ctx.strokeStyle = "rgba(90, 180, 255, 0.95)";
        this.ctx.lineWidth = 2;
        const x = minCol * TILE_SIZE;
        const y = minRow * TILE_SIZE;
        const width = (maxCol - minCol + 1) * TILE_SIZE;
        const height = (maxRow - minRow + 1) * TILE_SIZE;
        this.ctx.fillRect(x, y, width, height);
        this.ctx.strokeRect(x + 1, y + 1, width - 2, height - 2);
        this.ctx.restore();
    }

    renderTriggerPreview(preview) {
        const minCol = Math.min(preview.start.col, preview.end.col);
        const maxCol = Math.max(preview.start.col, preview.end.col);
        const minRow = Math.min(preview.start.row, preview.end.row);
        const maxRow = Math.max(preview.start.row, preview.end.row);
        const x = minCol * TILE_SIZE;
        const y = minRow * TILE_SIZE;
        const width = (maxCol - minCol + 1) * TILE_SIZE;
        const height = (maxRow - minRow + 1) * TILE_SIZE;

        this.ctx.save();
        this.ctx.fillStyle = "rgba(180, 100, 255, 0.28)";
        this.ctx.strokeStyle = "rgba(225, 185, 255, 0.98)";
        this.ctx.lineWidth = 2;
        this.ctx.fillRect(x, y, width, height);
        this.ctx.strokeRect(x + 1, y + 1, width - 2, height - 2);
        this.ctx.restore();
    }

    renderVisualPreview(ctx, visual, elapsedMs, size = 48) {
        const record = this.images.get(visual.path);
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        if (!record?.image.complete) return;
        ctx.imageSmoothingEnabled = false;
        const animationId = resolveAnimationId(visual, [visual.defaultAnimation]);
        const frame = resolveVisualFrame(visual, animationId, elapsedMs);
        const [worldWidth, worldHeight] = visual.size ?? [TILE_SIZE, TILE_SIZE];
        const scale = Math.min(size / worldWidth, size / worldHeight);
        const width = Math.max(1, Math.round(worldWidth * scale));
        const height = Math.max(1, Math.round(worldHeight * scale));
        const x = Math.round((ctx.canvas.width - width) / 2);
        const y = Math.round((ctx.canvas.height - height) / 2);
        drawImageVisual(ctx, record.image, { ...visual, size: [width, height] }, frame, x, y);
    }
}
