export const RANDOM_STATE_VERSION = 1;
export const RANDOM_SCOPES = new Set([
  "save",
  "once",
  "roomVisit",
  "interaction",
  "use",
]);

export function createRandomSeed() {
  if (!globalThis.crypto?.getRandomValues) {
    throw new Error(
      "Secure random seed generation is unavailable in this browser.",
    );
  }

  const bytes = new Uint8Array(4);
  globalThis.crypto.getRandomValues(bytes);
  return [...bytes]
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");
}

export function createRandomState() {
  return {
    version: RANDOM_STATE_VERSION,
    seed: createRandomSeed(),
    counters: {},
    resolved: {},
    roomVisits: {},
    currentRoomRuntime: null,
  };
}

export function stableStringHash(value) {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

export function deterministicFloat(seed, eventId, occurrence = "") {
  const input = `${seed}:${eventId}:${String(occurrence)}`;
  return stableStringHash(input) / 0x100000000;
}

export function chooseWeightedIndex(choices, randomValue) {
  const totalWeight = choices.reduce(
    (total, choice) => total + choice.weight,
    0,
  );
  let cursor = randomValue * totalWeight;

  for (let index = 0; index < choices.length; index += 1) {
    cursor -= choices[index].weight;
    if (cursor < 0) return index;
  }

  return choices.length - 1;
}
