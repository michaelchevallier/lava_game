import { WIDTH, HEIGHT, TB_START_X, TB_Y, TB_ICON, COG_X, COG_Y } from "./constants.js";

export function createTutorial({ k, save, persistSave, drawTextOutlined }) {
  let step = 0;
  let active = !save.tutorialDone;
  let lavaPlaced = 0;
  let wagonSpawned = false;
  let firstSkeleton = false;

  const STEPS = [
    {
      arrow: () => {
        const x = TB_START_X + TB_ICON / 2;
        const y = TB_Y - 24;
        return { x, y, dir: "down" };
      },
      text: "Bienvenue ! Clique sur LAVE en bas",
      check: () => false,
    },
    {
      arrow: () => ({ x: WIDTH / 2, y: HEIGHT / 2 - 40, dir: "down" }),
      text: "Clique sur le sol pour poser une tuile lave",
      check: () => lavaPlaced >= 1,
    },
    {
      arrow: () => ({ x: 100, y: HEIGHT - 115, dir: "left" }),
      text: "Appuie sur X pour spawner un wagon !",
      check: () => wagonSpawned,
    },
    {
      arrow: null,
      text: "Regarde le wagon traverser la lave...",
      check: () => firstSkeleton,
    },
    {
      arrow: () => ({ x: COG_X, y: COG_Y + 30, dir: "up" }),
      text: "Bravo ! Engrenage en bas-droite pour les options",
      check: () => false,
      autoCloseAfter: 4,
    },
  ];

  let stepStartTime = 0;

  function setup() {
    if (!active) return;
    stepStartTime = k.time();

    k.onDraw(() => {
      if (!active || step >= STEPS.length) return;
      const s = STEPS[step];

      k.drawRect({
        pos: k.vec2(0, HEIGHT - 70),
        width: WIDTH,
        height: 70,
        color: k.rgb(0, 0, 0),
        opacity: 0.85,
      });

      drawTextOutlined({
        text: s.text,
        size: 22,
        pos: k.vec2(WIDTH / 2, HEIGHT - 35),
        anchor: "center",
        color: k.rgb(255, 230, 80),
      });

      drawTextOutlined({
        text: "Passer",
        size: 14,
        pos: k.vec2(WIDTH - 16, HEIGHT - 12),
        anchor: "botright",
        color: k.rgb(180, 180, 180),
      });

      if (s.arrow) {
        const a = s.arrow();
        const pulse = 1 + Math.sin(k.time() * 6) * 0.2;
        const arrowChar = a.dir === "down" ? "v" : a.dir === "up" ? "^" : a.dir === "left" ? "<" : ">";
        const offset = Math.sin(k.time() * 5) * 5;
        const dx = a.dir === "left" ? -offset : a.dir === "right" ? offset : 0;
        const dy = a.dir === "down" ? offset : a.dir === "up" ? -offset : 0;

        k.drawRect({
          pos: k.vec2(a.x + dx - 16, a.y + dy - 16),
          width: 32,
          height: 32,
          radius: 6,
          color: k.rgb(255, 200, 0),
          opacity: 0.85 * pulse,
        });

        drawTextOutlined({
          text: arrowChar,
          size: 24,
          pos: k.vec2(a.x + dx, a.y + dy),
          anchor: "center",
          color: k.rgb(0, 0, 0),
        });
      }
    });

    k.onUpdate(() => {
      if (!active || step >= STEPS.length) return;
      const s = STEPS[step];
      if (s.check && s.check()) advance();
      if (s.autoCloseAfter && k.time() - stepStartTime > s.autoCloseAfter) {
        finish();
      }
    });

    k.onMousePress("left", () => {
      if (!active || step >= STEPS.length) return;
      const m = k.mousePos();
      if (m.x > WIDTH - 80 && m.y > HEIGHT - 40) {
        finish();
      }
    });

    setTimeout(() => { if (active && step === 0) advance(); }, 4000);
  }

  function advance() {
    step++;
    stepStartTime = k.time();
    if (step >= STEPS.length) finish();
  }

  function finish() {
    active = false;
    save.tutorialDone = true;
    persistSave(save);
  }

  return {
    setup,
    notifyLavaPlaced: () => { lavaPlaced++; },
    notifyWagonSpawned: () => { wagonSpawned = true; },
    notifyFirstSkeleton: () => { firstSkeleton = true; },
    isActive: () => active,
    skip: () => finish(),
  };
}
