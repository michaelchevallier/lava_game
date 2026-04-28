export default {
  id: "world1-7",
  name: "Plaine — 7",
  theme: "plaine",
  pathPoints: [
    [-15, 0, -8], [-9, 0, -2], [-5, 0, -7], [0, 0, -3],
    [4, 0, -8], [8, 0, -2], [6, 0, 4], [2, 0, 6],
  ],
  slots: [
    { t: 0.15, cost: 35, lateralOffset: 2.4, towerType: "archer" },
    { t: 0.35, cost: 60, lateralOffset: 2.4, towerType: "tank" },
    { t: 0.52, cost: 90, lateralOffset: 2.4, towerType: "mage" },
    { t: 0.70, cost: 110, lateralOffset: 2.4, towerType: "tank" },
    { t: 0.88, cost: 140, lateralOffset: 2.4, towerType: "ballista" },
  ],
  waves: {
    list: [
      { types: { basic: 14, runner: 10, brute: 3, shielded: 3 }, spawnRateMs: 520, breakMs: 4000 },
      { types: { basic: 12, runner: 14, brute: 5, shielded: 4 }, spawnRateMs: 480, breakMs: 4000 },
      { types: { basic: 10, runner: 14, brute: 7, shielded: 5 }, spawnRateMs: 450, breakMs: 4000 },
      { types: { midboss: 1, basic: 12, runner: 10, brute: 5 }, spawnRateMs: 430, breakMs: 4500 },
      { types: { midboss: 1, basic: 14, runner: 12, brute: 6, shielded: 4 }, spawnRateMs: 410, breakMs: 0 },
    ],
  },
  castleHP: 150,
  startCoins: 150,
  heroSpawn: [-2, 0, -1],
  briefing: "Pré-boss : deux Sorciers en deux vagues. Prépare-toi !",
};
