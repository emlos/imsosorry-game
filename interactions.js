import { validateCondition, validateConditionReferences } from "./conditions.js";
import { validateEffectsDefinition, validateEffectsReferences } from "./effects.js";
import {
    requireExactKeys,
    requireNonEmptyArray,
    requireObject,
    requireString,
} from "./validation.js";

export const INTERACTION_TRIGGERS = new Set(["action", "touch"]);
const MUSIC_TRANSITION_POLICIES = new Set(["inherit", "replace", "crossfade", "silence"]);

function cloneDefinition(value) {
    return JSON.parse(JSON.stringify(value));
}

function buildInteractionBase(handler, triggers, condition, message) {
    const interaction = {
        handler,
        triggers: [...triggers],
    };

    if (condition !== undefined) interaction.condition = cloneDefinition(condition);
    if (message !== undefined) interaction.message = message;
    return interaction;
}

function validateMusicTransitionOptions(value, label) {
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
        throw new Error(`${label}.musicTransitionMs must be a non-negative number.`);
    }
}

export function findPrimaryShowTextEffect(interaction) {
    if (interaction?.handler !== "effects" || !Array.isArray(interaction.effects)) return null;

    return interaction.effects.find((effect) => effect?.type === "showText") ?? null;
}

export const INTERACTION_HANDLERS = new Map([
    [
        "effects",
        {
            allowedKeys: new Set(["handler", "triggers", "condition", "effects", "message"]),

            createDefault({
                triggers = ["action"],
                condition,
                effects = [
                    {
                        type: "showText",
                        pages: ["Describe this object."],
                    },
                ],
                message,
            } = {}) {
                return {
                    ...buildInteractionBase("effects", triggers, condition, message),
                    effects: cloneDefinition(effects),
                };
            },

            validateDefinition({ interaction, label }) {
                validateEffectsDefinition(interaction.effects, `Effects for ${label}`);
            },

            validateReferences({ game, interaction, sourceMapId, label }) {
                validateEffectsReferences(
                    game,
                    interaction.effects,
                    sourceMapId,
                    `Effects for ${label}`,
                );
            },

            execute({ game, target, sourceMapId }) {
                const ownerId =
                    target.kind === "entity"
                        ? `map:${sourceMapId}:entity:${target.entityId}`
                        : `map:${sourceMapId}:tile-events`;
                game.runEffects(target.interaction.effects, {
                    mapId: sourceMapId,
                    ownerId,
                });
            },
        },
    ],
    [
        "teleport",
        {
            allowedKeys: new Set(["handler", "triggers", "condition", "params", "message"]),

            createDefault({
                triggers = ["action"],
                condition,
                mapId = "map-id",
                entryId = "entry-id",
                musicTransition,
                musicTransitionMs,
                message,
            } = {}) {
                const params = { mapId, entryId };
                if (musicTransition !== undefined) params.musicTransition = musicTransition;
                if (musicTransitionMs !== undefined) params.musicTransitionMs = musicTransitionMs;

                return {
                    ...buildInteractionBase("teleport", triggers, condition, message),
                    params,
                };
            },

            validateDefinition({ interaction, label }) {
                if (!Object.hasOwn(interaction, "params")) {
                    throw new Error(`${label} must define a params object.`);
                }
                requireObject(interaction.params, `${label}.params`);

                const { mapId, entryId } = interaction.params;
                requireExactKeys(
                    interaction.params,
                    new Set(["mapId", "entryId", "musicTransition", "musicTransitionMs"]),
                    `${label}.params`,
                );
                requireString(mapId, `${label}.params.mapId`);
                requireString(entryId, `${label}.params.entryId`);
                validateMusicTransitionOptions(interaction.params, `${label}.params`);
            },

            validateReferences({ game, interaction, sourceMapId, label }) {
                const { mapId, entryId } = interaction.params;
                game.validateEntryReference(mapId, entryId, `${label} from "${sourceMapId}"`);
            },

            execute({ game, target }) {
                game.transitionTo(target.interaction.params);
            },
        },
    ],
]);

export function createDefaultInteraction(handlerId, options = {}) {
    requireString(handlerId, "Interaction handler ID");
    const handler = INTERACTION_HANDLERS.get(handlerId);
    if (!handler) {
        throw new Error(`Unknown interaction handler "${handlerId}".`);
    }
    if (typeof handler.createDefault !== "function") {
        throw new Error(`Interaction handler "${handlerId}" does not expose createDefault().`);
    }
    return handler.createDefault(options);
}

export function validateInteractionDefinition(interaction, label) {
    requireObject(interaction, label);

    requireString(interaction.handler, `${label}.handler`);

    requireNonEmptyArray(interaction.triggers, `${label}.triggers`);

    const seenTriggers = new Set();
    for (const trigger of interaction.triggers) {
        if (!INTERACTION_TRIGGERS.has(trigger)) {
            throw new Error(
                `${label}.triggers contains unknown trigger ${JSON.stringify(trigger)}. ` +
                    'Expected "action" or "touch".',
            );
        }

        if (seenTriggers.has(trigger)) {
            throw new Error(`${label}.triggers contains duplicate trigger "${trigger}".`);
        }
        seenTriggers.add(trigger);
    }

    if (interaction.message !== undefined && typeof interaction.message !== "string") {
        throw new Error(`${label}.message must be a string.`);
    }

    if (interaction.condition) {
        validateCondition(interaction.condition, `Condition for ${label}`);
    }

    const handler = INTERACTION_HANDLERS.get(interaction.handler);
    if (!handler) {
        throw new Error(`${label} references unknown handler "${interaction.handler}".`);
    }

    requireExactKeys(interaction, handler.allowedKeys, label);
    handler.validateDefinition({ interaction, label });
}

export function validateInteractionReferences(game, interaction, sourceMapId, label) {
    if (interaction.condition) {
        validateConditionReferences(game, interaction.condition, `Condition for ${label}`);
    }

    const handler = INTERACTION_HANDLERS.get(interaction.handler);
    handler.validateReferences?.({ game, interaction, sourceMapId, label });
}
