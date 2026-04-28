# Handoff — Crowd Defense (src-v3/)

**À lire en entier avant de commencer.**

---

## Qui je suis (Mike)

- Solo dev, je travaille avec mon fils Milan (~8 ans).
- Je parle français, je préfère qu'on échange en français.
- Email : michael.chevallier@gmail.com
- Date du handoff : **2026-04-28**.

## Le repo

- Repo principal : https://github.com/michaelchevallier/lava_game
- Branche active : **`phaser-pivot`** (NE PAS merger sur `main` qui est l'archive KAPLAY legacy)
- 3 jeux coexistent :
  - `/v1/` = legacy KAPLAY archivé (`main`)
  - `/v2/` = Park Defense Phaser 4 PvZ-like (`phaser-pivot`, racine de Pages)
  - `/v3/` = **CE PROJET — Crowd Defense Three.js** (`phaser-pivot`, dossier `src-v3/`)

CI déploie automatiquement les 3 sur push de `phaser-pivot`. ~3 min.

## Ce qu'on a fait dans cette session

1. Milan a vu une pub mobile de **Kingshot** (jeu MMO sur mobile, mais sa pub vend un fake-game crowd defense top-down). Il veut le **fake-game de la pub**, pas Kingshot lui-même.
2. On a confirmé le pattern : top-down 3D, path sinueux, hordes ennemies, hero auto-aim, tours par proximity-build (le roi rentre dans un cercle, l'or coule).
3. J'ai recommandé **Three.js dans un sous-dossier** `src-v3/` plutôt qu'un repo séparé (réutilise CI/deploy/save).
4. J'ai bootstrappé un MVP fonctionnel avec :
   - Vite config dédié `vite.kingshot.config.js`
   - Build script `npm run build:kingshot` → `dist-kingshot/` → `/v3/`
   - 3 fichiers entités (Hero, Enemy, Tower) + 1 system (Path) + main.js + index.html
   - Bundle 119 KB gz Three.js + 5 KB game
5. Mike a testé, retours :
   - **Caméra mal cadrée** → fixé : caméra suit le hero en lerp soft
   - **Pas de contrôle du perso** → fixé : WASD + flèches + joystick virtuel mobile
   - **Zones cliquables imprécises** → fixé EN CHANGEANT LA MÉCANIQUE : abandonné click-to-build, mis en place **proximity-build à la Kingshot** (hero rentre dans un cercle jaune, drain 30¢/sec, fill arc visuel, coût restant en label)

Commit final : **`13d89ac`** — `feat(v3): mécanique proximity-build (Kingshot ad-style)`

## Lis aussi

- **`CROWD_DEFENSE_DESIGN.md`** dans la racine du repo — c'est le doc de design complet (mécaniques, ennemis, tours, économie, vagues, maps, audio, tech stack, état actuel). Tu en auras besoin avant de planifier.
- **`CLAUDE.md`** dans la racine — instructions générales du repo, conventions, style commits, pièges Phaser. Le `src-v3/` n'utilise pas Phaser mais les conventions de commit/build/deploy s'appliquent.

## Ce que Mike attend de toi

> « Je vais travailler avec l'autre claude sur faire un plan pour un jeu complet complet complet donc tous les aspects, visuels, animation, sons, evolutions, niveaux, monstres. Il devra développer le jeu en autonomie totale, même pour les tests. »

Concrètement :

1. **Phase plan** : tu produis avec Mike un plan détaillé — visuels, animations, sons, progression, niveaux, monstres, tours, héros, économie, meta, save, UX, bundle target. Probablement ~1 longue session.
2. **Phase autonomie** : Mike te laisse travailler. Tu **développes**, tu **testes** (via Playwright headless ou Chrome MCP, il y a déjà des patterns dans `scripts/auto-test-levels.mjs`), tu **commits**, tu **push**, tu **valides en live**. Tu rapportes en fin de cycle.

Pour les tests autonomes regarde `scripts/auto-test-levels.mjs` pour le pattern Playwright + Vite preview. C'est adaptable au crowd defense.

## État du code à reprendre

```bash
cd "/Users/mike/Work/milan project"
git status              # devrait être clean sur phaser-pivot
git log --oneline | head -5
npm run dev:kingshot    # local sur :5174
npm run build:kingshot  # → dist-kingshot/
```

Ce qui marche :
- Hero bouge (WASD/joystick)
- Caméra suit
- Ennemis spawn et marchent sur le path
- Hero auto-tire et kill les ennemis (+2¢ par kill)
- 3 cercles de tour : entre dedans, l'or coule, la tour se monte, elle tire toute seule
- Vagues s'enchaînent (+25% ennemis chaque vague)
- HUD HTML : compteur or + numéro vague

Ce qui manque pour un vrai jeu (TODO partiel, voir le doc design pour la liste complète) :
- Vrais assets 3D animés (Quaternius CC0)
- Toon shader / outlines
- Multi-types ennemis et tours
- Audio
- Boss + multi-maps
- Progression meta + save
- Camera shake + particles + VFX
- Crowd dense (InstancedMesh)
- Mobile polish

## Conventions importantes

- Commits atomiques avec footer `Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>`
- Pas de TS, JS vanilla ESM
- Pas de console.log en prod
- Pas de commentaires sauf si non-obvious
- Test live avant de dire « done »
- Push après chaque feature significative

## Memory

J'ai déjà des memories dans `/Users/mike/.claude/projects/-Users-mike-Work-milan-project/memory/` (user_lang, project_milan_lava_park). Tu peux/dois en ajouter au fil du nouveau projet.

## Sécurité / sanity

- Tag `v1.0-kaplay-final` (commit `9ea6db3`) = snapshot pré-pivot KAPLAY, ne pas toucher.
- Ne JAMAIS merger `phaser-pivot` → `main` sans demander à Mike.
- Si tu casses `/v2/` (Park Defense) en touchant à `src-v2/` ou aux levels JSON, Mike va être triste — Milan joue dessus en parallèle.
