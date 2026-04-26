import * as Phaser from "phaser";
import { JuiceFX } from "../systems/JuiceFX.js";

const TYPE_DEFS = {
  basic:    { hp: 1, speed: 45,  shirtColor: 0x6a3a3a, shirtStroke: 0x2a0a0a, skin: 0x9acc8a, immune: [], canFly: false, hat: null },
  tank:     { hp: 2, speed: 35,  shirtColor: 0x4a4a4a, shirtStroke: 0x222222, skin: 0x88aa78, immune: [], canFly: false, hat: "bucket" },
  vip:      { hp: 2, speed: 45,  shirtColor: 0x3a3a3a, shirtStroke: 0x111111, skin: 0xa0c090, immune: [], canFly: false, hat: "tophat" },
  skeleton: { hp: 1, speed: 50,  shirtColor: 0xeeeeee, shirtStroke: 0x666666, skin: 0xeeeeee, immune: ["lava"], canFly: false, hat: null },
  flying:   { hp: 1, speed: 55,  shirtColor: 0x6a3a3a, shirtStroke: 0x2a0a0a, skin: 0x9acc8a, immune: [], canFly: true, hat: "wing" },
  boss:     { hp: 12, speed: 28, shirtColor: 0x4a1a4a, shirtStroke: 0x1a0a1a, skin: 0x9accaa, immune: [], canFly: false, hat: "horn", scale: 1.7 },
};

export class Visitor extends Phaser.GameObjects.Container {
  constructor(scene, x, y, opts = {}) {
    super(scene, x, y);

    const def = TYPE_DEFS[opts.type] || TYPE_DEFS.basic;
    this.type = opts.type || "basic";
    this.hp = opts.hp ?? def.hp;
    this.maxHp = this.hp;
    this.speed = opts.speed ?? def.speed;
    this.baseSpeed = this.speed;
    this.immune = def.immune;
    this.canFly = def.canFly;
    this._dying = false;
    this.blocked = false;
    const isSkel = this.type === "skeleton";
    const isBoss = this.type === "boss";

    this.shadow = scene.add.ellipse(0, 22, 38, 9, 0x000, 0.4);
    this.add(this.shadow);

    this.legL = scene.add.rectangle(-7, 22, 9, 16, def.shirtStroke).setStrokeStyle(1, 0x000);
    this.legR = scene.add.rectangle(7, 22, 9, 16, def.shirtStroke).setStrokeStyle(1, 0x000);
    this.add([this.legL, this.legR]);

    const torsoBack = scene.add.rectangle(0, 4, 32, 38, isSkel ? 0xddd8c8 : 0x4a3030).setStrokeStyle(2, def.shirtStroke);
    const shirt = scene.add.rectangle(0, 6, 28, 26, def.shirtColor).setStrokeStyle(1, def.shirtStroke);
    this.add([torsoBack, shirt]);

    if (!isSkel) {
      const tear1 = scene.add.rectangle(-8, 8, 6, 2, def.shirtStroke);
      const tear2 = scene.add.rectangle(6, 14, 5, 2, def.shirtStroke);
      const stain = scene.add.circle(4, 4, 2.5, 0x6a0010, 0.85);
      this.add([tear1, tear2, stain]);
    }

    this.armL = scene.add.rectangle(-16, 0, 7, 24, def.skin).setStrokeStyle(1, def.shirtStroke);
    this.armR = scene.add.rectangle(16, 0, 7, 24, def.skin).setStrokeStyle(1, def.shirtStroke);
    this.armL.setOrigin(0.5, 0);
    this.armR.setOrigin(0.5, 0);
    this.armL.y = -8;
    this.armR.y = -8;
    this.add([this.armL, this.armR]);

    const handL = scene.add.circle(-16, 16, 4, def.skin).setStrokeStyle(1, def.shirtStroke);
    const handR = scene.add.circle(16, 16, 4, def.skin).setStrokeStyle(1, def.shirtStroke);
    this.add([handL, handR]);
    this.handL = handL;
    this.handR = handR;

    const head = scene.add.circle(0, -22, 13, def.skin).setStrokeStyle(2, isSkel ? 0x999 : 0x4a4020);
    const earL = scene.add.ellipse(-12, -22, 4, 7, def.skin).setStrokeStyle(1, 0x4a4020);
    const earR = scene.add.ellipse(12, -22, 4, 7, def.skin).setStrokeStyle(1, 0x4a4020);

    if (!isSkel) {
      const scarL = scene.add.rectangle(-7, -28, 6, 1.5, 0x6a0010);
      const scarR = scene.add.rectangle(5, -16, 4, 1.5, 0x6a0010);
      this.add([scarL, scarR]);
    }

    const eyeBgL = scene.add.circle(-5, -24, 4, 0xfff8d0);
    const eyeBgR = scene.add.circle(5, -24, 4, 0xfff8d0);
    const eyeL = scene.add.circle(-5, -24, 2.4, isSkel ? 0xff2222 : 0xffd23f);
    const eyeR = scene.add.circle(5, -24, 2.4, isSkel ? 0xff2222 : 0xffd23f);
    const pupilL = scene.add.circle(-5, -24, 1.2, 0x000);
    const pupilR = scene.add.circle(5, -24, 1.2, 0x000);

    const mouth = scene.add.rectangle(0, -14, 10, 2, 0x000);
    let teeth = null;
    if (!isSkel) {
      teeth = scene.add.rectangle(0, -14, 10, 1, 0xfff8d0);
    }

    this.add([head, earL, earR, eyeBgL, eyeBgR, eyeL, eyeR, pupilL, pupilR, mouth]);
    if (teeth) this.add(teeth);

    this.eyes = [eyeL, eyeR, pupilL, pupilR];

    if (def.hat === "tophat") {
      const brim = scene.add.rectangle(0, -33, 26, 3, 0x111);
      const hat = scene.add.rectangle(0, -44, 18, 16, 0x222);
      const band = scene.add.rectangle(0, -39, 18, 2.5, 0xc63a3a);
      this.add([brim, hat, band]);
    } else if (def.hat === "bucket") {
      const bucketBrim = scene.add.rectangle(0, -33, 28, 3, 0x666);
      const bucketBody = scene.add.rectangle(0, -42, 22, 14, 0x888);
      const bucketHandle = scene.add.arc(0, -47, 10, 180, 360, false, 0x666, 0).setStrokeStyle(2, 0x666);
      const dent = scene.add.rectangle(-6, -42, 4, 6, 0x444);
      this.add([bucketBrim, bucketBody, bucketHandle, dent]);
    } else if (def.hat === "wing") {
      const wing1 = scene.add.triangle(-22, -2, 0, 0, 18, -10, 18, 10, 0x444).setStrokeStyle(1, 0x111);
      const wing2 = scene.add.triangle(22, -2, 0, 0, -18, -10, -18, 10, 0x444).setStrokeStyle(1, 0x111);
      this.add([wing1, wing2]);
      this.wings = [wing1, wing2];
    } else if (def.hat === "horn") {
      const horn1 = scene.add.triangle(-9, -34, 0, 0, 5, -14, -5, 0, 0xddd8b8).setStrokeStyle(1, 0x4a4020);
      const horn2 = scene.add.triangle(9, -34, 0, 0, 5, 0, -5, -14, 0xddd8b8).setStrokeStyle(1, 0x4a4020);
      this.add([horn1, horn2]);
    }

    if (isBoss) {
      const tongue = scene.add.rectangle(0, -10, 6, 4, 0xc63a3a);
      this.add(tongue);
    }

    if (def.scale && def.scale !== 1) this.setScale(def.scale);

    if (this.maxHp > 1) {
      this.hpBarBg = scene.add.rectangle(0, -50, 34, 5, 0x000, 0.7).setStrokeStyle(1, 0x222);
      this.hpBar = scene.add.rectangle(-17, -50, 34, 5, 0x4ed8a3).setOrigin(0, 0.5);
      this.add([this.hpBarBg, this.hpBar]);
    }

    this.setSize(32, 80);
    this.setDepth(10);
    this._walkPhase = Math.random() * Math.PI * 2;
    this._blinkAt = scene.time.now + 1500 + Math.random() * 4000;

    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.body.setSize(32, 80).setOffset(-16, -40);

    this._tick = (time, delta) => this.tick(time, delta);
    scene.events.on("update", this._tick);
    this.once("destroy", () => scene.events.off("update", this._tick));
  }

  tick(time, delta) {
    if (!this.scene || this._dying) return;
    if (!this.blocked) {
      const dx = this.speed * (delta / 1000);
      this.x -= dx;
    }
    const w = (time + this._walkPhase * 200) / 130;
    const swing = Math.sin(w) * 5;
    if (this.legL && this.legR) {
      this.legL.y = 22 + Math.max(0, -swing);
      this.legR.y = 22 + Math.max(0, swing);
    }
    if (this.armL && this.armR) {
      this.armL.angle = 5 + swing * 0.6;
      this.armR.angle = -5 - swing * 0.6;
      if (this.handL) this.handL.y = 16 + Math.cos(w) * 1.5;
      if (this.handR) this.handR.y = 16 - Math.cos(w) * 1.5;
    }
    if (this.canFly && this.wings) {
      const flap = Math.sin(time / 80) * 14;
      this.wings[0].angle = -flap;
      this.wings[1].angle = flap;
      this.y += Math.sin(time / 200) * 0.3;
    }
    if (this.eyes && time > this._blinkAt) {
      this._blinkAt = time + 2000 + Math.random() * 4000;
      const eyes = this.eyes;
      this.scene.tweens.add({
        targets: eyes, scaleY: 0.1, duration: 80, yoyo: true,
      });
    }
    if (this.x < -50) {
      this.scene.events.emit("visitor-escaped", this);
      this.destroy();
    }
  }

  takeDamage(dmg, source) {
    if (this._dying) return;
    if (source && this.immune.includes(source)) {
      const ping = this.scene.add.text(this.x, this.y - 50, "résiste", {
        fontFamily: "system-ui",
        fontSize: "14px",
        color: "#aaa",
      }).setOrigin(0.5).setDepth(30);
      this.scene.tweens.add({
        targets: ping,
        y: ping.y - 20,
        alpha: 0,
        duration: 600,
        onComplete: () => ping.destroy(),
      });
      return;
    }
    this.hp -= dmg;
    if (this.hpBar) {
      this.hpBar.setScale(Math.max(0, this.hp / this.maxHp), 1);
      this.hpBar.setFillStyle(this.hp / this.maxHp > 0.5 ? 0x4ed8a3 : (this.hp / this.maxHp > 0.25 ? 0xffd23f : 0xff5555));
    }
    this.scene.tweens.add({
      targets: this,
      alpha: 0.4,
      duration: 60,
      yoyo: true,
    });
    if (typeof this.scene.showDamageNumber === "function" && dmg >= 0.5) {
      const colorMap = { lava: "#ff8844", frost: "#88ddff" };
      this.scene.showDamageNumber(this.x + (Math.random() - 0.5) * 16, this.y - 30, dmg.toFixed(dmg < 1 ? 1 : 0), colorMap[source] || "#ffeebb");
    }
    if (this.hp <= 0) this.kill();
  }

  kill() {
    if (this._dying) return;
    this._dying = true;
    JuiceFX.kill(this.scene);
    this.scene.events.emit("visitor-killed", this);
    const sx = this.x, sy = this.y;
    for (let i = 0; i < 8; i++) {
      const a = (Math.PI * 2 * i) / 8;
      const part = this.scene.add.rectangle(sx, sy, 4, 4, 0xffeecc).setDepth(20).setStrokeStyle(1, 0x666);
      this.scene.tweens.add({
        targets: part,
        x: sx + Math.cos(a) * (40 + Math.random() * 40),
        y: sy + Math.sin(a) * (40 + Math.random() * 40),
        alpha: 0,
        angle: 360 * (Math.random() > 0.5 ? 1 : -1),
        duration: 600,
        ease: "Cubic.out",
        onComplete: () => part.destroy(),
      });
    }
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
