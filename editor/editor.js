//TODO: entities should be displayed graphically, like tiles, not a dropdown. reuse system?

import { findPrimaryShowTextEffect } from "../interactions.js";
import { ITEMS } from "../items.js";
import { MAPS } from "../maps.js";
import { SPRITES } from "../sprites.js";
import { EMPTY_TILE_ID, TILE_IDS, TILE_SIZE, TILES } from "../tiles.js";
import { ENTITY_PRESETS, SPRITE_EDITOR_META, TILE_EDITOR_META } from "./editor-catalog.js";
import {
    EDITOR_BACKUP_KEY,
    EDITOR_STORAGE_KEY,
    PLAYTEST_RESULT_KEY,
    PLAYTEST_STORAGE_KEY,
    canPlaceTile,
    cloneData,
    createMap,
    createMapIdRefactorCandidate,
    createReciprocalEdgeConnection,
    fillRectangle,
    findMapIdReferences,
    findReciprocalEdgeExit,
    floodFill,
    getEdgeAxisLength,
    getMapSize,
    ensureLayer,
    makeUniqueId,
    mergeTileDefinitions,
    OPPOSITE_EDGE,
    parseImportedMaps,
    renameEntity,
    renameEntry,
    resizeMap,
    serializeGeneratedMaps,
    updateReciprocalEdgeExitGeometry,
    setTile,
    validateEditorDocument,
} from "./editor-model.js";
import { EditorRenderer } from "./editor-renderer.js";
import { EditorMapGraph } from "./editor-map-graph.js";

const byId = (id) => document.getElementById(id);
export const ZOOM_LEVELS = [0.5, 0.75, 1, 1.5, 2, 3, 4];

const EXTERNAL_MAP_REFERENCE_REGISTRIES = {
    ITEMS,
    TILES,
    SPRITES,
    ENTITY_PRESETS,
};

export function findExternalMapIdReferences(mapId) {
    return Object.entries(EXTERNAL_MAP_REFERENCE_REGISTRIES).flatMap(([name, registry]) =>
        findMapIdReferences(registry, mapId, name),
    );
}

const directionVectors = {
    up: { dc: 0, dr: -1 },
    down: { dc: 0, dr: 1 },
    left: { dc: -1, dr: 0 },
    right: { dc: 1, dr: 0 },
};

function facingName(facing) {
    if (facing.dr < 0) return "up";
    if (facing.dr > 0) return "down";
    if (facing.dc < 0) return "left";
    return "right";
}

export function parseDialoguePages(text) {
    const trimmed = text.trim();
    if (!trimmed) return [];

    return trimmed.split(/\r?\n[ \t]*\r?\n/).map((page) => page.trim());
}

export function formatDialoguePages(pages) {
    return Array.isArray(pages) ? pages.join("\n\n") : "";
}

function downloadText(filename, text, type) {
    const url = URL.createObjectURL(new Blob([text], { type }));
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
}

function renderEmptyPreview(ctx) {
    const { width, height } = ctx.canvas;
    const cellSize = 8;

    ctx.clearRect(0, 0, width, height);

    for (let row = 0; row < Math.ceil(height / cellSize); row += 1) {
        for (let col = 0; col < Math.ceil(width / cellSize); col += 1) {
            ctx.fillStyle = (row + col) % 2 === 0 ? "#20232b" : "#2c303a";
            ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);
        }
    }

    ctx.strokeStyle = "#8c929f";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(8, 8);
    ctx.lineTo(width - 8, height - 8);
    ctx.moveTo(width - 8, 8);
    ctx.lineTo(8, height - 8);
    ctx.stroke();
}

export class MapEditor {
    constructor() {
        this.maps = cloneData(MAPS);
        this.selectedMapId = this.maps[0]?.id ?? null;
        this.mode = "tiles";
        this.tool = "pencil";
        this.activeLayer = "obstacles";
        this.selectedTileId = TILE_IDS.WALL;
        this.selectedEntityPreset = "blank";
        this.visibleLayers = new Set(["base", "obstacles", "foreground"]);
        this.showGrid = true;
        this.showCollision = false;
        this.showFootprints = false;
        this.selectedEntityId = null;
        this.selectedEntryId = null;
        this.selectedExitIndex = null;
        this.rectanglePreview = null;
        this.pointerAction = null;
        this.undoStack = [];
        this.redoStack = [];
        this.transactionBefore = null;
        this.dirty = false;
        this.palettePreviews = [];
        this.exitJsonDirty = false;
        this.zoom = 1;
        this.renderer = new EditorRenderer(byId("editor-canvas"));
        this.canvas = byId("editor-canvas");
        this.canvasStage = byId("canvas-stage");
        this.canvasScroll = byId("canvas-scroll");
        this.mapGraph = new EditorMapGraph(byId("map-graph-root"), {
            onSelectMap: (mapId) => this.openMapFromGraph(mapId),
            onStatus: (message, error = false) => this.setStatus(message, error),
        });
    }

    get currentMap() {
        return this.maps.find((map) => map.id === this.selectedMapId) ?? this.maps[0];
    }

    async start() {
        this.populateStaticSelects();
        this.bindEvents();
        await this.refreshDocumentUI();
        this.updateRecoveryButton();
        requestAnimationFrame((time) => this.animationLoop(time));
    }

    populateStaticSelects() {
        const presetSelect = byId("entity-preset");
        for (const [presetId, preset] of Object.entries(ENTITY_PRESETS)) {
            presetSelect.add(new Option(preset.label, presetId));
        }
        presetSelect.value = this.selectedEntityPreset;

        const spriteSelect = byId("entity-sprite");
        for (const [spriteId, sprite] of Object.entries(SPRITES)) {
            const meta = SPRITE_EDITOR_META[spriteId];
            spriteSelect.add(new Option(meta?.label ?? spriteId, spriteId));
        }
    }

    bindEvents() {
        byId("undo").addEventListener("click", () => this.undo());
        byId("redo").addEventListener("click", () => this.redo());
        byId("save-recovery").addEventListener("click", () => this.saveRecovery(true));
        byId("restore-recovery").addEventListener("click", () => this.restoreRecovery());
        byId("restore-backup").addEventListener("click", () => this.restorePreImportBackup());
        byId("export-js").addEventListener("click", () => {
            downloadText("maps.generated.js", serializeGeneratedMaps(this.maps), "text/javascript");
            this.markExported();
        });
        byId("export-json").addEventListener("click", () => {
            downloadText(
                "maps.json",
                `${JSON.stringify(this.maps, null, 4)}\n`,
                "application/json",
            );
            this.markExported();
        });
        byId("import-file").addEventListener("change", async (event) => {
            const [file] = event.target.files;
            if (!file) return;
            try {
                await this.importText(await file.text());
            } catch (error) {
                this.setStatus(error.message, true);
            } finally {
                event.target.value = "";
            }
        });
        byId("import-text-button").addEventListener("click", async () => {
            try {
                await this.importText(byId("import-text").value);
            } catch (error) {
                this.setStatus(error.message, true);
            }
        });
        byId("playtest").addEventListener("click", () => this.playtest());
        byId("open-map-graph").addEventListener("click", () => this.showMapGraph());
        byId("map-graph-fit").addEventListener("click", () => this.mapGraph.fit());
        byId("map-graph-relayout").addEventListener("click", () => this.mapGraph.relayout());
        byId("map-graph-close").addEventListener("click", () => byId("map-graph-dialog").close());

        byId("map-select").addEventListener("change", async (event) => {
            this.selectedMapId = event.target.value;
            this.clearSelection();
            await this.refreshDocumentUI();
        });
        byId("new-map").addEventListener("click", async () => {
            const id = makeUniqueId("new-room", new Set(this.maps.map((map) => map.id)));
            this.commitMutation("Create map", () => this.maps.push(createMap(id)));
            this.selectedMapId = id;
            await this.refreshDocumentUI();
        });
        byId("duplicate-map").addEventListener("click", async () => {
            const source = this.currentMap;
            const id = makeUniqueId(`${source.id}-copy`, new Set(this.maps.map((map) => map.id)));
            const duplicate = cloneData(source);
            duplicate.id = id;
            this.commitMutation("Duplicate map", () => this.maps.push(duplicate));
            this.selectedMapId = id;
            await this.refreshDocumentUI();
        });
        byId("copy-current-map").addEventListener("click", () => this.copyCurrentMap());
        byId("delete-map").addEventListener("click", async () => {
            if (this.maps.length <= 1)
                return this.setStatus("The document must keep at least one map.", true);
            if (
                !confirm(
                    `Delete map "${this.currentMap.id}"? References will remain visible as validation errors.`,
                )
            )
                return;
            const index = this.maps.indexOf(this.currentMap);
            this.commitMutation("Delete map", () => this.maps.splice(index, 1));
            this.selectedMapId = this.maps[Math.min(index, this.maps.length - 1)].id;
            this.clearSelection();
            await this.refreshDocumentUI();
        });
        byId("map-id").addEventListener("change", async (event) => {
            const oldId = this.currentMap.id;
            const newId = event.target.value.trim();
            if (!newId || (newId !== oldId && this.maps.some((map) => map.id === newId))) {
                this.setStatus("Map IDs must be nonempty and unique.", true);
                event.target.value = oldId;
                return;
            }
            if (newId === oldId) {
                event.target.value = oldId;
                return;
            }

            const externalReferences = findExternalMapIdReferences(oldId);
            if (externalReferences.length > 0) {
                this.setStatus(
                    `This map is referenced outside generated map data: ${externalReferences.join(
                        ", ",
                    )}. Update those source definitions before renaming the map.`,
                    true,
                );
                event.target.value = oldId;
                return;
            }

            try {
                const { candidateMaps, report } = createMapIdRefactorCandidate(
                    this.maps,
                    oldId,
                    newId,
                );

                this.commitMutation("Rename map", () => {
                    this.maps = candidateMaps;
                    this.selectedMapId = newId;
                });
                this.mapGraph.invalidatePositions();
                await this.refreshDocumentUI();

                const count = report.changedReferences.length;
                this.setStatus(
                    `Renamed "${oldId}" to "${newId}" and updated ${count} map ${
                        count === 1 ? "reference" : "references"
                    }. Existing development saves using the old ID are not migrated and should be cleared.`,
                );
            } catch (error) {
                event.target.value = oldId;
                this.setStatus(error.message, true);
            }
        });
        byId("map-group").addEventListener("change", async (event) => {
            const group = event.target.value.trim();
            const map = this.currentMap;
            const previousGroup = typeof map.editorGroup === "string" ? map.editorGroup.trim() : "";
            const storedGroupIsCanonical = map.editorGroup === previousGroup;

            if (
                group === previousGroup &&
                (group ? storedGroupIsCanonical : !Object.hasOwn(map, "editorGroup"))
            ) {
                event.target.value = previousGroup;
                return;
            }

            this.commitMutation("Change map group", () => {
                if (group) {
                    map.editorGroup = group;
                } else {
                    delete map.editorGroup;
                }
            });
            await this.refreshAfterMutation();
        });
        byId("resize-map").addEventListener("click", async () => {
            const width = Number(byId("map-width").value);
            const height = Number(byId("map-height").value);
            try {
                this.commitMutation("Resize map", () => resizeMap(this.currentMap, width, height));
                await this.refreshDocumentUI();
            } catch (error) {
                this.setStatus(error.message, true);
            }
        });
        byId("initial-entry").addEventListener("change", (event) => {
            this.commitMutation("Change initial entry", () => {
                this.currentMap.initialEntryId = event.target.value;
            });
            this.refreshAfterMutation();
        });

        byId("mode-buttons").addEventListener("click", (event) => {
            const button = event.target.closest("button[data-mode]");
            if (!button) return;
            this.mode = button.dataset.mode;
            this.updateModeUI();
            this.renderInspectors();
        });
        byId("tool-buttons").addEventListener("click", (event) => {
            const button = event.target.closest("button[data-tool]");
            if (!button) return;
            this.tool = button.dataset.tool;
            this.updateButtonSelection("#tool-buttons button", "tool", this.tool);
        });
        byId("active-layer").addEventListener("change", (event) => {
            this.activeLayer = event.target.value;
            this.renderPalette();
        });
        byId("clear-layer").addEventListener("click", () => {
            const layerName = this.activeLayer;
            const warning =
                layerName === "base"
                    ? "Clearing the base layer will make the map unplayable until floor tiles are added. Clear every cell in the base layer?"
                    : `Clear every cell in the ${layerName} layer?`;

            if (!confirm(warning)) return;

            this.commitMutation("Clear layer", () => {
                const layer = ensureLayer(this.currentMap, layerName);

                for (const row of layer) {
                    row.fill(EMPTY_TILE_ID);
                }
            });

            this.refreshAfterMutation();
        });
        document.querySelectorAll("[data-layer-visible]").forEach((input) => {
            input.addEventListener("change", () => {
                if (input.checked) this.visibleLayers.add(input.dataset.layerVisible);
                else this.visibleLayers.delete(input.dataset.layerVisible);
            });
        });
        byId("show-grid").addEventListener(
            "change",
            (event) => (this.showGrid = event.target.checked),
        );
        byId("show-collision").addEventListener(
            "change",
            (event) => (this.showCollision = event.target.checked),
        );
        byId("show-footprints").addEventListener(
            "change",
            (event) => (this.showFootprints = event.target.checked),
        );
        byId("zoom-out").addEventListener("click", () => this.changeZoom(-1));
        byId("zoom-reset").addEventListener("click", () => this.setZoom(1));
        byId("zoom-in").addEventListener("click", () => this.changeZoom(1));
        this.canvasScroll.addEventListener("wheel", (event) => this.onCanvasWheel(event), {
            passive: false,
        });
        byId("entity-preset").addEventListener(
            "change",
            (event) => (this.selectedEntityPreset = event.target.value),
        );
        byId("add-exit").addEventListener("click", () => this.addExit());
        byId("connection-source-edge").addEventListener("change", () =>
            this.renderConnectionControls(),
        );
        byId("connection-target-map").addEventListener("change", () =>
            this.renderConnectionControls(),
        );
        for (const id of [
            "connection-source-range-start",
            "connection-source-range-end",
            "connection-target-range-start",
        ]) {
            byId(id).addEventListener("input", () => this.renderConnectionControls());
        }
        byId("create-reciprocal-connection").addEventListener("click", () =>
            this.createReciprocalConnection(),
        );

        this.canvas.addEventListener("pointerdown", (event) => this.onPointerDown(event));
        this.canvas.addEventListener("pointermove", (event) => this.onPointerMove(event));
        this.canvas.addEventListener("pointerup", (event) => this.onPointerUp(event));
        this.canvas.addEventListener("pointercancel", (event) => this.onPointerUp(event));
        this.canvas.addEventListener("pointerleave", () => {
            if (this.pointerAction?.kind === "brush") {
                this.pointerAction.lastKey = null;
            }
            byId("cursor-position").textContent = "Cell: —";
        });
        this.canvas.addEventListener("contextmenu", (event) => event.preventDefault());

        byId("entity-interaction").addEventListener("input", () =>
            this.syncSimpleDialogueFromInteractionJson(),
        );
        byId("entity-dialogue-speaker").addEventListener("input", () =>
            this.syncInteractionJsonFromSimpleDialogue(),
        );
        byId("entity-dialogue-pages").addEventListener("input", () =>
            this.syncInteractionJsonFromSimpleDialogue(),
        );
        byId("apply-entity").addEventListener("click", () => this.applyEntityInspector());
        byId("delete-entity").addEventListener("click", () => this.deleteSelectedEntity());
        byId("apply-entry").addEventListener("click", () => this.applyEntryInspector());
        byId("delete-entry").addEventListener("click", () => this.deleteSelectedEntry());
        byId("apply-exit").addEventListener("click", () => this.applyExitInspector());
        byId("delete-exit").addEventListener("click", () => this.deleteSelectedExit());
        byId("exit-target-map").addEventListener("change", () => this.populateExitEntryOptions());
        byId("exit-json").addEventListener("input", () => (this.exitJsonDirty = true));

        window.addEventListener("storage", (event) => {
            if (event.key !== PLAYTEST_RESULT_KEY || !event.newValue) return;
            try {
                this.displayPlaytestResult(JSON.parse(event.newValue));
            } catch (error) {
                this.displayPlaytestResult({ ok: false, message: error.message });
            }
        });

        window.addEventListener("beforeunload", (event) => {
            if (!this.dirty) return;
            event.preventDefault();
            event.returnValue = "";
        });
        document.addEventListener("keydown", (event) => {
            const modifier = event.ctrlKey || event.metaKey;
            if (modifier && event.key.toLowerCase() === "z") {
                event.preventDefault();
                event.shiftKey ? this.redo() : this.undo();
            } else if (modifier && event.key.toLowerCase() === "y") {
                event.preventDefault();
                this.redo();
            } else if (event.key === "Delete" && !event.target.matches("input, textarea, select")) {
                if (this.selectedEntityId) this.deleteSelectedEntity();
                else if (this.selectedEntryId) this.deleteSelectedEntry();
                else if (this.selectedExitIndex !== null) this.deleteSelectedExit();
            }
        });
    }

    snapshot() {
        return { maps: cloneData(this.maps), selectedMapId: this.selectedMapId };
    }

    restoreSnapshot(snapshot) {
        this.maps = cloneData(snapshot.maps);
        this.selectedMapId = this.maps.some((map) => map.id === snapshot.selectedMapId)
            ? snapshot.selectedMapId
            : this.maps[0].id;
        this.mapGraph.invalidatePositions();
        this.clearSelection();
    }

    beginTransaction() {
        if (!this.transactionBefore) this.transactionBefore = this.snapshot();
    }

    endTransaction(label) {
        if (!this.transactionBefore) return;
        const before = this.transactionBefore;
        this.transactionBefore = null;
        if (JSON.stringify(before.maps) === JSON.stringify(this.maps)) return;
        this.undoStack.push(before);
        if (this.undoStack.length > 100) this.undoStack.shift();
        this.redoStack = [];
        this.afterMutation(label);
    }

    commitMutation(label, mutator) {
        const before = this.snapshot();
        mutator();
        if (JSON.stringify(before.maps) === JSON.stringify(this.maps)) return false;
        this.undoStack.push(before);
        if (this.undoStack.length > 100) this.undoStack.shift();
        this.redoStack = [];
        this.afterMutation(label);
        return true;
    }

    afterMutation(label) {
        this.dirty = true;
        this.saveRecovery(false);
        this.setStatus(`${label}. Unsaved editor changes.`);
        this.updateUndoButtons();
        this.validateAndDisplay();
    }

    async undo() {
        const snapshot = this.undoStack.pop();
        if (!snapshot) return;
        this.redoStack.push(this.snapshot());
        this.restoreSnapshot(snapshot);
        this.dirty = true;
        this.saveRecovery(false);
        await this.refreshDocumentUI();
        this.setStatus("Undid the last action.");
    }

    async redo() {
        const snapshot = this.redoStack.pop();
        if (!snapshot) return;
        this.undoStack.push(this.snapshot());
        this.restoreSnapshot(snapshot);
        this.dirty = true;
        this.saveRecovery(false);
        await this.refreshDocumentUI();
        this.setStatus("Redid the last action.");
    }

    updateUndoButtons() {
        byId("undo").disabled = this.undoStack.length === 0;
        byId("redo").disabled = this.redoStack.length === 0;
    }

    async refreshDocumentUI() {
        if (!this.currentMap) return;
        await this.renderer
            .loadDefinitions(this.currentMap)
            .catch((error) => this.setStatus(error.message, true));
        this.renderMapControls();
        this.renderPalette();
        this.renderExitList();
        this.updateModeUI();
        this.renderInspectors();
        this.validateAndDisplay();
        this.updateUndoButtons();
        this.refreshOpenMapGraph();
    }

    async refreshAfterMutation() {
        await this.renderer
            .loadDefinitions(this.currentMap)
            .catch((error) => this.setStatus(error.message, true));
        this.renderMapControls();
        this.renderPalette();
        this.renderExitList();
        this.renderInspectors();
        this.validateAndDisplay();
    }

    renderMapControls() {
        const mapSelect = byId("map-select");
        const groupedMaps = new Map();

        for (const map of this.maps) {
            const authoredGroup = typeof map.editorGroup === "string" ? map.editorGroup.trim() : "";
            const groupName = authoredGroup || "Ungrouped";

            if (!groupedMaps.has(groupName)) {
                groupedMaps.set(groupName, []);
            }
            groupedMaps.get(groupName).push(map);
        }

        const groupNames = [...groupedMaps.keys()].sort((first, second) => {
            if (first === second) return 0;
            if (first === "Ungrouped") return 1;
            if (second === "Ungrouped") return -1;
            return first.localeCompare(second);
        });

        const optionGroups = groupNames.map((groupName) => {
            const optionGroup = document.createElement("optgroup");
            optionGroup.label = groupName;
            optionGroup.append(
                ...groupedMaps.get(groupName).map((map) => new Option(map.id, map.id)),
            );
            return optionGroup;
        });

        mapSelect.replaceChildren(...optionGroups);
        mapSelect.value = this.currentMap.id;
        byId("map-id").value = this.currentMap.id;
        byId("map-group").value =
            typeof this.currentMap.editorGroup === "string"
                ? this.currentMap.editorGroup.trim()
                : "";
        const { width, height } = getMapSize(this.currentMap);
        byId("map-width").value = width;
        byId("map-height").value = height;

        const initialSelect = byId("initial-entry");
        initialSelect.replaceChildren(
            ...Object.keys(this.currentMap.entries).map((entryId) => new Option(entryId, entryId)),
        );
        initialSelect.value = this.currentMap.initialEntryId ?? "";
        this.renderConnectionControls();
    }

    updateModeUI() {
        this.updateButtonSelection("#mode-buttons button", "mode", this.mode);
        byId("tile-tools-section").hidden = this.mode !== "tiles";
        byId("palette-section").hidden = this.mode !== "tiles";
        byId("entity-tools-section").hidden = this.mode !== "entities";
        byId("entry-tools-section").hidden = this.mode !== "entries";
        byId("exit-tools-section").hidden = this.mode !== "exits";
    }

    updateButtonSelection(selector, datasetKey, value) {
        document.querySelectorAll(selector).forEach((button) => {
            button.classList.toggle("selected", button.dataset[datasetKey] === value);
        });
    }

    renderPalette() {
        const root = byId("tile-palette");
        root.replaceChildren();
        this.palettePreviews = [];
        const merged = mergeTileDefinitions(this.currentMap);
        const localIds = new Set(Object.keys(this.currentMap.tiles ?? {}).map(String));
        const categories = new Map([
            [
                "Utility",
                [
                    {
                        tileId: EMPTY_TILE_ID,
                        tile: null,
                        label: "Empty",
                    },
                ],
            ],
        ]);

        for (const [rawId, tile] of Object.entries(merged)) {
            const tileId = Number(rawId);
            const isLocal = localIds.has(rawId);
            const meta = TILE_EDITOR_META[tileId];
            const category = isLocal ? "This map" : (meta?.category ?? "Other");
            if (!categories.has(category)) categories.set(category, []);
            categories.get(category).push({ tileId, tile, label: meta?.label ?? `Tile ${tileId}` });
        }

        for (const [category, items] of categories) {
            const section = document.createElement("div");
            section.className = "palette-category";
            const title = document.createElement("h3");
            title.textContent = category;
            const list = document.createElement("div");
            list.className = "palette-items";
            for (const item of items) {
                const button = document.createElement("button");
                button.type = "button";
                button.className = "palette-item";
                button.classList.toggle("selected", item.tileId === this.selectedTileId);
                button.title = `${item.label} (${item.tileId})`;
                if (!canPlaceTile(this.currentMap, this.activeLayer, item.tileId, 0, 0)) {
                    button.dataset.incompatible = "true";
                }
                const canvas = document.createElement("canvas");
                canvas.width = 48;
                canvas.height = 48;
                const label = document.createElement("span");
                label.textContent = item.label;
                button.append(canvas, label);
                button.addEventListener("click", () => {
                    this.selectedTileId = item.tileId;
                    this.renderPalette();
                });
                list.append(button);
                const previewContext = canvas.getContext("2d");
                if (item.tile === null) {
                    renderEmptyPreview(previewContext);
                } else {
                    this.palettePreviews.push({ ctx: previewContext, visual: item.tile });
                }
            }
            section.append(title, list);
            root.append(section);
        }
    }

    renderExitList() {
        const root = byId("exit-list");
        root.replaceChildren();
        this.currentMap.exits.forEach((exit, index) => {
            const button = document.createElement("button");
            button.type = "button";
            const targetLabel =
                exit.destination?.type === "random"
                    ? `random (${exit.destination.choices?.length ?? 0} choices)`
                    : Object.hasOwn(exit, "targetEdge")
                      ? `${exit.targetMapId} ${exit.targetEdge} ${exit.targetRange?.[0] ?? "?"}–${exit.targetRange?.[1] ?? "?"}`
                      : exit.targetMapId;
            button.textContent = `${index}: ${exit.edge} ${exit.range[0]}–${exit.range[1]} → ${targetLabel}`;
            button.classList.toggle("selected", index === this.selectedExitIndex);
            button.addEventListener("click", () => {
                this.selectedExitIndex = index;
                this.selectedEntityId = null;
                this.selectedEntryId = null;
                this.mode = "exits";
                this.updateModeUI();
                this.renderExitList();
                this.renderInspectors();
            });
            root.append(button);
        });
    }

    renderConnectionControls() {
        const sourceMap = this.currentMap;
        if (!sourceMap) return;

        const sourceMapInput = byId("connection-source-map");
        const sourceChanged = sourceMapInput.value !== sourceMap.id;
        sourceMapInput.value = sourceMap.id;

        const sourceEdgeSelect = byId("connection-source-edge");
        const sourceEdge = Object.hasOwn(OPPOSITE_EDGE, sourceEdgeSelect.value)
            ? sourceEdgeSelect.value
            : "north";
        sourceEdgeSelect.value = sourceEdge;

        const targetMapSelect = byId("connection-target-map");
        const previousTargetId = targetMapSelect.value;
        const targetMaps = this.maps.filter((map) => map.id !== sourceMap.id);
        targetMapSelect.replaceChildren(...targetMaps.map((map) => new Option(map.id, map.id)));

        if (targetMaps.some((map) => map.id === previousTargetId)) {
            targetMapSelect.value = previousTargetId;
        } else if (targetMaps.length > 0) {
            targetMapSelect.value = targetMaps[0].id;
        }

        const targetEdge = OPPOSITE_EDGE[sourceEdge];
        byId("connection-target-edge").value = targetEdge;

        const targetMap = targetMaps.find((map) => map.id === targetMapSelect.value) ?? null;
        const sourceLimit = getEdgeAxisLength(sourceMap, sourceEdge);
        const targetLimit = targetMap ? getEdgeAxisLength(targetMap, targetEdge) : 0;
        const disabled = !targetMap || sourceLimit <= 0 || targetLimit <= 0;

        const sourceStartInput = byId("connection-source-range-start");
        const sourceEndInput = byId("connection-source-range-end");
        const targetStartInput = byId("connection-target-range-start");
        const targetEndInput = byId("connection-target-range-end");
        const button = byId("create-reciprocal-connection");

        for (const input of [sourceStartInput, sourceEndInput, targetStartInput]) {
            input.disabled = disabled;
        }
        targetEndInput.disabled = disabled;
        button.disabled = disabled;
        targetMapSelect.disabled = targetMaps.length === 0;

        sourceStartInput.max = String(Math.max(0, sourceLimit - 1));

        let sourceStart = Number(sourceStartInput.value);
        if (sourceChanged || !Number.isInteger(sourceStart) || sourceStart < 0) sourceStart = 0;
        sourceStart = Math.min(sourceStart, Math.max(0, sourceLimit - 1));

        const maximumSourceEnd = Math.min(
            Math.max(sourceStart, sourceLimit - 1),
            sourceStart + Math.max(0, targetLimit - 1),
        );
        sourceEndInput.max = String(maximumSourceEnd);

        let sourceEnd = Number(sourceEndInput.value);
        if (sourceChanged || !Number.isInteger(sourceEnd) || sourceEnd < sourceStart) {
            sourceEnd = sourceStart;
        }
        sourceEnd = Math.min(sourceEnd, maximumSourceEnd);

        const sourceLengthDelta = sourceEnd - sourceStart;
        const maximumTargetStart = Math.max(0, targetLimit - sourceLengthDelta - 1);
        targetStartInput.max = String(maximumTargetStart);

        let targetStart = Number(targetStartInput.value);
        if (sourceChanged || !Number.isInteger(targetStart) || targetStart < 0) targetStart = 0;
        targetStart = Math.min(targetStart, maximumTargetStart);
        const targetEnd = targetStart + sourceLengthDelta;

        sourceStartInput.value = String(sourceStart);
        sourceEndInput.value = String(sourceEnd);
        targetStartInput.value = String(targetStart);
        targetEndInput.value = String(targetEnd);

        byId("connection-preview").textContent = targetMap
            ? `${sourceMap.id} ${sourceEdge} ${sourceStart}–${sourceEnd}\n        ↓\n${targetMap.id} ${targetEdge} ${targetStart}–${targetEnd}`
            : "Choose a target map.";
    }

    async createReciprocalConnection() {
        try {
            const sourceMap = this.currentMap;
            const targetMapId = byId("connection-target-map").value;
            const targetMap = this.maps.find((map) => map.id === targetMapId);
            if (!targetMap) throw new Error("Choose a target map.");

            const sourceEdge = byId("connection-source-edge").value;
            const targetEdge = byId("connection-target-edge").value;
            const sourceRange = [
                Number(byId("connection-source-range-start").value),
                Number(byId("connection-source-range-end").value),
            ];
            const targetRange = [
                Number(byId("connection-target-range-start").value),
                Number(byId("connection-target-range-end").value),
            ];
            const { sourceExit, targetExit } = createReciprocalEdgeConnection(
                sourceMap,
                targetMap,
                sourceEdge,
                targetEdge,
                sourceRange,
                targetRange,
            );
            const sourceExitIndex = sourceMap.exits.length;

            this.commitMutation("Create reciprocal connection", () => {
                sourceMap.exits.push(sourceExit);
                targetMap.exits.push(targetExit);
            });

            this.selectedExitIndex = sourceExitIndex;
            this.selectedEntityId = null;
            this.selectedEntryId = null;
            this.mode = "exits";
            await this.refreshAfterMutation();
            this.updateModeUI();
            this.setStatus(
                `Connected "${sourceMap.id}" ${sourceEdge} ${sourceRange[0]}–${sourceRange[1]} to "${targetMap.id}" ${targetEdge} ${targetRange[0]}–${targetRange[1]}. Unsaved editor changes.`,
            );
        } catch (error) {
            this.setStatus(error.message, true);
        }
    }

    onCanvasWheel(event) {
        if (!event.ctrlKey && !event.metaKey) return;

        event.preventDefault();
        const direction = event.deltaY < 0 ? 1 : -1;
        this.changeZoom(direction, event);
    }

    applyZoom() {
        const width = this.canvas.width * this.zoom;
        const height = this.canvas.height * this.zoom;
        const cssWidth = `${width}px`;
        const cssHeight = `${height}px`;

        if (this.canvas.style.width !== cssWidth) this.canvas.style.width = cssWidth;
        if (this.canvas.style.height !== cssHeight) this.canvas.style.height = cssHeight;
        if (this.canvasStage.style.width !== cssWidth) this.canvasStage.style.width = cssWidth;
        if (this.canvasStage.style.height !== cssHeight) this.canvasStage.style.height = cssHeight;

        byId("zoom-reset").textContent = `${Math.round(this.zoom * 100)}%`;
        const zoomIndex = ZOOM_LEVELS.indexOf(this.zoom);
        byId("zoom-out").disabled = zoomIndex <= 0;
        byId("zoom-in").disabled = zoomIndex >= ZOOM_LEVELS.length - 1;
    }

    getZoomAnchor(event = null) {
        if (event && Number.isFinite(event.clientX) && Number.isFinite(event.clientY)) {
            return { clientX: event.clientX, clientY: event.clientY };
        }

        const rect = this.canvasScroll.getBoundingClientRect();
        return {
            clientX: rect.left + this.canvasScroll.clientWidth / 2,
            clientY: rect.top + this.canvasScroll.clientHeight / 2,
        };
    }

    setZoom(nextZoom, event = null) {
        if (!ZOOM_LEVELS.includes(nextZoom)) {
            throw new Error(`Unsupported editor zoom level ${String(nextZoom)}.`);
        }

        const anchor = this.getZoomAnchor(event);
        const beforeRect = this.canvas.getBoundingClientRect();
        const sourceX =
            beforeRect.width > 0
                ? ((anchor.clientX - beforeRect.left) / beforeRect.width) * this.canvas.width
                : this.canvas.width / 2;
        const sourceY =
            beforeRect.height > 0
                ? ((anchor.clientY - beforeRect.top) / beforeRect.height) * this.canvas.height
                : this.canvas.height / 2;

        this.zoom = nextZoom;
        this.applyZoom();

        const afterRect = this.canvas.getBoundingClientRect();
        const scaledClientX = afterRect.left + (sourceX / this.canvas.width) * afterRect.width;
        const scaledClientY = afterRect.top + (sourceY / this.canvas.height) * afterRect.height;

        this.canvasScroll.scrollLeft += scaledClientX - anchor.clientX;
        this.canvasScroll.scrollTop += scaledClientY - anchor.clientY;
    }

    changeZoom(direction, event = null) {
        const currentIndex = ZOOM_LEVELS.indexOf(this.zoom);
        const nextIndex = Math.max(
            0,
            Math.min(ZOOM_LEVELS.length - 1, currentIndex + Math.sign(direction)),
        );
        if (nextIndex === currentIndex) return;
        this.setZoom(ZOOM_LEVELS[nextIndex], event);
    }

    animationLoop(time) {
        this.renderer.advance(time);
        this.renderer.render(this.currentMap, {
            visibleLayers: this.visibleLayers,
            activeLayer: this.activeLayer,
            showGrid: this.showGrid,
            showCollision: this.showCollision,
            showFootprints: this.showFootprints,
            selectedEntityId: this.selectedEntityId,
            selectedEntryId: this.selectedEntryId,
            selectedExitIndex: this.selectedExitIndex,
            rectanglePreview: this.rectanglePreview,
        });
        this.applyZoom();
        for (const preview of this.palettePreviews) {
            this.renderer.renderVisualPreview(
                preview.ctx,
                preview.visual,
                this.renderer.animationTimeMs,
            );
        }
        requestAnimationFrame((nextTime) => this.animationLoop(nextTime));
    }

    getCell(event) {
        const rect = this.canvas.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width) * this.canvas.width;
        const y = ((event.clientY - rect.top) / rect.height) * this.canvas.height;
        const col = Math.floor(x / TILE_SIZE);
        const row = Math.floor(y / TILE_SIZE);
        const { width, height } = getMapSize(this.currentMap);
        if (col < 0 || row < 0 || col >= width || row >= height) return null;
        return { col, row, x, y };
    }

    onPointerDown(event) {
        const cell = this.getCell(event);
        if (!cell) return;
        this.canvas.setPointerCapture(event.pointerId);
        if (this.mode === "tiles") this.startTileAction(event, cell);
        else if (this.mode === "entities") this.startEntityAction(cell);
        else if (this.mode === "entries") this.startEntryAction(cell);
        else this.selectExitAt(cell);
    }

    onPointerMove(event) {
        const cell = this.getCell(event);
        if (!cell) {
            if (this.pointerAction?.kind === "brush") {
                this.pointerAction.lastKey = null;
            }

            byId("cursor-position").textContent = "Cell: —";
            return;
        }

        byId("cursor-position").textContent = `Cell: ${cell.col}, ${cell.row}`;
        if (!this.pointerAction) return;

        if (this.pointerAction.kind === "brush") {
            this.paintCell(cell);
        } else if (this.pointerAction.kind === "rectangle") {
            this.rectanglePreview.end = { col: cell.col, row: cell.row };
        } else if (this.pointerAction.kind === "entity-drag") {
            const entity = this.currentMap.entities.find(
                (item) => item.id === this.pointerAction.entityId,
            );
            if (entity) {
                entity.col = cell.col;
                entity.row = cell.row;
                this.renderInspectors();
            }
        } else if (this.pointerAction.kind === "entry-drag") {
            const entry = this.currentMap.entries[this.pointerAction.entryId];
            if (entry) {
                entry.col = cell.col;
                entry.row = cell.row;
                this.renderInspectors();
            }
        }
    }

    onPointerUp(event) {
        if (!this.pointerAction) return;
        const action = this.pointerAction;
        this.pointerAction = null;
        if (action.kind === "rectangle") {
            const tileId = action.erase ? EMPTY_TILE_ID : this.selectedTileId;
            fillRectangle(
                this.currentMap,
                this.activeLayer,
                this.rectanglePreview.start,
                this.rectanglePreview.end,
                tileId,
            );
            this.rectanglePreview = null;
            this.endTransaction("Rectangle fill");
        } else if (action.kind === "brush") {
            this.endTransaction("Tile brush stroke");
        } else if (action.kind === "entity-drag") {
            this.endTransaction("Move entity");
        } else if (action.kind === "entry-drag") {
            this.endTransaction("Move entry");
        }
        this.refreshAfterMutation();
        if (this.canvas.hasPointerCapture(event.pointerId))
            this.canvas.releasePointerCapture(event.pointerId);
    }

    startTileAction(event, cell) {
        const layer = this.currentMap.layers[this.activeLayer];
        if (this.tool === "eyedropper") {
            if (!layer) return;
            const tileId = layer[cell.row][cell.col];
            this.selectedTileId = tileId;
            this.tool = "pencil";
            this.updateButtonSelection("#tool-buttons button", "tool", this.tool);
            this.renderPalette();
            return;
        }
        if (this.tool === "fill") {
            const tileId = event.button === 2 ? EMPTY_TILE_ID : this.selectedTileId;
            this.commitMutation("Flood fill", () =>
                floodFill(this.currentMap, this.activeLayer, cell.col, cell.row, tileId),
            );
            this.refreshAfterMutation();
            return;
        }
        if (this.tool === "rectangle") {
            this.beginTransaction();
            this.pointerAction = { kind: "rectangle", erase: event.button === 2 };
            this.rectanglePreview = {
                start: { col: cell.col, row: cell.row },
                end: { col: cell.col, row: cell.row },
            };
            return;
        }
        this.beginTransaction();
        this.pointerAction = {
            kind: "brush",
            lastKey: null,
            erase: this.tool === "eraser" || event.button === 2,
        };
        this.paintCell(cell);
    }

    paintCell(cell) {
        const key = `${cell.col},${cell.row}`;
        if (this.pointerAction.lastKey === key) return;

        this.pointerAction.lastKey = key;

        const tileId = this.pointerAction.erase ? EMPTY_TILE_ID : this.selectedTileId;

        if (!canPlaceTile(this.currentMap, this.activeLayer, tileId, cell.col, cell.row)) {
            this.setStatus("Placement rejected: invalid layer or footprint outside the map.", true);
            return;
        }

        setTile(this.currentMap, this.activeLayer, cell.col, cell.row, tileId);

        this.setStatus("Painting. Unsaved editor changes.");
    }

    startEntityAction(cell) {
        const existing = [...this.currentMap.entities]
            .reverse()
            .find((entity) => entity.col === cell.col && entity.row === cell.row);
        if (existing) {
            this.selectedEntityId = existing.id;
            this.selectedEntryId = null;
            this.selectedExitIndex = null;
            this.beginTransaction();
            this.pointerAction = { kind: "entity-drag", entityId: existing.id };
            this.renderInspectors();
            return;
        }
        const preset = ENTITY_PRESETS[this.selectedEntityPreset];
        const entity = {
            id: makeUniqueId(
                this.selectedEntityPreset,
                new Set(this.currentMap.entities.map((item) => item.id)),
            ),
            ...cloneData(preset.entity),
            col: cell.col,
            row: cell.row,
        };
        this.commitMutation("Place entity", () => this.currentMap.entities.push(entity));
        this.selectedEntityId = entity.id;
        this.renderInspectors();
        this.refreshAfterMutation();
    }

    startEntryAction(cell) {
        const existing = Object.entries(this.currentMap.entries).find(
            ([, entry]) => entry.col === cell.col && entry.row === cell.row,
        );
        if (existing) {
            this.selectedEntryId = existing[0];
            this.selectedEntityId = null;
            this.selectedExitIndex = null;
            this.beginTransaction();
            this.pointerAction = { kind: "entry-drag", entryId: existing[0] };
            this.renderInspectors();
            return;
        }
        const entryId = makeUniqueId("entry", new Set(Object.keys(this.currentMap.entries)));
        this.commitMutation("Place entry", () => {
            this.currentMap.entries[entryId] = {
                col: cell.col,
                row: cell.row,
                facing: { dc: 0, dr: 1 },
            };
            if (!this.currentMap.initialEntryId) this.currentMap.initialEntryId = entryId;
        });
        this.selectedEntryId = entryId;
        this.renderMapControls();
        this.renderInspectors();
    }

    selectExitAt(cell) {
        const { width, height } = getMapSize(this.currentMap);
        const candidates = [];
        if (cell.row === 0) candidates.push(["north", cell.col]);
        if (cell.row === height - 1) candidates.push(["south", cell.col]);
        if (cell.col === 0) candidates.push(["west", cell.row]);
        if (cell.col === width - 1) candidates.push(["east", cell.row]);
        const index = this.currentMap.exits.findIndex((exit) =>
            candidates.some(
                ([edge, axis]) =>
                    exit.edge === edge && axis >= exit.range[0] && axis <= exit.range[1],
            ),
        );
        if (index >= 0) {
            this.selectedExitIndex = index;
            this.selectedEntityId = null;
            this.selectedEntryId = null;
            this.renderExitList();
            this.renderInspectors();
        }
    }

    clearSelection() {
        this.selectedEntityId = null;
        this.selectedEntryId = null;
        this.selectedExitIndex = null;
    }

    renderInspectors() {
        byId("map-inspector").hidden = Boolean(
            this.selectedEntityId || this.selectedEntryId || this.selectedExitIndex !== null,
        );
        byId("entity-inspector").hidden = !this.selectedEntityId;
        byId("entry-inspector").hidden = !this.selectedEntryId;
        byId("exit-inspector").hidden = this.selectedExitIndex === null;

        if (this.selectedEntityId) this.renderEntityInspector();
        if (this.selectedEntryId) this.renderEntryInspector();
        if (this.selectedExitIndex !== null) this.renderExitInspector();
        const selection = this.selectedEntityId
            ? `Entity: ${this.selectedEntityId}`
            : this.selectedEntryId
              ? `Entry: ${this.selectedEntryId}`
              : this.selectedExitIndex !== null
                ? `Exit: ${this.selectedExitIndex}`
                : "No selection";
        byId("selection-status").textContent = selection;
    }

    renderEntityInspector() {
        const entity = this.currentMap.entities.find((item) => item.id === this.selectedEntityId);
        if (!entity) return this.clearSelection();
        byId("entity-id").value = entity.id;
        byId("entity-sprite").value = entity.spriteId;
        byId("entity-col").value = entity.col;
        byId("entity-row").value = entity.row;
        byId("entity-active").checked = entity.active;
        byId("entity-collision").checked = entity.collision;
        byId("entity-interaction").value = entity.interaction
            ? JSON.stringify(entity.interaction, null, 4)
            : "";
        this.renderSimpleDialogueInspector(entity.interaction);
    }

    renderSimpleDialogueInspector(interaction) {
        const section = byId("entity-simple-dialogue");
        const effect = findPrimaryShowTextEffect(interaction);
        section.hidden = !effect;

        if (!effect) {
            byId("entity-dialogue-speaker").value = "";
            byId("entity-dialogue-pages").value = "";
            return;
        }

        byId("entity-dialogue-speaker").value =
            typeof effect.speaker === "string" ? effect.speaker : "";
        byId("entity-dialogue-pages").value = formatDialoguePages(effect.pages);
    }

    syncSimpleDialogueFromInteractionJson() {
        const text = byId("entity-interaction").value.trim();
        if (!text) {
            this.renderSimpleDialogueInspector(null);
            return;
        }

        try {
            this.renderSimpleDialogueInspector(JSON.parse(text));
        } catch {
            byId("entity-simple-dialogue").hidden = true;
        }
    }

    syncInteractionJsonFromSimpleDialogue() {
        const interactionText = byId("entity-interaction").value.trim();
        if (!interactionText) return;

        let interaction;
        try {
            interaction = JSON.parse(interactionText);
        } catch {
            return;
        }

        const effect = findPrimaryShowTextEffect(interaction);
        if (!effect) return;

        const speaker = byId("entity-dialogue-speaker").value.trim();
        if (speaker) effect.speaker = speaker;
        else delete effect.speaker;
        effect.pages = parseDialoguePages(byId("entity-dialogue-pages").value);

        byId("entity-interaction").value = JSON.stringify(interaction, null, 4);
    }

    applyEntityInspector() {
        const entity = this.currentMap.entities.find((item) => item.id === this.selectedEntityId);
        if (!entity) return;
        try {
            const newId = byId("entity-id").value.trim();
            const col = Number(byId("entity-col").value);
            const row = Number(byId("entity-row").value);
            const interactionText = byId("entity-interaction").value.trim();
            const interaction = interactionText ? JSON.parse(interactionText) : null;
            const { width, height } = getMapSize(this.currentMap);
            if (
                !newId ||
                (newId !== entity.id && this.currentMap.entities.some((item) => item.id === newId))
            ) {
                throw new Error("Entity IDs must be nonempty and unique within the map.");
            }
            if (
                !Number.isInteger(col) ||
                !Number.isInteger(row) ||
                col < 0 ||
                row < 0 ||
                col >= width ||
                row >= height
            ) {
                throw new Error("Entity position must be an integer cell inside the map.");
            }
            this.commitMutation("Edit entity", () => {
                if (newId !== entity.id) renameEntity(this.maps, this.currentMap, entity, newId);
                entity.spriteId = byId("entity-sprite").value;
                entity.col = col;
                entity.row = row;
                entity.active = byId("entity-active").checked;
                entity.collision = byId("entity-collision").checked;
                entity.interaction = interaction;
            });
            this.selectedEntityId = newId;
            this.refreshAfterMutation();
        } catch (error) {
            this.setStatus(error.message, true);
        }
    }

    deleteSelectedEntity() {
        const index = this.currentMap.entities.findIndex(
            (item) => item.id === this.selectedEntityId,
        );
        if (index < 0) return;
        this.commitMutation("Delete entity", () => this.currentMap.entities.splice(index, 1));
        this.selectedEntityId = null;
        this.refreshAfterMutation();
    }

    renderEntryInspector() {
        const entry = this.currentMap.entries[this.selectedEntryId];
        if (!entry) return this.clearSelection();
        byId("entry-id").value = this.selectedEntryId;
        byId("entry-col").value = entry.col;
        byId("entry-row").value = entry.row;
        byId("entry-facing").value = facingName(entry.facing);
        byId("entry-initial").checked = this.currentMap.initialEntryId === this.selectedEntryId;
        const references = this.findEntryReferences(this.currentMap.id, this.selectedEntryId);
        const referenceRoot = byId("entry-references");
        referenceRoot.replaceChildren();
        if (references.length === 0) {
            referenceRoot.textContent = "No exits or teleports reference this entry.";
        } else {
            const heading = document.createElement("strong");
            heading.textContent = "Referenced by:";
            const list = document.createElement("ul");
            for (const reference of references) {
                const item = document.createElement("li");
                item.textContent = reference;
                list.append(item);
            }
            referenceRoot.append(heading, list);
        }
    }

    findEntryReferences(mapId, entryId) {
        const references = [];
        const walk = (value, path) => {
            if (Array.isArray(value))
                return value.forEach((entry, index) => walk(entry, `${path}[${index}]`));
            if (!value || typeof value !== "object") return;
            const targetsMap = value.targetMapId === mapId || value.mapId === mapId;
            if (targetsMap && value.entryId === entryId) references.push(path);
            for (const [key, child] of Object.entries(value)) walk(child, `${path}.${key}`);
        };
        this.maps.forEach((map) => walk(map, map.id));
        return references;
    }

    applyEntryInspector() {
        const entry = this.currentMap.entries[this.selectedEntryId];
        if (!entry) return;
        try {
            const oldId = this.selectedEntryId;
            const newId = byId("entry-id").value.trim();
            const col = Number(byId("entry-col").value);
            const row = Number(byId("entry-row").value);
            const { width, height } = getMapSize(this.currentMap);
            if (!newId || (newId !== oldId && Object.hasOwn(this.currentMap.entries, newId))) {
                throw new Error("Entry IDs must be nonempty and unique within the map.");
            }
            if (
                !Number.isInteger(col) ||
                !Number.isInteger(row) ||
                col < 0 ||
                row < 0 ||
                col >= width ||
                row >= height
            ) {
                throw new Error("Entry position must be an integer cell inside the map.");
            }
            this.commitMutation("Edit entry", () => {
                if (newId !== oldId) renameEntry(this.maps, this.currentMap, oldId, newId);
                const edited = this.currentMap.entries[newId];
                edited.col = col;
                edited.row = row;
                edited.facing = cloneData(directionVectors[byId("entry-facing").value]);
                if (byId("entry-initial").checked) this.currentMap.initialEntryId = newId;
            });
            this.selectedEntryId = newId;
            this.refreshAfterMutation();
        } catch (error) {
            this.setStatus(error.message, true);
        }
    }

    deleteSelectedEntry() {
        const ids = Object.keys(this.currentMap.entries);
        if (ids.length <= 1) return this.setStatus("A map must keep at least one entry.", true);
        const id = this.selectedEntryId;
        this.commitMutation("Delete entry", () => {
            delete this.currentMap.entries[id];
            if (this.currentMap.initialEntryId === id) {
                this.currentMap.initialEntryId = Object.keys(this.currentMap.entries)[0];
            }
        });
        this.selectedEntryId = null;
        this.refreshAfterMutation();
    }

    addExit() {
        const map = this.currentMap;
        const targetMap = this.maps[0];
        const exit = {
            edge: "north",
            range: [0, 0],
            targetMapId: targetMap.id,
            entryId: targetMap.initialEntryId ?? Object.keys(targetMap.entries)[0],
        };
        this.commitMutation("Add exit", () => map.exits.push(exit));
        this.selectedExitIndex = map.exits.length - 1;
        this.mode = "exits";
        this.refreshAfterMutation();
    }

    renderExitInspector() {
        const exit = this.currentMap.exits[this.selectedExitIndex];
        if (!exit) {
            this.selectedExitIndex = null;
            return this.renderInspectors();
        }
        byId("exit-edge").value = exit.edge;
        byId("exit-range-start").value = exit.range[0];
        byId("exit-range-end").value = exit.range[1];
        const targetMapSelect = byId("exit-target-map");
        targetMapSelect.replaceChildren(...this.maps.map((map) => new Option(map.id, map.id)));
        const isRandom = exit.destination?.type === "random";
        targetMapSelect.disabled = isRandom;
        targetMapSelect.value = isRandom ? (this.maps[0]?.id ?? "") : exit.targetMapId;
        const isEntryTarget = !isRandom && Object.hasOwn(exit, "entryId");
        const isEdgeTarget = !isRandom && Object.hasOwn(exit, "targetEdge");
        this.populateExitEntryOptions(isEntryTarget ? exit.entryId : null);
        byId("exit-entry-target-fields").hidden = !isEntryTarget;
        byId("exit-edge-target-fields").hidden = !isEdgeTarget;
        byId("exit-target-entry").disabled = !isEntryTarget;
        if (isEdgeTarget) {
            byId("exit-target-edge").value = exit.targetEdge;
            byId("exit-target-range-start").value = exit.targetRange?.[0] ?? 0;
            byId("exit-target-range-end").value = exit.targetRange?.[1] ?? 0;
        }
        byId("exit-json").value = JSON.stringify(exit, null, 4);
        this.exitJsonDirty = false;
    }

    populateExitEntryOptions(preferredId = null) {
        const targetMap = this.maps.find((map) => map.id === byId("exit-target-map").value);
        const select = byId("exit-target-entry");
        select.replaceChildren(
            ...Object.keys(targetMap?.entries ?? {}).map((id) => new Option(id, id)),
        );
        if (preferredId && Object.hasOwn(targetMap?.entries ?? {}, preferredId))
            select.value = preferredId;
    }

    applyExitInspector() {
        const exit = this.currentMap.exits[this.selectedExitIndex];
        if (!exit) return;
        try {
            const reciprocal = findReciprocalEdgeExit(this.maps, this.currentMap, exit);
            let replacement;
            if (this.exitJsonDirty) {
                replacement = JSON.parse(byId("exit-json").value);
            } else if (exit.destination?.type === "random") {
                replacement = cloneData(exit);
                replacement.edge = byId("exit-edge").value;
                replacement.range = [
                    Number(byId("exit-range-start").value),
                    Number(byId("exit-range-end").value),
                ];
            } else if (Object.hasOwn(exit, "entryId")) {
                replacement = {
                    edge: byId("exit-edge").value,
                    range: [
                        Number(byId("exit-range-start").value),
                        Number(byId("exit-range-end").value),
                    ],
                    targetMapId: byId("exit-target-map").value,
                    entryId: byId("exit-target-entry").value,
                };
            } else {
                replacement = cloneData(exit);
                replacement.edge = byId("exit-edge").value;
                replacement.range = [
                    Number(byId("exit-range-start").value),
                    Number(byId("exit-range-end").value),
                ];
                replacement.targetMapId = byId("exit-target-map").value;
                if (Object.hasOwn(exit, "targetEdge")) {
                    replacement.targetEdge = byId("exit-target-edge").value;
                    replacement.targetRange = [
                        Number(byId("exit-target-range-start").value),
                        Number(byId("exit-target-range-end").value),
                    ];
                }
            }
            if (
                !Array.isArray(replacement.range) ||
                replacement.range.length !== 2 ||
                !replacement.range.every(Number.isInteger)
            ) {
                throw new Error("Exit range must contain two integers.");
            }
            if (replacement.range[0] < 0 || replacement.range[1] < replacement.range[0]) {
                throw new Error("Exit range must contain ordered non-negative integers.");
            }
            const sourceLimit = getEdgeAxisLength(this.currentMap, replacement.edge);
            if (replacement.range[1] >= sourceLimit) {
                throw new Error(`Exit range exceeds the ${replacement.edge} edge.`);
            }

            const destinations =
                replacement.destination?.type === "random"
                    ? replacement.destination.choices ?? []
                    : [replacement];
            for (const [choiceIndex, destination] of destinations.entries()) {
                if (!Object.hasOwn(destination, "targetEdge")) continue;
                const choiceLabel =
                    replacement.destination?.type === "random"
                        ? `Random destination choice ${choiceIndex}`
                        : "Target doorway";
                if (
                    !Array.isArray(destination.targetRange) ||
                    destination.targetRange.length !== 2 ||
                    !destination.targetRange.every(Number.isInteger) ||
                    destination.targetRange[0] < 0 ||
                    destination.targetRange[1] < destination.targetRange[0]
                ) {
                    throw new Error(`${choiceLabel} range must contain ordered non-negative integers.`);
                }
                if (destination.targetEdge !== OPPOSITE_EDGE[replacement.edge]) {
                    throw new Error(`${choiceLabel} edge must be opposite the source edge.`);
                }
                const sourceLength = replacement.range[1] - replacement.range[0];
                const targetLength = destination.targetRange[1] - destination.targetRange[0];
                if (sourceLength !== targetLength) {
                    throw new Error(`${choiceLabel} must contain the same number of cells as the source range.`);
                }
                const targetMap = this.maps.find((map) => map.id === destination.targetMapId);
                if (!targetMap) throw new Error(`${choiceLabel} targets a missing map.`);
                const targetLimit = getEdgeAxisLength(targetMap, destination.targetEdge);
                if (destination.targetRange[1] >= targetLimit) {
                    throw new Error(`${choiceLabel} range exceeds the target edge.`);
                }
            }
            const replacementIsDirectEdgeExit =
                replacement.destination?.type !== "random" &&
                Object.hasOwn(replacement, "targetEdge");
            let reciprocalReplacement = null;
            let reciprocalTargetMap = null;

            if (reciprocal && replacementIsDirectEdgeExit) {
                reciprocalTargetMap = this.maps.find(
                    (map) => map.id === replacement.targetMapId,
                );
                if (!reciprocalTargetMap) {
                    throw new Error("The reciprocal exit's new target map does not exist.");
                }
                reciprocalReplacement = updateReciprocalEdgeExitGeometry(
                    reciprocal.exit,
                    this.currentMap.id,
                    replacement,
                );

                const overlap = (reciprocalTargetMap.exits ?? []).findIndex(
                    (candidate, index) =>
                        !(reciprocal.map === reciprocalTargetMap && index === reciprocal.index) &&
                        candidate?.edge === reciprocalReplacement.edge &&
                        Array.isArray(candidate.range) &&
                        candidate.range.length === 2 &&
                        candidate.range[0] <= reciprocalReplacement.range[1] &&
                        reciprocalReplacement.range[0] <= candidate.range[1],
                );
                if (overlap >= 0) {
                    throw new Error(
                        `The linked target doorway overlaps exit ${overlap} in "${reciprocalTargetMap.id}".`,
                    );
                }
            }

            this.commitMutation("Edit exit", () => {
                this.currentMap.exits[this.selectedExitIndex] = replacement;

                if (!reciprocal) return;
                if (!replacementIsDirectEdgeExit) {
                    reciprocal.map.exits.splice(reciprocal.index, 1);
                    return;
                }

                if (reciprocal.map === reciprocalTargetMap) {
                    reciprocal.map.exits[reciprocal.index] = reciprocalReplacement;
                    return;
                }

                reciprocal.map.exits.splice(reciprocal.index, 1);
                reciprocalTargetMap.exits.push(reciprocalReplacement);
            });
            this.refreshAfterMutation();
        } catch (error) {
            this.setStatus(error.message, true);
        }
    }

    deleteSelectedExit() {
        if (this.selectedExitIndex === null) return;
        this.commitMutation("Delete exit", () =>
            this.currentMap.exits.splice(this.selectedExitIndex, 1),
        );
        this.selectedExitIndex = null;
        this.refreshAfterMutation();
    }

    validateAndDisplay() {
        const errors = validateEditorDocument(this.maps);
        const root = byId("validation-output");
        root.replaceChildren();
        if (errors.length === 0) {
            const ok = document.createElement("span");
            ok.className = "validation-ok";
            ok.textContent = "No immediate structural errors.";
            root.append(ok);
        } else {
            const heading = document.createElement("strong");
            heading.textContent = `${errors.length} issue${errors.length === 1 ? "" : "s"}`;
            const list = document.createElement("ul");
            list.className = "validation-errors";
            for (const error of errors.slice(0, 30)) {
                const item = document.createElement("li");
                item.textContent = error;
                list.append(item);
            }
            root.append(heading, list);
        }
        return errors;
    }

    saveRecovery(showStatus) {
        localStorage.setItem(EDITOR_STORAGE_KEY, JSON.stringify(this.maps));
        this.updateRecoveryButton();
        if (showStatus) this.setStatus("Recovery copy saved in localStorage.");
    }

    updateRecoveryButton() {
        byId("restore-recovery").disabled = !localStorage.getItem(EDITOR_STORAGE_KEY);
        byId("restore-backup").disabled = !localStorage.getItem(EDITOR_BACKUP_KEY);
    }

    async restoreRecovery() {
        const raw = localStorage.getItem(EDITOR_STORAGE_KEY);
        if (!raw) return;
        if (!confirm("Replace the working document with the local recovery copy?")) return;
        localStorage.setItem(EDITOR_BACKUP_KEY, JSON.stringify(this.maps));
        this.maps = JSON.parse(raw);
        this.mapGraph.invalidatePositions();
        this.selectedMapId = this.maps[0].id;
        this.undoStack = [];
        this.redoStack = [];
        this.clearSelection();
        this.dirty = true;
        await this.refreshDocumentUI();
        this.setStatus("Recovery copy restored.");
    }

    async restorePreImportBackup() {
        const raw = localStorage.getItem(EDITOR_BACKUP_KEY);
        if (!raw) return;
        if (!confirm("Replace the working document with the pre-import backup?")) return;
        this.maps = JSON.parse(raw);
        this.mapGraph.invalidatePositions();
        this.selectedMapId = this.maps[0].id;
        this.undoStack = [];
        this.redoStack = [];
        this.clearSelection();
        this.dirty = true;
        this.saveRecovery(false);
        await this.refreshDocumentUI();
        this.setStatus("Pre-import backup restored.");
    }

    async importText(text) {
        const imported = parseImportedMaps(text);
        localStorage.setItem(EDITOR_BACKUP_KEY, JSON.stringify(this.maps));
        this.updateRecoveryButton();
        this.maps = cloneData(imported);
        this.mapGraph.invalidatePositions();
        this.selectedMapId = this.maps[0]?.id ?? null;
        this.undoStack = [];
        this.redoStack = [];
        this.clearSelection();
        this.dirty = true;
        this.saveRecovery(false);
        await this.refreshDocumentUI();
        this.setStatus(
            "Imported map data. The previous document was stored as a pre-import backup.",
        );
    }

    async copyCurrentMap() {
        const text = JSON.stringify(this.currentMap, null, 4);

        try {
            await navigator.clipboard.writeText(text);
            this.setStatus(`Copied map "${this.currentMap.id}".`);
        } catch {
            this.setStatus("The browser did not allow clipboard access.", true);
        }
    }

    refreshOpenMapGraph() {
        const dialog = byId("map-graph-dialog");
        if (!dialog.open) return;

        this.mapGraph.render(this.maps, {
            selectedMapId: this.selectedMapId,
        });
        this.mapGraph.resize();
    }

    showMapGraph() {
        const dialog = byId("map-graph-dialog");
        dialog.showModal();

        requestAnimationFrame(() => {
            this.refreshOpenMapGraph();
            this.mapGraph.fit();
        });
    }

    async openMapFromGraph(mapId) {
        if (!this.maps.some((map) => map.id === mapId)) {
            this.setStatus(`Map "${mapId}" does not exist.`, true);
            return;
        }

        this.selectedMapId = mapId;
        this.clearSelection();

        const dialog = byId("map-graph-dialog");
        if (dialog.open) dialog.close();

        await this.refreshDocumentUI();
        this.setStatus(`Opened map "${mapId}" from the map graph.`);
    }

    playtest() {
        const errors = this.validateAndDisplay();
        if (errors.length > 0) {
            this.setStatus("Resolve immediate structural errors before playtesting.", true);
            return;
        }
        localStorage.setItem(PLAYTEST_STORAGE_KEY, JSON.stringify(this.maps));
        localStorage.removeItem(PLAYTEST_RESULT_KEY);
        const result = byId("playtest-output");
        result.className = "playtest-result";
        result.textContent = "Full game validation is running in the playtest window.";
        const popup = window.open("../index.html?editorPlaytest=1", "_blank");
        if (popup) popup.opener = null;
        if (!popup) {
            this.setStatus("The browser blocked the playtest window.", true);
            return;
        }
        this.setStatus("Opened the current working document in the real game.");
    }

    displayPlaytestResult(result) {
        const element = byId("playtest-output");
        element.className = `playtest-result ${result.ok ? "ok" : "error"}`;
        element.textContent = result.ok
            ? "Full game validation passed and the playtest started."
            : `Full game validation failed: ${result.message}`;
    }

    markExported() {
        this.dirty = false;
        this.setStatus("Exported the current generated map data.");
    }

    setStatus(message, isError = false) {
        const element = byId("document-status");
        element.textContent = message;
        element.style.color = isError ? "#f0a1a7" : "";
    }
}

if (typeof document !== "undefined") {
    const editor = new MapEditor();
    editor.start().catch((error) => {
        console.error(error);
        byId("document-status").textContent = error.message;
    });
}
