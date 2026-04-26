import { loadSave, saveSave } from "./SaveSystem.js";

export const TROPHIES = [
  { id: "first_kill", emoji: "💀", name: "Premier Sang", desc: "Tuer 1 visiteur", check: (s) => s.totalKills >= 1 },
  { id: "kills_50", emoji: "⚔️", name: "Massacre", desc: "Tuer 50 visiteurs", check: (s) => s.totalKills >= 50 },
  { id: "kills_500", emoji: "💥", name: "Boucher", desc: "Tuer 500 visiteurs", check: (s) => s.totalKills >= 500 },
  { id: "kills_2000", emoji: "🩸", name: "Génocide", desc: "Tuer 2000 visiteurs", check: (s) => s.totalKills >= 2000 },
  { id: "first_star", emoji: "⭐", name: "Premier Niveau", desc: "Finir 1 niveau", check: (s, save) => Object.keys(save.levels || {}).length >= 1 },
  { id: "stars_15", emoji: "✨", name: "Étoiles Filantes", desc: "Cumuler 15 étoiles", check: (s) => s.totalStars >= 15 },
  { id: "stars_45", emoji: "🌟", name: "Constellation", desc: "Cumuler 45 étoiles", check: (s) => s.totalStars >= 45 },
  { id: "world1_done", emoji: "🌞", name: "Plein Été", desc: "Finir le monde 1", check: (s, save) => ["1.1","1.2","1.3","1.4","1.5","1.6"].every((id) => save.levels?.[id]?.completed) },
  { id: "boss_magic", emoji: "🎩", name: "Anti-Magie", desc: "Vaincre le Magicien", check: (s, save) => !!save.levels?.["2.6"]?.completed },
  { id: "boss_queen", emoji: "👑", name: "Régicide", desc: "Vaincre la Reine de la Lave", check: (s, save) => !!save.levels?.["4.6"]?.completed },
  { id: "boss_patron", emoji: "🎪", name: "Forain Détrôné", desc: "Vaincre le Patron de la Foire", check: (s, save) => !!save.levels?.["5.6"]?.completed },
  { id: "endless_wave5", emoji: "🌋", name: "Coulée Survivor", desc: "Atteindre vague 5 en Endless", check: (s, save) => (save.endless?.runs?.[0]?.wave ?? 0) >= 5 },
  { id: "endless_wave10", emoji: "🔥", name: "Endurci", desc: "Atteindre vague 10 en Endless", check: (s, save) => (save.endless?.runs?.[0]?.wave ?? 0) >= 10 },
  { id: "tickets_10", emoji: "🎫", name: "Collectionneur", desc: "Récolter 10 tickets cumulés", check: (s) => s.totalTickets >= 10 },
  { id: "no_escape", emoji: "🛡️", name: "Forteresse", desc: "Finir un niveau avec 0 échappé", check: (s, save) => Object.values(save.levels || {}).some((l) => l.stars === 3) },
  { id: "daily_first", emoji: "📅", name: "Régulier", desc: "Finir 1 Défi du Jour", check: (s, save) => Object.keys(save.daily || {}).length >= 1 },
  { id: "daily_streak_3", emoji: "🔥", name: "Sur la Lancée", desc: "Streak de 3 jours d'affilée", check: (s, save) => computeStreak(save) >= 3 },
];

function computeStreak(save) {
  if (!save.daily) return 0;
  let streak = 0;
  const d = new Date();
  while (streak < 30) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const key = y + "-" + m + "-" + day;
    if (save.daily[key]) { streak++; d.setDate(d.getDate() - 1); }
    else break;
  }
  return streak;
}

export function getStats(save) {
  save = save || loadSave();
  const totalStars = Object.values(save.levels || {}).reduce((s, l) => s + (l.stars || 0), 0);
  return {
    totalKills: save.totalKills || 0,
    totalStars,
    totalTickets: save.totalTickets || 0,
  };
}

export function checkTrophies(stats, save) {
  save = save || loadSave();
  if (!save.trophies) save.trophies = {};
  const stat = stats || getStats(save);
  const newly = [];
  for (const t of TROPHIES) {
    if (save.trophies[t.id]) continue;
    if (t.check(stat, save)) {
      save.trophies[t.id] = Date.now();
      newly.push(t);
    }
  }
  if (newly.length) saveSave(save);
  return newly;
}

export function trophyBonus(save) {
  save = save || loadSave();
  return Object.keys(save.trophies || {}).length * 5;
}

export function unlockedCount(save) {
  save = save || loadSave();
  return Object.keys(save.trophies || {}).length;
}

export function isUnlocked(id, save) {
  save = save || loadSave();
  return !!save.trophies?.[id];
}

export function bumpKills(n = 1) {
  const save = loadSave();
  save.totalKills = (save.totalKills || 0) + n;
  saveSave(save);
  return checkTrophies(null, save);
}

export function bumpTickets(n = 1) {
  const save = loadSave();
  save.totalTickets = (save.totalTickets || 0) + n;
  saveSave(save);
  return checkTrophies(null, save);
}
