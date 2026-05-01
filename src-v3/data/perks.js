export const PERKS = [
  {
    id: "range",
    name: "Œil de l'aigle",
    icon: "🎯",
    description: "Portée du Roi +30%",
    category: "offensive",
    stackable: true,
    range: 0.3,
  },
  {
    id: "fire_rate",
    name: "Doigts vifs",
    icon: "⚡",
    description: "Cadence de tir +25%",
    category: "offensive",
    stackable: true,
    fireRate: 0.25,
  },
  {
    id: "damage",
    name: "Frappe puissante",
    icon: "💥",
    description: "Dégâts +35% (max 2)",
    category: "offensive",
    stackable: true,
    maxStacks: 2,
    damage: 0.35,
  },
  {
    id: "multi_shot",
    name: "Tir double",
    icon: "🏹",
    description: "Tire 2 projectiles en éventail",
    category: "offensive",
    stackable: false,
    multiShot: 1,
  },
  {
    id: "crit",
    name: "Coup critique",
    icon: "🎲",
    description: "Touche critique : +150% dmg + stagger 0.3s",
    category: "offensive",
    stackable: true,
    critChance: 0.20,
    critMul: 2.5,
    critStaggerMs: 300,
  },
  {
    id: "pierce",
    name: "Flèche perçante",
    icon: "📌",
    description: "Les projectiles traversent +1 ennemi",
    category: "offensive",
    stackable: true,
    pierceCount: 1,
  },
  {
    id: "coin_gain",
    name: "Pillage royal",
    icon: "🪙",
    description: "Or par kill +50% (une seule fois)",
    category: "economy",
    stackable: false,
    coinGain: 0.5,
  },
  {
    id: "lifesteal",
    name: "Pacte du sang",
    icon: "❤️",
    description: "+1 HP au château par kill",
    category: "economy",
    stackable: true,
    lifesteal: 1,
  },
  {
    id: "move_speed",
    name: "Frappe en mouvement",
    icon: "👟",
    description: "Tirs en mouvement +1 pierce",
    category: "mobility",
    stackable: true,
    moveAttackPierceBonus: 1,
  },
  {
    id: "wave_regen",
    name: "Bénédiction royale",
    icon: "🛡️",
    description: "+5 HP au château à la fin de chaque vague",
    category: "economy",
    stackable: false,
    waveRegen: 5,
  },
  {
    id: "fireball",
    name: "Boule de feu",
    icon: "🔥",
    description: "Tes tirs explosent en AoE (radius 3u, -20% dmg par cible)",
    category: "transform",
    stackable: false,
    fireball: true,
    transform: true,
    fireballRadius: 3,
    fireballDmgMul: 0.8,
  },
  {
    id: "ricochet",
    name: "Chaîne",
    icon: "🔗",
    description: "Tes tirs rebondissent vers 3 ennemis (-15% dmg par bounce)",
    category: "transform",
    stackable: false,
    ricochet: true,
    transform: true,
    ricochetBounces: 3,
    ricochetDecay: 0.85,
  },
  {
    id: "lightning",
    name: "Foudre divine",
    icon: "⚡",
    description: "Chaque tir frappe 2 ennemis random à portée",
    category: "transform",
    stackable: false,
    lightning: true,
    transform: true,
    lightningTargets: 2,
    lightningDmgMul: 0.7,
  },
  {
    id: "pierce_explode",
    name: "Carreau explosif",
    icon: "💣",
    description: "Le projectile explose en touchant son dernier ennemi (AoE 2u)",
    category: "transform",
    stackable: false,
    pierceExplode: true,
    transform: true,
    pierceExplodeRadius: 2,
    pierceExplodeDmgMul: 1.0,
  },
];

export function rollPerkChoices(hero, count = 3, totalLevelUpsLeft = 5) {
  const available = PERKS.filter((p) => {
    if (!p.stackable) return !hero.perks.includes(p.id);
    if (p.maxStacks != null) {
      const stacks = hero.perks.filter((id) => id === p.id).length;
      return stacks < p.maxStacks;
    }
    return true;
  });
  if (!available.length) return [];

  const hasTransform = hero.perks.some((id) => PERKS.find((p) => p.id === id && p.transform));
  const lastChance = totalLevelUpsLeft <= 1;

  if (!hasTransform && lastChance) {
    const availTransforms = available.filter((p) => p.transform);
    if (availTransforms.length > 0) {
      const guaranteed = availTransforms[Math.floor(Math.random() * availTransforms.length)];
      const others = available.filter((p) => !p.transform);
      for (let i = others.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [others[i], others[j]] = [others[j], others[i]];
      }
      return [guaranteed, ...others.slice(0, Math.max(0, count - 1))];
    }
  }

  const shuffled = [...available];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

export function getPerkById(id) {
  return PERKS.find((p) => p.id === id) || null;
}
