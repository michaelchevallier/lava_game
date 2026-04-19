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

const audio = (() => {
  let ctx = null;
  let muted = false;
  const getCtx = () => {
    if (!ctx) {
      try { ctx = new (window.AudioContext || window.webkitAudioContext)(); }
      catch (e) { return null; }
    }
    return ctx;
  };
  const beep = (freq, dur, type = "square", vol = 0.12, slideTo = null) => {
    if (muted) return;
    const c = getCtx();
    if (!c) return;
    try {
      const osc = c.createOscillator();
      const g = c.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, c.currentTime);
      if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, c.currentTime + dur);
      g.gain.setValueAtTime(vol, c.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
      osc.connect(g);
      g.connect(c.destination);
      osc.start();
      osc.stop(c.currentTime + dur);
    } catch (e) {}
  };
  const noise = (dur, vol = 0.1) => {
    if (muted) return;
    const c = getCtx();
    if (!c) return;
    try {
      const bufSize = c.sampleRate * dur;
      const buf = c.createBuffer(1, bufSize, c.sampleRate);
      const out = buf.getChannelData(0);
      for (let i = 0; i < bufSize; i++) out[i] = (Math.random() * 2 - 1) * (1 - i / bufSize);
      const src = c.createBufferSource();
      src.buffer = buf;
      const g = c.createGain();
      g.gain.value = vol;
      src.connect(g);
      g.connect(c.destination);
      src.start();
    } catch (e) {}
  };
  return {
    isMuted: () => muted,
    toggleMute: () => {
      muted = !muted;
      return muted;
    },
    jump: () => beep(440, 0.1, "square", 0.1, 720),
    coin: () => {
      beep(988, 0.07, "square", 0.1);
      setTimeout(() => beep(1318, 0.12, "square", 0.1), 50);
    },
    transform: () => {
      beep(220, 0.35, "sawtooth", 0.18, 80);
      setTimeout(() => beep(90, 0.25, "sine", 0.15), 100);
      setTimeout(() => noise(0.3, 0.1), 60);
    },
    splash: () => {
      beep(600, 0.12, "triangle", 0.1, 300);
      setTimeout(() => beep(400, 0.12, "triangle", 0.08, 180), 80);
    },
    wagonSpawn: () => {
      beep(330, 0.08, "square", 0.12);
      setTimeout(() => beep(494, 0.12, "square", 0.12), 80);
    },
    place: () => beep(180, 0.04, "square", 0.07),
    boost: () => {
      for (let i = 0; i < 5; i++) setTimeout(() => beep(400 + i * 120, 0.05, "square", 0.1), i * 25);
    },
    combo: () => {
      beep(660, 0.08, "square", 0.12);
      setTimeout(() => beep(880, 0.08, "square", 0.12), 70);
      setTimeout(() => beep(1175, 0.14, "square", 0.12), 140);
    },
    board: () => {
      beep(523, 0.06, "square", 0.1);
      setTimeout(() => beep(784, 0.08, "square", 0.1), 60);
    },
  };
})();

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

function substituteSprite(rows, map) {
  return rows.map((r) => {
    let s = "";
    for (const c of r) s += map[c] !== undefined ? map[c] : c;
    return s;
  });
}

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

const SPR_BOOST = [
  "YYYYYYYYYYYYYYYY",
  "YyyyyYYYYYYyyyyY",
  "YyyyyyYYYYyyyyyY",
  "YyyKyyyyYYyyKyyY",
  "YyKKyyyyyyyyKKyY",
  "YKKKyyyyyyyyKKKY",
  "YKKKKyyyyyyKKKKY",
  "YKKKKKyyyyKKKKKY",
  "YKKKKKyyyyKKKKKY",
  "YKKKKyyyyyyKKKKY",
  "YKKKyyyyyyyyKKKY",
  "YyKKyyyyyyyyKKyY",
  "YyyKyyyyYYyyKyyY",
  "YyyyyyYYYYyyyyyY",
  "YyyyyYYYYYYyyyyY",
  "YYYYYYYYYYYYYYYY",
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

const SPR_LUIGI = substituteSprite(SPR_PLAYER, { R: "G", r: "g" });
const SPR_LUIGI_SKEL = substituteSprite(SPR_PLAYER_SKEL, { R: "G", r: "g" });
const SPR_TOAD = substituteSprite(SPR_PLAYER, { R: "P", r: "p", O: "P", o: "p" });
const SPR_TOAD_SKEL = substituteSprite(SPR_PLAYER_SKEL, { R: "P", r: "p" });

Promise.all([
  k.loadSprite("player", makeSpriteUrl(SPR_PLAYER, 2)),
  k.loadSprite("player_skel", makeSpriteUrl(SPR_PLAYER_SKEL, 2)),
  k.loadSprite("luigi", makeSpriteUrl(SPR_LUIGI, 2)),
  k.loadSprite("luigi_skel", makeSpriteUrl(SPR_LUIGI_SKEL, 2)),
  k.loadSprite("toad", makeSpriteUrl(SPR_TOAD, 2)),
  k.loadSprite("toad_skel", makeSpriteUrl(SPR_TOAD_SKEL, 2)),
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
  k.loadSprite("boost", makeSpriteUrl(SPR_BOOST, 2)),
  k.loadSprite("cloud", makeSpriteUrl(SPR_CLOUD, 3)),
  k.loadSprite("hill", makeSpriteUrl(SPR_HILL, 4)),
]).then(() => {
  console.log("sprites loaded, starting scene");
  try { k.go("game"); } catch (e) { console.error("scene start failed", e); }
}).catch(e => console.error("Promise.all failed", e));

window.addEventListener("error", (e) => console.error("global error:", e.message, e.filename, e.lineno));

let selectedTool = "lava";

function gridKey(col, row) {
  return `${col},${row}`;
}

const SPEED = 220;
const JUMP = 620;
const WAGON_JUMP = 560;

const STORAGE_KEY = "milan_lava_park";
function loadSave() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { bestScore: 0, totalSkeletons: 0, totalCoins: 0, plays: 0, numPlayers: 2 };
    const parsed = JSON.parse(raw);
    if (!parsed.numPlayers) parsed.numPlayers = 2;
    return parsed;
  } catch (e) {
    return { bestScore: 0, totalSkeletons: 0, totalCoins: 0, plays: 0, numPlayers: 2 };
  }
}
function persistSave(save) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(save)); } catch (e) {}
}
const save = loadSave();
const settings = {
  open: false,
  numPlayers: save.numPlayers || 2,
  autoMode: save.autoMode || false,
};

const gameState = {
  skeletons: 0,
  coins: 0,
  rides: 0,
  score: 0,
  comboCount: 0,
  comboExpire: 0,
  milestoneIdx: 0,
};

const COMBO_WINDOW = 2.5;
const COMBO_MULTIPLIERS = [1, 1, 2, 3, 5, 8];
const MILESTONES = [50, 100, 250, 500, 1000, 2000, 5000];

const WAGON_THEMES = [
  { body: [107, 60, 26], dark: [45, 26, 14], trim: [255, 210, 63] },
  { body: [196, 60, 60], dark: [120, 30, 30], trim: [255, 220, 80] },
  { body: [60, 150, 80], dark: [30, 80, 40], trim: [255, 255, 150] },
  { body: [70, 90, 200], dark: [30, 40, 120], trim: [150, 220, 255] },
  { body: [180, 80, 200], dark: [100, 40, 120], trim: [255, 200, 255] },
  { body: [240, 150, 50], dark: [140, 80, 20], trim: [255, 230, 120] },
  { body: [40, 40, 40], dark: [10, 10, 10], trim: [200, 50, 50] },
  { body: [220, 220, 230], dark: [130, 130, 150], trim: [80, 160, 230] },
];

k.scene("game", () => {
  const tileMap = new Map();
  gameState.skeletons = 0;
  gameState.coins = 0;
  gameState.rides = 0;
  gameState.score = 0;
  gameState.comboCount = 0;
  gameState.comboExpire = 0;
  gameState.milestoneIdx = 0;

  function launchFirework(x, y, color) {
    for (let i = 0; i < 40; i++) {
      const a = (Math.PI * 2 * i) / 40 + Math.random() * 0.1;
      const sp = 150 + Math.random() * 120;
      const p = k.add([
        k.circle(3 + Math.random() * 2),
        k.pos(x, y),
        k.color(color),
        k.opacity(1),
        k.lifespan(1.5, { fade: 1 }),
        k.z(20),
        { vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, grav: 180 },
      ]);
      p.onUpdate(() => {
        p.pos.x += p.vx * k.dt();
        p.pos.y += p.vy * k.dt();
        p.vy += p.grav * k.dt();
        p.vx *= 0.98;
      });
    }
  }

  function celebrateMilestone(target) {
    audio.combo();
    setTimeout(() => audio.coin(), 200);
    setTimeout(() => audio.combo(), 400);
    const colors = [
      k.rgb(255, 80, 120),
      k.rgb(255, 210, 60),
      k.rgb(100, 230, 255),
      k.rgb(140, 255, 120),
      k.rgb(255, 140, 240),
    ];
    for (let i = 0; i < 4; i++) {
      k.wait(i * 0.25, () => {
        const x = 100 + Math.random() * (WIDTH - 200);
        const y = 100 + Math.random() * 200;
        launchFirework(x, y, colors[i % colors.length]);
      });
    }
    showPopup(WIDTH / 2, HEIGHT / 2, `PALIER ${target}!`, k.rgb(255, 230, 80), 40);
    k.shake(10);
  }

  function checkMilestone() {
    while (
      gameState.milestoneIdx < MILESTONES.length &&
      gameState.score >= MILESTONES[gameState.milestoneIdx]
    ) {
      celebrateMilestone(MILESTONES[gameState.milestoneIdx]);
      gameState.milestoneIdx += 1;
    }
  }

  function updatePersistence() {
    if (gameState.score > save.bestScore) save.bestScore = gameState.score;
    save.totalSkeletons = (save.totalSkeletons || 0) + 1;
    persistSave(save);
  }

  function registerKill(x, y, base = 10, vip = false, darkBonus = 0) {
    const now = k.time();
    const prev = gameState.comboCount;
    if (now < gameState.comboExpire) {
      gameState.comboCount = Math.min(gameState.comboCount + 1, 5);
    } else {
      gameState.comboCount = 1;
    }
    gameState.comboExpire = now + COMBO_WINDOW;
    const mult = COMBO_MULTIPLIERS[gameState.comboCount] || 1;
    const pts = base * mult * (1 + darkBonus);
    gameState.score += pts;
    if (prev < 5 && gameState.comboCount === 5) {
      triggerApocalypse();
    }
    if (vip) {
      audio.combo();
      showPopup(x, y - 30, `VIP +${pts}!`, k.rgb(255, 230, 80), 28);
    } else if (gameState.comboCount >= 2) {
      audio.combo();
      showPopup(
        x,
        y - 30,
        `x${mult} +${pts}`,
        k.rgb(255, 120, 220),
        20 + gameState.comboCount * 2,
      );
    } else {
      showPopup(x, y - 30, `+${pts}`, k.rgb(255, 180, 60), 22);
    }
    updatePersistence();
    checkMilestone();
    return mult;
  }

  function triggerApocalypse() {
    audio.combo();
    setTimeout(() => audio.transform(), 100);
    k.shake(22);
    k.add([
      k.rect(WIDTH, HEIGHT),
      k.pos(0, 0),
      k.color(255, 255, 255),
      k.opacity(0.85),
      k.lifespan(0.4, { fade: 0.3 }),
      k.z(100),
    ]);
    showPopup(WIDTH / 2, HEIGHT / 2 - 40, "APOCALYPSE !", k.rgb(255, 80, 80), 60);
    showPopup(WIDTH / 2, HEIGHT / 2 + 30, "x8 COMBO", k.rgb(255, 230, 80), 32);
    const visitors = k.get("visitor").filter((v) => !v.isSkeleton);
    visitors.forEach((v, i) => {
      k.wait(i * 0.1, () => {
        if (!v.exists() || v.isSkeleton) return;
        v.isSkeleton = true;
        v.sprite = "skeleton";
        gameState.skeletons += 1;
        gameState.score += 10 * 8;
        k.shake(4);
        showPopup(v.pos.x + 14, v.pos.y - 10, "+80", k.rgb(255, 80, 80), 18);
        for (let j = 0; j < 10; j++) {
          const a = (Math.PI * 2 * j) / 10;
          k.add([
            k.circle(3 + Math.random() * 3),
            k.pos(v.pos.x + 14, v.pos.y + 10),
            k.color(k.rgb(255, 80 + Math.random() * 100, 30)),
            k.opacity(1),
            k.lifespan(0.4, { fade: 0.3 }),
            k.z(14),
            { vx: Math.cos(a) * 100, vy: Math.sin(a) * 100 },
          ]);
        }
      });
    });
    for (let i = 0; i < 3; i++) {
      k.wait(0.2 + i * 0.3, () => {
        const colors = [k.rgb(255, 80, 80), k.rgb(255, 210, 60), k.rgb(180, 100, 255)];
        const x = 100 + Math.random() * (WIDTH - 200);
        const y = 80 + Math.random() * 200;
        launchFirework(x, y, colors[i % 3]);
      });
    }
  }

  function registerCoin(x, y) {
    const now = k.time();
    const mult = now < gameState.comboExpire
      ? COMBO_MULTIPLIERS[gameState.comboCount] || 1
      : 1;
    const pts = 5 * mult;
    gameState.score += pts;
    save.totalCoins = (save.totalCoins || 0) + 1;
    if (gameState.score > save.bestScore) save.bestScore = gameState.score;
    persistSave(save);
    showPopup(x, y - 8, `+${pts}`, k.rgb(255, 230, 80), 18);
    checkMilestone();
  }

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
        if (p.ridingWagon.isGrounded()) {
          p.ridingWagon.jump(WAGON_JUMP);
          audio.jump();
        }
        return;
      }
      if (p.isGrounded()) {
        p.jump(JUMP);
        audio.jump();
      }
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

  const PLAYER_CONFIGS = [
    {
      x: 80,
      sprite: "player",
      skelSprite: "player_skel",
      name: "Mario",
      color: k.rgb(230, 57, 70),
      keys: { left: ["a", "q"], right: "d", jump: ["space", "z"], board: "e" },
    },
    {
      x: 180,
      sprite: "pika",
      skelSprite: "pika_skel",
      name: "Pika",
      color: k.rgb(255, 210, 63),
      keys: { left: "j", right: "l", jump: "i", board: "o" },
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

  const activePlayers = [];
  for (let i = 0; i < settings.numPlayers; i++) {
    activePlayers.push(createPlayer(PLAYER_CONFIGS[i]));
  }

  k.onKeyPress("1", () => (selectedTool = "lava"));
  k.onKeyPress("2", () => (selectedTool = "rail"));
  k.onKeyPress("3", () => (selectedTool = "erase"));
  k.onKeyPress("4", () => (selectedTool = "rail_up"));
  k.onKeyPress("5", () => (selectedTool = "rail_down"));
  k.onKeyPress("6", () => (selectedTool = "water"));
  k.onKeyPress("7", () => (selectedTool = "boost"));
  k.onKeyPress("8", () => (selectedTool = "coin"));
  k.onKeyPress("9", () => (selectedTool = "trampoline"));
  k.onKeyPress("c", () => {
    tileMap.forEach((t) => {
      if (t.extras) t.extras.forEach((e) => k.destroy(e));
      k.destroy(t);
    });
    tileMap.clear();
  });
  k.onKeyPress("r", () => k.go("game"));
  k.onKeyPress("x", () => spawnWagon());
  k.onKeyPress("m", () => audio.toggleMute());
  k.onKeyPress(["p", "escape"], () => {
    const root = k.getTreeRoot();
    root.paused = !root.paused;
  });


  function buildDemoCircuit() {
    tileMap.forEach((t) => {
      if (t.extras) t.extras.forEach((e) => k.destroy(e));
      k.destroy(t);
    });
    tileMap.clear();
    placeTile(6, 13, "coin");
    placeTile(8, 13, "coin");
    placeTile(10, 13, "boost");
    placeTile(13, 13, "lava");
    placeTile(14, 13, "lava");
    placeTile(15, 13, "lava");
    placeTile(16, 13, "lava");
    placeTile(18, 13, "coin");
    placeTile(20, 12, "rail_up");
    placeTile(21, 11, "rail");
    placeTile(22, 11, "rail");
    placeTile(23, 11, "coin");
    placeTile(24, 11, "rail");
    placeTile(25, 11, "rail");
    placeTile(26, 12, "rail_down");
    placeTile(28, 13, "trampoline");
    placeTile(31, 13, "water");
    placeTile(32, 13, "water");
    placeTile(34, 13, "lava");
    placeTile(35, 13, "lava");
    placeTile(36, 13, "lava");
    placeTile(38, 13, "coin");
  }

  const MAX_WAGONS = 3;

  let autoSpawnTimer = null;
  function startAutoMode() {
    if (autoSpawnTimer) return;
    buildDemoCircuit();
    if (k.get("wagon").length === 0) spawnWagon();
    autoSpawnTimer = k.loop(3.2, () => {
      if (k.get("wagon").length < MAX_WAGONS) spawnWagon();
    });
  }
  function stopAutoMode() {
    if (autoSpawnTimer) { autoSpawnTimer.cancel(); autoSpawnTimer = null; }
  }
  if (settings.autoMode) k.wait(0.05, () => startAutoMode());

  let ghostTrainInterval = null;
  function startGhostTrain() {
    if (ghostTrainInterval) return;
    ghostTrainInterval = k.loop(45, () => {
      if (k.get("wagon").length >= MAX_WAGONS) return;
      showPopup(WIDTH / 2, 120, "TRAIN FANTOME !", k.rgb(255, 40, 40), 46);
      audio.transform();
      k.shake(5);
      k.wait(2.5, () => {
        if (k.get("wagon").length < MAX_WAGONS) spawnWagon(true);
      });
    });
  }
  k.wait(0.05, () => startGhostTrain());

  let isNight = false;
  const stars = [];
  const moon = k.add([
    k.circle(24),
    k.pos(WIDTH - 140, 90),
    k.color(k.rgb(255, 250, 220)),
    k.opacity(0),
    k.z(-11),
    "night-deco",
  ]);
  const moonCrater = k.add([
    k.circle(8),
    k.pos(WIDTH - 150, 82),
    k.color(k.rgb(200, 195, 170)),
    k.opacity(0),
    k.z(-10),
    "night-deco",
  ]);
  const nightTint = k.add([
    k.rect(WIDTH, HEIGHT),
    k.pos(0, 0),
    k.color(k.rgb(20, 30, 80)),
    k.opacity(0),
    k.z(-12),
    k.fixed(),
    "night-deco",
  ]);

  for (let i = 0; i < 40; i++) {
    const s = k.add([
      k.circle(1 + Math.random()),
      k.pos(Math.random() * WIDTH, Math.random() * (GROUND_ROW * TILE - 80) + 20),
      k.color(k.rgb(255, 255, 220)),
      k.opacity(0),
      k.z(-10),
      "night-deco",
      { twinkle: Math.random() * 10 },
    ]);
    stars.push(s);
  }

  k.onKeyPress("n", () => {
    isNight = !isNight;
    const targetOpacity = isNight ? 1 : 0;
    for (const s of stars) {
      s.opacity = targetOpacity * (0.7 + Math.random() * 0.3);
    }
    moon.opacity = targetOpacity;
    moonCrater.opacity = targetOpacity;
    nightTint.opacity = targetOpacity * 0.35;
  });

  k.onUpdate(() => {
    if (isNight) {
      for (const s of stars) {
        s.opacity = 0.5 + Math.sin(k.time() * 2 + s.twinkle) * 0.5;
      }
    }
  });

  const COG_X = WIDTH - 50;
  const COG_Y = 90;
  const COG_R = 22;

  function inCog(m) {
    const dx = m.x - COG_X;
    const dy = m.y - COG_Y;
    return dx * dx + dy * dy < COG_R * COG_R;
  }

  function inPlayerBtn(m, i) {
    const bx = WIDTH / 2 - 200 + 20 + (i - 1) * 92;
    const by = HEIGHT / 2 - 60;
    return m.x > bx && m.x < bx + 70 && m.y > by && m.y < by + 70;
  }

  function inAutoModeBtn(m) {
    const bx = WIDTH / 2 - 120;
    const by = HEIGHT / 2 + 50;
    return m.x > bx && m.x < bx + 240 && m.y > by && m.y < by + 40;
  }

  const TOOLBAR_ORDER = [
    { tool: "lava", key: "1", label: "Lave" },
    { tool: "rail", key: "2", label: "Rail" },
    { tool: "rail_up", key: "4", label: "Up" },
    { tool: "rail_down", key: "5", label: "Dn" },
    { tool: "water", key: "6", label: "Eau" },
    { tool: "boost", key: "7", label: "Boost" },
    { tool: "coin", key: "8", label: "Piece" },
    { tool: "trampoline", key: "9", label: "Tramp" },
    { tool: "erase", key: "3", label: "Gomme" },
  ];
  const TB_ICON = 52;
  const TB_GAP = 4;
  const TB_TOTAL_W = TOOLBAR_ORDER.length * (TB_ICON + TB_GAP);
  const TB_START_X = (WIDTH - TB_TOTAL_W) / 2;
  const TB_Y = HEIGHT - TB_ICON - 14;

  function toolbarHit(m) {
    if (m.y < TB_Y || m.y > TB_Y + TB_ICON) return null;
    for (let i = 0; i < TOOLBAR_ORDER.length; i++) {
      const x = TB_START_X + i * (TB_ICON + TB_GAP);
      if (m.x >= x && m.x <= x + TB_ICON) return TOOLBAR_ORDER[i].tool;
    }
    return null;
  }

  let audioUnlocked = false;
  function tryUnlockAudio() {
    if (audioUnlocked) return;
    audioUnlocked = true;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      if (ctx.state === "suspended") ctx.resume();
    } catch (e) {}
  }
  k.onKeyPress(() => tryUnlockAudio());

  k.onMousePress("left", () => {
    tryUnlockAudio();
    const m = k.mousePos();
    if (inCog(m)) {
      settings.open = !settings.open;
      audio.place();
      return;
    }
    if (!settings.open) {
      const clickedTool = toolbarHit(m);
      if (clickedTool) {
        selectedTool = clickedTool;
        audio.place();
        return;
      }
    }
    if (settings.open) {
      for (let i = 1; i <= 4; i++) {
        if (inPlayerBtn(m, i)) {
          if (settings.numPlayers !== i) {
            settings.numPlayers = i;
            save.numPlayers = i;
            persistSave(save);
            audio.combo();
            k.go("game");
          }
          return;
        }
      }
      if (inAutoModeBtn(m)) {
        settings.autoMode = !settings.autoMode;
        save.autoMode = settings.autoMode;
        persistSave(save);
        audio.boost();
        if (settings.autoMode) startAutoMode();
        else stopAutoMode();
        return;
      }
      return;
    }
    const w = k.toWorld(k.mousePos());
    const col = Math.floor(w.x / TILE);
    const row = Math.floor(w.y / TILE);
    if (col < 0 || col >= COLS || row < 0 || row >= GROUND_ROW) return;
    placeTile(col, row, selectedTool);
    audio.place();
  });

  let lastPlacedKey = null;

  k.onMouseDown("left", () => {
    if (settings.open) return;
    const screenM = k.mousePos();
    if (inCog(screenM) || toolbarHit(screenM) || screenM.y < 65) return;
    const w = k.toWorld(screenM);
    const col = Math.floor(w.x / TILE);
    const row = Math.floor(w.y / TILE);
    if (col < 0 || col >= COLS || row < 0 || row >= GROUND_ROW) return;
    const key = gridKey(col, row);
    if (key === lastPlacedKey) return;
    if (tileMap.has(key) && tileMap.get(key).tileType === selectedTool) return;
    placeTile(col, row, selectedTool);
    lastPlacedKey = key;
  });

  k.onMouseRelease("left", () => {
    lastPlacedKey = null;
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
    } else if (type === "trampoline") {
      const x = col * TILE;
      const y = row * TILE;
      const base = k.add([
        k.rect(TILE, TILE - 8),
        k.pos(x, y + 8),
        k.color(k.rgb(60, 40, 60)),
        k.outline(2, k.rgb(30, 20, 30)),
        k.z(1),
      ]);
      const spring1 = k.add([
        k.rect(4, TILE - 12),
        k.pos(x + 6, y + 10),
        k.color(k.rgb(200, 200, 215)),
        k.z(2),
      ]);
      const spring2 = k.add([
        k.rect(4, TILE - 12),
        k.pos(x + TILE - 10, y + 10),
        k.color(k.rgb(200, 200, 215)),
        k.z(2),
      ]);
      const t = k.add([
        k.rect(TILE, 6),
        k.pos(x, y + 4),
        k.color(k.rgb(255, 80, 130)),
        k.outline(2, k.rgb(140, 20, 60)),
        k.area(),
        k.z(3),
        "tile",
        "trampoline",
        { gridCol: col, gridRow: row, tileType: "trampoline", extras: [base, spring1, spring2] },
      ]);
      tileMap.set(key, t);
    } else if (type === "boost") {
      const t = k.add([
        k.sprite("boost"),
        k.pos(col * TILE, row * TILE),
        k.area(),
        k.z(1),
        "tile",
        "boost",
        { gridCol: col, gridRow: row, tileType: "boost", extras: [] },
      ]);
      t.onUpdate(() => {
        t.angle = Math.sin(k.time() * 8 + col) * 3;
      });
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
      const cy = row * TILE + 6;
      const len = TILE * Math.SQRT2 + 4;
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
      const currentSpeed = boosted ? wagon.speed * 2.2 : wagon.speed;
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
        const f = k.add([
          k.circle(2 + Math.random() * 3),
          k.pos(wagon.pos.x - 4, wagon.pos.y + 8 + Math.random() * 20),
          k.color(k.rgb(255, 180 + Math.random() * 60, 40)),
          k.opacity(0.9),
          k.lifespan(0.35, { fade: 0.2 }),
          k.z(2),
          { vx: -50 - Math.random() * 60 },
        ]);
        f.onUpdate(() => {
          f.pos.x += f.vx * k.dt();
        });
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
        const dust = k.add([
          k.circle(1.5 + Math.random() * 1.5),
          k.pos(dx + 6 + Math.random() * 48, wagon.pos.y + 34 + Math.random() * 2),
          k.color(180, 160, 120),
          k.opacity(0.7),
          k.lifespan(0.3, { fade: 0.2 }),
          k.z(2),
          { vx: -20 - Math.random() * 30, vy: -15 - Math.random() * 15 },
        ]);
        dust.onUpdate(() => {
          dust.pos.x += dust.vx * k.dt();
          dust.pos.y += dust.vy * k.dt();
        });
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
        const p = k.add([
          k.circle(3 + Math.random() * 2),
          k.pos(wagon.pos.x + 30, wagon.pos.y + 10),
          k.color(k.rgb(180, 100, 255)),
          k.opacity(0.9),
          k.lifespan(0.6, { fade: 0.4 }),
          k.z(13),
          { vx: Math.cos(a) * 80, vy: Math.sin(a) * 80 - 20 },
        ]);
        p.onUpdate(() => {
          p.pos.x += p.vx * k.dt();
          p.pos.y += p.vy * k.dt();
        });
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

  function showPopup(x, y, text, color, size = 20) {
    const p = k.add([
      k.text(text, { size }),
      k.pos(x, y),
      k.anchor("center"),
      k.color(color),
      k.opacity(1),
      k.lifespan(1, { fade: 0.6 }),
      k.z(20),
      { vy: -70, vx: (Math.random() - 0.5) * 30 },
    ]);
    p.onUpdate(() => {
      p.pos.y += p.vy * k.dt();
      p.pos.x += p.vx * k.dt();
      p.vy *= 0.97;
    });
    return p;
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

  function spawnVisitor() {
    const speed = 40 + Math.random() * 40;
    const isVIP = Math.random() < 0.12;
    const v = k.add([
      k.sprite("human"),
      k.pos(-40, (GROUND_ROW - 3) * TILE),
      k.area({ shape: new k.Rect(k.vec2(2, 4), 24, 40) }),
      k.body(),
      k.anchor("topleft"),
      k.z(5),
      "visitor",
      { walkSpeed: speed, isSkeleton: false, isVIP, crown: null },
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
      v.move(v.walkSpeed, 0);
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
        v.isSkeleton = true;
        v.sprite = "skeleton";
        gameState.skeletons += 1;
        audio.transform();
        k.shake(v.isVIP ? 7 : 3);
        registerKill(v.pos.x + 14, v.pos.y, v.isVIP ? 50 : 10, v.isVIP);
        const cx = v.pos.x + 14;
        const cy = v.pos.y + 10;
        for (let i = 0; i < 12; i++) {
          const a = (Math.PI * 2 * i) / 12;
          const fl = k.add([
            k.circle(3 + Math.random() * 3),
            k.pos(cx, cy),
            k.color(k.rgb(255, 150 + Math.random() * 80, 40)),
            k.opacity(1),
            k.lifespan(0.5, { fade: 0.3 }),
            k.z(14),
            { vx: Math.cos(a) * 80, vy: Math.sin(a) * 80 - 30 },
          ]);
          fl.onUpdate(() => {
            fl.pos.x += fl.vx * k.dt();
            fl.pos.y += fl.vy * k.dt();
          });
        }
      }
      if (tile && tile.tileType === "water" && v.isSkeleton) {
        v.isSkeleton = false;
        v.sprite = "human";
        gameState.skeletons = Math.max(0, gameState.skeletons - 1);
        audio.splash();
        for (let i = 0; i < 8; i++) {
          const a = (Math.PI * 2 * i) / 8;
          const drop = k.add([
            k.circle(2 + Math.random() * 2),
            k.pos(v.pos.x + 14, v.pos.y + 20),
            k.color(k.rgb(100, 180, 230)),
            k.opacity(0.9),
            k.lifespan(0.5, { fade: 0.3 }),
            k.z(10),
            { vx: Math.cos(a) * 60, vy: Math.sin(a) * 60 - 40 },
          ]);
          drop.onUpdate(() => {
            drop.pos.x += drop.vx * k.dt();
            drop.pos.y += drop.vy * k.dt();
            drop.vy += 180 * k.dt();
          });
        }
      }
      if (v.pos.x > WIDTH + 40) {
        if (v.crown) v.crown.forEach((e) => k.destroy(e));
        k.destroy(v);
      }
    });
    return v;
  }

  k.loop(4, () => {
    if (k.get("visitor").length < 5) spawnVisitor();
  });

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
      rail_down: "RAIL Dn",
      water: "EAU",
      coin: "PIECE",
      boost: "BOOST",
      trampoline: "TRAMPOLINE",
    };
    const toolColors = {
      lava: k.rgb(255, 120, 60),
      rail: k.rgb(220, 220, 230),
      erase: k.rgb(200, 200, 200),
      rail_up: k.rgb(150, 220, 255),
      rail_down: k.rgb(150, 220, 255),
      water: k.rgb(80, 180, 230),
      coin: k.rgb(255, 210, 50),
      boost: k.rgb(255, 210, 63),
      trampoline: k.rgb(255, 100, 160),
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
    k.drawText({
      text: `SCORE ${gameState.score}`,
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
      text: `Record ${save.bestScore}  |  Squelettes tot. ${save.totalSkeletons || 0}`,
      size: 11,
      pos: k.vec2(WIDTH - 300, 46),
      color: k.rgb(180, 200, 255),
    });

    for (let i = 0; i < TOOLBAR_ORDER.length; i++) {
      const item = TOOLBAR_ORDER[i];
      const bx = TB_START_X + i * (TB_ICON + TB_GAP);
      const by = TB_Y;
      const isSelected = selectedTool === item.tool;
      k.drawRect({
        pos: k.vec2(bx, by),
        width: TB_ICON,
        height: TB_ICON,
        color: isSelected ? k.rgb(255, 210, 63) : k.rgb(25, 35, 55),
      });
      k.drawRect({
        pos: k.vec2(bx, by),
        width: TB_ICON,
        height: 3,
        color: isSelected ? k.WHITE : k.rgb(80, 100, 130),
      });
      const cx = bx + TB_ICON / 2;
      const cy = by + TB_ICON / 2;
      if (item.tool === "lava") {
        k.drawRect({
          pos: k.vec2(bx + 8, by + 12),
          width: TB_ICON - 16,
          height: TB_ICON - 20,
          color: k.rgb(255, 107, 28),
        });
      } else if (item.tool === "water") {
        k.drawRect({
          pos: k.vec2(bx + 8, by + 12),
          width: TB_ICON - 16,
          height: TB_ICON - 20,
          color: k.rgb(79, 184, 232),
        });
      } else if (item.tool === "coin") {
        k.drawCircle({ pos: k.vec2(cx, cy + 3), radius: 13, color: k.rgb(255, 210, 50) });
        k.drawCircle({ pos: k.vec2(cx, cy + 3), radius: 7, color: k.rgb(200, 150, 0) });
      } else if (item.tool === "rail") {
        k.drawRect({
          pos: k.vec2(bx + 6, cy - 2),
          width: TB_ICON - 12,
          height: 5,
          color: k.rgb(210, 210, 225),
        });
        k.drawRect({
          pos: k.vec2(bx + 8, cy + 6),
          width: 4,
          height: 8,
          color: k.rgb(100, 60, 30),
        });
        k.drawRect({
          pos: k.vec2(bx + TB_ICON - 12, cy + 6),
          width: 4,
          height: 8,
          color: k.rgb(100, 60, 30),
        });
      } else if (item.tool === "rail_up" || item.tool === "rail_down") {
        const angle = item.tool === "rail_up" ? -45 : 45;
        k.drawRect({
          pos: k.vec2(cx, cy + 3),
          width: TB_ICON - 14,
          height: 5,
          anchor: "center",
          angle,
          color: k.rgb(210, 210, 225),
        });
      } else if (item.tool === "boost") {
        k.drawRect({
          pos: k.vec2(bx + 6, by + 10),
          width: TB_ICON - 12,
          height: TB_ICON - 16,
          color: k.rgb(255, 210, 63),
        });
        k.drawText({
          text: ">>",
          size: 22,
          pos: k.vec2(cx, cy + 2),
          anchor: "center",
          color: k.rgb(20, 20, 20),
        });
      } else if (item.tool === "trampoline") {
        k.drawRect({
          pos: k.vec2(bx + 6, cy - 2),
          width: TB_ICON - 12,
          height: 5,
          color: k.rgb(255, 80, 130),
        });
        k.drawRect({
          pos: k.vec2(bx + 10, cy + 4),
          width: 3,
          height: 10,
          color: k.rgb(200, 200, 215),
        });
        k.drawRect({
          pos: k.vec2(bx + TB_ICON - 13, cy + 4),
          width: 3,
          height: 10,
          color: k.rgb(200, 200, 215),
        });
      } else if (item.tool === "erase") {
        k.drawText({
          text: "X",
          size: 28,
          pos: k.vec2(cx, cy + 2),
          anchor: "center",
          color: k.rgb(220, 80, 80),
        });
      }
      k.drawText({
        text: item.key,
        size: 10,
        pos: k.vec2(bx + TB_ICON - 4, by + 3),
        anchor: "topright",
        color: isSelected ? k.rgb(30, 30, 40) : k.rgb(150, 170, 200),
      });
      k.drawText({
        text: item.label,
        size: 9,
        pos: k.vec2(cx, by + TB_ICON - 10),
        anchor: "center",
        color: isSelected ? k.rgb(30, 30, 40) : k.rgb(180, 200, 220),
      });
    }

    k.drawCircle({
      pos: k.vec2(COG_X, COG_Y),
      radius: COG_R,
      color: k.rgb(40, 40, 55),
    });
    k.drawCircle({
      pos: k.vec2(COG_X, COG_Y),
      radius: COG_R - 4,
      color: k.rgb(255, 210, 63),
    });
    k.drawCircle({
      pos: k.vec2(COG_X, COG_Y),
      radius: 6,
      color: k.rgb(40, 40, 55),
    });
    const cogSpin = k.time() * 0.5;
    for (let i = 0; i < 6; i++) {
      const a = cogSpin + (Math.PI * 2 * i) / 6;
      k.drawRect({
        pos: k.vec2(
          COG_X + Math.cos(a) * (COG_R - 2) - 4,
          COG_Y + Math.sin(a) * (COG_R - 2) - 4,
        ),
        width: 8,
        height: 8,
        color: k.rgb(255, 210, 63),
      });
    }

    if (!settings.open && !k.getTreeRoot().paused) {
      const sm = k.mousePos();
      if (sm.y > 65 && sm.y < TB_Y - 10 && !inCog(sm)) {
        const wm = k.toWorld(sm);
        const col = Math.floor(wm.x / TILE);
        const row = Math.floor(wm.y / TILE);
        if (col >= 0 && col < COLS && row >= 0 && row < GROUND_ROW) {
          const ghostColor =
            selectedTool === "lava"
              ? k.rgb(255, 107, 28)
              : selectedTool === "water"
                ? k.rgb(79, 184, 232)
                : selectedTool === "coin"
                  ? k.rgb(255, 210, 50)
                  : selectedTool === "boost"
                    ? k.rgb(255, 210, 63)
                    : selectedTool === "trampoline"
                      ? k.rgb(255, 80, 130)
                      : selectedTool === "erase"
                        ? k.rgb(220, 80, 80)
                        : k.rgb(210, 210, 225);
          k.drawRect({
            pos: k.vec2(col * TILE, row * TILE),
            width: TILE,
            height: TILE,
            color: ghostColor,
            opacity: 0.3 + Math.sin(k.time() * 6) * 0.1,
          });
          k.drawRect({
            pos: k.vec2(col * TILE, row * TILE),
            width: TILE,
            height: 2,
            color: ghostColor,
          });
          k.drawRect({
            pos: k.vec2(col * TILE, row * TILE + TILE - 2),
            width: TILE,
            height: 2,
            color: ghostColor,
          });
          k.drawRect({
            pos: k.vec2(col * TILE, row * TILE),
            width: 2,
            height: TILE,
            color: ghostColor,
          });
          k.drawRect({
            pos: k.vec2(col * TILE + TILE - 2, row * TILE),
            width: 2,
            height: TILE,
            color: ghostColor,
          });
        }
      }
    }

    const isPaused = k.getTreeRoot().paused;
    if (isPaused) {
      k.drawRect({
        pos: k.vec2(0, 0),
        width: WIDTH,
        height: HEIGHT,
        color: k.rgb(0, 0, 0),
        opacity: 0.7,
      });
      k.drawText({
        text: "PAUSE",
        size: 80,
        pos: k.vec2(WIDTH / 2, HEIGHT / 2 - 30),
        anchor: "center",
        color: k.rgb(255, 210, 63),
      });
      k.drawText({
        text: "Appuie sur P ou ECHAP pour reprendre",
        size: 18,
        pos: k.vec2(WIDTH / 2, HEIGHT / 2 + 40),
        anchor: "center",
        color: k.rgb(220, 220, 220),
      });
    }

    if ((save.plays || 0) === 0 && !isPaused && !settings.open) {
      const alpha = Math.max(0, 1 - (k.time() / 10));
      if (alpha > 0.1) {
        k.drawRect({
          pos: k.vec2(WIDTH / 2 - 300, HEIGHT / 2 - 100),
          width: 600,
          height: 200,
          color: k.rgb(0, 0, 0),
          opacity: alpha * 0.8,
        });
        k.drawRect({
          pos: k.vec2(WIDTH / 2 - 300, HEIGHT / 2 - 100),
          width: 600,
          height: 4,
          color: k.rgb(255, 210, 63),
          opacity: alpha,
        });
        k.drawText({
          text: "BIENVENUE !",
          size: 28,
          pos: k.vec2(WIDTH / 2, HEIGHT / 2 - 75),
          anchor: "center",
          color: k.rgb(255, 230, 80),
          opacity: alpha,
        });
        k.drawText({
          text: "Clique sur les outils en bas pour construire.",
          size: 15,
          pos: k.vec2(WIDTH / 2, HEIGHT / 2 - 40),
          anchor: "center",
          color: k.WHITE,
          opacity: alpha,
        });
        k.drawText({
          text: "Clique sur le terrain pour poser. X = Spawn wagon.",
          size: 15,
          pos: k.vec2(WIDTH / 2, HEIGHT / 2 - 15),
          anchor: "center",
          color: k.WHITE,
          opacity: alpha,
        });
        k.drawText({
          text: "D = Mode auto. Engrenage en haut a droite pour les options.",
          size: 15,
          pos: k.vec2(WIDTH / 2, HEIGHT / 2 + 10),
          anchor: "center",
          color: k.WHITE,
          opacity: alpha,
        });
      } else {
        save.plays = 1;
        persistSave(save);
      }
    }

    if (settings.open) {
      k.drawRect({
        pos: k.vec2(0, 0),
        width: WIDTH,
        height: HEIGHT,
        color: k.rgb(0, 0, 0),
        opacity: 0.75,
      });
      const panelW = 440;
      const panelH = 280;
      const panelX = WIDTH / 2 - panelW / 2;
      const panelY = HEIGHT / 2 - panelH / 2;
      k.drawRect({
        pos: k.vec2(panelX, panelY),
        width: panelW,
        height: panelH,
        color: k.rgb(30, 40, 60),
      });
      k.drawRect({
        pos: k.vec2(panelX, panelY),
        width: panelW,
        height: 4,
        color: k.rgb(255, 210, 63),
      });
      k.drawText({
        text: "PARAMETRES",
        size: 30,
        pos: k.vec2(WIDTH / 2, panelY + 25),
        anchor: "top",
        color: k.rgb(255, 230, 80),
      });
      k.drawText({
        text: "Nombre de joueurs",
        size: 18,
        pos: k.vec2(WIDTH / 2, panelY + 70),
        anchor: "top",
        color: k.WHITE,
      });
      for (let i = 1; i <= 4; i++) {
        const bx = panelX + 20 + (i - 1) * 92;
        const by = panelY + 120;
        const isSelected = settings.numPlayers === i;
        const cfg = PLAYER_CONFIGS[i - 1];
        k.drawRect({
          pos: k.vec2(bx, by),
          width: 70,
          height: 70,
          color: isSelected ? cfg.color : k.rgb(50, 60, 85),
        });
        k.drawRect({
          pos: k.vec2(bx, by),
          width: 70,
          height: 4,
          color: isSelected ? k.rgb(255, 255, 255) : k.rgb(90, 110, 140),
        });
        k.drawText({
          text: String(i),
          size: 36,
          pos: k.vec2(bx + 35, by + 32),
          anchor: "center",
          color: isSelected ? k.rgb(20, 20, 30) : k.WHITE,
        });
        k.drawText({
          text: cfg.name,
          size: 11,
          pos: k.vec2(bx + 35, by + 82),
          anchor: "top",
          color: isSelected ? cfg.color : k.rgb(180, 200, 220),
        });
      }
      const autoBx = WIDTH / 2 - 120;
      const autoBy = HEIGHT / 2 + 50;
      k.drawRect({
        pos: k.vec2(autoBx, autoBy),
        width: 240,
        height: 40,
        color: settings.autoMode ? k.rgb(124, 201, 71) : k.rgb(60, 80, 110),
      });
      k.drawText({
        text: settings.autoMode ? "MODE DEMO: ON" : "MODE DEMO: OFF",
        size: 18,
        pos: k.vec2(WIDTH / 2, autoBy + 20),
        anchor: "center",
        color: k.WHITE,
      });
      k.drawText({
        text: "(D) Demo  (T) Circuit test  (M) Son  (N) Nuit  (R) Reset",
        size: 12,
        pos: k.vec2(WIDTH / 2, panelY + panelH - 40),
        anchor: "top",
        color: k.rgb(180, 200, 220),
      });
      k.drawText({
        text: "Clic sur l'engrenage pour fermer",
        size: 11,
        pos: k.vec2(WIDTH / 2, panelY + panelH - 18),
        anchor: "top",
        color: k.rgb(140, 160, 190),
      });
    }
    if (gameState.comboCount >= 2 && k.time() < gameState.comboExpire) {
      const remaining = gameState.comboExpire - k.time();
      const mult = COMBO_MULTIPLIERS[gameState.comboCount] || 1;
      const pulse = 1 + Math.sin(k.time() * 12) * 0.08;
      k.drawText({
        text: `COMBO x${mult}`,
        size: 32 * pulse,
        pos: k.vec2(WIDTH / 2, 90),
        anchor: "center",
        color: k.rgb(255, 120, 220),
      });
      k.drawRect({
        pos: k.vec2(WIDTH / 2 - 80, 115),
        width: 160 * (remaining / COMBO_WINDOW),
        height: 4,
        color: k.rgb(255, 120, 220),
      });
    }
    k.drawText({
      text: "(1)Lave (2)Rail (4)Up (5)Dn (6)Eau (7)Boost (8)Piece (9)Trampo (3)Gomme",
      size: 12,
      pos: k.vec2(180, 10),
      color: k.rgb(220, 220, 220),
    });
    k.drawText({
      text: "MARIO A/D/Esp/E  PIKA J/L/I/O  LUIGI fleches+Enter  TOAD F/H/T/G",
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
