import {
  validateCondition,
  validateConditionReferences,
} from "./conditions.js";
import {
  validateEffectsDefinition,
  validateEffectsReferences,
} from "./effects.js";
import {
  requireArray,
  requireExactKeys,
  requireNonEmptyArray,
  requireObject,
  requireString,
} from "./validation.js";

export const MUSIC_RESTART_POLICIES = new Set([
  "always",
  "if-different",
  "never",
]);
export const MUSIC_TRANSITION_POLICIES = new Set([
  "inherit",
  "replace",
  "crossfade",
  "silence",
]);
export const MUSIC_EVENT_FREQUENCIES = new Set([
  "once-per-visit",
  "first-entry",
  "once-per-save",
]);

const MUSIC_CONFIG_KEYS = new Set([
  "condition",
  "trackId",
  "continuityId",
  "fadeInMs",
  "fadeOutMs",
  "crossfadeMs",
  "restart",
  "resume",
  "volume",
  "playbackRate",
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

function validateMusicConfig(
  config,
  label,
  { allowMissingTrack = false } = {},
) {
  requireObject(config, label);
  requireExactKeys(config, MUSIC_CONFIG_KEYS, label);

  if (config.condition !== undefined) {
    validateCondition(config.condition, `${label}.condition`);
  }

  if (config.trackId === undefined) {
    if (!allowMissingTrack) throw new Error(`${label}.trackId is required.`);
  } else {
    requireString(config.trackId, `${label}.trackId`);
  }

  if (config.continuityId !== undefined) {
    requireString(config.continuityId, `${label}.continuityId`);
  }

  for (const key of ["fadeInMs", "fadeOutMs", "crossfadeMs"]) {
    if (config[key] !== undefined) {
      requireNonNegativeNumber(config[key], `${label}.${key}`);
    }
  }

  if (
    config.restart !== undefined &&
    !MUSIC_RESTART_POLICIES.has(config.restart)
  ) {
    throw new Error(
      `${label}.restart must be "always", "if-different", or "never".`,
    );
  }

  if (config.resume !== undefined && typeof config.resume !== "boolean") {
    throw new Error(`${label}.resume must be a boolean.`);
  }

  if (config.volume !== undefined) {
    requireRange(config.volume, 0, 1, `${label}.volume`);
  }
  if (config.playbackRate !== undefined) {
    requireRange(config.playbackRate, 0.25, 4, `${label}.playbackRate`);
  }
}

function validateMusicDefinition(music, label) {
  if (music === undefined || music === null) return;

  if (!Array.isArray(music)) {
    validateMusicConfig(music, label);
    if (music.condition !== undefined) {
      throw new Error(`${label}.condition requires a conditional music array.`);
    }
    return;
  }

  requireNonEmptyArray(music, label);
  const fallbackIndexes = [];

  music.forEach((config, index) => {
    const configLabel = `${label}[${index}]`;
    validateMusicConfig(config, configLabel, {
      allowMissingTrack: index < music.length - 1,
    });
    if (config.condition === undefined) fallbackIndexes.push(index);
  });

  if (fallbackIndexes.length !== 1 || fallbackIndexes[0] !== music.length - 1) {
    throw new Error(
      `${label} must end with exactly one unconditional fallback entry.`,
    );
  }
}

function validateMusicEvent(event, map, index) {
  const label = `Map "${map.id}" musicEvents[${index}]`;
  requireObject(event, label);
  requireExactKeys(
    event,
    new Set([
      "id",
      "frequency",
      "entryId",
      "probability",
      "condition",
      "effects",
    ]),
    label,
  );
  requireString(event.id, `${label}.id`);

  if (
    event.frequency !== undefined &&
    !MUSIC_EVENT_FREQUENCIES.has(event.frequency)
  ) {
    throw new Error(
      `${label}.frequency must be "once-per-visit", "first-entry", or "once-per-save".`,
    );
  }

  if (event.entryId !== undefined) {
    requireString(event.entryId, `${label}.entryId`);
    if (!Object.hasOwn(map.entries, event.entryId)) {
      throw new Error(
        `${label}.entryId references missing entry "${event.entryId}".`,
      );
    }
  }

  if (event.probability !== undefined) {
    requireRange(event.probability, 0, 1, `${label}.probability`);
  }

  if (event.condition !== undefined) {
    validateCondition(event.condition, `${label}.condition`);
  }

  validateEffectsDefinition(event.effects, `${label}.effects`);
}

export function validateMapMusicDefinition(map) {
  validateMusicDefinition(map.music, `Map "${map.id}" music`);

  if (map.musicTransition !== undefined) {
    if (!MUSIC_TRANSITION_POLICIES.has(map.musicTransition)) {
      throw new Error(
        `Map "${map.id}".musicTransition must be "inherit", "replace", "crossfade", or "silence".`,
      );
    }
  }

  if (map.musicTransitionMs !== undefined) {
    requireNonNegativeNumber(
      map.musicTransitionMs,
      `Map "${map.id}".musicTransitionMs`,
    );
  }

  if (map.musicEvents === undefined) return;
  requireArray(map.musicEvents, `Map "${map.id}" musicEvents`);
  const ids = new Set();
  map.musicEvents.forEach((event, index) => {
    validateMusicEvent(event, map, index);
    if (ids.has(event.id)) {
      throw new Error(
        `Map "${map.id}" contains duplicate music event ID "${event.id}".`,
      );
    }
    ids.add(event.id);
  });
}

function validateConfigReferences(game, config, label, fallbackTrackId = null) {
  if (config.condition !== undefined) {
    validateConditionReferences(game, config.condition, `${label}.condition`);
  }

  const trackId = config.trackId ?? fallbackTrackId;
  if (trackId !== null) game.validateMusicReference(trackId, label);
}

export function validateMapMusicReferences(game, map) {
  if (map.music !== undefined && map.music !== null) {
    if (Array.isArray(map.music)) {
      const fallback = map.music.at(-1);
      for (let index = 0; index < map.music.length; index += 1) {
        validateConfigReferences(
          game,
          map.music[index],
          `Map "${map.id}" music[${index}]`,
          fallback.trackId,
        );
      }
    } else {
      validateConfigReferences(game, map.music, `Map "${map.id}" music`);
    }
  }

  for (const [index, event] of (map.musicEvents ?? []).entries()) {
    const label = `Map "${map.id}" musicEvents[${index}]`;
    if (event.condition !== undefined) {
      validateConditionReferences(game, event.condition, `${label}.condition`);
    }
    validateEffectsReferences(game, event.effects, map.id, `${label}.effects`);
  }
}

function withoutCondition(config) {
  const { condition, ...playback } = config;
  return playback;
}

export function resolveMapMusic(music, evaluate) {
  if (music === undefined) return { kind: "inherit" };
  if (music === null) return { kind: "silence" };
  if (!Array.isArray(music))
    return { kind: "play", options: withoutCondition(music) };

  const fallback = withoutCondition(music.at(-1));
  const conditional = music
    .slice(0, -1)
    .find((config) => evaluate(config.condition));

  return {
    kind: "play",
    options: conditional
      ? { ...fallback, ...withoutCondition(conditional) }
      : fallback,
  };
}
