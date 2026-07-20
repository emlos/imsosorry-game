// Generated map data. Save as data/maps.generated.js; edit through editor/editor.html.
export const MAPS = [
  {
    id: "camera-input-test",
    initialEntryId: "start",
    entries: {
      start: {
        col: 2,
        row: 4,
        facing: {
          dc: 1,
          dr: 0,
        },
      },
    },
    exits: [],
    triggers: [
      {
        id: "long-zoom-enter",
        region: {
          col: 6,
          row: 2,
          width: 4,
          height: 5,
        },
        events: ["enter"],
        frequency: "always",
        effects: [
          {
            type: "cameraZoom",
            zoom: 6,
            durationMs: 1200,
          },
        ],
      },
      {
        id: "long-zoom-exit",
        region: {
          col: 6,
          row: 2,
          width: 4,
          height: 5,
        },
        events: ["exit"],
        frequency: "always",
        effects: [
          {
            type: "cameraReset",
            durationMs: 1200,
          },
        ],
      },
    ],
    cameraZones: [],
    tiles: {},
    entities: [],
    layers: {
      base: [
        [
          0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0,
          1, 0, 1, 0, 1,
        ],
        [
          1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1,
          0, 1, 0, 1, 0,
        ],
        [
          0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0,
          1, 0, 1, 0, 1,
        ],
        [
          1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1,
          0, 1, 0, 1, 0,
        ],
        [
          0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0,
          1, 0, 1, 0, 1,
        ],
        [
          1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1,
          0, 1, 0, 1, 0,
        ],
        [
          0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0,
          1, 0, 1, 0, 1,
        ],
        [
          1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1,
          0, 1, 0, 1, 0,
        ],
        [
          0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0,
          1, 0, 1, 0, 1,
        ],
      ],
      obstacles: [
        [
          -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
          -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
        ],
        [
          -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
          -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
        ],
        [
          -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
          -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
        ],
        [
          -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
          -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
        ],
        [
          -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
          -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
        ],
        [
          -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
          -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
        ],
        [
          -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
          -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
        ],
        [
          -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
          -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
        ],
        [
          -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
          -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
        ],
      ],
    },
    editorGroup: "camera-tests",
    camera: {
      zoom: 4,
      follow: "player",
    },
  },
  {
    id: "camera-ownership-test",
    initialEntryId: "start",
    entries: {
      start: {
        col: 2,
        row: 4,
        facing: {
          dc: 1,
          dr: 0,
        },
      },
    },
    exits: [],
    triggers: [],
    cameraZones: [
      {
        id: "close-up",
        region: {
          col: 5,
          row: 2,
          width: 9,
          height: 5,
        },
        priority: 10,
        camera: {
          zoom: 6,
        },
        transitionInMs: 500,
        transitionOutMs: 500,
      },
      {
        id: "look-ahead",
        region: {
          col: 10,
          row: 2,
          width: 9,
          height: 5,
        },
        priority: 20,
        camera: {
          offsetX: 96,
        },
        transitionInMs: 500,
        transitionOutMs: 500,
      },
    ],
    tiles: {},
    entities: [],
    layers: {
      base: [
        [
          0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0,
          1, 0, 1, 0, 1,
        ],
        [
          1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1,
          0, 1, 0, 1, 0,
        ],
        [
          0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0,
          1, 0, 1, 0, 1,
        ],
        [
          1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1,
          0, 1, 0, 1, 0,
        ],
        [
          0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0,
          1, 0, 1, 0, 1,
        ],
        [
          1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1,
          0, 1, 0, 1, 0,
        ],
        [
          0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0,
          1, 0, 1, 0, 1,
        ],
        [
          1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1,
          0, 1, 0, 1, 0,
        ],
        [
          0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0,
          1, 0, 1, 0, 1,
        ],
      ],
      obstacles: [
        [
          -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
          -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
        ],
        [
          -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
          -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
        ],
        [
          -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
          -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
        ],
        [
          -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
          -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
        ],
        [
          -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
          -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
        ],
        [
          -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
          -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
        ],
        [
          -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
          -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
        ],
        [
          -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
          -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
        ],
        [
          -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
          -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
        ],
      ],
    },
    editorGroup: "camera-tests",
    camera: {
      zoom: 4,
      follow: "player",
    },
  },
  {
    id: "camera-pixel-test",
    initialEntryId: "start",
    entries: {
      start: {
        col: 2,
        row: 4,
        facing: {
          dc: 1,
          dr: 0,
        },
      },
    },
    exits: [],
    triggers: [
      {
        id: "slow-pan",
        region: {
          col: 5,
          row: 2,
          width: 1,
          height: 5,
        },
        events: ["enter"],
        frequency: "always",
        effects: [
          {
            type: "cameraPan",
            offsetX: 16,
            offsetY: 0,
            durationMs: 4000,
          },
        ],
      },
      {
        id: "pan-reset",
        region: {
          col: 10,
          row: 2,
          width: 1,
          height: 5,
        },
        events: ["enter"],
        frequency: "always",
        effects: [
          {
            type: "cameraReset",
            durationMs: 0,
          },
        ],
      },
      {
        id: "slow-zoom",
        region: {
          col: 14,
          row: 2,
          width: 1,
          height: 5,
        },
        events: ["enter"],
        frequency: "always",
        effects: [
          {
            type: "cameraZoom",
            zoom: 3,
            durationMs: 4000,
          },
        ],
      },
    ],
    cameraZones: [],
    tiles: {},
    entities: [],
    layers: {
      base: [
        [
          0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0,
          1, 0, 1, 0, 1,
        ],
        [
          1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1,
          0, 1, 0, 1, 0,
        ],
        [
          0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0,
          1, 0, 1, 0, 1,
        ],
        [
          1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1,
          0, 1, 0, 1, 0,
        ],
        [
          0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0,
          1, 0, 1, 0, 1,
        ],
        [
          1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1,
          0, 1, 0, 1, 0,
        ],
        [
          0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0,
          1, 0, 1, 0, 1,
        ],
        [
          1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1,
          0, 1, 0, 1, 0,
        ],
        [
          0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0,
          1, 0, 1, 0, 1,
        ],
      ],
      obstacles: [
        [
          -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
          -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
        ],
        [
          -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
          -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
        ],
        [
          -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
          -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
        ],
        [
          -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
          -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
        ],
        [
          -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
          -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
        ],
        [
          -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
          -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
        ],
        [
          -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
          -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
        ],
        [
          -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
          -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
        ],
        [
          -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
          -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
        ],
      ],
    },
    editorGroup: "camera-tests",
    camera: {
      zoom: 6,
      follow: "player",
    },
  },
  {
    id: "room-01-home",
    initialEntryId: "start",
    entries: {
      start: {
        col: 1,
        row: 1,
        facing: {
          dc: 0,
          dr: 1,
        },
      },
    },
    exits: [],
    triggers: [
      {
        id: "repeat-field",
        region: {
          col: 5,
          row: 4,
          width: 4,
          height: 3,
        },
        events: ["enter"],
        frequency: "always",
        effects: [
          {
            type: "playSound",
            soundId: "item-use",
          },
          {
            type: "showText",
            pages: ["This 4×3 region triggers every time you walk into it."],
          },
        ],
      },
    ],
    tiles: {},
    entities: [
      {
        id: "lantern-fragment-pickup",
        active: true,
        col: 3,
        row: 1,
        visual: {
          type: "sprite",
          id: "lantern",
        },
        transform: {
          flipX: false,
          flipY: false,
        },
        collision: false,
        interaction: {
          handler: "effects",
          triggers: ["action", "touch"],
          effects: [
            {
              type: "playSound",
              soundId: "orb-collect",
            },
            {
              type: "addItem",
              itemId: "lantern-fragment",
              quantity: 1,
            },
            {
              type: "setEntityActive",
              entityId: "lantern-fragment-pickup",
              active: false,
            },
          ],
          message: "Picked up the lantern fragment.",
        },
        condition: null,
      },
      {
        id: "robed-normal",
        active: true,
        col: 8,
        row: 2,
        visual: {
          type: "sprite",
          id: "robed-figure",
        },
        transform: {
          flipX: false,
          flipY: false,
        },
        collision: true,
        interaction: {
          handler: "effects",
          triggers: ["action"],
          effects: [
            {
              type: "cameraPan",
              offsetX: -64,
              offsetY: 0,
              durationMs: 500,
            },
            {
              type: "showText",
              pages: [
                "The camera can pan while it continues following the player.",
              ],
              afterClose: [
                {
                  type: "cameraReset",
                  durationMs: 400,
                },
                {
                  type: "cameraZoom",
                  zoom: 6,
                  durationMs: 500,
                },
                {
                  type: "showText",
                  pages: [
                    "Camera transitions finish before the next effect begins.",
                  ],
                  afterClose: [
                    {
                      type: "cameraReset",
                      durationMs: 500,
                    },
                  ],
                },
              ],
            },
          ],
          message: "Camera sequence demonstration.",
        },
        condition: null,
      },
      {
        id: "robed-flipped-x",
        active: true,
        col: 1,
        row: 7,
        visual: {
          type: "sprite",
          id: "robed-figure",
        },
        transform: {
          flipX: true,
          flipY: false,
        },
        collision: false,
        interaction: null,
        condition: null,
      },
      {
        id: "sign-normal",
        active: true,
        col: 3,
        row: 7,
        visual: {
          type: "sprite",
          id: "forest-sign",
        },
        transform: {
          flipX: false,
          flipY: false,
        },
        collision: false,
        interaction: null,
        condition: null,
      },
      {
        id: "sign-flipped-y",
        active: true,
        col: 4,
        row: 7,
        visual: {
          type: "sprite",
          id: "forest-sign",
        },
        transform: {
          flipX: false,
          flipY: true,
        },
        collision: false,
        interaction: null,
        condition: null,
      },
      {
        id: "lantern-normal",
        active: true,
        col: 7,
        row: 7,
        visual: {
          type: "sprite",
          id: "lantern",
        },
        transform: {
          flipX: false,
          flipY: false,
        },
        collision: false,
        interaction: null,
        condition: null,
      },
      {
        id: "lantern-flipped-both",
        active: true,
        col: 8,
        row: 7,
        visual: {
          type: "sprite",
          id: "lantern",
        },
        transform: {
          flipX: true,
          flipY: true,
        },
        collision: false,
        interaction: null,
        condition: null,
      },
    ],
    layers: {
      base: [
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      ],
      obstacles: [
        [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
        [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
        [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
        [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
        [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
        [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
        [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
        [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
      ],
    },
    editorGroup: "existing-demo",
    camera: {
      zoom: 4,
      follow: "player",
    },
    cameraZones: [
      {
        id: "repeat-field-close-up",
        region: {
          col: 5,
          row: 4,
          width: 4,
          height: 3,
        },
        priority: 10,
        camera: {
          zoom: 6,
        },
        transitionInMs: 500,
        transitionOutMs: 500,
      },
    ],
  },
];
