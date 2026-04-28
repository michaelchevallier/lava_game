export default {
  id: "world1-1",
  name: "Plaine du Royaume — 1",
  theme: "plaine",
  pathPoints: [
    [-15, 0, -8], [-9, 0, -2], [-5, 0, -7], [0, 0, -3],
    [4, 0, -8], [8, 0, -2], [6, 0, 4], [2, 0, 6],
  ],
  slots: [
    { t: 0.28, cost: 30, lateralOffset: 2.4 },
    { t: 0.50, cost: 50, lateralOffset: 2.4 },
    { t: 0.72, cost: 75, lateralOffset: 2.4 },
  ],
  waves: {
    firstSize: 25,
    sizeMultiplier: 1.25,
    spawnRateMs: 600,
    spawnRateDecMs: 40,
    spawnRateMinMs: 200,
    breakMs: 4000,
    finalWave: 5,
  },
  castleHP: 100,
  startCoins: 100,
  heroSpawn: [-2, 0, -1],
  briefing: "Plaine du Royaume — défends le château.",
  tutorial: "WASD/joystick pour bouger · entre dans un cercle jaune pour construire (l'or coule pendant que tu y restes)",
};
