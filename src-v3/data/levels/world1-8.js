export default {
  id: "world1-8",
  name: "Plaine — Brigand",
  theme: "plaine",
  pathPoints: [
    [-58, 0, 4],
    [-44, 0, -12],
    [-22, 0, -16],
    [-2, 0, -8],
    [2, 0, 4],
    [4, 0, 6],
  ],
  waves: {
    list: [
      { types: { basic: 14, runner: 10, brute: 4 }, spawnRateMs: 500, breakMs: 4000 },
      { types: { basic: 12, runner: 12, brute: 5, shielded: 4 }, spawnRateMs: 470, breakMs: 4000 },
      { types: { basic: 10, runner: 14, brute: 7, shielded: 5 }, spawnRateMs: 440, breakMs: 4000 },
      { types: { midboss: 1, basic: 14, brute: 6 }, spawnRateMs: 430, breakMs: 4500 },
      { types: { midboss: 1, basic: 12, runner: 10, shielded: 5 }, spawnRateMs: 410, breakMs: 5000 },
      { types: { brigand_boss: 1, basic: 18, runner: 10, brute: 6 }, spawnRateMs: 400, breakMs: 0 },
    ],
  },
  castleHP: 160,
  startCoins: 180,
  heroSpawn: [-2, 0, -1],
  briefing: "BOSS : le Brigand de la Plaine attaque le château ! Vague finale après 2 mid-bosses. Bravo ! Tu gagnes des gemmes — utilise-les dans le menu Améliorations entre 2 niveaux.",
};
