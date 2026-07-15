import { Game } from "./game.js";
import { ITEMS } from "./items.js";
import { MAPS } from "./maps.js";
import { SaveControls } from "./save-ui.js";
import { SaveStore } from "./saves.js";

const canvas = document.querySelector("#game");
const startScreen = document.querySelector("#start-screen");
const startButton = document.querySelector("#start-game");
export let game = null;

canvas.addEventListener("game-interaction", (event) => {
    console.log("Interaction completed:", event.detail);
});

startButton.addEventListener("click", async () => {
    startButton.disabled = true;

    try {
        game = new Game(canvas, MAPS, ITEMS);
        await game.audio.unlock();
        await game.start();

        new SaveControls({
            game,
            store: new SaveStore(),
            rootElement: document.querySelector("#save-controls"),
        });

        startScreen.remove();
    } catch (error) {
        console.error(error);
        document.querySelector("#status").textContent = error.message;
        startButton.disabled = false;
    }
});
