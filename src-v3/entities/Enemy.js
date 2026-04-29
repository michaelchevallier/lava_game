import * as THREE from "three";
import { clone as cloneSkinned } from "three/examples/jsm/utils/SkeletonUtils.js";
import { Particles } from "../systems/Particles.js";
import { Audio } from "../systems/Audio.js";
import { AssetLoader } from "../systems/AssetLoader.js";
import { AnimationController } from "../systems/AnimationController.js";
import { applyToonToScene } from "../systems/ToonMaterial.js";

const DEATH_DURATION = 0.55;

export const ENEMY_TYPES = {
  basic: {
    hp: 3, speed: 1.2, damage: 5, reward: 2,
    asset: "zombie", scale: 0.55, walkAnim: "Walk",
    bodyColor: 0xc63a10,
  },
  runner: {
    hp: 1, speed: 2.4, damage: 4, reward: 2,
    asset: "goblin", scale: 0.45, walkAnim: "Run",
    bodyColor: 0x6fc16d,
  },
  brute: {
    hp: 12, speed: 0.8, damage: 12, reward: 8,
    asset: "soldier", scale: 0.7, walkAnim: "Walk",
    bodyColor: 0x8a4a22,
  },
  shielded: {
    hp: 2, speed: 1.0, damage: 8, reward: 5,
    asset: "knightgolden", scale: 0.6, walkAnim: "Walk",
    bodyColor: 0xd4af37, shieldHP: 4,
  },
  midboss: {
    hp: 30, speed: 0.7, damage: 20, reward: 15,
    asset: "wizard", scale: 0.75, walkAnim: "Walk",
    bodyColor: 0x6a3aa0, isMidBoss: true,
  },
  boss: {
    hp: 60, speed: 0.6, damage: 30, reward: 50,
    asset: "pirate", scale: 0.9, walkAnim: "Walk",
    bodyColor: 0x2c1810, isBoss: true,
  },
  brigand_boss: {
    hp: 80, speed: 0.6, damage: 40, reward: 100,
    asset: "pirate", scale: 1.1, walkAnim: "Walk",
    bodyColor: 0x8a1a0a, isBoss: true, isBrigand: true,
    chargeMs: 1500, chargeCooldownMs: 6000, chargeMul: 4,
    bossName: "Brigand de la Plaine",
  },
  assassin: {
    hp: 2, speed: 2.0, damage: 6, reward: 4,
    asset: "goblin", scale: 0.50, walkAnim: "Run",
    bodyColor: 0x222244, isStealth: true,
    stealthCycleMs: 2200, stealthOpacity: 0.25,
  },
  warlord_boss: {
    hp: 100, speed: 0.55, damage: 35, reward: 120,
    asset: "soldier", scale: 1.2, walkAnim: "Walk",
    bodyColor: 0xff7a00, isBoss: true,
    summonsMinions: true, summonCooldownMs: 5000, summonType: "runner",
    bossName: "Sorcier de la Forêt",
  },
};

export class Enemy {
  constructor(scene, curve, type = "basic") {
    const cfg = ENEMY_TYPES[type] || ENEMY_TYPES.basic;
    this.scene = scene;
    this.curve = curve;
    this.t = 0;
    this.hpMax = cfg.hp;
    this.hp = cfg.hp;
    this.speed = cfg.speed;
    this.damage = cfg.damage;
    this.reward = cfg.reward;
    this.type = type;
    this.shieldHP = cfg.shieldHP || 0;
    this.shieldHPMax = this.shieldHP;
    this.dead = false;
    this.reachedEnd = false;
    this._dying = false;
    this._dyingTimer = 0;
    this._lastTangent = new THREE.Vector3(0, 0, 1);

    this.chargeMs = cfg.chargeMs || 0;
    this.chargeCooldownMs = cfg.chargeCooldownMs || 0;
    this.chargeMul = cfg.chargeMul || 1;
    this.isBoss = !!cfg.isBoss;
    this.bossName = cfg.bossName || null;
    this._chargeActive = false;
    this._chargeTimer = 0;
    this._chargeCooldown = this.chargeCooldownMs > 0 ? 2000 : 0;
    this._spawned = false;

    this.isStealth = !!cfg.isStealth;
    this.stealthCycleMs = cfg.stealthCycleMs || 0;
    this.stealthOpacity = cfg.stealthOpacity || 0.25;
    this._stealthTimer = 0;

    this.summonsMinions = !!cfg.summonsMinions;
    this.summonCooldownMs = cfg.summonCooldownMs || 0;
    this.summonType = cfg.summonType || "basic";
    this._summonTimer = this.summonCooldownMs > 0 ? 3000 : 0;

    this.group = new THREE.Group();

    const gltf = AssetLoader.get(cfg.asset);
    if (gltf && gltf.scene) {
      const cloned = cloneSkinned(gltf.scene);
      cloned.scale.setScalar(cfg.scale);
      cloned.traverse((o) => {
        if (o.isMesh || o.isSkinnedMesh) {
          o.castShadow = false;
          o.receiveShadow = false;
        }
      });
      applyToonToScene(cloned);
      this.group.add(cloned);
      this.anim = new AnimationController(cloned, gltf.animations);
      const walkName = this.anim.has(cfg.walkAnim) ? cfg.walkAnim : (this.anim.has("Walk") ? "Walk" : "Idle");
      this.anim.play(walkName);
      this.model = cloned;
    } else {
      this._buildFallback(cfg.bodyColor);
      this.anim = null;
    }

    if (this.shieldHP > 0) {
      this.shieldRing = new THREE.Mesh(
        new THREE.RingGeometry(0.5, 0.6, 24),
        new THREE.MeshBasicMaterial({ color: 0xffd23f, transparent: true, opacity: 0.7, side: THREE.DoubleSide }),
      );
      this.shieldRing.rotation.x = -Math.PI / 2;
      this.shieldRing.position.y = 0.05;
      this.group.add(this.shieldRing);
    }

    this.hpBarBg = new THREE.Mesh(
      new THREE.PlaneGeometry(0.7, 0.08),
      new THREE.MeshBasicMaterial({ color: 0x222222, transparent: true, opacity: 0.7, depthTest: false }),
    );
    this.hpBarBg.position.y = 1.4 + (cfg.scale - 0.55) * 1.5;
    this.hpBarBg.rotation.x = -Math.PI / 4;
    this.hpBarBg.visible = false;
    this.group.add(this.hpBarBg);

    this.hpBar = new THREE.Mesh(
      new THREE.PlaneGeometry(0.68, 0.06),
      new THREE.MeshBasicMaterial({ color: 0xff6633, transparent: true, opacity: 0.95, depthTest: false }),
    );
    this.hpBar.position.set(0, this.hpBarBg.position.y, 0.001);
    this.hpBar.rotation.x = -Math.PI / 4;
    this.hpBar.visible = false;
    this.group.add(this.hpBar);

    scene.add(this.group);
    const start = curve.getPointAt(0);
    this.group.position.copy(start);
  }

  _buildFallback(color = 0xc63a10) {
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(0.45, 0.7, 0.4),
      new THREE.MeshLambertMaterial({ color }),
    );
    body.position.y = 0.45;
    body.castShadow = true;
    this.group.add(body);
    const head = new THREE.Mesh(
      new THREE.BoxGeometry(0.32, 0.3, 0.32),
      new THREE.MeshLambertMaterial({ color: 0xffc99a }),
    );
    head.position.y = 0.95;
    head.castShadow = true;
    this.group.add(head);
  }

  takeDamage(dmg, hitOrigin) {
    if (this._dying) return;
    let actualDmg = dmg;
    if (this.shieldHP > 0 && hitOrigin) {
      const facing = this._lastTangent;
      const ox = hitOrigin.x - this.group.position.x;
      const oz = hitOrigin.z - this.group.position.z;
      const dot = facing.x * ox + facing.z * oz;
      if (dot > 0) {
        const blocked = Math.min(this.shieldHP, dmg);
        this.shieldHP -= blocked;
        actualDmg = dmg - blocked;
        Particles.emit(
          { x: this.group.position.x, y: this.group.position.y + 0.6, z: this.group.position.z },
          0xffd23f, 4,
          { speed: 2.2, life: 0.25, scale: 0.3 },
        );
        if (this.shieldHP <= 0 && this.shieldRing) {
          this.scene.remove(this.shieldRing);
          this.shieldRing.geometry.dispose();
          this.shieldRing.material.dispose();
          this.shieldRing = null;
        }
      }
    }
    if (actualDmg > 0) {
      this.hp -= actualDmg;
      this.hpBarBg.visible = true;
      this.hpBar.visible = true;
      const ratio = Math.max(0, this.hp / this.hpMax);
      this.hpBar.scale.x = ratio;
      this.hpBar.position.x = -(0.68 * (1 - ratio)) / 2;
      Particles.emit(
        { x: this.group.position.x, y: this.group.position.y + 0.6, z: this.group.position.z },
        0xffffff, 3,
        { speed: 2, life: 0.3, scale: 0.25 },
      );
    }
    Audio.sfxEnemyHit();
    if (this.hp <= 0) {
      this._dying = true;
      this._dyingTimer = DEATH_DURATION;
      if (this.anim && this.anim.has("Death")) {
        this.anim.play("Death", { loop: false });
      }
    }
  }

  tick(dt) {
    if (this.anim) this.anim.tick(dt);

    if (!this._spawned && this.isBoss) {
      this._spawned = true;
      document.dispatchEvent(new CustomEvent("crowdef:boss-spawned", {
        detail: { type: this.type, name: this.bossName, hp: this.hpMax },
      }));
    }

    if (this._dying) {
      this._dyingTimer -= dt;
      if (this._dyingTimer <= 0) this.dead = true;
      return;
    }

    if (this.isStealth) {
      this._stealthTimer += dt * 1000;
      const phase = (this._stealthTimer % this.stealthCycleMs) / this.stealthCycleMs;
      const visible = phase < 0.5;
      const targetOp = visible ? 1 : this.stealthOpacity;
      this.group.traverse((o) => {
        if (o.isMesh || o.isSkinnedMesh) {
          if (Array.isArray(o.material)) {
            for (const m of o.material) { m.transparent = true; m.opacity = targetOp; }
          } else if (o.material) {
            o.material.transparent = true;
            o.material.opacity = targetOp;
          }
        }
      });
    }

    if (this.summonsMinions) {
      this._summonTimer -= dt * 1000;
      if (this._summonTimer <= 0) {
        this._summonTimer = this.summonCooldownMs;
        document.dispatchEvent(new CustomEvent("crowdef:boss-summon", {
          detail: { type: this.summonType, x: this.group.position.x, z: this.group.position.z, t: this.t },
        }));
      }
    }

    let effSpeed = this.speed;
    if (this.chargeMs > 0) {
      if (this._chargeActive) {
        this._chargeTimer -= dt * 1000;
        if (this._chargeTimer <= 0) {
          this._chargeActive = false;
          this._chargeCooldown = this.chargeCooldownMs;
        }
        effSpeed = this.speed * this.chargeMul;
        Particles.emit(
          { x: this.group.position.x, y: this.group.position.y + 0.4, z: this.group.position.z },
          0xff3a10, 1,
          { speed: 1.5, life: 0.25, scale: 0.3 },
        );
      } else {
        this._chargeCooldown -= dt * 1000;
        if (this._chargeCooldown <= 0) {
          this._chargeActive = true;
          this._chargeTimer = this.chargeMs;
          Particles.emit(
            { x: this.group.position.x, y: this.group.position.y + 0.6, z: this.group.position.z },
            0xff3a10, 12,
            { speed: 4, life: 0.5, scale: 0.5, yLift: 1.2 },
          );
          document.dispatchEvent(new CustomEvent("crowdef:boss-charge", {
            detail: { type: this.type },
          }));
        }
      }
    }

    const len = this.curve.getLength();
    this.t += (effSpeed * dt) / len;
    if (this.t >= 1) {
      this.t = 1;
      this.reachedEnd = true;
    }
    const p = this.curve.getPointAt(this.t);
    this.group.position.x = p.x;
    this.group.position.z = p.z;
    const tangent = this.curve.getTangentAt(this.t).normalize();
    this._lastTangent.copy(tangent);
    this.group.rotation.y = Math.atan2(tangent.x, tangent.z);
  }

  destroy() {
    this.scene.remove(this.group);
    if (this.anim) this.anim.dispose();
    this.group.traverse((c) => {
      if (c.geometry) c.geometry.dispose();
      if (c.material) {
        if (Array.isArray(c.material)) c.material.forEach((m) => m.dispose());
        else c.material.dispose();
      }
    });
  }
}
