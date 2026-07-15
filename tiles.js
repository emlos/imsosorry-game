export const TILE_SIZE = 32;
export const EMPTY_TILE_ID = -1;

export const TILE_IDS = {
    FLOOR: 0,
    FLOOR_ALT: 1,
    WALL: 2,
    WIDE_WALL: 3,
    TREE: 4,
    GLITTERING_CRYSTAL: 5,
    PLACEHOLDER_OBSTACLE: 6,
};

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
        size: [64, 32],
        footprint: [
            [0, 0],
            [1, 0],
        ],
    },
    [TILE_IDS.TREE]: {
        path: "./assets/tiles/tree.png",
        size: [32, 64],
        footprint: [[0, 0]],
    },
    [TILE_IDS.GLITTERING_CRYSTAL]: {
        path: "./assets/tiles/glittering-crystal.png",
        size: [32, 64],
        frameSize: [32, 64],
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
