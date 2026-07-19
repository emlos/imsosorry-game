//TODO: add transitions from map to map [visual] - what types? - needs discussion

export const OPPOSITE_EDGE = {
  north: "south",
  south: "north",
  east: "west",
  west: "east",
};

export function getRangeLength(range) {
  return range[1] - range[0] + 1;
}

export function mapAxisBetweenRanges(sourceAxis, sourceRange, targetRange) {
  return targetRange[0] + (sourceAxis - sourceRange[0]);
}

export function getEdgePosition(gridSize, edge, axis) {
  if (edge === "west") {
    return { col: 0, row: axis };
  }

  if (edge === "east") {
    return {
      col: gridSize.width - 1,
      row: axis,
    };
  }

  if (edge === "north") {
    return { col: axis, row: 0 };
  }

  return {
    col: axis,
    row: gridSize.height - 1,
  };
}
