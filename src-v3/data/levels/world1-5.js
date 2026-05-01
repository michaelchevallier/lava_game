export default {
  id: "world1-5",
  name: "Plaine — 5",
  theme: "plaine",
  pathPoints: [
    [-58, 0, -10],
    [-42, 0, -16],
    [-22, 0, -10],
    [-12, 0, 0],
    [-22, 0, 10],
    [-8, 0, 12],
    [4, 0, 6],
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
