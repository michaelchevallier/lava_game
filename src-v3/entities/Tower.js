import * as THREE from "three";
import { Audio } from "../systems/Audio.js";
import { AssetLoader } from "../systems/AssetLoader.js";
import { applyToonToScene } from "../systems/ToonMaterial.js";
import { Particles } from "../systems/Particles.js";

export const TOWER_TYPES = {
  archer: {
    range: 8, fireRateMs: 700, damage: 1, projColor: 0xffd23f, projSpeed: 22,
    asset: "tower_archer", scale: 0.8, label: "Archer", aoe: 0, pierce: 0,
    fallbackColor: 0x3a6abf,
  },
  mage: {
    range: 7, fireRateMs: 1200, damage: 2, projColor: 0xa050ff, projSpeed: 14,
    asset: "tower_mage", scale: 0.7, label: "Mage", aoe: 1.5, pierce: 0,
    fallbackColor: 0x6a3aa0,
  },
  tank: {
    range: 5, fireRateMs: 220, damage: 0.5, projColor: 0xff8855, projSpeed: 26,
    asset: "tower_tank", scale: 0.85, label: "Tank", aoe: 0, pierce: 0,
    fallbackColor: 0x8a4a22,
  },
  ballista: {
    range: 14, fireRateMs: 1500, damage: 4, projColor: 0xcccccc, projSpeed: 30,
    asset: "tower_ballista", scale: 0.75, label: "Baliste", aoe: 0, pierce: 2,
    fallbackColor: 0x4a4a4a,
  },
};

export class Tower {
  constructor(scene, position, type = "archer") {
    const cfg = TOWER_TYPES[type] || TOWER_TYPES.archer;
    this.scene = scene;
    this.type = type;
    this.cfg = cfg;
    this.range = cfg.range;
    this.fireRateMs = cfg.fireRateMs;
    this.damage = cfg.damage;

    this.group = new THREE.Group();
    this.group.position.copy(position);
    scene.add(this.group);

    const gltf = AssetLoader.get(cfg.asset);
    if (gltf && gltf.scene) {
      const cloned = gltf.scene.clone(true);
      cloned.scale.setScalar(cfg.scale);
      cloned.traverse((o) => {
        if (o.isMesh) {
          o.castShadow = true;
          o.receiveShadow = true;
        }
      });
      applyToonToScene(cloned);
      this.group.add(cloned);
      this.model = cloned;
    } else {
      this._buildFallback(cfg.fallbackColor);
    }

    this.cooldown = 0;
    this.projectiles = [];
  }

  _buildFallback(color = 0x3a6abf) {
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
      new THREE.MeshLambertMaterial({ color }),
    );
    this.head.position.y = 1.45;
    this.head.castShadow = true;
    this.group.add(this.head);
  }

  tick(dt, enemies) {
    this.cooldown -= dt * 1000;

    let target = null;
    let bestDist = this.range;
    const myPos = this.group.position;
    for (const e of enemies) {
      if (e.dead || e._dying) continue;
      const dx = e.group.position.x - myPos.x;
      const dz = e.group.position.z - myPos.z;
      const d = Math.hypot(dx, dz);
      if (d < bestDist) { bestDist = d; target = e; }
    }

    if (target && this.cooldown <= 0) {
      this.cooldown = this.fireRateMs;
      this._fire(target);
    }

    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.life -= dt;
      p.mesh.position.x += p.dir.x * this.cfg.projSpeed * dt;
      p.mesh.position.z += p.dir.z * this.cfg.projSpeed * dt;
      let consumed = false;
      for (const e of enemies) {
        if (e.dead || e._dying) continue;
        if (p._hitSet && p._hitSet.has(e)) continue;
        const dx = e.group.position.x - p.mesh.position.x;
        const dz = e.group.position.z - p.mesh.position.z;
        if (dx * dx + dz * dz < 0.36) {
          this._applyHit(p, e, enemies);
          if (this.cfg.pierce > 0) {
            if (!p._hitSet) p._hitSet = new Set();
            p._hitSet.add(e);
            p._pierceLeft = (p._pierceLeft ?? this.cfg.pierce) - 1;
            if (p._pierceLeft <= 0) consumed = true;
          } else {
            consumed = true;
          }
          break;
        }
      }
      if (consumed || p.life <= 0) {
        this.scene.remove(p.mesh);
        p.mesh.geometry.dispose();
        p.mesh.material.dispose();
        this.projectiles.splice(i, 1);
      }
    }
  }

  _applyHit(projectile, enemy, enemies) {
    if (this.cfg.aoe > 0) {
      const center = projectile.mesh.position;
      const r2 = this.cfg.aoe * this.cfg.aoe;
      for (const e of enemies) {
        if (e.dead || e._dying) continue;
        const dx = e.group.position.x - center.x;
        const dz = e.group.position.z - center.z;
        if (dx * dx + dz * dz <= r2) {
          e.takeDamage(this.damage, projectile.mesh.position);
        }
      }
      Particles.emit(
        { x: center.x, y: 0.5, z: center.z },
        this.cfg.projColor, 12,
        { speed: 4, life: 0.45, scale: 0.4, yLift: 0.8 },
      );
    } else {
      enemy.takeDamage(this.damage, projectile.mesh.position);
    }
  }

  _fire(target) {
    const start = new THREE.Vector3().copy(this.group.position);
    start.y = 1.45;
    const tx = target.group.position.x - start.x;
    const tz = target.group.position.z - start.z;
    const len = Math.hypot(tx, tz) || 1;

    let geom;
    if (this.type === "ballista") {
      geom = new THREE.BoxGeometry(0.06, 0.06, 0.8);
    } else if (this.type === "mage") {
      geom = new THREE.SphereGeometry(0.18, 8, 8);
    } else {
      geom = new THREE.BoxGeometry(0.08, 0.08, 0.5);
    }

    const proj = new THREE.Mesh(
      geom,
      new THREE.MeshBasicMaterial({ color: this.cfg.projColor }),
    );
    proj.position.copy(start);
    proj.rotation.y = Math.atan2(tx, tz);
    this.scene.add(proj);

    this.projectiles.push({
      mesh: proj,
      dir: new THREE.Vector3(tx / len, 0, tz / len),
      life: this.range / this.cfg.projSpeed * 1.4,
      _pierceLeft: this.cfg.pierce,
    });
    Audio.sfxTowerShoot();
  }

  destroy() {
    this.scene.remove(this.group);
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
