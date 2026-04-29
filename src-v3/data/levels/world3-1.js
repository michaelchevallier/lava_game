export default {
  id: "world3-1",
  name: "Désert — Dunes",
  theme: "desert",
  paths: [
    [
      [-15, 0, -5], [-9, 0, -2], [-3, 0, -5], [3, 0, -2],
      [7, 0, -4], [4, 0, 2], [2, 0, 4], [0, 0, 5],
    ],
    [
      [-15, 0, 5], [-9, 0, 2], [-3, 0, 5], [3, 0, 2],
      [7, 0, 4], [4, 0, 2], [2, 0, 4], [0, 0, 5],
    ],
  ],
  slots: [
    { t: 0.20, cost: 40, lateralOffset: 2.4, towerType: "archer", pathIdx: 0 },
    { t: 0.50, cost: 65, lateralOffset: 2.4, towerType: "ballista", pathIdx: 0 },
    { t: 0.20, cost: 40, lateralOffset: 2.4, towerType: "archer", pathIdx: 1 },
    { t: 0.50, cost: 65, lateralOffset: 2.4, towerType: "ballista", pathIdx: 1 },
    { t: 0.85, cost: 120, lateralOffset: 2.4, towerType: "tank", pathIdx: 0 },
  ],
  waves: {
    list: [
      { types: { basic: 14, runner: 10, flyer: 4 }, spawnRateMs: 510, breakMs: 4000 },
      { types: { basic: 12, runner: 12, flyer: 6, brute: 3 }, spawnRateMs: 480, breakMs: 4000 },
      { types: { runner: 14, flyer: 8, brute: 5, shielded: 4 }, spawnRateMs: 450, breakMs: 4000 },
      { types: { basic: 12, flyer: 10, brute: 6, shielded: 5 }, spawnRateMs: 430, breakMs: 4500 },
      { types: { runner: 14, flyer: 12, brute: 7, shielded: 6 }, spawnRateMs: 410, breakMs: 0 },
    ],
  },
  castleHP: 150,
  startCoins: 150,
  heroSpawn: [-2, 0, -1],
  briefing: "Désert : 2 chemins. Les ennemis arrivent du nord ET du sud — adapte tes tours.",
};
