import { splitV } from "./_pathTemplates.js";

export default {
  id: "world4-3",
  name: "Volcan — Grotte",
  theme: "volcan",
  ...splitV(),
  slots: [
    { t: 0.18, cost: 50, lateralOffset: 2.4, towerType: "archer", pathIdx: 0 },
    { t: 0.45, cost: 75, lateralOffset: 2.4, towerType: "ballista", pathIdx: 0 },
    { t: 0.45, cost: 105, lateralOffset: 2.4, towerType: "mage", pathIdx: 1 },
    { t: 0.78, cost: 115, lateralOffset: 2.4, towerType: "tank", pathIdx: 0 },
    { t: 0.86, cost: 155, lateralOffset: 2.4, towerType: "ballista", pathIdx: 0 },
  ],
  waves: {
    list: [
      { types: { imp: 14, flyer: 10, brute: 5 }, spawnRateMs: 450, breakMs: 4000 },
      { types: { imp: 16, runner: 10, brute: 7, shielded: 4 }, spawnRateMs: 430, breakMs: 4000 },
      { types: { imp: 18, flyer: 12, brute: 8, shielded: 6 }, spawnRateMs: 410, breakMs: 4000 },
      { types: { runner: 14, imp: 16, brute: 9, shielded: 6 }, spawnRateMs: 390, breakMs: 4500 },
      { types: { midboss: 1, imp: 14, flyer: 10, brute: 7 }, spawnRateMs: 380, breakMs: 0 },
    ],
  },
  castleHP: 190,
  startCoins: 200,
  heroSpawn: [-2, 0, -1],
  briefing: "Grotte — la galerie se sépare. Mid-boss random sur les branches.",
};
