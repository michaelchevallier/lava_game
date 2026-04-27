import * as Phaser from "phaser";
import { Audio } from "../systems/Audio.js";

export class Laser extends Phaser.GameObjects.Container {
  constructor(scene, x, y, opts = {}) {
    super(scene, x, y);

    this.tickRateMs = opts.tickRateMs ?? 250;
    this.damage = opts.damage ?? 0.6;
    this.lastTickAt = 0;
    this._lastScanAt = 0;
    this.maxHp = opts.hp ?? 5;
    this.hp = this.maxHp;
    this.isBlocking = true;
    this._dying = false;

    const shadow = scene.add.ellipse(0, 26, 50, 8, 0x000, 0.4);
    const base = scene.add.rectangle(0, 22, 44, 12, 0x444466).setStrokeStyle(2, 0x222244);
    const tower = scene.add.rectangle(0, -2, 26, 32, 0x6688aa).setStrokeStyle(2, 0x223355);
    const top = scene.add.rectangle(0, -22, 32, 8, 0x222244);
    const lens = scene.add.circle(14, -8, 6, 0x66ddff).setStrokeStyle(2, 0xffffff);
    const lensInner = scene.add.circle(14, -8, 3, 0xffffff);

    this.beam = scene.add.rectangle(20, -8, 0, 4, 0x66ddff, 0.85).setOrigin(0, 0.5);
    this.beamGlow = scene.add.rectangle(20, -8, 0, 12, 0x66ddff, 0.25).setOrigin(0, 0.5);
    this.add([shadow, this.beamGlow, this.beam, base, tower, top, lens, lensInner]);
    this.lens = lens;
    this.lensInner = lensInner;
    this.setSize(44, 70);
    this.setDepth(8);

    scene.add.existing(this);

    scene.tweens.add({
      targets: lensInner,
      scale: { from: 0.8, to: 1.4 },
      alpha: { from: 0.6, to: 1 },
      duration: 700, yoyo: true, repeat: -1, ease: "Sine.inOut",
    });

    this._tick = (time, delta) => this.tick(time, delta);
    scene.events.on("update", this._tick);
    this.once("destroy", () => scene.events.off("update", this._tick));
  }

  tick(time) {
    if (!this.scene || this._dying) return;
    if (this._disabledUntil && time < this._disabledUntil) {
      this.beam.width = 0;
      this.beamGlow.width = 0;
      return;
    }
    if (time - this._lastScanAt < 33) return;
    this._lastScanAt = time;
    const visitors = this.scene.visitors || [];
    let target = null;
    let bestDist = Infinity;
    for (const v of visitors) {
      if (!v.active || v._dying) continue;
      if (Math.abs(v.y - this.y) > 36) continue;
      if (v.x < this.x) continue;
      const d = v.x - this.x;
      if (d < bestDist) { bestDist = d; target = v; }
    }
    if (!target) {
      this.beam.width = 0;
      this.beamGlow.width = 0;
      return;
    }
    const len = bestDist - 4;
    this.beam.width = Math.max(0, len);
    this.beamGlow.width = Math.max(0, len);
    if (time - this.lastTickAt >= this.tickRateMs) {
      this.lastTickAt = time;
      this.lens.setFillStyle(0xffffff);
      target.takeDamage(this.damage, "laser");
      Audio.shoot?.();
    }
  }

  takeDamage(dmg) {
    if (!this.scene || this._dying) return;
    this.hp -= dmg;
    if (this.hp <= 0) this.kill();
  }

  kill() {
    if (this._dying) return;
    this._dying = true;
    this.scene.events.emit("tile-destroyed", this);
    this.scene.tweens.add({
      targets: this, alpha: 0, scaleY: 0.2, duration: 250,
      onComplete: () => this.destroy(),
    });
  }
}
