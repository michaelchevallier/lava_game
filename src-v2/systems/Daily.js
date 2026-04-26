import { loadSave, saveSave } from "./SaveSystem.js";
import { checkTrophies } from "./Trophies.js";

const VISITOR_POOL_BASE = ["basic", "basic", "basic", "vip"];
const VISITOR_POOL_MID = ["basic", "vip", "thief", "skeleton"];
const VISITOR_POOL_HARD = ["basic", "vip", "thief", "skeleton", "flying", "pusher"];
const TILE_POOL = ["coin", "lava", "water", "fan", "magnet", "catapult", "frost", "portal", "tamer", "cottoncandy"];

function dateSeed(d) {
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
}

function mulberry32(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function getDailyDateKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return y + "-" + m + "-" + day;
}

export function getDailyLevel(date = new Date()) {
  const seed = dateSeed(date);
  const rng = mulberry32(seed);

  const required = ["coin", "lava"];
  const extras = TILE_POOL.filter((t) => !required.includes(t));
  const allowed = [...required];
  for (let i = 0; i < 4; i++) {
    if (!extras.length) break;
    const idx = Math.floor(rng() * extras.length);
    allowed.push(extras.splice(idx, 1)[0]);
  }

  const waves = [];
  for (let w = 0; w < 4; w++) {
    const pool = w === 0 ? VISITOR_POOL_BASE : (w < 3 ? VISITOR_POOL_MID : VISITOR_POOL_HARD);
    const count = 5 + w * 2 + Math.floor(rng() * 3);
    const visitors = [];
    for (let i = 0; i < count; i++) {
      const type = pool[Math.floor(rng() * pool.length)];
      const lane = Math.floor(rng() * 5);
      const gap = 800 + Math.floor(rng() * 800) - w * 80;
      visitors.push({ type, lane, delayMs: i * Math.max(400, gap) });
    }
    waves.push({ delayMs: 7000 + w * 22000, visitors });
  }

  return {
    id: "daily",
    name: "Défi du " + getDailyDateKey(date),
    world: 7,
    startCoins: 280,
    allowedTiles: allowed,
    loseEscaped: 5,
    waves,
    stars: { "1": { escapedMax: 4 }, "2": { escapedMax: 2 }, "3": { escapedMax: 0 } },
  };
}

export function getDailyResult(date = new Date()) {
  const save = loadSave();
  return save.daily?.[getDailyDateKey(date)] ?? null;
}

export function hasPlayedToday() {
  return !!getDailyResult();
}

export function recordDaily(stars, killed, escaped) {
  const save = loadSave();
  if (!save.daily) save.daily = {};
  const key = getDailyDateKey();
  save.daily[key] = { stars, killed, escaped, ts: Date.now() };
  saveSave(save);
  return checkTrophies(null, save);
}

export function getDailyStreak() {
  const save = loadSave();
  if (!save.daily) return 0;
  let streak = 0;
  const d = new Date();
  while (streak < 365) {
    const key = getDailyDateKey(d);
    if (save.daily[key]) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else break;
  }
  return streak;
}
