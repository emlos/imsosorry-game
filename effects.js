import {
  conditionsCanOverlap,
  validateCondition,
  validateConditionReferences,
} from "./conditions.js";

import {
  requireArray,
  requireBoolean,
  requireExactKeys,
  requireInteger,
  requireNonEmptyArray,
  requireNonNegativeInteger,
  requireObject,
  requirePositiveInteger,
  requirePositiveNumber,
  requireString,
} from "./validation.js";

import { RANDOM_SCOPES } from "./random.js";

function effectKeys(...keys) {
  return new Set(["type", "condition", ...keys]);
}

function validateChoiceEffects(effects, label, randomIds) {
  requireArray(effects, label);
  validateEffectsDefinitionInternal(effects, label, randomIds, true);
}

const MUSIC_RESTART_POLICIES = new Set(["always", "if-different", "never"]);
const MUSIC_TRANSITION_POLICIES = new Set([
  "inherit",
  "replace",
  "crossfade",
  "silence",
]);

function requireFiniteNumber(value, label) {
  if (!Number.isFinite(value)) {
    throw new Error(`${label} must be a finite number.`);
  }
}

function requireNonNegativeNumber(value, label) {
  requireFiniteNumber(value, label);
  if (value < 0) throw new Error(`${label} must be non-negative.`);
}

function requireRange(value, minimum, maximum, label) {
  requireFiniteNumber(value, label);
  if (value < minimum || value > maximum) {
    throw new Error(`${label} must be between ${minimum} and ${maximum}.`);
  }
}

function validateMusicPlaybackEffect(effect, label) {
  requireString(effect.trackId, `${label}.trackId`);
  if (effect.continuityId !== undefined) {
    requireString(effect.continuityId, `${label}.continuityId`);
  }
  for (const key of ["fadeInMs", "fadeOutMs", "crossfadeMs"]) {
    if (effect[key] !== undefined) {
      requireNonNegativeNumber(effect[key], `${label}.${key}`);
    }
  }
  if (
    effect.restart !== undefined &&
    !MUSIC_RESTART_POLICIES.has(effect.restart)
  ) {
    throw new Error(
      `${label}.restart must be "always", "if-different", or "never".`,
    );
  }
  if (effect.resume !== undefined) {
    requireBoolean(effect.resume, `${label}.resume`);
  }
  if (effect.volume !== undefined) {
    requireRange(effect.volume, 0, 1, `${label}.volume`);
  }
  if (effect.playbackRate !== undefined) {
    requireRange(effect.playbackRate, 0.25, 4, `${label}.playbackRate`);
  }
}

function musicPlaybackKeys() {
  return effectKeys(
    "trackId",
    "continuityId",
    "fadeInMs",
    "fadeOutMs",
    "crossfadeMs",
    "restart",
    "resume",
    "volume",
    "playbackRate",
  );
}

function validatePages(pages, label) {
  requireNonEmptyArray(pages, label);

  pages.forEach((page, index) => {
    requireString(page, `${label}[${index}]`);
  });
}

function getEffectMapId(effect, sourceMapId, label) {
  const effectMapId = effect.mapId ?? sourceMapId;
  if (effectMapId === null || effectMapId === undefined) {
    throw new Error(
      `${label}.mapId is required for map-local inventory effects.`,
    );
  }
  return effectMapId;
}

const EFFECT_HANDLERS = new Map([
  [
    "setFlag",
    {
      validateDefinition({ effect, label }) {
        requireExactKeys(effect, effectKeys("flag", "value"), label);
        requireString(effect.flag, `${label}.flag`);
        if (!Object.hasOwn(effect, "value")) {
          throw new Error(`${label} must define value.`);
        }
        requireBoolean(effect.value, `${label}.value`);
      },
      execute({ game, effect }) {
        game.setFlag(effect.flag, effect.value);
      },
    },
  ],
  [
    "toggleFlag",
    {
      validateDefinition({ effect, label }) {
        requireExactKeys(effect, effectKeys("flag"), label);
        requireString(effect.flag, `${label}.flag`);
      },
      execute({ game, effect }) {
        game.toggleFlag(effect.flag);
      },
    },
  ],
  [
    "addItem",
    {
      validateDefinition({ effect, label }) {
        requireExactKeys(effect, effectKeys("itemId", "quantity"), label);
        requireString(effect.itemId, `${label}.itemId`);
        requirePositiveInteger(effect.quantity, `${label}.quantity`);
      },
      validateReferences({ game, effect, label }) {
        game.validateItemReference(effect.itemId, label);
      },
      execute({ game, effect }) {
        game.addItem(effect.itemId, effect.quantity);
      },
    },
  ],
  [
    "removeItem",
    {
      validateDefinition({ effect, label }) {
        requireExactKeys(effect, effectKeys("itemId", "quantity"), label);
        requireString(effect.itemId, `${label}.itemId`);
        requirePositiveInteger(effect.quantity, `${label}.quantity`);
      },
      validateReferences({ game, effect, label }) {
        game.validateItemReference(effect.itemId, label);
      },
      execute({ game, effect }) {
        game.removeItem(effect.itemId, effect.quantity);
      },
    },
  ],
  [
    "setPlayerSprite",
    {
      validateDefinition({ effect, label }) {
        requireExactKeys(effect, effectKeys("spriteId"), label);
        requireString(effect.spriteId, `${label}.spriteId`);
      },
      validateReferences({ game, effect, label }) {
        game.validatePlayerSpriteReference(effect.spriteId, label);
      },
      execute({ game, effect }) {
        game.setPlayerSprite(effect.spriteId);
      },
    },
  ],
  [
    "setPlayerMoveSpeed",
    {
      validateDefinition({ effect, label }) {
        requireExactKeys(effect, effectKeys("tilesPerSecond"), label);
        requirePositiveNumber(effect.tilesPerSecond, `${label}.tilesPerSecond`);
      },
      execute({ game, effect }) {
        game.setPlayerMoveSpeed(effect.tilesPerSecond);
      },
    },
  ],
  [
    "setEntityActive",
    {
      validateDefinition({ effect, label }) {
        requireExactKeys(
          effect,
          effectKeys("mapId", "entityId", "active", "persistence"),
          label,
        );
        if (effect.mapId !== undefined)
          requireString(effect.mapId, `${label}.mapId`);
        requireString(effect.entityId, `${label}.entityId`);
        requireBoolean(effect.active, `${label}.active`);
        if (
          effect.persistence !== undefined &&
          effect.persistence !== "roomVisit"
        ) {
          throw new Error(
            `${label}.persistence must be "roomVisit" when provided.`,
          );
        }
      },
      validateReferences({ game, effect, mapId, label }) {
        const effectMapId = getEffectMapId(effect, mapId, label);
        game.validateEntityReference(effectMapId, effect.entityId, label);
        if (effect.persistence === "roomVisit" && effectMapId !== mapId) {
          throw new Error(
            `${label} cannot apply roomVisit persistence outside the current map.`,
          );
        }
      },
      execute({ game, effect, mapId }) {
        game.setEntityActive(
          effect.mapId ?? mapId,
          effect.entityId,
          effect.active,
          {
            persistence: effect.persistence ?? "persistent",
          },
        );
      },
    },
  ],
  [
    "setEntityPosition",
    {
      validateDefinition({ effect, label }) {
        requireExactKeys(
          effect,
          effectKeys("mapId", "entityId", "col", "row"),
          label,
        );
        if (effect.mapId !== undefined)
          requireString(effect.mapId, `${label}.mapId`);
        requireString(effect.entityId, `${label}.entityId`);
        requireNonNegativeInteger(effect.col, `${label}.col`);
        requireNonNegativeInteger(effect.row, `${label}.row`);
      },
      validateReferences({ game, effect, mapId, label }) {
        const effectMapId = getEffectMapId(effect, mapId, label);
        game.validateEntityReference(effectMapId, effect.entityId, label);
        game.validateMapPosition(effectMapId, effect.col, effect.row, label);
      },
      execute({ game, effect, mapId }) {
        game.setEntityPosition(
          effect.mapId ?? mapId,
          effect.entityId,
          effect.col,
          effect.row,
        );
      },
    },
  ],
  [
    "setEntityVisual",
    {
      validateDefinition({ effect, label }) {
        requireExactKeys(
          effect,
          effectKeys("mapId", "entityId", "visual"),
          label,
        );
        if (effect.mapId !== undefined)
          requireString(effect.mapId, `${label}.mapId`);
        requireString(effect.entityId, `${label}.entityId`);
        requireObject(effect.visual, `${label}.visual`);
        requireExactKeys(
          effect.visual,
          new Set(["type", "id"]),
          `${label}.visual`,
        );
        if (effect.visual.type === "sprite") {
          requireString(effect.visual.id, `${label}.visual.id`);
        } else if (effect.visual.type === "tile") {
          requireInteger(effect.visual.id, `${label}.visual.id`);
        } else {
          throw new Error(`${label}.visual.type must be "sprite" or "tile".`);
        }
      },
      validateReferences({ game, effect, mapId, label }) {
        const effectMapId = getEffectMapId(effect, mapId, label);
        game.validateEntityReference(effectMapId, effect.entityId, label);
        game.validateEntityVisualReference(effectMapId, effect.visual, label);
      },
      execute({ game, effect, mapId }) {
        game.setEntityVisual(
          effect.mapId ?? mapId,
          effect.entityId,
          effect.visual,
        );
      },
    },
  ],
  [
    "setEntityCollision",
    {
      validateDefinition({ effect, label }) {
        requireExactKeys(
          effect,
          effectKeys("mapId", "entityId", "collision"),
          label,
        );
        if (effect.mapId !== undefined)
          requireString(effect.mapId, `${label}.mapId`);
        requireString(effect.entityId, `${label}.entityId`);
        requireBoolean(effect.collision, `${label}.collision`);
      },
      validateReferences({ game, effect, mapId, label }) {
        game.validateEntityReference(
          getEffectMapId(effect, mapId, label),
          effect.entityId,
          label,
        );
      },
      execute({ game, effect, mapId }) {
        game.setEntityCollision(
          effect.mapId ?? mapId,
          effect.entityId,
          effect.collision,
        );
      },
    },
  ],
  [
    "setTile",
    {
      validateDefinition({ effect, label }) {
        requireExactKeys(
          effect,
          effectKeys("mapId", "layer", "col", "row", "tileId"),
          label,
        );
        if (effect.mapId !== undefined)
          requireString(effect.mapId, `${label}.mapId`);
        requireString(effect.layer, `${label}.layer`);
        requireNonNegativeInteger(effect.col, `${label}.col`);
        requireNonNegativeInteger(effect.row, `${label}.row`);
        requireInteger(effect.tileId, `${label}.tileId`);
      },

      validateReferences({ game, effect, mapId, label }) {
        const effectMapId = getEffectMapId(effect, mapId, label);
        game.validateTileReference(
          effectMapId,
          effect.layer,
          effect.col,
          effect.row,
          effect.tileId,
          label,
        );
      },
      execute({ game, effect, mapId }) {
        game.setTile(
          effect.mapId ?? mapId,
          effect.layer,
          effect.col,
          effect.row,
          effect.tileId,
        );
      },
    },
  ],
  [
    "teleport",
    {
      validateDefinition({ effect, label }) {
        requireExactKeys(
          effect,
          effectKeys(
            "mapId",
            "entryId",
            "musicTransition",
            "musicTransitionMs",
            "inheritCamera",
          ),
          label,
        );
        requireString(effect.mapId, `${label}.mapId`);
        requireString(effect.entryId, `${label}.entryId`);
        if (
          effect.musicTransition !== undefined &&
          !MUSIC_TRANSITION_POLICIES.has(effect.musicTransition)
        ) {
          throw new Error(
            `${label}.musicTransition must be "inherit", "replace", "crossfade", or "silence".`,
          );
        }
        if (effect.musicTransitionMs !== undefined) {
          requireNonNegativeNumber(
            effect.musicTransitionMs,
            `${label}.musicTransitionMs`,
          );
        }
        if (effect.inheritCamera !== undefined) {
          requireBoolean(effect.inheritCamera, `${label}.inheritCamera`);
        }
      },
      validateReferences({ game, effect, label }) {
        game.validateEntryReference(effect.mapId, effect.entryId, label);
      },
      execute({ game, effect }) {
        game.transitionTo({
          mapId: effect.mapId,
          entryId: effect.entryId,
          musicTransition: effect.musicTransition,
          musicTransitionMs: effect.musicTransitionMs,
          inheritCamera: effect.inheritCamera,
        });
      },
    },
  ],

  [
    "cameraPan",
    {
      validateDefinition({ effect, label }) {
        requireExactKeys(
          effect,
          effectKeys("x", "y", "offsetX", "offsetY", "durationMs"),
          label,
        );
        const absolute = effect.x !== undefined || effect.y !== undefined;
        const offset =
          effect.offsetX !== undefined || effect.offsetY !== undefined;
        if (absolute === offset) {
          throw new Error(
            `${label} must define either x/y or offsetX/offsetY, but not both.`,
          );
        }
        if (absolute) {
          requireFiniteNumber(effect.x, `${label}.x`);
          requireFiniteNumber(effect.y, `${label}.y`);
        } else {
          if (effect.offsetX !== undefined) {
            requireFiniteNumber(effect.offsetX, `${label}.offsetX`);
          }
          if (effect.offsetY !== undefined) {
            requireFiniteNumber(effect.offsetY, `${label}.offsetY`);
          }
        }
        if (effect.durationMs !== undefined) {
          requireNonNegativeNumber(effect.durationMs, `${label}.durationMs`);
        }
      },
      execute({ game, effect }) {
        return game.cameraPan(effect);
      },
    },
  ],
  [
    "cameraZoom",
    {
      validateDefinition({ effect, label }) {
        requireExactKeys(effect, effectKeys("zoom", "durationMs"), label);
        requireRange(effect.zoom, 0.25, 8, `${label}.zoom`);
        if (effect.durationMs !== undefined) {
          requireNonNegativeNumber(effect.durationMs, `${label}.durationMs`);
        }
      },
      execute({ game, effect }) {
        return game.cameraZoom(effect.zoom, effect.durationMs ?? 0);
      },
    },
  ],
  [
    "cameraFollow",
    {
      validateDefinition({ effect, label }) {
        requireExactKeys(
          effect,
          effectKeys("target", "entityId", "offsetX", "offsetY", "durationMs"),
          label,
        );
        if (!["player", "entity", "none"].includes(effect.target)) {
          throw new Error(
            `${label}.target must be "player", "entity", or "none".`,
          );
        }
        if (effect.target === "entity") {
          requireString(effect.entityId, `${label}.entityId`);
        } else if (effect.entityId !== undefined) {
          throw new Error(
            `${label}.entityId is only valid for entity following.`,
          );
        }
        for (const key of ["offsetX", "offsetY"]) {
          if (effect[key] !== undefined)
            requireFiniteNumber(effect[key], `${label}.${key}`);
        }
        if (effect.durationMs !== undefined) {
          requireNonNegativeNumber(effect.durationMs, `${label}.durationMs`);
        }
      },
      validateReferences({ game, effect, mapId, label }) {
        if (effect.target === "entity") {
          game.validateEntityReference(mapId, effect.entityId, label);
        }
      },
      execute({ game, effect, mapId }) {
        return game.cameraFollow({ ...effect, mapId });
      },
    },
  ],
  [
    "cameraShake",
    {
      validateDefinition({ effect, label }) {
        requireExactKeys(effect, effectKeys("intensity", "durationMs"), label);
        requirePositiveNumber(effect.intensity, `${label}.intensity`);
        requireNonNegativeNumber(effect.durationMs, `${label}.durationMs`);
      },
      execute({ game, effect }) {
        return game.cameraShake(effect);
      },
    },
  ],
  [
    "cameraReset",
    {
      validateDefinition({ effect, label }) {
        requireExactKeys(effect, effectKeys("durationMs"), label);
        if (effect.durationMs !== undefined) {
          requireNonNegativeNumber(effect.durationMs, `${label}.durationMs`);
        }
      },
      execute({ game, effect }) {
        return game.resetCameraToMapDefaults(game.activeMap, {
          durationMs: effect.durationMs ?? 0,
        });
      },
    },
  ],
  [
    "saveGame",
    {
      validateDefinition({ effect, label }) {
        requireExactKeys(effect, effectKeys(), label);
      },
      execute({ game }) {
        game.requestSave();
      },
    },
  ],
  [
    "playSound",
    {
      validateDefinition({ effect, label }) {
        requireExactKeys(effect, effectKeys("soundId"), label);
        requireString(effect.soundId, `${label}.soundId`);
      },
      validateReferences({ game, effect, label }) {
        game.validateSoundReference(effect.soundId, label);
      },
      execute({ game, effect }) {
        game.playSound(effect.soundId);
      },
    },
  ],
  [
    "playMusic",
    {
      validateDefinition({ effect, label }) {
        requireExactKeys(effect, musicPlaybackKeys(), label);
        validateMusicPlaybackEffect(effect, label);
      },
      validateReferences({ game, effect, label }) {
        game.validateMusicReference(effect.trackId, label);
      },
      execute({ game, effect }) {
        const { type, condition, ...options } = effect;
        game.playMusic(options);
      },
    },
  ],
  [
    "stopMusic",
    {
      validateDefinition({ effect, label }) {
        requireExactKeys(effect, effectKeys("fadeOutMs"), label);
        if (effect.fadeOutMs !== undefined) {
          requireNonNegativeNumber(effect.fadeOutMs, `${label}.fadeOutMs`);
        }
      },
      execute({ game, effect }) {
        game.stopMusic({ fadeOutMs: effect.fadeOutMs ?? 0 });
      },
    },
  ],
  [
    "pushMusic",
    {
      validateDefinition({ effect, label }) {
        requireExactKeys(effect, musicPlaybackKeys(), label);
        validateMusicPlaybackEffect(effect, label);
      },
      validateReferences({ game, effect, label }) {
        game.validateMusicReference(effect.trackId, label);
      },
      execute({ game, effect }) {
        const { type, condition, ...options } = effect;
        game.pushMusic(options);
      },
    },
  ],
  [
    "popMusic",
    {
      validateDefinition({ effect, label }) {
        requireExactKeys(
          effect,
          effectKeys("fadeInMs", "fadeOutMs", "crossfadeMs"),
          label,
        );
        for (const key of ["fadeInMs", "fadeOutMs", "crossfadeMs"]) {
          if (effect[key] !== undefined) {
            requireNonNegativeNumber(effect[key], `${label}.${key}`);
          }
        }
      },
      execute({ game, effect }) {
        const { type, condition, ...options } = effect;
        game.popMusic(options);
      },
    },
  ],
  [
    "playMusicEffect",
    {
      validateDefinition({ effect, label }) {
        requireExactKeys(
          effect,
          effectKeys("musicEffectId", "duckMusicTo", "volume", "playbackRate"),
          label,
        );
        requireString(effect.musicEffectId, `${label}.musicEffectId`);
        if (effect.duckMusicTo !== undefined) {
          requireRange(effect.duckMusicTo, 0, 1, `${label}.duckMusicTo`);
        }
        if (effect.volume !== undefined) {
          requireRange(effect.volume, 0, 1, `${label}.volume`);
        }
        if (effect.playbackRate !== undefined) {
          requireRange(effect.playbackRate, 0.25, 4, `${label}.playbackRate`);
        }
      },
      validateReferences({ game, effect, label }) {
        game.validateMusicEffectReference(effect.musicEffectId, label);
      },
      execute({ game, effect }) {
        const { type, condition, musicEffectId, ...options } = effect;
        game.playMusicEffect(musicEffectId, options);
      },
    },
  ],
  [
    "random",
    {
      validateDefinition({ effect, label, randomIds }) {
        requireExactKeys(effect, effectKeys("id", "scope", "choices"), label);
        requireString(effect.id, `${label}.id`);
        if (randomIds.has(effect.id)) {
          throw new Error(
            `${label}.id duplicates random ID "${effect.id}" in this owner.`,
          );
        }
        randomIds.add(effect.id);

        if (!RANDOM_SCOPES.has(effect.scope)) {
          throw new Error(
            `${label}.scope must be "save", "once", "roomVisit", "interaction", or "use".`,
          );
        }

        requireNonEmptyArray(effect.choices, `${label}.choices`);
        effect.choices.forEach((choice, index) => {
          const choiceLabel = `${label}.choices[${index}]`;
          requireObject(choice, choiceLabel);
          requireExactKeys(choice, new Set(["weight", "effects"]), choiceLabel);
          requirePositiveNumber(choice.weight, `${choiceLabel}.weight`);
          validateChoiceEffects(
            choice.effects,
            `${choiceLabel}.effects`,
            randomIds,
          );
        });
      },
      validateReferences({ game, effect, mapId, label }) {
        effect.choices.forEach((choice, index) => {
          validateEffectsReferences(
            game,
            choice.effects,
            mapId,
            `${label}.choices[${index}].effects`,
          );
        });
      },
      execute({ game, effect, mapId, ownerId }) {
        return game.runRandomEffect(effect, { mapId, ownerId });
      },
    },
  ],
  [
    "showText",
    {
      validateDefinition({ effect, label, randomIds }) {
        requireExactKeys(
          effect,
          effectKeys("pages", "speaker", "afterClose"),
          label,
        );
        validatePages(effect.pages, `${label}.pages`);

        if (effect.speaker !== undefined) {
          requireString(effect.speaker, `${label}.speaker`);
        }

        if (effect.afterClose !== undefined) {
          validateEffectsDefinitionInternal(
            effect.afterClose,
            `${label}.afterClose`,
            randomIds,
            false,
          );
        }
      },
      validateReferences({ game, effect, mapId, label }) {
        if (effect.afterClose !== undefined) {
          validateEffectsReferences(
            game,
            effect.afterClose,
            mapId,
            `${label}.afterClose`,
          );
        }
      },
      execute({ game, effect, mapId, ownerId }) {
        return game.showText({
          pages: effect.pages,
          speaker: effect.speaker ?? null,
          afterClose: effect.afterClose ?? null,
          mapId,
          ownerId,
        });
      },
    },
  ],
]);

function effectCanOpenDialogue(effect) {
  if (effect.type === "showText") return true;
  if (effect.type !== "random") return false;
  return (effect.choices ?? []).some((choice) =>
    (choice.effects ?? []).some((nestedEffect) =>
      effectCanOpenDialogue(nestedEffect),
    ),
  );
}

function validateEffectSequence(effects, label) {
  effects.forEach((effect, index) => {
    if (!effectCanOpenDialogue(effect)) return;

    for (
      let laterIndex = index + 1;
      laterIndex < effects.length;
      laterIndex += 1
    ) {
      const laterEffect = effects[laterIndex];
      if (!conditionsCanOverlap(effect.condition, laterEffect.condition))
        continue;

      const laterLabel = `${label}[${laterIndex}]`;
      if (effectCanOpenDialogue(laterEffect)) {
        throw new Error(
          `${laterLabel} can open dialogue after ${label}[${index}] may already open it. ` +
            "Only one showText may be reachable in an effect array; use afterClose for later dialogue.",
        );
      }

      throw new Error(
        `${laterLabel} can run after ${label}[${index}] may open dialogue. ` +
          "showText must be the final reachable effect; move later effects into afterClose.",
      );
    }
  });
}

function validateEffectsDefinitionInternal(
  effects,
  label,
  randomIds,
  allowEmpty,
) {
  if (allowEmpty) requireArray(effects, label);
  else requireNonEmptyArray(effects, label);

  effects.forEach((effect, index) => {
    const effectLabel = `${label}[${index}]`;
    requireObject(effect, effectLabel);
    requireString(effect.type, `${effectLabel}.type`);

    if (effect.condition !== undefined) {
      validateCondition(effect.condition, `${effectLabel}.condition`);
    }

    const handler = EFFECT_HANDLERS.get(effect.type);
    if (!handler) {
      throw new Error(
        `${effectLabel} references unknown effect type "${effect.type}".`,
      );
    }

    handler.validateDefinition({ effect, label: effectLabel, randomIds });
  });

  validateEffectSequence(effects, label);
}

export function validateEffectsDefinition(effects, label) {
  validateEffectsDefinitionInternal(effects, label, new Set(), false);
}

export function validateEffectsReferences(game, effects, mapId, label) {
  effects.forEach((effect, index) => {
    const effectLabel = `${label}[${index}]`;
    if (effect.condition !== undefined) {
      validateConditionReferences(
        game,
        effect.condition,
        `${effectLabel}.condition`,
      );
    }

    const handler = EFFECT_HANDLERS.get(effect.type);
    handler.validateReferences?.({
      game,
      effect,
      mapId,
      label: effectLabel,
    });
  });
}

export function visitEffects(effects, visitor) {
  for (const effect of effects) {
    visitor(effect);
    if (effect.type === "showText" && effect.afterClose !== undefined) {
      visitEffects(effect.afterClose, visitor);
    }
    if (effect.type === "random") {
      for (const choice of effect.choices ?? []) {
        visitEffects(choice.effects, visitor);
      }
    }
  }
}

export function collectRandomEffectIds(effects, output = []) {
  visitEffects(effects ?? [], (effect) => {
    if (effect.type === "random") output.push(effect.id);
  });
  return output;
}

export function runEffects(game, effects, context) {
  const runFrom = (startIndex) => {
    for (let index = startIndex; index < effects.length; index += 1) {
      const effect = effects[index];
      if (effect.condition && !game.evaluateCondition(effect.condition))
        continue;

      const handler = EFFECT_HANDLERS.get(effect.type);
      const result = handler.execute({ game, effect, ...context });
      if (result && typeof result.then === "function") {
        return result.then(() => runFrom(index + 1));
      }
    }
    return undefined;
  };

  return runFrom(0);
}
