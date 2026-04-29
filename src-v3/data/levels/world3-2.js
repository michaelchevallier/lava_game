export default {
  id: "world3-2",
  name: "Désert — Oasis",
  theme: "desert",
  pathPoints: [
    [-15, 0, -2], [-10, 0, 2], [-3, 0, -3], [2, 0, 1],
    [6, 0, -3], [9, 0, 2], [4, 0, 5], [0, 0, 6],
  ],
  slots: [
    { t: 0.16, cost: 40, lateralOffset: 2.4, towerType: "archer" },
    { t: 0.36, cost: 65, lateralOffset: 2.4, towerType: "mage" },
    { t: 0.56, cost: 90, lateralOffset: 2.4, towerType: "tank" },
    { t: 0.84, cost: 120, lateralOffset: 2.4, towerType: "ballista" },
  ],
  waves: {
    list: [
      { types: { runner: 12, flyer: 6, brute: 3 }, spawnRateMs: 500, breakMs: 4000 },
      { types: { basic: 10, runner: 12, flyer: 8 }, spawnRateMs: 470, breakMs: 4000 },
      { types: { flyer: 14, runner: 10, brute: 5 }, spawnRateMs: 440, breakMs: 4000 },
      { types: { runner: 14, flyer: 10, shielded: 6 }, spawnRateMs: 420, breakMs: 4500 },
      { types: { flyer: 14, brute: 7, shielded: 6 }, spawnRateMs: 400, breakMs: 0 },
    ],
  },
  castleHP: 155,
  startCoins: 155,
  heroSpawn: [-2, 0, -1],
  briefing: "Plus de volants. Garde au moins une baliste anti-air.",
};
