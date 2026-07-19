import { createDefaultInteraction } from "../interactions.js";
import { TILE_IDS } from "../tiles.js";

function makeTemplateFlag(context, suffix) {
    const mapId = context.map?.id ?? "map";
    const entityId = context.entity?.id ?? "entity";
    return `${mapId}.${entityId}.${suffix}`;
}

function getTemplateEntry(context) {
    const currentMap = context.map;
    const otherMaps = (context.maps ?? []).filter((map) => map !== currentMap);
    const candidates = [...otherMaps, currentMap].filter(Boolean);
    const targetMap =
        candidates.find((map) => Object.keys(map.entries ?? {}).length > 0) ??
        candidates[0] ??
        null;
    const entryIds = Object.keys(targetMap?.entries ?? {});
    const entryId =
        (targetMap?.initialEntryId &&
        Object.hasOwn(targetMap.entries ?? {}, targetMap.initialEntryId)
            ? targetMap.initialEntryId
            : entryIds[0]) ?? "entry-id";

    return {
        mapId: targetMap?.id ?? "map-id",
        entryId,
    };
}

function getTemplateItemId(context) {
    return context.itemIds?.[0] ?? "item-id";
}

export function createDialogueInteraction() {
    return createDefaultInteraction("effects", {
        effects: [
            {
                type: "showText",
                pages: ["Describe this object."],
            },
        ],
    });
}

export function createTeleportInteraction(context = {}) {
    return createDefaultInteraction("teleport", getTemplateEntry(context));
}

export function createSavePointInteraction({
    speaker = "Save Point",
    pages = [
        "A small light holds perfectly still inside the glass.",
        "For a moment, the shape of the dream becomes easy to remember.",
    ],
} = {}) {
    return createDefaultInteraction("effects", {
        effects: [
            {
                type: "showText",
                speaker,
                pages: [...pages],
                afterClose: [{ type: "saveGame" }],
            },
        ],
    });
}

export function createItemPickupInteraction(context = {}) {
    const itemId = getTemplateItemId(context);
    const entityId = context.entity?.id ?? "entity-id";

    return createDefaultInteraction("effects", {
        effects: [
            {
                type: "addItem",
                itemId,
                quantity: 1,
            },
            {
                type: "showText",
                pages: [`Picked up ${itemId}.`],
                afterClose: [
                    {
                        type: "setEntityActive",
                        entityId,
                        active: false,
                    },
                ],
            },
        ],
    });
}

export function createFlagChangeInteraction(context = {}) {
    const flag = makeTemplateFlag(context, "switch-on");

    return createDefaultInteraction("effects", {
        effects: [
            {
                type: "toggleFlag",
                flag,
            },
            {
                type: "showText",
                pages: [`Toggled flag: ${flag}`],
            },
        ],
    });
}

export function createInspectOnceInteraction(context = {}) {
    const flag = makeTemplateFlag(context, "inspected");

    return createDefaultInteraction("effects", {
        condition: { notFlag: flag },
        effects: [
            {
                type: "showText",
                pages: ["You inspect it carefully."],
                afterClose: [
                    {
                        type: "setFlag",
                        flag,
                        value: true,
                    },
                ],
            },
        ],
    });
}

export function createConditionalDialogueInteraction(context = {}) {
    const flag = makeTemplateFlag(context, "changed");

    return createDefaultInteraction("effects", {
        effects: [
            {
                type: "showText",
                condition: { notFlag: flag },
                pages: ["Nothing has changed yet."],
            },
            {
                type: "showText",
                condition: { flag },
                pages: ["Something is different now."],
            },
        ],
    });
}

export const INTERACTION_TEMPLATES = [
    {
        id: "dialogue",
        label: "Dialogue / description",
        description: "Action interaction with a single editable text effect.",
        create: () => createDialogueInteraction(),
    },
    {
        id: "teleport",
        label: "Teleport",
        description: "Direct action teleport to the first available entry, preferring another map.",
        create: (context) => createTeleportInteraction(context),
        notice(context) {
            const maps = context.maps ?? [];
            return maps.some((map) => Object.keys(map.entries ?? {}).length > 0)
                ? ""
                : "No map entry exists; replace the placeholder destination before applying.";
        },
    },
    {
        id: "save-point",
        label: "Save point",
        description: "Dialogue followed by saveGame after the textbox closes.",
        create: () => createSavePointInteraction(),
    },
    {
        id: "item-pickup",
        label: "Item pickup",
        description: "Adds one item, shows pickup text, then deactivates this entity.",
        create: (context) => createItemPickupInteraction(context),
        notice(context) {
            return context.itemIds?.length
                ? ""
                : 'ITEMS is empty; replace the placeholder "item-id" after defining an item.';
        },
    },
    {
        id: "flag-change",
        label: "Switch / flag change",
        description: "Toggles an entity-specific flag and reports its generated flag ID.",
        create: (context) => createFlagChangeInteraction(context),
    },
    {
        id: "inspect-once",
        label: "Inspect once",
        description: "Shows text once per save and sets an entity-specific flag after closing.",
        create: (context) => createInspectOnceInteraction(context),
    },
    {
        id: "conditional-dialogue",
        label: "Conditional dialogue",
        description: "Two mutually exclusive text effects selected by an entity-specific flag.",
        create: (context) => createConditionalDialogueInteraction(context),
    },
];

export function getInteractionTemplate(templateId) {
    return INTERACTION_TEMPLATES.find((template) => template.id === templateId) ?? null;
}

export function createInteractionFromTemplate(templateId, context = {}) {
    const template = getInteractionTemplate(templateId);
    if (!template) throw new Error(`Unknown interaction template "${templateId}".`);
    return template.create(context);
}

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
            transform: { flipX: false, flipY: false },
            collision: false,
            interaction: null,
        },
    },
    strangeTree: {
        label: "Strange tree (tile visual)",
        entity: {
            active: true,
            visual: { type: "tile", id: TILE_IDS.TREE },
            transform: { flipX: false, flipY: false },
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
            transform: { flipX: false, flipY: false },
            collision: true,
            interaction: null,
        },
    },
    savePoint: {
        label: "Save point",
        entity: {
            active: true,
            visual: { type: "sprite", id: "save-point" },
            transform: { flipX: false, flipY: false },
            collision: true,
            interaction: createSavePointInteraction(),
        },
    },
    animatedSavePoint: {
        label: "Animated save point",
        entity: {
            active: true,
            visual: { type: "sprite", id: "animated-save-point" },
            transform: { flipX: false, flipY: false },
            collision: true,
            interaction: createSavePointInteraction(),
        },
    },

    glitteringCrystal: {
        label: "Glittering crystal",
        entity: {
            active: true,
            visual: { type: "sprite", id: "glittering-crystal" },
            transform: { flipX: false, flipY: false },
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
            transform: { flipX: false, flipY: false },
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
            transform: { flipX: false, flipY: false },
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
            transform: { flipX: false, flipY: false },
            collision: true,
            interaction: null,
        },
    },
    lantern: {
        label: "Lantern",
        entity: {
            active: true,
            visual: { type: "sprite", id: "lantern" },
            transform: { flipX: false, flipY: false },
            collision: true,
            interaction: null,
        },
    },
    console: {
        label: "Control console",
        entity: {
            active: true,
            visual: { type: "sprite", id: "control-console" },
            transform: { flipX: false, flipY: false },
            collision: true,
            interaction: null,
        },
    },
    signalBeacon: {
        label: "Signal beacon",
        entity: {
            active: true,
            visual: { type: "sprite", id: "signal-beacon" },
            transform: { flipX: false, flipY: false },
            collision: true,
            interaction: null,
        },
    },
};
