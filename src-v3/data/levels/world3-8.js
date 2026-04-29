export default {
  id: "world3-8",
  name: "Désert — Corsaire",
  theme: "desert",
  pathPoints: [
    [-15, 0, -2], [-10, 0, 2], [-3, 0, -2], [2, 0, 1],
    [5, 0, -3], [8, 0, 1], [4, 0, 5], [0, 0, 6],
  ],
  slots: [
    { t: 0.14, cost: 50, lateralOffset: 2.4, towerType: "archer" },
    { t: 0.32, cost: 80, lateralOffset: 2.4, towerType: "ballista" },
    { t: 0.50, cost: 105, lateralOffset: 2.4, towerType: "mage" },
    { t: 0.68, cost: 120, lateralOffset: 2.4, towerType: "tank" },
    { t: 0.85, cost: 165, lateralOffset: 2.4, towerType: "ballista" },
  ],
  waves: {
    list: [
      { types: { basic: 14, runner: 10, flyer: 6 }, spawnRateMs: 490, breakMs: 4000 },
      { types: { flyer: 16, runner: 12, brute: 6 }, spawnRateMs: 460, breakMs: 4000 },
      { types: { flyer: 18, assassin: 10, brute: 8, shielded: 6 }, spawnRateMs: 430, breakMs: 4000 },
      { types: { midboss: 1, flyer: 14, brute: 8 }, spawnRateMs: 420, breakMs: 4500 },
      { types: { midboss: 1, flyer: 18, runner: 12, shielded: 7 }, spawnRateMs: 400, breakMs: 5000 },
      { types: { corsair_boss: 1, flyer: 18, assassin: 12, brute: 8 }, spawnRateMs: 380, breakMs: 0 },
    ],
  },
  castleHP: 200,
  startCoins: 220,
  heroSpawn: [-2, 0, -1],
  briefing: "BOSS : le Capitaine Corsaire lance des explosions AOE toutes les 8s.",
};
