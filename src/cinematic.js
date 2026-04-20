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
    k.debug.timeScale = 0.25;
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
          k.debug.timeScale = 1;
          audio.crack?.();
          return;
        }
        const t = 1 - remaining / 1.2;
        const opacity =
          t < 0.3 ? (t / 0.3) * 0.4 :
          t > 0.7 ? ((1 - (t - 0.7) / 0.3) * 0.4) :
          0.4;
        k.drawRect({
          pos: k.vec2(0, 0),
          width: WIDTH,
          height: HEIGHT,
          color: k.rgb(0, 0, 0),
          opacity,
        });
        const textOpacity =
          t < 0.4 ? t / 0.4 :
          t > 0.8 ? (1 - (t - 0.8) / 0.2) :
          1;
        const scale = 1 + Math.sin(t * Math.PI) * 0.2;
        for (const [dx, dy] of [[-3, -3], [3, -3], [-3, 3], [3, 3]]) {
          k.drawText({
            text: label,
            size: 56 * scale,
            pos: k.vec2(WIDTH / 2 + dx, HEIGHT / 2 + dy),
            anchor: "center",
            color: k.rgb(0, 0, 0),
            opacity: textOpacity * 0.9,
          });
        }
        k.drawText({
          text: label,
          size: 56 * scale,
          pos: k.vec2(WIDTH / 2, HEIGHT / 2),
          anchor: "center",
          color: k.rgb(255, 220, 80),
          opacity: textOpacity,
        });
      },
    },
  ]);

  return { play, reset, isActive: () => active };
}
