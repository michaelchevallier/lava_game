#!/usr/bin/env node
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const RESULTS_DIR = path.join(ROOT, 'test-results');
mkdirSync(RESULTS_DIR, { recursive: true });

const SPEED = parseInt(process.env.SPEED || '6', 10);
const MAX_REAL_MS = parseInt(process.env.MAX_REAL_MS || '45000', 10);
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
    if (buf.includes('localhost:4173') || buf.includes('Local:')) {
      setTimeout(resolve, 500);
    }
  };
  viteProc.stdout.on('data', onData);
  viteProc.stderr.on('data', onData);
  setTimeout(reject, 8000, new Error('vite start timeout'));
});

const cleanup = () => {
  try { viteProc.kill('SIGTERM'); } catch {}
};
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

  window.__solve.runLevel = async (levelId, opts = {}) => {
    const speed = opts.speed || 6;
    const maxRealMs = opts.maxRealMs || 45000;
    window.__events = [];
    const s = await window.__solve.startLevel(levelId);
    if (!s) return { levelId, error: 'no_scene' };
    s._gameSpeed = speed;
    window.__solve.installHooks(s);

    const allowed = s.level.allowedTiles || [];
    const has = (id) => allowed.includes(id);

    const plan = [];
    for (let row = 0; row < 5; row++) if (has('coin')) plan.push({ tool: 'coin', col: 0, row });
    for (let row = 0; row < 5; row++) if (has('water')) plan.push({ tool: 'water', col: 5, row });
    for (let row = 0; row < 5; row++) {
      if (has('lava')) plan.push({ tool: 'lava', col: 4, row });
      else if (has('catapult')) plan.push({ tool: 'catapult', col: 4, row });
      else if (has('laser')) plan.push({ tool: 'laser', col: 4, row });
      else if (has('neon')) plan.push({ tool: 'neon', col: 4, row });
      else if (has('bulle')) plan.push({ tool: 'bulle', col: 4, row });
    }
    for (let row = 0; row < 5; row++) if (has('coin')) plan.push({ tool: 'coin', col: 1, row });
    for (let row = 0; row < 5; row++) if (has('water')) plan.push({ tool: 'water', col: 6, row });
    for (let row = 0; row < 5; row++) {
      if (has('lava')) plan.push({ tool: 'lava', col: 3, row });
      else if (has('catapult')) plan.push({ tool: 'catapult', col: 3, row });
    }

    const t0 = performance.now();
    let placed = 0;
    let attemptIdx = 0;

    while (!s.gameOver && (performance.now() - t0) < maxRealMs) {
      let didPlace = false;
      for (let i = attemptIdx; i < plan.length; i++) {
        const p = plan[i];
        if (s.gridState[p.row][p.col]) {
          [plan[attemptIdx], plan[i]] = [plan[i], plan[attemptIdx]];
          attemptIdx++;
          continue;
        }
        const def = s.toolbar.buttons.find((b) => b._defId === p.tool)?._def;
        if (!def) { attemptIdx = i + 1; continue; }
        if (s.coins < def.cost) continue;
        if (s.toolbar.isOnCooldown(p.tool)) continue;
        const before = s.coins;
        window.__pd_place(p.tool, p.col, p.row);
        if (s.coins < before) {
          [plan[attemptIdx], plan[i]] = [plan[i], plan[attemptIdx]];
          attemptIdx++;
          placed++;
          didPlace = true;
          window.__events.push({ t: Math.floor(s._gameTime), kind: 'place', tool: p.tool, col: p.col, row: p.row });
          break;
        }
      }
      await new Promise((r) => setTimeout(r, didPlace ? 30 : 100));
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
console.log(`Results in: ${RESULTS_DIR}`);

await browser.close();
cleanup();
process.exit(0);
