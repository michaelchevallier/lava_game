import { TILE, GROUND_ROW, gridKey } from "./constants.js";

export function attachWagonCollisions({
  k, wagon, tileMap, gameState, audio, showPopup, placeTile,
  catapultWagon, transformToSkeleton, reviveFromSkeleton, collectCoin, triggerCarillon,
}) {
  wagon.onCollide("lava", () => {
    if (wagon.invincible) return;
    if (wagon.isSpectral) return;
    const hasHuman = wagon.passengers.some((p) => p.type === "human");
    if (hasHuman || wagon.inverseTrain) {
      window.__juice?.hitStop(80);
      transformToSkeleton(wagon);
    } else if (window.__campaign?.getCurrent?.() || window.__contract?.getActive?.()) {
      // En campagne ou contrat : un passage en lave d'un wagon déjà squelette compte aussi
      // (sinon niveaux "N squelettes" avec wagonLimit < N impossibles)
      const now = k.time();
      if (!wagon._lastCampaignLavaCount || now - wagon._lastCampaignLavaCount > 1.0) {
        wagon._lastCampaignLavaCount = now;
        window.__campaign?.progress?.("skeleton");
        window.__contract?.progress?.("skeleton");
        showPopup(wagon.pos.x + 30, wagon.pos.y - 20, "+1 💀", k.rgb(255, 120, 40), 18);
        window.__juice?.dirShake(wagon.vel?.x || 1, 0, 3, 0.12);
      }
    }
  });

  wagon.onCollide("water", () => {
    if (wagon.isSpectral) return;
    const hasSkeleton = wagon.passengers.some((p) => p.type === "skeleton");
    if (hasSkeleton) {
      reviveFromSkeleton(wagon);
    }
  });

  wagon.onCollide("coin", (c) => {
    collectCoin(c);
  });

  wagon.onCollide("ghost", (g) => {
    wagon.darkPassenger = (wagon.darkPassenger || 0) + 1;
    k.destroy(g);
    window.__juice?.dirShake(-1, 0, 4, 0.12);
    audio.coin();
    showPopup(
      wagon.pos.x + 30,
      wagon.pos.y - 20,
      `DETTE x${wagon.darkPassenger + 1}`,
      k.rgb(180, 100, 255),
      16,
    );
    for (let i = 0; i < 10; i++) {
      const a = (Math.PI * 2 * i) / 10;
      k.add([
        k.circle(3 + Math.random() * 2),
        k.pos(wagon.pos.x + 30, wagon.pos.y + 10),
        k.color(k.rgb(180, 100, 255)),
        k.opacity(0.9),
        k.lifespan(0.6, { fade: 0.4 }),
        k.z(13),
        "particle",
        { vx: Math.cos(a) * 80, vy: Math.sin(a) * 80 - 20 },
      ]);
    }
  });

  wagon.onCollide("bridge", (b) => {
    if (wagon.isSpectral) return;
    if (b.breaking) return;
    const crossKey = b.gridCol + "," + b.gridRow;
    const wCd = wagon._bridgeCd || {};
    if (wCd[crossKey] > k.time()) return;
    wCd[crossKey] = k.time() + 1.2;
    wagon._bridgeCd = wCd;
    b.crossings = (b.crossings || 0) + 1;
    window.__juice?.dirShake(0, 1, 2, 0.1);
    audio.place();
    for (let i = 0; i < 5; i++) {
      k.add([
        k.rect(3 + Math.random() * 3, 2 + Math.random() * 2),
        k.pos(b.pos.x + Math.random() * TILE, b.pos.y),
        k.color(k.rgb(140, 80, 30)),
        k.opacity(0.8),
        k.lifespan(0.5, { fade: 0.3 }),
        k.z(5),
        "particle-debris",
        { vx: (Math.random() - 0.5) * 80, vy: -10 - Math.random() * 30 },
      ]);
    }
    if (b.crossings >= 2) {
      b.breaking = true;
      audio.crack?.();
      for (let i = 0; i < 10; i++) {
        k.add([
          k.rect(4 + Math.random() * 4, 3 + Math.random() * 3),
          k.pos(b.pos.x + Math.random() * TILE, b.pos.y),
          k.color(k.rgb(140, 80, 30)),
          k.opacity(1),
          k.lifespan(0.9, { fade: 0.6 }),
          k.z(5),
          "particle-debris",
          { vx: (Math.random() - 0.5) * 120, vy: -20 - Math.random() * 50 },
        ]);
      }
      k.wait(0.15, () => {
        const key2 = gridKey(b.gridCol, b.gridRow);
        if (!tileMap.has(key2)) return;
        if (b.extras) b.extras.forEach((e) => k.destroy(e));
        k.destroy(b);
        tileMap.delete(key2);
        placeTile(b.gridCol, b.gridRow, "lava");
      });
    }
  });

  wagon.onCollide("ice", () => {
    const iceBase = Math.max(wagon.iceUntil || 0, k.time());
    wagon.iceUntil = Math.min(iceBase + 0.35, k.time() + 2);
    if (Math.random() < 0.5) {
      k.add([
        k.circle(1.5),
        k.pos(wagon.pos.x + Math.random() * 60, wagon.pos.y + 28),
        k.color(k.rgb(200, 240, 255)),
        k.opacity(1),
        k.lifespan(0.3, { fade: 0.2 }),
        k.z(2),
      ]);
    }
  });

  wagon.onCollide("portal", (p) => {
    if (wagon.isSpectral) return;
    if (!p.pair || k.time() < p.cooldownUntil) return;
    const savedVelX = wagon.vel ? wagon.vel.x : 0;
    wagon.pos.x = p.pair.pos.x - 30;
    // Clamp Y : wagon ne doit jamais être embed dans le sol (physics eject violent)
    const safeY = Math.min(p.pair.pos.y - 30, (GROUND_ROW - 1) * TILE - 30);
    wagon.pos.y = safeY;
    if (wagon.vel) {
      wagon.vel.x = savedVelX;
      wagon.vel.y = 0; // reset vertical : évite la catapulte incontrôlée si vel.y hérité
    }
    p.cooldownUntil = k.time() + 0.5;
    p.pair.cooldownUntil = k.time() + 0.5;
    gameState.portalUses = (gameState.portalUses || 0) + 1;
    window.__tiers?.onPortalUse?.();
    window.__quests?.onPortal();
    audio.combo();
    window.__juice?.dirShake(1, 0, 3, 0.12);
    // Portal est désormais un sprite — plus de p.color. On dérive la couleur du variant.
    const colR = p.portalColor === "A" ? 80 : 240;
    const colG = p.portalColor === "A" ? 220 : 80;
    const colB = p.portalColor === "A" ? 240 : 220;
    for (let i = 0; i < 14; i++) {
      const a = (Math.PI * 2 * i) / 14;
      k.add([
        k.circle(3 + Math.random() * 2),
        k.pos(p.pair.pos.x, p.pair.pos.y),
        k.color(colR, colG, colB),
        k.opacity(1),
        k.lifespan(0.5, { fade: 0.3 }),
        k.z(13),
        "particle",
        { vx: Math.cos(a) * 120, vy: Math.sin(a) * 120 },
      ]);
    }
  });

  wagon.onCollide("trampoline", (t) => {
    if (wagon.lastBounce && k.time() - wagon.lastBounce < 0.3) return;
    wagon.lastBounce = k.time();
    const fanAbove = tileMap.get(gridKey(t.gridCol, t.gridRow - 1));
    if (fanAbove && fanAbove.tileType === "fan") {
      catapultWagon(wagon);
      window.__campaign?.progress?.("catapult"); window.__contract?.progress?.("catapult");
      return;
    }
    wagon._tramHits = (wagon._tramHits || []).filter(h => k.time() - h.time < 1.5);
    wagon._tramHits.push({ col: t.gridCol, row: t.gridRow, time: k.time() });
    if (wagon._tramHits.length >= 3) {
      const recent = wagon._tramHits.slice(-3);
      const allSameRow = recent.every(h => h.row === recent[0].row);
      const uniqueCols = new Set(recent.map(h => h.col));
      if (allSameRow && uniqueCols.size >= 3) {
        triggerCarillon(wagon);
      }
    }
    gameState.trampolinesThisGame = (gameState.trampolinesThisGame || 0) + 1;
    wagon.jump(850);
    window.__juice?.hitStop(80);
    window.__juice?.dirShake(0, -1, 6, 0.15);
    audio.boost();
    for (let i = 0; i < 8; i++) {
      const a = (Math.PI * 2 * i) / 8;
      k.add([
        k.circle(2 + Math.random() * 2),
        k.pos(wagon.pos.x + 30, wagon.pos.y + 30),
        k.color(k.rgb(255, 120, 180)),
        k.opacity(1),
        k.lifespan(0.3, { fade: 0.2 }),
        k.z(14),
        "particle",
        { vx: Math.cos(a) * 80, vy: Math.sin(a) * 80 },
      ]);
    }
  });

  wagon.onCollide("boost", () => {
    const now = k.time();
    if (!wagon.boostStackUntil || now > wagon.boostStackUntil) {
      wagon.boostStack = 0;
    }
    wagon.boostStack = Math.min(3, (wagon.boostStack || 0) + 1);
    wagon.boostStackUntil = now + 3;
    const base = Math.max(wagon.boostUntil || 0, now);
    wagon.boostUntil = Math.min(base + 1.5, now + 5);

    if (wagon.boostStack === 1) {
      audio.boost();
      for (let i = 0; i < 12; i++) {
        const a = (Math.PI * 2 * i) / 12;
        k.add([
          k.circle(3 + Math.random() * 3),
          k.pos(wagon.pos.x + 30, wagon.pos.y + 15),
          k.color(k.rgb(255, 230, 60)),
          k.opacity(1),
          k.lifespan(0.4, { fade: 0.3 }),
          k.z(14),
          "particle",
          { vx: Math.cos(a) * 120, vy: Math.sin(a) * 120 },
        ]);
      }
    } else if (wagon.boostStack === 2) {
      audio.boost();
      setTimeout(() => audio.coin?.(), 60);
      showPopup(wagon.pos.x + 30, wagon.pos.y - 30, "DOUBLE BOOST !", k.rgb(255, 220, 60), 22);
      window.__juice?.dirShake(1, 0, 6, 0.15);
      for (let i = 0; i < 8; i++) {
        const a = (Math.PI * 2 * i) / 8;
        k.add([
          k.circle(3),
          k.pos(wagon.pos.x + 30, wagon.pos.y + 15),
          k.color(k.rgb(255, 180, 40)),
          k.opacity(1),
          k.lifespan(0.5, { fade: 0.35 }),
          k.z(8),
          "particle",
          { vx: Math.cos(a) * 80, vy: Math.sin(a) * 80 - 30 },
        ]);
      }
    } else {
      audio.combo?.();
      showPopup(wagon.pos.x + 30, wagon.pos.y - 40, "MEGA BOOST !!!", k.rgb(255, 80, 80), 28);
      window.__juice?.dirShake(1, 0, 12, 0.3);
      for (let i = 0; i < 16; i++) {
        const a = (Math.PI * 2 * i) / 16;
        k.add([
          k.circle(3 + Math.random() * 2),
          k.pos(wagon.pos.x + 30, wagon.pos.y + 15),
          k.color(k.rgb(255, 80 + Math.random() * 100, 40)),
          k.opacity(1),
          k.lifespan(0.7, { fade: 0.5 }),
          k.z(10),
          "particle-firework",
          { vx: Math.cos(a) * 120, vy: Math.sin(a) * 120 - 30, grav: 100 },
        ]);
      }
    }
  });

  wagon.onCollide("rail_loop", (loopTile) => {
    if (wagon.inLoop) return;
    wagon.inLoop = true;
    wagon.loopStart = k.time();
    wagon.loopCx = loopTile.loopCx;
    wagon.loopCy = loopTile.loopCy;
    wagon.loopRx = loopTile.loopRx;
    wagon.loopRy = loopTile.loopRy;
    // Direction d'approche : venant de la gauche (pos.x < loopCx) = +1, sinon -1.
    // Détermine aussi la sortie : on sort côté opposé à l'entrée.
    const fromLeft = wagon.pos.x + 30 < loopTile.loopCx;
    wagon.loopDir = fromLeft ? 1 : -1;
    wagon.loopExitX = fromLeft ? loopTile.loopCx + loopTile.loopRx + 30 : loopTile.loopCx - loopTile.loopRx - 30 - 60;
  });

  wagon.onCollide("tunnel", (tunnel) => {
    if (k.time() < (tunnel.cooldownUntil || 0)) return;
    if (wagon._inTunnel) return;
    tunnel.cooldownUntil = k.time() + 5;
    wagon._inTunnel = true;

    const wasOpacity = wagon.opacity ?? 1;
    const partsOpacities = wagon.parts.map((p) => p.opacity ?? 1);

    wagon.opacity = 0;
    wagon.parts.forEach((p) => { p.opacity = 0; });
    if (wagon.passengerEntity) wagon.passengerEntity.opacity = 0;

    wagon.pos.x = tunnel.pos.x + TILE * 4;

    for (let i = 0; i < 8; i++) {
      const a = (Math.PI * 2 * i) / 8;
      k.add([
        k.circle(4),
        k.pos(tunnel.pos.x + TILE / 2, tunnel.pos.y + TILE / 2),
        k.color(k.rgb(40, 20, 60)),
        k.opacity(0.85),
        k.lifespan(1, { fade: 0.7 }),
        k.z(8),
        "particle",
        { vx: Math.cos(a) * 80, vy: Math.sin(a) * 80 - 20 },
      ]);
    }

    audio.combo();
    window.__juice?.dirShake(0, 1, 8, 0.2);

    k.wait(1, () => {
      if (!wagon.exists()) return;
      wagon.opacity = wasOpacity;
      wagon.parts.forEach((p, i) => { if (p.exists()) p.opacity = partsOpacities[i] ?? 1; });
      if (wagon.passengerEntity?.exists()) wagon.passengerEntity.opacity = 1;
      wagon._inTunnel = false;

      // Tunnel de l'Amour Maudit : tous les humains deviennent squelettes + duplication jusqu'à 4
      const hadHumans = wagon.passengers.some((p) => p.type === "human");
      if (hadHumans) transformToSkeleton(wagon);

      let dupCount = 0;
      while (wagon.passengers.length < 4 && dupCount < 2) {
        const idx = wagon.passengers.length;
        wagon.passengers.push({ type: "skeleton" });
        const px = wagon.pos.x + 6 + idx * 14;
        const py = wagon.pos.y - 40;
        const sprite = k.add([
          k.sprite("skeleton"),
          k.pos(px, py),
          k.z(7),
          "passenger",
          { wagon, idx },
        ]);
        wagon.passengerEntities.push(sprite);
        wagon.parts.push(sprite);
        dupCount++;
        for (let i = 0; i < 8; i++) {
          const a = (Math.PI * 2 * i) / 8;
          k.add([
            k.circle(3),
            k.pos(px + 8, py + 12),
            k.color(k.rgb(180, 80, 255)),
            k.opacity(0.95),
            k.lifespan(0.5, { fade: 0.35 }),
            k.z(15),
            "particle",
            { vx: Math.cos(a) * 90, vy: Math.sin(a) * 90 },
          ]);
        }
      }

      const bonus = 50 + dupCount * 30;
      gameState.score += bonus;
      const label = dupCount > 0
        ? `TUNNEL MAUDIT +${bonus} (×${dupCount + 1})`
        : `TUNNEL HANTE +${bonus}`;
      showPopup(wagon.pos.x + 30, wagon.pos.y - 30, label, k.rgb(180, 80, 255), 22);
      audio.combo();
      if (dupCount > 0) window.__juice?.dirShake(0, 1, 10, 0.25);
    });
  });
}
