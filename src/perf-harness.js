// Perf harness — activé via URL ?perf=1. Mesure FPS rolling 60 frames,
// entity counts taggés/untaggés, affiche overlay HTML fixe top-right.
// Aucun coût si pas activé (tout derrière un flag lu au boot).

const FPS_WINDOW = 60;

export function createPerfHarness({ k, getStats }) {
  const enabled = new URLSearchParams(location.search).has("perf");
  if (!enabled) {
    return { enabled: false };
  }

  const frameTimes = [];
  let lastFrame = performance.now();

  const overlay = document.createElement("div");
  overlay.id = "perf-overlay";
  overlay.style.cssText = [
    "position:fixed", "top:4px", "right:4px", "z-index:10000",
    "background:rgba(0,0,0,0.78)", "color:#9fe",
    "font:11px/1.3 ui-monospace,Menlo,Consolas,monospace",
    "padding:6px 8px", "border-radius:4px", "border:1px solid #444",
    "pointer-events:none", "white-space:pre", "min-width:180px",
  ].join(";");
  document.body.appendChild(overlay);

  k.onUpdate(() => {
    const now = performance.now();
    const dt = now - lastFrame;
    lastFrame = now;
    frameTimes.push(dt);
    if (frameTimes.length > FPS_WINDOW) frameTimes.shift();
  });

  function stats() {
    if (frameTimes.length < 2) return { avg: 0, p95: 0, p1: 0 };
    const sorted = [...frameTimes].sort((a, b) => a - b);
    const sum = sorted.reduce((s, v) => s + v, 0);
    const avgDt = sum / sorted.length;
    const p95Dt = sorted[Math.floor(sorted.length * 0.95)];
    const p1Dt = sorted[sorted.length - 1];
    return {
      avg: Math.round(1000 / avgDt),
      p95: Math.round(1000 / p95Dt),
      p1: Math.round(1000 / p1Dt),
    };
  }

  setInterval(() => {
    const s = stats();
    const taggedCounts = getStats();
    const total = taggedCounts.total;
    let taggedSum = 0;
    for (const key in taggedCounts) {
      if (key !== "total") taggedSum += taggedCounts[key];
    }
    const untagged = total - taggedSum;
    const top = Object.entries(taggedCounts)
      .filter(([k]) => k !== "total")
      .filter(([, v]) => v > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([k, v]) => `  ${k.padEnd(12)} ${v}`).join("\n");
    overlay.textContent = [
      `FPS  avg ${s.avg}  p95 ${s.p95}  p1 ${s.p1}`,
      `ENT  total ${total}  untagged ${untagged}`,
      top || "  (no tagged entities)",
    ].join("\n");
  }, 250);

  return { enabled: true, stats };
}
