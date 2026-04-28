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

    if (this._dying) {
      this._dyingTimer -= dt;
      if (this._dyingTimer <= 0) this.dead = true;
      return;
    }

    const len = this.curve.getLength();
    this.t += (this.speed * dt) / len;
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
