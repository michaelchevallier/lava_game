export default {
  id: "world4-4",
  name: "Volcan — Coulée",
  theme: "volcan",
  pathPoints: [
    [-15, 0, -2], [-10, 0, 2], [-3, 0, -2], [2, 0, 2],
    [6, 0, -3], [8, 0, 1], [4, 0, 5], [0, 0, 6],
  ],
  slots: [
    { t: 0.14, cost: 55, lateralOffset: 2.4, towerType: "archer" },
    { t: 0.32, cost: 80, lateralOffset: 2.4, towerType: "ballista" },
    { t: 0.50, cost: 105, lateralOffset: 2.4, towerType: "mage" },
    { t: 0.70, cost: 120, lateralOffset: 2.4, towerType: "tank" },
    { t: 0.88, cost: 160, lateralOffset: 2.4, towerType: "ballista" },
  ],
  waves: {
    list: [
      { types: { imp: 18, flyer: 10, brute: 6 }, spawnRateMs: 440, breakMs: 4000 },
      { types: { imp: 18, runner: 12, brute: 7, shielded: 5 }, spawnRateMs: 420, breakMs: 4000 },
      { types: { imp: 20, flyer: 12, brute: 8, shielded: 6 }, spawnRateMs: 400, breakMs: 4000 },
      { types: { midboss: 1, imp: 16, flyer: 10, brute: 8 }, spawnRateMs: 390, breakMs: 4500 },
      { types: { midboss: 1, imp: 18, runner: 10, shielded: 7 }, spawnRateMs: 380, breakMs: 0 },
    ],
  },
  castleHP: 195,
  startCoins: 210,
  heroSpawn: [-2, 0, -1],
  briefing: "Coulée de lave + 2 mid-bosses.",
};
