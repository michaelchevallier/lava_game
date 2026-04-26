const ENDLESS_TYPES = ["basic", "tank", "vip", "skeleton", "flying", "clown", "magicien", "trompette", "lavewalker", "stiltman"];

export class WaveManager {
  constructor(scene, levelData) {
    this.scene = scene;
    this.level = levelData;
    this.startedAt = 0;
    this.spawned = new Set();
    this.allSpawned = false;
    this.flatVisitors = [];
    this.infinite = !!levelData.infinite;
    this.endlessWave = 0;
    this._endlessNextAt = 0;
    this._buildSchedule();
  }

  _buildSchedule() {
    let id = 0;
    for (const wave of this.level.waves) {
      for (const v of wave.visitors) {
        this.flatVisitors.push({
          id: id++,
          type: v.type,
          lane: v.lane,
          atMs: wave.delayMs + (v.delayMs || 0),
        });
      }
    }
    this.flatVisitors.sort((a, b) => a.atMs - b.atMs);
  }

  start() {
    this.startedAt = this.scene.time.now;
  }

  tick(time) {
    if (this.infinite) {
      const elapsed = time - this.startedAt;
      if (elapsed >= this._endlessNextAt) {
        this._spawnEndlessWave(time);
      }
      return;
    }
    if (this.allSpawned) return;
    const elapsed = time - this.startedAt;
    let pending = 0;
    for (const v of this.flatVisitors) {
      if (this.spawned.has(v.id)) continue;
      if (elapsed >= v.atMs) {
        this.spawned.add(v.id);
        this.scene.spawnVisitor(v.lane, v.type);
      } else {
        pending++;
      }
    }
    if (pending === 0) this.allSpawned = true;
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
    return this.infinite ? Infinity : this.flatVisitors.length;
  }

  spawnedCount() {
    return this.spawned.size;
  }

  nextWaveAtMs(time) {
    if (this.infinite) {
      return Math.max(0, this._endlessNextAt - (time - this.startedAt));
    }
    const elapsed = time - this.startedAt;
    for (const v of this.flatVisitors) {
      if (!this.spawned.has(v.id)) {
        return Math.max(0, v.atMs - elapsed);
      }
    }
    return null;
  }
}

export function computeStars(level, escapedCount) {
  const tiers = level.stars;
  if (!tiers) return 0;
  if (escapedCount <= (tiers["3"]?.escapedMax ?? 0)) return 3;
  if (escapedCount <= (tiers["2"]?.escapedMax ?? 999)) return 2;
  if (escapedCount <= (tiers["1"]?.escapedMax ?? 999)) return 1;
  return 0;
}
