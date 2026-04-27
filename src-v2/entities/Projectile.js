import * as Phaser from "phaser";

export class Projectile extends Phaser.GameObjects.Container {
  constructor(scene, x, y, opts = {}) {
    super(scene, x, y);

    this.speed = opts.speed ?? 380;
    this.damage = opts.damage ?? 1;
    this.source = opts.source ?? "lava";
    this._dead = false;

    const core = scene.add.circle(0, 0, 8, 0xff5a1c).setStrokeStyle(2, 0xffe066);
    const trail = scene.add.circle(-6, 0, 4, 0xffaa44, 0.7);
    this.add([trail, core]);

    this.setSize(16, 16);
    this.setDepth(15);

    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.body.setSize(16, 16).setOffset(-8, -8);
    this.body.setVelocityX(this.speed);

    this._tick = (time, delta) => this.tick(time, delta);
    scene.events.on("game-tick", this._tick);
    this.once("destroy", () => scene.events.off("game-tick", this._tick));
  }

  tick() {
    if (!this.scene || this._dead) return;
    if (this.x > this.scene.scale.width + 40) this.kill();
  }

  hit(visitor) {
    if (this._dead) return;
    this._dead = true;
    visitor.takeDamage(this.damage, this.source);
    const burst = this.scene.add.circle(this.x, this.y, 14, 0xffd23f, 0.9);
    this.scene.tweens.add({
      targets: burst,
      alpha: 0,
      scale: 2,
      duration: 220,
      onComplete: () => burst.destroy(),
    });
    this.destroy();
  }

  kill() {
    if (this._dead) return;
    this._dead = true;
    this.destroy();
  }
}
