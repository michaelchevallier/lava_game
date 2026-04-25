import * as Phaser from "phaser";

export class CoinGenerator extends Phaser.GameObjects.Container {
  constructor(scene, x, y, opts = {}) {
    super(scene, x, y);

    this.amount = opts.amount ?? 25;
    this.intervalMs = opts.intervalMs ?? 8000;
    this.lastTickAt = scene.time.now;

    const base = scene.add.rectangle(0, 22, 56, 14, 0x6b3a0a).setStrokeStyle(2, 0x2a1a04);
    const stem = scene.add.rectangle(0, 4, 8, 32, 0x3a8a3a);
    const petalColor = 0xffd23f;
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI * 2 * i) / 6 - Math.PI / 2;
      const px = Math.cos(a) * 16;
      const py = Math.sin(a) * 16 - 14;
      const petal = scene.add.circle(px, py, 9, petalColor).setStrokeStyle(2, 0xc88a00);
      this.add(petal);
    }
    const heart = scene.add.circle(0, -14, 12, 0xff9f1c).setStrokeStyle(2, 0x6b3a0a);
    const eye1 = scene.add.circle(-4, -16, 2, 0x000);
    const eye2 = scene.add.circle(4, -16, 2, 0x000);

    this.add([base, stem, heart, eye1, eye2]);
    this.heart = heart;
    this.setSize(56, 70);
    this.setDepth(8);

    scene.add.existing(this);

    scene.tweens.add({
      targets: heart,
      scale: { from: 1, to: 1.1 },
      duration: 1200,
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
    this.scene.events.emit("coins-earned", this.amount, this);
    this.popPing();
  }

  popPing() {
    const ping = this.scene.add.text(this.x, this.y - 50, "+" + this.amount, {
      fontFamily: "system-ui",
      fontSize: "20px",
      fontStyle: "bold",
      color: "#ffd23f",
      stroke: "#000",
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(30);
    this.scene.tweens.add({
      targets: ping,
      y: ping.y - 30,
      alpha: 0,
      duration: 800,
      ease: "Cubic.out",
      onComplete: () => ping.destroy(),
    });
  }
}
