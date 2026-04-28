import * as THREE from "three";
import { buildPath, makePathLine } from "./systems/Path.js";
import { Enemy } from "./entities/Enemy.js";
import { Hero } from "./entities/Hero.js";
import { Tower } from "./entities/Tower.js";

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
function refitCamera() {
  camera.position.copy(CAM_TARGET).add(CAM_OFFSET);
  camera.lookAt(CAM_TARGET);
}
refitCamera();
resize();
window.addEventListener("resize", resize);

// ─── Lighting (toon-ish: bright key + cool fill, soft ground)
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

// ─── Ground
const groundGeom = new THREE.PlaneGeometry(80, 80, 1, 1);
const groundMat = new THREE.MeshLambertMaterial({ color: 0x6fc16d });
const ground = new THREE.Mesh(groundGeom, groundMat);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// Ground accent stripes (path bed)
const dirtMat = new THREE.MeshLambertMaterial({ color: 0xcca06a });

// ─── Path
const path = buildPath();
const pathLine = makePathLine(path, dirtMat);
scene.add(pathLine);

// Decorative trees (simple cones)
function addTree(x, z, h = 2.5) {
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

// ─── Castle (the thing you defend) at the path's END
const castle = new THREE.Group();
const base = new THREE.Mesh(
  new THREE.BoxGeometry(3, 1.2, 3),
  new THREE.MeshLambertMaterial({ color: 0xdcdcdc }),
);
base.position.y = 0.6;
base.castShadow = true;
castle.add(base);

const roof = new THREE.Mesh(
  new THREE.ConeGeometry(2.2, 1.6, 4),
  new THREE.MeshLambertMaterial({ color: 0x3a6abf }),
);
roof.position.y = 1.2 + 0.8;
roof.rotation.y = Math.PI / 4;
roof.castShadow = true;
castle.add(roof);

const endPoint = path.getPointAt(1);
castle.position.set(endPoint.x, 0, endPoint.z);
scene.add(castle);

// ─── Hero (auto-aim defender, moveable via WASD/joystick)
const hero = new Hero(scene, new THREE.Vector3(-2, 0, -1));

// Keyboard
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

// Touch joystick (bottom-left)
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

// ─── Tower slots — proximity-build (Kingshot-ad style)
//   Hero rentre dans le cercle → l'or coule → la tour se construit
const SLOT_RADIUS = 1.6;
const BUILD_DRAIN_PER_SEC = 30; // ¢/sec when hero stands inside
const towerSlotsConfig = [
  { t: 0.28, cost: 30 },
  { t: 0.50, cost: 50 },
  { t: 0.72, cost: 75 },
];

function makeLabelSprite(text) {
  const canvas2 = document.createElement("canvas");
  canvas2.width = 256; canvas2.height = 96;
  const ctx2 = canvas2.getContext("2d");
  ctx2.fillStyle = "rgba(20,28,36,0.88)";
  ctx2.fillRect(0, 0, 256, 96);
  ctx2.strokeStyle = "#ffd23f";
  ctx2.lineWidth = 6;
  ctx2.strokeRect(3, 3, 250, 90);
  ctx2.fillStyle = "#ffd23f";
  ctx2.font = "bold 60px system-ui";
  ctx2.textAlign = "center";
  ctx2.textBaseline = "middle";
  ctx2.fillText(text, 128, 48);
  const tex = new THREE.CanvasTexture(canvas2);
  tex.colorSpace = THREE.SRGBColorSpace;
  return { tex, canvas: canvas2, ctx: ctx2 };
}

function updateLabelSprite(spriteData, text) {
  const { ctx, canvas, tex } = spriteData;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "rgba(20,28,36,0.88)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = "#ffd23f";
  ctx.lineWidth = 6;
  ctx.strokeRect(3, 3, canvas.width - 6, canvas.height - 6);
  ctx.fillStyle = "#ffd23f";
  ctx.font = "bold 60px system-ui";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);
  tex.needsUpdate = true;
}

const slots = [];
for (const s of towerSlotsConfig) {
  const p = path.getPointAt(s.t);
  const offset = path.getTangentAt(s.t).cross(new THREE.Vector3(0, 1, 0)).normalize().multiplyScalar(2.4);
  const pos = p.clone().add(offset);

  // Outer ring (footprint, dashed-feel via larger radius)
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(SLOT_RADIUS - 0.15, SLOT_RADIUS, 48),
    new THREE.MeshBasicMaterial({ color: 0xffd23f, transparent: true, opacity: 0.7, side: THREE.DoubleSide }),
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.set(pos.x, 0.02, pos.z);
  scene.add(ring);

  // Inner fill ring — grows as build progresses
  const fill = new THREE.Mesh(
    new THREE.CircleGeometry(SLOT_RADIUS - 0.2, 32, 0, 0.001),
    new THREE.MeshBasicMaterial({ color: 0x66ddaa, transparent: true, opacity: 0.5, side: THREE.DoubleSide }),
  );
  fill.rotation.x = -Math.PI / 2;
  fill.position.set(pos.x, 0.025, pos.z);
  scene.add(fill);

  // Floor glow (pulse when hero approaches)
  const glow = new THREE.Mesh(
    new THREE.CircleGeometry(SLOT_RADIUS, 32),
    new THREE.MeshBasicMaterial({ color: 0xffd23f, transparent: true, opacity: 0.12, side: THREE.DoubleSide }),
  );
  glow.rotation.x = -Math.PI / 2;
  glow.position.set(pos.x, 0.015, pos.z);
  scene.add(glow);

  const labelData = makeLabelSprite("🪙" + s.cost);
  const labelMat = new THREE.SpriteMaterial({ map: labelData.tex, depthTest: false });
  const label = new THREE.Sprite(labelMat);
  label.position.set(pos.x, 1.6, pos.z);
  label.scale.set(2.2, 0.85, 1);
  scene.add(label);

  slots.push({
    pos, ring, fill, glow, label, labelData,
    cost: s.cost, paid: 0, tower: null, t: s.t,
  });
}

// ─── State
const state = {
  coins: 100,
  wave: 1,
  enemies: [],
  spawnTimer: 0,
  spawnRate: 600, // ms between enemies during a wave
  enemiesPerWave: 25,
  enemiesSpawned: 0,
  waveActive: true,
  waveBreakTimer: 0,
  hero,
  towers: [],
  path,
};

const ui = {
  coins: document.getElementById("coins"),
  wave: document.getElementById("wave"),
};
function refreshUI() {
  ui.coins.textContent = state.coins;
  ui.wave.textContent = "Vague " + state.wave;
}
refreshUI();

// ─── Proximity-build : hero entre dans le cercle, l'or s'écoule, la tour se monte
function updateBuilds(dt) {
  for (const slot of slots) {
    if (slot.tower) continue;
    const dx = hero.group.position.x - slot.pos.x;
    const dz = hero.group.position.z - slot.pos.z;
    const inside = (dx * dx + dz * dz) < SLOT_RADIUS * SLOT_RADIUS;

    // Pulse glow
    const targetGlowAlpha = inside ? 0.35 : 0.12;
    slot.glow.material.opacity += (targetGlowAlpha - slot.glow.material.opacity) * 0.15;

    if (inside && state.coins > 0) {
      const drain = Math.min(state.coins, BUILD_DRAIN_PER_SEC * dt);
      state.coins -= drain;
      slot.paid += drain;
      if (slot.paid >= slot.cost) slot.paid = slot.cost;
      refreshUI();
    }

    // Update fill arc (CircleGeometry-like)
    const ratio = slot.paid / slot.cost;
    if (slot.fill._lastRatio !== ratio) {
      slot.fill._lastRatio = ratio;
      slot.fill.geometry.dispose();
      const angle = Math.max(0.001, Math.PI * 2 * ratio);
      slot.fill.geometry = new THREE.CircleGeometry(SLOT_RADIUS - 0.2, 32, -Math.PI / 2, -angle);
    }

    // Update label : remaining cost
    const remaining = Math.max(0, Math.ceil(slot.cost - slot.paid));
    if (slot.labelData._lastText !== remaining) {
      slot.labelData._lastText = remaining;
      updateLabelSprite(slot.labelData, "🪙" + remaining);
    }

    // Build complete → spawn tower
    if (slot.paid >= slot.cost) {
      const tower = new Tower(scene, slot.pos.clone());
      slot.tower = tower;
      state.towers.push(tower);
      scene.remove(slot.ring);
      scene.remove(slot.fill);
      scene.remove(slot.glow);
      scene.remove(slot.label);
    }
  }
}

// ─── Game loop
const clock = new THREE.Clock();
function spawnEnemy() {
  const e = new Enemy(scene, path);
  state.enemies.push(e);
}

function tick() {
  const dt = Math.min(clock.getDelta(), 0.05);
  const dtMs = dt * 1000;

  // Wave management
  if (state.waveActive) {
    state.spawnTimer += dtMs;
    if (state.spawnTimer >= state.spawnRate && state.enemiesSpawned < state.enemiesPerWave) {
      state.spawnTimer = 0;
      state.enemiesSpawned++;
      spawnEnemy();
    }
    if (state.enemiesSpawned >= state.enemiesPerWave && state.enemies.length === 0) {
      state.waveActive = false;
      state.waveBreakTimer = 0;
    }
  } else {
    state.waveBreakTimer += dtMs;
    if (state.waveBreakTimer > 4000) {
      state.wave++;
      state.enemiesPerWave = Math.round(state.enemiesPerWave * 1.25);
      state.spawnRate = Math.max(200, state.spawnRate - 40);
      state.enemiesSpawned = 0;
      state.spawnTimer = 0;
      state.waveActive = true;
      refreshUI();
    }
  }

  // Update enemies
  for (let i = state.enemies.length - 1; i >= 0; i--) {
    const e = state.enemies[i];
    e.tick(dt);
    if (e.dead || e.reachedEnd) {
      if (e.dead) {
        state.coins += 2;
        refreshUI();
      }
      e.destroy();
      state.enemies.splice(i, 1);
    }
  }

  // Hero input → movement
  let mx = (keys.d - keys.a) + joystick.dx;
  let mz = (keys.s - keys.w) + joystick.dy;
  hero.setMove(mx, mz);

  // Update hero (auto-aim closest enemy + movement)
  hero.tick(dt, state.enemies);

  // Proximity-build : hero rentre dans un slot → l'or coule
  updateBuilds(dt);

  // Update towers
  for (const t of state.towers) t.tick(dt, state.enemies);

  // Camera follows hero softly (lerp toward hero pos with offset)
  CAM_TARGET.x += (hero.group.position.x - CAM_TARGET.x) * 0.06;
  CAM_TARGET.z += (hero.group.position.z - CAM_TARGET.z) * 0.06;
  refitCamera();

  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}
tick();

// debug
window.__cd = { state, scene, camera };
