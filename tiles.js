export const TILE_SIZE = 32;
export const EMPTY_TILE_ID = -1;
export const WORLD_ATLAS_PATH = "./assets/atlases/world.png";

export const TILE_IDS = {
    FLOOR: 0,
    FLOOR_ALT: 1,
    WALL: 2,
    WIDE_WALL: 3,
    TREE: 4,
    GLITTERING_CRYSTAL: 5,
    PLACEHOLDER_OBSTACLE: 6,
};

//TODO: two 'world spritesheets' with the same tile types, floor, floor_alt, wall, tree etc, and dimensions just with different pictures underneath
//reuse the id's? some sort of palette swap system?

export const TILES = {
    [TILE_IDS.FLOOR]: {
        path: WORLD_ATLAS_PATH,
        source: [7, 5, 32, 32],
    },
    [TILE_IDS.FLOOR_ALT]: {
        path: WORLD_ATLAS_PATH,
        source: [39, 5, 32, 32],
    },
    [TILE_IDS.WALL]: {
        path: WORLD_ATLAS_PATH,
        source: [71, 5, 32, 32],
    },
    [TILE_IDS.WIDE_WALL]: {
        path: "./assets/tiles/wide_wall.png",
        size: [64, 32],
        footprint: [
            [0, 0],
            [1, 0],
        ],
    },
    [TILE_IDS.TREE]: {
        path: WORLD_ATLAS_PATH,
        source: [135, 5, 32, 64],
        size: [32, 64],
        footprint: [[0, 0]],
    },
    [TILE_IDS.GLITTERING_CRYSTAL]: {
        path: WORLD_ATLAS_PATH,
        source: [7, 75, 32, 64],
        size: [32, 64],
        footprint: [[0, 0]],
        defaultAnimation: "glitter",
        animations: {
            glitter: {
                fps: 8,
                frames: [
                    [0, 0],
                    [1, 0],
                    [2, 0],
                    [3, 0],
                    [2, 0],
                    [1, 0],
                ],
            },
        },
        interaction: {
            handler: "effects",
            triggers: ["action"],
            effects: [
                {
                    type: "showText",
                    pages: ["Light moves through the crystal."],
                },
            ],
        },
    },
    [TILE_IDS.PLACEHOLDER_OBSTACLE]: {
        path: "./assets/debug/placeholder.png",
        size: [32, 32],
        footprint: [[0, 0]],
    },
};
