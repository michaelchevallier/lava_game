export default {
  id: "world4-1",
  name: "Volcan — Caldera",
  theme: "volcan",
  pathPoints: [
    [-15, 0, 0], [-10, 0, -3], [-3, 0, 2], [3, 0, -3],
    [7, 0, 1], [9, 0, -2], [5, 0, 4], [1, 0, 6],
  ],
  slots: [
    { t: 0.18, cost: 50, lateralOffset: 2.4, towerType: "archer" },
    { t: 0.40, cost: 75, lateralOffset: 2.4, towerType: "ballista" },
    { t: 0.62, cost: 100, lateralOffset: 2.4, towerType: "tank" },
    { t: 0.84, cost: 130, lateralOffset: 2.4, towerType: "ballista" },
  ],
  waves: {
    list: [
      { types: { basic: 14, runner: 10, imp: 5 }, spawnRateMs: 480, breakMs: 4000 },
      { types: { runner: 12, flyer: 8, imp: 8, brute: 4 }, spawnRateMs: 450, breakMs: 4000 },
      { types: { flyer: 12, imp: 12, brute: 6, shielded: 5 }, spawnRateMs: 430, breakMs: 4000 },
      { types: { imp: 14, flyer: 12, brute: 7, shielded: 6 }, spawnRateMs: 410, breakMs: 4500 },
      { types: { runner: 14, imp: 14, flyer: 10, shielded: 7 }, spawnRateMs: 390, breakMs: 0 },
    ],
  },
  castleHP: 180,
  startCoins: 180,
  heroSpawn: [-2, 0, -1],
  briefing: "Bienvenue au Volcan. Les Imps brûlent vite — fais attention.",
};
