# J7 — Polish & cinématiques + endless (Crowd Defense /v3/)

**Date** : 2026-04-29.
**Branche** : `phaser-pivot`.

## Résumé

Tous les jalons précédents (J1-J6) livrent le contenu (32 niveaux, 4 boss, méta).
J7 finalise avec :
- **Endless mode** débloqué après W1 (vagues exponentielles 30+, best-wave persistant)
- **Cinématiques intros** texte stylé pour chaque monde (1ère arrivée seulement)
- **Polish UX** : animations entrée overlays + danger vignette boss-charge
- **Musique réelle** : remplacement de la musique procédurale par MP3 « Carrousel des Braves » (généré par Mike, en attendant Suno)

## Endless mode

`data/levels/endless.js` génère 30 vagues progressives :
- Tier 0 (W1-5) : basics + runners
- Tier 1 (W6-10) : + assassins + brutes
- Tier 2 (W11-15) : + flyers + shielded
- Tier 3 (W16-20) : + imps + mid-bosses tous 5
- Tier 4 (W21+) : swarm imps + flyers + mid-bosses tous 3

Spawn rate accélère par vague (480ms → 220ms min). Castle HP 200, coins start 200.

UI worldmap : tuile `Endless ∞` apparaît après `world1-8` complete. Affiche le best-wave persistant.

`SaveSystem.recordWaveReached(wave)` mis à jour à chaque wave-start en endless.

## Cinématiques intros

`data/cutscenes.js` avec 4 cutscenes (world1, world2, world3, world4). Chacune :
- Icône emoji 64px
- Titre du monde
- 4 paragraphes narratifs
- Bouton "Continuer →"

Auto-affichées avant le briefing du 1er niveau de chaque monde (W1.1, W2.1, W3.1, W4.1).
Persistées dans SaveSystem (`seenCutscenes[]`) — ne se ré-affichent pas après.

API test : `__cd.skipCutscene()` permet aux Playwright de bypass.

## Musique MP3 réelle

`src-v3/public/audio/carrousel-des-braves.mp3` (3.6MB, généré par Mike).

`MusicManager.js` rewrite v2 :
- HTMLAudioElement avec `loop=true`
- Fade in/out via requestAnimationFrame sur `audio.volume`
- Conserve l'API : `play(track)`, `setMusicVolume(v)`, `setMuted(m)`, `stop()`
- Multipliers de volume par mood (`menu: 0.85`, `calm: 0.75`, `intense: 1.0`, `boss: 1.1`) — la même piste joue, mais avec un boost en intensité selon le state de jeu

Avantage vs procédural : qualité audio drastiquement supérieure, pas de glitches.
Trade-off : taille bundle (~ + 3.6MB), 1 piste pour les 4 ambiances (différenciation par volume seulement).

À remplacer plus tard par 4 vraies pistes Suno avec `play(trackName)` qui charge dynamiquement la piste correspondante.

## Polish UX

- **Overlay entry animation** : `panel-in` 320ms cubic-bezier scale + translate, appliqué sur tous les overlays (briefing, result, worldmap, shop, settings, perk-overlay, cutscene)
- **Danger vignette** : `#danger-vignette` en pointer-events:none, strobe rouge inset shadow pendant 1.5s sur `crowdef:boss-charge`. Donne un signal visuel fort (péri-canvas) que la charge approche.

## Tests étendus

`scripts/auto-test-crowdef.mjs` v6 — **25 asserts** (vs 22 en J6).

Phase 5 (J7 endless + cutscene, **nouveau**) :
23. ✓ endless level loadable
24. ✓ endless has 30 waves
25. ✓ world1 cutscene marked seen after load

Phase 0 (boot) ajoute `cd.skipCutscene()` avant skipBriefing pour éviter le blocage en headless.

Run final : 25/25 ✓.

## Fichiers touchés J7

**Nouveaux** :
- `src-v3/data/levels/endless.js` (60 LOC)
- `src-v3/data/cutscenes.js` (40 LOC)
- `src-v3/public/audio/carrousel-des-braves.mp3` (3.6MB asset)
- `docs/changelog/J7-polish.md` (ce fichier)

**Modifiés** :
- `src-v3/main.js` (cutscene + endless wiring + danger vignette)
- `src-v3/index.html` (overlay cutscene + vignette + animations CSS)
- `src-v3/systems/MusicManager.js` (rewrite HTMLAudioElement v2)
- `src-v3/systems/SaveSystem.js` (seenCutscenes API)
- `src-v3/data/levels/index.js` (33 niveaux total avec endless)
- `scripts/auto-test-crowdef.mjs` (phase 5 + skipCutscene)

## État final post-J7

- **33 niveaux** : 4 mondes × 8 + endless = campagne complète
- **15 SFX** procéduraux + **1 piste musicale MP3** loopée avec fade dynamique
- **10 upgrades méta** persistantes + **12 skins** mix achat/drop/achievement
- **25/25 asserts** Playwright passent (FPS 19+ en headless)
- **Bundle** : ~135KB gz JS + 3.6MB MP3 (asset principal)

## Pour la suite (post-J7)

Mike a demandé une grosse passe d'équilibrage post-J7 (cf. memory `project_v3_post_j7_pass.md`) :
- Sentiment de swarm (plus d'ennemis) + or réduit
- Vitesse jeu accélérée
- Assets nature pour la map (Stylized Nature pack)
- Multi-paths (ennemis arrivent de plusieurs directions)
- Preview tourelle avant construction
- Tourelles plus grandes
- Path matérialisé visuellement
- Run tous les niveaux + screenshots
- Agents game design + creation pour rapport fun/équilibrage
