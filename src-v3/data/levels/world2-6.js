export default {
  id: "world2-6",
  name: "Forêt — Sanctuaire",
  theme: "foret",
  pathPoints: [
    [-15, 0, -3], [-10, 0, 1], [-4, 0, -2], [0, 0, 2],
    [4, 0, -2], [8, 0, 2], [4, 0, 5], [0, 0, 6],
  ],
  waves: {
    list: [
      { types: { assassin: 14, basic: 10, brute: 5 }, spawnRateMs: 470, breakMs: 4000 },
      { types: { runner: 16, assassin: 12, brute: 6, shielded: 4 }, spawnRateMs: 440, breakMs: 4000 },
      { types: { assassin: 18, brute: 7, shielded: 7 }, spawnRateMs: 420, breakMs: 4000 },
      { types: { midboss: 1, assassin: 14, brute: 8 }, spawnRateMs: 410, breakMs: 4500 },
      { types: { midboss: 1, assassin: 16, brute: 9, shielded: 7 }, spawnRateMs: 390, breakMs: 0 },
    ],
  },
  castleHP: 155,
  startCoins: 160,
  heroSpawn: [-2, 0, -1],
  briefing: "Sanctuaire druidique. Approche du Sorcier.",
};
