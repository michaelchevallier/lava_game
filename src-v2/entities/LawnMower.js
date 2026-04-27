import * as Phaser from "phaser";
import { JuiceFX } from "../systems/JuiceFX.js";

export class LawnMower extends Phaser.GameObjects.Container {
  constructor(scene, x, y, opts = {}) {
    super(scene, x, y);

    this.row = opts.row ?? 0;
    this.speed = opts.speed ?? 480;
    this.activated = false;
    this._dead = false;

    const shadow = scene.add.ellipse(0, 18, 56, 8, 0x000, 0.4);
    const body = scene.add.rectangle(0, 0, 50, 30, 0xc63a3a).setStrokeStyle(2, 0x6a0010);
    const top = scene.add.rectangle(0, -14, 30, 12, 0xff5a3a).setStrokeStyle(2, 0x6a0010);
    const wheelL = scene.add.circle(-18, 14, 6, 0x222).setStrokeStyle(1, 0x000);
    const wheelR = scene.add.circle(18, 14, 6, 0x222).setStrokeStyle(1, 0x000);
    const blade = scene.add.rectangle(0, -2, 60, 4, 0xeeeeee).setStrokeStyle(1, 0x888);

    this.add([shadow, body, top, wheelL, wheelR, blade]);
    this.wheelL = wheelL;
    this.wheelR = wheelR;
    this.blade = blade;
    this.setSize(60, 40);
    this.setDepth(11);

    scene.add.existing(this);

    this._tick = (time, delta) => this.tick(time, delta);
    scene.events.on("update", this._tick);
    this.once("destroy", () => scene.events.off("update", this._tick));
  }

  activate() {
    if (this.activated || this._dead) return;
    this.activated = true;
    this.scene.events.emit("mower-fired", this);
    JuiceFX.shake(this.scene, 8, 280);
  }

  static BOSS_TYPES = new Set(["boss", "magicboss", "lavaqueen", "carnivalboss", "ovniboss", "kraken", "dragon", "netboss"]);

  tick(time, delta) {
    if (!this.scene || this._dead) return;
    if (!this.activated) return;
    const dx = this.speed * (delta / 1000);
    this.x += dx;
    if (this.wheelL) this.wheelL.angle = (this.wheelL.angle + dx * 4) % 360;
    if (this.wheelR) this.wheelR.angle = (this.wheelR.angle + dx * 4) % 360;
    if (this.blade) this.blade.angle = (this.blade.angle + dx * 8) % 360;

    const visitors = this.scene.visitors || [];
    const BOSS_TYPES = LawnMower.BOSS_TYPES;
    for (const v of visitors) {
      if (!v.active || v._dying) continue;
      if (Math.abs(v.y - this.y) > 40) continue;
      if (Math.abs(v.x - this.x) > 36) continue;
      if (BOSS_TYPES.has(v.type)) {
        v.takeDamage(10, "mower");
        this._dead = true;
        this.scene.tweens.add({
          targets: this, alpha: 0, scale: 0.4, angle: 90, duration: 250,
          onComplete: () => this.destroy(),
        });
        return;
      }
      v.takeDamage(99, "mower");
    }

    if (this.x > this.scene.scale.width + 60) {
      this._dead = true;
      this.destroy();
    }
  }
}
