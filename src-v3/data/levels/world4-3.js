import { splitV } from "./_pathTemplates.js";

export default {
  id: "world4-3",
  name: "Volcan — Grotte",
  theme: "volcan",
  ...splitV(),
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
