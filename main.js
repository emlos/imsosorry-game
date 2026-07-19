import { Game } from "./game.js";
import { ITEMS } from "./items.js";
import { MAPS } from "./maps.js";
import { SaveControls } from "./save-ui.js";
import { SaveStore } from "./saves.js";

const EDITOR_PLAYTEST_STORAGE_KEY = "yume-map-editor-playtest-maps-v3";
const EDITOR_PLAYTEST_RESULT_KEY = "yume-map-editor-playtest-result-v3";
const canvas = document.querySelector("#game");
const startScreen = document.querySelector("#start-screen");
const startButton = document.querySelector("#start-game");
export let game = null;

function isEditorPlaytest() {
    return new URLSearchParams(window.location.search).get("editorPlaytest") === "1";
}

function reportEditorPlaytest(result) {
    if (!isEditorPlaytest()) return;
    localStorage.setItem(
        EDITOR_PLAYTEST_RESULT_KEY,
        JSON.stringify({ ...result, reportedAt: new Date().toISOString() }),
    );
}

function getAuthoredMaps() {
    if (!isEditorPlaytest()) return MAPS;

    const raw = localStorage.getItem(EDITOR_PLAYTEST_STORAGE_KEY);
    if (!raw) {
        throw new Error("No editor playtest document was found in localStorage.");
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
        throw new Error("The editor playtest document is not a nonempty map array.");
    }

    document.querySelector("#status").textContent = "Editor playtest data loaded.";
    return parsed;
}

canvas.addEventListener("game-interaction", (event) => {
    console.log("Interaction completed:", event.detail);
});

startButton.addEventListener("click", async () => {
    startButton.disabled = true;

    try {
        game = new Game(canvas, getAuthoredMaps(), ITEMS);
        await game.audio.unlock();
        await game.start();

        new SaveControls({
            game,
            store: new SaveStore(),
            rootElement: document.querySelector("#save-controls"),
        });

        reportEditorPlaytest({ ok: true });
        startScreen.remove();
    } catch (error) {
        console.error(error);
        reportEditorPlaytest({ ok: false, message: error.message });
        document.querySelector("#status").textContent = error.message;
        startButton.disabled = false;
    }
});
