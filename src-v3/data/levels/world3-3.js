import { parallels } from "./_pathTemplates.js";

export default {
  id: "world3-3",
  name: "Désert — Cratère",
  theme: "desert",
  ...parallels(),
  waves: {
    list: [
      { types: { runner: 14, flyer: 10, brute: 4 }, spawnRateMs: 480, breakMs: 4000 },
      { types: { flyer: 14, basic: 10, brute: 5 }, spawnRateMs: 450, breakMs: 4000 },
      { types: { flyer: 16, runner: 10, brute: 6, shielded: 4 }, spawnRateMs: 430, breakMs: 4000 },
      { types: { runner: 14, flyer: 12, brute: 7, shielded: 6 }, spawnRateMs: 410, breakMs: 4500 },
      { types: { midboss: 1, flyer: 12, brute: 7 }, spawnRateMs: 400, breakMs: 0 },
    ],
  },
  castleHP: 160,
  startCoins: 160,
  heroSpawn: [-2, 0, -1],
  briefing: "Cratère — 2 lanes parallèles qui se croisent au milieu. Mid-boss final.",
};
