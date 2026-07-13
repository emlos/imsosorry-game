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
            targetMapId: "room-02",
            targetEntryId: "fromRoom01",
        },
        message: "The door opens.",
    },
    ROOM_02_SOUTH_DOOR: {
        id: "south-door",
        handler: "teleport",
        trigger: "action",
        params: {
            targetMapId: "room-01",
            targetEntryId: "fromRoom02",
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

                const { targetMapId, targetEntryId } = interaction.params;

                if (typeof targetMapId !== "string" || targetMapId.length === 0) {
                    //TODO: only reference maps by their id, not by their index -> remove in map.js if any remain as well, this is redundant
                    throw new Error(
                        `Teleport interaction "${interaction.id}" in "${mapId}" ` +
                            "must define params.targetMapId.",
                    );
                }

                if (typeof targetEntryId !== "string" || targetEntryId.length === 0) {
                    throw new Error(
                        `Teleport interaction "${interaction.id}" in "${mapId}" ` +
                            "must define params.targetEntryId.",
                    );
                }
            },

            validateReferences({ game, interaction, sourceMapId }) {
                const { targetMapId, targetEntryId } = interaction.params;
                game.validateEntryReference(
                    targetMapId,
                    targetEntryId,
                    `Teleport "${interaction.id}" from "${sourceMapId}"`,
                );
            },

            execute({ game, target }) {
                const { targetMapId, targetEntryId } = target.interaction.params;
                game.loadMapEntry(targetMapId, targetEntryId);
            },
        },
    ],
]);
