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
    const count = Math.min(3 + Math.floor(w * 1.2), 18);
    const baseDelay = 0;
    const stagger = Math.max(400, 1500 - w * 40);
    for (let i = 0; i < count; i++) {
      const lane = Math.floor(Math.random() * 5);
      let type;
      if (w < 3) type = "basic";
      else if (w < 6) type = Math.random() < 0.7 ? "basic" : "tank";
      else if (w < 10) type = ENDLESS_TYPES[Math.floor(Math.random() * 5)];
      else type = ENDLESS_TYPES[Math.floor(Math.random() * ENDLESS_TYPES.length)];
      const id = "endless-" + w + "-" + i;
      this.scene.time.delayedCall(baseDelay + i * stagger, () => {
        if (!this.scene || !this.scene.scene?.isActive()) return;
        this.scene.spawnVisitor(lane, type);
      });
    }
    if (w % 5 === 0 && w > 0) {
      this.scene.time.delayedCall(baseDelay + count * stagger + 2000, () => {
        if (!this.scene || !this.scene.scene?.isActive()) return;
        this.scene.spawnVisitor(Math.floor(Math.random() * 5), "boss");
      });
    }
    const waveDuration = Math.max(12000, 24000 - w * 600);
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
