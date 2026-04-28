import * as Phaser from "phaser";
import { Audio } from "../systems/Audio.js";
import { JuiceFX } from "../systems/JuiceFX.js";

export class Mine extends Phaser.GameObjects.Container {
  constructor(scene, x, y, opts = {}) {
    super(scene, x, y);

    this.armDelayMs = opts.armDelayMs ?? 2000;
    this.triggerRadius = opts.triggerRadius ?? 38;
    this.aoeRadius = opts.aoeRadius ?? 70;
    this.damage = opts.damage ?? 99;
    this.splashDamage = opts.splashDamage ?? 0.5;
    this.spawnAt = scene.time.now;
    this._armed = false;
    this._exploded = false;

    const base = scene.add.rectangle(0, 24, 50, 8, 0x3a2a1a).setStrokeStyle(1, 0x1a0a04);
    const body = scene.add.circle(0, 8, 18, 0x4a2a4a).setStrokeStyle(2, 0x222);
    const studs = [];
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI * 2 * i) / 6;
      const stud = scene.add.circle(Math.cos(a) * 18, 8 + Math.sin(a) * 6, 3, 0x222);
      studs.push(stud);
    }
    const led = scene.add.circle(0, 0, 3, 0x880000);

    this.add([base, body, ...studs, led]);
    this.led = led;
    this.body = body;
    this.setSize(50, 44);
    this.setDepth(7);

    scene.add.existing(this);

    this._tick = (time, delta) => this.tick(time, delta);
    scene.events.on("game-tick", this._tick);
    this.once("destroy", () => scene.events.off("game-tick", this._tick));
  }

  tick(time) {
    if (!this.scene || this._exploded) return;
    const t = time - this.spawnAt;
    if (!this._armed) {
      this.led.setFillStyle((Math.floor(t / 300) % 2 === 0) ? 0xff4400 : 0x440000);
      if (t >= this.armDelayMs) {
        this._armed = true;
        this.led.setFillStyle(0xff0000);
        Audio.click?.();
      }
      return;
    }
    this.led.setVisible(Math.floor(t / 200) % 2 === 0);
    const visitors = this.scene.visitors || [];
    for (const v of visitors) {
      if (!v.active || v._dying) continue;
      const dx = v.x - this.x;
      const dy = v.y - this.y;
      if (dx * dx + dy * dy <= this.triggerRadius * this.triggerRadius) {
        this.explode();
        return;
      }
    }
  }

  explode() {
    if (this._exploded) return;
    this._exploded = true;
    Audio.explode?.();
    JuiceFX.explode?.(this.scene);

    const flash = this.scene.add.circle(this.x, this.y, this.aoeRadius, 0xffaa44, 0.8).setDepth(20);
    this.scene.tweens.add({ targets: flash, alpha: 0, scale: 1.5, duration: 280, onComplete: () => flash.destroy() });

    const ring = this.scene.add.circle(this.x, this.y, 20, 0, 0).setStrokeStyle(3, 0xff8800).setDepth(20);
    this.scene.tweens.add({
      targets: ring, radius: this.aoeRadius * 1.2, alpha: 0, duration: 400,
      onUpdate: (tw, target) => target.setRadius(target.radius),
      onComplete: () => ring.destroy(),
    });

    const visitors = this.scene.visitors || [];
    let primary = null;
    let primaryDist = Infinity;
    for (const v of visitors) {
      if (!v.active || v._dying) continue;
      const dx = v.x - this.x;
      const dy = v.y - this.y;
      const d2 = dx * dx + dy * dy;
      if (d2 < primaryDist && d2 <= this.triggerRadius * this.triggerRadius * 1.3) {
        primaryDist = d2;
        primary = v;
      }
    }
    if (primary) primary.takeDamage(this.damage, "mine");
    for (const v of visitors) {
      if (!v.active || v._dying || v === primary) continue;
      const dx = v.x - this.x;
      const dy = v.y - this.y;
      if (dx * dx + dy * dy <= this.aoeRadius * this.aoeRadius) {
        v.takeDamage(this.damage * this.splashDamage, "mine");
      }
    }

    this.scene.events.emit("tile-destroyed", this);
    this.scene.tweens.add({
      targets: this, alpha: 0, scale: 1.4, duration: 220,
      onComplete: () => this.destroy(),
    });
  }
}
