export default {
  id: "world1-1",
  name: "Plaine — 1",
  theme: "plaine",
  pathPoints: [
    [-15, 0, -8], [-9, 0, -2], [-5, 0, -7], [0, 0, -3],
    [4, 0, -8], [8, 0, -2], [6, 0, 4], [2, 0, 6],
  ],
  slots: [
    { t: 0.25, cost: 30, lateralOffset: 2.4, towerType: "archer" },
    { t: 0.50, cost: 50, lateralOffset: 2.4, towerType: "tank" },
    { t: 0.75, cost: 70, lateralOffset: 2.4, towerType: "mage" },
  ],
  waves: {
    list: [
      { types: { basic: 15 }, spawnRateMs: 700, breakMs: 4500 },
      { types: { basic: 18, runner: 4 }, spawnRateMs: 650, breakMs: 4500 },
      { types: { basic: 18, runner: 6, brute: 1 }, spawnRateMs: 600, breakMs: 4500 },
      { types: { basic: 16, runner: 8, brute: 2 }, spawnRateMs: 550, breakMs: 0 },
    ],
  },
  castleHP: 120,
  startCoins: 100,
  heroSpawn: [-2, 0, -1],
  briefing: "Tutoriel : Plaine du Royaume. Bouge avec WASD, entre dans un cercle jaune pour construire.",
  tutorial: "WASD/joystick pour bouger · entre dans un cercle jaune pour construire",
};
