# Course de Visiteurs — bonus event

## 1. Objectif

Event aléatoire qui apparaît toutes les 2-4 minutes : **8 visiteurs sprintent en ligne droite→gauche** à travers le parc. Le joueur peut les **attraper en les touchant** pour gagner des points. Le 1er visiteur (leader doré) vaut beaucoup plus que les autres.

Format "fun et jouable simplement" : zéro apprentissage, action immédiate dès qu'on voit le banner, court (12s).

## 2. Mécaniques

- **Trigger** : timer dans le système, premier event entre 90s-150s après le boot, puis intervalle 120-240s.
- **Durée** : 12s du 1er spawn au last spawn destroyed (auto-cleanup).
- **Spawn** : 8 visiteurs spawn UN PAR UN espacés de 0.4s, depuis `x = WORLD_WIDTH + 30`, `y = (GROUND_ROW - 3) * TILE`. Ils courent vers la gauche (`walkSpeed = -200`, vs visiteur normal +40 à +80 droite).
- **Leader** (1er spawné, index 0) :
  - couleur dorée `rgb(255, 220, 60)` + outline `rgb(160, 110, 0)` 2px
  - scale 1.3 (visiblement plus gros)
  - trail : 1 sparkle particle par frame derrière lui (color or)
  - `pointsValue = 200`
- **Suiveurs** (index 1-7) : couleur arc-en-ciel HSL par index `(i / 8) * 360°`, scale 1.0, `pointsValue = 30`
- **Tag dédié** : `"race-visitor"` (ne pas réutiliser `"visitor"` pour éviter collisions avec auto-board wagon, hesitate lava, etc.).
- **Pas de gravité** : ils flottent sur GROUND_ROW (y fixé), pas de jump, pas de skeleton transform, pas d'auto-board. Comportement minimal.
- **Collision player** : au touch, `gameState.score += pointsValue`, `audio.coin?.()` pour suiveurs / `audio.gold?.()` pour leader, popup `"+30"` ou `"+200 LEADER !"`, burst 8 particles couleur du visiteur, `k.destroy(visitor)`.
- **Cleanup** : visiteur détruit dès qu'il sort de l'écran à gauche (`pos.x < -30`).

## 3. UI

- **Banner haut écran** pendant les 12s : `drawText("COURSE ! 200 pts au leader !", color rainbow shift, size 22, anchor "top")` à `pos.y = 30`. Z-index 19.
- Le banner s'affiche pendant que des `race-visitor` existent encore.

## 4. Fichiers à modifier

| Fichier | Action |
|---|---|
| `src/visitor-race.js` (nouveau, ~80 lignes) | Module `createVisitorRace({k, gameState, audio, showPopup, WIDTH, WORLD_WIDTH, GROUND_ROW, TILE})` qui retourne `{ trigger() }`. Gère timer auto, spawn cascade, banner. |
| `src/main.js` | Import + instanciation après `createWeatherSystem` (~ligne 1147). Expose via `window.__visitorRace` pour debug. |

Aucune modif des autres fichiers. Aucune dépendance sur `visitor.js` (système indépendant pour ne pas pourrir le pile auto-board / hesitate lava).

## 5. API (visitor-race.js)

```js
export function createVisitorRace({ k, gameState, audio, showPopup, WIDTH, WORLD_WIDTH, GROUND_ROW, TILE }) {
  let nextEventAt = k.time() + 90 + Math.random() * 60;
  let active = false;

  function spawnRunner(index) {
    const isLeader = index === 0;
    const hue = (index / 8) * 360;
    // HSL → RGB simple
    const color = isLeader ? [255, 220, 60] : hslToRgb(hue, 0.7, 0.6);
    const v = k.add([
      k.sprite("human"),
      k.pos(WORLD_WIDTH + 30 + index * 50, (GROUND_ROW - 3) * TILE),
      k.area({ shape: new k.Rect(k.vec2(2, 4), 24, 40), collisionIgnore: ["wagon", "wagon-part", "passenger", "visitor", "race-visitor", "crowd", "tile", "ground_tile"] }),
      k.anchor("topleft"),
      k.color(k.rgb(color[0], color[1], color[2])),
      k.scale(isLeader ? 1.3 : 1.0),
      k.outline(isLeader ? 2 : 0, k.rgb(160, 110, 0)),
      k.z(6),
      "race-visitor",
      { pointsValue: isLeader ? 200 : 30, isLeader, baseColor: color },
    ]);
    v.onUpdate(() => {
      v.pos.x -= 200 * k.dt();
      if (isLeader && Math.random() < 0.5) {
        const ec = window.__entityCounts;
        if (!ec || ec.particle < 250) {
          k.add([
            k.circle(2 + Math.random()),
            k.pos(v.pos.x + 14 + Math.random() * 10, v.pos.y + 20 + Math.random() * 10),
            k.color(k.rgb(255, 230, 100)),
            k.opacity(0.9),
            k.lifespan(0.4, { fade: 0.3 }),
            k.z(8),
            "particle",
          ]);
        }
      }
      if (v.pos.x < -30) k.destroy(v);
    });
    v.onCollide("player", () => {
      gameState.score += v.pointsValue;
      (isLeader ? audio.gold : audio.coin)?.();
      showPopup(v.pos.x + 14, v.pos.y - 10, isLeader ? "+200 LEADER !" : `+${v.pointsValue}`, k.rgb(color[0], color[1], color[2]), isLeader ? 24 : 16);
      const cx = v.pos.x + 14, cy = v.pos.y + 20;
      for (let i = 0; i < 8; i++) {
        const a = (Math.PI * 2 * i) / 8;
        k.add([
          k.circle(2 + Math.random() * 2),
          k.pos(cx, cy),
          k.color(k.rgb(color[0], color[1], color[2])),
          k.opacity(1),
          k.lifespan(0.5, { fade: 0.3 }),
          k.z(15),
          "particle-grav",
          { vx: Math.cos(a) * 90, vy: Math.sin(a) * 90 - 30, grav: 200 },
        ]);
      }
      k.destroy(v);
    });
    return v;
  }

  function trigger() {
    if (active) return;
    active = true;
    audio.crack?.();
    showPopup(WIDTH / 2, 80, "COURSE DE VISITEURS !", k.rgb(255, 200, 100), 26);
    for (let i = 0; i < 8; i++) {
      k.wait(i * 0.4, () => spawnRunner(i));
    }
    k.wait(8, () => { active = false; });
  }

  k.loop(1, () => {
    if (!active && k.time() > nextEventAt) {
      trigger();
      nextEventAt = k.time() + 120 + Math.random() * 120;
    }
  });

  // Banner draw tant que des race-visitors existent
  k.add([
    k.pos(0, 0),
    k.z(19),
    {
      draw() {
        const runners = k.get("race-visitor");
        if (runners.length === 0) return;
        const t = k.time();
        const r = 200 + Math.sin(t * 4) * 55;
        const g = 200 + Math.sin(t * 4 + 2) * 55;
        const b = 200 + Math.sin(t * 4 + 4) * 55;
        k.drawText({
          text: "COURSE ! attrape les visiteurs !",
          pos: k.vec2(WIDTH / 2, 30),
          size: 20,
          color: k.rgb(r, g, b),
          anchor: "center",
        });
      },
    },
  ]);

  return { trigger };
}

function hslToRgb(h, s, l) {
  h /= 360;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h * 6) % 2) - 1));
  const m = l - c / 2;
  let r, g, b;
  if (h < 1 / 6) [r, g, b] = [c, x, 0];
  else if (h < 2 / 6) [r, g, b] = [x, c, 0];
  else if (h < 3 / 6) [r, g, b] = [0, c, x];
  else if (h < 4 / 6) [r, g, b] = [0, x, c];
  else if (h < 5 / 6) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  return [Math.floor((r + m) * 255), Math.floor((g + m) * 255), Math.floor((b + m) * 255)];
}
```

## 6. Câblage main.js

Après `createWeatherSystem` (vers ligne 1147) :

```js
import { createVisitorRace } from "./visitor-race.js";
// ...
if (cfg.enableWeather) {
  window.__weather = createWeatherSystem({...});
  window.__visitorRace = createVisitorRace({ k, gameState, audio, showPopup, WIDTH, WORLD_WIDTH, GROUND_ROW, TILE });
}
```

(Réutilise `cfg.enableWeather` car même catégorie d'event aléatoire.)

## 7. Critères de succès

- [ ] Build sans erreur, bundle < 115 KB gz.
- [ ] Au boot, après 90-150s, popup "COURSE DE VISITEURS !" + 8 visiteurs spawnent l'un après l'autre depuis le bord droit.
- [ ] Leader visible : doré, plus gros, trail sparkle.
- [ ] Player touche un visiteur → +30 pts (ou +200 leader) + popup + burst, visiteur disparaît.
- [ ] Banner haut écran pendant les ~12s, change couleurs dynamiquement.
- [ ] Re-déclenchement après 120-240s.
- [ ] `window.__visitorRace.trigger()` force un event en console pour test.
- [ ] Zéro erreur console, FPS stable.

## 8. Risques

- **Collision player** : `onCollide("player")` requiert que `player` soit un tag valide (l'est déjà, vérifié dans visitor.js:33).
- **`gameState.score`** existe et est +=able (pattern partout).
- **`showPopup`** est passé partout en main.js, OK.
- **Particle cap** : trail leader limité à `Math.random() < 0.5` + check `ec.particle < 250` → max 1 particle / 2 frames, sécure.
- **Cleanup** : si run reset / scene rebuild, `k.get("race-visitor")` se vide naturellement (scene tear-down).

## 9. Effort

1 commit atomique, ~100 lignes nouveau fichier + 3 lignes main.js. ~30 min.

Message : `feat(events): course de visiteurs bonus avec leader doré +200pts`
