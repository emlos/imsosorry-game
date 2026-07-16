export const TILE_SIZE = 32;
export const EMPTY_TILE_ID = -1;

//TODO: keep a list of atlas paths instead of constants - there'll be a lot of them, and they should be easy to add/remove
export const WORLD_ATLAS_PATH = "./assets/atlases/world.png";
export const EDITOR_TEST_ATLAS_A_PATH = "./assets/atlases/editor-test-atlas-a.png";
export const EDITOR_TEST_ATLAS_B_PATH = "./assets/atlases/editor-test-atlas-b.png";

//TODO: figure out a neat way to allow to reuse tiles with mirroring - same for sprites
export const TILE_IDS = {
    FLOOR: 0,
    FLOOR_ALT: 1,
    WALL: 2,
    WIDE_WALL: 3,
    TREE: 4,
    GLITTERING_CRYSTAL: 5,
    PLACEHOLDER_OBSTACLE: 6,

    //TEST
    FOREST_FLOOR_MOSS: 7,
    FOREST_FLOOR_CHECKER: 8,
    STONE_CRACK_FLOOR: 9,
    PETAL_FLOOR: 10,
    STONE_BRICK_WALL: 11,
    ROUND_BUSH: 12,
    WIDE_HEDGE: 13,
    CYPRESS_TREE: 14,
    RUIN_SHRINE: 15,
    CRYSTAL_TOTEM: 16,
    DARK_TILE_FLOOR: 17,
    METAL_GRATE_FLOOR: 18,
    RED_CARPET_FLOOR: 19,
    SAND_FLOOR: 20,
    WOODEN_CRATE: 21,
    SPIKE_TRAP: 22,
    BOOKSHELF_WIDE: 23,
    GIANT_MUSHROOM: 24,
    STONE_FOUNTAIN: 25,
    ARCANE_VAT: 26,
};


//TODO: cleanup: tiles should only be decorative - all interactable 'tiles' should be entities
//TODO all tiles should be sourced from atlases - remove the ability to use individual images for tiles, no backwards compatibility needed
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
    [TILE_IDS.FOREST_FLOOR_MOSS]: {
        path: EDITOR_TEST_ATLAS_A_PATH,
        source: [0, 0, 32, 32],
    },
    [TILE_IDS.FOREST_FLOOR_CHECKER]: {
        path: EDITOR_TEST_ATLAS_A_PATH,
        source: [32, 0, 32, 32],
    },
    [TILE_IDS.STONE_CRACK_FLOOR]: {
        path: EDITOR_TEST_ATLAS_A_PATH,
        source: [64, 0, 32, 32],
    },
    [TILE_IDS.PETAL_FLOOR]: {
        path: EDITOR_TEST_ATLAS_A_PATH,
        source: [96, 0, 32, 32],
    },
    [TILE_IDS.STONE_BRICK_WALL]: {
        path: EDITOR_TEST_ATLAS_A_PATH,
        source: [128, 0, 32, 32],
    },
    [TILE_IDS.ROUND_BUSH]: {
        path: EDITOR_TEST_ATLAS_A_PATH,
        source: [160, 0, 32, 32],
        footprint: [[0, 0]],
    },
    [TILE_IDS.WIDE_HEDGE]: {
        path: EDITOR_TEST_ATLAS_A_PATH,
        source: [0, 32, 64, 32],
        size: [64, 32],
        footprint: [
            [0, 0],
            [1, 0],
        ],
    },
    [TILE_IDS.CYPRESS_TREE]: {
        path: EDITOR_TEST_ATLAS_A_PATH,
        source: [64, 32, 32, 64],
        size: [32, 64],
        footprint: [[0, 0]],
    },
    [TILE_IDS.RUIN_SHRINE]: {
        path: EDITOR_TEST_ATLAS_A_PATH,
        source: [96, 32, 64, 64],
        size: [64, 64],
        footprint: [
            [0, 0],
            [1, 0],
            [0, 1],
            [1, 1],
        ],
    },
    [TILE_IDS.CRYSTAL_TOTEM]: {
        path: EDITOR_TEST_ATLAS_A_PATH,
        source: [0, 96, 32, 64],
        size: [32, 64],
        footprint: [[0, 0]],
        defaultAnimation: "pulse",
        animations: {
            pulse: {
                fps: 7,
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
                    pages: ["A cool shimmer passes through the crystal totem."],
                },
            ],
        },
    },
    [TILE_IDS.DARK_TILE_FLOOR]: {
        path: EDITOR_TEST_ATLAS_B_PATH,
        source: [0, 0, 32, 32],
    },
    [TILE_IDS.METAL_GRATE_FLOOR]: {
        path: EDITOR_TEST_ATLAS_B_PATH,
        source: [32, 0, 32, 32],
    },
    [TILE_IDS.RED_CARPET_FLOOR]: {
        path: EDITOR_TEST_ATLAS_B_PATH,
        source: [64, 0, 32, 32],
    },
    [TILE_IDS.SAND_FLOOR]: {
        path: EDITOR_TEST_ATLAS_B_PATH,
        source: [96, 0, 32, 32],
    },
    [TILE_IDS.WOODEN_CRATE]: {
        path: EDITOR_TEST_ATLAS_B_PATH,
        source: [128, 0, 32, 32],
        footprint: [[0, 0]],
    },
    [TILE_IDS.SPIKE_TRAP]: {
        path: EDITOR_TEST_ATLAS_B_PATH,
        source: [160, 0, 32, 32],
        footprint: [[0, 0]],
    },
    [TILE_IDS.BOOKSHELF_WIDE]: {
        path: EDITOR_TEST_ATLAS_B_PATH,
        source: [0, 32, 64, 32],
        size: [64, 32],
        footprint: [
            [0, 0],
            [1, 0],
        ],
    },
    [TILE_IDS.GIANT_MUSHROOM]: {
        path: EDITOR_TEST_ATLAS_B_PATH,
        source: [64, 32, 32, 64],
        size: [32, 64],
        footprint: [[0, 0]],
    },
    [TILE_IDS.STONE_FOUNTAIN]: {
        path: EDITOR_TEST_ATLAS_B_PATH,
        source: [96, 32, 64, 64],
        size: [64, 64],
        footprint: [
            [0, 0],
            [1, 0],
            [0, 1],
            [1, 1],
        ],
    },
    [TILE_IDS.ARCANE_VAT]: {
        path: EDITOR_TEST_ATLAS_B_PATH,
        source: [0, 96, 32, 64],
        size: [32, 64],
        footprint: [[0, 0]],
        defaultAnimation: "bubble",
        animations: {
            bubble: {
                fps: 6,
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
                    pages: ["The liquid bubbles with a soft glow."],
                },
            ],
        },
    },
};
