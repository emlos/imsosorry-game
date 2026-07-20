import {
  OPPOSITE_EDGE,
  getEdgePosition,
  getRangeLength,
} from "../map-edges.js";
import { ITEMS } from "../data/items.js";
import { SPRITES } from "../data/sprites.js";
import { EMPTY_TILE_ID, TILE_IDS, TILES } from "../data/tiles.js";

export const EDITOR_STORAGE_KEY = "yume-map-editor-recovery-v7";
export const EDITOR_BACKUP_KEY = "yume-map-editor-pre-import-backup-v7";
export const PLAYTEST_STORAGE_KEY = "yume-map-editor-playtest-maps-v7";
export const PLAYTEST_RESULT_KEY = "yume-map-editor-playtest-result-v7";

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

export { OPPOSITE_EDGE };

export function getEdgeAxisLength(map, edge) {
  if (!Object.hasOwn(OPPOSITE_EDGE, edge)) {
    throw new Error(`Unknown map edge "${String(edge)}".`);
  }

  const { width, height } = getMapSize(map);
  return edge === "east" || edge === "west" ? height : width;
}

export function rangesOverlap(first, second) {
  return first[0] <= second[1] && second[0] <= first[1];
}

export function rangesEqual(first, second) {
  return (
    Array.isArray(first) &&
    Array.isArray(second) &&
    first.length === 2 &&
    second.length === 2 &&
    first[0] === second[0] &&
    first[1] === second[1]
  );
}

function isDirectEdgeExit(exit) {
  return (
    exit &&
    typeof exit === "object" &&
    exit.destination?.type !== "random" &&
    typeof exit.targetMapId === "string" &&
    Object.hasOwn(OPPOSITE_EDGE, exit.edge) &&
    Object.hasOwn(OPPOSITE_EDGE, exit.targetEdge) &&
    Array.isArray(exit.range) &&
    Array.isArray(exit.targetRange)
  );
}

export function findReciprocalEdgeExit(maps, sourceMap, sourceExit) {
  if (!Array.isArray(maps) || !sourceMap || !isDirectEdgeExit(sourceExit))
    return null;

  const targetMap = maps.find((map) => map.id === sourceExit.targetMapId);
  if (!targetMap) return null;

  const candidates = (targetMap.exits ?? [])
    .map((exit, index) => ({ exit, index }))
    .filter(
      ({ exit }) =>
        isDirectEdgeExit(exit) &&
        exit.edge === sourceExit.targetEdge &&
        exit.targetMapId === sourceMap.id &&
        exit.targetEdge === sourceExit.edge,
    );

  const exactMatches = candidates.filter(
    ({ exit }) =>
      rangesEqual(exit.range, sourceExit.targetRange) &&
      rangesEqual(exit.targetRange, sourceExit.range),
  );
  if (exactMatches.length === 1) {
    return { map: targetMap, ...exactMatches[0] };
  }

  const partialMatches = candidates.filter(
    ({ exit }) =>
      rangesEqual(exit.range, sourceExit.targetRange) ||
      rangesEqual(exit.targetRange, sourceExit.range),
  );
  if (partialMatches.length === 1) {
    return { map: targetMap, ...partialMatches[0] };
  }

  if (candidates.length === 1) {
    return { map: targetMap, ...candidates[0] };
  }

  return null;
}

export function updateReciprocalEdgeExitGeometry(
  reciprocalExit,
  sourceMapId,
  sourceExit,
) {
  if (!isDirectEdgeExit(sourceExit)) {
    throw new Error(
      "A reciprocal exit can only mirror a direct edge-to-edge exit.",
    );
  }

  const updated = cloneData(reciprocalExit);
  updated.edge = sourceExit.targetEdge;
  updated.range = [...sourceExit.targetRange];
  updated.targetMapId = sourceMapId;
  updated.targetEdge = sourceExit.edge;
  updated.targetRange = [...sourceExit.range];
  return updated;
}

function validateConnectionRange(range) {
  if (
    !Array.isArray(range) ||
    range.length !== 2 ||
    !range.every(Number.isInteger) ||
    range[0] < 0 ||
    range[1] < range[0]
  ) {
    throw new Error(
      "Connection range must contain two ordered non-negative integers.",
    );
  }
}

function assertNoOverlappingExit(map, edge, range) {
  const overlappingIndex = (map.exits ?? []).findIndex(
    (exit) =>
      exit?.edge === edge &&
      Array.isArray(exit.range) &&
      exit.range.length === 2 &&
      rangesOverlap(exit.range, range),
  );

  if (overlappingIndex >= 0) {
    throw new Error(
      `The ${edge} edge of "${map.id}" already has an overlapping exit at index ${overlappingIndex}.`,
    );
  }
}

export function createReciprocalEdgeConnection(
  sourceMap,
  targetMap,
  sourceEdge,
  targetEdge,
  sourceRange,
  targetRange,
) {
  if (
    !sourceMap ||
    !targetMap ||
    sourceMap === targetMap ||
    sourceMap.id === targetMap.id
  ) {
    throw new Error("Source and target maps must be different.");
  }

  if (!Object.hasOwn(OPPOSITE_EDGE, sourceEdge)) {
    throw new Error(`Unknown source edge "${String(sourceEdge)}".`);
  }

  const requiredTargetEdge = OPPOSITE_EDGE[sourceEdge];
  if (targetEdge !== requiredTargetEdge) {
    throw new Error(
      `Target edge must be the opposite edge (${sourceEdge} to ${requiredTargetEdge}).`,
    );
  }

  validateConnectionRange(sourceRange);
  validateConnectionRange(targetRange);
  if (getRangeLength(sourceRange) !== getRangeLength(targetRange)) {
    throw new Error(
      `Source and target connection ranges must contain the same number of cells.`,
    );
  }

  const sourceLimit = getEdgeAxisLength(sourceMap, sourceEdge);
  const targetLimit = getEdgeAxisLength(targetMap, targetEdge);
  if (sourceRange[1] >= sourceLimit) {
    throw new Error(
      `Connection range ${sourceRange[0]}–${sourceRange[1]} exceeds the ${sourceEdge} edge of "${sourceMap.id}".`,
    );
  }
  if (targetRange[1] >= targetLimit) {
    throw new Error(
      `Connection range ${targetRange[0]}–${targetRange[1]} exceeds the ${targetEdge} edge of "${targetMap.id}".`,
    );
  }

  assertNoOverlappingExit(sourceMap, sourceEdge, sourceRange);
  assertNoOverlappingExit(targetMap, targetEdge, targetRange);

  return {
    sourceExit: {
      edge: sourceEdge,
      range: [...sourceRange],
      targetMapId: targetMap.id,
      targetEdge,
      targetRange: [...targetRange],
    },
    targetExit: {
      edge: targetEdge,
      range: [...targetRange],
      targetMapId: sourceMap.id,
      targetEdge: sourceEdge,
      targetRange: [...sourceRange],
    },
  };
}

export function createMap(id, width = 10, height = 8) {
  return {
    id,
    initialEntryId: "start",
    camera: { zoom: 1, follow: "player" },
    entries: {
      start: {
        col: Math.min(1, width - 1),
        row: Math.min(1, height - 1),
        facing: { dc: 0, dr: 1 },
      },
    },
    exits: [],
    triggers: [],
    cameraZones: [],
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
  if (
    !Number.isInteger(width) ||
    width < 1 ||
    !Number.isInteger(height) ||
    height < 1
  ) {
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
  for (const regionOwner of [
    ...(map.triggers ?? []),
    ...(map.cameraZones ?? []),
  ]) {
    regionOwner.region.col = Math.max(
      0,
      Math.min(width - 1, regionOwner.region.col),
    );
    regionOwner.region.row = Math.max(
      0,
      Math.min(height - 1, regionOwner.region.row),
    );
    regionOwner.region.width = Math.max(
      1,
      Math.min(regionOwner.region.width, width - regionOwner.region.col),
    );
    regionOwner.region.height = Math.max(
      1,
      Math.min(regionOwner.region.height, height - regionOwner.region.row),
    );
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

export function getEntityVisualDefinition(map, visual) {
  if (visual?.type === "sprite") return SPRITES[visual.id];
  if (visual?.type === "tile") return mergeTileDefinitions(map)[visual.id];
  return null;
}

export function getEntityOccupiedCells(
  map,
  entity,
  col = entity.col,
  row = entity.row,
) {
  if (entity.visual?.type !== "tile") return [{ col, row }];
  const tile = getEntityVisualDefinition(map, entity.visual);
  return tile ? getOccupiedTileCells(col, row, tile) : [{ col, row }];
}

export function canPlaceEntity(
  map,
  entity,
  col = entity.col,
  row = entity.row,
) {
  const { width, height } = getMapSize(map);
  const visual = getEntityVisualDefinition(map, entity.visual);
  if (!visual) return false;
  return getEntityOccupiedCells(map, entity, col, row).every(
    (cell) =>
      cell.col >= 0 && cell.row >= 0 && cell.col < width && cell.row < height,
  );
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
    (cell) =>
      cell.col >= 0 && cell.row >= 0 && cell.col < width && cell.row < height,
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

const MAP_SCOPED_EFFECT_TYPES = new Set([
  "setEntityActive",
  "setEntityPosition",
  "setEntityVisual",
  "setEntityCollision",
  "setTile",
  "teleport",
]);

const ENTITY_REFERENCE_EFFECT_TYPES = new Set([
  "setEntityActive",
  "setEntityPosition",
  "setEntityVisual",
  "setEntityCollision",
  "cameraFollow",
]);

export function findMapIdReferences(value, mapId, path = "value", output = []) {
  if (Array.isArray(value)) {
    value.forEach((entry, index) => {
      findMapIdReferences(entry, mapId, `${path}[${index}]`, output);
    });
    return output;
  }

  if (!value || typeof value !== "object") return output;

  if (value.mapId === mapId) output.push(`${path}.mapId`);
  if (value.targetMapId === mapId) output.push(`${path}.targetMapId`);

  for (const [key, child] of Object.entries(value)) {
    findMapIdReferences(child, mapId, `${path}.${key}`, output);
  }

  return output;
}

function rewriteMapIdInEffects(effects, oldId, newId, path, changedReferences) {
  for (const [index, effect] of (effects ?? []).entries()) {
    if (!effect || typeof effect !== "object" || Array.isArray(effect))
      continue;

    const effectPath = `${path}[${index}]`;
    if (MAP_SCOPED_EFFECT_TYPES.has(effect.type) && effect.mapId === oldId) {
      effect.mapId = newId;
      changedReferences.push(`${effectPath}.mapId`);
    }

    if (effect.type === "showText") {
      rewriteMapIdInEffects(
        effect.afterClose,
        oldId,
        newId,
        `${effectPath}.afterClose`,
        changedReferences,
      );
    }

    if (effect.type === "random") {
      for (const [choiceIndex, choice] of (effect.choices ?? []).entries()) {
        rewriteMapIdInEffects(
          choice?.effects,
          oldId,
          newId,
          `${effectPath}.choices[${choiceIndex}].effects`,
          changedReferences,
        );
      }
    }
  }
}

function rewriteMapIdInInteraction(
  interaction,
  oldId,
  newId,
  path,
  changedReferences,
) {
  if (
    !interaction ||
    typeof interaction !== "object" ||
    Array.isArray(interaction)
  )
    return;

  if (
    interaction.handler === "teleport" &&
    interaction.params?.mapId === oldId
  ) {
    interaction.params.mapId = newId;
    changedReferences.push(`${path}.params.mapId`);
    return;
  }

  if (interaction.handler === "effects") {
    rewriteMapIdInEffects(
      interaction.effects,
      oldId,
      newId,
      `${path}.effects`,
      changedReferences,
    );
  }
}

export function refactorMapId(documentMaps, map, newId) {
  if (!Array.isArray(documentMaps) || !documentMaps.includes(map)) {
    throw new Error(
      "The map being renamed is not part of the editor document.",
    );
  }
  if (typeof newId !== "string" || newId.length === 0) {
    throw new Error("The new map ID must be a nonempty string.");
  }

  const oldId = map.id;
  const changedReferences = [];

  for (const sourceMap of documentMaps) {
    const mapPath = sourceMap.id;

    for (const [index, exit] of (sourceMap.exits ?? []).entries()) {
      if (exit?.targetMapId === oldId) {
        exit.targetMapId = newId;
        changedReferences.push(`${mapPath}.exits[${index}].targetMapId`);
      }
      for (const [choiceIndex, choice] of (exit?.destination?.type === "random"
        ? (exit.destination.choices ?? [])
        : []
      ).entries()) {
        if (choice?.targetMapId !== oldId) continue;
        choice.targetMapId = newId;
        changedReferences.push(
          `${mapPath}.exits[${index}].destination.choices[${choiceIndex}].targetMapId`,
        );
      }
    }

    for (const [index, entity] of (sourceMap.entities ?? []).entries()) {
      rewriteMapIdInInteraction(
        entity?.interaction,
        oldId,
        newId,
        `${mapPath}.entities[${index}].interaction`,
        changedReferences,
      );
    }

    for (const [index, trigger] of (sourceMap.triggers ?? []).entries()) {
      rewriteMapIdInEffects(
        trigger?.effects,
        oldId,
        newId,
        `${mapPath}.triggers[${index}].effects`,
        changedReferences,
      );
    }

    for (const [tileId, tile] of Object.entries(sourceMap.tiles ?? {})) {
      rewriteMapIdInInteraction(
        tile?.interaction,
        oldId,
        newId,
        `${mapPath}.tiles.${tileId}.interaction`,
        changedReferences,
      );
    }

    for (const [index, event] of (sourceMap.musicEvents ?? []).entries()) {
      rewriteMapIdInEffects(
        event?.effects,
        oldId,
        newId,
        `${mapPath}.musicEvents[${index}].effects`,
        changedReferences,
      );
    }

    rewriteMapIdInEffects(
      sourceMap.onEnter,
      oldId,
      newId,
      `${mapPath}.onEnter`,
      changedReferences,
    );
    rewriteMapIdInEffects(
      sourceMap.onExit,
      oldId,
      newId,
      `${mapPath}.onExit`,
      changedReferences,
    );
  }

  map.id = newId;

  return {
    oldId,
    newId,
    changedReferences,
  };
}

export function createMapIdRefactorCandidate(documentMaps, oldId, newId) {
  const candidateMaps = cloneData(documentMaps);
  const candidateMap = candidateMaps.find((map) => map.id === oldId);

  if (!candidateMap) {
    throw new Error(`Map "${oldId}" does not exist in the editor document.`);
  }

  const report = refactorMapId(candidateMaps, candidateMap, newId);
  const errors = validateEditorDocument(candidateMaps);

  if (errors.length > 0) {
    throw new Error(
      `The rename produced invalid map data: ${errors.join(" ")}`,
    );
  }

  return { candidateMaps, report };
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
    if (
      object.entityId === oldId &&
      (!object.mapId || object.mapId === map.id)
    ) {
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
  const assignment = source.match(
    /^(?:\/\/[^\n]*\n\s*)*export\s+const\s+MAPS\s*=\s*/,
  );
  if (assignment) source = source.slice(assignment[0].length);
  source = source.replace(/;\s*$/, "");
  const parsed = JSON.parse(source);
  if (!Array.isArray(parsed))
    throw new Error("Imported map data must be an array.");
  return parsed;
}

export function serializeGeneratedMaps(maps) {
  return `// Generated map data. Save as data/maps.generated.js; edit through editor/editor.html.\nexport const MAPS = ${JSON.stringify(maps, null, 4)};\n`;
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

function validateEditorEntryReference(mapById, mapId, entryId, label, errors) {
  const targetMap = mapById.get(mapId);
  if (!targetMap) {
    errors.push(`${label} targets missing map "${String(mapId)}".`);
    return;
  }

  if (
    typeof entryId !== "string" ||
    !Object.hasOwn(targetMap.entries ?? {}, entryId)
  ) {
    errors.push(
      `${label} targets missing entry "${String(entryId)}" in "${mapId}".`,
    );
  }
}

function validateEditorEffectsReferences(
  effects,
  sourceMap,
  path,
  mapById,
  errors,
  randomIds = new Set(),
) {
  if (effects === undefined) return;
  if (!Array.isArray(effects)) {
    errors.push(`${path} must be an array.`);
    return;
  }

  for (const [index, effect] of (effects ?? []).entries()) {
    if (!effect || typeof effect !== "object" || Array.isArray(effect))
      continue;

    const effectPath = `${path}[${index}]`;

    if (effect.type === "teleport" && typeof effect.mapId === "string") {
      validateEditorEntryReference(
        mapById,
        effect.mapId,
        effect.entryId,
        effectPath,
        errors,
      );
    }

    if (
      ENTITY_REFERENCE_EFFECT_TYPES.has(effect.type) &&
      typeof effect.entityId === "string"
    ) {
      const targetMapId = effect.mapId ?? sourceMap.id;
      const targetMap = mapById.get(targetMapId);

      if (!targetMap) {
        errors.push(
          `${effectPath} targets missing map "${String(targetMapId)}".`,
        );
      } else if (
        !(targetMap.entities ?? []).some(
          (entity) => entity?.id === effect.entityId,
        )
      ) {
        errors.push(
          `${effectPath} targets missing entity "${effect.entityId}" in "${targetMapId}".`,
        );
      }

      if (effect.type === "setEntityVisual" && targetMap) {
        const visual = effect.visual;
        if (!visual || typeof visual !== "object" || Array.isArray(visual)) {
          errors.push(`${effectPath}.visual must be an object.`);
        } else if (visual.type === "sprite") {
          if (!Object.hasOwn(SPRITES, visual.id)) {
            errors.push(
              `${effectPath}.visual targets missing sprite "${String(visual.id)}".`,
            );
          }
        } else if (visual.type === "tile") {
          if (
            !Number.isInteger(visual.id) ||
            !mergeTileDefinitions(targetMap)[visual.id]
          ) {
            errors.push(
              `${effectPath}.visual targets missing tile "${String(visual.id)}" in "${targetMapId}".`,
            );
          }
        } else {
          errors.push(`${effectPath}.visual.type must be "sprite" or "tile".`);
        }
      }

      if (
        effect.type === "setEntityActive" &&
        effect.persistence === "roomVisit" &&
        targetMapId !== sourceMap.id
      ) {
        errors.push(
          `${effectPath} cannot use roomVisit persistence on another map.`,
        );
      }
    }

    if (effect.type === "showText") {
      validateEditorEffectsReferences(
        effect.afterClose,
        sourceMap,
        `${effectPath}.afterClose`,
        mapById,
        errors,
        randomIds,
      );
    }

    if (effect.type === "random") {
      if (typeof effect.id !== "string" || effect.id.length === 0) {
        errors.push(`${effectPath} needs a nonempty random ID.`);
      } else if (randomIds.has(effect.id)) {
        errors.push(
          `${effectPath} duplicates random ID "${effect.id}" in this owner.`,
        );
      } else {
        randomIds.add(effect.id);
      }
      if (
        !new Set(["save", "once", "roomVisit", "interaction", "use"]).has(
          effect.scope,
        )
      ) {
        errors.push(
          `${effectPath} has unsupported random scope "${String(effect.scope)}".`,
        );
      }
      if (!Array.isArray(effect.choices) || effect.choices.length === 0) {
        errors.push(`${effectPath} needs at least one random choice.`);
      }
      for (const [choiceIndex, choice] of (effect.choices ?? []).entries()) {
        if (!Number.isFinite(choice?.weight) || choice.weight <= 0) {
          errors.push(
            `${effectPath}.choices[${choiceIndex}] needs a positive weight.`,
          );
        }
        if (!Array.isArray(choice?.effects)) {
          errors.push(
            `${effectPath}.choices[${choiceIndex}].effects must be an array.`,
          );
          continue;
        }
        validateEditorEffectsReferences(
          choice?.effects,
          sourceMap,
          `${effectPath}.choices[${choiceIndex}].effects`,
          mapById,
          errors,
          randomIds,
        );
      }
    }
  }
}

function isValidEdgeRange(range) {
  return (
    Array.isArray(range) &&
    range.length === 2 &&
    range.every(Number.isInteger) &&
    range[0] >= 0 &&
    range[1] >= range[0]
  );
}

function validateEditorExitDestinationShape(exit, destination, label, errors) {
  if (
    !destination ||
    typeof destination !== "object" ||
    Array.isArray(destination)
  ) {
    errors.push(`${label} must be an object.`);
    return;
  }

  if (
    typeof destination.targetMapId !== "string" ||
    destination.targetMapId.length === 0
  ) {
    errors.push(`${label} needs a target map ID.`);
  }

  if (
    Object.hasOwn(destination, "preserveAxis") ||
    Object.hasOwn(destination, "offset")
  ) {
    errors.push(
      `${label} uses removed preserveAxis/offset fields; author targetRange instead.`,
    );
  }

  if (Object.hasOwn(destination, "entryId")) {
    if (
      typeof destination.entryId !== "string" ||
      destination.entryId.length === 0
    ) {
      errors.push(`${label} needs a nonempty entryId.`);
    }
    return;
  }

  if (Object.hasOwn(destination, "targetPosition")) return;

  if (!Object.hasOwn(OPPOSITE_EDGE, destination.targetEdge)) {
    errors.push(`${label} has an invalid target edge.`);
  } else if (destination.targetEdge !== OPPOSITE_EDGE[exit.edge]) {
    errors.push(`${label}.targetEdge must be opposite ${exit.edge}.`);
  }

  if (!isValidEdgeRange(destination.targetRange)) {
    errors.push(`${label} has an invalid targetRange.`);
  } else if (
    isValidEdgeRange(exit.range) &&
    getRangeLength(exit.range) !== getRangeLength(destination.targetRange)
  ) {
    errors.push(`${label} connects ranges with different lengths.`);
  }
}

function validateEditorInteractionReferences(
  interaction,
  sourceMap,
  path,
  mapById,
  errors,
) {
  if (
    !interaction ||
    typeof interaction !== "object" ||
    Array.isArray(interaction)
  )
    return;

  if (
    interaction.handler === "teleport" &&
    typeof interaction.params?.mapId === "string"
  ) {
    validateEditorEntryReference(
      mapById,
      interaction.params.mapId,
      interaction.params.entryId,
      `${path}.params`,
      errors,
    );
    return;
  }

  if (interaction.handler === "effects") {
    validateEditorEffectsReferences(
      interaction.effects,
      sourceMap,
      `${path}.effects`,
      mapById,
      errors,
    );
  }
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
  const transitionCellProblem = (map, col, row) => {
    const baseTileId = map.layers?.base?.[row]?.[col];
    if (baseTileId === undefined || baseTileId === EMPTY_TILE_ID)
      return "is not on the walkable base";

    const tiles = mergeTileDefinitions(map);
    for (const [layerName, layer] of Object.entries(map.layers ?? {})) {
      if (!Array.isArray(layer) || layerName === "base") continue;
      for (let anchorRow = 0; anchorRow < layer.length; anchorRow += 1) {
        for (
          let anchorCol = 0;
          anchorCol < (layer[anchorRow]?.length ?? 0);
          anchorCol += 1
        ) {
          const tileId = layer[anchorRow][anchorCol];
          if (tileId === EMPTY_TILE_ID) continue;
          const tile = tiles[tileId];
          if (!tile || !layerCreatesCollision(layerName, tile)) continue;
          if (
            getOccupiedTileCells(anchorCol, anchorRow, tile).some(
              (cell) => cell.col === col && cell.row === row,
            )
          ) {
            return "is blocked by collision";
          }
        }
      }
    }

    if (
      (map.entities ?? []).some(
        (entity) =>
          entity?.active !== false &&
          entity?.collision === true &&
          getEntityOccupiedCells(map, entity).some(
            (cell) => cell.col === col && cell.row === row,
          ),
      )
    ) {
      return "is blocked by collision";
    }
    return null;
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

    if (
      !map.entries ||
      typeof map.entries !== "object" ||
      Array.isArray(map.entries)
    ) {
      errors.push(`Map "${map.id ?? "?"}" entries must be an object.`);
    }
    if (!Array.isArray(map.entities)) {
      errors.push(`Map "${map.id ?? "?"}" entities must be an array.`);
    }
    if (!Array.isArray(map.triggers)) {
      errors.push(`Map "${map.id ?? "?"}" triggers must be an array.`);
    }
    if (!Array.isArray(map.cameraZones)) {
      errors.push(`Map "${map.id ?? "?"}" cameraZones must be an array.`);
    }
    if (!Array.isArray(map.exits)) {
      errors.push(`Map "${map.id ?? "?"}" exits must be an array.`);
    }
    if (
      !map.tiles ||
      typeof map.tiles !== "object" ||
      Array.isArray(map.tiles)
    ) {
      errors.push(`Map "${map.id ?? "?"}" tiles must be an object.`);
    }
    if (
      !map.layers ||
      typeof map.layers !== "object" ||
      Array.isArray(map.layers)
    ) {
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
    if (!base.some((row) => row.some((tileId) => tileId !== EMPTY_TILE_ID))) {
      errors.push(`Map "${map.id}" has no walkable base cells.`);
    }
    const tiles = mergeTileDefinitions(map);
    for (const [layerName, layer] of Object.entries(map.layers)) {
      if (!allowedLayers.has(layerName)) {
        errors.push(
          `Map "${map.id}" contains unsupported layer "${layerName}".`,
        );
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

    if (
      !map.camera ||
      typeof map.camera !== "object" ||
      Array.isArray(map.camera) ||
      Object.keys(map.camera).length !== 2 ||
      !Object.hasOwn(map.camera, "zoom") ||
      !Object.hasOwn(map.camera, "follow") ||
      !Number.isFinite(map.camera.zoom) ||
      map.camera.zoom < 0.25 ||
      map.camera.zoom > 8 ||
      map.camera.follow !== "player"
    ) {
      errors.push(
        `Map "${map.id}" needs camera { zoom: 0.25..8, follow: "player" }.`,
      );
    }

    const entries = map.entries ?? {};
    for (const [entryId, entry] of Object.entries(entries)) {
      if (!entryId) errors.push(`Map "${map.id}" contains an empty entry ID.`);
      if (!isInsideMap(map, entry?.col, entry?.row)) {
        errors.push(`Entry "${entryId}" in "${map.id}" is outside the map.`);
      }
      if (!cardinalFacing(entry?.facing)) {
        errors.push(
          `Entry "${entryId}" in "${map.id}" needs a cardinal facing direction.`,
        );
      }
    }
    if (
      mapIndex === 0 &&
      (!map.initialEntryId || !Object.hasOwn(entries, map.initialEntryId))
    ) {
      errors.push(`Initial map "${map.id}" has an invalid initialEntryId.`);
    } else if (
      map.initialEntryId &&
      !Object.hasOwn(entries, map.initialEntryId)
    ) {
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
      if (
        !entity.visual ||
        typeof entity.visual !== "object" ||
        Array.isArray(entity.visual)
      ) {
        errors.push(
          `Entity "${entity.id}" in "${map.id}" needs a visual object.`,
        );
      } else if (entity.visual.type === "sprite") {
        if (!Object.hasOwn(SPRITES, entity.visual.id)) {
          errors.push(
            `Entity "${entity.id}" in "${map.id}" uses unknown sprite "${String(entity.visual.id)}".`,
          );
        }
      } else if (entity.visual.type === "tile") {
        if (
          !Number.isInteger(entity.visual.id) ||
          !mergeTileDefinitions(map)[entity.visual.id]
        ) {
          errors.push(
            `Entity "${entity.id}" in "${map.id}" uses unknown tile "${String(entity.visual.id)}".`,
          );
        }
      } else {
        errors.push(
          `Entity "${entity.id}" in "${map.id}" visual type must be "sprite" or "tile".`,
        );
      }
      if (
        !entity.transform ||
        typeof entity.transform !== "object" ||
        Array.isArray(entity.transform) ||
        Object.keys(entity.transform).some(
          (key) => key !== "flipX" && key !== "flipY",
        ) ||
        typeof entity.transform.flipX !== "boolean" ||
        typeof entity.transform.flipY !== "boolean"
      ) {
        errors.push(
          `Entity "${entity.id}" in "${map.id}" needs transform with boolean flipX and flipY values.`,
        );
      }
      if (!canPlaceEntity(map, entity)) {
        errors.push(
          `Entity "${entity.id}" in "${map.id}" has an invalid visual or footprint outside the map.`,
        );
      }
      if (typeof entity.active !== "boolean") {
        errors.push(
          `Entity "${entity.id}" in "${map.id}" needs a boolean active value.`,
        );
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

    const triggerIds = new Set();
    const triggerEvents = new Set(["enter", "exit", "step", "itemUse"]);
    const triggerFrequencies = new Set([
      "always",
      "once-per-visit",
      "once-per-save",
    ]);
    for (const [index, trigger] of (map.triggers ?? []).entries()) {
      const label = `Trigger ${index} in "${map.id}"`;
      if (!trigger || typeof trigger !== "object" || Array.isArray(trigger)) {
        errors.push(`${label} must be an object.`);
        continue;
      }
      if (typeof trigger.id !== "string" || trigger.id.length === 0) {
        errors.push(`${label} needs a nonempty ID.`);
      } else if (triggerIds.has(trigger.id)) {
        errors.push(`${label} duplicates ID "${trigger.id}".`);
      } else {
        triggerIds.add(trigger.id);
      }

      const region = trigger.region;
      if (
        !region ||
        typeof region !== "object" ||
        Array.isArray(region) ||
        !Number.isInteger(region.col) ||
        !Number.isInteger(region.row) ||
        !Number.isInteger(region.width) ||
        !Number.isInteger(region.height) ||
        region.col < 0 ||
        region.row < 0 ||
        region.width < 1 ||
        region.height < 1 ||
        region.col + region.width > width ||
        region.row + region.height > height
      ) {
        errors.push(
          `${label} has a region outside the map or with invalid dimensions.`,
        );
      }

      if (
        !Array.isArray(trigger.events) ||
        trigger.events.length === 0 ||
        trigger.events.some((eventType) => !triggerEvents.has(eventType)) ||
        new Set(trigger.events).size !== trigger.events.length
      ) {
        errors.push(
          `${label} needs unique enter, exit, step, or itemUse events.`,
        );
      }

      if (trigger.events?.includes("itemUse")) {
        if (
          typeof trigger.itemId !== "string" ||
          !Object.hasOwn(ITEMS, trigger.itemId)
        ) {
          errors.push(
            `${label} needs an itemId from ITEMS for its itemUse event.`,
          );
        }
      } else if (Object.hasOwn(trigger, "itemId")) {
        errors.push(`${label}.itemId is only valid with an itemUse event.`);
      }

      if (!triggerFrequencies.has(trigger.frequency ?? "always")) {
        errors.push(
          `${label} has unsupported frequency "${String(trigger.frequency)}".`,
        );
      }
      if (!Array.isArray(trigger.effects) || trigger.effects.length === 0) {
        errors.push(`${label}.effects must be a nonempty array.`);
      }
    }

    const cameraZoneIds = new Set();
    for (const [index, zone] of (map.cameraZones ?? []).entries()) {
      const label = `Camera zone ${index} in "${map.id}"`;
      if (!zone || typeof zone !== "object" || Array.isArray(zone)) {
        errors.push(`${label} must be an object.`);
        continue;
      }
      if (typeof zone.id !== "string" || zone.id.length === 0) {
        errors.push(`${label} needs a nonempty ID.`);
      } else if (cameraZoneIds.has(zone.id)) {
        errors.push(`${label} duplicates ID "${zone.id}".`);
      } else {
        cameraZoneIds.add(zone.id);
      }
      const region = zone.region;
      if (
        !region ||
        typeof region !== "object" ||
        Array.isArray(region) ||
        !Number.isInteger(region.col) ||
        !Number.isInteger(region.row) ||
        !Number.isInteger(region.width) ||
        !Number.isInteger(region.height) ||
        region.col < 0 ||
        region.row < 0 ||
        region.width < 1 ||
        region.height < 1 ||
        region.col + region.width > width ||
        region.row + region.height > height
      ) {
        errors.push(`${label} has an invalid or out-of-bounds region.`);
      }
      if (!Number.isFinite(zone.priority)) {
        errors.push(`${label}.priority must be a finite number.`);
      }
      for (const key of ["transitionInMs", "transitionOutMs"]) {
        if (!Number.isFinite(zone[key]) || zone[key] < 0) {
          errors.push(`${label}.${key} must be a non-negative number.`);
        }
      }
      const camera = zone.camera;
      const allowedCameraKeys = new Set([
        "x",
        "y",
        "zoom",
        "followTarget",
        "offsetX",
        "offsetY",
      ]);
      if (
        !camera ||
        typeof camera !== "object" ||
        Array.isArray(camera) ||
        Object.keys(camera).length === 0 ||
        Object.keys(camera).some((key) => !allowedCameraKeys.has(key))
      ) {
        errors.push(`${label}.camera must be a nonempty camera patch object.`);
      } else {
        if (
          camera.zoom !== undefined &&
          (!Number.isFinite(camera.zoom) ||
            camera.zoom < 0.25 ||
            camera.zoom > 8)
        ) {
          errors.push(`${label}.camera.zoom must be between 0.25 and 8.`);
        }
        for (const key of ["x", "y", "offsetX", "offsetY"]) {
          if (camera[key] !== undefined && !Number.isFinite(camera[key])) {
            errors.push(`${label}.camera.${key} must be a finite number.`);
          }
        }
        if (camera.followTarget !== undefined) {
          const target = camera.followTarget;
          if (
            !target ||
            typeof target !== "object" ||
            Array.isArray(target) ||
            !["player", "entity", "none"].includes(target.type)
          ) {
            errors.push(`${label}.camera.followTarget is invalid.`);
          } else if (target.type === "entity") {
            if (
              typeof target.entityId !== "string" ||
              !(map.entities ?? []).some(
                (entity) => entity.id === target.entityId,
              )
            ) {
              errors.push(
                `${label}.camera.followTarget references a missing entity.`,
              );
            }
          } else if (Object.hasOwn(target, "entityId")) {
            errors.push(
              `${label}.camera.followTarget.entityId is only valid for entity targets.`,
            );
          }
        }
      }
    }

    const randomExitIds = new Set();
    for (const [index, exit] of (map.exits ?? []).entries()) {
      if (!exit || typeof exit !== "object" || Array.isArray(exit)) {
        errors.push(`Exit ${index} in "${map.id}" must be an object.`);
        continue;
      }
      if (!["north", "south", "east", "west"].includes(exit.edge)) {
        errors.push(`Exit ${index} in "${map.id}" has an invalid edge.`);
      }
      const axisLimit =
        exit.edge === "east" || exit.edge === "west" ? height : width;
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
      if (exit.destination?.type === "random") {
        if (typeof exit.id !== "string" || exit.id.length === 0) {
          errors.push(`Random exit ${index} in "${map.id}" needs a stable ID.`);
        } else if (randomExitIds.has(exit.id)) {
          errors.push(
            `Random exit ${index} in "${map.id}" duplicates ID "${exit.id}".`,
          );
        } else {
          randomExitIds.add(exit.id);
        }
        if (
          typeof exit.destination.id !== "string" ||
          exit.destination.id.length === 0
        ) {
          errors.push(
            `Random exit ${index} in "${map.id}" needs a destination random ID.`,
          );
        }
        if (
          !new Set(["save", "once", "roomVisit", "interaction", "use"]).has(
            exit.destination.scope,
          )
        ) {
          errors.push(
            `Random exit ${index} in "${map.id}" has unsupported scope "${String(exit.destination.scope)}".`,
          );
        }
        if (
          !Array.isArray(exit.destination.choices) ||
          exit.destination.choices.length === 0
        ) {
          errors.push(
            `Random exit ${index} in "${map.id}" needs destination choices.`,
          );
        } else {
          for (const [
            choiceIndex,
            choice,
          ] of exit.destination.choices.entries()) {
            if (!Number.isFinite(choice?.weight) || choice.weight <= 0) {
              errors.push(
                `Random exit ${index} choice ${choiceIndex} in "${map.id}" needs a positive weight.`,
              );
            }
            validateEditorExitDestinationShape(
              exit,
              choice,
              `Random exit ${index} choice ${choiceIndex} in "${map.id}"`,
              errors,
            );
          }
        }
      } else {
        validateEditorExitDestinationShape(
          exit,
          exit,
          `Exit ${index} in "${map.id}"`,
          errors,
        );
      }
    }
  }

  for (const map of maps) {
    for (const [index, exit] of (map.exits ?? []).entries()) {
      const destinations =
        exit.destination?.type === "random"
          ? (exit.destination.choices ?? [])
          : [exit];
      for (const [choiceIndex, destination] of destinations.entries()) {
        const suffix =
          exit.destination?.type === "random" ? ` choice ${choiceIndex}` : "";
        const target = mapById.get(destination.targetMapId);
        if (!target) {
          errors.push(
            `Exit ${index}${suffix} in "${map.id}" targets missing map "${destination.targetMapId}".`,
          );
          continue;
        }
        if (
          destination.entryId &&
          !Object.hasOwn(target.entries ?? {}, destination.entryId)
        ) {
          errors.push(
            `Exit ${index}${suffix} in "${map.id}" targets missing entry "${destination.entryId}" in "${target.id}".`,
          );
        }

        if (
          Object.hasOwn(destination, "targetEdge") &&
          isValidEdgeRange(destination.targetRange)
        ) {
          const { width: targetWidth, height: targetHeight } =
            getMapSize(target);
          const targetLimit =
            destination.targetEdge === "east" ||
            destination.targetEdge === "west"
              ? targetHeight
              : targetWidth;
          if (destination.targetRange[1] >= targetLimit) {
            errors.push(
              `Exit ${index}${suffix} in "${map.id}" has a targetRange beyond the ${destination.targetEdge} edge of "${target.id}".`,
            );
          } else {
            for (
              let axis = destination.targetRange[0];
              axis <= destination.targetRange[1];
              axis += 1
            ) {
              const position = getEdgePosition(
                { width: targetWidth, height: targetHeight },
                destination.targetEdge,
                axis,
              );
              const problem = transitionCellProblem(
                target,
                position.col,
                position.row,
              );
              if (problem) {
                errors.push(
                  `Exit ${index}${suffix} in "${map.id}" target doorway axis ${axis} ${problem} in "${target.id}".`,
                );
              }
            }
          }
        }

        if (Object.hasOwn(destination, "targetPosition")) {
          const position = destination.targetPosition;
          if (!isInsideMap(target, position?.col, position?.row)) {
            errors.push(
              `Exit ${index}${suffix} in "${map.id}" has a targetPosition outside "${target.id}".`,
            );
          }
        }
      }
    }

    for (const [index, entity] of (map.entities ?? []).entries()) {
      validateEditorInteractionReferences(
        entity?.interaction,
        map,
        `${map.id}.entities[${index}].interaction`,
        mapById,
        errors,
      );
    }

    for (const [index, trigger] of (map.triggers ?? []).entries()) {
      validateEditorEffectsReferences(
        trigger?.effects,
        map,
        `${map.id}.triggers[${index}].effects`,
        mapById,
        errors,
      );
    }

    for (const [tileId, tile] of Object.entries(map.tiles ?? {})) {
      validateEditorInteractionReferences(
        tile?.interaction,
        map,
        `${map.id}.tiles.${tileId}.interaction`,
        mapById,
        errors,
      );
    }

    for (const [index, event] of (map.musicEvents ?? []).entries()) {
      validateEditorEffectsReferences(
        event?.effects,
        map,
        `${map.id}.musicEvents[${index}].effects`,
        mapById,
        errors,
      );
    }

    validateEditorEffectsReferences(
      map.onEnter,
      map,
      `${map.id}.onEnter`,
      mapById,
      errors,
    );
    validateEditorEffectsReferences(
      map.onExit,
      map,
      `${map.id}.onExit`,
      mapById,
      errors,
    );
  }

  return [...new Set(errors)];
}
