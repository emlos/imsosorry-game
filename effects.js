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

const EFFECT_HANDLERS = new Map([
    [
        "setFlag",
        {
            rebuild: "active",

            validateDefinition({ effect, label }) {
                requireExactKeys(effect, new Set(["type", "flag", "value"]), label);
                requireString(effect.flag, `${label}.flag`);

                if (!Object.hasOwn(effect, "value")) {
                    throw new Error(`${label} must define value.`);
                }
            },

            execute({ game, effect }) {
                game.setFlag(effect.flag, effect.value);
            },
        },
    ],
    [
        "addItem",
        {
            rebuild: "active",

            validateDefinition({ effect, label }) {
                requireExactKeys(effect, new Set(["type", "itemId"]), label);
                requireString(effect.itemId, `${label}.itemId`);
            },

            execute({ game, effect }) {
                game.addItem(effect.itemId);
            },
        },
    ],
    [
        "removeItem",
        {
            rebuild: "active",

            validateDefinition({ effect, label }) {
                requireExactKeys(effect, new Set(["type", "itemId"]), label);
                requireString(effect.itemId, `${label}.itemId`);
            },

            execute({ game, effect }) {
                game.removeItem(effect.itemId);
            },
        },
    ],
    [
        "setEntityActive",
        {
            rebuild: "sourceMap",

            validateDefinition({ effect, label }) {
                requireExactKeys(effect, new Set(["type", "entityId", "active"]), label);
                requireString(effect.entityId, `${label}.entityId`);
                requireBoolean(effect.active, `${label}.active`);
            },

            validateReferences({ game, effect, mapId, label }) {
                game.validateEntityReference(mapId, effect.entityId, label);
            },

            execute({ game, effect, mapId }) {
                game.setEntityActive(mapId, effect.entityId, effect.active);
            },
        },
    ],
    [
        "setEntityPosition",
        {
            rebuild: "sourceMap",

            validateDefinition({ effect, label }) {
                requireExactKeys(effect, new Set(["type", "entityId", "col", "row"]), label);
                requireString(effect.entityId, `${label}.entityId`);
                requireInteger(effect.col, `${label}.col`);
                requireInteger(effect.row, `${label}.row`);
            },

            validateReferences({ game, effect, mapId, label }) {
                game.validateEntityReference(mapId, effect.entityId, label);
                game.validateMapPosition(mapId, effect.col, effect.row, label);
            },

            execute({ game, effect, mapId }) {
                game.setEntityPosition(mapId, effect.entityId, effect.col, effect.row);
            },
        },
    ],
    [
        "setEntitySprite",
        {
            rebuild: false,

            validateDefinition({ effect, label }) {
                requireExactKeys(effect, new Set(["type", "entityId", "spriteId"]), label);
                requireString(effect.entityId, `${label}.entityId`);
                requireString(effect.spriteId, `${label}.spriteId`);
            },

            validateReferences({ game, effect, mapId, label }) {
                game.validateEntityReference(mapId, effect.entityId, label);
                game.validateSpriteReference(effect.spriteId, label);
            },

            execute({ game, effect, mapId }) {
                game.setEntitySprite(mapId, effect.entityId, effect.spriteId);
            },
        },
    ],
    [
        "setEntityCollision",
        {
            rebuild: "sourceMap",

            validateDefinition({ effect, label }) {
                requireExactKeys(effect, new Set(["type", "entityId", "collision"]), label);
                requireString(effect.entityId, `${label}.entityId`);
                requireBoolean(effect.collision, `${label}.collision`);
            },

            validateReferences({ game, effect, mapId, label }) {
                game.validateEntityReference(mapId, effect.entityId, label);
            },

            execute({ game, effect, mapId }) {
                game.setEntityCollision(mapId, effect.entityId, effect.collision);
            },
        },
    ],
    [
        "setTile",
        {
            rebuild: "sourceMap",

            validateDefinition({ effect, label }) {
                requireExactKeys(effect, new Set(["type", "layer", "col", "row", "tileId"]), label);
                requireString(effect.layer, `${label}.layer`);
                requireInteger(effect.col, `${label}.col`);
                requireInteger(effect.row, `${label}.row`);

                if (!Number.isInteger(effect.tileId)) {
                    throw new Error(`${label}.tileId must be an integer.`);
                }
            },

            validateReferences({ game, effect, mapId, label }) {
                game.validateTileReference(
                    mapId,
                    effect.layer,
                    effect.col,
                    effect.row,
                    effect.tileId,
                    label,
                );
            },

            execute({ game, effect, mapId }) {
                game.setTile(mapId, effect.layer, effect.col, effect.row, effect.tileId);
            },
        },
    ],
    [
        "playSound",
        {
            rebuild: false,

            validateDefinition({ effect, label }) {
                requireExactKeys(effect, new Set(["type", "soundId"]), label);
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
]);

export function validateEffectsDefinition(effects, label) {
    if (!Array.isArray(effects) || effects.length === 0) {
        throw new Error(`${label} must be a non-empty array.`);
    }

    effects.forEach((effect, index) => {
        const effectLabel = `${label}[${index}]`;
        requireEffectObject(effect, effectLabel);
        requireString(effect.type, `${effectLabel}.type`);

        const handler = EFFECT_HANDLERS.get(effect.type);
        if (!handler) {
            throw new Error(`${effectLabel} references unknown effect type "${effect.type}".`);
        }

        handler.validateDefinition({ effect, label: effectLabel });
    });
}

export function validateEffectsReferences(game, effects, mapId, label) {
    effects.forEach((effect, index) => {
        const handler = EFFECT_HANDLERS.get(effect.type);
        handler.validateReferences?.({
            game,
            effect,
            mapId,
            label: `${label}[${index}]`,
        });
    });
}

export function runEffects(game, effects, mapId) {
    validateEffectsDefinition(effects, "Effects");
    validateEffectsReferences(game, effects, mapId, "Effects");

    let rebuildActive = false;
    let rebuildSourceMap = false;

    for (const effect of effects) {
        const handler = EFFECT_HANDLERS.get(effect.type);
        handler.execute({ game, effect, mapId });

        if (handler.rebuild === "active") {
            rebuildActive = true;
        } else if (handler.rebuild === "sourceMap") {
            rebuildSourceMap = true;
        }
    }

    if (rebuildActive || (rebuildSourceMap && game.state.player.mapId === mapId)) {
        game.rebuildActiveSpatialData();
    }
}
