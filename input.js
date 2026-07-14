const ACTION_KEYS = new Set(["KeyZ", "Enter", "NumpadEnter"]);
const INVENTORY_KEYS = new Set(["KeyI", "Escape"]);

export class InputController {
    constructor(game) {
        this.game = game;
        this.movementDirections = new Map([
            ["ArrowUp", { dc: 0, dr: -1 }],
            ["KeyW", { dc: 0, dr: -1 }],
            ["ArrowDown", { dc: 0, dr: 1 }],
            ["KeyS", { dc: 0, dr: 1 }],
            ["ArrowLeft", { dc: -1, dr: 0 }],
            ["KeyA", { dc: -1, dr: 0 }],
            ["ArrowRight", { dc: 1, dr: 0 }],
            ["KeyD", { dc: 1, dr: 0 }],
        ]);
        this.keysPressed = new Set();
        this.movementKeyOrder = [];

        window.addEventListener("keydown", (event) => this.handleKeyDown(event));
        window.addEventListener("keyup", (event) => this.handleKeyUp(event));
        window.addEventListener("blur", () => this.clearMovement());
    }

    handleKeyDown(event) {
        if (event.altKey || event.ctrlKey || event.metaKey) return;

        if (this.game.mode === "world") {
            this.handleWorldKeyDown(event);
            return;
        }

        if (this.game.mode === "dialogue") {
            this.handleDialogueKeyDown(event);
            return;
        }

        if (this.game.mode === "inventory") {
            this.handleInventoryKeyDown(event);
        }
    }

    handleWorldKeyDown(event) {
        const direction = this.movementDirections.get(event.code);
        if (direction) {
            event.preventDefault();

            if (!event.repeat && !this.keysPressed.has(event.code)) {
                this.keysPressed.add(event.code);
                this.movementKeyOrder = this.movementKeyOrder.filter((code) => code !== event.code);
                this.movementKeyOrder.push(event.code);
            }
            return;
        }

        if (ACTION_KEYS.has(event.code) && !event.repeat) {
            event.preventDefault();
            this.game.handleActionInteraction();
            return;
        }

        if (INVENTORY_KEYS.has(event.code) && !event.repeat) {
            event.preventDefault();
            this.game.openInventory();
        }
    }

    handleDialogueKeyDown(event) {
        if (!ACTION_KEYS.has(event.code) || event.repeat) return;
        event.preventDefault();
        this.game.advanceDialogue();
    }

    handleInventoryKeyDown(event) {
        if (INVENTORY_KEYS.has(event.code) && !event.repeat) {
            event.preventDefault();
            this.game.closeInventory();
            return;
        }

        if (ACTION_KEYS.has(event.code) && !event.repeat) {
            event.preventDefault();
            this.game.useSelectedItem();
            return;
        }

        const direction = this.movementDirections.get(event.code);
        if (!direction || event.repeat) return;

        event.preventDefault();
        this.game.moveInventorySelection(direction.dc + direction.dr);
    }

    handleKeyUp(event) {
        if (!this.movementDirections.has(event.code)) return;
        this.keysPressed.delete(event.code);
        this.movementKeyOrder = this.movementKeyOrder.filter((code) => code !== event.code);
    }

    clearMovement() {
        this.keysPressed.clear();
        this.movementKeyOrder.length = 0;
    }

    getActiveMovementDirection() {
        for (let index = this.movementKeyOrder.length - 1; index >= 0; index -= 1) {
            const code = this.movementKeyOrder[index];
            if (this.keysPressed.has(code)) {
                return this.movementDirections.get(code);
            }
        }

        return null;
    }
}
