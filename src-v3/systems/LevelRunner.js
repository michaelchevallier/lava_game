import * as THREE from "three";
import { buildPath } from "./Path.js";
import { Hero } from "../entities/Hero.js";
import { Enemy } from "../entities/Enemy.js";
import { Slot } from "../entities/Slot.js";

function emit(name, detail) {
  document.dispatchEvent(new CustomEvent(name, { detail }));
}

export class LevelRunner {
  constructor(scene, level, deps = {}) {
    this.scene = scene;
    this.level = level;
    this.deps = deps;

    this.state = "play";
    this.castleHP = level.castleHP;
    this.castleHPMax = level.castleHP;
    this.coins = level.startCoins;
    this.wave = 1;
    this.gameTime = 0;
    this.gameSpeed = 1;
    this.paused = false;

    this.path = null;
    this.pathLength = 0;
    this.hero = null;
    this.enemies = [];
    this.towers = [];
    this.slots = [];

    this._waveActive = true;
    this._spawnTimer = 0;
    this._enemiesSpawned = 0;
    this._enemiesPerWave = level.waves.firstSize;
    this._spawnRate = level.waves.spawnRateMs;
    this._waveBreakTimer = 0;
    this._levelEndTimer = 0;
  }

  setup() {
    this.path = buildPath(this.level.pathPoints);
    this.pathLength = this.path.getLength();

    const heroPos = new THREE.Vector3(...(this.level.heroSpawn || [-2, 0, -1]));
    this.hero = new Hero(this.scene, heroPos);

    for (const cfg of this.level.slots) {
      this.slots.push(new Slot(this.scene, this.path, cfg));
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
      if (this._spawnTimer >= this._spawnRate && this._enemiesSpawned < this._enemiesPerWave) {
        this._spawnTimer = 0;
        this._enemiesSpawned++;
        this._spawnEnemy();
      }
      if (this._enemiesSpawned >= this._enemiesPerWave && this.enemies.length === 0) {
        this._waveActive = false;
        this._waveBreakTimer = 0;
        emit("crowdef:wave-cleared", { wave: this.wave });
      }
    } else {
      this._waveBreakTimer += dtMs;
      if (this._waveBreakTimer > this.level.waves.breakMs) {
        if (this.wave >= this.level.waves.finalWave) {
          this._winLevel();
          return;
        }
        this.wave++;
        this._enemiesPerWave = Math.round(this._enemiesPerWave * this.level.waves.sizeMultiplier);
        this._spawnRate = Math.max(this.level.waves.spawnRateMinMs, this._spawnRate - this.level.waves.spawnRateDecMs);
        this._enemiesSpawned = 0;
        this._spawnTimer = 0;
        this._waveActive = true;
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
        this.coins += e.reward || 2;
        emit("crowdef:enemy-killed", { type: e.type || "basic", reward: e.reward || 2 });
        e.destroy();
        this.enemies.splice(i, 1);
      }
    }

    if (this.hero) this.hero.tick(adt, this.enemies);

    for (const slot of this.slots) {
      const built = slot.tick(adt, this.hero, this);
      if (built) {
        this.towers.push(slot.tower);
        emit("crowdef:tower-built", { cost: slot.cost });
      }
    }

    for (const t of this.towers) t.tick(adt, this.enemies);
  }

  onCastleHit(dmg) {
    this.castleHP = Math.max(0, this.castleHP - dmg);
    emit("crowdef:castle-hit", { dmg, castleHP: this.castleHP });
    if (this.castleHP <= 0 && this.state === "play") {
      this.state = "lost";
      emit("crowdef:level-lost", { wave: this.wave });
    }
  }

  _winLevel() {
    if (this.state !== "play") return;
    this.state = "won";
    emit("crowdef:level-won", { wave: this.wave, castleHP: this.castleHP, castleHPMax: this.castleHPMax });
  }

  _spawnEnemy() {
    const e = new Enemy(this.scene, this.path);
    this.enemies.push(e);
  }

  dispose() {
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

  restart() {
    this.dispose();
    this.state = "play";
    this.castleHP = this.castleHPMax;
    this.coins = this.level.startCoins;
    this.wave = 1;
    this.gameTime = 0;
    this._waveActive = true;
    this._spawnTimer = 0;
    this._enemiesSpawned = 0;
    this._enemiesPerWave = this.level.waves.firstSize;
    this._spawnRate = this.level.waves.spawnRateMs;
    this._waveBreakTimer = 0;
    this.setup();
    emit("crowdef:level-restart", { level: this.level.id });
  }
}
