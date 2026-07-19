// Yume v0.9 authoring templates.
// These are examples to paste into the appropriate definitions; this file is not imported.

// -----------------------------------------------------------------------------
// CONDITION TEMPLATES
// -----------------------------------------------------------------------------

const conditions = {
    flagTrue: { flag: "example.flag" },
    flagExactlyFalse: { flag: "example.flag", equals: false },
    flagNotTrue: { notFlag: "example.flag" },
    hasItem: { hasItem: "example-item" },
    notItem: { notItem: "example-item" },
    all: {
        all: [{ flag: "example.flag" }, { hasItem: "example-item" }],
    },
    any: {
        any: [{ flag: "example.flag" }, { hasItem: "example-item" }],
    },
};

// -----------------------------------------------------------------------------
// ENTITY TEMPLATE
// -----------------------------------------------------------------------------

const entity = {
    id: "entity-id",
    active: true,
    col: 2,
    row: 3,
    visual: { type: "sprite", id: "placeholder" },
    transform: { flipX: false, flipY: false },
    collision: false,
    interaction: null,
    // condition: { notFlag: "entity.removed" },
};

// -----------------------------------------------------------------------------
// EFFECTS INTERACTION
// -----------------------------------------------------------------------------

const effectsInteraction = {
    handler: "effects",
    triggers: ["action"],
    // condition: { flag: "interaction.enabled" },
    effects: [
        {
            type: "showText",
            speaker: "Speaker",
            pages: ["Page one.", "Page two."],
            afterClose: [{ type: "setFlag", flag: "interaction.finished", value: true }],
        },
    ],
    // message: "Status log text.",
};

// -----------------------------------------------------------------------------
// DIRECT TELEPORT INTERACTION
// -----------------------------------------------------------------------------

const teleportInteraction = {
    handler: "teleport",
    triggers: ["action"],
    params: {
        mapId: "room-target",
        entryId: "fromSource",
        // musicTransition: "crossfade",
        // musicTransitionMs: 700,
    },
    message: "The door opens.",
};

// -----------------------------------------------------------------------------
// RECTANGULAR MAP TRIGGER
// -----------------------------------------------------------------------------

const mapTrigger = {
    id: "hallway-distortion",
    region: { col: 3, row: 4, width: 5, height: 2 },
    events: ["enter"],
    frequency: "always", // "once-per-visit" | "once-per-save"
    // condition: { flag: "world.changed" },
    effects: [
        { type: "playSound", soundId: "receiver-chime" },
        { type: "showText", pages: ["The hallway changes."] },
    ],
};

// -----------------------------------------------------------------------------
// MAP HOOKS
// -----------------------------------------------------------------------------

const mapHooks = {
    onEnter: [
        {
            type: "random",
            id: "visitor",
            scope: "roomVisit",
            choices: [
                {
                    weight: 10,
                    effects: [
                        {
                            type: "setEntityActive",
                            entityId: "visitor",
                            active: true,
                            persistence: "roomVisit",
                        },
                    ],
                },
                { weight: 90, effects: [] },
            ],
        },
    ],
    onExit: [{ type: "setFlag", flag: "room.was-left", value: true }],
};

// -----------------------------------------------------------------------------
// STATIC EDGE EXITS
// -----------------------------------------------------------------------------

const exits = {
    toEntry: {
        edge: "east",
        range: [1, 4],
        targetMapId: "room-target",
        entryId: "fromSource",
    },
    toPosition: {
        edge: "south",
        range: [2, 5],
        targetMapId: "room-target",
        targetPosition: {
            col: 3,
            row: 1,
            facing: { dc: 0, dr: 1 },
        },
    },
    preserveAxis: {
        edge: "east",
        range: [1, 4],
        targetMapId: "room-target",
        targetEdge: "west",
        preserveAxis: true,
        offset: 0,
    },
};

// -----------------------------------------------------------------------------
// RANDOM EDGE EXIT
// -----------------------------------------------------------------------------

const randomExit = {
    id: "east-exit",
    edge: "east",
    range: [1, 4],
    destination: {
        type: "random",
        id: "destination",
        scope: "use",
        choices: [
            {
                weight: 9,
                targetMapId: "room-normal",
                targetEdge: "west",
                preserveAxis: true,
                offset: 0,
            },
            {
                weight: 1,
                targetMapId: "room-rare",
                entryId: "start",
            },
        ],
    },
};

// -----------------------------------------------------------------------------
// CONDITIONAL MAP MUSIC
// -----------------------------------------------------------------------------

const music = [
    {
        condition: { flag: "world.changed" },
        trackId: "strange-room",
        playbackRate: 0.8,
    },
    {
        trackId: "forest",
        continuityId: "forest-region",
        restart: "if-different",
    },
];

const musicEvents = [
    {
        id: "entry-cue",
        frequency: "once-per-save",
        entryId: "start",
        probability: 0.5,
        effects: [
            {
                type: "playMusicEffect",
                musicEffectId: "discovery",
                duckMusicTo: 0.2,
            },
        ],
    },
];

// -----------------------------------------------------------------------------
// TILE VISUAL
// -----------------------------------------------------------------------------

const tileDefinition = {
    path: ATLAS_PATHS.world,
    source: [0, 0, 32, 64],
    size: [32, 64],
    footprint: [[0, 0]],
    defaultAnimation: "glow",
    animations: {
        glow: {
            fps: 6,
            frames: [
                [0, 0],
                [1, 0],
                [2, 0],
                [1, 0],
            ],
        },
    },
};

// -----------------------------------------------------------------------------
// USABLE ITEM
// -----------------------------------------------------------------------------

const itemDefinition = {
    name: "Example Item",
    icon: "./assets/items/example.png",
    description: "An example item.",
    usable: true,
    effects: [
        { type: "playSound", soundId: "item-use" },
        {
            type: "showText",
            pages: ["The item reacts."],
        },
    ],
};

// Camera effect sequence
const cameraSequence = [
    { type: "cameraPan", offsetX: -64, offsetY: 0, durationMs: 500 },
    {
        type: "showText",
        pages: ["The pan has finished."],
        afterClose: [
            { type: "cameraZoom", zoom: 2, durationMs: 500 },
            { type: "showText", pages: ["The zoom has finished."], afterClose: [{ type: "cameraReset", durationMs: 500 }] },
        ],
    },
];
