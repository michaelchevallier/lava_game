export default {
  id: "world4-8",
  name: "Volcan — Dragon",
  theme: "volcan",
  paths: [
    [
      [-15, 0, -5], [-10, 0, -2], [-3, 0, -5], [2, 0, -2],
      [5, 0, -4], [3, 0, 2], [1, 0, 4], [0, 0, 5],
    ],
    [
      [-15, 0, 5], [-10, 0, 2], [-3, 0, 5], [2, 0, 2],
      [5, 0, 4], [3, 0, 2], [1, 0, 4], [0, 0, 5],
    ],
    [
      [15, 0, -3], [10, 0, 0], [5, 0, -2], [2, 0, 1], [0, 0, 5],
    ],
  ],
  waves: {
    list: [
      { types: { basic: 14, runner: 10, imp: 8 }, spawnRateMs: 470, breakMs: 4000 },
      { types: { imp: 18, flyer: 12, brute: 7 }, spawnRateMs: 440, breakMs: 4000 },
      { types: { imp: 20, flyer: 14, assassin: 10, brute: 8, shielded: 6 }, spawnRateMs: 410, breakMs: 4000 },
      { types: { midboss: 1, imp: 16, flyer: 12, brute: 9 }, spawnRateMs: 400, breakMs: 4500 },
      { types: { midboss: 1, imp: 22, flyer: 14, shielded: 8 }, spawnRateMs: 380, breakMs: 5000 },
      { types: { dragon_boss: 1, imp: 22, flyer: 14, brute: 10 }, spawnRateMs: 370, breakMs: 0 },
    ],
  },
  castleHP: 250,
  startCoins: 280,
  heroSpawn: [-2, 0, -1],
  briefing: "BOSS FINAL : 3 chemins ! Le Dragon arrive avec ses minions de toutes parts.",
};
