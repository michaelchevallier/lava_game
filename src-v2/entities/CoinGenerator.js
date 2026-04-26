import * as Phaser from "phaser";
import { Sun } from "./Sun.js";

export class CoinGenerator extends Phaser.GameObjects.Container {
  constructor(scene, x, y, opts = {}) {
    super(scene, x, y);

    this.amount = opts.amount ?? 30;
    this.intervalMs = opts.intervalMs ?? 6000;
    this.lastTickAt = scene.time.now;

    const shadow = scene.add.ellipse(0, 26, 50, 8, 0x000, 0.35);
    const base = scene.add.rectangle(0, 22, 56, 12, 0x4a2a04).setStrokeStyle(2, 0x2a1a04);
    const stem = scene.add.rectangle(0, 6, 8, 30, 0x3a8a3a).setStrokeStyle(1, 0x244a1a);
    const leafL = scene.add.ellipse(-8, 8, 14, 6, 0x4ea03c).setStrokeStyle(1, 0x244a1a);
    const leafR = scene.add.ellipse(8, 12, 14, 6, 0x4ea03c).setStrokeStyle(1, 0x244a1a);
    leafL.angle = -25;
    leafR.angle = 30;

    this.petalGroup = scene.add.container(0, -14);
    for (let i = 0; i < 8; i++) {
      const a = (Math.PI * 2 * i) / 8;
      const px = Math.cos(a) * 16;
      const py = Math.sin(a) * 16;
      const petal = scene.add.ellipse(px, py, 12, 18, 0xffd23f).setStrokeStyle(2, 0xc88a00);
      petal.angle = (i / 8) * 360;
      this.petalGroup.add(petal);
    }

    const heart = scene.add.circle(0, -14, 11, 0xff9f1c).setStrokeStyle(2, 0x6b3a0a);
    const heartShine = scene.add.circle(-3, -17, 3, 0xffe066, 0.7);
    const eye1 = scene.add.circle(-3.5, -15, 1.5, 0x000);
    const eye2 = scene.add.circle(3.5, -15, 1.5, 0x000);
    const smile = scene.add.arc(0, -10, 4, 0, 180, false, 0x000, 0).setStrokeStyle(1, 0x6b3a0a);

    this.add([shadow, base, stem, leafL, leafR, this.petalGroup, heart, heartShine, eye1, eye2, smile]);

    this.heart = heart;
    this.glow = scene.add.circle(0, -14, 28, 0xffd23f, 0).setStrokeStyle(2, 0xffe066);
    this.glow.setAlpha(0.18);
    this.add(this.glow);

    this.setSize(56, 70);
    this.setDepth(8);

    scene.add.existing(this);

    scene.tweens.add({
      targets: this.petalGroup,
      angle: 360,
      duration: 16000,
      repeat: -1,
      ease: "Linear",
    });
    scene.tweens.add({
      targets: heart,
      scale: { from: 1, to: 1.08 },
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: "Sine.inOut",
    });
    scene.tweens.add({
      targets: this.glow,
      scale: { from: 1, to: 1.3 },
      alpha: { from: 0.18, to: 0.05 },
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: "Sine.inOut",
    });

    this._tick = (time, delta) => this.tick(time, delta);
    scene.events.on("update", this._tick);
    this.once("destroy", () => scene.events.off("update", this._tick));
  }

  tick(time) {
    if (!this.scene) return;
    if (time - this.lastTickAt < this.intervalMs) return;
    this.lastTickAt = time;
    this.spawnSun();
  }

  spawnSun() {
    const offsetX = (Math.random() - 0.5) * 30;
    const sun = new Sun(this.scene, this.x + offsetX, this.y - 8, {
      amount: this.amount,
      driftToY: this.y + 24 + (Math.random() * 12),
      lifetimeMs: 8000,
    });
    if (this.scene.suns) this.scene.suns.push(sun);
  }
}
