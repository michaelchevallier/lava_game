import * as Phaser from "phaser";
import { Audio } from "../systems/Audio.js";

export class TreasureChest extends Phaser.GameObjects.Container {
  constructor(scene, x, y, opts = {}) {
    super(scene, x, y);
    this.amount = opts.amount ?? 75;
    this.lifetimeMs = opts.lifetimeMs ?? 11000;
    this.spawnAt = scene.time.now;
    this._collected = false;

    const shadow = scene.add.ellipse(0, 22, 50, 8, 0x000, 0.45);
    const base = scene.add.rectangle(0, 8, 44, 26, 0x6b3a0a).setStrokeStyle(2, 0x2a1a04);
    const lid = scene.add.rectangle(0, -8, 46, 14, 0x8a4a14).setStrokeStyle(2, 0x4a2a04);
    const band1 = scene.add.rectangle(0, 8, 46, 3, 0xffd23f);
    const band2 = scene.add.rectangle(0, -2, 46, 3, 0xffd23f);
    const lock = scene.add.rectangle(0, 4, 8, 10, 0xffd23f).setStrokeStyle(1, 0xc88a00);
    const sparkle = scene.add.text(20, -22, "✨", { fontFamily: "Fredoka, system-ui", fontSize: "16px" }).setOrigin(0.5);

    this.add([shadow, base, lid, band1, band2, lock, sparkle]);
    this.lid = lid;
    this.sparkle = sparkle;
    this.setDepth(28);

    scene.add.existing(this);

    this.setInteractive(new Phaser.Geom.Rectangle(-30, -30, 60, 60), Phaser.Geom.Rectangle.Contains);
    this.on("pointerdown", () => this.open());

    scene.tweens.add({
      targets: this, y: y - 4, duration: 700, yoyo: true, repeat: -1, ease: "Sine.inOut",
    });
    scene.tweens.add({
      targets: sparkle, scale: { from: 0.7, to: 1.2 }, alpha: { from: 0.6, to: 1 },
      duration: 500, yoyo: true, repeat: -1,
    });

    this._tick = (time) => {
      if (this._collected) return;
      if (time - this.spawnAt > this.lifetimeMs) {
        this.fade();
      }
    };
    scene.events.on("update", this._tick);
    this.once("destroy", () => scene.events.off("update", this._tick));
  }

  open() {
    if (this._collected) return;
    this._collected = true;
    Audio.gold?.() || Audio.coin?.();

    const sx = this.x, sy = this.y;
    for (let i = 0; i < 14; i++) {
      const a = (Math.PI * 2 * i) / 14;
      const coin = this.scene.add.circle(sx, sy, 5, 0xffd23f).setStrokeStyle(1, 0xc88a00).setDepth(30);
      this.scene.tweens.add({
        targets: coin,
        x: sx + Math.cos(a) * (60 + Math.random() * 40),
        y: sy + Math.sin(a) * (60 + Math.random() * 40) - 30,
        alpha: 0, scale: 0.4,
        duration: 700 + Math.random() * 300,
        ease: "Cubic.out",
        onComplete: () => coin.destroy(),
      });
    }
    const burst = this.scene.add.text(sx, sy - 30, "+" + this.amount + "¢", {
      fontFamily: "Fredoka, system-ui",
      fontSize: "26px",
      fontStyle: "bold",
      color: "#ffd23f",
      stroke: "#000",
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(35);
    this.scene.tweens.add({
      targets: burst, y: burst.y - 50, alpha: 0,
      duration: 1100, ease: "Cubic.out",
      onComplete: () => burst.destroy(),
    });

    this.scene.events.emit("sun-collected", this.amount);
    this.scene.tweens.add({
      targets: this.lid, angle: -60, y: this.lid.y - 6, duration: 220,
    });
    this.scene.tweens.add({
      targets: this, alpha: 0, scale: 0.6, duration: 360, delay: 200,
      onComplete: () => this.destroy(),
    });
  }

  fade() {
    if (this._collected) return;
    this._collected = true;
    this.scene.tweens.add({
      targets: this, alpha: 0, duration: 500,
      onComplete: () => this.destroy(),
    });
  }
}
