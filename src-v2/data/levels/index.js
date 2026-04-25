import w11 from "./world1-1.json";
import w12 from "./world1-2.json";
import w13 from "./world1-3.json";
import w14 from "./world1-4.json";
import w15 from "./world1-5.json";
import w16 from "./world1-6.json";

const LEVELS_LIST = [w11, w12, w13, w14, w15, w16];
const LEVELS_MAP = {};
for (const lvl of LEVELS_LIST) LEVELS_MAP[lvl.id] = lvl;

export const WORLDS = [
  {
    id: 1,
    name: "Plein Été",
    color: 0x6cce5c,
    levels: ["1.1", "1.2", "1.3", "1.4", "1.5", "1.6"],
    unlocked: true,
  },
  { id: 2, name: "Crépuscule", color: 0x6a5acd, levels: [], unlocked: false, comingSoon: true },
  { id: 3, name: "Tempête", color: 0x4a90d9, levels: [], unlocked: false, comingSoon: true },
  { id: 4, name: "Volcan", color: 0xd94a4a, levels: [], unlocked: false, comingSoon: true },
  { id: 5, name: "Apocalypse", color: 0x222, levels: [], unlocked: false, comingSoon: true },
];

export function getLevel(id) {
  return LEVELS_MAP[id] || null;
}

export function getNextLevelId(id) {
  for (const w of WORLDS) {
    const idx = w.levels.indexOf(id);
    if (idx >= 0 && idx + 1 < w.levels.length) return w.levels[idx + 1];
  }
  return null;
}

export function getFirstLevelId() {
  for (const w of WORLDS) {
    if (w.levels.length) return w.levels[0];
  }
  return null;
}

export function allLevels() {
  return LEVELS_LIST.slice();
}
