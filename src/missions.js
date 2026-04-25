export function createMissions({ k, gameState, audio, showPopup, WIDTH }) {
  const TEMPLATES = [
    { id: "score_1k",   label: "Atteins +1000 pts",      duration: 60, reward: 200, check: (s) => gameState.score - s.score >= 1000 },
    { id: "coins_8",    label: "Collecte 8 pieces",       duration: 75, reward: 150, check: (s) => gameState.coins - s.coins >= 8 },
    { id: "skel_3",     label: "Transforme 3 visiteurs",  duration: 90, reward: 250, check: (s) => (gameState.sessionSkeletons || 0) - s.sessionSkeletons >= 3 },
    { id: "survive_60", label: "Survis 60 secondes",      duration: 60, reward: 100, check: (s) => k.time() - s.time >= 60 },
    { id: "score_2500", label: "Score +2500 pts",         duration: 90, reward: 400, check: (s) => gameState.score - s.score >= 2500 },
  ];
  let current = null;
  let lastId = null;
  let coolUntil = k.time() + 5;
  let popPulse = 0;

  function pickNext() {
    const choices = TEMPLATES.filter((t) => t.id !== lastId);
    return choices[Math.floor(Math.random() * choices.length)];
  }

  function startNext() {
    const tpl = pickNext();
    lastId = tpl.id;
    current = {
      ...tpl,
      until: k.time() + tpl.duration,
      snapshot: {
        score: gameState.score,
        coins: gameState.coins,
        skeletons: gameState.skeletons || 0,
        sessionSkeletons: gameState.sessionSkeletons || 0,
        time: k.time(),
      },
      done: false,
      progress: 0,
    };
  }

  k.loop(0.2, () => {
    const t = k.time();
    if (!current) {
      if (t >= coolUntil) startNext();
      return;
    }
    if (current.done) return;
    const s = current.snapshot;
    let p = 0;
    if (current.id === "score_1k") p = (gameState.score - s.score) / 1000;
    else if (current.id === "coins_8") p = (gameState.coins - s.coins) / 8;
    else if (current.id === "skel_3") p = ((gameState.sessionSkeletons || 0) - s.sessionSkeletons) / 3;
    else if (current.id === "survive_60") p = (t - s.time) / 60;
    else if (current.id === "score_2500") p = (gameState.score - s.score) / 2500;
    current.progress = Math.max(0, Math.min(1, p));
    if (current.check(s)) {
      current.done = true;
      gameState.score += current.reward;
      audio.gold?.();
      showPopup(WIDTH / 2, 70, "MISSION OK ! +" + current.reward, k.rgb(120, 240, 120), 22);
      popPulse = k.time();
      coolUntil = k.time() + 3;
      k.wait(3, () => { current = null; });
    } else if (t > current.until) {
      current.done = true;
      showPopup(WIDTH / 2, 70, "MISSION EXPIRE", k.rgb(160, 160, 160), 18);
      coolUntil = k.time() + 3;
      k.wait(3, () => { current = null; });
    }
  });

  k.add([
    k.pos(0, 0),
    k.z(22),
    k.fixed(),
    {
      draw() {
        if (!current) return;
        const x = WIDTH - 220;
        const y = 10;
        const t = k.time();
        const dt = t - popPulse;
        const scale = (popPulse > 0 && dt < 0.4) ? 1 + 0.2 * (1 - dt / 0.4) : 1;
        const bw = 200 * scale;
        const bh = 46 * scale;
        k.drawRect({
          pos: k.vec2(x, y),
          width: bw + 2,
          height: bh + 2,
          color: k.rgb(220, 220, 220),
          opacity: 0.85,
        });
        k.drawRect({
          pos: k.vec2(x + 1, y + 1),
          width: bw,
          height: bh,
          color: k.rgb(0, 0, 0),
          opacity: 0.6,
        });
        k.drawText({
          text: "MISSION : " + current.label,
          pos: k.vec2(x + 8, y + 5),
          size: 12,
          color: k.rgb(245, 245, 245),
        });
        const barX = x + 8;
        const barY = y + 28;
        const barW = 130;
        k.drawRect({ pos: k.vec2(barX, barY), width: barW, height: 6, color: k.rgb(50, 50, 50) });
        const pct = Math.max(0, Math.min(1, current.progress));
        const col = pct >= 1 ? k.rgb(120, 240, 120) : k.rgb(255, 220, 80);
        k.drawRect({ pos: k.vec2(barX, barY), width: barW * pct, height: 6, color: col });
        const remain = Math.max(0, Math.ceil(current.until - t));
        const mm = String(Math.floor(remain / 60)).padStart(1, "0");
        const ss = String(remain % 60).padStart(2, "0");
        k.drawText({
          text: mm + ":" + ss,
          pos: k.vec2(x + 192, y + 26),
          size: 11,
          color: k.rgb(255, 220, 80),
          anchor: "topright",
        });
      },
    },
  ]);

  return { startNext };
}
