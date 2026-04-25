export function createVisitorRace({ k, gameState, audio, showPopup, WIDTH, WORLD_WIDTH, GROUND_ROW, TILE }) {
  let nextEventAt = k.time() + 90 + Math.random() * 60;
  let active = false;

  function spawnRunner(index) {
    const isLeader = index === 0;
    const hue = (index / 8) * 360;
    const color = isLeader ? [255, 220, 60] : hslToRgb(hue, 0.7, 0.6);
    const v = k.add([
      k.sprite("human"),
      k.pos(WORLD_WIDTH + 30 + index * 50, (GROUND_ROW - 3) * TILE),
      k.area({ shape: new k.Rect(k.vec2(2, 4), 24, 40), collisionIgnore: ["wagon", "wagon-part", "passenger", "visitor", "race-visitor", "crowd", "tile", "ground_tile"] }),
      k.anchor("topleft"),
      k.color(k.rgb(color[0], color[1], color[2])),
      k.scale(isLeader ? 1.3 : 1.0),
      k.outline(isLeader ? 2 : 0, k.rgb(160, 110, 0)),
      k.z(6),
      "race-visitor",
      { pointsValue: isLeader ? 200 : 30, isLeader, baseColor: color },
    ]);
    v.onUpdate(() => {
      v.pos.x -= 200 * k.dt();
      if (isLeader && Math.random() < 0.5) {
        const ec = window.__entityCounts;
        if (!ec || ec.particle < 250) {
          k.add([
            k.circle(2 + Math.random()),
            k.pos(v.pos.x + 14 + Math.random() * 10, v.pos.y + 20 + Math.random() * 10),
            k.color(k.rgb(255, 230, 100)),
            k.opacity(0.9),
            k.lifespan(0.4, { fade: 0.3 }),
            k.z(8),
            "particle",
          ]);
        }
      }
      if (v.pos.x < -30) k.destroy(v);
    });
    v.onCollide("player", () => {
      gameState.score += v.pointsValue;
      (isLeader ? audio.gold : audio.coin)?.();
      showPopup(v.pos.x + 14, v.pos.y - 10, isLeader ? "+200 LEADER !" : `+${v.pointsValue}`, k.rgb(color[0], color[1], color[2]), isLeader ? 24 : 16);
      const cx = v.pos.x + 14, cy = v.pos.y + 20;
      for (let i = 0; i < 8; i++) {
        const a = (Math.PI * 2 * i) / 8;
        k.add([
          k.circle(2 + Math.random() * 2),
          k.pos(cx, cy),
          k.color(k.rgb(color[0], color[1], color[2])),
          k.opacity(1),
          k.lifespan(0.5, { fade: 0.3 }),
          k.z(15),
          "particle-grav",
          { vx: Math.cos(a) * 90, vy: Math.sin(a) * 90 - 30, grav: 200 },
        ]);
      }
      k.destroy(v);
    });
    return v;
  }

  function trigger() {
    if (active) return;
    active = true;
    audio.crack?.();
    showPopup(WIDTH / 2, 80, "COURSE DE VISITEURS !", k.rgb(255, 200, 100), 26);
    for (let i = 0; i < 8; i++) {
      k.wait(i * 0.4, () => spawnRunner(i));
    }
    k.wait(8, () => { active = false; });
  }

  k.loop(1, () => {
    if (!active && k.time() > nextEventAt) {
      trigger();
      nextEventAt = k.time() + 120 + Math.random() * 120;
    }
  });

  k.add([
    k.pos(0, 0),
    k.z(19),
    {
      draw() {
        const runners = k.get("race-visitor");
        if (runners.length === 0) return;
        const t = k.time();
        const r = 200 + Math.sin(t * 4) * 55;
        const g = 200 + Math.sin(t * 4 + 2) * 55;
        const b = 200 + Math.sin(t * 4 + 4) * 55;
        k.drawText({
          text: "COURSE ! attrape les visiteurs !",
          pos: k.vec2(WIDTH / 2, 30),
          size: 20,
          color: k.rgb(r, g, b),
          anchor: "center",
        });
      },
    },
  ]);

  return { trigger };
}

function hslToRgb(h, s, l) {
  h /= 360;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h * 6) % 2) - 1));
  const m = l - c / 2;
  let r, g, b;
  if (h < 1 / 6) [r, g, b] = [c, x, 0];
  else if (h < 2 / 6) [r, g, b] = [x, c, 0];
  else if (h < 3 / 6) [r, g, b] = [0, c, x];
  else if (h < 4 / 6) [r, g, b] = [0, x, c];
  else if (h < 5 / 6) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  return [Math.floor((r + m) * 255), Math.floor((g + m) * 255), Math.floor((b + m) * 255)];
}
