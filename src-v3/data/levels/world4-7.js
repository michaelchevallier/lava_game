import { encirclement } from "./_pathTemplates.js";

export default {
  id: "world4-7",
  name: "Volcan — Antre",
  theme: "volcan",
  ...encirclement(),
  slots: [
    { t: 0.30, cost: 55, lateralOffset: 2.4, towerType: "archer", pathIdx: 0 },
    { t: 0.65, cost: 110, lateralOffset: 2.4, towerType: "mage", pathIdx: 0 },
    { t: 0.20, cost: 85, lateralOffset: 2.4, towerType: "ballista", pathIdx: 1 },
    { t: 0.50, cost: 125, lateralOffset: 2.4, towerType: "tank", pathIdx: 1 },
    { t: 0.80, cost: 165, lateralOffset: 2.4, towerType: "ballista", pathIdx: 1 },
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
  briefing: "Antre — court vs long encerclement. Pré-boss Dragon.",
};
