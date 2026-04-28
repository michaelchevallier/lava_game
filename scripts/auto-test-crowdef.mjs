#!/usr/bin/env node
import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const RESULTS_DIR = path.join(ROOT, "test-results");
mkdirSync(RESULTS_DIR, { recursive: true });

const SPEED = parseInt(process.env.SPEED || "4", 10);
const MAX_REAL_MS = parseInt(process.env.MAX_REAL_MS || "120000", 10);
const PORT = 4174;

const log = (...a) => console.log("[crowdef]", ...a);

log(`starting vite preview (port ${PORT})`);
const viteProc = spawn(
  "npx",
  ["vite", "preview", "--config", "vite.kingshot.config.js", "--port", String(PORT), "--strictPort"],
  { cwd: ROOT, stdio: ["ignore", "pipe", "pipe"] },
);

await new Promise((resolve, reject) => {
  let buf = "";
  const onData = (d) => {
    buf += d.toString();
    if (buf.includes("localhost:" + PORT) || buf.includes("Local:")) setTimeout(resolve, 500);
  };
  viteProc.stdout.on("data", onData);
  viteProc.stderr.on("data", onData);
  setTimeout(() => reject(new Error("vite preview start timeout")), 10000);
});

const cleanup = () => {
  try { viteProc.kill("SIGTERM"); } catch {}
};
process.on("exit", cleanup);
process.on("SIGINT", () => { cleanup(); process.exit(); });

log("launching chromium");
const browser = await chromium.launch({
  headless: true,
  args: [
    "--disable-background-timer-throttling",
    "--disable-renderer-backgrounding",
    "--disable-backgrounding-occluded-windows",
    "--disable-features=IntensiveWakeUpThrottling,CalculateNativeWinOcclusion",
  ],
});

const consoleErrors = [];
const pageErrors = [];

const page = await browser.newPage();
page.on("pageerror", (err) => pageErrors.push(err.message));
page.on("console", (msg) => {
  if (msg.type() === "error") consoleErrors.push(msg.text());
});

await page.goto(`http://localhost:${PORT}/`);
await page.waitForFunction(() => window.__cd && window.__cd.runner && window.__cd.runner.hero, null, { timeout: 15000 });

await page.evaluate(() => {
  window.__cdInput = { dx: 0, dz: 0, override: true };
  window.__cdEvents = [];
  const types = [
    "crowdef:wave-start", "crowdef:wave-cleared",
    "crowdef:enemy-killed", "crowdef:tower-built",
    "crowdef:tower-upgraded", "crowdef:hero-levelup",
    "crowdef:perk-picked", "crowdef:castle-hit",
    "crowdef:level-won", "crowdef:level-lost",
    "crowdef:level-restart",
  ];
  for (const t of types) {
    document.addEventListener(t, (e) => {
      window.__cdEvents.push({ t, detail: e.detail, gameTime: window.__cd.runner.gameTime });
    });
  }
  let frames = 0;
  let bucketStart = performance.now();
  const samples = [];
  function frameTick() {
    frames++;
    const now = performance.now();
    if (now - bucketStart >= 1000) {
      samples.push(frames);
      frames = 0;
      bucketStart = now;
    }
    requestAnimationFrame(frameTick);
  }
  requestAnimationFrame(frameTick);
  window.__cdGetFps = () => {
    if (!samples.length) return 0;
    const avg = samples.reduce((a, b) => a + b, 0) / samples.length;
    return { avg, samples: samples.slice() };
  };
});

await page.evaluate((speed) => {
  window.__cd.runner.setSpeed(speed);
  if (window.__cd.skipBriefing) window.__cd.skipBriefing();
}, SPEED);

log(`autopilot run (speed ${SPEED}× max ${MAX_REAL_MS}ms)`);
const result = await page.evaluate(async (maxRealMs) => {
  const cd = window.__cd;
  const start = performance.now();
  return new Promise((resolve) => {
    const tick = () => {
      const elapsed = performance.now() - start;
      if (elapsed > maxRealMs) {
        window.__cdInput.dx = 0; window.__cdInput.dz = 0;
        return resolve({ reason: "timeout", elapsed });
      }
      if (cd.runner.state === "won") return resolve({ reason: "won", elapsed });
      if (cd.runner.state === "lost") return resolve({ reason: "lost", elapsed });

      if (cd.isPerkOpen && cd.isPerkOpen()) {
        cd.pickPerk(0);
        setTimeout(tick, 100);
        return;
      }

      let target = null;
      for (const s of cd.runner.slots) {
        if (s.currentLevel === 0) { target = s; break; }
      }
      if (!target) {
        for (const s of cd.runner.slots) {
          if (s.currentLevel < s.maxLevel) { target = s; break; }
        }
      }

      if (!target) {
        window.__cdInput.dx = 0; window.__cdInput.dz = 0;
      } else {
        const hp = cd.runner.hero.group.position;
        const dx = target.pos.x - hp.x;
        const dz = target.pos.z - hp.z;
        const dist = Math.hypot(dx, dz);
        if (dist > 0.05) {
          window.__cdInput.dx = dx / dist;
          window.__cdInput.dz = dz / dist;
        } else {
          window.__cdInput.dx = 0; window.__cdInput.dz = 0;
        }
      }
      setTimeout(tick, 60);
    };
    tick();
  });
}, MAX_REAL_MS);

const summary = await page.evaluate(() => {
  const events = window.__cdEvents || [];
  const counts = {};
  for (const e of events) counts[e.t] = (counts[e.t] || 0) + 1;
  const fps = window.__cdGetFps();
  return {
    state: window.__cd.runner.state,
    wave: window.__cd.runner.wave,
    castleHP: window.__cd.runner.castleHP,
    castleHPMax: window.__cd.runner.castleHPMax,
    coins: window.__cd.runner.coins,
    counts,
    fpsAvg: typeof fps === "object" ? fps.avg : fps,
    fpsSamples: typeof fps === "object" ? fps.samples : [],
    eventCount: events.length,
  };
});

log("phase 2.5: clear save before world1-8 boss + meta-shop test");
await page.evaluate(() => {
  window.__cd.save.reset();
  window.__cd.save.load();
});

log("phase 2: boss spawn smoke test (world1-8)");
const bossPhase = await page.evaluate(async () => {
  const cd = window.__cd;
  window.__cdBossEvents = [];
  const handler = (e) => window.__cdBossEvents.push({ t: e.type, detail: e.detail });
  document.addEventListener("crowdef:boss-spawned", handler);
  document.addEventListener("crowdef:boss-charge", handler);
  cd.loadLevel("world1-8");
  if (cd.skipBriefing) cd.skipBriefing();
  cd.setSpeed(8);
  await new Promise((r) => setTimeout(r, 200));
  cd.runner._spawnEnemy("brigand_boss");
  await new Promise((r) => setTimeout(r, 9000));
  const events = window.__cdBossEvents.slice();
  document.removeEventListener("crowdef:boss-spawned", handler);
  document.removeEventListener("crowdef:boss-charge", handler);
  return {
    spawned: events.filter((e) => e.t === "crowdef:boss-spawned").length,
    charged: events.filter((e) => e.t === "crowdef:boss-charge").length,
    bossName: events.find((e) => e.t === "crowdef:boss-spawned")?.detail?.name || null,
  };
});

log("phase 3: meta-shop (gems → upgrade → applied)");
const shopPhase = await page.evaluate(async () => {
  const cd = window.__cd;
  cd.save.addGems(50);
  const gemsBefore = cd.save.getGems();
  cd.shop.open();
  await new Promise((r) => setTimeout(r, 100));
  const shopOpen = cd.shop.isOpen();
  cd.shop.buy("castle_hp");
  await new Promise((r) => setTimeout(r, 100));
  const lvlAfter = cd.save.getUpgradeLevel("castle_hp");
  const gemsAfter = cd.save.getGems();
  cd.shop.close();
  cd.loadLevel("world1-1");
  await new Promise((r) => setTimeout(r, 200));
  const castleHPMax = cd.runner.castleHPMax;
  const baseCastleHP = 120;
  const expected = Math.round(baseCastleHP * 1.1);
  return {
    gemsBefore,
    gemsAfter,
    upgradeLvl: lvlAfter,
    shopOpened: shopOpen,
    castleHPMax,
    expectedCastleHP: expected,
  };
});

writeFileSync(
  path.join(RESULTS_DIR, "crowdef-summary.json"),
  JSON.stringify({ result, summary, bossPhase, shopPhase, consoleErrors, pageErrors }, null, 2),
);

await browser.close();
cleanup();

const pass = (label, ok, detail = "") => {
  const sign = ok ? "✓" : "✗";
  console.log(`${sign} ${label}${detail ? " " + detail : ""}`);
  return ok;
};

console.log("\n=== ASSERTS ===");
let allOk = true;
allOk &= pass(`page errors = 0`, pageErrors.length === 0, `(got ${pageErrors.length})`);
allOk &= pass(`console errors = 0`, consoleErrors.length === 0, `(got ${consoleErrors.length})`);
allOk &= pass(`runner reached terminal state`, summary.state === "won" || summary.state === "lost", `(state=${summary.state})`);
allOk &= pass(`enemies killed >= 5`, (summary.counts["crowdef:enemy-killed"] || 0) >= 5, `(got ${summary.counts["crowdef:enemy-killed"] || 0})`);
allOk &= pass(`towers built >= 1`, (summary.counts["crowdef:tower-built"] || 0) >= 1, `(got ${summary.counts["crowdef:tower-built"] || 0})`);
allOk &= pass(`hero level-ups >= 1`, (summary.counts["crowdef:hero-levelup"] || 0) >= 1, `(got ${summary.counts["crowdef:hero-levelup"] || 0})`);
allOk &= pass(`perks picked >= 1`, (summary.counts["crowdef:perk-picked"] || 0) >= 1, `(got ${summary.counts["crowdef:perk-picked"] || 0})`);
allOk &= pass(`tower upgrades >= 1`, (summary.counts["crowdef:tower-upgraded"] || 0) >= 1, `(got ${summary.counts["crowdef:tower-upgraded"] || 0})`);
// Seuil 15 — Chromium headless throttle + 50+ SkinnedMesh anim simultanés.
// En prod desktop attendu 50+ FPS (à valider iPad J7).
allOk &= pass(`fps avg >= 15 (headless w/ rigged crowd)`, summary.fpsAvg >= 15, `(got ${(summary.fpsAvg || 0).toFixed(1)})`);
allOk &= pass(`boss-spawned event fired (world1-8)`, bossPhase.spawned >= 1, `(got ${bossPhase.spawned}, name="${bossPhase.bossName}")`);
allOk &= pass(`boss-charge event fired within 9s`, bossPhase.charged >= 1, `(got ${bossPhase.charged})`);
allOk &= pass(`shop opened via __cd.shop.open()`, shopPhase.shopOpened, `(got ${shopPhase.shopOpened})`);
allOk &= pass(`castle_hp upgrade purchased (lvl 1)`, shopPhase.upgradeLvl === 1, `(got lvl=${shopPhase.upgradeLvl})`);
allOk &= pass(`5 gems spent on upgrade`, shopPhase.gemsBefore - shopPhase.gemsAfter === 5, `(spent ${shopPhase.gemsBefore - shopPhase.gemsAfter})`);
allOk &= pass(`castle HP +10% applied in run`, shopPhase.castleHPMax === shopPhase.expectedCastleHP, `(got ${shopPhase.castleHPMax}, expected ${shopPhase.expectedCastleHP})`);

console.log("\n=== SUMMARY ===");
console.log(JSON.stringify({ result, summary }, null, 2));

if (consoleErrors.length) console.error("\nconsole errors:\n", consoleErrors.join("\n"));
if (pageErrors.length) console.error("\npage errors:\n", pageErrors.join("\n"));

process.exit(allOk ? 0 : 1);
