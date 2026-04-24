import { currentSeason, SEASON_PALETTES, WORLD_COLS } from "./constants.js";

export function createSceneDecor({ k, WIDTH, HEIGHT, TILE, GROUND_ROW }) {
  const WORLD_W = WORLD_COLS * TILE;
  // Monde -WORLD_W .. +WORLD_W = 5120 px. Décor réparti sur toute la plage.
  // Clouds : 14 (au lieu de 6) pour couvrir la plage monde, wrap de -WORLD_W à +WORLD_W.
  const CLOUD_COUNT = 14;
  for (let i = 0; i < CLOUD_COUNT; i++) {
    k.add([
      k.sprite("cloud"),
      k.pos(-WORLD_W + (i / CLOUD_COUNT) * 2 * WORLD_W + (i % 2) * 60, 60 + (i % 3) * 40),
      k.z(-10),
      k.opacity(0.9),
      "cloud",
      { speed: 6 + (i % 3) * 3 },
    ]);
  }

  const season = currentSeason();
  const seasonPalette = SEASON_PALETTES[season];

  // Teinte saison : fixed() = atmosphère, suit la caméra
  if (season !== "normal") {
    k.add([
      k.rect(WIDTH, HEIGHT),
      k.pos(0, 0),
      k.color(k.rgb(seasonPalette.sky[0], seasonPalette.sky[1], seasonPalette.sky[2])),
      k.opacity(0.08),
      k.fixed(),
      k.z(-9),
    ]);
  }

  // Label "Saison: X" : camera-fixed bottom-right
  k.add([
    k.pos(WIDTH - 180, HEIGHT - 22),
    k.fixed(),
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
    // Citrouilles : 20 (5 → 20) réparties sur toute la plage monde
    for (let i = 0; i < 20; i++) {
      const cx = -WORLD_W + (i / 20) * 2 * WORLD_W + 100;
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
    // Flocons : camera-fixed (neige permanente sur screen)
    for (let i = 0; i < 12; i++) {
      const flake = k.add([
        k.circle(2),
        k.pos(Math.random() * WIDTH, Math.random() * HEIGHT * 0.6),
        k.color(k.rgb(255, 255, 255)),
        k.opacity(0.85),
        k.fixed(),
        k.z(-3),
        { vy: 25 + Math.random() * 30, drift: Math.random() * Math.PI * 2 },
      ]);
      flake.onUpdate(() => {
        flake.pos.y += flake.vy * k.dt();
        flake.pos.x += Math.sin(k.time() * 0.5 + flake.drift) * 8 * k.dt();
        if (flake.pos.y > HEIGHT) { flake.pos.y = -10; flake.pos.x = Math.random() * WIDTH; }
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
        k.fixed(),
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

  // Hills : répartis sur toute la plage monde (-WORLD_W..+WORLD_W), tous les ~330px.
  // Cull hors viewport camera ±1 écran (évite 31 drawSprite/frame quand seules
  // ~8 hills sont visibles).
  k.add([
    k.pos(0, 0),
    k.z(-20),
    {
      draw() {
        const step = 330;
        const camX = (k.camPos?.().x) ?? WIDTH / 2;
        const scale = (k.camScale?.().x) || 1;
        const halfView = WIDTH / (2 * scale) + step;
        const minX = camX - halfView;
        const maxX = camX + halfView;
        const startX = Math.max(Math.floor(-WORLD_W / step) * step, Math.floor(minX / step) * step);
        const endX = Math.min(WORLD_W, maxX);
        for (let x = startX; x < endX; x += step) {
          k.drawSprite({ sprite: "hill", pos: k.vec2(x - 50, GROUND_ROW * TILE - 64) });
        }
      },
    },
  ]);

  // Murs monde : montagnes sombres au-delà des bornes ±WORLD_W. Cull par camera :
  // ne dessine le côté left/right que si le viewport touche cette zone hors-monde.
  k.add([
    k.pos(0, 0),
    k.z(-25),
    {
      draw() {
        const groundY = GROUND_ROW * TILE;
        const camX = (k.camPos?.().x) ?? WIDTH / 2;
        const scale = (k.camScale?.().x) || 1;
        const halfView = WIDTH / (2 * scale);
        const viewMin = camX - halfView;
        const viewMax = camX + halfView;
        for (const side of [-1, 1]) {
          const baseX = side * WORLD_W;
          // Cull : côté gauche visible seulement si viewMin < -WORLD_W, droite si viewMax > WORLD_W
          if (side < 0 && viewMin > -WORLD_W) continue;
          if (side > 0 && viewMax < WORLD_W) continue;
          for (let i = 0; i < 6; i++) {
            const peakX = baseX + side * (80 + i * 180);
            const peakY = groundY - 180 - Math.abs(Math.sin(i * 1.7)) * 80;
            const halfW = 120 + (i % 3) * 40;
            const shade = 30 + (i % 3) * 15;
            k.drawTriangle({
              p1: k.vec2(peakX - halfW, groundY),
              p2: k.vec2(peakX + halfW, groundY),
              p3: k.vec2(peakX, peakY),
              color: k.rgb(shade, shade + 10, shade + 20),
              opacity: 0.95,
            });
            k.drawTriangle({
              p1: k.vec2(peakX - 18, peakY + 30),
              p2: k.vec2(peakX + 18, peakY + 30),
              p3: k.vec2(peakX, peakY),
              color: k.rgb(230, 235, 245),
              opacity: 0.9,
            });
          }
          const fillStart = baseX + side * (6 * 180 + 200);
          const fillEnd = side > 0 ? fillStart + 6000 : fillStart - 6000;
          k.drawRect({
            pos: k.vec2(Math.min(fillStart, fillEnd), 0),
            width: 6000,
            height: groundY,
            color: k.rgb(15, 15, 28),
            opacity: 1,
          });
        }
      },
    },
  ]);

  const FLAG_COLORS = [
    [230, 60, 60], [60, 180, 230], [255, 210, 63], [140, 220, 100],
    [230, 100, 200], [255, 140, 40], [120, 100, 230], [255, 255, 255],
  ];
  // Drapeaux : 40 drapeaux en 1 seule entité draw (au lieu de 120 entités +
  // k.onUpdate("flag-deco") appelé 40×/frame). Cull viewport ±1 écran.
  const FLAG_COUNT = 40;
  const flagData = [];
  for (let i = 0; i < FLAG_COUNT; i++) {
    const fx = -WORLD_W + (i / FLAG_COUNT) * 2 * WORLD_W + 40 + Math.random() * 40;
    const poleH = 60 + Math.random() * 30;
    const poleY = GROUND_ROW * TILE - poleH;
    const col = FLAG_COLORS[i % FLAG_COLORS.length];
    flagData.push({
      fx, poleH, poleY,
      color: k.rgb(col[0], col[1], col[2]),
      phase: Math.random() * 6,
    });
  }
  const POLE_COLOR = k.rgb(80, 70, 60);
  const CAP_COLOR = k.rgb(255, 210, 63);
  k.add([
    k.pos(0, 0),
    k.z(-8),
    {
      draw() {
        const camX = (k.camPos?.().x) ?? WIDTH / 2;
        const scale = (k.camScale?.().x) || 1;
        const halfView = WIDTH / (2 * scale) + 40;
        const minX = camX - halfView;
        const maxX = camX + halfView;
        const t = k.time();
        for (const f of flagData) {
          if (f.fx < minX || f.fx > maxX) continue;
          k.drawRect({ pos: k.vec2(f.fx, f.poleY), width: 3, height: f.poleH, color: POLE_COLOR });
          k.drawCircle({ pos: k.vec2(f.fx + 1, f.poleY), radius: 3, color: CAP_COLOR });
          const w = Math.sin(t * 3 + f.phase);
          const clothX = f.fx + 3 + w * 1.5;
          const clothY = f.poleY + 2 + Math.abs(w) * 1;
          k.drawRect({ pos: k.vec2(clothX, clothY), width: 22, height: 14, color: f.color });
        }
      },
    },
  ]);

  k.onUpdate("cloud", (c) => {
    c.pos.x += c.speed * k.dt();
    if (c.pos.x > WORLD_W + 100) c.pos.x = -WORLD_W - 100;
  });
}
