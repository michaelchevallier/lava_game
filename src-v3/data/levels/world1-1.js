export default {
  id: "world1-1",
  name: "Plaine — 1",
  theme: "plaine",
  pathPoints: [
    [-58, 0, 0], [-48, 0, -10], [-38, 0, 8], [-28, 0, -8],
    [-18, 0, 6], [-8, 0, -6], [0, 0, 4], [2, 0, 6],
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
