function buildEndlessWaves(count = 30) {
  const list = [];
  for (let i = 0; i < count; i++) {
    const tier = Math.floor(i / 5);
    const ratio = 1 + i * 0.18;
    const types = {};
    if (tier === 0) {
      types.basic = Math.round(10 * ratio);
      types.runner = Math.round(6 * ratio);
    } else if (tier === 1) {
      types.basic = Math.round(8 * ratio);
      types.runner = Math.round(10 * ratio);
      types.assassin = Math.round(4 * ratio);
      types.brute = Math.round(3 * ratio);
    } else if (tier === 2) {
      types.runner = Math.round(10 * ratio);
      types.assassin = Math.round(8 * ratio);
      types.flyer = Math.round(6 * ratio);
      types.brute = Math.round(5 * ratio);
      types.shielded = Math.round(4 * ratio);
    } else if (tier === 3) {
      types.flyer = Math.round(12 * ratio);
      types.imp = Math.round(8 * ratio);
      types.assassin = Math.round(8 * ratio);
      types.brute = Math.round(6 * ratio);
      types.shielded = Math.round(5 * ratio);
      if (i % 5 === 4) types.midboss = 1;
    } else {
      types.imp = Math.round(14 * ratio);
      types.flyer = Math.round(12 * ratio);
      types.brute = Math.round(8 * ratio);
      types.shielded = Math.round(6 * ratio);
      if (i % 3 === 0) types.midboss = 1;
    }
    list.push({
      types,
      spawnRateMs: Math.max(220, 480 - i * 8),
      breakMs: 3500,
    });
  }
  return list;
}

export default {
  id: "endless",
  name: "Endless",
  theme: "plaine",
  pathPoints: [
    [-15, 0, -8], [-9, 0, -2], [-5, 0, -7], [0, 0, -3],
    [4, 0, -8], [8, 0, -2], [6, 0, 4], [2, 0, 6],
  ],
  slots: [
    { t: 0.14, cost: 30, lateralOffset: 2.4, towerType: "archer" },
    { t: 0.30, cost: 60, lateralOffset: 2.4, towerType: "tank" },
    { t: 0.46, cost: 90, lateralOffset: 2.4, towerType: "mage" },
    { t: 0.62, cost: 105, lateralOffset: 2.4, towerType: "ballista" },
    { t: 0.80, cost: 130, lateralOffset: 2.4, towerType: "tank" },
    { t: 0.92, cost: 160, lateralOffset: 2.4, towerType: "ballista" },
  ],
  waves: {
    list: buildEndlessWaves(30),
  },
  castleHP: 200,
  startCoins: 200,
  heroSpawn: [-2, 0, -1],
  briefing: "ENDLESS — vagues infinies. Combien tiendras-tu ?",
  isEndless: true,
};
