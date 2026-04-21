import { WIDTH, HEIGHT, gridKey } from "./constants.js";

export function createWagonVfx({ k, audio, gameState, tileMap, showPopup, registerKill, registerCoin, onSkeletonTransform }) {
  function collectCoin(c) {
    if (c.collected) return;
    audio.coin();
    const cx = c.pos.x;
    const cy = c.pos.y;
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
        { vx: Math.cos(angle) * 120, vy: Math.sin(angle) * 120 - 40, grav: 250 },
      ]);
    }

    const isCampaign = !!window.__campaign?.getCurrent?.();
    if (isCampaign) {
      c.collected = true;
      c.opacity = 0;
      if (c.extras) c.extras.forEach((e) => { try { e.opacity = 0; } catch (_) {} });
      k.wait(2.5, () => {
        if (!c.exists()) return;
        c.collected = false;
        c.opacity = 1;
        if (c.extras) c.extras.forEach((e) => { try { e.opacity = 1; } catch (_) {} });
      });
    } else {
      if (c.extras) c.extras.forEach((e) => k.destroy(e));
      const key = gridKey(c.gridCol, c.gridRow);
      tileMap.delete(key);
      k.destroy(c);
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
          if (ent?.exists()) ent.sprite = ent.normalSprite || "human";
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
      window.__campaign?.progress?.("revive");
    });
  }

  function transformToSkeleton(wagon) {
    if (!wagon.exists()) return;
    let humansCount = 0;
    for (let i = 0; i < wagon.passengers.length; i++) {
      if (wagon.passengers[i].type === "human") {
        wagon.passengers[i].type = "skeleton";
        const ent = wagon.passengerEntities[i];
        if (ent?.exists()) ent.sprite = ent.skelSprite || "skeleton";
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

    k.add([
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

      k.add([
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

  return { collectCoin, reviveFromSkeleton, triggerCarillon, transformToSkeleton };
}
