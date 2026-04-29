export default {
  id: "world2-4",
  name: "Forêt — Marécage",
  theme: "foret",
  paths: [
    [
      [-15, 0, -4], [-10, 0, -1], [-4, 0, -4], [1, 0, -1],
      [5, 0, -3], [3, 0, 2], [1, 0, 4], [0, 0, 5],
    ],
    [
      [-15, 0, 4], [-10, 0, 1], [-4, 0, 4], [1, 0, 1],
      [5, 0, 3], [3, 0, 2], [1, 0, 4], [0, 0, 5],
    ],
  ],
  slots: [
    { t: 0.18, cost: 40, lateralOffset: 2.4, towerType: "archer", pathIdx: 0 },
    { t: 0.45, cost: 70, lateralOffset: 2.4, towerType: "mage", pathIdx: 0 },
    { t: 0.18, cost: 40, lateralOffset: 2.4, towerType: "archer", pathIdx: 1 },
    { t: 0.45, cost: 70, lateralOffset: 2.4, towerType: "tank", pathIdx: 1 },
    { t: 0.85, cost: 140, lateralOffset: 2.4, towerType: "ballista", pathIdx: 0 },
  ],
  waves: {
    list: [
      { types: { basic: 12, assassin: 10, shielded: 4 }, spawnRateMs: 490, breakMs: 4000 },
      { types: { runner: 14, assassin: 12, brute: 5 }, spawnRateMs: 460, breakMs: 4000 },
      { types: { assassin: 16, basic: 8, brute: 6, shielded: 6 }, spawnRateMs: 430, breakMs: 4000 },
      { types: { runner: 14, assassin: 14, brute: 7, shielded: 7 }, spawnRateMs: 410, breakMs: 4500 },
      { types: { midboss: 1, assassin: 14, brute: 8, shielded: 6 }, spawnRateMs: 390, breakMs: 0 },
    ],
  },
  castleHP: 145,
  startCoins: 145,
  heroSpawn: [-2, 0, -1],
  briefing: "Marécage : 2 chemins distincts à travers la forêt.",
};
