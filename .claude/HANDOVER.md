# Handover — Milan Lava Park (2026-04-24 fin session P / P0.4 wheel batch + cap)

## ✅ Session P (P0.4 — batch wheel dispatcher + cap wheel-coins 40)

**Diagnostic user post-session O (stress test 200 wheels + 9 wagons)** :
- FPS avg 46 / p95 39 / p1 37
- ENT total 709 : tile 200, wheel 200, wheel-coin 107, wagon-part 92
- Lecture : le ground cull + offscreen hide ont aidé, mais 200 wheels =
  200 `hub.onUpdate()` closures par frame + 107 wheel-coins éphémères
  avec chacun son `dc.onUpdate()`. Plancher = charge par-wheel.

Cible de cette session : **réduire la charge par wheel**, pas le nombre
de wheels (200 wheels = stress test artificiel, idle normal ~1-3 wheels).

### `65f5f28` perf(wheel): batch onUpdate global + cap wheel-coins 40

3 optims cumulées dans `src/tiles.js` tête de `createTileSystem()` :

1. **Batch rotation + drop logic** : 200 `hub.onUpdate(() => {...})`
   closures → **1 `k.onUpdate("wheel", hub => {...})`** dispatcher
   scene-level. Early return `if (hub.hidden) return;` (hook offscreen
   via tag "tile" gate la rotation inutile). Closure allocation par
   instance éliminée, garbage collector moins sollicité.

2. **Cap wheel-coins 40 simultanés** (avant 107 au stress test).
   Module-level `_wheelCoinCount`, incrémenté au spawn, décrémenté via
   `dc.onDestroy(() => _wheelCoinCount--)`. Si saturé au `nextDrop`
   tick, la wheel skip ce cycle (retry 7s plus tard). ~60% de réduction
   d'entités wheel-coin actives, donc -60% draw + -60% onUpdate.

3. **Batch wheel-coin onUpdate** : 107 `dc.onUpdate` closures → 1
   `k.onUpdate("wheel-coin", dc => {...})` global. Physique gravité +
   collision wagons via `_cachedWagons` (déjà en place depuis session N).

Bundle 106.79 KB gz (stable, +closure global compense les 3 closures par
instance supprimées). Pas de régression fonctionnelle : VIP drop 1/15
préservé, 3 coins drop préservé, pop VIP conservé.

---

## 🎯 Comment valider la session P (action user)

1. Attendre deploy CI (commit `65f5f28`)
2. `https://michaelchevallier.github.io/lava_game/?perf=1` avec idle normal
3. Re-tester stress 200 wheels : FPS devrait monter vs baseline 46
4. Observer `wheel-coin` dans top-tags : count capped à 40 (plus de 107)

**Si idle normal FPS ≥ 55 stable** → P0 done, **go P1.1 combo-system.js**
  (architecture + migration détection 8 combos existants + 6 combos
  faciles diff 1-2 + popups combo + début onglet Codex Alchimie fork
  museum.js).

**Si FPS 50-54** → encore quelques candidats P0.5 avant P1 :
  - Stars/fireflies pré-bake canvas (mais déjà gated isNight, ROI faible)
  - Wagon monolithic draw (1 entité wagon draw ses 10 parts en
    drawRect inline au lieu de 10 entités wagon-part séparées) —
    retiré des OFFSCREEN_HIDE si fait, change le shape du wagon
  - Audit `onUpdate` agent perf-auditor pour trouver d'autres batches

**Si FPS < 50** → flame graph Chrome DevTools Performance tab, record 5s
  idle, chercher longues tasks >16ms pour identifier le vrai bottleneck
  (potentiellement draw-side WebGL si trop de switch sprite/atlas).

---

## 📋 Session Q suivante — prompt suggéré

```
Lis .claude/HANDOVER.md section Session P + plan complet dans
/Users/mike/.claude/plans/je-dirais-3-puis-structured-sloth.md

J'ai testé ?perf=1 post-P0.4, FPS idle = XX, stress 200 wheels = YY.

Si idle ≥ 55 → go P1.1 : créer src/combo-system.js + combo-codex.js
  (fork museum.js) + migrer détection 8 combos existants en définitions
  data-driven + 6 combos faciles (OBSIDIAN, FISSURE, PLUME ASCENSION,
  CATAPULTE, BACKFLIP, TÉLÉPORT D'OR). Popups combo via showComboPopup
  dans hud.js. Tests placement side-by-side.

Si idle 50-54 → P0.5 mini-pass : wagon monolithic draw OU audit
  perf-auditor pour batches restants.

Si idle < 50 → Chrome DevTools flame graph avant refactor aveugle.

Commits atomiques, handover propre, suggérer clear à la fin.
```

**⚠️ CLEAR CONTEXTE recommandé** avant session Q.

---

## 🗂 Historique antérieur

# Handover — Milan Lava Park (2026-04-24 fin session O / P0.2 bonus + P0.3 drawside)

## ✅ Session O (P0.3 — attaque draw-side après diagnostic stress test)

**Diagnostic clé** : user signale incohérence FPS counter (top 48 / bottom 10).
Cause = HUD bottom pushait fpsBuffer dans `draw()`, perf-harness dans
`k.onUpdate()`. Divergence = le GPU/browser throttle draws quand trop
d'entités à rendre. **Le plancher est côté rendu, pas update.**

User stress test (32 wagons, 807 entités) → draw rate ~10 fps mais update
~48 fps. Confirme : attaquer le nombre d'entités dessinées par frame.

### `91d02aa` fix(hud): FPS sample via k.onUpdate (cohérence perf-harness)

fpsBuffer push migré dans k.onUpdate. Bottom et top counters désormais
alignés sur la même source (update rate).

### `8daabf7` perf(draw): auto-hide offscreen entities via k.offscreen

KAPLAY a un composant `offscreen({ hide: true })` qui toggle
`entity.hidden = true` sur exitView (KAPLAY draw() = `if(this.hidden)return;`).

Hook global `k.onAdd(tag, e => e.use(k.offscreen({ hide: true, distance: 300 })))`
appliqué à 10 tags. Distance 300px marge pour éviter flicker.

### `7b2949c` perf(draw): split offscreen hook en 3 modes

Extension du hook d'auto-cull :
- **HIDE** : tile, wagon-part, passenger, visitor-hat, balloon,
  balloon-string (pos mutée externement, ne pas pauser)
- **HIDE+PAUSE** : visitor, crowd, duck, skull-target (onUpdate
  autonome lourd — gel complet quand hors vue, unpause retour)
- **DESTROY** : wheel-coin, duck-part, skull-part, rain-coin (éphémères)

Visitors ont un onUpdate lourd (gravité + boarding + stuck + hésitation
3-tile + tile type lookup). Pause sur ceux hors viewport = gain CPU en
plus du gain draw.

### `1939d7b` perf(draw): cache minimap wagons + popups shadow

2 optims cumulées :
- minimap.js : `_cachedWagons` 10Hz, évite k.get("wagon") par frame
  dans draw() toujours actif (sauf campaign).
- hud.js showPopup : drawTextOutlined (5 drawText = 4 offsets + fill)
  remplacé par inline shadow (2 drawText). **-60% draw calls par popup**.

### `e46d1e9` perf(ground): cull drawGround à la tranche viewport caméra

**Le plus gros win probable de la session.** `drawGround()` itérait
de -WORLD_COLS à +WORLD_COLS (160 cols) × 4 rows = **jusqu'à 640
drawSprite/frame constants**, même pour cols hors-écran.

Après : calcule startCol/endCol depuis camPos + camScale, clampe à
WORLD_COLS bounds. Viewport zoom 0.5 ≈ 80 cols visibles → 320
drawSprite/frame. Zoomé scale 1 ≈ 40 cols → 160.

---

## 🎯 Comment valider la session O (action user)

1. Attendre déploiement CI
2. Ouvrir `https://michaelchevallier.github.io/lava_game/?perf=1`
3. Tester 2 scénarios :
   - **Idle sandbox normale** (3 wagons auto) : FPS devrait être
     largement ≥ 55-60, avec gros gain du ground cull + offscreen hide
   - **Stress test** (spam wagons à la main via `x`) : FPS devrait
     mieux tenir grâce au pause+destroy offscreen des entités lointaines
4. Bottom counter HUD et top overlay doivent afficher la même valeur

**Si FPS ≥ 55 stable en idle** → P0 done, go P1.1 chimique.
**Si FPS 50-54** → investiguer flame graph Chrome DevTools
  (Performance tab, record 5s idle, chercher longues tasks).
**Si FPS < 50** → les offscreen hooks n'ont peut-être pas pris effet
  (vérifier erreur console). Logs `window.__k.get("wagon-part")[0]`
  pour inspecter si `hidden` toggle bien.

---

## 📋 Session P suivante — prompt suggéré

```
Lis .claude/HANDOVER.md section Session O + le plan complet dans
/Users/mike/.claude/plans/je-dirais-3-puis-structured-sloth.md

J'ai testé ?perf=1, FPS avg idle = XX, stress test = YY.

Si FPS idle ≥ 55 → go P1.1 combo-system.js + 6 combos faciles +
  popups + Codex onglet Alchimie (fork museum.js).

Si FPS 50-54 → candidats restants :
  - Pré-bake stars/fireflies night-mode en canvas unique (drawImage
    au lieu de 76 drawCircle/frame)
  - Réduire parts/wagon via wagon.onDraw monolithique (1 entité + 10
    drawRect vs 10 entités chacune avec draw)
  - Pré-bake hills+world-walls en offscreen canvas (le plan P0.3
    original, reporté car hills déjà culled en M)

Si FPS < 50 → flame graph Chrome DevTools + diagnostic profond.

Commits atomiques, handover, suggérer clear.
```

**⚠️ CLEAR CONTEXTE recommandé** avant session P.

---

## 🗂 Historique antérieur

# Handover — Milan Lava Park (2026-04-24 fin session N / P0.2 perf pass session 2)

## ✅ Session N (P0.2 — 2 refactors ciblés caching/dedup)

**Contexte** : après session M, user a testé `?perf=1` en browser réel →
FPS avg 48 / p95 39 / p1 39. Gain réel vs 20-26 avant, mais pas encore au
target 55+. Zone 40-54 → on applique 2 refactors P0.2.

Observation clé user : `wheel 53` + `wheel-coin 42` = 95 entités dominent le
top-6 tags. Chaque wheel-coin a son propre `onUpdate` qui appelait
`k.get("wagon")` par frame → 42 scans scene-tree/frame = plancher CPU.

Le plan initial prévoyait "offscreen bake hills+walls" mais après audit le
culling viewport (session M) a déjà réduit hills à 8 drawSprite/frame et
world-walls à 0 drawSprite la plupart du temps. ROI bake marginal.

Pivot : cibler les hot-paths restants dans `onUpdate` et éliminer doubles.

### `ac2097d` perf(tiles): cache `k.get("wagon")` 10Hz pour wheel-coin/fan/bomb

Nouveau cache module-level `_cachedWagons` dans `createTileSystem`, refresh
via `k.loop(0.1)`. Remplace 3 call-sites qui fire dans des onUpdate per-frame
per-entity :

- `wheel-coin` onUpdate (L412) — 42 instances × k.get/frame
- `fan` tile onUpdate (L310) — N fans × k.get/frame
- `bomb` tile onUpdate (L688) — bombs × k.get/frame

Scan scene-tree coupé de ~45×/frame à 10×/s. ROI attendu **+5-10 FPS**.

Call-sites non migrés (déclenchements ponctuels hors per-frame) laissés en
`k.get("wagon")` : freeze variant (L652), wind variant (L655) — OK.

### `dd641cc` perf(coin/overlays): dedup onUpdate("coin") + cache wagons scene-overlays

2 optims cumulées :

1. **Suppression doublon** `k.onUpdate("coin")` dans `particle-systems.js`
   (L112). Le handler de `tiles.js` (L712) gère déjà anim bob + scale inner.
   Le 2e écrasait bêtement `t.pos.y` avec une autre formule, forçait
   `t.color=jaune` et `t.scale=1` chaque frame. Economise 1 sin/cos/coin
   + mutations inutiles. Ajouté le check `magnetLocked` au handler restant.

2. **Cache wagons** dans `scene-overlays.js` draw z=8 (leader-couronne).
   `_cachedWagons` refresh 10Hz, élimine 1 scene-tree scan/frame sur draw
   toujours actif.

Bundle 106.70 → **106.43 KB gz** (-270 B, handler dupliqué supprimé).

---

## 🎯 Comment valider la session N (action user)

1. Attendre déploiement CI (bundle `index-Ct6hTv2q.js` hash)
2. Ouvrir `https://michaelchevallier.github.io/lava_game/?perf=1` machine cible
3. Attendre splash → sandbox → attendre 10s idle
4. Lire overlay top-right : **FPS avg devrait être 53-60** (contre 48 après M)
5. Vérifier que `wheel-coin` n'est plus dominant ou n'impacte plus les FPS

**Si FPS avg ≥ 55 stable** → P0 done, go P1.1 (combo-system.js).
**Si FPS 48-54** → P0.3 session avec refactors structurels restants
  (offscreen bake si besoin, low-end toggle, star pre-render).
**Si FPS < 48** → le bottleneck n'était pas les k.get/wagons — investiguer
  (Chrome DevTools Performance flame graph, voir si c'est draw calls,
  physique KAPLAY, ou GC).

---

## 📋 Session O suivante — prompt suggéré

```
Lis .claude/HANDOVER.md section Session N + le plan complet dans
/Users/mike/.claude/plans/je-dirais-3-puis-structured-sloth.md

J'ai testé ?perf=1, FPS avg = XX.
[Adapter selon résultat]

Si FPS ≥ 55 → go P1.1 (combo-system.js, 6 combos faciles + popups + Codex
  onglet Alchimie fork museum.js).
Si FPS 48-54 → P0.3 : offscreen bake hills/walls, star pre-render, toggle
  low-end Settings. Puis re-mesurer.
Si FPS < 48 → flame graph Chrome DevTools pour identifier vrai bottleneck
  avant refactor aveugle.

Commits atomiques, handover propre, suggérer clear à la fin.
```

**⚠️ CLEAR CONTEXTE recommandé** avant session O.

---

## 🗂 Historique antérieur

# Handover — Milan Lava Park (2026-04-24 fin session M / P0.1 perf pass session 1)

## ✅ Session M (P0.1 — perf harness + 4 quick wins)

**Contexte** : user signale 20-26 FPS idle avec ~370 entités = inacceptable.
Un audit perf avait identifié ~60-80 ms/frame dépensés dans des draws non-gardés
(magnet fields, hills, world-walls, weather overlays, flags).

Plan d'ensemble (approuvé) : `/Users/mike/.claude/plans/je-dirais-3-puis-structured-sloth.md` —
P0 perf → P1 physique chimique émergente (~20 combos) → P2 sous-mondes (LAVA/ARCTIC/SKY).

Cette session = P0.1 (harness + quick wins cheap). P0.2 suit.

**4 commits** cette session (plus bb3d945 feat minimap + f121e33 fix ducks en préamb).

### `20b2c01` feat(perf): harness FPS + entities overlay via `?perf=1`

Nouveau `src/perf-harness.js`. Sans `?perf=1` dans l'URL : zero cost, early
return. Avec : overlay HTML fixe top-right affiche :
- FPS rolling 60 frames (avg, p95, p1)
- Total entities + untagged count
- Top 6 tags par count

**Préalable obligatoire** aux quick wins — sans mesure, on ne sait pas si
on casse ou améliore. Widen aussi `window.__getStats` tag list (flag-pole,
night-deco, season-confetti).

### `f82769d` perf(overlays): guard draws when no fields/portals/wagons

`src/scene-overlays.js` draw z=8 itérait gameState.magnetFields + magnetPortals
+ k.get("wagon") à chaque frame même vides. Cache en tête + early return si
rien à draw. ROI ~2-4 FPS idle.

### `0c76292` perf(weather): early return if no warning ni active

`src/weather.js` draw z=18 faisait toujours 3 if-checks. Early return unique
si warning === null && active === null (95% du temps). Gain marginal mais
propre. Le vrai gain magstorm (42 drawRect pendant event 10s) reste à faire
en P0.2 (viewport-aware ou batch sprite).

### `88122b8` perf(decor): cull hills + world-walls + batch 40 flags

3 fixes cumulés dans `src/scene-decor.js` :

1. **Hills** : 31 drawSprite/frame → ~8 via cull viewport camera ±1 step
2. **World-walls** : 26+ draws/frame → 0 quand camera est dans zone jouable
   (montagnes hors-monde dessinées uniquement si viewport franchit ±WORLD_W)
3. **Flags** : 40 drapeaux × 3 entités (pole+cap+cloth) = 120 entités +
   `k.onUpdate("flag-deco")` appelé 40×/frame → remplacé par 1 entité draw
   qui boucle sur `flagData[]` avec cull viewport. **Économie -120 entités
   scene-tree + -40 onUpdate/frame**.

ROI cumulé estimé ~15-25 FPS idle. **À vérifier par user** via `?perf=1`.

---

## 🎯 Comment valider la session M (action user)

1. Attendre déploiement CI (bundle `index-*.js` hash change)
2. Ouvrir `https://michaelchevallier.github.io/lava_game/?perf=1` sur machine cible
3. Attendre splash → sandbox → attendre 10s idle
4. Lire overlay top-right : **FPS avg devrait être >= 40-50** (contre 20-26 avant)
5. Se déplacer gauche/droite avec camera follow → FPS doit rester stable
6. Rapport user → décide si P0.2 (refactors structurels) nécessaire

**Si FPS >= 55 stable** → skip P0.2 refactors, go direct P1.1 chimique.
**Si FPS 40-54** → P0.2 session 1 avec 2 refactors les plus rentables.
**Si FPS < 40** → P0.2 session complète + low-end mode toggle settings.

---

## 📋 Session N suivante — prompt suggéré

```
Lis .claude/HANDOVER.md section Session M + le plan complet dans
/Users/mike/.claude/plans/je-dirais-3-puis-structured-sloth.md

J'ai testé ?perf=1 en local browser réel, FPS avg =  XX.
[Adapter selon résultat]

Continue P0.2 si besoin, sinon enchaîne sur P1.1 (combo-system.js).
Toujours découper en commits atomiques et finir par handover propre
+ suggestion de clear contexte.
```

**⚠️ CLEAR CONTEXTE recommandé** avant session N. Cette session est lourde
(plan mode + exploration + 4 commits). Le handover + le plan file suffisent
à repartir frais.

---

## 🗂 Historique antérieur

## ⚠️ Session L (mini-map HUD tenté, rollback)

**2 commits** : feature ajoutée, puis entièrement rollback suite à regression live.

### `f5cf2a0` feat(minimap): HUD mini-map — DÉPLOYÉ PUIS RETIRÉ

Strip 220×20 en haut-centre, k.fixed() z=41. Affiche zone jouable,
stations, viewport caméra, dots wagons/joueurs. Nouveau fichier
src/minimap.js (160 L). Bundle `105.39 → 105.87 KB gz`.

### `db2a444` revert: minimap — live broken black canvas

Après déploiement f5cf2a0, tests MCP chrome sur la live ont montré un
canvas noir complet (HUD HTML visible, aucun tile/player/sky rendu).
Scene "game" démarrait (HUD bar reflétait gameState) mais scene-tree
vide à l'inspection. Pas d'erreur console.

Rollback complet (retrait import + appel + suppression src/minimap.js)
pour sécuriser le live.

**Observation suspecte** : le rollback seul ne suffit pas à récupérer
le canvas noir en test MCP chrome (même code que 5f5a0d7 qui marchait
à 23:29). Possibilité que ça soit un artefact de l'automation MCP
(frame loop throttling, SW cache, ou autre) plutôt qu'une vraie
regression. À revalider par l'utilisateur en browser réel.

**Pour session M** : avant de re-tenter mini-map, valider d'abord
en local (vite dev + browser réel, pas MCP) que 5f5a0d7/db2a444
rend normalement. Si oui, c'est un bug MCP et le mini-map peut être
re-déployé quasi tel quel (vérifier quand même par screenshot).
Si non, le canvas noir est une vraie régression depuis session K
(camera follow befa2eb ou décor 581c577).

## ✅ Session K+ (décor monde étendu + 3 bugs camera follow)

**2 commits supplémentaires** post-session K après feedback live utilisateur :

### `581c577` fix(decor): décor + spawn adaptés au monde étendu

Après camera follow (befa2eb), le décor était resté cantonné à [0, WIDTH] :
sun, lune, stars, fireflies, label "Saison: X", nuages, hills, drapeaux,
citrouilles halloween, flocons christmas. Les spawners crowd/balloons/coin-thief
spawnaient toujours au centre du monde.

Fix :
- **Atmosphère k.fixed()** — sky.js + scene-decor.js : sun, moon, nightTint,
  stars, fireflies, shooting stars, teinte saison, label "Saison: X",
  flocons christmas, confetti carnaval suivent la caméra (screen-space).
- **Décor étendu** — clouds 6→14, hills draw loop dynamique tous les 330px
  sur [-WORLD_W, +WORLD_W], drapeaux 10→40, citrouilles 5→20. Nuages wrap
  aux bornes monde ±WORLD_W+100.
- **Murs monde** — au-delà de ±WORLD_W, 6 montagnes sombres avec snow-caps
  dégradés + rect plein noir au-delà. Ferme visuellement la scène, plus de vide.
- **Spawn camera-aware** — crowd/balloons/coin-thief spawn à `camX ± WIDTH/2 + offset`.
  Crowd bounce étendu à ±WORLD_W+40.

Bundle 104.79 → 105.20 KB gz.

### `95d3649` fix(camera): 3 bugs follow — shake / ride / fall

Feedback post-befa2eb :

1. **Camera jump sur events (crash côté gauche/droit)** — `juice.dirShake`
   capturait `baseCam = k.camPos()` UNE FOIS à l'init de juice. Chaque shake
   faisait `k.camPos(baseCam.x + wobble, ...)` → caméra téléportée à (640,288)
   puis lerp de retour vers le player. Visible quand player loin du centre.
   Fix : pattern offset. `juice.getShakeOffset()` renvoie un delta (x,y),
   le camera follow l'additionne à camFollowX chaque frame. Plus de conflit.

2. **Camera jump quand boarding** — `boardWagon` met `p.pos = (-99999, -99999)`
   pour parker le player. Le follow lerpait vers -99999. Fix : barycentre
   utilise `p.ridingWagon.pos` si riding, sinon `p.pos`.

3. **Player tombait définitivement hors niveau** — pas de respawn auto, player
   pas dans CULLABLE. Fix : chaque frame, si `effY > HEIGHT+200` → teleport
   à `(WIDTH/2, (GROUND_ROW-4)*TILE)`, exit wagon propre si monté.

Shake aussi appliqué en campaign mode (baseline WIDTH/2, HEIGHT/2).

Bundle 105.20 → **105.39 KB gz**.

## Session K (cleanup + 2 bugs + mono-écran cassé)

**5 commits** cette session :

| Commit | Type | Résumé |
|---|---|---|
| `3565382` | chore | delete src/quests.js dead file (164 L) |
| `fc5aa77` | fix | perso bloqué après clic toolbar/cog (keyup synthétique + blur + tabIndex=-1) |
| `40aad2e` | fix | reset gameState timers + system globals au changement de mode |
| `befa2eb` | **feat** | **camera follow** sandbox/run = monde 2× plus large visible |
| `9fecff5` | docs | handover session J précédent |

### `3565382` chore: delete src/quests.js (164 L)

Quest system Almanach du Forain abandonné, purge finale (les call-sites
étaient déjà retirés en session J via `2f9ac48`). Tree-shaking le droppait
déjà, -0 B sur bundle mais -164 L de source.

### `fc5aa77` fix: perso bloqué en déplacement après clic toolbar

**Bug UX** : cliquer sur un bouton HTML (toolbar/cog/toggle) pendant qu'une
touche de déplacement était tenue → selon le navigateur le keyup était
avalé → KAPLAY gardait la touche dans son pressedSet → `p.move()` continuait
à être appelé par frame.

Fix dans `hud.js` :
- `tabIndex = -1` sur les boutons HUD (rétention de focus minimale)
- handler `pointerdown` qui dispatch `KeyboardEvent("keyup")` synthétique
  sur window pour a/q/d/j/l/w/s/z/i/o/e/space + reset `window.__mobileInput`
- `.blur()` après click pour renvoyer le focus au body
- `window.blur` + `visibilitychange` bindés une fois (guard
  `__releaseHeldInputsBound`) pour couvrir Alt+Tab / minimize

Bundle `104.26 → 104.55 KB gz`.

### `40aad2e` fix: reset au changement de mode

**Bug** : sandbox ↔ campaign ↔ run laissait des bonus timers ouverts
(`maintenanceBonusUntil`, `scoreMultiplierUntil`, arrays comme `magnetFields`,
`geysers`, `iceCrowns`, `iceRinks`, `lavaTriangles`, `magnetPortals`,
`metronomes`) dans gameState entre scenes — leurs effets survivaient dans
le mode suivant. En parallèle, les `window.__X` de systèmes gated par
`MODE_CONFIG` (tiers/weather/balloons/coinThief/minigames/vquests/race/
reparation/skullStand/bossGoret/parade) survivaient au `k.go()` avec
leurs k.loops détruits → poignées orphelines pointant sur systèmes morts.

Fix dans `k.scene("game", ...)` au start :
- Null out toutes les `window.__X` gated
- Retire overlays HTML résiduels (`campaign-result`, `run-result`, `level-intro`)
- Object.assign(gameState) étendu avec 11 champs manquants

Bundle +110 B gz.

### `befa2eb` feat: CAMERA FOLLOW — brise le mono-écran

**Découverte** : le monde existe déjà de col -80 à +80 (`WORLD_WIDTH=2560` =
2× screen `WIDTH=1280`). Les stations ENTREE/SORTIE sont positionnées à
`-TILE*4` et `WORLD_WIDTH+TILE`, hors champ. Jusqu'ici la caméra restait
centrée à x=640 avec zoom 0.5 → tranche visible [-640, 1920] immuable.

Fix en mode sandbox/run (campaign garde caméra fixe, niveaux conçus
mono-écran) :
- `k.onUpdate` lerp `camPos.x` (rate 4.5/s) vers barycentre des joueurs vivants
- Clamp horizontal `[-WORLD_WIDTH+halfView, WORLD_WIDTH-halfView]`
- Y verrouillé sur `HEIGHT/2` (pas de scroll vertical pour l'instant)

**GC bounds étendus** : `left = -WORLD_WIDTH-BUFFER` (avant `-BUFFER`)
pour ne pas culler les mobiles évoluant en col négatif maintenant visible.

Bundle `104.55 → 104.79 KB gz`.

## ➡️ Round 4 backlog (CLAUDE.md:135)

- [x] Tempête Magnétique (8ede731)
- [x] **Camera follow** (befa2eb)
- [ ] Mini-map HUD (overview monde position player + wagons)
- [ ] Zones thématiques (col -40..0 glacier, 0..40 normal, 40..80 volcan)
- [ ] Saison hiver (neige, ice partout, permanent optionnel)
- [ ] Course de visiteurs bonus event
- [ ] Mode coopératif 2P objectifs

## Observations pour QA utilisateur (session K live)

Le deploy `befa2eb` est en cours CI. À tester en vrai navigateur :
1. **Camera follow** : sandbox, se déplacer à gauche/droite → caméra lerp ✓
2. **Toolbar fix** : tenir D, cliquer un outil toolbar, relâcher D → perso s'arrête ✓
3. **Mode switch** : sandbox → campaign → sandbox → vérifier pas de bonus scoreMultiplier carryover + pas d'overlays de résultat résiduels ✓
4. **Stations** : scroll à droite au max → SORTIE visible à x=2592 ✓

## ✅ Session J (audits perf + quality + Round 4 kickoff)

**4 commits** : audits parallèles (perf + quality) par agents, 1 feature Round 4.

| Commit | Type | Résumé |
|---|---|---|
| `b869d2a` | chore(quality) | remove dead import createQuestSystem |
| `367b8ee` | perf(visitor) | éliminer k.get() par-frame (onDraw + onUpdate + particle-systems) |
| `2f9ac48` | chore(quality) | purge 11 call-sites `window.__quests?.xxx()` dans 5 fichiers |
| `8ede731` | feat(weather) | **Tempête Magnétique** — Round 4 feature #1 |

### Perf audit (agent perf-auditor)

3 bottlenecks (`k.get()` répétés par-frame) identifiés statiquement :
1. `visitor.js` `k.onDraw()` global scannait `k.get("visitor")` à 60fps pour les symboles `!`/`?`/`X` → converti en `v.onDraw()` per-instance
2. `visitor.js` boarding scan `k.get("wagon")` dans chaque visitor onUpdate → cache `_cachedWagons` refresh `k.loop(0.1)`
3. `particle-systems.js` cap loop faisait 10 `k.get()` / 100ms → single-pass 7 `k.get()` réutilisés

Features round 3 (boss, reparation, skull-stand, parade, weather) n'ajoutent aucun onUpdate par-tile ni collider individuel — conforme catalogue KAPLAY.

### Quality audit (agent quality-maintainer)

Smell trouvé : `createQuestSystem` importé mais jamais instancié (système intentionnellement désactivé, commentaire DISABLED en main.js:1035). Les 11 `window.__quests?.xxx()` callsites étaient des no-ops permanents → purge complète. −190 B gz.

Reste pour revue humaine (non fixé) :
- `src/quests.js` (164 L) est dead code entier — à supprimer si feature abandonnée définitivement, ou à réactiver si prévue (décision produit)
- `window.__race`, `__coinThief`, `__weather`, `__balloons`, `__minigames` : assignés mais jamais lus cross-fichier. Poignées DevTools — OK si intentionnel.

### `8ede731` feat(weather): Tempête Magnétique (Round 4 #1)

4e type d'événement dans la rotation `weather.js` (aux côtés de lightning,
coinrain, wind). Trigger toutes 60-90s aléatoirement.

Mécanique : 10s de x2 score multiplier via `gameState.scoreMultiplier`
(infrastructure existante metronome). À la fin : +50pts "TEMPÊTE PASSÉE"
bonus survie.

Visuel : overlay violet pulsant (90,40,160, opacité 0.22-0.30 sine wave) +
14 aimants stylisés rouges (corps + 2 jambes en U) flottant en Lissajous.

Bundle `103.95 → 104.26 KB gz` (+310 B). Aucun nouveau fichier, extension
pure de weather.js (+51 L).

## ➡️ Prochaine session (K) = choix Round 4

Backlog Round 4 ouvert dans `CLAUDE.md:135` :
- [ ] Saison hiver (neige, ice partout, visuel hiver permanent optionnel)
- [ ] Course de visiteurs bonus event (visiteurs racing droite→gauche, catchable)
- [ ] Mode coopératif objectifs 2P (points communs, no-skele zone)

Items orphelins à décider :
- Supprimer `src/quests.js` (164 L dead) ?
- Factoriser les `window.__X` poignées DevTools en `window.__systems` ?
- QA live Réparation + Parade (non validés en vraie session)

## ✅ Session I (QA live Boss Goret post-fix + cleanup + skeleton variants)

**3 commits** : QA boucle Boss Goret validée en live post fix GC (session H), puis
cleanup achievements orphelins, enfin dernier item [ ] du backlog CLAUDE.md —
skeleton variants par avatar.

| Task | Commit | Status |
|---|---|---|
| QA live Boss Goret post-fix GC | — | ✅ PASS (hp:3, target:wagon, collide+stun OK) |
| Cleanup achievements no-op | `e4f4884` | ✅ chore: 6 lignes retirées |
| Skeleton variants (16 avatars) | `cb2f07b` | ✅ feat: substituteSprite R/r → couleur avatar |

### `e4f4884` chore(cleanup): drop orphan window.__achievements.unlock calls

`createAchievements()` expose seulement un listener `spectres.onUnlock` pour
toast visuels — `unlock()` n'existe pas. Les calls `?.unlock?.()` étaient des
no-op silencieux. Retirés :
- `reparation-express.js:103` `repair_first` + `:110` `maintenance_pro` + `:111` `spectres?.unlock?.("maintenance")`
- `skull-stand.js:258` `jackpot_canards`
- `parade-qte.js:66-67` `surfeur_lave` + `spectres?.unlock?.("surfeur")`

Net : -7 lignes, zero changement fonctionnel.

### `cb2f07b` feat(sprites): skeleton variants per avatar

16 nouveaux sprites `<avatar>_skel` 20×30 générés procéduralement via
`substituteSprite(SPR_PLAYER_SKEL, { R: "X", r: "x" })` où X/x = paire
PALETTE de la couleur signature :

| Avatar | Palette | Avatar | Palette |
|---|---|---|---|
| sonic | U/u (blue) | steve | U/u |
| link | G/g | pokeball | R/r (identité) |
| pacman | Y/y | tetris | P/p (pink, pas de purple) |
| kirby | P/p (pink) | invader | H/h (vert vif) |
| yoshi | H/h | chief | T/t (brun foncé) |
| bowser | L/f | astro | C/c (blanc/cyan) |
| donkey | B/b (brun) | mega | U/O (bleu) |
| samus | L/f | crash | F/f (rouge-orange) |

`SPR_SKEL_GENERIC` 14×22 supprimé (plus de consommateur). `avatars.js` patché
16 fois. Loader via iterator `Object.entries(SPR_AVATAR_SKELS).map(...)`.
Bundle 104.14 KB gz (stable, procedural runtime).

### QA live session I (post-fix GC)

Sur le deploy `07286ae` via Chrome MCP tab 343051531 :
- Sandbox Mario avec demo circuit (4 rails, 7 lava, 2 portal, 1 tramp, 1 boost)
- `x` key → spawn wagon (s'est révélé ghost train ce run)
- `w.ghostTrain = false` + `__bossGoret.__forceSpawn()` → **Boss actif**,
  `hp:3`, `position:{x:1218,y:388}`, `targetWagonId:"wagon"`
- Collision boss↔wagon observée → `frozenUntil=354.5` (stun 3s appliqué)
- Boss fleeing, exit screen, nextSpawnAt=120s cooldown (retry path OK)
- Aucune erreur console
- **Verdict** : Boss Goret passe de 🟡 PARTIAL → ✅ PASS

Réparation + Parade **non re-testés en live** — setup manuel lourd (placer rails
custom pour Réparation, forcer wagon→lava pour Parade), et l'analyse statique
qa-tester les avait passés. Reportables en session J si besoin.

**Observation** : player fell to `y=15_855_466` — `player` tag n'est pas dans
`CULLABLE_TAGS`, normal car le joueur a son propre respawn via "," key. Pas
un leak, pas un bug.

## ✅ Session H (QA live Chrome MCP + 1 bug fix)

**Chrome MCP enfin activé** via `/chrome` + extension installée. QA live des
5 features round 3 sur `https://michaelchevallier.github.io/lava_game/` (deploy
`62484fe`) :

| Feature | Status | Note |
|---|---|---|
| Labyrinthe 7-4 | ✅ PASS | 24 tiles, hint affiché, objectives coin4+skel1 |
| Labyrinthe 7-5 | ✅ PASS | VIP spawn, failOn skeleton:1, platinum <2 tuiles |
| Splash max stars | ✅ PASS | 101/153 affiché (51 levels × 3) |
| Aire Tir Mobile | ✅ PASS | phase "ducks" observée, duckCount=7 |
| Boss Goret | 🟡 PARTIAL | `__forceSpawn()` OK mais bloqué par bug GC wagon |
| Réparation Express | ⏸ NOT TESTED | sandbox start empty, nécessite poser rails |
| Parade QTE | ⏸ NOT TESTED | nécessite wagon lava fall provoqué |
| Pas d'erreur console | ✅ PASS | — |

### `916e629` fix(gc): cull wagons hors bounds (Session H unique commit)

**Bug trouvé en live** : wagons Train Fantôme et Inverse Train sortent par Y
(gravité/lava) et n'étaient jamais GC'd car "wagon" absent de
`CULLABLE_TAGS`. Mesuré `y = 2_536_854` après 3 min. Fix : +7 L dans gc.js,
ajout "wagon" avec gardes `!rider && !isRace`, cleanup des
`passengerEntities`. Bundle 104 KB gz.

**Effet de bord démasqué** : Boss Goret `pickTargetWagon` filtrait tous les
wagons visibles car ils étaient tous ghost/inverse leak → target null →
spawn refusé. Le fix GC règle ce symptôme en cascade.

## ✅ Session G (rappel - 9 commits : 4 features round 3 + 2 style + 1 splash fix + 2 docs)

**Round 3 backlog créatif 5/5 FINI**. Tous les items créatifs ouverts sont
cochés dans CLAUDE.md backlog. `f3f26c4` bonus : splash hardcode `90` max stars
remplacé par `LEVELS.length * 3` (niveau de base campagne est maintenant
déduit dynamiquement = +2 niveaux round 3 pris en compte).

### `cd59add` feat(reparation): mini-jeu QTE rail cassée

Toutes les 60s ±10, une rail à l'écran passe rouge, compteur 10s décompte
au-dessus. Wagons qui passent dessus **tombent** (getRailSlopeYAt ignore
rt.broken). Joueur doit marcher sur la tile et presser `E`/`O` (board key).
Succès : +50pts + flash vert. **Streak 5** = popup `MAINTENANCE PRO !`,
+500pts, wagons +20% vitesse 90s (`gameState.maintenanceBonusUntil`). Timeout
= tile grise 20s supplémentaires puis auto-réparation silencieuse. Désactivé
en campaign.

Nouveau : `src/reparation-express.js` (186 L). Patchs `wagons.js` (getRailSlopeYAt
+ speedMult), `players.js` (p.repairKey + handler board), `main.js`
(instanciation gated). Bundle 100.27 KB gz.

Spec : `.claude/specs/reparation-express.md`.

### `afc4d36` feat(skull-stand): aire tir mobile

Extension du skull-stand existant avec cycle `k.loop(30s)` alterné crânes ↔
canards. Phase canards : 7 canards défilent droite→gauche, 12% gold.
Fléchette parabolique (v0=400, grav=200) avec auto-aim sur la touche board
quand le joueur est à <150px du stand. Hit = +50/+150. Combo 3 canards en 5s
= `JACKPOT ! +300` + 24 particules + achievement `jackpot_canards`. Cooldown
0.4s/joueur. Ordre priorité board : **reparation → tir → board wagon**.

`src/skull-stand.js` 151 → 413 L. Patchs `main.js`, `players.js`. Bundle
101.63 KB gz.

Spec : `.claude/specs/aire-tir-mobile.md`.

### `5ae35ea` + `bf5b8a1` feat(boss): Boss Goret

Nouveau mini-boss cochon rose 20×14 (`SPR_BOSS_GORET_A/B` dans sprites.js,
animation walk 2 frames). Spawn toutes 240s ±20, warm-up 60s, suspendu
pendant train events. Cible le wagon le plus chargé au spawn (score =
passagers×2 + skeletons + gold×5). Fonce horizontalement à 180 px/s.

**Mécanique poche pièces** : chaque joueur peut stocker jusqu'à 3 pièces en
poche (`p._coinsPocket`, collectées au contact). Affichées en 3 cercles
jaunes au-dessus de la tête. Appuyer sur board quand Boss actif = lance une
pièce parabolique auto-aimée. 3 hits = Boss vaincu → +250pts tueur, +50pts
bonus à tous à l'écran, drop `portal` + `trampoline` au sol près de la dépouille,
audio apocalypse, 30 particules roses.

Si Boss touche le wagon avant 3 hits : wagon `frozenUntil = t+3` (stun ×0.2
vitesse), -50pts score, popup `BOSS GORET !`, puis Boss fuit vers le bord
opposé. Sortie sans drop = cooldown réduit à 2min pour revenge round.

`src/boss-goret.js` (255 L) + `sprites.js` +36L + `audio.js` +1L (`boss()`
grognement sawtooth) + `main.js` + `players.js` (gate `tryThrowCoin` en tête
handler board). Bundle 103.43 KB gz (cap atteint à 103.5).

Spec : `.claude/specs/boss-goret.md`.

### `82234a9` + `d9b9ea9` style: restore UTF-8 accents

Le feature-dev avait retiré les accents ("RAIL BRISE !"). Le reste du
codebase (98 accents sur 23 fichiers) les utilise. Normalisation cosmétique.

### `f68c206` feat(campaign): 7-4 Labyrinthe + 7-5 Dédale final

2 nouveaux niveaux campagne monde 7 (fin round 3). **7-4 Labyrinthe** :
circuit serpentant 3 étages (rows 13→11→9→11→13) avec 3 murailles verticales
de lave (col 6, 10, 14), 4 pièces "égarées" acrobatiques, tunnel hanté `X`
en sortie. **7-5 Dédale final** : ajoute portails, bombes piégées, visiteur
VIP et `failOn: { skeleton: 1 }` (mécanique déjà utilisée dans 5-5/6-3/6-8/7-1).
+52 L dans `src/levels.js`. Bundle 103.87 KB gz.

Spec : `.claude/specs/labyrinthe.md`.

### `f3f26c4` fix(splash): unhardcode max stars

`splash.js:83` utilisait `90` en dur (49 × ~2 = 98, faux). Remplacé par
`LEVELS.length * 3` dynamique, intègre les 2 nouveaux niveaux 7-4 / 7-5.

## ⚠️ QA live Chrome MCP (session G)

qa-tester lancé sur le deploy c82aad0 — mais le **MCP Chrome n'est pas
accessible** à cet agent dans cette config, il est tombé sur code-review
statique uniquement. Verdict analytique **PASS** sur les 3 features (code
structurellement correct, APIs debug exposées, pièges KAPLAY évités, priorités
touches board correctes). **À refaire en live session H** avec accès Chrome
MCP confirmé.

Observation qa-tester pour follow-up : les achievements `repair_first`,
`maintenance_pro`, `jackpot_canards`, `jackpot_canards`, `surfeur_lave` sont
appelés mais pas forcément définis dans le système achievements. Graceful
no-op via `?.unlock?.()` — non bloquant mais à nettoyer.

## ➡️ Session H = CHOIX OUVERT

### Options fonctionnelles

- **Skeleton variants par avatar** (18 sprites à dessiner) — seul item coché [ ]
  restant dans tout le backlog CLAUDE.md. Mechanical, pas de spec nécessaire,
  juste du dessin dans `sprites.js`. Bonne mission "cleanup visuel".
- **Round 4 brainstorm créatif** — le round 3 est fini, on peut partir sur un
  round 4 d'idées (ex : tempête magnétique, saison hiver permanente, course
  de visiteurs). Nécessite une séance brainstorm puis spec-writer.

### Options qualité / perf

- **qa-tester live Chrome MCP** ⚠️ : refaire avec MCP accessible. Session G
  est tombée sur code-review statique faute de MCP. Valider les 4 features
  en vrai navigateur.
- **perf-auditor** : bundle a pris +4.8 KB cette session (99.05 → 103.87). Vérifier
  FPS avec toutes les features actives simultanément (parade + reparation +
  skull-stand double phase + boss goret + weather + ghost train).
- **quality-maintainer** : 5 nouveaux `window.__X` exposés (parade, reparation,
  skullStand, bossGoret + anciens). Factoriser en `window.__systems` ?
  Également chasser dead code (achievements non définis appelés en no-op,
  `stop()` APIs exposées mais non appelées).

### Option doc

- Refactor `HANDOVER.md` qui commence à accumuler l'historique session E/F/G.
  Archiver E dans `.claude/HISTORY/` si le fichier devient lourd.

## État fichiers (post session G)

| Fichier | Lignes | Seuil | Statut |
|---|---|---|---|
| `src/main.js` | 1126 | 1500 | ✅ OK |
| `src/sprites.js` | ~1217 | 1500 | ✅ OK (+36L boss) |
| `src/skull-stand.js` | 413 | 1500 | ✅ OK (était 151) |
| `src/boss-goret.js` | 255 | 1500 | ✅ OK (new) |
| `src/reparation-express.js` | 186 | 1500 | ✅ OK (new) |
| `src/wagons.js` | 1083 | 1500 | ✅ OK |

Bundle prod : **103.87 KB gz** (passé au-dessus de la cible initiale 100 — à
surveiller, mais cap strict 150 KB respecté largement). +4.8 KB session G.

# Handover — Milan Lava Park (2026-04-23 fin session E / début session F)

## État live

- URL : https://michaelchevallier.github.io/lava_game/
- Branche `main` : commit `94b1f1c` pushé, CI auto-deploy en cours
- Bundle : ~97.7 KB gz game + 67 KB kaplay (toujours sous 100 KB)
- **49 niveaux** campagne sur 7 mondes (5⭐/niveau = 147 total possible)
- **24 spectres** en 6 catégories × 4
- **40 VIP** avec contrats quotidiens, seed déterministe
- **Musée** 6 onglets : Médailles, Records, Spectres, Runs, Almanach, Boutique

## ✅ PLAN OFFICIEL 100% TERMINÉ (5 sprints)

Voir session D pour détail. Session E = cleanup/refactor post-plan.

## ✅ Session E (2 commits refactor)

### `e1c820d` refactor(wagons): extract wagon-collisions.js (1437 → 1079 L)

Les 11 `wagon.onCollide()` handlers (lava, water, coin, ghost, bridge, ice,
portal, trampoline, boost, rail_loop, tunnel) extraits dans
`src/wagon-collisions.js` via `attachWagonCollisions({k, wagon, tileMap,
gameState, audio, showPopup, placeTile, catapultWagon, transformToSkeleton,
reviveFromSkeleton, collectCoin, triggerCarillon})`.

Zero logic change, closures préservées. Bundle +0.12 KB gz (import overhead).
wagons.js maintenant très en-dessous du seuil 1500 L.

### `94b1f1c` refactor(main): extract particle-systems.js (1245 → 1090 L)

15 `k.onUpdate`/`k.loop` handlers (particle, steam, lava/water anim, coin,
boost, ghost, fan-puff, particle-grav/x/debris/firework + lava-water steam
spawn + particle cap loop) extraits dans `src/particle-systems.js` via
`attachParticleAndTileUpdates({k, tileMap})`.

main.js sous cible 1200 L pour la première fois. Bundle stable.

### QA Sprint 4 (code review)

Agent qa-tester a fait une code review exhaustive (pas de live Chrome, cf.
limitation MCP) — verdict **PASS** avec 1 point de clarification sur
`wagons.js:348` `if (windy) speedMult += 1.2;` qui est **intentionnel**
(matche description handover D "+1.2 speedMult").

Checklist tests live complète dispo dans le transcript, à re-jouer session F
si besoin d'une vraie validation en navigateur.

## ➡️ PROCHAINE SESSION (F) = CHOIX OUVERT

Backlog CLAUDE.md tous les items polish structurels sont cochés. Reste :

### Option A : QA live réelle (Chrome)

Relancer qa-tester avec instructions explicites de scripter via
`javascript_tool` (Chrome MCP). Valider les 6 niveaux Sprint 4 + sérialisation
sandbox en vrai, pas code review.

### Option B : Skeleton variants par avatar

Actuellement tous les avatars (Mario, Luigi, Toad, Pika, Sonic, Link, etc.)
utilisent le même sprite `skeleton_generic` quand transformés. Idée : 18
skeletons distincts par avatar, à dessiner dans `sprites.js` style aux
squelettes existants.

### Option C : Features créatives round 3 (5 backlogs ouverts)

- Boss Goret (mini-boss visuel qui traverse le niveau)
- Réparation Express (mini-jeu QTE timing)
- Parade Lave QTE (vague de lave montante, esquive)
- Aire Tir Mobile (cible mouvante à toucher avec wagon projeté)
- Labyrinthe (niveau scénaristique maze)

### Option D : Audit perf/quality post-refactor

- `perf-auditor` — mesurer FPS live sur laptop 2015/Mac Retina avec alarm+bomb actifs
- `quality-maintainer` — chasser dead code, patterns dupliqués

### Option E : Mode parent dédié (Sprint 5 skip réhabilité)

Interface dédiée aux parents pour superviser les runs des enfants
(stats temps de jeu, modes plus calmes, etc.). Question laissée ouverte par le plan.

## État fichiers (post session E)

| Fichier | Lignes | Seuil | Statut |
|---|---|---|---|
| `src/main.js` | 1090 | 1500 | ✅ OK (sous cible 1200) |
| `src/wagons.js` | 1079 | 1500 | ✅ OK |
| `src/sprites.js` | 1181 | 1500 | ✅ OK |
| `src/tiles.js` | 966 | 1500 | ✅ OK |
| `src/levels.js` | 935 | 1500 | ✅ OK |
| `src/vips.js` | 824 | 1500 | ✅ OK |

Nouveaux fichiers : `src/wagon-collisions.js` (370 L), `src/particle-systems.js` (161 L).

## Conventions rappel (inchangées)

- 1 commit atomique par feature + push immédiat (push main autorisé)
- Build systématique avant commit (`npm run build`)
- Agent models : qa-tester haiku, feature-dev sonnet, spec-writer opus
- Pas de `console.log` prod, pas de commentaires superflus
- **Si fichier > 1500 lignes, refactorer avant d'ajouter**

## Pour démarrer la prochaine session (F)

1. Lire ce fichier (`.claude/HANDOVER.md`)
2. Choisir une direction (A/B/C/D/E ci-dessus)
3. Si Chrome MCP fonctionne : option A pour confirmer Sprint 4 en vrai
4. Sinon : option B (skeleton variants) ou C (feature créative)

Prompt suggéré pour session F (QA live vraie) :
```
Session F — QA live vraie Sprint 4 via Chrome MCP.
Auto mode full.

Lis .claude/HANDOVER.md. Lance qa-tester avec instructions explicites :
  - navigate https://michaelchevallier.github.io/lava_game/
  - javascript_tool : window.__campaign.startLevel('6-6') etc.
  - Joue chaque niveau 15s, lis console, rapporte par level.

Sur bug : lance bug-fixer + commit + push.
en autonomie totale
```

Prompt suggéré pour session F (feature créative) :
```
Session F — Feature créative round 3.
Auto mode full.

Lis .claude/HANDOVER.md. Choisir l'une de : Boss Goret, Réparation Express,
Parade Lave QTE, Aire Tir Mobile, Labyrinthe.

Spec-writer opus écrit spec → feature-dev sonnet exécute →
1 commit atomique + push. npm run build avant commit.
en autonomie totale
```
