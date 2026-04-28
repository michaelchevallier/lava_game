export const UPGRADE_TIERS = {
  1: { name: "Tier 1", unlockedAlways: true, unlockHint: "Disponible dès le départ" },
  2: { name: "Tier 2", unlockAfterWorld: 1, unlockHint: "Termine le Monde 1" },
  3: { name: "Tier 3", unlockAfterWorld: 2, unlockHint: "Termine le Monde 2" },
};

export const META_UPGRADES = [
  {
    id: "castle_hp",
    tier: 1,
    category: "combat",
    icon: "🏰",
    name: "Forteresse",
    description: "+10/+20/+30% PV château",
    perLevelLabel: ["+10% PV", "+20% PV", "+30% PV"],
    apply: (lvl, ctx) => {
      const mul = 1 + 0.1 * lvl;
      ctx.castleHPMul = (ctx.castleHPMul || 1) * mul;
    },
  },
  {
    id: "hero_dmg",
    tier: 1,
    category: "combat",
    icon: "⚔️",
    name: "Lame affûtée",
    description: "+10/+20/+30% dégâts hero",
    perLevelLabel: ["+10% dmg", "+20% dmg", "+30% dmg"],
    apply: (lvl, ctx) => {
      ctx.heroDamageMul = (ctx.heroDamageMul || 1) * (1 + 0.1 * lvl);
    },
  },
  {
    id: "coins_start",
    tier: 1,
    category: "economy",
    icon: "💰",
    name: "Bourse pleine",
    description: "+50/+100/+200 or de départ",
    perLevelLabel: ["+50¢", "+100¢", "+200¢"],
    apply: (lvl, ctx) => {
      const bonus = [0, 50, 100, 200][lvl] || 0;
      ctx.startCoinsBonus = (ctx.startCoinsBonus || 0) + bonus;
    },
  },
  {
    id: "xp_boost",
    tier: 1,
    category: "utility",
    icon: "✨",
    name: "Expérience accrue",
    description: "+10/+20/+30% XP par kill",
    perLevelLabel: ["+10% XP", "+20% XP", "+30% XP"],
    apply: (lvl, ctx) => {
      ctx.xpMul = (ctx.xpMul || 1) * (1 + 0.1 * lvl);
    },
  },

  {
    id: "hero_range",
    tier: 2,
    category: "combat",
    icon: "🎯",
    name: "Œil de faucon",
    description: "+10/+20/+30% portée hero",
    perLevelLabel: ["+10% portée", "+20% portée", "+30% portée"],
    apply: (lvl, ctx) => {
      ctx.heroRangeMul = (ctx.heroRangeMul || 1) * (1 + 0.1 * lvl);
    },
  },
  {
    id: "coin_multi",
    tier: 2,
    category: "economy",
    icon: "🪙",
    name: "Marchand prospère",
    description: "+15/+30/+50% or par kill",
    perLevelLabel: ["+15% or", "+30% or", "+50% or"],
    apply: (lvl, ctx) => {
      const bonus = [0, 0.15, 0.30, 0.50][lvl] || 0;
      ctx.coinGainMul = (ctx.coinGainMul || 1) * (1 + bonus);
    },
  },
  {
    id: "perk_reroll",
    tier: 2,
    category: "utility",
    icon: "🎲",
    name: "Re-roll des perks",
    description: "+1/+2/+3 perks proposés au level-up",
    perLevelLabel: ["+1 perk", "+2 perks", "+3 perks"],
    apply: (lvl, ctx) => {
      ctx.perkChoiceCount = (ctx.perkChoiceCount || 3) + lvl;
    },
  },

  {
    id: "hero_fire_rate",
    tier: 3,
    category: "combat",
    icon: "💨",
    name: "Cadence d'enfer",
    description: "+10/+20/+30% cadence hero",
    perLevelLabel: ["+10% cadence", "+20% cadence", "+30% cadence"],
    apply: (lvl, ctx) => {
      ctx.heroFireRateMul = (ctx.heroFireRateMul || 1) * (1 + 0.1 * lvl);
    },
  },
  {
    id: "gem_multi",
    tier: 3,
    category: "economy",
    icon: "💎",
    name: "Aimant à gemmes",
    description: "+25/+50/+100% gemmes par boss",
    perLevelLabel: ["+25%", "+50%", "+100%"],
    apply: (lvl, ctx) => {
      const bonus = [0, 0.25, 0.50, 1.0][lvl] || 0;
      ctx.gemGainMul = (ctx.gemGainMul || 1) * (1 + bonus);
    },
  },
  {
    id: "tower_discount",
    tier: 3,
    category: "utility",
    icon: "🛠️",
    name: "Architecte malin",
    description: "-10/-20/-30% coût upgrades tours",
    perLevelLabel: ["-10% coût", "-20% coût", "-30% coût"],
    apply: (lvl, ctx) => {
      ctx.towerUpgradeDiscount = Math.max(ctx.towerUpgradeDiscount || 0, 0.1 * lvl);
    },
  },
];

export const UPGRADE_COSTS = [5, 15, 40];
export const UPGRADE_MAX_LEVEL = 3;
export const RESET_COST_GEMS = 10;

export function getUpgradeById(id) {
  return META_UPGRADES.find((u) => u.id === id) || null;
}

export function getCostForLevel(level) {
  return UPGRADE_COSTS[level] || 999999;
}

export function isTierUnlocked(tier, save) {
  const t = UPGRADE_TIERS[tier];
  if (!t) return false;
  if (t.unlockedAlways) return true;
  if (t.unlockAfterWorld) {
    const lastLevelOfWorld = `world${t.unlockAfterWorld}-8`;
    return save.isLevelComplete(lastLevelOfWorld);
  }
  return false;
}

export function computeActiveBonuses(save) {
  const ctx = {};
  for (const u of META_UPGRADES) {
    const lvl = save.getUpgradeLevel(u.id);
    if (lvl > 0) u.apply(lvl, ctx);
  }
  return ctx;
}
