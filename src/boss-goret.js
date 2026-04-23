import { TILE, GROUND_ROW, WIDTH } from "./constants.js";

export function createBossGoret({
  k, audio, gameState, juice, showPopup, placeTile, tileMap,
  getActivePlayers, getWagons, isCampaign,
}) {
  if (isCampaign?.()) {
    const api = {
      tryThrowCoin: () => false,
      __debug: () => ({ active: false, hp: 0, position: null, cooldown: 0, targetWagonId: null }),
    };
    window.__bossGoret = api;
    return api;
  }

  let active = null;
  let nextSpawnAt = k.time() + 60 + Math.random() * 10;
  const SPAWN_COOLDOWN = 240;
  const RETRY_COOLDOWN = 120;

  function scoreWagon(w) {
    if (!w.passengers) return 0;
    const humans = w.passengers.filter((p) => p.type === "human").length;
    const skels = w.passengers.filter((p) => p.type === "skeleton").length;
    return humans * 2 + skels + (w.isGolden ? 5 : 0);
  }

  function pickTargetWagon() {
    const wagons = getWagons().filter(
      (w) => !w.ghostTrain && !w.inverseTrain && !w.isSpectral && !w.isRace,
    );
    if (wagons.length === 0) return null;
    wagons.sort((a, b) => scoreWagon(b) - scoreWagon(a));
    return wagons[0];
  }

  function spawnBoss() {
    const target = pickTargetWagon();
    if (!target) { nextSpawnAt = k.time() + 15; return; }
    const fromLeft = Math.random() < 0.5;
    const startX = fromLeft ? -60 : WIDTH + 60;
    const dir = fromLeft ? 1 : -1;
    const y = (GROUND_ROW - 1) * TILE - 28;

    const boss = k.add([
      k.sprite("boss_goret_a"),
      k.pos(startX, y),
      k.area({ shape: new k.Rect(k.vec2(0, 0), 40, 28) }),
      k.anchor("topleft"),
      k.z(7),
      "boss-goret",
    ]);
    boss.hp = 3;
    boss.dir = dir;
    boss.targetWagon = target;
    boss.fleeing = false;
    boss._flashUntil = 0;
    boss._stunnedWagonOnce = false;
    boss.flipX = dir < 0;

    boss.onUpdate(() => {
      const t = k.time();
      const frameIdx = Math.floor(t / 0.18) % 2;
      boss.sprite = frameIdx === 0 ? "boss_goret_a" : "boss_goret_b";
      if (boss._flashUntil > t) {
        boss.color = k.rgb(255, 255, 255);
      } else {
        boss.color = k.rgb(255, 180, 200);
      }

      const speed = boss.fleeing ? 260 : 180;
      boss.pos.x += boss.dir * speed * k.dt();

      if (boss.pos.x < -120 || boss.pos.x > WIDTH + 120) {
        endBoss(false, null);
      }
    });

    boss.onCollide("wagon", (w) => {
      if (boss.fleeing || boss._stunnedWagonOnce) return;
      if (w !== boss.targetWagon) return;
      boss._stunnedWagonOnce = true;
      w.frozenUntil = k.time() + 3;
      gameState.score = Math.max(0, gameState.score - 50);
      showPopup(WIDTH / 2, 120, "BOSS GORET !", k.rgb(255, 60, 60), 36);
      juice.dirShake?.(boss.dir, 0, 10, 0.3);
      audio.transform();
      boss.fleeing = true;
      boss.dir = -boss.dir;
    });

    active = { boss, spawnAt: k.time() };
    audio.boss?.() || audio.crack?.();
    showPopup(Math.min(Math.max(startX + 20, 60), WIDTH - 60), 80, "BOSS GORET !", k.rgb(255, 80, 180), 28);
  }

  function hitBoss(fromPlayer) {
    if (!active) return;
    const b = active.boss;
    if (!b.exists?.()) return;
    b.hp -= 1;
    b._flashUntil = k.time() + 0.15;
    audio.crack?.() || audio.hit?.();
    for (let i = 0; i < 15; i++) {
      const a = (Math.PI * 2 * i) / 15;
      k.add([
        k.circle(2 + Math.random() * 2),
        k.pos(b.pos.x + 20, b.pos.y + 14),
        k.color(k.rgb(255, 100 + Math.floor(Math.random() * 80), 200)),
        k.opacity(1),
        k.lifespan(0.5, { fade: 0.3 }),
        k.z(14),
        "particle-grav",
        { vx: Math.cos(a) * 80, vy: Math.sin(a) * 80 - 30, grav: 200 },
      ]);
    }
    if (b.hp <= 0) endBoss(true, fromPlayer);
  }

  function endBoss(vaincu, byPlayer) {
    if (!active) return;
    const b = active.boss;
    const bx = b.exists?.() ? b.pos.x : WIDTH / 2;
    const by = b.exists?.() ? b.pos.y : HEIGHT / 2;
    if (b.exists?.()) k.destroy(b);
    active = null;

    if (vaincu && byPlayer) {
      gameState.score += 250;
      showPopup(bx + 20, by - 40, "+250 BOSS VAINCU !", k.rgb(255, 80, 180), 30);
      audio.apocalypse?.() || audio.combo?.();
      for (const p of getActivePlayers()) {
        if (!p?.exists?.() || p.isSkeleton) continue;
        if (p.pos.x > 0 && p.pos.x < WIDTH) {
          gameState.score += 50;
          showPopup(p.pos.x + 14, p.pos.y - 50, "+50 BONUS", k.rgb(120, 220, 255), 18);
        }
      }
      dropRareTiles(bx, by);
      nextSpawnAt = k.time() + SPAWN_COOLDOWN + (Math.random() - 0.5) * 40;
    } else {
      nextSpawnAt = k.time() + RETRY_COOLDOWN;
    }
  }

  function dropRareTiles(x, y) {
    const DROPS = ["portal", "trampoline"];
    const col0 = Math.floor((x + 20) / TILE);
    const row = GROUND_ROW - 1;
    for (let i = 0; i < DROPS.length; i++) {
      let placed = false;
      for (let offset = 0; offset < 5 && !placed; offset++) {
        const col = col0 + (i === 0 ? -1 - offset : 1 + offset);
        const key = `${col},${row}`;
        if (!tileMap.has(key)) {
          placeTile(col, row, DROPS[i]);
          placed = true;
        }
      }
    }
  }

  function tryThrowCoin(p) {
    if (!active) return false;
    if (!p._coinsPocket || p._coinsPocket <= 0) return false;
    if (p.isSkeleton) return false;
    if (p.stunnedUntil && k.time() < p.stunnedUntil) return false;
    const b = active.boss;
    if (!b.exists?.()) return false;
    p._coinsPocket -= 1;
    spawnCoinProjectile(p, b);
    return true;
  }

  function spawnCoinProjectile(from, boss) {
    const ox = from.pos.x + 14;
    const oy = from.pos.y + 10;
    const tx = boss.pos.x + 20;
    const ty = boss.pos.y + 14;
    const dx = tx - ox;
    const dy = ty - oy;
    const t = Math.max(0.25, Math.abs(dx) / 400);
    const GRAV = 400;
    const vx0 = dx / t;
    const vy0 = dy / t - 0.5 * GRAV * t;
    const proj = k.add([
      k.circle(5),
      k.pos(ox, oy),
      k.area({ shape: new k.Rect(k.vec2(-5, -5), 10, 10) }),
      k.color(k.rgb(255, 220, 60)),
      k.outline(1, k.rgb(180, 130, 0)),
      k.z(14),
      "boss-coin",
    ]);
    proj.vx = vx0;
    proj.vy = vy0;
    proj.life = 0;
    proj.thrower = from;
    proj.onUpdate(() => {
      proj.life += k.dt();
      proj.pos.x += proj.vx * k.dt();
      proj.pos.y += proj.vy * k.dt();
      proj.vy += GRAV * k.dt();
      if (proj.life > 1.5) k.destroy(proj);
    });
    audio.coin?.();
  }

  k.onCollide("boss-coin", "boss-goret", (coin, b) => {
    if (!coin.exists?.() || !b.exists?.()) return;
    k.destroy(coin);
    hitBoss(coin.thrower);
  });

  k.loop(0.1, () => {
    for (const p of getActivePlayers()) {
      if (!p?.exists?.() || p.isSkeleton) continue;
      if ((p._coinsPocket || 0) >= 3) continue;
      for (const c of k.get("coin")) {
        if (c._pocketed) continue;
        const cdx = c.pos.x - (p.pos.x + 14);
        const cdy = c.pos.y - (p.pos.y + 22);
        if (cdx * cdx + cdy * cdy < 18 * 18) {
          c._pocketed = true;
          p._coinsPocket = (p._coinsPocket || 0) + 1;
          audio.pop?.();
          if (c.exists?.()) k.destroy(c);
        }
      }
    }
  });

  function checkTick() {
    const now = k.time();
    if (active) return;
    if (now < nextSpawnAt) return;
    const hasTrainEvent = getWagons().some((w) => w.ghostTrain || w.inverseTrain);
    if (hasTrainEvent) { nextSpawnAt = now + 10; return; }
    spawnBoss();
  }
  k.loop(0.5, checkTick);

  const api = {
    tryThrowCoin,
    __forceSpawn: () => spawnBoss(),
    __debug: () => ({
      active: !!active,
      hp: active?.boss?.hp || 0,
      position: active?.boss?.exists?.() ? { x: active.boss.pos.x, y: active.boss.pos.y } : null,
      cooldown: Math.max(0, nextSpawnAt - k.time()),
      targetWagonId: active?.boss?.targetWagon ? "wagon" : null,
    }),
  };
  return api;
}
