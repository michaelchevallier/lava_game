import * as THREE from "three";
import { Audio } from "../systems/Audio.js";

const FIRE_RATE_MS = 700;
const RANGE = 8;
const DAMAGE = 1;
const PROJ_SPEED = 18;

export class Tower {
  constructor(scene, position) {
    this.scene = scene;

    this.group = new THREE.Group();
    const base = new THREE.Mesh(
      new THREE.BoxGeometry(0.9, 0.4, 0.9),
      new THREE.MeshLambertMaterial({ color: 0x8a6a4a }),
    );
    base.position.y = 0.2;
    base.castShadow = true;
    this.group.add(base);

    const post = new THREE.Mesh(
      new THREE.CylinderGeometry(0.1, 0.12, 1.0),
      new THREE.MeshLambertMaterial({ color: 0x4a3a22 }),
    );
    post.position.y = 0.9;
    post.castShadow = true;
    this.group.add(post);

    this.head = new THREE.Mesh(
      new THREE.BoxGeometry(0.55, 0.3, 0.7),
      new THREE.MeshLambertMaterial({ color: 0x3a6abf }),
    );
    this.head.position.y = 1.45;
    this.head.castShadow = true;
    this.group.add(this.head);

    this.group.position.copy(position);
    scene.add(this.group);

    this.cooldown = 0;
    this.projectiles = [];
  }

  tick(dt, enemies) {
    this.cooldown -= dt * 1000;

    let target = null;
    let bestDist = RANGE;
    const myPos = this.group.position;
    for (const e of enemies) {
      if (e.dead) continue;
      const dx = e.group.position.x - myPos.x;
      const dz = e.group.position.z - myPos.z;
      const d = Math.hypot(dx, dz);
      if (d < bestDist) {
        bestDist = d;
        target = e;
      }
    }

    if (target) {
      const dx = target.group.position.x - myPos.x;
      const dz = target.group.position.z - myPos.z;
      this.head.rotation.y = Math.atan2(dx, dz);
      if (this.cooldown <= 0) {
        this.cooldown = FIRE_RATE_MS;
        this._fire(target);
      }
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
    start.y = 1.45;
    const tx = target.group.position.x - start.x;
    const tz = target.group.position.z - start.z;
    const len = Math.hypot(tx, tz) || 1;

    const proj = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.08, 0.5),
      new THREE.MeshBasicMaterial({ color: 0xffd23f }),
    );
    proj.position.copy(start);
    proj.rotation.y = Math.atan2(tx, tz);
    this.scene.add(proj);

    this.projectiles.push({
      mesh: proj,
      dir: new THREE.Vector3(tx / len, 0, tz / len),
      life: 1.2,
    });
    Audio.sfxTowerShoot();
  }

  destroy() {
    this.scene.remove(this.group);
    this.group.traverse((c) => {
      if (c.geometry) c.geometry.dispose();
      if (c.material) c.material.dispose();
    });
    for (const p of this.projectiles) {
      this.scene.remove(p.mesh);
      p.mesh.geometry.dispose();
      p.mesh.material.dispose();
    }
    this.projectiles = [];
  }
}
