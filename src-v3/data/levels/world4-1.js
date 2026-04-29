import { mergeY } from "./_pathTemplates.js";

export default {
  id: "world4-1",
  name: "Volcan — Caldera",
  theme: "volcan",
  ...mergeY(),
  waves: {
    list: [
      { types: { basic: 14, runner: 10, imp: 5 }, spawnRateMs: 480, breakMs: 4000 },
      { types: { runner: 12, flyer: 8, imp: 8, brute: 4 }, spawnRateMs: 450, breakMs: 4000 },
      { types: { flyer: 12, imp: 12, brute: 6, shielded: 5 }, spawnRateMs: 430, breakMs: 4000 },
      { types: { imp: 14, flyer: 12, brute: 7, shielded: 6 }, spawnRateMs: 410, breakMs: 4500 },
      { types: { runner: 14, imp: 14, flyer: 10, shielded: 7 }, spawnRateMs: 390, breakMs: 0 },
    ],
  },
  castleHP: 180,
  startCoins: 180,
  heroSpawn: [-2, 0, -1],
  briefing: "Volcan — 2 chemins convergent vers la caldera. Imps brûlent vite.",
};
