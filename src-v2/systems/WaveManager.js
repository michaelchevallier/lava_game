const ENDLESS_TYPES = ["basic", "tank", "vip", "skeleton", "flying", "clown", "magicien", "trompette", "lavewalker", "stiltman"];

const FIRST_WAVE_MAX_MS = 15000;
const MIN_INTER_WAVE_MS = 6000;
const MAX_WAIT_AFTER_PREV_MS = 25000;
const ALIVE_CLEAR_THRESHOLD = 2;

export class WaveManager {
  constructor(scene, levelData) {
    this.scene = scene;
    this.level = levelData;
    this.startedAt = 0;
    this.infinite = !!levelData.infinite;
    this.endlessWave = 0;
    this._endlessNextAt = 0;

    this.waves = (levelData.waves || []).map((w, idx) => ({
      idx,
      delayMs: w.delayMs ?? 0,
      visitors: (w.visitors || []).map((v, vidx) => ({
        id: idx * 10000 + vidx,
        type: v.type,
        lane: v.lane,
        delayMs: v.delayMs || 0,
      })),
    }));
    this.currentWaveIdx = 0;
    this.waveStartedAt = -1;
    this.waveSpawnedIds = new Set();
    this.prevWaveEndAt = 0;
    this.allSpawned = this.waves.length === 0;

    this._totalVisitors = this.waves.reduce((acc, w) => acc + w.visitors.length, 0);
    this._spawnedCount = 0;
  }

  start() {
    this.startedAt = this.scene._gameTime ?? this.scene.time.now;
  }

  tick(time) {
    if (this.infinite) {
      const elapsed = time - this.startedAt;
      if (elapsed >= this._endlessNextAt) this._spawnEndlessWave(time);
      return;
    }
    if (this.allSpawned) return;

    const elapsed = time - this.startedAt;
    const wave = this.waves[this.currentWaveIdx];
    if (!wave) { this.allSpawned = true; return; }

    if (this.waveStartedAt < 0) {
      let gateOK = false;
      if (this.currentWaveIdx === 0) {
        const target = Math.min(wave.delayMs, FIRST_WAVE_MAX_MS);
        gateOK = elapsed >= target;
      } else {
        const aliveCount = (this.scene.visitors || []).filter((v) => v.active && !v._dying).length;
        const minGapPassed = elapsed >= this.prevWaveEndAt + MIN_INTER_WAVE_MS;
        const cleared = aliveCount <= ALIVE_CLEAR_THRESHOLD;
        const maxWaitHit = elapsed >= this.prevWaveEndAt + MAX_WAIT_AFTER_PREV_MS;
        gateOK = (cleared && minGapPassed) || maxWaitHit;
      }
      if (!gateOK) return;
      this.waveStartedAt = elapsed;
      if (this.scene.events) this.scene.events.emit("wave-started", this.currentWaveIdx);
    }

    const waveElapsed = elapsed - this.waveStartedAt;
    let pendingInWave = 0;
    for (const v of wave.visitors) {
      if (this.waveSpawnedIds.has(v.id)) continue;
      if (waveElapsed >= v.delayMs) {
        this.waveSpawnedIds.add(v.id);
        this.scene.spawnVisitor(v.lane, v.type);
        this._spawnedCount++;
      } else {
        pendingInWave++;
      }
    }

    if (pendingInWave === 0) {
      this.prevWaveEndAt = elapsed;
      this.currentWaveIdx++;
      this.waveStartedAt = -1;
      this.waveSpawnedIds = new Set();
      if (this.currentWaveIdx >= this.waves.length) this.allSpawned = true;
    }
  }

  _spawnEndlessWave(time) {
    this.endlessWave++;
    const w = this.endlessWave;
    const count = Math.min(80, Math.round(3 + w * 1.4 + w * w * 0.06));
    const baseDelay = 0;
    const stagger = Math.max(220, Math.round(1500 * Math.pow(0.93, w)));
    const hpMul = Math.pow(1.08, w);
    const speedMul = Math.min(1.7, 1 + w * 0.025);
    for (let i = 0; i < count; i++) {
      const lane = Math.floor(Math.random() * 5);
      let type;
      if (w < 3) type = "basic";
      else if (w < 5) type = Math.random() < 0.6 ? "basic" : "tank";
      else if (w < 8) type = ENDLESS_TYPES[Math.floor(Math.random() * 5)];
      else if (w < 14) type = ENDLESS_TYPES[Math.floor(Math.random() * 8)];
      else type = ENDLESS_TYPES[Math.floor(Math.random() * ENDLESS_TYPES.length)];
      this.scene.time.delayedCall(baseDelay + i * stagger, () => {
        if (!this.scene || !this.scene.scene?.isActive()) return;
        this.scene.spawnVisitor(lane, type, { hpMul, speedMul });
      });
    }
    const bossCount = w >= 5 ? Math.max(1, Math.floor((w - 3) / 4)) : 0;
    if (w % 5 === 0 && w > 0) {
      for (let b = 0; b < bossCount; b++) {
        this.scene.time.delayedCall(baseDelay + count * stagger + 2000 + b * 1800, () => {
          if (!this.scene || !this.scene.scene?.isActive()) return;
          this.scene.spawnVisitor(Math.floor(Math.random() * 5), "boss", { hpMul, speedMul });
        });
      }
    }
    const waveDuration = Math.max(7000, Math.round(24000 * Math.pow(0.93, w)));
    this._endlessNextAt = (time - this.startedAt) + waveDuration;
    if (this.scene.events) {
      this.scene.events.emit("endless-wave", w);
    }
  }

  totalVisitors() {
    return this.infinite ? Infinity : this._totalVisitors;
  }

  spawnedCount() {
    return this._spawnedCount;
  }

  nextWaveAtMs(time) {
    if (this.infinite) {
      return Math.max(0, this._endlessNextAt - (time - this.startedAt));
    }
    if (this.allSpawned) return null;
    const wave = this.waves[this.currentWaveIdx];
    if (!wave) return null;
    const elapsed = time - this.startedAt;

    if (this.waveStartedAt < 0) {
      if (this.currentWaveIdx === 0) {
        const target = Math.min(wave.delayMs, FIRST_WAVE_MAX_MS);
        return Math.max(0, target - elapsed);
      }
      const minStart = this.prevWaveEndAt + MIN_INTER_WAVE_MS;
      return Math.max(0, minStart - elapsed);
    }

    const waveElapsed = elapsed - this.waveStartedAt;
    let nextIn = Infinity;
    for (const v of wave.visitors) {
      if (this.waveSpawnedIds.has(v.id)) continue;
      const t = v.delayMs - waveElapsed;
      if (t < nextIn) nextIn = t;
    }
    return nextIn === Infinity ? null : Math.max(0, nextIn);
  }
}

export function computeStars(level, escapedCount, killedCount = 0, totalVisitors = 0) {
  const tiers = level.stars;
  if (!tiers) return 0;
  const tierMatch = (tier) => {
    if (!tier) return false;
    if (tier.killAll && totalVisitors > 0 && killedCount < totalVisitors) return false;
    return escapedCount <= (tier.escapedMax ?? 999);
  };
  if (tierMatch(tiers["3"])) return 3;
  if (tierMatch(tiers["2"])) return 2;
  if (tierMatch(tiers["1"])) return 1;
  return 0;
}
