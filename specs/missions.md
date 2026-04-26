# Mission Express — objectif visible permanent

## 1. Pourquoi

Le joueur en sandbox/run a beaucoup de mécaniques mais **pas d'objectif court visible**. Il pose des tiles sans savoir ce qu'il vise. Mission Express affiche en permanence UNE mission courte avec timer + progress bar dans le coin HUD. Quand elle réussit ou expire, une nouvelle prend la place.

Boucle satisfaisante : voir mission → la chasser 60-90s → succès popup → nouvelle mission.

## 2. Mécaniques

- **1 mission active à la fois**. Spawn la 1ère 5s après le boot, puis enchaînées.
- **Durée** : chaque mission a une durée propre (60s à 90s).
- **Templates** (5 templates suffisent au début, snapshot-based) :
  | id | label | check | reward | durée |
  |---|---|---|---|---|
  | `score_1k` | "Atteins +1000 pts" | `score - startScore >= 1000` | +200 + audio.gold | 60s |
  | `coins_8` | "Collecte 8 pièces" | `coins - startCoins >= 8` | +150 + audio.gold | 75s |
  | `skel_3` | "Transforme 3 visiteurs" | `skeletons - startSkel >= 3` ou `sessionSkeletons - start >= 3` | +250 + audio.combo | 90s |
  | `survive_60` | "Survis 60s" | `time - startTime >= 60` | +100 | 60s |
  | `score_2500` | "Score +2500 en 90s" | `score - startScore >= 2500` | +400 | 90s |

- **Snapshot-based** : la mission garde `start = { score, coins, skeletons, sessionSkeletons, time }` à son spawn, calcule progress en delta.
- **Réussite** : popup `"MISSION OK ! +X"`, audio, score += reward, fade widget, **3s plus tard** spawn nouvelle mission (random ≠ précédente).
- **Échec (timer expire)** : popup `"MISSION EXPIRE"` couleur grise, **3s plus tard** spawn nouvelle (zéro pénalité).

## 3. UI

- **Widget HUD top-right**, position `(WIDTH - 220, 10)` (au-dessus / à gauche du minimap si overlap, ajuster).
- Background : rect 200×46 noir 60% opacity, outline blanc 1px.
- **Ligne 1** : label de la mission (size 14, color blanc).
- **Ligne 2** : progress bar 180×6 + countdown texte `MM:SS` à droite (size 11, color jaune).
- **Couleur progress** :
  - Vert si `>= 100%`
  - Jaune sinon
- **Pulse à la complétion** : scale 1.2 → 1.0 sur 0.4s.

## 4. Implémentation

### 4.1 Nouveau module `src/missions.js` (~110 lignes)

```js
export function createMissions({ k, gameState, audio, showPopup, WIDTH }) {
  const TEMPLATES = [
    { id: "score_1k",   label: "Atteins +1000 pts",      duration: 60, reward: 200, check: (s) => gameState.score - s.score >= 1000 },
    { id: "coins_8",    label: "Collecte 8 pieces",      duration: 75, reward: 150, check: (s) => gameState.coins - s.coins >= 8 },
    { id: "skel_3",     label: "Transforme 3 visiteurs", duration: 90, reward: 250, check: (s) => (gameState.sessionSkeletons || 0) - s.sessionSkeletons >= 3 },
    { id: "survive_60", label: "Survis 60 secondes",     duration: 60, reward: 100, check: (s) => k.time() - s.time >= 60 },
    { id: "score_2500", label: "Score +2500 pts",        duration: 90, reward: 400, check: (s) => gameState.score - s.score >= 2500 },
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
    // Update progress (0..1)
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
      popPulse = t;
      coolUntil = t + 3;
      k.wait(3, () => { current = null; });
    } else if (t > current.until) {
      current.done = true;
      showPopup(WIDTH / 2, 70, "MISSION EXPIRE", k.rgb(160, 160, 160), 18);
      coolUntil = t + 3;
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
        k.drawRect({
          pos: k.vec2(x, y),
          width: 200 * scale,
          height: 46 * scale,
          color: k.rgb(0, 0, 0),
          opacity: 0.6,
          outline: { width: 1, color: k.rgb(220, 220, 220) },
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
```

### 4.2 Câblage `src/main.js`

- Import en haut : `import { createMissions } from "./missions.js";`
- Instancier après `createWeatherSystem` (vers ligne 1147), DANS le if (cfg.enableWeather) ou en dehors. Mieux : en dehors, conditionnel à un nouveau flag `cfg.enableMissions !== false` (default true). Pour rester simple et zero-config, juste l'instancier inconditionnellement après les autres systèmes :
  ```js
  window.__missions = createMissions({ k, gameState, audio, showPopup, WIDTH });
  ```

## 5. Pièges KAPLAY à éviter

- **`k.fixed()`** sur entité non-fullscreen est OK (le piège c'est sur overlay full-screen WebGL feedback). Ici widget 200×46 → safe.
- **`drawText` strings** : pas de `[...]` ni backslash. Mes strings : "MISSION : Atteins +1000 pts", "MISSION OK ! +200", "MISSION EXPIRE", "00:45" → tous safe.
- **Pas de prop custom `frame`/`animFrame`**.

## 6. Critères de succès

- [ ] Build sans erreur, bundle < 115 KB gz.
- [ ] 5s après le boot, widget apparaît top-right avec mission active + timer.
- [ ] Progress bar augmente quand le joueur progresse (placer tiles génère pts/coins/transforms).
- [ ] À 100% : popup vert "MISSION OK ! +X", score augmente du reward, widget pulse, disparaît 3s, nouvelle mission spawn.
- [ ] Si timer expire : popup gris "MISSION EXPIRE", nouvelle mission 3s après.
- [ ] Pas 2× la même mission consécutive.
- [ ] FPS stable, zéro erreur console.
- [ ] `window.__missions.startNext()` skip et démarre une nouvelle (debug).

## 7. Effort

**1 commit atomique**, 1 nouveau fichier ~110 lignes + 2 lignes main.js.

Message : `feat(missions): widget HUD missions courtes 60-90s avec timer + reward`
