const QUEST_TEMPLATES = [
  { id: "skel10", text: "Faire 10 squelettes", target: 10, hook: "skeleton" },
  { id: "skel25", text: "Faire 25 squelettes", target: 25, hook: "skeleton" },
  { id: "coin20", text: "Collecter 20 pieces", target: 20, hook: "coin" },
  { id: "tile15", text: "Poser 15 tuiles", target: 15, hook: "tile" },
  { id: "tile30", text: "Poser 30 tuiles", target: 30, hook: "tile" },
  { id: "wagon5", text: "Spawner 5 wagons", target: 5, hook: "wagon" },
  { id: "lava10", text: "Poser 10 tuiles lave", target: 10, hook: "lava" },
  { id: "rail8", text: "Poser 8 rails", target: 8, hook: "rail" },
  { id: "score500", text: "Atteindre 500 points", target: 500, hook: "score" },
  { id: "score1000", text: "Atteindre 1000 points", target: 1000, hook: "score" },
  { id: "combo5", text: "Combo APOCALYPSE x5", target: 1, hook: "combo5" },
  { id: "loop3", text: "Completer 3 loops", target: 3, hook: "loop" },
  { id: "duck5", text: "Pecher 5 canards", target: 5, hook: "duck" },
  { id: "portal3", text: "Utiliser un portail 3 fois", target: 3, hook: "portal" },
];

function dayOfYear(date = new Date()) {
  const start = new Date(date.getFullYear(), 0, 0);
  return Math.floor((date - start) / 86400000);
}

function pickThree(seed) {
  const rng = (n) => { const x = Math.sin((seed + n) * 9999) * 10000; return x - Math.floor(x); };
  const indices = new Set();
  let n = 0;
  while (indices.size < 3 && n < 50) {
    indices.add(Math.floor(rng(n) * QUEST_TEMPLATES.length));
    n++;
  }
  return [...indices].slice(0, 3).map(i => ({
    ...QUEST_TEMPLATES[i],
    progress: 0,
    done: false,
  }));
}

export function createQuestSystem({ k, save, persistSave, gameState, audio, showPopup, WIDTH }) {
  const today = dayOfYear();
  const todayKey = new Date().toISOString().slice(0, 10);

  if (!save.daily || save.daily.dateKey !== todayKey) {
    const lastDay = save.daily?.dateKey;
    const yesterdayKey = (() => {
      const d = new Date(); d.setDate(d.getDate() - 1);
      return d.toISOString().slice(0, 10);
    })();
    const allDoneYesterday = save.daily?.quests?.every(q => q.done);
    const newStreak = (lastDay === yesterdayKey && allDoneYesterday)
      ? (save.daily?.streak || 0) + 1
      : (allDoneYesterday ? 1 : 0);
    save.daily = {
      dateKey: todayKey,
      quests: pickThree(today),
      streak: newStreak,
      claimed: false,
    };
    persistSave(save);
  }

  function increment(hook, amount = 1) {
    if (!save.daily) return;
    let changed = false;
    for (const q of save.daily.quests) {
      if (q.hook !== hook || q.done) continue;
      q.progress = Math.min(q.target, q.progress + amount);
      if (q.progress >= q.target) {
        q.done = true;
        changed = true;
        showPopup?.(WIDTH / 2, 60, `Quete : ${q.text} !`, k.rgb(80, 220, 120), 18);
        audio?.combo?.();
      }
    }
    if (changed) {
      const allDone = save.daily.quests.every(q => q.done);
      if (allDone && !save.daily.claimed) {
        save.daily.claimed = true;
        showPopup?.(WIDTH / 2, 100, "JOURNEE COMPLETE !", k.rgb(255, 200, 60), 22);
        if (save.daily.streak >= 6) {
          window.__spectres?.unlock?.(24);
        }
      }
      persistSave(save);
    }
  }

  function setScore(score) {
    if (!save.daily) return;
    let changed = false;
    for (const q of save.daily.quests) {
      if (q.hook !== "score" || q.done) continue;
      q.progress = Math.max(q.progress, Math.min(q.target, score));
      if (q.progress >= q.target) {
        q.done = true;
        changed = true;
        showPopup?.(WIDTH / 2, 60, `Quete : ${q.text} !`, k.rgb(80, 220, 120), 18);
        audio?.combo?.();
      }
    }
    if (changed) {
      const allDone = save.daily.quests.every(q => q.done);
      if (allDone && !save.daily.claimed) {
        save.daily.claimed = true;
        showPopup?.(WIDTH / 2, 100, "JOURNEE COMPLETE !", k.rgb(255, 200, 60), 22);
        if (save.daily.streak >= 6) {
          window.__spectres?.unlock?.(24);
        }
      }
      persistSave(save);
    }
  }

  k.add([
    k.pos(0, 0),
    k.z(40),
    {
      draw() {
        if (!save.daily) return;
        const x = 12;
        const y = 70;
        for (let i = 0; i < save.daily.quests.length; i++) {
          const q = save.daily.quests[i];
          const yi = y + i * 18;
          const opacity = q.done ? 0.5 : 1;
          k.drawRect({ pos: k.vec2(x, yi), width: 250, height: 16, color: k.rgb(20, 20, 35), opacity: 0.7 * opacity });
          const pct = q.progress / q.target;
          k.drawRect({ pos: k.vec2(x, yi), width: 250 * pct, height: 16, color: q.done ? k.rgb(80, 200, 100) : k.rgb(80, 100, 200), opacity: 0.6 });
          k.drawText({
            text: `${q.done ? "(OK)" : `${q.progress}/${q.target}`} ${q.text}`,
            size: 11,
            pos: k.vec2(x + 4, yi + 2),
            color: k.rgb(220, 220, 240),
            opacity,
          });
        }
        if (save.daily.streak > 0) {
          k.drawText({
            text: `Serie : ${save.daily.streak} jour${save.daily.streak > 1 ? "s" : ""}`,
            size: 10,
            pos: k.vec2(x, y + 60),
            color: k.rgb(255, 200, 80),
          });
        }
      },
    },
  ]);

  return {
    onSkeleton: () => increment("skeleton"),
    onCoin: () => increment("coin"),
    onTilePlace: (type) => {
      increment("tile");
      if (type === "lava") increment("lava");
      if (type === "rail" || type === "rail_up" || type === "rail_down") increment("rail");
    },
    onWagonSpawn: () => increment("wagon"),
    onCombo5: () => increment("combo5"),
    onLoop: () => increment("loop"),
    onDuck: () => increment("duck"),
    onPortal: () => increment("portal"),
    onScore: setScore,
  };
}
