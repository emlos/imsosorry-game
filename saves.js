export const SAVE_VERSION = 1;
export const SAVE_SLOT_ID = "slot-1";
export const SAVE_SLOT_NAME = "Bedroom";

const DATABASE_NAME = "yume-prototype";
const DATABASE_VERSION = 1;
const STORE_NAME = "saves";

function requestResult(request) {
    return new Promise((resolve, reject) => {
        request.addEventListener("success", () => resolve(request.result), { once: true });
        request.addEventListener("error", () => reject(request.error), { once: true });
    });
}

function transactionComplete(transaction) {
    return new Promise((resolve, reject) => {
        transaction.addEventListener("complete", resolve, { once: true });
        transaction.addEventListener("abort", () => reject(transaction.error), { once: true });
        transaction.addEventListener("error", () => reject(transaction.error), { once: true });
    });
}

export class SaveStore {
    constructor() {
        this.databasePromise = null;
    }

    open() {
        if (this.databasePromise) return this.databasePromise;

        this.databasePromise = new Promise((resolve, reject) => {
            const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);

            request.addEventListener("upgradeneeded", () => {
                const database = request.result;
                database.createObjectStore(STORE_NAME, { keyPath: "id" });
            });

            request.addEventListener("success", () => resolve(request.result), { once: true });
            request.addEventListener("error", () => reject(request.error), { once: true });
            request.addEventListener("blocked", () => {
                reject(new Error("Save database upgrade is blocked by another open tab."));
            }, { once: true });
        });

        return this.databasePromise;
    }

    async write(data) {
        const database = await this.open();
        const transaction = database.transaction(STORE_NAME, "readwrite");
        const completion = transactionComplete(transaction);
        const store = transaction.objectStore(STORE_NAME);
        const record = {
            id: SAVE_SLOT_ID,
            name: SAVE_SLOT_NAME,
            updatedAt: Date.now(),
            data,
        };

        store.put(record);
        await completion;
        return record;
    }

    async read() {
        const database = await this.open();
        const transaction = database.transaction(STORE_NAME, "readonly");
        const completion = transactionComplete(transaction);
        const record = await requestResult(transaction.objectStore(STORE_NAME).get(SAVE_SLOT_ID));
        await completion;
        return record ?? null;
    }

    async delete() {
        const database = await this.open();
        const transaction = database.transaction(STORE_NAME, "readwrite");
        const completion = transactionComplete(transaction);
        transaction.objectStore(STORE_NAME).delete(SAVE_SLOT_ID);
        await completion;
    }
}
