import * as Phaser from "phaser";

export class Sun extends Phaser.GameObjects.Container {
  constructor(scene, x, y, opts = {}) {
    super(scene, x, y);

    this.amount = opts.amount ?? 30;
    this.lifetimeMs = opts.lifetimeMs ?? 10000;
    this.autoCollectAt = opts.autoCollectAt ?? 6500;
    this.spawnAt = scene.time.now;
    this._collected = false;
    this.driftToY = opts.driftToY ?? null;

    const halo = scene.add.circle(0, 0, 22, 0xffe066, 0.45);
    const main = scene.add.circle(0, 0, 14, 0xffd23f).setStrokeStyle(2, 0xc88a00);
    const ray1 = scene.add.rectangle(0, -19, 2, 6, 0xffd23f);
    const ray2 = scene.add.rectangle(0, 19, 2, 6, 0xffd23f);
    const ray3 = scene.add.rectangle(-19, 0, 6, 2, 0xffd23f);
    const ray4 = scene.add.rectangle(19, 0, 6, 2, 0xffd23f);
    const eye1 = scene.add.circle(-3, -2, 1.5, 0x222);
    const eye2 = scene.add.circle(3, -2, 1.5, 0x222);
    const smile = scene.add.arc(0, 3, 4, 0, 180, false, 0, 0).setStrokeStyle(1.5, 0x6b3a26);

    this.add([halo, ray1, ray2, ray3, ray4, main, eye1, eye2, smile]);
    this.halo = halo;
    this.main = main;
    this.setSize(40, 40);
    this.setDepth(30);

    scene.add.existing(this);

    this.setInteractive(new Phaser.Geom.Rectangle(-40, -40, 80, 80), Phaser.Geom.Rectangle.Contains);
    this.on("pointerdown", () => this.collect());

    scene.tweens.add({
      targets: halo,
      scale: { from: 1, to: 1.2 },
      alpha: { from: 0.45, to: 0.2 },
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: "Sine.inOut",
    });
    scene.tweens.add({
      targets: this,
      angle: { from: -8, to: 8 },
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: "Sine.inOut",
    });

    if (this.driftToY != null && this.driftToY !== y) {
      scene.tweens.add({
        targets: this,
        y: this.driftToY,
        duration: 1500,
        ease: "Cubic.out",
      });
    }

    this._tick = (time) => this.tick(time);
    scene.events.on("update", this._tick);
    this.once("destroy", () => scene.events.off("update", this._tick));
  }

  tick(time) {
    if (!this.scene || this._collected) return;
    const elapsed = time - this.spawnAt;
    if (elapsed > this.autoCollectAt) {
      this.collect();
      return;
    }
  }

  collect() {
    if (this._collected || !this.scene) return;
    this._collected = true;
    this.scene.events.emit("sun-collected", this.amount, this);

    const counterX = 80;
    const counterY = 30;
    this.scene.tweens.add({
      targets: this,
      x: counterX,
      y: counterY,
      scale: 0.5,
      duration: 350,
      ease: "Cubic.in",
      onComplete: () => this.destroy(),
    });
  }
}
