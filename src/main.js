import kaplay from "kaplay";
import {
  TILE, COLS, ROWS, GROUND_ROW, WIDTH, HEIGHT,
  COMBO_WINDOW, COMBO_MULTIPLIERS, MILESTONES,
  gridKey,
  WORLD_COLS, WORLD_WIDTH, MODE_CONFIG,
} from "./constants.js";
import { audio } from "./audio.js";
import { loadAllSprites } from "./sprites.js";
import { loadSave, persistSave } from "./serializer.js";
import { ensureVipToday } from "./contracts.js";
import { createTileSystem } from "./tiles.js";
import { createWagonSystem } from "./wagons.js";
import { createPlayerSystem } from "./players.js";
import { createHUD, setupHtmlHud } from "./hud.js";
import { createDuckSystem } from "./ducks.js";
import { showInteractionsModal } from "./help-modal.js";
import { createCrowdSystem } from "./crowd.js";
import { createJuice } from "./juice.js";
import { createSpectresSystem } from "./spectres.js";
import { createAchievements } from "./achievements.js";
import { createSplash } from "./splash.js";
import { createTutorial } from "./tutorial.js";
import { createConstellationSystem } from "./constellation.js";
import { createSettingsModal } from "./settings-modal.js";
import { createGroundSystem } from "./ground.js";
import { createCinematicSystem } from "./cinematic.js";
import { createTierSystem } from "./tiers.js";
import { createSkySystem } from "./sky.js";
import { createStations } from "./stations.js";
import { createBalloonSystem } from "./balloons.js";
import { createSkullStand } from "./skull-stand.js";
import { createVisitorSystem } from "./visitor.js";
import { createGCSystem } from "./gc.js";
import { createVisitorQuestSystem } from "./visitor-quests.js";
import { createCoinThiefSystem } from "./coin-thief.js";
import { createWeatherSystem } from "./weather.js";
import { createMinigames } from "./minigames.js";
import { createCelebrationSystem } from "./celebration.js";
import { createRaceSystem } from "./race.js";
import { createRouter } from "./router.js";
import { createCampaignSystem } from "./campaign.js";
import { showCampaignResult } from "./campaign-result.js";
import { createCampaignMenu } from "./campaign-menu.js";
import { createRunSystem, RUN_DURATION } from "./run.js";
import { showRunResult } from "./run-result.js";
import { showPauseMenu, hidePauseMenu } from "./pause-menu.js";
import { createSceneOverlays } from "./scene-overlays.js";
import { createSceneDecor } from "./scene-decor.js";
import { createSandboxSetup } from "./sandbox-setup.js";
import { attachParticleAndTileUpdates } from "./particle-systems.js";
import { createParadeQTE } from "./parade-qte.js";
import { createReparationExpress } from "./reparation-express.js";
import { createBossGoret } from "./boss-goret.js";

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
const entityCounts = { particle: 0 };
window.__juice = juice;
window.__k = k;
window.__entityCounts = entityCounts;
window.__getStats = () => {
  const tags = ["wagon","visitor","passenger","tile","particle","particle-grav","particle-x","particle-debris","particle-firework","fan-puff","steam","ghost","wagon-part","flag-deco","cloud","magnet-spark","coin","lava","water","boost","trampoline","portal","fan","ice","magnet","bridge","wheel","wheel-coin","duck","duck-part","crowd"];
  const out = { total: k.get("*").length };
  for (const t of tags) out[t] = k.get(t).length;
  return out;
};

let splashRef = null;
let campaignMenuRef = null;
function startLevel(levelId) {
  router.enter({ mode: "campaign", levelId });
  try { k.go("game"); } catch (e) { console.error("scene start failed", e); }
}
function openCampaignMenu() {
  campaignMenuRef?.show();
}
loadAllSprites(k).then(() => {
  const splash = createSplash({ save, persistSave, settings, onStart: (info) => {
    const mode = info?.mode || "sandbox";
    if (mode === "campaign") {
      openCampaignMenu();
      return;
    }
    if (mode === "run") {
      router.enter({ mode: "run", numPlayers: 1, avatars: info?.avatars || save.avatars });
      try { k.go("game"); } catch (e) { console.error("scene start failed", e); }
      return;
    }
    router.enter({ mode, numPlayers: info?.numPlayers || 1, avatars: info?.avatars || save.avatars, contractEntry: info?.contractEntry || null });
    try { k.go("game"); } catch (e) { console.error("scene start failed", e); }
  }});
  splashRef = splash;
  window.__splash = splash;
  const menu = createCampaignMenu({
    save,
    onSelectLevel: (id) => startLevel(id),
    onBack: () => splash.show(),
  });
  campaignMenuRef = menu;
  window.__campaignMenu = menu;
  const recent = save.lastPlayed && (Date.now() - save.lastPlayed < 120000);
  if (recent) {
    router.enter({ mode: "sandbox", numPlayers: save.numPlayers || 2, avatars: save.avatars });
    try { k.go("game"); } catch (e) { console.error("scene start failed", e); }
  } else {
    splash.show();
  }
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
ensureVipToday(save, persistSave);
const settings = {
  open: false,
  numPlayers: save.numPlayers || 2,
  autoMode: save.autoMode || false,
};

const router = createRouter({ mode: "sandbox", numPlayers: save.numPlayers || 2 });
window.__router = router;

const gameState = {
  skeletons:0, coins:0, rides:0, score:0, comboCount:0, comboExpire:0,
  milestoneIdx:0,
  wagonSpeedMult: save.wagonSpeedMult ?? 1, zoom: save.zoom ?? 0.5,
  magnetFields:[], geysers:[], lastConstellationAt:0, constellationActive:false,
  metronomes:[], scoreMultiplier:1, scoreMultiplierUntil:0, iceCrowns:[],
};

audio.setMasterVolume(save.volume ?? 0.7);

const settingsModal = createSettingsModal({
  save,
  persistSave,
  settings,
  audio,
  gameState,
  onAction: (name, payload) => {
    if (name === "changeNumPlayers") {
      audio.combo?.();
      k.go("game");
    }
    if (name === "home") {
      router.enter({ mode: "menu" });
      document.getElementById("campaign-result")?.remove();
      document.getElementById("run-result")?.remove();
      document.getElementById("level-intro")?.remove();
      window.__splash?.show?.();
    }
    if (name === "buildTest") buildTestCircuitRef?.();
    if (name === "export") exportActionRef?.();
    if (name === "help") showInteractionsModal?.();
    if (name === "carnet") spectresRef?.showCarnet?.();
    if (name === "resetScore") {
      save.bestScore = 0;
      save.totalSkeletons = 0;
      persistSave(save);
    }
    if (name === "toggleDemo") toggleDemoRef?.();
    if (name === "toggleNight") toggleNightRef?.();
    if (name === "unlockAll") window.__tiers?.unlockAll?.();
    if (name === "resetPark") resetParkRef?.();
    if (name === "zoom") {
      try { k.camScale(payload); } catch (e) {}
    }
  },
});

let spectresRef = null;
let buildTestCircuitRef = null;
let exportActionRef = null;
let toggleDemoRef = null;
let toggleNightRef = null;
let resetParkRef = null;

const fpsBuffer = [];
const fpsState = { lastSec: 0, value: 0 };
const entityState = { count: 0, stamp: 0 };

k.scene("game", () => {
  const cfg = MODE_CONFIG[router.get().mode] || MODE_CONFIG.sandbox;
  window.__contract = null;
  // Fix: systems from previous scene survive in window.__X refs (KAPLAY tears
  // down their entities/loops but not the global handles). Un mode suivant
  // pouvait lire une poignée morte ou héritée d'un autre mode.
  window.__tiers = null; window.__weather = null; window.__balloons = null;
  window.__coinThief = null; window.__minigames = null; window.__vquests = null;
  window.__race = null; window.__reparation = null; window.__skullStand = null;
  window.__bossGoret = null; window.__parade = null;
  for (const id of ["campaign-result", "run-result", "level-intro"]) {
    document.getElementById(id)?.remove();
  }
  const tileMap = new Map();
  Object.assign(gameState, {
    skeletons:0, coins:0, rides:0, score:0, comboCount:0, comboExpire:0,
    milestoneIdx:0, lastTilePlaced:k.time(),
    tilesPlacedThisGame:0, trampolinesThisGame:0, vipStreak:0, portalUses:0,
    _ducksCaught:0, lastConstellationAt:0,
    constellationActive:false, sessionSkeletons:0,
    maintenanceBonusUntil:0, scoreMultiplier:1, scoreMultiplierUntil:0,
    _coinStreak:0, _lastCoinAt:0, balloonsPopped:0, missed:0,
    magnetFields:[], geysers:[], iceCrowns:[], iceRinks:[],
    lavaTriangles:[], magnetPortals:[], metronomes:[],
  });

  entityCounts.particle = 0;
  k.onAdd("particle", () => { entityCounts.particle++; });
  k.onDestroy("particle", () => { entityCounts.particle--; });
  // Apply persisted zoom (or default 0.5 = vue large)
  try { k.camScale(gameState.zoom || 0.5); } catch (e) {}
  let _playerConfigs = null;
  let crowdHooks = null;
  let tutorial = null;
  const hud = createHUD({
    k, gameState, save, settings,
    getCurrentTool: () => selectedTool,
    getPlayerConfigs: () => _playerConfigs,
    fpsBuffer, fpsState, entityState,
    persistSave,
  });
  const { showPopup } = hud;

  const { celebrateMilestone, checkMilestone, launchFirework } = createCelebrationSystem({
    k, gameState, audio, juice, showPopup: (...args) => showPopup(...args), WIDTH, HEIGHT, MILESTONES,
  });

  setupHtmlHud({
    getCurrentTool: () => selectedTool, gameState, save, settings, k,
    onToolClick: (tool) => {
      if (window.__tiers && !window.__tiers.isUnlocked(tool)) {
        showPopup?.(WIDTH / 2, 80, `VERROUILLE - completez les objectifs Tier ${window.__tiers.getCurrentTier() + 1}`, k.rgb(255, 80, 80), 18);
        return;
      }
      selectedTool = tool;
    },
    onCogClick: () => {
      if (settingsModal.isVisible()) { settings.open = false; settingsModal.hide(); }
      else { settings.open = true; settingsModal.show(); }
    },
    getTiers: () => window.__tiers,
  });

  const spectres = createSpectresSystem({ save, persistSave, audio, showPopup, k, WIDTH });
  spectresRef = spectres;
  window.__spectres = spectres;
  createAchievements({ k, spectres, audio });

  const cinematic = createCinematicSystem({ k, audio, WIDTH, HEIGHT });
  window.__cinematic = cinematic;
  cinematic.reset();

  const { placeTile, checkCoinResonance, detectMagnetFields, detectGeysers, detectIceRinks, detectMagnetPortals, detectMetronomes, detectLavaTriangles, detectIceCrowns } = createTileSystem({
    k, tileMap, gameState, audio, entityCounts,
    showPopup: (...args) => showPopup(...args),
  });

  const { startDuckLoop } = createDuckSystem({
    k, tileMap, gameState, audio,
    showPopup: (...args) => showPopup(...args),
  });
  startDuckLoop();

  k.loop(1, () => { gameState.magnetFields = detectMagnetFields(); });
  k.loop(0.5, () => {
    const newG = detectGeysers();
    if (newG.length > 0 && (gameState.geysers?.length || 0) === 0) {
      window.__tiers?.onGeyser?.();
    }
    gameState.geysers = newG;
  });
  gameState.iceRinks = [];
  k.loop(0.5, () => { gameState.iceRinks = detectIceRinks(); });
  gameState.magnetPortals = [];
  k.loop(0.5, () => {
    const newMP = detectMagnetPortals();
    if (newMP.length > 0 && (gameState.magnetPortals?.length || 0) === 0) {
      window.__tiers?.onVortex?.();
    }
    gameState.magnetPortals = newMP;
  });
  k.loop(0.5, () => { gameState.metronomes = detectMetronomes(); });
  gameState.lavaTriangles = [];
  k.loop(0.5, () => { gameState.lavaTriangles = detectLavaTriangles(); });
  k.loop(0.5, () => { gameState.iceCrowns = detectIceCrowns(); });

  k.loop(0.5, () => constellation.check());

  createSceneOverlays({ k, gameState, entityCounts, audio, showPopup, TILE });

  function updatePersistence() {
    if (gameState.score > save.bestScore) {
      cinematic.play("newrecord", "NOUVEAU RECORD");
      save.bestScore = gameState.score;
    }
    if (!save.heroes) save.heroes = { mario: 0, pika: 0, luigi: 0, toad: 0 };
    const activeAvatars = [save.avatars?.p1, (settings.numPlayers || 1) >= 2 && save.avatars?.p2].filter(Boolean);
    for (const avId of activeAvatars) { if (gameState.score > (save.heroes[avId] || 0)) save.heroes[avId] = gameState.score; }
    save.totalSkeletons = (save.totalSkeletons || 0) + 1;
    gameState.sessionSkeletons += 1;
    if (gameState.sessionSkeletons === 100) cinematic.play("100souls", "100 AMES");
    persistSave(save);
    if (save.totalSkeletons >= 1) spectres.unlock("first_skel");
    if (save.totalSkeletons >= 10) spectres.unlock("ten_skel");
    if (save.totalSkeletons >= 100) spectres.unlock("hundred_skel");
    window.__tiers?.onSkeleton(); window.__tiers?.onSkeletonCumul(save.totalSkeletons);
    window.__campaign?.progress?.("skeleton"); window.__contract?.progress?.("skeleton");
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
    const btMult = 1;
    const metroMult = (gameState.scoreMultiplier > 1 && now < gameState.scoreMultiplierUntil) ? gameState.scoreMultiplier : 1;
    const pts = base * mult * btMult * metroMult * (1 + darkBonus);
    gameState.score += pts;
    if (prev < 5 && gameState.comboCount === 5) {
      triggerApocalypse();
    }
    if (vip) {
      gameState.vipStreak = (gameState.vipStreak || 0) + 1;
      audio.combo();
      showPopup(x, y - 30, `VIP +${pts}!`, k.rgb(255, 230, 80), 28);
    } else if (gameState.comboCount >= 2) {
      gameState.vipStreak = 0;
      audio.combo();
      showPopup(
        x,
        y - 30,
        `x${mult} +${pts}`,
        k.rgb(255, 120, 220),
        20 + gameState.comboCount * 2,
      );
    } else {
      gameState.vipStreak = 0;
      showPopup(x, y - 30, `+${pts}`, k.rgb(255, 180, 60), 22);
    }
    updatePersistence();
    checkMilestone();
    return mult;
  }

  function triggerApocalypse() {
    window.__tiers?.onApocalypse?.();
    cinematic.play("apocalypse", "APOCALYPSE !");
    spectres.unlock("apocalypse");
    window.__campaign?.progress?.("apocalypse"); window.__contract?.progress?.("apocalypse");
    save.apocalypseCount = (save.apocalypseCount || 0) + 1;
    persistSave(save);
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
    const metroMult = (gameState.scoreMultiplier > 1 && now < gameState.scoreMultiplierUntil) ? gameState.scoreMultiplier : 1;
    const pts = 5 * mult * metroMult;
    gameState.score += pts;
    save.totalCoins = (save.totalCoins || 0) + 1;
    if (gameState.score > save.bestScore) save.bestScore = gameState.score;
    persistSave(save);
    if (save.totalCoins >= 10) spectres.unlock("coins_10");
    if (save.totalCoins >= 50) spectres.unlock("coins_50");
    if (save.totalCoins >= 200) spectres.unlock("coins_200");
    if (save.totalCoins >= 1000) spectres.unlock("coins_1000");
    window.__tiers?.onCoin();
    window.__campaign?.progress?.("coin"); window.__contract?.progress?.("coin");
    showPopup(x, y - 8, `+${pts}`, k.rgb(255, 230, 80), 18);

    // Coin streak: 5 coins in <2s → +50 bonus + golden flash
    if (now - (gameState._lastCoinAt || 0) < 2) {
      gameState._coinStreak = (gameState._coinStreak || 1) + 1;
    } else {
      gameState._coinStreak = 1;
    }
    gameState._lastCoinAt = now;
    if (gameState._coinStreak === 5) {
      gameState.score += 50;
      audio.combo();
      showPopup(WIDTH / 2, 240, "PLUIE D'OR ! +50", k.rgb(255, 215, 0), 28);
      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * Math.PI * 2;
        const sp = 100 + Math.random() * 100;
        k.add([
          k.circle(3),
          k.pos(x, y),
          k.color(k.rgb(255, 220, 60)),
          k.opacity(1),
          k.lifespan(1, { fade: 0.7 }),
          k.z(20),
          "particle-firework",
          { vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 20, grav: 80 },
        ]);
      }
      gameState._coinStreak = 0;
    }
    checkMilestone();
  }

  const paradeRef = { trigger: null };

  const {
    drawWagonBody, spawnWagon, transformToSkeleton, reviveFromSkeleton,
    collectCoin, tryBoardWagon, exitWagon, tryAutoBoardVisitor,
  } = createWagonSystem({
    k, tileMap, gameState, audio, entityCounts, save,
    showPopup: (...args) => showPopup(...args),
    registerKill: (...args) => registerKill(...args),
    registerCoin: (...args) => registerCoin(...args),
    launchFirework: (...args) => launchFirework(...args),
    placeTile,
    onSkeletonTransform: () => { if (tutorial) tutorial.notifyFirstSkeleton(); },
    triggerParade: (w) => paradeRef.trigger?.(w),
  });

  const constellation = createConstellationSystem({
    k, tileMap, gameState, audio, entityCounts,
    showPopup: (...args) => showPopup(...args),
    checkMilestone: (...args) => checkMilestone(...args),
    drawWagonBody, juice,
    WIDTH, HEIGHT, TILE, GROUND_ROW,
  });

  createSceneDecor({ k, WIDTH, HEIGHT, TILE, GROUND_ROW });

  const groundSystem = createGroundSystem({ k, gameState, audio });
  groundSystem.initColliders();

  k.add([k.pos(0, 0), k.z(-10), { draw() { groundSystem.drawGround(); } }]);

  createStations({ k, WORLD_WIDTH, TILE, GROUND_ROW });

  const { spawnPlayers, getEntityTile, PLAYER_CONFIGS } = createPlayerSystem({
    k, gameState, audio, tileMap,
    tryBoardWagon: (...args) => tryBoardWagon(...args),
    exitWagon: (...args) => exitWagon(...args),
    spawnWagon: (...args) => { spawnWagon(...args); if (tutorial) tutorial.notifyWagonSpawned(); window.__tiers?.onWagonSpawn(); window.__contract?.onWagonSpawned?.(); },
  });
  _playerConfigs = PLAYER_CONFIGS;

  const activePlayers = spawnPlayers(settings.numPlayers, isMobile, save.avatars || {});
  if (isMobile) spectres.unlock("mobile");

  const paradeSystem = createParadeQTE({
    k, audio, gameState,
    showPopup: (...args) => showPopup(...args),
    getActivePlayers: () => activePlayers,
  });
  paradeRef.trigger = paradeSystem.triggerFromWagon;
  window.__parade = paradeSystem;

  if (router.get().mode !== "campaign") {
    const reparation = createReparationExpress({
      k, audio, gameState,
      showPopup: (...args) => showPopup(...args),
      getActivePlayers: () => activePlayers,
      tileMap,
    });
    window.__reparation = reparation;
  }

  {
    const bossGoret = createBossGoret({
      k, audio, gameState, juice,
      showPopup: (...args) => showPopup(...args),
      placeTile, tileMap,
      getActivePlayers: () => activePlayers,
      getWagons: () => k.get("wagon"),
      isCampaign: () => router.get().mode === "campaign",
    });
    window.__bossGoret = bossGoret;
  }

  let raceSystem = null;
  if (cfg.enableRace) {
    raceSystem = createRaceSystem({
      k, gameState, settings, audio, juice, showPopup: (...args) => showPopup(...args),
      spawnWagon, exitWagon,
      getActivePlayers: () => activePlayers,
      WORLD_WIDTH, TILE, GROUND_ROW, WIDTH, HEIGHT,
    });
    window.__race = raceSystem;
    k.onKeyPress("f2", () => raceSystem.start());
    k.onUpdate(() => raceSystem.check());
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
  // Touches outils — éviter conflits avec touches joueurs :
  // (Mario A/Q=left, Mario E=board, Pika L=right, Pika O=board)
  k.onKeyPress("y", () => (selectedTool = "wheel"));
  k.onKeyPress("k", () => (selectedTool = "sol"));
  // L retiré (conflit Pika right), B retiré (conflit éventuel) — utiliser la toolbar HTML
  k.onKeyPress("c", () => {
    tileMap.forEach((t) => {
      if (t.extras) t.extras.forEach((e) => k.destroy(e));
      k.destroy(t);
    });
    tileMap.clear();
  });
  k.onKeyPress("r", () => {
    settingsModal.hide();
    settings.open = false;
    k.go("game");
  });
  k.onKeyPress("x", () => {
    const c = window.__campaign?.getCurrent?.();
    if (c && !window.__campaign.canSpawnWagon()) {
      showPopup(WIDTH / 2, 100, "Plus de wagons disponibles", k.rgb(255, 180, 80), 22);
      return;
    }
    spawnWagon();
    if (tutorial) tutorial.notifyWagonSpawned();
    window.__tiers?.onWagonSpawn();
    window.__campaign?.onWagonSpawned?.();
    window.__contract?.onWagonSpawned?.();
  });

  // Respawn player(s) au centre de l'écran (dépanne si tombé hors map)
  k.onKeyPress(",", () => {
    const players = k.get("player");
    const cx = WIDTH / 2;
    const cy = (GROUND_ROW - 4) * TILE;
    let i = 0;
    for (const p of players) {
      p.pos.x = cx - 30 + i * 60;
      p.pos.y = cy;
      if (p.vel) { p.vel.x = 0; p.vel.y = 0; }
      i++;
    }
    if (players.length > 0) {
      audio.boost?.();
      showPopup(WIDTH / 2, 80, "RESPAWN !", k.rgb(120, 220, 255), 22);
    }
  });
  k.onKeyPress("m", () => {
    const m = audio.toggleMute();
    showPopup(WIDTH / 2, 80, m ? "SON COUPE (M)" : "SON ACTIF (M)", k.rgb(200, 220, 255), 18);
  });

  k.add([
    k.pos(0, 0),
    k.z(40),
    {
      draw() {
        if (!audio.isMuted()) return;
        k.drawText({ text: "🔇", size: 22, pos: k.vec2(WIDTH - 60, HEIGHT - 40) });
      },
    },
  ]);
  k.onKeyPress("p", () => {
    const root = k.getTreeRoot();
    root.paused = !root.paused;
  });
  k.onKeyPress("escape", () => {
    if (document.getElementById("pause-menu")) { hidePauseMenu(); k.getTreeRoot().paused = false; return; }
    if (settingsModal.isVisible()) { settings.open = false; settingsModal.hide(); return; }
    const mode = router.get().mode;
    if (mode === "campaign" || mode === "run") {
      k.getTreeRoot().paused = true;
      showPauseMenu({
        mode,
        levelId: mode === "campaign" ? (window.__campaign?.getCurrent?.()?.def.id) : null,
        onResume: () => { k.getTreeRoot().paused = false; },
        onRetry: () => {
          k.getTreeRoot().paused = false;
          if (mode === "campaign") {
            const id = window.__campaign?.getCurrent?.()?.def.id;
            if (id) { router.enter({ mode: "campaign", levelId: id }); k.go("game"); }
          } else if (mode === "run") {
            router.enter({ mode: "run" });
            k.go("game");
          }
        },
        onCampaignMenu: () => {
          k.getTreeRoot().paused = false;
          router.enter({ mode: "menu" });
          document.getElementById("campaign-result")?.remove();
          openCampaignMenu();
        },
        onMainMenu: () => {
          k.getTreeRoot().paused = false;
          router.enter({ mode: "menu" });
          document.getElementById("campaign-result")?.remove();
          document.getElementById("run-result")?.remove();
          splashRef?.show?.();
        },
        onSettings: () => {
          settings.open = true;
          settingsModal.show();
        },
      });
      return;
    }
    // Sandbox : Escape = settings modal comme avant
    if (settingsModal.isVisible()) { settings.open = false; settingsModal.hide(); }
    else { settings.open = true; settingsModal.show(); }
  });

  const sandbox = createSandboxSetup({
    k, tileMap, save, persistSave, audio, juice, showPopup,
    router, placeTile, groundSystem, spectres, WIDTH, HEIGHT,
  });
  const { buildDemoCircuit } = sandbox;
  buildTestCircuitRef = buildDemoCircuit;
  exportActionRef = () => sandbox.exportAction();
  resetParkRef = () => sandbox.resetPark();

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
  toggleDemoRef = () => {
    if (settings.autoMode) startAutoMode();
    else stopAutoMode();
  };
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
  if (cfg.enableGhostTrain) k.wait(0.05, () => startGhostTrain());

  let inverseTrainCooldown = 0;
  function spawnInverseTrain() {
    spawnWagon(false, true);
  }
  function triggerInverseTrain() {
    showPopup(WIDTH / 2, 100, "ATTENTION TRAIN INVERSE !", k.rgb(255, 60, 60), 32);
    audio.transform();
    juice.dirShake(-1, 0, 8, 0.25);
    k.wait(2, () => {
      spawnInverseTrain();
    });
  }
  if (cfg.enableInverseTrain) k.loop(2, () => {
    if (k.time() < inverseTrainCooldown) return;
    if (k.time() - gameState.lastTilePlaced < 20) return;
    if (k.get("wagon").filter((w) => w.inverseTrain).length > 0) return;
    triggerInverseTrain();
    inverseTrainCooldown = k.time() + 30;
    gameState.lastTilePlaced = k.time();
  });

  const sky = createSkySystem({ k, spectres });
  toggleNightRef = sky.toggleNight;
  k.onKeyPress("n", sky.toggleNight);

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

  sandbox.initSandboxScene();

  k.onMousePress("left", () => {
    tryUnlockAudio();
    if (settingsModal.isVisible()) return;
    // Mode curseur : ne pose rien, laisse k.onClick des entités (balloon, duck, can, wheel) jouer seuls
    if (selectedTool === "cursor") return;
    const w = k.toWorld(k.mousePos());
    const col = Math.floor(w.x / TILE);
    const row = Math.floor(w.y / TILE);
    if (col < -WORLD_COLS || col >= WORLD_COLS || row < 0) return;
    // Bloque placement dans la zone du stand de tir (cols 30-34, rows 2-3)
    if (col >= 30 && col < 35 && row >= 2 && row < 4) return;
    const key = gridKey(col, row);
    if (selectedTool !== "erase" && selectedTool !== "sol" && window.__tiers && !window.__tiers.isUnlocked(selectedTool)) {
      showPopup(WIDTH / 2, 80, "VERROUILLE - completez les objectifs du tier", k.rgb(255, 80, 80), 18);
      return;
    }
    if (window.__campaign && !window.__campaign.isAllowed(selectedTool)) {
      showPopup(WIDTH / 2, 80, "Outil indisponible dans ce niveau", k.rgb(255, 120, 120), 18);
      return;
    }
    if (selectedTool === "sol") {
      if (row >= GROUND_ROW && row < ROWS) {
        if (groundSystem.isDug(col, row)) groundSystem.fillGround(col, row);
      } else {
        placeTile(col, row, "ground");
        gameState.lastTilePlaced = k.time();
        audio.place();
        window.__campaign?.onTileEvent?.("sol"); window.__contract?.onToolPlaced?.("sol");
      }
      return;
    }
    if (selectedTool === "erase") {
      if (tileMap.has(key)) {
        placeTile(col, row, "erase");
      } else if (row >= GROUND_ROW && row < ROWS && !groundSystem.isDug(col, row)) {
        groundSystem.digGround(col, row);
      }
      return;
    }
    // Permettre placement dans le sol creusé (row >= GROUND_ROW mais isDug)
    const canPlaceHere = row < GROUND_ROW || (row < ROWS && groundSystem.isDug(col, row));
    if (!canPlaceHere) return;
    placeTile(col, row, selectedTool);
    if (selectedTool === "lava" && tutorial) tutorial.notifyLavaPlaced();
    window.__tiers?.onTilePlace(selectedTool);
    window.__vquests?.onTilePlaced(selectedTool);
    window.__campaign?.onTileEvent?.(selectedTool); window.__contract?.onToolPlaced?.(selectedTool);
    gameState.lastTilePlaced = k.time();
    audio.place();
  });

  let lastPlacedKey = null;

  k.onMouseDown("left", () => {
    if (settingsModal.isVisible()) return;
    if (selectedTool === "cursor") return;
    // En campagne : pas de drag-to-paint (préserve le budget tuiles)
    if (window.__campaign?.getCurrent?.()) return;
    const screenM = k.mousePos();
    const w = k.toWorld(screenM);
    const col = Math.floor(w.x / TILE);
    const row = Math.floor(w.y / TILE);
    if (col < -WORLD_COLS || col >= WORLD_COLS || row < 0) return;
    // Bloque placement dans la zone du stand de tir (cols 30-34, rows 2-3)
    if (col >= 30 && col < 35 && row >= 2 && row < 4) return;
    const key = gridKey(col, row);
    if (key === lastPlacedKey) return;
    if (selectedTool !== "erase" && selectedTool !== "sol" && window.__tiers && !window.__tiers.isUnlocked(selectedTool)) return;
    if (window.__campaign && !window.__campaign.isAllowed(selectedTool)) return;
    if (selectedTool === "sol") {
      if (row >= GROUND_ROW && row < ROWS) {
        if (groundSystem.isDug(col, row)) groundSystem.fillGround(col, row);
      } else {
        if (tileMap.has(key) && tileMap.get(key).tileType === "ground") return;
        placeTile(col, row, "ground");
        gameState.lastTilePlaced = k.time();
        audio.place();
        window.__campaign?.onTileEvent?.("sol"); window.__contract?.onToolPlaced?.("sol");
      }
      lastPlacedKey = key;
      return;
    }
    if (selectedTool === "erase") {
      if (tileMap.has(key)) {
        placeTile(col, row, "erase");
      } else if (row >= GROUND_ROW && row < ROWS && !groundSystem.isDug(col, row)) {
        groundSystem.digGround(col, row);
      }
      lastPlacedKey = key;
      return;
    }
    const canPlaceHere2 = row < GROUND_ROW || (row < ROWS && groundSystem.isDug(col, row));
    if (!canPlaceHere2) return;
    if (tileMap.has(key) && tileMap.get(key).tileType === selectedTool) return;
    placeTile(col, row, selectedTool);
    if (selectedTool === "lava" && tutorial) tutorial.notifyLavaPlaced();
    window.__tiers?.onTilePlace(selectedTool);
    window.__vquests?.onTilePlaced(selectedTool);
    window.__campaign?.onTileEvent?.(selectedTool); window.__contract?.onToolPlaced?.(selectedTool);
    gameState.lastTilePlaced = k.time();
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
  const visitorSystem = createVisitorSystem({
    k, gameState, audio, juice, tileMap,
    registerKill, showPopup: (...args) => showPopup(...args), checkMilestone,
    constellation, getCrowdHooks: () => crowdHooks,
    WIDTH, WORLD_WIDTH, TILE, GROUND_ROW, gridKey,
    boardingFn: (w, v) => tryAutoBoardVisitor(w, v),
  });

  if (cfg.enableAmbientVisitors !== false) {
    k.loop(6, () => {
      if (k.get("visitor").length < 3) visitorSystem.spawn();
    });
  }

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

  attachParticleAndTileUpdates({ k, tileMap });

  const crowdSystem = createCrowdSystem({ k, gameState });
  crowdHooks = crowdSystem.setup();

  createSkullStand({ k, gameState, audio, showPopup: (...args) => showPopup(...args), registerCoin: (...args) => registerCoin(...args), getActivePlayers: () => activePlayers, isCampaign: () => router.get().mode === "campaign", WIDTH, TILE });
  createGCSystem({ k, WIDTH, HEIGHT, WORLD_WIDTH });

  hud.setup();

  if (cfg.enableTutorial) {
    tutorial = createTutorial({ k, save, persistSave, drawTextOutlined: hud.drawTextOutlined });
    tutorial.setup();
  }

  if (cfg.enableTiers) window.__tiers = createTierSystem({ k, save, persistSave, gameState, audio, showPopup: (...args) => showPopup(...args), WIDTH });
  if (cfg.enableCoinThief) window.__coinThief = createCoinThiefSystem({ k, gameState, audio, showPopup: (...args) => showPopup(...args), WIDTH, GROUND_ROW, TILE });
  if (cfg.enableVisitorQuests) window.__vquests = createVisitorQuestSystem({ k, gameState, audio, showPopup: (...args) => showPopup(...args), WIDTH, HEIGHT });
  if (cfg.enableWeather) window.__weather = createWeatherSystem({ k, gameState, audio, showPopup: (...args) => showPopup(...args), WIDTH, HEIGHT, GROUND_ROW, TILE });
  if (cfg.enableBalloons) window.__balloons = createBalloonSystem({ k, gameState, audio, showPopup: (...args) => showPopup(...args), WIDTH, GROUND_ROW, TILE });
  if (cfg.enableMinigames) window.__minigames = createMinigames({ k, tileMap, gameState, audio, showPopup: (...args) => showPopup(...args) });

  if (router.get().mode === "campaign") {
    const campaignHandlers = {
      reload: null,
      go: null,
      toMenu: null,
    };
    const campaign = createCampaignSystem({
      k, tileMap, gameState, save, persistSave,
      placeTile, groundSystem, spawnWagon,
      spawnVisitorAt: visitorSystem.spawnAt,
      showPopup: (...args) => showPopup(...args),
      onWin: (r) => {
        audio.combo?.();
        juice.dirShake(0, 1, 10, 0.25);
        k.wait(0.8, () => {
          showCampaignResult({
            won: true, stars: r.stars, time: r.time, tiles: r.tiles, levelId: r.levelId,
            platinum: r.platinum, platinumLabel: r.platinumLabel,
            alreadyPlatinum: r.alreadyPlatinum && r.platinum,
            recordRank: r.recordRank,
            onRetry: () => campaignHandlers.reload(r.levelId),
            onNext: (nextId) => campaignHandlers.go(nextId),
            onMenu: () => campaignHandlers.toMenu(),
          });
        });
      },
      onLose: (r) => {
        juice.dirShake(0, -1, 10, 0.25);
        k.wait(0.5, () => {
          const state = campaign.getCurrent();
          showCampaignResult({
            won: false, stars: 0,
            time: state ? (state.endAt - state.startTime) : 0,
            tiles: state ? state.tilesPlaced : 0,
            levelId: r.levelId,
            reason: r.reason,
            onRetry: () => campaignHandlers.reload(r.levelId),
            onNext: null,
            onMenu: () => campaignHandlers.toMenu(),
          });
        });
      },
    });
    window.__campaign = campaign;
    campaignHandlers.reload = (id) => {
      router.enter({ mode: "campaign", levelId: id });
      k.go("game");
    };
    campaignHandlers.go = (nextId) => {
      if (!nextId) { campaignHandlers.toMenu(); return; }
      router.enter({ mode: "campaign", levelId: nextId });
      k.go("game");
    };
    campaignHandlers.toMenu = () => {
      router.enter({ mode: "menu" });
      const existing = document.getElementById("campaign-result");
      if (existing) existing.remove();
      openCampaignMenu();
    };
    k.loop(0.5, () => campaign.tick(0.5));
    const initialLevel = router.get().levelId || save.campaign?.lastPlayedLevel || "1-1";
    k.wait(0.1, () => campaign.loadLevel(initialLevel));
  }

  if (router.get().mode === "run") {
    const run = createRunSystem({
      k, gameState, save, persistSave, audio, spawnWagon,
      getActiveAvatar: () => save.avatars?.p1 || "mario",
      onEnd: ({ avatar, record, top }) => {
        juice.dirShake(0, 1, 8, 0.25);
        k.wait(0.6, () => {
          showRunResult({
            avatar, record, top,
            onRetry: () => { router.enter({ mode: "run" }); k.go("game"); },
            onMenu: () => { router.enter({ mode: "menu" }); splashRef?.show?.(); },
          });
        });
      },
    });
    window.__run = run;
    k.loop(0.5, () => run.tick(0.5));
    k.wait(0.1, () => run.start(RUN_DURATION));
  }
});