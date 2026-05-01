export default {
  id: "world1-6",
  name: "Plaine — 6",
  theme: "plaine",
  pathPoints: [
    [-58, 0, 0], [-44, 0, -7], [-30, 0, 6], [-16, 0, -6], [-4, 0, 4], [2, 0, 6],
  ],
  waves: {
    list: [
      { types: { basic: 16, runner: 10, shielded: 3 }, spawnRateMs: 540, breakMs: 4000 },
      { types: { basic: 12, runner: 12, brute: 4, shielded: 3 }, spawnRateMs: 500, breakMs: 4000 },
      { types: { basic: 10, runner: 14, brute: 6, shielded: 4 }, spawnRateMs: 470, breakMs: 4000 },
      { types: { basic: 8, runner: 12, brute: 8, shielded: 5 }, spawnRateMs: 440, breakMs: 4500 },
      { types: { midboss: 1, basic: 14, brute: 6, runner: 10, shielded: 4 }, spawnRateMs: 420, breakMs: 0 },
    ],
  },
  castleHP: 140,
  startCoins: 140,
  heroSpawn: [-2, 0, -1],
  briefing: "5 emplacements de tour disponibles — équilibre tes choix.",
};
