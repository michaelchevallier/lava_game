import { parallels } from "./_pathTemplates.js";

export default {
  id: "world4-2",
  name: "Volcan — Falaise",
  theme: "volcan",
  ...parallels(),
  slots: [
    { t: 0.18, cost: 50, lateralOffset: 2.4, towerType: "archer", pathIdx: 0 },
    { t: 0.18, cost: 75, lateralOffset: 2.4, towerType: "mage", pathIdx: 1 },
    { t: 0.56, cost: 100, lateralOffset: 2.4, towerType: "ballista", pathIdx: 0 },
    { t: 0.84, cost: 130, lateralOffset: 2.4, towerType: "tank", pathIdx: 0 },
  ],
  waves: {
    list: [
      { types: { runner: 14, imp: 10, flyer: 6 }, spawnRateMs: 460, breakMs: 4000 },
      { types: { imp: 14, flyer: 10, brute: 5 }, spawnRateMs: 430, breakMs: 4000 },
      { types: { imp: 16, flyer: 12, brute: 7 }, spawnRateMs: 410, breakMs: 4000 },
      { types: { runner: 14, imp: 16, shielded: 6 }, spawnRateMs: 390, breakMs: 4500 },
      { types: { imp: 18, flyer: 12, brute: 8, shielded: 6 }, spawnRateMs: 380, breakMs: 0 },
    ],
  },
  castleHP: 185,
  startCoins: 185,
  heroSpawn: [-2, 0, -1],
  briefing: "Falaise — 2 lanes croisées. Imps bondissent du précipice.",
};
