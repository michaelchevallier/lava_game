export class WaveManager {
  constructor(scene, levelData) {
    this.scene = scene;
    this.level = levelData;
    this.startedAt = 0;
    this.spawned = new Set();
    this.allSpawned = false;
    this.flatVisitors = [];
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

  totalVisitors() {
    return this.flatVisitors.length;
  }

  spawnedCount() {
    return this.spawned.size;
  }

  nextWaveAtMs(time) {
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
