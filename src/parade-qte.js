export function createParadeQTE({ k, audio, showPopup, gameState, getActivePlayers }) {
  const activeQTEs = new Set();

  function spawnLavaParticles(wagon, p) {
    const dx = p.pos.x - wagon.pos.x;
    const dy = p.pos.y - wagon.pos.y;
    const dist = Math.max(1, Math.hypot(dx, dy));
    for (let i = 0; i < 5; i++) {
      const spread = (Math.random() - 0.5) * 0.4;
      const speed = 180 + Math.random() * 60;
      const ux = dx / dist;
      const uy = dy / dist;
      const rx = ux * Math.cos(spread) - uy * Math.sin(spread);
      const ry = ux * Math.sin(spread) + uy * Math.cos(spread);
      k.add([
        k.circle(3 + Math.random() * 2),
        k.pos(wagon.pos.x + 30, wagon.pos.y + 10),
        k.color(k.rgb(255, 120 + Math.random() * 60, 40)),
        k.opacity(1),
        k.lifespan(0.5, { fade: 0.3 }),
        k.z(14),
        "particle-grav",
        { vx: rx * speed, vy: ry * speed - 60, grav: 260 },
      ]);
    }
  }

  function onParadeSuccess(qte) {
    qte.player._paradeConsumedAt = k.time();
    qte.player._paradeCombo = (qte.player._paradeCombo || 0) + 1;

    k.add([
      k.rect(60, 60),
      k.pos(qte.player.pos.x - 16, qte.player.pos.y - 10),
      k.color(k.rgb(255, 255, 255)),
      k.opacity(0.5),
      k.lifespan(0.15, { fade: 0.12 }),
      k.z(18),
    ]);

    audio.combo();
    gameState.score += 30;
    showPopup(qte.player.pos.x + 14, qte.player.pos.y - 40, "+30 PARADE!", k.rgb(255, 230, 90), 20);

    if (qte.player._paradeCombo % 5 === 0) {
      gameState.score += 200;
      showPopup(qte.player.pos.x + 14, qte.player.pos.y - 70, "SURFEUR DE LAVE !", k.rgb(60, 220, 255), 28);
      if (typeof audio.apocalypse === "function") audio.apocalypse();
      else audio.combo();

      for (let i = 0; i < 24; i++) {
        const a = (Math.PI * 2 * i) / 24;
        const col = i % 2 === 0 ? k.rgb(60, 220, 255) : k.rgb(255, 230, 90);
        k.add([
          k.circle(2 + Math.random() * 2),
          k.pos(qte.player.pos.x + 14, qte.player.pos.y + 20),
          k.color(col),
          k.opacity(1),
          k.lifespan(0.7, { fade: 0.5 }),
          k.z(16),
          "particle-grav",
          { vx: Math.cos(a) * 120, vy: Math.sin(a) * 120 - 30, grav: 150 },
        ]);
      }

    }
  }

  function onParadeMiss(qte) {
    qte.player.stunnedUntil = k.time() + 1.5;
    qte.player._paradeCombo = 0;
    showPopup(qte.player.pos.x + 14, qte.player.pos.y - 40, "STUN!", k.rgb(255, 60, 60), 18);

    for (let i = 0; i < 6; i++) {
      const a = Math.PI * 0.3 + (Math.random() - 0.5) * Math.PI * 0.5;
      k.add([
        k.circle(2 + Math.random() * 2),
        k.pos(qte.player.pos.x + 14, qte.player.pos.y + 30),
        k.color(k.rgb(255, 80 + Math.random() * 60, 40)),
        k.opacity(1),
        k.lifespan(0.4, { fade: 0.3 }),
        k.z(14),
        "particle-grav",
        { vx: (Math.random() - 0.5) * 80, vy: 60 + Math.random() * 60, grav: 200 },
      ]);
    }

    if (typeof audio.lose === "function") audio.lose();
    else if (typeof audio.hit === "function") audio.hit();
  }

  function spawnQTE(p, wagon) {
    const qte = k.add([
      k.pos(p.pos.x + 14, p.pos.y - 14),
      k.anchor("center"),
      k.z(20),
      "parade-qte",
    ]);

    qte.player = p;
    qte.startTime = k.time();
    qte.duration = 0.6;
    qte.parried = false;

    qte.onUpdate = function() {
      this.pos = k.vec2(p.pos.x + 14, p.pos.y - 14);
      const elapsed = k.time() - this.startTime;
      if (elapsed >= this.duration) {
        if (!this.parried) onParadeMiss(this);
        activeQTEs.delete(this);
        k.destroy(this);
        return;
      }
      if (!this.parried) {
        for (const key of (this.player.parryKeys || [])) {
          if (k.isKeyPressed(key)) {
            this.parried = true;
            onParadeSuccess(this);
            break;
          }
        }
      }
    };

    qte.draw = function() {
      const t = Math.max(0, Math.min(1, (k.time() - this.startTime) / this.duration));
      const r = k.lerp(28, 8, t);
      k.drawCircle({ pos: k.vec2(0, 0), radius: r + 1, outline: { color: k.rgb(0, 0, 0), width: 2 }, fill: false });
      k.drawCircle({ pos: k.vec2(0, 0), radius: r, outline: { color: k.rgb(255, 230, 90), width: 2 }, fill: false });
      k.drawCircle({ pos: k.vec2(0, 0), radius: 10, outline: { color: k.rgb(255, 80, 60), width: 1 }, fill: false });
      const label = this.player?.parryKeyLabel || "!";
      for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
        k.drawText({ text: label, size: 12, pos: k.vec2(dx, -28 + dy), anchor: "center", color: k.rgb(0, 0, 0) });
      }
      k.drawText({ text: label, size: 12, pos: k.vec2(0, -28), anchor: "center", color: k.rgb(255, 230, 90) });
    };

    activeQTEs.add(qte);
    spawnLavaParticles(wagon, p);
  }

  function triggerFromWagon(wagon) {
    if (!wagon || !wagon.exists()) return;
    if (wagon._paradeCd > k.time()) return;
    wagon._paradeCd = k.time() + 0.8;

    const players = getActivePlayers().filter(
      (p) => p && p.exists() && !p.isSkeleton &&
             !(p.stunnedUntil && k.time() < p.stunnedUntil)
    );
    if (players.length === 0) return;

    let closest = null;
    let bestDist = Infinity;
    for (const p of players) {
      const alreadyActive = [...activeQTEs].some((q) => q.player === p);
      if (alreadyActive) continue;
      const d = Math.hypot(p.pos.x - wagon.pos.x, p.pos.y - wagon.pos.y);
      if (d < bestDist) {
        bestDist = d;
        closest = p;
      }
    }
    if (!closest || bestDist >= 400) return;

    spawnQTE(closest, wagon);
  }

  return { triggerFromWagon };
}
