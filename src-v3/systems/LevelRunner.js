import * as THREE from "three";
import { buildPath } from "./Path.js";
import { Particles } from "./Particles.js";
import { JuiceFX } from "./JuiceFX.js";
import { Audio } from "./Audio.js";
import { Synergies } from "./Synergies.js";
import { Hero } from "../entities/Hero.js";
import { Enemy, ENEMY_TYPES } from "../entities/Enemy.js";
import { Tower, TOWER_TYPES } from "../entities/Tower.js";
import { generateBuildPointGrid, BUILD_POINT_RADIUS, BUILD_DRAIN_PER_SEC } from "../entities/BuildPoint.js";
import { SaveSystem } from "./SaveSystem.js";
import { computeActiveBonuses } from "../data/metaUpgrades.js";
import { computeSkinBonuses, SKIN_BY_ID, getDefaultSkinId } from "../data/skins.js";

function emit(name, detail) {
  document.dispatchEvent(new CustomEvent(name, { detail }));
}

export class LevelRunner {
  constructor(scene, level, deps = {}) {
    this.scene = scene;
    this.level = level;
    this.deps = deps;
    this.metaBonuses = computeActiveBonuses(SaveSystem);
    this.skinBonuses = computeSkinBonuses(SaveSystem);

    const coinsBonus = this.metaBonuses.startCoinsBonus || 0;

    this.state = "play";
    this.castles = [];
    this.castleLossMode = level.castleLossMode || "all";
    this.coins = level.startCoins + coinsBonus;
    this.wave = 1;
    this.gameTime = 0;
    this.gameSpeed = 1.3;
    this.paused = false;

    this.path = null;
    this.paths = [];
    this.pathLength = 0;
    this.hero = null;
    this.enemies = [];
    this.towers = [];
    this.buildPoints = [];
    this.selectedTowerType = null;
    this._activeBuildPoint = null;
    this._heroOnBuildPoint = null;

    this._waveActive = true;
    this._spawnTimer = 0;
    this._waveBreakTimer = 0;
    this._initWave(0);
  }

  get castleHP() {
    return this.castles.reduce((s, c) => s + (c.isDead ? 0 : c.hp), 0);
  }

  get castleHPMax() {
    return this.castles.reduce((s, c) => s + c.hpMax, 0);
  }

  _initWave(idx) {
    const w = this.level.waves.list[idx];
    if (!w) {
      this._pendingSpawns = [];
      this._spawnRate = 600;
      return;
    }
    const SWARM_MUL = 1.4;
    const list = [];
    for (const [type, count] of Object.entries(w.types)) {
      const isUnique = type.includes("boss") || type === "midboss";
      const finalCount = isUnique ? count : Math.round(count * SWARM_MUL);
      for (let i = 0; i < finalCount; i++) list.push(type);
    }
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
    this._pendingSpawns = list;
    this._spawnRate = Math.round((w.spawnRateMs || 600) * 0.75);
    this._currentBreakMs = w.breakMs ?? 4000;
  }

  _hasMoreWaves() {
    return this.wave < this.level.waves.list.length;
  }

  loadCastles() {
    const castleMul = (this.metaBonuses.castleHPMul || 1) * (this.skinBonuses.castleHPMul || 1);
    this.castles = [];

    if (Array.isArray(this.level.castles) && this.level.castles.length > 0) {
      const entries = this.level.castles.slice(0, 3);
      for (let i = 0; i < entries.length; i++) {
        const def = entries[i];
        const hp = Math.round((def.hp || this.level.castleHP || 100) * castleMul);
        const pathIdx = def.pathIdx ?? 0;
        const pathForCastle = this.paths[Math.min(pathIdx, this.paths.length - 1)] || this.path;
        const pos = Array.isArray(def.pos)
          ? { x: def.pos[0], y: def.pos[1] ?? 0, z: def.pos[2] }
          : pathForCastle.getPointAt(1);
        this.castles.push({ index: i, hp, hpMax: hp, pathIdx, pos, isDead: false, _visual: null });
      }
    } else {
      const count = Math.min(3, this.paths.length);
      const baseHP = this.level.castleHP || 100;
      const perCastle = count > 1 ? Math.round(baseHP / count) : baseHP;
      for (let i = 0; i < count; i++) {
        const hp = Math.round(perCastle * castleMul);
        const endPt = this.paths[i].getPointAt(1);
        this.castles.push({ index: i, hp, hpMax: hp, pathIdx: i, pos: endPt, isDead: false, _visual: null });
      }
    }
  }

  setup() {
    const rawPaths = Array.isArray(this.level.paths) && this.level.paths.length > 0
      ? this.level.paths
      : [this.level.pathPoints];
    this.paths = rawPaths.map((pts) => buildPath(pts));
    this.path = this.paths[0];
    this.pathLength = this.path.getLength();
    this.loadCastles();

    if (!this._summonHandler) {
      this._summonHandler = (ev) => {
        const type = ev.detail.type || "basic";
        const e = new Enemy(this.scene, this.path, type, 0);
        e.t = Math.max(0, Math.min(0.95, ev.detail.t || 0.5));
        this.enemies.push(e);
      };
      document.addEventListener("crowdef:boss-summon", this._summonHandler);
    }
    if (!this._aoeHandler) {
      this._aoeHandler = (ev) => {
        const { x, z, radius, damage } = ev.detail;
        if (!this.hero) return;
        const hx = this.hero.group.position.x;
        const hz = this.hero.group.position.z;
        const distSq = (hx - x) * (hx - x) + (hz - z) * (hz - z);
        if (distSq < radius * radius) {
          this.onCastleHit(damage);
        }
        JuiceFX.shake(0.5, 400);
      };
      document.addEventListener("crowdef:boss-aoe", this._aoeHandler);
    }

    const heroPos = new THREE.Vector3(...(this.level.heroSpawn || [-2, 0, -1]));
    const heroSkinId = SaveSystem.getEquippedSkin("hero") || getDefaultSkinId("hero");
    const heroSkin = SKIN_BY_ID[heroSkinId];
    const mapHalf = this.level.mapHalf ?? 60;
    this.hero = new Hero(this.scene, heroPos, {
      skinAsset: heroSkin?.asset || "knight",
      maxX: mapHalf - 0.5,
      maxZ: mapHalf - 0.5,
    });
    this.hero.applyMetaBonuses(this.metaBonuses);
    if (heroSkin?.bonus) this.hero.applySkinBonuses(heroSkin.bonus);

    this.buildPoints = generateBuildPointGrid(this.scene, this.paths);

    emit("crowdef:wave-start", { wave: 1 });
  }

  findClosestBuildPoint(pos, radius = BUILD_POINT_RADIUS) {
    let best = null;
    let bestDist = radius * radius;
    for (const bp of this.buildPoints) {
      const dx = pos.x - bp.pos.x;
      const dz = pos.z - bp.pos.z;
      const d2 = dx * dx + dz * dz;
      if (d2 < bestDist) { bestDist = d2; best = bp; }
    }
    return best;
  }

  _findUnlockedTowerCfg(type) {
    const cfg = TOWER_TYPES[type];
    if (!cfg) return null;
    return cfg;
  }

  _tryBuild(bp, dt) {
    const type = this.selectedTowerType || bp.buildingType;
    if (!type) return;
    const cfg = this._findUnlockedTowerCfg(type);
    if (!cfg) return;
    const baseCost = (cfg.cost) || this._defaultTowerCost(type);
    if (this.selectedTowerType && bp.buildingType && bp.buildingType !== this.selectedTowerType && bp.paidThisLevel > 0) {
      this.coins += bp.paidThisLevel;
      bp.totalInvested = Math.max(0, bp.totalInvested - bp.paidThisLevel);
      bp.paidThisLevel = 0;
      bp.updateBuildFill(0);
    }
    bp.buildingType = type;
    if (this.coins <= 0) return;
    const drain = Math.min(this.coins, BUILD_DRAIN_PER_SEC * dt);
    this.coins -= drain;
    bp.paidThisLevel += drain;
    bp.totalInvested += drain;
    bp.updateBuildFill(bp.paidThisLevel / baseCost);
    if (bp.paidThisLevel >= baseCost) {
      const tower = new Tower(this.scene, bp.pos.clone(), type);
      this.towers.push(tower);
      bp.attachTower(tower);
      this.selectedTowerType = null;
      emit("crowdef:tower-built", { type, pos: { x: bp.pos.x, z: bp.pos.z } });
    }
  }

  _defaultTowerCost(type) {
    const COSTS = { archer: 30, tank: 50, mage: 70, ballista: 100, cannon: 100, crossbow: 110, fan: 90, mine: 60, magnet: 100, portal: 150, frost: 80, aaa: 85 };
    return COSTS[type] || 50;
  }

  _tickBuildPoints(dt, hero) {
    if (!hero) return;
    const closest = this.findClosestBuildPoint(hero.group.position, 4.5);
    let activeNear = null;
    let onBp = null;
    const hasBuildIntent = !!this.selectedTowerType;
    const cfg = hasBuildIntent ? this._findUnlockedTowerCfg(this.selectedTowerType) : null;
    const cost = cfg ? (cfg.cost || this._defaultTowerCost(this.selectedTowerType)) : 0;
    const canAfford = this.coins >= cost;
    const VIS_RADIUS_SQ = 30 * 30;
    const heroPos = hero.group.position;
    for (const bp of this.buildPoints) {
      if (bp === closest) continue;
      if (bp.occupied) { bp.setHaloState("occupied"); continue; }
      const dx = heroPos.x - bp.pos.x;
      const dz = heroPos.z - bp.pos.z;
      const d2 = dx * dx + dz * dz;
      if (d2 > VIS_RADIUS_SQ) bp.setHaloState("hidden");
      else bp.setHaloState("idle");
    }
    if (closest) {
      const dx = heroPos.x - closest.pos.x;
      const dz = heroPos.z - closest.pos.z;
      const d2 = dx * dx + dz * dz;
      const onPoint = d2 < BUILD_POINT_RADIUS * BUILD_POINT_RADIUS;
      if (onPoint) onBp = closest;
      if (closest.occupied) {
        closest.setHaloState(onPoint ? "occupied" : "near");
      } else if (hasBuildIntent && onPoint) {
        closest.setHaloState(canAfford ? "active" : "active-poor");
        activeNear = closest;
        this._tryBuild(closest, dt);
      } else if (hasBuildIntent) {
        closest.setHaloState(canAfford ? "near" : "near-poor");
      } else if (d2 > VIS_RADIUS_SQ) {
        closest.setHaloState("hidden");
      } else {
        closest.setHaloState("idle");
      }
    }
    this._activeBuildPoint = activeNear;
    this._heroOnBuildPoint = onBp;
  }

  setSpeed(n) { this.gameSpeed = Math.max(0.1, Math.min(8, n)); }
  pause() { this.paused = true; }
  resume() { this.paused = false; }
  setMove(dx, dz) { if (this.hero) this.hero.setMove(dx, dz); }

  tick(dt) {
    if (this.paused) return;
    if (this.state === "lost" || this.state === "won") return;

    const adt = dt * this.gameSpeed;
    this.gameTime += adt;
    const dtMs = adt * 1000;

    if (this._waveActive) {
      this._spawnTimer += dtMs;
      if (this._spawnTimer >= this._spawnRate && this._pendingSpawns.length > 0) {
        this._spawnTimer = 0;
        const type = this._pendingSpawns.shift();
        this._spawnEnemy(type);
      }
      if (this._pendingSpawns.length === 0 && this.enemies.length === 0) {
        this._waveActive = false;
        this._waveBreakTimer = 0;
        if (this.hero && this.hero.waveRegen > 0) {
          for (const c of this.castles) {
            if (!c.isDead) c.hp = Math.min(c.hpMax, c.hp + this.hero.waveRegen);
          }
        }
        emit("crowdef:wave-cleared", { wave: this.wave });
      }
    } else {
      this._waveBreakTimer += dtMs;
      const breakMs = this._currentBreakMs ?? 4000;
      if (this._waveBreakTimer > breakMs) {
        if (!this._hasMoreWaves()) {
          this._winLevel();
          return;
        }
        this.wave++;
        this._initWave(this.wave - 1);
        this._spawnTimer = 0;
        this._waveActive = true;
        Audio.sfxWaveStart();
        emit("crowdef:wave-start", { wave: this.wave });
      }
    }

    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      e.tick(adt);
      if (e.reachedEnd) {
        this.onCastleHit(e.damage || 5, e.pathIdx);
        e.destroy();
        this.enemies.splice(i, 1);
        continue;
      }
      if (e.dead) {
        const baseReward = (e.reward || 2) * 0.55;
        const magnetMul = Synergies.getCoinMulAt(e.group.position);
        const reward = Math.max(1, Math.round(baseReward * (this.hero ? this.hero.coinGainMul : 1) * magnetMul));
        this.coins += reward;
        if (this.hero) {
          this.hero.gainXp(1);
          if (this.hero.lifesteal > 0) {
            for (const c of this.castles) {
              if (!c.isDead) { c.hp = Math.min(c.hpMax, c.hp + this.hero.lifesteal); break; }
            }
          }
        }
        const cfg = ENEMY_TYPES[e.type];
        if (cfg) {
          let gems = 0;
          if (cfg.isBoss) gems = 20;
          else if (cfg.isMidBoss) gems = 5;
          if (gems > 0) {
            const skinMul = this.skinBonuses.gemBonusMul || 1;
            const mul = (this.metaBonuses.gemGainMul || 1) * skinMul;
            const finalGems = Math.round(gems * mul);
            const total = SaveSystem.addGems(finalGems);
            emit("crowdef:gems-gained", { amount: finalGems, total, source: e.type });
          }
          if (cfg.isBoss) {
            const dropSkin = Object.values(SKIN_BY_ID).find(
              (s) => s.unlock?.type === "drop" && s.unlock.boss === e.type,
            );
            if (dropSkin && !SaveSystem.isSkinOwned(dropSkin.id)) {
              SaveSystem.ownSkin(dropSkin.id);
              emit("crowdef:skin-dropped", { id: dropSkin.id, source: e.type });
            }
          }
        }
        SaveSystem.addKills(1);
        if (SaveSystem.getTotalKills() >= 100 && !SaveSystem.hasAchievement("kills_100")) {
          SaveSystem.unlockAchievement("kills_100");
          if (!SaveSystem.isSkinOwned("vfx_lightning")) SaveSystem.ownSkin("vfx_lightning");
          emit("crowdef:achievement-unlocked", { id: "kills_100" });
        }
        const vfxSkinId = SaveSystem.getEquippedSkin("vfx") || getDefaultSkinId("vfx");
        const vfxColor = SKIN_BY_ID[vfxSkinId]?.killColor || 0xc63a10;
        Particles.emit(
          { x: e.group.position.x, y: e.group.position.y + 0.5, z: e.group.position.z },
          vfxColor,
          8,
          { speed: 3, life: 0.55, scale: 0.45, yLift: 1.2 },
        );
        JuiceFX.shake(0.05, 80);
        Audio.sfxEnemyDie();
        emit("crowdef:enemy-killed", {
          type: e.type || "basic",
          reward,
          pos: { x: e.group.position.x, y: e.group.position.y + 0.6, z: e.group.position.z },
        });
        e.destroy();
        this.enemies.splice(i, 1);
      }
    }

    if (this.hero) this.hero.tick(adt, this.enemies);

    this._tickBuildPoints(adt, this.hero);

    Synergies.resolve(this.towers, this.enemies, adt);

    for (const t of this.towers) t.tick(adt, this.enemies, this.towers);
  }

  _isLevelLost() {
    if (this.castles.length === 0) return false;
    if (this.castleLossMode === "any") return this.castles.some((c) => c.isDead);
    return this.castles.every((c) => c.isDead);
  }

  onCastleHit(dmg, pathIdx = 0) {
    let castle = this.castles.find((c) => c.pathIdx === pathIdx && !c.isDead);
    if (!castle) castle = this.castles.find((c) => !c.isDead);
    if (!castle) return;

    castle.hp = Math.max(0, castle.hp - dmg);
    if (castle._visual) {
      castle._visual.hp = castle.hp;
      castle._visual._updateTint();
    }
    if (castle.hp <= 0 && !castle.isDead) {
      castle.isDead = true;
      if (castle._visual) {
        castle._visual.isDead = true;
        castle._visual._applyGrayscale();
        Particles.emit(
          { x: castle.pos.x, y: 1.5, z: castle.pos.z },
          0x6a4a2a, 24,
          { speed: 5, life: 0.6, scale: 0.5, yLift: 1.0 },
        );
      }
      document.dispatchEvent(new CustomEvent("crowdef:castle-destroyed", { detail: { castleIdx: castle.index } }));
    }
    JuiceFX.shake(0.4, 350);
    Audio.sfxCastleHit();
    emit("crowdef:castle-hit", { dmg, castleHP: this.castleHP, castleIdx: castle.index });
    if (this._isLevelLost() && this.state === "play") {
      this.state = "lost";
      JuiceFX.shake(0.7, 700);
      Audio.sfxLevelLost();
      emit("crowdef:level-lost", { wave: this.wave });
    }
  }

  _winLevel() {
    if (this.state !== "play") return;
    this.state = "won";
    Audio.sfxLevelWon();
    if (this.level.id === "world1-8" && this.castleHP === this.castleHPMax) {
      if (!SaveSystem.hasAchievement("perfect_world1")) {
        SaveSystem.unlockAchievement("perfect_world1");
        if (!SaveSystem.isSkinOwned("castle_royal")) SaveSystem.ownSkin("castle_royal");
        emit("crowdef:achievement-unlocked", { id: "perfect_world1" });
      }
    }
    emit("crowdef:level-won", { wave: this.wave, castleHP: this.castleHP, castleHPMax: this.castleHPMax });
  }

  _spawnEnemy(type = "basic") {
    let pathIdx = 0;
    if (this.paths.length > 1) {
      this._spawnRRCounter = (this._spawnRRCounter || 0) + 1;
      pathIdx = this._spawnRRCounter % this.paths.length;
      if (Math.random() < 0.15) pathIdx = Math.floor(Math.random() * this.paths.length);
    }
    const targetPath = this.paths[pathIdx];
    const e = new Enemy(this.scene, targetPath, type, pathIdx);
    this.enemies.push(e);
  }

  dispose() {
    if (this._summonHandler) {
      document.removeEventListener("crowdef:boss-summon", this._summonHandler);
      this._summonHandler = null;
    }
    if (this._aoeHandler) {
      document.removeEventListener("crowdef:boss-aoe", this._aoeHandler);
      this._aoeHandler = null;
    }
    if (this.hero && this.hero.destroy) this.hero.destroy();
    for (const e of this.enemies) e.destroy();
    for (const t of this.towers) {
      if (t.destroy) t.destroy();
    }
    for (const bp of this.buildPoints) bp.dispose();
    this.enemies = [];
    this.towers = [];
    this.buildPoints = [];
    this.castles = [];
    this.hero = null;
  }

  loadLevel(newLevel) {
    this.dispose();
    this.level = newLevel;
    this.metaBonuses = computeActiveBonuses(SaveSystem);
    this.skinBonuses = computeSkinBonuses(SaveSystem);
    const coinsBonus = this.metaBonuses.startCoinsBonus || 0;
    this.state = "play";
    this.castles = [];
    this.castleLossMode = newLevel.castleLossMode || "all";
    this.coins = newLevel.startCoins + coinsBonus;
    this.wave = 1;
    this.gameTime = 0;
    this.paused = false;
    this._waveActive = true;
    this._spawnTimer = 0;
    this._waveBreakTimer = 0;
    this._initWave(0);
    this.setup();
    emit("crowdef:level-loaded", { levelId: newLevel.id });
  }

  restart() {
    this.loadLevel(this.level);
    emit("crowdef:level-restart", { level: this.level.id });
  }
}
