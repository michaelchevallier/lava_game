// Constellation Spectrale : 5+ squelettes vivants + portail actif
// → spirale violette → fusion → wagon spectral doré immortel 10s.
// Extracted from main.js to keep that file under 1500 lines.

export function createConstellationSystem({
  k, tileMap, gameState, audio, showPopup, checkMilestone,
  drawWagonBody, juice, WIDTH, HEIGHT, TILE, GROUND_ROW,
}) {
  function spawnSpectralWagon(portalTile) {
    const SPECTRAL_THEME = { body: [255, 200, 30], dark: [180, 130, 0], trim: [255, 255, 200] };
    const y = (GROUND_ROW - 1) * TILE + 2;
    const baseSpeed = 140 * 1.5 * (gameState.wagonSpeedMult ?? 1);
    const wagon = k.add([
      k.rect(60, 30),
      k.pos(portalTile.pos.x - 30, y),
      k.opacity(0),
      k.area({ shape: new k.Rect(k.vec2(0, -10), 60, 50) }),
      k.body(),
      k.anchor("topleft"),
      k.z(3),
      "wagon",
      {
        passenger: "human",
        speed: baseSpeed,
        parts: [],
        rider: null,
        ghostTrain: false,
        inverseTrain: false,
        isSpectral: true,
        isGolden: true,
        spectralBorn: k.time(),
        spectralLastCol: Math.floor((portalTile.pos.x - 30) / TILE),
      },
    ]);
    wagon.theme = SPECTRAL_THEME;

    const parts = drawWagonBody(wagon.pos.x, wagon.pos.y, SPECTRAL_THEME);
    const wheel1 = k.add([
      k.circle(9),
      k.pos(wagon.pos.x + 14, wagon.pos.y + 30),
      k.color(k.rgb(30, 30, 30)),
      k.outline(2, k.rgb(10, 10, 10)),
      k.z(5),
      "wagon-part",
    ]);
    const wheel1Spoke = k.add([
      k.rect(12, 2),
      k.pos(wheel1.pos.x, wheel1.pos.y),
      k.anchor("center"),
      k.color(k.rgb(140, 140, 140)),
      k.rotate(0),
      k.z(6),
      "wagon-part",
    ]);
    const wheel2 = k.add([
      k.circle(9),
      k.pos(wagon.pos.x + 46, wagon.pos.y + 30),
      k.color(k.rgb(30, 30, 30)),
      k.outline(2, k.rgb(10, 10, 10)),
      k.z(5),
      "wagon-part",
    ]);
    const wheel2Spoke = k.add([
      k.rect(12, 2),
      k.pos(wheel2.pos.x, wheel2.pos.y),
      k.anchor("center"),
      k.color(k.rgb(140, 140, 140)),
      k.rotate(0),
      k.z(6),
      "wagon-part",
    ]);
    const passenger = k.add([
      k.sprite("human"),
      k.pos(wagon.pos.x + 16, wagon.pos.y - 40),
      k.z(7),
      "passenger",
      { wagon, currentType: "human" },
    ]);
    wagon.parts = [...parts, wheel1, wheel1Spoke, wheel2, wheel2Spoke, passenger];
    wagon.passengerEntity = passenger;

    let spokeAngle = 0;
    const localOffsets = [
      { x: 0, y: 0 },
      { x: 0, y: -2 },
      { x: 56, y: -2 },
      { x: 4, y: 8 },
      { x: 4, y: 20 },
      { x: 0, y: -3 },
      { x: 14, y: 30 },
      { x: 14, y: 30 },
      { x: 46, y: 30 },
      { x: 46, y: 30 },
      { x: 16, y: -40 },
    ];

    wagon.onUpdate(() => {
      const age = k.time() - wagon.spectralBorn;
      wagon.opacity = Math.min(1, age * 4);

      wagon.move(wagon.speed, 0);
      const dx = wagon.pos.x;
      for (let i = 0; i < localOffsets.length && i < parts.length; i++) {
        parts[i].pos.x = dx + localOffsets[i].x;
        parts[i].pos.y = wagon.pos.y + localOffsets[i].y;
      }
      wheel1.pos.x = dx + 14; wheel1.pos.y = wagon.pos.y + 30;
      wheel2.pos.x = dx + 46; wheel2.pos.y = wagon.pos.y + 30;
      spokeAngle += wagon.speed * 2 * k.dt();
      wheel1Spoke.pos.x = wheel1.pos.x; wheel1Spoke.pos.y = wheel1.pos.y; wheel1Spoke.angle = spokeAngle;
      wheel2Spoke.pos.x = wheel2.pos.x; wheel2Spoke.pos.y = wheel2.pos.y; wheel2Spoke.angle = spokeAngle;
      if (wagon.passengerEntity) {
        wagon.passengerEntity.pos.x = dx + 16;
        wagon.passengerEntity.pos.y = wagon.pos.y - 40;
      }

      // Sparkle doré + halo violet
      if (Math.random() < 0.3 && k.get("particle").length < 245) {
        const useGold = Math.random() < 0.5;
        k.add([
          k.circle(1.5 + Math.random() * 2),
          k.pos(dx + Math.random() * 60, wagon.pos.y + Math.random() * 30),
          k.color(useGold ? k.rgb(255, 220, 60) : k.rgb(180, 80, 255)),
          k.opacity(0.9),
          k.lifespan(0.45, { fade: 0.35 }),
          k.z(5),
          "particle",
          { vx: (Math.random() - 0.5) * 30, vy: -15 - Math.random() * 20 },
        ]);
      }

      // Score +5 par colonne unique traversée
      const curCol = Math.floor((dx + 30) / TILE);
      if (curCol !== wagon.spectralLastCol) {
        wagon.spectralLastCol = curCol;
        gameState.score += 5;
        showPopup(dx + 30, wagon.pos.y - 50, "+5", k.rgb(180, 80, 255), 18);
        checkMilestone();
      }

      // Fin après 10s
      if (age >= 10) {
        for (let i = 0; i < 16; i++) {
          const a = (Math.PI * 2 * i) / 16;
          k.add([
            k.circle(3 + Math.random() * 3),
            k.pos(dx + 30, wagon.pos.y + 10),
            k.color(k.rgb(255, 200 + Math.random() * 55, 30)),
            k.opacity(1),
            k.lifespan(1, { fade: 0.7 }),
            k.z(20),
            "particle-firework",
            { vx: Math.cos(a) * 150, vy: Math.sin(a) * 150, grav: 180 },
          ]);
        }
        showPopup(WIDTH / 2, HEIGHT / 2 - 20, "CONSTELLATION TERMINEE", k.rgb(180, 80, 255), 28);
        window.__spectres?.unlock(24);
        gameState.constellationActive = false;
        wagon.parts.forEach((p) => { if (p.exists()) k.destroy(p); });
        k.destroy(wagon);
      }

      // Hors-écran early exit
      if (wagon.pos.x > WIDTH + 100) {
        gameState.constellationActive = false;
        wagon.parts.forEach((p) => { if (p.exists()) k.destroy(p); });
        k.destroy(wagon);
      }
    });

    // Barre de progression au-dessus du wagon (dessinée en onDraw)
    wagon.onDraw(() => {
      const age2 = k.time() - wagon.spectralBorn;
      const progress = Math.max(0, 1 - age2 / 10);
      const pulse = 0.3 + Math.sin(k.time() * 5) * 0.25;
      k.drawCircle({
        pos: k.vec2(30, 15),
        radius: 50,
        color: k.rgb(140, 40, 220),
        opacity: Math.max(0, pulse),
      });
      k.drawRect({
        pos: k.vec2(-20, -50),
        width: 100,
        height: 4,
        color: k.rgb(60, 20, 80),
        radius: 2,
      });
      k.drawRect({
        pos: k.vec2(-20, -50),
        width: 100 * progress,
        height: 4,
        color: k.rgb(180, 80, 255),
        radius: 2,
      });
      // Mini-fantômes orbitaux
      const t = k.time();
      const GHOST_SPEEDS = [1.2, 1.8, 2.4, 0.9, 1.5, 2.1];
      const GHOST_RADII = [38, 44, 32, 50, 42, 36];
      for (let gi = 0; gi < 6; gi++) {
        const ang = t * GHOST_SPEEDS[gi] + (gi / 6) * Math.PI * 2;
        const gx = 30 + Math.cos(ang) * GHOST_RADII[gi];
        const gy = 15 + Math.sin(ang) * GHOST_RADII[gi] * 0.4;
        k.drawText({
          text: "*",
          pos: k.vec2(gx - 4, gy - 6),
          size: 10,
          color: k.rgb(220, 160, 255),
          opacity: 0.7,
        });
      }
    });

    audio.combo?.();
  }

  function check() {
    if (gameState.constellationActive) return;
    if (k.time() - gameState.lastConstellationAt < 30) return;

    const skels = k.get("visitor").filter((v) => v.isSkeleton && !v._constActive && !v.rider);
    if (skels.length < 5) return;

    const activePair = [...tileMap.values()].find((t) => t.tileType === "portal" && t.pair);
    if (!activePair) return;

    gameState.constellationActive = true;
    gameState.lastConstellationAt = k.time();

    const portalX = activePair.pos.x + TILE / 2;
    const portalY = activePair.pos.y + TILE / 2;
    const sorted = skels.slice().sort((a, b) => {
      const da = Math.hypot(a.pos.x - portalX, a.pos.y - portalY);
      const db = Math.hypot(b.pos.x - portalX, b.pos.y - portalY);
      return da - db;
    });
    const chosen = sorted.slice(0, 5);

    chosen.forEach((v, i) => {
      v._constActive = true;
      v._constStart = k.time();
      v._spiralAngle = (i / 5) * Math.PI * 2;
      v._spiralRadius0 = Math.max(80, Math.hypot(v.pos.x - portalX, v.pos.y - portalY));
      v._constTargetX = portalX;
      v._constTargetY = portalY;
    });

    showPopup(WIDTH / 2, HEIGHT / 2 - 60, "CONSTELLATION SPECTRALE !", k.rgb(180, 80, 255), 32);
    showPopup(WIDTH / 2, HEIGHT / 2 - 20, "WAGON SPECTRAL  +5 par tile", k.rgb(255, 255, 255), 16);
    audio.combo?.();

    const constellationPortalKey = [...tileMap.entries()].find(([, t]) => t === activePair)?.[0];

    k.wait(3.5, () => {
      if (!gameState.constellationActive) return;
      const portalStillExists = constellationPortalKey && tileMap.has(constellationPortalKey);
      if (!portalStillExists) {
        chosen.forEach((v) => { if (v.exists()) v._constActive = false; });
        gameState.constellationActive = false;
        // Keep cooldown — bumping back to 0 would allow immediate re-trigger
        return;
      }

      // Flash plein écran violet (pas k.fixed() — KAPLAY pitfall)
      k.add([
        k.rect(WIDTH, HEIGHT),
        k.pos(0, 0),
        k.color(k.rgb(140, 40, 220)),
        k.opacity(0.75),
        k.lifespan(0.2, { fade: 0.18 }),
        k.z(100),
      ]);

      // 3 ondes concentriques
      for (let w = 0; w < 3; w++) {
        k.wait(w * 0.08, () => {
          k.add([
            k.circle(12 + w * 14),
            k.pos(portalX, portalY),
            k.color(k.rgb(200, 100, 255)),
            k.opacity(0.6),
            k.lifespan(0.5, { fade: 0.4 }),
            k.z(18),
          ]);
        });
      }

      // 32 particules explosion
      for (let pi = 0; pi < 32; pi++) {
        if (k.get("particle").length + pi >= 250) break;
        const a = (Math.PI * 2 * pi) / 32;
        const useGold = pi % 2 === 0;
        k.add([
          k.circle(3 + Math.random() * 3),
          k.pos(portalX, portalY),
          k.color(useGold ? k.rgb(255, 200, 30) : k.rgb(180, 60, 255)),
          k.opacity(1),
          k.lifespan(1.0, { fade: 0.7 }),
          k.z(19),
          "particle-firework",
          { vx: Math.cos(a) * (120 + Math.random() * 80), vy: Math.sin(a) * (120 + Math.random() * 80), grav: 180 },
        ]);
      }

      // Destroy les 5 visitors
      chosen.forEach((v) => { if (v.exists()) { if (v.crown) v.crown.forEach((e) => k.destroy(e)); k.destroy(v); } });

      juice.dirShake(0, 1, 12, 0.25);
      audio.combo?.();

      k.wait(0.1, () => {
        if (!gameState.constellationActive) return;
        const portalStillExists2 = constellationPortalKey && tileMap.has(constellationPortalKey);
        const portalTile2 = portalStillExists2 ? tileMap.get(constellationPortalKey) : null;
        if (!portalTile2) {
          gameState.constellationActive = false;
          gameState.lastConstellationAt = 0;
          return;
        }
        spawnSpectralWagon(portalTile2);
      });
    });
  }

  // Visitor spiral animation: returns true if it consumed the frame
  // (caller should `if (constellation.applyVisitorSpiralUpdate(v)) return;`).
  function applyVisitorSpiralUpdate(v) {
    if (!v._constActive) return false;
    const age = k.time() - v._constStart;
    if (v.vel) v.vel = k.vec2(0, 0);
    if (age < 1) {
      // Phase 1 : aura pulsante — mouvement arrêté, particules violettes
      if (Math.random() < 0.15 && k.get("particle").length < 245) {
        const a = Math.random() * Math.PI * 2;
        const r = 8 + Math.random() * 12;
        k.add([
          k.circle(1.5),
          k.pos(v.pos.x + 14 + Math.cos(a) * r, v.pos.y + 20 + Math.sin(a) * r),
          k.color(k.rgb(180, 80, 255)),
          k.opacity(0.8),
          k.lifespan(0.4, { fade: 0.3 }),
          k.z(9),
          "particle",
          { vx: 0, vy: 0 },
        ]);
      }
    } else if (age < 3) {
      // Phase 2 : spirale vers le portail
      const t2 = (age - 1) / 2;
      const eased = t2 * t2;
      const radius = v._spiralRadius0 * (1 - eased) + 8 * eased;
      v._spiralAngle += 4 * k.dt();
      v.pos.x = v._constTargetX + Math.cos(v._spiralAngle) * radius - 14;
      v.pos.y = v._constTargetY + Math.sin(v._spiralAngle) * radius * 0.5 - 20;
      if (Math.random() < 0.2 && k.get("particle").length < 245) {
        k.add([
          k.circle(1.5),
          k.pos(v.pos.x + 14, v.pos.y + 20),
          k.color(k.rgb(200, 100, 255)),
          k.opacity(0.7),
          k.lifespan(0.3, { fade: 0.25 }),
          k.z(9),
          "particle",
          { vx: 0, vy: 0 },
        ]);
      }
    }
    return true;
  }

  return { check, spawnSpectralWagon, applyVisitorSpiralUpdate };
}
