import { mazeXXL } from "./_pathTemplates.js";

export default {
  id: "world4-8",
  name: "Volcan — Dragon",
  theme: "volcan",
  paths: (() => {
    const main = mazeXXL({ rooms: 7, startX: -56, ampZ: 22 }).paths[0];
    // Lane courte arrière depuis x positif (ennemis qui contournent par derrière), in-bounds
    const back = [[56, 0, -3], [44, 0, 5], [32, 0, -2], [22, 0, 3], [12, 0, -1], [6, 0, 2], [2, 0, 4], [0, 0, 5]];
    return [main, back];
  })(),
  waves: {
    list: [
      { types: { basic: 24, runner: 16, imp: 14 }, spawnRateMs: 360, breakMs: 4000 },
      { types: { imp: 30, flyer: 20, brute: 14 }, spawnRateMs: 320, breakMs: 4000 },
      { types: { imp: 34, flyer: 22, assassin: 18, brute: 14, shielded: 12 }, spawnRateMs: 300, breakMs: 4000 },
      { types: { midboss: 2, imp: 28, flyer: 18, brute: 14 }, spawnRateMs: 290, breakMs: 4500 },
      { types: { midboss: 2, imp: 36, flyer: 22, shielded: 14 }, spawnRateMs: 270, breakMs: 5000 },
      { types: { dragon_boss: 1, imp: 40, flyer: 26, brute: 18, shielded: 14 }, spawnRateMs: 240, breakMs: 0 },
    ],
  },
  castleHP: 280,
  castleLossMode: "all",
  castles: [
    { pos: [2, 0, 6], hp: 200, pathIdx: 0 },
    { pos: [0, 0, 5], hp: 80, pathIdx: 1 },
  ],
  startCoins: 320,
  heroSpawn: [-2, 0, -1],
  briefing: "BOSS FINAL : 2 chemins (serpentine + lane arrière). Le Dragon arrive. Bravo ! Tu gagnes des gemmes — utilise-les dans le menu Améliorations entre 2 niveaux.",
};
