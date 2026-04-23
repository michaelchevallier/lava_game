import { TILE, GROUND_ROW, WIDTH, HEIGHT, WAGON_THEMES, gridKey } from "./constants.js";
import { getSkinTheme } from "./shop.js";
import { hueToRgb, getRoyalLevel, drawWagonBody as _drawWagonBody, drawRoyalOverlay as _drawRoyalOverlay } from "./wagon-draw.js";
import { createWagonVfx } from "./wagon-vfx.js";
import { attachWagonCollisions } from "./wagon-collisions.js";

export function createWagonSystem({
  k, tileMap, gameState, audio, entityCounts, showPopup, registerKill, registerCoin, launchFirework,
  placeTile, onSkeletonTransform, save, triggerParade,
}) {
  function getRailSlopeYAt(worldX) {
    const col = Math.floor(worldX / TILE);
    const localX = Math.max(0, Math.min(1, (worldX - col * TILE) / TILE));
    for (let r = 0; r < GROUND_ROW; r++) {
      const rt = tileMap.get(gridKey(col, r));
      if (!rt) continue;
      // RAIL_SURFACE = TILE - 10 (=54 for TILE=64), aligned with the visual top
      // of the horizontal rail rect (y = row*TILE + TILE - 10 in tiles.js)
      if (rt.tileType === "rail" && !rt.broken) {
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
  const drawWagonBody = (x, y, theme) => _drawWagonBody(k, x, y, theme);
  const drawRoyalOverlay = (wagon, level) => _drawRoyalOverlay(k, wagon, level);

  const { collectCoin, reviveFromSkeleton, triggerCarillon, transformToSkeleton } = createWagonVfx({
    k, audio, gameState, tileMap, showPopup, registerKill, registerCoin, onSkeletonTransform,
  });

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
    const skinTheme = (!ghost && !inverse && !isGolden) ? getSkinTheme(save) : null;
    const theme = (ghost || inverse)
      ? { body: [30, 30, 40], dark: [0, 0, 0], trim: [180, 30, 30] }
      : isGolden
      ? { body: [255, 200, 30], dark: [180, 130, 0], trim: [255, 255, 200] }
      : skinTheme
      ? skinTheme
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
          window.__quests?.onLoop();
          window.__campaign?.progress?.("loop"); window.__contract?.progress?.("loop");
          for (const p of (wagon.passengerEntities || [])) {
            if (p.exists()) p.angle = 0;
          }
          for (const part of wagon.parts || []) {
            if (part?.exists?.() && "angle" in part) part.angle = 0;
          }
        } else {
          // Direction logique : wagon venant de la gauche monte en premier (counter-clockwise
          // en coords screen où y↓). Venant de la droite : monte aussi, mais de l'autre côté.
          // dir = +1 : ang descend de PI → -PI (en haut d'abord depuis la gauche)
          // dir = -1 : ang monte de 0 → 2PI (en haut d'abord depuis la droite)
          const dir = wagon.loopDir || 1;
          const ang = dir > 0
            ? Math.PI - loopT * Math.PI * 2
            : loopT * Math.PI * 2;
          wagon.pos.x = wagon.loopCx + Math.cos(ang) * wagon.loopRx - 30;
          wagon.pos.y = wagon.loopCy + Math.sin(ang) * wagon.loopRy - 15;
          wagon.angle = (dir > 0 ? -1 : 1) * loopT * 360;
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
      const frozen = wagon.frozenUntil && k.time() < wagon.frozenUntil;
      const windy = wagon.windUntil && k.time() < wagon.windUntil;
      if (boosted && wagon.boostStackUntil && k.time() > wagon.boostStackUntil) wagon.boostStack = 0;
      let speedMult = 1;
      if (boosted) {
        const stack = wagon.boostStack || 1;
        speedMult = stack === 1 ? 2.2 : stack === 2 ? 3.0 : 4.5;
      } else if (sliding) speedMult = 3;
      else if (iced) speedMult = 1.6;
      if (windy) speedMult += 1.2;
      if (frozen) speedMult *= 0.35;
      if (gameState.maintenanceBonusUntil && k.time() < gameState.maintenanceBonusUntil) {
        speedMult *= 1.2;
      }
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
      // Quand un joueur pilote : contrôle 100% via input. Bypass complet de la physique —
      // on déplace wagon.pos.x directement, on évite tout side-effect (collisions, dérive).
      // Le speedMult ambient (boost, ice, slide) s'applique aussi au rider pour le fun.
      // Mode Course inclus : les 2 wagons sont pilotés par les 2 joueurs.
      let currentSpeed;
      if (wagon.rider && !wagon._inTunnel && !wagon.inLoop && !wagon.isSpectral) {
        const RIDER_SPEED = 240 * speedMult;
        let dx = 0;
        if (!wagon.raceLocked) {
          if (wagon._riderInput === "right") dx = RIDER_SPEED;
          else if (wagon._riderInput === "left") dx = -RIDER_SPEED;
        }
        wagon.pos.x += dx * k.dt();
        if (wagon.vel) wagon.vel.x = 0;
        wagon._riderInput = null;
        currentSpeed = 0;
      } else {
        currentSpeed = wagon.speed * speedMult;
        wagon.move(currentSpeed, 0);
      }

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
            if (!wagon._magnetFieldCdUntil || k.time() > wagon._magnetFieldCdUntil) {
              wagon._magnetFieldCdUntil = k.time() + 1.5;
              window.__campaign?.progress?.("magnetField"); window.__contract?.progress?.("magnetField");
            }
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

      // Ne PAS repositionner wagon.rider chaque frame : le joueur est parqué à (-99999)
      // pour éviter que sa hitbox physics pousse le wagon. Le passengerEntity sprite
      // gère la représentation visuelle sur le wagon.

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
              if (!wagon._geyserCdUntil || k.time() > wagon._geyserCdUntil) {
                wagon._geyserCdUntil = k.time() + 1;
                window.__campaign?.progress?.("geyser"); window.__contract?.progress?.("geyser");
                window.__spectres?.unlock?.("geyser_master");
              }
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
        if (wagon.glideUntil > k.time() && !wagon.rider) {
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
      // Skip si rider pour pas overrider le contrôle joueur
      if (!wagon.rider) {
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

      // Trampoline fallback : si onCollide rate (bord de hitbox), détection grid-based
      {
        const wCol = Math.floor((wagon.pos.x + 30) / TILE);
        const wRow = Math.floor((wagon.pos.y + 40) / TILE);
        const tileHere = tileMap.get(gridKey(wCol, wRow));
        if (tileHere?.tileType === "trampoline" && (!wagon.lastBounce || k.time() - wagon.lastBounce > 0.3)) {
          wagon.lastBounce = k.time();
          const fanAbove = tileMap.get(gridKey(wCol, wRow - 1));
          if (fanAbove?.tileType === "fan") {
            catapultWagon(wagon);
            window.__campaign?.progress?.("catapult"); window.__contract?.progress?.("catapult");
          } else {
            wagon.jump?.(850);
            window.__juice?.dirShake(0, -1, 4, 0.12);
            audio.boost();
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
            window.__campaign?.progress?.("metronome"); window.__contract?.progress?.("metronome");
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
              window.__campaign?.progress?.("loop"); window.__contract?.progress?.("loop");
              if (wagon.loopCount >= 3) {
                window.__spectres?.unlock("triple_loop");
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

      // Despawn wagon uniquement après 30% de viewport au-delà de la zone visible
      // pour éviter pop-out sec et donner un tampon de "zone cachée"
      const BUFFER_X = Math.floor(WIDTH * 0.3);
      const outOfBounds = wagon.inverseTrain
        ? wagon.pos.x < -BUFFER_X
        : wagon.pos.x > WIDTH + BUFFER_X;
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

    attachWagonCollisions({
      k, wagon, tileMap, gameState, audio, showPopup, placeTile,
      catapultWagon, transformToSkeleton, reviveFromSkeleton, collectCoin, triggerCarillon,
      triggerParade,
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
    closest._riderInput = null;
    if (closest.vel) closest.vel.x = 0;
    p.opacity = 0;
    p._parkedPos = { x: p.pos.x, y: p.pos.y };
    p.pos.x = -99999;
    p.pos.y = -99999;
    if (p.vel) { p.vel.x = 0; p.vel.y = 0; }

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
      { wagon: closest, isPlayerRider: true, normalSprite: p.normalSprite, skelSprite: p.skelSprite },
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
    // Place le joueur au-dessus du wagon (pas dans). Si wagon en l'air, petit hop vers le haut.
    p.pos.x = w.pos.x + 14;
    p.pos.y = w.pos.y - 54;
    // Reset velocity proprement pour éviter glitch physics à la sortie aérienne
    if (p.vel) { p.vel.x = 0; p.vel.y = 0; }
    // Si wagon était en l'air, petit jump pour éjecter au-dessus (pas de chute bizarre au raz wagon)
    if (!w.isGrounded?.()) {
      p.jump?.(260);
    }
    p._parkedPos = null;
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
    window.__campaign?.progress?.("visitor");
    window.__contract?.progress?.("visitor");
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
