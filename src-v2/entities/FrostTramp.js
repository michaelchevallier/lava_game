import * as Phaser from "phaser";

export class FrostTramp extends Phaser.GameObjects.Container {
  constructor(scene, x, y, opts = {}) {
    super(scene, x, y);

    this.tickRateMs = opts.tickRateMs ?? 600;
    this.damage = opts.damage ?? 0.4;
    this.slowFactor = opts.slowFactor ?? 0.45;
    this.lastTickAt = 0;
    this.isBlocking = false;

    const shadow = scene.add.ellipse(0, 26, 60, 10, 0x000, 0.35);
    const base = scene.add.rectangle(0, 22, 64, 14, 0x4a6a8a).setStrokeStyle(2, 0x1a3a5a);
    const padBg = scene.add.rectangle(0, 0, 56, 36, 0x88c8e8).setStrokeStyle(2, 0x4a8ab8);
    const ice1 = scene.add.triangle(-12, -6, 0, 0, 8, -10, 16, 0, 0xc8e8ff).setStrokeStyle(1, 0x4a8ab8);
    const ice2 = scene.add.triangle(8, -6, 0, 0, 8, -10, 16, 0, 0xc8e8ff).setStrokeStyle(1, 0x4a8ab8);
    const sheen = scene.add.rectangle(-8, -10, 12, 4, 0xffffff, 0.6);
    const eye1 = scene.add.circle(-8, 4, 3, 0x224466);
    const eye2 = scene.add.circle(8, 4, 3, 0x224466);

    this.add([shadow, base, padBg, ice1, ice2, sheen, eye1, eye2]);
    this.padBg = padBg;
    this.setSize(64, 80);
    this.setDepth(8);

    scene.add.existing(this);

    this._tick = (time, delta) => this.tick(time, delta);
    scene.events.on("update", this._tick);
    this.once("destroy", () => scene.events.off("update", this._tick));
  }

  tick(time) {
    if (!this.scene) return;
    const visitors = this.scene.visitors || [];
    const targets = visitors.filter((v) =>
      v.active && !v._dying &&
      Math.abs(v.y - this.y) < 36 &&
      Math.abs(v.x - this.x) < 50
    );
    if (targets.length === 0) {
      this.padBg.setFillStyle(0x88c8e8);
      return;
    }
    this.padBg.setFillStyle(0xc8eaff);
    if (time - this.lastTickAt < this.tickRateMs) return;
    this.lastTickAt = time;
    for (const v of targets) {
      v.takeDamage(this.damage, "frost");
      if (v.active && !v._dying) {
        v.speed = v.baseSpeed * this.slowFactor;
        if (v._frostUntil) clearTimeout(v._frostUntil);
        v._frostUntil = setTimeout(() => {
          if (v.active && !v._dying) v.speed = v.baseSpeed;
        }, 800);
      }
    }
    const flash = this.scene.add.circle(this.x, this.y - 4, 32, 0xc8eaff, 0.6);
    flash.setDepth(11);
    this.scene.tweens.add({
      targets: flash,
      alpha: 0,
      scale: 1.4,
      duration: 350,
      onComplete: () => flash.destroy(),
    });
  }
}
