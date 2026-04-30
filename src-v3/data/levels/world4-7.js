import { mazeXXL } from "./_pathTemplates.js";

export default {
  id: "world4-7",
  name: "Volcan — Antre",
  theme: "volcan",
  ...mazeXXL({ rooms: 25, startX: -3000, ampZ: 200 }),
  waves: {
    list: [
      { types: { imp: 32, flyer: 20, brute: 12 }, spawnRateMs: 320, breakMs: 4000 },
      { types: { imp: 34, assassin: 16, brute: 14, shielded: 10 }, spawnRateMs: 300, breakMs: 4000 },
      { types: { imp: 38, flyer: 24, brute: 15, shielded: 12 }, spawnRateMs: 290, breakMs: 4000 },
      { types: { midboss: 2, imp: 30, assassin: 18, brute: 14 }, spawnRateMs: 280, breakMs: 4500 },
      { types: { midboss: 2, imp: 36, brute: 16, shielded: 12 }, spawnRateMs: 270, breakMs: 0 },
    ],
  },
  castleHP: 240,
  startCoins: 260,
  heroSpawn: [-2, 0, -1],
  briefing: "Antre — méga-maze. Pré-boss Dragon.",
};
