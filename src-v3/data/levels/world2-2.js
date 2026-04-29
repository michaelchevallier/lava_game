export default {
  id: "world2-2",
  name: "Forêt — Sentier",
  theme: "foret",
  pathPoints: [
    [-15, 0, -2], [-9, 0, 2], [-3, 0, -3], [2, 0, 1],
    [6, 0, -2], [9, 0, 3], [4, 0, 5], [0, 0, 6],
  ],
  slots: [
    { t: 0.16, cost: 35, lateralOffset: 2.4, towerType: "archer" },
    { t: 0.36, cost: 60, lateralOffset: 2.4, towerType: "mage" },
    { t: 0.56, cost: 85, lateralOffset: 2.4, towerType: "tank" },
    { t: 0.84, cost: 110, lateralOffset: 2.4, towerType: "ballista" },
  ],
  waves: {
    list: [
      { types: { runner: 14, assassin: 6 }, spawnRateMs: 510, breakMs: 4000 },
      { types: { basic: 12, runner: 12, assassin: 8 }, spawnRateMs: 480, breakMs: 4000 },
      { types: { basic: 10, assassin: 12, brute: 4 }, spawnRateMs: 450, breakMs: 4000 },
      { types: { runner: 14, assassin: 10, shielded: 5 }, spawnRateMs: 420, breakMs: 4500 },
      { types: { basic: 12, assassin: 14, brute: 6, shielded: 4 }, spawnRateMs: 400, breakMs: 0 },
    ],
  },
  castleHP: 135,
  startCoins: 135,
  heroSpawn: [-2, 0, -1],
  briefing: "Le sentier serpente. Les assassins se font plus nombreux.",
};
