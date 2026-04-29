export default {
  id: "world1-2",
  name: "Plaine — 2",
  theme: "plaine",
  pathPoints: [
    [-15, 0, -8], [-9, 0, -2], [-5, 0, -7], [0, 0, -3],
    [4, 0, -8], [8, 0, -2], [6, 0, 4], [2, 0, 6],
  ],
  waves: {
    list: [
      { types: { basic: 18, runner: 4 }, spawnRateMs: 650, breakMs: 4000 },
      { types: { basic: 18, runner: 8 }, spawnRateMs: 600, breakMs: 4000 },
      { types: { basic: 16, runner: 10, brute: 1 }, spawnRateMs: 550, breakMs: 4000 },
      { types: { basic: 14, runner: 12, brute: 2 }, spawnRateMs: 500, breakMs: 0 },
    ],
  },
  castleHP: 120,
  startCoins: 100,
  heroSpawn: [-2, 0, -1],
  briefing: "Plus de coureurs verts arrivent — ils sont rapides mais fragiles.",
};
