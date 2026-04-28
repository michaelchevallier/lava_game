import * as THREE from "three";
import { clone as cloneSkinned } from "three/examples/jsm/utils/SkeletonUtils.js";
import { Particles } from "../systems/Particles.js";
import { Audio } from "../systems/Audio.js";
import { AssetLoader } from "../systems/AssetLoader.js";
import { AnimationController } from "../systems/AnimationController.js";
import { applyToonToScene } from "../systems/ToonMaterial.js";
import { addOutlineToScene } from "../systems/Outline.js";

const SPEED = 1.2;
const HP_MAX = 3;
const DAMAGE = 5;
const REWARD = 2;
const MODEL_SCALE = 0.55;
const DEATH_DURATION = 0.55;

export class Enemy {
  constructor(scene, curve) {
    this.scene = scene;
    this.curve = curve;
    this.t = 0;
    this.hp = HP_MAX;
    this.dead = false;
    this.reachedEnd = false;
    this.damage = DAMAGE;
    this.reward = REWARD;
    this.type = "basic";
    this._dying = false;
    this._dyingTimer = 0;

    this.group = new THREE.Group();

    const gltf = AssetLoader.get("zombie");
    if (gltf && gltf.scene) {
      const cloned = cloneSkinned(gltf.scene);
      cloned.scale.setScalar(MODEL_SCALE);
      cloned.traverse((o) => {
        if (o.isMesh || o.isSkinnedMesh) {
          o.castShadow = false;
          o.receiveShadow = false;
        }
      });
      applyToonToScene(cloned);
      this.group.add(cloned);
      this.anim = new AnimationController(cloned, gltf.animations);
      if (this.anim.has("Walk")) this.anim.play("Walk");
      this.model = cloned;
    } else {
      this._buildFallback();
      this.anim = null;
    }

    this.hpBarBg = new THREE.Mesh(
      new THREE.PlaneGeometry(0.6, 0.08),
      new THREE.MeshBasicMaterial({ color: 0x222222, transparent: true, opacity: 0.7, depthTest: false }),
    );
    this.hpBarBg.position.y = 1.4;
    this.hpBarBg.rotation.x = -Math.PI / 4;
    this.hpBarBg.visible = false;
    this.group.add(this.hpBarBg);

    this.hpBar = new THREE.Mesh(
      new THREE.PlaneGeometry(0.58, 0.06),
      new THREE.MeshBasicMaterial({ color: 0xff6633, transparent: true, opacity: 0.95, depthTest: false }),
    );
    this.hpBar.position.set(0, 1.4, 0.001);
    this.hpBar.rotation.x = -Math.PI / 4;
    this.hpBar.visible = false;
    this.group.add(this.hpBar);

    scene.add(this.group);
    const start = curve.getPointAt(0);
    this.group.position.copy(start);
  }

  _buildFallback() {
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(0.45, 0.7, 0.4),
      new THREE.MeshLambertMaterial({ color: 0xc63a10 }),
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

  takeDamage(dmg) {
    if (this._dying) return;
    this.hp -= dmg;
    this.hpBarBg.visible = true;
    this.hpBar.visible = true;
    const ratio = Math.max(0, this.hp / HP_MAX);
    this.hpBar.scale.x = ratio;
    this.hpBar.position.x = -(0.58 * (1 - ratio)) / 2;
    Particles.emit(
      { x: this.group.position.x, y: this.group.position.y + 0.6, z: this.group.position.z },
      0xffffff,
      3,
      { speed: 2, life: 0.3, scale: 0.25 },
    );
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
    this.t += (SPEED * dt) / len;
    if (this.t >= 1) {
      this.t = 1;
      this.reachedEnd = true;
    }
    const p = this.curve.getPointAt(this.t);
    this.group.position.x = p.x;
    this.group.position.z = p.z;
    const tangent = this.curve.getTangentAt(this.t).normalize();
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
