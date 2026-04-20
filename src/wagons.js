import { TILE, GROUND_ROW, WIDTH, HEIGHT, WAGON_THEMES, gridKey } from "./constants.js";

function hueToRgb(k, h) {
  h = ((h % 360) + 360) % 360;
  const x = 1 - Math.abs(((h / 60) % 2) - 1);
  let r, g, b;
  if (h < 60)       [r, g, b] = [1, x, 0];
  else if (h < 120) [r, g, b] = [x, 1, 0];
  else if (h < 180) [r, g, b] = [0, 1, x];
  else if (h < 240) [r, g, b] = [0, x, 1];
  else if (h < 300) [r, g, b] = [x, 0, 1];
  else               [r, g, b] = [1, 0, x];
  return k.rgb(Math.round(r * 255), Math.round(g * 255), Math.round(b * 255));
}

function getRoyalLevel(plays) {
  if (plays >= 200) return "spectral";
  if (plays >= 100) return "throne";
  if (plays >= 50) return "cape";
  if (plays >= 20) return "crown";
  if (plays >= 10) return "tophat";
  if (plays >= 5) return "hat";
  return "none";
}

export function createWagonSystem({
  k, tileMap, gameState, audio, entityCounts, showPopup, registerKill, registerCoin, launchFirework,
  placeTile, onSkeletonTransform, save,
}) {
  function getRailSlopeYAt(worldX) {
    const col = Math.floor(worldX / TILE);
    const localX = Math.max(0, Math.min(1, (worldX - col * TILE) / TILE));
    for (let r = 0; r < GROUND_ROW; r++) {
      const rt = tileMap.get(gridKey(col, r));
      if (!rt) continue;
      // RAIL_SURFACE = TILE - 10 (=54 for TILE=64), aligned with the visual top
      // of the horizontal rail rect (y = row*TILE + TILE - 10 in tiles.js)
      if (rt.tileType === "rail") {
        return r * TILE + (TILE - 10);
      }
      if (rt.tileType === "rail_up") {
        return r * TILE + (TILE - 10) - localX * TILE;
      }
      if (rt.tileType === "rail_down") {
        return r * TILE - 10 + localX * TILE;
      }
    }
    return null;
  }
  function drawWagonBody(x, y, theme) {
    const body = k.add([
      k.rect(60, 30),
      k.pos(x, y),
      k.rotate(0),
      k.color(k.rgb(theme.body[0], theme.body[1], theme.body[2])),
      k.outline(2, k.rgb(20, 10, 5)),
      k.z(3),
      "wagon-part",
    ]);
    const frontRim = k.add([
      k.rect(4, 34),
      k.pos(x, y - 2),
      k.rotate(0),
      k.color(k.rgb(58, 58, 58)),
      k.outline(1, k.rgb(20, 20, 20)),
      k.z(4),
      "wagon-part",
    ]);
    const backRim = k.add([
      k.rect(4, 34),
      k.pos(x + 56, y - 2),
      k.rotate(0),
      k.color(k.rgb(58, 58, 58)),
      k.outline(1, k.rgb(20, 20, 20)),
      k.z(4),
      "wagon-part",
    ]);
    const plank1 = k.add([
      k.rect(52, 2),
      k.pos(x + 4, y + 8),
      k.rotate(0),
      k.color(k.rgb(theme.dark[0], theme.dark[1], theme.dark[2])),
      k.z(4),
      "wagon-part",
    ]);
    const plank2 = k.add([
      k.rect(52, 2),
      k.pos(x + 4, y + 20),
      k.rotate(0),
      k.color(k.rgb(theme.dark[0], theme.dark[1], theme.dark[2])),
      k.z(4),
      "wagon-part",
    ]);
    const trim = k.add([
      k.rect(60, 3),
      k.pos(x, y - 3),
      k.rotate(0),
      k.color(k.rgb(theme.trim[0], theme.trim[1], theme.trim[2])),
      k.z(4),
      "wagon-part",
    ]);
    return [body, frontRim, backRim, plank1, plank2, trim];
  }

  function drawRoyalOverlay(wagon, level) {
    const decos = [];
    if (level === "none") return decos;

    const wx = wagon.pos.x;
    const wy = wagon.pos.y;

    if (level === "hat") {
      const brim = k.add([
        k.rect(16, 3),
        k.pos(wx + 14, wy - 42),
        k.color(k.rgb(60, 180, 80)),
        k.outline(1, k.rgb(0, 0, 0)),
        k.z(8),
        "wagon-part",
        { royalOffX: 14, royalOffY: -42 },
      ]);
      const cone = k.add([
        k.rect(8, 8),
        k.pos(wx + 18, wy - 50),
        k.color(k.rgb(60, 180, 80)),
        k.outline(1, k.rgb(0, 0, 0)),
        k.z(8),
        "wagon-part",
        { royalOffX: 18, royalOffY: -50 },
      ]);
      decos.push(brim, cone);
    }

    if (level === "tophat") {
      const brim = k.add([
        k.rect(18, 3),
        k.pos(wx + 13, wy - 43),
        k.color(k.rgb(20, 20, 20)),
        k.outline(1, k.rgb(0, 0, 0)),
        k.z(8),
        "wagon-part",
        { royalOffX: 13, royalOffY: -43 },
      ]);
      const cylinder = k.add([
        k.rect(14, 12),
        k.pos(wx + 15, wy - 55),
        k.color(k.rgb(20, 20, 20)),
        k.outline(1, k.rgb(0, 0, 0)),
        k.z(8),
        "wagon-part",
        { royalOffX: 15, royalOffY: -55 },
      ]);
      const band = k.add([
        k.rect(14, 3),
        k.pos(wx + 15, wy - 47),
        k.color(k.rgb(255, 210, 60)),
        k.z(9),
        "wagon-part",
        { royalOffX: 15, royalOffY: -47 },
      ]);
      decos.push(brim, cylinder, band);
    }

    if (level === "crown" || level === "cape" || level === "throne") {
      for (let i = 0; i < 5; i++) {
        const h = 4 + (i % 2) * 4;
        const px = wx + 10 + i * 4;
        const py = wy - 42 - h;
        const tooth = k.add([
          k.rect(3, h),
          k.pos(px, py),
          k.color(k.rgb(255, 215, 60)),
          k.outline(1, k.rgb(180, 130, 0)),
          k.z(8),
          "wagon-part",
          { royalOffX: 10 + i * 4, royalOffY: -42 - h, isCrownTooth: true, toothH: h },
        ]);
        decos.push(tooth);
      }
      const crownBase = k.add([
        k.rect(22, 4),
        k.pos(wx + 10, wy - 42),
        k.color(k.rgb(255, 215, 60)),
        k.outline(1, k.rgb(180, 130, 0)),
        k.z(8),
        "wagon-part",
        { royalOffX: 10, royalOffY: -42 },
      ]);
      decos.push(crownBase);
    }

    if (level === "cape" || level === "throne") {
      const cape = k.add([
        k.rect(20, 26),
        k.pos(wx - 8, wy - 10),
        k.color(k.rgb(180, 30, 30)),
        k.outline(1, k.rgb(80, 0, 0)),
        k.z(2),
        "wagon-part",
        { isCape: true },
      ]);
      decos.push(cape);
    }

    return decos;
  }

  function catapultWagon(wagon) {
    wagon.catapulting = true;
    wagon.catapultAirborne = false;
    if (wagon.vel) {
      wagon.vel.y = -800;
      wagon.vel.x = wagon.speed * 2.5;
    }
    audio.combo();
    audio.boost();
    window.__juice?.dirShake(0, -1, 8, 0.2);
    window.__spectres?.unlock(10);
  }

  function spawnWagon(ghost = false, inverse = false) {
    audio.wagonSpawn();
    const y = (GROUND_ROW - 1) * TILE + 2;
    const startX = inverse ? WIDTH + 80 : 0;
    const baseSpeed = (ghost || inverse) ? 180 : 140;
    const wagon = k.add([
      k.rect(60, 30),
      k.pos(startX, y),
      k.opacity(0),
      k.area({ shape: new k.Rect(k.vec2(0, -10), 60, 50), collisionIgnore: ["wagon"] }),
      k.body(),
      k.anchor("topleft"),
      k.rotate(0),
      k.z(3),
      "wagon",
      {
        passenger: "human",
        speed: (inverse ? -1 : 1) * baseSpeed * (gameState.wagonSpeedMult ?? 1),
        parts: [],
        rider: null,
        ghostTrain: ghost,
        inverseTrain: inverse,
        _tramHits: [],
        _carillonCd: 0,
      },
    ]);

    const isGolden = !ghost && !inverse && Math.random() < 0.07;
    const theme = (ghost || inverse)
      ? { body: [30, 30, 40], dark: [0, 0, 0], trim: [180, 30, 30] }
      : isGolden
      ? { body: [255, 200, 30], dark: [180, 130, 0], trim: [255, 255, 200] }
      : WAGON_THEMES[Math.floor(Math.random() * WAGON_THEMES.length)];
    wagon.theme = theme;
    wagon.isGolden = isGolden;

    const plays = save?.plays || 0;
    wagon.royalLevel = getRoyalLevel(plays);

    if (wagon.royalLevel === "spectral" && !ghost && !inverse) {
      wagon.isSpectral = true;
      wagon.opacity = 0.7;
      wagon.onDraw(() => {
        k.drawCircle({
          pos: k.vec2(30, 15),
          radius: 40 + Math.sin(k.time() * 5) * 5,
          color: k.rgb(140, 60, 220),
          opacity: 0.15 + Math.sin(k.time() * 5) * 0.05,
        });
      });
    }

    if (wagon.royalLevel === "throne" && !ghost && !inverse) {
      wagon.theme = { body: [255, 200, 30], dark: [180, 130, 0], trim: [255, 255, 200] };
    }

    if (isGolden) {
      audio.gold?.();
      showPopup(WIDTH / 2, 180, "WAGON DOR\u00c9 ! 2x points", k.rgb(255, 220, 60), 22);
      // Sparkle aura around wagon every frame
      wagon.onUpdate(() => {
        if (Math.random() < 0.25 && entityCounts.particle < 270) {
          k.add([
            k.circle(1.5),
            k.pos(wagon.pos.x + Math.random() * 60, wagon.pos.y + Math.random() * 30),
            k.color(k.rgb(255, 240, 100)),
            k.opacity(1),
            k.lifespan(0.4, { fade: 0.3 }),
            k.z(5),
            "particle",
            { vx: 0, vy: -20 },
          ]);
        }
      });
    }
    wagon.onDraw(() => {
      if (!(wagon.boostUntil && k.time() < wagon.boostUntil)) return;
      const stack = wagon.boostStack || 1;
      const cols = [k.rgb(255, 210, 60), k.rgb(255, 180, 40), k.rgb(255, 80, 80)];
      const col = cols[Math.min(2, stack - 1)];
      const pulse = 0.3 + Math.sin(k.time() * 8) * 0.2;
      k.drawCircle({
        pos: k.vec2(30, 15),
        radius: 28 + stack * 4,
        color: col,
        opacity: pulse * 0.5,
      });
    });
    const parts = drawWagonBody(wagon.pos.x, wagon.pos.y, wagon.theme);
    if (!ghost && !inverse) {
      const royalDecos = drawRoyalOverlay(wagon, wagon.royalLevel);
      wagon.royalDecos = royalDecos;
    }
    if (ghost || inverse) {
      const eye1 = k.add([
        k.circle(4),
        k.pos(wagon.pos.x + 12, wagon.pos.y + 10),
        k.color(k.rgb(255, 40, 40)),
        k.outline(1, k.rgb(255, 180, 180)),
        k.z(5),
        "wagon-part",
        { off: 12 },
      ]);
      const eye2 = k.add([
        k.circle(4),
        k.pos(wagon.pos.x + 48, wagon.pos.y + 10),
        k.color(k.rgb(255, 40, 40)),
        k.outline(1, k.rgb(255, 180, 180)),
        k.z(5),
        "wagon-part",
        { off: 48 },
      ]);
      parts.push(eye1, eye2);
    }

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

    wagon.passengers = [{ type: "human" }];
    wagon.passengerEntities = [];
    function addPassengerSprite(idx) {
      const px = wagon.pos.x + 6 + idx * 14;
      const py = wagon.pos.y - 40;
      const sprite = k.add([
        k.sprite("human"),
        k.pos(px, py),
        k.z(7),
        "passenger",
        { wagon, idx },
      ]);
      wagon.passengerEntities.push(sprite);
      wagon.parts.push(sprite);
      return sprite;
    }
    addPassengerSprite(0);
    wagon.passengerEntity = wagon.passengerEntities[0];
    wagon.passenger = "human";

    wagon.parts = [...parts, wheel1, wheel1Spoke, wheel2, wheel2Spoke, ...(wagon.royalDecos || [])];

    const localOffsets = [
      { x: 0, y: 0 },    // parts[0] body
      { x: 0, y: -2 },   // parts[1] frontRim
      { x: 56, y: -2 },  // parts[2] backRim
      { x: 4, y: 8 },    // parts[3] plank1
      { x: 4, y: 20 },   // parts[4] plank2
      { x: 0, y: -3 },   // parts[5] trim
      { x: 14, y: 30 },  // wheel1
      { x: 14, y: 30 },  // wheel1Spoke
      { x: 46, y: 30 },  // wheel2
      { x: 46, y: 30 },  // wheel2Spoke
    ];

    wagon.railAngle = 0;
    let spokeAngle = 0;
    let wasOnRail = false;

    wagon.onUpdate(() => {
      if (wagon.inLoop) {
        const loopT = (k.time() - wagon.loopStart) / 0.7;
        if (loopT >= 1) {
          wagon.inLoop = false;
          wagon.angle = 0;
          wagon.pos.x = wagon.loopExitX;
          gameState.score += 50;
          showPopup(wagon.pos.x + 30, wagon.pos.y - 30, "LOOP +50", k.rgb(180, 80, 240), 22);
          audio.combo();
          window.__juice?.dirShake(0, -1, 6, 0.2);
          for (const p of (wagon.passengerEntities || [])) {
            if (p.exists()) p.angle = 0;
          }
          for (const part of wagon.parts || []) {
            if (part?.exists?.() && "angle" in part) part.angle = 0;
          }
        } else {
          const ang = Math.PI + loopT * Math.PI * 2;
          wagon.pos.x = wagon.loopCx + Math.cos(ang) * wagon.loopRx - 30;
          wagon.pos.y = wagon.loopCy + Math.sin(ang) * wagon.loopRy - 15;
          wagon.angle = loopT * 360;
          const r = (wagon.angle * Math.PI / 180);
          const cosR = Math.cos(r), sinR = Math.sin(r);
          const cx = wagon.pos.x + 30;
          const cy = wagon.pos.y + 15;
          // Rotate all body parts + wheels around wagon center for visual cohérence
          for (let i = 0; i < parts.length && i < localOffsets.length; i++) {
            const off = localOffsets[i];
            const ox = off.x - 30;
            const oy = off.y - 15;
            parts[i].pos.x = cx + (ox * cosR - oy * sinR);
            parts[i].pos.y = cy + (ox * sinR + oy * cosR);
            if ("angle" in parts[i]) parts[i].angle = wagon.angle;
          }
          // Wheels + spokes (last 4 entries in wagon.parts, indices 6..9 of localOffsets)
          for (const [w, lo] of [[wheel1, localOffsets[6]], [wheel1Spoke, localOffsets[7]], [wheel2, localOffsets[8]], [wheel2Spoke, localOffsets[9]]]) {
            if (!w?.exists?.()) continue;
            const ox = lo.x - 30;
            const oy = lo.y - 15;
            w.pos.x = cx + (ox * cosR - oy * sinR);
            w.pos.y = cy + (ox * sinR + oy * cosR);
          }
          // Spokes spin extra during loop for that whirl feel
          spokeAngle += 720 * k.dt();
          if (wheel1Spoke?.exists?.()) wheel1Spoke.angle = wagon.angle + spokeAngle;
          if (wheel2Spoke?.exists?.()) wheel2Spoke.angle = wagon.angle + spokeAngle;
          // Royal decos follow rotation
          if (wagon.royalDecos) {
            for (const d of wagon.royalDecos) {
              if (!d.exists()) continue;
              const ox = (d.royalOffX || 0) - 30;
              const oy = (d.royalOffY || 0) - 15;
              d.pos.x = cx + (ox * cosR - oy * sinR);
              d.pos.y = cy + (ox * sinR + oy * cosR);
              if ("angle" in d) d.angle = wagon.angle;
            }
          }
          for (let i = 0; i < (wagon.passengerEntities || []).length; i++) {
            const p = wagon.passengerEntities[i];
            if (!p?.exists()) continue;
            p.angle = wagon.angle;
            const offX = 6 + i * 14 - 30;
            const offY = -40;
            p.pos.x = cx + (offX * cosR - offY * sinR);
            p.pos.y = cy + (offX * sinR + offY * cosR);
          }
          if (wagon.vel) wagon.vel.y = 0;
          if (entityCounts.particle < 240 && Math.random() < 0.4) {
            const hue = (loopT * 360) % 360;
            const loopCol = hueToRgb(k, hue);
            k.add([
              k.rect(4, 4),
              k.pos(wagon.pos.x + 30, wagon.pos.y + 15),
              k.color(loopCol),
              k.opacity(0.85),
              k.lifespan(0.5, { fade: 0.35 }),
              k.z(4),
              "particle",
              { vx: 0, vy: 0 },
            ]);
          }
        }
        return;
      }

      const boosted = wagon.boostUntil && k.time() < wagon.boostUntil;
      const iced = wagon.iceUntil && k.time() < wagon.iceUntil;
      const sliding = wagon.slideUntil && k.time() < wagon.slideUntil;
      if (boosted && wagon.boostStackUntil && k.time() > wagon.boostStackUntil) wagon.boostStack = 0;
      let speedMult = 1;
      if (boosted) {
        const stack = wagon.boostStack || 1;
        speedMult = stack === 1 ? 2.2 : stack === 2 ? 3.0 : 4.5;
      } else if (sliding) speedMult = 3;
      else if (iced) speedMult = 1.6;
      for (const cr of gameState.iceCrowns || []) {
        const d = Math.hypot(wagon.pos.x + 30 - cr.cx, wagon.pos.y + 15 - cr.cy);
        if (d < cr.radius) {
          // Slow zone retiré (le user trouvait que ça ressemblait à du bullet time)
          // speedMult *= 0.3;
          if (Math.random() < 0.4 && entityCounts.particle < 240) {
            k.add([
              k.rect(3, 3),
              k.pos(wagon.pos.x + 30, wagon.pos.y + 15 + Math.random() * 10),
              k.color(k.rgb(160, 220, 255)),
              k.opacity(0.85),
              k.lifespan(0.5, { fade: 0.35 }),
              k.z(4),
              "particle",
              { vx: -10, vy: -5 },
            ]);
          }
          break;
        }
      }
      if (wagon.rider && wagon._riderInput && !wagon._inTunnel && !wagon.inLoop && !wagon.isSpectral) {
        if (wagon._riderInput === "right") {
          speedMult *= 1.5;
        } else if (wagon._riderInput === "left") {
          speedMult *= -0.5;
        }
        wagon._riderInput = null;
      }
      const currentSpeed = wagon.speed * speedMult;
      wagon.move(currentSpeed, 0);

      // Track speed states for spectres id 4 (slow 10s) / id 5 (fast 10s)
      if (speedMult <= 0.6) {
        wagon._slowAccum = (wagon._slowAccum || 0) + k.dt();
        wagon._fastAccum = 0;
        if (wagon._slowAccum >= 10) gameState.onSlowMilestone?.();
      } else if (speedMult >= 1.8) {
        wagon._fastAccum = (wagon._fastAccum || 0) + k.dt();
        wagon._slowAccum = 0;
        if (wagon._fastAccum >= 10) gameState.onFastMilestone?.();
      } else {
        wagon._slowAccum = 0;
        wagon._fastAccum = 0;
      }

      // Boost trail: orange sparks behind wagon when boosted
      if (boosted && Math.random() < 0.45 && entityCounts.particle < 280) {
        const ang = Math.PI + (Math.random() - 0.5) * 0.6;
        const sp = 80 + Math.random() * 60;
        k.add([
          k.rect(3 + Math.random() * 2, 3 + Math.random() * 2),
          k.pos(wagon.pos.x + 2, wagon.pos.y + 30 + Math.random() * 4),
          k.color(k.rgb(255, 160 + Math.random() * 60, 40)),
          k.opacity(0.95),
          k.lifespan(0.5, { fade: 0.35 }),
          k.z(2),
          "particle",
          { vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp - 30 },
        ]);
      }

      // Toboggan: detect rail_down ending in cliff (no rail/ground in next col)
      if (!wagon.slideUntil && !wagon.slideTriggered) {
        const wCol = Math.floor((wagon.pos.x + 30) / TILE);
        const wRow = Math.floor((wagon.pos.y + 30) / TILE);
        const railTile = tileMap.get(gridKey(wCol, wRow));
        if (railTile && railTile.tileType === "rail_down") {
          const nextAny = tileMap.get(gridKey(wCol + 1, wRow + 1))
            || tileMap.get(gridKey(wCol + 1, wRow))
            || tileMap.get(gridKey(wCol + 1, wRow - 1));
          if (!nextAny) {
            wagon.slideUntil = k.time() + 1.2;
            wagon.slideTriggered = true;
            wagon._wasAirborne = false;
          }
        }
      }

      // Slide fire trail
      if (sliding && entityCounts.particle < 240 && Math.random() < 0.6) {
        const FIRE = [k.rgb(255, 80, 30), k.rgb(255, 180, 40), k.rgb(255, 220, 60)];
        k.add([
          k.rect(3 + Math.random() * 3, 3 + Math.random() * 3),
          k.pos(wagon.pos.x + Math.random() * 60, wagon.pos.y + 30 + Math.random() * 5),
          k.color(FIRE[Math.floor(Math.random() * FIRE.length)]),
          k.opacity(0.9),
          k.lifespan(0.4, { fade: 0.3 }),
          k.z(4),
          "particle",
          { vx: -50 - Math.random() * 50, vy: -10 - Math.random() * 30 },
        ]);
      }

      // Toboggan landing detection
      if (wagon.slideTriggered) {
        const isAirborne = !wagon.isGrounded();
        if (isAirborne) wagon._wasAirborne = true;
        if (!isAirborne && wagon._wasAirborne) {
          const landCol = Math.floor((wagon.pos.x + 30) / TILE);
          const landRow = Math.floor((wagon.pos.y + 35) / TILE) + 1;
          for (let dc = -1; dc <= 1; dc++) {
            placeTile(landCol + dc, landRow, "lava");
            const lavaTile = tileMap.get(gridKey(landCol + dc, landRow));
            if (lavaTile) lavaTile.temporary = k.time() + 4;
          }
          gameState.score += 30;
          showPopup(wagon.pos.x + 30, wagon.pos.y - 30, "TOBOGGAN ! +30", k.rgb(255, 100, 30), 24);
          audio.combo();
          window.__juice?.dirShake(0, 1, 12, 0.25);
          wagon.slideTriggered = false;
          wagon.slideUntil = null;
          wagon._wasAirborne = false;
        }
      }

      // Color trail when going fast (boosted/iced/looping)
      if ((boosted || iced || wagon.looping) && Math.random() < 0.3 && entityCounts.particle < 260) {
        k.add([
          k.rect(36, 18),
          k.pos(wagon.pos.x + 12, wagon.pos.y + 4),
          k.color(k.rgb(wagon.theme.body[0], wagon.theme.body[1], wagon.theme.body[2])),
          k.opacity(0.5),
          k.lifespan(0.3, { fade: 0.25 }),
          k.z(2),
          "particle",
          { vx: 0, vy: 0 },
        ]);
      }

      const wBaseX = wagon.pos.x;
      const candidates = [
        getRailSlopeYAt(wBaseX + 10),
        getRailSlopeYAt(wBaseX + 30),
        getRailSlopeYAt(wBaseX + 50),
      ].filter((v) => v !== null);
      const onRail = candidates.length > 0;
      if (onRail) {
        const slopeY = Math.min(...candidates);
        const targetY = slopeY - 30;
        const dy = targetY - wagon.pos.y;
        // Augmented threshold (40 → handle high-speed climb on diag rails)
        // and stronger snap rate (0.6 → keep up with boosted wagons)
        if (Math.abs(dy) < 50) {
          if (Math.abs(dy) > 16) {
            wagon.pos.y = targetY;
          } else {
            wagon.pos.y += dy * 0.6;
          }
          if (wagon.vel) wagon.vel.y = 0;
        }
      } else if (wasOnRail) {
        const groundY = GROUND_ROW * TILE;
        if (wagon.pos.y + 30 < groundY && wagon.vel) {
          wagon.vel.y = 50;
        }
      }
      wasOnRail = onRail;

      if (gameState.magnetFields && gameState.magnetFields.length > 0) {
        for (const f of gameState.magnetFields) {
          const minX = Math.min(f.a.gridCol, f.b.gridCol) * TILE;
          const maxX = Math.max(f.a.gridCol, f.b.gridCol) * TILE + TILE;
          const fieldY = f.a.gridRow * TILE + TILE / 2;
          if (wagon.pos.x + 30 > minX && wagon.pos.x + 30 < maxX && Math.abs(wagon.pos.y + 30 - fieldY) < 60) {
            wagon.pos.y += Math.sin(wagon.pos.x * 0.05) * 0.5;
          }
        }
      }

      if (inverse && Math.random() < 0.5) {
        k.add([
          k.circle(4 + Math.random() * 5),
          k.pos(wagon.pos.x + 60 + Math.random() * 10, wagon.pos.y + 5 + Math.random() * 20),
          k.color(k.rgb(140 + Math.floor(Math.random() * 60), 30 + Math.floor(Math.random() * 40), 200 + Math.floor(Math.random() * 55))),
          k.opacity(0.75),
          k.lifespan(0.7, { fade: 0.5 }),
          k.z(2),
          "particle-x",
          { vx: 30 + Math.random() * 50 },
        ]);
      }
      if (boosted && Math.random() < 0.6) {
        k.add([
          k.circle(2 + Math.random() * 3),
          k.pos(wagon.pos.x - 4, wagon.pos.y + 8 + Math.random() * 20),
          k.color(k.rgb(255, 180 + Math.random() * 60, 40)),
          k.opacity(0.9),
          k.lifespan(0.35, { fade: 0.2 }),
          k.z(2),
          "particle-x",
          { vx: -50 - Math.random() * 60 },
        ]);
      }
      const dx = wagon.pos.x;
      const sy0 = getRailSlopeYAt(dx + 30);
      const sy1 = getRailSlopeYAt(dx + 31);
      const targetAngle = (sy0 !== null && sy1 !== null)
        ? Math.atan2(sy1 - sy0, 1) * (180 / Math.PI)
        : 0;
      wagon.railAngle += (targetAngle - wagon.railAngle) * 0.25;
      const sinA = Math.sin(wagon.railAngle * Math.PI / 180);

      for (let i = 0; i < localOffsets.length && i < parts.length; i++) {
        parts[i].pos.x = dx + localOffsets[i].x;
        parts[i].pos.y = wagon.pos.y + localOffsets[i].y + sinA * (localOffsets[i].x - 30);
      }
      if ((ghost || inverse) && parts[6] && parts[6].off !== undefined) {
        parts[6].pos.x = dx + parts[6].off;
        parts[6].pos.y = wagon.pos.y + 10 + sinA * (parts[6].off - 30);
      }
      if ((ghost || inverse) && parts[7] && parts[7].off !== undefined) {
        parts[7].pos.x = dx + parts[7].off;
        parts[7].pos.y = wagon.pos.y + 10 + sinA * (parts[7].off - 30);
      }

      wheel1.pos.x = dx + 14;
      wheel1.pos.y = wagon.pos.y + 30 + sinA * (14 - 30);
      wheel2.pos.x = dx + 46;
      wheel2.pos.y = wagon.pos.y + 30 + sinA * (46 - 30);
      spokeAngle += wagon.speed * 2 * k.dt();
      wheel1Spoke.pos.x = wheel1.pos.x;
      wheel1Spoke.pos.y = wheel1.pos.y;
      wheel1Spoke.angle = spokeAngle;
      wheel2Spoke.pos.x = wheel2.pos.x;
      wheel2Spoke.pos.y = wheel2.pos.y;
      wheel2Spoke.angle = spokeAngle;

      for (let i = 0; i < wagon.passengerEntities.length; i++) {
        const ent = wagon.passengerEntities[i];
        if (!ent.exists()) continue;
        ent.pos.x = wagon.pos.x + 6 + i * 14;
        ent.pos.y = wagon.pos.y - 40 + sinA * (6 + i * 14 - 30);
      }
      if (wagon.passengerEntity?.exists()) {
        wagon.passengerEntity.pos.x = wagon.pos.x + 6;
        wagon.passengerEntity.pos.y = wagon.pos.y - 40 + sinA * (6 - 30);
      }

      if (wagon.rider) {
        wagon.rider.pos.x = dx + 16;
        wagon.rider.pos.y = wagon.pos.y - 44 + sinA * (16 - 30);
      }

      if (wagon.royalDecos) {
        for (const d of wagon.royalDecos) {
          if (!d.exists()) continue;
          if (d.isCape) {
            d.pos.x = dx - 8 + Math.sin(k.time() * 6) * 2;
            d.pos.y = wagon.pos.y - 10;
          } else {
            d.pos.x = dx + (d.royalOffX || 0);
            d.pos.y = wagon.pos.y + (d.royalOffY || 0) + sinA * ((d.royalOffX || 0) - 30);
          }
        }
      }

      if (wagon.isGrounded() && Math.random() < 0.12) {
        k.add([
          k.circle(1.5 + Math.random() * 1.5),
          k.pos(dx + 6 + Math.random() * 48, wagon.pos.y + 34 + Math.random() * 2),
          k.color(180, 160, 120),
          k.opacity(0.7),
          k.lifespan(0.3, { fade: 0.2 }),
          k.z(2),
          "particle",
          { vx: -20 - Math.random() * 30, vy: -15 - Math.random() * 15 },
        ]);
      }
      if (!wagon.isGrounded() && Math.random() < 0.18) {
        k.add([
          k.circle(1 + Math.random()),
          k.pos(dx + 10 + Math.random() * 40, wagon.pos.y + 32),
          k.color(255, 220, 100),
          k.opacity(0.9),
          k.lifespan(0.2, { fade: 0.15 }),
          k.z(2),
        ]);
      }

      if (wagon.catapulting) {
        if (!wagon.isGrounded()) {
          const SPARK_COLORS = [k.rgb(255, 60, 30), k.rgb(255, 200, 40), k.rgb(255, 120, 20)];
          k.add([
            k.circle(2 + Math.random() * 3),
            k.pos(dx + 10 + Math.random() * 40, wagon.pos.y + 20 + Math.random() * 10),
            k.color(SPARK_COLORS[Math.floor(Math.random() * SPARK_COLORS.length)]),
            k.opacity(0.95),
            k.lifespan(0.5, { fade: 0.3 }),
            k.z(13),
            "particle",
            { vx: (Math.random() - 0.5) * 60, vy: 20 + Math.random() * 40 },
          ]);
        } else if (wagon.catapultAirborne) {
          wagon.catapulting = false;
          wagon.catapultAirborne = false;
          window.__juice?.dirShake(0, 1, 12, 0.2);
          audio.transform();
          showPopup(dx + 30, wagon.pos.y - 50, "CATAPULTE !", k.rgb(255, 100, 30), 32);
          for (let i = 0; i < 16; i++) {
            const a = (Math.PI * i) / 16;
            k.add([
              k.circle(2 + Math.random() * 3),
              k.pos(dx + 30, wagon.pos.y + 30),
              k.color(k.rgb(220 + Math.random() * 35, 160 + Math.random() * 60, 80)),
              k.opacity(1),
              k.lifespan(0.8, { fade: 0.5 }),
              k.z(14),
              "particle-grav",
              {
                vx: Math.cos(a) * (80 + Math.random() * 60) * (Math.random() < 0.5 ? 1 : -1),
                vy: -60 - Math.random() * 80,
                grav: 180,
              },
            ]);
          }
        }
        if (!wagon.isGrounded()) wagon.catapultAirborne = true;
      }

      // Cascade combo: wagon dans une water tile cascade active
      {
        const wCol = Math.floor((wagon.pos.x + 30) / TILE);
        const wRow = Math.floor((wagon.pos.y + 15) / TILE);
        const wTile = tileMap.get(gridKey(wCol, wRow));
        if (wTile?.tileType === "water" && wTile.cascadeActive) {
          const cascadeKey = gridKey(wCol, wRow);
          if (!wagon._cascadedKey || wagon._cascadedKey !== cascadeKey) {
            wagon._cascadedKey = cascadeKey;
            gameState.comboCount = Math.min(5, gameState.comboCount + 1);
            gameState.comboExpire = k.time() + 2;
            audio.combo();
          }
        } else {
          wagon._cascadedKey = null;
        }
      }

      // Geyser combo: wagon dans la colonne fan+water -> pousse vers le haut
      {
        const wCol = Math.floor((wagon.pos.x + 30) / TILE);
        for (const g of gameState.geysers || []) {
          if (g.col === wCol) {
            const wRow = Math.floor((wagon.pos.y + 15) / TILE);
            if (wRow >= g.fanRow - 3 && wRow <= g.row) {
              if (wagon.vel) wagon.vel.y = -300;
            }
          }
        }
      }

      // Ice rink: 3+ ice horizontaux → glide momentum bonus
      {
        const wCol = Math.floor((wagon.pos.x + 30) / TILE);
        for (const r of gameState.iceRinks || []) {
          if (wCol >= r.startCol && wCol < r.startCol + r.len && r.row === Math.floor((wagon.pos.y + 40) / TILE)) {
            wagon.glideUntil = k.time() + 0.8;
            wagon.glideBonus = (r.len - 2) * 30;
            break;
          }
        }
        if (wagon.glideUntil > k.time()) {
          wagon.move(wagon.glideBonus, 0);
          if (Math.random() < 0.4) {
            k.add([
              k.rect(8, 2),
              k.pos(wagon.pos.x + 8 + Math.random() * 40, wagon.pos.y + 32),
              k.color(k.rgb(220, 240, 255)),
              k.opacity(0.7),
              k.lifespan(0.3, { fade: 0.2 }),
              k.z(2),
              "particle",
            ]);
          }
        }
      }

      // Téléport magnétique: portail adjacent à un magnet attire les wagons (vortex)
      {
        for (const mp of gameState.magnetPortals || []) {
          const dx = (mp.x + TILE / 2) - (wagon.pos.x + 30);
          const dy = (mp.y + TILE / 2) - (wagon.pos.y + 15);
          const dist = Math.hypot(dx, dy);
          const range = 3 * TILE;
          if (dist < range && dist > TILE * 0.4) {
            const force = (1 - dist / range) * 320;
            const nx = dx / dist;
            const ny = dy / dist;
            wagon.move(nx * force * k.dt(), ny * force * k.dt());
            if (Math.random() < 0.18 && entityCounts.particle < 280) {
              const ang = Math.random() * Math.PI * 2;
              k.add([
                k.rect(3, 3),
                k.pos(wagon.pos.x + 30 + Math.cos(ang) * 18, wagon.pos.y + 15 + Math.sin(ang) * 18),
                k.color(k.rgb(180, 80, 240)),
                k.opacity(0.9),
                k.lifespan(0.45, { fade: 0.3 }),
                k.z(4),
                "particle",
                { vx: Math.cos(ang + Math.PI / 2) * 30, vy: Math.sin(ang + Math.PI / 2) * 30 },
              ]);
            }
          }
        }
      }

      // Métronome Infernal: 2 boosts verticaux (gap 3, lava entre) traversés top→bottom en <0.8s
      {
        const wCol = Math.floor((wagon.pos.x + 30) / TILE);
        const wRow = Math.floor((wagon.pos.y + 30) / TILE);
        for (const m of gameState.metronomes || []) {
          if (m.col !== wCol) continue;
          if (wRow === m.topRow && !wagon._metroEntry) {
            wagon._metroEntry = k.time();
            wagon._metroCol = m.col;
          } else if (wRow === m.bottomRow && wagon._metroEntry && k.time() - wagon._metroEntry < 0.8) {
            wagon._metroEntry = null;
            gameState.scoreMultiplier = 2;
            gameState.scoreMultiplierUntil = k.time() + 3;
            for (const w of k.get("wagon")) {
              w.boostUntil = Math.max(w.boostUntil || 0, k.time() + 3);
            }
            for (let i = 0; i < 4; i++) {
              k.wait(i * 0.083, () => {
                window.__juice?.dirShake(0, 1, 6, 0.08);
                audio.combo();
              });
            }
            showPopup(WIDTH / 2, HEIGHT / 2 - 80, "METRONOME INFERNAL ! x2 3s", k.rgb(255, 80, 80), 24);
          } else if (wRow > m.bottomRow + 1) {
            wagon._metroEntry = null;
          }
        }
      }

      // Loop-the-loop detection: track distinct rail tiles visited
      {
        const wCol = Math.floor((wagon.pos.x + 30) / TILE);
        const wRow = Math.floor((wagon.pos.y + 30) / TILE);
        const railTile = tileMap.get(gridKey(wCol, wRow));
        const isOnRailTile = railTile && (
          railTile.tileType === "rail" ||
          railTile.tileType === "rail_up" ||
          railTile.tileType === "rail_down"
        );

        if (isOnRailTile) {
          wagon._loopOffRailSince = null;
          if (!wagon._loopVisited) wagon._loopVisited = [];
          const tileKey = `${wCol},${wRow}`;

          if (!wagon.looping) {
            const visitedSet = wagon._loopVisitedSet || (wagon._loopVisitedSet = new Set());
            const alreadySeen = visitedSet.has(tileKey);
            if (!alreadySeen) {
              visitedSet.add(tileKey);
              wagon._loopVisited.push(tileKey);
            } else if (wagon._loopVisited.length >= 6) {
              wagon.looping = true;
              wagon.loopCount = 0;
              wagon._loopStartTile = tileKey;
              wagon._loopLapKey = null;
              wagon.speed *= 1.3;
              audio.combo();
              window.__juice?.dirShake(0, -1, 5, 0.15);
            }
          } else {
            if (!wagon._loopLapKey) {
              wagon._loopLapKey = tileKey;
            } else if (tileKey === wagon._loopLapKey && wagon._loopLapPassed) {
              wagon._loopLapPassed = false;
              wagon.loopCount += 1;
              const pts = 20;
              gameState.score += pts;
              showPopup(wagon.pos.x + 30, wagon.pos.y - 50, `LOOP x${wagon.loopCount}`, k.rgb(255, 80, 220), 36);
              audio.combo();
              window.__juice?.dirShake(0, -1, 6, 0.15);
              window.__quests?.onLoop();
              if (wagon.loopCount >= 3) {
                window.__spectres?.unlock(16);
                wagon.looping = false;
                wagon.speed /= 1.3;
                wagon._loopVisited = [];
                wagon._loopVisitedSet = new Set();
                wagon._loopLapKey = null;
                wagon._loopLapPassed = false;
              }
            } else if (tileKey !== wagon._loopLapKey) {
              wagon._loopLapPassed = true;
            }

            if (wagon.looping && Math.random() < 0.5) {
              const hue = (k.time() * 200) % 360;
              const col = hueToRgb(k, hue);
              k.add([
                k.circle(2 + Math.random() * 2),
                k.pos(wagon.pos.x + Math.random() * 60, wagon.pos.y + 28 + Math.random() * 6),
                k.color(col),
                k.opacity(0.9),
                k.lifespan(0.5, { fade: 0.35 }),
                k.z(2),
                "particle",
              ]);
            }
          }
        } else {
          if (wagon.looping) {
            wagon.looping = false;
            wagon.speed /= 1.3;
            wagon._loopVisited = [];
            wagon._loopVisitedSet = new Set();
            wagon._loopLapKey = null;
            wagon._loopLapPassed = false;
          }
          if (!wagon._loopOffRailSince) wagon._loopOffRailSince = k.time();
          else if (k.time() - wagon._loopOffRailSince > 1.0) {
            wagon._loopVisited = [];
            wagon._loopVisitedSet = new Set();
            wagon._loopOffRailSince = null;
          }
        }
      }

      const outOfBounds = wagon.inverseTrain
        ? wagon.pos.x < -80
        : wagon.pos.x > WIDTH + 80;
      if (outOfBounds && wagon.isRace) return;
      if (outOfBounds) {
        if (wagon.rider) exitWagon(wagon.rider);
        const anyHuman = wagon.passengers.some((p) => p.type === "human");
        if (anyHuman && !wagon.ghostTrain && !wagon.inverseTrain) {
          gameState.missed = (gameState.missed || 0) + 1;
          showPopup(
            WIDTH - 120,
            HEIGHT / 2 - 40,
            "RATE !",
            k.rgb(255, 70, 70),
            40,
          );
          audio.splash();
        }
        // Détruit toutes les parts + passengerEntities (multi-passagers)
        wagon.parts?.forEach((p) => { if (p.exists()) k.destroy(p); });
        wagon.passengerEntities?.forEach((p) => { if (p.exists()) k.destroy(p); });
        if (wagon.passengerEntity?.exists()) k.destroy(wagon.passengerEntity);
        k.destroy(wagon);
      }
    });

    wagon.onCollide("lava", () => {
      if (wagon.invincible) return;
      if (wagon.isSpectral) return;
      const hasHuman = wagon.passengers.some((p) => p.type === "human");
      if (hasHuman || wagon.inverseTrain) {
        window.__juice?.hitStop(80);
        transformToSkeleton(wagon);
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
          window.__spectres?.unlock(15);
        });
      }
    });

    wagon.onCollide("ice", () => {
      const iceBase = Math.max(wagon.iceUntil || 0, k.time());
      wagon.iceUntil = Math.min(iceBase + 0.35, k.time() + 2);
      if (Math.random() < 0.5) {
        const sparkle = k.add([
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
      const savedVelY = wagon.vel ? wagon.vel.y : 0;
      wagon.pos.x = p.pair.pos.x - 30;
      wagon.pos.y = p.pair.pos.y - 30;
      if (wagon.vel) {
        wagon.vel.x = savedVelX;
        wagon.vel.y = savedVelY;
      }
      p.cooldownUntil = k.time() + 0.5;
      p.pair.cooldownUntil = k.time() + 0.5;
      gameState.portalUses = (gameState.portalUses || 0) + 1;
      if (gameState.portalUses >= 5) window.__spectres?.unlock(3);
      window.__tiers?.onPortalUse?.();
      window.__quests?.onPortal();
      audio.combo();
      window.__juice?.dirShake(1, 0, 3, 0.12);
      for (let i = 0; i < 14; i++) {
        const a = (Math.PI * 2 * i) / 14;
        const col = p.color;
        k.add([
          k.circle(3 + Math.random() * 2),
          k.pos(p.pair.pos.x, p.pair.pos.y),
          k.color(col),
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
      if (gameState.trampolinesThisGame >= 10) window.__spectres?.unlock(0);
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
      wagon.loopExitX = loopTile.exitX;
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

  function collectCoin(c) {
    audio.coin();
    const cx = c.pos.x;
    const cy = c.pos.y;
    if (c.extras) c.extras.forEach((e) => k.destroy(e));
    const key = gridKey(c.gridCol, c.gridRow);
    tileMap.delete(key);
    k.destroy(c);
    gameState.coins += 1;
    registerCoin(cx, cy);
    for (let i = 0; i < 10; i++) {
      const angle = (Math.PI * 2 * i) / 10;
      k.add([
        k.rect(3, 3),
        k.pos(cx, cy),
        k.color(k.rgb(255, 230, 80)),
        k.opacity(1),
        k.lifespan(0.5, { fade: 0.3 }),
        k.z(15),
        "particle-grav",
        {
          vx: Math.cos(angle) * 120,
          vy: Math.sin(angle) * 120 - 40,
          grav: 250,
        },
      ]);
    }
  }

  function reviveFromSkeleton(wagon) {
    audio.splash();
    const cx = wagon.pos.x + 30;
    const cy = wagon.pos.y - 10;
    for (let i = 0; i < 20; i++) {
      const angle = (Math.PI * 2 * i) / 20;
      const r = 40 + Math.random() * 30;
      k.add([
        k.circle(3 + Math.random() * 3),
        k.pos(cx, cy),
        k.color(k.rgb(90 + Math.random() * 100, 180, 230)),
        k.opacity(1),
        k.lifespan(0.8, { fade: 0.5 }),
        k.z(14),
        "particle-grav",
        {
          vx: Math.cos(angle) * r,
          vy: Math.sin(angle) * r - 60,
          grav: 200,
        },
      ]);
    }
    k.wait(0.05, () => {
      if (!wagon.exists()) return;
      for (let i = 0; i < wagon.passengers.length; i++) {
        if (wagon.passengers[i].type === "skeleton") {
          wagon.passengers[i].type = "human";
          const ent = wagon.passengerEntities[i];
          if (ent?.exists()) ent.sprite = "human";
        }
      }
      wagon.passenger = "human";
      if (wagon.rider?.isSkeleton) {
        wagon.rider.isSkeleton = false;
        wagon.rider.sprite = wagon.rider.normalSprite;
        if (wagon.passengerEntity?.exists()) {
          wagon.passengerEntity.sprite = wagon.rider.normalSprite;
        }
      }
      window.__tiers?.onRevive?.();
    });
  }

  function triggerCarillon(wagon) {
    if (wagon._carillonCd > k.time()) return;
    wagon._carillonCd = k.time() + 5;
    audio.bell?.();

    k.add([
      k.rect(WIDTH, HEIGHT),
      k.pos(0, 0),
      k.color(k.rgb(255, 255, 255)),
      k.opacity(0.7),
      k.lifespan(0.2, { fade: 0.18 }),
      k.z(50),
    ]);

    const cx = wagon.pos.x + 30;
    const cy = wagon.pos.y + 15;
    for (let w = 0; w < 4; w++) {
      k.wait(w * 0.07, () => {
        k.add([
          k.circle(20 + w * 10),
          k.pos(cx, cy),
          k.color(k.rgb(255, 255, 220)),
          k.opacity(0.7),
          k.lifespan(0.5, { fade: 0.4 }),
          k.z(15),
          "particle-firework",
        ]);
      });
    }

    let count = 0;
    for (const w2 of k.get("wagon")) {
      if (w2 === wagon) continue;
      const d = Math.hypot(w2.pos.x + 30 - cx, w2.pos.y + 15 - cy);
      if (d < 256 && w2.passengers.some((p) => p.type === "human")) {
        transformToSkeleton(w2);
        count++;
      }
    }
    showPopup(cx, cy - 40, `CARILLON ! ${count > 0 ? count + " ames" : ""}`, k.rgb(255, 255, 220), 26);
    window.__juice?.dirShake(0, 1, 14, 0.3);
  }

  function transformToSkeleton(wagon) {
    if (!wagon.exists()) return;
    let humansCount = 0;
    for (let i = 0; i < wagon.passengers.length; i++) {
      if (wagon.passengers[i].type === "human") {
        wagon.passengers[i].type = "skeleton";
        const ent = wagon.passengerEntities[i];
        if (ent?.exists()) ent.sprite = "skeleton";
        humansCount++;
      }
    }
    if (humansCount === 0 && !wagon.inverseTrain) return;
    wagon.passenger = "skeleton";
    window.__juice?.hitStop(120);
    window.__juice?.dirShake(wagon.vel?.x || 1, 0, 6, 0.2);
    gameState.skeletons += humansCount;
    audio.transform();
    if (onSkeletonTransform) onSkeletonTransform();
    const dark = wagon.darkPassenger || 0;
    if (wagon.inverseTrain) {
      gameState.score += 500;
      showPopup(wagon.pos.x + 30, wagon.pos.y - 50, "+500 INVERSE!", k.rgb(160, 60, 220), 36);
      for (let i = 0; i < 24; i++) {
        const a = (Math.PI * 2 * i) / 24;
        k.add([
          k.circle(5 + Math.random() * 5),
          k.pos(wagon.pos.x + 30, wagon.pos.y + 10),
          k.color(k.rgb(
            140 + Math.floor(Math.random() * 80),
            30 + Math.floor(Math.random() * 40),
            200 + Math.floor(Math.random() * 55),
          )),
          k.opacity(1),
          k.lifespan(1.4, { fade: 0.9 }),
          k.z(15),
          "particle",
          { vx: Math.cos(a) * 220, vy: Math.sin(a) * 220 },
        ]);
      }
    } else {
      let base = wagon.ghostTrain ? 100 : 10;
      if (wagon.isGolden) base *= 2;
      base *= humansCount;
      registerKill(wagon.pos.x + 30, wagon.pos.y, base, wagon.ghostTrain || wagon.isGolden, dark);
    }
    if (dark > 0) wagon.darkPassenger = 0;
    if (wagon.ghostTrain) {
      for (let i = 0; i < 20; i++) {
        const a = (Math.PI * 2 * i) / 20;
        k.add([
          k.circle(4 + Math.random() * 4),
          k.pos(wagon.pos.x + 30, wagon.pos.y + 10),
          k.color(k.rgb(180, 100, 255)),
          k.opacity(1),
          k.lifespan(1.2, { fade: 0.8 }),
          k.z(15),
          "particle",
          { vx: Math.cos(a) * 200, vy: Math.sin(a) * 200 },
        ]);
      }
    }

    const savedSpeed = wagon.speed;
    wagon.speed = 0;
    k.wait(0.12, () => {
      if (wagon.exists()) wagon.speed = savedSpeed;
    });

    for (let i = 0; i < 3; i++) {
      k.wait(i * 0.05, () => {
        k.add([
          k.circle(20 + i * 20),
          k.pos(wagon.pos.x + 30, wagon.pos.y + 10),
          k.color(k.rgb(255, 200, 80)),
          k.opacity(0.5),
          k.lifespan(0.3, { fade: 0.25 }),
          k.z(12),
        ]);
      });
    }

    const flash = k.add([
      k.rect(WIDTH, HEIGHT),
      k.pos(0, 0),
      k.color(255, 255, 255),
      k.opacity(0.55),
      k.lifespan(0.12, { fade: 0.1 }),
      k.z(100),
    ]);

    const cx = wagon.pos.x + 30;
    const cy = wagon.pos.y - 10;

    for (let i = 0; i < 4; i++) {
      k.add([
        k.circle(40 + i * 15),
        k.pos(cx, cy),
        k.color(k.rgb(255, 240 - i * 40, 60)),
        k.opacity(0.85 - i * 0.15),
        k.lifespan(0.25 + i * 0.05, { fade: 0.2 }),
        k.z(15),
      ]);
    }

    for (let i = 0; i < 16; i++) {
      const angle = (Math.PI * 2 * i) / 16;
      const r = 50 + Math.random() * 30;
      const tiers = [
        k.rgb(255, 230, 60),
        k.rgb(255, 150, 30),
        k.rgb(230, 60, 30),
      ];
      const color = tiers[Math.floor(Math.random() * 3)];
      k.add([
        k.circle(4 + Math.random() * 5),
        k.pos(cx, cy),
        k.color(color),
        k.opacity(1),
        k.lifespan(0.7 + Math.random() * 0.4, { fade: 0.5 }),
        k.z(14),
        "particle-grav",
        {
          vx: Math.cos(angle) * r,
          vy: Math.sin(angle) * r - 40,
          grav: 80,
        },
      ]);
    }

    for (let i = 0; i < 10; i++) {
      k.add([
        k.rect(2 + Math.random() * 3, 2 + Math.random() * 3),
        k.pos(cx, cy),
        k.color(k.rgb(255, 255, 180)),
        k.opacity(1),
        k.lifespan(0.9 + Math.random() * 0.5, { fade: 0.5 }),
        k.z(15),
        "particle-grav",
        {
          vx: (Math.random() - 0.5) * 300,
          vy: -60 - Math.random() * 120,
          grav: 200,
        },
      ]);
    }

    for (let i = 0; i < 8; i++) {
      k.wait(0.3 + Math.random() * 0.3, () => {
        k.add([
          k.circle(6 + Math.random() * 6),
          k.pos(cx + (Math.random() - 0.5) * 40, cy),
          k.color(k.rgb(80, 80, 80)),
          k.opacity(0.6),
          k.lifespan(1.2, { fade: 0.9 }),
          k.z(13),
          "particle",
          { vy: -30 - Math.random() * 30, vx: (Math.random() - 0.5) * 30 },
        ]);
      });
    }

    k.wait(0.08, () => {
      if (!wagon.exists()) return;
      if (wagon.rider && !wagon.rider.isSkeleton) {
        wagon.rider.isSkeleton = true;
        wagon.rider.sprite = wagon.rider.skelSprite;
        if (wagon.passengerEntity?.exists()) {
          wagon.passengerEntity.sprite = wagon.rider.skelSprite;
        }
      }

      const ghost = k.add([
        k.sprite("skeleton"),
        k.pos(wagon.pos.x + 16, wagon.pos.y - 30),
        k.area({ shape: new k.Rect(k.vec2(2, 4), 24, 40) }),
        k.opacity(0.55),
        k.z(5),
        "ghost",
        { vx: -60 - Math.random() * 40, vy: -30, born: k.time() },
      ]);
    });
  }

  function tryBoardWagon(p) {
    if (p._constActive) return;
    const wagons = k.get("wagon").filter((w) => !w.rider);
    let closest = null;
    let best = 90;
    for (const w of wagons) {
      const cx = w.pos.x + 30;
      const cy = w.pos.y + 15;
      const px = p.pos.x + 14;
      const py = p.pos.y + 22;
      const d = Math.hypot(cx - px, cy - py);
      if (d < best) {
        best = d;
        closest = w;
      }
    }
    if (!closest) return;
    p.ridingWagon = closest;
    closest.rider = p;
    p.opacity = 0;

    if (closest.passengerEntity?.exists()) {
      const idx = closest.passengerEntities.indexOf(closest.passengerEntity);
      if (idx !== -1) closest.passengerEntities.splice(idx, 1);
      if (closest.passengers[0]) closest.passengers[0].type = p.isSkeleton ? "skeleton" : "human";
      k.destroy(closest.passengerEntity);
    }
    const visibleSprite = p.isSkeleton ? p.skelSprite : p.normalSprite;
    const rider = k.add([
      k.sprite(visibleSprite),
      k.pos(closest.pos.x + 6, closest.pos.y - 40),
      k.z(7),
      "passenger",
      { wagon: closest, isPlayerRider: true },
    ]);
    closest.passengerEntity = rider;
    closest.passengerEntities.unshift(rider);
    closest.parts.push(rider);
    closest.passenger = p.isSkeleton ? "skeleton" : "human";
    audio.board();
  }

  function exitWagon(p) {
    const w = p.ridingWagon;
    if (!w) return;
    if (w.isRace) return;
    p.ridingWagon = null;
    w.rider = null;
    w._riderInput = null;
    p.opacity = 1;
    p.pos.x = w.pos.x + 70;
    p.pos.y = w.pos.y - 44;
    if (w.passengerEntity?.exists()) {
      const idx = w.passengerEntities.indexOf(w.passengerEntity);
      if (idx !== -1) w.passengerEntities.splice(idx, 1);
      if (w.passengers[0]) w.passengers.splice(0, 1);
      k.destroy(w.passengerEntity);
      w.passengerEntity = w.passengerEntities[0] ?? null;
    }
    w.passenger = w.passengers[0]?.type ?? "empty";
    if (p.isSkeleton) {
      p.sprite = p.skelSprite;
    }
  }

  function tryAutoBoardVisitor(wagon, visitor) {
    if (wagon.passengers.length >= 4) return false;
    if (wagon.inverseTrain || wagon.ghostTrain || wagon.isSpectral || wagon.isRace) return false;
    wagon.passengers.push({ type: visitor.isSkeleton ? "skeleton" : "human" });
    const idx = wagon.passengers.length - 1;
    const px = wagon.pos.x + 6 + idx * 14;
    const py = wagon.pos.y - 40;
    const sprite = k.add([
      k.sprite(visitor.isSkeleton ? "skeleton" : "human"),
      k.pos(px, py),
      k.z(7),
      "passenger",
      { wagon, idx },
    ]);
    wagon.passengerEntities.push(sprite);
    wagon.parts.push(sprite);
    if (idx === 0) {
      wagon.passengerEntity = sprite;
      wagon.passenger = wagon.passengers[0].type;
    }
    audio.board?.();
    const ec = window.__entityCounts;
    if (!ec || ec.particle < 270) {
      for (let p = 0; p < 5; p++) {
        const a = (Math.PI * 2 * p) / 5;
        k.add([
          k.circle(2),
          k.pos(visitor.pos.x + 14, visitor.pos.y + 10),
          k.color(k.rgb(180, 220, 255)),
          k.opacity(0.8),
          k.lifespan(0.3, { fade: 0.2 }),
          k.z(10),
          "particle",
          { vx: Math.cos(a) * 50, vy: Math.sin(a) * 50 },
        ]);
      }
    }
    return true;
  }

  return {
    drawWagonBody,
    spawnWagon,
    transformToSkeleton,
    reviveFromSkeleton,
    collectCoin,
    tryBoardWagon,
    exitWagon,
    tryAutoBoardVisitor,
  };
}
