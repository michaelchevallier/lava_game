export default {
  id: "world3-1",
  name: "Désert — Dunes",
  theme: "desert",
  pathPoints: [
    [-15, 0, 0], [-9, 0, 3], [-3, 0, -2], [3, 0, 2],
    [7, 0, -2], [9, 0, 2], [4, 0, 5], [0, 0, 6],
  ],
  slots: [
    { t: 0.18, cost: 40, lateralOffset: 2.4, towerType: "archer" },
    { t: 0.40, cost: 65, lateralOffset: 2.4, towerType: "ballista" },
    { t: 0.62, cost: 95, lateralOffset: 2.4, towerType: "tank" },
    { t: 0.84, cost: 120, lateralOffset: 2.4, towerType: "ballista" },
  ],
  waves: {
    list: [
      { types: { basic: 14, runner: 10, flyer: 4 }, spawnRateMs: 510, breakMs: 4000 },
      { types: { basic: 12, runner: 12, flyer: 6, brute: 3 }, spawnRateMs: 480, breakMs: 4000 },
      { types: { runner: 14, flyer: 8, brute: 5, shielded: 4 }, spawnRateMs: 450, breakMs: 4000 },
      { types: { basic: 12, flyer: 10, brute: 6, shielded: 5 }, spawnRateMs: 430, breakMs: 4500 },
      { types: { runner: 14, flyer: 12, brute: 7, shielded: 6 }, spawnRateMs: 410, breakMs: 0 },
    ],
  },
  castleHP: 150,
  startCoins: 150,
  heroSpawn: [-2, 0, -1],
  briefing: "Bienvenue au Désert. Les Volants ignorent les ennemis au sol — Baliste recommandée.",
};
