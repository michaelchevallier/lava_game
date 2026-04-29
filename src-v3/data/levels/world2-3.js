export default {
  id: "world2-3",
  name: "Forêt — Clairière",
  theme: "foret",
  pathPoints: [
    [-15, 0, 0], [-9, 0, -4], [-3, 0, 2], [3, 0, -3],
    [7, 0, 1], [9, 0, -2], [5, 0, 4], [1, 0, 6],
  ],
  waves: {
    list: [
      { types: { basic: 14, assassin: 8, brute: 3 }, spawnRateMs: 500, breakMs: 4000 },
      { types: { runner: 14, assassin: 10, brute: 5 }, spawnRateMs: 470, breakMs: 4000 },
      { types: { assassin: 14, basic: 10, brute: 6, shielded: 5 }, spawnRateMs: 440, breakMs: 4000 },
      { types: { runner: 14, assassin: 12, brute: 7, shielded: 6 }, spawnRateMs: 420, breakMs: 4500 },
      { types: { midboss: 1, basic: 12, assassin: 10, brute: 6 }, spawnRateMs: 400, breakMs: 0 },
    ],
  },
  castleHP: 140,
  startCoins: 140,
  heroSpawn: [-2, 0, -1],
  briefing: "Un mage de la forêt approche en milieu de zone.",
};
