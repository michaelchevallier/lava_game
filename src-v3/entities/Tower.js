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
    cost: 30, icon: "🏹", unlockWorld: 1,
  },
  tank: {
    range: 5, fireRateMs: 220, damage: 0.5, projColor: 0xff8855, projSpeed: 26,
    asset: "tower_tank", scale: 0.85, label: "Tank", aoe: 0, pierce: 0,
    fallbackColor: 0x8a4a22,
    cost: 50, icon: "🛡️", unlockWorld: 1,
  },
  mage: {
    range: 7, fireRateMs: 1200, damage: 2, projColor: 0xa050ff, projSpeed: 14,
    asset: "tower_mage", scale: 0.7, label: "Mage", aoe: 2.0, pierce: 0,
    fallbackColor: 0x6a3aa0,
    cost: 70, icon: "🔮", unlockWorld: 1,
  },
  ballista: {
    range: 14, fireRateMs: 1500, damage: 4, projColor: 0xcccccc, projSpeed: 30,
    asset: "tower_ballista", scale: 0.75, label: "Baliste", aoe: 0, pierce: 2,
    fallbackColor: 0x4a4a4a,
    cost: 100, icon: "🎯", unlockWorld: 2,
  },
  mine: {
    range: 1.8, fireRateMs: 0, damage: 5, projColor: 0xff3030, projSpeed: 0,
    asset: "tower_mine", scale: 0.6, label: "Mine", aoe: 2.5, pierce: 0,
    fallbackColor: 0xaa2020, behavior: "cluster", clusterCount: 3, cooldownMs: 12000,
    cost: 60, icon: "💣", unlockWorld: 2,
  },
  cannon: {
    range: 9, fireRateMs: 2000, damage: 5, projColor: 0xff7530, projSpeed: 16,
    asset: "tower_cannon", scale: 0.7, label: "Catapulte", aoe: 3.0, pierce: 0,
    fallbackColor: 0x4a3a2a, parabolic: true,
    cost: 100, icon: "🪨", unlockWorld: 3,
    synergies: [{ type: "crossEffect", from: "frost", effect: { slowOnHit: { mul: 0.5, durMs: 2000 } }, range: 4 }],
  },
  fan: {
    range: 5, fireRateMs: 0, damage: 0.5, projColor: 0xa8e0ff, projSpeed: 0,
    asset: "tower_fan", scale: 0.8, label: "Soufflerie", aoe: 0, pierce: 0,
    fallbackColor: 0x88ccee, behavior: "push", pushStrength: 0.07,
    cost: 70, icon: "🌀", unlockWorld: 3,
    synergies: [
      { type: "crossEffect", from: "mine", effect: { pushTowardsMine: true }, range: 5 },
      { type: "applyToEnemy", filter: {}, effect: { push: { strength: 0.07 } }, range: 5 },
    ],
  },
  frost: {
    range: 3, fireRateMs: 0, damage: 0, projColor: 0xc0e8ff, projSpeed: 0,
    asset: "tower_frost", scale: 0.7, label: "Glacier", aoe: 0, pierce: 0,
    fallbackColor: 0x88ccee, behavior: "slow", slowMul: 0.5, slowDurationMs: 4000,
    cost: 60, icon: "❄️", unlockWorld: 3,
    synergies: [{ type: "applyToEnemy", filter: {}, effect: { slow: { mul: 0.5, durMs: 4000 } }, range: 3 }],
  },
  crossbow: {
    range: 16, fireRateMs: 1800, damage: 5, projColor: 0xc0e8ff, projSpeed: 32,
    asset: "tower_crossbow", scale: 0.7, label: "Baliste géante", aoe: 0, pierce: 4,
    fallbackColor: 0x6a4a2a,
    cost: 140, icon: "🏯", unlockWorld: 4,
    synergies: [
      { type: "crossEffect", from: "mage", effect: { propagateAoE: { radius: 1, dmg: 1.5 } }, range: 5 },
      { type: "crossEffect", from: "frost", effect: { appliesSlow: { mul: 0.7, durMs: 1500 } }, range: 4 },
    ],
  },
  portal: {
    range: 5.5, fireRateMs: 0, damage: 0, projColor: 0xb088ff, projSpeed: 0,
    asset: "tower_portal", scale: 0.7, label: "Portail", aoe: 0, pierce: 0,
    fallbackColor: 0x6a3aa0, behavior: "buffAura", buffMul: 1.5,
    cost: 130, icon: "🌌", unlockWorld: 4,
    synergies: [
      { type: "aura", filter: { hasPierceOrAoe: true }, effect: { pierceBonus: 1 }, range: 5.5 },
      { type: "aura", filter: { hasPierceOrAoe: false }, effect: { dmgMul: 1.5 }, range: 5.5 },
    ],
  },
  magnet: {
    range: 6, fireRateMs: 0, damage: 0, projColor: 0xff66aa, projSpeed: 0,
    asset: "tower_magnet", scale: 0.7, label: "Aimant", aoe: 0, pierce: 0,
    fallbackColor: 0xff4488, behavior: "coinPull", coinMul: 1.5,
    cost: 100, icon: "🧲", unlockWorld: 4,
    synergies: [
      { type: "passive", effect: { coinMul: 1.5 }, range: 6 },
      { type: "crossEffect", from: "tank", effect: { pullToTank: true }, range: 4 },
    ],
  },
  skyguard: {
    range: 12, fireRateMs: 600, damage: 4, projColor: 0x88ccff, projSpeed: 28,
    asset: "tower_aaa", scale: 0.7, label: "Garde-Ciel", aoe: 0, pierce: 0,
    fallbackColor: 0x4a6aaa,
    cost: 85, icon: "🚀", unlockWorld: 3,
    flyerOnly: true, flyerDmgMul: 1.5,
    synergies: [{ type: "crossEffect", from: "frost", effect: { freezeOnHit: { durMs: 800 } }, range: 4 }],
  },
};

export const TOWER_ORDER = ["archer", "tank", "mage", "ballista", "mine", "cannon", "fan", "frost", "crossbow", "portal", "magnet", "skyguard"];

export class Tower {
  constructor(scene, position, type = "archer") {
    const cfg = TOWER_TYPES[type] || TOWER_TYPES.archer;
    this.scene = scene;
    this.type = type;
    this.cfg = cfg;

    this.upgradeLevel = 1;
    this.range = cfg.range;
    this.fireRateMs = cfg.fireRateMs;
    this.damage = cfg.damage;
    this.aoe = cfg.aoe;
    this.pierce = cfg.pierce;
    this.multiShot = 0;

    this.group = new THREE.Group();
    this.group.position.copy(position);
    scene.add(this.group);

    this.model = null;
    this._loadModel(cfg.asset, cfg.scale);
    this._rangeRing = null;
    this._buildRangeRing();

    this.cooldown = 0;
    this.projectiles = [];
    this.kills = 0;
    this.totalDamage = 0;
    this._buffMul = 1;
    this._freezeOnHit = 0;
    this._slowOnHit = null;
    this._pushTarget = null;
    this._propagateAoE = null;
    this._pierceBonus = 0;
    this._multiShotBonus = 0;
    this._pullActive = false;
    this._appliesSlow = null;
    this._synergyKeys = {};
  }

  _loadModel(assetKey, scale) {
    const gltf = AssetLoader.get(assetKey) || AssetLoader.get(this.cfg.asset);
    if (gltf && gltf.scene) {
      const cloned = gltf.scene.clone(true);
      cloned.scale.setScalar(scale * 1.5);
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
      this._buildFallback(this.cfg.fallbackColor);
    }
  }

  _disposeModel() {
    if (!this.model) return;
    this.group.remove(this.model);
    this.model.traverse((c) => {
      if (c.geometry) c.geometry.dispose();
      if (c.material) {
        if (Array.isArray(c.material)) c.material.forEach((m) => m.dispose());
        else c.material.dispose();
      }
    });
    this.model = null;
  }

  upgradeTo(level) {
    if (level <= this.upgradeLevel) return;
    this.upgradeLevel = level;
    const base = this.cfg;
    if (level === 2) {
      this.damage = base.damage * 1.5;
      this.range = base.range * 1.2;
      if (this.type === "skyguard") {
        this.pierce = 3;
        this.fireRateMs = 500;
      }
    } else if (level === 3) {
      this.damage = base.damage * 2.5;
      this.range = base.range * 1.4;
      if (this.type === "archer") this.multiShot = 1;
      else if (this.type === "mage") this.aoe = 2.5;
      else if (this.type === "tank") this.pierce = 2;
      else if (this.type === "ballista") this.pierce = 4;
      else if (this.type === "skyguard") { this.aoe = 2.5; this.fireRateMs = 450; this.pierce = 0; }
      else if (this.type === "cannon") this._barrageCount = 2;
      else if (this.type === "crossbow") this._finalExplosion = { aoe: 2, dmg: base.damage * 2.5 };
      else if (this.type === "mine") this._chainExplosion = true;
    }
    let assetKey = base.asset;
    if (level === 2) assetKey = base.asset + "_l2";
    else if (level === 3) assetKey = base.asset + "_l3";
    if (this.type === "mage" && level === 3) assetKey = base.asset + "_l2";

    this._disposeModel();
    const scaleBoost = 1 + (level - 1) * 0.06;
    this._loadModel(assetKey, base.scale * scaleBoost);
    this._buildRangeRing();
    this._drawTierPips(level);
    if (level === 3) this._tintGold();
  }

  _drawTierPips(level) {
    if (this._pipsMesh) {
      this.group.remove(this._pipsMesh);
      this._pipsMesh.geometry.dispose();
      this._pipsMesh.material.map?.dispose();
      this._pipsMesh.material.dispose();
      this._pipsMesh = null;
    }
    if (level <= 1) return;
    const tex = Tower._pipTextureCache[level] || (Tower._pipTextureCache[level] = _makePipTexture(level));
    const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.4), mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = 0.06;
    mesh.renderOrder = 4;
    this.group.add(mesh);
    this._pipsMesh = mesh;
  }

  _tintGold() {
    if (!this.model) return;
    this.model.traverse((c) => {
      if (c.isMesh && c.material && c.material.color) {
        c.material = c.material.clone();
        c.material.color.lerp(new THREE.Color(0xffd23f), 0.4);
        c.material.emissive?.setHex?.(0x553311);
      }
    });
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

  _buildRangeRing() {
    if (this._rangeRing) {
      this.group.remove(this._rangeRing);
      this._rangeRing.geometry.dispose();
      this._rangeRing.material.dispose();
      this._rangeRing = null;
    }
    const r = this.range;
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(r - 0.05, r, 48),
      new THREE.MeshBasicMaterial({ color: 0x66ddff, opacity: 0.12, transparent: true, side: THREE.DoubleSide, depthWrite: false }),
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.03;
    ring.renderOrder = 3;
    this.group.add(ring);
    this._rangeRing = ring;
  }

  tick(dt, enemies, towers = null) {
    const behavior = this.cfg.behavior;
    if (behavior === "push") return this._tickPush(dt, enemies);
    if (behavior === "cluster") return this._tickCluster(dt, enemies);
    if (behavior === "slow") return this._tickSlow(dt, enemies);
    if (behavior === "buffAura") return this._tickBuffAura(dt);
    if (behavior === "coinPull") return;
    this.cooldown -= dt * 1000;
    if (this._recoilTimer > 0) {
      this._recoilTimer -= dt;
      if (this._recoilTimer <= 0) {
        if (this.model) this.model.position.set(0, 0, 0);
      } else {
        const offset = -0.08 * (this._recoilTimer / 0.12);
        if (this.model) this.model.position.set(this._recoilDirX * offset, 0, this._recoilDirZ * offset);
      }
    }

    let target = null;
    let bestDist = this.range;
    const myPos = this.group.position;
    const flyerOnly = !!this.cfg.flyerOnly;
    for (const e of enemies) {
      if (e.dead || e._dying) continue;
      if (flyerOnly && !e.isFlyer) continue;
      const dx = e.group.position.x - myPos.x;
      const dz = e.group.position.z - myPos.z;
      const d = Math.hypot(dx, dz);
      if (d < bestDist) { bestDist = d; target = e; }
    }

    if (target && this.cooldown <= 0) {
      this.cooldown = this.fireRateMs;
      this._fire(target);
      if (this._barrageCount > 1) {
        for (let b = 1; b < this._barrageCount; b++) {
          this._fireAngled(target, b * 10);
        }
      }
    }

    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.life -= dt;
      p.mesh.position.x += p.dir.x * this.cfg.projSpeed * dt;
      p.mesh.position.z += p.dir.z * this.cfg.projSpeed * dt;
      if (p._arc) {
        p._arcT += dt / p._arcDuration;
        const t = Math.min(1, p._arcT);
        p.mesh.position.y = p._arcStartY + (p._arcPeak - p._arcStartY) * 4 * t * (1 - t);
        if (t >= 1) p.life = 0;
      }
      let consumed = false;
      for (const e of enemies) {
        if (e.dead || e._dying) continue;
        if (p._hitSet && p._hitSet.has(e)) continue;
        const dx = e.group.position.x - p.mesh.position.x;
        const dz = e.group.position.z - p.mesh.position.z;
        if (dx * dx + dz * dz < 0.36) {
          this._applyHit(p, e, enemies);
          if (this.pierce > 0) {
            if (!p._hitSet) p._hitSet = new Set();
            p._hitSet.add(e);
            p._pierceLeft = (p._pierceLeft ?? this.pierce) - 1;
            if (p._pierceLeft <= 0) {
              if (this._finalExplosion) {
                this._aoeExplode(p.mesh.position, this._finalExplosion.aoe, this._finalExplosion.dmg, enemies);
              }
              consumed = true;
            }
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
    if (this.aoe > 0) {
      const center = projectile.mesh.position;
      const r2 = this.aoe * this.aoe;
      const aoeHit = [];
      for (const e of enemies) {
        if (e.dead || e._dying) continue;
        const dx = e.group.position.x - center.x;
        const dz = e.group.position.z - center.z;
        if (dx * dx + dz * dz <= r2) {
          this._dealDamage(e, this.damage, projectile.mesh.position);
          aoeHit.push(e);
        }
      }
      if (this._slowOnHit) {
        const now = (typeof performance !== "undefined" ? performance.now() : Date.now());
        for (const e of aoeHit) {
          e._slowMul = Math.min(e._slowMul ?? 1, this._slowOnHit.mul);
          e._slowUntil = Math.max(e._slowUntil ?? 0, now + this._slowOnHit.durMs);
        }
      }
      Particles.emit(
        { x: center.x, y: 0.5, z: center.z },
        this.cfg.projColor, 12,
        { speed: 4, life: 0.45, scale: 0.4, yLift: 0.8 },
      );
    } else {
      this._dealDamage(enemy, this.damage, projectile.mesh.position);
      if (this._propagateAoE) {
        const r2 = this._propagateAoE.radius * this._propagateAoE.radius;
        for (const e2 of enemies) {
          if (e2 === enemy || e2.dead || e2._dying) continue;
          const dx = e2.group.position.x - enemy.group.position.x;
          const dz = e2.group.position.z - enemy.group.position.z;
          if (dx * dx + dz * dz <= r2) {
            this._dealDamage(e2, this._propagateAoE.dmg, enemy.group.position);
          }
        }
        Particles.emit(
          { x: enemy.group.position.x, y: 0.5, z: enemy.group.position.z },
          0xa050ff, 8,
          { speed: 3, life: 0.3, scale: 0.3 },
        );
      }
      if (this._appliesSlow) {
        const now = (typeof performance !== "undefined" ? performance.now() : Date.now());
        enemy._slowMul = Math.min(enemy._slowMul ?? 1, this._appliesSlow.mul);
        enemy._slowUntil = Math.max(enemy._slowUntil ?? 0, now + this._appliesSlow.durMs);
      }
    }
  }

  _dealDamage(enemy, dmg, origin) {
    if (enemy._dying || enemy.dead) return;
    const buffed = dmg * (this._buffMul || 1);
    const finalDmg = (this.cfg.flyerDmgMul && enemy.isFlyer && !enemy.immuneToFlyerBonus) ? buffed * this.cfg.flyerDmgMul : buffed;
    const hpBefore = enemy.hp;
    enemy.takeDamage(finalDmg, origin);
    const dealt = Math.max(0, hpBefore - enemy.hp);
    this.totalDamage += dealt;
    if (enemy._dying && hpBefore > 0) this.kills++;
    if (this._freezeOnHit && enemy.isFlyer) {
      const now = (typeof performance !== "undefined" ? performance.now() : Date.now());
      enemy._frozenUntil = now + this._freezeOnHit;
    }
  }

  _tickPush(dt, enemies) {
    const r2 = this.range * this.range;
    const myPos = this.group.position;
    let any = false;
    this._pushDmgT = (this._pushDmgT || 0) - dt;
    for (const e of enemies) {
      if (e.dead || e._dying) continue;
      const dx = e.group.position.x - myPos.x;
      const dz = e.group.position.z - myPos.z;
      if (dx * dx + dz * dz < r2) {
        any = true;
        if (this.damage > 0 && this._pushDmgT <= 0) {
          this._dealDamage(e, this.damage, myPos);
        }
      }
    }
    if (this._pushDmgT <= 0) this._pushDmgT = 0.5;
    if (this.model && any) {
      this.model.rotation.y += 8 * dt;
      this._pushVfxT = (this._pushVfxT || 0) - dt;
      if (this._pushVfxT <= 0) {
        this._pushVfxT = 0.18;
        Particles.emit(
          { x: myPos.x, y: 1.0, z: myPos.z },
          0xa8e0ff, 3,
          { speed: 5, life: 0.35, scale: 0.25, yLift: 0.2 },
        );
      }
    }
  }

  _tickCluster(dt, enemies) {
    this.cooldown -= dt * 1000;
    if (this.cooldown > 0) {
      // Cooldown — model dim
      if (this.model) this.model.scale.setScalar((this.cfg.scale * 1.5) * 0.85);
      return;
    }
    // Armed — gentle pulse
    if (this.model) {
      const pulse = 1 + Math.sin((this._armT = (this._armT || 0) + dt) * 4) * 0.05;
      this.model.scale.setScalar((this.cfg.scale * 1.5) * pulse);
    }
    const myPos = this.group.position;
    const triggerR2 = 4 * 4;
    let inRange = 0;
    const targets = [];
    for (const e of enemies) {
      if (e.dead || e._dying) continue;
      const dx = e.group.position.x - myPos.x;
      const dz = e.group.position.z - myPos.z;
      if (dx * dx + dz * dz < triggerR2) {
        inRange++;
        targets.push(e);
      }
    }
    if (inRange < (this.cfg.clusterCount || 3)) return;
    const aoe2 = (this.cfg.aoe || 2.5) * (this.cfg.aoe || 2.5);
    const chainTargets = [];
    for (const e of enemies) {
      if (e.dead || e._dying) continue;
      const dx = e.group.position.x - myPos.x;
      const dz = e.group.position.z - myPos.z;
      if (dx * dx + dz * dz <= aoe2) {
        this._dealDamage(e, this.cfg.damage || 8, this.group.position);
        chainTargets.push(e);
      }
    }
    Particles.emit(
      { x: myPos.x, y: 0.6, z: myPos.z },
      0xff7530, 24,
      { speed: 6, life: 0.55, scale: 0.5, yLift: 1.0 },
    );
    Audio.sfxBoom();
    if (this._chainExplosion && chainTargets.length > 0) {
      const chainSnap = chainTargets.slice(0, 2).map((e) => ({ x: e.group.position.x, z: e.group.position.z }));
      const chainDmg = (this.cfg.damage || 8) * (this._buffMul || 1);
      setTimeout(() => {
        for (const pos of chainSnap) {
          this._aoeExplode({ x: pos.x, y: 0.5, z: pos.z }, 1.5, chainDmg, enemies);
        }
      }, 800);
    }
    this.cooldown = this.cfg.cooldownMs || 8000;
  }

  _tickSlow(dt, enemies) {
    const r2 = this.range * this.range;
    const myPos = this.group.position;
    let any = false;
    for (const e of enemies) {
      if (e.dead || e._dying) continue;
      const dx = e.group.position.x - myPos.x;
      const dz = e.group.position.z - myPos.z;
      if (dx * dx + dz * dz < r2) { any = true; break; }
    }
    this._frostVfxT = (this._frostVfxT || 0) - dt;
    if (this._frostVfxT <= 0) {
      this._frostVfxT = any ? 0.25 : 0.6;
      const intensity = any ? 4 : 1;
      Particles.emit(
        { x: myPos.x + (Math.random() - 0.5) * 0.6, y: 0.4, z: myPos.z + (Math.random() - 0.5) * 0.6 },
        0xc0e8ff, intensity,
        { speed: 1.0, life: 0.7, scale: 0.18, yLift: 0.5 },
      );
    }
  }

  _tickBuffAura(_dt) {
  }

  _aoeExplode(center, radius, dmg, enemies) {
    const r2 = radius * radius;
    for (const e of enemies) {
      if (e.dead || e._dying) continue;
      const dx = e.group.position.x - center.x;
      const dz = e.group.position.z - center.z;
      if (dx * dx + dz * dz <= r2) this._dealDamage(e, dmg, center);
    }
    Particles.emit(
      { x: center.x, y: center.y || 0.5, z: center.z },
      0xff7530, 16,
      { speed: 5, life: 0.45, scale: 0.45, yLift: 0.8 },
    );
  }

  _fireAngled(target, angleDeg) {
    const start = new THREE.Vector3().copy(this.group.position);
    start.y = 1.45;
    const baseTx = target.group.position.x - start.x;
    const baseTz = target.group.position.z - start.z;
    const baseLen = Math.hypot(baseTx, baseTz) || 1;
    const angle = angleDeg * Math.PI / 180;
    const cos = Math.cos(angle), sin = Math.sin(angle);
    const dx = (baseTx / baseLen) * cos - (baseTz / baseLen) * sin;
    const dz = (baseTx / baseLen) * sin + (baseTz / baseLen) * cos;

    const proj = new THREE.Mesh(
      new THREE.SphereGeometry(0.22, 10, 10),
      new THREE.MeshBasicMaterial({ color: this.cfg.projColor }),
    );
    proj.position.copy(start);
    this.scene.add(proj);

    const projData = {
      mesh: proj,
      dir: new THREE.Vector3(dx, 0, dz),
      life: this.range / this.cfg.projSpeed * 1.4,
      _pierceLeft: this.pierce + (this._pierceBonus || 0),
    };
    if (this.cfg.parabolic) {
      const dist = Math.hypot(target.group.position.x - start.x, target.group.position.z - start.z);
      projData._arc = true;
      projData._arcT = 0;
      projData._arcStartY = start.y;
      projData._arcPeak = start.y + Math.min(4.5, dist * 0.35);
      projData._arcDuration = dist / this.cfg.projSpeed;
    }
    this.projectiles.push(projData);
  }

  _fire(target) {
    const start = new THREE.Vector3().copy(this.group.position);
    start.y = 1.45;
    const baseTx = target.group.position.x - start.x;
    const baseTz = target.group.position.z - start.z;
    const baseLen = Math.hypot(baseTx, baseTz) || 1;
    const baseDirX = baseTx / baseLen;
    const baseDirZ = baseTz / baseLen;

    const shots = 1 + this.multiShot + (this._multiShotBonus || 0);
    const spreadDeg = shots > 1 ? 12 : 0;
    for (let s = 0; s < shots; s++) {
      const angle = shots > 1 ? (s - (shots - 1) / 2) * (spreadDeg * Math.PI / 180) : 0;
      const cos = Math.cos(angle), sin = Math.sin(angle);
      const dx = baseDirX * cos - baseDirZ * sin;
      const dz = baseDirX * sin + baseDirZ * cos;

      let geom;
      if (this.type === "ballista" || this.type === "crossbow") {
        geom = new THREE.BoxGeometry(0.06, 0.06, 0.8);
      } else if (this.type === "mage") {
        geom = new THREE.SphereGeometry(0.18, 8, 8);
      } else if (this.type === "cannon") {
        geom = new THREE.SphereGeometry(0.22, 10, 10);
      } else {
        geom = new THREE.BoxGeometry(0.08, 0.08, 0.5);
      }

      const proj = new THREE.Mesh(
        geom,
        new THREE.MeshBasicMaterial({ color: this.cfg.projColor }),
      );
      proj.position.copy(start);
      proj.rotation.y = Math.atan2(dx, dz);
      this.scene.add(proj);

      const projData = {
        mesh: proj,
        dir: new THREE.Vector3(dx, 0, dz),
        life: this.range / this.cfg.projSpeed * 1.4,
        _pierceLeft: this.pierce + (this._pierceBonus || 0),
      };
      if (this.cfg.parabolic) {
        const dist = Math.hypot(target.group.position.x - start.x, target.group.position.z - start.z);
        projData._arc = true;
        projData._arcT = 0;
        projData._arcStartY = start.y;
        projData._arcPeak = start.y + Math.min(4.5, dist * 0.35);
        projData._arcDuration = dist / this.cfg.projSpeed;
      }
      this.projectiles.push(projData);
    }
    Audio.sfxTowerShoot();
    this._recoilTimer = 0.12;
    this._recoilDirX = baseDirX;
    this._recoilDirZ = baseDirZ;
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

Tower._pipTextureCache = {};

function _makePipTexture(count) {
  const size = 256;
  const cv = document.createElement("canvas");
  cv.width = size; cv.height = size;
  const ctx = cv.getContext("2d");
  ctx.clearRect(0, 0, size, size);
  const cx = size / 2, cy = size / 2;
  const ringR = size * 0.42;
  ctx.strokeStyle = "rgba(255, 210, 63, 0.35)";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(cx, cy, ringR, 0, Math.PI * 2);
  ctx.stroke();
  for (let i = 0; i < count; i++) {
    const a = -Math.PI / 2 + i * (Math.PI * 2 / count);
    const sx = cx + Math.cos(a) * ringR;
    const sy = cy + Math.sin(a) * ringR;
    _drawStar(ctx, sx, sy, 5, 18, 8, "#ffd23f");
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.needsUpdate = true;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function _drawStar(ctx, cx, cy, points, outer, inner, color) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = -Math.PI / 2 + i * Math.PI / points;
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.shadowColor = "rgba(0,0,0,0.6)";
  ctx.shadowBlur = 8;
  ctx.fill();
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = "#5a3a00";
  ctx.stroke();
  ctx.restore();
}
