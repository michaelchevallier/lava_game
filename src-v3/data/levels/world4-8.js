export default {
  id: "world4-8",
  name: "Volcan — Dragon",
  theme: "volcan",
  paths: [
    [
      [-22, 0, -8], [-17, 0, -4], [-11, 0, -2], [-5, 0, -6], [0, 0, -3],
      [4, 0, -5], [3, 0, 1], [1, 0, 4], [0, 0, 5],
    ],
    [
      [-22, 0, 8], [-17, 0, 4], [-11, 0, 2], [-5, 0, 6], [0, 0, 3],
      [4, 0, 5], [3, 0, 2], [1, 0, 4], [0, 0, 5],
    ],
    [
      [22, 0, -3], [16, 0, 0], [10, 0, -2], [4, 0, 1], [0, 0, 5],
    ],
  ],
  waves: {
    list: [
      { types: { basic: 24, runner: 16, imp: 14 }, spawnRateMs: 360, breakMs: 4000 },
      { types: { imp: 30, flyer: 20, brute: 14 }, spawnRateMs: 320, breakMs: 4000 },
      { types: { imp: 34, flyer: 22, assassin: 18, brute: 14, shielded: 12 }, spawnRateMs: 300, breakMs: 4000 },
      { types: { midboss: 2, imp: 28, flyer: 18, brute: 14 }, spawnRateMs: 290, breakMs: 4500 },
      { types: { midboss: 2, imp: 36, flyer: 22, shielded: 14 }, spawnRateMs: 270, breakMs: 5000 },
      { types: { dragon_boss: 1, imp: 40, flyer: 26, brute: 18, shielded: 14 }, spawnRateMs: 240, breakMs: 0 },
    ],
  },
  castleHP: 280,
  startCoins: 320,
  heroSpawn: [-2, 0, -1],
  briefing: "BOSS FINAL : 3 chemins ! Le Dragon arrive avec ses minions de toutes parts.",
};
