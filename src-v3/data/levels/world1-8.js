export default {
  id: "world1-8",
  name: "Plaine — Brigand",
  theme: "plaine",
  pathPoints: [
    [-15, 0, -8], [-9, 0, -2], [-5, 0, -7], [0, 0, -3],
    [4, 0, -8], [8, 0, -2], [6, 0, 4], [2, 0, 6],
  ],
  slots: [
    { t: 0.15, cost: 40, lateralOffset: 2.4, towerType: "archer" },
    { t: 0.32, cost: 70, lateralOffset: 2.4, towerType: "tank" },
    { t: 0.50, cost: 95, lateralOffset: 2.4, towerType: "mage" },
    { t: 0.68, cost: 110, lateralOffset: 2.4, towerType: "tank" },
    { t: 0.85, cost: 150, lateralOffset: 2.4, towerType: "ballista" },
  ],
  waves: {
    list: [
      { types: { basic: 14, runner: 10, brute: 4 }, spawnRateMs: 500, breakMs: 4000 },
      { types: { basic: 12, runner: 12, brute: 5, shielded: 4 }, spawnRateMs: 470, breakMs: 4000 },
      { types: { basic: 10, runner: 14, brute: 7, shielded: 5 }, spawnRateMs: 440, breakMs: 4000 },
      { types: { midboss: 1, basic: 14, brute: 6 }, spawnRateMs: 430, breakMs: 4500 },
      { types: { midboss: 1, basic: 12, runner: 10, shielded: 5 }, spawnRateMs: 410, breakMs: 5000 },
      { types: { brigand_boss: 1, basic: 18, runner: 10, brute: 6 }, spawnRateMs: 400, breakMs: 0 },
    ],
  },
  castleHP: 160,
  startCoins: 180,
  heroSpawn: [-2, 0, -1],
  briefing: "BOSS : le Brigand de la Plaine attaque le château ! Vague finale après 2 mid-bosses.",
};
