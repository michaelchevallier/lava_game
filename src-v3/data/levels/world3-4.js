import { splitV } from "./_pathTemplates.js";

export default {
  id: "world3-4",
  name: "Désert — Tempête",
  theme: "desert",
  ...splitV(),
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
