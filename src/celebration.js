export function createCelebrationSystem({ k, gameState, audio, juice, showPopup, WIDTH, HEIGHT, MILESTONES }) {
  function launchFirework(x, y, color) {
    if (k.get("particle-firework").length > 60) return;
    for (let i = 0; i < 12; i++) {
      const a = (Math.PI * 2 * i) / 12 + Math.random() * 0.2;
      const sp = 150 + Math.random() * 120;
      k.add([
        k.circle(3 + Math.random() * 2),
        k.pos(x, y),
        k.color(color),
        k.opacity(1),
        k.lifespan(1.5, { fade: 1 }),
        k.z(20),
        "particle-firework",
        { vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, grav: 180 },
      ]);
    }
  }

  function celebrateMilestone(target) {
    audio.combo();
    setTimeout(() => audio.coin(), 200);
    setTimeout(() => audio.combo(), 400);
    setTimeout(() => audio.confetti(), 600);
    const colors = [
      k.rgb(255, 80, 120),
      k.rgb(255, 210, 60),
      k.rgb(100, 230, 255),
      k.rgb(140, 255, 120),
      k.rgb(255, 140, 240),
    ];
    for (let i = 0; i < 4; i++) {
      k.wait(i * 0.25, () => {
        const x = 100 + Math.random() * (WIDTH - 200);
        const y = 100 + Math.random() * 200;
        launchFirework(x, y, colors[i % colors.length]);
      });
    }
    if (gameState.constellationActive) { showPopup(WIDTH / 2, HEIGHT / 2, `PALIER ${target}!`, k.rgb(255, 230, 80), 40); juice.dirShake(0, 1, 10, 0.2); return; }
    for (let i = 0; i < 30; i++) {
      const cx = Math.random() * WIDTH;
      const c = colors[i % colors.length];
      k.add([
        k.rect(4, 8),
        k.pos(cx, -10 - Math.random() * 80),
        k.color(c),
        k.rotate(Math.random() * 360),
        k.opacity(1),
        k.lifespan(3.5, { fade: 1.5 }),
        k.z(25),
        "confetti",
        { vy: 80 + Math.random() * 60, vx: (Math.random() - 0.5) * 30, spin: (Math.random() - 0.5) * 360 },
      ]);
    }
    showPopup(WIDTH / 2, HEIGHT / 2, `PALIER ${target}!`, k.rgb(255, 230, 80), 40);
    juice.dirShake(0, 1, 10, 0.2);
  }

  k.onUpdate("confetti", (p) => {
    p.pos.y += p.vy * k.dt();
    p.pos.x += p.vx * k.dt();
    p.angle = (p.angle || 0) + p.spin * k.dt();
    p.vy += 30 * k.dt();
  });

  function checkMilestone() {
    window.__quests?.onScore(gameState.score); window.__tiers?.onScore(gameState.score);
    while (
      gameState.milestoneIdx < MILESTONES.length &&
      gameState.score >= MILESTONES[gameState.milestoneIdx]
    ) {
      celebrateMilestone(MILESTONES[gameState.milestoneIdx]);
      gameState.milestoneIdx += 1;
    }
  }

  return { celebrateMilestone, checkMilestone, launchFirework };
}
