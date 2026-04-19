export function createJuice({ k }) {
  let hitStopUntil = 0;
  // Capture the canonical camera once, here, so overlapping shakes never
  // capture an already-shaken position and reset onto a drifted offset.
  const baseCam = k.camPos();

  function hitStop(ms) {
    hitStopUntil = Math.max(hitStopUntil, performance.now() + ms);
  }

  function isStopped() {
    return performance.now() < hitStopUntil;
  }

  function dirShake(dx, dy, mag = 8, dur = 0.15) {
    const start = k.time();
    const norm = Math.hypot(dx, dy) || 1;
    const ux = dx / norm;
    const uy = dy / norm;
    const tickHandler = k.onUpdate(() => {
      const t = (k.time() - start) / dur;
      if (t >= 1) {
        k.camPos(baseCam);
        tickHandler.cancel();
        return;
      }
      const decay = 1 - t;
      const wobble = Math.sin(k.time() * 60) * mag * decay;
      k.camPos(baseCam.x + ux * wobble, baseCam.y + uy * wobble);
    });
  }

  return { hitStop, isStopped, dirShake };
}
