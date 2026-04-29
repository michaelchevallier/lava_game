export default {
  id: "world4-2",
  name: "Volcan — Falaise",
  theme: "volcan",
  pathPoints: [
    [-15, 0, -2], [-10, 0, 2], [-3, 0, -3], [2, 0, 1],
    [6, 0, -2], [9, 0, 3], [4, 0, 5], [0, 0, 6],
  ],
  slots: [
    { t: 0.16, cost: 50, lateralOffset: 2.4, towerType: "archer" },
    { t: 0.36, cost: 75, lateralOffset: 2.4, towerType: "mage" },
    { t: 0.56, cost: 100, lateralOffset: 2.4, towerType: "ballista" },
    { t: 0.84, cost: 130, lateralOffset: 2.4, towerType: "tank" },
  ],
  waves: {
    list: [
      { types: { runner: 14, imp: 10, flyer: 6 }, spawnRateMs: 460, breakMs: 4000 },
      { types: { imp: 14, flyer: 10, brute: 5 }, spawnRateMs: 430, breakMs: 4000 },
      { types: { imp: 16, flyer: 12, brute: 7 }, spawnRateMs: 410, breakMs: 4000 },
      { types: { runner: 14, imp: 16, shielded: 6 }, spawnRateMs: 390, breakMs: 4500 },
      { types: { imp: 18, flyer: 12, brute: 8, shielded: 6 }, spawnRateMs: 380, breakMs: 0 },
    ],
  },
  castleHP: 185,
  startCoins: 185,
  heroSpawn: [-2, 0, -1],
  briefing: "Falaise instable. Les imps bondissent du précipice.",
};
