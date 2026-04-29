export default {
  id: "world3-3",
  name: "Désert — Cratère",
  theme: "desert",
  pathPoints: [
    [-15, 0, 1], [-10, 0, -3], [-4, 0, 1], [1, 0, -3],
    [5, 0, 1], [9, 0, -2], [5, 0, 4], [1, 0, 6],
  ],
  slots: [
    { t: 0.14, cost: 40, lateralOffset: 2.4, towerType: "archer" },
    { t: 0.32, cost: 65, lateralOffset: 2.4, towerType: "mage" },
    { t: 0.50, cost: 95, lateralOffset: 2.4, towerType: "ballista" },
    { t: 0.68, cost: 110, lateralOffset: 2.4, towerType: "tank" },
    { t: 0.86, cost: 145, lateralOffset: 2.4, towerType: "ballista" },
  ],
  waves: {
    list: [
      { types: { runner: 14, flyer: 10, brute: 4 }, spawnRateMs: 480, breakMs: 4000 },
      { types: { flyer: 14, basic: 10, brute: 5 }, spawnRateMs: 450, breakMs: 4000 },
      { types: { flyer: 16, runner: 10, brute: 6, shielded: 4 }, spawnRateMs: 430, breakMs: 4000 },
      { types: { runner: 14, flyer: 12, brute: 7, shielded: 6 }, spawnRateMs: 410, breakMs: 4500 },
      { types: { midboss: 1, flyer: 12, brute: 7 }, spawnRateMs: 400, breakMs: 0 },
    ],
  },
  castleHP: 160,
  startCoins: 160,
  heroSpawn: [-2, 0, -1],
  briefing: "Mid-boss en finale. Tiens bon.",
};
