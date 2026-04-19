import { TILE, GROUND_ROW, WIDTH, WAGON_THEMES, gridKey } from "./constants.js";

export function createWagonSystem({
  k, tileMap, gameState, audio, showPopup, registerKill, registerCoin, launchFirework,
  placeTile,
}) {
  function drawWagonBody(x, y, theme) {
    const body = k.add([
      k.rect(60, 30),
      k.pos(x, y),
      k.color(k.rgb(theme.body[0], theme.body[1], theme.body[2])),
      k.outline(2, k.rgb(20, 10, 5)),
      k.z(3),
      "wagon-part",
    ]);
    const frontRim = k.add([
      k.rect(4, 34),
      k.pos(x, y - 2),
      k.color(k.rgb(58, 58, 58)),
      k.outline(1, k.rgb(20, 20, 20)),
      k.z(4),
      "wagon-part",
    ]);
    const backRim = k.add([
      k.rect(4, 34),
      k.pos(x + 56, y - 2),
      k.color(k.rgb(58, 58, 58)),
      k.outline(1, k.rgb(20, 20, 20)),
      k.z(4),
      "wagon-part",
    ]);
    const plank1 = k.add([
      k.rect(52, 2),
      k.pos(x + 4, y + 8),
      k.color(k.rgb(theme.dark[0], theme.dark[1], theme.dark[2])),
      k.z(4),
      "wagon-part",
    ]);
    const plank2 = k.add([
      k.rect(52, 2),
      k.pos(x + 4, y + 20),
      k.color(k.rgb(theme.dark[0], theme.dark[1], theme.dark[2])),
      k.z(4),
      "wagon-part",
    ]);
    const trim = k.add([
      k.rect(60, 3),
      k.pos(x, y - 3),
      k.color(k.rgb(theme.trim[0], theme.trim[1], theme.trim[2])),
      k.z(4),
      "wagon-part",
    ]);
    return [body, frontRim, backRim, plank1, plank2, trim];
  }

  function spawnWagon(ghost = false) {
    audio.wagonSpawn();
    const y = (GROUND_ROW - 1) * TILE + 2;
    const wagon = k.add([
      k.rect(60, 30),
      k.pos(0, y),
      k.opacity(0),
      k.area({ shape: new k.Rect(k.vec2(0, -10), 60, 50) }),
      k.body(),
      k.anchor("topleft"),
      k.z(3),
      "wagon",
      {
        passenger: "human",
        speed: ghost ? 180 : 140,
        parts: [],
        rider: null,
        ghostTrain: ghost,
      },
    ]);

    const theme = ghost
      ? { body: [30, 30, 40], dark: [0, 0, 0], trim: [180, 30, 30] }
      : WAGON_THEMES[Math.floor(Math.random() * WAGON_THEMES.length)];
    const parts = drawWagonBody(wagon.pos.x, wagon.pos.y, theme);
    if (ghost) {
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

    wagon.onUpdate(() => {
      const boosted = wagon.boostUntil && k.time() < wagon.boostUntil;
      const iced = wagon.iceUntil && k.time() < wagon.iceUntil;
      let speedMult = 1;
      if (boosted) speedMult = 2.2;
      else if (iced) speedMult = 1.6;
      const currentSpeed = wagon.speed * speedMult;
      wagon.move(currentSpeed, 0);

      const wCenterX = wagon.pos.x + 30;
      const wCol = Math.floor(wCenterX / TILE);
      for (let r = 0; r < GROUND_ROW; r++) {
        const rt = tileMap.get(gridKey(wCol, r));
        if (
          rt &&
          (rt.tileType === "rail_up" || rt.tileType === "rail_down")
        ) {
          const localX = Math.max(
            0,
            Math.min(1, (wCenterX - wCol * TILE) / TILE),
          );
          const slopeY =
            rt.tileType === "rail_up"
              ? r * TILE + 22 - localX * TILE
              : r * TILE - 10 + localX * TILE;
          const wagonBottom = wagon.pos.y + 30;
          if (Math.abs(wagonBottom - slopeY) < 28) {
            wagon.pos.y = slopeY - 30;
            if (wagon.vel) wagon.vel.y = 0;
            break;
          }
        }
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
      parts[0].pos.x = dx;
      parts[0].pos.y = wagon.pos.y;
      parts[1].pos.x = dx;
      parts[1].pos.y = wagon.pos.y - 2;
      parts[2].pos.x = dx + 56;
      parts[2].pos.y = wagon.pos.y - 2;
      parts[3].pos.x = dx + 4;
      parts[3].pos.y = wagon.pos.y + 8;
      parts[4].pos.x = dx + 4;
      parts[4].pos.y = wagon.pos.y + 20;
      parts[5].pos.x = dx;
      parts[5].pos.y = wagon.pos.y - 3;
      wheel1.pos.x = dx + 14;
      wheel1.pos.y = wagon.pos.y + 30;
      wheel2.pos.x = dx + 46;
      wheel2.pos.y = wagon.pos.y + 30;
      spokeAngle += wagon.speed * 2 * k.dt();
      wheel1Spoke.pos.x = wheel1.pos.x;
      wheel1Spoke.pos.y = wheel1.pos.y;
      wheel1Spoke.angle = spokeAngle;
      wheel2Spoke.pos.x = wheel2.pos.x;
      wheel2Spoke.pos.y = wheel2.pos.y;
      wheel2Spoke.angle = spokeAngle;

      if (wagon.passengerEntity) {
        wagon.passengerEntity.pos.x = dx + 16;
        wagon.passengerEntity.pos.y = wagon.pos.y - 40;
      }

      if (wagon.rider) {
        wagon.rider.pos.x = dx + 16;
        wagon.rider.pos.y = wagon.pos.y - 44;
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

      if (wagon.pos.x > WIDTH + 80) {
        if (wagon.rider) exitWagon(wagon.rider);
        if (wagon.passenger === "human" && !wagon.ghostTrain) {
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
        wagon.parts.forEach((p) => k.destroy(p));
        k.destroy(wagon);
      }
    });

    wagon.onCollide("lava", () => {
      if (wagon.passenger === "human") {
        wagon.passenger = "skeleton";
        transformToSkeleton(wagon);
      }
    });

    wagon.onCollide("water", () => {
      if (wagon.passenger === "skeleton") {
        wagon.passenger = "human";
        reviveFromSkeleton(wagon);
      }
    });

    wagon.onCollide("coin", (c) => {
      collectCoin(c);
    });

    wagon.onCollide("ghost", (g) => {
      wagon.darkPassenger = (wagon.darkPassenger || 0) + 1;
      k.destroy(g);
      k.shake(4);
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
      if (b.breaking) return;
      b.breaking = true;
      k.shake(2);
      audio.place();
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
    });

    wagon.onCollide("ice", () => {
      wagon.iceUntil = k.time() + 0.35;
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
      audio.combo();
      k.shake(3);
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

    wagon.onCollide("trampoline", () => {
      if (wagon.lastBounce && k.time() - wagon.lastBounce < 0.3) return;
      wagon.lastBounce = k.time();
      wagon.jump(850);
      audio.boost();
      for (let i = 0; i < 8; i++) {
        const a = (Math.PI * 2 * i) / 8;
        const p = k.add([
          k.circle(2 + Math.random() * 2),
          k.pos(wagon.pos.x + 30, wagon.pos.y + 30),
          k.color(k.rgb(255, 120, 180)),
          k.opacity(1),
          k.lifespan(0.3, { fade: 0.2 }),
          k.z(14),
          { vx: Math.cos(a) * 80, vy: Math.sin(a) * 80 },
        ]);
        p.onUpdate(() => {
          p.pos.x += p.vx * k.dt();
          p.pos.y += p.vy * k.dt();
        });
      }
    });

    wagon.onCollide("boost", () => {
      if (wagon.boostUntil && k.time() < wagon.boostUntil) return;
      wagon.boostUntil = k.time() + 1.5;
      audio.boost();
      for (let i = 0; i < 12; i++) {
        const a = (Math.PI * 2 * i) / 12;
        const p = k.add([
          k.circle(3 + Math.random() * 3),
          k.pos(wagon.pos.x + 30, wagon.pos.y + 15),
          k.color(k.rgb(255, 230, 60)),
          k.opacity(1),
          k.lifespan(0.4, { fade: 0.3 }),
          k.z(14),
          { vx: Math.cos(a) * 120, vy: Math.sin(a) * 120 },
        ]);
        p.onUpdate(() => {
          p.pos.x += p.vx * k.dt();
          p.pos.y += p.vy * k.dt();
        });
      }
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
      const spark = k.add([
        k.rect(3, 3),
        k.pos(cx, cy),
        k.color(k.rgb(255, 230, 80)),
        k.opacity(1),
        k.lifespan(0.5, { fade: 0.3 }),
        k.z(15),
        {
          vx: Math.cos(angle) * 120,
          vy: Math.sin(angle) * 120 - 40,
          grav: 250,
        },
      ]);
      spark.onUpdate(() => {
        spark.pos.x += spark.vx * k.dt();
        spark.pos.y += spark.vy * k.dt();
        spark.vy += spark.grav * k.dt();
      });
    }
  }

  function reviveFromSkeleton(wagon) {
    audio.splash();
    const cx = wagon.pos.x + 30;
    const cy = wagon.pos.y - 10;
    for (let i = 0; i < 20; i++) {
      const angle = (Math.PI * 2 * i) / 20;
      const r = 40 + Math.random() * 30;
      const drop = k.add([
        k.circle(3 + Math.random() * 3),
        k.pos(cx, cy),
        k.color(k.rgb(90 + Math.random() * 100, 180, 230)),
        k.opacity(1),
        k.lifespan(0.8, { fade: 0.5 }),
        k.z(14),
        {
          vx: Math.cos(angle) * r,
          vy: Math.sin(angle) * r - 60,
          grav: 200,
        },
      ]);
      drop.onUpdate(() => {
        drop.pos.x += drop.vx * k.dt();
        drop.pos.y += drop.vy * k.dt();
        drop.vy += drop.grav * k.dt();
      });
    }
    k.wait(0.05, () => {
      if (wagon.passengerEntity && wagon.passengerEntity.exists()) {
        k.destroy(wagon.passengerEntity);
      }
      let spr = "human";
      if (wagon.rider) {
        spr = wagon.rider.normalSprite;
        if (wagon.rider.isSkeleton) {
          wagon.rider.isSkeleton = false;
          wagon.rider.sprite = wagon.rider.normalSprite;
        }
      }
      const passenger = k.add([
        k.sprite(spr),
        k.pos(wagon.pos.x + 16, wagon.pos.y - 40),
        k.z(7),
        "passenger",
        { wagon, currentType: "human" },
      ]);
      wagon.passengerEntity = passenger;
      wagon.parts.push(passenger);
    });
  }

  function transformToSkeleton(wagon) {
    k.shake(6);
    gameState.skeletons += 1;
    audio.transform();
    const dark = wagon.darkPassenger || 0;
    const base = wagon.ghostTrain ? 100 : 10;
    registerKill(wagon.pos.x + 30, wagon.pos.y, base, wagon.ghostTrain, dark);
    if (dark > 0) wagon.darkPassenger = 0;
    if (wagon.ghostTrain) {
      for (let i = 0; i < 30; i++) {
        const a = (Math.PI * 2 * i) / 30;
        const p = k.add([
          k.circle(4 + Math.random() * 4),
          k.pos(wagon.pos.x + 30, wagon.pos.y + 10),
          k.color(k.rgb(180, 100, 255)),
          k.opacity(1),
          k.lifespan(1.2, { fade: 0.8 }),
          k.z(15),
          { vx: Math.cos(a) * 200, vy: Math.sin(a) * 200 },
        ]);
        p.onUpdate(() => {
          p.pos.x += p.vx * k.dt();
          p.pos.y += p.vy * k.dt();
        });
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

    for (let i = 0; i < 24; i++) {
      const angle = (Math.PI * 2 * i) / 24;
      const r = 50 + Math.random() * 30;
      const tiers = [
        k.rgb(255, 230, 60),
        k.rgb(255, 150, 30),
        k.rgb(230, 60, 30),
      ];
      const color = tiers[Math.floor(Math.random() * 3)];
      const flame = k.add([
        k.circle(4 + Math.random() * 5),
        k.pos(cx, cy),
        k.color(color),
        k.opacity(1),
        k.lifespan(0.7 + Math.random() * 0.4, { fade: 0.5 }),
        k.z(14),
        {
          vx: Math.cos(angle) * r,
          vy: Math.sin(angle) * r - 40,
          grav: 80,
        },
      ]);
      flame.onUpdate(() => {
        flame.pos.x += flame.vx * k.dt();
        flame.pos.y += flame.vy * k.dt();
        flame.vy += flame.grav * k.dt();
      });
    }

    for (let i = 0; i < 15; i++) {
      const spark = k.add([
        k.rect(2 + Math.random() * 3, 2 + Math.random() * 3),
        k.pos(cx, cy),
        k.color(k.rgb(255, 255, 180)),
        k.opacity(1),
        k.lifespan(0.9 + Math.random() * 0.5, { fade: 0.5 }),
        k.z(15),
        {
          vx: (Math.random() - 0.5) * 300,
          vy: -60 - Math.random() * 120,
          grav: 200,
        },
      ]);
      spark.onUpdate(() => {
        spark.pos.x += spark.vx * k.dt();
        spark.pos.y += spark.vy * k.dt();
        spark.vy += spark.grav * k.dt();
      });
    }

    for (let i = 0; i < 10; i++) {
      k.wait(0.3 + Math.random() * 0.3, () => {
        const smoke = k.add([
          k.circle(6 + Math.random() * 6),
          k.pos(cx + (Math.random() - 0.5) * 40, cy),
          k.color(k.rgb(80, 80, 80)),
          k.opacity(0.6),
          k.lifespan(1.2, { fade: 0.9 }),
          k.z(13),
          { vy: -30 - Math.random() * 30, vx: (Math.random() - 0.5) * 30 },
        ]);
        smoke.onUpdate(() => {
          smoke.pos.y += smoke.vy * k.dt();
          smoke.pos.x += smoke.vx * k.dt();
        });
      });
    }

    k.wait(0.08, () => {
      if (!wagon.exists()) return;
      if (wagon.passengerEntity && wagon.passengerEntity.exists()) {
        k.destroy(wagon.passengerEntity);
      }
      let skelSpr = "skeleton";
      if (wagon.rider) {
        skelSpr = wagon.rider.skelSprite;
        if (!wagon.rider.isSkeleton) {
          wagon.rider.isSkeleton = true;
          wagon.rider.sprite = wagon.rider.skelSprite;
        }
      }
      const skel = k.add([
        k.sprite(skelSpr),
        k.pos(wagon.pos.x + 16, wagon.pos.y - 40),
        k.z(7),
        "passenger",
        { wagon, currentType: "skeleton" },
      ]);
      wagon.passengerEntity = skel;
      wagon.parts.push(skel);

      const ghost = k.add([
        k.sprite("skeleton"),
        k.pos(wagon.pos.x + 16, wagon.pos.y - 30),
        k.area({ shape: new k.Rect(k.vec2(2, 4), 24, 40) }),
        k.opacity(0.55),
        k.z(5),
        "ghost",
        { vx: -60 - Math.random() * 40, vy: -30, born: k.time() },
      ]);
      ghost.onUpdate(() => {
        ghost.pos.x += ghost.vx * k.dt();
        ghost.pos.y += ghost.vy * k.dt();
        ghost.vy += 100 * k.dt();
        if (ghost.pos.y > (GROUND_ROW - 2) * TILE) {
          ghost.pos.y = (GROUND_ROW - 2) * TILE;
          ghost.vy = 0;
        }
        ghost.opacity = Math.max(0, 0.55 - (k.time() - ghost.born) / 4);
        if (k.time() - ghost.born > 3.5 || ghost.pos.x < -60) k.destroy(ghost);
      });
    });
  }

  function tryBoardWagon(p) {
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

    if (closest.passengerEntity) {
      k.destroy(closest.passengerEntity);
    }
    const visibleSprite = p.isSkeleton ? p.skelSprite : p.normalSprite;
    const rider = k.add([
      k.sprite(visibleSprite),
      k.pos(closest.pos.x + 16, closest.pos.y - 40),
      k.z(7),
      "passenger",
      { wagon: closest, isPlayerRider: true },
    ]);
    closest.passengerEntity = rider;
    closest.parts.push(rider);
    closest.passenger = p.isSkeleton ? "skeleton" : "human";
    audio.board();
  }

  function exitWagon(p) {
    const w = p.ridingWagon;
    if (!w) return;
    p.ridingWagon = null;
    w.rider = null;
    p.opacity = 1;
    p.pos.x = w.pos.x + 70;
    p.pos.y = w.pos.y - 44;
    if (w.passengerEntity && w.passengerEntity.exists()) {
      k.destroy(w.passengerEntity);
      w.passengerEntity = null;
    }
    w.passenger = "empty";
    if (p.isSkeleton) {
      p.sprite = p.skelSprite;
    }
  }

  return {
    drawWagonBody,
    spawnWagon,
    transformToSkeleton,
    reviveFromSkeleton,
    collectCoin,
    tryBoardWagon,
    exitWagon,
  };
}
