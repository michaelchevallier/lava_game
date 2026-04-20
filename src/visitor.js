export function createVisitorSystem({
  k, gameState, audio, juice, tileMap,
  registerKill, showPopup, checkMilestone,
  constellation, getCrowdHooks,
  WIDTH, WORLD_WIDTH, TILE, GROUND_ROW, gridKey,
  boardingFn,
}) {
  const W_RIGHT = WORLD_WIDTH || WIDTH;
  const VISITOR_TINTS = [
    [255, 180, 180], [180, 255, 180], [180, 180, 255], [255, 255, 180],
    [255, 180, 255], [180, 255, 255], [255, 200, 150], [200, 180, 255],
  ];

  function spawnVisitor() {
    const speed = 40 + Math.random() * 40;
    const isVIP = Math.random() < 0.12;
    const tint = VISITOR_TINTS[Math.floor(Math.random() * VISITOR_TINTS.length)];
    const v = k.add([
      k.sprite("human"),
      k.pos(-40, (GROUND_ROW - 3) * TILE),
      k.area({ shape: new k.Rect(k.vec2(2, 4), 24, 40) }),
      k.body(),
      k.anchor("topleft"),
      k.color(k.rgb(tint[0], tint[1], tint[2])),
      k.scale(1, 1),
      k.z(5),
      "visitor",
      { walkSpeed: speed, isSkeleton: false, isVIP, crown: null, tint },
    ]);
    if (isVIP) {
      const hat = k.add([
        k.rect(18, 10),
        k.pos(v.pos.x + 5, v.pos.y - 6),
        k.color(k.rgb(20, 20, 20)),
        k.outline(1, k.rgb(100, 80, 0)),
        k.z(6),
        "visitor-hat",
      ]);
      const hatBrim = k.add([
        k.rect(24, 3),
        k.pos(v.pos.x + 2, v.pos.y + 2),
        k.color(k.rgb(20, 20, 20)),
        k.outline(1, k.rgb(100, 80, 0)),
        k.z(6),
        "visitor-hat",
      ]);
      const hatBand = k.add([
        k.rect(18, 2),
        k.pos(v.pos.x + 5, v.pos.y + 0),
        k.color(k.rgb(255, 220, 50)),
        k.z(7),
        "visitor-hat",
      ]);
      v.crown = [hat, hatBrim, hatBand];
    }
    v.onUpdate(() => {
      if (constellation.applyVisitorSpiralUpdate(v)) return;
      if (boardingFn && (!v._autoBoardCd || k.time() > v._autoBoardCd)) {
        v._autoBoardCd = k.time() + 0.5;
        for (const w of k.get("wagon")) {
          if (!w.passengers || w.passengers.length >= 4) continue;
          const dx = w.pos.x + 30 - (v.pos.x + 14);
          const dy = w.pos.y + 15 - (v.pos.y + 20);
          if (Math.abs(dx) < 28 && Math.abs(dy) < 35) {
            if (boardingFn(w, v)) {
              if (v.crown) v.crown.forEach((e) => k.destroy(e));
              gameState.skeletons -= v.isSkeleton ? 1 : 0;
              k.destroy(v);
              return;
            }
          }
        }
      }
      const vSpeed = gameState.bulletTimeUntil > k.time() ? v.walkSpeed * 0.3 : v.walkSpeed;
      v.move(vSpeed, 0);
      // Hesitation: detect lava ahead (visitors always walk right, dir=+1)
      if (!v.isSkeleton) {
        let danger = null;
        for (let look = 1; look <= 3; look++) {
          const checkCol = Math.floor((v.pos.x + 14) / TILE) + look;
          const checkRow = Math.floor((v.pos.y + 42) / TILE);
          const ahead = tileMap.get(gridKey(checkCol, checkRow));
          if (ahead && ahead.tileType === "lava") { danger = look; break; }
        }
        if (danger !== null) {
          v._hesitate = danger;
          if (!v._hesitateState || v._hesitateState.dist > danger) {
            v._hesitateState = { dist: danger, started: k.time() };
          }
        } else {
          if (v._hesitateState && k.time() - v._hesitateState.started < 1) {
            const ec = window.__entityCounts;
            if (!ec || ec.particle < 250) {
              for (let i = 0; i < 3; i++) {
                k.add([
                  k.circle(2 + Math.random()),
                  k.pos(v.pos.x + 14 + (Math.random() - 0.5) * 8, v.pos.y - 4),
                  k.color(k.rgb(180, 220, 255)),
                  k.opacity(0.8),
                  k.lifespan(0.6, { fade: 0.4 }),
                  k.z(8),
                  "particle",
                  { vx: 0, vy: -25 - Math.random() * 15 },
                ]);
              }
            }
          }
          v._hesitate = null;
          v._hesitateState = null;
        }
      } else {
        v._hesitate = null;
        v._hesitateState = null;
      }
      // Skeleton dance: when 3+ skeletons + grounded, sync hop via small jump impulse
      if (v.isSkeleton && gameState.skeletons >= 3 && v.isGrounded()) {
        const phase = (v._dancePhase ??= Math.random() * 0.4);
        const beat = Math.floor(k.time() * 1.3 + phase * 4);
        if (beat !== v._lastDanceBeat) {
          v._lastDanceBeat = beat;
          v.jump(80);
        }
      }
      if (v._squashing) {
        const dt = k.time() - v._squashStart;
        if (dt < 0.08) {
          v.scale = k.vec2(1.6, 0.4);
        } else if (dt < 0.18) {
          const t = (dt - 0.08) / 0.1;
          v.scale = k.vec2(1.6 - 0.9 * t, 0.4 + 0.9 * t);
        } else if (dt < 0.30) {
          const t = (dt - 0.18) / 0.12;
          const eased = 1 - Math.pow(1 - t, 2);
          v.scale = k.vec2(0.7 + 0.3 * eased, 1.3 - 0.3 * eased);
        } else {
          v.scale = k.vec2(1, 1);
          v._squashing = false;
        }
      }
      if (v.crown) {
        v.crown[0].pos.x = v.pos.x + 5;
        v.crown[0].pos.y = v.pos.y - 6;
        v.crown[1].pos.x = v.pos.x + 2;
        v.crown[1].pos.y = v.pos.y + 2;
        v.crown[2].pos.x = v.pos.x + 5;
        v.crown[2].pos.y = v.pos.y + 0;
      }
      const pCol = Math.floor((v.pos.x + 14) / TILE);
      const pRowFeet = Math.floor((v.pos.y + 42) / TILE);
      const tile = tileMap.get(gridKey(pCol, pRowFeet));
      if (tile && tile.tileType === "lava" && !v.isSkeleton) {
        v._deadCross = k.time() + 0.4;
        v._hesitate = null;
        v._hesitateState = null;
        v.isSkeleton = true;
        v.sprite = "skeleton";
        v.color.r = 255; v.color.g = 255; v.color.b = 255;
        gameState.skeletons += 1;
        audio.transform();
        audio.pop?.();
        juice.dirShake(1, 0, v.isVIP ? 7 : 3, 0.15);
        const crowdHooks = getCrowdHooks();
        if (crowdHooks) crowdHooks.onSkeletonSpawn(k.vec2(v.pos.x + 14, v.pos.y));
        registerKill(v.pos.x + 14, v.pos.y, v.isVIP ? 50 : 10, v.isVIP);
        v._squashing = true;
        v._squashStart = k.time();
        const origR = v.tint[0], origG = v.tint[1], origB = v.tint[2];
        setTimeout(() => {
          if (v.exists()) { v.color.r = origR; v.color.g = origG; v.color.b = origB; }
        }, 80);
        const cx = v.pos.x + 14;
        const cy = v.pos.y + 10;
        for (let i = 0; i < 12; i++) {
          const a = (Math.PI * 2 * i) / 12;
          k.add([
            k.circle(3 + Math.random() * 3),
            k.pos(cx, cy),
            k.color(k.rgb(255, 150 + Math.random() * 80, 40)),
            k.opacity(1),
            k.lifespan(0.5, { fade: 0.3 }),
            k.z(14),
            "particle",
            { vx: Math.cos(a) * 80, vy: Math.sin(a) * 80 - 30 },
          ]);
        }
        for (let i = 0; i < 6; i++) {
          const a = (Math.PI * 2 * i) / 6;
          k.add([
            k.rect(3, 4),
            k.pos(cx, v.pos.y + 20),
            k.color(k.rgb(240, 240, 220)),
            k.outline(1, k.rgb(140, 140, 120)),
            k.opacity(1),
            k.lifespan(0.6, { fade: 0.4 }),
            k.z(15),
            k.rotate(Math.random() * 360),
            "particle",
            { vx: Math.cos(a) * (60 + Math.random() * 40), vy: Math.sin(a) * (60 + Math.random() * 40) - 40 },
          ]);
        }
      }
      if (tile && tile.tileType === "water" && v.isSkeleton) {
        v.isSkeleton = false;
        v.sprite = "human";
        gameState.skeletons = Math.max(0, gameState.skeletons - 1);
        audio.splash();
        for (let i = 0; i < 8; i++) {
          const a = (Math.PI * 2 * i) / 8;
          k.add([
            k.circle(2 + Math.random() * 2),
            k.pos(v.pos.x + 14, v.pos.y + 20),
            k.color(k.rgb(100, 180, 230)),
            k.opacity(0.9),
            k.lifespan(0.5, { fade: 0.3 }),
            k.z(10),
            "particle-grav",
            { vx: Math.cos(a) * 60, vy: Math.sin(a) * 60 - 40, grav: 180 },
          ]);
        }
      }
      if (tile && tile.tileType === "ice") {
        if (!(v._iceCd > k.time())) {
          v._iceCd = k.time() + 0.15;
          v._iceUntil = k.time() + 0.4;
          v._iceSpeed = v.walkSpeed * 1.6;
        }
      }
      if (v._iceUntil && k.time() < v._iceUntil) {
        v.move(v._iceSpeed - v.walkSpeed, 0);
      }
      if (v.pos.x > W_RIGHT + 40 || v.pos.x < -W_RIGHT - 40) {
        if (v.crown) v.crown.forEach((e) => k.destroy(e));
        k.destroy(v);
      }
    });
    return v;
  }

  k.onDraw(() => {
    const visitors = k.get("visitor");
    for (const v of visitors) {
      if (v._deadCross && v._deadCross > k.time()) {
        const bobY = Math.sin(k.time() * 8) * 1;
        k.drawText({
          text: "X",
          pos: k.vec2(v.pos.x + 14, v.pos.y - 10 + bobY),
          size: 18,
          color: k.rgb(220, 40, 40),
          anchor: "center",
        });
      } else if (v._hesitate !== null && !v.isSkeleton) {
        const symbol = v._hesitate <= 1 ? "!" : "?";
        const color = v._hesitate <= 1 ? k.rgb(255, 80, 80) : k.rgb(255, 220, 80);
        const bobY = Math.sin(k.time() * 6) * 2;
        k.drawText({
          text: symbol,
          pos: k.vec2(v.pos.x + 14, v.pos.y - 10 + bobY),
          size: 16,
          color,
          anchor: "center",
        });
      }
    }
  });

  return { spawn: spawnVisitor };
}
