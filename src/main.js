import kaplay from "kaplay";

const TILE = 32;
const COLS = 40;
const ROWS = 18;
const GROUND_ROW = 14;
const WIDTH = COLS * TILE;
const HEIGHT = ROWS * TILE;

const k = kaplay({
  canvas: document.getElementById("game"),
  width: WIDTH,
  height: HEIGHT,
  background: [92, 148, 252],
  letterbox: true,
  global: false,
  pixelDensity: 1,
});

k.setGravity(1600);

const PALETTE = {
  ".": null,
  R: "#e63946", r: "#a11a24",
  S: "#ffd4a3", s: "#d9a066",
  K: "#111111", W: "#ffffff",
  B: "#5d2f1e", b: "#2d1408",
  O: "#2d50c5", o: "#1a2f80",
  Y: "#ffd23f", y: "#d99a1c",
  G: "#7cc947", g: "#4e8831",
  M: "#c07437", m: "#6d3d16",
  L: "#ff6b1c", l: "#ffbe3b", F: "#c9341a", f: "#7d1a0d",
  T: "#6b3c1a", t: "#2d1a0a",
  E: "#ffcda8", e: "#d69868",
  H: "#2ecc71", h: "#156b26",
  X: "#f5f2e3", x: "#b8ae93",
  C: "#ffffff", c: "#c8d5e0",
  N: "#3a3a3a", n: "#666666",
  P: "#ff4c6d", p: "#d63a5a",
  Z: "#fff6a8",
  U: "#4fb8e8", u: "#2e7da0",
};

function makeSpriteUrl(rows, scale = 2) {
  const w = rows[0].length;
  const h = rows.length;
  const c = document.createElement("canvas");
  c.width = w * scale;
  c.height = h * scale;
  const ctx = c.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  for (let y = 0; y < h; y++) {
    const row = rows[y];
    for (let x = 0; x < w; x++) {
      const ch = row[x] || ".";
      const color = PALETTE[ch];
      if (!color) continue;
      ctx.fillStyle = color;
      ctx.fillRect(x * scale, y * scale, scale, scale);
    }
  }
  return c.toDataURL();
}

const SPR_PLAYER = [
  "....RRRRRR....",
  "...RRRRRRRR...",
  "..RRrRRRRrRR..",
  "..RRrRRRRrRR..",
  ".bBSSSSSSSSBb.",
  ".BSSSSSSSSSSB.",
  "..SSKSSSSKSS..",
  "..SSKSSSSKSS..",
  "..SSSSSSSSSS..",
  "..SSBBBBBBSS..",
  "..SSSSSSSSSS..",
  "..OOOOOOOOOO..",
  "..OYOOOOOOYO..",
  "..OOOOOOOOOO..",
  ".OOORRRRRROOO.",
  ".OOOOOOOOOOOO.",
  "..OOOOOOOOOO..",
  "..OOSSSSSSOO..",
  "..OOS....SOO..",
  "..BB......BB..",
  ".BBB......BBB.",
  ".BBB......BBB.",
];

const SPR_PLAYER_SKEL = [
  "....RRRRRR....",
  "...RRRRRRRR...",
  "..RRrRRRRrRR..",
  "..RRrRRRRrRR..",
  ".bXXXXXXXXXXb.",
  ".XXXXXXXXXXXX.",
  "..XXKKXXKKXX..",
  "..XXKKXXKKXX..",
  "..XXXXKKXXXX..",
  "..XXKxKxKxXX..",
  "...XXXXXXXX...",
  "..XXXXXXXXXX..",
  ".XXKXXXXXXKXX.",
  ".XXKXXXXXXKXX.",
  ".XXXKKKKKKXXX.",
  "..XXXXXXXXXX..",
  "...XXXXXXXX...",
  "..XXXX..XXXX..",
  "..XXX....XXX..",
  "..XXX....XXX..",
  ".XXXX....XXXX.",
  ".XXXX....XXXX.",
];

const SPR_PIKA = [
  "..KK......KK..",
  ".KKKK....KKKK.",
  "YKKKK....KKKKY",
  "YYKKK....KKKYY",
  ".YYYYYYYYYYYY.",
  "YYYYYYYYYYYYYY",
  "YYKKYYYYYYKKYY",
  "YYKKYYYYYYKKYY",
  "YYYPPYYYYPPYYY",
  "YYYPPYYYYPPYYY",
  "YYYYKKKKKKYYYY",
  "YYYYYYYYYYYYYY",
  "YYYYYYYYYYYYYY",
  "YYYYYYYYYYYYYY",
  "YYYYYYYYYYYYYY",
  ".YYYYYYYYYYYY.",
  ".YYYYYYYYYYYY.",
  "..YYYY..YYYY..",
  "..BBB....BBB..",
  "..BBB....BBB..",
  ".BBBB....BBBB.",
  ".BBBB....BBBB.",
];

const SPR_PIKA_SKEL = [
  "..KK......KK..",
  ".KKKK....KKKK.",
  "XKKKK....KKKKX",
  "XXKKK....KKKXX",
  ".XXXXXXXXXXXX.",
  "XXXXXXXXXXXXXX",
  "XXKKXXXXXXKKXX",
  "XXKKXXXXXXKKXX",
  "XXXXKKKKKKXXXX",
  "XXXXXKKKKXXXXX",
  "XXKXKXKXKXKXXX",
  "XXXXXXXXXXXXXX",
  "XXXKKKKKKKKXXX",
  "XXXXXXXXXXXXXX",
  "XXKXXXXXXXXKXX",
  "XXKXXXXXXXXKXX",
  "XXXKKKKKKKKXXX",
  "..XXXXXXXXXX..",
  "..XXX....XXX..",
  "..XXX....XXX..",
  ".XXXX....XXXX.",
  ".XXXX....XXXX.",
];

const SPR_HUMAN = [
  "....EEEEEE....",
  "...EEEEEEEE...",
  "..BBBBBBBBBB..",
  "..EEEEEEEEEE..",
  "..EEKEEEEKEE..",
  "..EEKEEEEKEE..",
  "..EEEEEEEEEE..",
  "..EEEErrEEEE..",
  "..EEEERREEEE..",
  "...EEEEEEEE...",
  "..HHHHHHHHHH..",
  ".HHHHHHHHHHHH.",
  ".HHHHHHHHHHHH.",
  "HHHHHHHHHHHHHH",
  "HHHHHHHHHHHHHH",
  "HHHHYYYYYYHHHH",
  ".HHHHHHHHHHHH.",
  "..HHEEEEEEHH..",
  "..OO......OO..",
  "..OO......OO..",
  ".BBB......BBB.",
  ".BBB......BBB.",
];

const SPR_SKELETON = [
  "....XXXXXX....",
  "...XXXXXXXX...",
  "..XXXXXXXXXX..",
  "..XXXXXXXXXX..",
  "..XXKKXXKKXX..",
  "..XXKKXXKKXX..",
  "..XXxXXXXxXX..",
  "..XXXXKKXXXX..",
  "..XXKxKKxKXX..",
  "..XXKxKKxKXX..",
  "...XxxxxxxX...",
  "....XXXXXX....",
  "..XXXXXXXXXX..",
  ".XXXKXXXXKXXX.",
  ".XXXKXXXXKXXX.",
  ".XXXXKKKKXXXX.",
  "..XXXXXXXXXX..",
  "...XXXXXXXX...",
  "..XXX....XXX..",
  "..XXX....XXX..",
  "..XXX....XXX..",
  "..XXXX..XXXX..",
];

const SPR_GROUND_TOP = [
  "gGgGgGgGgGgGgGgG",
  "GGGGGGGGGGGGGGGG",
  "gGgGgGgGgGgGgGgG",
  "mMMMMMMMMMMMMMMm",
  "MMmMMMMMMmMMMMmM",
  "MMmMMMMMMmMMMMmM",
  "MMmMMMMMMmMMMMmM",
  "MMmMMMMMMmMMMMmM",
  "MMMMMMMMMMMMMMMM",
  "mmMMMMmmMMMMmmMM",
  "MMMMMMMMMMMMMMMM",
  "MMMMmMMMMMMMmMMM",
  "MMMMmMMMMMMMmMMM",
  "MMMMmMMMMMMMmMMM",
  "MMMMmMMMMMMMmMMM",
  "mMMMMMMMMMMMMMMm",
];

const SPR_GROUND = [
  "MMMMmMMMMMMMmMMM",
  "MMMMmMMMMMMMmMMM",
  "MMMMmMMMMMMMmMMM",
  "mMMMMMMMMMMMMMMm",
  "MMmMMMMMMmMMMMMM",
  "MMmMMMMMMmMMMMMM",
  "MMmMMMMMMmMMMMMM",
  "MMmMMMMMMmMMMMMM",
  "mMMMMMMMMMMMMMMm",
  "MMMMMMMmMMMMMMMM",
  "MMMMMMMmMMMMMMMM",
  "MMMMMMMmMMMMMMMM",
  "MMMMMMMmMMMMMMMM",
  "MMMMMMMmMMMMMMMM",
  "mMMMMMMMMMMMMMMm",
  "mMMMMMMMMMMMMMMm",
];

const SPR_LAVA = [
  "FFLLLLLLLLLLLLFF",
  "FLLLllllllllLLLF",
  "FLlllLLLLLLlllLF",
  "LllLLLLLFFLLLllL",
  "LllLFFLLLLLFFllL",
  "LllLLLlllllLLllL",
  "LllllllllllllllL",
  "LLllllllllllllLL",
  "FLLLllllllllLLLF",
  "FFLLLLLLLLLLLLFF",
  "FLllllllllllllLF",
  "LllLLLLllLLLLllL",
  "LllLFFLLLLFFLllL",
  "FLLLLllllllLLLLF",
  "FLlllllllllllllF",
  "FFFLLLLLLLLLLFFF",
];

const SPR_LAVA2 = [
  "FFFLLLLLLLLLLFFF",
  "FLlllllllllllllF",
  "FLLLLllllllLLLLF",
  "LllLFFLLLLFFLllL",
  "LllLLLLllLLLLllL",
  "FLllllllllllllLF",
  "FFLLLLLLLLLLLLFF",
  "FLLLllllllllLLLF",
  "LLllllllllllllLL",
  "LllllllllllllllL",
  "LllLLlllllLLLllL",
  "LllLFFLLLLLFFllL",
  "LllLLLLLFFLLLllL",
  "FLlllLLLLLLlllLF",
  "FLLLllllllllLLLF",
  "FFLLLLLLLLLLLLFF",
];

const SPR_WATER = [
  "UUUUUUUUUUUUUUUU",
  "UUuuUUUUUUUUuuUU",
  "UUUUuuUUUUuuUUUU",
  "UUUUUUUUUUUUUUUU",
  "UUUUUUUUUUUUUUUU",
  "UUuUUUUUUUUUUuUU",
  "UUUUuuUUUUuuUUUU",
  "UUUUUUUUUUUUUUUU",
  "UUUUUUUUUUUUUUUU",
  "UUuuUUUUUUUUuuUU",
  "UUUUuuUUUUuuUUUU",
  "UUUUUUUUUUUUUUUU",
  "UUUUUUUUUUUUUUUU",
  "UuUUUUUUUUUUUUuU",
  "UUUUuuUUUUuuUUUU",
  "UUUUUUUUUUUUUUUU",
];

const SPR_WATER2 = [
  "UUUUUUUUUUUUUUUU",
  "UUUUUUUUUUUUUUUU",
  "UUuuUUUUUUUUuuUU",
  "UUUUuuUUUUuuUUUU",
  "UUUUUUUUUUUUUUUU",
  "UUUUUUUUUUUUUUUU",
  "UUuUUUUUUUUUUuUU",
  "UUUUuuUUUUuuUUUU",
  "UUUUUUUUUUUUUUUU",
  "UUUUUUUUUUUUUUUU",
  "UUuuUUUUUUUUuuUU",
  "UUUUuuUUUUuuUUUU",
  "UUUUUUUUUUUUUUUU",
  "UUUUUUUUUUUUUUUU",
  "UuUUUUUUUUUUUUuU",
  "UUUUuuUUUUuuUUUU",
];

const SPR_CLOUD = [
  ".....cccccc.........",
  "...ccCCCCCCcc.......",
  "..cCCCCCCCCCCc......",
  ".cCCCCCCCCCCCCc.....",
  "cCCCCCCCCCCCCCCc....",
  "cCCCCCCCCCCCCCCCcc..",
  ".cCCCCCCCCCCCCCCCc..",
  "..ccCCCCCCCCCCCCcc..",
  "....ccccCCCCcccc....",
  ".......cccc.........",
];

const SPR_HILL = [
  "........gggggg........",
  ".....ggggGGGGgggg.....",
  "...ggGGGGGGGGGGGGgg...",
  "..gGGGGGGGGGGGGGGGGg..",
  ".gGGGGGGGGGGGGGGGGGGg.",
  "gGGGGGGGGGGGGGGGGGGGGg",
  "gGGGGGGGGGGGGGGGGGGGGg",
  "gGGGGGGGGGGGGGGGGGGGGg",
];

Promise.all([
  k.loadSprite("player", makeSpriteUrl(SPR_PLAYER, 2)),
  k.loadSprite("player_skel", makeSpriteUrl(SPR_PLAYER_SKEL, 2)),
  k.loadSprite("pika", makeSpriteUrl(SPR_PIKA, 2)),
  k.loadSprite("pika_skel", makeSpriteUrl(SPR_PIKA_SKEL, 2)),
  k.loadSprite("human", makeSpriteUrl(SPR_HUMAN, 2)),
  k.loadSprite("skeleton", makeSpriteUrl(SPR_SKELETON, 2)),
  k.loadSprite("ground_top", makeSpriteUrl(SPR_GROUND_TOP, 2)),
  k.loadSprite("ground", makeSpriteUrl(SPR_GROUND, 2)),
  k.loadSprite("lava1", makeSpriteUrl(SPR_LAVA, 2)),
  k.loadSprite("lava2", makeSpriteUrl(SPR_LAVA2, 2)),
  k.loadSprite("water1", makeSpriteUrl(SPR_WATER, 2)),
  k.loadSprite("water2", makeSpriteUrl(SPR_WATER2, 2)),
  k.loadSprite("cloud", makeSpriteUrl(SPR_CLOUD, 3)),
  k.loadSprite("hill", makeSpriteUrl(SPR_HILL, 4)),
]).then(() => {
  k.go("game");
});

let selectedTool = "lava";

function gridKey(col, row) {
  return `${col},${row}`;
}

const SPEED = 220;
const JUMP = 620;
const WAGON_JUMP = 560;

const gameState = {
  skeletons: 0,
  coins: 0,
  rides: 0,
};

k.scene("game", () => {
  const tileMap = new Map();
  gameState.skeletons = 0;
  gameState.coins = 0;
  gameState.rides = 0;

  for (let i = 0; i < 6; i++) {
    k.add([
      k.sprite("cloud"),
      k.pos(i * 240 + (i % 2) * 60, 60 + (i % 3) * 40),
      k.z(-10),
      k.opacity(0.9),
      "cloud",
      { speed: 6 + (i % 3) * 3 },
    ]);
  }

  for (let i = 0; i < 4; i++) {
    k.add([
      k.sprite("hill"),
      k.pos(i * 330 - 50, GROUND_ROW * TILE - 64),
      k.z(-9),
    ]);
  }

  k.onUpdate("cloud", (c) => {
    c.pos.x += c.speed * k.dt();
    if (c.pos.x > WIDTH + 100) c.pos.x = -200;
  });

  for (let col = 0; col < COLS; col++) {
    k.add([
      k.sprite("ground_top"),
      k.pos(col * TILE, GROUND_ROW * TILE),
      k.area(),
      k.body({ isStatic: true }),
      "ground",
    ]);
    for (let row = GROUND_ROW + 1; row < ROWS; row++) {
      k.add([
        k.sprite("ground"),
        k.pos(col * TILE, row * TILE),
        k.area(),
        k.body({ isStatic: true }),
        "ground",
      ]);
    }
  }

  function createPlayer(opts) {
    const p = k.add([
      k.sprite(opts.sprite),
      k.pos(opts.x, (GROUND_ROW - 3) * TILE),
      k.area({ shape: new k.Rect(k.vec2(2, 4), 24, 40) }),
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
      },
    ]);

    k.onKeyDown(opts.keys.left, () => {
      if (p.ridingWagon) return;
      p.move(-SPEED, 0);
      if (p.facing !== "left") {
        p.flipX = true;
        p.facing = "left";
      }
    });
    k.onKeyDown(opts.keys.right, () => {
      if (p.ridingWagon) return;
      p.move(SPEED, 0);
      if (p.facing !== "right") {
        p.flipX = false;
        p.facing = "right";
      }
    });
    k.onKeyPress(opts.keys.jump, () => {
      if (p.ridingWagon) {
        if (p.ridingWagon.isGrounded()) p.ridingWagon.jump(WAGON_JUMP);
        return;
      }
      if (p.isGrounded()) p.jump(JUMP);
    });
    k.onKeyPress(opts.keys.board, () => {
      if (p.ridingWagon) {
        exitWagon(p);
      } else {
        tryBoardWagon(p);
      }
    });

    p.onUpdate(() => {
      if (p.ridingWagon) return;
      const pCol = Math.floor((p.pos.x + 14) / TILE);
      const pRowFeet = Math.floor((p.pos.y + 42) / TILE);
      const key = gridKey(pCol, pRowFeet);
      const tile = tileMap.get(key);
      if (tile && tile.tileType === "lava" && Math.random() < 0.4) {
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
    });

    return p;
  }

  const mario = createPlayer({
    x: 80,
    sprite: "player",
    skelSprite: "player_skel",
    name: "Mario",
    keys: {
      left: ["left", "a", "q"],
      right: ["right", "d"],
      jump: ["space", "up", "z"],
      board: "e",
    },
  });

  const pika = createPlayer({
    x: 180,
    sprite: "pika",
    skelSprite: "pika_skel",
    name: "Pika",
    keys: {
      left: "j",
      right: "l",
      jump: "i",
      board: "o",
    },
  });

  k.onKeyPress("1", () => (selectedTool = "lava"));
  k.onKeyPress("2", () => (selectedTool = "rail"));
  k.onKeyPress("3", () => (selectedTool = "erase"));
  k.onKeyPress("4", () => (selectedTool = "rail_up"));
  k.onKeyPress("5", () => (selectedTool = "rail_down"));
  k.onKeyPress("6", () => (selectedTool = "water"));
  k.onKeyPress("8", () => (selectedTool = "coin"));
  k.onKeyPress("c", () => {
    tileMap.forEach((t) => {
      if (t.extras) t.extras.forEach((e) => k.destroy(e));
      k.destroy(t);
    });
    tileMap.clear();
  });
  k.onKeyPress("r", () => k.go("game"));
  k.onKeyPress("x", () => spawnWagon());

  k.onMousePress("left", () => {
    const m = k.toWorld(k.mousePos());
    const col = Math.floor(m.x / TILE);
    const row = Math.floor(m.y / TILE);
    if (col < 0 || col >= COLS || row < 0 || row >= GROUND_ROW) return;
    placeTile(col, row, selectedTool);
  });

  k.onMouseDown("right", () => {
    const m = k.toWorld(k.mousePos());
    const col = Math.floor(m.x / TILE);
    const row = Math.floor(m.y / TILE);
    placeTile(col, row, "erase");
  });

  function placeTile(col, row, type) {
    const key = gridKey(col, row);
    const existing = tileMap.get(key);
    if (existing) {
      if (existing.extras) existing.extras.forEach((e) => k.destroy(e));
      k.destroy(existing);
      tileMap.delete(key);
    }
    if (type === "erase") return;

    if (type === "lava") {
      const t = k.add([
        k.sprite("lava1"),
        k.pos(col * TILE, row * TILE),
        k.area(),
        k.z(1),
        "tile",
        "lava",
        { gridCol: col, gridRow: row, tileType: "lava", lavaPhase: 0, extras: [] },
      ]);
      t.onUpdate(() => {
        const f = Math.floor(k.time() * 3 + col * 0.5) % 2;
        if (f !== t.lavaPhase) {
          t.lavaPhase = f;
          t.sprite = f === 0 ? "lava1" : "lava2";
        }
      });
      tileMap.set(key, t);
    } else if (type === "water") {
      const t = k.add([
        k.sprite("water1"),
        k.pos(col * TILE, row * TILE),
        k.area(),
        k.z(1),
        "tile",
        "water",
        { gridCol: col, gridRow: row, tileType: "water", waterPhase: 0, extras: [] },
      ]);
      t.onUpdate(() => {
        const f = Math.floor(k.time() * 2 + col * 0.3) % 2;
        if (f !== t.waterPhase) {
          t.waterPhase = f;
          t.sprite = f === 0 ? "water1" : "water2";
        }
      });
      tileMap.set(key, t);
    } else if (type === "rail") {
      const x = col * TILE;
      const y = row * TILE + TILE - 10;
      const ties = [];
      for (let i = 0; i < 3; i++) {
        ties.push(
          k.add([
            k.rect(5, 9),
            k.pos(x + 4 + i * 10, y + 7),
            k.color(k.rgb(100, 60, 30)),
            k.outline(1, k.rgb(40, 20, 10)),
            k.z(1),
          ]),
        );
      }
      const t = k.add([
        k.rect(TILE, 6),
        k.pos(x, y),
        k.color(k.rgb(210, 210, 225)),
        k.outline(2, k.rgb(70, 70, 90)),
        k.area(),
        k.body({ isStatic: true }),
        k.z(3),
        "tile",
        "rail",
        { gridCol: col, gridRow: row, tileType: "rail", extras: ties },
      ]);
      tileMap.set(key, t);
    } else if (type === "coin") {
      const cx = col * TILE + TILE / 2;
      const cy = row * TILE + TILE / 2;
      const t = k.add([
        k.circle(9),
        k.pos(cx, cy),
        k.color(k.rgb(255, 210, 50)),
        k.outline(2, k.rgb(160, 110, 0)),
        k.area({ shape: new k.Rect(k.vec2(-10, -10), 20, 20) }),
        k.z(4),
        "tile",
        "coin",
        { gridCol: col, gridRow: row, tileType: "coin", baseY: cy, extras: [] },
      ]);
      const inner = k.add([
        k.rect(3, 10),
        k.pos(cx, cy),
        k.anchor("center"),
        k.color(k.rgb(200, 150, 0)),
        k.z(5),
      ]);
      t.extras = [inner];
      t.onUpdate(() => {
        t.pos.y = t.baseY + Math.sin(k.time() * 3 + col * 0.4) * 4;
        inner.pos.x = t.pos.x;
        inner.pos.y = t.pos.y;
        const s = Math.abs(Math.cos(k.time() * 4 + col * 0.4));
        inner.scale = k.vec2(s, 1);
      });
      tileMap.set(key, t);
    } else if (type === "rail_up" || type === "rail_down") {
      const angle = type === "rail_up" ? -45 : 45;
      const cx = col * TILE + TILE / 2;
      const cy = row * TILE + TILE / 2 - 7;
      const len = TILE * Math.SQRT2 + 2;
      const rad = (angle * Math.PI) / 180;
      const ties = [];
      for (let i = 0; i < 3; i++) {
        const off = (i - 1) * 13;
        const tx = cx + off * Math.cos(rad);
        const ty = cy + off * Math.sin(rad);
        ties.push(
          k.add([
            k.rect(5, 11),
            k.pos(tx, ty + 7),
            k.anchor("center"),
            k.rotate(angle),
            k.color(k.rgb(100, 60, 30)),
            k.outline(1, k.rgb(40, 20, 10)),
            k.z(1),
          ]),
        );
      }
      const t = k.add([
        k.rect(len, 6),
        k.pos(cx, cy),
        k.anchor("center"),
        k.rotate(angle),
        k.color(k.rgb(210, 210, 225)),
        k.outline(2, k.rgb(70, 70, 90)),
        k.z(3),
        "tile",
        { gridCol: col, gridRow: row, tileType: type, extras: ties },
      ]);
      tileMap.set(key, t);
    }
  }

  function drawWagonBody(x, y) {
    const body = k.add([
      k.rect(60, 30),
      k.pos(x, y),
      k.color(k.rgb(107, 60, 26)),
      k.outline(2, k.rgb(40, 20, 8)),
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
      k.color(k.rgb(45, 26, 14)),
      k.z(4),
      "wagon-part",
    ]);
    const plank2 = k.add([
      k.rect(52, 2),
      k.pos(x + 4, y + 20),
      k.color(k.rgb(45, 26, 14)),
      k.z(4),
      "wagon-part",
    ]);
    const trim = k.add([
      k.rect(60, 3),
      k.pos(x, y - 3),
      k.color(k.rgb(255, 210, 63)),
      k.z(4),
      "wagon-part",
    ]);
    return [body, frontRim, backRim, plank1, plank2, trim];
  }

  function spawnWagon() {
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
      { passenger: "human", speed: 140, parts: [], rider: null },
    ]);

    const parts = drawWagonBody(wagon.pos.x, wagon.pos.y);

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
      wagon.move(wagon.speed, 0);
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

      if (wagon.pos.x > WIDTH + 80) {
        if (wagon.rider) exitWagon(wagon.rider);
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
  }

  function collectCoin(c) {
    const cx = c.pos.x;
    const cy = c.pos.y;
    if (c.extras) c.extras.forEach((e) => k.destroy(e));
    const key = gridKey(c.gridCol, c.gridRow);
    tileMap.delete(key);
    k.destroy(c);
    gameState.coins += 1;
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

  k.onUpdate("lava", (t) => {
    if (Math.random() < 0.03) {
      k.add([
        k.circle(2 + Math.random() * 2),
        k.pos(t.pos.x + 4 + Math.random() * 24, t.pos.y),
        k.color(255, 200 + Math.random() * 55, 60),
        k.opacity(0.9),
        k.lifespan(0.9, { fade: 0.5 }),
        k.z(5),
        k.move(k.UP, 30 + Math.random() * 40),
      ]);
    }
  });

  k.onDraw(() => {
    const toolLabels = {
      lava: "LAVE",
      rail: "RAIL --",
      erase: "GOMME",
      rail_up: "RAIL /",
      rail_down: "RAIL \\",
      water: "EAU",
      coin: "PIECE",
    };
    const toolColors = {
      lava: k.rgb(255, 120, 60),
      rail: k.rgb(220, 220, 230),
      erase: k.rgb(200, 200, 200),
      rail_up: k.rgb(150, 220, 255),
      rail_down: k.rgb(150, 220, 255),
      water: k.rgb(80, 180, 230),
      coin: k.rgb(255, 210, 50),
    };

    k.drawRect({
      pos: k.vec2(0, 0),
      width: WIDTH,
      height: 62,
      color: k.rgb(0, 0, 0),
      opacity: 0.7,
    });
    k.drawRect({
      pos: k.vec2(0, 62),
      width: WIDTH,
      height: 2,
      color: k.rgb(255, 210, 63),
    });
    k.drawText({
      text: "Outil:",
      size: 16,
      pos: k.vec2(12, 8),
      color: k.WHITE,
    });
    k.drawText({
      text: toolLabels[selectedTool],
      size: 16,
      pos: k.vec2(72, 8),
      color: toolColors[selectedTool],
    });
    const score = gameState.skeletons * 10 + gameState.coins * 5;
    k.drawText({
      text: `SCORE ${score}`,
      size: 18,
      pos: k.vec2(WIDTH - 300, 8),
      color: k.rgb(255, 230, 80),
    });
    k.drawText({
      text: `Squelettes ${gameState.skeletons}  Pieces ${gameState.coins}`,
      size: 12,
      pos: k.vec2(WIDTH - 300, 30),
      color: k.rgb(220, 220, 220),
    });
    k.drawText({
      text: "(1)Lave (2)Rail-- (4)/ (5)\\ (6)Eau (8)Piece (3)Gomme  |  Clic=pose  ClicD=efface",
      size: 12,
      pos: k.vec2(180, 10),
      color: k.rgb(220, 220, 220),
    });
    k.drawText({
      text: "MARIO: A/D marcher, Espace sauter, E monter    |    PIKA: J/L marcher, I sauter, O monter",
      size: 12,
      pos: k.vec2(12, 30),
      color: k.rgb(255, 210, 63),
    });
    k.drawText({
      text: "(X) Wagon  (C) Vider  (R) Reset    (Dans le wagon, saute pour faire sauter le wagon)",
      size: 12,
      pos: k.vec2(12, 46),
      color: k.rgb(180, 220, 255),
    });
  });
});
