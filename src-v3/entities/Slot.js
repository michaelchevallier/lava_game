import * as THREE from "three";
import { Tower } from "./Tower.js";

const SLOT_RADIUS = 1.6;
const BUILD_DRAIN_PER_SEC = 30;

function makeLabelSprite(text) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 96;
  const ctx = canvas.getContext("2d");
  drawLabel(ctx, canvas, text);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return { tex, canvas, ctx };
}

function drawLabel(ctx, canvas, text) {
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
}

export class Slot {
  constructor(scene, path, config) {
    this.scene = scene;
    this.path = path;
    this.cost = config.cost;
    this.t = config.t;
    this.paid = 0;
    this.tower = null;
    this._lastRatio = -1;
    this._lastLabelText = -1;

    const p = path.getPointAt(config.t);
    const offset = path.getTangentAt(config.t)
      .cross(new THREE.Vector3(0, 1, 0))
      .normalize()
      .multiplyScalar(config.lateralOffset || 2.4);
    this.pos = p.clone().add(offset);

    this.ring = new THREE.Mesh(
      new THREE.RingGeometry(SLOT_RADIUS - 0.15, SLOT_RADIUS, 48),
      new THREE.MeshBasicMaterial({ color: 0xffd23f, transparent: true, opacity: 0.7, side: THREE.DoubleSide }),
    );
    this.ring.rotation.x = -Math.PI / 2;
    this.ring.position.set(this.pos.x, 0.02, this.pos.z);
    scene.add(this.ring);

    this.fill = new THREE.Mesh(
      new THREE.CircleGeometry(SLOT_RADIUS - 0.2, 32, 0, 0.001),
      new THREE.MeshBasicMaterial({ color: 0x66ddaa, transparent: true, opacity: 0.5, side: THREE.DoubleSide }),
    );
    this.fill.rotation.x = -Math.PI / 2;
    this.fill.position.set(this.pos.x, 0.025, this.pos.z);
    scene.add(this.fill);

    this.glow = new THREE.Mesh(
      new THREE.CircleGeometry(SLOT_RADIUS, 32),
      new THREE.MeshBasicMaterial({ color: 0xffd23f, transparent: true, opacity: 0.12, side: THREE.DoubleSide }),
    );
    this.glow.rotation.x = -Math.PI / 2;
    this.glow.position.set(this.pos.x, 0.015, this.pos.z);
    scene.add(this.glow);

    this.labelData = makeLabelSprite("🪙" + this.cost);
    const labelMat = new THREE.SpriteMaterial({ map: this.labelData.tex, depthTest: false });
    this.label = new THREE.Sprite(labelMat);
    this.label.position.set(this.pos.x, 1.6, this.pos.z);
    this.label.scale.set(2.2, 0.85, 1);
    scene.add(this.label);
  }

  tick(dt, hero, runner) {
    if (this.tower) return false;

    const dx = hero.group.position.x - this.pos.x;
    const dz = hero.group.position.z - this.pos.z;
    const inside = (dx * dx + dz * dz) < SLOT_RADIUS * SLOT_RADIUS;

    const targetGlowAlpha = inside ? 0.35 : 0.12;
    this.glow.material.opacity += (targetGlowAlpha - this.glow.material.opacity) * 0.15;

    if (inside && runner.coins > 0 && this.paid < this.cost) {
      const drain = Math.min(runner.coins, BUILD_DRAIN_PER_SEC * dt);
      runner.coins -= drain;
      this.paid = Math.min(this.cost, this.paid + drain);
    }

    const ratio = this.paid / this.cost;
    if (Math.abs(ratio - this._lastRatio) > 0.01 || (ratio === 1 && this._lastRatio !== 1)) {
      this._lastRatio = ratio;
      this.fill.geometry.dispose();
      const angle = Math.max(0.001, Math.PI * 2 * ratio);
      this.fill.geometry = new THREE.CircleGeometry(SLOT_RADIUS - 0.2, 32, -Math.PI / 2, -angle);
    }

    const remaining = Math.max(0, Math.ceil(this.cost - this.paid));
    if (remaining !== this._lastLabelText) {
      this._lastLabelText = remaining;
      drawLabel(this.labelData.ctx, this.labelData.canvas, "🪙" + remaining);
      this.labelData.tex.needsUpdate = true;
    }

    if (this.paid >= this.cost && !this.tower) {
      this.tower = new Tower(this.scene, this.pos.clone());
      this.scene.remove(this.ring);
      this.scene.remove(this.fill);
      this.scene.remove(this.glow);
      this.scene.remove(this.label);
      this.ring.geometry.dispose();
      this.ring.material.dispose();
      this.fill.geometry.dispose();
      this.fill.material.dispose();
      this.glow.geometry.dispose();
      this.glow.material.dispose();
      this.label.material.dispose();
      this.labelData.tex.dispose();
      return true;
    }
    return false;
  }

  dispose() {
    if (!this.tower) {
      this.scene.remove(this.ring);
      this.scene.remove(this.fill);
      this.scene.remove(this.glow);
      this.scene.remove(this.label);
      this.ring.geometry.dispose();
      this.ring.material.dispose();
      this.fill.geometry.dispose();
      this.fill.material.dispose();
      this.glow.geometry.dispose();
      this.glow.material.dispose();
      this.label.material.dispose();
      this.labelData.tex.dispose();
    }
  }
}
