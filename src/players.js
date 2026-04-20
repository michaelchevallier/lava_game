import { TILE, GROUND_ROW, SPEED, JUMP, WAGON_JUMP, gridKey } from "./constants.js";
import { getAvatarById } from "./avatars.js";

export function createPlayerSystem({
  k, gameState, audio, tileMap, tryBoardWagon, exitWagon, spawnWagon,
}) {
  const PLAYER_CONFIGS = [
    {
      x: 80,
      sprite: "player",
      skelSprite: "player_skel",
      name: "Mario",
      color: k.rgb(230, 57, 70),
      keys: { left: ["a", "q"], right: "d", jump: ["space", "z"], board: "e" },
      sizeMult: 1.5,
      hitbox: [8, 6, 24, 54],
    },
    {
      x: 180,
      sprite: "pika",
      skelSprite: "pika_skel",
      name: "Pika",
      color: k.rgb(255, 210, 63),
      keys: { left: "j", right: "l", jump: "i", board: "o" },
      sizeMult: 1.3,
      hitbox: [8, 6, 24, 54],
    },
    {
      x: 280,
      sprite: "luigi",
      skelSprite: "luigi_skel",
      name: "Luigi",
      color: k.rgb(124, 201, 71),
      keys: { left: "left", right: "right", jump: "up", board: "enter" },
    },
    {
      x: 380,
      sprite: "toad",
      skelSprite: "toad_skel",
      name: "Toad",
      color: k.rgb(255, 76, 109),
      keys: { left: "f", right: "h", jump: "t", board: "g" },
    },
  ];

  function getEntityTile(e, footY = 42) {
    const col = Math.floor((e.pos.x + 14) / TILE);
    const row = Math.floor((e.pos.y + footY) / TILE);
    return tileMap.get(gridKey(col, row)) || null;
  }

  function applyTileEffectToPlayer(p, tile) {
    if (!tile) return;
    const now = k.time();
    const spam = p._tileSpam || {};
    if ((spam[tile.tileType] || 0) > now) return;
    spam[tile.tileType] = now + 0.15;
    p._tileSpam = spam;

    switch (tile.tileType) {
      case "lava":
        if (p.cascadeUntil && now < p.cascadeUntil) break;
        if (Math.random() < 0.4) {
          k.add([
            k.circle(2 + Math.random() * 3),
            k.pos(p.pos.x + 6 + Math.random() * 16, p.pos.y + 38),
            k.color(255, 200, 80),
            k.opacity(0.9),
            k.lifespan(0.6, { fade: 0.4 }),
            k.z(10),
            k.move(k.UP, 50 + Math.random() * 40),
          ]);
        }
        break;
      case "water":
        p.refreshUntil = now + 2;
        if (tile.cascadeActive) {
          p.cascadeUntil = now + 2;
        }
        audio.splash();
        break;
      case "boost": {
        const base = Math.max(p.boostUntil || 0, now);
        p.boostUntil = Math.min(base + 0.6, now + 3);
        audio.boost();
        break;
      }
      case "trampoline":
        if (p.isGrounded() && !(p._trampCd > now)) {
          p._trampCd = now + 0.3;
          p.jump(850);
          audio.boost();
          for (let i = 0; i < 6; i++) {
            const a = (Math.PI * 2 * i) / 6;
            k.add([
              k.circle(2 + Math.random() * 2),
              k.pos(p.pos.x + 14, p.pos.y + 40),
              k.color(255, 100, 180),
              k.opacity(1),
              k.lifespan(0.3, { fade: 0.2 }),
              k.z(8),
              "particle",
              { vx: Math.cos(a) * 60, vy: Math.sin(a) * 60 - 20 },
            ]);
          }
        }
        break;
      case "ice": {
        const iceBase = Math.max(p.iceUntil || 0, now);
        p.iceUntil = Math.min(iceBase + 0.4, now + 2);
        break;
      }
      case "portal":
        if (tile.pair && !(tile.cooldownUntil > now)) {
          tile.cooldownUntil = now + 0.5;
          tile.pair.cooldownUntil = now + 0.5;
          p.pos.x = tile.pair.pos.x - TILE / 2 + 8;
          p.pos.y = tile.pair.pos.y - TILE;
          audio.combo();
          window.__juice?.dirShake(1, 0, 3, 0.12);
          const destX = tile.pair.pos.x;
          const destY = tile.pair.pos.y;
          const srcColor = tile.portalColor === "A" ? k.rgb(80, 220, 240) : k.rgb(240, 80, 220);
          const dstColor = tile.portalColor === "A" ? k.rgb(240, 80, 220) : k.rgb(80, 220, 240);
          for (let i = 0; i < 10; i++) {
            const a = (Math.PI * 2 * i) / 10;
            k.add([
              k.circle(2 + Math.random() * 2),
              k.pos(tile.pos.x, tile.pos.y),
              k.color(srcColor),
              k.opacity(1),
              k.lifespan(0.4, { fade: 0.3 }),
              k.z(12),
              "particle",
              { vx: Math.cos(a) * 80, vy: Math.sin(a) * 80 },
            ]);
            k.add([
              k.circle(2 + Math.random() * 2),
              k.pos(destX, destY),
              k.color(dstColor),
              k.opacity(1),
              k.lifespan(0.4, { fade: 0.3 }),
              k.z(12),
              "particle",
              { vx: Math.cos(a) * 80, vy: Math.sin(a) * 80 },
            ]);
          }
        }
        break;
    }
  }

  function createPlayer(opts, mobileP1 = false) {
    const mult = opts.sizeMult || 1.5;
    // Hitbox custom par avatar : les sprites 20×30 (Mario/Luigi/Toad) ont un hitbox plus
    // grand pour poser les pieds au sol. Les autres (14×22) gardent le default.
    const hb = opts.hitbox || [2, 4, 24, 40];
    const p = k.add([
      k.sprite(opts.sprite),
      k.pos(opts.x, (GROUND_ROW - 3) * TILE),
      k.area({ shape: new k.Rect(k.vec2(hb[0], hb[1]), hb[2], hb[3]) }),
      k.scale(mult),
      k.body(),
      k.anchor("topleft"),
      k.z(6),
      "player",
      {
        facing: "right",
        isSkeleton: false,
        ridingWagon: null,
        normalSprite: opts.sprite,
        skelSprite: opts.skelSprite,
        playerName: opts.name,
        nameColor: opts.color || k.rgb(255, 255, 255),
        sizeMult: mult,
      },
    ]);
    p.onDraw(() => {
      if (p.ridingWagon) return;
      const nx = 14;
      const ny = -10;
      // outline
      for (const [dx, dy] of [[-1,0],[1,0],[0,-1],[0,1]]) {
        k.drawText({ text: opts.name, size: 9, pos: k.vec2(nx + dx, ny + dy), anchor: "center", color: k.rgb(0, 0, 0) });
      }
      k.drawText({ text: opts.name, size: 9, pos: k.vec2(nx, ny), anchor: "center", color: opts.color });
    });

    // Walk animation: squash/stretch bob quand le joueur bouge (horiz), hop subtil en idle.
    p._walkPhase = 0;
    p.onUpdate(() => {
      if (p.ridingWagon) return;
      const moving = Math.abs(p.lastVx || 0) > 10;
      if (moving) {
        p._walkPhase += k.dt() * 14;
        const bob = Math.sin(p._walkPhase);
        p.scale = k.vec2(mult * (1 + bob * 0.06), mult * (1 - bob * 0.08));
      } else {
        p._walkPhase = 0;
        const idle = Math.sin(k.time() * 2.5) * 0.015;
        p.scale = k.vec2(mult, mult * (1 + idle));
      }
      p.lastVx = 0;
    });

    function playerSpeedMult() {
      const now = k.time();
      if (p.boostUntil && now < p.boostUntil) return 1.5;
      if (p.cascadeUntil && now < p.cascadeUntil) return 1.4;
      if (p.refreshUntil && now < p.refreshUntil) return 1.2;
      return 1;
    }

    k.onKeyDown(opts.keys.left, () => {
      if (p.ridingWagon) {
        p.ridingWagon._riderInput = "left";
        return;
      }
      p.move(-SPEED * playerSpeedMult(), 0);
      p.lastVx = -SPEED * playerSpeedMult();
      if (p.facing !== "left") {
        p.flipX = true;
        p.facing = "left";
      }
    });
    k.onKeyDown(opts.keys.right, () => {
      if (p.ridingWagon) {
        p.ridingWagon._riderInput = "right";
        return;
      }
      p.move(SPEED * playerSpeedMult(), 0);
      p.lastVx = SPEED * playerSpeedMult();
      if (p.facing !== "right") {
        p.flipX = false;
        p.facing = "right";
      }
    });
    k.onKeyPress(opts.keys.jump, () => {
      if (p.ridingWagon) {
        if (p.ridingWagon.isGrounded()) {
          p.ridingWagon.jump(WAGON_JUMP);
          audio.jump();
        }
        return;
      }
      if (p.isGrounded()) {
        p.jump(JUMP);
        audio.jump();
      } else if (p.geyserJump) {
        p.geyserJump = false;
        p.jump(JUMP);
        audio.jump();
        k.add([
          k.circle(6),
          k.pos(p.pos.x + 14, p.pos.y + 44),
          k.anchor("center"),
          k.color(k.rgb(80, 200, 255)),
          k.opacity(0.8),
          k.lifespan(0.3, { fade: 0.25 }),
          k.z(9),
        ]);
      }
    });
    k.onKeyPress(opts.keys.board, () => {
      if (p.ridingWagon) {
        exitWagon(p);
      } else {
        tryBoardWagon(p);
      }
    });

    const leftKeys = Array.isArray(opts.keys.left) ? opts.keys.left : [opts.keys.left];
    const rightKeys = Array.isArray(opts.keys.right) ? opts.keys.right : [opts.keys.right];

    p.onUpdate(() => {
      if (p.ridingWagon) return;

      // Landing dust puff: detect transition airborne -> grounded
      const grounded = p.isGrounded();
      if (grounded && p._wasAirborne && p._airTime > 0.18) {
        for (let i = 0; i < 5; i++) {
          const sgn = i < 2 ? -1 : (i > 2 ? 1 : 0);
          k.add([
            k.circle(2 + Math.random() * 1.5),
            k.pos(p.pos.x + 14 + sgn * (4 + Math.random() * 6), p.pos.y + 40),
            k.color(220, 200, 170),
            k.opacity(0.7),
            k.lifespan(0.35, { fade: 0.25 }),
            k.z(4),
            "particle",
            { vx: sgn * (30 + Math.random() * 20), vy: -10 - Math.random() * 15 },
          ]);
        }
      }
      p._wasAirborne = !grounded;
      p._airTime = grounded ? 0 : (p._airTime || 0) + k.dt();

      const footTile = getEntityTile(p);
      const centerTile = getEntityTile(p, 22);
      const activeTile = (centerTile?.tileType === "portal") ? centerTile : footTile;
      applyTileEffectToPlayer(p, activeTile);
      const now2 = k.time();
      if (p.iceUntil && now2 < p.iceUntil && p.lastVx) {
        const noInput = leftKeys.every(k2 => !k.isKeyDown(k2)) && rightKeys.every(k2 => !k.isKeyDown(k2));
        if (noInput) p.move(p.lastVx, 0);
      }
      if (p.boostUntil && k.time() < p.boostUntil && Math.random() < 0.5) {
        k.add([
          k.circle(2 + Math.random() * 2),
          k.pos(p.pos.x + 4 + Math.random() * 20, p.pos.y + 30 + Math.random() * 12),
          k.color(255, 210, 60),
          k.opacity(0.85),
          k.lifespan(0.25, { fade: 0.2 }),
          k.z(5),
          "particle-x",
          { vx: (p.facing === "right" ? -1 : 1) * (40 + Math.random() * 30) },
        ]);
      }
      // Geyser: arme double-jump si joueur dans la colonne du geyser
      {
        const pCol = Math.floor((p.pos.x + 14) / TILE);
        const pRow = Math.floor((p.pos.y + 22) / TILE);
        let inGeyser = false;
        for (const g of gameState.geysers || []) {
          if (g.col === pCol && pRow >= g.fanRow - 3 && pRow <= g.row) {
            inGeyser = true;
            break;
          }
        }
        if (inGeyser && !p.isGrounded()) {
          p.geyserJump = true;
        } else if (!inGeyser) {
          p.geyserJump = false;
        }
      }
    });

    if (mobileP1) {
      const mi = window.__mobileInput;
      let prevJump = false;
      let prevWagon = false;
      k.onUpdate(() => {
        if (mi.left) {
          if (p.ridingWagon) {
            p.ridingWagon._riderInput = "left";
          } else {
            p.move(-SPEED * playerSpeedMult(), 0);
            if (p.facing !== "left") { p.flipX = true; p.facing = "left"; }
          }
        }
        if (mi.right) {
          if (p.ridingWagon) {
            p.ridingWagon._riderInput = "right";
          } else {
            p.move(SPEED * playerSpeedMult(), 0);
            if (p.facing !== "right") { p.flipX = false; p.facing = "right"; }
          }
        }
        if (mi.jumpPressed && !prevJump) {
          if (p.ridingWagon) {
            if (p.ridingWagon.isGrounded()) { p.ridingWagon.jump(WAGON_JUMP); audio.jump(); }
          } else if (p.isGrounded()) {
            p.jump(JUMP);
            audio.jump();
          } else if (p.geyserJump) {
            p.geyserJump = false;
            p.jump(JUMP);
            audio.jump();
          }
        }
        if (mi.wagonPressed && !prevWagon) {
          spawnWagon();
        }
        prevJump = mi.jumpPressed;
        prevWagon = mi.wagonPressed;
      });
    }

    return p;
  }

  function buildConfigWithAvatar(baseConfig, avatarId) {
    if (!avatarId) return baseConfig;
    const avatar = getAvatarById(avatarId);
    const sprite = avatar.origSprite || "player";
    const skelSprite = avatar.skelSprite || "player_skel";
    const colorHex = avatar.color;
    const r = parseInt(colorHex.slice(1, 3), 16);
    const g = parseInt(colorHex.slice(3, 5), 16);
    const b = parseInt(colorHex.slice(5, 7), 16);
    return {
      ...baseConfig,
      sprite,
      skelSprite,
      name: avatar.name,
      color: k.rgb(r, g, b),
      sizeMult: avatar.sizeMult || 1.5,
      hitbox: avatar.hitbox,
    };
  }

  function spawnPlayers(numPlayers, mobileP1 = false, avatarIds = {}) {
    const arr = [];
    for (let i = 0; i < numPlayers; i++) {
      const slot = `p${i + 1}`;
      const config = buildConfigWithAvatar(PLAYER_CONFIGS[i], avatarIds[slot]);
      arr.push(createPlayer(config, mobileP1 && i === 0));
    }
    return arr;
  }

  return { spawnPlayers, getEntityTile, applyTileEffectToPlayer, PLAYER_CONFIGS };
}
