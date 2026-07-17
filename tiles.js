export const TILE_SIZE = 32;
export const EMPTY_TILE_ID = -1;

export const ATLAS_PATHS = {
    world: "./assets/atlases/world.png",
    entities: "./assets/atlases/entities.png",
    player: "./assets/atlases/player.png",
};

//TODO: we need to asses whather the current tile/interactable make sense. maybe id want for most trees to not have any interactions/effects - but one specific tree could be a switch for example - but for that id have to create an extra entity. 
// is a sprite that different from a tile? both have a position, a size, and a source in an atlas. but a tile is part of the map, while a sprite is not
// so - need to brainstorm this, it feels a bit cumbersome to be this limited in what can be done with tiles, and to have to create a separate entity for every interactable objectW

//TODO: figure out a neat way to allow to reuse tiles with mirroring - same for sprites
export const TILE_IDS = {
STATION_FLOOR: 0,
STATION_WALL: 1,
STATION_WATER: 2,
OFFICE_FLOOR: 3,
OFFICE_WALL: 4,
OFFICE_WATER: 5,
ORCHARD_FLOOR: 6,
ORCHARD_WALL: 7,
GLASS_FLOOR: 8,
SERVICE_FLOOR: 9,
SERVICE_WALL: 10,
RED_FLOOR: 11,
TRAIN_FLOOR: 12,
TRAIN_WALL: 13,
FINAL_FLOOR: 14,
TRACK_WATER: 15,
};

export const TILES = {
[TILE_IDS.STATION_FLOOR]: {
    path: ATLAS_PATHS.world,
    source: [0, 0, 32, 32],
},
[TILE_IDS.STATION_WALL]: {
    path: ATLAS_PATHS.world,
    source: [32, 0, 32, 32],
},
[TILE_IDS.STATION_WATER]: {
    path: ATLAS_PATHS.world,
    source: [64, 0, 32, 32],
    condition: {"any": [{"all": [{"hasItem": "waterlogged-punch-card"}, {"hasItem": "glass-fruit"}]}, {"all": [{"hasItem": "waterlogged-punch-card"}, {"hasItem": "brass-tooth"}]}, {"all": [{"hasItem": "glass-fruit"}, {"hasItem": "brass-tooth"}]}]},
    collision: false,
},
[TILE_IDS.OFFICE_FLOOR]: {
    path: ATLAS_PATHS.world,
    source: [96, 0, 32, 32],
},
[TILE_IDS.OFFICE_WALL]: {
    path: ATLAS_PATHS.world,
    source: [128, 0, 32, 32],
},
[TILE_IDS.OFFICE_WATER]: {
    path: ATLAS_PATHS.world,
    source: [160, 0, 32, 32],
    condition: { flag: "rain.phone" },
    collision: false,
},
[TILE_IDS.ORCHARD_FLOOR]: {
    path: ATLAS_PATHS.world,
    source: [192, 0, 32, 32],
},
[TILE_IDS.ORCHARD_WALL]: {
    path: ATLAS_PATHS.world,
    source: [224, 0, 32, 32],
},
[TILE_IDS.GLASS_FLOOR]: {
    path: ATLAS_PATHS.world,
    source: [256, 0, 32, 32],
},
[TILE_IDS.SERVICE_FLOOR]: {
    path: ATLAS_PATHS.world,
    source: [288, 0, 32, 32],
},
[TILE_IDS.SERVICE_WALL]: {
    path: ATLAS_PATHS.world,
    source: [320, 0, 32, 32],
},
[TILE_IDS.RED_FLOOR]: {
    path: ATLAS_PATHS.world,
    source: [352, 0, 32, 32],
},
[TILE_IDS.TRAIN_FLOOR]: {
    path: ATLAS_PATHS.world,
    source: [384, 0, 32, 32],
},
[TILE_IDS.TRAIN_WALL]: {
    path: ATLAS_PATHS.world,
    source: [416, 0, 32, 32],
},
[TILE_IDS.FINAL_FLOOR]: {
    path: ATLAS_PATHS.world,
    source: [448, 0, 32, 32],
},
[TILE_IDS.TRACK_WATER]: {
    path: ATLAS_PATHS.world,
    source: [0, 32, 32, 32],
    size: [32, 32],
    defaultAnimation: "drift",
    animations: {
        drift: {
            fps: 5,
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
