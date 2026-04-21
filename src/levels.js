export const OBJECTIVE_TYPES = {
  skeleton: { hookName: "onSkeleton" },
  revive: { hookName: "onRevive" },
  coin: { hookName: "onCoin" },
  wagon: { hookName: "onWagonSpawn" },
  catapult: { hookName: "onCatapult" },
  chain: { hookName: "onChain" },
  loop: { hookName: "onLoop" },
  constellation: { hookName: "onConstellation" },
  apocalypse: { hookName: "onApocalypse" },
  geyser: { hookName: "onGeyser" },
  score: { hookName: "onScore" },
  portalUse: { hookName: "onPortalUse" },
};

export const LEVELS = [
  {
    id: "1-1",
    world: 1,
    title: "Premier wagon",
    hint: "Pose de la LAVE 🔥 sur le rail. Un wagon qui touche la lave devient squelette.",
    layout: "v2:3.13.R,4.13.R,5.13.R,6.13.R,7.13.R,8.13.R,9.13.R,10.13.R,11.13.R,12.13.R,13.13.R,14.13.R,15.13.R,16.13.R",
    wagonSpawn: { col: 1, row: 13, cap: 1, auto: true, interval: 6 },
    playerSpawn: { col: 4, row: 13 },
    allowedTools: ["lava", "erase"],
    tileBudget: 6,
    objectives: [
      { id: "skel1", type: "skeleton", target: 1, label: "Transforme 1 wagon en squelette" },
    ],
    stars: {
      time: { under: 45 },
      efficient: { tilesUnder: 2 },
    },
    timeLimit: 120,
  },
  {
    id: "1-2",
    world: 1,
    title: "Le sauveur",
    hint: "Pose de l'EAU 💧 APRÈS la lave 🔥. Un squelette qui traverse l'eau redevient vivant.",
    layout: "v2:3.13.R,4.13.R,5.13.R,6.13.R,7.13.R,8.13.R,9.13.R,10.13.R,11.13.R,12.13.R,13.13.R,14.13.R,15.13.R,16.13.R,10.12.L",
    wagonSpawn: { col: 1, row: 13, cap: 1, auto: true, interval: 6 },
    playerSpawn: { col: 4, row: 13 },
    allowedTools: ["water", "erase"],
    tileBudget: 6,
    objectives: [
      { id: "revive1", type: "revive", target: 1, label: "Ressuscite 1 squelette" },
    ],
    stars: {
      time: { under: 60 },
      efficient: { tilesUnder: 2 },
    },
    timeLimit: 150,
  },
  {
    id: "1-3",
    world: 1,
    title: "La collecte",
    hint: "Pose des PIÈCES 🪙 sur le chemin du wagon. Il les ramasse en passant dessus.",
    layout: "v2:3.13.R,4.13.R,5.13.R,6.13.R,7.13.R,8.13.R,9.13.R,10.13.R,11.13.R,12.13.R,13.13.R,14.13.R,15.13.R,16.13.R",
    wagonSpawn: { col: 1, row: 13, cap: 1, auto: true, interval: 6 },
    playerSpawn: { col: 4, row: 13 },
    allowedTools: ["coin", "erase"],
    tileBudget: 8,
    objectives: [
      { id: "coin5", type: "coin", target: 5, label: "Collecte 5 pièces" },
    ],
    stars: {
      time: { under: 40 },
      efficient: { tilesUnder: 5 },
    },
    timeLimit: 120,
  },
  {
    id: "1-4",
    world: 1,
    title: "Catapulte",
    hint: "Un TRAMPOLINE 🎪 avec un VENTILATEUR 🌀 juste au-dessus catapulte le wagon très haut.",
    layout: "v2:3.13.R,4.13.R,5.13.R,6.13.R,7.13.R,8.13.R,9.13.R,10.13.R,11.13.R,12.13.R,13.13.R,14.13.R,15.13.R,16.13.R",
    wagonSpawn: { col: 1, row: 13, cap: 1, auto: true, interval: 7 },
    playerSpawn: { col: 4, row: 13 },
    allowedTools: ["trampoline", "fan", "erase"],
    tileBudget: 6,
    objectives: [
      { id: "cata1", type: "catapult", target: 1, label: "Catapulte 1 wagon" },
    ],
    stars: {
      time: { under: 60 },
      efficient: { tilesUnder: 3 },
    },
    timeLimit: 150,
  },
  {
    id: "1-5",
    world: 1,
    title: "La boucle",
    hint: "Pose une RAIL LOOP ⭕ sur le rail. Le wagon fait un 360° complet.",
    layout: "v2:3.13.R,4.13.R,5.13.R,6.13.R,7.13.R,8.13.R,9.13.R,10.13.R,11.13.R,12.13.R,13.13.R,14.13.R,15.13.R,16.13.R",
    wagonSpawn: { col: 1, row: 13, cap: 1, auto: true, interval: 7 },
    playerSpawn: { col: 4, row: 13 },
    allowedTools: ["rail_loop", "boost", "erase"],
    tileBudget: 4,
    objectives: [
      { id: "loop1", type: "loop", target: 1, label: "Complète 1 looping" },
    ],
    stars: {
      time: { under: 45 },
      efficient: { tilesUnder: 2 },
    },
    timeLimit: 120,
  },

  // MONDE 2 — Combos (débloqué à 7⭐)
  {
    id: "2-1",
    world: 2,
    title: "Triple incinération",
    hint: "Transforme 3 wagons en squelettes avec ta LAVE 🔥. Cumule les pas­sages.",
    layout: "v2:3.13.R,4.13.R,5.13.R,6.13.R,7.13.R,8.13.R,9.13.R,10.13.R,11.13.R,12.13.R,13.13.R,14.13.R,15.13.R,16.13.R",
    wagonSpawn: { col: 1, row: 13, cap: 2, auto: true, interval: 5 },
    playerSpawn: { col: 4, row: 13 },
    allowedTools: ["lava", "erase"],
    tileBudget: 5,
    objectives: [
      { id: "skel3", type: "skeleton", target: 3, label: "Transforme 3 wagons" },
    ],
    stars: { time: { under: 60 }, efficient: { tilesUnder: 2 } },
    timeLimit: 180,
  },
  {
    id: "2-2",
    world: 2,
    title: "Cycle de vie",
    hint: "Alterne LAVE 🔥 (transforme) et EAU 💧 (ressuscite). Réussis 2 cycles complets.",
    layout: "v2:3.13.R,4.13.R,5.13.R,6.13.R,7.13.R,8.13.R,9.13.R,10.13.R,11.13.R,12.13.R,13.13.R,14.13.R,15.13.R,16.13.R",
    wagonSpawn: { col: 1, row: 13, cap: 1, auto: true, interval: 6 },
    playerSpawn: { col: 4, row: 13 },
    allowedTools: ["lava", "water", "erase"],
    tileBudget: 6,
    objectives: [
      { id: "skel2", type: "skeleton", target: 2, label: "Transforme 2 wagons" },
      { id: "rev2", type: "revive", target: 2, label: "Ressuscite 2 squelettes" },
    ],
    stars: { time: { under: 90 }, efficient: { tilesUnder: 4 } },
    timeLimit: 180,
  },
  {
    id: "2-3",
    world: 2,
    title: "Acrobate",
    hint: "1 CATAPULTE (🎪 + 🌀 au-dessus) + 1 LOOPING ⭕. Deux acrobaties dans un même run.",
    layout: "v2:3.13.R,4.13.R,5.13.R,6.13.R,7.13.R,8.13.R,9.13.R,10.13.R,11.13.R,12.13.R,13.13.R,14.13.R,15.13.R,16.13.R",
    wagonSpawn: { col: 1, row: 13, cap: 1, auto: true, interval: 7 },
    playerSpawn: { col: 4, row: 13 },
    allowedTools: ["rail_loop", "trampoline", "fan", "boost", "erase"],
    tileBudget: 6,
    objectives: [
      { id: "cata1", type: "catapult", target: 1, label: "Catapulte 1 wagon" },
      { id: "loop1", type: "loop", target: 1, label: "Complète 1 looping" },
    ],
    stars: { time: { under: 75 }, efficient: { tilesUnder: 4 } },
    timeLimit: 180,
  },
  {
    id: "2-4",
    world: 2,
    title: "Grand angle",
    hint: "Collecte 10 PIÈCES 🪙. Les rails UP ↗ et DOWN ↘ t'aident à atteindre la hauteur.",
    layout: "v2:3.13.R,4.13.R,5.13.R,6.13.R,7.13.R,8.13.R,9.13.R,10.13.R,11.13.R,12.13.R,13.13.R,14.13.R,15.13.R,16.13.R",
    wagonSpawn: { col: 1, row: 13, cap: 2, auto: true, interval: 5 },
    playerSpawn: { col: 4, row: 13 },
    allowedTools: ["coin", "rail_up", "rail_down", "erase"],
    tileBudget: 14,
    objectives: [
      { id: "coin10", type: "coin", target: 10, label: "Collecte 10 pièces" },
    ],
    stars: { time: { under: 75 }, efficient: { tilesUnder: 10 } },
    timeLimit: 180,
  },
  {
    id: "2-5",
    world: 2,
    title: "Apocalypse",
    hint: "APOCALYPSE = 5 transformations LAVE 🔥 en moins de 2.5s. Prépare plusieurs flaques alignées.",
    layout: "v2:3.13.R,4.13.R,5.13.R,6.13.R,7.13.R,8.13.R,9.13.R,10.13.R,11.13.R,12.13.R,13.13.R,14.13.R,15.13.R,16.13.R",
    wagonSpawn: { col: 1, row: 13, cap: 3, auto: true, interval: 3 },
    playerSpawn: { col: 4, row: 13 },
    allowedTools: ["lava", "boost", "erase"],
    tileBudget: 10,
    objectives: [
      { id: "apo1", type: "apocalypse", target: 1, label: "Déclenche 1 apocalypse (x5)" },
    ],
    stars: { time: { under: 90 }, efficient: { tilesUnder: 6 } },
    timeLimit: 210,
  },

  // MONDE 3 — Challenges contraintes (débloqué à 15⭐)
  {
    id: "3-1",
    world: 3,
    title: "Minimaliste",
    hint: "5 squelettes avec seulement 4 tuiles LAVE 🔥. Une flaque peut transformer plusieurs wagons !",
    layout: "v2:3.13.R,4.13.R,5.13.R,6.13.R,7.13.R,8.13.R,9.13.R,10.13.R,11.13.R,12.13.R,13.13.R,14.13.R,15.13.R,16.13.R",
    wagonSpawn: { col: 1, row: 13, cap: 2, auto: true, interval: 4 },
    playerSpawn: { col: 4, row: 13 },
    allowedTools: ["lava", "erase"],
    tileBudget: 4,
    objectives: [
      { id: "skel5", type: "skeleton", target: 5, label: "Transforme 5 wagons" },
    ],
    stars: { time: { under: 60 }, efficient: { tilesUnder: 2 } },
    timeLimit: 150,
  },
  {
    id: "3-2",
    world: 3,
    title: "Time trial",
    hint: "10 squelettes en 45 secondes ⏱. BOOST ⚡ accélère les wagons pour plus de passages.",
    layout: "v2:3.13.R,4.13.R,5.13.R,6.13.R,7.13.R,8.13.R,9.13.R,10.13.R,11.13.R,12.13.R,13.13.R,14.13.R,15.13.R,16.13.R",
    wagonSpawn: { col: 1, row: 13, cap: 3, auto: true, interval: 3 },
    playerSpawn: { col: 4, row: 13 },
    allowedTools: ["lava", "boost", "erase"],
    tileBudget: 10,
    objectives: [
      { id: "skel10", type: "skeleton", target: 10, label: "Transforme 10 wagons" },
    ],
    stars: { time: { under: 30 }, efficient: { tilesUnder: 6 } },
    timeLimit: 45,
  },
  {
    id: "3-3",
    world: 3,
    title: "Le magot",
    hint: "500 points. Pièces 🪙 (+5) et squelettes 🔥 (+10) comptent. Les combos multiplient !",
    layout: "v2:3.13.R,4.13.R,5.13.R,6.13.R,7.13.R,8.13.R,9.13.R,10.13.R,11.13.R,12.13.R,13.13.R,14.13.R,15.13.R,16.13.R",
    wagonSpawn: { col: 1, row: 13, cap: 2, auto: true, interval: 4 },
    playerSpawn: { col: 4, row: 13 },
    allowedTools: ["lava", "water", "coin", "boost", "erase"],
    tileBudget: 12,
    objectives: [
      { id: "score500", type: "score", target: 500, label: "Atteins 500 points" },
    ],
    stars: { time: { under: 90 }, efficient: { tilesUnder: 8 } },
    timeLimit: 180,
  },
  {
    id: "3-4",
    world: 3,
    title: "Le cirque",
    hint: "3 catapultes + 3 loopings dans une même partie.",
    layout: "v2:3.13.R,4.13.R,5.13.R,6.13.R,7.13.R,8.13.R,9.13.R,10.13.R,11.13.R,12.13.R,13.13.R,14.13.R,15.13.R,16.13.R",
    wagonSpawn: { col: 1, row: 13, cap: 2, auto: true, interval: 4 },
    playerSpawn: { col: 4, row: 13 },
    allowedTools: ["rail_loop", "trampoline", "fan", "boost", "erase"],
    tileBudget: 12,
    objectives: [
      { id: "cata3", type: "catapult", target: 3, label: "Catapulte 3 wagons" },
      { id: "loop3", type: "loop", target: 3, label: "Complète 3 loopings" },
    ],
    stars: { time: { under: 120 }, efficient: { tilesUnder: 8 } },
    timeLimit: 210,
  },
  {
    id: "3-5",
    world: 3,
    title: "Maître forain",
    hint: "1000 points. Utilise tous tes outils. Temps serré.",
    layout: "v2:3.13.R,4.13.R,5.13.R,6.13.R,7.13.R,8.13.R,9.13.R,10.13.R,11.13.R,12.13.R,13.13.R,14.13.R,15.13.R,16.13.R",
    wagonSpawn: { col: 1, row: 13, cap: 3, auto: true, interval: 3 },
    playerSpawn: { col: 4, row: 13 },
    allowedTools: ["lava", "water", "coin", "boost", "rail_loop", "trampoline", "fan", "erase"],
    tileBudget: 16,
    objectives: [
      { id: "score1k", type: "score", target: 1000, label: "Atteins 1000 points" },
    ],
    stars: { time: { under: 90 }, efficient: { tilesUnder: 10 } },
    timeLimit: 180,
  },
];

export function findLevel(id) {
  return LEVELS.find((l) => l.id === id) || null;
}

export function nextLevelId(id) {
  const i = LEVELS.findIndex((l) => l.id === id);
  if (i === -1 || i === LEVELS.length - 1) return null;
  return LEVELS[i + 1].id;
}

export function levelsByWorld() {
  const grouped = new Map();
  for (const lvl of LEVELS) {
    if (!grouped.has(lvl.world)) grouped.set(lvl.world, []);
    grouped.get(lvl.world).push(lvl);
  }
  return grouped;
}
