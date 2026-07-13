import { validateCondition } from "./conditions.js";
import { validateEffectsDefinition, validateEffectsReferences } from "./effects.js";

export const INTERACTION_TRIGGERS = new Set(["action", "touch", "both"]); //TODO: remove 'both', make the trigger property into triggers: []

//TODO: there has to be a better system for this
export const INTERACTIONS = {
    PINK_ORB: {
        id: "pink-orb",
        handler: "effects",
        trigger: "both",
        condition: {
            notItem: "pink-orb",
        },
        effects: [
            { type: "addItem", itemId: "pink-orb" },
            { type: "playSound", soundId: "orb-collect" },
            { type: "removeEntity", entityId: "pink-orb" },
        ],
        message: "You found the pink orb.",
    },
    ROOM_01_NORTH_DOOR: {
        id: "north-door",
        handler: "teleport",
        trigger: "action",
        params: {
            mapId: "room-02",
            entryId: "fromRoom01",
        },
        message: "The door opens.",
    },
    ROOM_02_SOUTH_DOOR: {
        id: "south-door",
        handler: "teleport",
        trigger: "action",
        params: {
            mapId: "room-01",
            entryId: "fromRoom02",
        },
        message: "You return through the door.",
    },
    ROOM_02_NORTH_DOOR: {
        id: "north-door",
        handler: "teleport",
        trigger: "action",
        params: {
            mapId: "room-03",
            entryId: "fromRoom02",
        },
        message: "The door opens into another room.",
    },
    ROOM_03_SOUTH_DOOR: {
        id: "south-door",
        handler: "teleport",
        trigger: "action",
        params: {
            mapId: "room-02",
            entryId: "fromRoom03",
        },
        message: "You return to the previous room.",
    },
    BLUE_ORB: {
        id: "blue-orb",
        handler: "effects",
        trigger: "both",
        condition: {
            all: [{ notFlag: "room03.orbCollected" }, { notItem: "blue-orb" }],
        },
        effects: [
            { type: "setFlag", flag: "room03.orbCollected", value: true },
            { type: "addItem", itemId: "blue-orb" },
            { type: "playSound", soundId: "orb-collect" },
            { type: "setTile", layer: "obstacles", col: 4, row: 3, tileId: -1 },
            { type: "removeEntity", entityId: "blue-orb" },
        ],
        message: "The blue orb dissolves. A section of the wall disappears.",
    },
};

function requireParamsObject(interaction, mapId) {
    if (
        !interaction.params ||
        typeof interaction.params !== "object" ||
        Array.isArray(interaction.params)
    ) {
        throw new Error(
            `Interaction "${interaction.id}" in "${mapId}" must define a params object.`,
        );
    }
}

export const INTERACTION_HANDLERS = new Map([
    [
        "effects",
        {
            validateDefinition({ interaction, mapId }) {
                validateEffectsDefinition(
                    interaction.effects,
                    `Effects for interaction "${interaction.id}" in "${mapId}"`,
                );
            },

            validateReferences({ game, interaction, sourceMapId }) {
                validateEffectsReferences(
                    game,
                    interaction.effects,
                    sourceMapId,
                    `Effects for interaction "${interaction.id}" in "${sourceMapId}"`,
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
            validateDefinition({ interaction, mapId }) {
                requireParamsObject(interaction, mapId);

                const { mapId: destinationMapId, entryId } = interaction.params;

                if (typeof destinationMapId !== "string") {
                    throw new Error(
                        `Teleport interaction "${interaction.id}" in "${mapId}" ` +
                            "must define params.mapId.",
                    );
                }

                if (typeof entryId !== "string") {
                    throw new Error(
                        `Teleport interaction "${interaction.id}" in "${mapId}" ` +
                            "must define params.entryId.",
                    );
                }
            },

            validateReferences({ game, interaction, sourceMapId }) {
                const { mapId, entryId } = interaction.params;
                game.validateEntryReference(
                    mapId,
                    entryId,
                    `Teleport "${interaction.id}" from "${sourceMapId}"`,
                );
            },

            execute({ game, target }) {
                game.transitionTo(target.interaction.params);
            },
        },
    ],
]);

export function validateInteractionCondition(interaction, mapId) {
    if (!interaction.condition) return;

    validateCondition(
        interaction.condition,
        `Condition for interaction "${interaction.id}" in "${mapId}"`,
    );
}
