import { validateCondition, validateConditionReferences } from "./conditions.js";
import { validateEffectsDefinition, validateEffectsReferences } from "./effects.js";
import { requireExactKeys, requireObject, requireString } from "./validation.js";

export const INTERACTION_TRIGGERS = new Set(["action", "touch", "both"]); //TODO: remove 'both', make the trigger property into triggers: []

//TODO: there has to be a better system for this
export const INTERACTIONS = {
    PINK_ORB: {
        handler: "effects",
        trigger: "both",
        effects: [
            { type: "addItem", itemId: "pink-orb", quantity: 1 },
            { type: "playSound", soundId: "orb-collect" },
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
    ROOM_01_EAST_DOOR: {
        handler: "teleport",
        trigger: "action",
        params: {
            mapId: "room-04",
            entryId: "fromRoom01",
        },
        message: "The side door opens.",
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
    ROOM_04_WEST_DOOR: {
        handler: "teleport",
        trigger: "action",
        params: {
            mapId: "room-01",
            entryId: "fromRoom04",
        },
        message: "You return to the main room.",
    },
    BLUE_ORB: {
        handler: "effects",
        trigger: "both",
        effects: [
            { type: "setFlag", flag: "room03.orbCollected", value: true },
            { type: "playSound", soundId: "orb-collect" },
        ],
        message: "The blue orb dissolves. A section of the wall disappears.",
    },
    ROOM_05_PERMANENT_COLLECTIBLE: {
        handler: "effects",
        trigger: "both",
        effects: [
            { type: "setFlag", flag: "room05.permanentCollected", value: true },
            { type: "playSound", soundId: "orb-collect" },
        ],
        message: "The permanent collectible is recorded by its flag.",
    },
    ROOM_05_POSSESSION_COLLECTIBLE: {
        handler: "effects",
        trigger: "both",
        effects: [
            { type: "addItem", itemId: "room05-possession-collectible", quantity: 1 },
            { type: "playSound", soundId: "orb-collect" },
        ],
        message: "The possession collectible enters your inventory.",
    },
    ROOM_05_SPAWNED_COLLECTIBLE: {
        handler: "effects",
        trigger: "both",
        effects: [
            { type: "setEntityActive", entityId: "spawned-collectible", active: false },
            { type: "playSound", soundId: "orb-collect" },
        ],
        message: "The independent spawned collectible disappears.",
    },
    RECEIVER: {
        handler: "effects",
        trigger: "action",
        effects: [
            { type: "playSound", soundId: "receiver-chime" },
            {
                type: "showText",
                speaker: "Receiver",
                pages: [
                    "The receiver wakes with a clear two-note chime.",
                    "A voice beneath the static says: The glass remembers who listened.",
                    "Then the signal cuts out.",
                ],
                afterClose: [{ type: "setFlag", flag: "room04.receiverUsed", value: true }],
            },
        ],
    },
    GLASS_FIGURE: {
        handler: "effects",
        trigger: "action",
        effects: [
            {
                type: "showText",
                condition: { notFlag: "room04.receiverUsed" },
                speaker: "Glass Figure",
                pages: [
                    "The glass figure is cold and perfectly still.",
                    "Its blank face is turned away from the receiver.",
                ],
            },
            {
                type: "showText",
                condition: { flag: "room04.receiverUsed", equals: true },
                speaker: "Glass Figure",
                pages: [
                    "A faint vibration runs through the glass.",
                    "Its face is now angled toward the receiver.",
                    "There is no seam showing how it moved.",
                ],
            },
        ],
    },
};

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
    if (interaction.condition) {
        validateConditionReferences(game, interaction.condition, `Condition for ${label}`);
    }

    const handler = INTERACTION_HANDLERS.get(interaction.handler);
    handler.validateReferences?.({ game, interaction, sourceMapId, label });
}
