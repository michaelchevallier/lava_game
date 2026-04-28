import * as THREE from "three";

const FIRE_RATE_MS = 350;
const RANGE = 12;
const DAMAGE = 1;
const PROJ_SPEED = 22;

export class Hero {
  constructor(scene, position) {
    this.scene = scene;

    this.group = new THREE.Group();
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

    // Cape detail
    const cape = new THREE.Mesh(
      new THREE.PlaneGeometry(0.55, 0.7),
      new THREE.MeshLambertMaterial({ color: 0xc63a10, side: THREE.DoubleSide }),
    );
    cape.position.set(0, 0.55, -0.27);
    this.group.add(cape);

    // Aim turret (pivot for projectile origin)
    this.aim = new THREE.Group();
    this.aim.position.y = 0.7;
    this.group.add(this.aim);

    this.group.position.copy(position);
    scene.add(this.group);

    this.cooldown = 0;
    this.projectiles = [];
  }

  tick(dt, enemies) {
    this.cooldown -= dt * 1000;

    // Find nearest alive enemy in range
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
      this.group.rotation.y = Math.atan2(dx, dz);
      if (this.cooldown <= 0) {
        this.cooldown = FIRE_RATE_MS;
        this._fire(target);
      }
    }

    // Update projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.life -= dt;
      p.mesh.position.x += p.dir.x * PROJ_SPEED * dt;
      p.mesh.position.z += p.dir.z * PROJ_SPEED * dt;

      // Hit detection
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
  }
}
