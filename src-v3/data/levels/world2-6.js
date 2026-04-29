export default {
  id: "world2-6",
  name: "Forêt — Sanctuaire",
  theme: "foret",
  pathPoints: [
    [-15, 0, -3], [-10, 0, 1], [-4, 0, -2], [0, 0, 2],
    [4, 0, -2], [8, 0, 2], [4, 0, 5], [0, 0, 6],
  ],
  slots: [
    { t: 0.14, cost: 40, lateralOffset: 2.4, towerType: "archer" },
    { t: 0.30, cost: 65, lateralOffset: 2.4, towerType: "mage" },
    { t: 0.48, cost: 90, lateralOffset: 2.4, towerType: "tank" },
    { t: 0.66, cost: 105, lateralOffset: 2.4, towerType: "mage" },
    { t: 0.84, cost: 140, lateralOffset: 2.4, towerType: "ballista" },
  ],
  waves: {
    list: [
      { types: { assassin: 14, basic: 10, brute: 5 }, spawnRateMs: 470, breakMs: 4000 },
      { types: { runner: 16, assassin: 12, brute: 6, shielded: 4 }, spawnRateMs: 440, breakMs: 4000 },
      { types: { assassin: 18, brute: 7, shielded: 7 }, spawnRateMs: 420, breakMs: 4000 },
      { types: { midboss: 1, assassin: 14, brute: 8 }, spawnRateMs: 410, breakMs: 4500 },
      { types: { midboss: 1, assassin: 16, brute: 9, shielded: 7 }, spawnRateMs: 390, breakMs: 0 },
    ],
  },
  castleHP: 155,
  startCoins: 160,
  heroSpawn: [-2, 0, -1],
  briefing: "Sanctuaire druidique. Approche du Sorcier.",
};
