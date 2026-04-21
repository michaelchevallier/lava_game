# Plan Gameplay Unifié — Milan Lava Park

*Synthèse de 3 agents créatifs opus (simulation tycoon / action arcade / sandbox communauté) après le feedback user "aujourd'hui le jeu est creux comme pas permis" (2026-04-21).*

---

## 1. Diagnostic partagé par les 3 angles

Les 3 agents ont convergé sur **le même constat** exprimé en 3 langues :

| Angle | Formulation |
|---|---|
| Tycoon | *"Le joueur pose une tuile et rien ne se souvient. Pas d'économie, pas d'avis, pas de bilan. Jouet plutôt que jeu."* |
| Arcade | *"Bac à sable sans sablier. Pas de run, pas de retry, pas de fin — donc pas de 'encore une partie'."* |
| Sandbox | *"Sandbox sans intention. Les outils sont primitifs, le code btoa est mort, rien ne se partage."* |

**Le vrai problème** : **aucune action n'a de conséquence persistante, aucune session n'a de frontière, aucun parc n'a d'auteur identifiable.** Le joueur ne peut donc rien *raconter* à la fin — ni à lui-même ("j'ai fait 8K hier"), ni aux autres ("regarde mon parc").

Le jeu a **30 systèmes mais aucune mémoire**.

---

## 2. Les 3 réponses en tension

| | Tycoon | Arcade | Sandbox |
|---|---|---|---|
| **Temps** | long (30 jours ≈ 90 min) | court (3 min retry) | asynchrone (construction + partage) |
| **Killer feature** | Avis écrits + économie | Run 180s + hi-score | Outils pro (undo/copy) + challenges |
| **Ennemi** | l'ennui | le timer | la page blanche |
| **Milan cible** | patient, gestionnaire | kid, réactif | créatif, bricoleur |
| **Effort total** | Moyen-Lourd | Léger-Moyen | Moyen |
| **Risque cassage** | casse la vibe créative libre | peut rendre trop stressant | pas de backend = galerie limitée |

**Attaques mutuelles** :
- **Arcade sur Tycoon** : *"Gérer un parc calme sans mourir, c'est Cities:Skylines en 100KB — impossible. Les sandboxes molles ratent par le milieu."*
- **Tycoon sur Arcade** : *"Score sans contexte ne produit aucune mémoire. 5200 pts c'est quoi, beaucoup ?"*
- **Sandbox sur les deux** : *"Vous masquez le vide 10 min avec du juice ou des chiffres — mais vous ne donnez toujours pas un auteur à un parc."*

---

## 3. Plan proposé : hybride pragmatique (Arcade + Tycoon-lite, Sandbox reporté)

### Pourquoi cet arbitrage

- **Milan est un enfant** → feedback immédiat prime. L'arcade gagne sur la profondeur tycoon profonde.
- **100 KB gzippé** → on ne peut pas simuler RCT sérieusement. Le tycoon doit rester surfacique.
- **Combo/score déjà codés** (hud.js:405, COMBO_WINDOW, COMBO_MULTIPLIERS dans constants.js) → amplifier l'existant = ROI x10.
- **Outils pro + partage URL** (sandbox) sont géniaux mais demandent un sprint dédié (undo stack, déterminisme, URL parser, gallery). Phase 3.

### Phase 1 — Quick wins (1-2 sessions de dev)

**Objectif** : transformer l'existant en feedback émotionnel, sans nouvelle mécanique majeure.

1. **Combo Meter plein écran + juice** *(arcade, effort S)*
   - Barre 30% largeur en haut, pulse au beat
   - Palier x2/x4/x8/x16/x32 → freeze-frame 80ms, `k.shake()`, flash couleur, pitch audio monte
   - Timer 4s qui descend visuellement
   - Logique existe déjà dans `hud.js:405`, il faut juste AMPLIFIER

2. **Feed d'Avis Écrits** *(tycoon, effort S)*
   - 40 templates × noms français × âges × tuile-déclencheur
   - "Mémé Ginette, 63 ans : ⭐⭐⭐⭐ 'Le squelette m'a terrifiée, merveilleux !'"
   - Feed défilant bottom-right, 1 avis toutes les 8-15s
   - Donne une VOIX aux visiteurs, transforme le chaos en narration

3. **Chain Reset visuel** *(arcade, effort S)*
   - Combo casse → écran gris-bleu 300ms, son verre cassé, score du combo s'arrache en particules
   - Aversion à la perte (Kahneman) > attrait du gain
   - Seulement sur combos > x4 pour éviter punition excessive

### Phase 2 — Cadre temporel (3-4 sessions)

**Objectif** : donner une frontière au temps. Le sandbox infini est l'ennemi.

4. **Mode Run 180s + Hi-Score local** *(arcade, effort M)*
   - Bouton "RUN!" lance chrono 3 min
   - Podium top-5 localStorage (pas de backend)
   - Écran fin avec gros bouton RETRY
   - **Mode Sandbox actuel reste** derrière toggle (on ne casse pas l'existant)

5. **Fever Mode** *(arcade, effort M)*
   - À x16 combo : écran CSS `filter: invert hue-rotate`, wagons dorés 8s, placement tuiles gratuit, tempo audio x2
   - Le "money shot" shareable. Cap 1x/run.

### Phase 3 — Persistance & création (1-2 semaines)

**Objectif** : donner un horizon long et un auteur à chaque parc.

6. **Permis persistants** *(tycoon, effort M)*
   - Fin de run (Phase 2) → étoiles gagnées → permis débloqués pour la prochaine
   - Capacité wagon +1, nouvelle tuile, skin avatar
   - Étend `tiers.js` existant en méta-progression cross-save

7. **Outils construction pro** *(sandbox, effort M)*
   - Undo (Ctrl+Z), copy/paste rectangle, rotate 90°, mirror
   - **Prérequis** pour tout mode "création partageable"

8. **Mode Défi sérialisé + URL sharing** *(sandbox, effort M+S)*
   - Étendre serializer `v3:` avec header `obj=score2000_t60`
   - Support `?park=<code>` dans l'URL → ouvre directement
   - 12 parcs-challenges livrés baked-in

### Phase 4 — Backlog créatif

- **Saisons/Jours** (tycoon P3) — cycle alternant Matin/Midi/Soir/Nuit avec bilans
- **Désirs visiteurs** (tycoon P5) — traits observables + bulles intent
- **Overdrive Wagons** (arcade P4) — rampe de vitesse progressive
- **Seeds thématiques** (sandbox D) — 6 parcs pré-plantés pour vaincre la page blanche
- **Replay Ghost** (sandbox E) — duel asynchrone, MAIS demande déterminisme KAPLAY, piège connu

---

## 4. Ordre d'exécution recommandé (après validation user)

**Sprint 1** (maintenant, après le débat) :
1. `feat(combo): amplify combo meter juice` — full-width bar + shake + audio pitch
2. `feat(reviews): feed d'avis visiteurs procéduraux` — pool 40 templates × noms × déclencheurs

**Sprint 2** (après validation Sprint 1 en live) :
3. `feat(run): mode Run 180s + hi-score local + écran RETRY`
4. `feat(fx): chain reset visuel brutal`

**Sprint 3** (quand Sprint 2 tient 20+ min de session) :
5. `feat(fever): Fever Mode x16 combo`
6. `feat(permits): méta-progression permis cross-run`

**Sprint 4** (si rétention confirmée) :
7. Outils pro + URL sharing + challenges

---

## 5. Décision attendue du user

Avant d'implémenter quoi que ce soit, **valide ou redirige** :

1. **L'arbitrage hybride** te convient-il, ou tu veux all-in sur UN angle (ex: "fais juste l'arcade pur, jette le tycoon") ?
2. **Sprint 1** (combo meter juice + avis écrits) est-ce le bon point d'entrée, ou tu préfères commencer par le **Mode Run 180s** direct ?
3. **Mode Sandbox legacy** : on le garde derrière un toggle ("Libre" vs "Défi") ou on le retire au profit d'un seul mode "Run" ?
4. **Scope Phase 3+** : les outils pro + sharing URL t'intéressent à moyen terme, ou c'est hors périmètre enfant-de-Milan ?

---

## 6. Notes techniques pour l'implémenteur

- Combo existant : `src/constants.js:15-16` (COMBO_WINDOW=2.5, COMBO_MULTIPLIERS)
- HUD combo actuel : `src/hud.js:405` (à amplifier)
- Quests éphémères : `src/visitor-quests.js` (base pour avis écrits)
- Tiers one-shot : `src/tiers.js` (à transformer en permis cross-save)
- Serializer existant : `src/serializer.js` (étendre `v3:` pour Sprint 4)
- Visiteurs : `src/visitor.js` (étendre avec trait pour Phase 4)
- Sky jour/nuit : `src/sky.js` (ancrer à compteur Day pour saisons)
- **Pitfall KAPLAY** (cf. CLAUDE.md) : `get("*")` ordre non-déterministe → Replay Ghost est un piège, ne pas s'y lancer sans prototype.

---

*Livré par opus 4.7 sur demande user, à valider avant implémentation.*
