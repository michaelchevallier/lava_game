export default {
  id: "world5-2",
  name: "Foire — Manège Maudit",
  theme: "foire",
  paths: [
    [
      [-58, 0, -8],
      [-48, 0, -14],
      [-38, 0, -16],
      [-28, 0, -10],
      [-18, 0, 0],
      [-10, 0, 10],
      [-4, 0, 14],
      [2, 0, 8],
      [6, 0, 4],
    ],
  ],
  waves: {
    list: [
      { types: { basic: 22, runner: 18 }, spawnRateMs: 360, breakMs: 4000 },
      { types: { runner: 24, basic: 16, imp: 8 }, spawnRateMs: 310, breakMs: 4500 },
      { types: { imp: 20, runner: 18, brute: 4 }, spawnRateMs: 280, breakMs: 4500 },
      { types: { basic: 28, imp: 16, shielded: 4 }, spawnRateMs: 260, breakMs: 5000 },
      { types: { runner: 32, imp: 14, brute: 4, shielded: 4 }, spawnRateMs: 240, breakMs: 0 },
    ],
  },
  castleHP: 150,
  startCoins: 220,
  heroSpawn: [-2, 0, -1],
  briefing: "Le Manège Maudit tourne à plein régime — et ses passagers déchaînés prennent le chemin du U inversé. Bloque le goulot.",
};
