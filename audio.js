function validateAudioRegistry(registry, label) {
    if (!registry || typeof registry !== "object" || Array.isArray(registry)) {
        throw new Error(`${label} must be an object.`);
    }

    for (const [audioId, path] of Object.entries(registry)) {
        if (typeof audioId !== "string" || audioId.length === 0) {
            throw new Error(`${label} contains an invalid ID.`);
        }

        if (typeof path !== "string" || path.length === 0) {
            throw new Error(`${label} entry "${audioId}" must be a non-empty path.`);
        }
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

    playMusic(musicId) {
        if (this.currentMusicId === musicId && this.currentMusic) {
            return;
        }

        this.stopMusic();

        const audio = new Audio(this.musicDefinitions.get(musicId));
        audio.preload = "auto";
        audio.loop = true;
        this.currentMusicId = musicId;
        this.currentMusic = audio;

        audio.play().catch((error) => {
            console.warn(`Could not play music "${musicId}".`, error);
        });
    }

    stopMusic() {
        if (!this.currentMusic) return;

        this.currentMusic.pause();
        this.currentMusic.currentTime = 0;
        this.currentMusic = null;
        this.currentMusicId = null;
    }
}
