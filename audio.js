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
        this.soundTemplates = new Map();
        this.currentMusicId = null;
        this.currentMusic = null;
        this.musicRequestId = 0;
    }

    prepare() {
        for (const [soundId, path] of this.soundDefinitions) {
            const audio = new Audio(path);
            audio.preload = "auto";
            this.soundTemplates.set(soundId, audio);
        }
    }

    hasSound(soundId) {
        return this.soundDefinitions.has(soundId);
    }

    hasMusic(musicId) {
        return this.musicDefinitions.has(musicId);
    }

    playSound(soundId) {
        const template = this.soundTemplates.get(soundId);
        if (!template) {
            throw new Error(`Sound "${soundId}" is not prepared.`);
        }

        const audio = template.cloneNode();
        audio.play().catch((error) => {
            console.warn(`Could not play sound "${soundId}".`, error);
        });
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
