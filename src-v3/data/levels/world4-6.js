import { parallels } from "./_pathTemplates.js";

export default {
  id: "world4-6",
  name: "Volcan — Forge",
  theme: "volcan",
  ...parallels(),
  waves: {
    list: [
      { types: { imp: 20, flyer: 14, brute: 7 }, spawnRateMs: 420, breakMs: 4000 },
      { types: { imp: 22, runner: 12, brute: 8, shielded: 6 }, spawnRateMs: 400, breakMs: 4000 },
      { types: { imp: 24, flyer: 14, brute: 9, shielded: 7 }, spawnRateMs: 390, breakMs: 4000 },
      { types: { midboss: 1, imp: 18, flyer: 14, brute: 10 }, spawnRateMs: 380, breakMs: 4500 },
      { types: { midboss: 1, imp: 22, brute: 11, shielded: 8 }, spawnRateMs: 370, breakMs: 0 },
    ],
  },
  castleHP: 215,
  startCoins: 230,
  heroSpawn: [-2, 0, -1],
  briefing: "Forge — 2 lanes croisées. Swarm d'imps des 2 côtés.",
};
