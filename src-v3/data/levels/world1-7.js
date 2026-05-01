export default {
  id: "world1-7",
  name: "Plaine — 7",
  theme: "plaine",
  pathPoints: [
    [-58, 0, 4],
    [-44, 0, -12],
    [-22, 0, -16],
    [-2, 0, -8],
    [2, 0, 4],
    [4, 0, 6],
  ],
  waves: {
    list: [
      { types: { basic: 14, runner: 10, brute: 3, shielded: 3 }, spawnRateMs: 520, breakMs: 4000 },
      { types: { basic: 12, runner: 14, brute: 5, shielded: 4 }, spawnRateMs: 480, breakMs: 4000 },
      { types: { basic: 10, runner: 14, brute: 7, shielded: 5 }, spawnRateMs: 450, breakMs: 4000 },
      { types: { midboss: 1, basic: 12, runner: 10, brute: 5 }, spawnRateMs: 430, breakMs: 4500 },
      { types: { midboss: 1, basic: 14, runner: 12, brute: 6, shielded: 4, assassin: 2 }, spawnRateMs: 410, breakMs: 0 },
    ],
  },
  castleHP: 150,
  startCoins: 150,
  heroSpawn: [-2, 0, -1],
  briefing: "Pré-boss : deux Sorciers en deux vagues. Prépare-toi !",
};
