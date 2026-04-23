// Shake via offset global : le camera follow écrit camPos chaque frame sans
// conflit. On stocke un offset ici, qui est additionné dans le main loop.
export function createJuice({ k }) {
  let hitStopUntil = 0;
  const shakeOffset = { x: 0, y: 0, until: 0, mag: 0, ux: 0, uy: 0, dur: 0 };

  function hitStop(ms) {
    hitStopUntil = Math.max(hitStopUntil, performance.now() + ms);
  }

  function isStopped() {
    return performance.now() < hitStopUntil;
  }

  function dirShake(dx, dy, mag = 8, dur = 0.15) {
    const norm = Math.hypot(dx, dy) || 1;
    shakeOffset.ux = dx / norm;
    shakeOffset.uy = dy / norm;
    shakeOffset.mag = mag;
    shakeOffset.dur = dur;
    shakeOffset.until = k.time() + dur;
  }

  // Compute current shake offset (consumer adds to camPos each frame).
  function getShakeOffset() {
    const now = k.time();
    if (now >= shakeOffset.until) return { x: 0, y: 0 };
    const t = 1 - (shakeOffset.until - now) / shakeOffset.dur;
    const decay = 1 - t;
    const wobble = Math.sin(now * 60) * shakeOffset.mag * decay;
    return { x: shakeOffset.ux * wobble, y: shakeOffset.uy * wobble };
  }

  return { hitStop, isStopped, dirShake, getShakeOffset };
}
