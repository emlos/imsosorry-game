export const ITEMS = {
    "pink-orb": {
        name: "Pink Orb",
        icon: "./assets/items/pink-orb.png",
        description: "A warm pink sphere. Its surface seems deeper than its size allows.",
        usable: true,
        effects: [
            { type: "playSound", soundId: "item-use" },
            {
                type: "showText",
                speaker: "Pink Orb",
                pages: [
                    "The orb grows warm in your hands.",
                    "Its light folds the room inward until distance stops making sense.",
                ],
                afterClose: [{ type: "teleport", mapId: "room-04", entryId: "fromPinkOrb" }],
            },
        ],
    },

    "room05-possession-collectible": {
        name: "Possession Collectible",
        icon: "./assets/items/pink-orb.png",
        description: "A test collectible whose current inventory ownership is authoritative.",
        usable: false,
    },
};
