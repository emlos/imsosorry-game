import { validateCondition } from "./conditions.js";
import { validateEffectsDefinition, validateEffectsReferences } from "./effects.js";

export const INTERACTION_TRIGGERS = new Set(["action", "touch", "both"]); //TODO: remove 'both', make the trigger property into triggers: []

//TODO: there has to be a better system for this
export const INTERACTIONS = {
    PINK_ORB: {
        handler: "effects",
        trigger: "both",
        effects: [
            { type: "addItem", itemId: "pink-orb" },
            { type: "playSound", soundId: "orb-collect" },
            { type: "setEntityActive", entityId: "pink-orb", active: false },
        ],
        message: "You found the pink orb.",
    },
    ROOM_01_NORTH_DOOR: {
        handler: "teleport",
        trigger: "action",
        params: {
            mapId: "room-02",
            entryId: "fromRoom01",
        },
        message: "The door opens.",
    },
    ROOM_02_SOUTH_DOOR: {
        handler: "teleport",
        trigger: "action",
        params: {
            mapId: "room-01",
            entryId: "fromRoom02",
        },
        message: "You return through the door.",
    },
    ROOM_02_NORTH_DOOR: {
        handler: "teleport",
        trigger: "action",
        params: {
            mapId: "room-03",
            entryId: "fromRoom02",
        },
        message: "The door opens into another room.",
    },
    ROOM_03_SOUTH_DOOR: {
        handler: "teleport",
        trigger: "action",
        params: {
            mapId: "room-02",
            entryId: "fromRoom03",
        },
        message: "You return to the previous room.",
    },
    BLUE_ORB: {
        handler: "effects",
        trigger: "both",
        effects: [
            { type: "setFlag", flag: "room03.orbCollected", value: true },
            { type: "addItem", itemId: "blue-orb" },
            { type: "playSound", soundId: "orb-collect" },
            { type: "setTile", layer: "obstacles", col: 4, row: 3, tileId: -1 },
            { type: "setEntityActive", entityId: "blue-orb", active: false },
        ],
        message: "The blue orb dissolves. A section of the wall disappears.",
    },
};

function requireInteractionObject(interaction, label) {
    if (!interaction || typeof interaction !== "object" || Array.isArray(interaction)) {
        throw new Error(`${label} must be an object.`);
    }
}

function requireExactKeys(interaction, allowedKeys, label) {
    for (const key of Object.keys(interaction)) {
        if (!allowedKeys.has(key)) {
            throw new Error(`${label} contains unsupported property "${key}".`);
        }
    }
}

function requireParamsObject(interaction, label) {
    if (
        !interaction.params ||
        typeof interaction.params !== "object" ||
        Array.isArray(interaction.params)
    ) {
        throw new Error(`${label} must define a params object.`);
    }
}

export const INTERACTION_HANDLERS = new Map([
    [
        "effects",
        {
            allowedKeys: new Set(["handler", "trigger", "condition", "effects", "message"]),

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
            allowedKeys: new Set(["handler", "trigger", "condition", "params", "message"]),

            validateDefinition({ interaction, label }) {
                requireParamsObject(interaction, label);

                const { mapId, entryId } = interaction.params;
                if (typeof mapId !== "string" || mapId.length === 0) {
                    throw new Error(`${label} must define params.mapId.`);
                }

                if (typeof entryId !== "string" || entryId.length === 0) {
                    throw new Error(`${label} must define params.entryId.`);
                }
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
    requireInteractionObject(interaction, label);

    if (typeof interaction.handler !== "string" || interaction.handler.length === 0) {
        throw new Error(`${label} must define a handler.`);
    }

    if (!INTERACTION_TRIGGERS.has(interaction.trigger)) {
        throw new Error(`${label} must use trigger: "action", "touch", or "both".`);
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
    const handler = INTERACTION_HANDLERS.get(interaction.handler);
    handler.validateReferences?.({ game, interaction, sourceMapId, label });
}
