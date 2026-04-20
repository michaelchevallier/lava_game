const TIERS = [
  {
    // Tier 0 : tools de base + COIN (essential pour scoring) + rail_up/down (essentiel pour la diversite)
    objectives: [],
    unlocks: ["lava", "rail", "rail_up", "rail_down", "erase", "sol", "coin"],
  },
  {
    objectives: [
      { id: "skel5", label: "Faire 5 squelettes", target: 5, hook: "skeleton" },
      { id: "tile10", label: "Poser 10 tuiles", target: 10, hook: "tile" },
      { id: "wagon3", label: "Spawner 3 wagons", target: 3, hook: "wagon" },
    ],
    unlocks: ["water", "boost"],
  },
  {
    objectives: [
      { id: "skel15cum", label: "15 squelettes cumul", target: 15, hook: "skeletonCum" },
      { id: "score200", label: "Atteindre 200 pts", target: 200, hook: "score" },
      { id: "tile20", label: "Poser 20 tuiles", target: 20, hook: "tile" },
    ],
    unlocks: ["trampoline", "fan"],
  },
  {
    objectives: [
      { id: "score500", label: "Atteindre 500 pts", target: 500, hook: "score" },
      { id: "skel30cum", label: "30 squelettes cumul", target: 30, hook: "skeletonCum" },
      { id: "tramp1", label: "Poser 1 trampoline", target: 1, hook: "trampoline" },
    ],
    unlocks: ["portal", "ice"],
  },
  {
    objectives: [
      { id: "score1000", label: "Atteindre 1000 pts", target: 1000, hook: "score" },
      { id: "tile40", label: "Poser 40 tuiles", target: 40, hook: "tile" },
      { id: "skel50cum", label: "50 squelettes cumul", target: 50, hook: "skeletonCum" },
    ],
    unlocks: ["magnet", "bridge"],
  },
  {
    objectives: [
      { id: "score2000", label: "Atteindre 2000 pts", target: 2000, hook: "score" },
      { id: "skel100cum", label: "100 squelettes cumul", target: 100, hook: "skeletonCum" },
      { id: "loop1", label: "Completer 1 loop", target: 1, hook: "loop" },
    ],
    unlocks: ["wheel", "rail_loop"],
  },
  {
    objectives: [
      { id: "score5000", label: "Atteindre 5000 pts", target: 5000, hook: "score" },
      { id: "catapult1", label: "Catapulter 1 wagon", target: 1, hook: "catapult" },
      { id: "duck5", label: "Pecher 5 canards", target: 5, hook: "duck" },
    ],
    unlocks: ["tunnel"],
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
      const newTiles = tier.unlocks.map(t => t.toUpperCase()).join(", ");
      showPopup?.(WIDTH / 2, 100, `TIER ${save.tier} ! Debloque : ${newTiles}`, k.rgb(255, 200, 80), 18);
      audio.combo?.();
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
      if (type === "rail_up" || type === "rail_down") increment("railDiag");
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
