//TODO: jquery?

export class InventoryPanel {
    constructor({ rootElement, openButton, onOpen, onClose, onUse, onSelect }) {
        if (!(rootElement instanceof HTMLElement)) {
            throw new Error("Inventory root element is missing.");
        }

        if (!(openButton instanceof HTMLButtonElement)) {
            throw new Error("Inventory open button is missing.");
        }

        this.rootElement = rootElement;
        this.openButton = openButton;
        this.listElement = rootElement.querySelector("[data-inventory-list]");
        this.emptyElement = rootElement.querySelector("[data-inventory-empty]");
        this.iconElement = rootElement.querySelector("[data-inventory-icon]");
        this.nameElement = rootElement.querySelector("[data-inventory-name]");
        this.quantityElement = rootElement.querySelector("[data-inventory-quantity]");
        this.descriptionElement = rootElement.querySelector("[data-inventory-description]");
        this.useButton = rootElement.querySelector("[data-inventory-use]");
        this.closeButton = rootElement.querySelector("[data-inventory-close]");

        const requiredElements = [
            this.listElement,
            this.emptyElement,
            this.iconElement,
            this.nameElement,
            this.quantityElement,
            this.descriptionElement,
            this.useButton,
            this.closeButton,
        ];

        if (requiredElements.some((element) => !element)) {
            throw new Error("Inventory overlay is missing required elements.");
        }

        this.onOpen = onOpen;
        this.onClose = onClose;
        this.onUse = onUse;
        this.onSelect = onSelect;

        this.openButton.addEventListener("click", () => this.onOpen());
        this.closeButton.addEventListener("click", () => this.onClose());
        this.useButton.addEventListener("click", () => this.onUse());
        this.listElement.addEventListener("click", (event) => {
            const button = event.target.closest("[data-item-id]");
            if (!button) return;
            this.onSelect(button.dataset.itemId);
        });
    }

    get isOpen() {
        return !this.rootElement.hidden;
    }

    show() {
        this.rootElement.hidden = false;
        this.openButton.setAttribute("aria-expanded", "true");
    }

    hide() {
        this.rootElement.hidden = true;
        this.openButton.setAttribute("aria-expanded", "false");
    }

    render(inventoryState, itemDefinitions, selectedItemId) {
        const itemIds = Object.keys(inventoryState);
        this.listElement.replaceChildren();
        this.emptyElement.hidden = itemIds.length !== 0;

        for (const itemId of itemIds) {
            const item = itemDefinitions.get(itemId);
            const state = inventoryState[itemId];
            const button = document.createElement("button");
            button.type = "button";
            button.className = "inventory-item";
            button.dataset.itemId = itemId;
            button.setAttribute("aria-pressed", String(itemId === selectedItemId));

            const icon = document.createElement("img");
            icon.src = item.icon;
            icon.alt = "";

            const label = document.createElement("span");
            label.textContent = item.name;

            const quantity = document.createElement("span");
            quantity.className = "inventory-item-quantity";
            quantity.textContent = `×${state.quantity}`;

            button.append(icon, label, quantity);
            this.listElement.append(button);
        }

        if (selectedItemId === null) {
            this.iconElement.hidden = true;
            this.iconElement.removeAttribute("src");
            this.nameElement.textContent = "No item selected";
            this.quantityElement.textContent = "";
            this.descriptionElement.textContent = "Select an item to inspect it.";
            this.useButton.disabled = true;
            return;
        }

        const item = itemDefinitions.get(selectedItemId);
        const state = inventoryState[selectedItemId];
        this.iconElement.hidden = false;
        this.iconElement.src = item.icon;
        this.iconElement.alt = item.name;
        this.nameElement.textContent = item.name;
        this.quantityElement.textContent = `Quantity: ${state.quantity}`;
        this.descriptionElement.textContent = item.description;
        this.useButton.disabled = !item.usable;
    }
}
