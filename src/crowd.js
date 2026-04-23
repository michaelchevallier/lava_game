import { GROUND_ROW, WIDTH, TILE, WORLD_COLS } from "./constants.js";

const WORLD_W = WORLD_COLS * TILE;

const MAX_CROWD = 12;

export function createCrowdSystem({ k, gameState }) {
  let lastSpawn = 0;

  function spawnCrowdMember() {
    if (k.get("crowd").length >= MAX_CROWD) return;
    const tint = [
      80 + Math.random() * 175,
      80 + Math.random() * 175,
      80 + Math.random() * 175,
    ];
    const dir = Math.random() < 0.5 ? -1 : 1;
    // Spawn autour de la caméra (monde étendu) ±(WIDTH/2 + 30)
    const camX = k.camPos?.().x ?? WIDTH / 2;
    const startX = dir === 1 ? camX - WIDTH / 2 - 30 : camX + WIDTH / 2 + 30;
    const c = k.add([
      k.sprite("human"),
      k.pos(startX, (GROUND_ROW - 3) * TILE),
      k.color(k.rgb(tint[0], tint[1], tint[2])),
      k.area({ shape: new k.Rect(k.vec2(2, 4), 24, 40), collisionIgnore: ["crowd", "visitor", "wagon", "wagon-part", "passenger", "player", "ghost", "ground_tile", "tile", "skull-target", "skull-part", "rain-coin"] }),
      k.anchor("topleft"),
      k.z(5),
      "crowd",
      { walkSpeed: 20 + Math.random() * 10, dir, panicUntil: 0, _vy: 0, _grounded: false },
    ]);
    c.isGrounded = () => c._grounded;
    c.jump = (force) => { c._vy = -force; c._grounded = false; };
  }

  function setup() {
    k.loop(0.5, () => {
      if (gameState.score >= 200 && k.time() - lastSpawn > 8) {
        spawnCrowdMember();
        lastSpawn = k.time();
      }
    });

    k.onUpdate("crowd", (v) => {
      // Manual gravity (no body component → zero physics push)
      v._vy += 1800 * k.dt();
      v.pos.y += v._vy * k.dt();
      const groundY = GROUND_ROW * TILE;
      if (v.pos.y + 44 >= groundY) {
        v.pos.y = groundY - 44;
        v._vy = 0;
        v._grounded = true;
      } else {
        v._grounded = false;
      }

      const isPanic = v.panicUntil > k.time();
      const isCheering = v.cheerUntil > k.time();
      const speed = isPanic ? v.walkSpeed * 1.5 : (isCheering ? 0 : v.walkSpeed);
      v.move(v.dir * speed, 0);

      if (isPanic) {
        const shake = Math.sin(k.time() * 30) * 1.5;
        v.pos.x += shake * k.dt() * 60;
      }
      if (isCheering && v.isGrounded()) {
        const beat = Math.floor(k.time() * 3);
        if (beat !== v._lastCheerBeat) {
          v._lastCheerBeat = beat;
          v.jump(200);
        }
      }

      if (v.pos.x < -WORLD_W - 40) v.dir = 1;
      if (v.pos.x > WORLD_W + 40) v.dir = -1;

      gameState.score += 0.1 * k.dt();
    });

    k.add([
      k.pos(0, 0),
      k.z(40),
      {
        draw() {
          for (const v of k.get("crowd")) {
            if (!(v.cheerUntil > k.time())) continue;
            k.drawText({
              text: "BRAVO!",
              size: 10,
              pos: k.vec2(v.pos.x + 14, v.pos.y - 14),
              anchor: "center",
              color: k.rgb(255, 230, 80),
            });
          }
        },
      },
    ]);

    return {
      onApocalypse() {
        for (const v of k.get("crowd")) {
          if (v.isGrounded()) v.jump(400);
          v.cheerUntil = k.time() + 3;
        }
      },
      onSkeletonSpawn(pos) {
        for (const v of k.get("crowd")) {
          const d = v.pos.dist(pos);
          if (d < 200) {
            v.panicUntil = k.time() + 2;
            v.dir = pos.x > v.pos.x ? -1 : 1;
          }
        }
      },
    };
  }

  return { setup, spawnCrowdMember };
}
