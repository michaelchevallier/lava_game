export default {
  id: "world1-1",
  name: "Plaine du Royaume — 1",
  theme: "plaine",
  pathPoints: [
    [-15, 0, -8], [-9, 0, -2], [-5, 0, -7], [0, 0, -3],
    [4, 0, -8], [8, 0, -2], [6, 0, 4], [2, 0, 6],
  ],
  slots: [
    { t: 0.22, cost: 30, lateralOffset: 2.4, towerType: "archer" },
    { t: 0.45, cost: 60, lateralOffset: 2.4, towerType: "tank" },
    { t: 0.68, cost: 80, lateralOffset: 2.4, towerType: "mage" },
    { t: 0.86, cost: 110, lateralOffset: 2.4, towerType: "ballista" },
  ],
  waves: {
    list: [
      { types: { basic: 25 }, spawnRateMs: 600, breakMs: 4000 },
      { types: { basic: 22, runner: 8 }, spawnRateMs: 560, breakMs: 4000 },
      { types: { basic: 20, runner: 10, brute: 2 }, spawnRateMs: 520, breakMs: 4000 },
      { types: { basic: 18, runner: 12, brute: 4, shielded: 2 }, spawnRateMs: 480, breakMs: 4000 },
      { types: { midboss: 1, brute: 4, runner: 8, basic: 12 }, spawnRateMs: 450, breakMs: 0 },
    ],
  },
  castleHP: 100,
  startCoins: 100,
  heroSpawn: [-2, 0, -1],
  briefing: "Plaine du Royaume — défends le château.",
  tutorial: "WASD/joystick pour bouger · entre dans un cercle jaune pour construire (l'or coule pendant que tu y restes)",
};
