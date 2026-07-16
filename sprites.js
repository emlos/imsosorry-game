//TODO: once all atlaseses are within a list, remove the need to import them one by one
import { EDITOR_TEST_ATLAS_A_PATH, EDITOR_TEST_ATLAS_B_PATH, WORLD_ATLAS_PATH } from "./tiles.js";

//TODO: keep sprites in atlases instead of individual images - remove the ability to use individual images for sprites, no backwards compatibility needed
//TODO: figure out a neat way to allow to reuse sprites with mirroring - same for tiles
export const SPRITES = {
    door: {
        path: WORLD_ATLAS_PATH,
        source: [103, 5, 32, 32],
        size: [32, 32],
    },
    "pink-orb": {
        path: "./assets/tiles/orb.png",
        size: [32, 32],
    },
    "blue-orb": {
        path: "./assets/tiles/orb_blue.png",
        size: [32, 32],
    },
    receiver: {
        path: "./assets/tiles/receiver.png",
        size: [32, 32],
    },
    "save-point": {
        path: "./assets/tiles/save-point.png",
        size: [32, 32],
    },
    "animated-save-point": {
        path: WORLD_ATLAS_PATH,
        source: [7, 145, 32, 32],
        size: [32, 32],
        defaultAnimation: "pulse",
        animations: {
            pulse: {
                fps: 6,
                frames: [
                    [0, 0],
                    [1, 0],
                    [2, 0],
                    [3, 0],
                ],
            },
        },
    },
    "glass-figure": {
        path: "./assets/tiles/glass-figure.png",
        size: [32, 32],
    },
    placeholder: {
        path: "./assets/debug/placeholder.png",
        size: [32, 32],
    },
    "forest-sign": {
        path: EDITOR_TEST_ATLAS_A_PATH,
        source: [192, 0, 32, 32],
        size: [32, 32],
    },
    "glowing-flower": {
        path: EDITOR_TEST_ATLAS_A_PATH,
        source: [224, 0, 32, 32],
        size: [32, 32],
    },
    "stone-statue": {
        path: EDITOR_TEST_ATLAS_A_PATH,
        source: [160, 32, 32, 64],
        size: [32, 64],
    },
    lantern: {
        path: EDITOR_TEST_ATLAS_A_PATH,
        source: [128, 96, 32, 32],
        size: [32, 32],
        defaultAnimation: "glow",
        animations: {
            glow: {
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
    "control-console": {
        path: EDITOR_TEST_ATLAS_B_PATH,
        source: [192, 0, 32, 32],
        size: [32, 32],
    },
    "violet-orb": {
        path: EDITOR_TEST_ATLAS_B_PATH,
        source: [224, 0, 32, 32],
        size: [32, 32],
    },
    "robed-figure": {
        path: EDITOR_TEST_ATLAS_B_PATH,
        source: [160, 32, 32, 64],
        size: [32, 64],
    },
    "signal-beacon": {
        path: EDITOR_TEST_ATLAS_B_PATH,
        source: [128, 96, 32, 32],
        size: [32, 32],
        defaultAnimation: "blink",
        animations: {
            blink: {
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
};

export const PLAYER_SPRITES = {
    default: {
        kind: "image",
        path: "./assets/player/default-sheet.png",
        source: [0, 0, 32, 64],
        size: [32, 64],
        defaultAnimation: "idle-down",
        animations: {
            "idle-down": {
                fps: 8,
                frames: [[0, 0]],
            },
            "walk-down": {
                fps: 8,
                frames: [
                    [0, 0],
                    [1, 0],
                    [2, 0],
                    [1, 0],
                ],
            },
            "idle-left": {
                fps: 8,
                frames: [[0, 1]],
            },
            "walk-left": {
                fps: 8,
                frames: [
                    [0, 1],
                    [1, 1],
                    [2, 1],
                    [1, 1],
                ],
            },
            "idle-right": {
                fps: 8,
                frames: [[0, 2]],
            },
            "walk-right": {
                fps: 8,
                frames: [
                    [0, 2],
                    [1, 2],
                    [2, 2],
                    [1, 2],
                ],
            },
            "idle-up": {
                fps: 8,
                frames: [[0, 3]],
            },
            "walk-up": {
                fps: 8,
                frames: [
                    [0, 3],
                    [1, 3],
                    [2, 3],
                    [1, 3],
                ],
            },
        },
    },
    "debug-shape": {
        kind: "shape",
        fillStyle: "#f3a7c0",
        strokeStyle: "#3f2945",
    },
};
