# Music and Audio

The project has three registries in `sounds.js`:

- `SOUNDS`: short decoded sound effects.
- `MUSIC`: looping/background tracks.
- `MUSIC_EFFECTS`: non-looping musical stingers.

## Sound registry

```js
export const SOUNDS = {
    "receiver-chime": "./assets/sounds/receiver-chime.wav",
};
```

Play with:

```js
{ type: "playSound", soundId: "receiver-chime" }
```

## Music registry

```js
export const MUSIC = {
    forest: {
        path: "./assets/music/forest.mp3",
        title: "Glasswood",      // optional metadata
        volume: 0.68,            // optional, 0..1
        loop: true,              // optional
        loopStart: 2.5,          // optional seconds
        loopEnd: 45.0,           // optional seconds
        tags: ["forest"],        // optional metadata
        license: "...",         // optional metadata
        source: "...",          // optional metadata
    },
};
```

Rules:

- Loop points require `loop: true`.
- `loopEnd` must be greater than `loopStart` and not exceed file duration.
- Without custom `loopEnd`, looping uses the media element's normal loop behavior.

## Music-effect registry

```js
export const MUSIC_EFFECTS = {
    discovery: {
        path: "./assets/music/discovery.mp3",
        title: "Discovery",
        volume: 0.85,
        tags: ["stinger"],
    },
};
```

Music effects may use metadata fields but cannot define loop properties.

## Map music: inherit, silence, or play

### Inherit current music

Omit `music`:

```js
// no music field
```

or explicitly use a transition policy of `inherit` when transitioning.

### Explicit silence

```js
music: null
```

### Play a track

```js
music: {
    trackId: "forest",
    continuityId: "forest-region",
    fadeInMs: 650,
    restart: "if-different",
    volume: 1,
    playbackRate: 1,
}
```

Map music configuration supports:

```text
trackId
continuityId
fadeInMs
fadeOutMs
crossfadeMs
restart
resume
volume
playbackRate
```

## Conditional map music

A conditional music array must end with exactly one unconditional fallback:

```js
music: [
    {
        condition: { flag: "forest.changed" },
        trackId: "strange-room",
        playbackRate: 0.8,
    },
    {
        trackId: "forest",
        continuityId: "forest-region",
        restart: "if-different",
    },
]
```

Conditional entries before the fallback may omit `trackId` and override only playback options; they inherit the fallback track ID during reference validation/resolution.

Changing flags or inventory refreshes active map music.

## Transition policy

A map may define defaults:

```js
musicTransition: "crossfade",
musicTransitionMs: 900,
```

A teleport or exit destination can override them.

Policies:

- `inherit`: leave current music untouched.
- `replace`: apply the destination map's music without forcing a crossfade.
- `crossfade`: apply destination music and use `musicTransitionMs` as default crossfade duration.
- `silence`: fade out to silence.

Default transition duration is 700 ms when a policy needs one and no override exists.

## Restart policy

- `always`: start the requested track anew unless `resume` or an explicit stored position is used.
- `if-different`: preserve when the current track ID is the same; otherwise replace.
- `never`: preserve current music even when a different track is requested; current track parameters are not replaced with a different track.

A matching non-null `continuityId` preserves the same current track across maps. Continuity applies only when the track IDs also match.

## Resume behavior

When a track is replaced or stopped, its position may be remembered. Request:

```js
{
    type: "playMusic",
    trackId: "shrine",
    resume: true,
}
```

to begin at the remembered position instead of zero.

## Music stack

Temporary override:

```js
{
    type: "pushMusic",
    trackId: "strange-room",
    crossfadeMs: 700,
}
```

Restore prior state:

```js
{
    type: "popMusic",
    crossfadeMs: 700,
}
```

The saved snapshot includes track, position, volume, playback rate, and continuity ID.

## Music effects/stingers

```js
{
    type: "playMusicEffect",
    musicEffectId: "discovery",
    duckMusicTo: 0.2,
    volume: 1,
    playbackRate: 1,
}
```

The background music ducks, the stinger plays, and the background gain restores after completion.

## Map music entry events

```js
musicEvents: [
    {
        id: "first-discovery-cue",
        frequency: "once-per-save",
        entryId: "fromGrove",
        probability: 0.25,
        condition: { notFlag: "cue.disabled" },
        effects: [
            {
                type: "playMusicEffect",
                musicEffectId: "discovery",
                duckMusicTo: 0.18,
            },
        ],
    },
]
```

Fields:

- `id`: unique within the map.
- `frequency`: optional; default `once-per-visit`.
- `entryId`: optional filter.
- `probability`: optional deterministic 0..1 chance.
- `condition`: optional.
- `effects`: non-empty effect sequence.

Frequencies:

- `once-per-visit`: on every qualifying room visit.
- `first-entry`: once in the current browser/game session; not saved.
- `once-per-save`: once in persistent save state.

The probability roll uses the save seed. For `once-per-visit`, the room visit serial is included.

## Playback-rate behavior

`playbackRate` changes both speed and pitch in ordinary browser playback. Independent pitch shifting is not implemented.

## Audio unlock

Browsers require a user gesture before audio starts. The game listens for keydown and pointerdown to resume and unlock the Web Audio context. Sounds requested before unlock are queued.
