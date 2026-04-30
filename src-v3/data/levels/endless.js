function buildEndlessWaves(count = 40) {
  const list = [];
  for (let i = 0; i < count; i++) {
    const tier = Math.floor(i / 5);
    const ratio = 1 + i * 0.18;
    const types = {};
    if (tier === 0) {
      types.basic = Math.round(12 * ratio);
      types.runner = Math.round(7 * ratio);
    } else if (tier === 1) {
      types.basic = Math.round(10 * ratio);
      types.runner = Math.round(12 * ratio);
      types.assassin = Math.round(5 * ratio);
      types.brute = Math.round(4 * ratio);
    } else if (tier === 2) {
      types.runner = Math.round(14 * ratio);
      types.assassin = Math.round(10 * ratio);
      types.flyer = Math.round(8 * ratio);
      types.brute = Math.round(6 * ratio);
      types.shielded = Math.round(5 * ratio);
    } else if (tier === 3) {
      types.flyer = Math.round(16 * ratio);
      types.imp = Math.round(12 * ratio);
      types.assassin = Math.round(10 * ratio);
      types.brute = Math.round(8 * ratio);
      types.shielded = Math.round(6 * ratio);
      if (i % 5 === 4) types.midboss = 1;
    } else if (tier === 4) {
      types.imp = Math.round(20 * ratio);
      types.flyer = Math.round(16 * ratio);
      types.brute = Math.round(10 * ratio);
      types.shielded = Math.round(8 * ratio);
      types.assassin = Math.round(10 * ratio);
      if (i % 3 === 0) types.midboss = 1;
    } else if (tier === 5) {
      types.imp = Math.round(28 * ratio);
      types.flyer = Math.round(22 * ratio);
      types.brute = Math.round(14 * ratio);
      types.shielded = Math.round(12 * ratio);
      types.assassin = Math.round(14 * ratio);
      if (i % 2 === 0) types.midboss = Math.min(3, 1 + Math.floor((i - 25) / 5));
    } else {
      // tier 6+ : end-game spam absolu
      types.imp = Math.round(38 * ratio);
      types.flyer = Math.round(30 * ratio);
      types.brute = Math.round(20 * ratio);
      types.shielded = Math.round(18 * ratio);
      types.assassin = Math.round(20 * ratio);
      types.runner = Math.round(15 * ratio);
      types.midboss = Math.min(5, 2 + Math.floor((i - 35) / 4));
      if (i % 5 === 4) types.boss = 1;
    }
    list.push({
      types,
      spawnRateMs: Math.max(180, 480 - i * 9),
      breakMs: tier >= 5 ? 2500 : 3500,
    });
  }
  return list;
}

export default {
  id: "endless",
  name: "Endless",
  theme: "plaine",
  // Mega-maze: ~10 rooms × 5 waypoints = 50+ points, path length ~280u
  pathPoints: (() => {
    const pts = [];
    const rooms = 10, startX = -180, endX = 0, ampZ = 40;
    const stepX = (endX - startX) / rooms;
    for (let r = 0; r < rooms; r++) {
      const x0 = startX + r * stepX;
      const dir = r % 2 === 0 ? 1 : -1;
      pts.push([x0, 0, dir * ampZ * 0.3]);
      pts.push([x0 + stepX * 0.2, 0, -dir * ampZ * 0.7]);
      pts.push([x0 + stepX * 0.45, 0, dir * ampZ * 0.5]);
      pts.push([x0 + stepX * 0.7, 0, -dir * ampZ * 0.4]);
      pts.push([x0 + stepX * 0.9, 0, dir * ampZ * 0.2]);
    }
    pts.push([1, 0, 3]);
    pts.push([2, 0, 6]);
    return pts;
  })(),
  waves: {
    list: buildEndlessWaves(40),
  },
  castleHP: 250,
  startCoins: 220,
  heroSpawn: [-2, 0, -1],
  briefing: "ENDLESS — vagues infinies. Tier 5+ devient brutal. Combien tiendras-tu ?",
  isEndless: true,
};
