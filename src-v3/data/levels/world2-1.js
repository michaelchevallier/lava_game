export default {
  id: "world2-1",
  name: "Forêt — Lisière",
  theme: "foret",
  pathPoints: [
    [-15, 0, 0], [-10, 0, -3], [-5, 0, 2], [0, 0, -2],
    [4, 0, 3], [8, 0, -1], [6, 0, 4], [2, 0, 6],
  ],
  waves: {
    list: [
      { types: { basic: 14, runner: 8 }, spawnRateMs: 540, breakMs: 4000 },
      { types: { basic: 12, runner: 12, assassin: 4 }, spawnRateMs: 500, breakMs: 4000 },
      { types: { basic: 10, runner: 14, assassin: 6, brute: 3 }, spawnRateMs: 470, breakMs: 4000 },
      { types: { basic: 14, assassin: 8, brute: 5, shielded: 4 }, spawnRateMs: 440, breakMs: 4500 },
      { types: { runner: 16, assassin: 10, brute: 6 }, spawnRateMs: 410, breakMs: 0 },
    ],
  },
  castleHP: 130,
  startCoins: 130,
  heroSpawn: [-2, 0, -1],
  briefing: "Bienvenue en Forêt Sombre. Les Assassins se camouflent — restez attentifs.",
};
