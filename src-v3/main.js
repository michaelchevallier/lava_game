import * as THREE from "three";
import { makePathLine } from "./systems/Path.js";
import { LevelRunner } from "./systems/LevelRunner.js";
import { Particles } from "./systems/Particles.js";
import { JuiceFX } from "./systems/JuiceFX.js";
import { Audio } from "./systems/Audio.js";
import { SaveSystem } from "./systems/SaveSystem.js";
import world1_1 from "./data/levels/world1-1.js";

SaveSystem.load();
Audio.setMuted(SaveSystem.isMuted());

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

const pathLine = makePathLine(runner.path, dirtMat);
scene.add(pathLine);

const castle = new THREE.Group();
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
  gameover: document.getElementById("gameover"),
  victory: document.getElementById("victory"),
  gameoverWave: document.getElementById("gameover-wave"),
  victoryCastle: document.getElementById("victory-castle"),
  victoryWave: document.getElementById("victory-wave"),
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

document.addEventListener("crowdef:level-lost", (e) => {
  ui.gameoverWave.textContent = e.detail.wave;
  ui.gameover.classList.add("show");
  SaveSystem.recordWaveReached(e.detail.wave);
  SaveSystem.recordLevelDone(runner.level.id, { win: false, wave: e.detail.wave, castleHP: 0 });
});

document.addEventListener("crowdef:level-won", (e) => {
  ui.victoryCastle.textContent = `${Math.ceil(e.detail.castleHP)}/${e.detail.castleHPMax}`;
  ui.victoryWave.textContent = e.detail.wave;
  ui.victory.classList.add("show");
  SaveSystem.recordWaveReached(e.detail.wave);
  SaveSystem.recordLevelDone(runner.level.id, { win: true, wave: e.detail.wave, castleHP: e.detail.castleHP });
});

document.addEventListener("crowdef:level-restart", () => {
  ui.gameover.classList.remove("show");
  ui.victory.classList.remove("show");
  refreshHUD();
});

ui.gameover.querySelector('button[data-action="restart"]').addEventListener("click", () => {
  runner.restart();
});
ui.victory.querySelector('button[data-action="restart"]').addEventListener("click", () => {
  runner.restart();
});

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

const clock = new THREE.Clock();
function tick() {
  const dt = Math.min(clock.getDelta(), 0.05);

  let mx = (keys.d - keys.a) + joystick.dx;
  let mz = (keys.s - keys.w) + joystick.dy;
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
  version: "j1-c7",
};
