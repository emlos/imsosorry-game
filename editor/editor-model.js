import { SPRITES } from "../sprites.js";
import { EMPTY_TILE_ID, TILE_IDS, TILES } from "../tiles.js";

export const EDITOR_STORAGE_KEY = "yume-map-editor-recovery-v1";
export const EDITOR_BACKUP_KEY = "yume-map-editor-pre-import-backup-v1";
export const PLAYTEST_STORAGE_KEY = "yume-map-editor-playtest-maps-v1";
export const PLAYTEST_RESULT_KEY = "yume-map-editor-playtest-result-v1";

export function cloneData(value) {
    return structuredClone(value);
}

export function createGrid(width, height, fillValue) {
    return Array.from({ length: height }, () => Array(width).fill(fillValue));
}

export function getMapSize(map) {
    const base = map.layers.base;
    return {
        width: base?.[0]?.length ?? 0,
        height: base?.length ?? 0,
    };
}

export function createMap(id, width = 10, height = 8) {
    return {
        id,
        initialEntryId: "start",
        entries: {
            start: {
                col: Math.min(1, width - 1),
                row: Math.min(1, height - 1),
                facing: { dc: 0, dr: 1 },
            },
        },
        exits: [],
        tiles: {},
        entities: [],
        layers: {
            base: createGrid(width, height, TILE_IDS.FLOOR),
            obstacles: createGrid(width, height, EMPTY_TILE_ID),
        },
    };
}

export function ensureLayer(map, layerName) {
    if (map.layers[layerName]) return map.layers[layerName];
    const { width, height } = getMapSize(map);
    const fill = layerName === "base" ? TILE_IDS.FLOOR : EMPTY_TILE_ID;
    map.layers[layerName] = createGrid(width, height, fill);
    return map.layers[layerName];
}

export function resizeMap(map, width, height) {
    if (!Number.isInteger(width) || width < 1 || !Number.isInteger(height) || height < 1) {
        throw new Error("Map width and height must be positive integers.");
    }

    for (const [layerName, layer] of Object.entries(map.layers)) {
        const fill = layerName === "base" ? TILE_IDS.FLOOR : EMPTY_TILE_ID;
        const resized = createGrid(width, height, fill);
        for (let row = 0; row < Math.min(height, layer.length); row += 1) {
            for (let col = 0; col < Math.min(width, layer[row].length); col += 1) {
                resized[row][col] = layer[row][col];
            }
        }
        map.layers[layerName] = resized;
    }

    const clampPosition = (object) => {
        object.col = Math.max(0, Math.min(width - 1, object.col));
        object.row = Math.max(0, Math.min(height - 1, object.row));
    };

    Object.values(map.entries).forEach(clampPosition);
    map.entities.forEach(clampPosition);

    for (const exit of map.exits) {
        const limit = exit.edge === "east" || exit.edge === "west" ? height : width;
        exit.range[0] = Math.min(exit.range[0], limit - 1);
        exit.range[1] = Math.min(Math.max(exit.range[0], exit.range[1]), limit - 1);
    }
}

export function mergeTileDefinitions(map) {
    const merged = { ...TILES };
    for (const [tileId, override] of Object.entries(map.tiles ?? {})) {
        merged[tileId] = {
            ...(merged[tileId] ?? {}),
            ...override,
        };
    }
    return merged;
}

export function getOccupiedTileCells(col, row, tile) {
    return (tile.footprint ?? [[0, 0]]).map(([dc, dr]) => ({
        col: col + dc,
        row: row + dr,
    }));
}

export function canPlaceTile(map, layerName, tileId, col, row) {
    const { width, height } = getMapSize(map);
    if (col < 0 || row < 0 || col >= width || row >= height) return false;
    if (tileId === EMPTY_TILE_ID) return true;

    const tiles = mergeTileDefinitions(map);
    const tile = tiles[tileId];
    if (!tile) return false;
    if (layerName === "base" && tile.size) return false;

    return getOccupiedTileCells(col, row, tile).every(
        (cell) => cell.col >= 0 && cell.row >= 0 && cell.col < width && cell.row < height,
    );
}

export function setTile(map, layerName, col, row, tileId) {
    const layer = ensureLayer(map, layerName);
    if (!canPlaceTile(map, layerName, tileId, col, row)) return false;
    if (layer[row][col] === tileId) return false;
    layer[row][col] = tileId;
    return true;
}

export function floodFill(map, layerName, startCol, startRow, replacementId) {
    const layer = ensureLayer(map, layerName);
    const targetId = layer[startRow]?.[startCol];
    if (targetId === undefined || targetId === replacementId) return false;

    const { width, height } = getMapSize(map);
    const queue = [[startCol, startRow]];
    const visited = new Set();
    let changed = false;

    while (queue.length > 0) {
        const [col, row] = queue.shift();
        const key = `${col},${row}`;
        if (visited.has(key)) continue;
        visited.add(key);

        if (col < 0 || row < 0 || col >= width || row >= height) continue;
        if (layer[row][col] !== targetId) continue;
        if (!canPlaceTile(map, layerName, replacementId, col, row)) continue;

        layer[row][col] = replacementId;
        changed = true;
        queue.push([col + 1, row], [col - 1, row], [col, row + 1], [col, row - 1]);
    }

    return changed;
}

export function fillRectangle(map, layerName, first, second, tileId) {
    const minCol = Math.min(first.col, second.col);
    const maxCol = Math.max(first.col, second.col);
    const minRow = Math.min(first.row, second.row);
    const maxRow = Math.max(first.row, second.row);
    let changed = false;

    for (let row = minRow; row <= maxRow; row += 1) {
        for (let col = minCol; col <= maxCol; col += 1) {
            changed = setTile(map, layerName, col, row, tileId) || changed;
        }
    }
    return changed;
}

export function makeUniqueId(baseId, existingIds) {
    const cleanBase = String(baseId || "item").trim() || "item";
    if (!existingIds.has(cleanBase)) return cleanBase;
    let suffix = 2;
    while (existingIds.has(`${cleanBase}-${suffix}`)) suffix += 1;
    return `${cleanBase}-${suffix}`;
}

function visitObjects(value, visitor) {
    if (Array.isArray(value)) {
        value.forEach((entry) => visitObjects(entry, visitor));
        return;
    }
    if (!value || typeof value !== "object") return;
    visitor(value);
    Object.values(value).forEach((entry) => visitObjects(entry, visitor));
}

export function renameMap(documentMaps, map, newId) {
    const oldId = map.id;
    map.id = newId;
    visitObjects(documentMaps, (object) => {
        if (object.targetMapId === oldId) object.targetMapId = newId;
        if (object.mapId === oldId) object.mapId = newId;
    });
}

export function renameEntry(documentMaps, map, oldId, newId) {
    map.entries[newId] = map.entries[oldId];
    delete map.entries[oldId];
    if (map.initialEntryId === oldId) map.initialEntryId = newId;

    visitObjects(documentMaps, (object) => {
        const targetsMap = object.targetMapId === map.id || object.mapId === map.id;
        if (targetsMap && object.entryId === oldId) object.entryId = newId;
    });
}

export function renameEntity(documentMaps, map, entity, newId) {
    const oldId = entity.id;
    entity.id = newId;

    visitObjects(map, (object) => {
        if (object.entityId === oldId && (!object.mapId || object.mapId === map.id)) {
            object.entityId = newId;
        }
    });

    for (const otherMap of documentMaps) {
        if (otherMap === map) continue;
        visitObjects(otherMap, (object) => {
            if (object.mapId === map.id && object.entityId === oldId) {
                object.entityId = newId;
            }
        });
    }
}

export function parseImportedMaps(text) {
    let source = text.trim();
    const assignment = source.match(/^(?:\/\/[^\n]*\n\s*)*export\s+const\s+MAPS\s*=\s*/);
    if (assignment) source = source.slice(assignment[0].length);
    source = source.replace(/;\s*$/, "");
    const parsed = JSON.parse(source);
    if (!Array.isArray(parsed)) throw new Error("Imported map data must be an array.");
    return parsed;
}

export function serializeGeneratedMaps(maps) {
    return `// Generated map data. Edit through editor/editor.html.\nexport const MAPS = ${JSON.stringify(maps, null, 4)};\n`;
}

function isRectangularLayer(layer, width, height) {
    return (
        Array.isArray(layer) &&
        layer.length === height &&
        layer.every((row) => Array.isArray(row) && row.length === width)
    );
}

function isInsideMap(map, col, row) {
    const { width, height } = getMapSize(map);
    return (
        Number.isInteger(col) &&
        Number.isInteger(row) &&
        col >= 0 &&
        row >= 0 &&
        col < width &&
        row < height
    );
}

export function validateEditorDocument(maps) {
    const errors = [];
    if (!Array.isArray(maps) || maps.length === 0) {
        return ["The document must contain at least one map."];
    }

    const allowedLayers = new Set(["base", "obstacles", "foreground"]);
    const cardinalFacing = (facing) =>
        facing &&
        Number.isInteger(facing.dc) &&
        Number.isInteger(facing.dr) &&
        Math.abs(facing.dc) + Math.abs(facing.dr) === 1;
    const layerCreatesCollision = (layerName, tile) => {
        if (layerName === "base") return false;
        if (layerName === "obstacles") return tile.collision !== false;
        return tile.collision === true;
    };

    const mapIds = new Set();
    const mapById = new Map();

    for (const [mapIndex, map] of maps.entries()) {
        if (!map || typeof map !== "object" || Array.isArray(map)) {
            errors.push("Every map must be an object.");
            continue;
        }

        if (typeof map.id !== "string" || map.id.length === 0) {
            errors.push("Every map needs a nonempty string ID.");
        } else if (mapIds.has(map.id)) {
            errors.push(`Duplicate map ID "${map.id}".`);
        } else {
            mapIds.add(map.id);
            mapById.set(map.id, map);
        }

        if (!map.entries || typeof map.entries !== "object" || Array.isArray(map.entries)) {
            errors.push(`Map "${map.id ?? "?"}" entries must be an object.`);
        }
        if (!Array.isArray(map.entities)) {
            errors.push(`Map "${map.id ?? "?"}" entities must be an array.`);
        }
        if (!Array.isArray(map.exits)) {
            errors.push(`Map "${map.id ?? "?"}" exits must be an array.`);
        }
        if (!map.tiles || typeof map.tiles !== "object" || Array.isArray(map.tiles)) {
            errors.push(`Map "${map.id ?? "?"}" tiles must be an object.`);
        }
        if (!map.layers || typeof map.layers !== "object" || Array.isArray(map.layers)) {
            errors.push(`Map "${map.id ?? "?"}" layers must be an object.`);
            continue;
        }

        const base = map.layers.base;
        if (
            !Array.isArray(base) ||
            base.length === 0 ||
            !Array.isArray(base[0]) ||
            base[0].length === 0
        ) {
            errors.push(`Map "${map.id ?? "?"}" needs a nonempty base layer.`);
            continue;
        }

        const width = base[0].length;
        const height = base.length;
        const tiles = mergeTileDefinitions(map);
        for (const [layerName, layer] of Object.entries(map.layers)) {
            if (!allowedLayers.has(layerName)) {
                errors.push(`Map "${map.id}" contains unsupported layer "${layerName}".`);
            }
            if (!isRectangularLayer(layer, width, height)) {
                errors.push(
                    `Layer "${layerName}" in "${map.id}" must be a ${width}×${height} rectangle.`,
                );
                continue;
            }

            layer.forEach((row, rowIndex) => {
                row.forEach((tileId, colIndex) => {
                    if (!Number.isInteger(tileId)) {
                        errors.push(
                            `Tile at ${colIndex},${rowIndex} in ${map.id}/${layerName} is not an integer.`,
                        );
                        return;
                    }
                    if (tileId === EMPTY_TILE_ID) return;
                    const tile = tiles[tileId];
                    if (!tile) {
                        errors.push(
                            `Unknown tile ID ${tileId} at ${colIndex},${rowIndex} in ${map.id}/${layerName}.`,
                        );
                        return;
                    }
                    if (!canPlaceTile(map, layerName, tileId, colIndex, rowIndex)) {
                        errors.push(
                            `Tile ${tileId} at ${colIndex},${rowIndex} in ${map.id}/${layerName} has an invalid footprint or layer.`,
                        );
                    }
                    if (
                        tile.interaction?.triggers?.includes("touch") &&
                        layerCreatesCollision(layerName, tile)
                    ) {
                        errors.push(
                            `Tile ${tileId} at ${colIndex},${rowIndex} in ${map.id}/${layerName} combines touch interaction with collision.`,
                        );
                    }
                });
            });
        }

        const entries = map.entries ?? {};
        for (const [entryId, entry] of Object.entries(entries)) {
            if (!entryId) errors.push(`Map "${map.id}" contains an empty entry ID.`);
            if (!isInsideMap(map, entry?.col, entry?.row)) {
                errors.push(`Entry "${entryId}" in "${map.id}" is outside the map.`);
            }
            if (!cardinalFacing(entry?.facing)) {
                errors.push(`Entry "${entryId}" in "${map.id}" needs a cardinal facing direction.`);
            }
        }
        if (
            mapIndex === 0 &&
            (!map.initialEntryId || !Object.hasOwn(entries, map.initialEntryId))
        ) {
            errors.push(`Initial map "${map.id}" has an invalid initialEntryId.`);
        } else if (map.initialEntryId && !Object.hasOwn(entries, map.initialEntryId)) {
            errors.push(`Map "${map.id}" has an invalid initialEntryId.`);
        }

        const entityIds = new Set();
        for (const entity of map.entities ?? []) {
            if (!entity || typeof entity !== "object" || Array.isArray(entity)) {
                errors.push(`Map "${map.id}" contains a non-object entity.`);
                continue;
            }
            if (typeof entity.id !== "string" || entity.id.length === 0) {
                errors.push(`Map "${map.id}" contains an entity with an invalid ID.`);
            } else if (entityIds.has(entity.id)) {
                errors.push(`Duplicate entity ID "${entity.id}" in "${map.id}".`);
            }
            entityIds.add(entity.id);
            if (!isInsideMap(map, entity.col, entity.row)) {
                errors.push(`Entity "${entity.id}" in "${map.id}" is outside the map.`);
            }
            if (!Object.hasOwn(SPRITES, entity.spriteId)) {
                errors.push(
                    `Entity "${entity.id}" in "${map.id}" uses unknown sprite "${entity.spriteId}".`,
                );
            }
            if (typeof entity.active !== "boolean") {
                errors.push(`Entity "${entity.id}" in "${map.id}" needs a boolean active value.`);
            }
            if (typeof entity.collision !== "boolean") {
                errors.push(
                    `Entity "${entity.id}" in "${map.id}" needs a boolean collision value.`,
                );
            }
            if (!Object.hasOwn(entity, "interaction")) {
                errors.push(
                    `Entity "${entity.id}" in "${map.id}" must explicitly contain interaction or null.`,
                );
            }
            if (entity.collision && entity.interaction?.triggers?.includes("touch")) {
                errors.push(
                    `Entity "${entity.id}" in "${map.id}" combines touch interaction with collision.`,
                );
            }
        }

        for (const [index, exit] of (map.exits ?? []).entries()) {
            if (!exit || typeof exit !== "object" || Array.isArray(exit)) {
                errors.push(`Exit ${index} in "${map.id}" must be an object.`);
                continue;
            }
            if (!["north", "south", "east", "west"].includes(exit.edge)) {
                errors.push(`Exit ${index} in "${map.id}" has an invalid edge.`);
            }
            const axisLimit = exit.edge === "east" || exit.edge === "west" ? height : width;
            if (
                !Array.isArray(exit.range) ||
                exit.range.length !== 2 ||
                !exit.range.every(Number.isInteger) ||
                exit.range[0] < 0 ||
                exit.range[1] < exit.range[0] ||
                exit.range[1] >= axisLimit
            ) {
                errors.push(`Exit ${index} in "${map.id}" has an invalid range.`);
            }
            if (typeof exit.targetMapId !== "string" || exit.targetMapId.length === 0) {
                errors.push(`Exit ${index} in "${map.id}" needs a target map ID.`);
            }
        }
    }

    for (const map of maps) {
        for (const [index, exit] of (map.exits ?? []).entries()) {
            const target = mapById.get(exit.targetMapId);
            if (!target) {
                errors.push(
                    `Exit ${index} in "${map.id}" targets missing map "${exit.targetMapId}".`,
                );
                continue;
            }
            if (exit.entryId && !Object.hasOwn(target.entries ?? {}, exit.entryId)) {
                errors.push(
                    `Exit ${index} in "${map.id}" targets missing entry "${exit.entryId}" in "${target.id}".`,
                );
            }
        }
    }

    return [...new Set(errors)];
}
