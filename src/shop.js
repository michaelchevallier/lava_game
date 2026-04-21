// Économie Tickets d'Or : débloque tuiles avancées + skins wagon.

export const TILE_PRICES = {
  trampoline: 4,
  fan: 4,
  rail_loop: 5,
  bridge: 6,
  ice: 6,
  wheel: 7,
  portal: 8,
  magnet: 10,
  tunnel: 12,
};

export const TILE_LABELS = {
  trampoline: "Trampoline",
  fan: "Ventilateur",
  rail_loop: "Rail Looping",
  bridge: "Pont",
  ice: "Glace",
  wheel: "Grande Roue",
  portal: "Portail",
  magnet: "Aimant",
  tunnel: "Tunnel Hanté",
};

export const TILE_EMOJI = {
  trampoline: "🎪",
  fan: "💨",
  rail_loop: "🔁",
  bridge: "🌉",
  ice: "🧊",
  wheel: "🎡",
  portal: "🌀",
  magnet: "🧲",
  tunnel: "🚇",
};

export const SKINS = [
  {
    id: "golden",
    name: "Wagon Doré",
    price: 8,
    emoji: "🏅",
    theme: { body: [255, 200, 30], dark: [180, 130, 0], trim: [255, 255, 200] },
  },
  {
    id: "obsidian",
    name: "Obsidienne",
    price: 8,
    emoji: "🖤",
    theme: { body: [30, 24, 44], dark: [10, 6, 20], trim: [180, 80, 220] },
  },
  {
    id: "neon",
    name: "Néon Électrique",
    price: 8,
    emoji: "⚡",
    theme: { body: [30, 240, 200], dark: [0, 120, 110], trim: [255, 240, 80] },
  },
  {
    id: "spectre",
    name: "Spectre Brumeux",
    price: 10,
    emoji: "👻",
    theme: { body: [210, 220, 245], dark: [110, 120, 150], trim: [180, 120, 220] },
  },
];

export function buyTile(save, persistSave, tool) {
  const price = TILE_PRICES[tool];
  if (!price) return { ok: false, reason: "unknown" };
  if ((save.ticketUnlocks || []).includes(tool)) return { ok: false, reason: "owned" };
  if ((save.tickets || 0) < price) return { ok: false, reason: "tickets" };
  save.tickets -= price;
  if (!Array.isArray(save.ticketUnlocks)) save.ticketUnlocks = [];
  save.ticketUnlocks.push(tool);
  try { persistSave(save); } catch (_) {}
  return { ok: true };
}

export function buySkin(save, persistSave, skinId) {
  const skin = SKINS.find((s) => s.id === skinId);
  if (!skin) return { ok: false, reason: "unknown" };
  if ((save.ownedSkins || []).includes(skinId)) return { ok: false, reason: "owned" };
  if ((save.tickets || 0) < skin.price) return { ok: false, reason: "tickets" };
  save.tickets -= skin.price;
  if (!Array.isArray(save.ownedSkins)) save.ownedSkins = [];
  save.ownedSkins.push(skinId);
  try { persistSave(save); } catch (_) {}
  return { ok: true };
}

export function setActiveSkin(save, persistSave, skinId) {
  if (skinId && !(save.ownedSkins || []).includes(skinId)) return false;
  save.activeSkin = skinId || null;
  try { persistSave(save); } catch (_) {}
  return true;
}

export function getSkinTheme(save) {
  if (!save || !save.activeSkin) return null;
  const skin = SKINS.find((s) => s.id === save.activeSkin);
  return skin ? skin.theme : null;
}

export function isTileTicketUnlocked(save, tool) {
  if (!save) return false;
  return (save.ticketUnlocks || []).includes(tool);
}
