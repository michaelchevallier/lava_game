export default {
  id: "world3-5",
  name: "Désert — Mirage",
  theme: "desert",
  pathPoints: [
    [-15, 0, 1], [-10, 0, -3], [-4, 0, 0], [-1, 0, -4],
    [4, 0, 0], [8, 0, -3], [6, 0, 4], [2, 0, 6],
  ],
  slots: [
    { t: 0.14, cost: 45, lateralOffset: 2.4, towerType: "archer" },
    { t: 0.30, cost: 70, lateralOffset: 2.4, towerType: "tank" },
    { t: 0.48, cost: 95, lateralOffset: 2.4, towerType: "ballista" },
    { t: 0.66, cost: 110, lateralOffset: 2.4, towerType: "mage" },
    { t: 0.86, cost: 150, lateralOffset: 2.4, towerType: "ballista" },
  ],
  waves: {
    list: [
      { types: { flyer: 16, runner: 10, brute: 5 }, spawnRateMs: 460, breakMs: 4000 },
      { types: { flyer: 16, assassin: 6, brute: 6 }, spawnRateMs: 440, breakMs: 4000 },
      { types: { flyer: 18, runner: 12, brute: 7, shielded: 6 }, spawnRateMs: 420, breakMs: 4000 },
      { types: { midboss: 1, flyer: 16, assassin: 8 }, spawnRateMs: 410, breakMs: 4500 },
      { types: { midboss: 1, flyer: 14, runner: 12, shielded: 7 }, spawnRateMs: 390, breakMs: 0 },
    ],
  },
  castleHP: 170,
  startCoins: 175,
  heroSpawn: [-2, 0, -1],
  briefing: "Le désert se mélange à la forêt — assassins + flyers.",
};
