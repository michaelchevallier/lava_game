# Saison Hiver — 5e weather event

## 1. Objectif

Ajouter un **5e weather event** au système existant `src/weather.js`. Pendant 20s, le parc bascule en mode hivernal : neige qui tombe, overlay bleu-blanc, ground devient glissant (ice partout), audio crack glacial. À la fin, score bonus +75.

Format "fun et jouable simplement" : le joueur voit un changement visuel énorme, court, et profite de mécaniques ice qui existent déjà sur les wagons (glide).

## 2. Mécaniques

- **TYPES** : ajouter `"winter"` au tableau ligne 6 (`["lightning", "coinrain", "wind", "magstorm", "winter"]`).
- **Warning label** : `"BLIZZARD DANS 3s !"` (ligne 12-17).
- **Active duration** : 20 secondes.
- **Effets pendant active** :
  - Overlay bleu-blanc semi-transparent sur tout l'écran (`rgb(180, 220, 255)` à opacity ~0.18 pulsante)
  - **Neige qui tombe** : 50 flocons rendus en draw (rect 2×2 ou 3×3, color blanc, drift gauche-droite via sin), mouvement vertical 80-120 px/s
  - **Wagons** reçoivent un `glideUntil` continuellement rafraîchi (`wagon.glideUntil = k.time() + 0.5`, `glideBonus = 30`) — utilise le mécanisme ice existant déjà consommé dans `wagons.js:707-708`. Donc tous les wagons "patinent" pendant l'event.
  - **Score multiplier x1.5** pendant la durée (`gameState.scoreMultiplier = 1.5`, `scoreMultiplierUntil = k.time() + 20`)
- **Fin de l'event** : `gameState.score += 75` + popup `"BLIZZARD PASSE +75"`.

## 3. Implémentation (modifications de weather.js seulement)

### 3.1 TYPES + label
```js
const TYPES = ["lightning", "coinrain", "wind", "magstorm", "winter"];
// dans labels :
winter: "BLIZZARD DANS 3s !",
```

### 3.2 startActive (après le `magstorm` branch)
```js
} else if (type === "winter") {
  const DUR = 20;
  active = { type, until: k.time() + DUR };
  gameState.scoreMultiplier = 1.5;
  gameState.scoreMultiplierUntil = k.time() + DUR;
  audio.crack?.();
  audio.combo?.();
}
```

### 3.3 Boucle k.loop(0.1) — ajouter branch winter
Dans le `k.loop(0.1, () => { ... })` existant ligne 135, après le branch `wind` (ligne 155-162), ajouter :

```js
} else if (active?.type === "winter") {
  for (const w of k.get("wagon")) {
    w.glideUntil = k.time() + 0.5;
    w.glideBonus = 30;
  }
}
```

### 3.4 Fin event — popup score (ligne 142-145)
Étendre le `if (active.type === "magstorm")` :
```js
if (active.type === "magstorm") {
  gameState.score += 50;
  showPopup(WIDTH / 2, 100, "TEMPÊTE PASSÉE +50", k.rgb(180, 120, 255), 24);
} else if (active.type === "winter") {
  gameState.score += 75;
  showPopup(WIDTH / 2, 100, "BLIZZARD PASSE +75", k.rgb(200, 230, 255), 24);
}
```

### 3.5 Draw overlay (dans `k.add([...{ draw() {...} }])` ligne 169-240)

Ajouter à la fin de `draw()`, avant la fermeture :

```js
if (active?.type === "winter") {
  const t = k.time();
  // Overlay bleu-blanc pulsant
  const pulse = 0.14 + 0.06 * Math.sin(t * 3);
  k.drawRect({
    pos: k.vec2(0, 0),
    width: WIDTH,
    height: HEIGHT,
    color: k.rgb(200, 230, 255),
    opacity: pulse,
  });
  // Flocons (50)
  for (let i = 0; i < 50; i++) {
    const baseX = (i * 67 + Math.sin(t * 1.2 + i) * 30) % WIDTH;
    const baseY = ((i * 41 + t * (90 + (i % 4) * 15)) % HEIGHT);
    const size = 2 + (i % 3);
    k.drawRect({
      pos: k.vec2(baseX, baseY),
      width: size,
      height: size,
      color: k.rgb(245, 250, 255),
      opacity: 0.85,
    });
  }
}
```

## 4. Critères de succès

- [ ] Build sans erreur, bundle < 115 KB gz.
- [ ] Toutes les ~90s, weather event aléatoire — quand `winter` tombe, popup "BLIZZARD DANS 3s !" puis 20s de neige + overlay bleu + wagons patinent.
- [ ] Visuellement distinct des 4 autres events (overlay clair vs sombre/violet/etc.).
- [ ] À la fin, popup "BLIZZARD PASSE +75" + score +75.
- [ ] Multiplicateur x1.5 actif pendant les 20s (vérifiable sur ramassage coin pendant event).
- [ ] Wagons en train de rouler glissent avec bonus +30 pendant tout l'event.
- [ ] Force trigger : `window.__weather` n'expose pas trigger() actuellement. **Ne pas ajouter** d'API publique pour rester minimal — on testera in-game (le timer est court).
- [ ] Zéro erreur console, FPS stable >= 55 même avec wagons + neige + overlay.

## 5. Risques

- **`glideUntil` réécrit chaque frame** : le rafraîchissement à `k.time() + 0.5` toutes les 0.1s assure que la condition `wagon.glideUntil > k.time()` (wagons.js:707) est toujours vraie pendant l'event. Quand l'event finit, le glideUntil expire 0.5s après → transition douce.
- **Scoring x1.5 vs x2 magstorm** : le x1.5 est un nouveau pattern, mais `scoreMultiplier` est juste un nombre, pas de logique spéciale. Vérifier ce qui consomme `scoreMultiplier` dans le code (probablement coin collect / wagon transform). Si certains scorings hardcodent x2, ils ne sont pas affectés.
- **Particle count** : 50 flocons sont des `drawRect` directs (pas des entities), zéro impact sur `__entityCounts`.

## 6. Effort

**1 commit atomique**, ~50 lignes ajoutées dans `weather.js` seulement. ~15 min.

Message : `feat(weather): blizzard hivernal 5e event (neige + wagons patinent + x1.5)`
