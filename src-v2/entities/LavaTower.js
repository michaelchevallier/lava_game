import * as Phaser from "phaser";
import { Projectile } from "./Projectile.js";
import { Audio } from "../systems/Audio.js";
import { JuiceFX } from "../systems/JuiceFX.js";

export class LavaTower extends Phaser.GameObjects.Container {
  constructor(scene, x, y, opts = {}) {
    super(scene, x, y);

    this.fireRate = opts.fireRate ?? 1100;
    this.range = opts.range ?? 1400;
    this.damage = opts.damage ?? 1;
    this.lastShotAt = 0;
    this.maxHp = opts.hp ?? 5;
    this.hp = this.maxHp;
    this.isBlocking = true;
    this._dying = false;

    const shadow = scene.add.ellipse(0, 26, 60, 10, 0x000, 0.35);
    const useTowerSprite = scene.textures.exists("kenney_tile_tower_red") && scene.textures.exists("kenney_tile_base");

    if (useTowerSprite) {
      const baseSprite = scene.add.image(0, 14, "kenney_tile_base").setTint(0x7a2a08).setScale(0.9);
      const turretSprite = scene.add.image(0, -8, "kenney_tile_tower_red").setTint(0xc63a10).setScale(0.85);
      turretSprite.setRotation(Math.PI / 2);
      this.cannon = turretSprite;
      const lavaPool = scene.add.ellipse(0, 6, 38, 14, 0xff7722, 0.8).setStrokeStyle(2, 0xffe066);
      const bubble1 = scene.add.circle(-10, 4, 3, 0xffd23f, 0.85);
      const bubble2 = scene.add.circle(8, 7, 2.5, 0xffe066, 0.9);
      this.add([shadow, baseSprite, lavaPool, bubble1, bubble2, turretSprite]);
      this.bubbles = [bubble1, bubble2];
      scene.tweens.add({ targets: bubble1, y: -2, scale: 0.4, alpha: 0, duration: 1100, repeat: -1, ease: "Sine.out" });
      scene.tweens.add({ targets: bubble2, y: 0, scale: 0.5, alpha: 0, duration: 900, delay: 400, repeat: -1, ease: "Sine.out" });
    } else {
      const base = scene.add.rectangle(0, 22, 60, 14, 0x4a2a04).setStrokeStyle(2, 0x2a1a04);
      const baseTop = scene.add.rectangle(0, 14, 56, 4, 0x6b3a0a).setStrokeStyle(1, 0x2a1a04);
      const lavaPool = scene.add.ellipse(0, 6, 40, 16, 0xff7722).setStrokeStyle(2, 0xffe066);
      const bubble1 = scene.add.circle(-10, 4, 3, 0xffd23f, 0.85);
      const bubble2 = scene.add.circle(8, 7, 2.5, 0xffe066, 0.9);
      const body = scene.add.rectangle(0, -8, 38, 30, 0xc63a10).setStrokeStyle(2, 0x6b1a04);
      const bodyShine = scene.add.rectangle(-10, -14, 6, 14, 0xff7744, 0.6);
      this.cannon = scene.add.rectangle(20, -8, 28, 14, 0x1a1a1a).setStrokeStyle(2, 0xffe066);
      this.cannon.setOrigin(0.2, 0.5);
      const muzzleRing = scene.add.circle(36, -8, 5, 0x000).setStrokeStyle(1, 0xffe066);
      const eyeBg = scene.add.circle(-8, -12, 5, 0xfff8c8);
      const eye = scene.add.circle(-8, -12, 3, 0xff2200);
      const eyeShine = scene.add.circle(-7, -13, 1, 0xffffff);
      this.add([shadow, base, baseTop, lavaPool, bubble1, bubble2, body, bodyShine, this.cannon, muzzleRing, eyeBg, eye, eyeShine]);
      this.bubbles = [bubble1, bubble2];
      scene.tweens.add({ targets: bubble1, y: -2, scale: 0.4, alpha: 0, duration: 1100, repeat: -1, ease: "Sine.out" });
      scene.tweens.add({ targets: bubble2, y: 0, scale: 0.5, alpha: 0, duration: 900, delay: 400, repeat: -1, ease: "Sine.out" });
    }

    this.setSize(60, 80);
    this.setDepth(8);

    scene.add.existing(this);

    this._tick = (time, delta) => this.tick(time, delta);
    scene.events.on("update", this._tick);
    this.once("destroy", () => scene.events.off("update", this._tick));
  }

  tick(time) {
    if (!this.scene || this._dying) return;
    if (this._disabledUntil && time < this._disabledUntil) return;
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
      if (dx <= 0 || dx > this.range) continue;
      if (dx < nearestDx) {
        nearestDx = dx;
        nearest = v;
      }
    }
    return nearest;
  }

  fire(target) {
    const proj = new Projectile(this.scene, this.x + 36, this.y - 8, {
      speed: 460,
      damage: this.damage,
    });
    this.scene.projectiles.push(proj);
    Audio.fire();
    const now = this.scene.time.now;
    if (!this.scene._lastFireShakeAt || now - this.scene._lastFireShakeAt > 200) {
      this.scene._lastFireShakeAt = now;
      JuiceFX.fire(this.scene);
    }

    const flash = this.scene.add.circle(this.x + 42, this.y - 8, 10, 0xffe066, 0.95);
    flash.setDepth(15);
    this.scene.tweens.add({
      targets: flash,
      alpha: 0,
      scale: 1.6,
      duration: 160,
      onComplete: () => flash.destroy(),
    });

    this.scene.tweens.add({
      targets: this.cannon,
      x: 12,
      duration: 60,
      yoyo: true,
      ease: "Cubic.out",
    });
    this.scene.tweens.add({
      targets: this,
      scaleX: 1.1,
      scaleY: 0.95,
      duration: 80,
      yoyo: true,
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
      targets: this, alpha: 0, scaleY: 0.2, duration: 250,
      onComplete: () => this.destroy(),
    });
  }
}
