import world1_1 from "./world1-1.js";

export const LEVELS_BY_ID = {
  "world1-1": world1_1,
};

export const LEVEL_ORDER = [
  "world1-1",
];

export function getLevel(id) {
  return LEVELS_BY_ID[id] || null;
}

export function getNextLevelId(currentId) {
  const idx = LEVEL_ORDER.indexOf(currentId);
  if (idx < 0 || idx >= LEVEL_ORDER.length - 1) return null;
  return LEVEL_ORDER[idx + 1];
}

export function getLevelIndex(currentId) {
  return LEVEL_ORDER.indexOf(currentId);
}
