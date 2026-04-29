export default {
  id: "world4-7",
  name: "Volcan — Antre",
  theme: "volcan",
  pathPoints: [
    [-15, 0, 0], [-10, 0, -4], [-4, 0, 0], [0, 0, -3],
    [5, 0, 0], [8, 0, -2], [6, 0, 4], [2, 0, 6],
  ],
  slots: [
    { t: 0.14, cost: 55, lateralOffset: 2.4, towerType: "archer" },
    { t: 0.32, cost: 85, lateralOffset: 2.4, towerType: "ballista" },
    { t: 0.50, cost: 110, lateralOffset: 2.4, towerType: "mage" },
    { t: 0.70, cost: 125, lateralOffset: 2.4, towerType: "tank" },
    { t: 0.88, cost: 165, lateralOffset: 2.4, towerType: "ballista" },
  ],
  waves: {
    list: [
      { types: { imp: 22, flyer: 14, brute: 8 }, spawnRateMs: 410, breakMs: 4000 },
      { types: { imp: 22, assassin: 10, brute: 9, shielded: 7 }, spawnRateMs: 390, breakMs: 4000 },
      { types: { imp: 24, flyer: 16, brute: 10, shielded: 8 }, spawnRateMs: 380, breakMs: 4000 },
      { types: { midboss: 1, imp: 20, assassin: 12, brute: 9 }, spawnRateMs: 370, breakMs: 4500 },
      { types: { midboss: 1, imp: 24, brute: 11, shielded: 8 }, spawnRateMs: 360, breakMs: 0 },
    ],
  },
  castleHP: 225,
  startCoins: 240,
  heroSpawn: [-2, 0, -1],
  briefing: "L'Antre du Dragon. Pré-boss.",
};
