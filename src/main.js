import kaplay from "kaplay";
import {
  TILE, COLS, ROWS, GROUND_ROW, WIDTH, HEIGHT,
  COMBO_WINDOW, COMBO_MULTIPLIERS, MILESTONES,
  gridKey,
} from "./constants.js";
import { audio } from "./audio.js";
import { loadAllSprites } from "./sprites.js";
import { loadSave, persistSave, serializeTiles, deserializeTiles, showExportModal } from "./serializer.js";
import { createTileSystem } from "./tiles.js";
import { createWagonSystem } from "./wagons.js";
import { createPlayerSystem } from "./players.js";
import { createHUD } from "./hud.js";
import { createDuckSystem } from "./ducks.js";
import { showInteractionsModal } from "./help-modal.js";
import { createCrowdSystem } from "./crowd.js";
import { createJuice } from "./juice.js";

const k = kaplay({
  canvas: document.getElementById("game"),
  width: WIDTH,
  height: HEIGHT,
  background: [92, 148, 252],
  global: false,
  pixelDensity: 1,
  letterbox: false,
  stretch: false,
  maxFPS: 60,
});

{
  const _canvas = document.getElementById("game");
  const _origMousePos = k.mousePos.bind(k);
  k.mousePos = () => {
    const r = _canvas.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) return _origMousePos();
    const raw = _origMousePos();
    const cssRatio = r.width / r.height;
    const gameRatio = WIDTH / HEIGHT;
    let renderW, renderH, offsetX, offsetY;
    if (cssRatio > gameRatio) {
      renderH = r.height;
      renderW = r.height * gameRatio;
      offsetX = (r.width - renderW) / 2;
      offsetY = 0;
    } else {
      renderW = r.width;
      renderH = r.width / gameRatio;
      offsetX = 0;
      offsetY = (r.height - renderH) / 2;
    }
    return k.vec2(
      (raw.x - offsetX) * (WIDTH / renderW),
      (raw.y - offsetY) * (HEIGHT / renderH),
    );
  };
}

k.setGravity(1600);
const juice = createJuice({ k });
window.__juice = juice;
window.__k = k;
window.__getStats = () => {
  const tags = ["wagon","visitor","passenger","tile","particle","particle-grav","particle-x","particle-debris","particle-firework","fan-puff","steam","ghost","wagon-part","flag-deco","cloud","magnet-spark","coin","lava","water","boost","trampoline","portal","fan","ice","magnet","bridge","wheel","wheel-coin","duck","duck-part","crowd"];
  const out = { total: k.get("*").length };
  for (const t of tags) out[t] = k.get(t).length;
  return out;
};

loadAllSprites(k).then(() => {
  console.log("sprites loaded, starting scene");
  try { k.go("game"); } catch (e) { console.error("scene start failed", e); }
}).catch(e => console.error("Promise.all failed", e));

window.addEventListener("error", (e) => console.error("global error:", e.message, e.filename, e.lineno));

let selectedTool = "lava";

window.__mobileInput = { left: false, right: false, jumpPressed: false, wagonPressed: false };

const urlForceMobile = new URLSearchParams(location.search).get('mobile') === '1';
const urlForceDesktop = new URLSearchParams(location.search).get('mobile') === '0';
const touchCapable = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
const narrowScreen = window.innerWidth < 900;
const coarsePointer = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
const isMobile = urlForceDesktop ? false : (urlForceMobile || touchCapable || narrowScreen || coarsePointer);
if (isMobile) {
  document.getElementById('mobile-controls').style.display = 'block';

  const mi = window.__mobileInput;

  function bindHoldBtn(id, onDown, onUp) {
    const btn = document.getElementById(id);
    btn.addEventListener('touchstart', (e) => { e.preventDefault(); onDown(); }, { passive: false });
    btn.addEventListener('touchend',   (e) => { e.preventDefault(); onUp && onUp(); }, { passive: false });
    btn.addEventListener('touchcancel', () => { onUp && onUp(); });
    btn.addEventListener('mousedown',  onDown);
    btn.addEventListener('mouseup',    () => { onUp && onUp(); });
    btn.addEventListener('mouseleave', () => { onUp && onUp(); });
  }

  bindHoldBtn('mc-left',  () => { mi.left  = true; }, () => { mi.left  = false; });
  bindHoldBtn('mc-right', () => { mi.right = true; }, () => { mi.right = false; });
  bindHoldBtn('mc-jump',  () => { mi.jumpPressed  = true; }, () => { mi.jumpPressed  = false; });
  bindHoldBtn('mc-wagon', () => { mi.wagonPressed = true; }, () => { mi.wagonPressed = false; });
}

const save = loadSave();
const settings = {
  open: false,
  numPlayers: save.numPlayers || 2,
  autoMode: save.autoMode || false,
};

const gameState = {
  skeletons: 0,
  coins: 0,
  rides: 0,
  score: 0,
  comboCount: 0,
  comboExpire: 0,
  milestoneIdx: 0,
  bulletTimeUntil: 0,
  wagonSpeedMult: save.wagonSpeedMult ?? 1,
  magnetFields: [],
};

audio.setMasterVolume(save.volume ?? 0.7);

const settingsOverlay = (() => {
  const div = document.createElement("div");
  div.id = "settings-sliders";
  div.style.cssText = [
    "position:fixed", "z-index:9999", "pointer-events:none",
    "top:0", "left:0", "width:100%", "height:100%",
    "display:none", "align-items:center", "justify-content:center",
  ].join(";");

  div.innerHTML = `
    <div style="pointer-events:auto;background:rgba(18,24,40,0.97);border:1px solid rgba(255,210,63,0.3);border-radius:6px;padding:18px 28px;min-width:280px;margin-top:220px">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:14px">
        <label style="color:#c8d8f0;font-family:monospace;font-size:13px;flex:1">Volume</label>
        <input id="sl-volume" type="range" min="0" max="100" step="1"
          value="${Math.round((save.volume ?? 0.7) * 100)}"
          style="flex:2;accent-color:#ffd23f;cursor:pointer">
        <span id="sl-volume-val" style="color:#ffd23f;font-family:monospace;font-size:13px;width:38px;text-align:right">${Math.round((save.volume ?? 0.7) * 100)}%</span>
      </div>
      <div style="display:flex;align-items:center;gap:12px">
        <label style="color:#c8d8f0;font-family:monospace;font-size:13px;flex:1">Vitesse wagons</label>
        <input id="sl-speed" type="range" min="50" max="200" step="5"
          value="${Math.round((save.wagonSpeedMult ?? 1) * 100)}"
          style="flex:2;accent-color:#7cd647;cursor:pointer">
        <span id="sl-speed-val" style="color:#7cd647;font-family:monospace;font-size:13px;width:38px;text-align:right">${Math.round((save.wagonSpeedMult ?? 1) * 100)}%</span>
      </div>
    </div>`;
  document.body.appendChild(div);

  const slVol = div.querySelector("#sl-volume");
  const slVolVal = div.querySelector("#sl-volume-val");
  const slSpd = div.querySelector("#sl-speed");
  const slSpdVal = div.querySelector("#sl-speed-val");

  slVol.addEventListener("input", () => {
    const v = parseInt(slVol.value) / 100;
    slVolVal.textContent = slVol.value + "%";
    audio.setMasterVolume(v);
    save.volume = v;
    persistSave(save);
  });
  slSpd.addEventListener("input", () => {
    const v = parseInt(slSpd.value) / 100;
    slSpdVal.textContent = slSpd.value + "%";
    gameState.wagonSpeedMult = v;
    save.wagonSpeedMult = v;
    persistSave(save);
  });

  return {
    show() { div.style.display = "flex"; },
    hide() { div.style.display = "none"; },
  };
})();

const fpsBuffer = [];
const fpsState = { lastSec: 0, value: 0 };
const entityState = { count: 0, stamp: 0 };

k.scene("game", () => {
  const tileMap = new Map();
  gameState.skeletons = 0;
  gameState.coins = 0;
  gameState.rides = 0;
  gameState.score = 0;
  gameState.comboCount = 0;
  gameState.comboExpire = 0;
  gameState.milestoneIdx = 0;
  gameState.bulletTimeUntil = 0;

  let _playerConfigs = null;
  let crowdHooks = null;
  const hud = createHUD({
    k, gameState, save, settings, settingsOverlay,
    getCurrentTool: () => selectedTool,
    getPlayerConfigs: () => _playerConfigs,
    fpsBuffer, fpsState, entityState,
    persistSave,
  });
  const { showPopup, inCog, inPlayerBtn, inAutoModeBtn, inBuildTestBtn, inExportBtn, inHelpBtn, toolbarHit } = hud;

  const { placeTile, checkCoinResonance, detectMagnetFields } = createTileSystem({
    k, tileMap, gameState, audio,
    showPopup: (...args) => showPopup(...args),
  });

  const { startDuckLoop } = createDuckSystem({
    k, tileMap, gameState, audio,
    showPopup: (...args) => showPopup(...args),
  });
  startDuckLoop();

  k.loop(1, () => { gameState.magnetFields = detectMagnetFields(); });

  k.add([
    k.pos(0, 0),
    k.z(8),
    {
      draw() {
        for (const f of gameState.magnetFields) {
          const ax = f.a.gridCol * TILE + TILE / 2;
          const ay = f.a.gridRow * TILE + TILE / 2;
          const bx = f.b.gridCol * TILE + TILE / 2;
          const by = f.b.gridRow * TILE + TILE / 2;
          const opacity = 0.3 + Math.sin(k.time() * 3) * 0.2;
          for (let p = 0.08; p < 1; p += 0.12) {
            const x = ax + (bx - ax) * p;
            const y = ay + (by - ay) * p;
            k.drawCircle({ pos: k.vec2(x, y - 7), radius: 2.5, color: k.rgb(180, 100, 220), opacity });
            k.drawCircle({ pos: k.vec2(x, y + 7), radius: 2.5, color: k.rgb(180, 100, 220), opacity });
          }
        }
      },
    },
  ]);

  function launchFirework(x, y, color) {
    if (k.get("particle-firework").length > 60) return;
    for (let i = 0; i < 12; i++) {
      const a = (Math.PI * 2 * i) / 12 + Math.random() * 0.2;
      const sp = 150 + Math.random() * 120;
      k.add([
        k.circle(3 + Math.random() * 2),
        k.pos(x, y),
        k.color(color),
        k.opacity(1),
        k.lifespan(1.5, { fade: 1 }),
        k.z(20),
        "particle-firework",
        { vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, grav: 180 },
      ]);
    }
  }

  function celebrateMilestone(target) {
    audio.combo();
    setTimeout(() => audio.coin(), 200);
    setTimeout(() => audio.combo(), 400);
    const colors = [
      k.rgb(255, 80, 120),
      k.rgb(255, 210, 60),
      k.rgb(100, 230, 255),
      k.rgb(140, 255, 120),
      k.rgb(255, 140, 240),
    ];
    for (let i = 0; i < 4; i++) {
      k.wait(i * 0.25, () => {
        const x = 100 + Math.random() * (WIDTH - 200);
        const y = 100 + Math.random() * 200;
        launchFirework(x, y, colors[i % colors.length]);
      });
    }
    showPopup(WIDTH / 2, HEIGHT / 2, `PALIER ${target}!`, k.rgb(255, 230, 80), 40);
    juice.dirShake(0, 1, 10, 0.2);
  }

  function checkMilestone() {
    while (
      gameState.milestoneIdx < MILESTONES.length &&
      gameState.score >= MILESTONES[gameState.milestoneIdx]
    ) {
      celebrateMilestone(MILESTONES[gameState.milestoneIdx]);
      gameState.milestoneIdx += 1;
    }
  }

  function updatePersistence() {
    if (gameState.score > save.bestScore) save.bestScore = gameState.score;
    save.totalSkeletons = (save.totalSkeletons || 0) + 1;
    persistSave(save);
  }

  function registerKill(x, y, base = 10, vip = false, darkBonus = 0) {
    const now = k.time();
    const prev = gameState.comboCount;
    if (now < gameState.comboExpire) {
      gameState.comboCount = Math.min(gameState.comboCount + 1, 5);
    } else {
      gameState.comboCount = 1;
    }
    gameState.comboExpire = now + COMBO_WINDOW;
    const mult = COMBO_MULTIPLIERS[gameState.comboCount] || 1;
    const btMult = gameState.bulletTimeUntil > now ? 2 : 1;
    const pts = base * mult * btMult * (1 + darkBonus);
    gameState.score += pts;
    if (prev < 5 && gameState.comboCount === 5) {
      triggerApocalypse();
    }
    if (vip) {
      audio.combo();
      showPopup(x, y - 30, `VIP +${pts}!`, k.rgb(255, 230, 80), 28);
    } else if (gameState.comboCount >= 2) {
      audio.combo();
      showPopup(
        x,
        y - 30,
        `x${mult} +${pts}`,
        k.rgb(255, 120, 220),
        20 + gameState.comboCount * 2,
      );
    } else {
      showPopup(x, y - 30, `+${pts}`, k.rgb(255, 180, 60), 22);
    }
    updatePersistence();
    checkMilestone();
    return mult;
  }

  function triggerApocalypse() {
    gameState.bulletTimeUntil = k.time() + 3;
    window.__juice?.hitStop(200);
    if (crowdHooks) crowdHooks.onApocalypse();
    audio.combo();
    setTimeout(() => audio.transform(), 100);
    juice.dirShake(0, 1, 22, 0.35);
    k.add([
      k.rect(WIDTH, HEIGHT),
      k.pos(0, 0),
      k.color(255, 255, 255),
      k.opacity(0.85),
      k.lifespan(0.4, { fade: 0.3 }),
      k.z(100),
    ]);
    showPopup(WIDTH / 2, HEIGHT / 2 - 40, "APOCALYPSE !", k.rgb(255, 80, 80), 60);
    showPopup(WIDTH / 2, HEIGHT / 2 + 30, "x8 COMBO", k.rgb(255, 230, 80), 32);
    const visitors = k.get("visitor").filter((v) => !v.isSkeleton);
    visitors.forEach((v, i) => {
      k.wait(i * 0.1, () => {
        if (!v.exists() || v.isSkeleton) return;
        v.isSkeleton = true;
        v.sprite = "skeleton";
        v.color.r = 255; v.color.g = 255; v.color.b = 255;
        gameState.skeletons += 1;
        gameState.score += 10 * 8;
        juice.dirShake(1, 0, 4, 0.12);
        showPopup(v.pos.x + 14, v.pos.y - 10, "+80", k.rgb(255, 80, 80), 18);
        for (let j = 0; j < 10; j++) {
          const a = (Math.PI * 2 * j) / 10;
          k.add([
            k.circle(3 + Math.random() * 3),
            k.pos(v.pos.x + 14, v.pos.y + 10),
            k.color(k.rgb(255, 80 + Math.random() * 100, 30)),
            k.opacity(1),
            k.lifespan(0.4, { fade: 0.3 }),
            k.z(14),
            { vx: Math.cos(a) * 100, vy: Math.sin(a) * 100 },
          ]);
        }
      });
    });
    for (let i = 0; i < 3; i++) {
      k.wait(0.2 + i * 0.3, () => {
        const colors = [k.rgb(255, 80, 80), k.rgb(255, 210, 60), k.rgb(180, 100, 255)];
        const x = 100 + Math.random() * (WIDTH - 200);
        const y = 80 + Math.random() * 200;
        launchFirework(x, y, colors[i % 3]);
      });
    }
  }

  function registerCoin(x, y) {
    const now = k.time();
    const mult = now < gameState.comboExpire
      ? COMBO_MULTIPLIERS[gameState.comboCount] || 1
      : 1;
    const pts = 5 * mult;
    gameState.score += pts;
    save.totalCoins = (save.totalCoins || 0) + 1;
    if (gameState.score > save.bestScore) save.bestScore = gameState.score;
    persistSave(save);
    showPopup(x, y - 8, `+${pts}`, k.rgb(255, 230, 80), 18);
    checkMilestone();
  }

  const {
    drawWagonBody, spawnWagon, transformToSkeleton,
    reviveFromSkeleton, collectCoin, tryBoardWagon, exitWagon,
  } = createWagonSystem({
    k, tileMap, gameState, audio,
    showPopup: (...args) => showPopup(...args),
    registerKill: (...args) => registerKill(...args),
    registerCoin: (...args) => registerCoin(...args),
    launchFirework: (...args) => launchFirework(...args),
    placeTile,
  });

  for (let i = 0; i < 6; i++) {
    k.add([
      k.sprite("cloud"),
      k.pos(i * 240 + (i % 2) * 60, 60 + (i % 3) * 40),
      k.z(-10),
      k.opacity(0.9),
      "cloud",
      { speed: 6 + (i % 3) * 3 },
    ]);
  }

  k.add([
    k.pos(0, 0),
    k.z(-20),
    {
      draw() {
        for (let i = 0; i < 4; i++) {
          k.drawSprite({ sprite: "hill", pos: k.vec2(i * 330 - 50, GROUND_ROW * TILE - 64) });
        }
      },
    },
  ]);

  const FLAG_COLORS = [
    [230, 60, 60], [60, 180, 230], [255, 210, 63], [140, 220, 100],
    [230, 100, 200], [255, 140, 40], [120, 100, 230], [255, 255, 255],
  ];
  for (let i = 0; i < 10; i++) {
    const fx = 40 + i * 120 + Math.random() * 40;
    const poleH = 60 + Math.random() * 30;
    const poleY = GROUND_ROW * TILE - poleH;
    k.add([
      k.rect(3, poleH),
      k.pos(fx, poleY),
      k.color(k.rgb(80, 70, 60)),
      k.z(-8),
      "flag-pole",
    ]);
    k.add([
      k.circle(3),
      k.pos(fx + 1, poleY),
      k.color(k.rgb(255, 210, 63)),
      k.z(-7),
      "flag-pole",
    ]);
    const col = FLAG_COLORS[i % FLAG_COLORS.length];
    k.add([
      k.rect(22, 14),
      k.pos(fx + 3, poleY + 2),
      k.color(k.rgb(col[0], col[1], col[2])),
      k.z(-7),
      "flag-deco",
      { baseX: fx + 3, baseY: poleY + 2, phase: Math.random() * 6 },
    ]);
  }

  k.onUpdate("flag-deco", (flag) => {
    const w = Math.sin(k.time() * 3 + flag.phase);
    flag.pos.x = flag.baseX + w * 1.5;
    flag.pos.y = flag.baseY + Math.abs(w) * 1;
  });

  k.onUpdate("cloud", (c) => {
    c.pos.x += c.speed * k.dt();
    if (c.pos.x > WIDTH + 100) c.pos.x = -200;
  });

  k.add([
    k.pos(0, 0),
    k.z(-10),
    {
      draw() {
        for (let col = 0; col < COLS; col++) {
          k.drawSprite({ sprite: "ground_top", pos: k.vec2(col * TILE, GROUND_ROW * TILE) });
          for (let row = GROUND_ROW + 1; row < ROWS; row++) {
            k.drawSprite({ sprite: "ground", pos: k.vec2(col * TILE, row * TILE) });
          }
        }
      },
    },
  ]);
  k.add([
    k.rect(WIDTH, (ROWS - GROUND_ROW) * TILE),
    k.pos(0, GROUND_ROW * TILE),
    k.area(),
    k.body({ isStatic: true }),
    k.opacity(0),
    "ground",
  ]);

  const { spawnPlayers, getEntityTile, PLAYER_CONFIGS } = createPlayerSystem({
    k, gameState, audio, tileMap,
    tryBoardWagon: (...args) => tryBoardWagon(...args),
    exitWagon: (...args) => exitWagon(...args),
    spawnWagon: (...args) => spawnWagon(...args),
  });
  _playerConfigs = PLAYER_CONFIGS;

  const activePlayers = spawnPlayers(settings.numPlayers, isMobile);

  k.onKeyPress("1", () => (selectedTool = "lava"));
  k.onKeyPress("2", () => (selectedTool = "rail"));
  k.onKeyPress("3", () => (selectedTool = "erase"));
  k.onKeyPress("4", () => (selectedTool = "rail_up"));
  k.onKeyPress("5", () => (selectedTool = "rail_down"));
  k.onKeyPress("6", () => (selectedTool = "water"));
  k.onKeyPress("7", () => (selectedTool = "boost"));
  k.onKeyPress("8", () => (selectedTool = "coin"));
  k.onKeyPress("9", () => (selectedTool = "trampoline"));
  k.onKeyPress("0", () => (selectedTool = "fan"));
  k.onKeyPress("y", () => (selectedTool = "wheel"));
  k.onKeyPress("c", () => {
    tileMap.forEach((t) => {
      if (t.extras) t.extras.forEach((e) => k.destroy(e));
      k.destroy(t);
    });
    tileMap.clear();
  });
  k.onKeyPress("r", () => { settingsOverlay.hide(); settings.open = false; k.go("game"); });
  k.onKeyPress("x", () => spawnWagon());
  k.onKeyPress("m", () => audio.toggleMute());
  k.onKeyPress(["p", "escape"], () => {
    const root = k.getTreeRoot();
    root.paused = !root.paused;
  });


  function buildDemoCircuit() {
    tileMap.forEach((t) => {
      if (t.extras) t.extras.forEach((e) => k.destroy(e));
      k.destroy(t);
    });
    tileMap.clear();
    placeTile(6, 13, "coin");
    placeTile(8, 13, "coin");
    placeTile(10, 13, "boost");
    placeTile(13, 13, "lava");
    placeTile(14, 13, "lava");
    placeTile(15, 13, "lava");
    placeTile(16, 13, "lava");
    placeTile(18, 13, "coin");
    placeTile(20, 12, "rail_up");
    placeTile(21, 11, "rail");
    placeTile(22, 11, "rail");
    placeTile(23, 11, "coin");
    placeTile(24, 11, "rail");
    placeTile(25, 11, "rail");
    placeTile(26, 12, "rail_down");
    placeTile(28, 13, "trampoline");
    placeTile(31, 13, "water");
    placeTile(32, 13, "water");
    placeTile(34, 13, "lava");
    placeTile(35, 13, "lava");
    placeTile(36, 13, "lava");
    placeTile(3, 8, "portal");
    placeTile(38, 13, "portal");
  }

  const MAX_WAGONS = 3;

  let autoSpawnTimer = null;
  function startAutoMode() {
    if (autoSpawnTimer) return;
    buildDemoCircuit();
    if (k.get("wagon").length === 0) spawnWagon();
    autoSpawnTimer = k.loop(3.2, () => {
      if (k.get("wagon").length < MAX_WAGONS) spawnWagon();
    });
  }
  function stopAutoMode() {
    if (autoSpawnTimer) { autoSpawnTimer.cancel(); autoSpawnTimer = null; }
  }
  if (settings.autoMode) k.wait(0.05, () => startAutoMode());

  let ghostTrainInterval = null;
  function startGhostTrain() {
    if (ghostTrainInterval) return;
    ghostTrainInterval = k.loop(45, () => {
      if (k.get("wagon").length >= MAX_WAGONS) return;
      showPopup(WIDTH / 2, 120, "TRAIN FANTOME !", k.rgb(255, 40, 40), 46);
      audio.transform();
      juice.dirShake(1, 0, 5, 0.2);
      k.wait(2.5, () => {
        if (k.get("wagon").length < MAX_WAGONS) spawnWagon(true);
      });
    });
  }
  k.wait(0.05, () => startGhostTrain());

  let isNight = false;
  const moon = k.add([
    k.circle(24),
    k.pos(WIDTH - 140, 90),
    k.color(k.rgb(255, 250, 220)),
    k.opacity(0),
    k.z(-11),
    "night-deco",
  ]);
  const moonCrater = k.add([
    k.circle(8),
    k.pos(WIDTH - 150, 82),
    k.color(k.rgb(200, 195, 170)),
    k.opacity(0),
    k.z(-10),
    "night-deco",
  ]);
  const nightTint = k.add([
    k.rect(WIDTH, HEIGHT),
    k.pos(0, 0),
    k.color(k.rgb(20, 30, 80)),
    k.opacity(0),
    k.z(-12),
    k.fixed(),
    "night-deco",
  ]);

  const starData = Array.from({ length: 40 }, () => ({
    x: Math.random() * WIDTH,
    y: Math.random() * (GROUND_ROW * TILE - 80) + 20,
    r: 1 + Math.random(),
    twinkle: Math.random() * 10,
    baseOpacity: 0.7 + Math.random() * 0.3,
  }));

  k.onKeyPress("n", () => {
    isNight = !isNight;
    moon.opacity = isNight ? 1 : 0;
    moonCrater.opacity = isNight ? 1 : 0;
    nightTint.opacity = isNight ? 0.35 : 0;
  });

  k.add([
    k.pos(0, 0),
    k.z(-11),
    {
      draw() {
        if (!isNight) return;
        for (const s of starData) {
          const op = s.baseOpacity * (0.5 + Math.sin(k.time() * 2 + s.twinkle) * 0.5);
          k.drawCircle({ pos: k.vec2(s.x, s.y), radius: s.r, color: k.rgb(255, 255, 220), opacity: op });
        }
      },
    },
  ]);


  let audioUnlocked = false;
  function tryUnlockAudio() {
    if (audioUnlocked) return;
    audioUnlocked = true;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      if (ctx.state === "suspended") ctx.resume();
    } catch (e) {}
  }
  k.onKeyPress(() => tryUnlockAudio());

  k.onMousePress("left", () => {
    tryUnlockAudio();
    const m = k.mousePos();
    if (inCog(m)) {
      settings.open = !settings.open;
      settings.open ? settingsOverlay.show() : settingsOverlay.hide();
      audio.place();
      return;
    }
    if (!settings.open) {
      const clickedTool = toolbarHit(m);
      if (clickedTool) {
        selectedTool = clickedTool;
        audio.place();
        return;
      }
    }
    if (settings.open) {
      for (let i = 1; i <= 4; i++) {
        if (inPlayerBtn(m, i)) {
          if (settings.numPlayers !== i) {
            settings.numPlayers = i;
            save.numPlayers = i;
            persistSave(save);
            audio.combo();
            settingsOverlay.hide();
            settings.open = false;
            k.go("game");
          }
          return;
        }
      }
      if (inAutoModeBtn(m)) {
        settings.autoMode = !settings.autoMode;
        save.autoMode = settings.autoMode;
        persistSave(save);
        audio.boost();
        if (settings.autoMode) startAutoMode();
        else stopAutoMode();
        return;
      }
      if (inBuildTestBtn(m)) {
        buildDemoCircuit();
        audio.place();
        settings.open = false;
        settingsOverlay.hide();
        return;
      }
      if (inExportBtn(m)) {
        const code = serializeTiles(tileMap);
        showExportModal(code, (pasted) => {
          loadParkFromCode(pasted);
        });
        return;
      }
      if (inHelpBtn(m)) {
        settings.open = false;
        settingsOverlay.hide();
        showInteractionsModal();
        return;
      }
      return;
    }

    function loadParkFromCode(code) {
      try {
        tileMap.forEach((t) => {
          if (t.extras) t.extras.forEach((e) => k.destroy(e));
          k.destroy(t);
        });
        tileMap.clear();
        deserializeTiles(code, placeTile);
        audio.combo();
        showPopup(WIDTH / 2, 100, "PARC CHARGE !", k.rgb(124, 201, 71), 32);
      } catch (e) {
        showPopup(WIDTH / 2, 100, "CODE INVALIDE", k.rgb(255, 80, 80), 28);
      }
    }
    const w = k.toWorld(k.mousePos());
    const col = Math.floor(w.x / TILE);
    const row = Math.floor(w.y / TILE);
    if (col < 0 || col >= COLS || row < 0 || row >= GROUND_ROW) return;
    placeTile(col, row, selectedTool);
    audio.place();
  });

  let lastPlacedKey = null;

  k.onMouseDown("left", () => {
    if (settings.open) return;
    const screenM = k.mousePos();
    if (inCog(screenM) || toolbarHit(screenM) || screenM.y < 65) return;
    const w = k.toWorld(screenM);
    const col = Math.floor(w.x / TILE);
    const row = Math.floor(w.y / TILE);
    if (col < 0 || col >= COLS || row < 0 || row >= GROUND_ROW) return;
    const key = gridKey(col, row);
    if (key === lastPlacedKey) return;
    if (tileMap.has(key) && tileMap.get(key).tileType === selectedTool) return;
    placeTile(col, row, selectedTool);
    lastPlacedKey = key;
  });

  k.onMouseRelease("left", () => {
    lastPlacedKey = null;
  });

  k.onMouseDown("right", () => {
    const m = k.toWorld(k.mousePos());
    const col = Math.floor(m.x / TILE);
    const row = Math.floor(m.y / TILE);
    placeTile(col, row, "erase");
  });
  const VISITOR_TINTS = [
    [255, 180, 180], [180, 255, 180], [180, 180, 255], [255, 255, 180],
    [255, 180, 255], [180, 255, 255], [255, 200, 150], [200, 180, 255],
  ];

  function spawnVisitor() {
    const speed = 40 + Math.random() * 40;
    const isVIP = Math.random() < 0.12;
    const tint = VISITOR_TINTS[Math.floor(Math.random() * VISITOR_TINTS.length)];
    const v = k.add([
      k.sprite("human"),
      k.pos(-40, (GROUND_ROW - 3) * TILE),
      k.area({ shape: new k.Rect(k.vec2(2, 4), 24, 40) }),
      k.body(),
      k.anchor("topleft"),
      k.color(k.rgb(tint[0], tint[1], tint[2])),
      k.z(5),
      "visitor",
      { walkSpeed: speed, isSkeleton: false, isVIP, crown: null, tint },
    ]);
    if (isVIP) {
      const hat = k.add([
        k.rect(18, 10),
        k.pos(v.pos.x + 5, v.pos.y - 6),
        k.color(k.rgb(20, 20, 20)),
        k.outline(1, k.rgb(100, 80, 0)),
        k.z(6),
        "visitor-hat",
      ]);
      const hatBrim = k.add([
        k.rect(24, 3),
        k.pos(v.pos.x + 2, v.pos.y + 2),
        k.color(k.rgb(20, 20, 20)),
        k.outline(1, k.rgb(100, 80, 0)),
        k.z(6),
        "visitor-hat",
      ]);
      const hatBand = k.add([
        k.rect(18, 2),
        k.pos(v.pos.x + 5, v.pos.y + 0),
        k.color(k.rgb(255, 220, 50)),
        k.z(7),
        "visitor-hat",
      ]);
      v.crown = [hat, hatBrim, hatBand];
    }
    v.onUpdate(() => {
      const vSpeed = gameState.bulletTimeUntil > k.time() ? v.walkSpeed * 0.3 : v.walkSpeed;
      v.move(vSpeed, 0);
      if (v.crown) {
        v.crown[0].pos.x = v.pos.x + 5;
        v.crown[0].pos.y = v.pos.y - 6;
        v.crown[1].pos.x = v.pos.x + 2;
        v.crown[1].pos.y = v.pos.y + 2;
        v.crown[2].pos.x = v.pos.x + 5;
        v.crown[2].pos.y = v.pos.y + 0;
      }
      const pCol = Math.floor((v.pos.x + 14) / TILE);
      const pRowFeet = Math.floor((v.pos.y + 42) / TILE);
      const tile = tileMap.get(gridKey(pCol, pRowFeet));
      if (tile && tile.tileType === "lava" && !v.isSkeleton) {
        v.isSkeleton = true;
        v.sprite = "skeleton";
        v.color.r = 255; v.color.g = 255; v.color.b = 255;
        gameState.skeletons += 1;
        audio.transform();
        juice.dirShake(1, 0, v.isVIP ? 7 : 3, 0.15);
        if (crowdHooks) crowdHooks.onSkeletonSpawn(k.vec2(v.pos.x + 14, v.pos.y));
        registerKill(v.pos.x + 14, v.pos.y, v.isVIP ? 50 : 10, v.isVIP);
        const cx = v.pos.x + 14;
        const cy = v.pos.y + 10;
        for (let i = 0; i < 12; i++) {
          const a = (Math.PI * 2 * i) / 12;
          k.add([
            k.circle(3 + Math.random() * 3),
            k.pos(cx, cy),
            k.color(k.rgb(255, 150 + Math.random() * 80, 40)),
            k.opacity(1),
            k.lifespan(0.5, { fade: 0.3 }),
            k.z(14),
            "particle",
            { vx: Math.cos(a) * 80, vy: Math.sin(a) * 80 - 30 },
          ]);
        }
      }
      if (tile && tile.tileType === "water" && v.isSkeleton) {
        v.isSkeleton = false;
        v.sprite = "human";
        gameState.skeletons = Math.max(0, gameState.skeletons - 1);
        audio.splash();
        for (let i = 0; i < 8; i++) {
          const a = (Math.PI * 2 * i) / 8;
          k.add([
            k.circle(2 + Math.random() * 2),
            k.pos(v.pos.x + 14, v.pos.y + 20),
            k.color(k.rgb(100, 180, 230)),
            k.opacity(0.9),
            k.lifespan(0.5, { fade: 0.3 }),
            k.z(10),
            "particle-grav",
            { vx: Math.cos(a) * 60, vy: Math.sin(a) * 60 - 40, grav: 180 },
          ]);
        }
      }
      if (tile && tile.tileType === "ice") {
        if (!(v._iceCd > k.time())) {
          v._iceCd = k.time() + 0.15;
          v._iceUntil = k.time() + 0.4;
          v._iceSpeed = v.walkSpeed * 1.6;
        }
      }
      if (v._iceUntil && k.time() < v._iceUntil) {
        v.move(v._iceSpeed - v.walkSpeed, 0);
      }
      if (v.pos.x > WIDTH + 40) {
        if (v.crown) v.crown.forEach((e) => k.destroy(e));
        k.destroy(v);
      }
    });
    return v;
  }

  k.loop(4, () => {
    if (k.get("visitor").length < 5) spawnVisitor();
  });

  k.loop(0.08, () => {
    const wagons = k.get("wagon");
    for (let i = 0; i < wagons.length; i++) {
      for (let j = i + 1; j < wagons.length; j++) {
        const a = wagons[i];
        const b = wagons[j];
        if ((a.bumpCd || 0) > k.time() || (b.bumpCd || 0) > k.time()) continue;
        const dx = b.pos.x - a.pos.x;
        const dy = b.pos.y - a.pos.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 45 && dist > 5) {
          const sign = dx > 0 ? 1 : -1;
          if (a.vel) a.vel.x = -sign * 280;
          if (b.vel) b.vel.x = sign * 280;
          if (a.vel) a.vel.y = -120;
          if (b.vel) b.vel.y = -120;
          a.bumpCd = k.time() + 0.9;
          b.bumpCd = k.time() + 0.9;
          const mx = (a.pos.x + b.pos.x) / 2 + 30;
          const my = (a.pos.y + b.pos.y) / 2 + 15;
          window.__juice?.hitStop(60);
          gameState.score += 50;
          showPopup(mx, my - 20, "CRASH! +50", k.rgb(255, 220, 60), 22);
          juice.dirShake(dx, 0, 8, 0.15);
          audio.combo();
          for (let p = 0; p < 18; p++) {
            const ang = (Math.PI * 2 * p) / 18;
            k.add([
              k.rect(3, 3),
              k.pos(mx, my),
              k.color(k.rgb(255, 230, 80)),
              k.opacity(1),
              k.lifespan(0.6, { fade: 0.4 }),
              k.z(14),
              "particle-grav",
              { vx: Math.cos(ang) * 200, vy: Math.sin(ang) * 200 - 50, grav: 300 },
            ]);
          }
        }
      }
    }
  });

  let cachedMagnets = [];
  k.loop(0.1, () => {
    cachedMagnets = [];
    for (const [, m] of tileMap) {
      if (m.tileType === "magnet") cachedMagnets.push(m);
    }
  });

  k.loop(0.05, () => {
    if (cachedMagnets.length === 0) return;
    for (const c of k.get("coin")) {
      if (c.magnetLocked) continue;
      for (const m of cachedMagnets) {
        if (!m.exists()) continue;
        const mx = m.pos.x + TILE / 2;
        const my = m.pos.y + TILE / 2;
        const dx = mx - c.pos.x;
        const dy = my - c.pos.y;
        const d = Math.hypot(dx, dy);
        if (d < 4 * TILE && d > 4) {
          const force = 180 * (1 - d / (4 * TILE));
          c.pos.x += (dx / d) * force * 0.05;
          c.pos.y += (dy / d) * force * 0.05;
        } else if (d <= 4) {
          c.magnetLocked = true;
          collectCoin(c);
          for (let i = 0; i < 8; i++) {
            const a = (Math.PI * 2 * i) / 8;
            k.add([
              k.circle(2),
              k.pos(mx, my),
              k.color(k.rgb(210, 80, 60)),
              k.opacity(1),
              k.lifespan(0.4, { fade: 0.3 }),
              k.z(14),
              "particle",
              { vx: Math.cos(a) * 80, vy: Math.sin(a) * 80 },
            ]);
          }
          break;
        }
      }
    }
  });

  k.onUpdate("particle", (p) => {
    p.pos.x += p.vx * k.dt();
    p.pos.y += p.vy * k.dt();
  });

  k.loop(0.1, () => {
    const PARTICLE_TAGS = ["particle", "particle-grav", "particle-x", "particle-debris", "particle-firework", "fan-puff", "steam"];
    const CAP_PER_TYPE = { "particle-grav": 20, "particle-firework": 24, "particle": 20 };
    for (const [tag, cap] of Object.entries(CAP_PER_TYPE)) {
      const batch = k.get(tag);
      if (batch.length > cap) batch.slice(0, batch.length - cap).forEach(p => k.destroy(p));
    }
    let total = 0;
    for (const tag of PARTICLE_TAGS) total += k.get(tag).length;
    if (total <= 60) return;
    const excess = total - 60;
    let destroyed = 0;
    for (const tag of PARTICLE_TAGS) {
      if (destroyed >= excess) break;
      const batch = k.get(tag);
      for (const p of batch) {
        if (destroyed >= excess) break;
        k.destroy(p);
        destroyed++;
      }
    }
  });

  k.loop(0.25, () => {
    for (const [key, t] of tileMap) {
      if (t.tileType !== "lava") continue;
      const neighbors = [
        [t.gridCol - 1, t.gridRow],
        [t.gridCol + 1, t.gridRow],
        [t.gridCol, t.gridRow - 1],
        [t.gridCol, t.gridRow + 1],
      ];
      for (const [nc, nr] of neighbors) {
        const n = tileMap.get(gridKey(nc, nr));
        if (!n || n.tileType !== "water") continue;
        const sx = (t.pos.x + n.pos.x) / 2 + TILE / 2;
        const sy = (t.pos.y + n.pos.y) / 2 + TILE / 2;
        for (let i = 0; i < 3; i++) {
          k.add([
            k.circle(3 + Math.random() * 3),
            k.pos(sx + (Math.random() - 0.5) * 20, sy),
            k.color(k.rgb(235, 240, 245)),
            k.opacity(0.55),
            k.lifespan(1.1, { fade: 0.8 }),
            k.z(6),
            "steam",
            { vy: -40 - Math.random() * 30, vx: (Math.random() - 0.5) * 15 },
          ]);
        }
      }
    }
  });

  k.onUpdate("steam", (s) => {
    s.pos.y += s.vy * k.dt();
    s.pos.x += s.vx * k.dt();
    s.vy *= 0.97;
  });

  k.onUpdate("lava", (t) => {
    const f = Math.floor(k.time() * 3 + t.gridCol * 0.5) % 2;
    if (f !== t.lavaPhase) {
      t.lavaPhase = f;
      t.sprite = f === 0 ? "lava1" : "lava2";
    }
  });

  k.loop(0.18, () => {
    const lavas = k.get("lava");
    if (lavas.length === 0) return;
    const cap = Math.min(lavas.length, 4);
    for (let i = 0; i < cap; i++) {
      const t = lavas[Math.floor(Math.random() * lavas.length)];
      if (!t || !t.exists()) continue;
      k.add([
        k.circle(2 + Math.random() * 2),
        k.pos(t.pos.x + 4 + Math.random() * 24, t.pos.y),
        k.color(255, 200 + Math.random() * 55, 60),
        k.opacity(0.9),
        k.lifespan(0.9, { fade: 0.5 }),
        k.z(5),
        k.move(k.UP, 30 + Math.random() * 40),
        "particle",
      ]);
    }
  });

  k.onUpdate("water", (t) => {
    const f = Math.floor(k.time() * 2 + t.gridCol * 0.3) % 2;
    if (f !== t.waterPhase) {
      t.waterPhase = f;
      t.sprite = f === 0 ? "water1" : "water2";
    }
  });

  k.onUpdate("boost", (t) => {
    t.angle = Math.sin(k.time() * 8 + t.gridCol) * 3;
  });

  k.onUpdate("coin", (t) => {
    if (t.magnetLocked) return;
    const btActive = gameState.bulletTimeUntil > k.time();
    const bobAmp = btActive ? 8 : 4;
    const bobFreq = btActive ? 6 : 3;
    t.pos.y = t.baseY + Math.sin(k.time() * bobFreq + t.gridCol * 0.4) * bobAmp;
    if (btActive) {
      const pScale = 1 + Math.sin(k.time() * 10 + t.gridCol) * 0.18;
      t.scale = k.vec2(pScale, pScale);
      t.color = k.rgb(255, 210 + Math.sin(k.time() * 8) * 40, 30);
    } else {
      t.scale = k.vec2(1, 1);
      t.color = k.rgb(255, 210, 0);
    }
    if (t.extras && t.extras[0] && t.extras[0].exists()) {
      const inner = t.extras[0];
      inner.pos.x = t.pos.x;
      inner.pos.y = t.pos.y;
      inner.scale = k.vec2(Math.abs(Math.cos(k.time() * 4 + t.gridCol * 0.4)), 1);
    }
  });

  k.onUpdate("particle-grav", (p) => {
    p.pos.x += p.vx * k.dt();
    p.pos.y += p.vy * k.dt();
    p.vy += p.grav * k.dt();
  });

  k.onUpdate("particle-x", (p) => {
    p.pos.x += p.vx * k.dt();
  });

  k.onUpdate("particle-debris", (p) => {
    p.pos.x += p.vx * k.dt();
    p.pos.y += p.vy * k.dt();
    p.vy += 400 * k.dt();
  });

  k.onUpdate("ghost", (g) => {
    g.pos.x += g.vx * k.dt();
    g.pos.y += g.vy * k.dt();
    g.vy += 100 * k.dt();
    if (g.pos.y > (GROUND_ROW - 2) * TILE) {
      g.pos.y = (GROUND_ROW - 2) * TILE;
      g.vy = 0;
    }
    g.opacity = Math.max(0, 0.55 - (k.time() - g.born) / 4);
    if (k.time() - g.born > 3.5 || g.pos.x < -60) k.destroy(g);
  });

  k.onUpdate("particle-firework", (p) => {
    p.pos.x += p.vx * k.dt();
    p.pos.y += p.vy * k.dt();
    p.vy += p.grav * k.dt();
    p.vx *= 0.98;
  });

  k.onUpdate("fan-puff", (p) => {
    p.pos.y += p.vy * k.dt();
    p.pos.x += p.vx * k.dt();
    p.vy *= 0.98;
  });

  const crowdSystem = createCrowdSystem({ k, gameState });
  crowdHooks = crowdSystem.setup();

  hud.setup();
});