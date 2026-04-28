const KEY = "crowdef:save";
const VERSION = 1;

function defaultSave() {
  return {
    version: VERSION,
    muted: false,
    bestWave: 0,
    lastLevel: "world1-1",
    levels: {},
    lastPlayedAt: 0,
  };
}

let cached = null;

function ensureCached() {
  if (cached) return cached;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      cached = defaultSave();
      return cached;
    }
    const parsed = JSON.parse(raw);
    cached = { ...defaultSave(), ...parsed, levels: { ...(parsed.levels || {}) } };
    if (cached.version !== VERSION) cached.version = VERSION;
    return cached;
  } catch (e) {
    cached = defaultSave();
    return cached;
  }
}

function persist() {
  if (!cached) return;
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...cached, lastPlayedAt: Date.now() }));
  } catch (e) {}
}

export const SaveSystem = {
  load() {
    return { ...ensureCached() };
  },

  isMuted() { return !!ensureCached().muted; },
  setMuted(m) {
    ensureCached().muted = !!m;
    persist();
  },

  getBestWave() { return ensureCached().bestWave || 0; },
  recordWaveReached(wave) {
    const s = ensureCached();
    if (wave > (s.bestWave || 0)) {
      s.bestWave = wave;
      persist();
      return true;
    }
    return false;
  },

  getLastLevel() { return ensureCached().lastLevel || "world1-1"; },
  setLastLevel(id) {
    ensureCached().lastLevel = id;
    persist();
  },

  recordLevelDone(levelId, payload = {}) {
    const s = ensureCached();
    if (!s.levels[levelId]) s.levels[levelId] = { wins: 0, bestCastleHP: 0, lastWave: 0 };
    const slot = s.levels[levelId];
    slot.wins = (slot.wins || 0) + (payload.win ? 1 : 0);
    if (payload.castleHP != null && payload.castleHP > (slot.bestCastleHP || 0)) {
      slot.bestCastleHP = payload.castleHP;
    }
    if (payload.wave != null) slot.lastWave = payload.wave;
    s.lastLevel = levelId;
    persist();
  },

  reset() {
    cached = defaultSave();
    persist();
  },
};
