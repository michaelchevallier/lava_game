export default {
  id: "world1-2",
  name: "Plaine — 2",
  theme: "plaine",
  pathPoints: [
    [-58, 0, 0], [-48, 0, -10], [-38, 0, 8], [-28, 0, -8],
    [-18, 0, 6], [-8, 0, -6], [0, 0, 4], [2, 0, 6],
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
