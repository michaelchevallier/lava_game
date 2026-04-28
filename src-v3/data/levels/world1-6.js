export default {
  id: "world1-6",
  name: "Plaine — 6",
  theme: "plaine",
  pathPoints: [
    [-15, 0, -8], [-9, 0, -2], [-5, 0, -7], [0, 0, -3],
    [4, 0, -8], [8, 0, -2], [6, 0, 4], [2, 0, 6],
  ],
  slots: [
    { t: 0.16, cost: 35, lateralOffset: 2.4, towerType: "archer" },
    { t: 0.38, cost: 60, lateralOffset: 2.4, towerType: "tank" },
    { t: 0.55, cost: 85, lateralOffset: 2.4, towerType: "mage" },
    { t: 0.72, cost: 100, lateralOffset: 2.4, towerType: "archer" },
    { t: 0.88, cost: 130, lateralOffset: 2.4, towerType: "ballista" },
  ],
  waves: {
    list: [
      { types: { basic: 16, runner: 10, shielded: 3 }, spawnRateMs: 540, breakMs: 4000 },
      { types: { basic: 12, runner: 12, brute: 4, shielded: 3 }, spawnRateMs: 500, breakMs: 4000 },
      { types: { basic: 10, runner: 14, brute: 6, shielded: 4 }, spawnRateMs: 470, breakMs: 4000 },
      { types: { basic: 8, runner: 12, brute: 8, shielded: 5 }, spawnRateMs: 440, breakMs: 4500 },
      { types: { midboss: 1, basic: 14, brute: 6, runner: 10, shielded: 4 }, spawnRateMs: 420, breakMs: 0 },
    ],
  },
  castleHP: 140,
  startCoins: 140,
  heroSpawn: [-2, 0, -1],
  briefing: "5 emplacements de tour disponibles — équilibre tes choix.",
};
