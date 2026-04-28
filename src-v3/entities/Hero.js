import * as THREE from "three";
import { clone as cloneSkinned } from "three/examples/jsm/utils/SkeletonUtils.js";
import { Particles } from "../systems/Particles.js";
import { Audio } from "../systems/Audio.js";
import { AssetLoader } from "../systems/AssetLoader.js";
import { AnimationController } from "../systems/AnimationController.js";
import { applyToonToScene } from "../systems/ToonMaterial.js";
import { addOutlineToScene } from "../systems/Outline.js";

const FIRE_RATE_MS = 350;
const RANGE = 12;
const DAMAGE = 1;
const PROJ_SPEED = 22;
const MOVE_SPEED = 6;
const BOUND_X = 14;
const BOUND_Z = 9;
const MODEL_SCALE = 0.6;

export class Hero {
  constructor(scene, position) {
    this.scene = scene;

    this.group = new THREE.Group();
    this.group.position.copy(position);
    scene.add(this.group);

    const gltf = AssetLoader.get("knight");
    if (gltf && gltf.scene) {
      const cloned = cloneSkinned(gltf.scene);
      cloned.scale.setScalar(MODEL_SCALE);
      cloned.traverse((o) => {
        if (o.isMesh || o.isSkinnedMesh) {
          o.castShadow = true;
          o.receiveShadow = false;
        }
      });
      applyToonToScene(cloned);
      addOutlineToScene(cloned, 1.04);
      this.group.add(cloned);
      this.anim = new AnimationController(cloned, gltf.animations);
      this.anim.play("Idle");
      this.model = cloned;
    } else {
      this._buildFallback();
      this.anim = null;
    }

    const feet = new THREE.Mesh(
      new THREE.RingGeometry(0.45, 0.55, 16),
      new THREE.MeshBasicMaterial({ color: 0x66ccff, transparent: true, opacity: 0.5, side: THREE.DoubleSide }),
    );
    feet.rotation.x = -Math.PI / 2;
    feet.position.y = 0.02;
    this.group.add(feet);

    this.cooldown = 0;
    this.projectiles = [];
    this.moveDir = new THREE.Vector2(0, 0);
  }

  _buildFallback() {
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(0.55, 0.85, 0.5),
      new THREE.MeshLambertMaterial({ color: 0x3a6abf }),
    );
    body.position.y = 0.55;
    body.castShadow = true;
    this.group.add(body);
    const head = new THREE.Mesh(
      new THREE.BoxGeometry(0.38, 0.35, 0.38),
      new THREE.MeshLambertMaterial({ color: 0xffc99a }),
    );
    head.position.y = 1.15;
    head.castShadow = true;
    this.group.add(head);
    const cape = new THREE.Mesh(
      new THREE.PlaneGeometry(0.55, 0.7),
      new THREE.MeshLambertMaterial({ color: 0xc63a10, side: THREE.DoubleSide }),
    );
    cape.position.set(0, 0.55, -0.27);
    this.group.add(cape);
  }

  setMove(dx, dz) {
    const len = Math.hypot(dx, dz);
    if (len > 0.05) this.moveDir.set(dx / len, dz / len);
    else this.moveDir.set(0, 0);
  }

  tick(dt, enemies) {
    this.cooldown -= dt * 1000;
    if (this.anim) this.anim.tick(dt);

    if (this.moveDir.lengthSq() > 0.01) {
      this.group.position.x += this.moveDir.x * MOVE_SPEED * dt;
      this.group.position.z += this.moveDir.y * MOVE_SPEED * dt;
      this.group.position.x = Math.max(-BOUND_X, Math.min(BOUND_X, this.group.position.x));
      this.group.position.z = Math.max(-BOUND_Z, Math.min(BOUND_Z, this.group.position.z));
      if (this.anim && this.anim.has("Run")) this.anim.play("Run");
    } else if (this.anim && this.anim.has("Idle")) {
      this.anim.play("Idle");
    }

    let target = null;
    let bestDist = RANGE;
    const myPos = this.group.position;
    for (const e of enemies) {
      if (e.dead) continue;
      const dx = e.group.position.x - myPos.x;
      const dz = e.group.position.z - myPos.z;
      const d = Math.hypot(dx, dz);
      if (d < bestDist) { bestDist = d; target = e; }
    }

    if (target) {
      const dx = target.group.position.x - myPos.x;
      const dz = target.group.position.z - myPos.z;
      this.group.rotation.y = Math.atan2(dx, dz);
      if (this.cooldown <= 0) {
        this.cooldown = FIRE_RATE_MS;
        this._fire(target);
      }
    } else if (this.moveDir.lengthSq() > 0.01) {
      this.group.rotation.y = Math.atan2(this.moveDir.x, this.moveDir.y);
    }

    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.life -= dt;
      p.mesh.position.x += p.dir.x * PROJ_SPEED * dt;
      p.mesh.position.z += p.dir.z * PROJ_SPEED * dt;
      let hit = false;
      for (const e of enemies) {
        if (e.dead) continue;
        const dx = e.group.position.x - p.mesh.position.x;
        const dz = e.group.position.z - p.mesh.position.z;
        if (dx * dx + dz * dz < 0.36) {
          e.takeDamage(DAMAGE);
          hit = true;
          break;
        }
      }
      if (hit || p.life <= 0) {
        this.scene.remove(p.mesh);
        p.mesh.geometry.dispose();
        p.mesh.material.dispose();
        this.projectiles.splice(i, 1);
      }
    }
  }

  _fire(target) {
    const start = new THREE.Vector3().copy(this.group.position);
    start.y = 0.9;
    const tx = target.group.position.x - start.x;
    const tz = target.group.position.z - start.z;
    const len = Math.hypot(tx, tz) || 1;

    const proj = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xfff4d6 }),
    );
    proj.position.copy(start);
    this.scene.add(proj);

    this.projectiles.push({
      mesh: proj,
      dir: new THREE.Vector3(tx / len, 0, tz / len),
      life: 1.2,
    });

    Particles.emit(
      { x: start.x + (tx / len) * 0.4, y: start.y, z: start.z + (tz / len) * 0.4 },
      0xfff4d6,
      2,
      { speed: 1.2, life: 0.18, scale: 0.18, yLift: 0.2 },
    );
    Audio.sfxHeroShoot();
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
    for (const p of this.projectiles) {
      this.scene.remove(p.mesh);
      p.mesh.geometry.dispose();
      p.mesh.material.dispose();
    }
    this.projectiles = [];
  }
}
