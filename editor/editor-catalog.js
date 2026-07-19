import { createSavePointInteraction } from "../interactions.js";
import { TILE_IDS } from "../tiles.js";

export const TILE_EDITOR_META = {
    [TILE_IDS.FLOOR]: { label: "Floor", category: "Ground" },
    [TILE_IDS.FLOOR_ALT]: { label: "Alternate floor", category: "Ground" },
    [TILE_IDS.WALL]: { label: "Wall", category: "Architecture" },
    [TILE_IDS.WIDE_WALL]: { label: "Wide wall", category: "Architecture" },
    [TILE_IDS.TREE]: { label: "Tree", category: "Nature" },
    [TILE_IDS.GLITTERING_CRYSTAL]: { label: "Glittering crystal (decorative)", category: "Decor" },
    [TILE_IDS.PLACEHOLDER_OBSTACLE]: { label: "Placeholder obstacle", category: "Debug" },

    [TILE_IDS.FOREST_FLOOR_MOSS]: { label: "Forest floor", category: "Ground" },
    [TILE_IDS.FOREST_FLOOR_CHECKER]: { label: "Checker floor", category: "Ground" },
    [TILE_IDS.STONE_CRACK_FLOOR]: { label: "Cracked stone floor", category: "Ground" },
    [TILE_IDS.PETAL_FLOOR]: { label: "Petal floor", category: "Ground" },
    [TILE_IDS.STONE_BRICK_WALL]: { label: "Stone brick wall", category: "Architecture" },
    [TILE_IDS.ROUND_BUSH]: { label: "Round bush", category: "Nature" },
    [TILE_IDS.WIDE_HEDGE]: { label: "Wide hedge", category: "Nature" },
    [TILE_IDS.CYPRESS_TREE]: { label: "Cypress tree", category: "Nature" },
    [TILE_IDS.RUIN_SHRINE]: { label: "Ruin shrine", category: "Architecture" },
    [TILE_IDS.CRYSTAL_TOTEM]: { label: "Crystal totem (decorative)", category: "Decor" },
    [TILE_IDS.DARK_TILE_FLOOR]: { label: "Dark tile floor", category: "Ground" },
    [TILE_IDS.METAL_GRATE_FLOOR]: { label: "Metal grate floor", category: "Ground" },
    [TILE_IDS.RED_CARPET_FLOOR]: { label: "Red carpet floor", category: "Ground" },
    [TILE_IDS.SAND_FLOOR]: { label: "Sand floor", category: "Ground" },
    [TILE_IDS.WOODEN_CRATE]: { label: "Wooden crate", category: "Architecture" },
    [TILE_IDS.SPIKE_TRAP]: { label: "Spike trap", category: "Hazards" },
    [TILE_IDS.BOOKSHELF_WIDE]: { label: "Wide bookshelf", category: "Architecture" },
    [TILE_IDS.GIANT_MUSHROOM]: { label: "Giant mushroom", category: "Nature" },
    [TILE_IDS.STONE_FOUNTAIN]: { label: "Stone fountain", category: "Architecture" },
    [TILE_IDS.ARCANE_VAT]: { label: "Arcane vat (decorative)", category: "Decor" },
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

    "forest-sign": { label: "Forest sign", category: "Decor" },
    "glowing-flower": { label: "Glowing flower", category: "Decor" },
    "stone-statue": { label: "Stone statue", category: "Characters" },
    lantern: { label: "Lantern", category: "Interactables" },
    "control-console": { label: "Control console", category: "Interactables" },
    "violet-orb": { label: "Violet orb", category: "Collectibles" },
    "robed-figure": { label: "Robed figure", category: "Characters" },
    "signal-beacon": { label: "Signal beacon", category: "Interactables" },
    "glittering-crystal": { label: "Glittering crystal", category: "Interactables" },
    "crystal-totem": { label: "Crystal totem", category: "Interactables" },
    "arcane-vat": { label: "Arcane vat", category: "Interactables" },
};

export const ENTITY_PRESETS = {
    blank: {
        label: "Blank entity",
        entity: {
            active: true,
            visual: { type: "sprite", id: "placeholder" },
            collision: false,
            interaction: null,
        },
    },
    strangeTree: {
        label: "Strange tree (tile visual)",
        entity: {
            active: true,
            visual: { type: "tile", id: TILE_IDS.TREE },
            collision: true,
            interaction: {
                handler: "effects",
                triggers: ["action"],
                effects: [
                    {
                        type: "showText",
                        pages: ["The bark is warm."],
                    },
                ],
            },
        },
    },
    door: {
        label: "Door",
        entity: {
            active: true,
            visual: { type: "sprite", id: "door" },
            collision: true,
            interaction: null,
        },
    },
    savePoint: {
        label: "Save point",
        entity: {
            active: true,
            visual: { type: "sprite", id: "save-point" },
            collision: true,
            interaction: createSavePointInteraction(),
        },
    },
    animatedSavePoint: {
        label: "Animated save point",
        entity: {
            active: true,
            visual: { type: "sprite", id: "animated-save-point" },
            collision: true,
            interaction: createSavePointInteraction(),
        },
    },

    glitteringCrystal: {
        label: "Glittering crystal",
        entity: {
            active: true,
            visual: { type: "sprite", id: "glittering-crystal" },
            collision: true,
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
    },
    crystalTotem: {
        label: "Crystal totem",
        entity: {
            active: true,
            visual: { type: "sprite", id: "crystal-totem" },
            collision: true,
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
    },
    arcaneVat: {
        label: "Arcane vat",
        entity: {
            active: true,
            visual: { type: "sprite", id: "arcane-vat" },
            collision: true,
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
    },

    forestSign: {
        label: "Forest sign",
        entity: {
            active: true,
            visual: { type: "sprite", id: "forest-sign" },
            collision: true,
            interaction: null,
        },
    },
    lantern: {
        label: "Lantern",
        entity: {
            active: true,
            visual: { type: "sprite", id: "lantern" },
            collision: true,
            interaction: null,
        },
    },
    console: {
        label: "Control console",
        entity: {
            active: true,
            visual: { type: "sprite", id: "control-console" },
            collision: true,
            interaction: null,
        },
    },
    signalBeacon: {
        label: "Signal beacon",
        entity: {
            active: true,
            visual: { type: "sprite", id: "signal-beacon" },
            collision: true,
            interaction: null,
        },
    },
};
