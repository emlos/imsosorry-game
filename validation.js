export function isPlainObject(value) {
    if (!value || typeof value !== "object" || Array.isArray(value)) return false;
    const prototype = Object.getPrototypeOf(value);
    return prototype === Object.prototype || prototype === null;
}

export function requireObject(value, label) {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
        throw new Error(`${label} must be an object.`);
    }
}

export function requirePlainObject(value, label) {
    if (!isPlainObject(value)) {
        throw new Error(`${label} must be an object.`);
    }
}

export function requireString(value, label) {
    if (typeof value !== "string" || value.length === 0) {
        throw new Error(`${label} must be a non-empty string.`);
    }
}

export function requireBoolean(value, label) {
    if (typeof value !== "boolean") {
        throw new Error(`${label} must be a boolean.`);
    }
}

export function requireInteger(value, label) {
    if (!Number.isInteger(value)) {
        throw new Error(`${label} must be an integer.`);
    }
}

export function requireNonNegativeInteger(value, label) {
    if (!Number.isInteger(value) || value < 0) {
        throw new Error(`${label} must be a non-negative integer.`);
    }
}

export function requirePositiveInteger(value, label) {
    if (!Number.isInteger(value) || value <= 0) {
        throw new Error(`${label} must be a positive integer.`);
    }
}

export function requirePositiveNumber(value, label) {
    if (!Number.isFinite(value) || value <= 0) {
        throw new Error(`${label} must be a positive number.`);
    }
}

export function requireArray(value, label) {
    if (!Array.isArray(value)) {
        throw new Error(`${label} must be an array.`);
    }
}

export function requireNonEmptyArray(value, label) {
    if (!Array.isArray(value) || value.length === 0) {
        throw new Error(`${label} must be a non-empty array.`);
    }
}

export function requireExactKeys(value, allowedKeys, label) {
    for (const key of Object.keys(value)) {
        if (!allowedKeys.has(key)) {
            throw new Error(`${label} contains unsupported property "${key}".`);
        }
    }
}

export function requireJsonValue(value, label) {
    if (value === null || typeof value === "string" || typeof value === "boolean") return;
    if (typeof value === "number" && Number.isFinite(value)) return;

    if (Array.isArray(value)) {
        value.forEach((child, index) => requireJsonValue(child, `${label}[${index}]`));
        return;
    }

    if (isPlainObject(value)) {
        for (const [key, child] of Object.entries(value)) {
            requireJsonValue(child, `${label}.${key}`);
        }
        return;
    }

    throw new Error(`${label} must contain only JSON-compatible values.`);
}
