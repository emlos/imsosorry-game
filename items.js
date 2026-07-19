export const ITEMS = {
  "lantern-fragment": {
    name: "Lantern Fragment",
    visual: {
      type: "sprite",
      id: "lantern",
    },
    description: "A small light that continues to pulse in your hand.",
    usable: true,
    effects: [
      {
        type: "showText",
        pages: [
          "The fragment brightens for a moment, then settles back into its rhythm.",
        ],
      },
    ],
  },
};

//TODO evaluate if this is a good idea:
//separation of global items/entities vs map specific should exists. i.e, a consumable item may be spread over multiple maps -> global item, belongs in items.js,same with an entity only existing in one room -> belongs to the map it exists in. ideally, if i decide an item should be globally defined, i can just cut+paste the definition from the map's item array into items.js, without functional changes.
//-> editor: add possibility to define items/entities for the map to own.

//(needs evaluation) TODO: some sort of data subfolder structure, so maps/items/etc arent mixed in with engine code files
