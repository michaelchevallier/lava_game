// Ballons flottants ambient : toutes ~50s, spawn 3-5 ballons colorés qui montent
// depuis le sol vers le haut. Clic dessus pour pop → +10 pts + confetti.
// Fun visuel "fête foraine", zéro gameplay lourd.

export function createBalloonSystem({ k, gameState, audio, showPopup, WIDTH, GROUND_ROW, TILE }) {
  const COLORS = [
    [255, 80, 80], [80, 180, 255], [255, 220, 80],
    [180, 100, 220], [100, 220, 130], [255, 140, 60],
  ];
  let nextSpawnAt = k.time() + 15 + Math.random() * 15;

  function spawnBalloon(x) {
    const colorIdx = Math.floor(Math.random() * COLORS.length);
    const [r, g, b] = COLORS[colorIdx];
    const startY = (GROUND_ROW - 1) * TILE;
    const bal = k.add([
      k.circle(10),
      k.pos(x, startY),
      k.color(k.rgb(r, g, b)),
      k.outline(2, k.rgb(Math.max(0, r - 80), Math.max(0, g - 80), Math.max(0, b - 80))),
      k.area({ shape: new k.Rect(k.vec2(-12, -12), 24, 24) }),
      k.opacity(0),
      k.z(15),
      "balloon",
      {
        bornAt: k.time(),
        vy: -40 - Math.random() * 20,
        driftPhase: Math.random() * Math.PI * 2,
        popped: false,
        string: null,
      },
    ]);
    // Ficelle (petit trait vertical sous le ballon)
    const str = k.add([
      k.rect(1, 20),
      k.pos(x, startY + 12),
      k.color(k.rgb(60, 60, 60)),
      k.opacity(0.7),
      k.z(14),
      "balloon-string",
    ]);
    bal.string = str;
    bal.onUpdate(() => {
      if (bal.popped) return;
      const age = k.time() - bal.bornAt;
      bal.opacity = Math.min(1, age * 2);
      bal.pos.y += bal.vy * k.dt();
      bal.pos.x += Math.sin(age * 2 + bal.driftPhase) * 10 * k.dt();
      if (str?.exists?.()) {
        str.pos.x = bal.pos.x;
        str.pos.y = bal.pos.y + 12;
        str.opacity = bal.opacity * 0.7;
      }
      if (bal.pos.y < -40) {
        if (str?.exists?.()) k.destroy(str);
        k.destroy(bal);
      }
    });
  }

  function popBalloon(bal) {
    if (bal.popped) return;
    bal.popped = true;
    gameState.score += 10;
    gameState.balloonsPopped = (gameState.balloonsPopped || 0) + 1;
    if (gameState.balloonsPopped === 20) window.__spectres?.unlock(25);
    audio.coin?.();
    showPopup(bal.pos.x, bal.pos.y - 15, "+10", k.rgb(255, 220, 80), 16);
    const c = bal.color || k.rgb(255, 80, 80);
    for (let i = 0; i < 12; i++) {
      const a = (Math.PI * 2 * i) / 12;
      k.add([
        k.circle(2 + Math.random() * 2),
        k.pos(bal.pos.x, bal.pos.y),
        k.color(c),
        k.opacity(1),
        k.lifespan(0.4, { fade: 0.3 }),
        k.z(16),
        "particle",
        { vx: Math.cos(a) * 80, vy: Math.sin(a) * 80 },
      ]);
    }
    if (bal.string?.exists?.()) k.destroy(bal.string);
    k.destroy(bal);
  }

  k.onClick("balloon", popBalloon);

  k.loop(1, () => {
    if (k.time() < nextSpawnAt) return;
    nextSpawnAt = k.time() + 45 + Math.random() * 25;
    const count = 3 + Math.floor(Math.random() * 3); // 3-5
    const baseX = 100 + Math.random() * (WIDTH - 200);
    for (let i = 0; i < count; i++) {
      const x = baseX + (i - count / 2) * 28 + (Math.random() - 0.5) * 10;
      spawnBalloon(x);
    }
  });

  return { spawnBalloon };
}
