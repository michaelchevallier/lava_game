export function createWeatherSystem({ k, gameState, audio, showPopup, WIDTH, HEIGHT, GROUND_ROW, TILE }) {
  let nextWeatherAt = k.time() + 60 + Math.random() * 30;
  let warning = null;
  let active = null;

  const TYPES = ["lightning", "coinrain", "wind"];

  function startWarning() {
    const type = TYPES[Math.floor(Math.random() * TYPES.length)];
    warning = { type, until: k.time() + 3 };
    audio.crack?.();
    const labels = {
      lightning: "ECLAIRS DANS 3s !",
      coinrain: "PLUIE D'OR DANS 3s !",
      wind: "VENT VIOLENT DANS 3s !",
    };
    showPopup(WIDTH / 2, 100, labels[type], k.rgb(255, 200, 100), 22);
  }

  function startActive(type) {
    if (type === "lightning") {
      active = { type, until: k.time() + 3, lightnings: [] };
      for (let i = 0; i < 3; i++) {
        const t = k.time() + i * 1.0;
        const x = 100 + Math.random() * (WIDTH - 200);
        active.lightnings.push({ at: t, x, fired: false });
      }
    } else if (type === "coinrain") {
      active = { type, until: k.time() + 4 };
      for (let i = 0; i < 10; i++) {
        k.wait(i * 0.3, () => spawnRainCoin());
      }
      audio.combo?.();
    } else if (type === "wind") {
      const dir = Math.random() < 0.5 ? -1 : 1;
      active = { type, until: k.time() + 5, dir };
    }
  }

  function spawnRainCoin() {
    const x = 50 + Math.random() * (WIDTH - 100);
    const coin = k.add([
      k.circle(8),
      k.pos(x, -20),
      k.color(k.rgb(255, 215, 60)),
      k.outline(2, k.rgb(160, 110, 0)),
      k.area({ shape: new k.Rect(k.vec2(-10, -10), 20, 20) }),
      k.opacity(1),
      k.lifespan(5, { fade: 0.5 }),
      k.z(8),
      "rain-coin",
      { vy: 80 + Math.random() * 40 },
    ]);
    coin.onUpdate(() => {
      coin.pos.y += coin.vy * k.dt();
      if (coin.pos.y > GROUND_ROW * TILE - 20) coin.vy = 0;
    });
    coin.onCollide("player", () => {
      gameState.coins += 1;
      gameState.score += 10;
      audio.coin?.();
      for (let i = 0; i < 4; i++) {
        const a = (Math.PI * 2 * i) / 4;
        k.add([
          k.circle(2),
          k.pos(coin.pos.x, coin.pos.y),
          k.color(k.rgb(255, 200, 60)),
          k.opacity(1),
          k.lifespan(0.4, { fade: 0.3 }),
          k.z(10),
          "particle",
          { vx: Math.cos(a) * 50, vy: Math.sin(a) * 50 },
        ]);
      }
      k.destroy(coin);
    });
  }

  function fireLightning(x) {
    const yTop = 0;
    const yGround = GROUND_ROW * TILE;
    k.add([
      k.rect(4, yGround),
      k.pos(x - 2, yTop),
      k.color(k.rgb(255, 255, 200)),
      k.opacity(1),
      k.lifespan(0.2, { fade: 0.15 }),
      k.z(20),
    ]);
    k.add([
      k.circle(40),
      k.pos(x, yGround),
      k.color(k.rgb(255, 255, 200)),
      k.opacity(0.8),
      k.lifespan(0.3, { fade: 0.25 }),
      k.z(19),
    ]);
    audio.crack?.();
    window.__juice?.dirShake(0, 1, 8, 0.15);
    for (const p of k.get("player")) {
      const d = Math.hypot(p.pos.x + 14 - x, p.pos.y + 22 - yGround);
      if (d < 60) {
        gameState.score = Math.max(0, gameState.score - 10);
        const orig = p.color ? { r: p.color.r, g: p.color.g, b: p.color.b } : null;
        if (orig) {
          p.color.r = 255; p.color.g = 100; p.color.b = 100;
          setTimeout(() => { if (p.exists() && orig) { p.color.r = orig.r; p.color.g = orig.g; p.color.b = orig.b; } }, 400);
        }
      }
    }
    for (const v of k.get("visitor")) {
      if (v.isSkeleton) continue;
      const d = Math.hypot(v.pos.x + 14 - x, v.pos.y + 22 - yGround);
      if (d < 60) {
        v.isSkeleton = true;
        v.sprite = "skeleton";
        v.color.r = 255; v.color.g = 255; v.color.b = 255;
        gameState.skeletons += 1;
        gameState.score += 10;
        audio.transform?.();
      }
    }
  }

  k.loop(0.1, () => {
    const t = k.time();
    if (warning && t > warning.until) {
      startActive(warning.type);
      warning = null;
    }
    if (active && t > active.until) {
      active = null;
    }
    if (active?.type === "lightning") {
      for (const l of active.lightnings) {
        if (!l.fired && t >= l.at) {
          l.fired = true;
          fireLightning(l.x);
        }
      }
    } else if (active?.type === "wind") {
      for (const w of k.get("wagon")) {
        if (w.vel) w.vel.x += 60 * active.dir * 0.1;
      }
      for (const p of k.get("player")) {
        p.pos.x += 60 * active.dir * 0.1 * k.dt() * 10;
      }
    }
    if (!warning && !active && t > nextWeatherAt) {
      startWarning();
      nextWeatherAt = t + 90;
    }
  });

  k.add([
    k.pos(0, 0),
    k.z(18),
    {
      draw() {
        if (warning) {
          const ratio = (warning.until - k.time()) / 3;
          const opacity = (1 - ratio) * 0.3;
          k.drawRect({
            pos: k.vec2(0, 0),
            width: WIDTH,
            height: HEIGHT,
            color: k.rgb(20, 20, 60),
            opacity,
          });
        }
        if (active?.type === "wind") {
          const t = k.time();
          for (let i = 0; i < 30; i++) {
            const baseY = (i * 28 + (t * 200 * active.dir) % HEIGHT + HEIGHT) % HEIGHT;
            const baseX = ((i * 47 + (t * 400 * active.dir) % WIDTH) + WIDTH) % WIDTH;
            k.drawRect({
              pos: k.vec2(baseX - 8, baseY),
              width: 16,
              height: 1,
              angle: 30 * active.dir,
              color: k.rgb(180, 220, 255),
              opacity: 0.5,
            });
          }
        }
      },
    },
  ]);

  return {};
}
