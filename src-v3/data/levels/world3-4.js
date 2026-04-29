export default {
  id: "world3-4",
  name: "Désert — Tempête",
  theme: "desert",
  pathPoints: [
    [-15, 0, -2], [-10, 0, 2], [-3, 0, -2], [2, 0, 2],
    [6, 0, -3], [8, 0, 1], [4, 0, 5], [0, 0, 6],
  ],
  slots: [
    { t: 0.14, cost: 45, lateralOffset: 2.4, towerType: "archer" },
    { t: 0.32, cost: 70, lateralOffset: 2.4, towerType: "ballista" },
    { t: 0.50, cost: 95, lateralOffset: 2.4, towerType: "mage" },
    { t: 0.70, cost: 110, lateralOffset: 2.4, towerType: "ballista" },
    { t: 0.88, cost: 145, lateralOffset: 2.4, towerType: "tank" },
  ],
  waves: {
    list: [
      { types: { flyer: 14, basic: 12, brute: 5 }, spawnRateMs: 470, breakMs: 4000 },
      { types: { flyer: 16, runner: 12, brute: 6 }, spawnRateMs: 440, breakMs: 4000 },
      { types: { flyer: 18, brute: 7, shielded: 5 }, spawnRateMs: 420, breakMs: 4000 },
      { types: { midboss: 1, flyer: 14, brute: 8 }, spawnRateMs: 410, breakMs: 4500 },
      { types: { midboss: 1, flyer: 16, runner: 10, shielded: 6 }, spawnRateMs: 390, breakMs: 0 },
    ],
  },
  castleHP: 165,
  startCoins: 170,
  heroSpawn: [-2, 0, -1],
  briefing: "Tempête de sable + 2 mid-bosses.",
};
