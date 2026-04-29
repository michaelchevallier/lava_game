#!/usr/bin/env node
import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const PORT = 4174;
const TAG = process.env.TAG || "current";
const OUT_DIR = path.join(ROOT, "docs", "screenshots", TAG);
mkdirSync(OUT_DIR, { recursive: true });

const log = (...a) => console.log("[screenshot]", ...a);

log(`starting vite preview port ${PORT}`);
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

const cleanup = () => { try { viteProc.kill("SIGTERM"); } catch {} };
process.on("exit", cleanup);
process.on("SIGINT", () => { cleanup(); process.exit(); });

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const page = await ctx.newPage();
await page.goto(`http://localhost:${PORT}/`);
await page.waitForFunction(() => window.__cd && window.__cd.runner && window.__cd.runner.hero, null, { timeout: 15000 });

await page.evaluate(() => {
  if (window.__cd.skipCutscene) window.__cd.skipCutscene();
  if (window.__cd.skipBriefing) window.__cd.skipBriefing();
  window.__cd.runner.setSpeed(1);
});

const ALL_LEVELS = [
  ...["world1-1","world1-2","world1-3","world1-4","world1-5","world1-6","world1-7","world1-8"],
  ...["world2-1","world2-2","world2-3","world2-4","world2-5","world2-6","world2-7","world2-8"],
  ...["world3-1","world3-2","world3-3","world3-4","world3-5","world3-6","world3-7","world3-8"],
  ...["world4-1","world4-2","world4-3","world4-4","world4-5","world4-6","world4-7","world4-8"],
  "endless",
];

const summary = [];

for (const id of ALL_LEVELS) {
  log(`capturing ${id}`);
  await page.evaluate((lvlId) => {
    window.__cd.save.recordLevelDone("world1-8", { win: true, wave: 6, castleHP: 100, stars: 1 });
    window.__cd.loadLevel(lvlId);
    if (window.__cd.skipCutscene) window.__cd.skipCutscene();
    if (window.__cd.skipBriefing) window.__cd.skipBriefing();
  }, id);
  await page.waitForTimeout(1200);
  const file = path.join(OUT_DIR, `${id}.png`);
  await page.screenshot({ path: file, fullPage: false });
  const meta = await page.evaluate(() => {
    const r = window.__cd.runner;
    return {
      castleHP: r.castleHPMax,
      coins: r.coins,
      slots: r.slots.length,
      waves: r.level?.waves?.list?.length || 0,
      theme: r.level?.theme || "?",
    };
  });
  summary.push({ id, file, ...meta });
}

await browser.close();
cleanup();

const md = [
  `# Screenshots ${TAG}`,
  ``,
  `Date : ${new Date().toISOString().slice(0, 10)}`,
  `Total : ${summary.length} niveaux`,
  ``,
  `| ID | Theme | Castle HP | Coins | Slots | Vagues | Aperçu |`,
  `|---|---|---|---|---|---|---|`,
  ...summary.map((s) => `| ${s.id} | ${s.theme} | ${s.castleHP} | ${s.coins} | ${s.slots} | ${s.waves} | ![${s.id}](${path.basename(s.file)}) |`),
];
writeFileSync(path.join(OUT_DIR, "README.md"), md.join("\n"));
log(`done — ${summary.length} screenshots in ${OUT_DIR}`);
