export function createSceneOverlays({ k, gameState, entityCounts, audio, showPopup, TILE }) {
  // Cache wagons 10Hz — évite k.get("wagon") par frame dans le draw z=8
  // (leader-couronne check).
  let _cachedWagons = [];
  k.loop(0.1, () => { _cachedWagons = k.get("wagon"); });

  k.onUpdate(() => {
    for (const g of gameState.geysers) {
      if (entityCounts.particle > 120) break;
      if (Math.random() < 0.7) {
        const cx = g.col * TILE + TILE / 2;
        const cy = g.row * TILE;
        const angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.5;
        const sp = 80 + Math.random() * 80;
        const p = k.add([
          k.circle(2 + Math.random() * 2),
          k.pos(cx + (Math.random() - 0.5) * 14, cy),
          k.color(k.rgb(80, 200, 255)),
          k.opacity(0.85),
          k.lifespan(0.6, { fade: 0.3 }),
          k.z(8),
          "particle",
          { vx: Math.cos(angle) * sp, vy: Math.sin(angle) * sp, grav: 200 },
        ]);
        p.onUpdate(() => {
          p.pos.x += p.vx * k.dt();
          p.pos.y += p.vy * k.dt();
          p.vy += p.grav * k.dt();
        });
      }
    }
  });

  k.loop(0.3, () => {
    if (entityCounts.particle > 120) return;
    for (const r of gameState.iceRinks) {
      if (Math.random() < 0.5) {
        const x = (r.startCol + Math.random() * r.len) * TILE;
        const cry = k.add([
          k.rect(2 + Math.random() * 2, 2 + Math.random() * 2),
          k.pos(x, r.row * TILE - 80 - Math.random() * 40),
          k.color(k.rgb(180, 220, 255)),
          k.opacity(0.7),
          k.lifespan(2, { fade: 1.5 }),
          k.z(3),
          "particle",
          { vx: (Math.random() - 0.5) * 10, vy: 50 + Math.random() * 30 },
        ]);
        cry.onUpdate(() => {
          cry.pos.x += cry.vx * k.dt();
          cry.pos.y += cry.vy * k.dt();
        });
      }
    }
  });

  k.add([
    k.pos(0, 0),
    k.z(8),
    {
      draw() {
        const fields = gameState.magnetFields;
        const portals = gameState.magnetPortals;
        const hasFields = fields && fields.length;
        const hasPortals = portals && portals.length;
        const wagons = _cachedWagons;
        const hasLeader = wagons.length >= 2;
        if (!hasFields && !hasPortals && !hasLeader) return;
        for (const f of (hasFields ? fields : [])) {
          const ax = f.a.gridCol * TILE + TILE / 2;
          const ay = f.a.gridRow * TILE + TILE / 2;
          const bx = f.b.gridCol * TILE + TILE / 2;
          const by = f.b.gridRow * TILE + TILE / 2;
          const opacity = 0.3 + Math.sin(k.time() * 3) * 0.2;
          for (let p = 0.08; p < 1; p += 0.12) {
            const x = ax + (bx - ax) * p;
            const y = ay + (by - ay) * p;
            k.drawCircle({ pos: k.vec2(x, y - 7), radius: 2.5, color: k.rgb(180, 100, 220), opacity });
            k.drawCircle({ pos: k.vec2(x, y + 7), radius: 2.5, color: k.rgb(180, 100, 220), opacity });
          }
        }
        for (const mp of (hasPortals ? portals : [])) {
          const cx = mp.x + TILE / 2;
          const cy = mp.y + TILE / 2;
          const pulse = 0.5 + 0.5 * Math.sin(k.time() * 4);
          k.drawCircle({
            pos: k.vec2(cx, cy),
            radius: 3 * TILE * (0.85 + 0.15 * pulse),
            color: k.rgb(180, 80, 240),
            opacity: 0.05 + 0.1 * pulse,
          });
          for (let i = 0; i < 6; i++) {
            const ang = (i / 6) * Math.PI * 2 + k.time() * 1.5;
            const r = 2 * TILE + Math.sin(k.time() * 3 + i) * 8;
            k.drawCircle({
              pos: k.vec2(cx + Math.cos(ang) * r, cy + Math.sin(ang) * r),
              radius: 4,
              color: k.rgb(220, 140, 255),
              opacity: 0.7,
            });
          }
        }
        if (hasLeader) {
          const filtered = wagons.filter((w) => !w.inverseTrain);
          if (filtered.length >= 2) {
            let leader = filtered[0];
            for (const w of filtered) {
              if (w.pos.x > leader.pos.x) leader = w;
            }
            const cx = leader.pos.x + 30;
            const cy = leader.pos.y - 18 + Math.sin(k.time() * 4) * 2;
            k.drawText({ text: "👑", pos: k.vec2(cx - 12, cy), size: 20 });
          }
        }
      },
    },
  ]);

  k.add([
    k.pos(0, 0),
    k.z(2),
    {
      draw() {
        const t = k.time();
        for (const cr of gameState.iceCrowns) {
          k.drawCircle({
            pos: k.vec2(cr.cx, cr.cy),
            radius: cr.radius,
            color: k.rgb(140, 200, 255),
            opacity: 0.05 + Math.sin(t * 2) * 0.04,
          });
          for (let i = 0; i < 4; i++) {
            const a = (i / 4) * Math.PI * 2 + t * 1.5;
            const r = TILE * 0.8;
            const x = cr.cx + Math.cos(a) * r;
            const y = cr.cy + Math.sin(a) * r;
            k.drawRect({
              pos: k.vec2(x - 3, y - 3),
              width: 6,
              height: 6,
              angle: a * 180 / Math.PI,
              color: k.rgb(200, 235, 255),
              outline: { color: k.rgb(80, 140, 200), width: 1 },
              anchor: "center",
            });
          }
          for (let pi = 0; pi < 5; pi++) {
            k.drawRect({
              pos: k.vec2(cr.cx - 10 + pi * 5, cr.cy - 14 - (pi % 2) * 3),
              width: 3,
              height: 6 + (pi % 2) * 3,
              color: k.rgb(255, 215, 60),
              outline: { color: k.rgb(180, 130, 0), width: 1 },
            });
          }
        }
      },
    },
  ]);

  k.loop(3, () => {
    for (const tri of gameState.lavaTriangles) {
      const visitors = k.get("visitor").filter((v) => !v.isSkeleton);
      if (visitors.length === 0) continue;
      let closest = null, bestD = Infinity;
      for (const v of visitors) {
        const d = Math.hypot(v.pos.x - tri.cx, v.pos.y - tri.cy);
        if (d < bestD && d < 200) { bestD = d; closest = v; }
      }
      if (!closest) continue;
      const ghost = k.add([
        k.circle(6),
        k.pos(tri.cx, tri.cy),
        k.color(k.rgb(180, 30, 80)),
        k.outline(2, k.rgb(60, 0, 0)),
        k.opacity(0.85),
        k.z(15),
        "lava-ghost",
        { target: closest, speed: 90 },
      ]);
      ghost.onUpdate(() => {
        if (!ghost.target?.exists() || ghost.target.isSkeleton) {
          k.destroy(ghost);
          return;
        }
        const dx = ghost.target.pos.x - ghost.pos.x;
        const dy = ghost.target.pos.y - ghost.pos.y;
        const d = Math.hypot(dx, dy);
        if (d < 12) {
          ghost.target.isSkeleton = true;
          ghost.target.sprite = "skeleton";
          ghost.target.color.r = 255;
          ghost.target.color.g = 255;
          ghost.target.color.b = 255;
          gameState.skeletons += 1;
          gameState.score += 50;
          audio.transform();
          showPopup(ghost.target.pos.x + 14, ghost.target.pos.y - 30, "OEIL +50", k.rgb(180, 30, 80), 18);
          for (let i = 0; i < 8; i++) {
            const a = (Math.PI * 2 * i) / 8;
            const p = k.add([
              k.circle(3),
              k.pos(ghost.target.pos.x + 14, ghost.target.pos.y + 20),
              k.color(k.rgb(40, 0, 20)),
              k.opacity(1),
              k.lifespan(0.5, { fade: 0.3 }),
              k.z(12),
              "particle",
              { vx: Math.cos(a) * 80, vy: Math.sin(a) * 80 },
            ]);
            p.onUpdate(() => {
              p.pos.x += p.vx * k.dt();
              p.pos.y += p.vy * k.dt();
            });
          }
          k.destroy(ghost);
          return;
        }
        ghost.pos.x += (dx / d) * ghost.speed * k.dt();
        ghost.pos.y += (dy / d) * ghost.speed * k.dt();
      });
    }
  });

  k.add([
    k.pos(0, 0),
    k.z(3),
    {
      draw() {
        const t = k.time();
        for (const tri of gameState.lavaTriangles) {
          const pulse = 0.5 + Math.sin(t * 4) * 0.5;
          k.drawCircle({
            pos: k.vec2(tri.cx, tri.cy),
            radius: 12 + pulse * 4,
            color: k.rgb(120, 20, 40),
            opacity: 0.7 + pulse * 0.2,
          });
          k.drawCircle({
            pos: k.vec2(tri.cx, tri.cy),
            radius: 4,
            color: k.rgb(20, 0, 0),
          });
          k.drawCircle({
            pos: k.vec2(tri.cx + 1, tri.cy - 1),
            radius: 1,
            color: k.rgb(255, 200, 200),
          });
        }
      },
    },
  ]);
}
