import {
  requireBoolean,
  requireExactKeys,
  requireNonEmptyArray,
  requireObject,
  requireString,
} from "./validation.js";

const CONDITION_OPERATORS = [
  "flag",
  "notFlag",
  "hasItem",
  "notItem",
  "all",
  "any",
];

export function validateCondition(condition, label) {
  requireObject(condition, label);

  const operators = CONDITION_OPERATORS.filter((operator) =>
    Object.hasOwn(condition, operator),
  );

  if (operators.length !== 1) {
    throw new Error(`${label} must define exactly one condition operator.`);
  }

  const operator = operators[0];

  if (operator === "flag") {
    requireExactKeys(condition, new Set(["flag", "equals"]), label);
    requireString(condition.flag, `${label}.flag`);
    if (Object.hasOwn(condition, "equals")) {
      requireBoolean(condition.equals, `${label}.equals`);
    }
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
  requireNonEmptyArray(children, `${label}.${operator}`);

  children.forEach((child, index) => {
    validateCondition(child, `${label}.${operator}[${index}]`);
  });
}

export function validateConditionReferences(game, condition, label) {
  if (Object.hasOwn(condition, "hasItem")) {
    game.validateItemReference(condition.hasItem, `${label}.hasItem`);
    return;
  }

  if (Object.hasOwn(condition, "notItem")) {
    game.validateItemReference(condition.notItem, `${label}.notItem`);
    return;
  }

  const children = condition.all ?? condition.any;
  if (!children) return;

  const operator = Object.hasOwn(condition, "all") ? "all" : "any";
  children.forEach((child, index) => {
    validateConditionReferences(game, child, `${label}.${operator}[${index}]`);
  });
}

function createConditionClause() {
  return {
    flagEquals: new Map(),
    flagsNotTrue: new Set(),
    itemPresence: new Map(),
  };
}

function cloneConditionClause(clause) {
  return {
    flagEquals: new Map(clause.flagEquals),
    flagsNotTrue: new Set(clause.flagsNotTrue),
    itemPresence: new Map(clause.itemPresence),
  };
}

function addFlagEquals(clause, flag, value) {
  if (clause.flagEquals.has(flag) && clause.flagEquals.get(flag) !== value) {
    return false;
  }

  if (value === true && clause.flagsNotTrue.has(flag)) {
    return false;
  }

  clause.flagEquals.set(flag, value);
  return true;
}

function addFlagNotTrue(clause, flag) {
  if (clause.flagEquals.has(flag) && clause.flagEquals.get(flag) === true) {
    return false;
  }

  clause.flagsNotTrue.add(flag);
  return true;
}

function addItemPresence(clause, itemId, present) {
  if (
    clause.itemPresence.has(itemId) &&
    clause.itemPresence.get(itemId) !== present
  ) {
    return false;
  }

  clause.itemPresence.set(itemId, present);
  return true;
}

function mergeConditionClauses(left, right) {
  const merged = cloneConditionClause(left);

  for (const [flag, value] of right.flagEquals) {
    if (!addFlagEquals(merged, flag, value)) return null;
  }

  for (const flag of right.flagsNotTrue) {
    if (!addFlagNotTrue(merged, flag)) return null;
  }

  for (const [itemId, present] of right.itemPresence) {
    if (!addItemPresence(merged, itemId, present)) return null;
  }

  return merged;
}

function getConditionClauses(condition) {
  if (condition === undefined) return [createConditionClause()];

  const clause = createConditionClause();

  if (Object.hasOwn(condition, "flag")) {
    const value = Object.hasOwn(condition, "equals") ? condition.equals : true;
    return addFlagEquals(clause, condition.flag, value) ? [clause] : [];
  }

  if (Object.hasOwn(condition, "notFlag")) {
    return addFlagNotTrue(clause, condition.notFlag) ? [clause] : [];
  }

  if (Object.hasOwn(condition, "hasItem")) {
    return addItemPresence(clause, condition.hasItem, true) ? [clause] : [];
  }

  if (Object.hasOwn(condition, "notItem")) {
    return addItemPresence(clause, condition.notItem, false) ? [clause] : [];
  }

  if (Object.hasOwn(condition, "any")) {
    return condition.any.flatMap((child) => getConditionClauses(child));
  }

  let clauses = [createConditionClause()];
  for (const child of condition.all) {
    const childClauses = getConditionClauses(child);
    const mergedClauses = [];

    for (const existing of clauses) {
      for (const childClause of childClauses) {
        const merged = mergeConditionClauses(existing, childClause);
        if (merged !== null) mergedClauses.push(merged);
      }
    }

    clauses = mergedClauses;
    if (clauses.length === 0) break;
  }

  return clauses;
}

export function conditionsCanOverlap(first, second) {
  const firstClauses = getConditionClauses(first);
  const secondClauses = getConditionClauses(second);

  return firstClauses.some((firstClause) =>
    secondClauses.some(
      (secondClause) =>
        mergeConditionClauses(firstClause, secondClause) !== null,
    ),
  );
}

function hasFlag(state, flag) {
  return state.flags[flag] === true;
}

function hasItem(state, itemId) {
  const itemState = state.inventory[itemId];
  return itemState !== undefined && itemState.quantity > 0;
}

export function evaluateCondition(state, condition) {
  if (Object.hasOwn(condition, "flag")) {
    if (Object.hasOwn(condition, "equals")) {
      return state.flags[condition.flag] === condition.equals;
    }

    return hasFlag(state, condition.flag);
  }

  if (Object.hasOwn(condition, "notFlag")) {
    return !hasFlag(state, condition.notFlag);
  }

  if (Object.hasOwn(condition, "hasItem")) {
    return hasItem(state, condition.hasItem);
  }

  if (Object.hasOwn(condition, "notItem")) {
    return !hasItem(state, condition.notItem);
  }

  if (Object.hasOwn(condition, "all")) {
    return condition.all.every((child) => evaluateCondition(state, child));
  }

  return condition.any.some((child) => evaluateCondition(state, child));
}
