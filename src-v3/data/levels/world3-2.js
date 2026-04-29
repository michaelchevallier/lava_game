import { mergeY } from "./_pathTemplates.js";

export default {
  id: "world3-2",
  name: "Désert — Oasis",
  theme: "desert",
  ...mergeY(),
  slots: [
    { t: 0.20, cost: 40, lateralOffset: 2.4, towerType: "archer", pathIdx: 0 },
    { t: 0.20, cost: 65, lateralOffset: 2.4, towerType: "mage", pathIdx: 1 },
    { t: 0.62, cost: 90, lateralOffset: 2.4, towerType: "tank", pathIdx: 0 },
    { t: 0.84, cost: 120, lateralOffset: 2.4, towerType: "ballista", pathIdx: 0 },
  ],
  waves: {
    list: [
      { types: { runner: 12, flyer: 6, brute: 3 }, spawnRateMs: 500, breakMs: 4000 },
      { types: { basic: 10, runner: 12, flyer: 8 }, spawnRateMs: 470, breakMs: 4000 },
      { types: { flyer: 14, runner: 10, brute: 5 }, spawnRateMs: 440, breakMs: 4000 },
      { types: { runner: 14, flyer: 10, shielded: 6 }, spawnRateMs: 420, breakMs: 4500 },
      { types: { flyer: 14, brute: 7, shielded: 6 }, spawnRateMs: 400, breakMs: 0 },
    ],
  },
  castleHP: 155,
  startCoins: 155,
  heroSpawn: [-2, 0, -1],
  briefing: "Désert — 2 chemins convergent vers l'oasis. Couvre les 2 entrées.",
};
