import * as Phaser from "phaser";

export class Fan extends Phaser.GameObjects.Container {
  constructor(scene, x, y, opts = {}) {
    super(scene, x, y);

    this.cooldownMs = opts.cooldownMs ?? 6000;
    this.pushDistance = opts.pushDistance ?? 180;
    this.lastPushAt = scene.time.now - this.cooldownMs + 1500;
    this.isBlocking = false;

    const base = scene.add.rectangle(0, 22, 56, 12, 0x444).setStrokeStyle(2, 0x222);
    const cage = scene.add.circle(0, -4, 26, 0x222).setStrokeStyle(2, 0x666);
    const blade1 = scene.add.rectangle(0, -4, 36, 6, 0xddeeff).setStrokeStyle(1, 0x88aabb);
    const blade2 = scene.add.rectangle(0, -4, 36, 6, 0xddeeff).setStrokeStyle(1, 0x88aabb);
    blade2.angle = 90;
    const hub = scene.add.circle(0, -4, 5, 0x88aabb);

    this.add([base, cage, blade1, blade2, hub]);
    this.blades = [blade1, blade2];
    this.setSize(56, 70);
    this.setDepth(8);

    scene.add.existing(this);

    this._tick = (time, delta) => this.tick(time, delta);
    scene.events.on("game-tick", this._tick);
    this.once("destroy", () => scene.events.off("game-tick", this._tick));
  }

  tick(time, delta) {
    if (!this.scene) return;
    const speed = (time - this.lastPushAt < 600) ? 1080 : 360;
    for (const b of this.blades) b.angle = (b.angle + speed * (delta / 1000)) % 360;

    if (time - this.lastPushAt < this.cooldownMs) return;

    const maxX = this.scene.scale.width - 100;
    const targets = (this.scene.visitors || []).filter((v) =>
      v.active && !v._dying && Math.abs(v.y - this.y) < 30 && v.x > this.x - 60 && v.x < maxX
    );
    if (targets.length === 0) return;

    this.lastPushAt = time;
    for (const v of targets) {
      const newX = Math.min(v.x + this.pushDistance, maxX);
      this.scene.tweens.add({
        targets: v,
        x: newX,
        duration: 400,
        ease: "Cubic.out",
      });
    }

    const burst = this.scene.add.rectangle(this.x + 60, this.y, 80, 50, 0xddeeff, 0.6);
    this.scene.tweens.add({
      targets: burst,
      x: this.x + 240,
      alpha: 0,
      scaleX: 1.6,
      duration: 500,
      onComplete: () => burst.destroy(),
    });
  }
}
