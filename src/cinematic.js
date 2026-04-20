export function createCinematicSystem({ k, audio, WIDTH, HEIGHT }) {
  let active = false;
  let activeUntil = 0;
  let label = "";
  const triggered = new Set();

  function play(eventKey, displayLabel) {
    if (triggered.has(eventKey) || active) return;
    triggered.add(eventKey);
    active = true;
    activeUntil = k.time() + 1.2;
    label = displayLabel;
    audio.combo?.();
    setTimeout(() => audio.transform?.(), 100);
  }

  function reset() {
    triggered.clear();
  }

  k.add([
    k.pos(0, 0),
    k.z(50),
    {
      draw() {
        if (!active) return;
        const remaining = activeUntil - k.time();
        if (remaining <= 0) {
          active = false;
          audio.crack?.();
          return;
        }
        const t = 1 - remaining / 1.2;
        const opacity =
          t < 0.3 ? (t / 0.3) * 0.4 :
          t > 0.7 ? ((1 - (t - 0.7) / 0.3) * 0.4) :
          0.4;
        // Cover whole viewport even when dezoomed: compute visible world rect
        let camS = 1, camP = k.vec2(WIDTH / 2, HEIGHT / 2);
        try { const s = k.camScale(); camS = s?.x || s || 1; } catch (e) {}
        try { camP = k.camPos() || camP; } catch (e) {}
        const visibleW = WIDTH / camS + 200;
        const visibleH = HEIGHT / camS + 200;
        k.drawRect({
          pos: k.vec2(camP.x - visibleW / 2, camP.y - visibleH / 2),
          width: visibleW,
          height: visibleH,
          color: k.rgb(0, 0, 0),
          opacity,
        });
        const textOpacity =
          t < 0.4 ? t / 0.4 :
          t > 0.8 ? (1 - (t - 0.8) / 0.2) :
          1;
        const scale = (1 + Math.sin(t * Math.PI) * 0.2) / camS;
        for (const [dx, dy] of [[-3, -3], [3, -3], [-3, 3], [3, 3]]) {
          k.drawText({
            text: label,
            size: 56 * scale,
            pos: k.vec2(camP.x + dx / camS, camP.y + dy / camS),
            anchor: "center",
            color: k.rgb(0, 0, 0),
            opacity: textOpacity * 0.9,
          });
        }
        k.drawText({
          text: label,
          size: 56 * scale,
          pos: k.vec2(camP.x, camP.y),
          anchor: "center",
          color: k.rgb(255, 220, 80),
          opacity: textOpacity,
        });
      },
    },
  ]);

  return { play, reset, isActive: () => active };
}
