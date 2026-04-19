export const PALETTE = {
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

export function substituteSprite(rows, map) {
  return rows.map((r) => {
    let s = "";
    for (const c of r) s += map[c] !== undefined ? map[c] : c;
    return s;
  });
}

export function makeSpriteUrl(rows, scale = 2) {
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

const SPR_FAN = [
  "nnnnnnnnnnnnnnnn",
  "nAAAAAAAAAAAAAAn",
  "nAaaaaaaaaaaaaAn",
  "nAaCaaaaaaaaCaAn",
  "nAaaCaaaaaaCaaAn",
  "nAaaaCCCCCCaaaAn",
  "nAaaaaaCCaaaaaAn",
  "nAaaaCCCCCCaaaAn",
  "nAaaCaaaaaaCaaAn",
  "nAaCaaaaaaaaCaAn",
  "nAaaaaaaaaaaaaAn",
  "nAAAAAAAAAAAAAAn",
  "nnnnKKKKKKKKnnnn",
  "nnnKKKKKKKKKKnnn",
  "nnKKKKKKKKKKKKnn",
  "nnnnnnnnnnnnnnnn",
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

export function loadAllSprites(k) {
  return Promise.all([
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
    k.loadSprite("fan", makeSpriteUrl(SPR_FAN, 2)),
    k.loadSprite("cloud", makeSpriteUrl(SPR_CLOUD, 3)),
    k.loadSprite("hill", makeSpriteUrl(SPR_HILL, 4)),
  ]);
}
