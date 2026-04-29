export default {
  id: "world4-6",
  name: "Volcan — Forge",
  theme: "volcan",
  pathPoints: [
    [-15, 0, -3], [-10, 0, 2], [-3, 0, -2], [2, 0, 1],
    [5, 0, -2], [9, 0, 2], [4, 0, 5], [0, 0, 6],
  ],
  slots: [
    { t: 0.14, cost: 55, lateralOffset: 2.4, towerType: "archer" },
    { t: 0.30, cost: 80, lateralOffset: 2.4, towerType: "ballista" },
    { t: 0.48, cost: 105, lateralOffset: 2.4, towerType: "tank" },
    { t: 0.66, cost: 120, lateralOffset: 2.4, towerType: "mage" },
    { t: 0.84, cost: 160, lateralOffset: 2.4, towerType: "ballista" },
  ],
  waves: {
    list: [
      { types: { imp: 20, flyer: 14, brute: 7 }, spawnRateMs: 420, breakMs: 4000 },
      { types: { imp: 22, runner: 12, brute: 8, shielded: 6 }, spawnRateMs: 400, breakMs: 4000 },
      { types: { imp: 24, flyer: 14, brute: 9, shielded: 7 }, spawnRateMs: 390, breakMs: 4000 },
      { types: { midboss: 1, imp: 18, flyer: 14, brute: 10 }, spawnRateMs: 380, breakMs: 4500 },
      { types: { midboss: 1, imp: 22, brute: 11, shielded: 8 }, spawnRateMs: 370, breakMs: 0 },
    ],
  },
  castleHP: 215,
  startCoins: 230,
  heroSpawn: [-2, 0, -1],
  briefing: "Forge ardente. Swarm d'imps.",
};
