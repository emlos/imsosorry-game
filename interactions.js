import { validateCondition, validateConditionReferences } from "./conditions.js";
import { validateEffectsDefinition, validateEffectsReferences } from "./effects.js";
import {
    requireExactKeys,
    requireNonEmptyArray,
    requireObject,
    requireString,
} from "./validation.js";

export const INTERACTION_TRIGGERS = new Set(["action", "touch"]);

export const COMMON_INTERACTIONS = {
    SAVE_POINT: {
        handler: "effects",
        triggers: ["action"],
        effects: [
            {
                type: "showText",
                speaker: "Save Point",
                pages: [
                    "A small light holds perfectly still inside the glass.",
                    "For a moment, the shape of the dream becomes easy to remember.",
                ],
                afterClose: [{ type: "saveGame" }],
            },
        ],
    },
};

export const INTERACTION_HANDLERS = new Map([
    [
        "effects",
        {
            allowedKeys: new Set(["handler", "triggers", "condition", "effects", "message"]),

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
                game.runEffects(target.interaction.effects, {
                    mapId: sourceMapId,
                });
            },
        },
    ],
    [
        "teleport",
        {
            allowedKeys: new Set(["handler", "triggers", "condition", "params", "message"]),

            validateDefinition({ interaction, label }) {
                if (!Object.hasOwn(interaction, "params")) {
                    throw new Error(`${label} must define a params object.`);
                }
                requireObject(interaction.params, `${label}.params`);

                const { mapId, entryId } = interaction.params;
                requireString(mapId, `${label}.params.mapId`);
                requireString(entryId, `${label}.params.entryId`);
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
