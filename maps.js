import { INTERACTIONS } from "./interactions.js";
import { EMPTY_TILE_ID, TILE_IDS } from "./tiles.js";

export const DEFAULT_TILE_SIZE = 32;

const E = EMPTY_TILE_ID;
const { FLOOR, FLOOR_ALT, WALL, WIDE_WALL } = TILE_IDS;

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
                interaction: INTERACTIONS.PINK_ORB,
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
                interaction: INTERACTIONS.ROOM_01_NORTH_DOOR,
            },
            {
                id: "east-door",
                active: true,
                col: 9,
                row: 5,
                spriteId: "door",
                collision: true,
                interaction: INTERACTIONS.ROOM_01_EAST_DOOR,
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
                id: "south-door",
                active: true,
                col: 1,
                row: 5,
                spriteId: "door",
                collision: true,
                interaction: INTERACTIONS.ROOM_02_SOUTH_DOOR,
            },
            {
                id: "north-door",
                active: true,
                col: 3,
                row: 0,
                spriteId: "door",
                collision: true,
                interaction: INTERACTIONS.ROOM_02_NORTH_DOOR,
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
        },

        exits: [],

        tiles: {},

        entities: [
            {
                id: "blue-orb",
                active: true,
                col: 2,
                row: 2,
                spriteId: "blue-orb",
                collision: false,
                interaction: INTERACTIONS.BLUE_ORB,
                //TODO: is this necessary if i already set the blue orb to not active via effect? evaluate
                condition: {
                    all: [{ notFlag: "room03.orbCollected" }, { notItem: "blue-orb" }],
                },
            },
            {
                id: "south-door",
                active: true,
                col: 2,
                row: 6,
                spriteId: "door",
                collision: true,
                interaction: INTERACTIONS.ROOM_03_SOUTH_DOOR,
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
                [WALL, E, E, E, WALL, E, E, E, WALL],
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
                interaction: INTERACTIONS.ROOM_04_WEST_DOOR,
            },
            {
                id: "receiver",
                active: true,
                col: 4,
                row: 2,
                spriteId: "receiver",
                collision: true,
                interaction: INTERACTIONS.RECEIVER,
            },
            {
                id: "glass-figure",
                active: true,
                col: 6,
                row: 3,
                spriteId: "glass-figure",
                collision: true,
                interaction: INTERACTIONS.GLASS_FIGURE,
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

        entities: [],

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
];
