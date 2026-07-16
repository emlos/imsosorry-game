import { ATLAS_PATHS } from "./tiles.js";

//TODO: figure out a neat way to allow to reuse sprites with mirroring - same for tiles
export const SPRITES = {
    door: {
        path: ATLAS_PATHS.entities,
        source: [166, 134, 32, 32],
        size: [32, 32],
    },
    "pink-orb": {
        path: ATLAS_PATHS.entities,
        source: [2, 68, 64, 64],
        size: [32, 32],
    },
    "blue-orb": {
        path: ATLAS_PATHS.entities,
        source: [392, 2, 64, 64],
        size: [32, 32],
    },
    receiver: {
        path: ATLAS_PATHS.entities,
        source: [302, 134, 32, 32],
        size: [32, 32],
    },
    "save-point": {
        path: ATLAS_PATHS.entities,
        source: [336, 134, 32, 32],
        size: [32, 32],
    },
    "animated-save-point": {
        path: ATLAS_PATHS.entities,
        source: [136, 68, 32, 32],
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
        path: ATLAS_PATHS.entities,
        source: [234, 134, 32, 32],
        size: [32, 32],
    },
    placeholder: {
        path: ATLAS_PATHS.debug,
        source: [0, 0, 32, 32],
        size: [32, 32],
    },
    "forest-sign": {
        path: ATLAS_PATHS.entities,
        source: [200, 134, 32, 32],
        size: [32, 32],
    },
    "glowing-flower": {
        path: ATLAS_PATHS.entities,
        source: [268, 134, 32, 32],
        size: [32, 32],
    },
    "stone-statue": {
        path: ATLAS_PATHS.entities,
        source: [102, 68, 32, 64],
        size: [32, 64],
    },
    lantern: {
        path: ATLAS_PATHS.entities,
        source: [266, 68, 32, 32],
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
        path: ATLAS_PATHS.entities,
        source: [132, 134, 32, 32],
        size: [32, 32],
    },
    "violet-orb": {
        path: ATLAS_PATHS.entities,
        source: [370, 134, 32, 32],
        size: [32, 32],
    },
    "robed-figure": {
        path: ATLAS_PATHS.entities,
        source: [68, 68, 32, 64],
        size: [32, 64],
    },
    "signal-beacon": {
        path: ATLAS_PATHS.entities,
        source: [2, 134, 32, 32],
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
    "glittering-crystal": {
        path: ATLAS_PATHS.entities,
        source: [262, 2, 32, 64],
        size: [32, 64],
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
    "crystal-totem": {
        path: ATLAS_PATHS.entities,
        source: [132, 2, 32, 64],
        size: [32, 64],
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
    "arcane-vat": {
        path: ATLAS_PATHS.entities,
        source: [2, 2, 32, 64],
        size: [32, 64],
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

export const PLAYER_SPRITES = {
    default: {
        kind: "image",
        path: ATLAS_PATHS.player,
        source: [0, 0, 32, 64],
        size: [32, 64],
        footprint: {
            width: 16,
            height: 16,
            offsetX: 8,
            offsetY: 8,
        },
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
        footprint: {
            width: 16,
            height: 16,
            offsetX: 8,
            offsetY: 8,
        },
    },
};
