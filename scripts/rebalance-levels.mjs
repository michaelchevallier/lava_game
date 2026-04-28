#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LEVELS_DIR = path.join(__dirname, "..", "src-v2", "data", "levels");

const FIRST_WAVE_MAX = 12000;
const FIRST_WAVE_MIN = 12000;

function rebalanceLevel(level) {
  if (!level.waves || level.waves.length === 0) return level;

  // 1) Standardize wave 0 delayMs to 12000ms — give players time to pre-build
  //    (WaveManager runtime caps at 15000ms anyway)
  if (level.waves[0].delayMs > FIRST_WAVE_MAX) {
    level.waves[0].delayMs = FIRST_WAVE_MAX;
  }
  if (level.waves[0].delayMs < FIRST_WAVE_MIN) {
    level.waves[0].delayMs = FIRST_WAVE_MIN;
  }

  // 2) Densify waves: add 1 extra visitor per existing visitor in waves of size <= 4
  //    For waves with >= 5 visitors, add 30% more
  for (const wave of level.waves) {
    const visitors = wave.visitors || [];
    if (visitors.length === 0) continue;

    const original = [...visitors];
    const sortedByDelay = [...original].sort((a, b) => (a.delayMs || 0) - (b.delayMs || 0));
    const lastDelay = sortedByDelay[sortedByDelay.length - 1].delayMs || 0;

    let toAdd;
    if (visitors.length <= 4) {
      toAdd = Math.ceil(visitors.length * 0.6);
    } else {
      toAdd = Math.ceil(visitors.length * 0.3);
    }

    for (let i = 0; i < toAdd; i++) {
      const ref = original[i % original.length];
      const offset = Math.round(((i + 1) / toAdd) * 4500) + 1500 * ((i % 2) + 1);
      const newDelay = Math.min(lastDelay + offset, lastDelay + 12000);
      const newLane = (ref.lane + (i % 3) - 1 + 5) % 5;
      visitors.push({
        type: ref.type,
        lane: newLane,
        delayMs: newDelay,
      });
    }
    visitors.sort((a, b) => (a.delayMs || 0) - (b.delayMs || 0));
  }

  // 3) Recompute total visitors and adjust stars escapedMax thresholds
  const total = level.waves.reduce((acc, w) => acc + (w.visitors || []).length, 0);
  const lose = level.loseEscaped || 5;
  if (level.stars) {
    const star1 = Math.min(lose - 1, Math.max(2, Math.floor(total * 0.15)));
    const star2 = Math.max(1, Math.floor(total * 0.05));
    const star3 = 0;
    if (level.stars["1"]) level.stars["1"].escapedMax = star1;
    if (level.stars["2"]) level.stars["2"].escapedMax = star2;
    if (level.stars["3"]) level.stars["3"].escapedMax = star3;
  }

  return level;
}

function processFile(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  const data = JSON.parse(raw);
  if (data.infinite) return false; // skip endless
  const before = JSON.stringify(data);
  rebalanceLevel(data);
  const after = JSON.stringify(data, null, 2);
  if (before === JSON.stringify(JSON.parse(after))) return false;
  fs.writeFileSync(filePath, after + "\n", "utf8");
  return true;
}

function main() {
  const files = fs.readdirSync(LEVELS_DIR)
    .filter((f) => f.startsWith("world") && f.endsWith(".json"))
    .map((f) => path.join(LEVELS_DIR, f));

  let changed = 0;
  let totalBefore = 0;
  let totalAfter = 0;
  for (const f of files) {
    const data = JSON.parse(fs.readFileSync(f, "utf8"));
    const beforeCount = (data.waves || []).reduce((acc, w) => acc + (w.visitors || []).length, 0);
    if (processFile(f)) {
      changed++;
      const after = JSON.parse(fs.readFileSync(f, "utf8"));
      const afterCount = (after.waves || []).reduce((acc, w) => acc + (w.visitors || []).length, 0);
      totalBefore += beforeCount;
      totalAfter += afterCount;
      console.log(`  ${path.basename(f)}: ${beforeCount} -> ${afterCount} visiteurs`);
    }
  }
  console.log(`\n${changed}/${files.length} fichiers modifiés. Total visiteurs : ${totalBefore} -> ${totalAfter}`);
}

main();
