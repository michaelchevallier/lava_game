export default {
  id: "world5-1",
  name: "Foire — Entrée du Parc",
  theme: "foire",
  paths: [
    [
      [-58, 0, 0],
      [-48, 0, 4],
      [-38, 0, -3],
      [-28, 0, 5],
      [-18, 0, -2],
      [-10, 0, 4],
      [-4, 0, 1],
      [6, 0, 4],
    ],
  ],
  waves: {
    list: [
      { types: { basic: 25, runner: 12 }, spawnRateMs: 380, breakMs: 4000 },
      { types: { runner: 20, basic: 18, imp: 4 }, spawnRateMs: 320, breakMs: 4500 },
      { types: { imp: 16, basic: 22, brute: 2 }, spawnRateMs: 280, breakMs: 5000 },
      { types: { runner: 30, imp: 12, shielded: 3 }, spawnRateMs: 260, breakMs: 0 },
    ],
  },
  castleHP: 130,
  startCoins: 200,
  heroSpawn: [-2, 0, -1],
  briefing: "Bienvenue à la Foire en Lave ! Une foule de visiteurs déchaînés se rue vers la billetterie. Tiens bon.",
};
