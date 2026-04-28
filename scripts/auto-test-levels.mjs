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
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

page.on('pageerror', (err) => console.error(`[page error]`, err.message));
page.on('console', (msg) => {
  if (msg.type() === 'error') console.error(`[page console error]`, msg.text());
});

await page.goto('http://localhost:4173/');
await page.waitForFunction(() => window.__game && window.__game.scene && window.__game.scene.scenes.length > 0, null, { timeout: 15000 });

await page.evaluate(() => {
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

  // Smart solver — per-lane threat priority + adaptive economy
  window.__solve.smartTick = (s) => {
    const allowed = s.level.allowedTiles || [];
    const has = (id) => allowed.includes(id);
    const tb = s.toolbar;
    const def = (id) => tb.buttons.find((b) => b._defId === id)?._def;

    const canPay = (id) => { const d = def(id); return d && s.coins >= d.cost; };
    const canPlace = (id) => def(id) && !tb.isOnCooldown(id) && canPay(id);
    const isEmpty = (col, row) => !s.gridState[row][col];

    // pick offensive tile (lava preferred)
    const offensive = ['lava', 'catapult', 'laser', 'neon', 'bulle'].find(has);

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

    // Priority 1: emergency — any active threat lane without offensive tile
    if (activeLanes.length && offensive && canPlace(offensive)) {
      // pick the most threatening lane (lowest col = closest to base)
      const sorted = activeLanes.sort((a, b) => threatLanesByCol[a] - threatLanesByCol[b]);
      for (const row of sorted) {
        if (!laneStatus[row].hasOffensive) {
          // place offensive at col 4 if possible, else col 3 or 5
          for (const col of [4, 3, 5, 6]) {
            if (isEmpty(col, row)) {
              const before = s.coins;
              window.__pd_place(offensive, col, row);
              if (s.coins < before) {
                window.__events.push({ t: Math.floor(elapsed), kind: 'place', tool: offensive, col, row, reason: 'emergency-lane-' + row });
                return true;
              }
            }
          }
        }
      }
    }

    // Priority 2: water in front of any lane with threat but no water yet
    if (activeLanes.length && has('water') && canPlace('water')) {
      for (const row of activeLanes) {
        if (!laneStatus[row].hasWater) {
          for (const col of [5, 6, 4]) {
            if (isEmpty(col, row)) {
              const before = s.coins;
              window.__pd_place('water', col, row);
              if (s.coins < before) {
                window.__events.push({ t: Math.floor(elapsed), kind: 'place', tool: 'water', col, row, reason: 'wall-lane-' + row });
                return true;
              }
            }
          }
        }
      }
    }

    // Priority 3: coin gen in safe lanes (no current threat)
    if (has('coin') && canPlace('coin')) {
      // count existing coins
      let coinCount = 0;
      for (let r = 0; r < 5; r++) for (let c = 0; c < 12; c++) {
        const t = s.gridState[r][c]; if (t && t.constructor.name === 'CoinGenerator') coinCount++;
      }
      // cap coins at 8 (more than enough)
      if (coinCount < 8) {
        // place in row furthest from active threats
        const safeRows = [0, 1, 2, 3, 4].filter((r) => !activeLanes.includes(r) || elapsed < 12000);
        for (const row of safeRows) {
          for (const col of [0, 1]) {
            if (isEmpty(col, row)) {
              const before = s.coins;
              window.__pd_place('coin', col, row);
              if (s.coins < before) {
                window.__events.push({ t: Math.floor(elapsed), kind: 'place', tool: 'coin', col, row, reason: 'eco' });
                return true;
              }
            }
          }
        }
      }
    }

    // Priority 4: extend defense — fill all 5 lanes with offensive + water
    if (offensive) {
      for (let row = 0; row < 5; row++) {
        if (!laneStatus[row].hasOffensive && canPlace(offensive)) {
          for (const col of [4, 3, 5, 6]) {
            if (isEmpty(col, row)) {
              const before = s.coins;
              window.__pd_place(offensive, col, row);
              if (s.coins < before) {
                window.__events.push({ t: Math.floor(elapsed), kind: 'place', tool: offensive, col, row, reason: 'fill-off' });
                return true;
              }
            }
          }
        }
      }
    }
    if (has('water')) {
      for (let row = 0; row < 5; row++) {
        if (!laneStatus[row].hasWater && canPlace('water')) {
          for (const col of [5, 6]) {
            if (isEmpty(col, row)) {
              const before = s.coins;
              window.__pd_place('water', col, row);
              if (s.coins < before) {
                window.__events.push({ t: Math.floor(elapsed), kind: 'place', tool: 'water', col, row, reason: 'fill-water' });
                return true;
              }
            }
          }
        }
      }
    }

    // Priority 5: backup offensive (col 3) and frost (col 7)
    if (offensive && canPlace(offensive)) {
      for (let row = 0; row < 5; row++) {
        for (const col of [3, 2]) {
          if (isEmpty(col, row)) {
            const before = s.coins;
            window.__pd_place(offensive, col, row);
            if (s.coins < before) {
              window.__events.push({ t: Math.floor(elapsed), kind: 'place', tool: offensive, col, row, reason: 'backup-off' });
              return true;
            }
          }
        }
      }
    }
    if (has('frost') && canPlace('frost')) {
      for (let row = 0; row < 5; row++) {
        for (const col of [7]) {
          if (isEmpty(col, row)) {
            const before = s.coins;
            window.__pd_place('frost', col, row);
            if (s.coins < before) {
              window.__events.push({ t: Math.floor(elapsed), kind: 'place', tool: 'frost', col, row, reason: 'frost' });
              return true;
            }
          }
        }
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
});

const summary = [];
const t_start = Date.now();

for (let i = 0; i < LEVELS.length; i++) {
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
