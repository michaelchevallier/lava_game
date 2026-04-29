import { splitV } from "./_pathTemplates.js";

export default {
  id: "world3-4",
  name: "Désert — Tempête",
  theme: "desert",
  ...splitV(),
  slots: [
    { t: 0.18, cost: 45, lateralOffset: 2.4, towerType: "archer", pathIdx: 0 },
    { t: 0.45, cost: 70, lateralOffset: 2.4, towerType: "ballista", pathIdx: 0 },
    { t: 0.45, cost: 95, lateralOffset: 2.4, towerType: "mage", pathIdx: 1 },
    { t: 0.78, cost: 110, lateralOffset: 2.4, towerType: "ballista", pathIdx: 0 },
    { t: 0.88, cost: 145, lateralOffset: 2.4, towerType: "tank", pathIdx: 0 },
  ],
  waves: {
    list: [
      { types: { flyer: 14, basic: 12, brute: 5 }, spawnRateMs: 470, breakMs: 4000 },
      { types: { flyer: 16, runner: 12, brute: 6 }, spawnRateMs: 440, breakMs: 4000 },
      { types: { flyer: 18, brute: 7, shielded: 5 }, spawnRateMs: 420, breakMs: 4000 },
      { types: { midboss: 1, flyer: 14, brute: 8 }, spawnRateMs: 410, breakMs: 4500 },
      { types: { midboss: 1, flyer: 16, runner: 10, shielded: 6 }, spawnRateMs: 390, breakMs: 0 },
    ],
  },
  castleHP: 165,
  startCoins: 195,
  heroSpawn: [-2, 0, -1],
  briefing: "Tempête — le chemin se divise. 2 mid-bosses random sur les branches.",
};
