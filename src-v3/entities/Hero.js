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
const DEFAULT_BOUND = 59.5;
const MODEL_SCALE = 0.6;
const XP_CURVE = [20, 45, 75, 100, 130];
const MAX_LEVEL = 1 + XP_CURVE.length;

export class Hero {
  constructor(scene, position, options = {}) {
    this.scene = scene;
    this.skinAsset = options.skinAsset || "knight";

    this.group = new THREE.Group();
    this.group.position.copy(position);
    scene.add(this.group);

    const gltf = AssetLoader.get(this.skinAsset) || AssetLoader.get("knight");
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
      const idleName = this.anim.has("Idle") ? "Idle" : (this.anim.has("Walk") ? "Walk" : null);
      if (idleName) this.anim.play(idleName);
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
    this.running = false;
    this.maxX = options.maxX ?? DEFAULT_BOUND;
    this.maxZ = options.maxZ ?? DEFAULT_BOUND;

    this.level = 1;
    this.xp = 0;
    this.xpToNext = XP_CURVE[0];
    this.maxLevel = MAX_LEVEL;
    this.perks = [];

    this.fireRateMul = 1;
    this.rangeMul = 1;
    this.damageMul = 1;
    this.moveSpeedMul = 1;
    this.coinGainMul = 1;
    this.critChance = 0;
    this.critMul = 2;
    this.critStaggerMs = 0;
    this.multiShot = 0;
    this.pierceCount = 0;
    this.lifesteal = 0;
    this.waveRegen = 0;
    this.moveAttackPierceBonus = 0;
    this.xpMul = 1;
    this.fireball = false;
    this.fireballRadius = 2;
    this.fireballDmgMul = 0.7;
    this.ricochet = false;
    this.ricochetBounces = 3;
    this.ricochetDecay = 0.8;
    this.lightning = false;
    this.lightningTargets = 1;
    this.lightningDmgMul = 0.6;
    this.pierceExplode = false;
    this.pierceExplodeRadius = 1.5;
    this.pierceExplodeDmgMul = 0.5;
    this._attackAnimTimer = 0;
  }

  applyMetaBonuses(bonuses) {
    if (!bonuses) return;
    if (bonuses.heroDamageMul) this.damageMul *= bonuses.heroDamageMul;
    if (bonuses.heroRangeMul) this.rangeMul *= bonuses.heroRangeMul;
    if (bonuses.heroFireRateMul) this.fireRateMul *= 1 / bonuses.heroFireRateMul;
    if (bonuses.coinGainMul) this.coinGainMul *= bonuses.coinGainMul;
    if (bonuses.xpMul) this.xpMul *= bonuses.xpMul;
  }

  applySkinBonuses(bonuses) {
    if (!bonuses) return;
    if (bonuses.damageMul) this.damageMul *= bonuses.damageMul;
    if (bonuses.rangeMul) this.rangeMul *= bonuses.rangeMul;
    if (bonuses.fireRateMul) this.fireRateMul *= 1 / bonuses.fireRateMul;
    if (bonuses.moveSpeedMul) this.moveSpeedMul *= bonuses.moveSpeedMul;
    if (bonuses.coinGainMul) this.coinGainMul *= bonuses.coinGainMul;
    if (bonuses.xpMul) this.xpMul *= bonuses.xpMul;
  }

  gainXp(amount) {
    if (this.level >= this.maxLevel) return;
    this.xp += Math.max(1, Math.round(amount * (this.xpMul || 1)));
    while (this.xp >= this.xpToNext && this.level < this.maxLevel) {
      this.xp -= this.xpToNext;
      this.level++;
      const next = XP_CURVE[this.level - 1];
      this.xpToNext = next != null ? next : Infinity;
      document.dispatchEvent(new CustomEvent("crowdef:hero-levelup", {
        detail: { level: this.level, xp: this.xp, xpToNext: this.xpToNext },
      }));
    }
  }

  applyPerk(perk) {
    this.perks.push(perk.id);
    if (perk.range != null) this.rangeMul *= 1 + perk.range;
    if (perk.fireRate != null) this.fireRateMul *= 1 - perk.fireRate;
    if (perk.damage != null) this.damageMul *= 1 + perk.damage;
    if (perk.moveSpeed != null) this.moveSpeedMul *= 1 + perk.moveSpeed;
    if (perk.moveAttackPierceBonus != null) this.moveAttackPierceBonus += perk.moveAttackPierceBonus;
    if (perk.coinGain != null) this.coinGainMul *= 1 + perk.coinGain;
    if (perk.critChance != null) this.critChance += perk.critChance;
    if (perk.critMul != null) this.critMul = perk.critMul;
    if (perk.critStaggerMs != null) this.critStaggerMs = perk.critStaggerMs;
    if (perk.multiShot) this.multiShot += perk.multiShot;
    if (perk.pierceCount) this.pierceCount += perk.pierceCount;
    if (perk.lifesteal) this.lifesteal += perk.lifesteal;
    if (perk.waveRegen) this.waveRegen += perk.waveRegen;
    if (perk.fireball) {
      this.fireball = true;
      if (perk.fireballRadius != null) this.fireballRadius = perk.fireballRadius;
      if (perk.fireballDmgMul != null) this.fireballDmgMul = perk.fireballDmgMul;
    }
    if (perk.ricochet) {
      this.ricochet = true;
      if (perk.ricochetBounces != null) this.ricochetBounces = perk.ricochetBounces;
      if (perk.ricochetDecay != null) this.ricochetDecay = perk.ricochetDecay;
    }
    if (perk.lightning) {
      this.lightning = true;
      if (perk.lightningTargets != null) this.lightningTargets = perk.lightningTargets;
      if (perk.lightningDmgMul != null) this.lightningDmgMul = perk.lightningDmgMul;
    }
    if (perk.pierceExplode) {
      this.pierceExplode = true;
      if (perk.pierceExplodeRadius != null) this.pierceExplodeRadius = perk.pierceExplodeRadius;
      if (perk.pierceExplodeDmgMul != null) this.pierceExplodeDmgMul = perk.pierceExplodeDmgMul;
    }
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

    if (this._attackAnimTimer > 0) {
      this._attackAnimTimer -= dt;
      if (this._attackAnimTimer <= 0 && this.anim) {
        const resumeName = this.moveDir.lengthSq() > 0.01
          ? (this.anim.has("Run") ? "Run" : (this.anim.has("Walk") ? "Walk" : null))
          : (this.anim.has("Idle") ? "Idle" : (this.anim.has("Walk") ? "Walk" : null));
        if (resumeName) this.anim.play(resumeName);
      }
    }

    const moveSpeed = MOVE_SPEED * this.moveSpeedMul * (this.running ? 1.8 : 1);
    if (this.moveDir.lengthSq() > 0.01) {
      this.group.position.x += this.moveDir.x * moveSpeed * dt;
      this.group.position.z += this.moveDir.y * moveSpeed * dt;
      this.group.position.x = Math.max(-this.maxX, Math.min(this.maxX, this.group.position.x));
      this.group.position.z = Math.max(-this.maxZ, Math.min(this.maxZ, this.group.position.z));
      if (this.anim && this._attackAnimTimer <= 0) {
        const runName = this.anim.has("Run") ? "Run" : (this.anim.has("Walk") ? "Walk" : null);
        if (runName) this.anim.play(runName);
      }
    } else if (this.anim && this._attackAnimTimer <= 0) {
      const idleName = this.anim.has("Idle") ? "Idle" : (this.anim.has("Walk") ? "Walk" : null);
      if (idleName) this.anim.play(idleName);
    }

    const range = RANGE * this.rangeMul;
    let target = null;
    let bestDist = range;
    const myPos = this.group.position;
    for (const e of enemies) {
      if (e.dead || e._dying) continue;
      const dx = e.group.position.x - myPos.x;
      const dz = e.group.position.z - myPos.z;
      const d = Math.hypot(dx, dz);
      if (d < bestDist) { bestDist = d; target = e; }
    }

    const canFire = !this.running && !this.channelingPill;
    if (target && canFire) {
      const dx = target.group.position.x - myPos.x;
      const dz = target.group.position.z - myPos.z;
      this.group.rotation.y = Math.atan2(dx, dz);
      if (this.cooldown <= 0) {
        this.cooldown = FIRE_RATE_MS * this.fireRateMul;
        this._fire(target);
        if (this.lightning) this._lightningStrike(enemies, target);
      }
    } else if (this.moveDir.lengthSq() > 0.01) {
      this.group.rotation.y = Math.atan2(this.moveDir.x, this.moveDir.y);
    }

    const projColor = this.fireball ? 0xff7530 : (this.ricochet ? 0x66ddff : (this.pierceExplode ? 0xff44aa : 0xfff4d6));
    this._trailFrame = ((this._trailFrame || 0) + 1) % 2;
    const emitTrail = this._trailFrame === 0;
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.life -= dt;
      p.mesh.position.x += p.dir.x * PROJ_SPEED * dt;
      p.mesh.position.z += p.dir.z * PROJ_SPEED * dt;
      if (emitTrail) {
        Particles.emit(
          { x: p.mesh.position.x, y: p.mesh.position.y, z: p.mesh.position.z },
          projColor, 1,
          { speed: 0, life: 0.2, scale: 0.15, yLift: 0 },
        );
      }
      let consumed = false;
      let hitTarget = null;
      for (const e of enemies) {
        if (e.dead || e._dying) continue;
        if (p._hitSet.has(e)) continue;
        const dx = e.group.position.x - p.mesh.position.x;
        const dz = e.group.position.z - p.mesh.position.z;
        if (dx * dx + dz * dz < 0.36) {
          hitTarget = e;
          break;
        }
      }
      if (hitTarget) {
        const isCrit = Math.random() < this.critChance;
        const critMul = isCrit ? this.critMul : 1;
        const baseDmg = DAMAGE * this.damageMul * critMul * (p._ricochetDmgMul != null ? p._ricochetDmgMul : 1);
        if (isCrit && this.critStaggerMs > 0) {
          const now = (typeof performance !== "undefined" ? performance.now() : Date.now());
          hitTarget._frozenUntil = Math.max(hitTarget._frozenUntil || 0, now + this.critStaggerMs);
        }
        if (p._aoeOnHit) {
          this._aoeBlast(p.mesh.position, this.fireballRadius, baseDmg * this.fireballDmgMul, enemies);
          consumed = true;
        } else {
          hitTarget.takeDamage(baseDmg, p.mesh.position);
          p._hitSet.add(hitTarget);
          if (p._ricochetLeft > 0) {
            const next = this._findRicochetTarget(hitTarget, enemies, p._hitSet, 4.0);
            if (next) {
              p._ricochetLeft -= 1;
              p._ricochetDmgMul = (p._ricochetDmgMul != null ? p._ricochetDmgMul : 1) * this.ricochetDecay;
              const ndx = next.group.position.x - hitTarget.group.position.x;
              const ndz = next.group.position.z - hitTarget.group.position.z;
              const nlen = Math.hypot(ndx, ndz) || 1;
              p.dir.set(ndx / nlen, 0, ndz / nlen);
              p.life = Math.max(p.life, 0.7);
              p.mesh.position.copy(hitTarget.group.position);
              p.mesh.position.y = 0.9;
              p.mesh.material.color.setHex(0x66ddff);
            } else {
              consumed = true;
            }
          } else if (p._pierceLeft > 0) {
            p._pierceLeft -= 1;
            if (p._pierceLeft <= 0) consumed = true;
          } else {
            consumed = true;
          }
        }
      }
      if (consumed && p._explodeOnConsume) {
        this._aoeBlast(p.mesh.position, this.pierceExplodeRadius, DAMAGE * this.damageMul * this.pierceExplodeDmgMul, enemies);
      }
      if (consumed || p.life <= 0) {
        this.scene.remove(p.mesh);
        p.mesh.geometry.dispose();
        p.mesh.material.dispose();
        this.projectiles.splice(i, 1);
      }
    }
  }

  _aoeBlast(center, radius, dmg, enemies) {
    const r2 = radius * radius;
    for (const e of enemies) {
      if (e.dead || e._dying) continue;
      const dx = e.group.position.x - center.x;
      const dz = e.group.position.z - center.z;
      if (dx * dx + dz * dz < r2) {
        e.takeDamage(dmg, center);
      }
    }
    Particles.emit(
      { x: center.x, y: center.y + 0.2, z: center.z },
      0xff8a30, 18,
      { speed: 5, life: 0.45, scale: 0.5, yLift: 0.6 },
    );
  }

  _findRicochetTarget(from, enemies, hitSet, range) {
    let best = null;
    let bestDist = range * range;
    for (const e of enemies) {
      if (e.dead || e._dying) continue;
      if (hitSet.has(e)) continue;
      const dx = e.group.position.x - from.group.position.x;
      const dz = e.group.position.z - from.group.position.z;
      const d2 = dx * dx + dz * dz;
      if (d2 < bestDist) { bestDist = d2; best = e; }
    }
    return best;
  }

  _lightningStrike(enemies, primary) {
    const range = RANGE * this.rangeMul;
    const myPos = this.group.position;
    const candidates = [];
    for (const e of enemies) {
      if (e.dead || e._dying || e === primary) continue;
      const dx = e.group.position.x - myPos.x;
      const dz = e.group.position.z - myPos.z;
      if (dx * dx + dz * dz < range * range) candidates.push(e);
    }
    if (!candidates.length) return;
    const dmg = DAMAGE * this.damageMul * this.lightningDmgMul;
    const count = Math.min(this.lightningTargets, candidates.length);
    const shuffled = [...candidates];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    for (let i = 0; i < count; i++) {
      const target = shuffled[i];
      target.takeDamage(dmg, target.group.position);
      Particles.emit(
        { x: target.group.position.x, y: target.group.position.y + 1.2, z: target.group.position.z },
        0xa8e0ff, 12,
        { speed: 6, life: 0.3, scale: 0.32, yLift: -1.0 },
      );
    }
  }

  _fire(target) {
    if (this.anim?.has?.("Attack")) {
      this.anim.play("Attack");
      this._attackAnimTimer = 0.25;
    }
    const start = new THREE.Vector3().copy(this.group.position);
    start.y = 0.9;
    const baseTx = target.group.position.x - start.x;
    const baseTz = target.group.position.z - start.z;
    const baseLen = Math.hypot(baseTx, baseTz) || 1;
    const baseDirX = baseTx / baseLen;
    const baseDirZ = baseTz / baseLen;

    const shots = 1 + this.multiShot;
    const spreadDeg = shots > 1 ? 12 : 0;
    const projColor = this.fireball ? 0xff7530 : (this.ricochet ? 0x66ddff : (this.pierceExplode ? 0xff44aa : 0xfff4d6));
    for (let s = 0; s < shots; s++) {
      const angle = shots > 1 ? (s - (shots - 1) / 2) * (spreadDeg * Math.PI / 180) : 0;
      const cos = Math.cos(angle), sin = Math.sin(angle);
      const dx = baseDirX * cos - baseDirZ * sin;
      const dz = baseDirX * sin + baseDirZ * cos;

      const proj = new THREE.Mesh(
        new THREE.SphereGeometry(0.22, 8, 8),
        new THREE.MeshBasicMaterial({ color: projColor }),
      );
      proj.position.copy(start);
      this.scene.add(proj);

      const movePierceBonus = (this.moveAttackPierceBonus > 0 && this.moveDir.lengthSq() > 0.01) ? this.moveAttackPierceBonus : 0;
      this.projectiles.push({
        mesh: proj,
        dir: new THREE.Vector3(dx, 0, dz),
        life: 1.4,
        _pierceLeft: this.pierceCount + movePierceBonus,
        _ricochetLeft: this.ricochet ? this.ricochetBounces : 0,
        _ricochetDmgMul: 1,
        _aoeOnHit: this.fireball,
        _explodeOnConsume: this.pierceExplode,
        _hitSet: new Set(),
      });
    }

    const muzzlePos = { x: start.x + baseDirX * 0.4, y: start.y, z: start.z + baseDirZ * 0.4 };
    Particles.emit(
      muzzlePos,
      0xfff4d6,
      6,
      { speed: 3.5, life: 0.18, scale: 0.18, yLift: 0.2 },
    );

    // Reuse the persistent muzzle PointLight (see main.js __crowdef_muzzleLight).
    // Creating/disposing a PointLight per shot changes the scene light count
    // and forces a shader recompile (~500ms freeze on first shot of each level).
    const flash = (typeof window !== "undefined") ? window.__crowdef_muzzleLight : null;
    if (flash) {
      flash.position.set(muzzlePos.x, muzzlePos.y, muzzlePos.z);
      flash.color.setHex(0xfff4d6);
      flash.intensity = 5;
      flash.distance = 3.5;
      clearTimeout(this._flashTO);
      this._flashTO = setTimeout(() => {
        flash.intensity = 0;
        flash.position.set(0, -500, 0);
      }, 60);
    }

    if (this.model) {
      const ox = this.model.position.x;
      const oz = this.model.position.z;
      this.model.position.x = ox - baseDirX * 0.08;
      this.model.position.z = oz - baseDirZ * 0.08;
      const m = this.model;
      setTimeout(() => {
        if (m && m.parent) {
          m.position.x = ox;
          m.position.z = oz;
        }
      }, 90);
    }

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
