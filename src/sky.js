import { WIDTH, HEIGHT, GROUND_ROW, TILE } from "./constants.js";

export function createSkySystem({ k, spectres }) {
  let isNight = false;

  // k.fixed() : atmosphère = toujours en screen-space, suit la caméra
  const moon = k.add([
    k.circle(24),
    k.pos(WIDTH - 140, 90),
    k.color(k.rgb(255, 250, 220)),
    k.opacity(0),
    k.fixed(),
    k.z(-11),
    "night-deco",
  ]);
  const moonCrater = k.add([
    k.circle(8),
    k.pos(WIDTH - 150, 82),
    k.color(k.rgb(200, 195, 170)),
    k.opacity(0),
    k.fixed(),
    k.z(-10),
    "night-deco",
  ]);
  const nightTint = k.add([
    k.rect(WIDTH, HEIGHT),
    k.pos(0, 0),
    k.color(k.rgb(20, 30, 80)),
    k.opacity(0),
    k.fixed(),
    k.z(-12),
    "night-deco",
  ]);

  const starData = Array.from({ length: 40 }, () => ({
    x: Math.random() * WIDTH,
    y: Math.random() * (GROUND_ROW * TILE - 80) + 20,
    r: 1 + Math.random(),
    twinkle: Math.random() * 10,
    baseOpacity: 0.7 + Math.random() * 0.3,
  }));

  const fireflyData = Array.from({ length: 18 }, () => ({
    x: Math.random() * WIDTH,
    y: 220 + Math.random() * 200,
    phaseX: Math.random() * Math.PI * 2,
    phaseY: Math.random() * Math.PI * 2,
    speedX: 0.5 + Math.random() * 0.6,
    speedY: 0.7 + Math.random() * 0.8,
    blink: Math.random() * 5,
  }));

  const shootingStars = [];
  k.loop(7, () => {
    if (!isNight || shootingStars.length > 2) return;
    if (Math.random() > 0.5) return;
    shootingStars.push({
      x: Math.random() * WIDTH * 0.7,
      y: Math.random() * 150,
      vx: 280 + Math.random() * 120,
      vy: 90 + Math.random() * 60,
      life: 0,
    });
  });

  k.add([
    k.pos(0, 0),
    k.fixed(),
    k.z(-9),
    {
      draw() {
        if (isNight) return;
        const sx = 110;
        const sy = 80 + Math.sin(k.time() * 0.7) * 4;
        // Sun corona
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * Math.PI * 2 + k.time() * 0.4;
          k.drawRect({
            pos: k.vec2(sx + Math.cos(a) * 38 - 2, sy + Math.sin(a) * 38 - 6),
            width: 4,
            height: 12,
            color: k.rgb(255, 230, 100),
            opacity: 0.7,
            angle: (a * 180) / Math.PI,
            anchor: "center",
          });
        }
        k.drawCircle({ pos: k.vec2(sx, sy), radius: 26, color: k.rgb(255, 235, 120) });
        k.drawCircle({ pos: k.vec2(sx - 8, sy - 4), radius: 2.4, color: k.rgb(60, 50, 20) });
        k.drawCircle({ pos: k.vec2(sx + 8, sy - 4), radius: 2.4, color: k.rgb(60, 50, 20) });
        // smile arc using small dots
        for (let i = -3; i <= 3; i++) {
          const t = i / 3;
          const mx = sx + i * 3;
          const my = sy + 7 + (1 - t * t) * 4;
          k.drawCircle({ pos: k.vec2(mx, my), radius: 1.4, color: k.rgb(60, 50, 20) });
        }
      },
    },
  ]);

  k.add([
    k.pos(0, 0),
    k.fixed(),
    k.z(-11),
    {
      draw() {
        if (!isNight) return;
        for (const s of starData) {
          const op = s.baseOpacity * (0.5 + Math.sin(k.time() * 2 + s.twinkle) * 0.5);
          k.drawCircle({ pos: k.vec2(s.x, s.y), radius: s.r, color: k.rgb(255, 255, 220), opacity: op });
        }
        const t = k.time();
        for (const f of fireflyData) {
          const x = f.x + Math.sin(t * f.speedX + f.phaseX) * 80;
          const y = f.y + Math.cos(t * f.speedY + f.phaseY) * 40;
          const blink = 0.4 + 0.6 * Math.abs(Math.sin(t * 1.8 + f.blink));
          k.drawCircle({ pos: k.vec2(x, y), radius: 4, color: k.rgb(255, 230, 120), opacity: 0.18 * blink });
          k.drawCircle({ pos: k.vec2(x, y), radius: 1.6, color: k.rgb(255, 245, 180), opacity: 0.95 * blink });
        }
        for (let i = shootingStars.length - 1; i >= 0; i--) {
          const s = shootingStars[i];
          s.life += k.dt();
          s.x += s.vx * k.dt();
          s.y += s.vy * k.dt();
          if (s.life > 1.5 || s.x > WIDTH + 30) {
            shootingStars.splice(i, 1);
            continue;
          }
          const a = 1 - s.life / 1.5;
          for (let j = 0; j < 8; j++) {
            const tx = s.x - s.vx * j * 0.013;
            const ty = s.y - s.vy * j * 0.013;
            k.drawCircle({ pos: k.vec2(tx, ty), radius: 1.6 - j * 0.15, color: k.rgb(255, 255, 230), opacity: a * (1 - j / 8) });
          }
        }
      },
    },
  ]);

  function toggleNight() {
    isNight = !isNight;
    moon.opacity = isNight ? 1 : 0;
    moonCrater.opacity = isNight ? 1 : 0;
    nightTint.opacity = isNight ? 0.35 : 0;
    if (isNight) spectres?.unlock?.("night_mode");
  }

  function setNight(v) {
    if (v === isNight) return;
    toggleNight();
  }

  function isNightActive() { return isNight; }

  return { toggleNight, setNight, isNightActive };
}
