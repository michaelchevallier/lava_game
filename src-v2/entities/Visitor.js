import * as Phaser from "phaser";

export class Visitor extends Phaser.GameObjects.Container {
  constructor(scene, x, y, opts = {}) {
    super(scene, x, y);

    this.hp = opts.hp ?? 1;
    this.maxHp = this.hp;
    this.speed = opts.speed ?? 60;
    this.baseSpeed = this.speed;
    this._dying = false;
    this.blocked = false;

    const body = scene.add.rectangle(0, 0, 32, 48, 0x6cce5c).setStrokeStyle(2, 0x244a1a);
    const head = scene.add.circle(0, -32, 12, 0xffd2a8).setStrokeStyle(2, 0x6b4226);
    const eye = scene.add.circle(4, -32, 2, 0x000);

    this.add([body, head, eye]);
    this.setSize(32, 80);
    this.setDepth(10);

    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.body.setSize(32, 80).setOffset(-16, -40);

    this._tick = (time, delta) => this.tick(time, delta);
    scene.events.on("update", this._tick);
    this.once("destroy", () => scene.events.off("update", this._tick));
  }

  tick(time, delta) {
    if (!this.scene || this._dying) return;
    if (this.blocked) return;
    const dx = this.speed * (delta / 1000);
    this.x -= dx;
    if (this.x < -50) {
      this.scene.events.emit("visitor-escaped", this);
      this.destroy();
    }
  }

  takeDamage(dmg) {
    if (this._dying) return;
    this.hp -= dmg;
    this.scene.tweens.add({
      targets: this,
      alpha: 0.4,
      duration: 60,
      yoyo: true,
    });
    if (this.hp <= 0) this.kill();
  }

  kill() {
    if (this._dying) return;
    this._dying = true;
    this.scene.events.emit("visitor-killed", this);
    this.scene.tweens.add({
      targets: this,
      scaleY: 0.2,
      scaleX: 1.4,
      alpha: 0,
      duration: 220,
      onComplete: () => this.destroy(),
    });
  }
}
