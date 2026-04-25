import * as Phaser from "phaser";

const TYPE_DEFS = {
  basic:    { hp: 1, speed: 60,  bodyColor: 0x6cce5c, bodyStroke: 0x244a1a, immune: [], canFly: false, hat: null },
  tank:     { hp: 3, speed: 50,  bodyColor: 0x4a8a3a, bodyStroke: 0x244a1a, immune: [], canFly: false, hat: null },
  vip:      { hp: 3, speed: 60,  bodyColor: 0x8a4ad8, bodyStroke: 0x4a1a8a, immune: [], canFly: false, hat: "tophat" },
  skeleton: { hp: 1, speed: 70,  bodyColor: 0xeeeeee, bodyStroke: 0x666666, immune: ["lava"], canFly: false, hat: null },
  flying:   { hp: 1, speed: 80,  bodyColor: 0xffd23f, bodyStroke: 0xc88a00, immune: [], canFly: true, hat: "wing" },
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

    const body = scene.add.rectangle(0, 0, 32, 48, def.bodyColor).setStrokeStyle(2, def.bodyStroke);
    const head = scene.add.circle(0, -32, 12, this.type === "skeleton" ? 0xeeeeee : 0xffd2a8).setStrokeStyle(2, this.type === "skeleton" ? 0x999 : 0x6b4226);
    const eye = scene.add.circle(4, -32, 2, this.type === "skeleton" ? 0xff2222 : 0x000);
    const eye2 = scene.add.circle(-4, -32, 2, this.type === "skeleton" ? 0xff2222 : 0x000);

    this.add([body, head, eye, eye2]);

    if (def.hat === "tophat") {
      const brim = scene.add.rectangle(0, -42, 22, 3, 0x222);
      const hat = scene.add.rectangle(0, -50, 16, 12, 0x222);
      const band = scene.add.rectangle(0, -47, 16, 2, 0xffd23f);
      this.add([brim, hat, band]);
    } else if (def.hat === "wing") {
      const wing1 = scene.add.triangle(-18, -10, 0, 0, 16, -8, 16, 8, 0xffeebb).setStrokeStyle(1, 0xc8a060);
      const wing2 = scene.add.triangle(18, -10, 0, 0, -16, -8, -16, 8, 0xffeebb).setStrokeStyle(1, 0xc8a060);
      this.add([wing1, wing2]);
      this.wings = [wing1, wing2];
    }

    if (this.maxHp > 1) {
      this.hpBarBg = scene.add.rectangle(0, -52, 30, 4, 0x000, 0.6);
      this.hpBar = scene.add.rectangle(-15, -52, 30, 4, 0x4ed8a3).setOrigin(0, 0.5);
      this.add([this.hpBarBg, this.hpBar]);
    }

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
    if (this.canFly && this.wings) {
      const flap = Math.sin(time / 80) * 4;
      this.wings[0].angle = -flap * 2;
      this.wings[1].angle = flap * 2;
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
    }
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
