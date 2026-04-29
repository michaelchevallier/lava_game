export default {
  id: "world3-7",
  name: "Désert — Pyramide",
  theme: "desert",
  pathPoints: [
    [-15, 0, 0], [-10, 0, -4], [-4, 0, 0], [0, 0, -3],
    [5, 0, 0], [8, 0, -2], [6, 0, 4], [2, 0, 6],
  ],
  slots: [
    { t: 0.14, cost: 45, lateralOffset: 2.4, towerType: "archer" },
    { t: 0.32, cost: 75, lateralOffset: 2.4, towerType: "ballista" },
    { t: 0.50, cost: 100, lateralOffset: 2.4, towerType: "mage" },
    { t: 0.70, cost: 115, lateralOffset: 2.4, towerType: "tank" },
    { t: 0.88, cost: 155, lateralOffset: 2.4, towerType: "ballista" },
  ],
  waves: {
    list: [
      { types: { flyer: 18, runner: 12, brute: 6 }, spawnRateMs: 450, breakMs: 4000 },
      { types: { flyer: 18, assassin: 10, brute: 8, shielded: 6 }, spawnRateMs: 420, breakMs: 4000 },
      { types: { flyer: 20, runner: 14, brute: 8, shielded: 7 }, spawnRateMs: 400, breakMs: 4000 },
      { types: { midboss: 1, flyer: 16, assassin: 10, brute: 8 }, spawnRateMs: 390, breakMs: 4500 },
      { types: { midboss: 1, flyer: 20, brute: 10, shielded: 7 }, spawnRateMs: 380, breakMs: 0 },
    ],
  },
  castleHP: 180,
  startCoins: 195,
  heroSpawn: [-2, 0, -1],
  briefing: "Pré-boss : prépare-toi pour le Capitaine Corsaire.",
};
