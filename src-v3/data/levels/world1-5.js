export default {
  id: "world1-5",
  name: "Plaine — 5",
  theme: "plaine",
  pathPoints: [
    [-58, 0, 0], [-48, 0, -10], [-38, 0, 8], [-28, 0, -8],
    [-18, 0, 6], [-8, 0, -6], [0, 0, 4], [2, 0, 6],
  ],
  waves: {
    list: [
      { types: { basic: 18, runner: 8, shielded: 2 }, spawnRateMs: 580, breakMs: 4000 },
      { types: { basic: 14, runner: 10, brute: 3 }, spawnRateMs: 540, breakMs: 4000 },
      { types: { basic: 12, runner: 12, brute: 4, shielded: 3 }, spawnRateMs: 500, breakMs: 4000 },
      { types: { basic: 10, runner: 14, brute: 5, shielded: 4 }, spawnRateMs: 470, breakMs: 4500 },
      { types: { midboss: 1, basic: 12, brute: 4, runner: 8 }, spawnRateMs: 460, breakMs: 0 },
    ],
  },
  castleHP: 140,
  startCoins: 130,
  heroSpawn: [-2, 0, -1],
  briefing: "Mid-boss : un Sorcier débarque en vague 5. Concentrez le feu !",
};
