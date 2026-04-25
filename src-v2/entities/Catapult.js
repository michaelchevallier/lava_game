import * as Phaser from "phaser";

export class Catapult extends Phaser.GameObjects.Container {
  constructor(scene, x, y, opts = {}) {
    super(scene, x, y);

    this.fireRate = opts.fireRate ?? 2200;
    this.range = opts.range ?? 1600;
    this.damage = opts.damage ?? 2;
    this.lastShotAt = 0;

    const base = scene.add.rectangle(0, 22, 60, 14, 0x4a2a04).setStrokeStyle(2, 0x2a1a04);
    const arm = scene.add.rectangle(-2, 0, 8, 36, 0x6b3a0a).setStrokeStyle(2, 0x2a1a04);
    arm.setOrigin(0.5, 1);
    arm.y = 18;
    const bucket = scene.add.rectangle(-8, -18, 18, 14, 0x2a1a04).setStrokeStyle(2, 0x6b3a0a);

    this.add([base, arm, bucket]);
    this.arm = arm;
    this.setSize(60, 70);
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
      if (dx <= 30 || dx > this.range) continue;
      if (dx < nearestDx) {
        nearestDx = dx;
        nearest = v;
      }
    }
    return nearest;
  }

  fire(target) {
    this.scene.tweens.add({
      targets: this.arm,
      angle: { from: 30, to: -90 },
      duration: 220,
      yoyo: true,
      ease: "Cubic.in",
    });

    const startX = this.x;
    const startY = this.y - 24;
    const endX = target.x;
    const endY = target.y;
    const flightMs = 600;
    const apex = -80;

    const proj = this.scene.add.circle(startX, startY, 9, 0x9bd84a).setStrokeStyle(2, 0x4a8a3a);
    proj.setDepth(15);

    const dmg = this.damage;
    const scene = this.scene;

    scene.tweens.add({
      targets: proj,
      x: endX,
      duration: flightMs,
      ease: "Linear",
    });
    scene.tweens.add({
      targets: proj,
      y: { value: startY + apex, duration: flightMs / 2, ease: "Cubic.out" },
      yoyo: false,
      onComplete: () => {
        scene.tweens.add({
          targets: proj,
          y: endY,
          duration: flightMs / 2,
          ease: "Cubic.in",
        });
      },
    });

    scene.time.delayedCall(flightMs, () => {
      const burst = scene.add.circle(proj.x, proj.y, 18, 0xb8e08a, 0.85);
      scene.tweens.add({
        targets: burst,
        alpha: 0,
        scale: 1.6,
        duration: 250,
        onComplete: () => burst.destroy(),
      });
      proj.destroy();
      const visitors = scene.visitors || [];
      for (const v of visitors) {
        if (!v.active || v._dying) continue;
        if (Math.abs(v.x - endX) > 30) continue;
        if (Math.abs(v.y - endY) > 30) continue;
        v.takeDamage(dmg);
      }
    });
  }
}
