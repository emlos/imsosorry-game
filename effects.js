import {
    conditionsCanOverlap,
    validateCondition,
    validateConditionReferences,
} from "./conditions.js";

function requireEffectObject(effect, label) {
    if (!effect || typeof effect !== "object" || Array.isArray(effect)) {
        throw new Error(`${label} must be an object.`);
    }
}

function requireString(value, label) {
    if (typeof value !== "string" || value.length === 0) {
        throw new Error(`${label} must be a non-empty string.`);
    }
}

function requireInteger(value, label) {
    if (!Number.isInteger(value) || value < 0) {
        throw new Error(`${label} must be a non-negative integer.`);
    }
}

function requirePositiveInteger(value, label) {
    if (!Number.isInteger(value) || value <= 0) {
        throw new Error(`${label} must be a positive integer.`);
    }
}

function requirePositiveNumber(value, label) {
    if (!Number.isFinite(value) || value <= 0) {
        throw new Error(`${label} must be a positive number.`);
    }
}

function requireBoolean(value, label) {
    if (typeof value !== "boolean") {
        throw new Error(`${label} must be a boolean.`);
    }
}

function requireExactKeys(effect, allowedKeys, label) {
    for (const key of Object.keys(effect)) {
        if (!allowedKeys.has(key)) {
            throw new Error(`${label} contains unsupported property "${key}".`);
        }
    }
}

function validateJsonValue(value, label) {
    if (value === null || typeof value === "string" || typeof value === "boolean") return;
    if (typeof value === "number" && Number.isFinite(value)) return;

    if (Array.isArray(value)) {
        value.forEach((child, index) => validateJsonValue(child, `${label}[${index}]`));
        return;
    }

    if (value && typeof value === "object") {
        const prototype = Object.getPrototypeOf(value);
        if (prototype !== Object.prototype && prototype !== null) {
            throw new Error(`${label} must contain only JSON-compatible values.`);
        }

        for (const [key, child] of Object.entries(value)) {
            validateJsonValue(child, `${label}.${key}`);
        }
        return;
    }

    throw new Error(`${label} must contain only JSON-compatible values.`);
}

function effectKeys(...keys) {
    return new Set(["type", "condition", ...keys]);
}

function validatePages(pages, label) {
    if (!Array.isArray(pages) || pages.length === 0) {
        throw new Error(`${label} must be a non-empty array.`);
    }

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
                validateJsonValue(effect.value, `${label}.value`);
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
        "consumeItem",
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
                game.consumeItem(effect.itemId, effect.quantity);
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
                requireInteger(effect.col, `${label}.col`);
                requireInteger(effect.row, `${label}.row`);
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
                requireInteger(effect.col, `${label}.col`);
                requireInteger(effect.row, `${label}.row`);
                if (!Number.isInteger(effect.tileId)) {
                    throw new Error(`${label}.tileId must be an integer.`);
                }
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
                requireExactKeys(effect, effectKeys("mapId", "entryId"), label);
                requireString(effect.mapId, `${label}.mapId`);
                requireString(effect.entryId, `${label}.entryId`);
            },
            validateReferences({ game, effect, label }) {
                game.validateEntryReference(effect.mapId, effect.entryId, label);
            },
            execute({ game, effect }) {
                game.transitionTo({ mapId: effect.mapId, entryId: effect.entryId });
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
                requireExactKeys(effect, effectKeys("musicId"), label);
                requireString(effect.musicId, `${label}.musicId`);
            },
            validateReferences({ game, effect, label }) {
                game.validateMusicReference(effect.musicId, label);
            },
            execute({ game, effect }) {
                game.playMusic(effect.musicId);
            },
        },
    ],
    [
        "stopMusic",
        {
            validateDefinition({ effect, label }) {
                requireExactKeys(effect, effectKeys(), label);
            },
            execute({ game }) {
                game.stopMusic();
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
    if (!Array.isArray(effects) || effects.length === 0) {
        throw new Error(`${label} must be a non-empty array.`);
    }

    effects.forEach((effect, index) => {
        const effectLabel = `${label}[${index}]`;
        requireEffectObject(effect, effectLabel);
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

export function runEffects(game, effects, mapId) {
    for (const effect of effects) {
        if (effect.condition && !game.evaluateCondition(effect.condition)) {
            continue;
        }

        const handler = EFFECT_HANDLERS.get(effect.type);
        handler.execute({ game, effect, mapId });
    }
}
