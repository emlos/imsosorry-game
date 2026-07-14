import { SAVE_SLOT_NAME } from "./saves.js";

export class SaveControls {
    constructor({ game, store, rootElement }) {
        this.game = game;
        this.store = store;
        this.rootElement = rootElement;
        this.statusElement = rootElement.querySelector("[data-save-status]");
        this.fileInput = rootElement.querySelector("[data-save-import-file]");
        this.buttons = [...rootElement.querySelectorAll("button")];

        const saveButton = rootElement.querySelector("[data-save-write]");
        const loadButton = rootElement.querySelector("[data-save-load]");
        const exportButton = rootElement.querySelector("[data-save-export]");
        const importButton = rootElement.querySelector("[data-save-import]");
        const deleteButton = rootElement.querySelector("[data-save-delete]");

        saveButton.addEventListener("click", () => this.run(() => this.save()));
        loadButton.addEventListener("click", () => this.run(() => this.load()));
        exportButton.addEventListener("click", () => this.run(() => this.export()));
        importButton.addEventListener("click", () => this.fileInput.click());
        deleteButton.addEventListener("click", () => this.run(() => this.delete()));
        this.fileInput.addEventListener("change", () => this.run(() => this.import()));
    }

    async run(action) {
        this.setBusy(true);
        try {
            await action();
        } catch (error) {
            console.error(error);
            this.setStatus(error instanceof Error ? error.message : String(error), true);
        } finally {
            this.fileInput.value = "";
            this.setBusy(false);
        }
    }

    async save() {
        const saveData = this.game.createSaveData();
        const record = await this.store.write(saveData);
        this.setStatus(`${record.name} saved ${new Date(record.updatedAt).toLocaleString()}.`);
    }

    async load() {
        const record = await this.store.read();
        if (record === null) {
            throw new Error(`No ${SAVE_SLOT_NAME} save exists.`);
        }

        const prepared = this.game.prepareSaveData(record.data);
        this.game.applyPreparedSave(prepared);
        this.setStatus(`${record.name} loaded.`);
    }

    export() {
        const saveData = this.game.createSaveData();
        const blob = new Blob([`${JSON.stringify(saveData, null, 2)}\n`], {
            type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = "my-save.yume-save";
        document.body.append(anchor);
        anchor.click();
        anchor.remove();
        URL.revokeObjectURL(url);
        this.setStatus("Save exported as my-save.yume-save.");
    }

    async import() {
        const file = this.fileInput.files[0];
        if (!file) return;

        let parsed;
        try {
            parsed = JSON.parse(await file.text());
        } catch {
            throw new Error("Imported file is not valid JSON.");
        }

        const prepared = this.game.prepareSaveData(parsed);
        const record = await this.store.write(prepared.saveData);
        this.game.applyPreparedSave(prepared);
        this.setStatus(`${file.name} imported into ${record.name}.`);
    }

    async delete() {
        await this.store.delete();
        this.setStatus(`${SAVE_SLOT_NAME} save deleted.`);
    }

    setBusy(busy) {
        for (const button of this.buttons) {
            button.disabled = busy;
        }
        this.fileInput.disabled = busy;
    }

    setStatus(message, isError = false) {
        this.statusElement.textContent = message;
        this.statusElement.dataset.error = String(isError);
    }
}
