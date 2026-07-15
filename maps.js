import { COMMON_INTERACTIONS } from "./interactions.js";
import { EMPTY_TILE_ID, TILE_IDS } from "./tiles.js";

const E = EMPTY_TILE_ID;
const { FLOOR, FLOOR_ALT, WALL, WIDE_WALL, TREE } = TILE_IDS;
const ROOM_03_ORB_WALL = 100; //TODO: move to tiles for the room-03 map. this doesnt need to be a global property

export const MAPS = [
    {
        id: "room-01",
        initialEntryId: "start",

        entries: {
            start: {
                col: 1,
                row: 1,
                facing: { dc: 0, dr: 1 },
            },
            fromRoom02: {
                col: 5,
                row: 1,
                facing: { dc: 0, dr: -1 },
            },
            fromRoom04: {
                col: 8,
                row: 5,
                facing: { dc: 1, dr: 0 },
            },
        },

        exits: [
            {
                edge: "west",
                range: [1, 4],
                targetMapId: "room-05",
                targetEdge: "east",
                preserveAxis: true,
                offset: 0,
            },
        ],

        tiles: {},

        entities: [
            {
                id: "pink-orb",
                active: true,
                col: 4,
                row: 3,
                spriteId: "pink-orb",
                collision: false,
                interaction: {
                    handler: "effects",
                    triggers: ["action", "touch"],
                    effects: [
                        { type: "addItem", itemId: "pink-orb", quantity: 1 },
                        { type: "playSound", soundId: "orb-collect" },
                    ],
                    message: "You found the pink orb.",
                },
                condition: {
                    notItem: "pink-orb",
                },
            },
            {
                id: "north-door",
                active: true,
                col: 5,
                row: 0,
                spriteId: "door",
                collision: false,
                interaction: {
                    handler: "teleport",
                    triggers: ["action"],
                    params: {
                        mapId: "room-02",
                        entryId: "fromRoom01",
                    },
                    message: "The door opens.",
                },
            },
            {
                id: "east-door",
                active: true,
                col: 9,
                row: 5,
                spriteId: "door",
                collision: true,
                interaction: {
                    handler: "teleport",
                    triggers: ["action"],
                    params: {
                        mapId: "room-04",
                        entryId: "fromRoom01",
                    },
                    message: "The side door opens.",
                },
            },
        ],

        layers: {
            base: [
                [FLOOR, FLOOR, FLOOR, FLOOR, FLOOR, FLOOR, FLOOR, FLOOR, FLOOR, FLOOR],
                [
                    FLOOR,
                    FLOOR_ALT,
                    FLOOR_ALT,
                    FLOOR_ALT,
                    FLOOR_ALT,
                    FLOOR_ALT,
                    FLOOR_ALT,
                    FLOOR_ALT,
                    FLOOR_ALT,
                    FLOOR,
                ],
                [
                    FLOOR,
                    FLOOR_ALT,
                    FLOOR_ALT,
                    FLOOR_ALT,
                    FLOOR_ALT,
                    FLOOR_ALT,
                    FLOOR_ALT,
                    FLOOR_ALT,
                    FLOOR_ALT,
                    FLOOR,
                ],
                [
                    FLOOR,
                    FLOOR_ALT,
                    FLOOR_ALT,
                    FLOOR_ALT,
                    FLOOR_ALT,
                    FLOOR_ALT,
                    FLOOR_ALT,
                    FLOOR_ALT,
                    FLOOR_ALT,
                    FLOOR,
                ],
                [
                    FLOOR,
                    FLOOR_ALT,
                    FLOOR_ALT,
                    FLOOR_ALT,
                    FLOOR_ALT,
                    FLOOR_ALT,
                    FLOOR_ALT,
                    FLOOR_ALT,
                    FLOOR_ALT,
                    FLOOR,
                ],
                [
                    FLOOR,
                    FLOOR_ALT,
                    FLOOR_ALT,
                    FLOOR_ALT,
                    FLOOR_ALT,
                    FLOOR_ALT,
                    FLOOR_ALT,
                    FLOOR_ALT,
                    FLOOR_ALT,
                    FLOOR,
                ],
            ],

            obstacles: [
                [E, WALL, WALL, WALL, WALL, WALL, WALL, WALL, WALL, WALL],
                [E, E, E, E, E, E, E, E, E, WALL],
                [E, E, E, WIDE_WALL, E, E, E, E, E, WALL],
                [E, E, E, E, E, E, WALL, E, E, WALL],
                [E, E, WALL, E, E, E, WALL, E, E, WALL],
                [WALL, E, E, E, E, E, E, E, E, WALL],
            ],
        },
    },

    {
        id: "room-02",

        entries: {
            fromRoom01: {
                col: 2,
                row: 5,
                facing: { dc: -1, dr: 0 },
            },
            fromRoom03: {
                col: 3,
                row: 1,
                facing: { dc: 0, dr: -1 },
            },
        },

        exits: [],

        tiles: {},

        entities: [
            {
                id: "save-point",
                active: true,
                col: 1,
                row: 3,
                spriteId: "save-point",
                collision: true,
                interaction: COMMON_INTERACTIONS.SAVE_POINT,
            },
            {
                id: "south-door",
                active: true,
                col: 1,
                row: 5,
                spriteId: "door",
                collision: true,
                interaction: {
                    handler: "teleport",
                    triggers: ["action"],
                    params: {
                        mapId: "room-01",
                        entryId: "fromRoom02",
                    },
                    message: "You return through the door.",
                },
            },
            {
                id: "north-door",
                active: true,
                col: 3,
                row: 0,
                spriteId: "door",
                collision: true,
                interaction: {
                    handler: "teleport",
                    triggers: ["action"],
                    params: {
                        mapId: "room-03",
                        entryId: "fromRoom02",
                    },
                    message: "The door opens into another room.",
                },
            },
        ],

        layers: {
            base: [
                [FLOOR_ALT, FLOOR_ALT, FLOOR_ALT, FLOOR_ALT, FLOOR_ALT, FLOOR_ALT, FLOOR_ALT],
                [FLOOR_ALT, FLOOR_ALT, FLOOR_ALT, FLOOR_ALT, FLOOR_ALT, FLOOR_ALT, FLOOR_ALT],
                [FLOOR_ALT, FLOOR_ALT, FLOOR_ALT, FLOOR_ALT, FLOOR_ALT, FLOOR_ALT, FLOOR_ALT],
                [FLOOR_ALT, FLOOR_ALT, FLOOR_ALT, FLOOR_ALT, FLOOR_ALT, FLOOR_ALT, FLOOR_ALT],
                [FLOOR_ALT, FLOOR_ALT, FLOOR_ALT, FLOOR_ALT, FLOOR_ALT, FLOOR_ALT, FLOOR_ALT],
                [FLOOR_ALT, FLOOR_ALT, FLOOR_ALT, FLOOR_ALT, FLOOR_ALT, FLOOR_ALT, FLOOR_ALT],
                [FLOOR_ALT, FLOOR_ALT, FLOOR_ALT, FLOOR_ALT, FLOOR_ALT, FLOOR_ALT, FLOOR_ALT],
            ],

            obstacles: [
                [WALL, WALL, WALL, WALL, WALL, WALL, WALL],
                [WALL, E, E, E, E, E, WALL],
                [WALL, E, WALL, E, WALL, E, WALL],
                [WALL, E, E, E, E, E, WALL],
                [WALL, E, WALL, E, WALL, E, WALL],
                [WALL, E, E, E, E, E, WALL],
                [WALL, WALL, WALL, WALL, WALL, WALL, WALL],
            ],
        },
    },

    {
        id: "room-03",

        entries: {
            fromRoom02: {
                col: 2,
                row: 5,
                facing: { dc: 0, dr: 1 },
            },
            fromRoom06: {
                col: 7,
                row: 1,
                facing: { dc: 0, dr: 1 },
            },
        },

        exits: [],

        tiles: {
            [ROOM_03_ORB_WALL]: {
                path: "./assets/tiles/wall.png",
                condition: { notFlag: "room03.orbCollected" },
            },
        },

        entities: [
            {
                id: "blue-orb",
                active: true,
                col: 2,
                row: 2,
                spriteId: "blue-orb",
                collision: false,
                interaction: {
                    handler: "effects",
                    triggers: ["action", "touch"],
                    effects: [
                        { type: "setFlag", flag: "room03.orbCollected", value: true },
                        { type: "playSound", soundId: "orb-collect" },
                    ],
                    message: "The blue orb dissolves. A section of the wall disappears.",
                },
                condition: { notFlag: "room03.orbCollected" },
            },
            {
                id: "south-door",
                active: true,
                col: 2,
                row: 6,
                spriteId: "door",
                collision: true,
                interaction: {
                    handler: "teleport",
                    triggers: ["action"],
                    params: {
                        mapId: "room-02",
                        entryId: "fromRoom03",
                    },
                    message: "You return to the previous room.",
                },
            },
            {
                id: "forest-door",
                active: true,
                col: 7,
                row: 0,
                spriteId: "door",
                collision: true,
                interaction: {
                    handler: "teleport",
                    triggers: ["action"],
                    params: {
                        mapId: "room-06",
                        entryId: "fromRoom03",
                    },
                    message: "The door opens onto a small forest clearing.",
                },
            },
        ],

        layers: {
            base: [
                [FLOOR, FLOOR, FLOOR, FLOOR, FLOOR, FLOOR, FLOOR, FLOOR, FLOOR],
                [
                    FLOOR,
                    FLOOR_ALT,
                    FLOOR_ALT,
                    FLOOR_ALT,
                    FLOOR_ALT,
                    FLOOR_ALT,
                    FLOOR_ALT,
                    FLOOR_ALT,
                    FLOOR,
                ],
                [
                    FLOOR,
                    FLOOR_ALT,
                    FLOOR_ALT,
                    FLOOR_ALT,
                    FLOOR_ALT,
                    FLOOR_ALT,
                    FLOOR_ALT,
                    FLOOR_ALT,
                    FLOOR,
                ],
                [
                    FLOOR,
                    FLOOR_ALT,
                    FLOOR_ALT,
                    FLOOR_ALT,
                    FLOOR_ALT,
                    FLOOR_ALT,
                    FLOOR_ALT,
                    FLOOR_ALT,
                    FLOOR,
                ],
                [
                    FLOOR,
                    FLOOR_ALT,
                    FLOOR_ALT,
                    FLOOR_ALT,
                    FLOOR_ALT,
                    FLOOR_ALT,
                    FLOOR_ALT,
                    FLOOR_ALT,
                    FLOOR,
                ],
                [
                    FLOOR,
                    FLOOR_ALT,
                    FLOOR_ALT,
                    FLOOR_ALT,
                    FLOOR_ALT,
                    FLOOR_ALT,
                    FLOOR_ALT,
                    FLOOR_ALT,
                    FLOOR,
                ],
                [FLOOR, FLOOR, FLOOR, FLOOR, FLOOR, FLOOR, FLOOR, FLOOR, FLOOR],
            ],

            obstacles: [
                [WALL, WALL, WALL, WALL, WALL, WALL, WALL, WALL, WALL],
                [WALL, E, E, E, WALL, E, E, E, WALL],
                [WALL, E, E, E, WALL, E, E, E, WALL],
                [WALL, E, E, E, ROOM_03_ORB_WALL, E, E, E, WALL],
                [WALL, E, E, E, WALL, E, E, E, WALL],
                [WALL, E, E, E, WALL, E, E, E, WALL],
                [WALL, WALL, WALL, WALL, WALL, WALL, WALL, WALL, WALL],
            ],
        },
    },

    {
        id: "room-04",

        entries: {
            fromRoom01: {
                col: 1,
                row: 3,
                facing: { dc: 1, dr: 0 },
            },
            fromPinkOrb: {
                col: 4,
                row: 5,
                facing: { dc: 0, dr: -1 },
            },
        },

        exits: [],

        tiles: {},

        entities: [
            {
                id: "west-door",
                active: true,
                col: 0,
                row: 3,
                spriteId: "door",
                collision: true,
                interaction: {
                    handler: "teleport",
                    triggers: ["action"],
                    params: {
                        mapId: "room-01",
                        entryId: "fromRoom04",
                    },
                    message: "You return to the main room.",
                },
            },
            {
                id: "receiver",
                active: true,
                col: 4,
                row: 2,
                spriteId: "receiver",
                collision: true,
                interaction: {
                    handler: "effects",
                    triggers: ["action"],
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
                            afterClose: [
                                { type: "setFlag", flag: "room04.receiverUsed", value: true },
                            ],
                        },
                    ],
                },
            },
            {
                id: "glass-figure",
                active: true,
                col: 6,
                row: 3,
                spriteId: "glass-figure",
                collision: true,
                interaction: {
                    handler: "effects",
                    triggers: ["action"],
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
            },
        ],

        layers: {
            base: [
                [
                    FLOOR_ALT,
                    FLOOR_ALT,
                    FLOOR_ALT,
                    FLOOR_ALT,
                    FLOOR_ALT,
                    FLOOR_ALT,
                    FLOOR_ALT,
                    FLOOR_ALT,
                    FLOOR_ALT,
                ],
                [
                    FLOOR_ALT,
                    FLOOR_ALT,
                    FLOOR_ALT,
                    FLOOR_ALT,
                    FLOOR_ALT,
                    FLOOR_ALT,
                    FLOOR_ALT,
                    FLOOR_ALT,
                    FLOOR_ALT,
                ],
                [
                    FLOOR_ALT,
                    FLOOR_ALT,
                    FLOOR_ALT,
                    FLOOR_ALT,
                    FLOOR_ALT,
                    FLOOR_ALT,
                    FLOOR_ALT,
                    FLOOR_ALT,
                    FLOOR_ALT,
                ],
                [
                    FLOOR_ALT,
                    FLOOR_ALT,
                    FLOOR_ALT,
                    FLOOR_ALT,
                    FLOOR_ALT,
                    FLOOR_ALT,
                    FLOOR_ALT,
                    FLOOR_ALT,
                    FLOOR_ALT,
                ],
                [
                    FLOOR_ALT,
                    FLOOR_ALT,
                    FLOOR_ALT,
                    FLOOR_ALT,
                    FLOOR_ALT,
                    FLOOR_ALT,
                    FLOOR_ALT,
                    FLOOR_ALT,
                    FLOOR_ALT,
                ],
                [
                    FLOOR_ALT,
                    FLOOR_ALT,
                    FLOOR_ALT,
                    FLOOR_ALT,
                    FLOOR_ALT,
                    FLOOR_ALT,
                    FLOOR_ALT,
                    FLOOR_ALT,
                    FLOOR_ALT,
                ],
                [
                    FLOOR_ALT,
                    FLOOR_ALT,
                    FLOOR_ALT,
                    FLOOR_ALT,
                    FLOOR_ALT,
                    FLOOR_ALT,
                    FLOOR_ALT,
                    FLOOR_ALT,
                    FLOOR_ALT,
                ],
            ],

            obstacles: [
                [WALL, WALL, WALL, WALL, WALL, WALL, WALL, WALL, WALL],
                [WALL, E, E, E, E, E, E, E, WALL],
                [WALL, E, WALL, E, E, E, WALL, E, WALL],
                [E, E, E, E, E, E, E, E, WALL],
                [WALL, E, WALL, E, E, E, WALL, E, WALL],
                [WALL, E, E, E, E, E, E, E, WALL],
                [WALL, WALL, WALL, WALL, WALL, WALL, WALL, WALL, WALL],
            ],
        },
    },

    {
        id: "room-05",

        entries: {},

        exits: [
            {
                edge: "east",
                range: [1, 4],
                targetMapId: "room-01",
                targetEdge: "west",
                preserveAxis: true,
                offset: 0,
            },
        ],

        tiles: {},

        entities: [
            {
                id: "save-point",
                active: true,
                col: 1,
                row: 3,
                spriteId: "save-point",
                collision: true,
                interaction: COMMON_INTERACTIONS.SAVE_POINT,
            },
            {
                id: "permanent-collectible",
                active: true,
                col: 2,
                row: 1,
                spriteId: "blue-orb",
                collision: false,
                interaction: {
                    handler: "effects",
                    triggers: ["action", "touch"],
                    effects: [
                        {
                            type: "setFlag",
                            flag: "room05.permanentCollected",
                            value: true,
                        },
                        { type: "playSound", soundId: "orb-collect" },
                    ],
                    message: "The permanent collectible is recorded by its flag.",
                },
                condition: { notFlag: "room05.permanentCollected" },
            },
            {
                id: "possession-collectible",
                active: true,
                col: 4,
                row: 2,
                spriteId: "pink-orb",
                collision: false,
                interaction: {
                    handler: "effects",
                    triggers: ["action", "touch"],
                    effects: [
                        {
                            type: "addItem",
                            itemId: "room05-possession-collectible",
                            quantity: 1,
                        },
                        { type: "playSound", soundId: "orb-collect" },
                    ],
                    message: "The possession collectible enters your inventory.",
                },
                condition: { notItem: "room05-possession-collectible" },
            },
            {
                id: "spawned-collectible",
                active: true,
                col: 6,
                row: 4,
                spriteId: "blue-orb",
                collision: false,
                interaction: {
                    handler: "effects",
                    triggers: ["action", "touch"],
                    effects: [
                        {
                            type: "setEntityActive",
                            entityId: "spawned-collectible",
                            active: false,
                        },
                        { type: "playSound", soundId: "orb-collect" },
                    ],
                    message: "The independent spawned collectible disappears.",
                },
            },
        ],

        layers: {
            base: [
                [FLOOR, FLOOR, FLOOR, FLOOR, FLOOR, FLOOR, FLOOR, FLOOR],
                [FLOOR, FLOOR_ALT, FLOOR_ALT, FLOOR_ALT, FLOOR_ALT, FLOOR_ALT, FLOOR_ALT, FLOOR],
                [FLOOR, FLOOR_ALT, FLOOR_ALT, FLOOR_ALT, FLOOR_ALT, FLOOR_ALT, FLOOR_ALT, FLOOR],
                [FLOOR, FLOOR_ALT, FLOOR_ALT, FLOOR_ALT, FLOOR_ALT, FLOOR_ALT, FLOOR_ALT, FLOOR],
                [FLOOR, FLOOR_ALT, FLOOR_ALT, FLOOR_ALT, FLOOR_ALT, FLOOR_ALT, FLOOR_ALT, FLOOR],
                [FLOOR, FLOOR, FLOOR, FLOOR, FLOOR, FLOOR, FLOOR, FLOOR],
            ],

            obstacles: [
                [WALL, WALL, WALL, WALL, WALL, WALL, WALL, WALL],
                [WALL, E, E, E, E, E, E, E],
                [WALL, E, E, WALL, E, E, E, E],
                [WALL, E, E, E, E, WALL, E, E],
                [WALL, E, WALL, E, E, E, E, E],
                [WALL, WALL, WALL, WALL, WALL, WALL, WALL, WALL],
            ],
        },
    },

    {
        id: "room-06",

        entries: {
            fromRoom03: {
                col: 5,
                row: 7,
                facing: { dc: 0, dr: -1 },
            },
        },

        exits: [],

        tiles: {},

        entities: [
            {
                id: "south-door",
                active: true,
                col: 5,
                row: 8,
                spriteId: "door",
                collision: true,
                interaction: {
                    handler: "teleport",
                    triggers: ["action"],
                    params: {
                        mapId: "room-03",
                        entryId: "fromRoom06",
                    },
                    message: "You leave the clearing.",
                },
            },
        ],

        layers: {
            base: [
                [FLOOR, FLOOR, FLOOR, FLOOR, FLOOR, FLOOR, FLOOR, FLOOR, FLOOR, FLOOR, FLOOR],
                [
                    FLOOR,
                    FLOOR_ALT,
                    FLOOR_ALT,
                    FLOOR_ALT,
                    FLOOR_ALT,
                    FLOOR_ALT,
                    FLOOR_ALT,
                    FLOOR_ALT,
                    FLOOR_ALT,
                    FLOOR_ALT,
                    FLOOR,
                ],
                [
                    FLOOR,
                    FLOOR_ALT,
                    FLOOR_ALT,
                    FLOOR_ALT,
                    FLOOR_ALT,
                    FLOOR_ALT,
                    FLOOR_ALT,
                    FLOOR_ALT,
                    FLOOR_ALT,
                    FLOOR_ALT,
                    FLOOR,
                ],
                [
                    FLOOR,
                    FLOOR_ALT,
                    FLOOR_ALT,
                    FLOOR_ALT,
                    FLOOR_ALT,
                    FLOOR_ALT,
                    FLOOR_ALT,
                    FLOOR_ALT,
                    FLOOR_ALT,
                    FLOOR_ALT,
                    FLOOR,
                ],
                [
                    FLOOR,
                    FLOOR_ALT,
                    FLOOR_ALT,
                    FLOOR_ALT,
                    FLOOR_ALT,
                    FLOOR_ALT,
                    FLOOR_ALT,
                    FLOOR_ALT,
                    FLOOR_ALT,
                    FLOOR_ALT,
                    FLOOR,
                ],
                [
                    FLOOR,
                    FLOOR_ALT,
                    FLOOR_ALT,
                    FLOOR_ALT,
                    FLOOR_ALT,
                    FLOOR_ALT,
                    FLOOR_ALT,
                    FLOOR_ALT,
                    FLOOR_ALT,
                    FLOOR_ALT,
                    FLOOR,
                ],
                [
                    FLOOR,
                    FLOOR_ALT,
                    FLOOR_ALT,
                    FLOOR_ALT,
                    FLOOR_ALT,
                    FLOOR_ALT,
                    FLOOR_ALT,
                    FLOOR_ALT,
                    FLOOR_ALT,
                    FLOOR_ALT,
                    FLOOR,
                ],
                [
                    FLOOR,
                    FLOOR_ALT,
                    FLOOR_ALT,
                    FLOOR_ALT,
                    FLOOR_ALT,
                    FLOOR_ALT,
                    FLOOR_ALT,
                    FLOOR_ALT,
                    FLOOR_ALT,
                    FLOOR_ALT,
                    FLOOR,
                ],
                [FLOOR, FLOOR, FLOOR, FLOOR, FLOOR, FLOOR, FLOOR, FLOOR, FLOOR, FLOOR, FLOOR],
            ],

            obstacles: [
                [WALL, WALL, WALL, WALL, WALL, WALL, WALL, WALL, WALL, WALL, WALL],
                [WALL, E, E, E, E, E, E, E, E, E, WALL],
                [WALL, E, E, E, E, E, E, E, E, E, WALL],
                [WALL, E, E, TREE, E, E, E, TREE, E, E, WALL],
                [WALL, E, E, E, E, E, E, E, E, E, WALL],
                [WALL, E, E, E, E, TREE, E, E, E, E, WALL],
                [WALL, E, E, TREE, E, E, E, TREE, E, E, WALL],
                [WALL, E, E, E, E, E, E, E, E, E, WALL],
                [WALL, WALL, WALL, WALL, WALL, WALL, WALL, WALL, WALL, WALL, WALL],
            ],
        },
    },
];
