import { COMMON_INTERACTIONS } from "../interactions.js";
import { TILE_IDS } from "../tiles.js";

export const TILE_EDITOR_META = {
    [TILE_IDS.FLOOR]: { label: "Floor", category: "Ground" },
    [TILE_IDS.FLOOR_ALT]: { label: "Alternate floor", category: "Ground" },
    [TILE_IDS.WALL]: { label: "Wall", category: "Architecture" },
    [TILE_IDS.WIDE_WALL]: { label: "Wide wall", category: "Architecture" },
    [TILE_IDS.TREE]: { label: "Tree", category: "Nature" },
    [TILE_IDS.GLITTERING_CRYSTAL]: { label: "Glittering crystal", category: "Interactables" },
    [TILE_IDS.PLACEHOLDER_OBSTACLE]: { label: "Placeholder obstacle", category: "Debug" },
};

export const SPRITE_EDITOR_META = {
    door: { label: "Door", category: "Architecture" },
    "pink-orb": { label: "Pink orb", category: "Collectibles" },
    "blue-orb": { label: "Blue orb", category: "Collectibles" },
    receiver: { label: "Receiver", category: "Interactables" },
    "save-point": { label: "Save point", category: "Interactables" },
    "animated-save-point": { label: "Animated save point", category: "Interactables" },
    "glass-figure": { label: "Glass figure", category: "Characters" },
    placeholder: { label: "Placeholder", category: "Debug" },
};

export const ENTITY_PRESETS = {
    blank: {
        label: "Blank entity",
        entity: {
            active: true,
            spriteId: "placeholder",
            collision: false,
            interaction: null,
        },
    },
    door: {
        label: "Door",
        entity: {
            active: true,
            spriteId: "door",
            collision: true,
            interaction: null,
        },
    },
    savePoint: {
        label: "Save point",
        entity: {
            active: true,
            spriteId: "save-point",
            collision: true,
            interaction: COMMON_INTERACTIONS.SAVE_POINT,
        },
    },
    animatedSavePoint: {
        label: "Animated save point",
        entity: {
            active: true,
            spriteId: "animated-save-point",
            collision: true,
            interaction: COMMON_INTERACTIONS.SAVE_POINT,
        },
    },
};
