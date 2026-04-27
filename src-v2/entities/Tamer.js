import * as Phaser from "phaser";

export class Tamer extends Phaser.GameObjects.Container {
  constructor(scene, x, y, opts = {}) {
    super(scene, x, y);

    this.cooldownMs = opts.cooldownMs ?? 30000;
    this.tameDurationMs = opts.tameDurationMs ?? 8000;
    this.range = opts.range ?? 500;
    this.lastTameAt = scene.time.now - this.cooldownMs + 5000;
    this.activeTamed = null;

    const shadow = scene.add.ellipse(0, 26, 36, 9, 0x000, 0.4);
    const legL = scene.add.rectangle(-5, 22, 7, 14, 0x2a0a0a);
    const legR = scene.add.rectangle(5, 22, 7, 14, 0x2a0a0a);
    const torso = scene.add.rectangle(0, 4, 24, 28, 0xc63a3a).setStrokeStyle(1, 0x6a0010);
    const armL = scene.add.rectangle(-13, 0, 6, 18, 0xc63a3a);
    const armR = scene.add.rectangle(13, 0, 6, 18, 0xc63a3a);
    const head = scene.add.circle(0, -16, 10, 0xffd2a8).setStrokeStyle(1, 0x6b3a0a);
    const moustache = scene.add.rectangle(0, -12, 12, 2, 0x442200);
    const eyeL = scene.add.circle(-3, -17, 1.5, 0x000);
    const eyeR = scene.add.circle(3, -17, 1.5, 0x000);
    const tophatBrim = scene.add.rectangle(0, -25, 22, 3, 0x000);
    const tophatBody = scene.add.rectangle(0, -33, 16, 12, 0xc63a3a).setStrokeStyle(1, 0x6a0010);
    const tophatBand = scene.add.rectangle(0, -28, 16, 2, 0xffd23f);

    this.whip = scene.add.rectangle(18, -2, 16, 2, 0x6b3a0a).setStrokeStyle(1, 0x2a0a04);
    this.whip.setOrigin(0, 0.5);

    this.add([shadow, legL, legR, torso, armL, armR, this.whip, head, moustache, eyeL, eyeR, tophatBrim, tophatBody, tophatBand]);
    this.setSize(40, 80);
    this.setDepth(8);

    scene.add.existing(this);

    scene.tweens.add({
      targets: this.whip,
      angle: { from: -10, to: 25 },
      duration: 1400,
      yoyo: true,
      repeat: -1,
      ease: "Sine.inOut",
    });

    this._tick = (time, delta) => this.tick(time, delta);
    scene.events.on("game-tick", this._tick);
    this.once("destroy", () => scene.events.off("game-tick", this._tick));
  }

  tick(time) {
    if (!this.scene) return;
    if (time - this.lastTameAt < this.cooldownMs) return;
    const visitors = this.scene.visitors || [];
    let target = null;
    let dx = Infinity;
    for (const v of visitors) {
      if (!v.active || v._dying || v._isAlly) continue;
      if (Math.abs(v.y - this.y) > 60) continue;
      const d = v.x - this.x;
      if (d > 0 && d < this.range && d < dx) { dx = d; target = v; }
    }
    if (!target) return;
    this.lastTameAt = time;
    this.tameVisitor(target, time);
  }

  tameVisitor(v, time) {
    v._isAlly = true;
    v._tameUntil = time + this.tameDurationMs;
    v._origSpeed = v.speed;
    v.speed = -Math.abs(v.baseSpeed);
    v.baseSpeed = -Math.abs(v.baseSpeed);
    v.immune = ["lava", "frost", "mower"];

    const ring = this.scene.add.circle(v.x, v.y, 30, 0xff66ff, 0.6).setDepth(20);
    this.scene.tweens.add({
      targets: ring, scale: 2, alpha: 0, duration: 500,
      onComplete: () => ring.destroy(),
    });

    if (typeof v.setAlpha === "function") {
      this.scene.tweens.add({
        targets: v, alpha: { from: 1, to: 0.85 }, duration: 200, yoyo: true, repeat: 3,
      });
    }

    this.scene.time.delayedCall(this.tameDurationMs, () => {
      if (!v.active || v._dying) return;
      this.scene.events.emit("visitor-killed", v);
      this.scene.tweens.add({
        targets: v, alpha: 0, duration: 300,
        onComplete: () => v.destroy(),
      });
    });
  }
}
