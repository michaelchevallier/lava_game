export default {
  id: "world4-8",
  name: "Volcan — Dragon",
  theme: "volcan",
  paths: (() => {
    // Mega-maze 7 rooms par lane chacune, 2 lanes opposées + 1 court
    const make = (zSign) => {
      const pts = [];
      const rooms = 7, startX = -130, endX = 0, ampZ = 32;
      const stepX = (endX - startX) / rooms;
      for (let r = 0; r < rooms; r++) {
        const x0 = startX + r * stepX;
        const dir = r % 2 === 0 ? 1 : -1;
        pts.push([x0, 0, zSign * dir * ampZ * 0.35]);
        pts.push([x0 + stepX * 0.25, 0, -zSign * dir * ampZ * 0.7]);
        pts.push([x0 + stepX * 0.5, 0, zSign * dir * ampZ * 0.5]);
        pts.push([x0 + stepX * 0.75, 0, -zSign * dir * ampZ * 0.3]);
      }
      pts.push([0, 0, 5]);
      return pts;
    };
    return [
      make(1),
      make(-1),
      // Lane courte arrière (depuis x positif)
      [[60, 0, -3], [50, 0, 5], [40, 0, -2], [30, 0, 3], [20, 0, -2], [10, 0, 1], [4, 0, 3], [0, 0, 5]],
    ];
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
  startCoins: 320,
  heroSpawn: [-2, 0, -1],
  briefing: "BOSS FINAL : 3 chemins ! Le Dragon arrive avec ses minions de toutes parts.",
};
