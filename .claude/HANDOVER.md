# Handover — Milan Lava Park (2026-04-21 fin de session opus)

## État live

- URL : https://michaelchevallier.github.io/lava_game/
- Branche `main` : commit `47ebd6c` pushé, CI auto-deploy GitHub Pages
- Bundle : ~62 KB gz game + 67 KB kaplay = **~129 KB** (OK)
- main.js : 1463 lignes (sous limite 1500)
- **wagons.js : 1386 lignes** (refactor Passes 1+2 terminé — sous limite)
- Pas de crash connu

## Ce qu'a fait la session précédente (7 commits)

| Commit | Quoi |
|---|---|
| `bade731` | fix splash + tutorial — cog est en bas-droite |
| `59ccc80` | 7 sprites avatars en vue de profil 20×30 (PIKA/SONIC/LINK/KIRBY/YOSHI/BOWSER + SKEL) |
| `7ec18de` | `.claude/GAMEPLAY_PLAN.md` — synthèse débat 3 agents opus |
| `ff59782` | Toggle menu tuiles (🧰, collapsed par défaut mobile) |
| `905afb2` | Extract `wagon-draw.js` (-177 lignes) |
| `dd996c5` | Specs Sprint 1 (combo juice + avis écrits) |
| `47ebd6c` | Extract `wagon-vfx.js` (-296 lignes) |

## État du Gameplay Plan (attente validation user)

User avait dit : *"aujourd'hui le jeu est creux comme pas permis"*. 3 agents opus ont débattu (simulation tycoon / arcade score hunt / sandbox communauté). Synthèse dans **`.claude/GAMEPLAY_PLAN.md`**.

**Recommandation** : arcade-heavy Sprint 1-2 + tycoon-lite Sprint 3 + sandbox reporté.

**Sprint 1 (prêt à shipper après greenlight)** :
1. **Combo Meter juice** — spec détaillée dans `.claude/specs/sprint1-combo-juice.md` (7 commits estimés, ~2h dev)
2. **Feed d'avis écrits** — spec détaillée dans `.claude/specs/sprint1-avis-ecrits.md` (5 commits estimés, ~3h dev)

**À demander au user** (cf. fin de `.claude/GAMEPLAY_PLAN.md` §5) :
- Valide l'hybride, ou redirige ?
- Sprint 1 point d'entrée OK, ou tu veux le Run 180s direct ?
- Mode Sandbox legacy à garder ou retirer ?
- Scope Phase 3+ intéressant ou hors-périmètre ?

## Priorités pour la prochaine session (ordre)

### 1. Obtenir greenlight user sur GAMEPLAY_PLAN
Présenter les 4 questions. Dès réponse :
- Si Sprint 1 OK → déléguer `sprint1-combo-juice.md` à un feature-dev sonnet en parallèle de `sprint1-avis-ecrits.md` (les deux specs n'ont pas de conflit fichier, peuvent tourner en parallèle).

### 2. P3 items reportés
- **Pose tuiles en hauteur** (ambigu — user doit clarifier : placer dans trous creusés ? ou en row < 0 ? Les deux ?). Ne pas implémenter à l'aveugle.
- **Passe 3 wagons refactor** (optionnelle) : extract `tryBoardWagon` + `exitWagon` + `tryAutoBoardVisitor` → `src/wagon-rider.js` (~116 lignes) pour descendre wagons.js à ~1270. Bonus, pas bloquant.

### 3. Backlog créatif round 3 (CLAUDE.md)
Boss Goret, Réparation Express, Parade Lave QTE, Aire Tir Mobile, Labyrinthe. Indépendant du GAMEPLAY_PLAN, à faire après Sprint 1+2.

### 4. Skeleton variants par avatar
Unifié sur skeleton_generic actuellement. Les sprites vue-de-profil `_SKEL` par avatar existent maintenant (PIKA_SKEL refait). À wiring dans `avatars.js` quand un skeleton propre par avatar sera souhaité.

## Conventions rappel (utiles)

- **Pas de commentaires superflus** (sauf WHY non-obvious)
- **1 commit atomique par feature** + push immédiat
- **Build systématique** après chaque changement (`npm run build`)
- **Agent models** : bug-fixer/qa-tester en haiku, quality-maintainer/feature-dev/perf-auditor en sonnet, spec-writer en opus
- **Tests** : user teste lui-même ou via agent qa-tester, PAS de Chrome MCP direct (trop lent, user l'a dit)
- **Quatuor d'agents** : créatif → spec-writer → feature-dev → qa-tester + quality-maintainer en appui

## Pitfalls KAPLAY (ajouts session)

Rien de nouveau. Les pitfalls connus (CLAUDE.md) suffisent. Le refactor wagons.js s'est bien passé grâce au pattern factory closure `createWagonVfx({...})` qui préserve l'accès à `k`, `audio`, `gameState`, `tileMap`, etc.

## Nouveaux fichiers depuis la dernière session

- `src/wagon-draw.js` (180 lignes) — pure draw fns, pas de closure
- `src/wagon-vfx.js` (303 lignes) — factory closure, collectCoin/revive/carillon/transform
- `.claude/GAMEPLAY_PLAN.md` — plan unifié attente validation
- `.claude/specs/sprint1-combo-juice.md` — spec Sprint 1a prête
- `.claude/specs/sprint1-avis-ecrits.md` — spec Sprint 1b prête

## État tasks

Toutes les tasks P1/P2/P3 triviales cochées. Seule `P3: Pose tuiles en hauteur` reste pending car ambiguë — attend clarification user.
