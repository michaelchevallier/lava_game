export const RUN_DURATION = 180;

export function createRunSystem({
  k, gameState, save, persistSave, audio, spawnWagon,
  getActiveAvatar, onEnd,
}) {
  let state = null;
  let spawnTimer = 0;

  function start(duration = RUN_DURATION) {
    state = {
      startTime: k.time(),
      duration,
      ended: false,
      wagonsSpawned: 0,
      skeletonsAtStart: gameState.skeletons || 0,
      coinsAtStart: gameState.coins || 0,
    };
    spawnTimer = 0;
    gameState.score = 0;
    gameState.skeletons = 0;
    gameState.coins = 0;
    gameState.comboCount = 0;
    gameState.comboExpire = 0;
  }

  function tick(dt = 0.5) {
    if (!state || state.ended) return;
    const elapsed = k.time() - state.startTime;
    if (elapsed >= state.duration) {
      finish();
      return;
    }
    if (spawnWagon) {
      spawnTimer += dt;
      const interval = 5;
      const cap = 3;
      if (spawnTimer >= interval) {
        spawnTimer = 0;
        const live = k.get("wagon").length;
        if (live < cap) {
          try { spawnWagon(false, false); state.wagonsSpawned++; } catch (e) {}
        }
      }
    }
  }

  function finish() {
    if (!state || state.ended) return;
    state.ended = true;
    const elapsed = k.time() - state.startTime;
    const avatar = getActiveAvatar ? getActiveAvatar() : (save.avatars?.p1 || "mario");
    const record = {
      score: Math.floor(gameState.score),
      skeletons: gameState.skeletons,
      coins: gameState.coins,
      date: Date.now(),
      duration: state.duration,
    };
    if (!save.runs) save.runs = {};
    if (!save.runs[avatar]) save.runs[avatar] = [];
    save.runs[avatar].push(record);
    save.runs[avatar].sort((a, b) => b.score - a.score);
    save.runs[avatar] = save.runs[avatar].slice(0, 5);
    try { persistSave(save); } catch (e) {}
    audio.combo?.();
    onEnd?.({ avatar, record, top: save.runs[avatar] });
  }

  function abort() { state = null; }
  function getState() { return state; }

  return { start, tick, finish, abort, getState };
}
