import world1_1 from "./world1-1.js";
import world1_2 from "./world1-2.js";
import world1_3 from "./world1-3.js";
import world1_4 from "./world1-4.js";
import world1_5 from "./world1-5.js";
import world1_6 from "./world1-6.js";
import world1_7 from "./world1-7.js";
import world1_8 from "./world1-8.js";
import world2_1 from "./world2-1.js";
import world2_2 from "./world2-2.js";
import world2_3 from "./world2-3.js";
import world2_4 from "./world2-4.js";
import world2_5 from "./world2-5.js";
import world2_6 from "./world2-6.js";
import world2_7 from "./world2-7.js";
import world2_8 from "./world2-8.js";
import world3_1 from "./world3-1.js";
import world3_2 from "./world3-2.js";
import world3_3 from "./world3-3.js";
import world3_4 from "./world3-4.js";
import world3_5 from "./world3-5.js";
import world3_6 from "./world3-6.js";
import world3_7 from "./world3-7.js";
import world3_8 from "./world3-8.js";

export const LEVELS_BY_ID = {
  "world1-1": world1_1, "world1-2": world1_2, "world1-3": world1_3, "world1-4": world1_4,
  "world1-5": world1_5, "world1-6": world1_6, "world1-7": world1_7, "world1-8": world1_8,
  "world2-1": world2_1, "world2-2": world2_2, "world2-3": world2_3, "world2-4": world2_4,
  "world2-5": world2_5, "world2-6": world2_6, "world2-7": world2_7, "world2-8": world2_8,
  "world3-1": world3_1, "world3-2": world3_2, "world3-3": world3_3, "world3-4": world3_4,
  "world3-5": world3_5, "world3-6": world3_6, "world3-7": world3_7, "world3-8": world3_8,
};

export const LEVEL_ORDER = [
  "world1-1", "world1-2", "world1-3", "world1-4", "world1-5", "world1-6", "world1-7", "world1-8",
  "world2-1", "world2-2", "world2-3", "world2-4", "world2-5", "world2-6", "world2-7", "world2-8",
  "world3-1", "world3-2", "world3-3", "world3-4", "world3-5", "world3-6", "world3-7", "world3-8",
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
