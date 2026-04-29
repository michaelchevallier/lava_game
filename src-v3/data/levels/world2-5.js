export default {
  id: "world2-5",
  name: "Forêt — Cirque",
  theme: "foret",
  pathPoints: [
    [-15, 0, 0], [-10, 0, -4], [-4, 0, 0], [-1, 0, -4],
    [4, 0, 0], [8, 0, -3], [6, 0, 4], [2, 0, 6],
  ],
  slots: [
    { t: 0.14, cost: 40, lateralOffset: 2.4, towerType: "archer" },
    { t: 0.30, cost: 65, lateralOffset: 2.4, towerType: "tank" },
    { t: 0.48, cost: 90, lateralOffset: 2.4, towerType: "mage" },
    { t: 0.66, cost: 110, lateralOffset: 2.4, towerType: "archer" },
    { t: 0.86, cost: 140, lateralOffset: 2.4, towerType: "ballista" },
  ],
  waves: {
    list: [
      { types: { runner: 14, assassin: 10, brute: 4 }, spawnRateMs: 480, breakMs: 4000 },
      { types: { assassin: 14, basic: 10, shielded: 5 }, spawnRateMs: 450, breakMs: 4000 },
      { types: { assassin: 16, brute: 7, shielded: 6 }, spawnRateMs: 420, breakMs: 4000 },
      { types: { midboss: 1, runner: 12, assassin: 10, brute: 6 }, spawnRateMs: 410, breakMs: 4500 },
      { types: { midboss: 1, assassin: 16, brute: 8, shielded: 6 }, spawnRateMs: 390, breakMs: 0 },
    ],
  },
  castleHP: 150,
  startCoins: 150,
  heroSpawn: [-2, 0, -1],
  briefing: "Deux mages de la forêt en deux vagues.",
};
