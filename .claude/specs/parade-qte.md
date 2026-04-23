# Spec — Parade Lave QTE (round 3 anti-autopilote)

## But

Transformer un évènement passif (wagon qui tombe dans la lave) en moment de skill
joueur : un QTE "parade" permet d'éviter un stun et de monter un combo "Surfeur
de Lave".

## Trigger

Dans `src/wagon-collisions.js`, handler `wagon.onCollide("lava", ...)` :
- Condition existante de transformation : `if (hasHuman || wagon.inverseTrain)`
  → `transformToSkeleton(wagon)`
- **Ajout** : immédiatement après le `transformToSkeleton(wagon)` (branche
  `if (hasHuman || wagon.inverseTrain)`), déclencher le QTE sur le joueur
  **le plus proche du wagon** :
  - Distance 2D `wagon.pos` ↔ `p.pos` (prendre le plus petit)
  - Seulement joueurs **actifs existants**, **non-stunnés**, et
    **non-skeletonisés** (`!p.isSkeleton`)
  - Skip si aucun joueur éligible à < 400px (évite QTE hors-écran)
  - Skip si `wagon.isSpectral` (le check existe déjà en amont du handler)
  - Cooldown minimal par wagon : `wagon._paradeCd > k.time()` ⇒ skip (0.8s)

Pour ça, le handler dans wagon-collisions.js a besoin d'un nouveau param
`triggerParade(wagon)` fourni par wagons.js (comme `catapultWagon`,
`transformToSkeleton`, etc. déjà existants).

## Système Parade (nouveau fichier `src/parade-qte.js`)

API :
```js
export function createParadeQTE({ k, audio, showPopup, gameState, getActivePlayers })
// retourne { triggerFromWagon(wagon) }
```

Le getActivePlayers() sera fourni par main.js (même pattern que raceSystem).

Le module est créé dans main.js après `createPlayerSystem` et avant
`createWagonSystem` **⚠ dépendance circulaire** : wagons.js a besoin de
`triggerParade` ET parade-qte a besoin de `getActivePlayers`.

**Solution** : main.js crée un objet `paradeRef = { trigger: null }` passé à
wagons.js via `triggerParade: (w) => paradeRef.trigger?.(w)`. Après
`createPlayerSystem`, main.js instancie `createParadeQTE({..., getActivePlayers})`
et assigne `paradeRef.trigger = paradeSystem.triggerFromWagon`.

### État

- `activeQTEs: Set<entity>` — les entités QTE actives
- Chaque QTE porte : `player`, `startTime`, `duration = 0.6`, `parried = false`
- Un seul QTE par joueur à la fois : si un QTE est déjà actif pour le joueur
  ciblé, on ne relance pas

### Visuel QTE

Entité KAPLAY taggée `"parade-qte"`, fixée en coordonnées monde (suit le joueur
via onUpdate) :
```
k.add([
  k.pos(p.pos.x + 14, p.pos.y - 14),
  k.anchor("center"),
  k.z(20),
  "parade-qte",
  { player: p, startTime: k.time(), duration: 0.6, parried: false,
    onUpdate() { this.pos = k.vec2(p.pos.x + 14, p.pos.y - 14); /* ... */ },
    draw() {
      const t = Math.max(0, Math.min(1, (k.time() - this.startTime) / this.duration));
      const r = k.lerp(28, 8, t);
      // Anneau extérieur noir pour contraste
      k.drawCircle({ pos: k.vec2(0, 0), radius: r + 1, outline: { color: k.rgb(0,0,0), width: 2 }, fill: false });
      k.drawCircle({ pos: k.vec2(0, 0), radius: r, outline: { color: k.rgb(255,230,90), width: 2 }, fill: false });
      // Cible fixe (le joueur doit appuyer quand le ring atteint ce rayon = 10)
      k.drawCircle({ pos: k.vec2(0, 0), radius: 10, outline: { color: k.rgb(255,80,60), width: 1 }, fill: false });
      // Label touche (utilise p.parryKeyLabel: "SPACE" pour Mario, "I" pour Pika)
      const label = this.player?.parryKeyLabel || "!";
      // Utiliser drawText outline (k.drawText avec 4 offsets simples — cf showPopup pattern)
      for (const [dx,dy] of [[-1,0],[1,0],[0,-1],[0,1]]) {
        k.drawText({ text: label, size: 12, pos: k.vec2(dx, -28 + dy), anchor: "center", color: k.rgb(0,0,0) });
      }
      k.drawText({ text: label, size: 12, pos: k.vec2(0, -28), anchor: "center", color: k.rgb(255,230,90) });
    },
  },
]);
```

**NB** : Pas de `drawText` avec caractères `[...]` ou backslash (cf CLAUDE.md
KAPLAY pitfalls). "SPACE" / "I" / "JUMP" ok.

### Input parade

Dans `createParadeQTE`, listener **global** :
```js
k.onKeyPress((key) => {
  // Pour chaque QTE actif, vérifier si la touche matche la parryKey du joueur
  for (const qte of activeQTEs) {
    if (qte.parried) continue;
    const keys = qte.player.parryKeys || [];
    if (!keys.includes(key)) continue;
    const t = (k.time() - qte.startTime) / qte.duration;
    // Fenêtre de succès = 0..1 (tout le temps d'affichage compte), mais
    // précision = proximité du rayon cible (r=10 = t ≈ 0.9)
    qte.parried = true;
    onParadeSuccess(qte);
  }
});
```

Sur le player, stocker dans players.js (1 ajout dans createPlayer) :
```js
p.parryKeys = Array.isArray(opts.keys.jump) ? opts.keys.jump : [opts.keys.jump];
p.parryKeyLabel = (opts.keys.jump[0] || opts.keys.jump).toUpperCase();
// pour "space" → "SPACE", pour "i" → "I"
```

**IMPORTANT** : le joueur a déjà `k.onKeyPress(opts.keys.jump, ...)` enregistré
pour le saut. Pour ne **pas faire sauter le joueur pendant une parade**, on
ajoute au début du handler existant :
```js
k.onKeyPress(opts.keys.jump, () => {
  if (p._paradeConsumedAt === k.time()) return; // parade a déjà consommé ce frame
  ...
});
```
Et dans `onParadeSuccess` on set `qte.player._paradeConsumedAt = k.time()`.
(KAPLAY tire tous les `onKeyPress` listeners dans le même frame, donc c'est
suffisant. Sans ça, le joueur sauterait à chaque parade — ce qui peut être
marrant mais pollue la feature.)

**Alternative plus propre** : lire `k.isKeyPressed(key)` dans l'onUpdate du QTE
chaque frame pour détecter la parade SANS enregistrer de listener global.
C'est **la voie recommandée** — plus simple, pas de conflit :
```js
qte.onUpdate = function() {
  this.pos = ... ;
  const elapsed = k.time() - this.startTime;
  if (elapsed >= this.duration) {
    if (!this.parried) onParadeMiss(this);
    k.destroy(this);
    activeQTEs.delete(this);
    return;
  }
  if (!this.parried) {
    for (const key of this.player.parryKeys) {
      if (k.isKeyPressed(key)) {
        this.parried = true;
        onParadeSuccess(this);
        // Consommer la touche : set marker pour que le saut normal soit ignoré ce frame
        this.player._paradeConsumedAt = k.time();
        break;
      }
    }
  }
};
```

Et dans players.js, au tout début du `k.onKeyPress(opts.keys.jump, ...)` :
```js
if (p._paradeConsumedAt === k.time()) return;
```

### onParadeSuccess(qte)

- Flash blanc : ajouter un rectangle fullscreen (ou juste autour du joueur)
  avec `lifespan(0.15)` et `opacity(0.5)` blanc. Plus simple : un `k.add`
  avec `k.rect(60,60)` pos joueur, opacity → 0.
- `audio.combo()` (déjà existant)
- `gameState.score += 30`
- Popup "+30 PARADE!" jaune au-dessus du joueur
- Combo : `qte.player._paradeCombo = (qte.player._paradeCombo || 0) + 1`
- Si `combo % 5 === 0` :
  - `gameState.score += 200`
  - Popup "SURFEUR DE LAVE !" cyan/jaune taille 28, 1.5s au-dessus
  - `audio.apocalypse()` si existe, sinon `audio.combo()` (vérifier)
  - 24 particules rayonnantes cyan/jaune
  - **Achievement** : `window.__achievements?.unlock("surfeur_lave")` si
    systeme achievements existe (check dans src/achievements.js)
  - **Spectre** : `window.__spectres?.unlock("surfeur")` si catégorie existe
    (check optionnel, skip si pas de clef)

### onParadeMiss(qte)

- `qte.player.stunnedUntil = k.time() + 1.5`
- Reset combo : `qte.player._paradeCombo = 0`
- Popup "STUN!" rouge taille 18 au-dessus
- 6 particules vers le bas (éclaboussure ratée) : couleur orange/rouge
- `audio.lose?.()` si existe, sinon `audio.hit?.()`, sinon silencieux

### Effet stun sur le joueur

Dans players.js, dans **chaque** handler de mouvement/saut du joueur
(`onKeyDown(left/right)`, `onKeyPress(jump)`, `onKeyPress(board)`, ainsi que le
bloc mobileP1) ajouter en tête :
```js
if (p.stunnedUntil && k.time() < p.stunnedUntil) return;
```

Dans le `onUpdate` d'effets tile (ligne ~259+), ne pas appliquer
`applyTileEffectToPlayer` si stunné (optionnel — on peut laisser le tile agir
pendant le stun, mais idéalement la lave ne retrigger pas). **Décision** :
laisser les tiles agir normalement, c'est plus simple et plus cohérent
(le stun empêche juste l'input joueur, pas la physique).

Visuel stun : dans le draw du nom du joueur (ligne ~162), si stunné, dessiner
aussi de petites étoiles tournantes au-dessus de la tête (2-3 étoiles qui
font le tour). Simple :
```js
if (p.stunnedUntil && k.time() < p.stunnedUntil) {
  for (let i = 0; i < 3; i++) {
    const a = k.time() * 5 + i * (Math.PI * 2 / 3);
    k.drawText({
      text: "★", size: 10,
      pos: k.vec2(14 + Math.cos(a) * 14, -24 + Math.sin(a) * 6),
      anchor: "center", color: k.rgb(255, 220, 80),
    });
  }
}
```

### Éclaboussure initiale

Au moment où le QTE se déclenche, spawn 5 particules lava depuis le wagon
vers le joueur (trajectoire parabolique courte 0.5s, couleur orange/rouge) :
```js
const dx = p.pos.x - wagon.pos.x;
const dy = p.pos.y - wagon.pos.y;
const dist = Math.max(1, Math.hypot(dx, dy));
for (let i = 0; i < 5; i++) {
  const spread = (Math.random() - 0.5) * 0.4;
  const speed = 180 + Math.random() * 60;
  const ux = dx / dist;
  const uy = dy / dist;
  // rotation par spread
  const rx = ux * Math.cos(spread) - uy * Math.sin(spread);
  const ry = ux * Math.sin(spread) + uy * Math.cos(spread);
  k.add([
    k.circle(3 + Math.random() * 2),
    k.pos(wagon.pos.x + 30, wagon.pos.y + 10),
    k.color(k.rgb(255, 120 + Math.random() * 60, 40)),
    k.opacity(1),
    k.lifespan(0.5, { fade: 0.3 }),
    k.z(14),
    "particle-grav",
    { vx: rx * speed, vy: ry * speed - 60, grav: 260 },
  ]);
}
```

## Wiring dans main.js

1. Import : `import { createParadeQTE } from "./parade-qte.js";` (à côté des
   autres imports top of file)
2. Avant `createWagonSystem` : `const paradeRef = { trigger: null };`
3. Dans l'appel `createWagonSystem({ ... })` : ajouter au dict passé
   `triggerParade: (w) => paradeRef.trigger?.(w),`
4. Après `createPlayerSystem` et `const activePlayers = spawnPlayers(...)` :
   ```js
   const paradeSystem = createParadeQTE({
     k, audio, gameState,
     showPopup: (...args) => showPopup(...args),
     getActivePlayers: () => activePlayers,
   });
   paradeRef.trigger = paradeSystem.triggerFromWagon;
   ```

## Wiring dans wagons.js

1. Ajouter `triggerParade` au destructuring de `createWagonSystem({ ..., triggerParade })`
2. Passer `triggerParade` à `attachWagonCollisions({ ..., triggerParade })`
   (ligne ~944)

## Wiring dans wagon-collisions.js

1. Ajouter `triggerParade` au destructuring des params de
   `attachWagonCollisions({ ... })`
2. Dans `wagon.onCollide("lava", ...)`, après
   `transformToSkeleton(wagon)` dans la branche `if (hasHuman || wagon.inverseTrain)` :
   ```js
   triggerParade?.(wagon);
   ```
   (triggerParade est un callback optionnel côté API)

## Wiring dans players.js

1. Dans `createPlayer(opts, ...)`, après `const p = k.add([...])` :
   ```js
   const jumpKeys = Array.isArray(opts.keys.jump) ? opts.keys.jump : [opts.keys.jump];
   p.parryKeys = jumpKeys;
   p.parryKeyLabel = jumpKeys[0].toUpperCase();
   ```
2. Ajouter en tête de chaque handler input (mais PAS dans le listener du
   parade-qte lui-même évidemment) :
   ```js
   if (p.stunnedUntil && k.time() < p.stunnedUntil) return;
   ```
   Zones :
   - `k.onKeyDown(opts.keys.left, () => { /* ici */ ... })`
   - `k.onKeyDown(opts.keys.right, () => { /* ici */ ... })`
   - `k.onKeyPress(opts.keys.jump, () => { /* après le _paradeConsumedAt check */ ... })`
     - Ligne 222 dans le fichier actuel, avant `if (p.ridingWagon)`
   - `k.onKeyPress(opts.keys.board, () => { /* ici */ ... })`
   - Le bloc `if (mobileP1)` onUpdate : check stun en tête de la fonction
3. Dans le `k.onKeyPress(opts.keys.jump, ...)` au tout début :
   ```js
   if (p._paradeConsumedAt === k.time()) return;
   if (p.stunnedUntil && k.time() < p.stunnedUntil) return;
   ```
4. Dans le `p.onDraw` (ligne ~162) ajouter le rendu étoiles stun (voir spec
   ci-dessus).

## Critères d'acceptation

1. `npm run build` passe sans erreur.
2. En jeu sandbox, poser lava + rail, laisser wagon arriver : un anneau
   jaune apparaît au-dessus du joueur le plus proche pendant 0.6s.
3. Appuyer sur la touche jump pendant la fenêtre → flash blanc + popup
   "+30 PARADE!" + combo counter incrémente (visible via
   `window.__players?.[0]._paradeCombo` en console ou implicite).
4. Ne pas appuyer → popup "STUN!" + joueur ne répond plus 1.5s + étoiles
   tournent au-dessus.
5. 5 parades réussies consécutives → popup "SURFEUR DE LAVE !" + 200pts + fx.
6. Le saut normal ne se déclenche pas pendant une parade réussie (le joueur
   ne saute pas accidentellement).
7. 2 joueurs : les QTE ciblent correctement chacun selon proximité.
8. Pas de régression : les combos lave/Apocalypse/Inverse train existants
   continuent de fonctionner.

## Debug exposes

- `window.__parade = paradeSystem;` dans main.js (pattern existant)
- `window.__parade.triggerFromWagon(window.__wagons?.[0])` force un QTE

## Bundle target

Feature contenue, ajout estimé < 3 KB gz. Bundle doit rester < 100 KB gz.

## Commit

```
feat(parade): mini-jeu QTE parade lave (combo Surfeur 5x = +200pts)
```

Un seul commit atomique. Push main après build OK.
