import { INTERACTIONS } from "./interactions.js";

export const EMPTY_TILE_ID = -1;

export const TILE_IDS = {
    FLOOR: 0,
    FLOOR_ALT: 1,
    WALL: 2,
    WIDE_WALL: 3,
    PINK_ORB: 4,
    ROOM_01_NORTH_DOOR: 5,
    ROOM_02_SOUTH_DOOR: 6,
};
//TODO: move tile size to here from maps.js

export const TILES = {
    [TILE_IDS.FLOOR]: {
        path: "./assets/tiles/floor.png",
    },
    [TILE_IDS.FLOOR_ALT]: {
        path: "./assets/tiles/floor_alt.png",
    },
    [TILE_IDS.WALL]: {
        path: "./assets/tiles/wall.png",
    },
    [TILE_IDS.WIDE_WALL]: {
        path: "./assets/tiles/wide_wall.png",
        size: [128, 64], //TODO: instead of fixed sizes, use multiplies/scale factors to match tile size
    },
    [TILE_IDS.PINK_ORB]: {
        path: "./assets/tiles/orb.png",
        interaction: INTERACTIONS.PINK_ORB,
    },
    [TILE_IDS.ROOM_01_NORTH_DOOR]: {
        path: "./assets/tiles/door.png",
        interaction: INTERACTIONS.ROOM_01_NORTH_DOOR,
    },
    [TILE_IDS.ROOM_02_SOUTH_DOOR]: {
        path: "./assets/tiles/door.png",
        collision: true,
        interaction: INTERACTIONS.ROOM_02_SOUTH_DOOR,
    },
};
