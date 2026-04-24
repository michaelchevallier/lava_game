export function createSkullStand({ k, gameState, audio, showPopup, registerCoin, getActivePlayers, isCampaign, WIDTH, TILE }) {
  const STAND_X = 30 * TILE;
  const STAND_Y = 2 * TILE;
  const STAND_W = 5 * TILE;
  const STAND_H = 2 * TILE;

  k.add([
    k.rect(STAND_W, STAND_H),
    k.pos(STAND_X, STAND_Y),
    k.color(k.rgb(60, 30, 30)),
    k.outline(2, k.rgb(20, 10, 10)),
    k.z(11),
  ]);
  k.add([
    k.rect(STAND_W, 8),
    k.pos(STAND_X, STAND_Y - 10),
    k.color(k.rgb(120, 30, 30)),
    k.outline(1, k.rgb(60, 0, 0)),
    k.z(11),
  ]);

  let phase = "skulls";

  const labelObj = k.add([
    k.pos(0, 0),
    k.z(15),
    {
      draw() {
        k.drawText({
          text: phase === "skulls" ? "TIR AUX CRÂNES" : "TIR AUX CANARDS",
          size: 11,
          pos: k.vec2(STAND_X + STAND_W / 2, STAND_Y - 22),
          anchor: "center",
          color: phase === "skulls" ? k.rgb(255, 200, 80) : k.rgb(100, 220, 255),
        });
      },
    },
  ]);

  const skulls = [];
  const ducks = [];
  const darts = [];
  const comboState = new Map();

  function spawnSkull(idx) {
    const isGolden = Math.random() < 0.05;
    const yLine = STAND_Y + 10 + (idx % 2) * (STAND_H / 2);
    const skull = k.add([
      k.circle(8),
      k.pos(STAND_X + 10 + idx * 10, yLine),
      k.color(isGolden ? k.rgb(255, 220, 60) : k.rgb(230, 230, 220)),
      k.outline(2, k.rgb(40, 30, 30)),
      k.area({ shape: new k.Rect(k.vec2(-10, -10), 20, 20) }),
      k.z(13),
      "skull-target",
      {
        skullIdx: idx,
        isGolden,
        dir: idx % 2 === 0 ? 1 : -1,
        baseY: yLine,
        dead: false,
      },
    ]);

    const eye1 = k.add([
      k.rect(2, 2),
      k.pos(skull.pos.x - 3, skull.pos.y - 2),
      k.color(k.rgb(20, 20, 20)),
      k.z(14),
      "skull-part",
      { skull },
    ]);
    const eye2 = k.add([
      k.rect(2, 2),
      k.pos(skull.pos.x + 3, skull.pos.y - 2),
      k.color(k.rgb(20, 20, 20)),
      k.z(14),
      "skull-part",
      { skull },
    ]);
    skull.parts = [eye1, eye2];

    skull._eye1 = eye1;
    skull._eye2 = eye2;

    skull.onClick(() => {
      if (skull.dead) return;
      skull.dead = true;
      const pts = isGolden ? 300 : 50;
      gameState.score += pts;
      showPopup(skull.pos.x, skull.pos.y - 20, `+${pts}!`, isGolden ? k.rgb(255, 220, 60) : k.rgb(230, 230, 220), 18);
      audio.coin?.();
      for (let i = 0; i < 8; i++) {
        const a = (Math.PI * 2 * i) / 8;
        k.add([
          k.rect(3, 3),
          k.pos(skull.pos.x, skull.pos.y),
          k.color(k.rgb(240, 240, 220)),
          k.opacity(1),
          k.lifespan(0.7, { fade: 0.5 }),
          k.z(10),
          "particle-grav",
          { vx: Math.cos(a) * 80, vy: Math.sin(a) * 80 - 30, grav: 120 },
        ]);
      }
      if (isGolden) {
        for (let c = 0; c < 5; c++) {
          k.wait(c * 0.05, () => {
            registerCoin(skull.pos.x + (Math.random() - 0.5) * 30, skull.pos.y);
          });
        }
        showPopup(skull.pos.x, skull.pos.y - 40, "CRÂNE DORÉ !", k.rgb(255, 220, 60), 16);
      }
      skull.parts?.forEach((p) => k.destroy(p));
      k.destroy(skull);
      const skullIdx = idx;
      k.wait(2, () => {
        if (phase === "skulls") spawnSkull(skullIdx);
      });
    });

    skulls.push(skull);
  }

  function enterSkullsPhase() {
    for (const d of ducks) {
      if (d._renderer && d._renderer.exists?.()) k.destroy(d._renderer);
      if (d.exists?.()) k.destroy(d);
    }
    ducks.length = 0;
    for (let i = 0; i < 5; i++) spawnSkull(i);
  }

  function drawDuckBody(d) {
    const body = d.gold ? k.rgb(255, 215, 0) : k.rgb(255, 230, 80);
    const bill = d.gold ? k.rgb(200, 120, 0) : k.rgb(255, 140, 0);
    k.drawRect({
      pos: k.vec2(d.pos.x, d.pos.y),
      width: 18, height: 14, color: body,
      outline: { color: k.rgb(180, 130, 0), width: 1 },
    });
    k.drawTriangle({
      p1: k.vec2(d.pos.x, d.pos.y + 4),
      p2: k.vec2(d.pos.x - 5, d.pos.y + 7),
      p3: k.vec2(d.pos.x, d.pos.y + 10),
      color: bill,
    });
    k.drawCircle({
      pos: k.vec2(d.pos.x + 5, d.pos.y + 4),
      radius: 2, color: k.rgb(20, 20, 20),
    });
  }

  function spawnDuck(idx, x, y) {
    const gold = Math.random() < 0.12;
    const d = k.add([
      k.rect(18, 14),
      k.pos(x, y),
      k.opacity(0),
      k.area({ shape: new k.Rect(k.vec2(0, 0), 18, 14) }),
      k.z(13),
      "duck-stand",
      { duckIdx: idx, gold, vx: -50, dead: false, deadAt: 0 },
    ]);

    const renderer = k.add([
      k.pos(0, 0),
      k.z(13),
      { draw() { if (d.exists?.() && !d.dead) drawDuckBody(d); } },
    ]);
    d._renderer = renderer;


    ducks.push(d);
  }

  function enterDucksPhase() {
    for (const s of skulls) {
      if (s.parts) for (const sp of s.parts) { if (sp.exists?.()) k.destroy(sp); }
      if (s.exists?.()) k.destroy(s);
    }
    skulls.length = 0;

    const DUCK_Y = STAND_Y - 24;
    const SPACING = 60;
    for (let i = 0; i < 7; i++) {
      spawnDuck(i, STAND_X + STAND_W - 20 - i * SPACING, DUCK_Y);
    }
  }

  function flashTransition() {
    k.add([
      k.rect(STAND_W, STAND_H),
      k.pos(STAND_X, STAND_Y),
      k.color(k.rgb(255, 255, 255)),
      k.opacity(0.5),
      k.lifespan(0.2),
      k.z(16),
    ]);
    audio.boost?.();
  }

  function spawnFeathers(cx, cy) {
    for (let i = 0; i < 6; i++) {
      const a = Math.random() * Math.PI * 2;
      const spd = 60 + Math.random() * 60;
      k.add([
        k.rect(5, 2),
        k.pos(cx, cy),
        k.color(k.rgb(255, 255, 255)),
        k.opacity(1),
        k.rotate(Math.random() * 360),
        k.lifespan(0.6, { fade: 0.4 }),
        k.z(14),
        "particle-grav",
        { vx: Math.cos(a) * spd, vy: Math.sin(a) * spd - 30, grav: 120 },
      ]);
    }
  }

  function recordJackpotHit(p, duck) {
    if (!p) return;
    const now = k.time();
    let st = comboState.get(p);
    if (!st) { st = { hits: [] }; comboState.set(p, st); }
    st.hits = st.hits.filter(t => now - t < 5);
    st.hits.push(now);
    if (st.hits.length >= 3) {
      gameState.score += 300;
      showPopup(duck.pos.x + 9, duck.pos.y - 30, "JACKPOT ! +300", k.rgb(255, 180, 40), 28);
      audio.combo?.();
      window.__juice?.dirShake?.(0, 1, 10, 0.25);
      for (let i = 0; i < 24; i++) {
        const a = (Math.PI * 2 * i) / 24;
        k.add([
          k.circle(3),
          k.pos(duck.pos.x + 9, duck.pos.y),
          k.color(k.rgb(255, 120 + Math.random() * 120, 60)),
          k.opacity(1),
          k.lifespan(0.7, { fade: 0.5 }),
          k.z(20),
          "particle",
          { vx: Math.cos(a) * 120, vy: Math.sin(a) * 120 - 40 },
        ]);
      }
      st.hits = [];
    }
  }

  function spawnDart(ox, oy, tx, ty, shooter) {
    const dx = tx - ox;
    const dy = ty - oy;
    const t = Math.abs(dx) / 350 + 0.05;
    const vxInit = dx / t;
    const vyInit = dy / t - 0.5 * 200 * t;
    const dart = k.add([
      k.rect(6, 2),
      k.pos(ox, oy),
      k.anchor("center"),
      k.color(k.rgb(110, 70, 30)),
      k.rotate(0),
      k.area({ shape: new k.Rect(k.vec2(-3, -1), 6, 2) }),
      k.z(14),
      "dart",
      { vx: vxInit, vy: vyInit, life: 0, shooter },
    ]);
    darts.push(dart);
  }

  function tryFire(p) {
    if (phase !== "ducks") return false;
    if (isCampaign?.()) return false;
    if (p.isSkeleton) return false;
    if (p.stunnedUntil && k.time() < p.stunnedUntil) return false;
    const now = k.time();
    if (p._lastDartAt && now - p._lastDartAt < 0.4) return false;

    const centerX = STAND_X + STAND_W / 2;
    const centerY = STAND_Y + STAND_H / 2;
    const px = p.pos.x + 14;
    const py = p.pos.y + 20;
    const dxStand = px - centerX;
    const dyStand = py - centerY;
    if (dxStand * dxStand + dyStand * dyStand > 150 * 150) return false;

    let target = null, bestD = Infinity;
    for (const d of ducks) {
      if (!d.exists?.() || d.dead) continue;
      const ddx = (d.pos.x + 9) - px;
      const ddy = (d.pos.y + 7) - py;
      const dd = ddx * ddx + ddy * ddy;
      if (dd < bestD) { bestD = dd; target = d; }
    }
    if (!target) return false;

    p._lastDartAt = now;
    spawnDart(px, py, target.pos.x + 9, target.pos.y + 7, p);
    audio.jump?.();
    return true;
  }

  k.onCollide("dart", "duck-stand", (dart, duck) => {
    if (duck.dead || !dart.exists?.()) return;
    const pts = duck.gold ? 150 : 50;
    gameState.score += pts;
    showPopup(duck.pos.x + 9, duck.pos.y - 10, `+${pts} !`,
              duck.gold ? k.rgb(255, 215, 0) : k.rgb(255, 230, 80), 16);
    audio.coin?.();
    spawnFeathers(duck.pos.x + 9, duck.pos.y + 7);

    const shooter = dart.shooter;
    duck.dead = true;
    duck.deadAt = k.time();
    k.destroy(dart);

    recordJackpotHit(shooter, duck);

    k.wait(3, () => {
      if (!duck.exists?.()) return;
      duck.dead = false;
      duck.pos.x = STAND_X + STAND_W + 60;
      duck.gold = Math.random() < 0.12;
    });
  });

  k.loop(30, () => {
    phase = phase === "skulls" ? "ducks" : "skulls";
    flashTransition();
    if (phase === "skulls") enterSkullsPhase();
    else enterDucksPhase();
  });

  k.loop(0.3, () => {
    if (phase !== "skulls") return;
    const wagons = k.get("wagon");
    for (const w of wagons) {
      if (
        w.pos.x > STAND_X - 20 && w.pos.x < STAND_X + STAND_W + 20 &&
        w.pos.y > STAND_Y - 20 && w.pos.y < STAND_Y + STAND_H + 40
      ) {
        for (const s of k.get("skull-target")) {
          s.dir = -s.dir;
        }
        k.add([
          k.rect(STAND_W, STAND_H),
          k.pos(STAND_X, STAND_Y),
          k.color(k.rgb(255, 80, 80)),
          k.opacity(0.3),
          k.lifespan(0.15, { fade: 0.1 }),
          k.z(0),
        ]);
        return;
      }
    }
  });

  k.onUpdate("skull-target", (skull) => {
    if (skull.dead) return;
    skull.pos.x += skull.dir * 35 * k.dt();
    skull.pos.y = skull.baseY + Math.sin(k.time() * 3 + skull.skullIdx) * 4;
    if (skull._eye1?.exists?.()) { skull._eye1.pos.x = skull.pos.x - 3; skull._eye1.pos.y = skull.pos.y - 2; }
    if (skull._eye2?.exists?.()) { skull._eye2.pos.x = skull.pos.x + 3; skull._eye2.pos.y = skull.pos.y - 2; }
    if (skull.pos.x > STAND_X + STAND_W - 12) skull.dir = -1;
    if (skull.pos.x < STAND_X + 12) skull.dir = 1;
  });

  k.onUpdate("duck-stand", (d) => {
    if (d.dead) return;
    d.pos.x += d.vx * k.dt();
    if (d.pos.x < STAND_X - 40) {
      d.pos.x = STAND_X + STAND_W + 60 + Math.random() * 40;
      d.gold = Math.random() < 0.12;
    }
  });

  k.onUpdate("dart", (dart) => {
    dart.life += k.dt();
    dart.pos.x += dart.vx * k.dt();
    dart.pos.y += dart.vy * k.dt();
    dart.vy += 200 * k.dt();
    dart.angle = Math.atan2(dart.vy, dart.vx) * 180 / Math.PI;
    if (dart.life > 2 || dart.pos.y > STAND_Y + STAND_H + 80) {
      if (dart.exists?.()) k.destroy(dart);
    }
  });

  enterSkullsPhase();

  const api = {
    tryFire,
    __debug: () => ({
      phase,
      duckCount: ducks.filter(d => d.exists?.()).length,
      activeDarts: darts.filter(d => d.exists?.()).length,
      comboCount: {
        p1: comboState.get(getActivePlayers?.()?.[0])?.hits?.length || 0,
        p2: comboState.get(getActivePlayers?.()?.[1])?.hits?.length || 0,
      },
    }),
  };
  window.__skullStand = api;
  return api;
}
