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

// Mario 20×30 — VUE DE PROFIL (side-view), face tournée vers la droite.
// Casquette arrondie avec visor qui pointe vers la droite, un seul œil visible,
// mustache sur le côté, un bras tendu vers l'avant (main peau visible à droite),
// jambes en stride pose (asymétriques pour suggérer la marche).
// Rendered 40×60 px (scale 2). Luigi/Toad dérivent via substituteSprite.
const SPR_PLAYER = [
  "........RRRRRR......",
  ".......RRRRRRRR.....",
  "......RRRRRRRRRR....",
  ".....RRRRRRRRRRRR...",
  "....RRRRRRRRRRRRRR..",
  "....RWWWWWWWWWWWRR..",
  "....RRRRRRRRRRRRRR..",
  "......RRRRRRRR......",
  ".......SSSSSSS......",
  "......SSSSSSSSS.....",
  ".....BBSSSSSSSSS....",
  ".....BBSSSSSSKSSS...",
  ".....BBSSSSSSKSSS...",
  ".....BBSSSSSsSSSS...",
  ".....BBSSMMMMMMSS...",
  ".....BBSSMMMrrMSS...",
  "......SSSSSSSSSS....",
  "......RRRRRRRRRRR...",
  ".....RRRRRRRRRRRRSS.",
  "....OORRRRRRRRRRRS..",
  "....OORRRYYYYRRRRS..",
  "....OORRRRRRRRRRRR..",
  "....OOOOOOOOOOOOOO..",
  "....OOOOOOOOOOOOOO..",
  ".....OOOOOOOOOOOO...",
  ".....OOOO...OOOOO...",
  ".....OOO......OOOOO.",
  ".....BBB......BBBBB.",
  "....BBBB....BBBBBBB.",
  "...bbb......bbbbbbb.",
];

const SPR_PLAYER_SKEL = [
  "........RRRRRR......",
  ".......RRRRRRRR.....",
  "......RRRRRRRRRR....",
  ".....RRRRRRRRRRRR...",
  "....RRRRRRRRRRRRRR..",
  "....RWWWWWWWWWWWRR..",
  "....RRRRRRRRRRRRRR..",
  "......RRRRRRRR......",
  ".......XXXXXXX......",
  "......XXXXXXXXX.....",
  ".....XXXXXXXXXXX....",
  ".....XXXXXXXKKXXX...",
  ".....XXXXXXXKKXXX...",
  ".....XXXXXXXXXXXX...",
  ".....XXKxKKKKKxXX...",
  ".....XxxxxxxxxxXX...",
  "......XXXXXXXXXX....",
  "......XXXXXXXXXXX...",
  ".....XXKXXXXXXXKXX..",
  "....XXKXXXXXXXXXKXX.",
  "....XXKXXXXXXXXXKXX.",
  "....XXXKKKKKKKKKXXX.",
  "....XXXXXXXXXXXXXX..",
  "....XXXXXXXXXXXXXX..",
  ".....XXXXXXXXXXXX...",
  ".....XXXX...XXXXX...",
  ".....XXX......XXXXX.",
  ".....XXX......XXXXX.",
  "....XXXX....XXXXXXX.",
  "...xxx......xxxxxxx.",
];

// Pika 20×30 — VUE DE PROFIL vers la droite.
// Oreille avant pointue (droite), oreille arrière partielle (gauche),
// joue rose côté droit, un œil noir, queue éclair col 0-1, pattes stride.
const SPR_PIKA = [
  ".......KK.KK........",
  "......KKKKKKKK......",
  ".....YKKKKKKKY......",
  ".....YYKKYYKKYYY....",
  ".....YYYYYYYYYY.....",
  "....YYYYYYYYYYYYYY..",
  "...YYYYYYYYYYYYYY...",
  "...YYYYYYY.KYYYYY...",
  "...YYYYYYY.KYYYYY...",
  "...YYYYYYYYYYYYYY...",
  "...YYYYYYYPPYYYyYY..",
  "...YYYYYYYPPYYYyYY..",
  "...YYYYYYYYKKYYYyY..",
  "...YYYYYYYYYYYYYY...",
  "...YYYYYYYYYYYYYY...",
  "y..YYYYYYYYYYYYYY...",
  "yY.YYYYYYYYYYYYYY...",
  "...YYYYYYYYYYYYYY...",
  "....YYYYYYY.YYYYY...",
  "....YYYYYYY.YYYYY...",
  "....YYYYYYYYYYYYYY..",
  ".....YYYYYYYYYYY....",
  ".....YYY....YYYY....",
  ".....YYY.....YYY....",
  ".....BBB.....BBB....",
  ".....BBB.....BBB....",
  "....BBBB....BBBB....",
  "....BBBB....BBBB....",
  "....bbbb....bbbb....",
  "....................",
];

const SPR_PIKA_SKEL = [
  ".......KK.KK........",
  "......KKKKKKKK......",
  ".....XKKKKKKKY......",
  ".....XXKKXXKKXXX....",
  ".....XXXXXXXXXXXX...",
  "....XXXXXXXXXXXXXX..",
  "...XXXXXXXXXXXXXX...",
  "...XXXXXXX.KXXXXX...",
  "...XXXXXXX.KXXXXX...",
  "...XXXXXXXXXXXXXX...",
  "...XXXXXXXKKXXXxXX..",
  "...XXXXXXXKKXXXxXX..",
  "...XXXXXXXXKXXXxX...",
  "...XXXXXXXXXXXXXX...",
  "...XXXXXXXXXXXXXX...",
  "x..XXXXXXXXXXXXXX...",
  "xX.XXXXXXXXXXXXXX...",
  "...XXXXXXXXXXXXXX...",
  "....XXXXXXX.XXXXX...",
  "....XXXXXXX.XXXXX...",
  "....XXXXXXXXXXXXXXXX",
  ".....XXXXXXXXXX.....",
  ".....XXX....XXXX....",
  ".....XXX.....XXX....",
  ".....XXX.....XXX....",
  ".....XXX.....XXX....",
  "....XXXX....XXXX....",
  "....XXXX....XXXX....",
  "....xxxx....xxxx....",
  "....................",
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

// Sonic 20×30 — VUE DE PROFIL vers la droite.
// Spikes vers l'arrière (gauche), muzzle blanc à droite, un œil noir,
// gant blanc bras tendu avant (droite), chaussures rouges stride asymétrique.
const SPR_SONIC = [
  "ooo.................",
  "oOOo................",
  "oOOOo...............",
  ".OOOOo..............",
  ".OOOOOOoo...........",
  ".OOOOOOOOoo.........",
  "..OOOOOOOOOOooo.....",
  "..OOOOOOOOOKoOOOO...",
  "..OOOOOOOOOKoOWWWO..",
  "..OOOOOOOOOOOOWWWO..",
  "...OOOOOOOOOOOOWWOo.",
  "....OOOOOOOOOOOOWO..",
  "....OOOOOOOOOOOOWO..",
  "...OOOOOOOOOOOOOOO..",
  "...OOOOOOOOOOOOO....",
  "...OOOOOOOOOOOOOO...",
  "....OOOOOOOOOOOOOOO.",
  ".....OOOOOOOOOOOOOO.",
  "....OOOOOOOOOOOOOO..",
  "....OOOOOOOOOOOO....",
  ".....OOOOOOOOOOO....",
  ".....OOOO...OOOO....",
  "W....OOOO...OOOO....",
  "WO...RRRR...RRRR....",
  ".OO.RRRRRR.RRRRR....",
  "....RWWRRR.RRRWWr...",
  "....RRRRR...RRRR....",
  "....RRRRR...RRRR....",
  "....rrrr.....rrrr...",
  "....................",
];

// Link 20×30 — VUE DE PROFIL vers la droite.
// Bonnet vert pointu retombant vers la droite, cheveux blonds, un œil noir,
// tunique verte, bouclier marron dans le dos (gauche), bottes brunes stride.
const SPR_LINK = [
  "..........GGGGGGGG..",
  ".........GGGGGGGGG..",
  "........GGGGGGGGGGG.",
  ".......GGGGGGGGGGGGG",
  "......GGGGGGGGGGGGGG",
  "....GGGGGGGGGGGGGG..",
  "....GGGGGGGGGGGG....",
  "....GGGGGGGGG.......",
  "....YYYYYYYYYY......",
  "...YYYYSSSSSSSYY....",
  "...YYYSSSSKSSSYY....",
  "...YYYYSSSSSSYYY....",
  "....YSSSSSSSSSY.....",
  ".B..SSSSSSSSSS......",
  "BB..GGGGGGGGGG......",
  "BB.GGGGGGGGGGGGG....",
  "B..GGGGGGGGGGGGGGG..",
  "...GGGGGGGGGGGGGGG..",
  "...GGGGGGGGGGGGGGG..",
  "....GGGGGGGGGGGGG...",
  "....GGGGGGGGGGGGG...",
  ".....GGG....GGGG....",
  ".....GGG....GGGG....",
  ".....BBB....BBB.....",
  "....BBBB....BBBB....",
  "...BBBBB....BBBBB...",
  "..BBBBBBB..BBBBBBB..",
  ".BBBBBBBB..BBBBBBB..",
  "..bbbbbb....bbbbbb..",
  "....................",
];

// Pac-Man 20×30 — rond jaune avec wedge mouth ouverte à droite, œil noir.
const SPR_PACMAN = [
  "....................",
  "....................",
  ".......YYYYYY.......",
  ".....YYYYYYYYYY.....",
  "....YYYYYYYYYYYY....",
  "...YYYYYYYYYYYYYY...",
  "..YYYYKKYYYYYYYYYY..",
  "..YYYYKKYYYYYYY.....",
  ".YYYYYYYYYYYYY......",
  ".YYYYYYYYYYY........",
  ".YYYYYYYY...........",
  ".YYYYYYY............",
  ".YYYYYYY............",
  ".YYYYYYYY...........",
  ".YYYYYYYYYYY........",
  ".YYYYYYYYYYYYY......",
  "..YYYYYYYYYYYYYYYY..",
  "..YYYYYYYYYYYYYYYY..",
  "...YYYYYYYYYYYYYY...",
  "....YYYYYYYYYYYY....",
  ".....YYYYYYYYYY.....",
  ".......YYYYYY.......",
  "....................",
  "....................",
  "....................",
  "....................",
  "....................",
  "....................",
  "....................",
  "....................",
];

// Kirby 20×30 — VUE DE PROFIL vers la droite.
// Bouche à droite, un œil noir, joue rouge visible côté droit,
// petit bras tendu à droite, pied avant et pied arrière rouge.
const SPR_KIRBY = [
  "....................",
  "....................",
  ".......PPPPPP.......",
  ".....PPPPPPPPPP.....",
  "....PPPPPPPPPPPP....",
  "...PPPPPPPPPPPPPP...",
  "..PPPPPPPPPPPPPPPP..",
  "..PPPPPPPPPPPPPPPPP.",
  "..PPPPPKKPPPPPpppp..",
  "..PPPPPKKPPPPPpppp..",
  "..PPPPPPPPPPpppppp..",
  "..PPPPPPRPPPppKKpp..",
  "..PPPPPPRPPPppKKpp..",
  "..PPPPPPPPPPpppppp..",
  "..PPPPPPPPPPppPPP...",
  "..PPPPPPPPPPPPPP....",
  "..PPPPPPPPPPPPPP.P..",
  "...PPPPPPPPPPPPPP...",
  "....PPPPPPPPPPPP....",
  ".....PPPPPPPPPP.....",
  "......PPPPPPPP......",
  "....................",
  "....RRRR............",
  "...RRRRRR..RRRR.....",
  "..RRRRRRRRRRRRRR....",
  "..rrrrrr....rrrrrr..",
  "....................",
  "....................",
  "....................",
  "....................",
];

// Yoshi 20×30 — VUE DE PROFIL vers la droite.
// Long museau/nez vert vers la droite, narine, un œil vert avec pupille noire,
// selle rouge sur le dos, ventre blanc, pattes en stride orange.
const SPR_YOSHI = [
  "....................",
  "....................",
  "........GGGGG.......",
  ".......GGGGGGGG.....",
  "......GGGGGGGGGG....",
  ".....GGGGGGGGGGGgg..",
  "....GGGGGGGGGGGGGGG.",
  "....GGGGGGGGGGGGGGG.",
  "....GWWGGGGGGGGGGGG.",
  "....GWWKGGGGGGGGGGG.",
  "....GGGGGGGGGGGGGG..",
  "....GGRRRGGGGGGGGGG.",
  "....GGGGGGGGGGGGGG..",
  "....GGGGGGGGGGGGGG..",
  "...GGGGGWWWWWWWWGG..",
  "...GGGGWWWWWWWWWWG..",
  "...GGGWWWRRWWWWWWG..",
  "...GGGWWWWWWWWWWWG..",
  "...GGGGWWWWWWWWWGG..",
  "....GGGGGGGGGGGGG...",
  "....GGGGGGGGGGGGG...",
  ".....GGG...GGG......",
  ".....GGG...GGG......",
  "....LLLL..LLLL......",
  "...LLLLL..LLLLL.....",
  "..LLLLLL..LLLLLL....",
  "..llllll..llllll....",
  "....................",
  "....................",
  "....................",
];

// Bowser 20×30 — VUE DE PROFIL vers la droite.
// Museau orange tendu à droite, cornes noires vers l'arrière (gauche),
// un œil, carapace verte épineuse dans le dos, pattes en stride.
const SPR_BOWSER = [
  ".KK.................",
  ".KKK................",
  ".KKKK...............",
  "..LLLLL.............",
  "..LLLLLLLL..........",
  "..LLLKKLLLLLLLLlll..",
  "..LLKKKLLLLLLLLlll..",
  "..LLLKKLLLLLLLLlll..",
  "..LLLLLLLLLLLLLLLLL.",
  "..LLLLLLLlllLLLLLLL.",
  "..LLLllllllllLLLLLL.",
  "...LLLLLLLLLLLLLL...",
  "...LLLLLLLLLLLLL....",
  "...HHHHHHHHHHHHHHHh.",
  "...HHKHHHHHHHHHHHHh.",
  "...HHHHHHHHHHHHHHHH.",
  "...HHhhHHHHHHHHHHH..",
  "...HHHHHHHHHHHHHHH..",
  "...HHhhHHHHHHHHHH...",
  "...HHHHHHHHHHHHHH...",
  "....HHHHHHHHHHHH....",
  "....HHHHHHHHHHH.....",
  ".....HHH...HHH......",
  ".....HHH...HHH......",
  "....LLLL...LLLL.....",
  "...LLLLL...LLLLL....",
  "..LLLLLL...LLLLLL...",
  "..llllll...llllll...",
  "....................",
  "....................",
];

// Donkey Kong: brown ape, red tie
// DK 20×30 — brun (cap M) avec visage blanc (W remplace peau) via substituteSprite.
const SPR_DONKEY = substituteSprite(SPR_PLAYER, { R: "M", r: "m", O: "M", o: "m", S: "W", s: "W" });

// Mega Man 20×30 — robot bleu/cyan dérivé de Mario profil (cap→cyan via U, body bleu conservé).
const SPR_MEGA = substituteSprite(SPR_PLAYER, { R: "U", r: "u" });

// Samus 20×30 — armure orange avec visor vert, dérivé de Mario profil.
const SPR_SAMUS = substituteSprite(SPR_PLAYER, { R: "L", r: "l", O: "L", o: "l", S: "G", s: "g" });

// Crash 20×30 — fourrure orange (cap→L) + pantalon bleu conservé, dérivé.
const SPR_CRASH = substituteSprite(SPR_PLAYER, { R: "L", r: "l" });

// Steve (Minecraft) 20×30 — cheveux bruns (cap→M), chemise cyan (O→U), dérivé.
const SPR_STEVE = substituteSprite(SPR_PLAYER, { R: "M", r: "m", O: "U", o: "u" });

// Pokeball 20×30 — boule rouge/blanche avec bande noire + bouton central blanc.
const SPR_POKEBALL = [
  "....................",
  "....................",
  ".......RRRRRR.......",
  ".....RRRRRRRRRR.....",
  "....RRRRRRRRRRRR....",
  "...RRRRRRRRRRRRRR...",
  "..RRRRRRRRRRRRRRRR..",
  "..RRRRRRRRRRRRRRRR..",
  "..KKKKKKKKKKKKKKKK..",
  "..KKKKKKWWWWKKKKKK..",
  "..KKKKKWWKKWWKKKKK..",
  "..KKKKKWWKKWWKKKKK..",
  "..KKKKKKWWWWKKKKKK..",
  "..KKKKKKKKKKKKKKKK..",
  "..WWWWWWWWWWWWWWWW..",
  "..WWWWWWWWWWWWWWWW..",
  "...WWWWWWWWWWWWWW...",
  "....WWWWWWWWWWWW....",
  ".....WWWWWWWWWW.....",
  ".......WWWWWW.......",
  "....................",
  "....................",
  "....................",
  "....................",
  "....................",
  "....................",
  "....................",
  "....................",
  "....................",
  "....................",
];

// Tetris T-piece 20×30 — 4 blocs violets en T.
const SPR_TETRIS = [
  "....................",
  "....................",
  "....................",
  "....................",
  "....................",
  ".......TTTTTT.......",
  ".......TttttT.......",
  ".......TttttT.......",
  ".......TTTTTT.......",
  ".TTTTTTTTTTTTTTTTTT.",
  ".Ttttttttttttttttt T",
  ".TtttttttttttttttT T",
  ".TTTTTTTTTTTTTTTTTT.",
  ".......TTTTTT.......",
  ".......TttttT.......",
  ".......TttttT.......",
  ".......TTTTTT.......",
  "....................",
  "....................",
  "....................",
  "....................",
  "....................",
  "....................",
  "....................",
  "....................",
  "....................",
  "....................",
  "....................",
  "....................",
  "....................",
];

// Space Invader 20×30 — crabe pixel vert iconique.
const SPR_INVADER = [
  "....................",
  "....................",
  "...HH........HH.....",
  "....HH......HH......",
  "...HHHHHHHHHHHH.....",
  "..HHHhHHHHhHHH......",
  "..HHHHHHHHHHHH......",
  ".HHHHHHHHHHHHHH.....",
  ".HhHhHhHhHhHhHh.....",
  ".HHHHHHHHHHHHHH.....",
  ".HH..HHHHHH..HH.....",
  "..HH..HHHH..HH......",
  "...HHH....HHH.......",
  "..HHH......HHH......",
  "....................",
  "....................",
  "....................",
  "....................",
  "....................",
  "....................",
  "....................",
  "....................",
  "....................",
  "....................",
  "....................",
  "....................",
  "....................",
  "....................",
  "....................",
  "....................",
];

// Chief 20×30 — armure vert foncé avec visor jaune, dérivé de Mario profil.
const SPR_CHIEF = substituteSprite(SPR_PLAYER, { R: "G", r: "g", O: "G", o: "g", S: "Y", s: "y" });

// Astro 20×30 — combinaison blanche avec visor bleu, dérivé.
const SPR_ASTRO = substituteSprite(SPR_PLAYER, { R: "C", r: "c", O: "C", o: "c", S: "O", s: "o" });

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

// Procedural magnet sprite 32×32: horseshoe magnet U-shape.
export function makeMagnetSpriteUrl() {
  const T = 32;
  const c = document.createElement("canvas");
  c.width = T; c.height = T;
  const ctx = c.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  // Main U-body (rouge magnet classique)
  ctx.fillStyle = "#c42020";
  ctx.fillRect(4, 6, 24, 18);       // top bar
  ctx.fillRect(4, 6, 8, 22);        // left leg
  ctx.fillRect(20, 6, 8, 22);       // right leg
  ctx.clearRect(12, 14, 8, 12);     // hollow middle
  // Dark outline
  ctx.strokeStyle = "#5a0a0a";
  ctx.lineWidth = 1;
  ctx.strokeRect(4, 6, 24, 18);
  ctx.strokeRect(4, 6, 8, 22);
  ctx.strokeRect(20, 6, 8, 22);
  // Tip chrome (acier clair) au bas des pôles
  ctx.fillStyle = "#c8c8d8";
  ctx.fillRect(4, 24, 8, 4);
  ctx.fillRect(20, 24, 8, 4);
  ctx.strokeRect(4, 24, 8, 4);
  ctx.strokeRect(20, 24, 8, 4);
  // Pôles N/S (marquage blanc)
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(6, 26, 2, 1);
  ctx.fillRect(22, 26, 2, 1);
  return c.toDataURL();
}

// Procedural trampoline sprite 32×32: base violet + 2 ressorts blancs + surface rose.
export function makeTrampolineSpriteUrl() {
  const T = 32;
  const c = document.createElement("canvas");
  c.width = T; c.height = T;
  const ctx = c.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  // Base socle violet foncé
  ctx.fillStyle = "#3c283c";
  ctx.fillRect(0, 8, T, 24);
  ctx.strokeStyle = "#1e141e";
  ctx.strokeRect(0, 8, T, 24);
  // Ressorts blancs
  ctx.fillStyle = "#c8c8d7";
  ctx.fillRect(6, 10, 4, 20);
  ctx.fillRect(22, 10, 4, 20);
  ctx.strokeStyle = "#50505a";
  ctx.strokeRect(6, 10, 4, 20);
  ctx.strokeRect(22, 10, 4, 20);
  // Strips d'anneaux sur les ressorts (effet spirale)
  ctx.fillStyle = "#5a5a66";
  for (let y = 12; y <= 26; y += 3) {
    ctx.fillRect(6, y, 4, 1);
    ctx.fillRect(22, y, 4, 1);
  }
  // Surface rose (top elastic)
  ctx.fillStyle = "#ff64a0";
  ctx.fillRect(0, 4, T, 6);
  ctx.strokeStyle = "#aa3070";
  ctx.strokeRect(0, 4, T, 6);
  // Highlight rose clair
  ctx.fillStyle = "#ff96c0";
  ctx.fillRect(2, 5, T - 4, 1);
  return c.toDataURL();
}

// Procedural ice sprite 32×32: glace cyan avec shines blancs.
export function makeIceSpriteUrl() {
  const T = 32;
  const c = document.createElement("canvas");
  c.width = T; c.height = T;
  const ctx = c.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = "#b4e6ff";
  ctx.fillRect(0, 0, T, T);
  ctx.strokeStyle = "#64aadc";
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, T - 2, T - 2);
  // shines blancs
  ctx.fillStyle = "#ffffff";
  ctx.globalAlpha = 0.8;
  ctx.fillRect(4, 6, T - 8, 2);
  ctx.globalAlpha = 0.6;
  ctx.fillRect(4, T - 8, T / 2 - 4, 2);
  ctx.globalAlpha = 1;
  return c.toDataURL();
}

// Procedural portal sprite 32×32, variant A (cyan) ou B (magenta).
export function makePortalSpriteUrl(variant = "A") {
  const T = 32;
  const c = document.createElement("canvas");
  c.width = T; c.height = T;
  const ctx = c.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  const core = variant === "A" ? "#50dcf0" : "#f050dc";
  const glow = variant === "A" ? "#c8faff" : "#ffc8fa";
  const cx = T / 2, cy = T / 2;
  // Disque intérieur
  ctx.fillStyle = core;
  ctx.beginPath();
  ctx.arc(cx, cy, T / 2 - 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = glow;
  ctx.lineWidth = 2;
  ctx.stroke();
  // Swirl décoratif (suggère la rotation figée — la vraie rotation est via k.rotate)
  ctx.strokeStyle = glow;
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 3; i++) {
    const a0 = (i / 3) * Math.PI * 2;
    const r = T / 2 - 6;
    ctx.beginPath();
    ctx.arc(cx, cy, r, a0, a0 + Math.PI * 0.4);
    ctx.stroke();
  }
  // Point central
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(cx - 1, cy - 1, 2, 2);
  return c.toDataURL();
}

// Procedural tunnel sprite 32×32: entrée sombre + yeux rouges.
export function makeTunnelSpriteUrl() {
  const T = 32;
  const c = document.createElement("canvas");
  c.width = T; c.height = T;
  const ctx = c.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = "#0f0519";
  ctx.fillRect(0, 0, T, T);
  ctx.strokeStyle = "#502864";
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, T - 2, T - 2);
  // Yeux rouges
  ctx.fillStyle = "#dc3232";
  ctx.beginPath();
  ctx.arc(T * 0.3, T * 0.4, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(T * 0.7, T * 0.4, 3, 0, Math.PI * 2);
  ctx.fill();
  // Pupilles (petit point noir au centre)
  ctx.fillStyle = "#000000";
  ctx.fillRect(T * 0.3 - 1, T * 0.4 - 1, 1, 1);
  ctx.fillRect(T * 0.7 - 1, T * 0.4 - 1, 1, 1);
  return c.toDataURL();
}

// Procedural bridge sprite 32×32: 2 planches bois + support central.
export function makeBridgeSpriteUrl() {
  const T = 32;
  const c = document.createElement("canvas");
  c.width = T; c.height = T;
  const ctx = c.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  // Poteau de support central
  ctx.fillStyle = "#643c14";
  ctx.fillRect(14, 0, 4, T);
  ctx.strokeStyle = "#2d1a08";
  ctx.lineWidth = 1;
  ctx.strokeRect(14, 0, 4, T);
  // Planche principale (surface de marche)
  ctx.fillStyle = "#a06428";
  ctx.fillRect(0, 16, T, 10);
  ctx.strokeStyle = "#50321a";
  ctx.strokeRect(0, 16, T, 10);
  // Lignes de grain bois
  ctx.strokeStyle = "#7a4a1c";
  ctx.beginPath();
  ctx.moveTo(0, 19); ctx.lineTo(T, 19);
  ctx.moveTo(0, 23); ctx.lineTo(T, 23);
  ctx.stroke();
  // Planche inférieure (underside plus foncé)
  ctx.fillStyle = "#824f20";
  ctx.fillRect(0, 26, T, 5);
  ctx.strokeStyle = "#50321a";
  ctx.strokeRect(0, 26, T, 5);
  return c.toDataURL();
}

// Procedural Grande Roue sprite 96×96: ring argenté + 8 rayons + hub + 4 nacelles.
// L'animation rotation se fait en code via k.rotate dans tile.onUpdate.
export function makeWheelSpriteUrl() {
  const S = 96;
  const c = document.createElement("canvas");
  c.width = S; c.height = S;
  const ctx = c.getContext("2d");
  const cx = S / 2; const cy = S / 2;
  const armLen = 44;
  // 8 rayons (4 cardinaux + 4 diagonaux)
  ctx.strokeStyle = "#beaa78";
  ctx.lineWidth = 4;
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(a) * armLen, cy + Math.sin(a) * armLen);
    ctx.stroke();
  }
  // Outer ring
  ctx.strokeStyle = "#beaa78";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(cx, cy, armLen, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = "#6e603c";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(cx, cy, armLen, 0, Math.PI * 2);
  ctx.stroke();
  // Hub central
  ctx.fillStyle = "#d2be8c";
  ctx.beginPath();
  ctx.arc(cx, cy, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#78643c";
  ctx.lineWidth = 2;
  ctx.stroke();
  // 4 nacelles cardinales
  const NAC_COLORS = ["#50dcf0", "#f05050", "#ffd232", "#b450f0"];
  const nacW = 24; const nacH = 16;
  const positions = [
    [cx + armLen, cy],
    [cx, cy + armLen],
    [cx - armLen, cy],
    [cx, cy - armLen],
  ];
  for (let i = 0; i < 4; i++) {
    const [nx, ny] = positions[i];
    ctx.fillStyle = NAC_COLORS[i];
    ctx.fillRect(nx - nacW / 2, ny - nacH / 2, nacW, nacH);
    ctx.strokeStyle = "#1e1e1e";
    ctx.lineWidth = 2;
    ctx.strokeRect(nx - nacW / 2, ny - nacH / 2, nacW, nacH);
  }
  return c.toDataURL();
}

// Procedural loop sprite: 1 image = toute la boucle (2 rails argentés + 18 traverses bois)
// Évite de spawner 90+ entités par boucle. TILE=32, loop 2×2 → rx=ry=TILE.
export function makeLoopSpriteUrl() {
  const TILE = 32;
  const rx = TILE;
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
    k.loadSprite("magnet_visual", makeMagnetSpriteUrl()),
    k.loadSprite("trampoline_visual", makeTrampolineSpriteUrl()),
    k.loadSprite("bridge_visual", makeBridgeSpriteUrl()),
    k.loadSprite("wheel_visual", makeWheelSpriteUrl()),
    k.loadSprite("ice_visual", makeIceSpriteUrl()),
    k.loadSprite("portal_a_visual", makePortalSpriteUrl("A")),
    k.loadSprite("portal_b_visual", makePortalSpriteUrl("B")),
    k.loadSprite("tunnel_visual", makeTunnelSpriteUrl()),
  ]);
}
