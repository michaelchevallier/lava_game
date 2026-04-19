import kaplay from "kaplay";
import {
  TILE, COLS, ROWS, GROUND_ROW, WIDTH, HEIGHT,
  SPEED, JUMP, WAGON_JUMP,
  COMBO_WINDOW, COMBO_MULTIPLIERS, MILESTONES, WAGON_THEMES,
  TOOLBAR_ORDER, TB_ICON, TB_GAP, TB_TOTAL_W, TB_START_X, TB_Y,
  COG_X, COG_Y, COG_R,
  gridKey,
} from "./constants.js";
import { audio } from "./audio.js";
import { loadAllSprites } from "./sprites.js";
import { loadSave, persistSave, serializeTiles, deserializeTiles, showExportModal } from "./serializer.js";
import { createTileSystem } from "./tiles.js";
import { createWagonSystem } from "./wagons.js";

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

k.setGravity(1600);

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
};


const fpsBuffer = [];
let fpsLastSec = 0;
let fpsValue = 0;
let entityCount = 0;
let entityCountStamp = 0;

k.scene("game", () => {
  const tileMap = new Map();
  gameState.skeletons = 0;
  gameState.coins = 0;
  gameState.rides = 0;
  gameState.score = 0;
  gameState.comboCount = 0;
  gameState.comboExpire = 0;
  gameState.milestoneIdx = 0;

  const { placeTile, checkCoinResonance } = createTileSystem({
    k, tileMap, gameState, audio,
    showPopup: (...args) => showPopup(...args),
  });

  function launchFirework(x, y, color) {
    for (let i = 0; i < 24; i++) {
      const a = (Math.PI * 2 * i) / 24 + Math.random() * 0.1;
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
    k.shake(10);
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
    const pts = base * mult * (1 + darkBonus);
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
    audio.combo();
    setTimeout(() => audio.transform(), 100);
    k.shake(22);
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
        gameState.skeletons += 1;
        gameState.score += 10 * 8;
        k.shake(4);
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

  for (let i = 0; i < 4; i++) {
    k.add([
      k.sprite("hill"),
      k.pos(i * 330 - 50, GROUND_ROW * TILE - 64),
      k.z(-9),
    ]);
  }

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

  for (let col = 0; col < COLS; col++) {
    k.add([
      k.sprite("ground_top"),
      k.pos(col * TILE, GROUND_ROW * TILE),
      k.area(),
      k.body({ isStatic: true }),
      "ground",
    ]);
    for (let row = GROUND_ROW + 1; row < ROWS; row++) {
      k.add([
        k.sprite("ground"),
        k.pos(col * TILE, row * TILE),
        k.area(),
        k.body({ isStatic: true }),
        "ground",
      ]);
    }
  }

  function createPlayer(opts, mobileP1 = false) {
    const p = k.add([
      k.sprite(opts.sprite),
      k.pos(opts.x, (GROUND_ROW - 3) * TILE),
      k.area({ shape: new k.Rect(k.vec2(2, 4), 24, 40) }),
      k.body(),
      k.anchor("topleft"),
      k.z(6),
      "player",
      {
        facing: "right",
        isSkeleton: false,
        ridingWagon: null,
        normalSprite: opts.sprite,
        skelSprite: opts.skelSprite,
        playerName: opts.name,
      },
    ]);

    k.onKeyDown(opts.keys.left, () => {
      if (p.ridingWagon) return;
      p.move(-SPEED, 0);
      if (p.facing !== "left") {
        p.flipX = true;
        p.facing = "left";
      }
    });
    k.onKeyDown(opts.keys.right, () => {
      if (p.ridingWagon) return;
      p.move(SPEED, 0);
      if (p.facing !== "right") {
        p.flipX = false;
        p.facing = "right";
      }
    });
    k.onKeyPress(opts.keys.jump, () => {
      if (p.ridingWagon) {
        if (p.ridingWagon.isGrounded()) {
          p.ridingWagon.jump(WAGON_JUMP);
          audio.jump();
        }
        return;
      }
      if (p.isGrounded()) {
        p.jump(JUMP);
        audio.jump();
      }
    });
    k.onKeyPress(opts.keys.board, () => {
      if (p.ridingWagon) {
        exitWagon(p);
      } else {
        tryBoardWagon(p);
      }
    });

    p.onUpdate(() => {
      if (p.ridingWagon) return;
      const pCol = Math.floor((p.pos.x + 14) / TILE);
      const pRowFeet = Math.floor((p.pos.y + 42) / TILE);
      const key = gridKey(pCol, pRowFeet);
      const tile = tileMap.get(key);
      if (tile && tile.tileType === "lava" && Math.random() < 0.4) {
        k.add([
          k.circle(2 + Math.random() * 3),
          k.pos(p.pos.x + 6 + Math.random() * 16, p.pos.y + 38),
          k.color(255, 200, 80),
          k.opacity(0.9),
          k.lifespan(0.6, { fade: 0.4 }),
          k.z(10),
          k.move(k.UP, 50 + Math.random() * 40),
        ]);
      }
    });

    if (mobileP1) {
      const mi = window.__mobileInput;
      let prevJump = false;
      let prevWagon = false;
      k.onUpdate(() => {
        if (mi.left && !p.ridingWagon) {
          p.move(-SPEED, 0);
          if (p.facing !== "left") { p.flipX = true; p.facing = "left"; }
        }
        if (mi.right && !p.ridingWagon) {
          p.move(SPEED, 0);
          if (p.facing !== "right") { p.flipX = false; p.facing = "right"; }
        }
        if (mi.jumpPressed && !prevJump) {
          if (p.ridingWagon) {
            if (p.ridingWagon.isGrounded()) { p.ridingWagon.jump(WAGON_JUMP); audio.jump(); }
          } else if (p.isGrounded()) {
            p.jump(JUMP);
            audio.jump();
          }
        }
        if (mi.wagonPressed && !prevWagon) {
          spawnWagon();
        }
        prevJump = mi.jumpPressed;
        prevWagon = mi.wagonPressed;
      });
    }

    return p;
  }

  const PLAYER_CONFIGS = [
    {
      x: 80,
      sprite: "player",
      skelSprite: "player_skel",
      name: "Mario",
      color: k.rgb(230, 57, 70),
      keys: { left: ["a", "q"], right: "d", jump: ["space", "z"], board: "e" },
    },
    {
      x: 180,
      sprite: "pika",
      skelSprite: "pika_skel",
      name: "Pika",
      color: k.rgb(255, 210, 63),
      keys: { left: "j", right: "l", jump: "i", board: "o" },
    },
    {
      x: 280,
      sprite: "luigi",
      skelSprite: "luigi_skel",
      name: "Luigi",
      color: k.rgb(124, 201, 71),
      keys: { left: "left", right: "right", jump: "up", board: "enter" },
    },
    {
      x: 380,
      sprite: "toad",
      skelSprite: "toad_skel",
      name: "Toad",
      color: k.rgb(255, 76, 109),
      keys: { left: "f", right: "h", jump: "t", board: "g" },
    },
  ];

  const activePlayers = [];
  for (let i = 0; i < settings.numPlayers; i++) {
    activePlayers.push(createPlayer(PLAYER_CONFIGS[i], i === 0 && isMobile));
  }

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
  k.onKeyPress("c", () => {
    tileMap.forEach((t) => {
      if (t.extras) t.extras.forEach((e) => k.destroy(e));
      k.destroy(t);
    });
    tileMap.clear();
  });
  k.onKeyPress("r", () => k.go("game"));
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
      k.shake(5);
      k.wait(2.5, () => {
        if (k.get("wagon").length < MAX_WAGONS) spawnWagon(true);
      });
    });
  }
  k.wait(0.05, () => startGhostTrain());

  let isNight = false;
  const stars = [];
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

  for (let i = 0; i < 40; i++) {
    const s = k.add([
      k.circle(1 + Math.random()),
      k.pos(Math.random() * WIDTH, Math.random() * (GROUND_ROW * TILE - 80) + 20),
      k.color(k.rgb(255, 255, 220)),
      k.opacity(0),
      k.z(-10),
      "night-deco",
      { twinkle: Math.random() * 10 },
    ]);
    stars.push(s);
  }

  k.onKeyPress("n", () => {
    isNight = !isNight;
    const targetOpacity = isNight ? 1 : 0;
    for (const s of stars) {
      s.opacity = targetOpacity * (0.7 + Math.random() * 0.3);
    }
    moon.opacity = targetOpacity;
    moonCrater.opacity = targetOpacity;
    nightTint.opacity = targetOpacity * 0.35;
  });

  k.onUpdate(() => {
    if (isNight) {
      for (const s of stars) {
        s.opacity = 0.5 + Math.sin(k.time() * 2 + s.twinkle) * 0.5;
      }
    }
  });


  function inCog(m) {
    const dx = m.x - COG_X;
    const dy = m.y - COG_Y;
    return dx * dx + dy * dy < COG_R * COG_R;
  }

  function inPlayerBtn(m, i) {
    const bx = WIDTH / 2 - 200 + 20 + (i - 1) * 92;
    const by = HEIGHT / 2 - 60;
    return m.x > bx && m.x < bx + 70 && m.y > by && m.y < by + 70;
  }

  function inAutoModeBtn(m) {
    const bx = WIDTH / 2 - 120;
    const by = HEIGHT / 2 + 50;
    return m.x > bx && m.x < bx + 240 && m.y > by && m.y < by + 40;
  }

  function inBuildTestBtn(m) {
    const bx = WIDTH / 2 - 120;
    const by = HEIGHT / 2 + 100;
    return m.x > bx && m.x < bx + 240 && m.y > by && m.y < by + 36;
  }

  function inExportBtn(m) {
    const bx = WIDTH / 2 - 120;
    const by = HEIGHT / 2 + 146;
    return m.x > bx && m.x < bx + 240 && m.y > by && m.y < by + 36;
  }


  function toolbarHit(m) {
    if (m.y < TB_Y || m.y > TB_Y + TB_ICON) return null;
    for (let i = 0; i < TOOLBAR_ORDER.length; i++) {
      const x = TB_START_X + i * (TB_ICON + TB_GAP);
      if (m.x >= x && m.x <= x + TB_ICON) return TOOLBAR_ORDER[i].tool;
    }
    return null;
  }

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
        return;
      }
      if (inExportBtn(m)) {
        const code = serializeTiles(tileMap);
        showExportModal(code, (pasted) => {
          loadParkFromCode(pasted);
        });
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
  function drawTextOutlined(opts) {
    const base = { ...opts };
    const outlineColor = opts.outlineColor || k.rgb(0, 0, 0);
    const thickness = opts.outlineThickness || 2;
    const origColor = opts.color;
    const offsets = [
      [-thickness, -thickness], [thickness, -thickness],
      [-thickness, thickness], [thickness, thickness],
    ];
    for (const [dx, dy] of offsets) {
      k.drawText({
        ...base,
        pos: k.vec2(opts.pos.x + dx, opts.pos.y + dy),
        color: outlineColor,
      });
    }
    k.drawText({ ...base, color: origColor });
  }

  function showPopup(x, y, text, color, size = 20) {
    const p = k.add([
      k.text(text, { size }),
      k.pos(x, y),
      k.anchor("center"),
      k.color(color),
      k.opacity(1),
      k.lifespan(1, { fade: 0.6 }),
      k.z(20),
      { vy: -70, vx: (Math.random() - 0.5) * 30 },
    ]);
    p.onUpdate(() => {
      p.pos.y += p.vy * k.dt();
      p.pos.x += p.vx * k.dt();
      p.vy *= 0.97;
    });
    return p;
  }

  function spawnVisitor() {
    const speed = 40 + Math.random() * 40;
    const isVIP = Math.random() < 0.12;
    const v = k.add([
      k.sprite("human"),
      k.pos(-40, (GROUND_ROW - 3) * TILE),
      k.area({ shape: new k.Rect(k.vec2(2, 4), 24, 40) }),
      k.body(),
      k.anchor("topleft"),
      k.z(5),
      "visitor",
      { walkSpeed: speed, isSkeleton: false, isVIP, crown: null },
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
      v.move(v.walkSpeed, 0);
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
        gameState.skeletons += 1;
        audio.transform();
        k.shake(v.isVIP ? 7 : 3);
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
          gameState.score += 50;
          showPopup(mx, my - 20, "CRASH! +50", k.rgb(255, 220, 60), 22);
          k.shake(6);
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
    let total = 0;
    for (const tag of PARTICLE_TAGS) total += k.get(tag).length;
    if (total <= 300) return;
    const excess = total - 300;
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
    t.pos.y = t.baseY + Math.sin(k.time() * 3 + t.gridCol * 0.4) * 4;
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

  const C_BLACK = k.rgb(0, 0, 0);
  const C_GOLD = k.rgb(255, 210, 63);
  const C_DARK_BG = k.rgb(25, 35, 55);
  const C_TOOLBAR_BORDER = k.rgb(80, 100, 130);
  const C_TOOLBAR_KEY_DIM = k.rgb(150, 170, 200);
  const C_TOOLBAR_LABEL_DIM = k.rgb(180, 200, 220);
  const C_SCORE = k.rgb(255, 230, 80);
  const C_STATS = k.rgb(230, 230, 230);
  const C_RECORD = k.rgb(180, 200, 255);

  const TOOL_LABELS = {
    lava: "LAVE",
    rail: "RAIL --",
    erase: "GOMME",
    rail_up: "RAIL /",
    rail_down: "RAIL Dn",
    water: "EAU",
    coin: "PIECE",
    boost: "BOOST",
    trampoline: "TRAMPOLINE",
    fan: "VENTILATEUR",
    portal: "PORTAIL",
    ice: "GLACE",
    magnet: "AIMANT",
    bridge: "PONT",
  };
  const TOOL_COLORS = {
    lava: k.rgb(255, 120, 60),
    rail: k.rgb(220, 220, 230),
    erase: k.rgb(200, 200, 200),
    rail_up: k.rgb(150, 220, 255),
    rail_down: k.rgb(150, 220, 255),
    water: k.rgb(80, 180, 230),
    coin: k.rgb(255, 210, 50),
    boost: k.rgb(255, 210, 63),
    trampoline: k.rgb(255, 100, 160),
    fan: k.rgb(180, 220, 240),
    portal: k.rgb(200, 150, 240),
    ice: k.rgb(200, 235, 255),
    magnet: k.rgb(220, 80, 60),
    bridge: k.rgb(160, 100, 40),
  };

  k.onDraw(() => {

    k.drawRect({
      pos: k.vec2(0, 0),
      width: WIDTH,
      height: 62,
      color: C_BLACK,
      opacity: 0.7,
    });
    k.drawRect({
      pos: k.vec2(0, 62),
      width: WIDTH,
      height: 2,
      color: C_GOLD,
    });
    drawTextOutlined({
      text: "Outil:",
      size: 18,
      pos: k.vec2(12, 8),
      color: k.WHITE,
    });
    drawTextOutlined({
      text: TOOL_LABELS[selectedTool],
      size: 18,
      pos: k.vec2(78, 8),
      color: TOOL_COLORS[selectedTool],
    });
    drawTextOutlined({
      text: `SCORE ${gameState.score}`,
      size: 22,
      pos: k.vec2(WIDTH - 320, 6),
      color: C_SCORE,
    });
    drawTextOutlined({
      text: `Squelettes ${gameState.skeletons}  Pieces ${gameState.coins}  Rates ${gameState.missed || 0}`,
      size: 14,
      pos: k.vec2(WIDTH - 320, 32),
      color: C_STATS,
    });
    drawTextOutlined({
      text: `Record ${save.bestScore}`,
      size: 13,
      pos: k.vec2(WIDTH - 320, 50),
      color: C_RECORD,
    });

    const now = performance.now();
    fpsBuffer.push(now);
    while (fpsBuffer.length && fpsBuffer[0] < now - 1000) fpsBuffer.shift();
    if (now - fpsLastSec > 250) {
      fpsValue = fpsBuffer.length;
      fpsLastSec = now;
    }
    if (now - entityCountStamp > 500) {
      entityCount = k.get("*").length;
      entityCountStamp = now;
    }
    const fpsColor = fpsValue >= 55
      ? k.rgb(124, 220, 80)
      : fpsValue >= 35
      ? k.rgb(255, 200, 40)
      : k.rgb(255, 80, 80);
    drawTextOutlined({
      text: `${fpsValue} FPS  E:${entityCount}`,
      size: 13,
      pos: k.vec2(12, 46),
      color: fpsColor,
    });

    for (let i = 0; i < TOOLBAR_ORDER.length; i++) {
      const item = TOOLBAR_ORDER[i];
      const bx = TB_START_X + i * (TB_ICON + TB_GAP);
      const by = TB_Y;
      const isSelected = selectedTool === item.tool;
      k.drawRect({
        pos: k.vec2(bx, by),
        width: TB_ICON,
        height: TB_ICON,
        color: isSelected ? C_GOLD : C_DARK_BG,
      });
      k.drawRect({
        pos: k.vec2(bx, by),
        width: TB_ICON,
        height: 3,
        color: isSelected ? k.WHITE : C_TOOLBAR_BORDER,
      });
      const cx = bx + TB_ICON / 2;
      const cy = by + TB_ICON / 2;
      if (item.tool === "lava") {
        k.drawRect({
          pos: k.vec2(bx + 8, by + 12),
          width: TB_ICON - 16,
          height: TB_ICON - 20,
          color: k.rgb(255, 107, 28),
        });
      } else if (item.tool === "water") {
        k.drawRect({
          pos: k.vec2(bx + 8, by + 12),
          width: TB_ICON - 16,
          height: TB_ICON - 20,
          color: k.rgb(79, 184, 232),
        });
      } else if (item.tool === "coin") {
        k.drawCircle({ pos: k.vec2(cx, cy + 3), radius: 13, color: k.rgb(255, 210, 50) });
        k.drawCircle({ pos: k.vec2(cx, cy + 3), radius: 7, color: k.rgb(200, 150, 0) });
      } else if (item.tool === "rail") {
        k.drawRect({
          pos: k.vec2(bx + 6, cy - 2),
          width: TB_ICON - 12,
          height: 5,
          color: k.rgb(210, 210, 225),
        });
        k.drawRect({
          pos: k.vec2(bx + 8, cy + 6),
          width: 4,
          height: 8,
          color: k.rgb(100, 60, 30),
        });
        k.drawRect({
          pos: k.vec2(bx + TB_ICON - 12, cy + 6),
          width: 4,
          height: 8,
          color: k.rgb(100, 60, 30),
        });
      } else if (item.tool === "rail_up" || item.tool === "rail_down") {
        const angle = item.tool === "rail_up" ? -45 : 45;
        k.drawRect({
          pos: k.vec2(cx, cy + 3),
          width: TB_ICON - 14,
          height: 5,
          anchor: "center",
          angle,
          color: k.rgb(210, 210, 225),
        });
      } else if (item.tool === "boost") {
        k.drawRect({
          pos: k.vec2(bx + 6, by + 10),
          width: TB_ICON - 12,
          height: TB_ICON - 16,
          color: k.rgb(255, 210, 63),
        });
        k.drawText({
          text: ">>",
          size: 22,
          pos: k.vec2(cx, cy + 2),
          anchor: "center",
          color: k.rgb(20, 20, 20),
        });
      } else if (item.tool === "trampoline") {
        k.drawRect({
          pos: k.vec2(bx + 6, cy - 2),
          width: TB_ICON - 12,
          height: 5,
          color: k.rgb(255, 80, 130),
        });
        k.drawRect({
          pos: k.vec2(bx + 10, cy + 4),
          width: 3,
          height: 10,
          color: k.rgb(200, 200, 215),
        });
        k.drawRect({
          pos: k.vec2(bx + TB_ICON - 13, cy + 4),
          width: 3,
          height: 10,
          color: k.rgb(200, 200, 215),
        });
      } else if (item.tool === "bridge") {
        k.drawRect({
          pos: k.vec2(bx + 6, cy),
          width: TB_ICON - 12,
          height: 6,
          color: k.rgb(160, 100, 40),
        });
        k.drawRect({
          pos: k.vec2(bx + 6, cy + 6),
          width: TB_ICON - 12,
          height: 4,
          color: k.rgb(120, 70, 30),
        });
        k.drawRect({
          pos: k.vec2(bx + TB_ICON / 2 - 2, cy - 6),
          width: 3,
          height: 18,
          color: k.rgb(100, 60, 20),
        });
      } else if (item.tool === "magnet") {
        k.drawRect({
          pos: k.vec2(bx + 10, by + 12),
          width: 4,
          height: TB_ICON - 20,
          color: k.rgb(40, 40, 40),
        });
        k.drawRect({
          pos: k.vec2(bx + TB_ICON - 14, by + 12),
          width: 4,
          height: TB_ICON - 20,
          color: k.rgb(40, 40, 40),
        });
        k.drawRect({
          pos: k.vec2(bx + 10, by + 12),
          width: 4,
          height: 4,
          color: k.rgb(210, 80, 60),
        });
        k.drawRect({
          pos: k.vec2(bx + TB_ICON - 14, by + 12),
          width: 4,
          height: 4,
          color: k.rgb(210, 80, 60),
        });
        k.drawRect({
          pos: k.vec2(bx + 10, by + TB_ICON - 14),
          width: TB_ICON - 20,
          height: 4,
          color: k.rgb(40, 40, 40),
        });
      } else if (item.tool === "ice") {
        k.drawRect({
          pos: k.vec2(bx + 8, by + 10),
          width: TB_ICON - 16,
          height: TB_ICON - 18,
          color: k.rgb(180, 230, 255),
        });
        k.drawRect({
          pos: k.vec2(bx + 12, cy - 6),
          width: TB_ICON - 24,
          height: 2,
          color: k.rgb(255, 255, 255),
          opacity: 0.9,
        });
        k.drawRect({
          pos: k.vec2(bx + 12, cy + 4),
          width: (TB_ICON - 24) / 2,
          height: 2,
          color: k.rgb(255, 255, 255),
          opacity: 0.7,
        });
      } else if (item.tool === "portal") {
        k.drawCircle({
          pos: k.vec2(cx - 7, cy),
          radius: TB_ICON / 2 - 10,
          color: k.rgb(80, 220, 240),
          outline: { width: 1, color: k.rgb(200, 250, 255) },
        });
        k.drawCircle({
          pos: k.vec2(cx + 7, cy),
          radius: TB_ICON / 2 - 10,
          color: k.rgb(240, 80, 220),
          outline: { width: 1, color: k.rgb(255, 200, 250) },
        });
      } else if (item.tool === "fan") {
        k.drawCircle({
          pos: k.vec2(cx, cy),
          radius: TB_ICON / 2 - 6,
          color: k.rgb(180, 210, 230),
        });
        const rot = k.time() * 4;
        for (let b = 0; b < 4; b++) {
          const a = rot + (Math.PI / 2) * b;
          k.drawRect({
            pos: k.vec2(cx, cy),
            width: TB_ICON - 14,
            height: 4,
            anchor: "center",
            angle: (a * 180) / Math.PI,
            color: k.rgb(100, 140, 180),
          });
        }
        k.drawCircle({ pos: k.vec2(cx, cy), radius: 3, color: k.rgb(40, 40, 50) });
      } else if (item.tool === "erase") {
        k.drawText({
          text: "X",
          size: 28,
          pos: k.vec2(cx, cy + 2),
          anchor: "center",
          color: k.rgb(220, 80, 80),
        });
      }
      k.drawText({
        text: item.key,
        size: 10,
        pos: k.vec2(bx + TB_ICON - 4, by + 3),
        anchor: "topright",
        color: isSelected ? k.rgb(30, 30, 40) : C_TOOLBAR_KEY_DIM,
      });
      k.drawText({
        text: item.label,
        size: 9,
        pos: k.vec2(cx, by + TB_ICON - 10),
        anchor: "center",
        color: isSelected ? k.rgb(30, 30, 40) : C_TOOLBAR_LABEL_DIM,
      });
    }

    k.drawCircle({
      pos: k.vec2(COG_X, COG_Y),
      radius: COG_R,
      color: k.rgb(40, 40, 55),
    });
    k.drawCircle({
      pos: k.vec2(COG_X, COG_Y),
      radius: COG_R - 4,
      color: k.rgb(255, 210, 63),
    });
    k.drawCircle({
      pos: k.vec2(COG_X, COG_Y),
      radius: 6,
      color: k.rgb(40, 40, 55),
    });
    const cogSpin = k.time() * 0.5;
    for (let i = 0; i < 6; i++) {
      const a = cogSpin + (Math.PI * 2 * i) / 6;
      k.drawRect({
        pos: k.vec2(
          COG_X + Math.cos(a) * (COG_R - 2) - 4,
          COG_Y + Math.sin(a) * (COG_R - 2) - 4,
        ),
        width: 8,
        height: 8,
        color: k.rgb(255, 210, 63),
      });
    }

    if (!settings.open && !k.getTreeRoot().paused) {
      const sm = k.mousePos();
      if (sm.y > 65 && sm.y < TB_Y - 10 && !inCog(sm)) {
        const wm = k.toWorld(sm);
        const col = Math.floor(wm.x / TILE);
        const row = Math.floor(wm.y / TILE);
        if (col >= 0 && col < COLS && row >= 0 && row < GROUND_ROW) {
          const ghostColor =
            selectedTool === "lava"
              ? k.rgb(255, 107, 28)
              : selectedTool === "water"
                ? k.rgb(79, 184, 232)
                : selectedTool === "coin"
                  ? k.rgb(255, 210, 50)
                  : selectedTool === "boost"
                    ? k.rgb(255, 210, 63)
                    : selectedTool === "trampoline"
                      ? k.rgb(255, 80, 130)
                      : selectedTool === "erase"
                        ? k.rgb(220, 80, 80)
                        : k.rgb(210, 210, 225);
          k.drawRect({
            pos: k.vec2(col * TILE, row * TILE),
            width: TILE,
            height: TILE,
            color: ghostColor,
            opacity: 0.3 + Math.sin(k.time() * 6) * 0.1,
          });
          k.drawRect({
            pos: k.vec2(col * TILE, row * TILE),
            width: TILE,
            height: 2,
            color: ghostColor,
          });
          k.drawRect({
            pos: k.vec2(col * TILE, row * TILE + TILE - 2),
            width: TILE,
            height: 2,
            color: ghostColor,
          });
          k.drawRect({
            pos: k.vec2(col * TILE, row * TILE),
            width: 2,
            height: TILE,
            color: ghostColor,
          });
          k.drawRect({
            pos: k.vec2(col * TILE + TILE - 2, row * TILE),
            width: 2,
            height: TILE,
            color: ghostColor,
          });
        }
      }
    }

    const isPaused = k.getTreeRoot().paused;
    if (isPaused) {
      k.drawRect({
        pos: k.vec2(0, 0),
        width: WIDTH,
        height: HEIGHT,
        color: k.rgb(0, 0, 0),
        opacity: 0.7,
      });
      k.drawText({
        text: "PAUSE",
        size: 80,
        pos: k.vec2(WIDTH / 2, HEIGHT / 2 - 30),
        anchor: "center",
        color: k.rgb(255, 210, 63),
      });
      k.drawText({
        text: "Appuie sur P ou ECHAP pour reprendre",
        size: 18,
        pos: k.vec2(WIDTH / 2, HEIGHT / 2 + 40),
        anchor: "center",
        color: k.rgb(220, 220, 220),
      });
    }

    if ((save.plays || 0) === 0 && !isPaused && !settings.open) {
      const alpha = Math.max(0, 1 - (k.time() / 10));
      if (alpha > 0.1) {
        k.drawRect({
          pos: k.vec2(WIDTH / 2 - 300, HEIGHT / 2 - 100),
          width: 600,
          height: 200,
          color: k.rgb(0, 0, 0),
          opacity: alpha * 0.8,
        });
        k.drawRect({
          pos: k.vec2(WIDTH / 2 - 300, HEIGHT / 2 - 100),
          width: 600,
          height: 4,
          color: k.rgb(255, 210, 63),
          opacity: alpha,
        });
        k.drawText({
          text: "BIENVENUE !",
          size: 28,
          pos: k.vec2(WIDTH / 2, HEIGHT / 2 - 75),
          anchor: "center",
          color: k.rgb(255, 230, 80),
          opacity: alpha,
        });
        k.drawText({
          text: "Clique sur les outils en bas pour construire.",
          size: 15,
          pos: k.vec2(WIDTH / 2, HEIGHT / 2 - 40),
          anchor: "center",
          color: k.WHITE,
          opacity: alpha,
        });
        k.drawText({
          text: "Clique sur le terrain pour poser. X = Spawn wagon.",
          size: 15,
          pos: k.vec2(WIDTH / 2, HEIGHT / 2 - 15),
          anchor: "center",
          color: k.WHITE,
          opacity: alpha,
        });
        k.drawText({
          text: "D = Mode auto. Engrenage en haut a droite pour les options.",
          size: 15,
          pos: k.vec2(WIDTH / 2, HEIGHT / 2 + 10),
          anchor: "center",
          color: k.WHITE,
          opacity: alpha,
        });
      } else {
        save.plays = 1;
        persistSave(save);
      }
    }

    if (settings.open) {
      k.drawRect({
        pos: k.vec2(0, 0),
        width: WIDTH,
        height: HEIGHT,
        color: k.rgb(0, 0, 0),
        opacity: 0.75,
      });
      const panelW = 440;
      const panelH = 380;
      const panelX = WIDTH / 2 - panelW / 2;
      const panelY = HEIGHT / 2 - panelH / 2;
      k.drawRect({
        pos: k.vec2(panelX, panelY),
        width: panelW,
        height: panelH,
        color: k.rgb(30, 40, 60),
      });
      k.drawRect({
        pos: k.vec2(panelX, panelY),
        width: panelW,
        height: 4,
        color: k.rgb(255, 210, 63),
      });
      k.drawText({
        text: "PARAMETRES",
        size: 30,
        pos: k.vec2(WIDTH / 2, panelY + 25),
        anchor: "top",
        color: k.rgb(255, 230, 80),
      });
      k.drawText({
        text: "Nombre de joueurs",
        size: 18,
        pos: k.vec2(WIDTH / 2, panelY + 70),
        anchor: "top",
        color: k.WHITE,
      });
      for (let i = 1; i <= 4; i++) {
        const bx = panelX + 20 + (i - 1) * 92;
        const by = panelY + 120;
        const isSelected = settings.numPlayers === i;
        const cfg = PLAYER_CONFIGS[i - 1];
        k.drawRect({
          pos: k.vec2(bx, by),
          width: 70,
          height: 70,
          color: isSelected ? cfg.color : k.rgb(50, 60, 85),
        });
        k.drawRect({
          pos: k.vec2(bx, by),
          width: 70,
          height: 4,
          color: isSelected ? k.rgb(255, 255, 255) : k.rgb(90, 110, 140),
        });
        k.drawText({
          text: String(i),
          size: 36,
          pos: k.vec2(bx + 35, by + 32),
          anchor: "center",
          color: isSelected ? k.rgb(20, 20, 30) : k.WHITE,
        });
        k.drawText({
          text: cfg.name,
          size: 11,
          pos: k.vec2(bx + 35, by + 82),
          anchor: "top",
          color: isSelected ? cfg.color : k.rgb(180, 200, 220),
        });
      }
      const autoBx = WIDTH / 2 - 120;
      const autoBy = HEIGHT / 2 + 50;
      k.drawRect({
        pos: k.vec2(autoBx, autoBy),
        width: 240,
        height: 40,
        color: settings.autoMode ? k.rgb(124, 201, 71) : k.rgb(60, 80, 110),
      });
      k.drawText({
        text: settings.autoMode ? "MODE DEMO: ON" : "MODE DEMO: OFF",
        size: 18,
        pos: k.vec2(WIDTH / 2, autoBy + 20),
        anchor: "center",
        color: k.WHITE,
      });
      const testBx = WIDTH / 2 - 120;
      const testBy = HEIGHT / 2 + 100;
      k.drawRect({
        pos: k.vec2(testBx, testBy),
        width: 240,
        height: 36,
        color: k.rgb(70, 90, 140),
      });
      k.drawText({
        text: "Construire circuit test",
        size: 16,
        pos: k.vec2(WIDTH / 2, testBy + 18),
        anchor: "center",
        color: k.WHITE,
      });
      const expBx = WIDTH / 2 - 120;
      const expBy = HEIGHT / 2 + 146;
      k.drawRect({
        pos: k.vec2(expBx, expBy),
        width: 240,
        height: 36,
        color: k.rgb(186, 120, 220),
      });
      k.drawText({
        text: "Sauvegarder / Charger parc",
        size: 15,
        pos: k.vec2(WIDTH / 2, expBy + 18),
        anchor: "center",
        color: k.WHITE,
      });
      k.drawText({
        text: "(M) Son  (N) Nuit  (R) Reset  (P) Pause",
        size: 12,
        pos: k.vec2(WIDTH / 2, panelY + panelH - 40),
        anchor: "top",
        color: k.rgb(180, 200, 220),
      });
      k.drawText({
        text: "Clic sur l'engrenage pour fermer",
        size: 11,
        pos: k.vec2(WIDTH / 2, panelY + panelH - 18),
        anchor: "top",
        color: k.rgb(140, 160, 190),
      });
    }
    if (gameState.comboCount >= 2 && k.time() < gameState.comboExpire) {
      const remaining = gameState.comboExpire - k.time();
      const mult = COMBO_MULTIPLIERS[gameState.comboCount] || 1;
      const pulse = 1 + Math.sin(k.time() * 12) * 0.08;
      drawTextOutlined({
        text: `COMBO x${mult}`,
        size: 32 * pulse,
        pos: k.vec2(WIDTH / 2, 90),
        anchor: "center",
        color: k.rgb(255, 120, 220),
        outlineThickness: 3,
      });
      k.drawRect({
        pos: k.vec2(WIDTH / 2 - 80, 115),
        width: 160 * (remaining / COMBO_WINDOW),
        height: 4,
        color: k.rgb(255, 120, 220),
      });
    }
    k.drawText({
      text: "(1)Lave (2)Rail (4)Up (5)Dn (6)Eau (7)Boost (8)Piece (9)Trampo (3)Gomme",
      size: 12,
      pos: k.vec2(180, 10),
      color: k.rgb(220, 220, 220),
    });
    k.drawText({
      text: "MARIO A/D/Esp/E  PIKA J/L/I/O  LUIGI fleches+Enter  TOAD F/H/T/G",
      size: 12,
      pos: k.vec2(12, 30),
      color: k.rgb(255, 210, 63),
    });
    k.drawText({
      text: "(X) Wagon  (C) Vider  (R) Reset    (Dans le wagon, saute pour faire sauter le wagon)",
      size: 12,
      pos: k.vec2(12, 46),
      color: k.rgb(180, 220, 255),
    });
  });
});
