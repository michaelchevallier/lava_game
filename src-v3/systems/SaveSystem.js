const KEY = "crowdef:save";
const VERSION = 4;

function defaultSave() {
  return {
    version: VERSION,
    muted: false,
    bestWave: 0,
    lastLevel: "world1-1",
    levels: {},
    gems: 0,
    upgrades: {},
    skinsOwned: ["hero_default", "castle_default", "vfx_default"],
    skinsEquipped: { hero: "hero_default", castle: "castle_default", vfx: "vfx_default" },
    achievements: [],
    totalKills: 0,
    lastPlayedAt: 0,
    endlessLeaderboard: [],
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
    if ((parsed?.version || 0) < VERSION) {
      // POST.J architecture pivot: invalider les saves antérieures (slots → BuildPoint, towers refacto)
      cached = defaultSave();
      return cached;
    }
    const def = defaultSave();
    cached = {
      ...def,
      ...parsed,
      levels: { ...(parsed.levels || {}) },
      upgrades: { ...(parsed.upgrades || {}) },
      gems: parsed.gems || 0,
      skinsOwned: Array.isArray(parsed.skinsOwned) ? [...new Set([...def.skinsOwned, ...parsed.skinsOwned])] : def.skinsOwned,
      skinsEquipped: { ...def.skinsEquipped, ...(parsed.skinsEquipped || {}) },
      achievements: Array.isArray(parsed.achievements) ? parsed.achievements : [],
      totalKills: parsed.totalKills || 0,
      endlessLeaderboard: Array.isArray(parsed.endlessLeaderboard) ? parsed.endlessLeaderboard : [],
    };
    if (cached.version !== VERSION) cached.version = VERSION;
    // T8 migration: rename "aaa" → "skyguard" in owned/equipped skins
    if (Array.isArray(cached.skinsOwned)) {
      cached.skinsOwned = cached.skinsOwned.map(s => s === "aaa" ? "skyguard" : s);
    }
    if (cached.skinsEquipped) {
      for (const k of Object.keys(cached.skinsEquipped)) {
        if (cached.skinsEquipped[k] === "aaa") cached.skinsEquipped[k] = "skyguard";
      }
    }
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

  getMusicVolume() {
    const v = ensureCached().musicVolume;
    return v == null ? 0.35 : v;
  },
  setMusicVolume(v) {
    ensureCached().musicVolume = Math.max(0, Math.min(1, v));
    persist();
  },
  getSfxVolume() {
    const v = ensureCached().sfxVolume;
    return v == null ? 0.5 : v;
  },
  setSfxVolume(v) {
    ensureCached().sfxVolume = Math.max(0, Math.min(1, v));
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
    if (!s.levels[levelId]) s.levels[levelId] = { wins: 0, bestCastleHP: 0, lastWave: 0, bestStars: 0 };
    const slot = s.levels[levelId];
    slot.wins = (slot.wins || 0) + (payload.win ? 1 : 0);
    if (payload.castleHP != null && payload.castleHP > (slot.bestCastleHP || 0)) {
      slot.bestCastleHP = payload.castleHP;
    }
    if (payload.wave != null) slot.lastWave = payload.wave;
    if (payload.stars != null && payload.stars > (slot.bestStars || 0)) {
      slot.bestStars = payload.stars;
    }
    s.lastLevel = levelId;
    persist();
  },

  getStars(levelId) {
    const s = ensureCached();
    return s.levels[levelId]?.bestStars || 0;
  },

  isLevelComplete(levelId) {
    const s = ensureCached();
    return (s.levels[levelId]?.bestStars || 0) >= 1;
  },

  totalStars() {
    const s = ensureCached();
    return Object.values(s.levels || {}).reduce((sum, l) => sum + (l.bestStars || 0), 0);
  },

  isLevelUnlocked(levelId, levelOrder) {
    if (levelId === "endless") return this.isLevelComplete("world1-8");
    if (!levelOrder || !levelOrder.length) return true;
    if (this.isLevelComplete(levelId)) return true;
    const idx = levelOrder.indexOf(levelId);
    if (idx <= 0) return true;
    const prevId = levelOrder[idx - 1];
    return this.isLevelComplete(prevId);
  },

  getGems() { return ensureCached().gems || 0; },
  addGems(n) {
    const s = ensureCached();
    s.gems = Math.max(0, (s.gems || 0) + n);
    persist();
    return s.gems;
  },
  spendGems(n) {
    const s = ensureCached();
    if ((s.gems || 0) < n) return false;
    s.gems -= n;
    persist();
    return true;
  },

  getUpgradeLevel(id) {
    return ensureCached().upgrades[id] || 0;
  },
  setUpgradeLevel(id, level) {
    const s = ensureCached();
    s.upgrades[id] = Math.max(0, level);
    persist();
  },
  resetUpgrade(id) {
    const s = ensureCached();
    delete s.upgrades[id];
    persist();
  },

  isSkinOwned(skinId) { return ensureCached().skinsOwned.includes(skinId); },
  ownSkin(skinId) {
    const s = ensureCached();
    if (!s.skinsOwned.includes(skinId)) {
      s.skinsOwned.push(skinId);
      persist();
      return true;
    }
    return false;
  },
  getEquippedSkin(category) { return ensureCached().skinsEquipped[category] || null; },
  equipSkin(category, skinId) {
    const s = ensureCached();
    s.skinsEquipped[category] = skinId;
    persist();
  },
  getOwnedSkins() { return [...ensureCached().skinsOwned]; },

  hasSeenCutscene(id) {
    const s = ensureCached();
    return Array.isArray(s.seenCutscenes) && s.seenCutscenes.includes(id);
  },
  markCutsceneSeen(id) {
    const s = ensureCached();
    if (!Array.isArray(s.seenCutscenes)) s.seenCutscenes = [];
    if (!s.seenCutscenes.includes(id)) {
      s.seenCutscenes.push(id);
      persist();
    }
  },

  hasAchievement(id) { return ensureCached().achievements.includes(id); },
  unlockAchievement(id) {
    const s = ensureCached();
    if (!s.achievements.includes(id)) {
      s.achievements.push(id);
      persist();
      return true;
    }
    return false;
  },
  getTotalKills() { return ensureCached().totalKills || 0; },
  addKills(n) {
    const s = ensureCached();
    s.totalKills = (s.totalKills || 0) + n;
    persist();
    return s.totalKills;
  },

  getLeaderboard() {
    return [...(ensureCached().endlessLeaderboard || [])];
  },
  addLeaderboardEntry(wave, date) {
    const s = ensureCached();
    if (!Array.isArray(s.endlessLeaderboard)) s.endlessLeaderboard = [];
    s.endlessLeaderboard.push({ wave, date });
    s.endlessLeaderboard.sort((a, b) => b.wave - a.wave);
    if (s.endlessLeaderboard.length > 5) s.endlessLeaderboard.length = 5;
    persist();
  },

  reset() {
    cached = defaultSave();
    persist();
  },
};
