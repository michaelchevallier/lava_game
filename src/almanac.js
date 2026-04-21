// Almanach des témoignages VIP. Centralise écriture + lecture marquage lu/nonlu.

export function pushAlmanacEntry(save, persistSave, entry) {
  if (!save.almanac || !Array.isArray(save.almanac)) save.almanac = [];
  const stamp = Date.now();
  save.almanac.push({ ...entry, stamp });
  save.almanacUnread = (save.almanacUnread || 0) + 1;
  try { persistSave(save); } catch (_) {}
  return save.almanac.length;
}

export function getUnreadCount(save) {
  if (!save) return 0;
  return save.almanacUnread || 0;
}

export function markAllRead(save, persistSave) {
  if (!save) return;
  save.almanacUnread = 0;
  try { persistSave(save); } catch (_) {}
}

export function listByVip(save) {
  const map = new Map();
  for (const e of save.almanac || []) {
    if (!map.has(e.vipId)) map.set(e.vipId, []);
    map.get(e.vipId).push(e);
  }
  return map;
}

export function totalTicketsEarned(save) {
  return (save.almanac || []).reduce((s, e) => s + (e.reward || 1), 0);
}
