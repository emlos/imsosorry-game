import {
    conditionsCanOverlap,
    validateCondition,
    validateConditionReferences,
} from "./conditions.js";

import {
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

function effectKeys(...keys) {
    return new Set(["type", "condition", ...keys]);
}

const MUSIC_RESTART_POLICIES = new Set(["always", "if-different", "never"]);
const MUSIC_TRANSITION_POLICIES = new Set(["inherit", "replace", "crossfade", "silence"]);

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
    if (effect.restart !== undefined && !MUSIC_RESTART_POLICIES.has(effect.restart)) {
        throw new Error(`${label}.restart must be "always", "if-different", or "never".`);
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
        throw new Error(`${label}.mapId is required for map-local inventory effects.`);
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
                requireExactKeys(effect, effectKeys("mapId", "entityId", "active"), label);
                if (effect.mapId !== undefined) requireString(effect.mapId, `${label}.mapId`);
                requireString(effect.entityId, `${label}.entityId`);
                requireBoolean(effect.active, `${label}.active`);
            },
            validateReferences({ game, effect, mapId, label }) {
                game.validateEntityReference(
                    getEffectMapId(effect, mapId, label),
                    effect.entityId,
                    label,
                );
            },
            execute({ game, effect, mapId }) {
                game.setEntityActive(effect.mapId ?? mapId, effect.entityId, effect.active);
            },
        },
    ],
    [
        "setEntityPosition",
        {
            validateDefinition({ effect, label }) {
                requireExactKeys(effect, effectKeys("mapId", "entityId", "col", "row"), label);
                if (effect.mapId !== undefined) requireString(effect.mapId, `${label}.mapId`);
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
        "setEntitySprite",
        {
            validateDefinition({ effect, label }) {
                requireExactKeys(effect, effectKeys("mapId", "entityId", "spriteId"), label);
                if (effect.mapId !== undefined) requireString(effect.mapId, `${label}.mapId`);
                requireString(effect.entityId, `${label}.entityId`);
                requireString(effect.spriteId, `${label}.spriteId`);
            },
            validateReferences({ game, effect, mapId, label }) {
                game.validateEntityReference(
                    getEffectMapId(effect, mapId, label),
                    effect.entityId,
                    label,
                );
                game.validateSpriteReference(effect.spriteId, label);
            },
            execute({ game, effect, mapId }) {
                game.setEntitySprite(effect.mapId ?? mapId, effect.entityId, effect.spriteId);
            },
        },
    ],
    [
        "setEntityCollision",
        {
            validateDefinition({ effect, label }) {
                requireExactKeys(effect, effectKeys("mapId", "entityId", "collision"), label);
                if (effect.mapId !== undefined) requireString(effect.mapId, `${label}.mapId`);
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
                game.setEntityCollision(effect.mapId ?? mapId, effect.entityId, effect.collision);
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
                if (effect.mapId !== undefined) requireString(effect.mapId, `${label}.mapId`);
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
                    effectKeys("mapId", "entryId", "musicTransition", "musicTransitionMs"),
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
                requireExactKeys(effect, effectKeys("fadeInMs", "fadeOutMs", "crossfadeMs"), label);
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
        "showText",
        {
            validateDefinition({ effect, label }) {
                requireExactKeys(effect, effectKeys("pages", "speaker", "afterClose"), label);
                validatePages(effect.pages, `${label}.pages`);

                if (effect.speaker !== undefined) {
                    requireString(effect.speaker, `${label}.speaker`);
                }

                if (effect.afterClose !== undefined) {
                    validateEffectsDefinition(effect.afterClose, `${label}.afterClose`);
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
            execute({ game, effect, mapId }) {
                game.showText({
                    pages: effect.pages,
                    speaker: effect.speaker ?? null,
                    afterClose: effect.afterClose ?? null,
                    mapId,
                });
            },
        },
    ],
]);

function validateEffectSequence(effects, label) {
    effects.forEach((effect, index) => {
        if (effect.type !== "showText") return;

        for (let laterIndex = index + 1; laterIndex < effects.length; laterIndex += 1) {
            const laterEffect = effects[laterIndex];
            if (!conditionsCanOverlap(effect.condition, laterEffect.condition)) continue;

            const laterLabel = `${label}[${laterIndex}]`;
            if (laterEffect.type === "showText") {
                throw new Error(
                    `${laterLabel} can open dialogue after ${label}[${index}] on the same condition path. ` +
                        "Only one showText may be reachable in an effect array; use afterClose for later dialogue.",
                );
            }

            throw new Error(
                `${laterLabel} can run after ${label}[${index}] opens dialogue. ` +
                    "showText must be the final reachable effect; move later effects into afterClose.",
            );
        }
    });
}

export function validateEffectsDefinition(effects, label) {
    requireNonEmptyArray(effects, label);

    effects.forEach((effect, index) => {
        const effectLabel = `${label}[${index}]`;
        requireObject(effect, effectLabel);
        requireString(effect.type, `${effectLabel}.type`);

        if (effect.condition !== undefined) {
            validateCondition(effect.condition, `${effectLabel}.condition`);
        }

        const handler = EFFECT_HANDLERS.get(effect.type);
        if (!handler) {
            throw new Error(`${effectLabel} references unknown effect type "${effect.type}".`);
        }

        handler.validateDefinition({ effect, label: effectLabel });
    });

    validateEffectSequence(effects, label);
}

export function validateEffectsReferences(game, effects, mapId, label) {
    effects.forEach((effect, index) => {
        const effectLabel = `${label}[${index}]`;
        if (effect.condition !== undefined) {
            validateConditionReferences(game, effect.condition, `${effectLabel}.condition`);
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
    }
}

export function runEffects(game, effects, mapId) {
    for (const effect of effects) {
        if (effect.condition && !game.evaluateCondition(effect.condition)) {
            continue;
        }

        const handler = EFFECT_HANDLERS.get(effect.type);
        handler.execute({ game, effect, mapId });
    }
}
