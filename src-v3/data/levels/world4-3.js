export default {
  id: "world4-3",
  name: "Volcan — Grotte",
  theme: "volcan",
  pathPoints: [
    [-15, 0, 1], [-10, 0, -3], [-4, 0, 1], [1, 0, -3],
    [5, 0, 1], [9, 0, -2], [5, 0, 4], [1, 0, 6],
  ],
  slots: [
    { t: 0.14, cost: 50, lateralOffset: 2.4, towerType: "archer" },
    { t: 0.32, cost: 75, lateralOffset: 2.4, towerType: "ballista" },
    { t: 0.50, cost: 105, lateralOffset: 2.4, towerType: "mage" },
    { t: 0.68, cost: 115, lateralOffset: 2.4, towerType: "tank" },
    { t: 0.86, cost: 155, lateralOffset: 2.4, towerType: "ballista" },
  ],
  waves: {
    list: [
      { types: { imp: 14, flyer: 10, brute: 5 }, spawnRateMs: 450, breakMs: 4000 },
      { types: { imp: 16, runner: 10, brute: 7, shielded: 4 }, spawnRateMs: 430, breakMs: 4000 },
      { types: { imp: 18, flyer: 12, brute: 8, shielded: 6 }, spawnRateMs: 410, breakMs: 4000 },
      { types: { runner: 14, imp: 16, brute: 9, shielded: 6 }, spawnRateMs: 390, breakMs: 4500 },
      { types: { midboss: 1, imp: 14, flyer: 10, brute: 7 }, spawnRateMs: 380, breakMs: 0 },
    ],
  },
  castleHP: 190,
  startCoins: 200,
  heroSpawn: [-2, 0, -1],
  briefing: "Grotte volcanique. Mid-boss en finale.",
};
