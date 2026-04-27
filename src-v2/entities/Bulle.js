import * as Phaser from "phaser";

export class Bulle extends Phaser.GameObjects.Container {
  constructor(scene, x, y, opts = {}) {
    super(scene, x, y);

    this.range = opts.range ?? 220;
    this.captureMs = opts.captureMs ?? 5000;
    this.cooldownMs = opts.cooldownMs ?? 6000;
    this.lastFireAt = -Infinity;
    this._lastScanAt = 0;
    this.maxHp = opts.hp ?? 5;
    this.hp = this.maxHp;
    this.isBlocking = true;
    this._dying = false;

    const shadow = scene.add.ellipse(0, 26, 50, 8, 0x000, 0.4);
    const base = scene.add.rectangle(0, 16, 40, 14, 0x224a6a).setStrokeStyle(2, 0x0a1a2a);
    const shell = scene.add.circle(0, -2, 18, 0x66ffdd).setStrokeStyle(2, 0x1a8a8a);
    const inner = scene.add.circle(0, -2, 12, 0xaaffee, 0.6);
    const eye1 = scene.add.circle(-5, -4, 2, 0x000);
    const eye2 = scene.add.circle(5, -4, 2, 0x000);
    const mouth = scene.add.rectangle(0, 4, 6, 1.5, 0x000);

    this.add([shadow, base, shell, inner, eye1, eye2, mouth]);
    this.shell = shell;
    this.setSize(44, 70);
    this.setDepth(8);

    scene.add.existing(this);

    scene.tweens.add({
      targets: shell,
      scale: { from: 1, to: 1.06 },
      duration: 1100, yoyo: true, repeat: -1, ease: "Sine.inOut",
    });
    scene.tweens.add({
      targets: inner,
      alpha: { from: 0.4, to: 0.85 },
      duration: 1300, yoyo: true, repeat: -1, ease: "Sine.inOut",
    });

    this._tick = (time, delta) => this.tick(time, delta);
    scene.events.on("game-tick", this._tick);
    this.once("destroy", () => scene.events.off("game-tick", this._tick));
  }

  tick(time) {
    if (!this.scene || this._dying) return;
    if (time - this._lastScanAt < 50) return;
    this._lastScanAt = time;
    if (time - this.lastFireAt < this.cooldownMs) {
      const ratio = (time - this.lastFireAt) / this.cooldownMs;
      this.shell.setFillStyle(0x66ffdd, 0.4 + ratio * 0.6);
      return;
    }
    this.shell.setFillStyle(0x66ffdd, 1);

    const visitors = this.scene.visitors || [];
    let target = null;
    let bestDist = Infinity;
    for (const v of visitors) {
      if (!v.active || v._dying || v._bubbled) continue;
      if (Math.abs(v.y - this.y) > 36) continue;
      if (v.x < this.x) continue;
      const d = v.x - this.x;
      if (d > this.range) continue;
      if (d < bestDist) { bestDist = d; target = v; }
    }
    if (!target) return;

    this.lastFireAt = time;
    this.captureVisitor(target);
  }

  captureVisitor(v) {
    if (!v || !v.scene) return;
    v._bubbled = true;
    v._bubbleUntil = this.scene.time.now + this.captureMs;
    if (v._origSpeed === undefined) v._origSpeed = v.speed;
    v.speed = 0;
    const bubble = this.scene.add.circle(v.x, v.y - 4, 28, 0x66ffdd, 0.4).setStrokeStyle(2, 0x1aaaaa).setDepth(v.depth + 1);
    v._bubbleSprite = bubble;
    this.scene.tweens.add({
      targets: bubble,
      y: bubble.y - 30,
      alpha: { from: 0.7, to: 0.4 },
      duration: this.captureMs,
      onComplete: () => {
        if (v && v.active) {
          v._bubbled = false;
          if (v._origSpeed !== undefined) v.speed = v._origSpeed;
        }
        bubble.destroy();
        if (v) v._bubbleSprite = null;
      },
    });
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
      targets: this, alpha: 0, scale: 0.5, duration: 220,
      onComplete: () => this.destroy(),
    });
  }
}
