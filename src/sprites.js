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

// Mario 20×30 — plombier rouge hand-crafted haute densité pixel.
// Casquette rouge arrondie avec bandeau blanc (logo M suggéré),
// yeux noirs, mustache dense, chemise rouge + salopette bleue à boutons jaunes,
// grosses chaussures marron. Rendered à 40×60 px (scale 2).
const SPR_PLAYER = [
  "........RRRRRR......",
  ".......RRRRRRRR.....",
  "......RRRRRRRRRR....",
  ".....RRRRRRRRRRRR...",
  "....RRRRWWWWWWRRRR..",
  "....RRRRRRRRRRRRRR..",
  "......SSSSSSSSSS....",
  ".....BSSSSSSSSSSB...",
  "....BBSKKSSSSKKSBB..",
  "....BBSKKSSSSKKSBB..",
  ".....SSSSSSSSSSSS...",
  ".....SSMMMMMMMMSS...",
  ".....SSMMrrrrMMSS...",
  "......SSSSSSSSSS....",
  "......RRRRRRRRRR....",
  ".....RRRRRRRRRRRR...",
  "....OORRRRRRRRRROO..",
  "....OORRRYYYYRRROO..",
  "....OORRRRRRRRRROO..",
  "....OOOOOOOOOOOOOO..",
  "....OOOOOOOOOOOOOO..",
  ".....OOOOOOOOOOOO...",
  ".....OOO......OOO...",
  ".....OOO......OOO...",
  ".....BBB......BBB...",
  "....BBBB......BBBB..",
  "...BBBBB......BBBBB.",
  "..BBBBBB......BBBBBB",
  "..bbBBBB......BBBBbb",
  "...bbb..........bbb.",
];

const SPR_PLAYER_SKEL = [
  "........RRRRRR......",
  ".......RRRRRRRR.....",
  "......RRRRRRRRRR....",
  ".....RRRRRRRRRRRR...",
  "....RRRRWWWWWWRRRR..",
  "....RRRRRRRRRRRRRR..",
  "......XXXXXXXXXX....",
  ".....XXXXXXXXXXXX...",
  "....XXKKXXXXXXKKXX..",
  "....XXKKXXXXXXKKXX..",
  ".....XXXXKKKKXXXX...",
  ".....XXKxKKKKxKXX...",
  ".....XxxxxxxxxxxX...",
  "......XXXXXXXXXX....",
  "......XXXXXXXXXX....",
  ".....XXXKXXXXKXXX...",
  "....XXKXXXXXXXXKXX..",
  "....XXKXXXXXXXXKXX..",
  "....XXXKKKKKKKKXXX..",
  "....XXXXXXXXXXXXXX..",
  "....XXXXXXXXXXXXXX..",
  ".....XXXXXXXXXXXX...",
  ".....XXX......XXX...",
  ".....XXX......XXX...",
  ".....XXX......XXX...",
  "....XXXX......XXXX..",
  "...XXXXX......XXXXX.",
  "..XXXXXX......XXXXXX",
  "..xxXXXX......XXXXxx",
  "...xxx..........xxx.",
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

// ---- New avatar sprites (14 wide x 22 tall) ----

// Sonic: blue spiky hedgehog, red shoes
const SPR_SONIC = [
  "....OOOOOO....",
  "...OOoOOOoOO..",
  "..OOoOOOOoOOO.",
  ".OOOOoOOOoOOO.",
  ".OOOOOOOOOOOO.",
  "OOOOOOOOOOOOO.",
  "OOOKKOOOOKKoO",
  "OOKWKOOOOKWKo",
  "OOOKKOOOOKKO.",
  "OOOOOOOOOOOO..",
  "..OOOOOOOOO...",
  "...OOOOOOO....",
  "..OOOSSSOOO...",
  "..OSSSSSSSO...",
  "..OSSSSSSSO...",
  "...OOOSSOO....",
  "....OOOOO.....",
  "....SS.SS.....",
  "....RR.RR.....",
  "...RRRR.RRR...",
  "..RRRR...RRR..",
  "..RRRR...RRR..",
];

// Link: green tunic, pointy hat, blonde
const SPR_LINK = [
  ".....GGGG.....",
  "....GGGGGG....",
  "...GGGGGGGGG..",
  "..GGSSSSSSGGG.",
  "..GSEESSEESSG.",
  "..GSSSSSSSSSG.",
  "..GSSrSSSSSSG.",
  "..GSSSSrrSSGG.",
  "...SSSSSSSS...",
  "...STTSSSTS...",
  "..HHHHHHHHHH..",
  ".HGGGGGGGGGH..",
  ".HGGGGGGGGGH..",
  "HHGGGGGGGGGHH.",
  "HHGGGGGGGGGHH.",
  "HHGGGYYYYGGHH.",
  ".HGGGGGGGGGH..",
  "..HGGG..GGGH..",
  "..BBB....BBB..",
  "..BBB....BBB..",
  ".BBBB....BBBB.",
  ".BBBB....BBBB.",
];

// Pac-Man: big yellow circle, eye
const SPR_PACMAN = [
  "....YYYYYY....",
  "...YYYYYYYY...",
  "..YYYYYYYYYY..",
  ".YYYYYYYYYYY..",
  ".YYYKKyYYYYY..",
  "YYYKWKyYYYYYY.",
  "YYYKKyyYYYYYY.",
  "YYYyyyyyYYYY..",
  "YYYyyyyyyy....",
  ".YYyyyyy......",
  ".YYyyyy.......",
  ".YYyyyyy......",
  "YYYyyyyyyy....",
  "YYYyyyyyYYYY..",
  "YYYyyyYYYYYY..",
  "YYYYYYyYYYYY..",
  ".YYYYYYYYYYY..",
  "..YYYYYYYYYY..",
  "...YYYYYYYY...",
  "....YYYYYY....",
  "...............",
  "...............",
];

// Kirby: pink round body, big eyes, red feet
const SPR_KIRBY = [
  "...............",
  "....PPPPPP....",
  "...PPPPPPPP...",
  "..PPPPPPPPPP..",
  ".PPPPKKKPPPPP.",
  ".PPKWWKPPpPPP.",
  ".PPKKKPPPPPP..",
  ".PPPPPpppPPP..",
  "PPPPPPPPPPPPPP",
  "PPPPPPPPPPPPPP",
  "PPPPPPPPPPPPPP",
  ".PPPPPPPPPPPP.",
  ".PPPPPPPPPPPP.",
  "..PPPPPPPPPP..",
  "..PPPPPPPPPP..",
  "...PPPppPPP...",
  "...PPPPPPPP...",
  "....PPPPPP....",
  ".RR........RR.",
  "RRRR......RRRR",
  "RRRR......RRRR",
  ".RRR......RRR.",
];

// Yoshi: green dino, white belly, orange shoes
const SPR_YOSHI = [
  "....HHHHHH....",
  "..HHHHHHHHHH..",
  ".HHHhHHHHhHH..",
  "HHHHHHHHHHHHH.",
  "HHHKKHHHHKKhH",
  "HHKWKHHHHKWKh",
  "HHHKKHHHHHHH..",
  "HHHHHHHrrHH...",
  "HHHHHHHHrHH...",
  "HHHHHHHHHHH...",
  ".HHHHXXHHHH...",
  ".HXXXXXXXHH...",
  "HXXXXXXXXHH...",
  "HXXXXXXXXHH...",
  ".HXXXXXXXH....",
  "..HHXXXHH.....",
  "..HHHHHH......",
  "..HHHHHH......",
  "..LLL..LLL....",
  ".LLLLL.LLLLL..",
  ".LLLLL.LLLLL..",
  "..LLL...LLL...",
];

// Bowser: orange King Koopa, green shell, horns
const SPR_BOWSER = [
  ".KK..........KK",
  ".KKK........KKK",
  "..LLLLLLLLLL...",
  ".LLLLLLLLLLL...",
  "LLLKKlllKKLLL.",
  "LLKWKlllKWKLL.",
  "LLLKKLLLKKLLL.",
  "LLLlllllllLLL.",
  "LLLllllllLLLL.",
  ".LLlllllllLL..",
  "..LLLLLLLLL...",
  "..HHHHHHHHHH..",
  ".HHhHHHHHHhH..",
  ".HHHHHHHHHHhH.",
  "HHHHHHHHHHHHhH",
  "HHHHHHHHHHHHhH",
  ".HHHHHHHHHHHH.",
  "..HHHHHHHHHH..",
  "...HHH..HHH...",
  "...HHH..HHH...",
  "..HHHH..HHHH..",
  "..HHHH..HHHH..",
];

// Donkey Kong: brown ape, red tie
const SPR_DONKEY = [
  "...MMMMMMMM...",
  "..MMmmMMMmMM..",
  ".MMMMmmMMmMM..",
  "MMMMMMMMmMMM..",
  "MMMMKKMMMKKMm.",
  "MMKWKMMMKWKMm.",
  "MMKKMMMMKKMMm.",
  "MMMMmmmMMMMM..",
  "MMMMMMMMMMMMm.",
  ".MMMmmmmMMM...",
  "..MMMMMMMMM...",
  "..MMMRRRMMM...",
  "..MRRRRRRM....",
  "..MRRRRRRRM...",
  "..MRRRRRRM....",
  "..MMMMMMMM....",
  "..MMMMMMMM....",
  "...MMSSSMM....",
  "...MMSSSM.....",
  "...MMM.MMM....",
  "..MMMM.MMMM...",
  "..MMMM.MMMM...",
];

// Mega Man: blue helmet, light blue visor, buster arm
const SPR_MEGA = [
  "....OOOOOO....",
  "...OOoOOoOOO..",
  "..OOOoooOOOO..",
  "..OOUUUUUoOO..",
  ".OOUuuuuuUOO..",
  ".OOUuEEuuUOO..",
  ".OOUuEEuuUOO..",
  ".OOUuuuuuUOO..",
  ".OOOUUUUUoOO..",
  "..OOOOOOOOO...",
  "..OOOOOOOOOO..",
  ".OOOOOOOOOOO..",
  ".OOOOoOOOOOO..",
  "OOOOOOOOOOOOO.",
  "OOoOoOOOOOOO..",
  "OOOOOOOOOOOOO.",
  ".OOOOOOOOOOO..",
  "..OOOOOOOOO...",
  "..OOO....OOO..",
  "..OOO....OOO..",
  ".OOOO....OOOO.",
  ".OOOO....OOOO.",
];

// Samus: orange power suit, green visor
const SPR_SAMUS = [
  "....LLLLLL....",
  "...LLllLLLL...",
  "..LLLllLLLLL..",
  "..LLHHHHHLll..",
  ".LLHhhhhhHLL..",
  ".LLHhGGGhHLL..",
  ".LLHhGGGhHLL..",
  ".LLHhhhhhHLL..",
  "..LLHHHHHlLL..",
  "...LLLLLLLLL..",
  "..LLLLLLLLLLL.",
  ".LLLlLLLLLLL..",
  ".LLLLLLLLllL..",
  "LLLLLLLLLLlLL.",
  "LLllLLLLLLLLL.",
  "LLLLlllllLLLL.",
  ".LLLLLLLLllL..",
  "..LLLLLLLLL...",
  "..LLL....LLL..",
  "..LLL....LLL..",
  ".LLLL....LLLL.",
  ".LLLL....LLLL.",
];

// Crash Bandicoot: orange fur, jeans, spiky hair
const SPR_CRASH = [
  "....LLLLLL....",
  "...LLlLLLlLL..",
  "..LLLlLLLlLLL.",
  ".LLLLlLLLlLLL.",
  ".LLLLLLLLLLLl.",
  "LLLLllllllllLL",
  "LLlKKlllKKlLL.",
  "LlKWKlllKWKlL.",
  "LLlKKlllKKlLL.",
  "LLlllllllllLL.",
  ".LLlllKlllLL..",
  "..LLKKKKlLL...",
  "..OOOOOOlLL...",
  ".OOoOOOOlLLL..",
  ".OOoOOOoOLL...",
  ".OOOOOOoOOO...",
  "..OOOOOOOO....",
  "..OOOOOOO.....",
  "..KKKK.KKKK...",
  "..KKKK.KKKK...",
  ".KKKKK.KKKKK..",
  ".KKKKK.KKKKK..",
];

// Steve (Minecraft): square head, blue shirt, dark jeans
const SPR_STEVE = [
  ".....SSSSSS...",
  "....SSSSSSSS..",
  "...SSSSSSSSSs.",
  "...SSSSSSSSSs.",
  "...SSKSSKSSSs.",
  "...SSKSSKSSSs.",
  "...SSSSSSSSs..",
  "...SSrSSrSSs..",
  "...SSSSSSSSs..",
  "....SSSSSSS...",
  "...UUUUUUUUU..",
  "..UUuUUUUUUU..",
  "..UUuUUUUUUU..",
  ".UUUuUUUUUUUU.",
  ".UUUUUUUUUUUu.",
  ".UUUuuuuuUUUu.",
  "..UUUUUUUUUU..",
  "..UUUUUUUUUU..",
  "..OOO....OOO..",
  "..OOO....OOO..",
  ".OOOO....OOOO.",
  ".OOOO....OOOO.",
];

// Pokeball: red/white split, black band, white center
const SPR_POKEBALL = [
  "....RRRRRR....",
  "...RRRRRRRR...",
  "..RRRRRRRRRR..",
  ".RRRRRRRRRRRR.",
  ".RRRRRRRRRRRR.",
  "RRRRRRRRRRRRRR",
  "RRRRRRRRRRRRRR",
  "KKKKKKKKKKKKKK",
  "KKKKKWWWWKKKK.",
  "KKKKWWWWWWKKKk",
  "KKKKWWWWWWKKKk",
  "KKKKKWWWWKKKKk",
  "KKKKKKKKKKKKKK",
  "WWWWWWWWWWWWWW",
  "WWWWWWWWWWWWWW",
  "WWWWWWWWWWWWWW",
  ".WWWWWWWWWWWW.",
  ".WWWWWWWWWWWW.",
  "..WWWWWWWWWW..",
  "..WWWWWWWWWW..",
  "...WWWWWWWW...",
  "....WWWWWW....",
];

// Tetris T-piece: purple blocks
const SPR_TETRIS = [
  "...............",
  "...............",
  "...............",
  "...............",
  "...............",
  "...............",
  "....TTTTTTTT..",
  "....TTttttTT..",
  "....TTttttTT..",
  "....TTTTTTTT..",
  "TTTTTTTTTTTTTT",
  "TtttttttttttT.",
  "TtttttttttttT.",
  "TTTTTTTTTTTTTT",
  "....TTTTTTTT..",
  "....TTttttTT..",
  "....TTttttTT..",
  "....TTTTTTTT..",
  "...............",
  "...............",
  "...............",
  "...............",
];

// Space Invader: green pixel crab silhouette
const SPR_INVADER = [
  "...............",
  "..HH......HH..",
  "...HH....HH...",
  "..HHHHHHHHHH..",
  ".HHhHHHHHhHH..",
  "HHHHHHHHHHHHHH",
  "HhHhHhHhHhHhH.",
  "HHHHHHHHHHHHHH",
  ".HH.HHHHHH.HH.",
  "..HH.HHHH.HH..",
  "...............",
  ".HHH......HHH.",
  ".HHH......HHH.",
  "...............",
  "...............",
  "...............",
  "...............",
  "...............",
  "...............",
  "...............",
  "...............",
  "...............",
];

// Master Chief: dark green armor, gold visor
const SPR_CHIEF = [
  "....GGGGGG....",
  "...GGGGGGGG...",
  "..GGGGGGGGGg..",
  "..GGYYYYYYGg..",
  ".GGYyyyyyYGg..",
  ".GGYyyyyYYGg..",
  ".GGYyyyyYYGg..",
  ".GGYyyyyyYGg..",
  "..GGYYYYYYGg..",
  "...GGGGGGGg...",
  "..GGGGGGGGGG..",
  ".GGGgGGGGGGG..",
  ".GGGGGGGGGgG..",
  "GGGGGGGGGGgGG.",
  "GGgGGGGGGGGGG.",
  "GGGGgggggGGGG.",
  ".GGGGGGGGGGGG.",
  "..GGGGGGGGGG..",
  "..GGG....GGG..",
  "..GGG....GGG..",
  ".GGGG....GGGG.",
  ".GGGG....GGGG.",
];

// Astro Boy: white/black suit, red boots, spiky hair
const SPR_ASTRO = [
  "....KKKKKK....",
  "...KKSSSKK....",
  "..KKSSSSSSKK..",
  ".KKSSKKSSKKs..",
  ".KKSSKKSSKKs..",
  ".KKSSSSSSKKs..",
  ".KKSSSSSSKKs..",
  "..KKSSSSSKs...",
  "...KSSSSSK....",
  "....KSSSK.....",
  "..CCCCCCCCCC..",
  ".CCcCCCCCCCC..",
  ".CCCCCCCCCcC..",
  "CCCCCCCCCCcCC.",
  "CCcCCCCCCCCCC.",
  "CCCCcccccCCCC.",
  ".CCCCCCCCCCCC.",
  "..CCCCCCCCCC..",
  "..RRR....RRR..",
  "..RRR....RRR..",
  ".RRRR....RRRR.",
  ".RRRR....RRRR.",
];

// Generic skeleton for all new avatars
const SPR_SKEL_GENERIC = [
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

// Procedural loop sprite: 1 image = toute la boucle (2 rails argentés + 18 traverses bois)
// Évite de spawner 90+ entités par boucle. TILE=32, rx=48, ry=32 (loop size).
export function makeLoopSpriteUrl() {
  const TILE = 32;
  const rx = TILE * 1.5;
  const ry = TILE;
  const pad = 8;
  const W = Math.ceil(2 * rx + 2 * pad);
  const H = Math.ceil(2 * ry + 2 * pad);
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const ctx = c.getContext("2d");
  const cx = W / 2;
  const cy = H / 2;
  // Brown sleepers (drawn first, behind rails)
  ctx.fillStyle = "#643c1e";
  ctx.strokeStyle = "#281408";
  ctx.lineWidth = 1;
  const tieCount = 18;
  for (let i = 0; i < tieCount; i++) {
    const a = (i / tieCount) * Math.PI * 2;
    const tx = cx + Math.cos(a) * rx;
    const ty = cy + Math.sin(a) * ry;
    const tangent = Math.atan2(Math.cos(a) * ry, -Math.sin(a) * rx) + Math.PI / 2;
    ctx.save();
    ctx.translate(tx, ty);
    ctx.rotate(tangent);
    ctx.fillRect(-2.5, -6.5, 5, 13);
    ctx.strokeRect(-2.5, -6.5, 5, 13);
    ctx.restore();
  }
  // Silver rail bands (inner + outer)
  ctx.strokeStyle = "#46465a";
  ctx.lineWidth = 5;
  for (const dr of [-3, 3]) {
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx + dr, ry + dr, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.strokeStyle = "#d2d2e1";
  ctx.lineWidth = 3;
  for (const dr of [-3, 3]) {
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx + dr, ry + dr, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  return c.toDataURL();
}

// PALETTE additions needed: T=violet for tetris
// T and t already defined? T="#6b3c1a" — reuse with custom approach
// We use inline PALETTE overrides via substituteSprite trick:
// For SPR_TETRIS T/t conflict (brown) — remap to a violet using a dedicated constant

const SPR_TETRIS_COLORED = substituteSprite(SPR_TETRIS, { T: "P", t: "p" });

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
    k.loadSprite("skeleton_generic", makeSpriteUrl(SPR_SKEL_GENERIC, 2)),
    k.loadSprite("sonic", makeSpriteUrl(SPR_SONIC, 2)),
    k.loadSprite("link", makeSpriteUrl(SPR_LINK, 2)),
    k.loadSprite("pacman", makeSpriteUrl(SPR_PACMAN, 2)),
    k.loadSprite("kirby", makeSpriteUrl(SPR_KIRBY, 2)),
    k.loadSprite("yoshi", makeSpriteUrl(SPR_YOSHI, 2)),
    k.loadSprite("bowser", makeSpriteUrl(SPR_BOWSER, 2)),
    k.loadSprite("donkey", makeSpriteUrl(SPR_DONKEY, 2)),
    k.loadSprite("mega", makeSpriteUrl(SPR_MEGA, 2)),
    k.loadSprite("samus", makeSpriteUrl(SPR_SAMUS, 2)),
    k.loadSprite("crash", makeSpriteUrl(SPR_CRASH, 2)),
    k.loadSprite("steve", makeSpriteUrl(SPR_STEVE, 2)),
    k.loadSprite("pokeball", makeSpriteUrl(SPR_POKEBALL, 2)),
    k.loadSprite("tetris", makeSpriteUrl(SPR_TETRIS_COLORED, 2)),
    k.loadSprite("invader", makeSpriteUrl(SPR_INVADER, 2)),
    k.loadSprite("chief", makeSpriteUrl(SPR_CHIEF, 2)),
    k.loadSprite("astro", makeSpriteUrl(SPR_ASTRO, 2)),
    k.loadSprite("rail_loop_visual", makeLoopSpriteUrl()),
  ]);
}
