export const Synergies = {
  _coinPullSources: [],

  resolve(towers, enemies, dt) {
    const now = (typeof performance !== "undefined" ? performance.now() : Date.now());

    for (const t of towers) {
      t._buffMul = 1;
      t._pierceBonus = 0;
      t._multiShotBonus = 0;
      t._pullActive = false;
      t._rangeMul = 1;
      t._fireRateMul = 1;
    }
    for (const e of enemies) {
      if ((e._slowUntil ?? 0) < now) {
        e._slowMul = 1;
        e._slowUntil = 0;
      }
    }

    this._coinPullSources = [];

    for (const t of towers) {
      const synergies = t.cfg.synergies;
      if (synergies && synergies.length > 0) {
        for (const syn of synergies) {
          if (syn.type === "aura") _applyAura(t, syn, towers);
          else if (syn.type === "applyToEnemy") _applyToEnemies(t, syn, enemies, dt, now);
          else if (syn.type === "passive") _registerPassive(t, syn, this._coinPullSources);
          else if (syn.type === "crossEffect") _applyCrossEffect(t, syn, towers);
        }
      } else {
        _fallbackBehavior(t, towers, enemies, dt, now, this._coinPullSources);
      }
    }

    _applyPullActive(towers, enemies, dt);
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

function _applyAura(source, syn, towers) {
  const r = syn.range || source.cfg.range || 4;
  const r2 = r * r;
  const srcPos = source.group.position;
  const effect = syn.effect || {};
  for (const t of towers) {
    if (t === source) continue;
    const dx = t.group.position.x - srcPos.x;
    const dz = t.group.position.z - srcPos.z;
    if (dx * dx + dz * dz < r2) {
      if (effect.dmgMul != null) t._buffMul = Math.max(t._buffMul, effect.dmgMul);
      if (effect.rangeMul != null) t._rangeMul = Math.max(t._rangeMul ?? 1, effect.rangeMul);
      if (effect.fireRateMul != null) t._fireRateMul = Math.max(t._fireRateMul ?? 1, effect.fireRateMul);
      if (effect.pierceBonus != null) t._pierceBonus = Math.max(t._pierceBonus ?? 0, effect.pierceBonus);
      if (effect.multiShotBonus != null) t._multiShotBonus = Math.max(t._multiShotBonus ?? 0, effect.multiShotBonus);
    }
  }
}

function _applyCrossEffect(source, syn, towers) {
  const r = syn.range || 4;
  const r2 = r * r;
  const srcPos = source.group.position;
  const effect = syn.effect || {};

  let nearFrom = null;
  for (const t of towers) {
    if (t === source) continue;
    if (t.type !== syn.from) continue;
    const dx = t.group.position.x - srcPos.x;
    const dz = t.group.position.z - srcPos.z;
    if (dx * dx + dz * dz < r2) { nearFrom = t; break; }
  }

  if (!source._synergyKeys) source._synergyKeys = {};
  const wasActive = !!source._synergyKeys[syn.from];

  if (nearFrom) {
    if (effect.freezeOnHit) {
      source._freezeOnHit = effect.freezeOnHit.durMs ?? 800;
    }
    if (effect.slowOnHit) {
      source._slowOnHit = effect.slowOnHit;
    }
    if (effect.pushTowardsMine) {
      source._pushTarget = { x: nearFrom.group.position.x, z: nearFrom.group.position.z };
    }
    if (effect.propagateAoE) {
      source._propagateAoE = effect.propagateAoE;
    }
    if (effect.pullToTank) {
      nearFrom._pullActive = true;
    }
    if (effect.appliesSlow) {
      source._appliesSlow = effect.appliesSlow;
    }

    if (!wasActive) {
      source._synergyKeys[syn.from] = true;
      const midX = (srcPos.x + nearFrom.group.position.x) / 2;
      const midZ = (srcPos.z + nearFrom.group.position.z) / 2;
      import("./Particles.js").then(({ Particles }) => {
        Particles.emit({ x: midX, y: 0.6, z: midZ }, 0xffd23f, 6, { speed: 2, life: 0.4, scale: 0.3, yLift: 0.5 });
      });
    }
  } else {
    if (effect.freezeOnHit) source._freezeOnHit = 0;
    if (effect.slowOnHit) source._slowOnHit = null;
    if (effect.pushTowardsMine) source._pushTarget = null;
    if (effect.propagateAoE) source._propagateAoE = null;
    if (effect.pullToTank) source._pullActive = false;
    if (effect.appliesSlow) source._appliesSlow = null;

    source._synergyKeys[syn.from] = false;
  }
}

function _applyPullActive(towers, enemies, dt) {
  for (const tank of towers) {
    if (!tank._pullActive) continue;
    const r2 = tank.range * tank.range;
    const myPos = tank.group.position;
    for (const e of enemies) {
      if (e.dead || e._dying || e.t == null) continue;
      const dx = e.group.position.x - myPos.x;
      const dz = e.group.position.z - myPos.z;
      if (dx * dx + dz * dz < r2) {
        e.t = Math.max(0, e.t - 0.005 * dt);
      }
    }
  }
}

function _applyToEnemies(source, syn, enemies, dt, now) {
  const r = syn.range || source.cfg.range || 4;
  const r2 = r * r;
  const srcPos = source.group.position;
  const effect = syn.effect || {};
  for (const e of enemies) {
    if (e.dead || e._dying) continue;
    const dx = e.group.position.x - srcPos.x;
    const dz = e.group.position.z - srcPos.z;
    if (dx * dx + dz * dz < r2) {
      if (effect.slow) {
        e._slowMul = Math.min(e._slowMul, effect.slow.mul ?? 0.5);
        e._slowUntil = Math.max(e._slowUntil, now + (effect.slow.durMs ?? 4000));
      }
      if (effect.push && e.t != null) {
        const strength = (effect.push.strength || 0.04) * dt;
        e.t = Math.max(0, e.t - strength);
        if (source._pushTarget) {
          const pdx = source._pushTarget.x - e.group.position.x;
          const pdz = source._pushTarget.z - e.group.position.z;
          const plen = Math.hypot(pdx, pdz) || 1;
          const pushStrength = effect.push.strength || 0.07;
          e.group.position.x += (pdx / plen) * pushStrength * dt * 5;
          e.group.position.z += (pdz / plen) * pushStrength * dt * 5;
        }
      }
    }
  }
}

function _registerPassive(source, syn, coinPullSources) {
  const effect = syn.effect || {};
  if (effect.coinMul != null) {
    const srcPos = source.group.position;
    coinPullSources.push({
      x: srcPos.x,
      z: srcPos.z,
      range: syn.range || source.cfg.range || 6,
      coinMul: effect.coinMul,
    });
  }
}

function _fallbackBehavior(source, towers, enemies, dt, now, coinPullSources) {
  const behavior = source.cfg.behavior;
  if (!behavior) return;
  const srcPos = source.group.position;
  const r = source.cfg.range || 4;
  const r2 = r * r;

  if (behavior === "buffAura") {
    const buffMul = source.cfg.buffMul || 1.5;
    for (const t of towers) {
      if (t === source) continue;
      const dx = t.group.position.x - srcPos.x;
      const dz = t.group.position.z - srcPos.z;
      if (dx * dx + dz * dz < r2) t._buffMul = Math.max(t._buffMul, buffMul);
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
      if (dx * dx + dz * dz < r2) e.t = Math.max(0, e.t - strength);
    }
  } else if (behavior === "coinPull") {
    coinPullSources.push({
      x: srcPos.x,
      z: srcPos.z,
      range: r,
      coinMul: source.cfg.coinMul || 1.5,
    });
  }
}
