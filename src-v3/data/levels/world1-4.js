export default {
  id: "world1-4",
  name: "Plaine — 4",
  theme: "plaine",
  pathPoints: [
    [-58, 0, 0], [-48, 0, -10], [-38, 0, 8], [-28, 0, -8],
    [-18, 0, 6], [-8, 0, -6], [0, 0, 4], [2, 0, 6],
  ],
  waves: {
    list: [
      { types: { basic: 16, runner: 6, shielded: 1 }, spawnRateMs: 600, breakMs: 4000 },
      { types: { basic: 14, runner: 8, brute: 2, shielded: 2 }, spawnRateMs: 550, breakMs: 4000 },
      { types: { basic: 12, runner: 10, brute: 3, shielded: 3 }, spawnRateMs: 500, breakMs: 4000 },
      { types: { basic: 10, runner: 12, brute: 4, shielded: 4 }, spawnRateMs: 460, breakMs: 4000 },
      { types: { basic: 8, runner: 10, brute: 6, shielded: 5 }, spawnRateMs: 430, breakMs: 0 },
    ],
  },
  castleHP: 130,
  startCoins: 120,
  heroSpawn: [-2, 0, -1],
  briefing: "Chevaliers Dorés : leur bouclier bloque les tirs frontaux. Visez de derrière !",
};
