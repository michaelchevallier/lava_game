export default {
  id: "world2-4",
  name: "Forêt — Marécage",
  theme: "foret",
  pathPoints: [
    [-15, 0, -3], [-10, 0, 1], [-4, 0, -3], [1, 0, 2],
    [5, 0, -3], [8, 0, 1], [4, 0, 5], [0, 0, 6],
  ],
  slots: [
    { t: 0.16, cost: 40, lateralOffset: 2.4, towerType: "archer" },
    { t: 0.34, cost: 65, lateralOffset: 2.4, towerType: "mage" },
    { t: 0.52, cost: 90, lateralOffset: 2.4, towerType: "tank" },
    { t: 0.72, cost: 110, lateralOffset: 2.4, towerType: "tank" },
    { t: 0.88, cost: 140, lateralOffset: 2.4, towerType: "ballista" },
  ],
  waves: {
    list: [
      { types: { basic: 12, assassin: 10, shielded: 4 }, spawnRateMs: 490, breakMs: 4000 },
      { types: { runner: 14, assassin: 12, brute: 5 }, spawnRateMs: 460, breakMs: 4000 },
      { types: { assassin: 16, basic: 8, brute: 6, shielded: 6 }, spawnRateMs: 430, breakMs: 4000 },
      { types: { runner: 14, assassin: 14, brute: 7, shielded: 7 }, spawnRateMs: 410, breakMs: 4500 },
      { types: { midboss: 1, assassin: 14, brute: 8, shielded: 6 }, spawnRateMs: 390, breakMs: 0 },
    ],
  },
  castleHP: 145,
  startCoins: 145,
  heroSpawn: [-2, 0, -1],
  briefing: "Le sol marécageux ralentit le hero. Reste prudent.",
};
