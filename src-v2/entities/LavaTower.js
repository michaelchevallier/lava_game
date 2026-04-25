import * as Phaser from "phaser";
import { Projectile } from "./Projectile.js";
import { Audio } from "../systems/Audio.js";

export class LavaTower extends Phaser.GameObjects.Container {
  constructor(scene, x, y, opts = {}) {
    super(scene, x, y);

    this.fireRate = opts.fireRate ?? 1500;
    this.range = opts.range ?? 1400;
    this.damage = opts.damage ?? 1;
    this.lastShotAt = 0;

    const base = scene.add.rectangle(0, 18, 56, 16, 0x6b3a0a).setStrokeStyle(2, 0x2a1a04);
    const body = scene.add.rectangle(0, -4, 44, 36, 0xff4400).setStrokeStyle(2, 0xffe066);
    const cannon = scene.add.rectangle(16, -4, 28, 12, 0x222).setStrokeStyle(2, 0xffe066);
    const eye = scene.add.circle(-6, -8, 4, 0xffe066);

    this.add([base, body, cannon, eye]);
    this.setSize(56, 70);
    this.setDepth(8);

    scene.add.existing(this);

    this._tick = (time, delta) => this.tick(time, delta);
    scene.events.on("update", this._tick);
    this.once("destroy", () => scene.events.off("update", this._tick));
  }

  tick(time) {
    if (!this.scene) return;
    const target = this.findTarget();
    if (!target) return;
    if (time - this.lastShotAt < this.fireRate) return;
    this.lastShotAt = time;
    this.fire(target);
  }

  findTarget() {
    let nearest = null;
    let nearestDx = Infinity;
    const visitors = this.scene.visitors || [];
    for (const v of visitors) {
      if (!v.active || v._dying) continue;
      const dy = Math.abs(v.y - this.y);
      if (dy > 60) continue;
      const dx = v.x - this.x;
      if (dx <= 0 || dx > this.range) continue;
      if (dx < nearestDx) {
        nearestDx = dx;
        nearest = v;
      }
    }
    return nearest;
  }

  fire(target) {
    const proj = new Projectile(this.scene, this.x + 30, this.y - 4, {
      speed: 420,
      damage: this.damage,
    });
    this.scene.projectiles.push(proj);
    Audio.fire();
    this.scene.tweens.add({
      targets: this,
      scaleX: 1.15,
      scaleY: 0.9,
      duration: 70,
      yoyo: true,
    });
  }
}
