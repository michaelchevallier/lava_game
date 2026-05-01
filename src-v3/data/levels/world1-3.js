export default {
  id: "world1-3",
  name: "Plaine — 3",
  theme: "plaine",
  pathPoints: [
    [-58, 0, 0], [-48, 0, -10], [-38, 0, 8], [-28, 0, -8],
    [-18, 0, 6], [-8, 0, -6], [0, 0, 4], [2, 0, 6],
  ],
  waves: {
    list: [
      { types: { basic: 16, runner: 6 }, spawnRateMs: 600, breakMs: 4000 },
      { types: { basic: 16, runner: 8, brute: 2 }, spawnRateMs: 560, breakMs: 4000 },
      { types: { basic: 14, runner: 10, brute: 3 }, spawnRateMs: 520, breakMs: 4000 },
      { types: { basic: 12, runner: 10, brute: 4 }, spawnRateMs: 480, breakMs: 4000 },
      { types: { basic: 10, runner: 8, brute: 6 }, spawnRateMs: 450, breakMs: 0 },
    ],
  },
  castleHP: 120,
  startCoins: 110,
  heroSpawn: [-2, 0, -1],
  briefing: "Les Brutes débarquent — gros tanks lents, à concentrer.",
};
