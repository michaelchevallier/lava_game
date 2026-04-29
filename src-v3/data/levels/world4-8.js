export default {
  id: "world4-8",
  name: "Volcan — Dragon",
  theme: "volcan",
  pathPoints: [
    [-15, 0, -2], [-10, 0, 2], [-3, 0, -2], [2, 0, 1],
    [5, 0, -3], [8, 0, 1], [4, 0, 5], [0, 0, 6],
  ],
  slots: [
    { t: 0.14, cost: 60, lateralOffset: 2.4, towerType: "archer" },
    { t: 0.32, cost: 90, lateralOffset: 2.4, towerType: "ballista" },
    { t: 0.50, cost: 115, lateralOffset: 2.4, towerType: "mage" },
    { t: 0.68, cost: 130, lateralOffset: 2.4, towerType: "tank" },
    { t: 0.85, cost: 175, lateralOffset: 2.4, towerType: "ballista" },
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
  briefing: "BOSS FINAL : le Dragon de Lave vole, invoque des imps, et lance des AOE de feu.",
};
