import * as Phaser from "phaser";
import { JuiceFX } from "../systems/JuiceFX.js";
import { Flash } from "../systems/Flash.js";
import { Particles } from "../systems/Particles.js";

const SPRITE_MAP = {
  basic: "visitor_zombie",
  tank: "visitor_zombie",
  boss: "visitor_zombie",
  magicboss: "visitor_zombie",
  boudeur: "visitor_zombie",
  lavewalker: "visitor_zombie",
  lavaqueen: "visitor_female",
  funambule: "visitor_female",
  enfant: "visitor_female",
  clown: "visitor_adventurer",
  magicien: "visitor_adventurer",
  trompette: "visitor_adventurer",
  vip: "visitor_player",
  stiltman: "visitor_player",
  skeleton: "visitor_player",
  flying: "visitor_adventurer",
  ovniboss: "visitor_adventurer",
  kraken: "visitor_zombie",
  dragon: "visitor_zombie",
  netboss: "visitor_adventurer",
  carnivalboss: "visitor_adventurer",
};

function _visitorSpriteKey(type) {
  return SPRITE_MAP[type] || "visitor_zombie";
}

const TYPE_DEFS = {
  basic:      { hp: 1,  speed: 45,  shirtColor: 0x6a3a3a, shirtStroke: 0x2a0a0a, skin: 0x9acc8a, immune: [], canFly: false, hat: null },
  tank:       { hp: 2,  speed: 35,  shirtColor: 0x4a4a4a, shirtStroke: 0x222222, skin: 0x88aa78, immune: [], canFly: false, hat: "bucket" },
  vip:        { hp: 2,  speed: 45,  shirtColor: 0x3a3a3a, shirtStroke: 0x111111, skin: 0xa0c090, immune: [], canFly: false, hat: "tophat" },
  skeleton:   { hp: 1,  speed: 50,  shirtColor: 0xeeeeee, shirtStroke: 0x666666, skin: 0xeeeeee, immune: ["lava"], canFly: false, hat: null },
  flying:     { hp: 1,  speed: 55,  shirtColor: 0x6a3a3a, shirtStroke: 0x2a0a0a, skin: 0x9acc8a, immune: [], canFly: true,  hat: "wing" },
  boss:       { hp: 12, speed: 28,  shirtColor: 0x4a1a4a, shirtStroke: 0x1a0a1a, skin: 0x9accaa, immune: [], canFly: false, hat: "horn", scale: 1.7 },
  clown:      { hp: 3,  speed: 40,  shirtColor: 0xff66cc, shirtStroke: 0xcc0088, skin: 0xa0c090, immune: [], canFly: false, hat: "wig" },
  funambule:  { hp: 1,  speed: 60,  shirtColor: 0xffd23f, shirtStroke: 0xaa8800, skin: 0x9acc8a, immune: [], canFly: false, hat: "umbrella" },
  magicien:   { hp: 2,  speed: 45,  shirtColor: 0x4a1a8a, shirtStroke: 0x220050, skin: 0xa0c090, immune: [], canFly: false, hat: "tophat" },
  boudeur:    { hp: 4,  speed: 35,  shirtColor: 0x6a4020, shirtStroke: 0x3a1a00, skin: 0xc0a070, immune: [], canFly: false, hat: null },
  trompette:  { hp: 2,  speed: 50,  shirtColor: 0xffd23f, shirtStroke: 0xaa8800, skin: 0x9acc8a, immune: [], canFly: false, hat: "trumpet" },
  enfant:     { hp: 1,  speed: 55,  shirtColor: 0xff8888, shirtStroke: 0xaa3333, skin: 0xffd2a8, immune: [], canFly: false, hat: "balloon" },
  lavewalker: { hp: 3,  speed: 45,  shirtColor: 0xeeeeee, shirtStroke: 0x888888, skin: 0xffeebb, immune: ["lava", "frost"], canFly: false, hat: null },
  stiltman:   { hp: 2,  speed: 50,  shirtColor: 0x4a4a8a, shirtStroke: 0x222266, skin: 0x9acc8a, immune: [], canFly: false, hat: null },
  magicboss:  { hp: 25, speed: 26,  shirtColor: 0x4a1a8a, shirtStroke: 0x220050, skin: 0xa0c090, immune: [], canFly: false, hat: "tophat", scale: 1.8 },
  lavaqueen:  { hp: 35, speed: 22,  shirtColor: 0xc63a10, shirtStroke: 0x4a0010, skin: 0xffaa66, immune: ["lava"], canFly: false, hat: "crown", scale: 1.9 },
  carnivalboss: { hp: 50, speed: 24, shirtColor: 0xff66cc, shirtStroke: 0x880044, skin: 0xa0c090, immune: [], canFly: false, hat: "wig", scale: 2 },
  ovniboss:   { hp: 30, speed: 28, shirtColor: 0x66ddff, shirtStroke: 0x224477, skin: 0xc8e8ff, immune: [], canFly: true,  hat: "antenna", scale: 1.8 },
  kraken:     { hp: 40, speed: 22, shirtColor: 0x4a1a6a, shirtStroke: 0x220a3a, skin: 0x66ffdd, immune: ["frost"], canFly: false, hat: "tentacles", scale: 1.9 },
  dragon:     { hp: 50, speed: 26, shirtColor: 0xc63a10, shirtStroke: 0x4a0a04, skin: 0xff8800, immune: ["lava"], canFly: false, hat: "horn", scale: 2 },
  netboss:    { hp: 60, speed: 24, shirtColor: 0xff00aa, shirtStroke: 0x4a0066, skin: 0xc8c8c8, immune: [], canFly: false, hat: "visor", scale: 2 },
};

export class Visitor extends Phaser.GameObjects.Container {
  constructor(scene, x, y, opts = {}) {
    super(scene, x, y);

    const def = TYPE_DEFS[opts.type] || TYPE_DEFS.basic;
    this.type = opts.type || "basic";
    const hpMul = opts.hpMul ?? 1;
    const speedMul = opts.speedMul ?? 1;
    this.hp = (opts.hp ?? def.hp) * hpMul;
    this.maxHp = this.hp;
    this.speed = (opts.speed ?? def.speed) * speedMul;
    this.baseSpeed = this.speed;
    this.immune = def.immune;
    this.canFly = def.canFly;
    this.walksOnWater = this.type === "funambule";
    this._dying = false;
    this.blocked = false;
    const isSkel = this.type === "skeleton";
    const isBoss = this.type === "boss" || this.type === "magicboss" || this.type === "lavaqueen" || this.type === "carnivalboss" || this.type === "ovniboss" || this.type === "kraken" || this.type === "dragon" || this.type === "netboss";
    const isLavewalker = this.type === "lavewalker";

    this.shadow = scene.add.ellipse(0, 28, 38, 9, 0x000, 0.4);
    this.add(this.shadow);

    const spriteKey = _visitorSpriteKey(this.type);
    const useSprite = scene.textures.exists(spriteKey);
    this.legL = null;
    this.legR = null;
    this.armL = null;
    this.armR = null;
    this.handL = null;
    this.handR = null;
    this.eyes = null;

    if (useSprite) {
      this._bodySprite = scene.add.sprite(0, 0, spriteKey, 0);
      this._bodySprite.setFlipX(true);
      this._bodySprite.setOrigin(0.5, 0.85);
      this._bodySprite.setTint(def.shirtColor);
      this._bodySprite.setScale(0.72);
      this.add(this._bodySprite);
      if (!scene.anims.exists(`${spriteKey}_walk`)) {
        scene.anims.create({
          key: `${spriteKey}_walk`,
          frames: scene.anims.generateFrameNumbers(spriteKey, { start: 9, end: 17 }),
          frameRate: 10,
          repeat: -1,
        });
      }
      this._bodySprite.play(`${spriteKey}_walk`);
      this.wings = null;
    } else {
      if (this.type === "stiltman") {
        const stiltL = scene.add.rectangle(-7, 42, 6, 30, 0x2a2a4a).setStrokeStyle(1, 0x111);
        const stiltR = scene.add.rectangle(7, 42, 6, 30, 0x2a2a4a).setStrokeStyle(1, 0x111);
        this.add([stiltL, stiltR]);
      }
      this.legL = scene.add.rectangle(-7, 22, 9, 16, def.shirtStroke).setStrokeStyle(1, 0x000);
      this.legR = scene.add.rectangle(7, 22, 9, 16, def.shirtStroke).setStrokeStyle(1, 0x000);
      this.add([this.legL, this.legR]);
      const torsoBack = scene.add.rectangle(0, 4, 32, 38, isSkel ? 0xddd8c8 : 0x4a3030).setStrokeStyle(2, def.shirtStroke);
      const shirt = scene.add.rectangle(0, 6, 28, 26, def.shirtColor).setStrokeStyle(1, def.shirtStroke);
      this.add([torsoBack, shirt]);
      if (!isSkel && !isLavewalker) {
        this.add([scene.add.rectangle(-8, 8, 6, 2, def.shirtStroke), scene.add.rectangle(6, 14, 5, 2, def.shirtStroke), scene.add.circle(4, 4, 2.5, 0x6a0010, 0.85)]);
      }
      this.armL = scene.add.rectangle(-16, -8, 7, 24, def.skin).setStrokeStyle(1, def.shirtStroke).setOrigin(0.5, 0);
      this.armR = scene.add.rectangle(16, -8, 7, 24, def.skin).setStrokeStyle(1, def.shirtStroke).setOrigin(0.5, 0);
      this.add([this.armL, this.armR]);
      this.handL = scene.add.circle(-16, 16, 4, def.skin).setStrokeStyle(1, def.shirtStroke);
      this.handR = scene.add.circle(16, 16, 4, def.skin).setStrokeStyle(1, def.shirtStroke);
      this.add([this.handL, this.handR]);
      const head = scene.add.circle(0, -22, 13, def.skin).setStrokeStyle(2, isSkel ? 0x999 : 0x4a4020);
      const earL = scene.add.ellipse(-12, -22, 4, 7, def.skin).setStrokeStyle(1, 0x4a4020);
      const earR = scene.add.ellipse(12, -22, 4, 7, def.skin).setStrokeStyle(1, 0x4a4020);
      if (!isSkel && !isLavewalker) {
        this.add([scene.add.rectangle(-7, -28, 6, 1.5, 0x6a0010), scene.add.rectangle(5, -16, 4, 1.5, 0x6a0010)]);
      }
      const eyeColor = isLavewalker ? 0x00ee44 : (isSkel ? 0xff2222 : 0xffd23f);
      const eyeBgL = scene.add.circle(-5, -24, 4, 0xfff8d0);
      const eyeBgR = scene.add.circle(5, -24, 4, 0xfff8d0);
      const eyeL = scene.add.circle(-5, -24, 2.4, eyeColor);
      const eyeR = scene.add.circle(5, -24, 2.4, eyeColor);
      const pupilL = scene.add.circle(-5, -24, 1.2, 0x000);
      const pupilR = scene.add.circle(5, -24, 1.2, 0x000);
      const mouth = scene.add.rectangle(0, -14, 10, 2, 0x000);
      this.add([head, earL, earR, eyeBgL, eyeBgR, eyeL, eyeR, pupilL, pupilR, mouth]);
      if (!isSkel) this.add(scene.add.rectangle(0, -14, 10, 1, 0xfff8d0));
      this.eyes = [eyeL, eyeR, pupilL, pupilR];
    }

    // Hat visuals (always drawn over sprite)
    if (def.hat === "tophat") {
      const brim = scene.add.rectangle(0, -33, 26, 3, 0x111);
      const hat = scene.add.rectangle(0, -44, 18, 16, 0x222);
      const band = scene.add.rectangle(0, -39, 18, 2.5, this.type === "magicien" ? 0xffd23f : 0xc63a3a);
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
    } else if (def.hat === "crown") {
      const crownBase = scene.add.rectangle(0, -33, 28, 5, 0xffd23f).setStrokeStyle(1, 0xc88a00);
      const spike1 = scene.add.triangle(-10, -38, 0, 0, 4, -8, 8, 0, 0xffd23f).setStrokeStyle(1, 0xc88a00);
      const spike2 = scene.add.triangle(0, -42, 0, 0, 4, -10, 8, 0, 0xffe066).setStrokeStyle(1, 0xc88a00);
      const spike3 = scene.add.triangle(10, -38, 0, 0, 4, -8, 8, 0, 0xffd23f).setStrokeStyle(1, 0xc88a00);
      const gem = scene.add.circle(0, -38, 2.5, 0xff2200).setStrokeStyle(1, 0xffaaaa);
      this.add([crownBase, spike1, spike2, spike3, gem]);
    } else if (def.hat === "wig") {
      const wigBase = scene.add.ellipse(0, -35, 32, 12, 0xff2200);
      const wigL = scene.add.circle(-12, -42, 8, 0xff3300);
      const wigC = scene.add.circle(0, -45, 9, 0xff2200);
      const wigR = scene.add.circle(12, -42, 8, 0xff3300);
      const nose = scene.add.circle(0, -19, 4, 0xff0000).setStrokeStyle(1, 0xaa0000);
      this.add([wigBase, wigL, wigC, wigR, nose]);
    } else if (def.hat === "umbrella") {
      const stick = scene.add.rectangle(0, -42, 2, 14, 0x888);
      const canopy = scene.add.arc(0, -50, 12, 180, 360, false, 0xffd23f, 1).setStrokeStyle(1, 0xaa8800);
      const tip = scene.add.circle(0, -36, 2, 0x888);
      this.add([stick, canopy, tip]);
    } else if (def.hat === "trumpet") {
      const tubeBody = scene.add.rectangle(-20, -10, 18, 5, 0xddaa00).setStrokeStyle(1, 0x886600);
      const bell = scene.add.triangle(-30, -10, 0, 0, -10, -7, -10, 7, 0xffd23f).setStrokeStyle(1, 0xaa8800);
      const mouthpiece = scene.add.circle(-11, -10, 3, 0xbbaa00);
      this.add([tubeBody, bell, mouthpiece]);
    } else if (def.hat === "balloon") {
      const string = scene.add.rectangle(-16, -10, 1, 20, 0x888);
      const balloon = scene.add.circle(-16, -28, 8, 0xff4488).setStrokeStyle(1, 0xcc0066);
      const balloonShine = scene.add.circle(-18, -31, 2, 0xffffff, 0.5);
      this.add([string, balloon, balloonShine]);
    } else if (def.hat === "antenna") {
      const dome = scene.add.ellipse(0, -38, 28, 14, 0x66ddff, 0.7).setStrokeStyle(2, 0xaaffff);
      const stem1 = scene.add.rectangle(-6, -46, 1.5, 8, 0xaaffff);
      const stem2 = scene.add.rectangle(6, -46, 1.5, 8, 0xaaffff);
      const tip1 = scene.add.circle(-6, -52, 2, 0xff2222);
      const tip2 = scene.add.circle(6, -52, 2, 0xffd23f);
      scene.tweens.add({ targets: [tip1, tip2], alpha: { from: 0.5, to: 1 }, duration: 400, yoyo: true, repeat: -1 });
      this.add([dome, stem1, stem2, tip1, tip2]);
    } else if (def.hat === "tentacles") {
      for (let i = 0; i < 5; i++) {
        const a = (i - 2) * 0.4;
        const tx = Math.sin(a) * 14;
        const ty = -32 - Math.cos(a) * 12;
        const tent = scene.add.ellipse(tx, ty, 4, 18, 0x4a1a6a).setStrokeStyle(1, 0x220a3a);
        tent.setRotation(a);
        this.add(tent);
      }
      const tentHead = scene.add.circle(0, -30, 12, 0x6a2a8a).setStrokeStyle(2, 0x220a3a);
      const eye1 = scene.add.circle(-4, -32, 2.5, 0xffd23f);
      const eye2 = scene.add.circle(4, -32, 2.5, 0xffd23f);
      this.add([tentHead, eye1, eye2]);
    } else if (def.hat === "visor") {
      const helm = scene.add.rectangle(0, -38, 26, 12, 0x222244).setStrokeStyle(2, 0xff00aa);
      const visor = scene.add.rectangle(0, -36, 22, 4, 0x00ffff, 0.85);
      scene.tweens.add({ targets: visor, alpha: { from: 0.5, to: 1 }, duration: 350, yoyo: true, repeat: -1 });
      const ant = scene.add.rectangle(10, -46, 1.5, 8, 0xff00aa);
      this.add([helm, visor, ant]);
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

    // Behavior timers
    this._lastClownThrowAt = 0;
    this._lastTeleportAt = 0;
    this._lastStiltJumpAt = 0;
    this._backupSpawned = false;
    this._stolenAmount = 0;
    this._jumpUntil = 0;

    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.body.setSize(32, 80).setOffset(-16, -40);

    this._tick = (time, delta) => this.tick(time, delta);
    scene.events.on("game-tick", this._tick);
    this.once("destroy", () => scene.events.off("game-tick", this._tick));
  }

  tick(time, delta) {
    if (!this.scene || this._dying) return;

    // Apply speed aura from trompette if set
    const effectiveSpeed = this._speedAura ? this.speed * this._speedAura : this.speed;

    // Reset aura each frame — trompette re-applies it each tick
    this._speedAura = null;

    if (!this.blocked) {
      const dx = effectiveSpeed * (delta / 1000);
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

    // Type-specific behaviors
    switch (this.type) {
      case "clown":
        if (time - this._lastClownThrowAt > 5000) {
          this._lastClownThrowAt = time;
          this._doClownThrow(time);
        }
        break;

      case "magicien":
        if (time - this._lastTeleportAt > 6000) {
          this._lastTeleportAt = time;
          this._doMagicienTeleport();
        }
        break;

      case "boudeur":
        this._doBoudeurCheck();
        break;

      case "trompette":
        this._doTrompetteAura();
        break;

      case "stiltman":
        if (time - this._lastStiltJumpAt > 4000) {
          this._lastStiltJumpAt = time;
          this._doStiltmanJump(time);
        }
        // Clear jump state
        if (this._jumpUntil > 0 && time > this._jumpUntil) {
          this._jumpUntil = 0;
          this.walksOnWater = false;
        }
        break;

      case "magicboss":
        if (time - (this._lastSummonAt ?? 0) > 8000) {
          this._lastSummonAt = time;
          this._doMagicBossSummon();
        }
        break;

      case "lavaqueen":
        if (time - (this._lastLavaPuddleAt ?? 0) > 1500) {
          this._lastLavaPuddleAt = time;
          this._doLavaQueenTrail();
        }
        break;

      case "carnivalboss":
        const hpPct = this.hp / this.maxHp;
        if (hpPct <= 0.5 && !this._phase2Triggered) {
          this._phase2Triggered = true;
          this._doCarnivalPhase2();
        }
        if (hpPct <= 0.25 && !this._phase3Triggered) {
          this._phase3Triggered = true;
          this._doCarnivalPhase3();
        }
        break;
    }

    if (this.x < -50) {
      this.scene.events.emit("visitor-escaped", this);
      this.destroy();
    }
  }

  _doClownThrow(time) {
    if (!this.scene) return;
    // Find closest tower
    const towers = this.scene.towers || [];
    let closest = null;
    let closestDist = Infinity;
    for (const tower of towers) {
      if (!tower || !tower.active) continue;
      const dist = Phaser.Math.Distance.Between(this.x, this.y, tower.x, tower.y);
      if (dist < closestDist) {
        closestDist = dist;
        closest = tower;
      }
    }
    // Confetti burst visual
    for (let i = 0; i < 6; i++) {
      const col = [0xff66cc, 0xffd23f, 0x66ffcc, 0xff6644][i % 4];
      const cx = this.x + (Math.random() - 0.5) * 30;
      const cy = this.y - 20 + (Math.random() - 0.5) * 20;
      const c = this.scene.add.rectangle(cx, cy, 5, 3, col).setDepth(25).setAngle(Math.random() * 360);
      this.scene.tweens.add({
        targets: c,
        x: cx + (Math.random() - 0.5) * 80,
        y: cy - 40 - Math.random() * 40,
        alpha: 0,
        angle: c.angle + 180,
        duration: 800,
        ease: "Cubic.out",
        onComplete: () => c.destroy(),
      });
    }
    if (closest) {
      this.scene.events.emit("tower-disabled", { tower: closest, untilMs: time + 4000 });
    }
  }

  _doMagicienTeleport() {
    if (!this.scene) return;
    const TILE = 90;
    // Burst at current position
    this._spawnMagicBurst(this.x, this.y);
    this.x -= 2 * TILE;
    // Burst at new position
    this._spawnMagicBurst(this.x, this.y);
  }

  _spawnMagicBurst(bx, by) {
    if (!this.scene) return;
    for (let i = 0; i < 8; i++) {
      const a = (Math.PI * 2 * i) / 8;
      const part = this.scene.add.circle(bx, by, 4, 0xff88ff).setDepth(25).setAlpha(0.9);
      this.scene.tweens.add({
        targets: part,
        x: bx + Math.cos(a) * 30,
        y: by + Math.sin(a) * 30,
        alpha: 0,
        scaleX: 0.2,
        scaleY: 0.2,
        duration: 400,
        ease: "Cubic.out",
        onComplete: () => part.destroy(),
      });
    }
  }

  _doBoudeurCheck() {
    if (!this.scene || this._stolenAmount > 0) return;
    const generators = this.scene.coinGenerators || [];
    for (const gen of generators) {
      if (!gen || !gen.active) continue;
      const dist = Phaser.Math.Distance.Between(this.x, this.y, gen.x, gen.y);
      if (dist < 60) {
        this._stolenAmount = 50;
        gen.destroy();
        // Visual pop
        const pop = this.scene.add.text(gen.x, gen.y - 20, "-50c", {
          fontFamily: "Fredoka, system-ui", fontSize: "16px", color: "#ff4444",
        }).setOrigin(0.5).setDepth(30);
        this.scene.tweens.add({
          targets: pop, y: pop.y - 30, alpha: 0, duration: 800,
          onComplete: () => pop.destroy(),
        });
        break;
      }
    }
  }

  _doTrompetteAura() {
    if (!this.scene) return;
    const visitors = this.scene.visitors || [];
    for (const v of visitors) {
      if (v === this || !v.active || v._dying) continue;
      if (v.row !== this.row) continue;
      const dist = Math.abs(v.x - this.x);
      if (dist < 300) {
        v._speedAura = 1.3;
      }
    }
  }

  _doStiltmanJump(time) {
    if (!this.scene) return;
    this._jumpUntil = time + 800;
    this.walksOnWater = true;
    // Visual bounce
    this.scene.tweens.add({
      targets: this,
      y: this.y - 20,
      duration: 400,
      yoyo: true,
      ease: "Sine.inOut",
    });
  }

  takeDamage(dmg, source) {
    if (this._dying) return;
    if (source && this.immune.includes(source)) {
      const ping = this.scene.add.text(this.x, this.y - 50, "résiste", {
        fontFamily: "Fredoka, system-ui",
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

    // Enfant: spawn backup when first hit
    if (this.type === "enfant" && !this._backupSpawned) {
      this._backupSpawned = true;
      if (typeof this.scene.spawnVisitor === "function") {
        this.scene.spawnVisitor(this.row, "basic");
        this.scene.spawnVisitor(this.row, "basic");
      }
    }

    this._lastDamageSource = source || "unknown";
    Flash.entity(this, 0xffffff, 80);
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
    this.scene.events.emit("visitor-killed", this, this._lastDamageSource);

    // Boudeur drops stolen coins back
    if (this._stolenAmount > 0) {
      this.scene.events.emit("coins-refund", this._stolenAmount);
    }

    const sx = this.x, sy = this.y;
    const def = TYPE_DEFS[this.type] || TYPE_DEFS.basic;
    const baseColor = def.shirtColor || 0xffeecc;
    const isBoss = this.type === "boss" || this.type === "magicboss" || this.type === "lavaqueen" || this.type === "carnivalboss" || this.type === "ovniboss" || this.type === "kraken" || this.type === "dragon" || this.type === "netboss";
    const burst = isBoss ? 18 : 10;
    const colors = [baseColor, def.skin || 0xffeecc, 0xffd23f, 0xffffff];
    Particles.burst(this.scene, sx, sy, burst, (i, a) => {
      const c = colors[i % colors.length];
      const r = isBoss ? (4 + Math.random() * 4) : (3 + Math.random() * 2);
      Particles.spawnCircle(this.scene, sx, sy, {
        radius: r, color: c,
        tween: {
          x: sx + Math.cos(a) * (50 + Math.random() * (isBoss ? 80 : 50)),
          y: sy + Math.sin(a) * (50 + Math.random() * (isBoss ? 80 : 50)) - 30,
          alpha: 0, scale: 0.2,
          duration: 600 + Math.random() * 200,
          ease: "Cubic.out",
        },
      });
    });
    if (isBoss) {
      const ring = this.scene.add.circle(sx, sy, 10, 0, 0).setStrokeStyle(4, 0xffd23f).setDepth(20);
      this.scene.tweens.add({
        targets: ring, scale: 10, alpha: 0, duration: 500,
        onComplete: () => ring.destroy(),
      });
    }
    const popup = this.scene.add.text(sx, sy - 20, isBoss ? "BOSS DOWN!" : "+1", {
      fontFamily: "Fredoka, system-ui",
      fontSize: isBoss ? "22px" : "16px",
      fontStyle: "bold",
      color: isBoss ? "#ffd23f" : "#90ff90",
      stroke: "#000",
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(35);
    this.scene.tweens.add({
      targets: popup, y: popup.y - 40, alpha: 0,
      duration: 800, ease: "Cubic.out",
      onComplete: () => popup.destroy(),
    });
    this.scene.tweens.add({
      targets: this,
      scaleY: 0.2,
      scaleX: 1.4,
      alpha: 0,
      duration: 220,
      onComplete: () => this.destroy(),
    });
  }

  _doMagicBossSummon() {
    if (!this.scene || typeof this.scene.spawnVisitor !== "function") return;
    const myRow = this.row ?? 2;
    const ring = this.scene.add.circle(this.x, this.y, 36, 0xff66ff, 0.7).setDepth(20);
    this.scene.tweens.add({
      targets: ring, scale: 2.2, alpha: 0, duration: 500,
      onComplete: () => ring.destroy(),
    });
    for (let i = 0; i < 2; i++) {
      const r = (myRow + (i === 0 ? -1 : 1) + 5) % 5;
      this.scene.spawnVisitor(r, "basic");
    }
  }

  _doLavaQueenTrail() {
    if (!this.scene) return;
    const puddle = this.scene.add.ellipse(this.x + 10, this.y + 22, 28, 12, 0xff4400, 0.85)
      .setStrokeStyle(2, 0xffe066).setDepth(4);
    this.scene.tweens.add({
      targets: puddle,
      alpha: { from: 0.85, to: 0 },
      duration: 6000,
      onComplete: () => puddle.destroy(),
    });
    for (const t of (this.scene.towers || [])) {
      if (!t.active) continue;
      if (Math.abs(t.x - this.x - 10) < 30 && Math.abs(t.y - this.y - 22) < 25) {
        if (typeof t.takeDamage === "function") t.takeDamage(0.5);
        else if (t._disabledUntil === undefined || this.scene.time.now > t._disabledUntil) {
          this.scene.events.emit("tower-disabled", { tower: t, untilMs: this.scene.time.now + 2500 });
        }
      }
    }
  }

  _doCarnivalPhase2() {
    if (!this.scene) return;
    const burst = this.scene.add.circle(this.x, this.y, 60, 0xffd23f, 0.6).setDepth(25);
    this.scene.tweens.add({
      targets: burst, scale: 2.5, alpha: 0, duration: 700,
      onComplete: () => burst.destroy(),
    });
    if (typeof this.scene.spawnVisitor === "function") {
      for (let i = 0; i < 8; i++) {
        const r = Math.floor(Math.random() * 5);
        this.scene.time.delayedCall(i * 250, () => {
          if (this.scene?.scene?.isActive()) this.scene.spawnVisitor(r, "basic");
        });
      }
    }
    this.speed *= 1.4;
    this.baseSpeed *= 1.4;
  }

  _doCarnivalPhase3() {
    if (!this.scene) return;
    this.immune = ["lava"];
    const ring = this.scene.add.circle(this.x, this.y, 50, 0xff0000, 0.9).setStrokeStyle(3, 0xff66ff).setDepth(25);
    this.scene.tweens.add({
      targets: ring, scale: 0.4, alpha: 0, duration: 600,
      onComplete: () => ring.destroy(),
    });
    if (this.scene.cameras?.main) this.scene.cameras.main.shake(400, 0.012);
  }
}
