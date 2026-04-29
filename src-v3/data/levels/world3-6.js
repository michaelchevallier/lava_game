export default {
  id: "world3-6",
  name: "Désert — Caravane",
  theme: "desert",
  pathPoints: [
    [-15, 0, -3], [-10, 0, 2], [-3, 0, -2], [2, 0, 1],
    [5, 0, -2], [9, 0, 2], [4, 0, 5], [0, 0, 6],
  ],
  slots: [
    { t: 0.14, cost: 45, lateralOffset: 2.4, towerType: "archer" },
    { t: 0.30, cost: 70, lateralOffset: 2.4, towerType: "ballista" },
    { t: 0.48, cost: 95, lateralOffset: 2.4, towerType: "tank" },
    { t: 0.66, cost: 110, lateralOffset: 2.4, towerType: "mage" },
    { t: 0.84, cost: 150, lateralOffset: 2.4, towerType: "ballista" },
  ],
  waves: {
    list: [
      { types: { flyer: 18, brute: 6 }, spawnRateMs: 450, breakMs: 4000 },
      { types: { flyer: 18, runner: 12, brute: 7, shielded: 5 }, spawnRateMs: 430, breakMs: 4000 },
      { types: { flyer: 20, assassin: 8, brute: 8, shielded: 7 }, spawnRateMs: 410, breakMs: 4000 },
      { types: { midboss: 1, flyer: 16, brute: 9 }, spawnRateMs: 400, breakMs: 4500 },
      { types: { midboss: 1, flyer: 18, brute: 10, shielded: 7 }, spawnRateMs: 380, breakMs: 0 },
    ],
  },
  castleHP: 175,
  startCoins: 185,
  heroSpawn: [-2, 0, -1],
  briefing: "Caravane volée — vague swarm de flyers.",
};
