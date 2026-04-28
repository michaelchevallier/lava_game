export default {
  id: "world1-5",
  name: "Plaine — 5",
  theme: "plaine",
  pathPoints: [
    [-15, 0, -8], [-9, 0, -2], [-5, 0, -7], [0, 0, -3],
    [4, 0, -8], [8, 0, -2], [6, 0, 4], [2, 0, 6],
  ],
  slots: [
    { t: 0.18, cost: 35, lateralOffset: 2.4, towerType: "archer" },
    { t: 0.40, cost: 60, lateralOffset: 2.4, towerType: "tank" },
    { t: 0.60, cost: 85, lateralOffset: 2.4, towerType: "mage" },
    { t: 0.85, cost: 120, lateralOffset: 2.4, towerType: "ballista" },
  ],
  waves: {
    list: [
      { types: { basic: 18, runner: 8, shielded: 2 }, spawnRateMs: 580, breakMs: 4000 },
      { types: { basic: 14, runner: 10, brute: 3 }, spawnRateMs: 540, breakMs: 4000 },
      { types: { basic: 12, runner: 12, brute: 4, shielded: 3 }, spawnRateMs: 500, breakMs: 4000 },
      { types: { basic: 10, runner: 14, brute: 5, shielded: 4 }, spawnRateMs: 470, breakMs: 4500 },
      { types: { midboss: 1, basic: 12, brute: 4, runner: 8 }, spawnRateMs: 460, breakMs: 0 },
    ],
  },
  castleHP: 140,
  startCoins: 130,
  heroSpawn: [-2, 0, -1],
  briefing: "Mid-boss : un Sorcier débarque en vague 5. Concentrez le feu !",
};
