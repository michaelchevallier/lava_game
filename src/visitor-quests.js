const QUEST_TYPES = [
  { id: "coins", text: "Pieces SVP !", target: 3, reward: 150, timerSec: 30 },
  { id: "transform", text: "Transforme-moi !", target: 1, reward: 100, timerSec: 30 },
  { id: "fly", text: "Fais-moi voler !", target: 1, reward: 150, timerSec: 30 },
];

export function createVisitorQuestSystem({ k, gameState, audio, showPopup, WIDTH, HEIGHT }) {
  let activeQuests = [];
  let nextSpawnAt = 0;
  const wagonCatapultSeen = new WeakSet();

  function tryAssignQuest() {
    if (activeQuests.length >= 2) return;
    const candidates = k.get("visitor").filter(
      (v) => !v.isSkeleton && !v._questAssigned && v.exists()
    );
    if (candidates.length === 0) return;
    const v = candidates[Math.floor(Math.random() * candidates.length)];
    const questType = QUEST_TYPES[Math.floor(Math.random() * QUEST_TYPES.length)];
    v._questAssigned = true;
    activeQuests.push({
      visitor: v,
      type: questType,
      progress: 0,
      expireAt: k.time() + questType.timerSec,
    });
    audio.combo?.();
  }

  function spawnFirework(x, y) {
    for (let i = 0; i < 12; i++) {
      const a = (Math.PI * 2 * i) / 12;
      const p = k.add([
        k.circle(3),
        k.pos(x, y),
        k.color(k.rgb(255, 220, 60)),
        k.opacity(1),
        k.lifespan(0.6, { fade: 0.4 }),
        k.z(15),
        "particle-firework",
        { vx: Math.cos(a) * 100, vy: Math.sin(a) * 100, grav: 100 },
      ]);
      p.onUpdate(() => {
        p.pos.x += p.vx * k.dt();
        p.pos.y += p.vy * k.dt();
        p.vy += p.grav * k.dt();
      });
    }
  }

  function completeQuest(q) {
    gameState.score += q.type.reward;
    showPopup(
      q.visitor.pos.x + 14,
      q.visitor.pos.y - 30,
      `+${q.type.reward}!`,
      k.rgb(80, 220, 120),
      22
    );
    audio.combo?.();
    audio.coin?.();
    spawnFirework(q.visitor.pos.x + 14, q.visitor.pos.y + 10);
    if (q.visitor.exists()) q.visitor._questAssigned = false;
  }

  function failQuest(q) {
    if (q.visitor.exists()) {
      q.visitor._questAssigned = false;
      for (let i = 0; i < 5; i++) {
        const p = k.add([
          k.circle(2),
          k.pos(q.visitor.pos.x + 14, q.visitor.pos.y + 10),
          k.color(k.rgb(80, 80, 100)),
          k.opacity(0.7),
          k.lifespan(0.5, { fade: 0.3 }),
          k.z(10),
          "particle",
          { vx: (Math.random() - 0.5) * 30, vy: -20 - Math.random() * 20 },
        ]);
        p.onUpdate(() => {
          p.pos.x += p.vx * k.dt();
          p.pos.y += p.vy * k.dt();
        });
      }
    }
  }

  function onTilePlaced(type) {
    if (type !== "coin") return;
    for (const q of activeQuests) {
      if (q.type.id === "coins") {
        q.progress = Math.min(q.type.target, q.progress + 1);
      }
    }
  }

  function onSkeletonTransform(visitor) {
    for (const q of activeQuests) {
      if (q.type.id === "transform" && q.visitor === visitor) {
        q.progress = q.type.target;
      }
    }
  }

  k.loop(0.15, () => {
    for (const wagon of k.get("wagon")) {
      if (wagon.catapulting === false && wagonCatapultSeen.has(wagon)) {
        wagonCatapultSeen.delete(wagon);
        for (const q of activeQuests) {
          if (q.type.id !== "fly") continue;
          const dist = Math.hypot(
            q.visitor.pos.x - wagon.pos.x,
            q.visitor.pos.y - wagon.pos.y
          );
          if (dist < 180) q.progress = q.type.target;
        }
      }
      if (wagon.catapulting === true) wagonCatapultSeen.add(wagon);
    }
  });

  k.loop(0.5, () => {
    if (k.time() > nextSpawnAt) {
      tryAssignQuest();
      nextSpawnAt = k.time() + 45;
    }
    activeQuests = activeQuests.filter((q) => {
      if (!q.visitor.exists()) return false;
      if (q.progress >= q.type.target) {
        completeQuest(q);
        return false;
      }
      if (k.time() > q.expireAt) {
        failQuest(q);
        return false;
      }
      return true;
    });
  });

  k.add([
    k.pos(0, 0),
    k.z(20),
    {
      draw() {
        for (const q of activeQuests) {
          if (!q.visitor.exists()) continue;
          const x = q.visitor.pos.x + 14;
          const y = q.visitor.pos.y - 12;
          const bw = q.type.text.length * 4 + 16;
          k.drawRect({
            pos: k.vec2(x - bw / 2, y - 14),
            width: bw,
            height: 14,
            color: k.rgb(255, 245, 200),
            outline: { color: k.rgb(180, 150, 60), width: 1 },
            radius: 4,
          });
          k.drawText({
            text: q.type.text,
            size: 9,
            pos: k.vec2(x, y - 7),
            anchor: "center",
            color: k.rgb(40, 30, 10),
          });
          const pct = q.progress / q.type.target;
          k.drawRect({
            pos: k.vec2(x - bw / 2 + 2, y - 3),
            width: (bw - 4) * pct,
            height: 2,
            color: k.rgb(80, 200, 100),
          });
          const tLeft = Math.max(0, (q.expireAt - k.time()) / q.type.timerSec);
          k.drawRect({
            pos: k.vec2(x - bw / 2 + 2, y - 1),
            width: (bw - 4) * tLeft,
            height: 1,
            color: k.rgb(255, 100, 80),
          });
        }
      },
    },
  ]);

  return { onTilePlaced, onSkeletonTransform, getActiveQuests: () => activeQuests };
}
