# Sprint 1 — Combo Meter plein écran + juice

> Feature `S` (petit) effort, impact massif. Spec exhaustive pour execution feature-dev sonnet.
> Principe : **tout l'engin de combo existe déjà, on ne crée rien de nouveau côté logique — on le rend VIOLEMMENT visible**.

---

## 1. Contexte (pourquoi)

Actuellement :
- Combo logique OK dans `main.js:551-590` (`registerKill`) et `tiles.js:85`, `wagons.js:673`.
- Multiplicateurs `[1,1,2,3,5,8]` dans `constants.js:16` (max index 5 → x8, pas x32 comme le ticket le suggère : c'est un max à 5 kills dans `COMBO_WINDOW=2.5s`).
- Affichage actuel `hud.js:419-437` : texte 32px + barre 160px au centre-haut, seulement > x2. **Planqué**.
- Son `audio.combo()` (audio.js:76-80) joué à **chaque** kill en combo — même pitch, aucune escalade perçue.

Conséquence gameplay : les joueurs ne sentent pas la marche d'escalier. L'enchaînement coin→kill→combo passe inaperçu. Le flow est cassé avant d'émerger.

**Objectif** : transformer chaque palier franchi (x2, x3, x5, x8) en HURLEMENT visuel + sonore. Barre 30% écran, couleurs montantes, freeze-frame + shake + flash + pitch-up à chaque step. Toggleable via settings (anti-nausée).

---

## 2. Fichiers impactés

| Fichier | Zone | Raison |
|---|---|---|
| `/Users/mike/Work/milan project/src/audio.js` | ajout fonction `comboStep(level)` ~ligne 80 (après `combo:`) | Son procédural qui monte en pitch par palier |
| `/Users/mike/Work/milan project/src/hud.js` | remplace le bloc `419-437` (rendu combo) | Nouvelle barre 30% + couleurs palier + pulse |
| `/Users/mike/Work/milan project/src/main.js` | `registerKill` 551-590 + ajout `triggerComboStep` | Hook palier franchi → audio.comboStep + shake + flash + hitStop |
| `/Users/mike/Work/milan project/src/tiles.js` | ligne 85-87 (chaîne d'or set combo à 2) | Passer par le même hook palier quand la chaîne force combo → 2 |
| `/Users/mike/Work/milan project/src/wagons.js` | ligne 673-675 (cascade water combo++) | Idem hook palier |
| `/Users/mike/Work/milan project/src/settings-modal.js` | ajouter toggle "Juice combo" vers ligne 122 (section Monde) + handler après 217 | Opt-out (option `save.reducedJuice`) |
| `/Users/mike/Work/milan project/src/constants.js` | ajouter `COMBO_COLORS` (6 couleurs RGB alignées sur `COMBO_MULTIPLIERS`) | Constants partagés HUD + main |

**Pas de nouveau fichier** (la spec tient en < 80 lignes nouvelles réparties — on n'introduit pas de `combo.js` pour préserver la simplicité).

---

## 3. Comportement attendu (UX)

1. Tant que le combo est à x1 ou absent, rien ne s'affiche (comme aujourd'hui).
2. Dès que `comboCount >= 2`, une grande barre horizontale apparaît centrée en haut, **largeur ~30% écran** (WIDTH=1280 → ~384px), hauteur 18px, sous le texte "COMBO xN".
3. Le texte "COMBO xN" est 48px (au lieu de 32px), pulsant doucement (amplitude 0.05 au lieu de 0.08).
4. La couleur du texte + barre + glow reflète le palier actuel : x1 gris / x2 cyan / x3 magenta / x5 or / x8 rouge (voir `COMBO_COLORS`).
5. La barre décroît linéairement du plein à zéro pendant `COMBO_WINDOW` (2.5s). Quand elle approche 0, elle flashe blanc 3 fois (reset imminent).
6. À **chaque palier franchi** (x1→x2, x2→x3, x3→x5, x4→x8) :
   - `audio.comboStep(newLevel)` joue un triton ascendant pitched par palier (+demi-ton par step).
   - `k.shake(2 + level*2)` cappé à 12.
   - Flash plein écran 120ms de la couleur du palier, opacity 0.4.
   - `juice.hitStop(80)` (freeze-frame court — existe déjà via `window.__juice`).
7. Si `save.reducedJuice === true` : plus de shake, plus de flash, plus de hitStop, mais le son et la barre restent.
8. Quand le combo expire (timer à 0), un son "descendant" léger (`audio.comboEnd()`) et petit flash gris 80ms. Reset silencieux.
9. Mobile : la barre se réduit à 40% écran (plus large en proportion car canvas étroit).
10. La barre reste stable en position même si on zoom (`k.fixed()` déjà fait dans le wrapper HUD ligne 293).

---

## 4. Pseudo-code des fixes

### 4.1 `constants.js` — ajouter palette

```js
// Après COMBO_MULTIPLIERS ligne 16
export const COMBO_COLORS = [
  [180, 180, 180], // x1 — gris (jamais affiché)
  [180, 180, 180], // x1
  [ 80, 220, 240], // x2 — cyan
  [220, 120, 240], // x3 — magenta
  [255, 210,  60], // x5 — or
  [255,  80,  60], // x8 — rouge
];
```

### 4.2 `audio.js` — nouvelle fonction `comboStep(level)` + `comboEnd()`

Insérer dans l'objet retourné (vers ligne 80), après `combo:`:

```js
// level = 2..5. Chaque palier monte d'un demi-ton (×2^(1/12)).
// Anti-spam : bloque les appels espacés de < 150ms.
_lastComboStepAt: 0,
comboStep(level) {
  const now = performance.now();
  if (now - this._lastComboStepAt < 150) return;
  this._lastComboStepAt = now;
  const clamped = Math.max(2, Math.min(5, level | 0));
  const base = 523; // C5
  const freq = base * Math.pow(2, (clamped - 2) / 12 * 3); // 3 demi-tons par palier
  beep(freq, 0.09, "square", 0.14);
  setTimeout(() => beep(freq * 1.5, 0.12, "triangle", 0.12), 40);
  setTimeout(() => beep(freq * 2, 0.14, "square", 0.10), 90);
},
comboEnd() {
  beep(330, 0.12, "triangle", 0.06, 180);
},
```

**Note** : `_lastComboStepAt` doit vivre dans la closure — le placer en `let` module-level au-dessus de `beep`, pas dans l'objet returned (sinon `this` casse). Forme corrigée :

```js
// Au top du IIFE, après `let masterVolume = 0.7;`
let _lastComboStepAt = 0;
```

puis la fonction utilise la variable libre, sans `this`.

### 4.3 `hud.js` — remplacer bloc 419-437

```js
// Imports haut du fichier : ajouter COMBO_COLORS
import { COMBO_WINDOW, COMBO_MULTIPLIERS, COMBO_COLORS, MILESTONES } from "./constants.js";

// Dans renderHud(), remplace tout le if (gameState.comboCount >= 2 ...) :
if (gameState.comboCount >= 2 && k.time() < gameState.comboExpire) {
  const level = gameState.comboCount;
  const remaining = gameState.comboExpire - k.time();
  const mult = COMBO_MULTIPLIERS[level] || 1;
  const [cr, cg, cb] = COMBO_COLORS[level] || [255, 120, 220];
  const t = k.time();
  const pulse = 1 + Math.sin(t * 10) * 0.05;
  const progress = Math.max(0, Math.min(1, remaining / COMBO_WINDOW));
  // Flash blanc 3 derniers 0.4s
  const nearEnd = progress < 0.15;
  const blink = nearEnd && Math.sin(t * 40) > 0 ? 255 : cr;
  const barW = WIDTH * 0.30;
  const barH = 18;
  const barX = (WIDTH - barW) / 2;
  const barY = 112;
  // Glow derrière (pulsant)
  k.drawRect({
    pos: k.vec2(barX - 6, barY - 6),
    width: barW + 12, height: barH + 12,
    color: k.rgb(cr, cg, cb), opacity: 0.18 + Math.sin(t*8)*0.06,
    radius: 4,
  });
  // Fond
  k.drawRect({
    pos: k.vec2(barX, barY), width: barW, height: barH,
    color: k.rgb(25, 30, 50), opacity: 0.85, radius: 3,
  });
  // Fill
  k.drawRect({
    pos: k.vec2(barX, barY), width: barW * progress, height: barH,
    color: k.rgb(blink, cg, cb), radius: 3,
  });
  // Texte COMBO xN
  drawTextOutlined({
    text: `COMBO x${mult}`,
    size: 48 * pulse,
    pos: k.vec2(WIDTH / 2, 80),
    anchor: "center",
    color: k.rgb(cr, cg, cb),
    outlineThickness: 4,
  });
}
```

### 4.4 `main.js` — hook palier franchi dans `registerKill` (551-590)

Juste après `const mult = COMBO_MULTIPLIERS[gameState.comboCount] || 1;` (560), ajouter :

```js
if (gameState.comboCount > prev && gameState.comboCount >= 2) {
  triggerComboStep(gameState.comboCount);
}
```

Puis ajouter la fonction `triggerComboStep` au même niveau que `registerKill` (vers 551 ou fin du fichier scene) :

```js
let _lastComboEnd = 0;
function triggerComboStep(level) {
  audio.comboStep(level);
  if (save.reducedJuice) return;
  const shakeAmt = Math.min(12, 2 + level * 2);
  k.shake(shakeAmt);
  window.__juice?.hitStop(80);
  const [cr, cg, cb] = (COMBO_COLORS[level] || [255, 255, 255]);
  k.add([
    k.rect(WIDTH, HEIGHT),
    k.pos(0, 0),
    k.color(cr, cg, cb),          // ⚠ 3 args, pas objet Color
    k.opacity(0.4),
    k.lifespan(0.12, { fade: 0.1 }),
    k.fixed(),
    k.z(99),
  ]);
}
```

**Exposer la fonction** pour tiles.js / wagons.js via `window.__comboStep = triggerComboStep;` (même pattern que `window.__juice`, cf main.js grep pattern).

### 4.5 `tiles.js` ligne 85-87 — hook chaîne d'or

```js
// Remplacer :
gameState.comboExpire = k.time() + 4;
if (gameState.comboCount < 2) gameState.comboCount = 2;
audio.combo();
// Par :
gameState.comboExpire = k.time() + 4;
const prevCC = gameState.comboCount;
if (gameState.comboCount < 2) gameState.comboCount = 2;
if (gameState.comboCount > prevCC && gameState.comboCount >= 2) {
  window.__comboStep?.(gameState.comboCount);
} else {
  audio.combo(); // fallback compat
}
```

### 4.6 `wagons.js` ligne 673 — hook cascade eau

```js
// Remplacer :
gameState.comboCount = Math.min(5, gameState.comboCount + 1);
gameState.comboExpire = k.time() + 2;
audio.combo();
// Par :
const prevCC = gameState.comboCount;
gameState.comboCount = Math.min(5, gameState.comboCount + 1);
gameState.comboExpire = k.time() + 2;
if (gameState.comboCount > prevCC) window.__comboStep?.(gameState.comboCount);
```

### 4.7 `main.js` — comboEnd detection (boucle onUpdate)

Dans la scène (chercher un `k.onUpdate` top-level existant ; sinon ajouter un `k.onUpdate`) :

```js
let _comboWasActive = false;
k.onUpdate(() => {
  const active = gameState.comboCount >= 2 && k.time() < gameState.comboExpire;
  if (_comboWasActive && !active) {
    audio.comboEnd();
    gameState.comboCount = 0;
  }
  _comboWasActive = active;
});
```

### 4.8 `settings-modal.js` — toggle Juice

Dans la section "Monde" (~ligne 122), ajouter un 3e bouton :

```html
<button id="sm-juice" style="padding:10px 18px;...
  background:${save.reducedJuice ? 'rgba(255,255,255,0.1)' : '#e94c8a'};
  color:${save.reducedJuice ? '#fff' : '#111'}">
  Juice combo: ${save.reducedJuice ? "LIGHT" : "FULL"}
</button>
```

Handler (après ligne 217) :

```js
panel.querySelector("#sm-juice").addEventListener("click", () => {
  save.reducedJuice = !save.reducedJuice;
  persistSave(save);
  const b = panel.querySelector("#sm-juice");
  b.textContent = "Juice combo: " + (save.reducedJuice ? "LIGHT" : "FULL");
  b.style.background = save.reducedJuice ? "rgba(255,255,255,0.1)" : "#e94c8a";
  b.style.color = save.reducedJuice ? "#fff" : "#111";
});
```

---

## 5. Critères de succès (checklist testable)

- [ ] FPS reste > 55 sur Mac Retina durant un combo x5 (vérifier via `window.__getStats()` et overlay `fps` existant)
- [ ] Bundle gzip (dist/) n'augmente pas de plus de 2 KB (`ls -la dist/assets/*.js.gz` avant/après)
- [ ] Zéro erreur console (ouvrir DevTools, déclencher x5, chaîne d'or, cascade eau)
- [ ] Barre combo visible à 30% écran, centrée en haut, sous le text
- [ ] Couleur change visiblement entre x2 (cyan), x3 (magenta), x5 (or), x8 (rouge)
- [ ] À chaque palier franchi : shake + flash + son montant en pitch audible distinctement
- [ ] Toggle "Juice combo: LIGHT" désactive shake+flash+hitStop mais pas son+barre
- [ ] Sandbox mode (aucun ennemi) : le combo via chaîne d'or ou cascade eau déclenche le juice
- [ ] `COMBO_WINDOW=2.5s` : la barre descend bien en 2.5s (pas 4s — ignorer l'écart avec la ligne 85 de tiles.js qui étend à +4s **seulement quand chaîne d'or** — c'est intentionnel)
- [ ] Mode Apocalypse (x5 → triggerApocalypse) : le juice combo doit jouer AVANT l'apocalypse (ordre : comboStep puis apocalypse flash)
- [ ] Pas de dupliqué `k.onUpdate` global (le handler comboEnd est enregistré 1x à la scene setup, pas par frame)
- [ ] 7 commits atomiques pushés (voir section 6)

---

## 6. Effort estimé — 7 commits atomiques

Ordre recommandé (chaque commit compile + joue en local sans régression) :

1. **`feat(combo): COMBO_COLORS palette in constants`** — `constants.js` seul, ajout export
2. **`feat(audio): comboStep/comboEnd procedural sounds`** — `audio.js` seul
3. **`feat(hud): full-width combo bar with palier color`** — `hud.js`, remplace bloc 419-437 + import
4. **`feat(combo): triggerComboStep hook in registerKill`** — `main.js` registerKill + expose window.__comboStep + onUpdate comboEnd
5. **`feat(combo): wire chain-or and water-cascade to comboStep`** — `tiles.js:85` + `wagons.js:673`
6. **`feat(settings): juice toggle reducedJuice`** — `settings-modal.js` bouton + handler
7. **`chore: test + readme combo juice`** (optionnel — si on teste en live et rien à fixer, skip)

Temps estimé total : **2h** dev + 30 min QA live.

---

## 7. Risques & mitigations

| Risque | Mitigation |
|---|---|
| `k.color(colorObj)` crash "Invalid color arguments" | **Toujours 3 args r,g,b** via déstructuration `[cr,cg,cb]` — pattern déjà présent dans le projet (cf registerKill apocalypse bloc) |
| 32 sons simultanés saturent Web Audio | Anti-spam `_lastComboStepAt` < 150ms dans `audio.js` |
| Screen shake excessif nausée | Cap `Math.min(12, 2 + level*2)` + toggle `reducedJuice` |
| `setInterval` conflit avec HUD existant (hud.js:158) | **Ne pas créer de 2e setInterval** — toute logique de rendu combo reste dans `renderHud()` canvas, le timer descend via `k.time()` comparé à `gameState.comboExpire` (déjà fait) |
| TDZ sur `COMBO_COLORS` si lu tôt | Export module-level dans `constants.js`, import standard dans les consommateurs |
| `k.fixed()` sur overlay fullscreen = WebGL feedback loop (cf CLAUDE.md) | Le flash combo a `lifespan(0.12)` donc existe < 120ms → risque très faible. Test visuel : si artefacts, retirer `k.fixed()` et le flash scrollera légèrement (acceptable). |
| Ordre palier x5 → apocalypse double trigger | Dans `registerKill`, l'appel `triggerApocalypse()` reste conditionné à `prev < 5 && comboCount === 5`. Le hook `triggerComboStep(5)` est appelé **avant** via le if juste après le calcul mult — donc : son palier x5 joue puis apocalypse prend le relais 200ms plus tard. ✓ |
| Test chaîne d'or (tiles.js) : `prevCC` peut être 0 → 2, saut de 2 paliers | Volontaire : `triggerComboStep(2)` joue une fois, pas deux. On ne cascade pas les paliers intermédiaires. |
| `save.reducedJuice` non défini au premier load | `if (save.reducedJuice)` est falsy par défaut → full juice par défaut (bon UX). Pas de migration nécessaire. |
| Mobile : barre 30% = 384px sur 1280 interne, mais canvas réellement 100% viewport | La barre est rendue en coords INTERNES (WIDTH=1280), donc l'upscale CSS la garde proportionnelle. ✓ |

---

## 8. Non-objectifs (ne PAS faire)

- Ne pas toucher à `COMBO_MULTIPLIERS` ni à `COMBO_WINDOW` (scoring inchangé)
- Ne pas ajouter un paliers x16 ou x32 (le ticket l'évoque mais `COMBO_MULTIPLIERS.length === 6`, max index 5 = x8)
- Ne pas ajouter de backend / télémétrie
- Ne pas créer `src/combo.js` — la logique est trop petite, DRY préserve 4 imports inutiles
- Ne pas remplacer `audio.combo()` partout : seulement aux 2 endroits spécifiés (tiles + wagons). Les autres appels (`registerKill` VIP `main.js:571`, apocalypse `main.js:602`) gardent `audio.combo()` pour ne pas doubler avec `comboStep`.
- Ne pas casser le mode Sandbox : toutes les features sont additives, toggle via settings.

---

## 9. Scénarios de test manuels (post-impl)

1. **Kill rapide 4 ennemis en 2s** → barre doit passer cyan → magenta → or, sons pitch up audibles, 3 flashs écran, cap shake=12 à x5 = apocalypse trigger.
2. **Placer 3 pièces en diagonale** (via outil coin) → attendre le ramassage par un visiteur/wagon → chaîne d'or → flash cyan + son comboStep(2), barre 30% apparait pendant 4s.
3. **Poser fan + eau + laisser wagon passer** → cascade eau → combo++, flash palier correspondant.
4. **Toggle Juice LIGHT dans settings** → reproduire un combo x3 → son + barre OK, pas de shake, pas de flash écran.
5. **Attendre expiration combo** (rester inactif 2.5s après un x2) → son "comboEnd" descendant, barre disparait cleanly, pas d'erreur.
6. **FPS stress** : x5 + apocalypse simultanés → `window.__getStats()` → pas de leak entity (< 10 entités combo-flash actives).
7. **Cog settings > Juice toggle** → valeur persiste au reload (`localStorage` via `persistSave`).

---

## 10. Hypothèses et questions résolues

- **"Timer 4s descendant"** (ticket) vs `COMBO_WINDOW=2.5s` : **on reste à 2.5s**. Les 4s de `tiles.js:85` sont une extension spécifique chaîne d'or, conservée telle quelle.
- **"x16, x32, blanc pulsant"** (ticket) : non applicable — max x8 dans `COMBO_MULTIPLIERS`. On peut ajouter 2 paliers future-proof `[1,1,2,3,5,8,13,21]` si le user valide ; sinon on s'arrête à 6 couleurs.
- **Existence `k.shake`** : KAPLAY expose `k.shake(n)` natif (pas besoin du `juice.dirShake` custom ici — on garde celui-ci pour les effets directionnels ailleurs).
