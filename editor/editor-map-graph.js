import cytoscape from "../vendor/cytoscape.esm.min.mjs";
import { EMPTY_TILE_ID } from "../data/tiles.js";
import { getMapSize, mergeTileDefinitions } from "./editor-model.js";

const GRAPH_ID_PREFIX = {
  map: "map:",
  group: "group:",
  missing: "missing:",
};

function mapNodeId(mapId) {
  return `${GRAPH_ID_PREFIX.map}${mapId}`;
}

function groupNodeId(groupName) {
  return `${GRAPH_ID_PREFIX.group}${groupName}`;
}

function missingNodeId(mapId) {
  return `${GRAPH_ID_PREFIX.missing}${mapId}`;
}

function edgeId(kind, sourceMapId, targetMapId) {
  return [kind, sourceMapId, targetMapId]
    .map((part) => encodeURIComponent(String(part)))
    .join(":");
}

export function collectEffectTeleports(
  effects,
  output = [],
  inheritedConditional = false,
  inheritedProbabilistic = false,
) {
  for (const effect of effects ?? []) {
    if (!effect || typeof effect !== "object") continue;

    const conditional = inheritedConditional || Boolean(effect.condition);

    if (effect.type === "teleport" && typeof effect.mapId === "string") {
      output.push({
        targetMapId: effect.mapId,
        entryId: effect.entryId ?? null,
        conditional,
        probabilistic: inheritedProbabilistic,
      });
    }

    if (effect.type === "showText") {
      collectEffectTeleports(
        effect.afterClose,
        output,
        conditional,
        inheritedProbabilistic,
      );
    }

    if (effect.type === "random") {
      for (const choice of effect.choices ?? []) {
        collectEffectTeleports(choice.effects, output, conditional, true);
      }
    }
  }

  return output;
}

export function collectInteractionTeleports(interaction) {
  if (!interaction || typeof interaction !== "object") return [];

  if (
    interaction.handler === "teleport" &&
    typeof interaction.params?.mapId === "string"
  ) {
    return [
      {
        targetMapId: interaction.params.mapId,
        entryId: interaction.params.entryId ?? null,
        conditional: Boolean(interaction.condition),
        probabilistic: false,
      },
    ];
  }

  if (interaction.handler === "effects") {
    return collectEffectTeleports(
      interaction.effects,
      [],
      Boolean(interaction.condition),
    );
  }

  return [];
}

export function visitPlacedTiles(map, visitor) {
  const tiles = mergeTileDefinitions(map);

  for (const [layerName, layer] of Object.entries(map.layers ?? {})) {
    if (!Array.isArray(layer)) continue;

    for (let row = 0; row < layer.length; row += 1) {
      if (!Array.isArray(layer[row])) continue;

      for (let col = 0; col < layer[row].length; col += 1) {
        const tileId = layer[row][col];
        if (tileId === EMPTY_TILE_ID) continue;

        const tile = tiles[tileId];
        if (!tile) continue;

        visitor({ tile, tileId, layerName, col, row });
      }
    }
  }
}

export function aggregateLinks(rawLinks) {
  const aggregates = new Map();

  for (const link of rawLinks) {
    const key = [link.sourceMapId, link.targetMapId, link.kind].join("\u0000");
    let aggregate = aggregates.get(key);

    if (!aggregate) {
      aggregate = {
        sourceMapId: link.sourceMapId,
        targetMapId: link.targetMapId,
        kind: link.kind,
        count: 0,
        origins: [],
        conditional: false,
      };
      aggregates.set(key, aggregate);
    }

    aggregate.count += 1;
    aggregate.origins.push(link.origin);
    aggregate.conditional ||= Boolean(link.conditional);
  }

  return [...aggregates.values()];
}

function collectRawLinks(maps) {
  const rawLinks = [];

  for (const map of maps) {
    for (const [exitIndex, exit] of (map.exits ?? []).entries()) {
      const destinations =
        exit?.destination?.type === "random"
          ? (exit.destination.choices ?? [])
          : [exit];

      for (const [choiceIndex, destination] of destinations.entries()) {
        if (typeof destination?.targetMapId !== "string") continue;
        const probabilistic = exit?.destination?.type === "random";
        rawLinks.push({
          sourceMapId: map.id,
          targetMapId: destination.targetMapId,
          kind: probabilistic ? "random-exit" : "exit",
          conditional: Boolean(exit.condition),
          origin: {
            originType: probabilistic ? "random-exit" : "exit",
            exitIndex,
            choiceIndex: probabilistic ? choiceIndex : null,
            weight: probabilistic ? destination.weight : null,
            edge: exit.edge ?? null,
            range: Array.isArray(exit.range) ? [...exit.range] : null,
            targetEntryId: destination.entryId ?? null,
            targetEdge: destination.targetEdge ?? null,
            targetRange: Array.isArray(destination.targetRange)
              ? [...destination.targetRange]
              : null,
            targetPosition: destination.targetPosition
              ? { ...destination.targetPosition }
              : null,
          },
        });
      }
    }

    for (const entity of map.entities ?? []) {
      const teleports = collectInteractionTeleports(entity.interaction);

      for (const teleport of teleports) {
        rawLinks.push({
          sourceMapId: map.id,
          targetMapId: teleport.targetMapId,
          kind: teleport.probabilistic ? "random-teleport" : "teleport",
          conditional: Boolean(entity.condition) || teleport.conditional,
          origin: {
            originType: "entity",
            originId: entity.id ?? null,
            col: entity.col ?? null,
            row: entity.row ?? null,
            entryId: teleport.entryId,
          },
        });
      }
    }

    visitPlacedTiles(map, ({ tile, tileId, layerName, col, row }) => {
      const teleports = collectInteractionTeleports(tile.interaction);

      for (const teleport of teleports) {
        rawLinks.push({
          sourceMapId: map.id,
          targetMapId: teleport.targetMapId,
          kind: teleport.probabilistic ? "random-teleport" : "teleport",
          conditional: Boolean(tile.condition) || teleport.conditional,
          origin: {
            originType: "tile",
            tileId,
            layerName,
            col,
            row,
            entryId: teleport.entryId,
          },
        });
      }
    });

    for (const [eventType, effects] of [
      ["onEnter", map.onEnter],
      ["onExit", map.onExit],
    ]) {
      for (const teleport of collectEffectTeleports(effects)) {
        rawLinks.push({
          sourceMapId: map.id,
          targetMapId: teleport.targetMapId,
          kind: teleport.probabilistic ? "random-teleport" : "teleport",
          conditional: teleport.conditional,
          origin: {
            originType: eventType,
            entryId: teleport.entryId,
          },
        });
      }
    }

    for (const [triggerIndex, trigger] of (map.triggers ?? []).entries()) {
      for (const teleport of collectEffectTeleports(trigger?.effects)) {
        rawLinks.push({
          sourceMapId: map.id,
          targetMapId: teleport.targetMapId,
          kind: teleport.probabilistic ? "random-teleport" : "teleport",
          conditional: Boolean(trigger?.condition) || teleport.conditional,
          origin: {
            originType: "trigger",
            triggerIndex,
            triggerId: trigger?.id ?? null,
            entryId: teleport.entryId,
          },
        });
      }
    }

    for (const [eventIndex, event] of (map.musicEvents ?? []).entries()) {
      for (const teleport of collectEffectTeleports(event?.effects)) {
        rawLinks.push({
          sourceMapId: map.id,
          targetMapId: teleport.targetMapId,
          kind: teleport.probabilistic ? "random-teleport" : "teleport",
          conditional: Boolean(event?.condition) || teleport.conditional,
          origin: {
            originType: "music-event",
            eventIndex,
            eventId: event?.id ?? null,
            entryId: teleport.entryId,
          },
        });
      }
    }
  }

  return rawLinks;
}

function formatExitRangeLabel(origins, count) {
  const labels = origins
    .filter(
      (origin) =>
        origin.edge &&
        Array.isArray(origin.range) &&
        origin.targetEdge &&
        Array.isArray(origin.targetRange),
    )
    .map(
      (origin) =>
        `${origin.edge} ${origin.range[0]}–${origin.range[1]} → ` +
        `${origin.targetEdge} ${origin.targetRange[0]}–${origin.targetRange[1]}`,
    );

  const uniqueLabels = [...new Set(labels)];
  if (uniqueLabels.length === 1) return uniqueLabels[0];
  if (uniqueLabels.length > 1)
    return `${uniqueLabels.slice(0, 2).join("\n")}${uniqueLabels.length > 2 ? `\n+${uniqueLabels.length - 2} more` : ""}`;
  return count > 1 ? `×${count}` : "";
}

export function buildMapGraphElements(maps) {
  const nodes = [];
  const edges = [];
  const mapIds = new Set(maps.map((map) => map.id));
  const groupIds = new Map();

  for (const map of maps) {
    const authoredGroup =
      typeof map.editorGroup === "string" ? map.editorGroup.trim() : "";

    if (authoredGroup && !groupIds.has(authoredGroup)) {
      const id = groupNodeId(authoredGroup);
      groupIds.set(authoredGroup, id);
      nodes.push({
        data: {
          id,
          label: authoredGroup,
          groupName: authoredGroup,
        },
        classes: "map-group",
      });
    }
  }

  for (const map of maps) {
    const { width, height } = getMapSize(map);
    const authoredGroup =
      typeof map.editorGroup === "string" ? map.editorGroup.trim() : "";
    const data = {
      id: mapNodeId(map.id),
      mapId: map.id,
      label: `${map.id}\n${width} × ${height}`,
      width,
      height,
    };

    if (authoredGroup) data.parent = groupIds.get(authoredGroup);

    nodes.push({
      data,
      classes: "map-node",
    });
  }

  const links = aggregateLinks(collectRawLinks(maps));
  const missingTargets = new Set();

  for (const link of links) {
    if (!mapIds.has(link.targetMapId)) {
      missingTargets.add(link.targetMapId);
    }

    const classes = ["graph-link", `${link.kind}-link`];
    if (link.conditional) classes.push("conditional-link");

    edges.push({
      data: {
        id: edgeId(link.kind, link.sourceMapId, link.targetMapId),
        source: mapNodeId(link.sourceMapId),
        target: mapIds.has(link.targetMapId)
          ? mapNodeId(link.targetMapId)
          : missingNodeId(link.targetMapId),
        sourceMapId: link.sourceMapId,
        targetMapId: link.targetMapId,
        kind: link.kind,
        count: link.count,
        countLabel:
          link.kind === "exit" || link.kind === "random-exit"
            ? formatExitRangeLabel(link.origins, link.count)
            : link.count > 1
              ? `×${link.count}`
              : "",
        conditional: link.conditional,
        origins: link.origins,
      },
      classes: classes.join(" "),
    });
  }

  for (const targetMapId of [...missingTargets].sort()) {
    nodes.push({
      data: {
        id: missingNodeId(targetMapId),
        label: `Missing:\n${targetMapId}`,
        missingTargetId: targetMapId,
      },
      classes: "missing-map",
    });
  }

  return { nodes, edges };
}

function readGraphColour(name, fallback) {
  if (
    typeof getComputedStyle !== "function" ||
    typeof document === "undefined"
  ) {
    return fallback;
  }

  return (
    getComputedStyle(document.documentElement).getPropertyValue(name).trim() ||
    fallback
  );
}

export function createMapGraphStyles() {
  const colours = {
    mapBackground: readGraphColour("--graph-map-background", "#252c39"),
    mapBorder: readGraphColour("--graph-map-border", "#789ac0"),
    mapSelected: readGraphColour("--graph-map-selected", "#f0c36b"),
    groupBackground: readGraphColour("--graph-group-background", "#36536d"),
    groupBorder: readGraphColour("--graph-group-border", "#678cad"),
    text: readGraphColour("--graph-text", "#f1f1f4"),
    exit: readGraphColour("--graph-exit", "#79aee3"),
    teleport: readGraphColour("--graph-teleport", "#c68ad8"),
    random: readGraphColour("--graph-random", "#e0a85d"),
    missingBackground: readGraphColour("--graph-missing-background", "#4d2d35"),
    missingBorder: readGraphColour("--graph-missing-border", "#e1828e"),
    edgeLabelBackground: readGraphColour(
      "--graph-edge-label-background",
      "#151821",
    ),
  };

  return [
    {
      selector: "node.map-node",
      style: {
        shape: "round-rectangle",
        width: 160,
        height: 70,
        label: "data(label)",
        "text-wrap": "wrap",
        "text-max-width": 145,
        "text-valign": "center",
        "text-halign": "center",
        color: colours.text,
        "font-size": 14,
        "background-color": colours.mapBackground,
        "border-color": colours.mapBorder,
        "border-width": 2,
      },
    },
    {
      selector: "node.selected-map",
      style: {
        "border-color": colours.mapSelected,
        "border-width": 5,
      },
    },
    {
      selector: "node.map-group",
      style: {
        shape: "round-rectangle",
        label: "data(label)",
        "text-valign": "top",
        "text-halign": "center",
        color: colours.text,
        "font-size": 16,
        "font-weight": 600,
        padding: 35,
        "background-color": colours.groupBackground,
        "background-opacity": 0.12,
        "border-color": colours.groupBorder,
        "border-width": 2,
        "border-style": "dashed",
      },
    },
    {
      selector: "node.missing-map",
      style: {
        shape: "round-rectangle",
        width: 160,
        height: 62,
        label: "data(label)",
        "text-wrap": "wrap",
        "text-valign": "center",
        "text-halign": "center",
        color: colours.text,
        "font-size": 13,
        "background-color": colours.missingBackground,
        "border-color": colours.missingBorder,
        "border-width": 3,
        "border-style": "dashed",
      },
    },
    {
      selector: "edge.graph-link",
      style: {
        "curve-style": "bezier",
        width: 3,
        "target-arrow-shape": "triangle",
        "arrow-scale": 1.15,
        label: "data(countLabel)",
        color: colours.text,
        "font-size": 12,
        "text-background-color": colours.edgeLabelBackground,
        "text-background-opacity": 0.9,
        "text-background-padding": 3,
        "text-rotation": "autorotate",
      },
    },
    {
      selector: "edge.exit-link",
      style: {
        "line-style": "solid",
        "line-color": colours.exit,
        "target-arrow-color": colours.exit,
      },
    },
    {
      selector: "edge.teleport-link",
      style: {
        "line-style": "dashed",
        "line-color": colours.teleport,
        "target-arrow-color": colours.teleport,
      },
    },
    {
      selector: "edge.random-teleport-link, edge.random-exit-link",
      style: {
        "line-style": "dotted",
        "line-color": colours.random,
        "target-arrow-color": colours.random,
      },
    },
    {
      selector: "edge.conditional-link",
      style: {
        opacity: 0.55,
      },
    },
  ];
}

const DEFAULT_LAYOUT_OPTIONS = {
  name: "cose",
  animate: false,
  fit: true,
  padding: 60,
  componentSpacing: 100,
  nodeRepulsion: 10000,
  idealEdgeLength: 180,
  edgeElasticity: 80,
  gravity: 0.25,
  nestingFactor: 1.2,
  numIter: 1200,
};

export class EditorMapGraph {
  constructor(root, { onSelectMap, onStatus } = {}) {
    this.root = root;
    this.onSelectMap = onSelectMap ?? (() => {});
    this.onStatus = onStatus ?? (() => {});
    this.cy = null;
    this.positionCache = new Map();
  }

  capturePositions() {
    if (!this.cy) return;

    for (const node of this.cy.nodes(".map-node")) {
      this.positionCache.set(node.data("mapId"), { ...node.position() });
    }
  }

  invalidatePositions() {
    this.positionCache.clear();
  }

  createElementList(graph, selectedMapId) {
    const cachedPositions = [...this.positionCache.values()];
    const centre = cachedPositions.length
      ? cachedPositions.reduce(
          (result, position) => ({
            x: result.x + position.x / cachedPositions.length,
            y: result.y + position.y / cachedPositions.length,
          }),
          { x: 0, y: 0 },
        )
      : { x: 0, y: 0 };
    let uncachedIndex = 0;

    const nodes = graph.nodes.map((node) => {
      if (!node.classes.includes("map-node")) return node;

      const isSelected = node.data.mapId === selectedMapId;
      const cached = this.positionCache.get(node.data.mapId);
      const position =
        cached ??
        (this.positionCache.size > 0
          ? {
              x: centre.x + ((uncachedIndex % 4) - 1.5) * 90,
              y: centre.y + Math.floor(uncachedIndex / 4) * 100,
            }
          : undefined);
      uncachedIndex += cached ? 0 : 1;

      return {
        ...node,
        classes: `${node.classes}${isSelected ? " selected-map" : ""}`,
        ...(position ? { position } : {}),
      };
    });

    return [...nodes, ...graph.edges];
  }

  render(maps, { selectedMapId, randomize = false } = {}) {
    this.capturePositions();
    this.cy?.destroy();

    const graph = buildMapGraphElements(maps);
    const hasCachedPositions = this.positionCache.size > 0;
    const elements = this.createElementList(graph, selectedMapId);

    this.cy = cytoscape({
      ...(this.root ? { container: this.root } : { headless: true }),
      styleEnabled: true,
      elements,
      layout: { name: "preset", fit: false },
      style: createMapGraphStyles(),
      boxSelectionEnabled: false,
      autoungrabify: true,
      userPanningEnabled: true,
      userZoomingEnabled: true,
      minZoom: 0.2,
      maxZoom: 3,
      ...(this.root ? { wheelSensitivity: 0.2 } : {}),
    });

    this.cy.on("tap", "node.map-node", (event) => {
      this.onSelectMap(event.target.data("mapId"));
    });
    this.cy.on("tap", "node.missing-map", (event) => {
      const mapId = event.target.data("missingTargetId");
      this.onStatus(`Map "${mapId}" does not exist.`, true);
    });

    if (randomize || !hasCachedPositions) {
      this.runLayout({ randomize: true, fit: true });
    } else {
      this.cy.layout({ name: "preset", fit: true, padding: 60 }).run();
      this.capturePositions();
    }
  }

  runLayout({ randomize, fit }) {
    if (!this.cy) return;

    const layout = this.cy.layout({
      ...DEFAULT_LAYOUT_OPTIONS,
      randomize,
      fit,
      nodeRepulsion: () => DEFAULT_LAYOUT_OPTIONS.nodeRepulsion,
      idealEdgeLength: () => DEFAULT_LAYOUT_OPTIONS.idealEdgeLength,
      edgeElasticity: () => DEFAULT_LAYOUT_OPTIONS.edgeElasticity,
    });

    this.cy.one("layoutstop", () => this.capturePositions());
    layout.run();
  }

  fit() {
    this.cy?.fit(this.cy.elements(), 60);
  }

  relayout() {
    this.runLayout({ randomize: true, fit: true });
  }

  resize() {
    this.cy?.resize();
  }

  destroy() {
    this.capturePositions();
    this.cy?.destroy();
    this.cy = null;
  }
}
