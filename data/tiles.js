export const TILE_SIZE = 32;
export const EMPTY_TILE_ID = -1;

export const ATLAS_PATHS = {
  world: "./assets/atlases/world.png",
  entities: "./assets/atlases/entities.png",
  debug: "./assets/atlases/debug.png",
  player: "./assets/atlases/player.png",
};

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

export const TILES = {
  [TILE_IDS.FLOOR]: {
    path: ATLAS_PATHS.world,
    source: [36, 68, 32, 32],
  },
  [TILE_IDS.FLOOR_ALT]: {
    path: ATLAS_PATHS.world,
    source: [70, 68, 32, 32],
  },
  [TILE_IDS.WALL]: {
    path: ATLAS_PATHS.world,
    source: [444, 68, 32, 32],
  },
  [TILE_IDS.WIDE_WALL]: {
    path: ATLAS_PATHS.world,
    source: [2, 2, 128, 64],
    size: [64, 32],
    footprint: [
      [0, 0],
      [1, 0],
    ],
  },
  [TILE_IDS.TREE]: {
    path: ATLAS_PATHS.world,
    source: [332, 2, 32, 64],
    size: [32, 64],
    footprint: [[0, 0]],
  },
  [TILE_IDS.GLITTERING_CRYSTAL]: {
    path: ATLAS_PATHS.entities,
    source: [262, 2, 32, 64],
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
  },
  [TILE_IDS.PLACEHOLDER_OBSTACLE]: {
    path: ATLAS_PATHS.debug,
    source: [0, 0, 32, 32],
    footprint: [[0, 0]],
  },
  [TILE_IDS.FOREST_FLOOR_MOSS]: {
    path: ATLAS_PATHS.world,
    source: [138, 68, 32, 32],
  },
  [TILE_IDS.FOREST_FLOOR_CHECKER]: {
    path: ATLAS_PATHS.world,
    source: [104, 68, 32, 32],
  },
  [TILE_IDS.STONE_CRACK_FLOOR]: {
    path: ATLAS_PATHS.world,
    source: [410, 68, 32, 32],
  },
  [TILE_IDS.PETAL_FLOOR]: {
    path: ATLAS_PATHS.world,
    source: [206, 68, 32, 32],
  },
  [TILE_IDS.STONE_BRICK_WALL]: {
    path: ATLAS_PATHS.world,
    source: [376, 68, 32, 32],
  },
  [TILE_IDS.ROUND_BUSH]: {
    path: ATLAS_PATHS.world,
    source: [274, 68, 32, 32],
    footprint: [[0, 0]],
  },
  [TILE_IDS.WIDE_HEDGE]: {
    path: ATLAS_PATHS.world,
    source: [432, 2, 64, 32],
    size: [64, 32],
    footprint: [
      [0, 0],
      [1, 0],
    ],
  },
  [TILE_IDS.CYPRESS_TREE]: {
    path: ATLAS_PATHS.world,
    source: [264, 2, 32, 64],
    size: [32, 64],
    footprint: [[0, 0]],
  },
  [TILE_IDS.RUIN_SHRINE]: {
    path: ATLAS_PATHS.world,
    source: [132, 2, 64, 64],
    size: [64, 64],
    footprint: [
      [0, 0],
      [1, 0],
      [0, 1],
      [1, 1],
    ],
  },
  [TILE_IDS.CRYSTAL_TOTEM]: {
    path: ATLAS_PATHS.entities,
    source: [132, 2, 32, 64],
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
  },
  [TILE_IDS.DARK_TILE_FLOOR]: {
    path: ATLAS_PATHS.world,
    source: [2, 68, 32, 32],
  },
  [TILE_IDS.METAL_GRATE_FLOOR]: {
    path: ATLAS_PATHS.world,
    source: [172, 68, 32, 32],
  },
  [TILE_IDS.RED_CARPET_FLOOR]: {
    path: ATLAS_PATHS.world,
    source: [240, 68, 32, 32],
  },
  [TILE_IDS.SAND_FLOOR]: {
    path: ATLAS_PATHS.world,
    source: [308, 68, 32, 32],
  },
  [TILE_IDS.WOODEN_CRATE]: {
    path: ATLAS_PATHS.world,
    source: [478, 68, 32, 32],
    footprint: [[0, 0]],
  },
  [TILE_IDS.SPIKE_TRAP]: {
    path: ATLAS_PATHS.world,
    source: [342, 68, 32, 32],
    footprint: [[0, 0]],
  },
  [TILE_IDS.BOOKSHELF_WIDE]: {
    path: ATLAS_PATHS.world,
    source: [366, 2, 64, 32],
    size: [64, 32],
    footprint: [
      [0, 0],
      [1, 0],
    ],
  },
  [TILE_IDS.GIANT_MUSHROOM]: {
    path: ATLAS_PATHS.world,
    source: [298, 2, 32, 64],
    size: [32, 64],
    footprint: [[0, 0]],
  },
  [TILE_IDS.STONE_FOUNTAIN]: {
    path: ATLAS_PATHS.world,
    source: [198, 2, 64, 64],
    size: [64, 64],
    footprint: [
      [0, 0],
      [1, 0],
      [0, 1],
      [1, 1],
    ],
  },
  [TILE_IDS.ARCANE_VAT]: {
    path: ATLAS_PATHS.entities,
    source: [2, 2, 32, 64],
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
  },
};
