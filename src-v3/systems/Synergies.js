export const Synergies = {
  _coinPullSources: [],

  resolve(towers, enemies, dt) {
    const now = (typeof performance !== "undefined" ? performance.now() : Date.now());

    for (const t of towers) t._buffMul = 1;
    for (const e of enemies) {
      e._slowMul = 1;
      e._slowUntil = 0;
    }

    this._coinPullSources = [];

    for (const source of towers) {
      const behavior = source.cfg.behavior;
      if (!behavior) continue;
      const srcPos = source.group.position;
      const r = source.cfg.range || 4;
      const r2 = r * r;

      if (behavior === "buffAura") {
        const buffMul = source.cfg.buffMul || 1.5;
        for (const t of towers) {
          if (t === source) continue;
          const dx = t.group.position.x - srcPos.x;
          const dz = t.group.position.z - srcPos.z;
          if (dx * dx + dz * dz < r2) {
            t._buffMul = Math.max(t._buffMul, buffMul);
          }
        }
      } else if (behavior === "slow") {
        const mul = source.cfg.slowMul || 0.5;
        const dur = source.cfg.slowDurationMs || 4000;
        for (const e of enemies) {
          if (e.dead || e._dying) continue;
          const dx = e.group.position.x - srcPos.x;
          const dz = e.group.position.z - srcPos.z;
          if (dx * dx + dz * dz < r2) {
            e._slowMul = Math.min(e._slowMul, mul);
            e._slowUntil = Math.max(e._slowUntil, now + dur);
          }
        }
      } else if (behavior === "push") {
        const strength = (source.cfg.pushStrength || 0.04) * dt;
        for (const e of enemies) {
          if (e.dead || e._dying || e.t == null) continue;
          const dx = e.group.position.x - srcPos.x;
          const dz = e.group.position.z - srcPos.z;
          if (dx * dx + dz * dz < r2) {
            e.t = Math.max(0, e.t - strength);
          }
        }
      } else if (behavior === "coinPull") {
        this._coinPullSources.push({
          x: srcPos.x,
          z: srcPos.z,
          range: r,
          coinMul: source.cfg.coinMul || 1.5,
        });
      }
    }
  },

  getCoinMulAt(pos) {
    let best = 1;
    for (const src of this._coinPullSources) {
      const dx = pos.x - src.x;
      const dz = pos.z - src.z;
      if (dx * dx + dz * dz < src.range * src.range) {
        best = Math.max(best, src.coinMul);
      }
    }
    return best;
  },
};
