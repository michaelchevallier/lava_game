export function createCoinThiefSystem({ k, gameState, audio, showPopup, WIDTH, GROUND_ROW, TILE }) {
  let activeThief = null;
  let nextSpawnAt = k.time() + 25 + Math.random() * 10;

  function spawnThief() {
    if (activeThief?.exists?.()) return;
    const fromLeft = Math.random() < 0.5;
    const startX = fromLeft ? -40 : WIDTH + 40;
    const dir = fromLeft ? 1 : -1;
    const targetX = WIDTH / 2;
    const yBase = (GROUND_ROW - 4) * TILE;

    const thief = k.add([
      k.circle(12),
      k.pos(startX, yBase),
      k.color(k.rgb(220, 220, 240)),
      k.outline(2, k.rgb(140, 80, 220)),
      k.area({ shape: new k.Circle(k.vec2(0, 0), 14) }),
      k.opacity(0.9),
      k.z(12),
      "coin-thief",
      "ghost",
      {
        hp: 3,
        bornAt: k.time(),
        dir,
        targetX,
        yBase,
        lastStealAt: 0,
        lastDamageAt: 0,
        parts: [],
      },
    ]);

    const eyeL = k.add([
      k.circle(2),
      k.pos(thief.pos.x - 4, thief.pos.y - 2),
      k.color(k.rgb(20, 20, 30)),
      k.z(13),
      "thief-part",
    ]);
    const eyeR = k.add([
      k.circle(2),
      k.pos(thief.pos.x + 4, thief.pos.y - 2),
      k.color(k.rgb(20, 20, 30)),
      k.z(13),
      "thief-part",
    ]);
    thief.parts = [eyeL, eyeR];

    audio.combo?.();
    showPopup(thief.pos.x, thief.pos.y - 30, "VOLEUR DE PIECES !", k.rgb(180, 80, 240), 16);

    thief.onUpdate(() => {
      if (!thief.exists()) return;
      const t = k.time();
      const dx = thief.targetX - thief.pos.x;
      if (Math.abs(dx) > 5) {
        thief.pos.x += Math.sign(dx) * 80 * k.dt();
      }
      thief.pos.y = thief.yBase + Math.sin(t * 3) * 6;

      eyeL.pos.x = thief.pos.x - 4; eyeL.pos.y = thief.pos.y - 2;
      eyeR.pos.x = thief.pos.x + 4; eyeR.pos.y = thief.pos.y - 2;

      if (Math.abs(dx) < 100 && t - thief.lastStealAt > 0.4) {
        thief.lastStealAt = t;
        if (gameState.coins > 0) {
          gameState.coins -= 1;
          k.add([
            k.circle(2),
            k.pos(thief.pos.x, thief.pos.y),
            k.color(k.rgb(255, 200, 50)),
            k.opacity(1),
            k.lifespan(0.3, { fade: 0.2 }),
            k.z(14),
            "particle",
          ]);
        }
      }

      if (Math.random() < 0.3) {
        k.add([
          k.circle(2),
          k.pos(thief.pos.x + (Math.random() - 0.5) * 8, thief.pos.y + 5),
          k.color(k.rgb(180, 80, 240)),
          k.opacity(0.7),
          k.lifespan(0.5, { fade: 0.4 }),
          k.z(11),
          "particle",
        ]);
      }

      if (t - thief.bornAt > 8) {
        gameState.score = Math.max(0, gameState.score - 50);
        showPopup(thief.pos.x, thief.pos.y - 20, "VOLEUR S'ENFUIT -50", k.rgb(255, 100, 100), 18);
        audio.crack?.();
        thief.parts.forEach(p => { if (p.exists()) k.destroy(p); });
        k.destroy(thief);
        activeThief = null;
      }
    });

    thief.onDraw(() => {
      for (let i = 0; i < 3; i++) {
        const filled = i < thief.hp;
        k.drawCircle({
          pos: k.vec2(-10 + i * 10, -22),
          radius: 3,
          color: filled ? k.rgb(180, 80, 240) : k.rgb(60, 60, 80),
          outline: { color: k.rgb(40, 20, 60), width: 1 },
        });
      }
    });

    thief.onCollide("player", () => {
      const t = k.time();
      if (t - thief.lastDamageAt < 0.4) return;
      thief.lastDamageAt = t;
      thief.hp -= 1;
      audio.pop?.();
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI * 2 * i) / 6;
        k.add([
          k.circle(3),
          k.pos(thief.pos.x, thief.pos.y),
          k.color(k.rgb(180, 80, 240)),
          k.opacity(1),
          k.lifespan(0.4, { fade: 0.3 }),
          k.z(15),
          "particle",
          { vx: Math.cos(a) * 60, vy: Math.sin(a) * 60 },
        ]);
      }
      if (thief.hp <= 0) {
        gameState.score += 30;
        showPopup(thief.pos.x, thief.pos.y - 20, "VOLEUR VAINCU +30", k.rgb(120, 220, 120), 20);
        audio.combo?.();
        for (let i = 0; i < 12; i++) {
          const a = (Math.PI * 2 * i) / 12;
          k.add([
            k.circle(4),
            k.pos(thief.pos.x, thief.pos.y),
            k.color(k.rgb(180, 80, 240)),
            k.opacity(1),
            k.lifespan(0.7, { fade: 0.5 }),
            k.z(16),
            "particle-firework",
            { vx: Math.cos(a) * 100, vy: Math.sin(a) * 100, grav: 80 },
          ]);
        }
        thief.parts.forEach(pp => { if (pp.exists()) k.destroy(pp); });
        k.destroy(thief);
        activeThief = null;
      }
    });

    activeThief = thief;
  }

  k.loop(0.5, () => {
    if (k.time() > nextSpawnAt && !activeThief?.exists?.()) {
      spawnThief();
      nextSpawnAt = k.time() + 25 + Math.random() * 10;
    }
  });

  return { spawn: spawnThief };
}
