import * as THREE from "three";
import { makePathLine } from "./systems/Path.js";
import { LevelRunner } from "./systems/LevelRunner.js";
import { Particles } from "./systems/Particles.js";
import { JuiceFX } from "./systems/JuiceFX.js";
import { Audio } from "./systems/Audio.js";
import { SaveSystem } from "./systems/SaveSystem.js";
import { AssetLoader } from "./systems/AssetLoader.js";
import { rollPerkChoices } from "./data/perks.js";
import world1_1 from "./data/levels/world1-1.js";
import { getLevel, getNextLevelId, LEVEL_ORDER } from "./data/levels/index.js";

SaveSystem.load();
Audio.setMuted(SaveSystem.isMuted());

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

function addTree(x, z, h) {
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.22, 0.8),
    new THREE.MeshLambertMaterial({ color: 0x6a4422 }),
  );
  trunk.position.set(x, 0.4, z);
  trunk.castShadow = true;
  scene.add(trunk);
  const leaves = new THREE.Mesh(
    new THREE.ConeGeometry(0.9, h, 8),
    new THREE.MeshLambertMaterial({ color: 0x2f8a3a }),
  );
  leaves.position.set(x, 0.8 + h / 2, z);
  leaves.castShadow = true;
  scene.add(leaves);
}
for (let i = 0; i < 16; i++) {
  const angle = Math.random() * Math.PI * 2;
  const r = 14 + Math.random() * 8;
  const x = Math.cos(angle) * r;
  const z = Math.sin(angle) * r;
  if (Math.abs(x) > 6 || Math.abs(z) > 6) addTree(x, z, 2 + Math.random() * 2);
}

Particles.init(scene);
JuiceFX.init();

const runner = new LevelRunner(scene, world1_1);
runner.setup();

let pathLine = null;
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

function rebuildLevelDecor() {
  disposeMeshGroup(pathLine);
  disposeMeshGroup(castle);

  pathLine = makePathLine(runner.path, dirtMat);
  scene.add(pathLine);

  castle = new THREE.Group();
  const castleBase = new THREE.Mesh(
    new THREE.BoxGeometry(3, 1.2, 3),
    new THREE.MeshLambertMaterial({ color: 0xdcdcdc }),
  );
  castleBase.position.y = 0.6;
  castleBase.castShadow = true;
  castle.add(castleBase);
  const castleRoof = new THREE.Mesh(
    new THREE.ConeGeometry(2.2, 1.6, 4),
    new THREE.MeshLambertMaterial({ color: 0x3a6abf }),
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

const keys = { w: 0, a: 0, s: 0, d: 0 };
window.addEventListener("keydown", (e) => {
  if (e.code === "KeyW" || e.code === "ArrowUp") keys.w = 1;
  if (e.code === "KeyS" || e.code === "ArrowDown") keys.s = 1;
  if (e.code === "KeyA" || e.code === "ArrowLeft") keys.a = 1;
  if (e.code === "KeyD" || e.code === "ArrowRight") keys.d = 1;
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
};

function refreshHUD() {
  ui.coins.textContent = Math.floor(runner.coins);
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
document.addEventListener("crowdef:wave-start", refreshHUD);
document.addEventListener("crowdef:enemy-killed", refreshHUD);
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
  showBriefing(runner.level);
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
  const choices = rollPerkChoices(runner.hero, 3);
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

function showWorldMap() {
  const grid = ui.worldmapGrid;
  grid.innerHTML = "";
  for (const id of LEVEL_ORDER) {
    const lvl = getLevel(id);
    if (!lvl) continue;
    const tile = document.createElement("div");
    tile.className = "level-tile";
    const unlocked = SaveSystem.isLevelUnlocked(id, LEVEL_ORDER);
    const completed = SaveSystem.isLevelComplete(id);
    const stars = SaveSystem.getStars(id);
    if (!unlocked) tile.classList.add("locked");
    if (completed) tile.classList.add("completed");
    const num = id.split("-")[1] || "?";
    tile.innerHTML = `
      <div class="level-num">${num}</div>
      <div class="level-name">${lvl.name || id}</div>
      <div class="level-stars">
        <span class="${stars >= 1 ? "filled" : "empty"}">★</span>
        <span class="${stars >= 2 ? "filled" : "empty"}">★</span>
        <span class="${stars >= 3 ? "filled" : "empty"}">★</span>
      </div>
    `;
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
});

let _briefingTimer = null;
let _briefingDisabled = false;
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

showBriefing(runner.level);

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
  refreshMuteUI();
});
refreshMuteUI();

function startAudioOnGesture() {
  Audio.start();
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
  save: SaveSystem,
  setSpeed: (n) => runner.setSpeed(n),
  pickPerk: (idx = 0) => {
    const cards = ui.perkCards.querySelectorAll(".perk-card");
    if (cards[idx]) cards[idx].click();
  },
  isPerkOpen: () => ui.perkOverlay.classList.contains("show"),
  skipBriefing: () => skipBriefing(),
  loadLevel: (id) => {
    const lvl = getLevel(id);
    if (lvl) runner.loadLevel(lvl);
  },
  version: "j3-c1",
};
