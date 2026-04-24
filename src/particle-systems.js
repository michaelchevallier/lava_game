import { TILE, GROUND_ROW, gridKey } from "./constants.js";

export function attachParticleAndTileUpdates({ k, tileMap }) {
  k.onUpdate("particle", (p) => {
    p.pos.x += p.vx * k.dt();
    p.pos.y += p.vy * k.dt();
  });

  k.loop(0.1, () => {
    const PARTICLE_TAGS = ["particle", "particle-grav", "particle-x", "particle-debris", "particle-firework", "fan-puff", "steam"];
    const CAP_PER_TYPE = { "particle-grav": 20, "particle-firework": 24, "particle": 20 };
    const batches = {};
    let total = 0;
    for (const tag of PARTICLE_TAGS) {
      const b = k.get(tag);
      batches[tag] = b;
      total += b.length;
    }
    for (const [tag, cap] of Object.entries(CAP_PER_TYPE)) {
      const b = batches[tag];
      if (b.length > cap) b.slice(0, b.length - cap).forEach(p => k.destroy(p));
    }
    if (total <= 60) return;
    const excess = total - 60;
    let destroyed = 0;
    for (const tag of PARTICLE_TAGS) {
      if (destroyed >= excess) break;
      for (const p of batches[tag]) {
        if (destroyed >= excess) break;
        k.destroy(p);
        destroyed++;
      }
    }
  });

  k.loop(0.25, () => {
    for (const [, t] of tileMap) {
      if (t.tileType !== "lava") continue;
      const neighbors = [
        [t.gridCol - 1, t.gridRow],
        [t.gridCol + 1, t.gridRow],
        [t.gridCol, t.gridRow - 1],
        [t.gridCol, t.gridRow + 1],
      ];
      for (const [nc, nr] of neighbors) {
        const n = tileMap.get(gridKey(nc, nr));
        if (!n || n.tileType !== "water") continue;
        const sx = (t.pos.x + n.pos.x) / 2 + TILE / 2;
        const sy = (t.pos.y + n.pos.y) / 2 + TILE / 2;
        for (let i = 0; i < 3; i++) {
          k.add([
            k.circle(3 + Math.random() * 3),
            k.pos(sx + (Math.random() - 0.5) * 20, sy),
            k.color(k.rgb(235, 240, 245)),
            k.opacity(0.55),
            k.lifespan(1.1, { fade: 0.8 }),
            k.z(6),
            "steam",
            { vy: -40 - Math.random() * 30, vx: (Math.random() - 0.5) * 15 },
          ]);
        }
      }
    }
  });

  k.onUpdate("steam", (s) => {
    s.pos.y += s.vy * k.dt();
    s.pos.x += s.vx * k.dt();
    s.vy *= 0.97;
  });

  k.onUpdate("lava", (t) => {
    const f = Math.floor(k.time() * 3 + t.gridCol * 0.5) % 2;
    if (f !== t.lavaPhase) {
      t.lavaPhase = f;
      t.sprite = f === 0 ? "lava1" : "lava2";
    }
  });

  k.loop(0.18, () => {
    const lavas = k.get("lava");
    if (lavas.length === 0) return;
    const cap = Math.min(lavas.length, 4);
    for (let i = 0; i < cap; i++) {
      const t = lavas[Math.floor(Math.random() * lavas.length)];
      if (!t || !t.exists()) continue;
      k.add([
        k.circle(2 + Math.random() * 2),
        k.pos(t.pos.x + 4 + Math.random() * 24, t.pos.y),
        k.color(255, 200 + Math.random() * 55, 60),
        k.opacity(0.9),
        k.lifespan(0.9, { fade: 0.5 }),
        k.z(5),
        k.move(k.UP, 30 + Math.random() * 40),
        "particle",
      ]);
    }
  });

  k.onUpdate("water", (t) => {
    const f = Math.floor(k.time() * 2 + t.gridCol * 0.3) % 2;
    if (f !== t.waterPhase) {
      t.waterPhase = f;
      t.sprite = f === 0 ? "water1" : "water2";
    }
  });

  k.onUpdate("boost", (t) => {
    t.angle = Math.sin(k.time() * 8 + t.gridCol) * 3;
  });

  k.onUpdate("particle-grav", (p) => {
    p.pos.x += p.vx * k.dt();
    p.pos.y += p.vy * k.dt();
    p.vy += p.grav * k.dt();
  });

  k.onUpdate("particle-x", (p) => {
    p.pos.x += p.vx * k.dt();
  });

  k.onUpdate("particle-debris", (p) => {
    p.pos.x += p.vx * k.dt();
    p.pos.y += p.vy * k.dt();
    p.vy += 400 * k.dt();
  });

  k.onUpdate("ghost", (g) => {
    g.pos.x += g.vx * k.dt();
    g.pos.y += g.vy * k.dt();
    g.vy += 100 * k.dt();
    if (g.pos.y > (GROUND_ROW - 2) * TILE) {
      g.pos.y = (GROUND_ROW - 2) * TILE;
      g.vy = 0;
    }
    g.opacity = Math.max(0, 0.55 - (k.time() - g.born) / 4);
    if (k.time() - g.born > 3.5 || g.pos.x < -60) k.destroy(g);
  });

  k.onUpdate("particle-firework", (p) => {
    p.pos.x += p.vx * k.dt();
    p.pos.y += p.vy * k.dt();
    p.vy += p.grav * k.dt();
    p.vx *= 0.98;
  });

  k.onUpdate("fan-puff", (p) => {
    p.pos.y += p.vy * k.dt();
    p.pos.x += p.vx * k.dt();
    p.vy *= 0.98;
  });
}
