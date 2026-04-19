import { WIDTH } from "./constants.js";

export function createAchievements({ k, spectres, audio }) {
  const queue = [];
  let current = null;
  let currentT = 0;
  const DURATION = 3.5;

  spectres.onUnlock((id, spec) => {
    queue.push(spec);
  });

  k.onUpdate(() => {
    if (!current && queue.length > 0) {
      current = queue.shift();
      currentT = 0;
      if (audio?.achievement) audio.achievement();
    }
    if (current) {
      currentT += k.dt();
      if (currentT >= DURATION) current = null;
    }
  });

  function outline(text, x, y, size, color, opacity) {
    for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) {
      if (dx === 0 && dy === 0) continue;
      k.drawText({ text, pos: k.vec2(x + dx, y + dy), size, color: k.rgb(0, 0, 0), opacity: opacity * 0.9 });
    }
    k.drawText({ text, pos: k.vec2(x, y), size, color, opacity });
  }

  k.add([
    k.pos(0, 0),
    k.z(60),
    {
      draw() {
        if (!current) return;
        const t = currentT;
        let alpha = 1, scale = 1, dx = 0;
        if (t < 0.4) {
          const p = t / 0.4;
          scale = 0.6 + 0.4 * (1 - Math.pow(1 - p, 3));
          alpha = p;
          dx = (1 - p) * 60;
        } else if (t > DURATION - 0.4) {
          const p = (DURATION - t) / 0.4;
          alpha = p;
          dx = (1 - p) * 60;
        }
        const w = 280 * scale;
        const h = 70 * scale;
        const x = WIDTH - w - 20 + dx;
        const y = 90;

        k.drawRect({
          pos: k.vec2(x, y),
          width: w,
          height: h,
          color: k.rgb(20, 20, 40),
          opacity: alpha * 0.9,
          outline: { color: k.rgb(255, 200, 60), width: 2 },
          radius: 8,
        });

        const emoji = current.emoji || "✨";
        k.drawText({
          text: emoji,
          pos: k.vec2(x + 12, y + 14),
          size: 36 * scale,
          opacity: alpha,
        });

        outline("DEBLOQUE !", x + 64, y + 10, 12 * scale, k.rgb(255, 200, 60), alpha);
        outline(current.name || "Spectre", x + 64, y + 30, 16 * scale, k.rgb(255, 255, 255), alpha);
      },
    },
  ]);

  return {};
}
