export class DialogueBox {
    constructor(rootElement) {
        if (!(rootElement instanceof HTMLElement)) {
            throw new Error("Dialogue root element is missing.");
        }

        this.rootElement = rootElement;
        this.speakerElement = rootElement.querySelector("[data-dialogue-speaker]");
        this.textElement = rootElement.querySelector("[data-dialogue-text]");
        this.promptElement = rootElement.querySelector("[data-dialogue-prompt]");


        this.pages = [];
        this.pageIndex = 0;
        this.speaker = null;
        this.onClose = null;
    }

    get isOpen() {
        return !this.rootElement.hidden;
    }

    open({ pages, speaker, onClose }) {
        this.pages = pages;
        this.pageIndex = 0;
        this.speaker = speaker;
        this.onClose = onClose;
        this.rootElement.hidden = false;
        this.renderPage();
    }

    advance() {
        if (!this.isOpen) {
            throw new Error("Cannot advance a closed dialogue.");
        }

        if (this.pageIndex < this.pages.length - 1) {
            this.pageIndex += 1;
            this.renderPage();
            return false;
        }

        this.close();
        return true;
    }

    close() {
        const onClose = this.onClose;
        this.reset();
        onClose();
    }

    reset() {
        this.rootElement.hidden = true;
        this.speakerElement.hidden = true;
        this.speakerElement.textContent = "";
        this.textElement.textContent = "";
        this.promptElement.textContent = "";
        this.pages = [];
        this.pageIndex = 0;
        this.speaker = null;
        this.onClose = null;
    }

    renderPage() {
        this.speakerElement.hidden = this.speaker === null;
        this.speakerElement.textContent = this.speaker ?? "";
        this.textElement.textContent = this.pages[this.pageIndex];
        this.promptElement.textContent =
            this.pageIndex === this.pages.length - 1 ? "Z / Enter: close" : "Z / Enter: continue";
    }
}
