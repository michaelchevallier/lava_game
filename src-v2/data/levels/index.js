import w11 from "./world1-1.json";
import w12 from "./world1-2.json";
import w13 from "./world1-3.json";
import w14 from "./world1-4.json";
import w15 from "./world1-5.json";
import w16 from "./world1-6.json";
import w21 from "./world2-1.json";
import w22 from "./world2-2.json";
import w23 from "./world2-3.json";
import w24 from "./world2-4.json";
import w25 from "./world2-5.json";
import w26 from "./world2-6.json";
import w31 from "./world3-1.json";
import w32 from "./world3-2.json";
import w33 from "./world3-3.json";
import w34 from "./world3-4.json";
import w35 from "./world3-5.json";
import w36 from "./world3-6.json";
import w41 from "./world4-1.json";
import w42 from "./world4-2.json";
import w43 from "./world4-3.json";
import w44 from "./world4-4.json";
import w45 from "./world4-5.json";
import w46 from "./world4-6.json";
import w51 from "./world5-1.json";
import w52 from "./world5-2.json";
import w53 from "./world5-3.json";
import w54 from "./world5-4.json";
import w55 from "./world5-5.json";
import w56 from "./world5-6.json";

import { isCompleted } from "../../systems/SaveSystem.js";

const LEVELS_LIST = [
  w11, w12, w13, w14, w15, w16,
  w21, w22, w23, w24, w25, w26,
  w31, w32, w33, w34, w35, w36,
  w41, w42, w43, w44, w45, w46,
  w51, w52, w53, w54, w55, w56,
];
const LEVELS_MAP = {};
for (const lvl of LEVELS_LIST) LEVELS_MAP[lvl.id] = lvl;

const W1 = ["1.1", "1.2", "1.3", "1.4", "1.5", "1.6"];
const W2 = ["2.1", "2.2", "2.3", "2.4", "2.5", "2.6"];
const W3 = ["3.1", "3.2", "3.3", "3.4", "3.5", "3.6"];
const W4 = ["4.1", "4.2", "4.3", "4.4", "4.5", "4.6"];
const W5 = ["5.1", "5.2", "5.3", "5.4", "5.5", "5.6"];

export const WORLDS = [
  { id: 1, name: "Plein Été",   color: 0x6cce5c, levels: W1 },
  { id: 2, name: "Crépuscule",  color: 0x6a5acd, levels: W2, requires: "1.6" },
  { id: 3, name: "Tempête",     color: 0x4a90d9, levels: W3, requires: "2.6" },
  { id: 4, name: "Volcan",      color: 0xd94a4a, levels: W4, requires: "3.6" },
  { id: 5, name: "Apocalypse",  color: 0x222222, levels: W5, requires: "4.6" },
];

export function isWorldUnlocked(world) {
  if (!world.requires) return true;
  return isCompleted(world.requires);
}

export function isLevelUnlocked(levelId) {
  const lvl = LEVELS_MAP[levelId];
  if (!lvl) return false;
  const world = WORLDS.find((w) => w.id === lvl.world);
  if (!world) return false;
  if (!isWorldUnlocked(world)) return false;
  const idx = world.levels.indexOf(levelId);
  if (idx === 0) return true;
  const prev = world.levels[idx - 1];
  return isCompleted(prev);
}

export function getLevel(id) {
  return LEVELS_MAP[id] || null;
}

export function getNextLevelId(id) {
  for (const w of WORLDS) {
    const idx = w.levels.indexOf(id);
    if (idx >= 0) {
      if (idx + 1 < w.levels.length) return w.levels[idx + 1];
      const wIdx = WORLDS.indexOf(w);
      const nextWorld = WORLDS[wIdx + 1];
      if (nextWorld && nextWorld.levels.length && isWorldUnlocked(nextWorld)) {
        return nextWorld.levels[0];
      }
      return null;
    }
  }
  return null;
}

export function getFirstLevelId() {
  for (const w of WORLDS) {
    if (w.levels.length) return w.levels[0];
  }
  return null;
}

export function totalLevels() {
  return LEVELS_LIST.length;
}
