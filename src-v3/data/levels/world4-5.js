import { mergeY } from "./_pathTemplates.js";

export default {
  id: "world4-5",
  name: "Volcan — Geyser",
  theme: "volcan",
  ...mergeY(),
  slots: [
    { t: 0.20, cost: 55, lateralOffset: 2.4, towerType: "archer", pathIdx: 0 },
    { t: 0.20, cost: 80, lateralOffset: 2.4, towerType: "tank", pathIdx: 1 },
    { t: 0.55, cost: 105, lateralOffset: 2.4, towerType: "mage", pathIdx: 0 },
    { t: 0.78, cost: 120, lateralOffset: 2.4, towerType: "ballista", pathIdx: 0 },
    { t: 0.88, cost: 160, lateralOffset: 2.4, towerType: "ballista", pathIdx: 0 },
  ],
  waves: {
    list: [
      { types: { imp: 18, flyer: 12, brute: 6 }, spawnRateMs: 430, breakMs: 4000 },
      { types: { imp: 18, assassin: 8, flyer: 10, brute: 7 }, spawnRateMs: 410, breakMs: 4000 },
      { types: { imp: 20, flyer: 14, brute: 8, shielded: 7 }, spawnRateMs: 390, breakMs: 4000 },
      { types: { midboss: 1, imp: 16, flyer: 12, brute: 9 }, spawnRateMs: 380, breakMs: 4500 },
      { types: { midboss: 1, imp: 20, assassin: 10, shielded: 8 }, spawnRateMs: 370, breakMs: 0 },
    ],
  },
  castleHP: 205,
  startCoins: 220,
  heroSpawn: [-2, 0, -1],
  briefing: "Geyser — 2 chemins convergent. Mélange chaotique de tous les types.",
};
