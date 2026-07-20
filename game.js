import {
  drawImageVisual,
  resolveAnimationId,
  resolveVisualFrame,
} from "./animation.js";
import { AudioSystem } from "./audio.js";
import {
  evaluateCondition,
  validateCondition,
  validateConditionReferences,
} from "./conditions.js";
import { DialogueBox } from "./dialogue.js";
import {
  collectRandomEffectIds,
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
import { MOVEMENT_SUBDIVISIONS, Player } from "./player.js";
import {
  MUSIC_EVENT_FREQUENCIES,
  MUSIC_TRANSITION_POLICIES,
  resolveMapMusic,
  validateMapMusicDefinition,
  validateMapMusicReferences,
} from "./music.js";
import { MUSIC, MUSIC_EFFECTS, SOUNDS } from "./data/audio-definitions.js";
import { PLAYER_SPRITES, SPRITES } from "./data/sprites.js";
import { TILE_SIZE, EMPTY_TILE_ID, TILES } from "./data/tiles.js";
import { SAVE_VERSION } from "./saves.js";
import {
  OPPOSITE_EDGE,
  getEdgePosition,
  getRangeLength,
  mapAxisBetweenRanges,
} from "./map-edges.js";
import {
  RANDOM_SCOPES,
  RANDOM_STATE_VERSION,
  chooseWeightedIndex,
  createRandomState,
  deterministicFloat,
} from "./random.js";
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

const RENDER_LAYER_NAMES = new Set(["base", "obstacles", "foreground"]);
const TRIGGER_EVENT_TYPES = new Set(["enter", "exit", "step", "itemUse"]);
const TRIGGER_FREQUENCIES = new Set([
  "always",
  "once-per-visit",
  "once-per-save",
]);
const COLLISION_EPSILON = 1e-7;
const CAMERA_ZOOM_MIN = 0.25;
const CAMERA_ZOOM_MAX = 8;
const CAMERA_FOLLOW_TYPES = new Set(["player", "entity", "none"]);
const CAMERA_INHERIT_TRANSITION_MS = 250;

function validateEdgeRange(range, label) {
  if (
    !Array.isArray(range) ||
    range.length !== 2 ||
    !range.every(Number.isInteger) ||
    range[0] < 0 ||
    range[1] < range[0]
  ) {
    throw new Error(`${label} must contain two ordered non-negative integers.`);
  }
}

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
    visual: structuredClone(entity.visual),
    transform: structuredClone(entity.transform),
    collision: entity.collision,
  };
}

function entityVisualsEqual(first, second) {
  return first.type === second.type && first.id === second.id;
}

function entityTransformsEqual(first, second) {
  return first.flipX === second.flipX && first.flipY === second.flipY;
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
    random: createRandomState(),
    triggerHistory: {
      oncePerSave: {},
    },
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
    this.activeTouchTargets = new Set();
    this.activeTriggerIds = new Set();
    this.sessionMusicEventIds = new Set();
    this.saveMusicEventIds = new Set();
    this.audioDebugElapsedMs = 0;
    this.runningExitEvents = false;

    this.state = createRuntimeState(authoredMaps);

    this.images = new Map();
    this.spriteDefinitions = new Map(Object.entries(SPRITES));
    this.playerSpriteDefinitions = new Map(Object.entries(PLAYER_SPRITES));
    this.audio = new AudioSystem(SOUNDS, MUSIC, MUSIC_EFFECTS);
    this.dialogueBox = new DialogueBox(document.querySelector("#dialogue"));
    this.mode = "world";
    this.selectedItemId = null;
    this.camera = {
      x: 0,
      y: 0,
      zoom: 1,
      shakeX: 0,
      shakeY: 0,
      transition: null,
      shake: null,
    };
    this.cameraBase = {
      x: 0,
      y: 0,
      zoom: 1,
      followTarget: { type: "player" },
      offsetX: 0,
      offsetY: 0,
    };
    this.cameraEffective = structuredClone(this.cameraBase);
    this.cameraMotion = structuredClone(this.cameraBase);
    this.cameraOverrides = new Map();
    this.activeCameraZoneIds = new Set();
    this.player = new Player(
      TILE_SIZE,
      this.state.player,
      this.getPlayerFootprint(this.state.player.spriteId),
    );
    this.ambientAnimationTimeMs = 0;
    this.playerAnimation = {
      spriteId: null,
      animationId: null,
      elapsedMs: 0,
    };
    this.resetPlayerAnimation();
    this.lastTime = performance.now();

    this.statusElement = document.querySelector("#status");
    this.eventLogElement = document.querySelector("#event-log");
    this.audioDebugElement = document.querySelector("#audio-debug");
    this.audioDebugFields = this.audioDebugElement
      ? Object.fromEntries(
          [
            ...this.audioDebugElement.querySelectorAll("[data-audio-field]"),
          ].map((element) => [element.dataset.audioField, element]),
        )
      : {};
    this.bindAudioDebugControls();
    this.inventoryPanel = new InventoryPanel({
      rootElement: document.querySelector("#inventory"),
      openButton: document.querySelector("#open-inventory"),
      onOpen: () => this.openInventory(),
      onClose: () => this.closeInventory(),
      onUse: () => this.useSelectedItem(),
      onSelect: (itemId) => this.selectInventoryItem(itemId),
      renderItemVisual: (ctx, itemId, elapsedMs) =>
        this.renderItemVisualPreview(ctx, itemId, elapsedMs),
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
        new Set(["name", "visual", "description", "usable", "effects"]),
        label,
      );

      for (const property of ["name", "description"]) {
        requireString(item[property], `${label}.${property}`);
      }

      requireObject(item.visual, `${label}.visual`);
      requireExactKeys(item.visual, new Set(["type", "id"]), `${label}.visual`);
      if (item.visual.type !== "sprite") {
        throw new Error(`${label}.visual.type must be "sprite".`);
      }
      this.validateSpriteReference(item.visual.id, `${label}.visual`);

      requireBoolean(item.usable, `${label}.usable`);

      if (item.effects !== undefined) {
        if (!item.usable) {
          throw new Error(
            `${label} cannot define effects while usable is false.`,
          );
        }
        validateEffectsDefinition(item.effects, `Effects for ${label}`);
      }

      this.itemDefinitions.set(itemId, item);
    }
  }

  validateItemReferences() {
    for (const [itemId, item] of this.itemDefinitions) {
      if (!item.effects) continue;
      visitEffects(item.effects, (effect) => {
        if (effect.type === "teleport") {
          throw new Error(
            `Effects for Item "${itemId}" cannot contain teleport. ` +
              "Map-dependent item behavior belongs in an itemUse trigger.",
          );
        }
        if (Object.hasOwn(effect, "mapId")) {
          throw new Error(
            `Effects for Item "${itemId}" cannot contain mapId. ` +
              "Map-dependent item behavior belongs in an itemUse trigger.",
          );
        }
      });
      validateEffectsReferences(
        this,
        item.effects,
        null,
        `Effects for Item "${itemId}"`,
      );
    }
  }

  validateCameraZoom(zoom, label) {
    if (
      !Number.isFinite(zoom) ||
      zoom < CAMERA_ZOOM_MIN ||
      zoom > CAMERA_ZOOM_MAX
    ) {
      throw new Error(
        `${label} must be between ${CAMERA_ZOOM_MIN} and ${CAMERA_ZOOM_MAX}.`,
      );
    }
  }

  validateMapCamera(camera, label) {
    requireObject(camera, label);
    requireExactKeys(camera, new Set(["zoom", "follow"]), label);
    this.validateCameraZoom(camera.zoom, `${label}.zoom`);
    if (camera.follow !== "player") {
      throw new Error(`${label}.follow must be "player".`);
    }
  }

  validateMap(map, isInitialMap) {
    requireObject(map.entries, `Map "${map.id}" entries`);
    requireObject(map.layers, `Map "${map.id}" layers`);
    requireArray(map.entities, `Map "${map.id}" entities`);
    requireArray(map.triggers, `Map "${map.id}" triggers`);
    requireArray(map.cameraZones, `Map "${map.id}" cameraZones`);
    requireArray(map.exits, `Map "${map.id}" exits`);
    this.validateMapCamera(map.camera, `Map "${map.id}" camera`);
    if (map.onEnter !== undefined) {
      requireArray(map.onEnter, `Map "${map.id}" onEnter`);
      if (map.onEnter.length > 0) {
        validateEffectsDefinition(map.onEnter, `Map "${map.id}" onEnter`);
      }
    }
    if (map.onExit !== undefined) {
      requireArray(map.onExit, `Map "${map.id}" onExit`);
      if (map.onExit.length > 0) {
        validateEffectsDefinition(map.onExit, `Map "${map.id}" onExit`);
      }
    }
    validateMapMusicDefinition(map);

    for (const layerName of Object.keys(map.layers)) {
      if (!RENDER_LAYER_NAMES.has(layerName)) {
        throw new Error(
          `Map "${map.id}" contains unsupported layer "${layerName}".`,
        );
      }
    }

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

    for (const [tileId, tile] of Object.entries(map.tiles)) {
      this.validateTile(tileId, tile, map.id);
    }

    const triggerIds = new Set();
    map.triggers.forEach((trigger, index) => {
      this.validateTriggerDefinition(trigger, map, index);
      if (triggerIds.has(trigger.id)) {
        throw new Error(
          `Map "${map.id}" contains duplicate trigger ID "${trigger.id}".`,
        );
      }
      triggerIds.add(trigger.id);
    });

    const cameraZoneIds = new Set();
    map.cameraZones.forEach((zone, index) => {
      this.validateCameraZoneDefinition(zone, map, index);
      if (cameraZoneIds.has(zone.id)) {
        throw new Error(
          `Map "${map.id}" contains duplicate camera zone ID "${zone.id}".`,
        );
      }
      cameraZoneIds.add(zone.id);
    });

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

          const placementLabel =
            `Tile ${String(tileId)} at ${colIndex},${rowIndex} in layer ` +
            `"${layerName}" of map "${map.id}"`;
          this.validateTileLayerCompatibility(
            map,
            layerName,
            tileId,
            placementLabel,
          );
          this.validateTileFootprint(
            map,
            colIndex,
            rowIndex,
            tile,
            placementLabel,
          );

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
        throw new Error(
          `Duplicate entity ID "${entity.id}" in map "${map.id}".`,
        );
      }

      entityIds.add(entity.id);
    }

    const randomExitIds = new Set();
    map.exits.forEach((exit, index) => {
      this.validateExitDefinition(exit, map, index);
      if (exit.destination?.type !== "random") return;
      if (randomExitIds.has(exit.id)) {
        throw new Error(
          `Map "${map.id}" contains duplicate random exit ID "${exit.id}".`,
        );
      }
      randomExitIds.add(exit.id);
    });
    this.validateExitRangeOverlaps(map);
  }

  validateMusicTransitionOptions(value, label) {
    if (
      value.musicTransition !== undefined &&
      !MUSIC_TRANSITION_POLICIES.has(value.musicTransition)
    ) {
      throw new Error(
        `${label}.musicTransition must be "inherit", "replace", "crossfade", or "silence".`,
      );
    }
    if (
      value.musicTransitionMs !== undefined &&
      (!Number.isFinite(value.musicTransitionMs) || value.musicTransitionMs < 0)
    ) {
      throw new Error(
        `${label}.musicTransitionMs must be a non-negative number.`,
      );
    }
    if (value.inheritCamera !== undefined) {
      requireBoolean(value.inheritCamera, `${label}.inheritCamera`);
    }
  }

  validateExitDestinationDefinition(
    destination,
    sourceEdge,
    sourceRange,
    label,
  ) {
    requireObject(destination, label);
    this.validateMusicTransitionOptions(destination, label);
    requireString(destination.targetMapId, `${label}.targetMapId`);

    if (Object.hasOwn(destination, "entryId")) {
      requireExactKeys(
        destination,
        new Set([
          "weight",
          "targetMapId",
          "entryId",
          "musicTransition",
          "musicTransitionMs",
          "inheritCamera",
        ]),
        label,
      );
      requireString(destination.entryId, `${label}.entryId`);
      return;
    }

    if (Object.hasOwn(destination, "targetPosition")) {
      requireExactKeys(
        destination,
        new Set([
          "weight",
          "targetMapId",
          "targetPosition",
          "musicTransition",
          "musicTransitionMs",
          "inheritCamera",
        ]),
        label,
      );
      requireObject(destination.targetPosition, `${label}.targetPosition`);
      requireExactKeys(
        destination.targetPosition,
        new Set(["col", "row", "facing"]),
        `${label}.targetPosition`,
      );
      this.validateEntry(destination.targetPosition, `${label}.targetPosition`);
      return;
    }

    requireExactKeys(
      destination,
      new Set([
        "weight",
        "targetMapId",
        "targetEdge",
        "targetRange",
        "musicTransition",
        "musicTransitionMs",
        "inheritCamera",
      ]),
      label,
    );

    const edges = new Set(["north", "south", "east", "west"]);
    if (!edges.has(destination.targetEdge)) {
      throw new Error(
        `${label}.targetEdge must be north, south, east, or west.`,
      );
    }
    if (destination.targetEdge !== OPPOSITE_EDGE[sourceEdge]) {
      throw new Error(
        `${label}.targetEdge must be the opposite edge (${sourceEdge} to ` +
          `${OPPOSITE_EDGE[sourceEdge]}).`,
      );
    }
    validateEdgeRange(destination.targetRange, `${label}.targetRange`);
    if (
      getRangeLength(sourceRange) !== getRangeLength(destination.targetRange)
    ) {
      throw new Error(
        `${label} connects a ${getRangeLength(sourceRange)}-cell source range to a ` +
          `${getRangeLength(destination.targetRange)}-cell target range.`,
      );
    }
  }

  validateExitDefinition(exit, map, index) {
    const label = `Exit ${index} in "${map.id}"`;
    requireObject(exit, label);

    const edges = new Set(["north", "south", "east", "west"]);
    if (!edges.has(exit.edge)) {
      throw new Error(`${label}.edge must be north, south, east, or west.`);
    }

    validateEdgeRange(exit.range, `${label}.range`);

    const axisLimit =
      exit.edge === "east" || exit.edge === "west"
        ? map.gridSize.height
        : map.gridSize.width;
    if (exit.range[1] >= axisLimit) {
      throw new Error(
        `${label}.range exceeds the ${exit.edge} edge of "${map.id}".`,
      );
    }

    if (Object.hasOwn(exit, "destination")) {
      requireExactKeys(
        exit,
        new Set(["id", "edge", "range", "destination"]),
        label,
      );
      requireString(exit.id, `${label}.id`);
      const destination = exit.destination;
      requireObject(destination, `${label}.destination`);
      requireExactKeys(
        destination,
        new Set(["type", "id", "scope", "choices"]),
        `${label}.destination`,
      );
      if (destination.type !== "random") {
        throw new Error(`${label}.destination.type must be "random".`);
      }
      requireString(destination.id, `${label}.destination.id`);
      if (!RANDOM_SCOPES.has(destination.scope)) {
        throw new Error(`${label}.destination.scope is unsupported.`);
      }
      requireNonEmptyArray(destination.choices, `${label}.destination.choices`);
      destination.choices.forEach((choice, choiceIndex) => {
        requirePositiveNumber(
          choice?.weight,
          `${label}.destination.choices[${choiceIndex}].weight`,
        );
        this.validateExitDestinationDefinition(
          choice,
          exit.edge,
          exit.range,
          `${label}.destination.choices[${choiceIndex}]`,
        );
      });
      return;
    }

    this.validateMusicTransitionOptions(exit, label);
    const { edge, range, ...destination } = exit;
    this.validateExitDestinationDefinition(destination, edge, range, label);
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
          first.range[0] <= second.range[1] &&
          second.range[0] <= first.range[1];
        if (!overlaps) continue;

        throw new Error(
          `Exit ${secondIndex} in "${map.id}" overlaps exit ${firstIndex} on the ` +
            `${first.edge} edge.`,
        );
      }
    }
  }

  validateExitDestinationReferences(
    exit,
    destination,
    label,
    initialSpatialDataByMap,
  ) {
    const targetMap = this.mapsById.get(destination.targetMapId);
    if (!targetMap) {
      throw new Error(
        `${label} references missing map "${destination.targetMapId}".`,
      );
    }

    if (Object.hasOwn(destination, "entryId")) {
      this.validateEntryReference(
        destination.targetMapId,
        destination.entryId,
        label,
      );
      return;
    }

    if (Object.hasOwn(destination, "targetPosition")) {
      this.validateMapPosition(
        destination.targetMapId,
        destination.targetPosition.col,
        destination.targetPosition.row,
        `${label}.targetPosition`,
      );
      this.validateTransitionCell(
        initialSpatialDataByMap.get(destination.targetMapId),
        destination.targetPosition.col,
        destination.targetPosition.row,
        `${label}.targetPosition`,
      );
      return;
    }

    const targetAxisLimit =
      destination.targetEdge === "east" || destination.targetEdge === "west"
        ? targetMap.gridSize.height
        : targetMap.gridSize.width;
    if (destination.targetRange[1] >= targetAxisLimit) {
      throw new Error(
        `${label}.targetRange exceeds the ${destination.targetEdge} edge of ` +
          `"${destination.targetMapId}".`,
      );
    }

    const targetSpatialData = initialSpatialDataByMap.get(
      destination.targetMapId,
    );
    for (
      let axis = destination.targetRange[0];
      axis <= destination.targetRange[1];
      axis += 1
    ) {
      const position = getEdgePosition(
        targetMap.gridSize,
        destination.targetEdge,
        axis,
      );
      this.validateTransitionCell(
        targetSpatialData,
        position.col,
        position.row,
        `${label} destination axis ${axis}`,
      );
    }
  }

  validateExitReferences(map, initialSpatialDataByMap) {
    map.exits.forEach((exit, index) => {
      const label = `Exit ${index} in "${map.id}"`;
      if (exit.destination?.type === "random") {
        exit.destination.choices.forEach((choice, choiceIndex) => {
          this.validateExitDestinationReferences(
            exit,
            choice,
            `${label}.destination.choices[${choiceIndex}]`,
            initialSpatialDataByMap,
          );
        });
        return;
      }
      this.validateExitDestinationReferences(
        exit,
        exit,
        label,
        initialSpatialDataByMap,
      );
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

  getEdgeExitPosition(exit, destination, sourceAxis) {
    const targetMap = this.mapsById.get(destination.targetMapId);
    const targetAxis = mapAxisBetweenRanges(
      sourceAxis,
      exit.range,
      destination.targetRange,
    );
    const position = getEdgePosition(
      targetMap.gridSize,
      destination.targetEdge,
      targetAxis,
    );
    this.validatePlayerPosition(
      destination.targetMapId,
      position.col,
      position.row,
      "Edge exit target",
    );
    return position;
  }

  validateTile(tileId, tile, mapId) {
    const label = `Tile ${String(tileId)} in "${mapId}"`;
    requireObject(tile, label);
    requireExactKeys(
      tile,
      new Set([
        "path",
        "size",
        "source",
        "defaultAnimation",
        "animations",
        "footprint",
        "collision",
        "condition",
        "interaction",
      ]),
      label,
    );
    requireString(tile.path, `${label}.path`);
    if (!Object.hasOwn(tile, "source")) {
      throw new Error(`${label} must define an atlas source rectangle.`);
    }

    if (tile.collision !== undefined) {
      requireBoolean(tile.collision, `${label}.collision`);
    }

    if (tile.size !== undefined) {
      this.validateSize(tile.size, `Tile ${String(tileId)} in "${mapId}"`);
    }

    if (tile.footprint !== undefined) {
      this.validateTileFootprintDefinition(
        tile.footprint,
        `${label}.footprint`,
      );
    }

    this.validateVisualDefinition(tile, label);

    if (tile.condition) {
      validateCondition(
        tile.condition,
        `Condition for tile ${String(tileId)} in "${mapId}"`,
      );
    }

    if (tile.interaction) {
      validateInteractionDefinition(
        tile.interaction,
        `interaction on tile ${String(tileId)} in "${mapId}"`,
      );
    }
  }

  validateTileFootprintDefinition(footprint, label) {
    requireNonEmptyArray(footprint, label);

    const seenOffsets = new Set();
    footprint.forEach((offset, index) => {
      const entryLabel = `${label}[${index}]`;
      if (
        !Array.isArray(offset) ||
        offset.length !== 2 ||
        !offset.every(Number.isInteger)
      ) {
        throw new Error(`${entryLabel} must contain two integers.`);
      }

      const [dc, dr] = offset;
      if (dc < 0 || dr < 0) {
        throw new Error(`${entryLabel} must contain non-negative offsets.`);
      }

      const key = `${dc},${dr}`;
      if (seenOffsets.has(key)) {
        throw new Error(`${label} contains duplicate offset ${key}.`);
      }
      seenOffsets.add(key);
    });
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
        "visual",
        "transform",
        "collision",
        "interaction",
        "condition",
      ]),
      label,
    );

    requireString(entity.id, `${label}.id`);

    const entityLabel = `Entity "${entity.id}" in "${map.id}"`;
    requireBoolean(entity.active, `${entityLabel}.active`);

    this.validateEntityVisualReference(map.id, entity.visual, entityLabel);
    this.validateEntityTransform(entity.transform, entityLabel);
    this.validateEntityPlacement(
      map.id,
      entity.col,
      entity.row,
      entity.visual,
      entityLabel,
    );

    requireBoolean(entity.collision, `${entityLabel}.collision`);

    if (entity.interaction !== null) {
      validateInteractionDefinition(
        entity.interaction,
        `interaction for ${entityLabel}`,
      );
    }

    this.validateEntityCollisionInteraction(
      entity.collision,
      entity.interaction,
      entityLabel,
    );

    if (entity.condition) {
      validateCondition(entity.condition, `Condition for ${entityLabel}`);
    }

    if (!Object.hasOwn(this.state.maps[map.id].entities, entity.id)) {
      throw new Error(`${entityLabel} has no runtime state.`);
    }
  }

  validateMapReferences(map) {
    const validatedTileIds = new Set();
    const tileRandomIds = new Map();

    for (const layer of Object.values(map.layers)) {
      for (const row of layer) {
        for (const tileId of row) {
          if (tileId === EMPTY_TILE_ID || validatedTileIds.has(tileId))
            continue;
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
            if (interaction.handler === "effects") {
              for (const randomId of collectRandomEffectIds(
                interaction.effects,
              )) {
                const previousTileId = tileRandomIds.get(randomId);
                if (previousTileId !== undefined) {
                  throw new Error(
                    `Map "${map.id}" tile interactions duplicate random ID ` +
                      `"${randomId}" on tile ${String(previousTileId)} and ` +
                      `${String(tileId)}.`,
                  );
                }
                tileRandomIds.set(randomId, tileId);
              }
            }
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

    validateMapMusicReferences(this, map);

    if (map.onEnter !== undefined) {
      validateEffectsReferences(
        this,
        map.onEnter,
        map.id,
        `Map "${map.id}" onEnter`,
      );
    }
    if (map.onExit !== undefined) {
      validateEffectsReferences(
        this,
        map.onExit,
        map.id,
        `Map "${map.id}" onExit`,
      );
    }

    for (const trigger of map.triggers) {
      if (trigger.events.includes("itemUse")) {
        this.validateItemReference(
          trigger.itemId,
          `Trigger "${trigger.id}" in "${map.id}"`,
        );
      }
      if (trigger.condition) {
        validateConditionReferences(
          this,
          trigger.condition,
          `Condition for trigger "${trigger.id}" in "${map.id}"`,
        );
      }
      validateEffectsReferences(
        this,
        trigger.effects,
        map.id,
        `Effects for trigger "${trigger.id}" in "${map.id}"`,
      );
    }

    for (const zone of map.cameraZones) {
      if (zone.condition) {
        validateConditionReferences(
          this,
          zone.condition,
          `Condition for camera zone "${zone.id}" in "${map.id}"`,
        );
      }
      if (zone.camera.followTarget?.type === "entity") {
        this.validateEntityReference(
          map.id,
          zone.camera.followTarget.entityId,
          `Camera zone "${zone.id}" in "${map.id}"`,
        );
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

  validateTriggerDefinition(trigger, map, index) {
    const label = `Trigger ${index} in "${map.id}"`;
    requireObject(trigger, label);
    requireExactKeys(
      trigger,
      new Set([
        "id",
        "region",
        "events",
        "itemId",
        "frequency",
        "condition",
        "effects",
      ]),
      label,
    );
    requireString(trigger.id, `${label}.id`);

    requireObject(trigger.region, `${label}.region`);
    requireExactKeys(
      trigger.region,
      new Set(["col", "row", "width", "height"]),
      `${label}.region`,
    );
    requireNonNegativeInteger(trigger.region.col, `${label}.region.col`);
    requireNonNegativeInteger(trigger.region.row, `${label}.region.row`);
    requirePositiveInteger(trigger.region.width, `${label}.region.width`);
    requirePositiveInteger(trigger.region.height, `${label}.region.height`);

    const regionRight = trigger.region.col + trigger.region.width;
    const regionBottom = trigger.region.row + trigger.region.height;
    if (
      regionRight > map.gridSize.width ||
      regionBottom > map.gridSize.height
    ) {
      throw new Error(`${label}.region extends outside map "${map.id}".`);
    }

    requireNonEmptyArray(trigger.events, `${label}.events`);
    const eventTypes = new Set();
    trigger.events.forEach((eventType, eventIndex) => {
      requireString(eventType, `${label}.events[${eventIndex}]`);
      if (!TRIGGER_EVENT_TYPES.has(eventType)) {
        throw new Error(`${label}.events[${eventIndex}] is unsupported.`);
      }
      if (eventTypes.has(eventType)) {
        throw new Error(`${label}.events duplicates "${eventType}".`);
      }
      eventTypes.add(eventType);
    });

    if (eventTypes.has("itemUse")) {
      requireString(trigger.itemId, `${label}.itemId`);
    } else if (Object.hasOwn(trigger, "itemId")) {
      throw new Error(
        `${label}.itemId is only valid when events includes "itemUse".`,
      );
    }

    if (
      trigger.frequency !== undefined &&
      !TRIGGER_FREQUENCIES.has(trigger.frequency)
    ) {
      throw new Error(
        `${label}.frequency must be "always", "once-per-visit", or "once-per-save".`,
      );
    }
    if (trigger.condition !== undefined) {
      validateCondition(trigger.condition, `Condition for ${label}`);
    }
    validateEffectsDefinition(trigger.effects, `Effects for ${label}`);
  }

  validateCameraFollowTarget(target, mapId, label) {
    requireObject(target, label);
    requireExactKeys(target, new Set(["type", "entityId"]), label);
    if (!CAMERA_FOLLOW_TYPES.has(target.type)) {
      throw new Error(`${label}.type must be "player", "entity", or "none".`);
    }
    if (target.type === "entity") {
      requireString(target.entityId, `${label}.entityId`);
    } else if (Object.hasOwn(target, "entityId")) {
      throw new Error(`${label}.entityId is only valid for entity following.`);
    }
  }

  validateCameraPatch(camera, mapId, label) {
    requireObject(camera, label);
    requireExactKeys(
      camera,
      new Set(["x", "y", "zoom", "followTarget", "offsetX", "offsetY"]),
      label,
    );
    if (Object.keys(camera).length === 0) {
      throw new Error(`${label} must define at least one camera property.`);
    }
    if (camera.zoom !== undefined)
      this.validateCameraZoom(camera.zoom, `${label}.zoom`);
    for (const key of ["x", "y", "offsetX", "offsetY"]) {
      if (camera[key] !== undefined && !Number.isFinite(camera[key])) {
        throw new Error(`${label}.${key} must be a finite number.`);
      }
    }
    if (camera.followTarget !== undefined) {
      this.validateCameraFollowTarget(
        camera.followTarget,
        mapId,
        `${label}.followTarget`,
      );
    }
  }

  validateCameraZoneDefinition(zone, map, index) {
    const label = `Camera zone ${index} in "${map.id}"`;
    requireObject(zone, label);
    requireExactKeys(
      zone,
      new Set([
        "id",
        "region",
        "condition",
        "priority",
        "camera",
        "transitionInMs",
        "transitionOutMs",
      ]),
      label,
    );
    requireString(zone.id, `${label}.id`);
    requireObject(zone.region, `${label}.region`);
    requireExactKeys(
      zone.region,
      new Set(["col", "row", "width", "height"]),
      `${label}.region`,
    );
    requireNonNegativeInteger(zone.region.col, `${label}.region.col`);
    requireNonNegativeInteger(zone.region.row, `${label}.region.row`);
    requirePositiveInteger(zone.region.width, `${label}.region.width`);
    requirePositiveInteger(zone.region.height, `${label}.region.height`);
    if (
      zone.region.col + zone.region.width > map.gridSize.width ||
      zone.region.row + zone.region.height > map.gridSize.height
    ) {
      throw new Error(`${label}.region extends outside map "${map.id}".`);
    }
    if (!Number.isFinite(zone.priority)) {
      throw new Error(`${label}.priority must be a finite number.`);
    }
    this.validateCameraPatch(zone.camera, map.id, `${label}.camera`);
    for (const key of ["transitionInMs", "transitionOutMs"]) {
      if (!Number.isFinite(zone[key]) || zone[key] < 0) {
        throw new Error(`${label}.${key} must be a non-negative number.`);
      }
    }
    if (zone.condition !== undefined && zone.condition !== null) {
      validateCondition(zone.condition, `Condition for ${label}`);
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
      requireExactKeys(
        sprite,
        new Set(["path", "size", "source", "defaultAnimation", "animations"]),
        label,
      );
      requireString(sprite.path, `${label}.path`);
      if (!Object.hasOwn(sprite, "source")) {
        throw new Error(`${label} must define an atlas source rectangle.`);
      }
      this.validateSize(sprite.size, label);
      this.validateVisualDefinition(sprite, label);
    }
  }

  validatePlayerSpriteDefinitions() {
    for (const [spriteId, sprite] of this.playerSpriteDefinitions) {
      const label = `Player sprite "${spriteId}"`;
      requireObject(sprite, label);

      if (sprite.kind === "shape") {
        requireExactKeys(
          sprite,
          new Set(["kind", "fillStyle", "strokeStyle", "footprint"]),
          label,
        );

        requireString(sprite.fillStyle, `${label}.fillStyle`);
        requireString(sprite.strokeStyle, `${label}.strokeStyle`);
        this.validatePlayerFootprintDefinition(
          sprite.footprint,
          `${label}.footprint`,
        );
        continue;
      }

      if (sprite.kind === "image") {
        requireExactKeys(
          sprite,
          new Set([
            "kind",
            "path",
            "size",
            "source",
            "defaultAnimation",
            "animations",
            "footprint",
          ]),
          label,
        );
        requireString(sprite.path, `${label}.path`);
        if (!Object.hasOwn(sprite, "source")) {
          throw new Error(`${label} must define an atlas source rectangle.`);
        }
        this.validateSize(sprite.size, label);
        this.validatePlayerFootprintDefinition(
          sprite.footprint,
          `${label}.footprint`,
        );
        this.validateVisualDefinition(sprite, label);
        continue;
      }

      throw new Error(
        `${label} has unsupported kind "${String(sprite.kind)}".`,
      );
    }
  }

  validatePlayerFootprintDefinition(footprint, label) {
    requireObject(footprint, label);
    requireExactKeys(
      footprint,
      new Set(["width", "height", "offsetX", "offsetY"]),
      label,
    );

    requirePositiveNumber(footprint.width, `${label}.width`);
    requirePositiveNumber(footprint.height, `${label}.height`);
    requireInteger(footprint.offsetX, `${label}.offsetX`);
    requireInteger(footprint.offsetY, `${label}.offsetY`);
  }

  validateVisualDefinition(visual, label) {
    if (Object.hasOwn(visual, "source")) {
      const source = visual.source;
      if (!Array.isArray(source) || source.length !== 4) {
        throw new Error(`${label}.source must contain [x, y, width, height].`);
      }

      const [sourceX, sourceY, sourceWidth, sourceHeight] = source;
      if (!Number.isInteger(sourceX) || !Number.isInteger(sourceY)) {
        throw new Error(`${label}.source position must contain integers.`);
      }
      if (sourceX < 0 || sourceY < 0) {
        throw new Error(`${label}.source position must be non-negative.`);
      }
      if (!Number.isInteger(sourceWidth) || !Number.isInteger(sourceHeight)) {
        throw new Error(`${label}.source dimensions must contain integers.`);
      }
      if (sourceWidth <= 0 || sourceHeight <= 0) {
        throw new Error(`${label}.source dimensions must be positive.`);
      }
    }

    const hasDefaultAnimation = Object.hasOwn(visual, "defaultAnimation");
    const hasAnimations = Object.hasOwn(visual, "animations");
    if (!hasDefaultAnimation && !hasAnimations) return;

    if (hasDefaultAnimation !== hasAnimations) {
      throw new Error(
        `${label} must define defaultAnimation and animations together.`,
      );
    }
    if (!Object.hasOwn(visual, "source")) {
      throw new Error(
        `${label} must define source when animations are present.`,
      );
    }

    requireString(visual.defaultAnimation, `${label}.defaultAnimation`);
    requirePlainObject(visual.animations, `${label}.animations`);

    const animationEntries = Object.entries(visual.animations);
    if (animationEntries.length === 0) {
      throw new Error(
        `${label}.animations must contain at least one animation.`,
      );
    }

    if (!Object.hasOwn(visual.animations, visual.defaultAnimation)) {
      throw new Error(
        `${label}.defaultAnimation references missing animation ` +
          `"${visual.defaultAnimation}".`,
      );
    }

    for (const [animationId, animation] of animationEntries) {
      const animationLabel = `${label}.animations["${animationId}"]`;
      requireString(animationId, `${label} animation ID`);
      requirePlainObject(animation, animationLabel);
      requireExactKeys(animation, new Set(["fps", "frames"]), animationLabel);
      requirePositiveNumber(animation.fps, `${animationLabel}.fps`);
      requireNonEmptyArray(animation.frames, `${animationLabel}.frames`);

      animation.frames.forEach((frame, frameIndex) => {
        const frameLabel = `${animationLabel}.frames[${frameIndex}]`;
        if (
          !Array.isArray(frame) ||
          frame.length !== 2 ||
          !frame.every((value) => Number.isInteger(value) && value >= 0)
        ) {
          throw new Error(
            `${frameLabel} must contain two non-negative integers.`,
          );
        }
      });
    }
  }

  validateLoadedVisualImage(visual, label) {
    if (!visual.source) return;

    const image = this.images.get(visual.path);
    if (!image) {
      throw new Error(`${label} image was not loaded: ${visual.path}`);
    }

    const [originX, originY, frameWidth, frameHeight] = visual.source;
    const textureWidth = image.naturalWidth;
    const textureHeight = image.naturalHeight;

    const validateRectangle = (
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      context,
    ) => {
      const inBounds =
        sourceX >= 0 &&
        sourceY >= 0 &&
        sourceX + sourceWidth <= textureWidth &&
        sourceY + sourceHeight <= textureHeight;
      if (inBounds) return;

      throw new Error(
        `${label} ${context} uses source rectangle ` +
          `[${sourceX}, ${sourceY}, ${sourceWidth}, ${sourceHeight}] outside ` +
          `texture ${textureWidth}x${textureHeight}.`,
      );
    };

    validateRectangle(originX, originY, frameWidth, frameHeight, "base frame");

    if (!visual.animations) return;

    for (const [animationId, animation] of Object.entries(visual.animations)) {
      animation.frames.forEach(([frameCol, frameRow], frameIndex) => {
        const sourceX = originX + frameCol * frameWidth;
        const sourceY = originY + frameRow * frameHeight;
        validateRectangle(
          sourceX,
          sourceY,
          frameWidth,
          frameHeight,
          `animation "${animationId}" frame ${frameIndex} ` +
            `at coordinate [${frameCol}, ${frameRow}]`,
        );
      });
    }
  }

  validateLoadedVisualImages() {
    const validatedTiles = new Set();

    for (const map of this.maps) {
      for (const [tileId, tile] of Object.entries(map.tiles)) {
        if (validatedTiles.has(tile)) continue;
        validatedTiles.add(tile);
        this.validateLoadedVisualImage(
          tile,
          `Tile ${String(tileId)} in "${map.id}"`,
        );
      }
    }

    for (const [spriteId, sprite] of this.spriteDefinitions) {
      this.validateLoadedVisualImage(sprite, `Sprite "${spriteId}"`);
    }

    for (const [spriteId, sprite] of this.playerSpriteDefinitions) {
      if (sprite.kind !== "image") continue;
      this.validateLoadedVisualImage(sprite, `Player sprite "${spriteId}"`);
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
      throw new Error(
        `${label} must contain non-negative integer col and row values.`,
      );
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
        throw new Error(
          `Entry "${entryId}" in "${map.id}" is not on the walkable base.`,
        );
      }

      if (spatialData.collision.has(key)) {
        throw new Error(
          `Entry "${entryId}" in "${map.id}" is blocked by collision.`,
        );
      }
    }
  }

  validateEntryReference(mapId, entryId, label) {
    const map = this.mapsById.get(mapId);
    if (!map) {
      throw new Error(`${label} references missing map "${mapId}".`);
    }

    if (!Object.hasOwn(map.entries, entryId)) {
      throw new Error(
        `${label} references missing entry "${entryId}" in "${mapId}".`,
      );
    }
  }

  validateEntityReference(mapId, entityId, label) {
    const entities = this.entityDefinitionsByMap.get(mapId);
    if (!entities?.has(entityId)) {
      throw new Error(
        `${label} references missing entity "${entityId}" in "${mapId}".`,
      );
    }
  }

  validateMapPosition(mapId, col, row, label) {
    const map =
      this.mapsById.get(mapId) ??
      this.maps.find((candidate) => candidate.id === mapId);
    if (!map) {
      throw new Error(`${label} references missing map "${mapId}".`);
    }

    requireNonNegativeInteger(col, `${label}.col`);
    requireNonNegativeInteger(row, `${label}.row`);

    if (col >= map.gridSize.width || row >= map.gridSize.height) {
      throw new Error(
        `${label} references position ${col},${row} outside "${mapId}".`,
      );
    }
  }

  getPlayerFootprint(spriteId) {
    return this.playerSpriteDefinitions.get(spriteId).footprint;
  }

  getTouchTargetKey(target) {
    if (target.kind === "entity") {
      return `entity:${target.mapId}:${target.entityId}`;
    }

    return `tile:${target.mapId}:${target.anchor.col},${target.anchor.row}`;
  }

  getPlayerTouchTargets() {
    if (!this.activeSpatialData) return new Map();

    const cells = this.getFootboxCells(
      this.player.x,
      this.player.y,
      this.player.footprint,
      this.activeMap,
    );
    if (!cells) return new Map();

    const targets = new Map();

    for (const { col, row } of cells) {
      const target = this.activeSpatialData.interactions.get(`${col},${row}`);
      if (!target || !target.interaction.triggers.includes("touch")) continue;

      targets.set(this.getTouchTargetKey(target), target);
    }

    return targets;
  }

  syncTouchTargets() {
    this.activeTouchTargets = new Set(this.getPlayerTouchTargets().keys());
  }

  isTileInsideTrigger(tile, trigger) {
    const { col, row, width, height } = trigger.region;
    return (
      tile.col >= col &&
      tile.col < col + width &&
      tile.row >= row &&
      tile.row < row + height
    );
  }

  getTriggerIdsAtTile(tile = this.player.getCurrentTile()) {
    return new Set(
      this.activeMap.triggers
        .filter((trigger) => this.isTileInsideTrigger(tile, trigger))
        .map((trigger) => trigger.id),
    );
  }

  syncTriggerMembership() {
    this.activeTriggerIds = this.getTriggerIdsAtTile();
  }

  getTriggerFrequency(trigger) {
    return trigger.frequency ?? "always";
  }

  triggerHasFired(trigger) {
    const frequency = this.getTriggerFrequency(trigger);
    if (frequency === "always") return false;
    if (frequency === "once-per-save") {
      const triggerKey = `${this.activeMap.id}:${trigger.id}`;
      return this.state.triggerHistory.oncePerSave[triggerKey] === true;
    }

    const roomRuntime = this.state.random.currentRoomRuntime;
    return roomRuntime?.triggerFires?.[trigger.id] === true;
  }

  markTriggerFired(trigger) {
    const frequency = this.getTriggerFrequency(trigger);
    if (frequency === "always") return;
    if (frequency === "once-per-save") {
      this.state.triggerHistory.oncePerSave[
        `${this.activeMap.id}:${trigger.id}`
      ] = true;
      return;
    }

    this.state.random.currentRoomRuntime.triggerFires[trigger.id] = true;
  }

  getTriggerMovementEvent(trigger, previousIds, currentIds) {
    const wasInside = previousIds.has(trigger.id);
    const isInside = currentIds.has(trigger.id);

    if (!wasInside && isInside && trigger.events.includes("enter"))
      return "enter";
    if (wasInside && !isInside && trigger.events.includes("exit"))
      return "exit";
    if (isInside && trigger.events.includes("step")) return "step";
    return null;
  }

  runTrigger(trigger, eventType, sourceMapId, sourceVisitSerial, detail = {}) {
    if (this.triggerHasFired(trigger)) return false;
    if (trigger.condition && !this.evaluateCondition(trigger.condition))
      return false;

    this.markTriggerFired(trigger);
    this.runEffects(trigger.effects, {
      mapId: sourceMapId,
      ownerId: `map:${sourceMapId}:trigger:${trigger.id}`,
    });

    this.canvas.dispatchEvent(
      new CustomEvent("game-trigger", {
        detail: {
          mapId: sourceMapId,
          triggerId: trigger.id,
          eventType,
          ...detail,
        },
      }),
    );

    return (
      this.state.player.mapId !== sourceMapId ||
      this.state.random.currentRoomRuntime?.visitSerial !== sourceVisitSerial ||
      this.mode !== "world"
    );
  }

  handleMapTriggers() {
    if (this.mode !== "world") return false;

    const sourceMapId = this.activeMap.id;
    const sourceVisitSerial = this.state.random.currentRoomRuntime?.visitSerial;
    const previousIds = this.activeTriggerIds;
    const currentIds = this.getTriggerIdsAtTile();
    this.activeTriggerIds = currentIds;

    for (const trigger of this.activeMap.triggers) {
      const eventType = this.getTriggerMovementEvent(
        trigger,
        previousIds,
        currentIds,
      );
      if (!eventType) continue;
      if (this.runTrigger(trigger, eventType, sourceMapId, sourceVisitSerial))
        return true;
    }

    return false;
  }

  dispatchItemUse(itemId) {
    if (this.mode !== "world") return false;

    const sourceMapId = this.activeMap.id;
    const sourceVisitSerial = this.state.random.currentRoomRuntime?.visitSerial;
    const tile = this.player.getCurrentTile();
    let handled = false;

    for (const trigger of this.activeMap.triggers) {
      if (!trigger.events.includes("itemUse")) continue;
      if (trigger.itemId !== itemId || !this.isTileInsideTrigger(tile, trigger))
        continue;
      handled = true;
      if (
        this.runTrigger(trigger, "itemUse", sourceMapId, sourceVisitSerial, {
          itemId,
        })
      ) {
        break;
      }
    }

    this.canvas.dispatchEvent(
      new CustomEvent("game-item-use", {
        detail: { itemId, mapId: sourceMapId, handled },
      }),
    );
    return handled;
  }

  validatePlayerPosition(mapId, col, row, label) {
    const map =
      this.mapsById.get(mapId) ??
      this.maps.find((candidate) => candidate.id === mapId);
    if (!map) {
      throw new Error(`${label} references missing map "${mapId}".`);
    }

    const validCoordinate = (value) =>
      Number.isFinite(value) &&
      value >= 0 &&
      Math.abs(
        value * MOVEMENT_SUBDIVISIONS -
          Math.round(value * MOVEMENT_SUBDIVISIONS),
      ) < COLLISION_EPSILON;

    if (!validCoordinate(col) || !validCoordinate(row)) {
      throw new Error(
        `${label} must use non-negative quarter-cell col and row coordinates.`,
      );
    }

    if (col >= map.gridSize.width || row >= map.gridSize.height) {
      throw new Error(
        `${label} references position ${col},${row} outside "${mapId}".`,
      );
    }
  }

  getFootboxCells(x, y, footprint, map) {
    const left = x + footprint.offsetX;
    const top = y + footprint.offsetY;
    const right = left + footprint.width;
    const bottom = top + footprint.height;
    const mapWidth = map.gridSize.width * TILE_SIZE;
    const mapHeight = map.gridSize.height * TILE_SIZE;

    if (
      left < -COLLISION_EPSILON ||
      top < -COLLISION_EPSILON ||
      right > mapWidth + COLLISION_EPSILON ||
      bottom > mapHeight + COLLISION_EPSILON
    ) {
      return null;
    }

    const firstCol = Math.floor((left + COLLISION_EPSILON) / TILE_SIZE);
    const lastCol = Math.floor((right - COLLISION_EPSILON) / TILE_SIZE);
    const firstRow = Math.floor((top + COLLISION_EPSILON) / TILE_SIZE);
    const lastRow = Math.floor((bottom - COLLISION_EPSILON) / TILE_SIZE);
    const cells = [];

    for (let row = firstRow; row <= lastRow; row += 1) {
      for (let col = firstCol; col <= lastCol; col += 1) {
        cells.push({ col, row });
      }
    }

    return cells;
  }

  canFootboxOccupy(spatialData, map, x, y, footprint) {
    const cells = this.getFootboxCells(x, y, footprint, map);
    if (!cells) return false;

    return cells.every(({ col, row }) => {
      const key = `${col},${row}`;
      return spatialData.walkable.has(key) && !spatialData.collision.has(key);
    });
  }

  validatePlayerPlacement(spatialData, map, col, row, spriteId, label) {
    this.validatePlayerPosition(map.id, col, row, label);
    const footprint = this.getPlayerFootprint(spriteId);
    const x = col * TILE_SIZE;
    const y = row * TILE_SIZE;

    if (!this.canFootboxOccupy(spatialData, map, x, y, footprint)) {
      throw new Error(
        `${label} is outside walkable space or blocked by collision.`,
      );
    }
  }

  validateEntityTransform(transform, label) {
    requireObject(transform, `${label}.transform`);
    requireExactKeys(
      transform,
      new Set(["flipX", "flipY"]),
      `${label}.transform`,
    );
    requireBoolean(transform.flipX, `${label}.transform.flipX`);
    requireBoolean(transform.flipY, `${label}.transform.flipY`);
  }

  validateEntityVisualReference(mapId, visual, label) {
    requireObject(visual, `${label}.visual`);
    requireExactKeys(visual, new Set(["type", "id"]), `${label}.visual`);

    if (visual.type === "sprite") {
      this.validateSpriteReference(visual.id, `${label}.visual`);
      return;
    }

    if (visual.type === "tile") {
      requireInteger(visual.id, `${label}.visual.id`);
      const map = this.mapsById.get(mapId);
      if (!map?.tiles[visual.id]) {
        throw new Error(
          `${label}.visual references missing tile "${String(visual.id)}" in "${mapId}".`,
        );
      }
      return;
    }

    throw new Error(`${label}.visual.type must be "sprite" or "tile".`);
  }

  getEntityVisualDefinition(mapId, visual) {
    if (visual.type === "sprite") return this.spriteDefinitions.get(visual.id);
    return this.mapsById.get(mapId).tiles[visual.id];
  }

  getItemVisualDefinition(itemId) {
    const item = this.itemDefinitions.get(itemId);
    return this.spriteDefinitions.get(item.visual.id);
  }

  renderItemVisualPreview(ctx, itemId, elapsedMs) {
    const visual = this.getItemVisualDefinition(itemId);
    const image = this.images.get(visual.path);
    if (!image) return;

    const { canvas } = ctx;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = false;

    const [sourceWidth, sourceHeight] = visual.size;
    const scale = Math.min(
      canvas.width / sourceWidth,
      canvas.height / sourceHeight,
    );
    const width = Math.max(1, Math.floor(sourceWidth * scale));
    const height = Math.max(1, Math.floor(sourceHeight * scale));
    const drawX = Math.floor((canvas.width - width) / 2);
    const drawY = Math.floor((canvas.height - height) / 2);
    const animationId = resolveAnimationId(visual, [visual.defaultAnimation]);
    const frame = resolveVisualFrame(visual, animationId, elapsedMs);
    drawImageVisual(
      ctx,
      image,
      { ...visual, size: [width, height] },
      frame,
      drawX,
      drawY,
    );
  }

  getEntityOccupiedCells(mapId, col, row, visual) {
    if (visual.type !== "tile") return [{ col, row }];
    const tile = this.getEntityVisualDefinition(mapId, visual);
    return this.getOccupiedTileCells(col, row, tile);
  }

  validateEntityPlacement(mapId, col, row, visual, label) {
    this.validateMapPosition(mapId, col, row, label);
    const map = this.mapsById.get(mapId);
    const outside = this.getEntityOccupiedCells(mapId, col, row, visual).some(
      (cell) =>
        cell.col < 0 ||
        cell.row < 0 ||
        cell.col >= map.gridSize.width ||
        cell.row >= map.gridSize.height,
    );
    if (outside) {
      throw new Error(
        `${label} visual footprint extends outside map "${mapId}".`,
      );
    }
  }

  validateSpriteReference(spriteId, label) {
    if (typeof spriteId !== "string" || !this.spriteDefinitions.has(spriteId)) {
      throw new Error(
        `${label} references missing sprite "${String(spriteId)}".`,
      );
    }
  }

  validatePlayerSpriteReference(spriteId, label) {
    if (
      typeof spriteId !== "string" ||
      !this.playerSpriteDefinitions.has(spriteId)
    ) {
      throw new Error(
        `${label} references missing player sprite "${String(spriteId)}".`,
      );
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
      throw new Error(
        `${label} references missing layer "${layerName}" in "${mapId}".`,
      );
    }

    this.validateMapPosition(mapId, col, row, label);
    requireInteger(tileId, `${label}.tileId`);

    if (tileId !== EMPTY_TILE_ID && !map.tiles[tileId]) {
      throw new Error(
        `${label} references unknown tile ID ${String(tileId)} in "${mapId}".`,
      );
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
      throw new Error(
        `${label} cannot combine collision with a touch interaction.`,
      );
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

  validateMusicEffectReference(musicEffectId, label) {
    if (!this.audio.hasMusicEffect(musicEffectId)) {
      throw new Error(
        `${label} references missing music effect "${musicEffectId}".`,
      );
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

          for (const occupied of this.getOccupiedTileCells(
            colIndex,
            rowIndex,
            tile,
          )) {
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

      const occupiedCells = this.getEntityOccupiedCells(
        map.id,
        state.col,
        state.row,
        state.visual,
      );
      const entity = {
        mapId: map.id,
        entityId: definition.id,
        definition,
        state,
        occupiedCells,
      };
      visibleEntities.push(entity);

      const interaction = definition.interaction;
      const interactionActive =
        interaction &&
        (!interaction.condition ||
          this.evaluateCondition(interaction.condition, runtimeState));
      const target = interactionActive
        ? {
            kind: "entity",
            mapId: map.id,
            entityId: definition.id,
            definition,
            state,
            anchor: { col: state.col, row: state.row },
            interaction,
          }
        : null;

      for (const occupied of occupiedCells) {
        const key = `${occupied.col},${occupied.row}`;
        if (state.collision) collision.add(key);
        if (target) interactions.set(key, target);
      }
    }

    return {
      walkable,
      collision,
      interactions,
      entities: visibleEntities,
      bounds: {
        width: map.gridSize.width * TILE_SIZE,
        height: map.gridSize.height * TILE_SIZE,
      },
    };
  }

  isTilePresent(tile, runtimeState = this.state) {
    return (
      !tile.condition || this.evaluateCondition(tile.condition, runtimeState)
    );
  }

  isEntityPresent(definition, state, runtimeState = this.state) {
    if (!state.active) return false;
    return (
      !definition.condition ||
      this.evaluateCondition(definition.condition, runtimeState)
    );
  }

  getOccupiedTileCells(col, row, tile) {
    const offsets = tile.footprint ?? [[0, 0]];

    return offsets.map(([dc, dr]) => ({
      col: col + dc,
      row: row + dr,
    }));
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

    await Promise.all([...paths].map((path) => this.loadImage(path)));
    this.validateLoadedVisualImages();
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

  requestSave() {
    this.canvas.dispatchEvent(new CustomEvent("game-save-request"));
  }

  createSaveData() {
    if (this.mode !== "world" || this.player.isMoving) {
      throw new Error(
        "Cannot save or export unless the game is idle in world mode.",
      );
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
              patches.push({
                col: colIndex,
                row: rowIndex,
                tileId: runtimeTileId,
              });
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
        if (
          runtimeEntity.col !== definition.col ||
          runtimeEntity.row !== definition.row
        ) {
          changes.col = runtimeEntity.col;
          changes.row = runtimeEntity.row;
        }
        if (!entityVisualsEqual(runtimeEntity.visual, definition.visual)) {
          changes.visual = structuredClone(runtimeEntity.visual);
        }
        if (
          !entityTransformsEqual(runtimeEntity.transform, definition.transform)
        ) {
          changes.transform = structuredClone(runtimeEntity.transform);
        }
        if (runtimeEntity.collision !== definition.collision) {
          changes.collision = runtimeEntity.collision;
        }
        if (Object.keys(changes).length > 0) {
          entityChanges[definition.id] = changes;
        }
      }

      const mapChanges = {};
      if (Object.keys(layerChanges).length > 0)
        mapChanges.layers = layerChanges;
      if (Object.keys(entityChanges).length > 0)
        mapChanges.entities = entityChanges;
      if (Object.keys(mapChanges).length > 0) maps[map.id] = mapChanges;
    }

    const saveData = {
      version: SAVE_VERSION,
      savedAt: new Date().toISOString(),
      player: structuredClone(this.state.player),
      flags: structuredClone(this.state.flags),
      inventory: structuredClone(this.state.inventory),
      maps,
      random: structuredClone(this.state.random),
      triggerHistory: structuredClone(this.state.triggerHistory),
      music: {
        playback: this.audio.createSaveState(),
        playedEventIds: [...this.saveMusicEventIds].sort(),
      },
    };

    return saveData;
  }

  prepareSaveData(rawSaveData) {
    requirePlainObject(rawSaveData, "Save data");
    requireExactKeys(
      rawSaveData,
      new Set([
        "version",
        "savedAt",
        "player",
        "flags",
        "inventory",
        "maps",
        "random",
        "triggerHistory",
        "music",
      ]),
      "Save data",
    );

    if (rawSaveData.version !== SAVE_VERSION) {
      throw new Error(
        `Unsupported save version "${String(rawSaveData.version)}".`,
      );
    }

    requireString(rawSaveData.savedAt, "Save data.savedAt");
    const savedDate = new Date(rawSaveData.savedAt);
    if (
      Number.isNaN(savedDate.getTime()) ||
      savedDate.toISOString() !== rawSaveData.savedAt
    ) {
      throw new Error("Save data.savedAt must be an ISO timestamp.");
    }

    const candidate = createRuntimeState(this.maps);
    this.applySavedPlayer(candidate, rawSaveData.player);
    this.applySavedFlags(candidate, rawSaveData.flags);
    this.applySavedInventory(candidate, rawSaveData.inventory);
    this.applySavedMaps(candidate, rawSaveData.maps);
    this.applySavedRandom(candidate, rawSaveData.random);
    this.applySavedTriggerHistory(candidate, rawSaveData.triggerHistory);
    const music = this.prepareSavedMusic(rawSaveData.music);

    const activeMap = this.mapsById.get(candidate.player.mapId);
    const spatialData = this.buildSpatialData(activeMap, candidate);
    this.validatePlayerPlacement(
      spatialData,
      activeMap,
      candidate.player.col,
      candidate.player.row,
      candidate.player.spriteId,
      "Saved player position",
    );

    return {
      saveData: structuredClone(rawSaveData),
      state: candidate,
      spatialData,
      music,
    };
  }

  prepareSavedMusic(music) {
    requirePlainObject(music, "Save data.music");
    requireExactKeys(
      music,
      new Set(["playback", "playedEventIds"]),
      "Save data.music",
    );

    const playback = this.audio.validateSaveState(
      music.playback,
      "Save data.music.playback",
    );
    requireArray(music.playedEventIds, "Save data.music.playedEventIds");

    const validEventIds = new Set(
      this.maps.flatMap((map) =>
        (map.musicEvents ?? [])
          .filter(
            (event) =>
              (event.frequency ?? "once-per-visit") === "once-per-save",
          )
          .map((event) => `${map.id}:${event.id}`),
      ),
    );
    const seen = new Set();
    const playedEventIds = music.playedEventIds.map((eventId, index) => {
      requireString(eventId, `Save data.music.playedEventIds[${index}]`);
      if (seen.has(eventId)) {
        throw new Error(
          `Save data.music.playedEventIds contains duplicate "${eventId}".`,
        );
      }
      if (!validEventIds.has(eventId)) {
        throw new Error(
          `Save data.music.playedEventIds references missing once-per-save event "${eventId}".`,
        );
      }
      seen.add(eventId);
      return eventId;
    });

    return { playback, playedEventIds };
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
      throw new Error(
        `Save data.player references missing map "${player.mapId}".`,
      );
    }

    this.validatePlayerPosition(
      player.mapId,
      player.col,
      player.row,
      "Save data.player position",
    );

    const facing = player.facing;
    const cardinalFacing =
      facing &&
      Number.isInteger(facing.dc) &&
      Number.isInteger(facing.dr) &&
      Math.abs(facing.dc) + Math.abs(facing.dr) === 1;
    if (!cardinalFacing) {
      throw new Error(
        "Save data.player must define a cardinal facing direction.",
      );
    }

    this.validatePlayerSpriteReference(player.spriteId, "Save data.player");
    requirePositiveNumber(
      player.movementSpeed,
      "Save data.player.movementSpeed",
    );

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
      requireExactKeys(
        itemState,
        new Set(["quantity"]),
        `Saved item "${itemId}"`,
      );

      requirePositiveInteger(
        itemState.quantity,
        `Saved item "${itemId}".quantity`,
      );
    }

    candidate.inventory = structuredClone(inventory);
  }

  applySavedRandom(candidate, random) {
    requirePlainObject(random, "Save data.random");
    requireExactKeys(
      random,
      new Set([
        "version",
        "seed",
        "counters",
        "resolved",
        "roomVisits",
        "currentRoomRuntime",
      ]),
      "Save data.random",
    );

    if (random.version !== RANDOM_STATE_VERSION) {
      throw new Error(
        `Unsupported random-state version "${String(random.version)}".`,
      );
    }
    requireString(random.seed, "Save data.random.seed");
    if (!/^[0-9a-f]{8}$/i.test(random.seed)) {
      throw new Error(
        "Save data.random.seed must be an eight-digit hexadecimal string.",
      );
    }

    requirePlainObject(random.counters, "Save data.random.counters");
    for (const [counterId, value] of Object.entries(random.counters)) {
      requireString(counterId, "Random counter ID");
      requireNonNegativeInteger(value, `Random counter "${counterId}"`);
    }

    requirePlainObject(random.resolved, "Save data.random.resolved");
    for (const [decisionId, decision] of Object.entries(random.resolved)) {
      requireString(decisionId, "Resolved random decision ID");
      requirePlainObject(decision, `Resolved random decision "${decisionId}"`);
      requireExactKeys(
        decision,
        new Set(["choiceIndex", "consumed"]),
        `Resolved random decision "${decisionId}"`,
      );
      requireNonNegativeInteger(
        decision.choiceIndex,
        `Resolved random decision "${decisionId}".choiceIndex`,
      );
      if (decision.consumed !== undefined) {
        requireBoolean(
          decision.consumed,
          `Resolved random decision "${decisionId}".consumed`,
        );
      }
    }

    requirePlainObject(random.roomVisits, "Save data.random.roomVisits");
    for (const [mapId, visitSerial] of Object.entries(random.roomVisits)) {
      if (!this.mapsById.has(mapId)) {
        throw new Error(
          `Save data.random.roomVisits references missing map "${mapId}".`,
        );
      }
      requirePositiveInteger(visitSerial, `Room visit serial for "${mapId}"`);
    }

    const roomRuntime = random.currentRoomRuntime;
    requirePlainObject(roomRuntime, "Save data.random.currentRoomRuntime");
    requireExactKeys(
      roomRuntime,
      new Set(["mapId", "visitSerial", "entityOverrides", "triggerFires"]),
      "Save data.random.currentRoomRuntime",
    );
    requireString(
      roomRuntime.mapId,
      "Save data.random.currentRoomRuntime.mapId",
    );
    if (roomRuntime.mapId !== candidate.player.mapId) {
      throw new Error(
        "Saved current room runtime must match the player's map.",
      );
    }
    requirePositiveInteger(
      roomRuntime.visitSerial,
      "Save data.random.currentRoomRuntime.visitSerial",
    );
    if (random.roomVisits[roomRuntime.mapId] !== roomRuntime.visitSerial) {
      throw new Error(
        "Saved current room visit serial does not match roomVisits.",
      );
    }
    requirePlainObject(
      roomRuntime.entityOverrides,
      "Save data.random.currentRoomRuntime.entityOverrides",
    );
    for (const [entityId, override] of Object.entries(
      roomRuntime.entityOverrides,
    )) {
      this.validateEntityReference(
        roomRuntime.mapId,
        entityId,
        "Saved room entity override",
      );
      requirePlainObject(
        override,
        `Save data.random.currentRoomRuntime.entityOverrides.${entityId}`,
      );
      requireExactKeys(
        override,
        new Set(["active"]),
        `Save data.random.currentRoomRuntime.entityOverrides.${entityId}`,
      );
      requireBoolean(
        override.active,
        `Save data.random.currentRoomRuntime.entityOverrides.${entityId}.active`,
      );
    }

    requirePlainObject(
      roomRuntime.triggerFires,
      "Save data.random.currentRoomRuntime.triggerFires",
    );
    const currentMap = this.mapsById.get(roomRuntime.mapId);
    const currentTriggerIds = new Set(
      currentMap.triggers
        .filter(
          (trigger) => (trigger.frequency ?? "always") === "once-per-visit",
        )
        .map((trigger) => trigger.id),
    );
    for (const [triggerId, fired] of Object.entries(roomRuntime.triggerFires)) {
      if (!currentTriggerIds.has(triggerId)) {
        throw new Error(
          `Save data.random.currentRoomRuntime.triggerFires references missing once-per-visit trigger "${triggerId}" in "${roomRuntime.mapId}".`,
        );
      }
      requireBoolean(
        fired,
        `Save data.random.currentRoomRuntime.triggerFires.${triggerId}`,
      );
    }

    candidate.random = structuredClone(random);
  }

  applySavedTriggerHistory(candidate, triggerHistory) {
    requirePlainObject(triggerHistory, "Save data.triggerHistory");
    requireExactKeys(
      triggerHistory,
      new Set(["oncePerSave"]),
      "Save data.triggerHistory",
    );
    requirePlainObject(
      triggerHistory.oncePerSave,
      "Save data.triggerHistory.oncePerSave",
    );

    const validIds = new Set(
      this.maps.flatMap((map) =>
        map.triggers
          .filter(
            (trigger) => (trigger.frequency ?? "always") === "once-per-save",
          )
          .map((trigger) => `${map.id}:${trigger.id}`),
      ),
    );

    for (const [triggerKey, fired] of Object.entries(
      triggerHistory.oncePerSave,
    )) {
      if (!validIds.has(triggerKey)) {
        throw new Error(
          `Save data.triggerHistory.oncePerSave references missing trigger "${triggerKey}".`,
        );
      }
      requireBoolean(
        fired,
        `Save data.triggerHistory.oncePerSave.${triggerKey}`,
      );
    }

    candidate.triggerHistory = structuredClone(triggerHistory);
  }

  applySavedMaps(candidate, savedMaps) {
    requirePlainObject(savedMaps, "Save data.maps");

    for (const [mapId, mapChanges] of Object.entries(savedMaps)) {
      const map = this.mapsById.get(mapId);
      if (!map) {
        throw new Error(`Save data references missing map "${mapId}".`);
      }

      requirePlainObject(mapChanges, `Saved map "${mapId}"`);
      requireExactKeys(
        mapChanges,
        new Set(["layers", "entities"]),
        `Saved map "${mapId}"`,
      );
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
        throw new Error(
          `Saved map "${map.id}" references missing layer "${layerName}".`,
        );
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
        candidate.maps[map.id].layers[layerName][patch.row][patch.col] =
          patch.tileId;
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
        new Set(["active", "col", "row", "visual", "transform", "collision"]),
        `Saved entity "${map.id}.${entityId}"`,
      );
      if (Object.keys(changes).length === 0) {
        throw new Error(
          `Saved entity "${map.id}.${entityId}" contains no changes.`,
        );
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
        requireBoolean(
          changes.active,
          `Saved entity "${map.id}.${entityId}".active`,
        );
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

      if (Object.hasOwn(changes, "visual")) {
        this.validateEntityVisualReference(
          map.id,
          changes.visual,
          `Saved entity "${map.id}.${entityId}"`,
        );
        runtimeEntity.visual = structuredClone(changes.visual);
      }

      if (Object.hasOwn(changes, "transform")) {
        this.validateEntityTransform(
          changes.transform,
          `Saved entity "${map.id}.${entityId}"`,
        );
        runtimeEntity.transform = structuredClone(changes.transform);
      }

      if (Object.hasOwn(changes, "collision")) {
        requireBoolean(
          changes.collision,
          `Saved entity "${map.id}.${entityId}".collision`,
        );
        runtimeEntity.collision = changes.collision;
      }

      this.validateEntityPlacement(
        map.id,
        runtimeEntity.col,
        runtimeEntity.row,
        runtimeEntity.visual,
        `Saved entity "${map.id}.${entityId}"`,
      );

      const definition = this.entityDefinitionsByMap.get(map.id).get(entityId);
      this.validateEntityCollisionInteraction(
        runtimeEntity.collision,
        definition.interaction,
        `Saved entity "${map.id}.${entityId}"`,
      );
    }
  }

  async applyPreparedSave(prepared) {
    if (
      !prepared ||
      !prepared.state ||
      !prepared.spatialData ||
      !prepared.music
    ) {
      throw new Error("Prepared save data is invalid.");
    }

    this.dialogueBox.reset();
    this.inventoryPanel.hide();
    this.input.clearMovement();

    this.state = prepared.state;
    this.player = new Player(
      TILE_SIZE,
      this.state.player,
      this.getPlayerFootprint(this.state.player.spriteId),
    );
    this.resetPlayerAnimation();
    this.activeSpatialData = prepared.spatialData;
    this.syncTouchTargets();
    this.syncTriggerMembership();
    this.selectedItemId = Object.keys(this.state.inventory)[0] ?? null;
    this.mode = "world";
    this.initializeCameraForActiveMap();
    this.eventLogElement.textContent = "";
    this.saveMusicEventIds = new Set(prepared.music.playedEventIds);
    await this.audio.restoreSaveState(prepared.music.playback);

    this.refreshInventoryPanel();
    this.updateCamera(0);
    this.setStatus(`Map: ${this.state.player.mapId} -- Save loaded`);
  }

  bindAudioDebugControls() {
    if (!this.audioDebugElement) return;

    this.audioDebugElement
      .querySelector("[data-audio-debug-fade]")
      ?.addEventListener("click", () => {
        const next = this.audio.debugFadeMultiplier < 1 ? 1 : 0.2;
        this.audio.setDebugFade(next, 400);
        this.updateAudioDebug();
      });
    this.audioDebugElement
      .querySelector("[data-audio-debug-restart]")
      ?.addEventListener("click", () => {
        void this.audio.restartMusic({ fadeOutMs: 250, fadeInMs: 250 });
      });
    this.audioDebugElement
      .querySelector("[data-audio-debug-stop]")
      ?.addEventListener("click", () => {
        void this.audio.stopMusic({ fadeOutMs: 400 });
      });
  }

  formatAudioTime(seconds) {
    return Number.isFinite(seconds) ? `${seconds.toFixed(1)} s` : "--";
  }

  updateAudioDebug() {
    if (!this.audioDebugElement) return;
    const debug = this.audio.getDebugState();
    const current = debug.current;
    const values = {
      bgm: current ? `${debug.title} (${current.trackId})` : "Silence",
      position: current
        ? `${this.formatAudioTime(current.position)} / ` +
          this.formatAudioTime(debug.duration)
        : "--",
      volume: current ? debug.effectiveVolume.toFixed(2) : "0.00",
      rate: current ? current.playbackRate.toFixed(2) : "--",
      continuity: current?.continuityId ?? "--",
      stack: String(debug.stackDepth),
      me: debug.musicEffectId ?? "--",
    };

    for (const [field, value] of Object.entries(values)) {
      if (this.audioDebugFields[field])
        this.audioDebugFields[field].textContent = value;
    }
  }

  playSound(soundId) {
    this.audio.playSound(soundId);
  }

  playMusic(options) {
    void this.audio.playMusic(options);
  }

  stopMusic(options = {}) {
    void this.audio.stopMusic(options);
  }

  pushMusic(options) {
    void this.audio.pushMusic(options);
  }

  popMusic(options = {}) {
    void this.audio.popMusic(options);
  }

  playMusicEffect(musicEffectId, options = {}) {
    void this.audio.playMusicEffect(musicEffectId, options);
  }

  //TODO: should this be async?
  showText({ pages, speaker, afterClose, mapId, ownerId }) {
    if (this.mode !== "world") {
      throw new Error(
        `Cannot open dialogue while game mode is "${this.mode}".`,
      );
    }

    this.mode = "dialogue";
    this.input.clearMovement();

    return new Promise((resolve) => {
      this.dialogueBox.open({
        pages: [...pages],
        speaker,
        onClose: () => {
          this.mode = "world";
          const result =
            afterClose === null
              ? undefined
              : this.runEffects(afterClose, { mapId, ownerId });
          if (result && typeof result.then === "function") {
            void result.then(resolve);
          } else {
            resolve();
          }
        },
      });
    });
  }

  advanceDialogue() {
    if (this.mode !== "dialogue") {
      throw new Error(
        "Cannot advance dialogue while dialogue mode is inactive.",
      );
    }

    this.dialogueBox.advance();
  }

  getMusicTransitionPolicy(map, transition) {
    return transition.musicTransition ?? map.musicTransition ?? null;
  }

  getMusicTransitionDuration(map, transition) {
    return transition.musicTransitionMs ?? map.musicTransitionMs ?? 700;
  }

  applyMapMusic(map, transition = {}) {
    const policy = this.getMusicTransitionPolicy(map, transition);
    const durationMs = this.getMusicTransitionDuration(map, transition);

    if (policy === "inherit") return;
    if (policy === "silence") {
      this.stopMusic({ fadeOutMs: durationMs });
      return;
    }

    const resolved = resolveMapMusic(map.music, (condition) =>
      this.evaluateCondition(condition),
    );

    if (resolved.kind === "inherit") return;
    if (resolved.kind === "silence") {
      this.stopMusic({ fadeOutMs: durationMs });
      return;
    }

    const options = { ...resolved.options };
    if (policy === "crossfade" && options.crossfadeMs === undefined) {
      options.crossfadeMs = durationMs;
    }

    this.playMusic(options);
  }

  refreshActiveMapMusic() {
    if (!this.activeMap) return;
    this.applyMapMusic(this.activeMap, { musicTransition: "replace" });
  }

  runMapMusicEntryEvents(map, entryId) {
    const roomRuntime = this.state.random.currentRoomRuntime;

    for (const event of map.musicEvents ?? []) {
      if (event.entryId !== undefined && event.entryId !== entryId) continue;
      if (event.condition && !this.evaluateCondition(event.condition)) continue;

      const eventKey = `${map.id}:${event.id}`;
      const frequency = event.frequency ?? "once-per-visit";
      if (!MUSIC_EVENT_FREQUENCIES.has(frequency)) {
        throw new Error(`Unknown music event frequency "${frequency}".`);
      }
      if (
        frequency === "first-entry" &&
        this.sessionMusicEventIds.has(eventKey)
      ) {
        continue;
      }
      if (
        frequency === "once-per-save" &&
        this.saveMusicEventIds.has(eventKey)
      ) {
        continue;
      }

      if (frequency === "first-entry") this.sessionMusicEventIds.add(eventKey);
      if (frequency === "once-per-save") this.saveMusicEventIds.add(eventKey);

      if (event.probability !== undefined) {
        const occurrence =
          frequency === "once-per-visit"
            ? `${map.id}:${roomRuntime?.visitSerial ?? 0}`
            : frequency;
        const value = deterministicFloat(
          this.state.random.seed,
          `map:${map.id}:music-event:${event.id}:probability`,
          occurrence,
        );
        if (value >= event.probability) continue;
      }

      this.runEffects(event.effects, {
        mapId: map.id,
        ownerId: `map:${map.id}:music-event:${event.id}`,
      });
    }
  }

  runActiveMapExitEvents() {
    const roomRuntime = this.state.random.currentRoomRuntime;
    if (!roomRuntime || this.runningExitEvents) return true;

    const sourceMapId = this.state.player.mapId;
    const map = this.mapsById.get(sourceMapId);
    this.runningExitEvents = true;
    try {
      if (map.onExit !== undefined) {
        this.runEffects(map.onExit, {
          mapId: sourceMapId,
          ownerId: `map:${sourceMapId}:onExit`,
        });
      }
    } finally {
      this.runningExitEvents = false;
    }

    return this.state.player.mapId === sourceMapId && this.mode === "world";
  }

  establishRoomRuntime(mapId) {
    const visits = (this.state.random.roomVisits[mapId] ?? 0) + 1;
    this.state.random.roomVisits[mapId] = visits;
    this.state.random.currentRoomRuntime = {
      mapId,
      visitSerial: visits,
      entityOverrides: {},
      triggerFires: {},
    };
  }

  transitionTo(transition, { exitEventsHandled = false } = {}) {
    if (this.mode === "dialogue") {
      throw new Error("Cannot transition while dialogue is open.");
    }

    if (!exitEventsHandled && !this.runActiveMapExitEvents()) return;

    if (transition.inheritCamera !== undefined) {
      requireBoolean(transition.inheritCamera, "Transition.inheritCamera");
    }

    const mapId = transition.mapId;
    const map = this.mapsById.get(mapId);
    if (!map) throw new Error(`Transition references missing map "${mapId}".`);
    const usesEntry = Object.hasOwn(transition, "entryId");
    const position = usesEntry
      ? map.entries[transition.entryId]
      : transition.position;
    if (!position)
      throw new Error(`Transition to "${mapId}" has no valid destination.`);
    const statusTarget = usesEntry
      ? `Entry: ${transition.entryId}`
      : `Position: ${position.col},${position.row}`;

    const preEntryState = {
      ...this.state,
      random: {
        ...this.state.random,
        currentRoomRuntime: null,
      },
    };
    const preEntrySpatialData = this.buildSpatialData(map, preEntryState);
    this.validatePlayerPlacement(
      preEntrySpatialData,
      map,
      position.col,
      position.row,
      this.state.player.spriteId,
      "Transition position",
    );

    this.inventoryPanel.hide();
    this.mode = "world";
    this.state.random.currentRoomRuntime = null;
    this.state.player.mapId = mapId;
    this.establishRoomRuntime(mapId);
    this.player.setPosition(position.col, position.row);
    this.player.setFacing(position.facing.dc, position.facing.dr);
    this.resetPlayerAnimation();
    this.activeSpatialData = this.buildSpatialData(map);
    this.syncTouchTargets();
    this.syncTriggerMembership();

    this.initializeCameraForActiveMap({
      inheritRendered: transition.inheritCamera === true,
    });

    this.applyMapMusic(map, transition);
    this.runMapMusicEntryEvents(map, usesEntry ? transition.entryId : null);
    if (map.onEnter !== undefined) {
      this.runEffects(map.onEnter, {
        mapId,
        ownerId: `map:${mapId}:onEnter`,
      });
    }

    if (this.state.player.mapId !== mapId) return;
    this.updateCamera(0);
    this.setStatus(`Map: ${mapId} -- ${statusTarget}`);
  }

  rebuildActiveSpatialData() {
    this.activeSpatialData = this.buildSpatialData(this.activeMap);
    this.syncTouchTargets();
  }

  refreshSpatialDataAfterMutation(mapId, label) {
    if (this.state.player.mapId !== mapId) return;

    const spatialData = this.buildSpatialData(this.mapsById.get(mapId));
    this.validatePlayerPlacement(
      spatialData,
      this.activeMap,
      this.player.col,
      this.player.row,
      this.state.player.spriteId,
      `${label} would invalidate the player position`,
    );
    this.activeSpatialData = spatialData;
    this.syncTouchTargets();
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
    this.refreshActiveMapMusic();
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

    this.refreshActiveMapMusic();
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

    this.refreshActiveMapMusic();
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
    const nextIndex =
      (currentIndex + Math.sign(step) + itemIds.length) % itemIds.length;
    this.selectedItemId = itemIds[nextIndex];
    this.refreshInventoryPanel();
    return true;
  }

  useSelectedItem() {
    if (this.mode !== "inventory" || this.selectedItemId === null) return false;

    const itemId = this.selectedItemId;
    const item = this.itemDefinitions.get(itemId);
    if (!item.usable) return false;

    const sourceMapId = this.state.player.mapId;
    this.closeInventory();
    const dispatchContextualUse = () => {
      if (this.mode !== "world" || this.state.player.mapId !== sourceMapId)
        return;
      this.dispatchItemUse(itemId);
    };
    const result = item.effects
      ? this.runEffects(item.effects, {
          mapId: sourceMapId,
          ownerId: `item:${itemId}`,
        })
      : undefined;
    if (result && typeof result.then === "function") {
      void result.then(dispatchContextualUse);
    } else {
      dispatchContextualUse();
    }
    return true;
  }

  refreshInventoryPanel() {
    this.inventoryPanel.render(
      this.state.inventory,
      this.itemDefinitions,
      this.selectedItemId,
    );
  }

  evaluateCondition(condition, runtimeState = this.state) {
    return evaluateCondition(runtimeState, condition);
  }

  runEffects(effects, { mapId, ownerId }) {
    return runEffects(this, effects, { mapId, ownerId });
  }

  getRandomEventKey(ownerId, randomId) {
    requireString(ownerId, "Random effect owner ID");
    return `${ownerId}:${randomId}`;
  }

  resolveRandomChoice(randomDefinition, { mapId, ownerId }) {
    const eventKey = this.getRandomEventKey(ownerId, randomDefinition.id);
    const randomState = this.state.random;
    const scope = randomDefinition.scope;

    if (scope === "once") {
      const prior = randomState.resolved[eventKey];
      if (prior?.consumed === true) return null;

      const randomValue = deterministicFloat(
        randomState.seed,
        eventKey,
        "once",
      );
      const choiceIndex = chooseWeightedIndex(
        randomDefinition.choices,
        randomValue,
      );
      randomState.resolved[eventKey] = { choiceIndex, consumed: true };
      return {
        choiceIndex,
        choice: randomDefinition.choices[choiceIndex],
        eventKey,
      };
    }

    if (scope === "save") {
      let choiceIndex = randomState.resolved[eventKey]?.choiceIndex;
      if (choiceIndex === undefined) {
        const randomValue = deterministicFloat(
          randomState.seed,
          eventKey,
          "save",
        );
        choiceIndex = chooseWeightedIndex(
          randomDefinition.choices,
          randomValue,
        );
        randomState.resolved[eventKey] = { choiceIndex };
      }
      if (choiceIndex >= randomDefinition.choices.length) {
        throw new Error(
          `Saved random decision "${eventKey}" references missing choice ${choiceIndex}.`,
        );
      }
      return {
        choiceIndex,
        choice: randomDefinition.choices[choiceIndex],
        eventKey,
      };
    }

    if (scope === "roomVisit") {
      const roomRuntime = randomState.currentRoomRuntime;
      if (!roomRuntime || roomRuntime.mapId !== mapId) {
        throw new Error(
          `Random event "${eventKey}" requires an active room visit for "${mapId}".`,
        );
      }
      const token = `${mapId}:${roomRuntime.visitSerial}`;
      const randomValue = deterministicFloat(randomState.seed, eventKey, token);
      const choiceIndex = chooseWeightedIndex(
        randomDefinition.choices,
        randomValue,
      );
      return {
        choiceIndex,
        choice: randomDefinition.choices[choiceIndex],
        eventKey,
      };
    }

    if (scope === "interaction" || scope === "use") {
      const counterKey = `${scope}:${eventKey}`;
      const occurrence = randomState.counters[counterKey] ?? 0;
      const randomValue = deterministicFloat(
        randomState.seed,
        eventKey,
        occurrence,
      );
      const choiceIndex = chooseWeightedIndex(
        randomDefinition.choices,
        randomValue,
      );
      randomState.counters[counterKey] = occurrence + 1;
      return {
        choiceIndex,
        choice: randomDefinition.choices[choiceIndex],
        eventKey,
      };
    }

    throw new Error(`Unsupported random scope "${scope}".`);
  }

  runRandomEffect(effect, context) {
    const resolved = this.resolveRandomChoice(effect, context);
    if (!resolved) return;
    if (resolved.choice.effects.length === 0) return;
    return this.runEffects(resolved.choice.effects, context);
  }

  getPlayerFacingName() {
    const { dc, dr } = this.player.facing;
    if (dr < 0) return "up";
    if (dr > 0) return "down";
    if (dc < 0) return "left";
    return "right";
  }

  resolveRequestedPlayerAnimationId(sprite) {
    if (sprite.kind !== "image" || !sprite.animations) return null;

    const direction = this.getPlayerFacingName();
    const movementState = this.player.isMoving ? "walk" : "idle";

    return resolveAnimationId(sprite, [
      `${movementState}-${direction}`,
      `idle-${direction}`,
      sprite.defaultAnimation,
    ]);
  }

  resetPlayerAnimation() {
    const spriteId = this.state.player.spriteId;
    const sprite = this.playerSpriteDefinitions.get(spriteId);
    const animationId = sprite
      ? this.resolveRequestedPlayerAnimationId(sprite)
      : null;

    this.playerAnimation = {
      spriteId,
      animationId,
      elapsedMs: 0,
    };
  }

  updatePlayerAnimation(deltaMs) {
    const spriteId = this.state.player.spriteId;
    const sprite = this.playerSpriteDefinitions.get(spriteId);
    const animationId = this.resolveRequestedPlayerAnimationId(sprite);

    if (
      this.playerAnimation.spriteId !== spriteId ||
      this.playerAnimation.animationId !== animationId
    ) {
      this.playerAnimation.spriteId = spriteId;
      this.playerAnimation.animationId = animationId;
      this.playerAnimation.elapsedMs = 0;
      return;
    }

    if (animationId !== null) {
      this.playerAnimation.elapsedMs += deltaMs;
    }
  }

  setPlayerSprite(spriteId) {
    this.validatePlayerSpriteReference(spriteId, "Setting player sprite");
    const footprint = this.getPlayerFootprint(spriteId);

    if (
      !this.canFootboxOccupy(
        this.activeSpatialData,
        this.activeMap,
        this.player.x,
        this.player.y,
        footprint,
      )
    ) {
      throw new Error(
        `Player sprite "${spriteId}" does not fit at the current position.`,
      );
    }

    this.state.player.spriteId = spriteId;
    this.player.setFootprint(footprint);
    this.resetPlayerAnimation();
    this.syncTouchTargets();
  }

  setPlayerMoveSpeed(tilesPerSecond) {
    requirePositiveNumber(tilesPerSecond, "Player movement speed");
    this.state.player.movementSpeed = tilesPerSecond;
  }

  getEntityState(mapId, entityId, runtimeState = this.state) {
    const persistentState = runtimeState.maps[mapId].entities[entityId];
    const roomRuntime = runtimeState.random?.currentRoomRuntime;
    const override =
      roomRuntime?.mapId === mapId
        ? roomRuntime.entityOverrides?.[entityId]
        : undefined;
    return override ? { ...persistentState, ...override } : persistentState;
  }

  getPersistentEntityState(mapId, entityId, runtimeState = this.state) {
    return runtimeState.maps[mapId].entities[entityId];
  }

  setEntityActive(
    mapId,
    entityId,
    active,
    { persistence = "persistent" } = {},
  ) {
    this.validateEntityReference(
      mapId,
      entityId,
      "Setting entity active state",
    );
    requireBoolean(active, `Entity "${entityId}" active state`);

    if (persistence === "roomVisit") {
      const roomRuntime = this.state.random.currentRoomRuntime;
      if (
        !roomRuntime ||
        roomRuntime.mapId !== mapId ||
        this.state.player.mapId !== mapId
      ) {
        throw new Error(
          `Room-visit entity override for "${entityId}" must target the active map.`,
        );
      }

      const previousOverride = roomRuntime.entityOverrides[entityId]
        ? { ...roomRuntime.entityOverrides[entityId] }
        : null;
      this.applySpatialMutation(
        mapId,
        `Changing temporary active state for entity "${entityId}" in "${mapId}"`,
        () => {
          roomRuntime.entityOverrides[entityId] = {
            ...(roomRuntime.entityOverrides[entityId] ?? {}),
            active,
          };
        },
        () => {
          if (previousOverride)
            roomRuntime.entityOverrides[entityId] = previousOverride;
          else delete roomRuntime.entityOverrides[entityId];
        },
      );
      return;
    }

    if (persistence !== "persistent") {
      throw new Error(`Unknown entity persistence "${persistence}".`);
    }

    const state = this.getPersistentEntityState(mapId, entityId);
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
    const state = this.getPersistentEntityState(mapId, entityId);
    this.validateEntityPlacement(
      mapId,
      col,
      row,
      state.visual,
      `Entity "${entityId}" position`,
    );

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

  setEntityVisual(mapId, entityId, visual) {
    this.validateEntityReference(mapId, entityId, "Setting entity visual");
    this.validateEntityVisualReference(mapId, visual, `Entity "${entityId}"`);

    const state = this.getPersistentEntityState(mapId, entityId);
    this.validateEntityPlacement(
      mapId,
      state.col,
      state.row,
      visual,
      `Entity "${entityId}"`,
    );

    const previousVisual = structuredClone(state.visual);
    this.applySpatialMutation(
      mapId,
      `Changing visual for entity "${entityId}" in "${mapId}"`,
      () => {
        state.visual = structuredClone(visual);
      },
      () => {
        state.visual = previousVisual;
      },
    );
  }

  setEntityCollision(mapId, entityId, collision) {
    this.validateEntityReference(mapId, entityId, "Setting entity collision");
    requireBoolean(collision, `Entity "${entityId}" collision`);

    const state = this.getPersistentEntityState(mapId, entityId);
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

  canPlayerOccupy(x, y) {
    return this.canFootboxOccupy(
      this.activeSpatialData,
      this.activeMap,
      x,
      y,
      this.player.footprint,
    );
  }

  attemptPlayerMovement(dc, dr, facing) {
    if (this.mode !== "world" || this.player.isMoving) return false;

    this.player.setFacing(facing.dc, facing.dr);
    const target = this.player.getStepTarget(dc, dr);
    const targetIsOpen = this.canPlayerOccupy(target.x, target.y);

    if (dc !== 0 && dr !== 0) {
      const horizontalTarget = this.player.getStepTarget(dc, 0);
      const verticalTarget = this.player.getStepTarget(0, dr);
      const horizontalIsOpen = this.canPlayerOccupy(
        horizontalTarget.x,
        horizontalTarget.y,
      );
      const verticalIsOpen = this.canPlayerOccupy(
        verticalTarget.x,
        verticalTarget.y,
      );

      if (targetIsOpen && horizontalIsOpen && verticalIsOpen) {
        this.player.beginStep(dc, dr);
        return true;
      }

      const exitAttempt = this.getExitAttempt(
        target.x,
        target.y,
        dc,
        dr,
        targetIsOpen,
      );
      const exitAxisIsOpen =
        exitAttempt &&
        (exitAttempt.edge === "west" || exitAttempt.edge === "east")
          ? verticalIsOpen
          : horizontalIsOpen;
      if (exitAttempt && exitAxisIsOpen && this.tryExecuteExit(exitAttempt))
        return true;

      const horizontalFirst = facing.dc !== 0;
      const slideCandidates = horizontalFirst
        ? [
            { dc, dr: 0, open: horizontalIsOpen },
            { dc: 0, dr, open: verticalIsOpen },
          ]
        : [
            { dc: 0, dr, open: verticalIsOpen },
            { dc, dr: 0, open: horizontalIsOpen },
          ];

      for (const candidate of slideCandidates) {
        if (!candidate.open) continue;
        this.player.beginStep(candidate.dc, candidate.dr);
        return true;
      }

      return false;
    }

    if (targetIsOpen) {
      this.player.beginStep(dc, dr);
      return true;
    }

    const exitAttempt = this.getExitAttempt(
      target.x,
      target.y,
      dc,
      dr,
      targetIsOpen,
    );
    return exitAttempt ? this.tryExecuteExit(exitAttempt) : false;
  }

  getExitAttempt(targetX, targetY, dc, dr, targetIsOpen) {
    if (targetIsOpen) return null;

    const footbox = this.player.getFootboxAt(targetX, targetY);
    const mapWidth = this.activeMap.gridSize.width * TILE_SIZE;
    const mapHeight = this.activeMap.gridSize.height * TILE_SIZE;
    const touchedCells = this.getFootboxCells(
      targetX,
      targetY,
      this.player.footprint,
      this.activeMap,
    );

    if (
      touchedCells?.some(({ col, row }) =>
        this.activeSpatialData.collision.has(`${col},${row}`),
      )
    ) {
      return null;
    }

    const boundaryIsNotWalkable = (edge) => {
      if (!touchedCells) return false;

      return touchedCells.some(({ col, row }) => {
        const onEdge =
          (edge === "west" && col === 0) ||
          (edge === "east" && col === this.activeMap.gridSize.width - 1) ||
          (edge === "north" && row === 0) ||
          (edge === "south" && row === this.activeMap.gridSize.height - 1);

        return onEdge && !this.activeSpatialData.walkable.has(`${col},${row}`);
      });
    };

    const edges = [];
    if (dc < 0 && (footbox.x < 0 || boundaryIsNotWalkable("west"))) {
      edges.push("west");
    }
    if (
      dc > 0 &&
      (footbox.x + footbox.width > mapWidth || boundaryIsNotWalkable("east"))
    ) {
      edges.push("east");
    }
    if (dr < 0 && (footbox.y < 0 || boundaryIsNotWalkable("north"))) {
      edges.push("north");
    }
    if (
      dr > 0 &&
      (footbox.y + footbox.height > mapHeight || boundaryIsNotWalkable("south"))
    ) {
      edges.push("south");
    }

    if (edges.length !== 1) return null;

    const edge = edges[0];
    const currentTile = this.player.getCurrentTile();
    const horizontalEdge = edge === "west" || edge === "east";
    const rangeAxis = horizontalEdge ? currentTile.row : currentTile.col;
    const sourceAxis = horizontalEdge ? this.player.row : this.player.col;
    const movementDirection =
      edge === "west"
        ? { dc: -1, dr: 0 }
        : edge === "east"
          ? { dc: 1, dr: 0 }
          : edge === "north"
            ? { dc: 0, dr: -1 }
            : { dc: 0, dr: 1 };

    return { edge, rangeAxis, sourceAxis, movementDirection };
  }

  resolveExitDestination(exit) {
    if (exit.destination?.type !== "random") return exit;

    const resolved = this.resolveRandomChoice(exit.destination, {
      mapId: this.activeMap.id,
      ownerId: `map:${this.activeMap.id}:exit:${exit.id}`,
    });
    return resolved?.choice ?? null;
  }

  tryExecuteExit(exitAttempt) {
    const exit = this.activeMap.exits.find(
      (candidate) =>
        candidate.edge === exitAttempt.edge &&
        exitAttempt.rangeAxis >= candidate.range[0] &&
        exitAttempt.rangeAxis <= candidate.range[1],
    );
    if (!exit) return false;

    if (!this.runActiveMapExitEvents()) return true;
    const destination = this.resolveExitDestination(exit);
    if (!destination) return true;

    if (Object.hasOwn(destination, "targetEdge")) {
      const targetMap = this.mapsById.get(destination.targetMapId);
      const targetPosition = this.getEdgeExitPosition(
        exit,
        destination,
        exitAttempt.sourceAxis,
      );
      const targetSpatialData = this.buildSpatialData(targetMap);
      const targetIsOpen = this.canFootboxOccupy(
        targetSpatialData,
        targetMap,
        targetPosition.col * TILE_SIZE,
        targetPosition.row * TILE_SIZE,
        this.player.footprint,
      );
      if (!targetIsOpen) return false;
    }

    this.executeEdgeExit(
      exit,
      destination,
      exitAttempt.sourceAxis,
      exitAttempt.movementDirection,
    );
    return true;
  }

  executeEdgeExit(exit, destination, sourceAxis, movementDirection) {
    if (Object.hasOwn(destination, "entryId")) {
      this.transitionTo(
        {
          mapId: destination.targetMapId,
          entryId: destination.entryId,
          musicTransition: destination.musicTransition,
          musicTransitionMs: destination.musicTransitionMs,
          inheritCamera: destination.inheritCamera,
        },
        { exitEventsHandled: true },
      );
      return;
    }

    if (Object.hasOwn(destination, "targetPosition")) {
      this.transitionTo(
        {
          mapId: destination.targetMapId,
          position: structuredClone(destination.targetPosition),
          musicTransition: destination.musicTransition,
          musicTransitionMs: destination.musicTransitionMs,
          inheritCamera: destination.inheritCamera,
        },
        { exitEventsHandled: true },
      );
      return;
    }

    const position = this.getEdgeExitPosition(exit, destination, sourceAxis);
    this.transitionTo(
      {
        mapId: destination.targetMapId,
        musicTransition: destination.musicTransition,
        musicTransitionMs: destination.musicTransitionMs,
        inheritCamera: destination.inheritCamera,
        position: {
          ...position,
          facing: { ...movementDirection },
        },
      },
      { exitEventsHandled: true },
    );
  }

  handleActionInteraction() {
    if (this.mode !== "world") return false;

    const target = this.player.getActionInteraction(
      this.activeSpatialData.interactions,
    );

    if (!target) {
      this.logEvent("Nothing responds.");
      return false;
    }

    return this.triggerInteraction(target, "action");
  }

  handleTouchInteractions() {
    if (this.mode !== "world") return false;

    const targets = this.getPlayerTouchTargets();
    const currentKeys = new Set(targets.keys());

    for (const [key, target] of targets) {
      if (this.activeTouchTargets.has(key)) continue;

      this.activeTouchTargets = currentKeys;
      return this.triggerInteraction(target, "touch");
    }

    this.activeTouchTargets = currentKeys;
    return false;
  }

  triggerInteraction(target, triggerSource) {
    const sourceMapId = target.mapId;
    const interaction = target.interaction;

    if (
      interaction.condition &&
      !this.evaluateCondition(interaction.condition)
    ) {
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
        detail: detail,
      }),
    );

    return true;
  }

  update(deltaMs) {
    this.ambientAnimationTimeMs += deltaMs;

    if (this.mode === "world") {
      let remainingMs = deltaMs;

      for (
        let stepCount = 0;
        stepCount < 64 && this.mode === "world";
        stepCount += 1
      ) {
        if (this.player.isMoving) {
          const result = this.player.update(remainingMs);
          remainingMs = result.remainingMs;

          if (!result.completed) break;

          if (result.tileChanged) {
            this.handleMapTriggers();
            if (this.mode !== "world") break;
          }

          this.handleTouchInteractions();
          if (this.mode !== "world") break;
        }

        const movement = this.input.getMovementVector();
        if (!movement) break;

        const started = this.attemptPlayerMovement(
          movement.dc,
          movement.dr,
          movement.facing,
        );
        if (!started || !this.player.isMoving || remainingMs <= 0) break;
      }

      this.updatePlayerAnimation(deltaMs);
    }

    this.reconcileCameraZones();
    this.updateCamera(deltaMs);
  }

  cloneCameraState(state) {
    return {
      x: state.x,
      y: state.y,
      zoom: state.zoom,
      followTarget: structuredClone(state.followTarget),
      offsetX: state.offsetX,
      offsetY: state.offsetY,
    };
  }

  getMapCameraDefaultState(map = this.activeMap) {
    return {
      x: 0,
      y: 0,
      zoom: map.camera.zoom,
      followTarget: { type: map.camera.follow },
      offsetX: 0,
      offsetY: 0,
    };
  }

  applyCameraPatch(state, patch) {
    for (const key of ["x", "y", "zoom", "offsetX", "offsetY"]) {
      if (patch[key] !== undefined) state[key] = patch[key];
    }
    if (patch.followTarget !== undefined) {
      state.followTarget = structuredClone(patch.followTarget);
    }
    return state;
  }

  getCameraFocusPoint(target) {
    if (target.type === "player") {
      return {
        x: this.player.x + TILE_SIZE / 2,
        y: this.player.y + TILE_SIZE / 2,
      };
    }
    if (target.type === "entity") {
      const definition = this.entityDefinitionsByMap
        .get(target.mapId)
        ?.get(target.entityId);
      const mapState = this.state.maps[target.mapId];
      const entityState =
        definition && mapState
          ? this.getEntityState(target.mapId, target.entityId)
          : null;
      if (
        target.mapId !== this.activeMap?.id ||
        !definition ||
        !entityState ||
        !this.isEntityPresent(definition, entityState)
      ) {
        throw new Error(
          `Camera follow target "${target.entityId}" is inactive or missing.`,
        );
      }
      return {
        x: entityState.col * TILE_SIZE + TILE_SIZE / 2,
        y: entityState.row * TILE_SIZE + TILE_SIZE / 2,
      };
    }
    return null;
  }

  clampCameraPosition(x, y, zoom = this.camera.zoom) {
    const visibleWidth = this.canvas.width / zoom;
    const visibleHeight = this.canvas.height / zoom;
    const maxX = Math.max(
      0,
      this.activeSpatialData.bounds.width - visibleWidth,
    );
    const maxY = Math.max(
      0,
      this.activeSpatialData.bounds.height - visibleHeight,
    );
    return {
      x: Math.max(0, Math.min(x, maxX)),
      y: Math.max(0, Math.min(y, maxY)),
    };
  }

  resolveCameraPosition(state, zoom = state.zoom) {
    const focus = this.getCameraFocusPoint(state.followTarget);
    if (!focus) {
      return this.clampCameraPosition(state.x, state.y, zoom);
    }
    return this.clampCameraPosition(
      focus.x - this.canvas.width / zoom / 2 + state.offsetX,
      focus.y - this.canvas.height / zoom / 2 + state.offsetY,
      zoom,
    );
  }

  resolveEffectiveCameraState() {
    const result = this.cloneCameraState(this.cameraBase);
    const overrides = [...this.cameraOverrides.values()].sort(
      (first, second) =>
        first.priority - second.priority || first.order - second.order,
    );
    for (const override of overrides) {
      this.applyCameraPatch(result, override.patch);
    }
    return result;
  }

  cameraStatesEqual(first, second) {
    return (
      first.x === second.x &&
      first.y === second.y &&
      first.zoom === second.zoom &&
      first.offsetX === second.offsetX &&
      first.offsetY === second.offsetY &&
      first.followTarget.type === second.followTarget.type &&
      first.followTarget.mapId === second.followTarget.mapId &&
      first.followTarget.entityId === second.followTarget.entityId
    );
  }

  supersedeCameraTransition(status = "superseded") {
    const transition = this.camera.transition;
    if (!transition) return;
    this.camera.transition = null;
    transition.resolve({ status });
  }

  replaceCameraTransition(targetState, durationMs = 0) {
    if (!Number.isFinite(durationMs) || durationMs < 0) {
      throw new Error("Camera transition duration must be non-negative.");
    }

    this.supersedeCameraTransition();
    const target = this.cloneCameraState(targetState);

    if (durationMs === 0) {
      this.cameraMotion = this.cloneCameraState(target);
      this.camera.zoom = target.zoom;
      const position = this.resolveCameraPosition(target, target.zoom);
      this.camera.x = position.x;
      this.camera.y = position.y;
      return undefined;
    }

    const startState = this.cloneCameraState(this.cameraMotion);
    startState.zoom = this.camera.zoom;
    const resolveStartState = this.cloneCameraState(startState);
    resolveStartState.followTarget = structuredClone(target.followTarget);
    const resolvedStart = this.resolveCameraPosition(
      resolveStartState,
      this.camera.zoom,
    );

    return new Promise((resolve) => {
      this.camera.transition = {
        startState,
        targetState: target,
        correctionX: this.camera.x - resolvedStart.x,
        correctionY: this.camera.y - resolvedStart.y,
        elapsedMs: 0,
        durationMs,
        resolve,
      };
    });
  }

  refreshEffectiveCamera(durationMs = 0) {
    const next = this.resolveEffectiveCameraState();
    const unchanged = this.cameraStatesEqual(next, this.cameraEffective);
    this.cameraEffective = this.cloneCameraState(next);
    if (unchanged && !this.camera.transition) return undefined;
    return this.replaceCameraTransition(next, durationMs);
  }

  setCameraBase(changes, durationMs = 0) {
    this.applyCameraPatch(this.cameraBase, changes);
    return this.refreshEffectiveCamera(durationMs);
  }

  resetCameraToMapDefaults(
    map = this.activeMap,
    { immediate = false, durationMs = 0 } = {},
  ) {
    this.cameraBase = this.getMapCameraDefaultState(map);
    return this.refreshEffectiveCamera(immediate ? 0 : durationMs);
  }

  cameraPan({ x, y, offsetX, offsetY, durationMs = 0 }) {
    if (x !== undefined || y !== undefined) {
      return this.setCameraBase(
        {
          x,
          y,
          followTarget: { type: "none" },
          offsetX: 0,
          offsetY: 0,
        },
        durationMs,
      );
    }
    return this.setCameraBase(
      {
        offsetX: offsetX ?? this.cameraBase.offsetX,
        offsetY: offsetY ?? this.cameraBase.offsetY,
      },
      durationMs,
    );
  }

  cameraZoom(zoom, durationMs = 0) {
    this.validateCameraZoom(zoom, "Camera zoom");
    return this.setCameraBase({ zoom }, durationMs);
  }

  cameraFollow({
    target,
    entityId,
    offsetX = 0,
    offsetY = 0,
    mapId,
    durationMs = 0,
  }) {
    const followTarget =
      target === "entity"
        ? { type: "entity", mapId, entityId }
        : { type: target };
    const position =
      target === "none" ? { x: this.camera.x, y: this.camera.y } : {};
    return this.setCameraBase(
      { ...position, followTarget, offsetX, offsetY },
      durationMs,
    );
  }

  cameraShake({ intensity, durationMs }) {
    if (this.camera.shake?.resolve) {
      this.camera.shake.resolve({ status: "superseded" });
      this.camera.shake = null;
    }
    this.camera.shakeX = 0;
    this.camera.shakeY = 0;
    if (durationMs === 0) return undefined;
    return new Promise((resolve) => {
      this.camera.shake = { intensity, durationMs, elapsedMs: 0, resolve };
    });
  }

  cancelCameraAnimations(status = "superseded") {
    this.supersedeCameraTransition(status);
    if (this.camera.shake?.resolve) {
      this.camera.shake.resolve({ status });
    }
    this.camera.shake = null;
    this.camera.shakeX = 0;
    this.camera.shakeY = 0;
  }

  getActiveCameraZones() {
    const tile = this.player.getCurrentTile();
    return (this.activeMap.cameraZones ?? []).filter(
      (zone) =>
        this.isTileInsideTrigger(tile, zone) &&
        (!zone.condition || this.evaluateCondition(zone.condition)),
    );
  }

  reconcileCameraZones({ immediate = false, retarget = true } = {}) {
    if (!this.activeMap) return undefined;
    const zones = this.getActiveCameraZones();
    const nextIds = new Set(zones.map((zone) => zone.id));
    const added = zones.filter(
      (zone) => !this.activeCameraZoneIds.has(zone.id),
    );
    const removed = (this.activeMap.cameraZones ?? []).filter(
      (zone) => this.activeCameraZoneIds.has(zone.id) && !nextIds.has(zone.id),
    );
    if (added.length === 0 && removed.length === 0) return undefined;

    this.activeCameraZoneIds = nextIds;
    this.cameraOverrides = new Map(
      zones.map((zone, order) => [
        `map:${this.activeMap.id}:camera-zone:${zone.id}`,
        {
          ownerId: `map:${this.activeMap.id}:camera-zone:${zone.id}`,
          mapId: this.activeMap.id,
          priority: zone.priority,
          order: (this.activeMap.cameraZones ?? []).indexOf(zone),
          patch: {
            ...structuredClone(zone.camera),
            ...(zone.camera.followTarget?.type === "entity"
              ? {
                  followTarget: {
                    ...structuredClone(zone.camera.followTarget),
                    mapId: this.activeMap.id,
                  },
                }
              : {}),
          },
        },
      ]),
    );
    this.cameraEffective = this.resolveEffectiveCameraState();
    if (!retarget) return undefined;

    const durationMs = immediate
      ? 0
      : Math.max(
          0,
          ...added.map((zone) => zone.transitionInMs),
          ...removed.map((zone) => zone.transitionOutMs),
        );
    return this.replaceCameraTransition(this.cameraEffective, durationMs);
  }

  initializeCameraForActiveMap({ inheritRendered = false } = {}) {
    const rendered = {
      x: this.camera.x,
      y: this.camera.y,
      zoom: this.camera.zoom,
    };
    this.cancelCameraAnimations();
    this.cameraOverrides.clear();
    this.activeCameraZoneIds.clear();
    this.cameraBase = this.getMapCameraDefaultState(this.activeMap);
    this.cameraEffective = this.cloneCameraState(this.cameraBase);
    this.reconcileCameraZones({ immediate: true, retarget: false });
    this.cameraEffective = this.resolveEffectiveCameraState();

    if (!inheritRendered) {
      this.cameraMotion = this.cloneCameraState(this.cameraEffective);
      this.camera.zoom = this.cameraEffective.zoom;
      const position = this.resolveCameraPosition(
        this.cameraEffective,
        this.cameraEffective.zoom,
      );
      this.camera.x = position.x;
      this.camera.y = position.y;
      return;
    }

    this.camera.x = rendered.x;
    this.camera.y = rendered.y;
    this.camera.zoom = rendered.zoom;
    this.cameraMotion = {
      ...this.cloneCameraState(this.cameraEffective),
      x: rendered.x,
      y: rendered.y,
      zoom: rendered.zoom,
      followTarget: { type: "none" },
    };
    this.replaceCameraTransition(
      this.cameraEffective,
      CAMERA_INHERIT_TRANSITION_MS,
    );
  }

  updateCamera(deltaMs = 0) {
    const transition = this.camera.transition;
    if (transition) {
      transition.elapsedMs = Math.min(
        transition.durationMs,
        transition.elapsedMs + deltaMs,
      );
      const linear = transition.elapsedMs / transition.durationMs;
      const progress = 1 - Math.pow(1 - linear, 3);
      const start = transition.startState;
      const target = transition.targetState;
      const motion = {
        x: start.x + (target.x - start.x) * progress,
        y: start.y + (target.y - start.y) * progress,
        zoom: start.zoom + (target.zoom - start.zoom) * progress,
        followTarget: structuredClone(target.followTarget),
        offsetX: start.offsetX + (target.offsetX - start.offsetX) * progress,
        offsetY: start.offsetY + (target.offsetY - start.offsetY) * progress,
      };
      this.cameraMotion = motion;
      this.camera.zoom = motion.zoom;
      const resolved = this.resolveCameraPosition(motion, motion.zoom);
      const correctionScale = 1 - progress;
      const corrected = this.clampCameraPosition(
        resolved.x + transition.correctionX * correctionScale,
        resolved.y + transition.correctionY * correctionScale,
        motion.zoom,
      );
      this.camera.x = corrected.x;
      this.camera.y = corrected.y;

      if (transition.elapsedMs >= transition.durationMs) {
        this.camera.transition = null;
        this.cameraMotion = this.cloneCameraState(target);
        this.camera.zoom = target.zoom;
        const finalPosition = this.resolveCameraPosition(target, target.zoom);
        this.camera.x = finalPosition.x;
        this.camera.y = finalPosition.y;
        transition.resolve({ status: "completed" });
      }
    } else {
      this.cameraMotion = this.cloneCameraState(this.cameraEffective);
      this.camera.zoom = this.cameraEffective.zoom;
      const position = this.resolveCameraPosition(
        this.cameraEffective,
        this.camera.zoom,
      );
      this.camera.x = position.x;
      this.camera.y = position.y;
    }

    const shake = this.camera.shake;
    if (shake) {
      shake.elapsedMs = Math.min(shake.durationMs, shake.elapsedMs + deltaMs);
      const remaining = 1 - shake.elapsedMs / shake.durationMs;
      const phase = shake.elapsedMs * 0.09;
      this.camera.shakeX = Math.sin(phase * 1.7) * shake.intensity * remaining;
      this.camera.shakeY = Math.cos(phase * 2.3) * shake.intensity * remaining;
      if (shake.elapsedMs >= shake.durationMs) {
        this.camera.shake = null;
        this.camera.shakeX = 0;
        this.camera.shakeY = 0;
        shake.resolve({ status: "completed" });
      }
    }
  }

  worldToScreenX(worldX) {
    return Math.round(
      (worldX - this.camera.x) * this.camera.zoom + this.camera.shakeX,
    );
  }

  worldToScreenY(worldY) {
    return Math.round(
      (worldY - this.camera.y) * this.camera.zoom + this.camera.shakeY,
    );
  }

  worldRectToScreen(x, y, width, height) {
    const left = this.worldToScreenX(x);
    const top = this.worldToScreenY(y);
    const right = this.worldToScreenX(x + width);
    const bottom = this.worldToScreenY(y + height);
    return {
      x: left,
      y: top,
      width: right - left,
      height: bottom - top,
    };
  }

  render() {
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.imageSmoothingEnabled = false;

    this.renderLayer(this.activeMapState.layers.base);

    const drawables = [];
    let sequence = 0;

    this.collectTileDrawables(
      this.activeMapState.layers.obstacles,
      drawables,
      () => sequence++,
    );
    this.collectEntityDrawables(drawables, () => sequence++);
    drawables.push({
      kind: "player",
      depthY: this.player.y + TILE_SIZE,
      sequence: sequence++,
    });

    drawables.sort(
      (first, second) =>
        first.depthY - second.depthY || first.sequence - second.sequence,
    );

    for (const drawable of drawables) {
      this.renderDrawable(drawable);
    }

    if (this.activeMapState.layers.foreground) {
      this.renderLayer(this.activeMapState.layers.foreground);
    }
  }

  renderLayer(layer) {
    if (!layer) return;

    layer.forEach((row, rowIndex) => {
      row.forEach((tileId, colIndex) => {
        if (tileId === EMPTY_TILE_ID) return;

        const tile = this.activeMap.tiles[tileId];
        if (!this.isTilePresent(tile)) return;

        this.renderTile(tile, colIndex, rowIndex);
      });
    });
  }

  collectTileDrawables(layer, drawables, nextSequence) {
    if (!layer) return;

    layer.forEach((row, rowIndex) => {
      row.forEach((tileId, colIndex) => {
        if (tileId === EMPTY_TILE_ID) return;

        const tile = this.activeMap.tiles[tileId];
        if (!this.isTilePresent(tile)) return;

        const occupiedCells = this.getOccupiedTileCells(
          colIndex,
          rowIndex,
          tile,
        );
        const bottomRow = Math.max(...occupiedCells.map((cell) => cell.row));

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

  collectEntityDrawables(drawables, nextSequence) {
    for (const entity of this.activeSpatialData.entities) {
      drawables.push({
        kind: "entity",
        entity,
        depthY:
          (Math.max(...entity.occupiedCells.map((cell) => cell.row)) + 1) *
          TILE_SIZE,
        sequence: nextSequence(),
      });
    }
  }

  renderDrawable(drawable) {
    if (drawable.kind === "tile") {
      this.renderTile(drawable.tile, drawable.col, drawable.row);
      return;
    }

    if (drawable.kind === "entity") {
      this.renderEntity(drawable.entity);
      return;
    }

    const playerSprite = this.playerSpriteDefinitions.get(
      this.state.player.spriteId,
    );
    const playerImage =
      playerSprite.kind === "image" ? this.images.get(playerSprite.path) : null;
    const playerFrame = resolveVisualFrame(
      playerSprite,
      this.playerAnimation.animationId,
      this.playerAnimation.elapsedMs,
    );
    const playerSize =
      playerSprite.kind === "image"
        ? playerSprite.size
        : [TILE_SIZE, TILE_SIZE];
    const playerWorldX = this.player.x + (TILE_SIZE - playerSize[0]) / 2;
    const playerWorldY = this.player.y + TILE_SIZE - playerSize[1];
    const playerScreenRect = this.worldRectToScreen(
      playerWorldX,
      playerWorldY,
      playerSize[0],
      playerSize[1],
    );
    this.player.render(
      this.ctx,
      playerScreenRect,
      playerSprite,
      playerImage,
      playerFrame,
    );
  }

  renderTile(tile, col, row) {
    const image = this.images.get(tile.path);
    if (!image) return;

    const occupiedCells = this.getOccupiedTileCells(col, row, tile);
    const bottomRow = Math.max(...occupiedCells.map((cell) => cell.row));
    const worldBottomY = (bottomRow + 1) * TILE_SIZE;
    const [width, height] = tile.size ?? [TILE_SIZE, TILE_SIZE];
    const screenRect = this.worldRectToScreen(
      col * TILE_SIZE,
      worldBottomY - height,
      width,
      height,
    );

    const animationId = resolveAnimationId(tile, [tile.defaultAnimation]);
    const frame = resolveVisualFrame(
      tile,
      animationId,
      this.ambientAnimationTimeMs,
    );
    drawImageVisual(
      this.ctx,
      image,
      { ...tile, size: [width, height] },
      frame,
      screenRect.x,
      screenRect.y,
      screenRect.width,
      screenRect.height,
    );
  }

  renderEntity(entity) {
    const visualReference = entity.state.visual;
    const visual = this.getEntityVisualDefinition(
      entity.mapId,
      visualReference,
    );
    const image = this.images.get(visual.path);
    if (!image) return;

    const [width, height] = visual.size ?? [TILE_SIZE, TILE_SIZE];
    let worldX;
    let worldY;

    if (visualReference.type === "tile") {
      const bottomRow = Math.max(
        ...entity.occupiedCells.map((cell) => cell.row),
      );
      worldX = entity.state.col * TILE_SIZE;
      worldY = (bottomRow + 1) * TILE_SIZE - height;
    } else {
      worldX = entity.state.col * TILE_SIZE + (TILE_SIZE - width) / 2;
      worldY = entity.state.row * TILE_SIZE + TILE_SIZE - height;
    }
    const screenRect = this.worldRectToScreen(worldX, worldY, width, height);

    const animationId = resolveAnimationId(visual, [visual.defaultAnimation]);
    const frame = resolveVisualFrame(
      visual,
      animationId,
      this.ambientAnimationTimeMs,
    );
    drawImageVisual(
      this.ctx,
      image,
      { ...visual, size: [width, height], transform: entity.state.transform },
      frame,
      screenRect.x,
      screenRect.y,
      screenRect.width,
      screenRect.height,
    );
  }

  loop(time) {
    const deltaMs = Math.min(time - this.lastTime, 50);
    this.lastTime = time;

    // Keep the loop alive even if the current update or render throws.
    requestAnimationFrame((nextTime) => this.loop(nextTime));

    this.update(deltaMs);
    this.render();
    this.audioDebugElapsedMs += deltaMs;
    if (this.audioDebugElapsedMs >= 200) {
      this.audioDebugElapsedMs = 0;
      this.updateAudioDebug();
    }
    this.inventoryPanel.renderAnimation(this.ambientAnimationTimeMs);
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
