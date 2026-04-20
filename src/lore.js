const LORE_PHRASES = [
  "Avant la lave, ici poussaient des fraises.",
  "Les wagons se souviennent de leurs passagers.",
  "Le chef-mecanicien reve encore au sommet de la grande roue.",
  "Les visiteurs dansent dans le miroir, mais sans reflet.",
  "On entend parfois un rire d'enfant dans la lave qui bouillonne.",
  "La fontaine sait qui a soif et qui a peur.",
  "Le squelette en chapeau melon collectionne les piecettes.",
  "Les rails ont la memoire des vitesses passees.",
  "Au crepuscule, les bancs se rapprochent du feu.",
  "Le portail ne mene jamais deux fois au meme endroit.",
  "Le marchand de barbe a papa a oublie son nom.",
  "La cascade pleure tous les visiteurs perdus.",
  "Le pont gemit la nuit sous des pas absents.",
  "Quelque part, un enfant rit. Personne ne l'a jamais vu.",
];

export function createLoreSystem({ k, save, persistSave, WIDTH, HEIGHT }) {
  if (save.loreSeen === undefined) save.loreSeen = 0;

  let active = false;
  let activeUntil = 0;
  let activePhrase = "";

  function pickUnseenPhrase() {
    const unseen = [];
    for (let i = 0; i < LORE_PHRASES.length; i++) {
      if ((save.loreSeen & (1 << i)) === 0) unseen.push(i);
    }
    if (unseen.length === 0) {
      const idx = Math.floor(Math.random() * LORE_PHRASES.length);
      return { idx, phrase: LORE_PHRASES[idx] };
    }
    const pickedIdx = unseen[Math.floor(Math.random() * unseen.length)];
    save.loreSeen |= (1 << pickedIdx);
    persistSave(save);
    return { idx: pickedIdx, phrase: LORE_PHRASES[pickedIdx] };
  }

  function show() {
    if (active) return;
    const { phrase } = pickUnseenPhrase();
    activePhrase = phrase;
    active = true;
    activeUntil = k.time() + 4.5;
  }

  function getPhraseCount() { return LORE_PHRASES.length; }
  function getSeenCount() {
    let n = 0;
    for (let i = 0; i < LORE_PHRASES.length; i++) {
      if (save.loreSeen & (1 << i)) n++;
    }
    return n;
  }

  k.add([
    k.pos(0, 0),
    k.fixed(),
    k.z(45),
    {
      draw() {
        if (!active) return;
        const remaining = activeUntil - k.time();
        if (remaining <= 0) { active = false; return; }
        const t = 1 - remaining / 4.5;
        const opacity = t < 0.09 ? t / 0.09 : (t > 0.87 ? (1 - (t - 0.87) / 0.13) : 1);

        const cardW = 540;
        const cardH = 100;
        const cx = WIDTH / 2 - cardW / 2;
        const cy = HEIGHT / 2 - cardH / 2 - 80;

        k.drawRect({
          pos: k.vec2(cx, cy), width: cardW, height: cardH,
          color: k.rgb(20, 25, 50),
          opacity: opacity * 0.85,
          outline: { color: k.rgb(180, 180, 220), width: 2 },
          radius: 4,
        });
        k.drawRect({
          pos: k.vec2(cx + 4, cy + 4), width: cardW - 8, height: 2,
          color: k.rgb(220, 200, 120),
          opacity: opacity * 0.6,
        });
        k.drawRect({
          pos: k.vec2(cx + 4, cy + cardH - 6), width: cardW - 8, height: 2,
          color: k.rgb(220, 200, 120),
          opacity: opacity * 0.6,
        });

        k.drawText({
          text: activePhrase,
          size: 16,
          pos: k.vec2(WIDTH / 2, cy + 38),
          anchor: "center",
          color: k.rgb(240, 240, 255),
          opacity: opacity * 0.95,
        });
        k.drawText({
          text: "~ Le Conte du Parc ~",
          size: 11,
          pos: k.vec2(WIDTH / 2, cy + 70),
          anchor: "center",
          color: k.rgb(200, 200, 230),
          opacity: opacity * 0.6,
        });
      },
    },
  ]);

  return { show, getPhraseCount, getSeenCount, pickUnseenPhrase };
}
