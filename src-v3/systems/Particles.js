import * as THREE from "three";

const POOL_SIZE = 300;
const TEXTURE_SIZE = 64;

let scene = null;
let pool = [];
let cursor = 0;
let sharedTexture = null;

function makeRadialTexture() {
  const c = document.createElement("canvas");
  c.width = TEXTURE_SIZE;
  c.height = TEXTURE_SIZE;
  const ctx = c.getContext("2d");
  const grad = ctx.createRadialGradient(
    TEXTURE_SIZE / 2, TEXTURE_SIZE / 2, 0,
    TEXTURE_SIZE / 2, TEXTURE_SIZE / 2, TEXTURE_SIZE / 2,
  );
  grad.addColorStop(0, "rgba(255,255,255,1)");
  grad.addColorStop(0.4, "rgba(255,255,255,0.7)");
  grad.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, TEXTURE_SIZE, TEXTURE_SIZE);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function recycle(p) {
  p.alive = false;
  p.sprite.visible = false;
}

function spawn(pos, color, scale, vx, vy, vz, life) {
  const p = pool[cursor];
  cursor = (cursor + 1) % POOL_SIZE;
  p.alive = true;
  p.life = life;
  p.maxLife = life;
  p.sprite.position.set(pos.x, pos.y, pos.z);
  p.sprite.material.color.setHex(color);
  p.sprite.material.opacity = 1;
  p.sprite.scale.set(scale, scale, scale);
  p.sprite.visible = true;
  p.vx = vx;
  p.vy = vy;
  p.vz = vz;
  p.scaleStart = scale;
}

export const Particles = {
  init(targetScene) {
    if (scene) return;
    scene = targetScene;
    sharedTexture = makeRadialTexture();
    for (let i = 0; i < POOL_SIZE; i++) {
      const mat = new THREE.SpriteMaterial({
        map: sharedTexture,
        color: 0xffffff,
        transparent: true,
        opacity: 1,
        depthWrite: false,
      });
      const sprite = new THREE.Sprite(mat);
      sprite.visible = false;
      scene.add(sprite);
      pool.push({ sprite, alive: false, life: 0, maxLife: 0, vx: 0, vy: 0, vz: 0, scaleStart: 1 });
    }
  },

  emit(pos, color = 0xffffff, count = 6, opts = {}) {
    if (!scene) return;
    const speed = opts.speed ?? 3;
    const life = opts.life ?? 0.5;
    const scale = opts.scale ?? 0.4;
    const yLift = opts.yLift ?? 1.0;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const tilt = Math.random() * 0.6;
      const v = speed * (0.6 + Math.random() * 0.6);
      const vx = Math.cos(angle) * v * Math.cos(tilt);
      const vz = Math.sin(angle) * v * Math.cos(tilt);
      const vy = yLift * (0.5 + Math.random()) * Math.sin(tilt);
      spawn(pos, color, scale * (0.7 + Math.random() * 0.6), vx, vy, vz, life);
    }
  },

  tick(dt) {
    if (!scene) return;
    for (const p of pool) {
      if (!p.alive) continue;
      p.life -= dt;
      if (p.life <= 0) { recycle(p); continue; }
      p.sprite.position.x += p.vx * dt;
      p.sprite.position.y += p.vy * dt;
      p.sprite.position.z += p.vz * dt;
      p.vy -= 4 * dt;
      const ratio = p.life / p.maxLife;
      p.sprite.material.opacity = ratio;
      const s = p.scaleStart * (0.6 + (1 - ratio) * 0.7);
      p.sprite.scale.set(s, s, s);
    }
  },

  count() {
    let c = 0;
    for (const p of pool) if (p.alive) c++;
    return c;
  },
};
