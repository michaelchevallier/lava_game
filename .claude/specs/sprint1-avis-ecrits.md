# Sprint 1 — Feed d'Avis Écrits

*Spec implémentable pour feature-dev sonnet. Source : `.claude/GAMEPLAY_PLAN.md` §Phase 1.2.*

---

## 1. Contexte

Le jeu a 30 systèmes (squelettes, combos, wagons dorés, APOCALYPSE…) mais **aucune mémoire narrative**. Le joueur déclenche une cascade visuelle spectaculaire et… il ne reste rien d'écrit. Les visiteurs passent, silencieux, comme s'ils n'avaient pas d'opinion.

Le **Feed d'Avis Écrits** donne une voix aux visiteurs : toutes les 8-15s, un avis court (1 ligne < 90 chars) apparaît en bas-droite avec un nom français, un âge, des étoiles, et une phrase qui référence un événement récent. Le chaos se transforme en **feedback émotionnel**.

**Non-objectifs** : pas de persistance, pas de filtrage, pas de clic sur avis, pas de traduction multi-langue, pas de son lié (éviter pollution sonore, déjà saturé).

---

## 2. Fichiers impactés

| Fichier | Action | Détail |
|---|---|---|
| `/Users/mike/Work/milan project/src/reviews.js` | **CRÉER** | ~220 lignes — système complet, templates, DOM management |
| `/Users/mike/Work/milan project/src/main.js` | MODIFIER | Importer + instancier + wire events |
| `/Users/mike/Work/milan project/index.html` | MODIFIER | Ajouter `<div id="review-feed">` + styles |
| `/Users/mike/Work/milan project/src/wagons.js` | MODIFIER | Hook `reviveFromSkeleton` (ligne ~1281) |
| `/Users/mike/Work/milan project/src/visitor.js` | MODIFIER | Hook transformation squelette (ligne ~186) |

Points d'accrochage existants (lecture) :
- `src/main.js:551` `registerKill` → squelette transformé / wagon tué
- `src/main.js:592` `triggerApocalypse` → APOCALYPSE x5
- `src/main.js:650` `registerCoin` + streak à 672 → chaîne dorée / Pluie d'Or
- `src/main.js:1461` `createWeatherSystem` → pluie de pièces aléatoire
- `src/wagons.js:78` `wagon.isGolden` → wagon doré
- `src/wagons.js:1281` `reviveFromSkeleton` → résurrection par eau
- `src/visitor.js:184-193` transformation squelette visitor → déclencheur le plus fréquent

---

## 3. Comportement attendu

1. Dès que le joueur pose une tuile ou fait une action, des événements sont enregistrés dans un buffer circulaire côté `reviews.js`.
2. Toutes les 8-15s (randomisé), si au moins **3 événements** se sont produits dans la fenêtre depuis le dernier avis, un avis est généré, composé d'un nom + âge + étoiles + phrase templated.
3. L'avis apparaît en bas-droite dans un stack de 3 cartes max, slide-in depuis la droite en 300ms.
4. Chaque carte reste visible **6 secondes**, puis fade-out 400ms.
5. Une 4e carte qui arrive pousse la plus ancienne en fade-out immédiat.
6. Si **APOCALYPSE** est déclenché, un avis dédié 5★ bypasse le throttle et s'affiche immédiatement (avec une animation un peu plus punchy — scale 0.8→1).
7. Après un avis 5★, cooldown 4s absolu avant qu'un autre avis apparaisse (donne du poids émotionnel).
8. Throttle absolu : **minimum 6s entre deux avis**, tous événements confondus (hors APOCALYPSE).
9. Les avis négatifs (1★) sont rares (~8% du pool) : mort accidentelle d'un visiteur crowd, ou échec de quête visible.
10. Les avis neutres/observation (3★) sont le "bruit de fond" ambiant quand peu d'événements forts.
11. Sur mobile (viewport < 600px width), le feed se cale au-dessus des contrôles tactiles (offset bottom adapté via media query).
12. Aucun son n'est joué pour un avis.
13. Le feed est caché pendant la pause (opacity 0.15) pour pas polluer le screenshot PAUSE.
14. À la réinitialisation de scène (touche R), le feed est vidé et le throttle reset.

---

## 4. Pseudo-code des fixes

### 4.1 `src/reviews.js` (nouveau fichier)

```js
// src/reviews.js
const PRENOMS = [
  "Ginette", "Jean-Claude", "Kevin", "Fatou", "Marcel", "Raphael", "Zoe",
  "Mamie Lucette", "Bernard", "Chantal", "Dylan", "Amina", "Leo", "Solange",
  "Thierry", "Manon", "Youssef", "Jacqueline", "Nathan", "Odette",
  "Patrice", "Sabrina", "Gerard", "Clemence", "Abdel",
];

// Chaque template : { stars, cat, tpl }
// cat : "transform" | "revive" | "coin" | "apocalypse" | "goldwagon" | "combo" | "death" | "placement" | "ambient"
// Slots : {name}, {age}, {subject}
const TEMPLATES = [
  // --- 5 etoiles (cascade / apocalypse / gold) ---
  { stars: 5, cat: "apocalypse", tpl: "C'etait l'APOCALYPSE ! Mes oreilles sifflent encore." },
  { stars: 5, cat: "apocalypse", tpl: "Jamais vu autant de squelettes d'un coup. Genial." },
  { stars: 5, cat: "goldwagon", tpl: "Le wagon DORE est passe devant moi ! Je tremble." },
  { stars: 5, cat: "combo",     tpl: "Combo enchaine comme un chef d'orchestre. Bravo." },
  { stars: 5, cat: "coin",      tpl: "Les pieces dansaient, c'etait une pluie d'or !" },

  // --- 4 etoiles (positif) ---
  { stars: 4, cat: "transform", tpl: "Le squelette m'a terrifie(e), merveilleux !" },
  { stars: 4, cat: "transform", tpl: "La lave est spectaculaire, je reviendrai." },
  { stars: 4, cat: "transform", tpl: "Mon cousin a ete transforme, il adore." },
  { stars: 4, cat: "revive",    tpl: "La resurrection par l'eau, c'est poetique." },
  { stars: 4, cat: "revive",    tpl: "Sortir de l'au-dela, quelle sensation !" },
  { stars: 4, cat: "coin",      tpl: "Les pieces alignees en diagonale = magie." },
  { stars: 4, cat: "coin",      tpl: "J'ai ramasse trois pieces, je me sens riche." },
  { stars: 4, cat: "combo",     tpl: "Le spectacle s'enchaine, on ne s'ennuie pas." },
  { stars: 4, cat: "goldwagon", tpl: "Un wagon tout dore, c'est la classe." },
  { stars: 4, cat: "transform", tpl: "Feu, os, lave : festival des sens !" },

  // --- 3 etoiles (neutre / observation) ---
  { stars: 3, cat: "ambient",   tpl: "Parc sympa. Un peu chaud cote lave." },
  { stars: 3, cat: "ambient",   tpl: "J'ai marche longtemps. Des wagons partout." },
  { stars: 3, cat: "ambient",   tpl: "Ambiance foraine reussie. File d'attente ok." },
  { stars: 3, cat: "placement", tpl: "Belle disposition des rails, mais ou est le snack ?" },
  { stars: 3, cat: "placement", tpl: "Le trampoline est bien place. J'ai rebondi." },
  { stars: 3, cat: "ambient",   tpl: "J'ai vu un ballon s'envoler. Apaisant." },
  { stars: 3, cat: "ambient",   tpl: "La foule applaudit, je me sens entraine(e)." },
  { stars: 3, cat: "placement", tpl: "Plus de ventilateurs svp, il fait chaud." },

  // --- 2 etoiles (mitige) ---
  { stars: 2, cat: "ambient",   tpl: "Trop de monde aujourd'hui. Dommage." },
  { stars: 2, cat: "placement", tpl: "J'ai failli tomber dans la lave. Attention." },
  { stars: 2, cat: "ambient",   tpl: "Le wagon est passe trop vite, j'ai rien vu." },
  { stars: 2, cat: "ambient",   tpl: "Bruit de fond constant. Un peu fatigant." },

  // --- 1 etoile (negatif rare) ---
  { stars: 1, cat: "death",     tpl: "Ma grand-mere s'est evanouie. Scandale." },
  { stars: 1, cat: "death",     tpl: "Horreur, j'ai failli y passer moi aussi." },
  { stars: 1, cat: "placement", tpl: "Trop de lave, pas assez de bancs." },

  // --- Variants supplementaires pour atteindre 40 ---
  { stars: 4, cat: "transform", tpl: "Le feu devore les visiteurs en cadence. Fou." },
  { stars: 4, cat: "apocalypse", tpl: "Chaos total. Mon coeur bat encore." },
  { stars: 5, cat: "combo",      tpl: "Combo x8, j'applaudis debout !" },
  { stars: 3, cat: "coin",       tpl: "Quelques pieces ramassees, c'est sympa." },
  { stars: 4, cat: "revive",     tpl: "Je suis passe(e) de mort a vivant, incroyable." },
  { stars: 2, cat: "death",      tpl: "Un squelette a bouscule ma fille. Moyen." },
  { stars: 5, cat: "transform",  tpl: "Cinq transformations en rafale. Delirant." },
  { stars: 3, cat: "placement",  tpl: "Les portails sont chouettes, mais desorientants." },
  { stars: 4, cat: "goldwagon",  tpl: "Le wagon d'or, porte-bonheur de la journee." },
  { stars: 4, cat: "ambient",    tpl: "Une lune, des lucioles. Poesie." },
];

const CAT_BY_EVENT = {
  transform:  ["transform"],
  revive:     ["revive"],
  coin_chain: ["coin"],
  apocalypse: ["apocalypse", "combo"],
  goldwagon:  ["goldwagon"],
  combo8:     ["combo"],
  death:      ["death"],
  placement:  ["placement", "ambient"],
  ambient:    ["ambient", "placement"],
};

export function createReviewSystem({ k, gameState }) {
  let feedEl = document.getElementById("review-feed");
  if (!feedEl) {
    feedEl = document.createElement("div");
    feedEl.id = "review-feed";
    document.body.appendChild(feedEl);
  }
  const eventBuffer = []; // { type, ts }
  let lastReviewAt = 0;
  let nextCheckAt = performance.now() + 8000 + Math.random() * 7000;
  let postFiveStarCooldownUntil = 0;

  function pushEvent(type) {
    eventBuffer.push({ type, ts: performance.now() });
    // purge > 20s
    while (eventBuffer.length && performance.now() - eventBuffer[0].ts > 20000) {
      eventBuffer.shift();
    }
  }

  function pickTemplate(eventType) {
    const cats = CAT_BY_EVENT[eventType] || ["ambient"];
    const pool = TEMPLATES.filter((t) => cats.includes(t.cat));
    if (pool.length === 0) return TEMPLATES[0];
    return pool[Math.floor(Math.random() * pool.length)];
  }

  function renderReview(tpl) {
    const name = PRENOMS[Math.floor(Math.random() * PRENOMS.length)];
    // Age via normale tronquee [5, 85]
    let age = Math.round(40 + (Math.random() + Math.random() + Math.random() - 1.5) * 22);
    age = Math.max(5, Math.min(85, age));
    const starsStr = "★".repeat(tpl.stars) + "☆".repeat(5 - tpl.stars);

    const card = document.createElement("div");
    card.className = "rv-card" + (tpl.stars === 5 ? " rv-5star" : "") + (tpl.stars <= 1 ? " rv-bad" : "");
    const header = document.createElement("div");
    header.className = "rv-head";
    header.textContent = `${name}, ${age} ans`;
    const stars = document.createElement("div");
    stars.className = "rv-stars";
    stars.textContent = starsStr;
    const body = document.createElement("div");
    body.className = "rv-body";
    body.textContent = `"${tpl.tpl}"`;
    card.appendChild(header);
    card.appendChild(stars);
    card.appendChild(body);
    feedEl.appendChild(card);

    // Slide-in via class toggle sur next frame
    requestAnimationFrame(() => card.classList.add("rv-in"));

    // Cap a 3 cartes : fade out la plus ancienne
    while (feedEl.children.length > 3) {
      const old = feedEl.firstChild;
      old.classList.add("rv-out");
      setTimeout(() => old.remove(), 400);
      break;
    }

    // Auto fade-out apres 6s
    setTimeout(() => {
      if (!card.isConnected) return;
      card.classList.add("rv-out");
      setTimeout(() => card.remove(), 400);
    }, 6000);
  }

  function enqueueReview(eventType, { force = false } = {}) {
    const now = performance.now();
    if (!force) {
      if (now < lastReviewAt + 6000) return;          // throttle absolu 6s
      if (now < postFiveStarCooldownUntil) return;    // cooldown apres 5 etoiles
      if (eventBuffer.length < 3) return;             // pas assez d'events
    }
    const tpl = pickTemplate(eventType);
    renderReview(tpl);
    lastReviewAt = now;
    if (tpl.stars === 5) postFiveStarCooldownUntil = now + 4000;
  }

  function tick() {
    const now = performance.now();
    if (k.getTreeRoot().paused) {
      feedEl.style.opacity = "0.15";
    } else {
      feedEl.style.opacity = "";
    }
    if (now >= nextCheckAt) {
      // Choisir un event type representatif du buffer recent, sinon ambient
      const recent = eventBuffer.slice(-5);
      const pick = recent.length > 0 ? recent[Math.floor(Math.random() * recent.length)].type : "ambient";
      enqueueReview(pick);
      nextCheckAt = now + 8000 + Math.random() * 7000;
    }
  }

  function reset() {
    feedEl.innerHTML = "";
    eventBuffer.length = 0;
    lastReviewAt = 0;
    postFiveStarCooldownUntil = 0;
    nextCheckAt = performance.now() + 8000 + Math.random() * 7000;
  }

  const intervalId = setInterval(tick, 500);

  return {
    pushEvent,
    enqueueReview,
    reset,
    destroy: () => { clearInterval(intervalId); feedEl.innerHTML = ""; },
  };
}
```

### 4.2 Wiring dans `src/main.js`

Au début du fichier (imports) :
```js
import { createReviewSystem } from "./reviews.js";
```

Après création de `crowdHooks` (~ligne 1100-1200, avant createVisitorSystem) :
```js
const reviews = createReviewSystem({ k, gameState });
window.__reviews = reviews;
```

Dans `registerKill` (après ligne ~586 `updatePersistence()`) :
```js
window.__reviews?.pushEvent("transform");
```

Dans `triggerApocalypse` (fin de fonction, après la boucle visiteurs) :
```js
window.__reviews?.enqueueReview("apocalypse", { force: true });
```

Dans `registerCoin`, dans le bloc `if (gameState._coinStreak === 5)` (ligne ~672) :
```js
window.__reviews?.pushEvent("coin_chain");
window.__reviews?.enqueueReview("coin_chain", { force: true });
```

Sur wagon doré qui passe (trouver dans wagons.js l'endroit où wagon.isGolden est détecté en registerKill ligne 1411) :
```js
if (wagon.isGolden) window.__reviews?.pushEvent("goldwagon");
```

Sur `reviveFromSkeleton` (`src/wagons.js:1281`) :
```js
window.__reviews?.pushEvent("revive");
```

Sur placement de tuile (déjà un hook `onTilePlaced` dans visitor-quests, calqué) — ajouter dans `placeTile` de main.js :
```js
window.__reviews?.pushEvent("placement");
```

Sur mort d'un crowd member (rare, si le cas se produit dans crowd.js, sinon ignorer) :
```js
window.__reviews?.pushEvent("death");
```

### 4.3 `index.html` — styles

À ajouter dans le `<style>` principal :
```css
#review-feed {
  position: fixed;
  bottom: 84px;
  right: 12px;
  width: 280px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  z-index: 80;
  pointer-events: none;
  font-family: system-ui, -apple-system, sans-serif;
  transition: opacity 0.2s;
}
.rv-card {
  background: rgba(20, 26, 42, 0.92);
  border: 1px solid rgba(255, 210, 63, 0.35);
  border-left: 3px solid #ffd23f;
  border-radius: 5px;
  padding: 6px 8px;
  color: #e6e6e6;
  font-size: 12px;
  line-height: 1.35;
  opacity: 0;
  transform: translateX(24px);
  transition: opacity 0.3s ease, transform 0.3s ease;
  box-shadow: 0 2px 8px rgba(0,0,0,0.4);
}
.rv-card.rv-in { opacity: 1; transform: translateX(0); }
.rv-card.rv-out { opacity: 0; transform: translateX(24px); transition: opacity 0.4s ease, transform 0.4s ease; }
.rv-card.rv-5star { border-left-color: #ff80dc; box-shadow: 0 0 12px rgba(255,128,220,0.35); }
.rv-card.rv-bad   { border-left-color: #ff6060; }
.rv-head  { font-size: 10px; color: #9fb0d4; margin-bottom: 1px; }
.rv-stars { font-size: 11px; color: #ffd23f; margin-bottom: 2px; letter-spacing: 1px; }
.rv-body  { font-size: 12px; color: #f0f0f0; font-style: italic; }
@media (max-width: 600px) {
  #review-feed { bottom: 168px; width: 220px; right: 6px; }
  .rv-card { font-size: 11px; padding: 5px 6px; }
}
```

Le `<div id="review-feed">` est créé automatiquement par `reviews.js` si absent (fail-safe) — pas besoin de modifier le HTML body.

### 4.4 Reset de scène

Dans `main.js`, là où le reset (R) se produit (`gameState.score = 0`, autour de ligne ~200), ajouter :
```js
window.__reviews?.reset();
```

---

## 5. Critères de succès (testables en live)

- [ ] Ouvrir la console sur la page live : aucune erreur JavaScript.
- [ ] Poser 5 tuiles lava, lancer un wagon, voir au moins **un avis** apparaître dans les 20s suivantes.
- [ ] Déclencher APOCALYPSE (5 transforms rapides) → un avis 5★ avec bordure rose et animation forte apparaît **immédiatement** (moins de 500ms).
- [ ] Après cet avis 5★, aucun autre avis pendant ~4s (cooldown respecté).
- [ ] Laisser le jeu tourner 2 minutes sans rien faire : voir 4-8 avis (throttle + ambient).
- [ ] 4e avis généré → le 1er fade-out automatiquement, stack jamais > 3 cartes dans le DOM (`document.querySelectorAll('.rv-card').length <= 3`).
- [ ] Appuyer P (pause) → opacity du feed passe à 0.15, non disruptif.
- [ ] Appuyer R (reset) → feed vidé, prochain avis ≥ 8s plus tard.
- [ ] FPS reste ≥ 55 avec le feed actif (pas de reflow excessif).
- [ ] `window.__getStats()` toujours fonctionnel, `document.getElementById('review-feed').children.length <= 3` à tout moment.
- [ ] Bundle prod gzippé reste < 100 KB (vérifier `npm run build` et taille dist).
- [ ] Sur viewport 390×840 (iPhone 12), feed visible, ne masque pas les boutons mobiles (offset 168px).
- [ ] Pas d'emoji dans les textes (contrainte user projet).
- [ ] Tous les textes en français, aucun mot anglais dans les 40 templates.

---

## 6. Effort estimé — 5 commits atomiques

Ordre recommandé :

1. **`feat(reviews): add review feed system with 40 French templates`**
   Créer `src/reviews.js` complet. Ajouter CSS + `#review-feed` dans `index.html`. Instancier dans `main.js`, exposer `window.__reviews`. À ce stade, feed affiche des avis "ambient" toutes les 8-15s sans hook de jeu.

2. **`feat(reviews): wire transform/revive/coin-chain events`**
   Hooks dans `registerKill`, `registerCoin` (streak 5), `reviveFromSkeleton`. Le buffer commence à se remplir avec de vrais events.

3. **`feat(reviews): force 5-star review on APOCALYPSE + goldwagon flag`**
   Hook `triggerApocalypse` avec `force: true` et event `apocalypse`. Flag `goldwagon` dans wagons.js quand `wagon.isGolden` est tué.

4. **`feat(reviews): placement + death events + scene reset`**
   Hook `placeTile` (event "placement"), hook crowd death si applicable. Ajouter `reviews.reset()` au scene reset (R).

5. **`style(reviews): mobile responsive + pause dimming polish`**
   Media query < 600px, opacity pendant pause, micro-polish shadow/border sur 5★ card, vérif contraste texte.

---

## 7. Risques & mitigations

| Risque | Mitigation |
|---|---|
| `innerHTML = ""` à chaque avis cause reflow | Utiliser `createElement` + `appendChild`, jamais `innerHTML =` pour injection (sauf au `reset()` complet). |
| Avis pendant mode démo AFK = spam | Démo tourne scene normale, throttle 6s suffit. Ajouter `if (settings.demoMode) return;` dans `tick()` si trop verbeux en test. |
| Conflit avec toolbar mobile (bottom 68px) | Media query `< 600px` pousse `#review-feed` à `bottom: 168px` pour passer au-dessus de wagon button + jump button. |
| Texte coupé si > 90 chars | Tous les templates ont été contrôlés < 90 chars à la rédaction. Ne pas rajouter de slots `{subject}` dynamiques qui explosent la longueur. |
| GC scene reset (R) oublie d'annuler interval | `reviews.reset()` ne clear pas l'interval, utiliser `destroy()` uniquement si scene totalement démontée. L'interval 500ms est idempotent, reset garde le même handle. |
| Accents dans templates peuvent casser si encoding douteux | Utiliser UTF-8 sans BOM (déjà standard Vite), mais préférer les versions sans accents dans les templates pour safety (déjà fait). |
| Étoiles unicode `★☆` peuvent mal rendre sur vieux Android | Fallback CSS `font-family: system-ui` est OK sur Android 5+. Acceptable. |
| Overlap avec `#tier-objectives` (bottom: 64px center) | `#review-feed` est right:12px, pas de conflit horizontal. |
| Double instanciation au scene reset (R re-trigger) | `reviews.js` check `document.getElementById("review-feed")` avant de re-créer le DOM. L'instance JS est remplacée mais le DOM est réutilisé. |
| Performance : 500ms setInterval vs KAPLAY frame | Volontaire — DOM décorrélé de KAPLAY, pas de surcoût frame. |
| Piège KAPLAY `k.fixed()` feedback loop | **N'utilise PAS** `k.fixed()` ni d'overlay KAPLAY : le feed est full DOM. Respect de la règle CLAUDE.md. |
| Bundle gzippé dépasse 100 KB | 40 templates × ~55 chars + 25 prénoms + CSS ≈ 3 KB brut, ~1.5 KB gzippé. Marge confortable. |

---

## 8. Validation finale

Avant commit/push du dernier commit, tester les 5 scénarios manuels :

1. **Scénario squelette chain** : poser ligne de lava, spawn 3 wagons → voir avis 4★ "transform" dans les 15s.
2. **Scénario APOCALYPSE** : combo x5 forcé → avis 5★ rose immédiat, cooldown 4s observable.
3. **Scénario Pluie d'Or** : 5 pièces ramassées en 2s → avis 5★ "coin_chain" forcé.
4. **Scénario mobile** : devtools iPhone 12 → feed visible au-dessus des boutons tactiles.
5. **Scénario AFK** : ne rien faire 90s → voir 2-3 avis "ambient" 3★ apparaître régulièrement.

Si ces 5 scénarios passent + critères §5 OK, la feature est prête pour CI/deploy.
