import * as THREE from "three";
import { makePathLine } from "./systems/Path.js";
import { LevelRunner } from "./systems/LevelRunner.js";
import { Particles } from "./systems/Particles.js";
import { JuiceFX } from "./systems/JuiceFX.js";
import { Audio } from "./systems/Audio.js";
import { MusicManager } from "./systems/MusicManager.js";
import { SaveSystem } from "./systems/SaveSystem.js";
import { AssetLoader } from "./systems/AssetLoader.js";
import { rollPerkChoices } from "./data/perks.js";
import { TOWER_TYPES, TOWER_ORDER, Tower } from "./entities/Tower.js";
import {
  META_UPGRADES, UPGRADE_TIERS, UPGRADE_MAX_LEVEL,
  getCostForLevel, isTierUnlocked, RESET_COST_GEMS,
} from "./data/metaUpgrades.js";
import {
  SKINS, SKIN_BY_ID, getSkinsByCategory, getDefaultSkinId, isSkinUnlocked,
} from "./data/skins.js";
import { getTheme } from "./data/themes.js";
import { getCutsceneForLevel } from "./data/cutscenes.js";
import world1_1 from "./data/levels/world1-1.js";
import { getLevel, getNextLevelId, LEVEL_ORDER } from "./data/levels/index.js";

SaveSystem.load();
Audio.setMuted(SaveSystem.isMuted());
Audio.setVolume(SaveSystem.getSfxVolume());
MusicManager.setMusicVolume(SaveSystem.getMusicVolume());

const _params = new URLSearchParams(window.location.search);
const DEBUG_MODE = _params.get("debug") === "1";
if (DEBUG_MODE) {
  console.log("[crowdef] debug mode ON — unlocking all levels");
  for (const id of ["world1-1", "world1-2", "world1-3", "world1-4", "world1-5", "world1-6", "world1-7", "world1-8",
                    "world2-1", "world2-2", "world2-3", "world2-4", "world2-5", "world2-6", "world2-7", "world2-8",
                    "world3-1", "world3-2", "world3-3", "world3-4", "world3-5", "world3-6", "world3-7", "world3-8",
                    "world4-1", "world4-2", "world4-3", "world4-4", "world4-5", "world4-6", "world4-7", "world4-8"]) {
    SaveSystem.recordLevelDone(id, { win: true, wave: 6, castleHP: 100, stars: 1 });
  }
  SaveSystem.markCutsceneSeen("world1");
  SaveSystem.markCutsceneSeen("world2");
  SaveSystem.markCutsceneSeen("world3");
  SaveSystem.markCutsceneSeen("world4");
  SaveSystem.addGems(1000);
}

await AssetLoader.ready();

const canvas = document.getElementById("app");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x6fc16d);
scene.fog = new THREE.Fog(0x7fd07c, 30, 80);

const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 200);
const CAM_TARGET = new THREE.Vector3(-2, 0, -1);
const CAM_OFFSET = new THREE.Vector3(0, 30, 22);

function resize() {
  const w = window.innerWidth, h = window.innerHeight;
  renderer.setSize(w, h, true);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
const SHAKE_OFFSET = new THREE.Vector3();
function refitCamera() {
  camera.position.copy(CAM_TARGET).add(CAM_OFFSET).add(SHAKE_OFFSET);
  camera.lookAt(CAM_TARGET);
}
refitCamera();
resize();
window.addEventListener("resize", resize);

const sun = new THREE.DirectionalLight(0xfff4d6, 1.4);
sun.position.set(15, 25, 10);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -25;
sun.shadow.camera.right = 25;
sun.shadow.camera.top = 25;
sun.shadow.camera.bottom = -25;
sun.shadow.camera.near = 1;
sun.shadow.camera.far = 60;
sun.shadow.bias = -0.0005;
scene.add(sun);

const fill = new THREE.HemisphereLight(0xb0e0ff, 0x4a6a3a, 0.55);
scene.add(fill);

const groundGeom = new THREE.PlaneGeometry(80, 80, 1, 1);
const groundMat = new THREE.MeshLambertMaterial({ color: 0x6fc16d });
const ground = new THREE.Mesh(groundGeom, groundMat);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

const dirtMat = new THREE.MeshLambertMaterial({ color: 0xcca06a });
const decor = [];

const THEME_PALETTE = {
  plaine: {
    big: ["nature_commontree1", "nature_commontree2", "nature_commontree3"],
    medium: ["nature_bush", "nature_bushflower"],
    small: ["nature_flower3", "nature_flower4"],
    rocks: ["nature_rock1", "nature_pebble1"],
    feature: ["nature_commontree3", "nature_bushflower"],
    bigCount: 6, mediumCount: 3, smallCount: 5, rockCount: 2,
  },
  foret: {
    big: ["nature_pine1", "nature_pine2", "nature_pine3"],
    twisted: ["nature_twisted1"],
    medium: ["nature_bush", "nature_fern"],
    small: ["nature_mushroom"],
    rocks: ["nature_rock1", "nature_rock2"],
    feature: ["nature_mushroom", "nature_twisted1"],
    bigCount: 6, twistedCount: 2, mediumCount: 4, smallCount: 5, rockCount: 2,
  },
  desert: {
    big: ["nature_dead1", "nature_dead2"],
    medium: ["nature_rock1", "nature_rock2", "nature_rock3"],
    small: ["nature_pebble1", "nature_pebble2"],
    rocks: ["nature_rock3", "nature_pebble1"],
    feature: ["nature_dead2", "nature_rock3"],
    bigCount: 4, mediumCount: 5, smallCount: 5, rockCount: 3,
  },
  volcan: {
    big: ["nature_dead1", "nature_dead2", "nature_dead3"],
    medium: ["nature_rock1", "nature_rock2", "nature_rock3"],
    small: ["nature_pebble1", "nature_pebble2"],
    rocks: ["nature_rock1", "nature_rock2"],
    feature: ["nature_dead3", "nature_rock1"],
    bigCount: 4, mediumCount: 5, smallCount: 4, rockCount: 4,
  },
};

function _hashLevelId(id) {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = (h * 16777619) >>> 0;
  }
  return h;
}

function placeFeatureProp(level, palette) {
  const override = level.featureProp;
  if (override) {
    const [x, y, z] = override.pos || [0, 0, 0];
    placeNatureProp(override.asset, x, z, override.scale || 3.0, override.rot ?? null, true);
    return;
  }
  if (!palette.feature || palette.feature.length === 0) return;
  const seed = _hashLevelId(level.id || "default");
  const key = palette.feature[seed % palette.feature.length];
  for (let attempt = 0; attempt < 24; attempt++) {
    const ang = ((seed >> (attempt * 2)) & 0xff) / 255 * Math.PI * 2;
    const radius = 11 + ((seed >> (attempt * 3)) & 0x7) * 1.5;
    const x = Math.cos(ang) * radius;
    const z = Math.sin(ang) * radius;
    if (isOnPath(x, z, runner)) continue;
    const scale = 2.6 + ((seed >> 11) & 0x7) * 0.12;
    const rot = ((seed >> 17) & 0xff) / 255 * Math.PI * 2;
    placeNatureProp(key, x, z, scale, rot, true);
    return;
  }
}

const TALL_OCCLUDERS = /^(nature_commontree|nature_pine|nature_dead|nature_twisted)/;

function placeNatureProp(assetKey, x, z, scale = 1, rot = null, withShadow = false) {
  const gltf = AssetLoader.get(assetKey);
  if (!gltf || !gltf.scene) return;
  const cloned = gltf.scene.clone(true);
  cloned.scale.setScalar(scale);
  cloned.position.set(x, 0, z);
  cloned.rotation.y = rot != null ? rot : Math.random() * Math.PI * 2;
  const canOcclude = TALL_OCCLUDERS.test(assetKey);
  cloned.userData.canOccludeHero = canOcclude;
  cloned.userData._fadeOpacity = 1;
  cloned.traverse((o) => {
    if (o.isMesh) {
      o.castShadow = withShadow;
      o.receiveShadow = false;
      o.frustumCulled = true;
      if (canOcclude && o.material) {
        o.material = Array.isArray(o.material) ? o.material.map((m) => m.clone()) : o.material.clone();
        const list = Array.isArray(o.material) ? o.material : [o.material];
        for (const m of list) { m.transparent = true; m.opacity = 1; }
      }
    }
  });
  scene.add(cloned);
  decor.push(cloned);
}

const _heroScreen = new THREE.Vector3();
const _decorScreen = new THREE.Vector3();
function updateDecorFade(dt) {
  if (!runner.hero) return;
  const heroPos = runner.hero.group.position;
  _heroScreen.copy(heroPos).project(camera);
  _heroScreen.y += 0.06; // shift toward hero head
  const heroDist = camera.position.distanceTo(heroPos);
  for (const d of decor) {
    if (!d.userData.canOccludeHero) continue;
    _decorScreen.copy(d.position).project(camera);
    const sx = _decorScreen.x - _heroScreen.x;
    const sy = _decorScreen.y - _heroScreen.y;
    const decorDist = camera.position.distanceTo(d.position);
    const screenRadiusSq = 0.04;
    const occluding = decorDist < heroDist - 0.3 && (sx * sx + sy * sy) < screenRadiusSq;
    const target = occluding ? 0.22 : 1.0;
    const cur = d.userData._fadeOpacity || 1;
    const next = cur + (target - cur) * Math.min(1, dt * 8);
    if (Math.abs(next - cur) < 0.005 && next === target) continue;
    d.userData._fadeOpacity = next;
    d.traverse((o) => {
      if (!o.isMesh || !o.material) return;
      const list = Array.isArray(o.material) ? o.material : [o.material];
      for (const m of list) m.opacity = next;
    });
  }
}

function clearDecor() {
  for (const d of decor) {
    scene.remove(d);
    d.traverse((c) => {
      if (c.geometry) c.geometry.dispose();
      if (c.material) {
        if (Array.isArray(c.material)) c.material.forEach((m) => m.dispose());
        else c.material.dispose();
      }
    });
  }
  decor.length = 0;
}

function isOnPath(x, z, runner) {
  if (!runner) return false;
  const allPaths = (runner.paths && runner.paths.length) ? runner.paths : (runner.path ? [runner.path] : []);
  const samples = 40;
  const PATH_CLEAR_RADIUS_SQ = 16;
  for (const path of allPaths) {
    for (let i = 0; i <= samples; i++) {
      const p = path.getPointAt(i / samples);
      const dx = p.x - x;
      const dz = p.z - z;
      if (dx * dx + dz * dz < PATH_CLEAR_RADIUS_SQ) return true;
    }
  }
  if (runner.buildPoints) {
    const BP_CLEAR_SQ = 4;
    for (const bp of runner.buildPoints) {
      const dx = bp.pos.x - x;
      const dz = bp.pos.z - z;
      if (dx * dx + dz * dz < BP_CLEAR_SQ) return true;
    }
  }
  return false;
}

function applyTheme(themeId) {
  const t = getTheme(themeId);
  scene.background = new THREE.Color(t.bg);
  scene.fog = new THREE.Fog(t.fog, 30, 80);
  ground.material.color.setHex(t.ground);
  dirtMat.color.setHex(t.dirt);
  clearDecor();
  const palette = THEME_PALETTE[themeId] || THEME_PALETTE.plaine;
  const tries = 60;
  function spawnSet(keys, count, scaleMin, scaleMax, ringMin, ringMax) {
    let placed = 0;
    let attempts = 0;
    while (placed < count && attempts < tries * count) {
      attempts++;
      const angle = Math.random() * Math.PI * 2;
      const r = ringMin + Math.random() * (ringMax - ringMin);
      const x = Math.cos(angle) * r;
      const z = Math.sin(angle) * r;
      if (isOnPath(x, z, runner)) continue;
      const key = keys[Math.floor(Math.random() * keys.length)];
      const scale = scaleMin + Math.random() * (scaleMax - scaleMin);
      placeNatureProp(key, x, z, scale);
      placed++;
    }
  }
  spawnSet(palette.big, palette.bigCount, 1.0, 1.6, 9, 22);
  if (palette.twisted) spawnSet(palette.twisted, palette.twistedCount || 0, 0.35, 0.55, 9, 22);
  spawnSet(palette.medium, palette.mediumCount, 0.8, 1.4, 8, 20);
  spawnSet(palette.small, palette.smallCount, 0.7, 1.3, 6, 18);
  spawnSet(palette.rocks, palette.rockCount, 0.6, 1.2, 7, 18);
  if (runner.level) placeFeatureProp(runner.level, palette);
}

Particles.init(scene);
JuiceFX.init();

const runner = new LevelRunner(scene, world1_1);
runner.setup();

let pathLines = [];
let castle = null;

function disposeMeshGroup(group) {
  if (!group) return;
  scene.remove(group);
  group.traverse((c) => {
    if (c.geometry) c.geometry.dispose();
    if (c.material) {
      if (Array.isArray(c.material)) c.material.forEach((m) => m.dispose());
      else c.material.dispose();
    }
  });
}

function parseHexColor(s) {
  if (typeof s === "number") return s;
  if (typeof s !== "string") return 0xdcdcdc;
  return parseInt(s.replace("#", ""), 16);
}

function rebuildLevelDecor() {
  for (const pl of pathLines) disposeMeshGroup(pl);
  pathLines = [];
  disposeMeshGroup(castle);

  const themeForPath = getTheme(runner.level.theme || "plaine");
  for (const p of (runner.paths || [runner.path])) {
    if (!p) continue;
    const pl = makePathLine(p, dirtMat, {
      innerColor: themeForPath.pathInner,
      borderColor: themeForPath.pathBorder,
    });
    scene.add(pl);
    pathLines.push(pl);
  }

  const castleSkinId = SaveSystem.getEquippedSkin("castle") || "castle_default";
  const castleSkin = SKIN_BY_ID[castleSkinId];
  const baseColor = parseHexColor(castleSkin?.color || "#dcdcdc");
  const roofColor = parseHexColor(castleSkin?.roofColor || "#3a6abf");

  castle = new THREE.Group();
  const castleBase = new THREE.Mesh(
    new THREE.BoxGeometry(3, 1.2, 3),
    new THREE.MeshLambertMaterial({ color: baseColor }),
  );
  castleBase.position.y = 0.6;
  castleBase.castShadow = true;
  castle.add(castleBase);
  const castleRoof = new THREE.Mesh(
    new THREE.ConeGeometry(2.2, 1.6, 4),
    new THREE.MeshLambertMaterial({ color: roofColor }),
  );
  castleRoof.position.y = 1.2 + 0.8;
  castleRoof.rotation.y = Math.PI / 4;
  castleRoof.castShadow = true;
  castle.add(castleRoof);
  const endPoint = runner.path.getPointAt(1);
  castle.position.set(endPoint.x, 0, endPoint.z);
  scene.add(castle);
}

rebuildLevelDecor();
applyTheme(world1_1.theme || "plaine");

const keys = { w: 0, a: 0, s: 0, d: 0 };
const TOWER_HOTKEYS = TOWER_ORDER;

function getCurrentWorld() {
  const id = runner.level?.id || "";
  const m = id.match(/^world(\d+)/);
  return m ? parseInt(m[1], 10) : 99;
}

const toolbarEl = document.getElementById("tower-toolbar");
function buildToolbar() {
  if (!toolbarEl) return;
  toolbarEl.innerHTML = "";
  TOWER_ORDER.forEach((type, idx) => {
    const cfg = TOWER_TYPES[type];
    if (!cfg) return;
    const cell = document.createElement("div");
    cell.className = "tt-cell";
    cell.dataset.towerType = type;
    const keyLbl = idx < 9 ? `${idx + 1}` : (idx === 9 ? "0" : "-");
    cell.innerHTML = `<span class="tt-key">${keyLbl}</span><span class="tt-icon">${cfg.icon || "🏰"}</span><span class="tt-cost">${cfg.cost}¢</span>`;
    cell.title = `${cfg.label} — ${cfg.cost}¢ (touche ${keyLbl})`;
    cell.addEventListener("click", () => {
      const world = getCurrentWorld();
      if ((cfg.unlockWorld || 1) > world) return;
      runner.selectedTowerType = type;
      refreshToolbarSelection();
    });
    toolbarEl.appendChild(cell);
  });
  refreshToolbarSelection();
}

function refreshToolbarSelection() {
  if (!toolbarEl) return;
  const sel = runner.selectedTowerType || "archer";
  const world = getCurrentWorld();
  const coins = runner.coins || 0;
  toolbarEl.querySelectorAll(".tt-cell").forEach((cell) => {
    const type = cell.dataset.towerType;
    const cfg = TOWER_TYPES[type];
    if (!cfg) return;
    const locked = (cfg.unlockWorld || 1) > world;
    cell.classList.toggle("selected", type === sel && !locked);
    cell.classList.toggle("locked", locked);
    cell.classList.toggle("poor", !locked && coins < cfg.cost);
    if (locked) cell.dataset.lockedLabel = `🔒 W${cfg.unlockWorld}`;
  });
}

buildToolbar();
window.addEventListener("keydown", (e) => {
  if (e.code === "KeyW" || e.code === "ArrowUp") keys.w = 1;
  if (e.code === "KeyS" || e.code === "ArrowDown") keys.s = 1;
  if (e.code === "KeyA" || e.code === "ArrowLeft") keys.a = 1;
  if (e.code === "KeyD" || e.code === "ArrowRight") keys.d = 1;
  // Tower selection 1-9, 0=10ème, Minus=11ème
  const trySelect = (idx) => {
    const type = TOWER_HOTKEYS[idx];
    if (!type) return;
    const cfg = TOWER_TYPES[type];
    if (!cfg || (cfg.unlockWorld || 1) > getCurrentWorld()) return;
    runner.selectedTowerType = type;
    refreshToolbarSelection();
  };
  if (e.code === "Digit0") { trySelect(9); return; }
  if (e.code === "Minus" || e.code === "NumpadSubtract") { trySelect(10); return; }
  const m = e.code.match(/^Digit([1-9])$/);
  if (m) trySelect(parseInt(m[1], 10) - 1);
});
window.addEventListener("keyup", (e) => {
  if (e.code === "KeyW" || e.code === "ArrowUp") keys.w = 0;
  if (e.code === "KeyS" || e.code === "ArrowDown") keys.s = 0;
  if (e.code === "KeyA" || e.code === "ArrowLeft") keys.a = 0;
  if (e.code === "KeyD" || e.code === "ArrowRight") keys.d = 0;
});

const joystick = { active: false, sx: 0, sy: 0, dx: 0, dy: 0, id: -1 };
const joyEl = document.getElementById("joystick");
const joyKnob = document.getElementById("joystick-knob");
function joyStart(e) {
  const t = e.touches ? e.touches[0] : e;
  joystick.active = true;
  joystick.sx = t.clientX;
  joystick.sy = t.clientY;
  joystick.id = e.touches ? t.identifier : -1;
  joyEl.style.left = (t.clientX - 60) + "px";
  joyEl.style.top = (t.clientY - 60) + "px";
  joyEl.style.opacity = 1;
}
function joyMove(e) {
  if (!joystick.active) return;
  let t = null;
  if (e.touches) {
    for (const tt of e.touches) if (tt.identifier === joystick.id) { t = tt; break; }
    if (!t) return;
  } else {
    t = e;
  }
  let dx = t.clientX - joystick.sx;
  let dy = t.clientY - joystick.sy;
  const len = Math.hypot(dx, dy);
  const max = 50;
  if (len > max) { dx = dx * max / len; dy = dy * max / len; }
  joystick.dx = dx / max;
  joystick.dy = dy / max;
  joyKnob.style.transform = `translate(${dx}px, ${dy}px)`;
}
function joyEnd() {
  joystick.active = false;
  joystick.dx = 0;
  joystick.dy = 0;
  joyKnob.style.transform = "translate(0, 0)";
  joyEl.style.opacity = 0.3;
}
const touchZone = document.getElementById("touch-zone");
touchZone.addEventListener("touchstart", (e) => { e.preventDefault(); joyStart(e); }, { passive: false });
touchZone.addEventListener("touchmove", (e) => { e.preventDefault(); joyMove(e); }, { passive: false });
touchZone.addEventListener("touchend", (e) => { e.preventDefault(); joyEnd(); }, { passive: false });
touchZone.addEventListener("touchcancel", joyEnd);

const ui = {
  coins: document.getElementById("coins"),
  wave: document.getElementById("wave"),
  castleHpCur: document.getElementById("castle-hp-cur"),
  castleHpMax: document.getElementById("castle-hp-max"),
  castleHpFill: document.getElementById("castle-hp-fill"),
  castleHpBox: document.getElementById("castle-hp"),
  briefing: document.getElementById("briefing"),
  briefingName: document.getElementById("briefing-name"),
  briefingText: document.getElementById("briefing-text"),
  briefingCountdown: document.getElementById("briefing-countdown"),
  result: document.getElementById("result"),
  resultTitle: document.getElementById("result-title"),
  resultCastle: document.getElementById("result-castle"),
  resultWave: document.getElementById("result-wave"),
  resultCoins: document.getElementById("result-coins"),
  resultMapBtn: document.getElementById("result-map-btn"),
  resultNextBtn: document.getElementById("result-next-btn"),
  star1: document.getElementById("star-1"),
  star2: document.getElementById("star-2"),
  star3: document.getElementById("star-3"),
  heroLevel: document.getElementById("hero-level"),
  heroXp: document.getElementById("hero-xp"),
  heroXpNext: document.getElementById("hero-xpnext"),
  heroXpFill: document.getElementById("hero-xp-fill"),
  heroBar: document.getElementById("hero-bar"),
  perkOverlay: document.getElementById("perk-overlay"),
  perkCards: document.getElementById("perk-cards"),
  perkLevel: document.getElementById("perk-level"),
  worldmap: document.getElementById("worldmap"),
  worldmapGrid: document.getElementById("worldmap-grid"),
  worldmapStars: document.getElementById("worldmap-stars"),
  mapBtn: document.getElementById("map-btn"),
  bossBanner: document.getElementById("boss-banner"),
  bossBannerName: document.getElementById("boss-banner-name"),
  bossBannerFill: document.getElementById("boss-banner-fill"),
  gems: document.getElementById("gems"),
  shop: document.getElementById("shop"),
  shopTiers: document.getElementById("shop-tiers"),
  shopGems: document.getElementById("shop-gems"),
  shopBtn: document.getElementById("shop-btn"),
};

let _bossRef = null;
let _bossChargeFlashTimer = 0;
function trackBossFromRunner() {
  if (_bossRef && (_bossRef.dead || _bossRef._dying)) {
    ui.bossBanner.classList.remove("show", "charging");
    _bossRef = null;
  }
  if (!_bossRef && runner.enemies) {
    for (const e of runner.enemies) {
      if (e.isBoss && !e.dead && !e._dying) { _bossRef = e; break; }
    }
  }
  if (_bossRef) {
    const ratio = Math.max(0, _bossRef.hp / _bossRef.hpMax);
    ui.bossBannerFill.style.width = (ratio * 100).toFixed(1) + "%";
  }
  if (_bossChargeFlashTimer > 0) {
    _bossChargeFlashTimer -= 1;
    if (_bossChargeFlashTimer <= 0) ui.bossBanner.classList.remove("charging");
  }
}

const towerPreviewEl = document.getElementById("tower-preview");
const towerPreviewName = document.getElementById("tower-preview-name");
const towerPreviewStats = document.getElementById("tower-preview-stats");
const _previewVec = new THREE.Vector3();

function updateTowerPreview() {
  if (!runner.hero) {
    towerPreviewEl.style.display = "none";
    return;
  }
  const bp = runner._activeBuildPoint;
  if (!bp || bp.occupied) {
    towerPreviewEl.style.display = "none";
    return;
  }
  const type = runner.selectedTowerType || "archer";
  const cfg = TOWER_TYPES[type];
  if (!cfg) {
    towerPreviewEl.style.display = "none";
    return;
  }
  _previewVec.set(bp.pos.x, 1.4, bp.pos.z);
  _previewVec.project(camera);
  const sx = (_previewVec.x * 0.5 + 0.5) * window.innerWidth;
  const sy = (-_previewVec.y * 0.5 + 0.5) * window.innerHeight;
  if (_previewVec.z >= 1) {
    towerPreviewEl.style.display = "none";
    return;
  }
  towerPreviewEl.style.left = `${Math.round(sx) + 30}px`;
  towerPreviewEl.style.top = `${Math.round(sy) - 20}px`;
  towerPreviewEl.style.display = "block";
  towerPreviewName.textContent = cfg.label || type;
  let extras = [];
  if (cfg.aoe > 0) extras.push(`AoE ${cfg.aoe}`);
  if (cfg.pierce > 0) extras.push(`pierce ×${cfg.pierce}`);
  if (cfg.behavior === "push") extras.push(`💨 push ${(cfg.pushStrength || 0.04).toFixed(2)}`);
  else if (cfg.behavior === "cluster") extras.push(`💣 cluster ≥3 / cd ${(cfg.cooldownMs / 1000).toFixed(0)}s`);
  else if (cfg.behavior === "slow") extras.push(`❄️ slow ×${cfg.slowMul} / ${(cfg.slowDurationMs / 1000).toFixed(0)}s`);
  else if (cfg.behavior === "buffAura") extras.push(`✨ aura dmg ×${cfg.buffMul}`);
  else if (cfg.behavior === "coinPull") extras.push(`🪙 reward ×${cfg.coinMul}`);
  const cdSec = (cfg.fireRateMs / 1000).toFixed(2);
  const cost = runner._defaultTowerCost(type);
  towerPreviewStats.innerHTML = `
    <div>🎯 Portée : <strong>${cfg.range}</strong></div>
    <div>💥 Dégâts : <strong>${cfg.damage}</strong></div>
    <div>⏱️ Cadence : <strong>${cdSec}s</strong></div>
    ${extras.length ? `<div>✨ ${extras.join(" · ")}</div>` : ""}
    <div style="margin-top:4px;color:#ffd23f;">🪙 Coût : <strong>${cost}</strong></div>
  `;
}

const radialEl = document.getElementById("radial-menu");
const sellToastEl = document.getElementById("sell-toast");
const sellToastMsgEl = document.getElementById("sell-toast-msg");
const sellUndoBtnEl = document.getElementById("sell-undo-btn");
let _radialOpenBp = null;
let _radialPendingUndo = null;
let _radialPendingTimer = 0;
const _radialVec = new THREE.Vector3();

function _upgradeCost(tower) {
  const baseCost = tower.cfg.cost || 50;
  const lvl = tower.upgradeLevel || 1;
  if (lvl === 1) return Math.round(baseCost * 1.0);
  if (lvl === 2) return Math.round(baseCost * 1.5);
  return 0;
}

function openRadial(bp) {
  if (!bp || !bp.tower || !radialEl) return;
  _radialOpenBp = bp;
  radialEl.classList.add("open");
  refreshRadialButtons();
}
function closeRadial() {
  if (!_radialOpenBp) return;
  _radialOpenBp = null;
  radialEl?.classList.remove("open");
}

function refreshRadialButtons() {
  if (!_radialOpenBp || !radialEl) return;
  const t = _radialOpenBp.tower;
  if (!t) { closeRadial(); return; }
  const upBtn = radialEl.querySelector('[data-radial="upgrade"]');
  const sellBtn = radialEl.querySelector('[data-radial="sell"]');
  const cost = _upgradeCost(t);
  const isMax = (t.upgradeLevel || 1) >= 3;
  if (upBtn) {
    const lbl = upBtn.querySelector(".lbl");
    upBtn.classList.toggle("disabled", isMax || runner.coins < cost);
    if (lbl) lbl.textContent = isMax ? "MAX" : `↑ ${cost}¢`;
  }
  if (sellBtn) {
    const refund = Math.round(_radialOpenBp.totalInvested * 0.8);
    const lbl = sellBtn.querySelector(".lbl");
    if (lbl) lbl.textContent = `+${refund}¢`;
  }
}

function updateRadialMenu() {
  if (_radialPendingUndo) {
    _radialPendingTimer -= 1 / 60;
    if (_radialPendingTimer <= 0) {
      sellToastEl.style.display = "none";
      _radialPendingUndo = null;
    }
  }
  const onBp = runner._heroOnBuildPoint;
  if (onBp && onBp.occupied) {
    if (_radialOpenBp !== onBp) openRadial(onBp);
  } else if (_radialOpenBp) {
    closeRadial();
  }
  if (_radialOpenBp && radialEl) {
    _radialVec.set(_radialOpenBp.pos.x, 1.6, _radialOpenBp.pos.z);
    _radialVec.project(camera);
    if (_radialVec.z < 1) {
      const sx = (_radialVec.x * 0.5 + 0.5) * window.innerWidth;
      const sy = (-_radialVec.y * 0.5 + 0.5) * window.innerHeight;
      radialEl.style.left = `${Math.round(sx)}px`;
      radialEl.style.top = `${Math.round(sy)}px`;
    }
    refreshRadialButtons();
  }
}

if (radialEl) {
  radialEl.addEventListener("click", (e) => {
    const btn = e.target.closest(".radial-btn");
    if (!btn || !_radialOpenBp || !_radialOpenBp.tower) return;
    if (btn.classList.contains("disabled")) return;
    const action = btn.dataset.radial;
    const bp = _radialOpenBp;
    const t = bp.tower;
    if (action === "upgrade") {
      const cost = _upgradeCost(t);
      const newLvl = (t.upgradeLevel || 1) + 1;
      if (newLvl > 3) return;
      if (runner.coins < cost) return;
      runner.coins -= cost;
      bp.totalInvested += cost;
      t.upgradeTo(newLvl);
      refreshHUD();
      refreshRadialButtons();
    } else if (action === "info") {
      const cfg = t.cfg;
      const lvl = t.upgradeLevel || 1;
      const parts = [`${cfg.label} L${lvl}`, `🎯${(t.range || cfg.range).toFixed(1)}u`];
      if (cfg.behavior === "push") parts.push(`💨 push ${(cfg.pushStrength || 0.04).toFixed(3)}/s`);
      else if (cfg.behavior === "cluster") parts.push(`💣 ${cfg.damage} AoE${cfg.aoe} cd${(cfg.cooldownMs / 1000).toFixed(0)}s`);
      else if (cfg.behavior === "slow") parts.push(`❄️ ×${cfg.slowMul} ${(cfg.slowDurationMs / 1000).toFixed(0)}s`);
      else if (cfg.behavior === "buffAura") parts.push(`✨ aura ×${cfg.buffMul}`);
      else if (cfg.behavior === "coinPull") parts.push(`🪙 ×${cfg.coinMul}`);
      else parts.push(`💥${(t.damage || cfg.damage).toFixed(1)}`, `⏱${(cfg.fireRateMs / 1000).toFixed(2)}s`);
      parts.push(`💀${t.kills || 0}`, `📊${Math.round(t.totalDamage || 0)}dmg`);
      sellToastMsgEl.textContent = parts.join(" · ");
      sellUndoBtnEl.style.display = "none";
      sellToastEl.style.display = "block";
      _radialPendingTimer = 3.0;
      _radialPendingUndo = { _info: true };
      setTimeout(() => { sellUndoBtnEl.style.display = ""; }, 3100);
    } else if (action === "sell") {
      const cfgType = t.type;
      const investedSnapshot = bp.totalInvested;
      const upgradeLevelSnap = t.upgradeLevel || 1;
      const refund = bp.detachTower();
      runner.coins += refund;
      const idx = runner.towers.indexOf(t);
      if (idx >= 0) runner.towers.splice(idx, 1);
      t.destroy();
      closeRadial();
      _radialPendingUndo = { bp, type: cfgType, invested: investedSnapshot, refund, level: upgradeLevelSnap };
      _radialPendingTimer = 3.0;
      sellToastMsgEl.textContent = `Tour vendue +${refund}¢`;
      sellToastEl.style.display = "block";
      refreshHUD();
    }
  });
}

if (sellUndoBtnEl) {
  sellUndoBtnEl.addEventListener("click", () => {
    if (!_radialPendingUndo) return;
    const { bp, type, invested, refund, level } = _radialPendingUndo;
    if (runner.coins < refund) {
      sellToastEl.style.display = "none";
      _radialPendingUndo = null;
      return;
    }
    runner.coins -= refund;
    const tower = new (Tower)(scene, bp.pos.clone(), type);
    if (level > 1) tower.upgradeTo(Math.min(3, level));
    runner.towers.push(tower);
    bp.attachTower(tower);
    bp.totalInvested = invested;
    sellToastEl.style.display = "none";
    _radialPendingUndo = null;
    refreshHUD();
  });
}

function refreshHUD() {
  ui.coins.textContent = Math.floor(runner.coins);
  refreshToolbarSelection();
  ui.gems.textContent = SaveSystem.getGems();
  ui.wave.textContent = "Vague " + runner.wave;
  ui.castleHpMax.textContent = runner.castleHPMax;
  ui.castleHpCur.textContent = Math.max(0, Math.ceil(runner.castleHP));
  const ratio = runner.castleHPMax > 0 ? Math.max(0, runner.castleHP / runner.castleHPMax) : 0;
  ui.castleHpFill.style.width = (ratio * 100).toFixed(1) + "%";
  ui.castleHpBox.classList.toggle("warn", ratio < 0.5 && ratio >= 0.2);
  ui.castleHpBox.classList.toggle("danger", ratio < 0.2);
  if (runner.hero) {
    ui.heroLevel.textContent = runner.hero.level;
    ui.heroXp.textContent = runner.hero.xp;
    const maxed = runner.hero.level >= runner.hero.maxLevel;
    ui.heroXpNext.textContent = maxed ? "MAX" : runner.hero.xpToNext;
    const xpRatio = maxed ? 1 : Math.min(1, runner.hero.xp / Math.max(1, runner.hero.xpToNext));
    ui.heroXpFill.style.width = (xpRatio * 100).toFixed(1) + "%";
    ui.heroBar.classList.toggle("maxed", maxed);
  }
}
refreshHUD();
document.addEventListener("crowdef:gems-gained", (e) => {
  ui.gems.textContent = e.detail.total;
  ui.gems.classList.remove("flash");
  void ui.gems.offsetWidth;
  ui.gems.classList.add("flash");
  spawnGemsPopup(e.detail.amount);
  Audio.sfxGemGain();
});
function spawnToast(title, body) {
  const t = document.createElement("div");
  t.className = "toast";
  t.innerHTML = `<div class="toast-title">${title}</div><div class="toast-body">${body}</div>`;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3200);
}
document.addEventListener("crowdef:skin-dropped", (e) => {
  const skin = SKIN_BY_ID[e.detail.id];
  if (skin) spawnToast(`${skin.icon} Nouveau skin !`, `${skin.name} débloqué`);
});
document.addEventListener("crowdef:achievement-unlocked", (e) => {
  const id = e.detail.id;
  const labels = {
    perfect_world1: "🏆 Termine W1 sans perdre PV — skin Citadelle royale débloqué",
    kills_100: "🏆 100 ennemis tués — skin Foudre céleste débloqué",
  };
  spawnToast("Succès débloqué !", labels[id] || id);
  Audio.sfxAchievement();
});
document.addEventListener("crowdef:skin-dropped", () => Audio.sfxAchievement());
document.addEventListener("crowdef:skin-equipped", () => Audio.sfxSkinEquip());
document.addEventListener("crowdef:perk-picked", () => Audio.sfxPerkPick());
document.addEventListener("crowdef:hero-levelup", () => Audio.sfxLevelUp());
document.addEventListener("crowdef:boss-charge", () => Audio.sfxBossCharge());

function spawnGemsPopup(amount) {
  const popup = document.createElement("div");
  popup.className = "damage-popup";
  popup.style.background = "rgba(106, 58, 160, 0.92)";
  popup.style.borderColor = "#d8a8ff";
  popup.style.color = "#fff";
  popup.textContent = `+${amount} 💎`;
  document.body.appendChild(popup);
  setTimeout(() => popup.remove(), 900);
}
document.addEventListener("crowdef:boss-spawned", (e) => {
  ui.bossBannerName.textContent = e.detail.name || "BOSS";
  ui.bossBannerFill.style.width = "100%";
  ui.bossBanner.classList.add("show");
  MusicManager.play("boss");
});
document.addEventListener("crowdef:wave-start", (e) => {
  if (MusicManager.getCurrentTrack() === "boss") return;
  if (e.detail.wave >= 4) MusicManager.play("intense");
  else MusicManager.play("calm");
  if (runner.level && runner.level.id === "endless") {
    SaveSystem.recordWaveReached(e.detail.wave);
  }
});
document.addEventListener("crowdef:wave-cleared", () => {
  if (MusicManager.getCurrentTrack() === "boss") return;
  MusicManager.play("calm");
});
document.addEventListener("crowdef:level-won", () => {
  MusicManager.play("menu");
});
document.addEventListener("crowdef:level-lost", () => {
  MusicManager.play("menu");
});
document.addEventListener("crowdef:level-loaded", () => {
  MusicManager.play("calm");
});
document.addEventListener("crowdef:boss-charge", () => {
  ui.bossBanner.classList.add("charging");
  _bossChargeFlashTimer = 90;
  const v = document.getElementById("danger-vignette");
  if (v) {
    v.classList.add("active");
    setTimeout(() => v.classList.remove("active"), 1500);
  }
});
document.addEventListener("crowdef:level-restart", () => {
  ui.bossBanner.classList.remove("show", "charging");
  _bossRef = null;
});
document.addEventListener("crowdef:level-loaded", () => {
  ui.bossBanner.classList.remove("show", "charging");
  _bossRef = null;
  applyTheme(runner.level.theme || "plaine");
  // Default selection back to a tower the player can build in this world
  const w = getCurrentWorld();
  const curCfg = TOWER_TYPES[runner.selectedTowerType];
  if (!curCfg || (curCfg.unlockWorld || 1) > w) {
    runner.selectedTowerType = "archer";
  }
  refreshToolbarSelection();
});
document.addEventListener("crowdef:skin-equipped", (e) => {
  if (e.detail.category === "castle") {
    rebuildLevelDecor();
  } else if (e.detail.category === "hero") {
    runner.restart();
  }
});
document.addEventListener("crowdef:wave-start", refreshHUD);
document.addEventListener("crowdef:enemy-killed", (e) => {
  refreshHUD();
  if (e.detail?.pos) spawnFlyingCoin(e.detail.pos);
});
document.addEventListener("crowdef:tower-built", refreshHUD);
document.addEventListener("crowdef:castle-hit", (e) => {
  refreshHUD();
  ui.castleHpBox.classList.remove("flash");
  void ui.castleHpBox.offsetWidth;
  ui.castleHpBox.classList.add("flash");
  spawnDamagePopup(e.detail.dmg);
});

function spawnDamagePopup(dmg) {
  const popup = document.createElement("div");
  popup.className = "damage-popup";
  popup.textContent = `-${dmg}`;
  document.body.appendChild(popup);
  setTimeout(() => popup.remove(), 900);
}

const _coinFlyVec = new THREE.Vector3();
function spawnFlyingCoin(worldPos) {
  _coinFlyVec.set(worldPos.x, worldPos.y, worldPos.z);
  _coinFlyVec.project(camera);
  if (_coinFlyVec.z >= 1) return;
  const sx = (_coinFlyVec.x * 0.5 + 0.5) * window.innerWidth;
  const sy = (-_coinFlyVec.y * 0.5 + 0.5) * window.innerHeight;
  const target = ui.coins.getBoundingClientRect();
  const tx = target.left + target.width / 2;
  const ty = target.top + target.height / 2;
  const el = document.createElement("div");
  el.className = "coin-fly";
  el.textContent = "🪙";
  el.style.transform = `translate(${sx - 12}px, ${sy - 12}px) scale(1)`;
  document.body.appendChild(el);
  requestAnimationFrame(() => {
    el.classList.add("flying");
    el.style.transform = `translate(${tx - 12}px, ${ty - 12}px) scale(0.55)`;
  });
  setTimeout(() => el.remove(), 620);
}

function computeStars(castleHP, castleHPMax) {
  if (castleHP <= 0) return 0;
  const ratio = castleHP / castleHPMax;
  if (ratio >= 0.95) return 3;
  if (ratio >= 0.5) return 2;
  return 1;
}

function showResult(won, detail) {
  const stars = won ? computeStars(detail.castleHP, detail.castleHPMax) : 0;
  ui.resultTitle.textContent = won ? "Victoire !" : "Château tombé";
  ui.result.classList.toggle("lost", !won);
  ui.resultCastle.textContent = won ? `${Math.ceil(detail.castleHP)}/${detail.castleHPMax}` : `0/${detail.castleHPMax || runner.castleHPMax}`;
  ui.resultWave.textContent = detail.wave;
  ui.resultCoins.textContent = Math.floor(runner.coins);

  ui.star1.classList.toggle("earned", stars >= 1);
  ui.star2.classList.toggle("earned", stars >= 2);
  ui.star3.classList.toggle("earned", stars >= 3);

  ui.resultNextBtn.disabled = !won;
  ui.resultNextBtn.style.display = won ? "" : "none";

  const shopBtn = document.getElementById("result-shop-btn");
  if (shopBtn) {
    const hasBoss = (runner.level.waves?.list || []).some((w) =>
      Object.keys(w.types || {}).some((t) => t.includes("boss") || t === "midboss"),
    );
    shopBtn.style.display = won && hasBoss ? "" : "none";
  }

  ui.result.classList.add("show");

  SaveSystem.recordWaveReached(detail.wave);
  SaveSystem.recordLevelDone(runner.level.id, {
    win: won,
    wave: detail.wave,
    castleHP: won ? detail.castleHP : 0,
    stars,
  });
}

document.addEventListener("crowdef:level-lost", (e) => {
  showResult(false, { wave: e.detail.wave, castleHPMax: runner.castleHPMax });
});

document.addEventListener("crowdef:level-won", (e) => {
  showResult(true, e.detail);
});

document.addEventListener("crowdef:level-restart", () => {
  ui.result.classList.remove("show");
  ui.perkOverlay.classList.remove("show");
  _perkQueue = 0;
  refreshHUD();
  showBriefing(runner.level);
});

document.addEventListener("crowdef:level-loaded", () => {
  ui.result.classList.remove("show");
  ui.perkOverlay.classList.remove("show");
  _perkQueue = 0;
  rebuildLevelDecor();
  refreshHUD();
  if (!maybeShowCutscene(runner.level)) {
    showBriefing(runner.level);
  }
});

let _perkQueue = 0;

document.addEventListener("crowdef:hero-levelup", (e) => {
  _perkQueue++;
  if (!ui.perkOverlay.classList.contains("show")) {
    showNextPerkChoice();
  }
});

function showNextPerkChoice() {
  if (_perkQueue <= 0 || !runner.hero) return;
  const perkCount = (runner.metaBonuses && runner.metaBonuses.perkChoiceCount) || 3;
  const choices = rollPerkChoices(runner.hero, perkCount);
  if (!choices.length) {
    _perkQueue = 0;
    return;
  }
  ui.perkLevel.textContent = runner.hero.level;
  ui.perkCards.innerHTML = "";
  for (const perk of choices) {
    const card = document.createElement("div");
    card.className = `perk-card cat-${perk.category}`;
    card.innerHTML = `
      <div class="icon">${perk.icon}</div>
      <div class="name">${perk.name}</div>
      <div class="desc">${perk.description}</div>
      <div class="stack">${perk.stackable ? "Empilable" : "Une seule fois"}</div>
    `;
    card.addEventListener("click", () => {
      runner.hero.applyPerk(perk);
      document.dispatchEvent(new CustomEvent("crowdef:perk-picked", { detail: { id: perk.id, level: runner.hero.level } }));
      ui.perkOverlay.classList.remove("show");
      _perkQueue--;
      runner.resume();
      if (_perkQueue > 0) {
        setTimeout(showNextPerkChoice, 250);
      }
    });
    ui.perkCards.appendChild(card);
  }
  runner.pause();
  ui.perkOverlay.classList.add("show");
}

ui.result.querySelector('button[data-action="restart"]').addEventListener("click", () => {
  runner.restart();
});
ui.result.querySelector('button[data-action="next"]').addEventListener("click", () => {
  const nextId = getNextLevelId(runner.level.id);
  const next = nextId ? getLevel(nextId) : null;
  if (next) runner.loadLevel(next);
  else runner.restart();
});
ui.result.querySelector('button[data-action="map"]').addEventListener("click", () => {
  showWorldMap();
});
ui.result.querySelector('button[data-action="shop"]').addEventListener("click", () => {
  ui.result.classList.remove("show");
  showShop();
});

function showWorldMap() {
  const grid = ui.worldmapGrid;
  grid.innerHTML = "";
  const allIds = [...LEVEL_ORDER];
  if (SaveSystem.isLevelComplete("world1-8")) allIds.push("endless");
  for (const id of allIds) {
    const lvl = getLevel(id);
    if (!lvl) continue;
    const tile = document.createElement("div");
    tile.className = "level-tile";
    const unlocked = SaveSystem.isLevelUnlocked(id, LEVEL_ORDER);
    const completed = SaveSystem.isLevelComplete(id);
    const stars = SaveSystem.getStars(id);
    if (!unlocked) tile.classList.add("locked");
    if (completed) tile.classList.add("completed");
    const num = id === "endless" ? "∞" : (id.split("-")[1] || "?");
    if (id === "endless") {
      const bestWave = SaveSystem.getBestWave();
      tile.innerHTML = `
        <div class="level-num">${num}</div>
        <div class="level-name">${lvl.name}</div>
        <div class="level-stars">Vague ${bestWave}</div>
      `;
    } else {
      tile.innerHTML = `
        <div class="level-num">${num}</div>
        <div class="level-name">${lvl.name || id}</div>
        <div class="level-stars">
          <span class="${stars >= 1 ? "filled" : "empty"}">★</span>
          <span class="${stars >= 2 ? "filled" : "empty"}">★</span>
          <span class="${stars >= 3 ? "filled" : "empty"}">★</span>
        </div>
      `;
    }
    if (unlocked) {
      tile.addEventListener("click", () => {
        ui.worldmap.classList.remove("show");
        ui.result.classList.remove("show");
        runner.loadLevel(lvl);
      });
    }
    grid.appendChild(tile);
  }
  ui.worldmapStars.textContent = SaveSystem.totalStars();
  ui.worldmap.classList.add("show");
  runner.pause();
}

function closeWorldMap() {
  ui.worldmap.classList.remove("show");
  if (!ui.result.classList.contains("show") && !ui.briefing.classList.contains("show") && !ui.perkOverlay.classList.contains("show")) {
    runner.resume();
  }
}

ui.mapBtn.addEventListener("click", showWorldMap);
ui.worldmap.querySelector('button[data-action="close"]').addEventListener("click", closeWorldMap);
window.addEventListener("keydown", (e) => {
  if (e.code === "KeyM" && !e.repeat) {
    if (ui.worldmap.classList.contains("show")) closeWorldMap();
    else showWorldMap();
  }
  if (e.code === "KeyU" && !e.repeat) {
    if (ui.shop.classList.contains("show")) closeShop();
    else showShop();
  }
});

function renderShop() {
  ui.shopGems.textContent = SaveSystem.getGems();
  const tiersDiv = ui.shopTiers;
  tiersDiv.innerHTML = "";
  const byTier = { 1: [], 2: [], 3: [] };
  for (const u of META_UPGRADES) byTier[u.tier].push(u);

  for (const tier of [1, 2, 3]) {
    const tierCfg = UPGRADE_TIERS[tier];
    const unlocked = isTierUnlocked(tier, SaveSystem);
    const tierDiv = document.createElement("div");
    tierDiv.className = "shop-tier" + (unlocked ? "" : " locked");
    const title = document.createElement("div");
    title.className = "shop-tier-title";
    title.textContent = tierCfg.name;
    if (!unlocked) title.setAttribute("data-hint", tierCfg.unlockHint);
    tierDiv.appendChild(title);
    const grid = document.createElement("div");
    grid.className = "shop-grid";
    for (const u of byTier[tier]) {
      grid.appendChild(buildShopCard(u, unlocked));
    }
    tierDiv.appendChild(grid);
    tiersDiv.appendChild(tierDiv);
  }
}

function buildShopCard(upgrade, tierUnlocked) {
  const lvl = SaveSystem.getUpgradeLevel(upgrade.id);
  const maxed = lvl >= UPGRADE_MAX_LEVEL;
  const card = document.createElement("div");
  card.className = `shop-card cat-${upgrade.category}` + (maxed ? " maxed" : "") + (tierUnlocked ? "" : " locked");
  const nextCost = maxed ? null : getCostForLevel(lvl);
  const canAfford = nextCost != null && SaveSystem.getGems() >= nextCost;
  const canBuy = tierUnlocked && !maxed && canAfford;
  const canReset = tierUnlocked && lvl > 0 && SaveSystem.getGems() >= RESET_COST_GEMS;

  const pips = [];
  for (let i = 0; i < UPGRADE_MAX_LEVEL; i++) {
    pips.push(`<div class="pip${i < lvl ? " filled" : ""}"></div>`);
  }
  const currentEffect = lvl > 0 ? upgrade.perLevelLabel[lvl - 1] : "—";
  const nextEffect = maxed ? "MAX" : upgrade.perLevelLabel[lvl];

  card.innerHTML = `
    <div class="row1">
      <div class="icon">${upgrade.icon}</div>
      <div class="name">${upgrade.name}</div>
      <div class="level-pips">${pips.join("")}</div>
    </div>
    <div class="desc">${upgrade.description}<br><strong>Actuel :</strong> ${currentEffect} → <strong>Prochain :</strong> ${nextEffect}</div>
    <div class="actions">
      <button class="upgrade-btn" data-id="${upgrade.id}" ${canBuy ? "" : "disabled"}>${maxed ? "MAX" : `${nextCost} 💎`}</button>
      <button class="reset-btn" data-id="${upgrade.id}" ${canReset ? "" : "disabled"} title="Reset (${RESET_COST_GEMS}💎)">↺</button>
    </div>
  `;
  const upgradeBtn = card.querySelector(".upgrade-btn");
  upgradeBtn.addEventListener("click", () => {
    if (!canBuy) return;
    if (!SaveSystem.spendGems(nextCost)) return;
    SaveSystem.setUpgradeLevel(upgrade.id, lvl + 1);
    document.dispatchEvent(new CustomEvent("crowdef:upgrade-purchased", { detail: { id: upgrade.id, level: lvl + 1 } }));
    renderShop();
    refreshHUD();
  });
  const resetBtn = card.querySelector(".reset-btn");
  resetBtn.addEventListener("click", () => {
    if (!canReset) return;
    if (!SaveSystem.spendGems(RESET_COST_GEMS)) return;
    const refund = [0, 5, 20, 60][lvl] || 0;
    SaveSystem.addGems(refund);
    SaveSystem.resetUpgrade(upgrade.id);
    document.dispatchEvent(new CustomEvent("crowdef:upgrade-reset", { detail: { id: upgrade.id, refund } }));
    renderShop();
    refreshHUD();
  });
  return card;
}

function renderSkins(category) {
  const grid = document.getElementById(`skins-grid-${category}`);
  if (!grid) return;
  grid.innerHTML = "";
  const skins = getSkinsByCategory(category);
  const equippedId = SaveSystem.getEquippedSkin(category);
  for (const skin of skins) {
    const owned = isSkinUnlocked(skin.id, SaveSystem);
    const equipped = equippedId === skin.id;
    const card = document.createElement("div");
    card.className = "skin-card" + (equipped ? " equipped" : "") + (!owned ? " locked" : "");
    card.dataset.skinId = skin.id;
    const bgColor = skin.color || "#2c3e54";
    let unlockHint = "";
    let unlockClass = "";
    if (skin.unlock.type === "default") { unlockHint = "Par défaut"; unlockClass = "unlocked"; }
    else if (owned) { unlockHint = equipped ? "Équipé" : "Cliquer pour équiper"; unlockClass = "unlocked"; }
    else if (skin.unlock.type === "purchase") { unlockHint = `${skin.unlock.cost} 💎 — clic pour acheter`; unlockClass = "purchase"; }
    else if (skin.unlock.type === "drop") { unlockHint = `Tombe du boss ${skin.unlock.boss}`; unlockClass = "locked-text"; }
    else if (skin.unlock.type === "achievement") { unlockHint = achievementHint(skin.unlock.id); unlockClass = "locked-text"; }

    card.innerHTML = `
      <div class="skin-icon-box" style="background:${bgColor};">${skin.icon}</div>
      <div class="name">${skin.name}</div>
      <div class="desc">${skin.description}</div>
      <div class="unlock-hint ${unlockClass}">${unlockHint}</div>
    `;
    card.addEventListener("click", () => onSkinCardClick(skin));
    grid.appendChild(card);
  }
}

function achievementHint(achId) {
  const map = {
    perfect_world1: "Termine W1 sans perdre PV château",
    kills_100: `${SaveSystem.getTotalKills()}/100 ennemis tués`,
  };
  return map[achId] || `Succès : ${achId}`;
}

function onSkinCardClick(skin) {
  const owned = isSkinUnlocked(skin.id, SaveSystem);
  if (owned) {
    SaveSystem.equipSkin(skin.category, skin.id);
    document.dispatchEvent(new CustomEvent("crowdef:skin-equipped", { detail: { id: skin.id, category: skin.category } }));
    renderSkins(skin.category);
    return;
  }
  if (skin.unlock.type === "purchase") {
    if (!SaveSystem.spendGems(skin.unlock.cost)) return;
    SaveSystem.ownSkin(skin.id);
    SaveSystem.equipSkin(skin.category, skin.id);
    document.dispatchEvent(new CustomEvent("crowdef:skin-purchased", { detail: { id: skin.id, cost: skin.unlock.cost } }));
    renderSkins(skin.category);
    refreshHUD();
    ui.shopGems.textContent = SaveSystem.getGems();
  }
}

function setShopTab(tabName) {
  for (const t of ui.shop.querySelectorAll(".shop-tab")) {
    t.classList.toggle("active", t.dataset.tab === tabName);
  }
  for (const p of ui.shop.querySelectorAll(".shop-page")) {
    p.classList.toggle("active", p.dataset.page === tabName);
  }
  if (tabName === "skins-hero") renderSkins("hero");
  else if (tabName === "skins-castle") renderSkins("castle");
  else if (tabName === "skins-vfx") renderSkins("vfx");
  else renderShop();
}

for (const tab of ui.shop.querySelectorAll(".shop-tab")) {
  tab.addEventListener("click", () => setShopTab(tab.dataset.tab));
}

function showShop() {
  if (ui.briefing.classList.contains("show")) return;
  renderShop();
  renderSkins("hero");
  renderSkins("castle");
  renderSkins("vfx");
  ui.shop.classList.add("show");
  runner.pause();
}

function closeShop() {
  ui.shop.classList.remove("show");
  if (!ui.result.classList.contains("show") && !ui.briefing.classList.contains("show") && !ui.perkOverlay.classList.contains("show") && !ui.worldmap.classList.contains("show")) {
    runner.resume();
  }
}

ui.shopBtn.addEventListener("click", showShop);
ui.shop.querySelector('button[data-action="close"]').addEventListener("click", closeShop);

let _briefingTimer = null;
let _briefingDisabled = false;
const cutsceneOverlay = document.getElementById("cutscene");
const cutsceneIcon = document.getElementById("cutscene-icon");
const cutsceneTitle = document.getElementById("cutscene-title");
const cutsceneText = document.getElementById("cutscene-text");
let _pendingBriefingLevel = null;

function maybeShowCutscene(level) {
  const cs = getCutsceneForLevel(level.id);
  if (!cs) return false;
  if (SaveSystem.hasSeenCutscene(cs.id)) return false;
  cutsceneIcon.textContent = cs.icon;
  cutsceneTitle.textContent = cs.title;
  cutsceneText.innerHTML = cs.paragraphs.map((p) => `<p style="margin:0 0 10px 0;">${p}</p>`).join("");
  cutsceneOverlay.classList.add("show");
  runner.pause();
  _pendingBriefingLevel = level;
  SaveSystem.markCutsceneSeen(cs.id);
  return true;
}

cutsceneOverlay.querySelector('button[data-action="continue"]').addEventListener("click", () => {
  cutsceneOverlay.classList.remove("show");
  const lvl = _pendingBriefingLevel;
  _pendingBriefingLevel = null;
  if (lvl) showBriefing(lvl);
});

function showBriefing(level) {
  if (_briefingTimer) {
    clearInterval(_briefingTimer);
    _briefingTimer = null;
  }
  if (_briefingDisabled) {
    ui.briefing.classList.remove("show");
    runner.resume();
    return;
  }
  ui.briefingName.textContent = level.name || level.id;
  ui.briefingText.textContent = level.briefing || "";
  ui.briefing.classList.add("show");
  runner.pause();
  let count = 3;
  ui.briefingCountdown.textContent = count;
  _briefingTimer = setInterval(() => {
    count--;
    if (count <= 0) {
      clearInterval(_briefingTimer);
      _briefingTimer = null;
      ui.briefing.classList.remove("show");
      runner.resume();
    } else {
      ui.briefingCountdown.textContent = count;
    }
  }, 800);
}

function skipBriefing() {
  _briefingDisabled = true;
  if (_briefingTimer) {
    clearInterval(_briefingTimer);
    _briefingTimer = null;
  }
  ui.briefing.classList.remove("show");
  runner.resume();
}

if (!maybeShowCutscene(runner.level)) {
  showBriefing(runner.level);
}

const muteBtn = document.getElementById("mute-btn");
function refreshMuteUI() {
  const m = Audio.isMuted();
  muteBtn.textContent = m ? "🔇" : "🔊";
  muteBtn.classList.toggle("muted", m);
  muteBtn.setAttribute("aria-pressed", m ? "true" : "false");
}
muteBtn.addEventListener("click", () => {
  Audio.toggleMuted();
  SaveSystem.setMuted(Audio.isMuted());
  MusicManager.setMuted(Audio.isMuted());
  refreshMuteUI();
});
refreshMuteUI();

const settingsBtn = document.getElementById("settings-btn");
const settingsOverlay = document.getElementById("settings");
const musicVolSlider = document.getElementById("settings-music-vol");
const sfxVolSlider = document.getElementById("settings-sfx-vol");
const musicVolVal = document.getElementById("settings-music-val");
const sfxVolVal = document.getElementById("settings-sfx-val");
function refreshSettingsUI() {
  const mv = SaveSystem.getMusicVolume();
  const sv = SaveSystem.getSfxVolume();
  musicVolSlider.value = Math.round(mv * 100);
  sfxVolSlider.value = Math.round(sv * 100);
  musicVolVal.textContent = `${Math.round(mv * 100)}%`;
  sfxVolVal.textContent = `${Math.round(sv * 100)}%`;
}
musicVolSlider.addEventListener("input", () => {
  const v = parseInt(musicVolSlider.value, 10) / 100;
  SaveSystem.setMusicVolume(v);
  MusicManager.setMusicVolume(v);
  musicVolVal.textContent = `${Math.round(v * 100)}%`;
});
sfxVolSlider.addEventListener("input", () => {
  const v = parseInt(sfxVolSlider.value, 10) / 100;
  SaveSystem.setSfxVolume(v);
  Audio.setVolume(v);
  sfxVolVal.textContent = `${Math.round(v * 100)}%`;
});
settingsBtn.addEventListener("click", () => {
  refreshSettingsUI();
  settingsOverlay.classList.add("show");
  runner.pause();
});
settingsOverlay.querySelector('button[data-action="close"]').addEventListener("click", () => {
  settingsOverlay.classList.remove("show");
  if (!ui.shop.classList.contains("show") && !ui.briefing.classList.contains("show") && !ui.perkOverlay.classList.contains("show") && !ui.worldmap.classList.contains("show") && !ui.result.classList.contains("show")) {
    runner.resume();
  }
});

function startAudioOnGesture() {
  Audio.start();
  MusicManager.start();
  MusicManager.setMuted(Audio.isMuted());
  MusicManager.play("calm");
  window.removeEventListener("pointerdown", startAudioOnGesture);
  window.removeEventListener("keydown", startAudioOnGesture);
  window.removeEventListener("touchstart", startAudioOnGesture);
}
window.addEventListener("pointerdown", startAudioOnGesture, { once: false });
window.addEventListener("keydown", startAudioOnGesture, { once: false });
window.addEventListener("touchstart", startAudioOnGesture, { once: false });

document.addEventListener("visibilitychange", () => {
  if (document.hidden) runner.pause();
  else runner.resume();
});

const fpsMeter = document.getElementById("fps-meter");
let fpsFrames = 0;
let fpsLastUpdate = performance.now();
let fpsHidden = false;
function updateFpsMeter(now) {
  fpsFrames++;
  if (now - fpsLastUpdate >= 500) {
    const fps = (fpsFrames * 1000) / (now - fpsLastUpdate);
    fpsMeter.textContent = `${Math.round(fps)} FPS`;
    fpsMeter.classList.toggle("good", fps >= 50);
    fpsMeter.classList.toggle("warn", fps >= 30 && fps < 50);
    fpsMeter.classList.toggle("bad", fps < 30);
    fpsFrames = 0;
    fpsLastUpdate = now;
  }
}
fpsMeter.addEventListener("click", () => {
  fpsHidden = !fpsHidden;
  fpsMeter.classList.toggle("hidden", fpsHidden);
});
window.addEventListener("keydown", (e) => {
  if (e.code === "KeyF" && !e.repeat) {
    fpsHidden = !fpsHidden;
    fpsMeter.classList.toggle("hidden", fpsHidden);
  }
});

const clock = new THREE.Clock();
function tick() {
  const dt = Math.min(clock.getDelta(), 0.05);
  updateFpsMeter(performance.now());

  let mx, mz;
  if (window.__cdInput && window.__cdInput.override) {
    mx = window.__cdInput.dx;
    mz = window.__cdInput.dz;
  } else {
    mx = (keys.d - keys.a) + joystick.dx;
    mz = (keys.s - keys.w) + joystick.dy;
  }
  runner.setMove(mx, mz);

  runner.tick(dt);
  Particles.tick(dt);
  const shake = JuiceFX.tick(dt);
  SHAKE_OFFSET.copy(shake);
  refreshHUD();
  trackBossFromRunner();
  updateTowerPreview();
  updateRadialMenu();
  updateDecorFade(dt);

  if (runner.hero) {
    CAM_TARGET.x += (runner.hero.group.position.x - CAM_TARGET.x) * 0.06;
    CAM_TARGET.z += (runner.hero.group.position.z - CAM_TARGET.z) * 0.06;
  }
  refitCamera();

  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}
tick();

window.__cd = {
  runner,
  scene,
  camera,
  audio: Audio,
  music: MusicManager,
  save: SaveSystem,
  setSpeed: (n) => runner.setSpeed(n),
  pickPerk: (idx = 0) => {
    const cards = ui.perkCards.querySelectorAll(".perk-card");
    if (cards[idx]) cards[idx].click();
  },
  isPerkOpen: () => ui.perkOverlay.classList.contains("show"),
  skipBriefing: () => skipBriefing(),
  skipCutscene: () => {
    if (cutsceneOverlay.classList.contains("show")) {
      cutsceneOverlay.classList.remove("show");
      const lvl = _pendingBriefingLevel;
      _pendingBriefingLevel = null;
      if (lvl) showBriefing(lvl);
    }
  },
  loadLevel: (id) => {
    const lvl = getLevel(id);
    if (lvl) runner.loadLevel(lvl);
  },
  version: "post-fix-path-debug",
  debug: DEBUG_MODE,
  shop: {
    open: () => showShop(),
    close: () => closeShop(),
    isOpen: () => ui.shop.classList.contains("show"),
    buy: (id) => {
      if (!ui.shop.classList.contains("show")) showShop();
      const btn = ui.shopTiers.querySelector(`.upgrade-btn[data-id="${id}"]`);
      if (btn && !btn.disabled) btn.click();
    },
    setTab: (tab) => setShopTab(tab),
    equipSkin: (skinId) => {
      const skin = SKIN_BY_ID[skinId];
      if (!skin) return false;
      if (!isSkinUnlocked(skinId, SaveSystem)) return false;
      SaveSystem.equipSkin(skin.category, skinId);
      document.dispatchEvent(new CustomEvent("crowdef:skin-equipped", { detail: { id: skinId, category: skin.category } }));
      return true;
    },
  },
};
