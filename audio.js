import { requireObject, requireString } from "./validation.js";

function validateAudioRegistry(registry, label) {
    requireObject(registry, label);

    for (const [audioId, path] of Object.entries(registry)) {
        requireString(audioId, `${label} ID`);
        requireString(path, `${label} entry "${audioId}"`);
    }
}

export class AudioSystem {
    constructor(soundDefinitions, musicDefinitions) {
        validateAudioRegistry(soundDefinitions, "Sound registry");
        validateAudioRegistry(musicDefinitions, "Music registry");

        this.soundDefinitions = new Map(Object.entries(soundDefinitions));
        this.musicDefinitions = new Map(Object.entries(musicDefinitions));
        this.soundBuffers = new Map();
        this.pendingSoundIds = [];
        this.soundContext = new AudioContext();
        this.preparePromise = null;
        this.currentMusicId = null;
        this.currentMusic = null;
        this.musicRequestId = 0;

        this.resumeSoundContext = () => {
            if (this.soundContext.state === "running") {
                this.flushPendingSounds();
                return;
            }

            this.soundContext
                .resume()
                .then(() => this.flushPendingSounds())
                .catch((error) => {
                    console.warn("Could not enable game sound effects.", error);
                });
        };

        window.addEventListener("keydown", this.resumeSoundContext, { capture: true });
        window.addEventListener("pointerdown", this.resumeSoundContext, { capture: true });
    }

    prepare() {
        if (!this.preparePromise) {
            this.preparePromise = this.loadSoundBuffers();
        }

        return this.preparePromise;
    }

    async loadSoundBuffers() {
        const loadedBuffers = await Promise.all(
            [...this.soundDefinitions].map(async ([soundId, path]) => {
                const response = await fetch(path);
                if (!response.ok) {
                    throw new Error(
                        `Could not load sound "${soundId}" from "${path}" (${response.status} ${response.statusText}).`,
                    );
                }

                const encodedAudio = await response.arrayBuffer();

                try {
                    const buffer = await this.soundContext.decodeAudioData(encodedAudio);
                    return [soundId, buffer];
                } catch (error) {
                    throw new Error(`Could not decode sound "${soundId}" from "${path}".`, {
                        cause: error,
                    });
                }
            }),
        );

        this.soundBuffers = new Map(loadedBuffers);
    }

    hasSound(soundId) {
        return this.soundDefinitions.has(soundId);
    }

    hasMusic(musicId) {
        return this.musicDefinitions.has(musicId);
    }

    playSound(soundId) {
        if (!this.soundBuffers.has(soundId)) {
            throw new Error(`Sound "${soundId}" is not prepared.`);
        }

        if (this.soundContext.state !== "running") {
            this.pendingSoundIds.push(soundId);
            return;
        }

        this.startSound(soundId);
    }

    startSound(soundId) {
        const source = this.soundContext.createBufferSource();
        source.buffer = this.soundBuffers.get(soundId);
        source.connect(this.soundContext.destination);
        source.addEventListener("ended", () => source.disconnect(), { once: true });
        source.start();
    }

    flushPendingSounds() {
        if (this.soundContext.state !== "running" || this.pendingSoundIds.length === 0) {
            return;
        }

        const pendingSoundIds = this.pendingSoundIds.splice(0);
        for (const soundId of pendingSoundIds) {
            this.startSound(soundId);
        }
    }

    async playMusic(musicId) {
        if (this.currentMusicId === musicId && this.currentMusic) {
            return Promise.resolve();
        }

        this.stopMusic();
        const requestId = ++this.musicRequestId;

        const audio = new Audio(this.musicDefinitions.get(musicId));
        audio.preload = "auto";
        audio.loop = true;

        return Promise.resolve()
            .then(() => audio.play())
            .then(() => {
                if (requestId !== this.musicRequestId) {
                    audio.pause();
                    audio.currentTime = 0;
                    return;
                }

                this.currentMusicId = musicId;
                this.currentMusic = audio;
            })
            .catch((error) => {
                if (requestId === this.musicRequestId) {
                    this.currentMusicId = null;
                    this.currentMusic = null;
                }
                console.warn(`Could not play music "${musicId}".`, error);
            });
    }

    stopMusic() {
        this.musicRequestId += 1;

        if (!this.currentMusic) {
            this.currentMusicId = null;
            return;
        }

        this.currentMusic.pause();
        this.currentMusic.currentTime = 0;
        this.currentMusic = null;
        this.currentMusicId = null;
    }
}
