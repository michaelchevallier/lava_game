import * as Phaser from "phaser";

const TYPE_DEFS = {
  basic:    { hp: 1, speed: 45,  bodyColor: 0x6cce5c, bodyStroke: 0x244a1a, skin: 0xffd2a8, immune: [], canFly: false, hat: null },
  tank:     { hp: 2, speed: 35,  bodyColor: 0x4a8a3a, bodyStroke: 0x244a1a, skin: 0xe8b380, immune: [], canFly: false, hat: null },
  vip:      { hp: 2, speed: 45,  bodyColor: 0x8a4ad8, bodyStroke: 0x4a1a8a, skin: 0xffd2a8, immune: [], canFly: false, hat: "tophat" },
  skeleton: { hp: 1, speed: 50,  bodyColor: 0xeeeeee, bodyStroke: 0x666666, skin: 0xeeeeee, immune: ["lava"], canFly: false, hat: null },
  flying:   { hp: 1, speed: 55,  bodyColor: 0xffd23f, bodyStroke: 0xc88a00, skin: 0xffd2a8, immune: [], canFly: true, hat: "wing" },
  boss:     { hp: 12, speed: 28, bodyColor: 0xa01030, bodyStroke: 0x4a0010, skin: 0xc88a60, immune: [], canFly: false, hat: "horn", scale: 1.6 },
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

    this.shadow = scene.add.ellipse(0, 22, 36, 8, 0x000, 0.35);
    this.add(this.shadow);

    this.legL = scene.add.rectangle(-7, 22, 8, 14, def.bodyStroke).setStrokeStyle(1, 0x000);
    this.legR = scene.add.rectangle(7, 22, 8, 14, def.bodyStroke).setStrokeStyle(1, 0x000);
    this.add([this.legL, this.legR]);

    const body = scene.add.rectangle(0, 4, 30, 36, def.bodyColor).setStrokeStyle(2, def.bodyStroke);
    const bodyShine = scene.add.rectangle(-7, -4, 6, 14, 0xffffff, 0.18);
    this.add([body, bodyShine]);

    this.armL = scene.add.rectangle(-15, 4, 6, 22, def.bodyColor).setStrokeStyle(1, def.bodyStroke);
    this.armR = scene.add.rectangle(15, 4, 6, 22, def.bodyColor).setStrokeStyle(1, def.bodyStroke);
    this.add([this.armL, this.armR]);

    const head = scene.add.circle(0, -22, 13, def.skin).setStrokeStyle(2, isSkel ? 0x999 : 0x6b4226);
    const cheekL = scene.add.circle(-6, -19, 2.5, 0xff9aa2, 0.7);
    const cheekR = scene.add.circle(6, -19, 2.5, 0xff9aa2, 0.7);
    const eye1 = scene.add.circle(-4, -24, 2.5, isSkel ? 0xff2222 : 0x222);
    const eye2 = scene.add.circle(4, -24, 2.5, isSkel ? 0xff2222 : 0x222);
    const eyeShine1 = scene.add.circle(-3.2, -25, 1, 0xffffff);
    const eyeShine2 = scene.add.circle(4.8, -25, 1, 0xffffff);
    const mouth = scene.add.rectangle(0, -16, 6, 1.5, isSkel ? 0x000 : 0x6b3a26);

    this.add([head, cheekL, cheekR, eye1, eye2, eyeShine1, eyeShine2, mouth]);

    if (def.hat === "tophat") {
      const brim = scene.add.rectangle(0, -33, 24, 3, 0x222);
      const hat = scene.add.rectangle(0, -42, 16, 14, 0x222);
      const band = scene.add.rectangle(0, -38, 16, 2.5, 0xffd23f);
      this.add([brim, hat, band]);
    } else if (def.hat === "wing") {
      const wing1 = scene.add.triangle(-22, -2, 0, 0, 18, -10, 18, 10, 0xffeebb).setStrokeStyle(1, 0xc8a060);
      const wing2 = scene.add.triangle(22, -2, 0, 0, -18, -10, -18, 10, 0xffeebb).setStrokeStyle(1, 0xc8a060);
      this.add([wing1, wing2]);
      this.wings = [wing1, wing2];
    } else if (def.hat === "horn") {
      const horn1 = scene.add.triangle(-9, -34, 0, 0, 5, -12, -5, 0, 0xffe6c8).setStrokeStyle(1, 0x6b3a0a);
      const horn2 = scene.add.triangle(9, -34, 0, 0, 5, 0, -5, -12, 0xffe6c8).setStrokeStyle(1, 0x6b3a0a);
      this.add([horn1, horn2]);
    }

    if (def.scale && def.scale !== 1) this.setScale(def.scale);

    if (this.maxHp > 1) {
      this.hpBarBg = scene.add.rectangle(0, -44, 32, 5, 0x000, 0.7).setStrokeStyle(1, 0x222);
      this.hpBar = scene.add.rectangle(-16, -44, 32, 5, 0x4ed8a3).setOrigin(0, 0.5);
      this.add([this.hpBarBg, this.hpBar]);
    }

    this.setSize(32, 80);
    this.setDepth(10);
    this._walkPhase = Math.random() * Math.PI * 2;

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
    const w = (time + this._walkPhase * 200) / 110;
    const swing = Math.sin(w) * 6;
    if (this.legL && this.legR) {
      this.legL.y = 22 + Math.max(0, -swing);
      this.legR.y = 22 + Math.max(0, swing);
    }
    if (this.armL && this.armR) {
      this.armL.angle = swing * 1.5;
      this.armR.angle = -swing * 1.5;
    }
    if (this.canFly && this.wings) {
      const flap = Math.sin(time / 80) * 12;
      this.wings[0].angle = -flap;
      this.wings[1].angle = flap;
      this.y += Math.sin(time / 200) * 0.3;
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
