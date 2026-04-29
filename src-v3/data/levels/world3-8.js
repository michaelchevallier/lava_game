import { encirclement } from "./_pathTemplates.js";

export default {
  id: "world3-8",
  name: "Désert — Corsaire",
  theme: "desert",
  ...encirclement(),
  slots: [
    { t: 0.30, cost: 50, lateralOffset: 2.4, towerType: "archer", pathIdx: 0 },
    { t: 0.65, cost: 105, lateralOffset: 2.4, towerType: "mage", pathIdx: 0 },
    { t: 0.20, cost: 80, lateralOffset: 2.4, towerType: "ballista", pathIdx: 1 },
    { t: 0.50, cost: 120, lateralOffset: 2.4, towerType: "tank", pathIdx: 1 },
    { t: 0.80, cost: 165, lateralOffset: 2.4, towerType: "ballista", pathIdx: 1 },
  ],
  waves: {
    list: [
      { types: { basic: 14, runner: 10, flyer: 6 }, spawnRateMs: 490, breakMs: 4000 },
      { types: { flyer: 16, runner: 12, brute: 6 }, spawnRateMs: 460, breakMs: 4000 },
      { types: { flyer: 18, assassin: 10, brute: 8, shielded: 6 }, spawnRateMs: 430, breakMs: 4000 },
      { types: { midboss: 1, flyer: 14, brute: 8 }, spawnRateMs: 420, breakMs: 4500 },
      { types: { midboss: 1, flyer: 18, runner: 12, shielded: 7 }, spawnRateMs: 400, breakMs: 5000 },
      { types: { corsair_boss: 1, flyer: 18, assassin: 12, brute: 8 }, spawnRateMs: 380, breakMs: 0 },
    ],
  },
  castleHP: 200,
  startCoins: 220,
  heroSpawn: [-2, 0, -1],
  briefing: "Corsaire — court direct + long encerclement. Boss avec AOE 8s.",
};
