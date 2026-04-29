import * as THREE from "three";
import { buildPath } from "./Path.js";
import { Particles } from "./Particles.js";
import { JuiceFX } from "./JuiceFX.js";
import { Audio } from "./Audio.js";
import { Hero } from "../entities/Hero.js";
import { Enemy, ENEMY_TYPES } from "../entities/Enemy.js";
import { Slot } from "../entities/Slot.js";
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

    const castleMul = (this.metaBonuses.castleHPMul || 1) * (this.skinBonuses.castleHPMul || 1);
    const coinsBonus = this.metaBonuses.startCoinsBonus || 0;

    this.state = "play";
    this.castleHP = Math.round(level.castleHP * castleMul);
    this.castleHPMax = Math.round(level.castleHP * castleMul);
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
    this.slots = [];

    this._waveActive = true;
    this._spawnTimer = 0;
    this._waveBreakTimer = 0;
    this._initWave(0);
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

  setup() {
    const rawPaths = Array.isArray(this.level.paths) && this.level.paths.length > 0
      ? this.level.paths
      : [this.level.pathPoints];
    this.paths = rawPaths.map((pts) => buildPath(pts));
    this.path = this.paths[0];
    this.pathLength = this.path.getLength();

    if (!this._summonHandler) {
      this._summonHandler = (ev) => {
        const type = ev.detail.type || "basic";
        const e = new Enemy(this.scene, this.path, type);
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
    this.hero = new Hero(this.scene, heroPos, { skinAsset: heroSkin?.asset || "knight" });
    this.hero.applyMetaBonuses(this.metaBonuses);
    if (heroSkin?.bonus) this.hero.applySkinBonuses(heroSkin.bonus);

    for (const cfg of this.level.slots) {
      const pathIdx = cfg.pathIdx || 0;
      const targetPath = this.paths[pathIdx] || this.path;
      this.slots.push(new Slot(this.scene, targetPath, cfg));
    }

    emit("crowdef:wave-start", { wave: 1 });
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
          this.castleHP = Math.min(this.castleHPMax, this.castleHP + this.hero.waveRegen);
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
        this.onCastleHit(e.damage || 5);
        e.destroy();
        this.enemies.splice(i, 1);
        continue;
      }
      if (e.dead) {
        const baseReward = (e.reward || 2) * 0.55;
        const reward = Math.max(1, Math.round(baseReward * (this.hero ? this.hero.coinGainMul : 1)));
        this.coins += reward;
        if (this.hero) {
          this.hero.gainXp(1);
          if (this.hero.lifesteal > 0) {
            this.castleHP = Math.min(this.castleHPMax, this.castleHP + this.hero.lifesteal);
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

    for (const slot of this.slots) {
      const slotPos = slot.pos;
      const status = slot.tick(adt, this.hero, this);
      if (status === 1) {
        this.towers.push(slot.tower);
        Particles.emit(
          { x: slotPos.x, y: 0.4, z: slotPos.z },
          0xffd23f, 14,
          { speed: 4, life: 0.7, scale: 0.5, yLift: 1.6 },
        );
        JuiceFX.shake(0.15, 200);
        Audio.sfxTowerBuilt();
        emit("crowdef:tower-built", { cost: slot.baseCost, towerType: slot.towerType, position: { x: slotPos.x, z: slotPos.z } });
      } else if (status > 1) {
        const upgradeColor = status === 2 ? 0xff9a55 : 0xff5050;
        Particles.emit(
          { x: slotPos.x, y: 0.6, z: slotPos.z },
          upgradeColor, 18,
          { speed: 5, life: 0.85, scale: 0.6, yLift: 2.0 },
        );
        JuiceFX.shake(0.2, 250);
        Audio.sfxTowerBuilt();
        emit("crowdef:tower-upgraded", { level: status, towerType: slot.towerType, position: { x: slotPos.x, z: slotPos.z } });
      }
    }

    for (const t of this.towers) t.tick(adt, this.enemies);
  }

  onCastleHit(dmg) {
    this.castleHP = Math.max(0, this.castleHP - dmg);
    JuiceFX.shake(0.4, 350);
    Audio.sfxCastleHit();
    emit("crowdef:castle-hit", { dmg, castleHP: this.castleHP });
    if (this.castleHP <= 0 && this.state === "play") {
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
    const pathIdx = this.paths.length > 1 ? Math.floor(Math.random() * this.paths.length) : 0;
    const targetPath = this.paths[pathIdx];
    const e = new Enemy(this.scene, targetPath, type);
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
    for (const s of this.slots) s.dispose();
    this.enemies = [];
    this.towers = [];
    this.slots = [];
    this.hero = null;
  }

  loadLevel(newLevel) {
    this.dispose();
    this.level = newLevel;
    this.metaBonuses = computeActiveBonuses(SaveSystem);
    this.skinBonuses = computeSkinBonuses(SaveSystem);
    const castleMul = (this.metaBonuses.castleHPMul || 1) * (this.skinBonuses.castleHPMul || 1);
    const coinsBonus = this.metaBonuses.startCoinsBonus || 0;
    this.state = "play";
    this.castleHP = Math.round(newLevel.castleHP * castleMul);
    this.castleHPMax = Math.round(newLevel.castleHP * castleMul);
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
