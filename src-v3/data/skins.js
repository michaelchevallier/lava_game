export const SKIN_CATEGORIES = {
  hero: { label: "Hero", icon: "🤴" },
  castle: { label: "Château", icon: "🏰" },
  vfx: { label: "Effets", icon: "✨" },
};

export const SKINS = [
  {
    id: "hero_default",
    category: "hero",
    name: "Chevalier",
    description: "Le héros classique du royaume",
    icon: "🛡️",
    asset: "knight",
    unlock: { type: "default" },
    bonus: null,
    color: "#8888aa",
  },
  {
    id: "hero_soldier",
    category: "hero",
    name: "Soldat aguerri",
    description: "+5% dégâts hero",
    icon: "⚔️",
    asset: "soldier",
    unlock: { type: "purchase", cost: 50 },
    bonus: { damageMul: 1.05 },
    color: "#8a4a22",
  },
  {
    id: "hero_wizard",
    category: "hero",
    name: "Mage rusé",
    description: "+5% portée hero",
    icon: "🧙",
    asset: "wizard",
    unlock: { type: "purchase", cost: 80 },
    bonus: { rangeMul: 1.05 },
    color: "#6a3aa0",
  },
  {
    id: "hero_knight_gold",
    category: "hero",
    name: "Chevalier doré",
    description: "+5% cadence de tir",
    icon: "👑",
    asset: "knightgolden",
    unlock: { type: "purchase", cost: 120 },
    bonus: { fireRateMul: 1.05 },
    color: "#d4af37",
  },
  {
    id: "hero_pirate",
    category: "hero",
    name: "Capitaine pirate",
    description: "+5% vitesse de déplacement",
    icon: "🏴‍☠️",
    asset: "pirate",
    unlock: { type: "purchase", cost: 200 },
    bonus: { moveSpeedMul: 1.05 },
    color: "#2c1810",
  },

  {
    id: "skin_brigand_slayer",
    category: "hero",
    name: "Pourfendeur du Brigand",
    description: "+5% or par kill — drop du Brigand W1",
    icon: "🗡️",
    asset: "knight",
    bossOverlay: 0xc63a10,
    unlock: { type: "drop", boss: "brigand_boss" },
    bonus: { coinGainMul: 1.05 },
    color: "#c63a10",
  },
  {
    id: "skin_warlord",
    category: "hero",
    name: "Briseur de Seigneur",
    description: "+5% gemmes par boss — drop boss W2",
    icon: "👹",
    asset: "soldier",
    bossOverlay: 0xff7a00,
    unlock: { type: "drop", boss: "warlord_boss" },
    bonus: { gemBonusMul: 1.05 },
    color: "#ff7a00",
  },
  {
    id: "skin_corsair",
    category: "hero",
    name: "Chasseur de Corsaire",
    description: "+5% XP par kill — drop boss W3",
    icon: "⚓",
    asset: "pirate",
    bossOverlay: 0x5fbcff,
    unlock: { type: "drop", boss: "corsair_boss" },
    bonus: { xpMul: 1.05 },
    color: "#5fbcff",
  },
  {
    id: "skin_dragonslayer",
    category: "hero",
    name: "Pourfendeur de Dragon",
    description: "+5% PV château — drop boss W4",
    icon: "🐉",
    asset: "knightgolden",
    bossOverlay: 0xffd23f,
    unlock: { type: "drop", boss: "dragon_boss" },
    bonus: { castleHPMul: 1.05 },
    color: "#ffd23f",
  },

  {
    id: "castle_default",
    category: "castle",
    name: "Forteresse de pierre",
    description: "Le château d'origine",
    icon: "🏰",
    color: "#dcdcdc",
    roofColor: "#3a6abf",
    unlock: { type: "default" },
    bonus: null,
  },
  {
    id: "castle_royal",
    category: "castle",
    name: "Citadelle royale",
    description: "+3% PV château — termine Monde 1 sans perdre de PV",
    icon: "👑",
    color: "#5fbcff",
    roofColor: "#ffd23f",
    unlock: { type: "achievement", id: "perfect_world1" },
    bonus: { castleHPMul: 1.03 },
  },
  {
    id: "castle_obsidian",
    category: "castle",
    name: "Forteresse d'obsidienne",
    description: "+3% PV château — achat",
    icon: "🌑",
    color: "#1a1a2e",
    roofColor: "#6a3aa0",
    unlock: { type: "purchase", cost: 150 },
    bonus: { castleHPMul: 1.03 },
  },

  {
    id: "vfx_default",
    category: "vfx",
    name: "Particules classiques",
    description: "Étincelles rouges au kill",
    icon: "💥",
    killColor: 0xc63a10,
    unlock: { type: "default" },
    bonus: null,
  },
  {
    id: "vfx_golden",
    category: "vfx",
    name: "Pluie d'or",
    description: "+3% or par kill — achat",
    icon: "🌟",
    killColor: 0xffd23f,
    unlock: { type: "purchase", cost: 100 },
    bonus: { coinGainMul: 1.03 },
  },
  {
    id: "vfx_lightning",
    category: "vfx",
    name: "Foudre céleste",
    description: "+3% cadence hero — tue 100 ennemis",
    icon: "⚡",
    killColor: 0xaae5ff,
    unlock: { type: "achievement", id: "kills_100" },
    bonus: { fireRateMul: 1.03 },
  },
];

export const SKIN_BY_ID = Object.fromEntries(SKINS.map((s) => [s.id, s]));

export function getSkinsByCategory(cat) {
  return SKINS.filter((s) => s.category === cat);
}

export function getDefaultSkinId(cat) {
  return SKINS.find((s) => s.category === cat && s.unlock.type === "default")?.id || null;
}

export function isSkinUnlocked(skinId, save) {
  const s = SKIN_BY_ID[skinId];
  if (!s) return false;
  if (s.unlock.type === "default") return true;
  return save.isSkinOwned(skinId);
}

export function computeSkinBonuses(save) {
  const ctx = {};
  for (const cat of Object.keys(SKIN_CATEGORIES)) {
    const id = save.getEquippedSkin(cat) || getDefaultSkinId(cat);
    const s = SKIN_BY_ID[id];
    if (!s || !s.bonus) continue;
    for (const [key, val] of Object.entries(s.bonus)) {
      if (key.endsWith("Mul")) {
        ctx[key] = (ctx[key] || 1) * val;
      } else {
        ctx[key] = (ctx[key] || 0) + val;
      }
    }
  }
  return ctx;
}
