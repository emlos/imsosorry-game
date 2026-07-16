import {
    requireArray,
    requireBoolean,
    requireExactKeys,
    requireObject,
    requireString,
} from "./validation.js";

const MUSIC_RESTART_POLICIES = new Set(["always", "if-different", "never"]);
const SILENT_WAV_DATA_URI =
    "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YQQAAAAAAA==";

function requireFiniteNumber(value, label) {
    if (!Number.isFinite(value)) {
        throw new Error(`${label} must be a finite number.`);
    }
}

function requireRange(value, minimum, maximum, label) {
    requireFiniteNumber(value, label);
    if (value < minimum || value > maximum) {
        throw new Error(`${label} must be between ${minimum} and ${maximum}.`);
    }
}

function requireNonNegativeNumber(value, label) {
    requireFiniteNumber(value, label);
    if (value < 0) {
        throw new Error(`${label} must be non-negative.`);
    }
}

function validateSoundRegistry(registry, label) {
    requireObject(registry, label);

    for (const [audioId, path] of Object.entries(registry)) {
        requireString(audioId, `${label} ID`);
        requireString(path, `${label} entry "${audioId}"`);
    }
}

function validateTags(tags, label) {
    requireArray(tags, label);
    tags.forEach((tag, index) => requireString(tag, `${label}[${index}]`));
}

function validateMusicRegistry(registry, label, { allowLoop }) {
    requireObject(registry, label);

    for (const [audioId, definition] of Object.entries(registry)) {
        const entryLabel = `${label} entry "${audioId}"`;
        requireString(audioId, `${label} ID`);
        requireObject(definition, entryLabel);
        requireExactKeys(
            definition,
            new Set([
                "path",
                "title",
                "volume",
                "loop",
                "loopStart",
                "loopEnd",
                "tags",
                "license",
                "source",
            ]),
            entryLabel,
        );
        requireString(definition.path, `${entryLabel}.path`);

        if (definition.title !== undefined) {
            requireString(definition.title, `${entryLabel}.title`);
        }
        if (definition.volume !== undefined) {
            requireRange(definition.volume, 0, 1, `${entryLabel}.volume`);
        }
        if (definition.tags !== undefined) {
            validateTags(definition.tags, `${entryLabel}.tags`);
        }
        if (definition.license !== undefined) {
            requireString(definition.license, `${entryLabel}.license`);
        }
        if (definition.source !== undefined) {
            requireString(definition.source, `${entryLabel}.source`);
        }

        if (!allowLoop) {
            if (
                definition.loop !== undefined ||
                definition.loopStart !== undefined ||
                definition.loopEnd !== undefined
            ) {
                throw new Error(`${entryLabel} cannot define loop properties.`);
            }
            continue;
        }

        if (definition.loop !== undefined) {
            requireBoolean(definition.loop, `${entryLabel}.loop`);
        }
        if (definition.loopStart !== undefined) {
            requireNonNegativeNumber(definition.loopStart, `${entryLabel}.loopStart`);
        }
        if (definition.loopEnd !== undefined) {
            requireNonNegativeNumber(definition.loopEnd, `${entryLabel}.loopEnd`);
        }
        if (
            definition.loopStart !== undefined &&
            definition.loopEnd !== undefined &&
            definition.loopEnd <= definition.loopStart
        ) {
            throw new Error(`${entryLabel}.loopEnd must be greater than loopStart.`);
        }
        if (
            (definition.loopStart !== undefined || definition.loopEnd !== undefined) &&
            definition.loop !== true
        ) {
            throw new Error(`${entryLabel} must set loop: true when defining loop points.`);
        }
    }
}

function cloneMusicSnapshot(snapshot) {
    return snapshot === null
        ? null
        : {
              trackId: snapshot.trackId,
              position: snapshot.position,
              volume: snapshot.volume,
              playbackRate: snapshot.playbackRate,
              continuityId: snapshot.continuityId,
          };
}

function waitForMediaMetadata(path, label) {
    const media = new Audio();
    media.preload = "metadata";

    return new Promise((resolve, reject) => {
        const cleanup = () => {
            media.removeEventListener("loadedmetadata", onLoaded);
            media.removeEventListener("error", onError);
            media.removeAttribute("src");
            media.load();
        };
        const onLoaded = () => {
            const duration = media.duration;
            cleanup();
            resolve(duration);
        };
        const onError = () => {
            cleanup();
            reject(new Error(`Could not load ${label} from "${path}".`));
        };

        media.addEventListener("loadedmetadata", onLoaded, { once: true });
        media.addEventListener("error", onError, { once: true });
        media.src = path;
        media.load();
    });
}

function waitForChannelMetadata(channel, path, label) {
    const { audio } = channel;

    if (channel.path === path && audio.readyState >= 1) {
        return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
        const cleanup = () => {
            audio.removeEventListener("loadedmetadata", onLoaded);
            audio.removeEventListener("error", onError);
        };
        const onLoaded = () => {
            cleanup();
            resolve();
        };
        const onError = () => {
            cleanup();
            reject(new Error(`Could not load ${label} from "${path}".`));
        };

        audio.addEventListener("loadedmetadata", onLoaded, { once: true });
        audio.addEventListener("error", onError, { once: true });
        channel.path = path;
        audio.src = path;
        audio.load();
    });
}

export class AudioSystem {
    constructor(soundDefinitions, musicDefinitions, musicEffectDefinitions = {}) {
        validateSoundRegistry(soundDefinitions, "Sound registry");
        validateMusicRegistry(musicDefinitions, "Music registry", { allowLoop: true });
        validateMusicRegistry(musicEffectDefinitions, "Music-effect registry", {
            allowLoop: false,
        });

        this.soundDefinitions = new Map(Object.entries(soundDefinitions));
        this.musicDefinitions = new Map(Object.entries(musicDefinitions));
        this.musicEffectDefinitions = new Map(Object.entries(musicEffectDefinitions));
        this.soundBuffers = new Map();
        this.pendingSoundIds = [];
        this.mediaDurations = new Map();

        const AudioContextConstructor = window.AudioContext ?? window.webkitAudioContext;
        if (!AudioContextConstructor) {
            throw new Error("This browser does not support Web Audio.");
        }

        this.soundContext = new AudioContextConstructor();
        this.musicMaster = {
            gain: this.soundContext.createGain(),
            fadeToken: 0,
        };
        this.musicMaster.gain.gain.value = 1;
        this.musicMaster.gain.connect(this.soundContext.destination);
        this.musicChannels = [
            this.createMediaChannel("music-a", this.musicMaster.gain),
            this.createMediaChannel("music-b", this.musicMaster.gain),
        ];
        this.musicEffectChannel = this.createMediaChannel(
            "music-effect",
            this.soundContext.destination,
        );
        this.activeMusicChannel = null;
        this.preparePromise = null;
        this.musicRequestId = 0;
        this.musicEffectRequestId = 0;
        this.rememberedPositions = new Map();
        this.musicStack = [];
        this.duckMultiplier = 1;
        this.debugFadeMultiplier = 1;
        this.unlocked = false;

        this.resumeSoundContext = () => {
            this.unlock().catch((error) => {
                console.warn("Could not enable game audio.", error);
            });
        };

        window.addEventListener("keydown", this.resumeSoundContext, { capture: true });
        window.addEventListener("pointerdown", this.resumeSoundContext, { capture: true });
    }

    createMediaChannel(name, outputNode) {
        const audio = new Audio();
        audio.preload = "auto";
        const source = this.soundContext.createMediaElementSource(audio);
        const gain = this.soundContext.createGain();
        gain.gain.value = 0;
        source.connect(gain);
        gain.connect(outputNode);

        const channel = {
            name,
            audio,
            source,
            gain,
            path: null,
            trackId: null,
            definition: null,
            continuityId: null,
            volume: 1,
            playbackRate: 1,
            mode: "idle",
            fadeToken: 0,
        };

        audio.addEventListener("timeupdate", () => this.handleCustomLoop(channel));
        audio.addEventListener("ended", () => this.handleMediaEnded(channel));
        return channel;
    }

    async unlock() {
        if (this.soundContext.state !== "running") {
            await this.soundContext.resume();
        }

        if (this.soundContext.state !== "running") {
            throw new Error("AudioContext did not start.");
        }

        if (!this.unlocked) {
            await Promise.all(
                [...this.musicChannels, this.musicEffectChannel].map(async (channel) => {
                    const { audio } = channel;
                    audio.muted = true;
                    audio.src = SILENT_WAV_DATA_URI;
                    try {
                        await audio.play();
                    } finally {
                        audio.pause();
                        audio.removeAttribute("src");
                        audio.load();
                        audio.muted = false;
                    }
                }),
            );
            this.unlocked = true;
        }

        this.flushPendingSounds();
    }

    prepare() {
        if (!this.preparePromise) {
            this.preparePromise = Promise.all([
                this.loadSoundBuffers(),
                this.loadMediaMetadata(),
            ]).then(() => undefined);
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

    async loadMediaMetadata() {
        const entries = [
            ...[...this.musicDefinitions].map(([id, definition]) => ["music", id, definition]),
            ...[...this.musicEffectDefinitions].map(([id, definition]) => [
                "music effect",
                id,
                definition,
            ]),
        ];

        const durations = await Promise.all(
            entries.map(async ([kind, id, definition]) => {
                const duration = await waitForMediaMetadata(definition.path, `${kind} "${id}"`);
                if (
                    definition.loopEnd !== undefined &&
                    Number.isFinite(duration) &&
                    definition.loopEnd > duration
                ) {
                    throw new Error(
                        `Music registry entry "${id}".loopEnd exceeds the file duration (${duration.toFixed(2)}s).`,
                    );
                }
                return [`${kind}:${id}`, duration];
            }),
        );

        this.mediaDurations = new Map(durations);
    }

    hasSound(soundId) {
        return this.soundDefinitions.has(soundId);
    }

    hasMusic(trackId) {
        return this.musicDefinitions.has(trackId);
    }

    hasMusicEffect(musicEffectId) {
        return this.musicEffectDefinitions.has(musicEffectId);
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

    normalizeMusicOptions(options) {
        requireObject(options, "Music playback options");
        requireString(options.trackId, "Music playback options.trackId");
        if (!this.hasMusic(options.trackId)) {
            throw new Error(`Unknown music track "${options.trackId}".`);
        }

        const normalized = {
            trackId: options.trackId,
            continuityId: options.continuityId ?? null,
            fadeInMs: options.fadeInMs ?? 0,
            fadeOutMs: options.fadeOutMs ?? 0,
            crossfadeMs: options.crossfadeMs ?? 0,
            restart: options.restart ?? "if-different",
            resume: options.resume ?? false,
            volume: options.volume ?? 1,
            playbackRate: options.playbackRate ?? 1,
            position: options.position ?? null,
        };

        if (normalized.continuityId !== null) {
            requireString(normalized.continuityId, "Music playback options.continuityId");
        }
        for (const key of ["fadeInMs", "fadeOutMs", "crossfadeMs"]) {
            requireNonNegativeNumber(normalized[key], `Music playback options.${key}`);
        }
        if (!MUSIC_RESTART_POLICIES.has(normalized.restart)) {
            throw new Error(
                `Music playback options.restart must be "always", "if-different", or "never".`,
            );
        }
        requireBoolean(normalized.resume, "Music playback options.resume");
        requireRange(normalized.volume, 0, 1, "Music playback options.volume");
        requireRange(normalized.playbackRate, 0.25, 4, "Music playback options.playbackRate");
        if (normalized.position !== null) {
            requireNonNegativeNumber(normalized.position, "Music playback options.position");
        }

        return normalized;
    }

    shouldPreserveCurrentMusic(current, options) {
        if (!current?.trackId) return false;
        const sameContinuityGroup =
            current.trackId === options.trackId &&
            current.continuityId !== null &&
            current.continuityId === options.continuityId;
        if (sameContinuityGroup) return true;
        if (options.restart === "never") return true;
        if (options.restart === "always") return false;
        return current.trackId === options.trackId;
    }

    updatePreservedChannel(channel, options) {
        if (options.restart === "never" && channel.trackId !== options.trackId) {
            return;
        }

        channel.continuityId = options.continuityId;
        channel.volume = options.volume;
        channel.playbackRate = options.playbackRate;
        channel.audio.playbackRate = options.playbackRate;
        channel.mode = "active";
        this.activeMusicChannel = channel;
        this.fadeChannelTo(channel, this.getActiveChannelGain(channel), options.fadeInMs);
    }

    async playMusic(rawOptions) {
        const options = this.normalizeMusicOptions(rawOptions);
        const requestId = ++this.musicRequestId;
        const current = this.activeMusicChannel;

        if (this.shouldPreserveCurrentMusic(current, options)) {
            this.updatePreservedChannel(current, options);
            return;
        }

        if (current && options.crossfadeMs === 0 && options.fadeOutMs > 0) {
            this.rememberChannelPosition(current);
            current.mode = "fading-out";
            await this.fadeChannelTo(current, 0, options.fadeOutMs);
            if (requestId !== this.musicRequestId) return;
            this.stopChannel(current, { resetPosition: true });
            if (this.activeMusicChannel === current) this.activeMusicChannel = null;
        }

        if (requestId !== this.musicRequestId) return;

        const next = this.getInactiveMusicChannel(current);
        this.stopChannel(next, { resetPosition: true });
        const definition = this.musicDefinitions.get(options.trackId);
        const position = this.resolveStartPosition(options, definition);

        try {
            await this.prepareMusicChannel(next, options, definition, position);
            if (requestId !== this.musicRequestId) {
                this.stopChannel(next, { resetPosition: true });
                return;
            }

            const usesFadeIn = options.fadeInMs > 0 || options.crossfadeMs > 0;
            this.setChannelGain(next, usesFadeIn ? 0 : this.getActiveChannelGain(next));
            await next.audio.play();
        } catch (error) {
            if (requestId === this.musicRequestId) {
                console.warn(`Could not play music "${options.trackId}".`, error);
            }
            this.stopChannel(next, { resetPosition: true });
            return;
        }

        if (requestId !== this.musicRequestId) {
            this.stopChannel(next, { resetPosition: true });
            return;
        }

        const previous = this.activeMusicChannel;
        this.activeMusicChannel = next;
        next.mode = "active";

        if (previous && previous !== next) {
            this.rememberChannelPosition(previous);

            if (options.crossfadeMs > 0) {
                previous.mode = "fading-out";
                const previousToken = ++previous.fadeToken;
                void this.fadeChannelTo(previous, 0, options.crossfadeMs, previousToken).then(
                    () => {
                        if (
                            previous.fadeToken === previousToken &&
                            previous !== this.activeMusicChannel
                        ) {
                            this.stopChannel(previous, { resetPosition: true });
                        }
                    },
                );
            } else {
                this.stopChannel(previous, { resetPosition: true });
            }
        }

        const fadeDuration = options.crossfadeMs || options.fadeInMs;
        void this.fadeChannelTo(next, this.getActiveChannelGain(next), fadeDuration);
    }

    resolveStartPosition(options, definition) {
        if (options.position !== null) return options.position;
        if (!options.resume) return 0;
        return this.rememberedPositions.get(options.trackId) ?? 0;
    }

    async prepareMusicChannel(channel, options, definition, position) {
        channel.trackId = options.trackId;
        channel.definition = definition;
        channel.continuityId = options.continuityId;
        channel.volume = options.volume;
        channel.playbackRate = options.playbackRate;
        channel.mode = "loading";

        await waitForChannelMetadata(channel, definition.path, `music "${options.trackId}"`);

        channel.audio.loop = definition.loop !== false && definition.loopEnd === undefined;
        channel.audio.playbackRate = options.playbackRate;
        const duration = Number.isFinite(channel.audio.duration) ? channel.audio.duration : null;
        const maximum = definition.loopEnd ?? duration;
        const safePosition =
            maximum === null ? position : Math.min(position, Math.max(0, maximum - 0.01));
        channel.audio.currentTime = safePosition;
    }

    getInactiveMusicChannel(current) {
        const candidate = this.musicChannels.find((channel) => channel !== current);
        return candidate ?? this.musicChannels[0];
    }

    getDefinitionVolume(channel) {
        return channel.definition?.volume ?? 1;
    }

    getActiveChannelGain(channel) {
        return this.getDefinitionVolume(channel) * channel.volume;
    }

    setChannelGain(channel, value) {
        channel.fadeToken += 1;
        const now = this.soundContext.currentTime;
        channel.gain.gain.cancelScheduledValues(now);
        channel.gain.gain.setValueAtTime(value, now);
    }

    fadeChannelTo(channel, value, durationMs, requestedToken = null) {
        const token = requestedToken ?? ++channel.fadeToken;
        const now = this.soundContext.currentTime;
        const gain = channel.gain.gain;
        gain.cancelScheduledValues(now);
        gain.setValueAtTime(gain.value, now);

        if (durationMs <= 0) {
            gain.setValueAtTime(value, now);
            return Promise.resolve();
        }

        gain.linearRampToValueAtTime(value, now + durationMs / 1000);
        return new Promise((resolve) => {
            window.setTimeout(() => {
                if (channel.fadeToken === token) {
                    gain.cancelScheduledValues(this.soundContext.currentTime);
                    gain.setValueAtTime(value, this.soundContext.currentTime);
                }
                resolve();
            }, durationMs);
        });
    }

    rememberChannelPosition(channel) {
        if (!channel?.trackId || !Number.isFinite(channel.audio.currentTime)) return;
        this.rememberedPositions.set(channel.trackId, Math.max(0, channel.audio.currentTime));
    }

    stopChannel(channel, { resetPosition }) {
        if (!channel) return;
        channel.fadeToken += 1;
        channel.audio.pause();
        if (resetPosition) {
            try {
                channel.audio.currentTime = 0;
            } catch {
                // The media element may not have metadata yet.
            }
        }
        channel.audio.removeAttribute("src");
        channel.audio.load();
        channel.path = null;
        channel.trackId = null;
        channel.definition = null;
        channel.continuityId = null;
        channel.volume = 1;
        channel.playbackRate = 1;
        channel.mode = "idle";
        this.setChannelGain(channel, 0);
    }

    async stopMusic({ fadeOutMs = 0, remember = true } = {}) {
        requireNonNegativeNumber(fadeOutMs, "Music stop fadeOutMs");
        const requestId = ++this.musicRequestId;
        const current = this.activeMusicChannel;
        if (!current) return;

        if (remember) this.rememberChannelPosition(current);
        current.mode = "fading-out";
        await this.fadeChannelTo(current, 0, fadeOutMs);
        if (requestId !== this.musicRequestId) return;
        this.stopChannel(current, { resetPosition: true });
        if (this.activeMusicChannel === current) this.activeMusicChannel = null;
    }

    captureMusicState() {
        const channel = this.activeMusicChannel;
        if (!channel?.trackId) return null;

        return {
            trackId: channel.trackId,
            position: Number.isFinite(channel.audio.currentTime) ? channel.audio.currentTime : 0,
            volume: channel.volume,
            playbackRate: channel.playbackRate,
            continuityId: channel.continuityId,
        };
    }

    async pushMusic(options) {
        this.musicStack.push(this.captureMusicState());
        await this.playMusic({ ...options, restart: options.restart ?? "always" });
    }

    async popMusic({ fadeInMs = 0, fadeOutMs = 0, crossfadeMs = 0 } = {}) {
        for (const [key, value] of Object.entries({ fadeInMs, fadeOutMs, crossfadeMs })) {
            requireNonNegativeNumber(value, `Pop music ${key}`);
        }

        if (this.musicStack.length === 0) {
            await this.stopMusic({ fadeOutMs });
            return;
        }

        const snapshot = this.musicStack.pop();
        if (snapshot === null) {
            await this.stopMusic({ fadeOutMs });
            return;
        }

        await this.playMusic({
            ...snapshot,
            fadeInMs,
            fadeOutMs,
            crossfadeMs,
            restart: "always",
        });
    }

    async restartMusic({ fadeOutMs = 0, fadeInMs = 0 } = {}) {
        const snapshot = this.captureMusicState();
        if (!snapshot) return;
        await this.playMusic({
            ...snapshot,
            position: 0,
            fadeOutMs,
            fadeInMs,
            restart: "always",
        });
    }

    setDebugFade(multiplier, durationMs = 0) {
        requireRange(multiplier, 0, 1, "Debug music fade multiplier");
        requireNonNegativeNumber(durationMs, "Debug music fade duration");
        this.debugFadeMultiplier = multiplier;
        this.refreshMusicGain(durationMs);
    }

    refreshMusicGain(durationMs = 0) {
        void this.fadeChannelTo(
            this.musicMaster,
            this.duckMultiplier * this.debugFadeMultiplier,
            durationMs,
        );
    }

    setDuckMultiplier(multiplier, durationMs = 0) {
        requireRange(multiplier, 0, 1, "Music duck multiplier");
        this.duckMultiplier = multiplier;
        this.refreshMusicGain(durationMs);
    }

    async playMusicEffect(
        musicEffectId,
        { duckMusicTo = 0.25, volume = 1, playbackRate = 1 } = {},
    ) {
        if (!this.hasMusicEffect(musicEffectId)) {
            throw new Error(`Unknown music effect "${musicEffectId}".`);
        }
        requireRange(duckMusicTo, 0, 1, "Music effect duckMusicTo");
        requireRange(volume, 0, 1, "Music effect volume");
        requireRange(playbackRate, 0.25, 4, "Music effect playbackRate");

        const requestId = ++this.musicEffectRequestId;
        const channel = this.musicEffectChannel;
        channel.audio.pause();
        channel.audio.removeAttribute("src");
        channel.audio.load();
        const definition = this.musicEffectDefinitions.get(musicEffectId);

        this.setDuckMultiplier(duckMusicTo, 120);
        channel.trackId = musicEffectId;
        channel.definition = definition;
        channel.volume = volume;
        channel.playbackRate = playbackRate;
        channel.mode = "active";

        try {
            await waitForChannelMetadata(
                channel,
                definition.path,
                `music effect "${musicEffectId}"`,
            );
            if (requestId !== this.musicEffectRequestId) return;
            channel.audio.loop = false;
            channel.audio.currentTime = 0;
            channel.audio.playbackRate = playbackRate;
            this.setChannelGain(channel, (definition.volume ?? 1) * volume);
            await channel.audio.play();
        } catch (error) {
            if (requestId === this.musicEffectRequestId) {
                this.setDuckMultiplier(1, 180);
                this.stopChannel(channel, { resetPosition: true });
                console.warn(`Could not play music effect "${musicEffectId}".`, error);
            }
        }
    }

    stopMusicEffect({ restoreDuck = true } = {}) {
        this.musicEffectRequestId += 1;
        this.stopChannel(this.musicEffectChannel, { resetPosition: true });
        if (restoreDuck) this.setDuckMultiplier(1, 180);
    }

    handleMediaEnded(channel) {
        if (channel === this.musicEffectChannel) {
            this.stopMusicEffect({ restoreDuck: true });
            return;
        }

        if (channel.definition?.loop) {
            channel.audio.currentTime = channel.definition.loopStart ?? 0;
            void channel.audio.play();
            return;
        }
        this.rememberChannelPosition(channel);
        this.stopChannel(channel, { resetPosition: true });
        if (this.activeMusicChannel === channel) this.activeMusicChannel = null;
    }

    handleCustomLoop(channel) {
        const definition = channel.definition;
        if (!definition?.loop || definition.loopEnd === undefined) return;
        if (channel.audio.currentTime < definition.loopEnd) return;
        channel.audio.currentTime = definition.loopStart ?? 0;
    }

    getDebugState() {
        const current = this.captureMusicState();
        return {
            current,
            title: current
                ? (this.musicDefinitions.get(current.trackId)?.title ?? current.trackId)
                : null,
            duration: this.activeMusicChannel?.audio.duration ?? null,
            effectiveVolume: this.activeMusicChannel
                ? this.getActiveChannelGain(this.activeMusicChannel) *
                  this.duckMultiplier *
                  this.debugFadeMultiplier
                : 0,
            stackDepth: this.musicStack.length,
            musicEffectId: this.musicEffectChannel.trackId,
            duckMultiplier: this.duckMultiplier,
            debugFadeMultiplier: this.debugFadeMultiplier,
        };
    }

    createSaveState() {
        return {
            current: cloneMusicSnapshot(this.captureMusicState()),
            rememberedPositions: Object.fromEntries(this.rememberedPositions),
            stack: this.musicStack.map(cloneMusicSnapshot),
        };
    }

    validateSaveState(value, label = "Save data.music") {
        requireObject(value, label);
        requireExactKeys(value, new Set(["current", "rememberedPositions", "stack"]), label);

        const validateSnapshot = (snapshot, snapshotLabel) => {
            if (snapshot === null) return null;
            requireObject(snapshot, snapshotLabel);
            requireExactKeys(
                snapshot,
                new Set(["trackId", "position", "volume", "playbackRate", "continuityId"]),
                snapshotLabel,
            );
            requireString(snapshot.trackId, `${snapshotLabel}.trackId`);
            if (!this.hasMusic(snapshot.trackId)) {
                throw new Error(`${snapshotLabel} references missing music "${snapshot.trackId}".`);
            }
            requireNonNegativeNumber(snapshot.position, `${snapshotLabel}.position`);
            requireRange(snapshot.volume, 0, 1, `${snapshotLabel}.volume`);
            requireRange(snapshot.playbackRate, 0.25, 4, `${snapshotLabel}.playbackRate`);
            if (snapshot.continuityId !== null) {
                requireString(snapshot.continuityId, `${snapshotLabel}.continuityId`);
            }
            return cloneMusicSnapshot(snapshot);
        };

        requireObject(value.rememberedPositions, `${label}.rememberedPositions`);
        const rememberedPositions = {};
        for (const [trackId, position] of Object.entries(value.rememberedPositions)) {
            if (!this.hasMusic(trackId)) {
                throw new Error(
                    `${label}.rememberedPositions references missing music "${trackId}".`,
                );
            }
            requireNonNegativeNumber(position, `${label}.rememberedPositions.${trackId}`);
            rememberedPositions[trackId] = position;
        }

        requireArray(value.stack, `${label}.stack`);
        return {
            current: validateSnapshot(value.current, `${label}.current`),
            rememberedPositions,
            stack: value.stack.map((snapshot, index) =>
                validateSnapshot(snapshot, `${label}.stack[${index}]`),
            ),
        };
    }

    async restoreSaveState(state) {
        const prepared = this.validateSaveState(state);
        this.rememberedPositions = new Map(Object.entries(prepared.rememberedPositions));
        this.musicStack = prepared.stack.map(cloneMusicSnapshot);

        if (prepared.current === null) {
            await this.stopMusic({ fadeOutMs: 0, remember: false });
            return;
        }

        const current = this.activeMusicChannel;
        if (current?.trackId === prepared.current.trackId) {
            current.continuityId = prepared.current.continuityId;
            current.volume = prepared.current.volume;
            current.playbackRate = prepared.current.playbackRate;
            current.audio.playbackRate = prepared.current.playbackRate;
            current.audio.currentTime = prepared.current.position;
            current.mode = "active";
            this.setChannelGain(current, this.getActiveChannelGain(current));
            return;
        }

        await this.playMusic({
            ...prepared.current,
            restart: "always",
            fadeInMs: 0,
            fadeOutMs: 0,
            crossfadeMs: 0,
        });
    }
}
