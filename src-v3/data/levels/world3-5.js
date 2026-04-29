import { encirclement } from "./_pathTemplates.js";

export default {
  id: "world3-5",
  name: "Désert — Mirage",
  theme: "desert",
  ...encirclement(),
  waves: {
    list: [
      { types: { flyer: 16, runner: 10, brute: 5 }, spawnRateMs: 460, breakMs: 4000 },
      { types: { flyer: 16, assassin: 6, brute: 6 }, spawnRateMs: 440, breakMs: 4000 },
      { types: { flyer: 18, runner: 12, brute: 7, shielded: 6 }, spawnRateMs: 420, breakMs: 4000 },
      { types: { midboss: 1, flyer: 16, assassin: 8 }, spawnRateMs: 410, breakMs: 4500 },
      { types: { midboss: 1, flyer: 14, runner: 12, shielded: 7 }, spawnRateMs: 390, breakMs: 0 },
    ],
  },
  castleHP: 170,
  startCoins: 175,
  heroSpawn: [-2, 0, -1],
  briefing: "Mirage — chemin court direct + chemin long encerclant. Priorise le court.",
};
