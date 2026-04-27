import * as Phaser from "phaser";
import { Audio } from "../systems/Audio.js";
import { JuiceFX } from "../systems/JuiceFX.js";

export class MagnetBomb extends Phaser.GameObjects.Container {
  constructor(scene, x, y, opts = {}) {
    super(scene, x, y);

    this.fuseMs = opts.fuseMs ?? 1500;
    this.radius = opts.radius ?? 130;
    this.damage = opts.damage ?? 99;
    this.spawnAt = scene.time.now;
    this._exploded = false;

    const base = scene.add.rectangle(0, 22, 56, 12, 0x4a2a04).setStrokeStyle(2, 0x2a1a04);
    const bomb = scene.add.circle(0, -4, 22, 0x66001a).setStrokeStyle(2, 0xff2222);
    const sheen = scene.add.circle(-6, -10, 4, 0xffaaaa, 0.7);
    const fuse = scene.add.rectangle(0, -28, 4, 12, 0x222);
    const spark = scene.add.circle(0, -34, 4, 0xffd23f);

    this.add([base, bomb, sheen, fuse, spark]);
    this.spark = spark;
    this.bomb = bomb;
    this.setSize(56, 70);
    this.setDepth(8);

    scene.add.existing(this);

    this._tick = (time, delta) => this.tick(time, delta);
    scene.events.on("game-tick", this._tick);
    this.once("destroy", () => scene.events.off("game-tick", this._tick));
  }

  tick(time) {
    if (!this.scene || this._exploded) return;
    const t = time - this.spawnAt;
    const phase = (t / this.fuseMs);
    const blink = phase < 0.5 ? 200 : (phase < 0.8 ? 100 : 50);
    this.spark.setVisible(Math.floor(t / blink) % 2 === 0);
    const pulse = 1 + Math.sin(t / 80) * 0.08 * (phase + 0.5);
    this.bomb.setScale(pulse);
    if (t >= this.fuseMs) this.explode();
  }

  explode() {
    if (this._exploded) return;
    this._exploded = true;
    Audio.explode();
    JuiceFX.explode(this.scene);

    const flash = this.scene.add.circle(this.x, this.y, this.radius, 0xffd23f, 0.85);
    flash.setDepth(20);
    this.scene.tweens.add({
      targets: flash,
      alpha: 0,
      scale: 1.4,
      duration: 360,
      onComplete: () => flash.destroy(),
    });

    const ring = this.scene.add.circle(this.x, this.y, 30, 0xff4400, 0).setStrokeStyle(4, 0xffe066);
    ring.setDepth(20);
    this.scene.tweens.add({
      targets: ring,
      radius: this.radius * 1.2,
      alpha: 0,
      duration: 500,
      onUpdate: (tw, target) => target.setRadius(target.radius),
      onComplete: () => ring.destroy(),
    });

    const visitors = this.scene.visitors || [];
    for (const v of visitors) {
      if (!v.active || v._dying) continue;
      const dx = v.x - this.x;
      const dy = v.y - this.y;
      if (dx * dx + dy * dy > this.radius * this.radius) continue;
      v.takeDamage(this.damage);
    }

    this.scene.events.emit("tile-destroyed", this);
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      duration: 250,
      onComplete: () => this.destroy(),
    });
  }
}
