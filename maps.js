import { EMPTY_TILE_ID, TILE_IDS } from "./tiles.js";

export const DEFAULT_TILE_SIZE = 32;

const E = EMPTY_TILE_ID;
const {
    FLOOR,
    FLOOR_ALT,
    WALL,
    WIDE_WALL,
    PINK_ORB,
    ROOM_01_NORTH_DOOR,
    ROOM_02_SOUTH_DOOR,
} = TILE_IDS;

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
        },

        tiles: {},

        layers: {
            base: [
                [FLOOR, FLOOR, FLOOR, FLOOR, FLOOR, FLOOR, FLOOR, FLOOR, FLOOR, FLOOR],
                [FLOOR, FLOOR_ALT, FLOOR_ALT, FLOOR_ALT, FLOOR_ALT, FLOOR_ALT, FLOOR_ALT, FLOOR_ALT, FLOOR_ALT, FLOOR],
                [FLOOR, FLOOR_ALT, FLOOR_ALT, FLOOR_ALT, FLOOR_ALT, FLOOR_ALT, FLOOR_ALT, FLOOR_ALT, FLOOR_ALT, FLOOR],
                [FLOOR, FLOOR_ALT, FLOOR_ALT, FLOOR_ALT, FLOOR_ALT, FLOOR_ALT, FLOOR_ALT, FLOOR_ALT, FLOOR_ALT, FLOOR],
                [FLOOR, FLOOR_ALT, FLOOR_ALT, FLOOR_ALT, FLOOR_ALT, FLOOR_ALT, FLOOR_ALT, FLOOR_ALT, FLOOR_ALT, FLOOR],
                [FLOOR, FLOOR_ALT, FLOOR_ALT, FLOOR_ALT, FLOOR_ALT, FLOOR_ALT, FLOOR_ALT, FLOOR_ALT, FLOOR_ALT, FLOOR],
                [FLOOR, FLOOR, FLOOR, FLOOR, E, E, E, E, E, E],
            ],

            obstacles: [
                [WALL, WALL, WALL, WALL, WALL, WALL, WALL, WALL, WALL, WALL],
                [WALL, E, E, E, E, E, E, E, E, WALL],
                [WALL, E, E, WIDE_WALL, E, E, E, E, E, WALL],
                [WALL, E, E, E, E, E, WALL, E, E, WALL],
                [WALL, E, WALL, E, E, E, WALL, E, E, WALL],
                [WALL, E, E, E, E, E, E, E, E, WALL],
                [WALL, E, E, WALL, E, E, E, E, E, E],
            ],

            interactables: [
                [E, E, E, E, E, ROOM_01_NORTH_DOOR, E, E, E, E],
                [E, E, E, E, E, E, E, E, E, E],
                [E, E, E, E, E, E, E, E, E, E],
                [E, E, E, E, PINK_ORB, E, E, E, E, E],
                [E, E, E, E, E, E, E, E, E, E],
                [E, E, E, E, E, E, E, E, E, E],
                [E, E, E, E, E, E, E, E, E, E],
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
        },

        tiles: {},

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

            interactables: [
                [E, E, E, E, E, E, E],
                [E, E, E, E, E, E, E],
                [E, E, E, E, E, E, E],
                [E, E, E, E, E, E, E],
                [E, E, E, E, E, E, E],
                [E, ROOM_02_SOUTH_DOOR, E, E, E, E, E],
                [E, E, E, E, E, E, E],
            ],
        },
    },
];
