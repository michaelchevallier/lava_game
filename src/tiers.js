// Tier system = tutoriel progressif. Chaque tier ne demande QUE des actions
// faisables avec les tuiles déjà débloquées (tier courant ou inférieur).
// Jusqu'à 5 objectifs par tier — focus sur découverte mécaniques + interactions.

const TIERS = [
  {
    // Tier 0 — DÉCOUVRIR : tools de base + lava + rail + coin disponibles
    title: "Bienvenue !",
    objectives: [],
    unlocks: ["lava", "rail", "rail_up", "rail_down", "erase", "sol", "coin"],
  },
  {
    // Tier 1 — DÉCOUVRIR LE WAGON : poser tuiles, faire spawner wagon (touche X)
    title: "Le Premier Wagon",
    objectives: [
      { id: "tile5", label: "Poser 5 tuiles (clic souris)", target: 5, hook: "tile" },
      { id: "wagon1", label: "Spawner 1 wagon (touche X)", target: 1, hook: "wagon" },
      { id: "skel1", label: "Faire 1 squelette (wagon dans lava)", target: 1, hook: "skeleton" },
    ],
    unlocks: ["water", "boost"],
  },
  {
    // Tier 2 — DÉCOUVRIR L'EAU : eau revive squelette (water adjacent skeleton)
    title: "L'Eau Salvatrice",
    objectives: [
      { id: "tile-water1", label: "Poser 1 tuile EAU", target: 1, hook: "tileWater" },
      { id: "tile-boost1", label: "Poser 1 tuile BOOST", target: 1, hook: "tileBoost" },
      { id: "skel5", label: "Faire 5 squelettes", target: 5, hook: "skeleton" },
      { id: "score100", label: "Atteindre 100 pts", target: 100, hook: "score" },
    ],
    unlocks: ["trampoline", "fan"],
  },
  {
    // Tier 3 — DÉCOUVRIR LE TRAMPOLINE : faire sauter le wagon (trampoline + fan combine)
    title: "Trampoline & Vent",
    objectives: [
      { id: "tile-tramp1", label: "Poser 1 TRAMPOLINE", target: 1, hook: "tileTramp" },
      { id: "tile-fan1", label: "Poser 1 VENTILATEUR", target: 1, hook: "tileFan" },
      { id: "skel15cum", label: "15 squelettes cumul", target: 15, hook: "skeletonCum" },
      { id: "score250", label: "Atteindre 250 pts", target: 250, hook: "score" },
      { id: "tile15", label: "Poser 15 tuiles au total", target: 15, hook: "tile" },
    ],
    unlocks: ["portal", "ice"],
  },
  {
    // Tier 4 — DÉCOUVRIR LE PORTAIL : 2 portails créent une paire (téléport)
    title: "Portails & Glace",
    objectives: [
      { id: "tile-portal2", label: "Poser 2 PORTAILS (paire)", target: 2, hook: "tilePortal" },
      { id: "tile-ice1", label: "Poser 1 GLACE", target: 1, hook: "tileIce" },
      { id: "skel30cum", label: "30 squelettes cumul", target: 30, hook: "skeletonCum" },
      { id: "score500", label: "Atteindre 500 pts", target: 500, hook: "score" },
    ],
    unlocks: ["magnet", "bridge"],
  },
  {
    // Tier 5 — COMBOS : magnet adjacent portal = vortex !
    title: "Le Vortex Magnetique",
    objectives: [
      { id: "tile-magnet1", label: "Poser 1 AIMANT", target: 1, hook: "tileMagnet" },
      { id: "tile-bridge1", label: "Poser 1 PONT", target: 1, hook: "tileBridge" },
      { id: "score1000", label: "Atteindre 1000 pts", target: 1000, hook: "score" },
      { id: "skel50cum", label: "50 squelettes cumul", target: 50, hook: "skeletonCum" },
      { id: "tile30", label: "Poser 30 tuiles au total", target: 30, hook: "tile" },
    ],
    unlocks: ["wheel", "rail_loop"],
  },
  {
    // Tier 6 — LOOP & ROUE : enfin disponibles (loop débloqué)
    title: "Looping & Grande Roue",
    objectives: [
      { id: "tile-wheel1", label: "Poser 1 GRANDE ROUE", target: 1, hook: "tileWheel" },
      { id: "tile-loop1", label: "Poser 1 RAIL LOOP", target: 1, hook: "tileLoop" },
      { id: "loop1", label: "Completer 1 loop (wagon traverse)", target: 1, hook: "loop" },
      { id: "score2000", label: "Atteindre 2000 pts", target: 2000, hook: "score" },
      { id: "skel100cum", label: "100 squelettes cumul", target: 100, hook: "skeletonCum" },
    ],
    unlocks: ["tunnel"],
  },
  {
    // Tier 7 — ULTIME : tout débloqué, défis ultimes
    title: "Maitre Forain",
    objectives: [
      { id: "tile-tunnel1", label: "Poser 1 TUNNEL HANTE", target: 1, hook: "tileTunnel" },
      { id: "score5000", label: "Atteindre 5000 pts", target: 5000, hook: "score" },
      { id: "catapult1", label: "Catapulter 1 wagon (trampo+fan)", target: 1, hook: "catapult" },
      { id: "duck5", label: "Pecher 5 canards", target: 5, hook: "duck" },
      { id: "bridge-break1", label: "Casser 1 pont (2 wagons)", target: 1, hook: "bridge" },
    ],
    unlocks: [],
  },
];

export function createTierSystem({ k, save, persistSave, gameState, audio, showPopup, WIDTH }) {
  if (save.tier === undefined) save.tier = 0;
  if (!save.tierProgress) save.tierProgress = {};
  if (save.unlockedAll === undefined) save.unlockedAll = false;

  const unlockedTiles = new Set();

  function rebuildUnlocked() {
    unlockedTiles.clear();
    if (save.unlockedAll) {
      for (const t of TIERS) for (const u of t.unlocks) unlockedTiles.add(u);
      return;
    }
    for (let i = 0; i <= save.tier; i++) {
      for (const u of TIERS[i].unlocks) unlockedTiles.add(u);
    }
  }
  rebuildUnlocked();

  function isUnlocked(toolName) {
    if (toolName === "dig") return true;
    return unlockedTiles.has(toolName);
  }

  function unlockAll() {
    save.unlockedAll = true;
    persistSave(save);
    rebuildUnlocked();
    showPopup?.(WIDTH / 2, 80, "TOUTES LES TUILES DEBLOQUEES !", k.rgb(255, 215, 60), 22);
    audio.combo?.();
  }

  function checkAndAdvanceTier() {
    if (save.unlockedAll) return;
    const nextIdx = save.tier + 1;
    if (nextIdx >= TIERS.length) return;
    const nextTier = TIERS[nextIdx];
    if (!nextTier || nextTier.objectives.length === 0) return;
    const allDone = nextTier.objectives.every(obj => (save.tierProgress[obj.id] || 0) >= obj.target);
    if (allDone) {
      save.tier = nextIdx;
      const tier = TIERS[save.tier];
      const newTiles = tier.unlocks.length > 0 ? tier.unlocks.map(t => t.toUpperCase()).join(", ") : "Aucune (TIER MAX)";
      // Célébration spectaculaire via cinematic system
      const cinKey = `tier${save.tier}`;
      window.__cinematic?.play?.(cinKey, `TIER ${save.tier} - ${tier.title || ""}`);
      // Showpopup secondaire avec liste tuiles
      setTimeout(() => {
        showPopup?.(WIDTH / 2, 220, `Debloque : ${newTiles}`, k.rgb(120, 220, 120), 20);
      }, 800);
      audio.combo?.();
      audio.gold?.();
      rebuildUnlocked();
      persistSave(save);
    }
  }

  function increment(hook, amount = 1) {
    if (save.unlockedAll) return;
    const nextIdx = save.tier + 1;
    if (nextIdx >= TIERS.length) return;
    const nextTier = TIERS[nextIdx];
    if (!nextTier) return;
    for (const obj of nextTier.objectives) {
      if (obj.hook !== hook) continue;
      const cur = save.tierProgress[obj.id] || 0;
      if (cur >= obj.target) continue;
      save.tierProgress[obj.id] = Math.min(obj.target, cur + amount);
    }
    persistSave(save);
    checkAndAdvanceTier();
  }

  function setScore(score) {
    if (save.unlockedAll) return;
    const nextIdx = save.tier + 1;
    if (nextIdx >= TIERS.length) return;
    const nextTier = TIERS[nextIdx];
    if (!nextTier) return;
    let changed = false;
    for (const obj of nextTier.objectives) {
      if (obj.hook !== "score") continue;
      const cur = save.tierProgress[obj.id] || 0;
      const newVal = Math.min(obj.target, score);
      if (newVal > cur) {
        save.tierProgress[obj.id] = newVal;
        changed = true;
      }
    }
    if (changed) {
      persistSave(save);
      checkAndAdvanceTier();
    }
  }

  function setSkeletonCumul(totalSkel) {
    if (save.unlockedAll) return;
    const nextIdx = save.tier + 1;
    if (nextIdx >= TIERS.length) return;
    const nextTier = TIERS[nextIdx];
    if (!nextTier) return;
    let changed = false;
    for (const obj of nextTier.objectives) {
      if (obj.hook !== "skeletonCum") continue;
      const cur = save.tierProgress[obj.id] || 0;
      const newVal = Math.min(obj.target, totalSkel);
      if (newVal > cur) {
        save.tierProgress[obj.id] = newVal;
        changed = true;
      }
    }
    if (changed) {
      persistSave(save);
      checkAndAdvanceTier();
    }
  }

  function getCurrentObjectives() {
    if (save.unlockedAll) return [];
    const nextIdx = save.tier + 1;
    const nextTier = TIERS[nextIdx];
    if (!nextTier) return [];
    return nextTier.objectives.map(obj => ({
      ...obj,
      progress: save.tierProgress[obj.id] || 0,
      done: (save.tierProgress[obj.id] || 0) >= obj.target,
    }));
  }

  function getCurrentTier() { return save.tier; }
  function getMaxTier() { return TIERS.length - 1; }

  return {
    isUnlocked,
    unlockAll,
    increment,
    setScore,
    getCurrentObjectives,
    getCurrentTier,
    getMaxTier,
    onSkeleton: () => increment("skeleton"),
    onCoin: () => increment("coin"),
    onTilePlace: (type) => {
      increment("tile");
      // Hooks par type pour les objectifs "Poser 1 X"
      const TYPE_HOOK = {
        water: "tileWater",
        boost: "tileBoost",
        trampoline: "tileTramp",
        fan: "tileFan",
        portal: "tilePortal",
        ice: "tileIce",
        magnet: "tileMagnet",
        bridge: "tileBridge",
        wheel: "tileWheel",
        rail_loop: "tileLoop",
        tunnel: "tileTunnel",
        coin: "tileCoin",
        lava: "tileLava",
        rail: "tileRail",
        rail_up: "railDiag",
        rail_down: "railDiag",
      };
      const hook = TYPE_HOOK[type];
      if (hook) increment(hook);
      // Legacy
      if (type === "trampoline") increment("trampoline");
    },
    onWagonSpawn: () => increment("wagon"),
    onLoop: () => increment("loop"),
    onCatapult: () => increment("catapult"),
    onBridgeBreak: () => increment("bridge"),
    onDuck: () => increment("duck"),
    onScore: setScore,
    onSkeletonCumul: (totalSkel) => setSkeletonCumul(totalSkel),
  };
}

export { TIERS };
