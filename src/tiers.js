const TIERS = [
  {
    objectives: [],
    unlocks: ["lava", "rail", "erase", "sol"],
  },
  {
    objectives: [
      { id: "skel10", label: "Faire 10 squelettes", target: 10, hook: "skeleton" },
      { id: "tile10", label: "Poser 10 tuiles", target: 10, hook: "tile" },
      { id: "coin5", label: "Collecter 5 pieces", target: 5, hook: "coin" },
    ],
    unlocks: ["water", "coin"],
  },
  {
    objectives: [
      { id: "skel20cum", label: "20 squelettes cumul", target: 20, hook: "skeletonCum" },
      { id: "score200", label: "Atteindre 200 pts", target: 200, hook: "score" },
      { id: "rail5", label: "Poser 5 rails diagonaux", target: 5, hook: "railDiag" },
    ],
    unlocks: ["rail_up", "rail_down"],
  },
  {
    objectives: [
      { id: "score500", label: "Atteindre 500 pts", target: 500, hook: "score" },
      { id: "wagon3", label: "Spawner 3 wagons", target: 3, hook: "wagon" },
      { id: "tramp1", label: "Poser 1 trampoline", target: 1, hook: "trampoline" },
    ],
    unlocks: ["boost", "trampoline"],
  },
  {
    objectives: [
      { id: "score1000", label: "Atteindre 1000 pts", target: 1000, hook: "score" },
      { id: "loop1", label: "Completer 1 loop", target: 1, hook: "loop" },
      { id: "tile20more", label: "Poser 20 tuiles de plus", target: 20, hook: "tile" },
    ],
    unlocks: ["fan", "portal"],
  },
  {
    objectives: [
      { id: "score2000", label: "Atteindre 2000 pts", target: 2000, hook: "score" },
      { id: "tile30more", label: "Poser 30 tuiles", target: 30, hook: "tile" },
      { id: "catapult1", label: "Catapulter 1 wagon", target: 1, hook: "catapult" },
    ],
    unlocks: ["ice", "magnet"],
  },
  {
    objectives: [
      { id: "score5000", label: "Atteindre 5000 pts", target: 5000, hook: "score" },
      { id: "bridge1", label: "Casser 1 pont", target: 1, hook: "bridge" },
      { id: "duck5", label: "Pecher 5 canards", target: 5, hook: "duck" },
    ],
    unlocks: ["bridge", "wheel", "rail_loop", "tunnel"],
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
