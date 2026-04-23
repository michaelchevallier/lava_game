import { WIDTH, WORLD_WIDTH, TILE } from "./constants.js";

// Mini-map HUD : vue d'ensemble du monde étendu (camera follow sandbox/run).
// Masqué en campaign (niveaux mono-écran). Strip 220x20 en haut-centre,
// affiche bornes monde, zone jouable, viewport, stations, joueurs, wagons.
export function createMinimap({ k, getActivePlayers, getMode }) {
  const MAP_W = 220;
  const MAP_H = 20;
  const MAP_X = Math.round((WIDTH - MAP_W) / 2);
  const MAP_Y = 6;
  const WORLD_MIN = -WORLD_WIDTH;
  const WORLD_MAX = WORLD_WIDTH;
  const WORLD_SPAN = WORLD_MAX - WORLD_MIN;
  const sx = MAP_W / WORLD_SPAN;

  const toMap = (x) => MAP_X + (x - WORLD_MIN) * sx;

  const COL_FRAME_BG = k.rgb(0, 0, 0);
  const COL_FRAME_EDGE = k.rgb(180, 180, 200);
  const COL_VOID = k.rgb(30, 20, 40);
  const COL_PLAY = k.rgb(70, 110, 70);
  const COL_GROUND = k.rgb(90, 60, 40);
  const COL_VIEWPORT = k.rgb(255, 255, 255);
  const COL_WAGON = k.rgb(255, 210, 63);
  const COL_ENTREE = k.rgb(100, 220, 100);
  const COL_SORTIE = k.rgb(220, 100, 100);
  const COL_OUTLINE = k.rgb(0, 0, 0);

  k.add([
    k.pos(0, 0),
    k.fixed(),
    k.z(41),
    {
      draw() {
        if (getMode?.() === "campaign") return;

        k.drawRect({
          pos: k.vec2(MAP_X - 3, MAP_Y - 3),
          width: MAP_W + 6,
          height: MAP_H + 6,
          color: COL_FRAME_BG,
          opacity: 0.55,
        });
        k.drawRect({
          pos: k.vec2(MAP_X - 3, MAP_Y - 3),
          width: MAP_W + 6,
          height: 1,
          color: COL_FRAME_EDGE,
        });
        k.drawRect({
          pos: k.vec2(MAP_X - 3, MAP_Y + MAP_H + 2),
          width: MAP_W + 6,
          height: 1,
          color: COL_FRAME_EDGE,
        });
        k.drawRect({
          pos: k.vec2(MAP_X - 3, MAP_Y - 3),
          width: 1,
          height: MAP_H + 6,
          color: COL_FRAME_EDGE,
        });
        k.drawRect({
          pos: k.vec2(MAP_X + MAP_W + 2, MAP_Y - 3),
          width: 1,
          height: MAP_H + 6,
          color: COL_FRAME_EDGE,
        });

        k.drawRect({
          pos: k.vec2(MAP_X, MAP_Y),
          width: MAP_W,
          height: MAP_H,
          color: COL_VOID,
        });

        const playX = toMap(0);
        const playW = WORLD_WIDTH * sx;
        k.drawRect({
          pos: k.vec2(playX, MAP_Y),
          width: playW,
          height: MAP_H,
          color: COL_PLAY,
          opacity: 0.55,
        });
        k.drawRect({
          pos: k.vec2(playX, MAP_Y + MAP_H - 4),
          width: playW,
          height: 4,
          color: COL_GROUND,
        });

        k.drawRect({
          pos: k.vec2(toMap(-TILE * 4) - 1, MAP_Y + 2),
          width: 2,
          height: MAP_H - 4,
          color: COL_ENTREE,
        });
        k.drawRect({
          pos: k.vec2(toMap(WORLD_WIDTH + TILE) - 1, MAP_Y + 2),
          width: 2,
          height: MAP_H - 4,
          color: COL_SORTIE,
        });

        const scale = (k.camScale?.().x) || 1;
        const halfView = WIDTH / (2 * scale);
        const camX = k.camPos().x;
        const vpL = toMap(camX - halfView);
        const vpR = toMap(camX + halfView);
        const vpW = Math.max(2, vpR - vpL);
        k.drawRect({
          pos: k.vec2(vpL, MAP_Y),
          width: vpW,
          height: MAP_H,
          color: COL_VIEWPORT,
          opacity: 0.1,
        });
        k.drawRect({ pos: k.vec2(vpL, MAP_Y), width: 1, height: MAP_H, color: COL_VIEWPORT });
        k.drawRect({ pos: k.vec2(vpL + vpW - 1, MAP_Y), width: 1, height: MAP_H, color: COL_VIEWPORT });

        const wagons = k.get("wagon");
        for (const w of wagons) {
          const mx = toMap(w.pos.x + 16);
          if (mx < MAP_X - 2 || mx > MAP_X + MAP_W + 2) continue;
          k.drawRect({
            pos: k.vec2(mx - 1, MAP_Y + MAP_H / 2 - 1),
            width: 3,
            height: 3,
            color: COL_WAGON,
          });
        }

        const players = getActivePlayers?.() || [];
        for (const p of players) {
          if (!p?.exists?.()) continue;
          const ent = p.ridingWagon ?? p;
          const mx = toMap(ent.pos.x + 12);
          if (mx < MAP_X - 3 || mx > MAP_X + MAP_W + 3) continue;
          const col = p.nameColor || k.rgb(255, 255, 255);
          k.drawRect({
            pos: k.vec2(mx - 3, MAP_Y + 2),
            width: 5,
            height: MAP_H - 4,
            color: COL_OUTLINE,
            opacity: 0.8,
          });
          k.drawRect({
            pos: k.vec2(mx - 2, MAP_Y + 3),
            width: 3,
            height: MAP_H - 6,
            color: col,
          });
        }
      },
    },
  ]);
}
