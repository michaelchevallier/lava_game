export default {
  id: "world4-1",
  name: "Volcan — Caldera",
  theme: "volcan",
  paths: [
    [
      [-58, 0, 2],
      [-50, 0, -4],
      [-42, 0, -10],
      [-34, 0, -14],
      [-24, 0, -16],
      [-14, 0, -10],
      [-8, 0, -2],
      [-4, 0, 6],
      [0, 0, 12],
      [4, 0, 8],
      [6, 0, 4],
      [2, 0, 6],
    ],
  ],
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
  briefing: "Coulée en U — le chemin plonge vers le sud avant de remonter vers le château.",
};
