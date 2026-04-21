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
    hint: "Pose de la lave sur le rail. Le wagon se transformera en squelette.",
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
    hint: "Après la lave, pose de l'eau : le squelette reviendra à la vie.",
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
    hint: "Pose des pièces sur le rail. Le wagon les ramassera.",
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
    hint: "Trampoline + ventilateur = le wagon s'envole.",
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
    hint: "Rail loop = 360° complet + bonus de 50 points.",
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
