export const INTERACTION_TRIGGERS = new Set(["action", "touch", "both"]); //TODO: remove 'both', make the trigger property into triggers: []

//TODO: there has to be a better system for this
export const INTERACTIONS = {
    PINK_ORB: {
        id: "pink-orb",
        handler: "collect",
        trigger: "both",
        params: {},
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
        "collect",
        {
            validateDefinition({ interaction, mapId }) {
                requireParamsObject(interaction, mapId);
            },

            execute({ game, target, sourceMapId }) {
                game.collectInteraction(sourceMapId, target.interaction);
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
