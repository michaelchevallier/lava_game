export function createSkullStand({ k, gameState, audio, showPopup, registerCoin, WIDTH, TILE }) {
  const STAND_X = 30 * TILE;
  const STAND_Y = 2 * TILE;
  const STAND_W = 5 * TILE;
  const STAND_H = 2 * TILE;

  k.add([
    k.rect(STAND_W, STAND_H),
    k.pos(STAND_X, STAND_Y),
    k.color(k.rgb(60, 30, 30)),
    k.outline(2, k.rgb(20, 10, 10)),
    k.z(-2),
  ]);
  k.add([
    k.rect(STAND_W, 8),
    k.pos(STAND_X, STAND_Y - 10),
    k.color(k.rgb(120, 30, 30)),
    k.outline(1, k.rgb(60, 0, 0)),
    k.z(-2),
  ]);

  k.add([
    k.pos(0, 0),
    k.z(5),
    {
      draw() {
        k.drawText({
          text: "TIR AUX CRANES",
          size: 11,
          pos: k.vec2(STAND_X + STAND_W / 2, STAND_Y - 22),
          anchor: "center",
          color: k.rgb(255, 200, 80),
        });
      },
    },
  ]);

  function spawnSkull(idx) {
    const isGolden = Math.random() < 0.05;
    const yLine = STAND_Y + 10 + (idx % 2) * (STAND_H / 2);
    const skull = k.add([
      k.circle(8),
      k.pos(STAND_X + 10 + idx * 10, yLine),
      k.color(isGolden ? k.rgb(255, 220, 60) : k.rgb(230, 230, 220)),
      k.outline(2, k.rgb(40, 30, 30)),
      k.area({ shape: new k.Rect(k.vec2(-10, -10), 20, 20) }),
      k.z(2),
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
      k.z(3),
      "skull-part",
      { skull },
    ]);
    const eye2 = k.add([
      k.rect(2, 2),
      k.pos(skull.pos.x + 3, skull.pos.y - 2),
      k.color(k.rgb(20, 20, 20)),
      k.z(3),
      "skull-part",
      { skull },
    ]);
    skull.parts = [eye1, eye2];

    skull.onUpdate(() => {
      if (skull.dead) return;
      skull.pos.x += skull.dir * 35 * k.dt();
      skull.pos.y = skull.baseY + Math.sin(k.time() * 3 + idx) * 4;
      eye1.pos.x = skull.pos.x - 3; eye1.pos.y = skull.pos.y - 2;
      eye2.pos.x = skull.pos.x + 3; eye2.pos.y = skull.pos.y - 2;
      if (skull.pos.x > STAND_X + STAND_W - 12) skull.dir = -1;
      if (skull.pos.x < STAND_X + 12) skull.dir = 1;
    });

    skull.onClick(() => {
      if (skull.dead) return;
      skull.dead = true;
      const pts = isGolden ? 300 : 50;
      gameState.score += pts;
      showPopup(skull.pos.x, skull.pos.y - 20, `+${pts}!`, isGolden ? k.rgb(255, 220, 60) : k.rgb(230, 230, 220), 18);
      audio.coin?.();
      for (let i = 0; i < 8; i++) {
        const a = (Math.PI * 2 * i) / 8;
        const boneParticle = k.add([
          k.rect(3, 3),
          k.pos(skull.pos.x, skull.pos.y),
          k.color(k.rgb(240, 240, 220)),
          k.opacity(1),
          k.lifespan(0.7, { fade: 0.5 }),
          k.z(10),
          "particle",
          { vx: Math.cos(a) * 80, vy: Math.sin(a) * 80 - 30 },
        ]);
        boneParticle.onUpdate(() => {
          boneParticle.pos.x += boneParticle.vx * k.dt();
          boneParticle.pos.y += boneParticle.vy * k.dt();
          boneParticle.vy += 120 * k.dt();
        });
      }
      if (isGolden) {
        for (let c = 0; c < 5; c++) {
          k.wait(c * 0.05, () => {
            registerCoin(skull.pos.x + (Math.random() - 0.5) * 30, skull.pos.y);
          });
        }
        showPopup(skull.pos.x, skull.pos.y - 40, "CRANE DORE !", k.rgb(255, 220, 60), 16);
      }
      skull.parts?.forEach((p) => k.destroy(p));
      k.destroy(skull);
      k.wait(2, () => spawnSkull(idx));
    });
  }

  for (let i = 0; i < 5; i++) spawnSkull(i);

  k.loop(0.3, () => {
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

  return {};
}
