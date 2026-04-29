import { splitV } from "./_pathTemplates.js";

export default {
  id: "world3-6",
  name: "Désert — Caravane",
  theme: "desert",
  ...splitV(),
  waves: {
    list: [
      { types: { flyer: 18, brute: 6 }, spawnRateMs: 450, breakMs: 4000 },
      { types: { flyer: 18, runner: 12, brute: 7, shielded: 5 }, spawnRateMs: 430, breakMs: 4000 },
      { types: { flyer: 20, assassin: 8, brute: 8, shielded: 7 }, spawnRateMs: 410, breakMs: 4000 },
      { types: { midboss: 1, flyer: 16, brute: 9 }, spawnRateMs: 400, breakMs: 4500 },
      { types: { midboss: 1, flyer: 18, brute: 10, shielded: 7 }, spawnRateMs: 380, breakMs: 0 },
    ],
  },
  castleHP: 175,
  startCoins: 185,
  heroSpawn: [-2, 0, -1],
  briefing: "Caravane — la route se sépare. Flyers swarm sur les 2 branches.",
};
