#!/usr/bin/env node
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const RESULTS_DIR = path.join(ROOT, 'test-results');
mkdirSync(RESULTS_DIR, { recursive: true });

const SPEED = parseInt(process.env.SPEED || '4', 10);
const MAX_REAL_MS = parseInt(process.env.MAX_REAL_MS || '60000', 10);
const LEVELS = process.env.LEVELS
  ? process.env.LEVELS.split(',')
  : Array.from({ length: 10 }, (_, w) => Array.from({ length: 6 }, (_, l) => `${w + 1}.${l + 1}`)).flat();

console.log(`[runner] starting vite preview server`);
const viteProc = spawn('npx', ['vite', 'preview', '--port', '4173', '--strictPort'], {
  cwd: ROOT,
  stdio: ['ignore', 'pipe', 'pipe'],
});
await new Promise((resolve, reject) => {
  let buf = '';
  const onData = (d) => {
    buf += d.toString();
    if (buf.includes('localhost:4173') || buf.includes('Local:')) setTimeout(resolve, 500);
  };
  viteProc.stdout.on('data', onData);
  viteProc.stderr.on('data', onData);
  setTimeout(reject, 8000, new Error('vite start timeout'));
});

const cleanup = () => { try { viteProc.kill('SIGTERM'); } catch {} };
process.on('exit', cleanup);
process.on('SIGINT', () => { cleanup(); process.exit(); });

console.log(`[runner] launching chromium`);
const browser = await chromium.launch({
  headless: true,
  args: [
    '--disable-background-timer-throttling',
    '--disable-renderer-backgrounding',
    '--disable-backgrounding-occluded-windows',
    '--disable-features=IntensiveWakeUpThrottling,CalculateNativeWinOcclusion',
  ],
});
const page = await browser.newPage();

page.on('pageerror', (err) => console.error(`[page error]`, err.message));
page.on('console', (msg) => {
  if (msg.type() === 'error') console.error(`[page console error]`, msg.text());
});

await page.goto('http://localhost:4173/');
await page.waitForFunction(() => window.__game && window.__game.scene && window.__game.scene.scenes.length > 0, null, { timeout: 15000 });

const solverSetupFn = () => {
  window.__solve = {};
  window.__solve.wait = (ms) => new Promise((r) => setTimeout(r, ms));

  window.__solve.startLevel = async (levelId) => {
    for (const sc of window.__game.scene.scenes) {
      if (sc.scene.isActive() && sc.scene.key !== 'BootScene') window.__game.scene.stop(sc.scene.key);
    }
    window.__game.scene.stop('BootScene');
    window.__game.scene.start('LevelScene', { levelId });
    for (let i = 0; i < 30; i++) {
      await window.__solve.wait(100);
      const s = window.__pd_scene();
      if (s && s.waveManager && s.coins != null && s.toolbar) return s;
    }
    return null;
  };

  window.__solve.installHooks = (s) => {
    if (!s) return;
    s.events.on('visitor-killed', (v, src) => {
      window.__events.push({ t: Math.floor(s._gameTime), kind: 'kill', src: src || 'unknown', type: v && v.type, lane: v && v.row });
    });
    s.events.on('visitor-escaped', (v) => {
      window.__events.push({ t: Math.floor(s._gameTime), kind: 'escape', type: v && v.type, lane: v && v.row });
    });
    s.events.on('mower-fired', () => {
      window.__events.push({ t: Math.floor(s._gameTime), kind: 'mower-fired' });
    });
    s.events.on('wave-started', (idx) => {
      window.__events.push({ t: Math.floor(s._gameTime), kind: 'wave-start', idx });
    });
    s.events.on('tile-destroyed', (tile) => {
      window.__events.push({ t: Math.floor(s._gameTime), kind: 'tile-destroyed', cls: tile && tile.constructor && tile.constructor.name });
    });
  };

  // Smart solver v3 — pre-wave parallel build, mine/magnet panic, cottoncandy slow
  window.__solve.smartTick = (s) => {
    const allowed = s.level.allowedTiles || [];
    const has = (id) => allowed.includes(id);
    const tb = s.toolbar;
    const def = (id) => tb.buttons.find((b) => b._defId === id)?._def;

    const canPay = (id) => { const d = def(id); return d && s.coins >= d.cost; };
    const canPlace = (id) => def(id) && !tb.isOnCooldown(id) && canPay(id);
    const isEmpty = (col, row) => !s.gridState[row][col];

    // Detect wave composition to pick best offensive
    const allVisitors = (s.waveManager?.waves || []).flatMap((w) => w.visitors);
    const totalV = allVisitors.length;
    const lavaImmuneTypes = new Set(['skeleton', 'lavewalker', 'lavaqueen', 'dragon']);
    const lavaImmuneCount = allVisitors.filter((v) => lavaImmuneTypes.has(v.type)).length;
    const flyerCount = allVisitors.filter((v) => v.type === 'flying').length;
    const needNonLava = (lavaImmuneCount + flyerCount) / Math.max(1, totalV) > 0.25;

    const offensiveOrder = needNonLava
      ? ['catapult', 'laser', 'neon', 'bulle', 'lava']
      : ['lava', 'catapult', 'laser', 'neon', 'bulle'];
    const offensive = offensiveOrder.find(has);

    // Count lanes with active threats (visitors not yet too close to base)
    const threatLanesByCol = {};  // row -> max col of visitor
    for (const v of (s.visitors || [])) {
      if (!v.active || v._dying) continue;
      // Convert pixel x to approximate col index: col = (x - originX) / cellSize
      const col = Math.floor((v.x - 100) / 90);
      if (col < 0) continue;  // already past defense line
      const row = v.row;
      if (threatLanesByCol[row] == null || col < threatLanesByCol[row]) threatLanesByCol[row] = col;
    }
    const activeLanes = Object.keys(threatLanesByCol).map(Number);

    // Check existing defense per lane
    const laneStatus = {};
    for (let r = 0; r < 5; r++) {
      let hasOffensive = false, hasWater = false, hasCoin = false;
      for (let c = 0; c < 12; c++) {
        const t = s.gridState[r][c];
        if (!t) continue;
        const cls = t.constructor.name;
        if (cls === 'WaterBlock') hasWater = true;
        else if (cls === 'CoinGenerator') hasCoin = true;
        else hasOffensive = true;
      }
      laneStatus[r] = { hasOffensive, hasWater, hasCoin };
    }

    const elapsed = s._gameTime;
    const visitors = (s.visitors || []).filter((v) => v.active && !v._dying);

    // Count tile types
    let coinCount = 0;
    for (let r = 0; r < 5; r++) for (let c = 0; c < 12; c++) {
      const t = s.gridState[r][c]; if (t && t.constructor.name === 'CoinGenerator') coinCount++;
    }

    const tryPlace = (tool, col, row, reason) => {
      if (!isEmpty(col, row)) return false;
      if (!canPlace(tool)) return false;
      const before = s.coins;
      window.__pd_place(tool, col, row);
      if (s.coins < before) {
        window.__events.push({ t: Math.floor(elapsed), kind: 'place', tool, col, row, reason });
        return true;
      }
      return false;
    };

    // ===== PRE-WAVE (elapsed < 11500ms) =====
    // Strategy: 3 coin (lanes 0/2/4) + 2 water (mid lanes 1/3) = 250c, leaves 100c reserve
    // Income from 3 coins by t=12s: ~75c → 175c at wave start for emergency offensive
    if (elapsed < 11500) {
      // 3 coins on lanes 0/2/4
      if (coinCount < 3 && has('coin') && canPlace('coin')) {
        for (const row of [2, 0, 4]) {
          if (isEmpty(0, row)) {
            if (tryPlace('coin', 0, row, 'eco-prebuild')) return true;
          }
        }
      }
      // 2 water walls on mid lanes (most attacked)
      if (has('water') && canPlace('water')) {
        for (const row of [2, 1, 3]) {
          if (!laneStatus[row].hasWater) {
            if (tryPlace('water', 5, row, 'wall-prebuild-' + row)) return true;
          }
        }
      }
      return false;  // hold reserve for post-wave reaction
    }

    // ===== POST-WAVE (elapsed >= 11500ms) =====

    // Priority 1: PANIC — magnet on cluster (4+ visitors in same 3x3 area)
    if (has('magnet') && canPlace('magnet')) {
      // group visitors by cell
      const cellCounts = {};
      for (const v of visitors) {
        const cellCol = Math.floor((v.x - 100) / 90);
        const cellRow = v.row;
        if (cellCol < 1 || cellCol > 7) continue;
        // 3x3 area around v: (cellCol-1..cellCol+1, cellRow-1..cellRow+1)
        const key = cellCol + ',' + cellRow;
        cellCounts[key] = (cellCounts[key] || 0) + 1;
      }
      let bestCell = null, bestCount = 0;
      for (const [key, count] of Object.entries(cellCounts)) {
        if (count >= 4 && count > bestCount) {
          bestCount = count;
          const [c, r] = key.split(',').map(Number);
          bestCell = { col: c, row: r };
        }
      }
      if (bestCell && isEmpty(bestCell.col, bestCell.row)) {
        if (tryPlace('magnet', bestCell.col, bestCell.row, 'panic-magnet-' + bestCount)) return true;
      }
    }

    // Priority 2: Mine — single visitor close to base on lane without offensive
    if (has('mine') && canPlace('mine')) {
      for (const v of visitors) {
        const cellCol = Math.floor((v.x - 100) / 90);
        if (cellCol >= 1 && cellCol <= 4 && !laneStatus[v.row].hasOffensive) {
          if (tryPlace('mine', Math.max(1, cellCol - 1), v.row, 'mine-trap')) return true;
        }
      }
    }

    // Priority 3: Emergency offensive on most threatened lane (closest visitor to base)
    if (activeLanes.length && offensive && canPlace(offensive)) {
      const sorted = activeLanes.sort((a, b) => threatLanesByCol[a] - threatLanesByCol[b]);
      for (const row of sorted) {
        if (!laneStatus[row].hasOffensive) {
          for (const col of [4, 3, 5, 6]) {
            if (tryPlace(offensive, col, row, 'emergency-lane-' + row)) return true;
          }
        }
      }
    }

    // Priority 4: Cottoncandy slow on threat lane (cheap, helps when offensive on CD)
    if (has('cottoncandy') && canPlace('cottoncandy') && activeLanes.length) {
      for (const row of activeLanes) {
        if (tryPlace('cottoncandy', 6, row, 'slow-lane-' + row)) return true;
      }
    }

    // Priority 5: Replace destroyed water on threat lanes
    if (has('water') && canPlace('water') && activeLanes.length) {
      for (const row of activeLanes) {
        if (!laneStatus[row].hasWater) {
          for (const col of [5, 6, 4]) {
            if (tryPlace('water', col, row, 'water-replace-' + row)) return true;
          }
        }
      }
    }

    // Priority 6: Fill remaining lanes with offensive FIRST (defense before economy)
    if (offensive && canPlace(offensive)) {
      for (let row = 0; row < 5; row++) {
        if (!laneStatus[row].hasOffensive) {
          for (const col of [4, 3, 5]) {
            if (tryPlace(offensive, col, row, 'fill-off-' + row)) return true;
          }
        }
      }
    }

    // Priority 6.5: Cheap offensive fallback — if primary offensive too expensive, use lava
    if (offensive !== 'lava' && has('lava') && canPlace('lava')) {
      for (let row = 0; row < 5; row++) {
        if (!laneStatus[row].hasOffensive) {
          for (const col of [4, 3, 5]) {
            if (tryPlace('lava', col, row, 'lava-fallback-' + row)) return true;
          }
        }
      }
    }

    // Priority 7: Add 4th coin gen ONLY if all 5 lanes have offensive (defense > eco)
    const allLanesCovered = [0,1,2,3,4].every((r) => laneStatus[r].hasOffensive);
    if (allLanesCovered && coinCount < 5 && has('coin') && canPlace('coin')) {
      const safeRows = [0, 1, 2, 3, 4].filter((r) => threatLanesByCol[r] == null || threatLanesByCol[r] > 6);
      for (const row of safeRows) {
        for (const col of [0, 1]) {
          if (tryPlace('coin', col, row, 'eco-add')) return true;
        }
      }
    }

    // Priority 8: Backup offensive layer (col 3 if col 4 occupied)
    if (offensive && canPlace(offensive)) {
      for (let row = 0; row < 5; row++) {
        for (const col of [3, 2]) {
          if (tryPlace(offensive, col, row, 'backup-off-' + row)) return true;
        }
      }
    }

    // Priority 9: Frost trap on cols 7-8 (slow + dmg)
    if (has('frost') && canPlace('frost')) {
      for (let row = 0; row < 5; row++) {
        if (tryPlace('frost', 7, row, 'frost')) return true;
      }
    }

    return false;
  };

  window.__solve.runLevel = async (levelId, opts = {}) => {
    const speed = opts.speed || 4;
    const maxRealMs = opts.maxRealMs || 60000;
    window.__events = [];
    const s = await window.__solve.startLevel(levelId);
    if (!s) return { levelId, error: 'no_scene' };
    s._gameSpeed = speed;
    window.__solve.installHooks(s);

    const t0 = performance.now();
    let placed = 0;

    while (!s.gameOver && (performance.now() - t0) < maxRealMs) {
      const ok = window.__solve.smartTick(s);
      if (ok) placed++;
      await new Promise((r) => setTimeout(r, ok ? 30 : 80));
    }

    return {
      levelId,
      win: s.gameOver && s.escaped < (s.level.loseEscaped || 5),
      escaped: s.escaped,
      killed: s.killed,
      total: s.waveManager.totalVisitors(),
      placed,
      coins: s.coins,
      realMs: Math.floor(performance.now() - t0),
      gameOver: s.gameOver,
      events: window.__events.slice(),
    };
  };
};

await page.evaluate(solverSetupFn);

const summary = [];
const t_start = Date.now();
const BATCH_SIZE = 1;

for (let i = 0; i < LEVELS.length; i++) {
  if (i > 0 && i % BATCH_SIZE === 0) {
    console.log(`[runner] reloading page (batch boundary at level ${i})`);
    await page.goto('http://localhost:4173/');
    await page.waitForFunction(() => window.__game && window.__game.scene && window.__game.scene.scenes.length > 0, null, { timeout: 15000 });
    await page.evaluate(solverSetupFn);
  }
  const lvl = LEVELS[i];
  const t0 = Date.now();
  const r = await page.evaluate(async (args) => window.__solve.runLevel(args.lvl, { speed: args.speed, maxRealMs: args.max }), { lvl, speed: SPEED, max: MAX_REAL_MS });
  const realMs = Date.now() - t0;

  const events = r.events || [];
  const killsBySource = {};
  for (const e of events) if (e.kind === 'kill') killsBySource[e.src] = (killsBySource[e.src] || 0) + 1;
  const mowerKills = killsBySource.mower || 0;
  const towerKills = (r.killed || 0) - mowerKills;
  const moversFired = events.filter((e) => e.kind === 'mower-fired').length;
  const tilesDestroyed = events.filter((e) => e.kind === 'tile-destroyed').length;

  const row = {
    levelId: lvl,
    win: r.win,
    killed: r.killed,
    total: r.total,
    escaped: r.escaped,
    placed: r.placed,
    coinsEnd: r.coins,
    realMs,
    gameOver: r.gameOver,
    moversFired,
    mowerKills,
    towerKills,
    killsBySource,
    tilesDestroyed,
  };
  summary.push(row);

  writeFileSync(path.join(RESULTS_DIR, `${lvl}.json`), JSON.stringify(r, null, 2));
  console.log(`[${i + 1}/${LEVELS.length}] ${lvl} ${r.win ? 'WIN' : 'LOSE'} k=${r.killed}/${r.total} (mower ${mowerKills}, tower ${towerKills}) e=${r.escaped} placed=${r.placed} ${realMs}ms`);
}

writeFileSync(path.join(RESULTS_DIR, 'summary.json'), JSON.stringify({
  speed: SPEED,
  maxRealMs: MAX_REAL_MS,
  totalRealMs: Date.now() - t_start,
  results: summary,
}, null, 2));

const wins = summary.filter((r) => r.win).length;
const totalMowerKills = summary.reduce((a, r) => a + r.mowerKills, 0);
const totalTowerKills = summary.reduce((a, r) => a + r.towerKills, 0);
const totalKills = totalMowerKills + totalTowerKills;

console.log(`\n=== SUMMARY ===`);
console.log(`Wins: ${wins}/${summary.length}`);
console.log(`Total kills: ${totalKills} (tower ${totalTowerKills}, mower ${totalMowerKills}, mower share ${((totalMowerKills / Math.max(1, totalKills)) * 100).toFixed(1)}%)`);
console.log(`Total real time: ${((Date.now() - t_start) / 1000).toFixed(1)}s`);

await browser.close();
cleanup();
process.exit(0);
