import { currentSeason, SEASON_PALETTES } from "./constants.js";

export function createSceneDecor({ k, WIDTH, HEIGHT, TILE, GROUND_ROW }) {
  for (let i = 0; i < 6; i++) {
    k.add([
      k.sprite("cloud"),
      k.pos(i * 240 + (i % 2) * 60, 60 + (i % 3) * 40),
      k.z(-10),
      k.opacity(0.9),
      "cloud",
      { speed: 6 + (i % 3) * 3 },
    ]);
  }

  const season = currentSeason();
  const seasonPalette = SEASON_PALETTES[season];

  if (season !== "normal") {
    k.add([
      k.rect(WIDTH, HEIGHT),
      k.pos(0, 0),
      k.color(k.rgb(seasonPalette.sky[0], seasonPalette.sky[1], seasonPalette.sky[2])),
      k.opacity(0.08),
      k.z(-9),
    ]);
  }

  k.add([
    k.pos(WIDTH - 180, HEIGHT - 22),
    k.z(35),
    {
      draw() {
        const labels = { normal: "Normal", halloween: "Halloween", christmas: "Noel", carnival: "Carnaval" };
        k.drawText({
          text: `Saison : ${labels[season]}`,
          size: 11,
          pos: k.vec2(0, 0),
          color: k.rgb(seasonPalette.accent[0], seasonPalette.accent[1], seasonPalette.accent[2]),
        });
      },
    },
  ]);

  if (season === "halloween") {
    for (let i = 0; i < 5; i++) {
      const cx = 100 + i * 230;
      k.add([
        k.circle(8),
        k.pos(cx, GROUND_ROW * TILE - 12),
        k.color(k.rgb(255, 140, 30)),
        k.outline(1, k.rgb(80, 30, 0)),
        k.z(-5),
      ]);
      k.add([
        k.rect(2, 4),
        k.pos(cx - 1, GROUND_ROW * TILE - 22),
        k.color(k.rgb(60, 100, 30)),
        k.z(-5),
      ]);
    }
  } else if (season === "christmas") {
    for (let i = 0; i < 8; i++) {
      const flake = k.add([
        k.circle(2),
        k.pos(Math.random() * WIDTH, Math.random() * HEIGHT * 0.6),
        k.color(k.rgb(255, 255, 255)),
        k.opacity(0.85),
        k.z(-3),
        { vy: 25 + Math.random() * 30, drift: Math.random() * Math.PI * 2 },
      ]);
      flake.onUpdate(() => {
        flake.pos.y += flake.vy * k.dt();
        flake.pos.x += Math.sin(k.time() * 0.5 + flake.drift) * 8 * k.dt();
        if (flake.pos.y > HEIGHT) flake.pos.y = -10;
      });
    }
  } else if (season === "carnival") {
    k.loop(2, () => {
      if (k.get("season-confetti").length > 12) return;
      const colors = [k.rgb(255, 80, 180), k.rgb(80, 220, 200), k.rgb(255, 220, 80), k.rgb(180, 80, 255)];
      const c = k.add([
        k.rect(4, 6),
        k.pos(Math.random() * WIDTH, -10),
        k.color(colors[Math.floor(Math.random() * 4)]),
        k.rotate(Math.random() * 360),
        k.opacity(0.7),
        k.z(-3),
        "season-confetti",
        { vy: 30 + Math.random() * 20, spin: (Math.random() - 0.5) * 60 },
      ]);
      c.onUpdate(() => {
        c.pos.y += c.vy * k.dt();
        c.angle = (c.angle || 0) + c.spin * k.dt();
        if (c.pos.y > HEIGHT) k.destroy(c);
      });
    });
  }

  k.add([
    k.pos(0, 0),
    k.z(-20),
    {
      draw() {
        for (let i = 0; i < 4; i++) {
          k.drawSprite({ sprite: "hill", pos: k.vec2(i * 330 - 50, GROUND_ROW * TILE - 64) });
        }
      },
    },
  ]);

  const FLAG_COLORS = [
    [230, 60, 60], [60, 180, 230], [255, 210, 63], [140, 220, 100],
    [230, 100, 200], [255, 140, 40], [120, 100, 230], [255, 255, 255],
  ];
  for (let i = 0; i < 10; i++) {
    const fx = 40 + i * 120 + Math.random() * 40;
    const poleH = 60 + Math.random() * 30;
    const poleY = GROUND_ROW * TILE - poleH;
    k.add([
      k.rect(3, poleH),
      k.pos(fx, poleY),
      k.color(k.rgb(80, 70, 60)),
      k.z(-8),
      "flag-pole",
    ]);
    k.add([
      k.circle(3),
      k.pos(fx + 1, poleY),
      k.color(k.rgb(255, 210, 63)),
      k.z(-7),
      "flag-pole",
    ]);
    const col = FLAG_COLORS[i % FLAG_COLORS.length];
    k.add([
      k.rect(22, 14),
      k.pos(fx + 3, poleY + 2),
      k.color(k.rgb(col[0], col[1], col[2])),
      k.z(-7),
      "flag-deco",
      { baseX: fx + 3, baseY: poleY + 2, phase: Math.random() * 6 },
    ]);
  }

  k.onUpdate("flag-deco", (flag) => {
    const w = Math.sin(k.time() * 3 + flag.phase);
    flag.pos.x = flag.baseX + w * 1.5;
    flag.pos.y = flag.baseY + Math.abs(w) * 1;
  });

  k.onUpdate("cloud", (c) => {
    c.pos.x += c.speed * k.dt();
    if (c.pos.x > WIDTH + 100) c.pos.x = -200;
  });
}
