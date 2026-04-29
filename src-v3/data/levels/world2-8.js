export default {
  id: "world2-8",
  name: "Forêt — Sorcier",
  theme: "foret",
  pathPoints: [
    [-15, 0, -2], [-10, 0, 2], [-4, 0, -2], [1, 0, 2],
    [5, 0, -3], [8, 0, 1], [4, 0, 5], [0, 0, 6],
  ],
  waves: {
    list: [
      { types: { basic: 14, runner: 10, brute: 4 }, spawnRateMs: 500, breakMs: 4000 },
      { types: { assassin: 14, basic: 10, brute: 6 }, spawnRateMs: 470, breakMs: 4000 },
      { types: { assassin: 16, runner: 12, brute: 7, shielded: 5 }, spawnRateMs: 440, breakMs: 4000 },
      { types: { midboss: 1, assassin: 12, brute: 8 }, spawnRateMs: 430, breakMs: 4500 },
      { types: { midboss: 1, assassin: 14, runner: 10, shielded: 5 }, spawnRateMs: 410, breakMs: 5000 },
      { types: { warlord_boss: 1, assassin: 18, brute: 8 }, spawnRateMs: 400, breakMs: 0 },
    ],
  },
  castleHP: 180,
  startCoins: 200,
  heroSpawn: [-2, 0, -1],
  briefing: "BOSS : le Sorcier de la Forêt invoque des minions toutes les 5s.",
};
