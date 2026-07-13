const CONDITION_OPERATORS = ["flag", "notFlag", "hasItem", "notItem", "all", "any"];

function requireConditionObject(condition, label) {
    if (!condition || typeof condition !== "object" || Array.isArray(condition)) {
        throw new Error(`${label} must be an object.`);
    }
}

function requireString(value, label) {
    if (typeof value !== "string" || value.length === 0) {
        throw new Error(`${label} must be a non-empty string.`);
    }
}

function requireExactKeys(value, allowedKeys, label) {
    for (const key of Object.keys(value)) {
        if (!allowedKeys.has(key)) {
            throw new Error(`${label} contains unsupported property "${key}".`);
        }
    }
}

export function validateCondition(condition, label) {
    requireConditionObject(condition, label);

    const operators = CONDITION_OPERATORS.filter((operator) => Object.hasOwn(condition, operator));

    if (operators.length !== 1) {
        throw new Error(`${label} must define exactly one condition operator.`);
    }

    const operator = operators[0];

    if (operator === "flag") {
        requireExactKeys(condition, new Set(["flag", "equals"]), label);
        requireString(condition.flag, `${label}.flag`);
        return;
    }

    if (operator === "notFlag") {
        requireExactKeys(condition, new Set(["notFlag"]), label);
        requireString(condition.notFlag, `${label}.notFlag`);
        return;
    }

    if (operator === "hasItem") {
        requireExactKeys(condition, new Set(["hasItem"]), label);
        requireString(condition.hasItem, `${label}.hasItem`);
        return;
    }

    if (operator === "notItem") {
        requireExactKeys(condition, new Set(["notItem"]), label);
        requireString(condition.notItem, `${label}.notItem`);
        return;
    }

    requireExactKeys(condition, new Set([operator]), label);

    const children = condition[operator];
    if (!Array.isArray(children) || children.length === 0) {
        throw new Error(`${label}.${operator} must be a non-empty array.`);
    }

    children.forEach((child, index) => {
        validateCondition(child, `${label}.${operator}[${index}]`);
    });
}

export function evaluateCondition(game, condition) {
    if (Object.hasOwn(condition, "flag")) {
        if (Object.hasOwn(condition, "equals")) {
            return Object.is(game.getFlag(condition.flag), condition.equals);
        }

        return game.hasFlag(condition.flag);
    }

    if (Object.hasOwn(condition, "notFlag")) {
        return !game.hasFlag(condition.notFlag);
    }

    if (Object.hasOwn(condition, "hasItem")) {
        return game.hasItem(condition.hasItem);
    }

    if (Object.hasOwn(condition, "notItem")) {
        return !game.hasItem(condition.notItem);
    }

    if (Object.hasOwn(condition, "all")) {
        return condition.all.every((child) => evaluateCondition(game, child));
    }

    return condition.any.some((child) => evaluateCondition(game, child));
}
