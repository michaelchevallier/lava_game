export default {
  id: "world4-5",
  name: "Volcan — Geyser",
  theme: "volcan",
  pathPoints: [
    [-15, 0, 1], [-10, 0, -4], [-4, 0, 0], [-1, 0, -4],
    [4, 0, 0], [8, 0, -3], [6, 0, 4], [2, 0, 6],
  ],
  slots: [
    { t: 0.14, cost: 55, lateralOffset: 2.4, towerType: "archer" },
    { t: 0.30, cost: 80, lateralOffset: 2.4, towerType: "tank" },
    { t: 0.48, cost: 105, lateralOffset: 2.4, towerType: "mage" },
    { t: 0.66, cost: 120, lateralOffset: 2.4, towerType: "ballista" },
    { t: 0.86, cost: 160, lateralOffset: 2.4, towerType: "ballista" },
  ],
  waves: {
    list: [
      { types: { imp: 18, flyer: 12, brute: 6 }, spawnRateMs: 430, breakMs: 4000 },
      { types: { imp: 18, assassin: 8, flyer: 10, brute: 7 }, spawnRateMs: 410, breakMs: 4000 },
      { types: { imp: 20, flyer: 14, brute: 8, shielded: 7 }, spawnRateMs: 390, breakMs: 4000 },
      { types: { midboss: 1, imp: 16, flyer: 12, brute: 9 }, spawnRateMs: 380, breakMs: 4500 },
      { types: { midboss: 1, imp: 20, assassin: 10, shielded: 8 }, spawnRateMs: 370, breakMs: 0 },
    ],
  },
  castleHP: 205,
  startCoins: 220,
  heroSpawn: [-2, 0, -1],
  briefing: "Mélange chaotique : tous les types d'ennemis.",
};
