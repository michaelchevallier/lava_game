import { parallels } from "./_pathTemplates.js";

export default {
  id: "world3-7",
  name: "Désert — Pyramide",
  theme: "desert",
  ...parallels(),
  waves: {
    list: [
      { types: { flyer: 18, runner: 12, brute: 6 }, spawnRateMs: 450, breakMs: 4000 },
      { types: { flyer: 18, assassin: 10, brute: 8, shielded: 6 }, spawnRateMs: 420, breakMs: 4000 },
      { types: { flyer: 20, runner: 14, brute: 8, shielded: 7 }, spawnRateMs: 400, breakMs: 4000 },
      { types: { midboss: 1, flyer: 16, assassin: 10, brute: 8 }, spawnRateMs: 390, breakMs: 4500 },
      { types: { midboss: 1, flyer: 20, brute: 10, shielded: 7 }, spawnRateMs: 380, breakMs: 0 },
    ],
  },
  castleHP: 180,
  startCoins: 195,
  heroSpawn: [-2, 0, -1],
  briefing: "Pyramide — 2 lanes croisées. Pré-boss : prépare-toi pour le Capitaine Corsaire.",
};
