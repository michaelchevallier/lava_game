import * as Phaser from "phaser";

export class NeonLamp extends Phaser.GameObjects.Container {
  constructor(scene, x, y, opts = {}) {
    super(scene, x, y);

    this.range = opts.range ?? 360;
    this.tickRateMs = opts.tickRateMs ?? 700;
    this.damage = opts.damage ?? 0.3;
    this.slowFactor = opts.slowFactor ?? 0.6;
    this.lastTickAt = 0;
    this._t = 0;
    this.maxHp = opts.hp ?? 5;
    this.hp = this.maxHp;
    this.isBlocking = true;
    this._dying = false;

    const shadow = scene.add.ellipse(0, 28, 50, 8, 0x000, 0.35);
    const base = scene.add.rectangle(0, 22, 16, 12, 0x222);
    const pole = scene.add.rectangle(0, 0, 6, 38, 0x444);
    const head = scene.add.rectangle(0, -22, 30, 14, 0x222).setStrokeStyle(2, 0x111);
    const tube = scene.add.rectangle(0, -22, 26, 8, 0xff66ff).setStrokeStyle(1, 0xffaaff);
    const glow1 = scene.add.ellipse(0, -22, 60, 18, 0xff66ff, 0.35);
    const glow2 = scene.add.ellipse(0, -22, 90, 28, 0xff99ff, 0.18);
    const beam = scene.add.rectangle(0, 0, 0, 32, 0xff66ff, 0.18).setOrigin(1, 0.5);

    this.add([shadow, base, pole, beam, head, tube, glow1, glow2]);
    this.tube = tube;
    this.glow1 = glow1;
    this.glow2 = glow2;
    this.beam = beam;
    this.setSize(50, 80);
    this.setDepth(8);

    scene.add.existing(this);

    this._tick = (time, delta) => this.tick(time, delta);
    scene.events.on("update", this._tick);
    this.once("destroy", () => scene.events.off("update", this._tick));
  }

  tick(time) {
    if (!this.scene || this._dying) return;
    this._t += 16;
    const flicker = Math.sin(this._t / 90) * 0.15 + 0.85;
    this.tube.setAlpha(flicker);
    this.glow1.setAlpha(0.35 * flicker);
    this.glow2.setAlpha(0.18 * flicker);

    this.beam.width = this.range;

    if (time - this.lastTickAt < this.tickRateMs) return;
    this.lastTickAt = time;

    const visitors = this.scene.visitors || [];
    let hit = false;
    for (const v of visitors) {
      if (!v.active || v._dying) continue;
      if (Math.abs(v.y - this.y) > 32) continue;
      if (v.x > this.x || v.x < this.x - this.range) continue;
      v.takeDamage(this.damage, "neon");
      if (v.active && !v._dying) {
        v.speed = v.baseSpeed * this.slowFactor;
        if (v._neonUntil) clearTimeout(v._neonUntil);
        v._neonUntil = setTimeout(() => {
          if (v.active && !v._dying) v.speed = v.baseSpeed;
        }, 900);
      }
      hit = true;
    }
    if (hit) {
      const pulse = this.scene.add.circle(this.x, this.y - 22, 24, 0xff66ff, 0.55);
      pulse.setDepth(15);
      this.scene.tweens.add({
        targets: pulse, scale: 2.2, alpha: 0, duration: 350,
        onComplete: () => pulse.destroy(),
      });
    }
  }

  takeDamage(dmg) {
    if (!this.scene || this._dying) return;
    this.hp -= dmg;
    if (this.hp <= 0) this.kill();
  }

  kill() {
    if (this._dying) return;
    this._dying = true;
    this.scene.events.emit("tile-destroyed", this);
    this.scene.tweens.add({
      targets: this, alpha: 0, scaleY: 0.2, duration: 250,
      onComplete: () => this.destroy(),
    });
  }
}
