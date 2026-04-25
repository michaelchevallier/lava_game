import * as Phaser from "phaser";

export class Portal extends Phaser.GameObjects.Container {
  constructor(scene, x, y, opts = {}) {
    super(scene, x, y);

    this.teleportDistance = opts.teleportDistance ?? 320;
    this.maxUses = opts.maxUses ?? 3;
    this.uses = 0;
    this.cooldownMs = opts.cooldownMs ?? 1500;
    this.lastTeleportAt = 0;
    this.isBlocking = false;

    const shadow = scene.add.ellipse(0, 26, 56, 10, 0x000, 0.35);
    const base = scene.add.rectangle(0, 22, 60, 14, 0x4a2a4a).setStrokeStyle(2, 0x1a0a1a);
    const ringOuter = scene.add.ellipse(0, -2, 56, 56, 0x9a4ad8, 1).setStrokeStyle(3, 0xff66ff);
    const ringInner = scene.add.ellipse(0, -2, 38, 38, 0x4a1a8a, 1).setStrokeStyle(2, 0xff99ff);
    const swirl = scene.add.ellipse(0, -2, 22, 22, 0xff66ff, 0.7);

    this.add([shadow, base, ringOuter, ringInner, swirl]);
    this.swirl = swirl;
    this.ringOuter = ringOuter;
    this.setSize(60, 80);
    this.setDepth(8);

    scene.add.existing(this);

    scene.tweens.add({
      targets: swirl,
      angle: 360,
      scale: { from: 0.7, to: 1 },
      alpha: { from: 0.6, to: 1 },
      duration: 1200,
      yoyo: true,
      repeat: -1,
    });
    scene.tweens.add({
      targets: ringOuter,
      angle: -360,
      duration: 4000,
      repeat: -1,
      ease: "Linear",
    });

    this.usesText = scene.add.text(0, -36, this.maxUses + "/" + this.maxUses, {
      fontFamily: "system-ui",
      fontSize: "12px",
      fontStyle: "bold",
      color: "#fff",
      stroke: "#000",
      strokeThickness: 3,
    }).setOrigin(0.5);
    this.add(this.usesText);

    this._tick = (time, delta) => this.tick(time, delta);
    scene.events.on("update", this._tick);
    this.once("destroy", () => scene.events.off("update", this._tick));
  }

  tick(time) {
    if (!this.scene) return;
    if (this.uses >= this.maxUses) return;
    if (time - this.lastTeleportAt < this.cooldownMs) return;
    const visitors = this.scene.visitors || [];
    for (const v of visitors) {
      if (!v.active || v._dying) continue;
      if (Math.abs(v.y - this.y) > 36) continue;
      if (Math.abs(v.x - this.x) > 28) continue;
      this.teleport(v);
      break;
    }
  }

  teleport(v) {
    this.lastTeleportAt = this.scene.time.now;
    this.uses++;
    this.usesText.setText((this.maxUses - this.uses) + "/" + this.maxUses);

    const burst = this.scene.add.circle(v.x, v.y, 30, 0xff66ff, 0.8);
    burst.setDepth(20);
    this.scene.tweens.add({
      targets: burst,
      alpha: 0,
      scale: 1.8,
      duration: 350,
      onComplete: () => burst.destroy(),
    });

    v.x += this.teleportDistance;

    const arrival = this.scene.add.circle(v.x, v.y, 30, 0xff66ff, 0.8);
    arrival.setDepth(20);
    this.scene.tweens.add({
      targets: arrival,
      alpha: 0,
      scale: 1.8,
      duration: 350,
      onComplete: () => arrival.destroy(),
    });

    if (this.uses >= this.maxUses) {
      this.scene.events.emit("tile-destroyed", this);
      this.scene.tweens.add({
        targets: this,
        alpha: 0,
        scale: 0.4,
        duration: 350,
        onComplete: () => this.destroy(),
      });
    }
  }
}
