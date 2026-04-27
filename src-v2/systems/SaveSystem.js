const KEY = "parkdef:save";

function defaultSave() {
  return {
    version: 1,
    levels: {},
    lastPlayedAt: 0,
    settings: { volume: 0.7, muted: false },
  };
}

export function loadSave() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultSave();
    const parsed = JSON.parse(raw);
    return { ...defaultSave(), ...parsed, levels: { ...parsed.levels } };
  } catch (e) {
    return defaultSave();
  }
}

export function saveSave(data) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...data, lastPlayedAt: Date.now() }));
  } catch (e) {}
}

export function saveProgress(levelId, stars) {
  const save = loadSave();
  const prev = save.levels[levelId]?.stars ?? 0;
  save.levels[levelId] = {
    stars: Math.max(prev, stars),
    completed: true,
    lastTriedAt: Date.now(),
  };
  saveSave(save);
  return save;
}

export function getStars(levelId) {
  return loadSave().levels[levelId]?.stars ?? 0;
}

export function isCompleted(levelId) {
  return !!loadSave().levels[levelId]?.completed;
}

export function totalStars() {
  const save = loadSave();
  return Object.values(save.levels).reduce((s, l) => s + (l.stars || 0), 0);
}

export function saveEndlessRun(score, wave) {
  const save = loadSave();
  if (!save.endless) save.endless = { runs: [] };
  save.endless.runs.push({ score, wave, ts: Date.now() });
  save.endless.runs.sort((a, b) => b.score - a.score);
  save.endless.runs = save.endless.runs.slice(0, 5);
  saveSave(save);
  return save;
}

export function getEndlessTop() {
  return loadSave().endless?.runs ?? [];
}

export function getTickets() {
  return loadSave().totalTickets || 0;
}

export function spendTickets(n) {
  const save = loadSave();
  if ((save.totalTickets || 0) < n) return false;
  save.totalTickets -= n;
  saveSave(save);
  return true;
}

export function ownsSkin(skinId) {
  const save = loadSave();
  return !!save.skins?.[skinId];
}

export function unlockSkin(skinId) {
  const save = loadSave();
  if (!save.skins) save.skins = {};
  save.skins[skinId] = Date.now();
  saveSave(save);
}

export function getEquippedSkin(tileId) {
  const save = loadSave();
  return save.equipped?.[tileId] || null;
}

export function setEquippedSkin(tileId, skinId) {
  const save = loadSave();
  if (!save.equipped) save.equipped = {};
  if (skinId) save.equipped[tileId] = skinId;
  else delete save.equipped[tileId];
  saveSave(save);
}
