import { encirclement } from "./_pathTemplates.js";

export default {
  id: "world4-4",
  name: "Volcan — Coulée",
  theme: "volcan",
  ...encirclement(),
  slots: [
    { t: 0.30, cost: 55, lateralOffset: 2.4, towerType: "archer", pathIdx: 0 },
    { t: 0.65, cost: 105, lateralOffset: 2.4, towerType: "mage", pathIdx: 0 },
    { t: 0.20, cost: 80, lateralOffset: 2.4, towerType: "ballista", pathIdx: 1 },
    { t: 0.50, cost: 120, lateralOffset: 2.4, towerType: "tank", pathIdx: 1 },
    { t: 0.80, cost: 160, lateralOffset: 2.4, towerType: "ballista", pathIdx: 1 },
  ],
  waves: {
    list: [
      { types: { imp: 18, flyer: 10, brute: 6 }, spawnRateMs: 440, breakMs: 4000 },
      { types: { imp: 18, runner: 12, brute: 7, shielded: 5 }, spawnRateMs: 420, breakMs: 4000 },
      { types: { imp: 20, flyer: 12, brute: 8, shielded: 6 }, spawnRateMs: 400, breakMs: 4000 },
      { types: { midboss: 1, imp: 16, flyer: 10, brute: 8 }, spawnRateMs: 390, breakMs: 4500 },
      { types: { midboss: 1, imp: 18, runner: 10, shielded: 7 }, spawnRateMs: 380, breakMs: 0 },
    ],
  },
  castleHP: 195,
  startCoins: 240,
  heroSpawn: [-2, 0, -1],
  briefing: "Coulée — court direct + long encerclement. 2 mid-bosses.",
};
