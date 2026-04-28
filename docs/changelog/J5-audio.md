# J5 — Audio complet (Crowd Defense /v3/)

**Date** : 2026-04-29.
**Branche** : `phaser-pivot`.
**Commits** : `3e2c83e` → `f89c214` (4 feat).

## Résumé

J4.B livrait la méta-progression complète. J5 ajoute l'**ambiance sonore** :
4 musiques procédurales (Web Audio) qui switchent automatiquement selon le state
de jeu (menu/calm/intense/boss), 6 nouveaux SFX (gem, achievement, perk, skin,
levelup, bossCharge), et un panneau Settings audio avec sliders Musique/SFX
indépendants persistés.

**Note** : Suno tracks initialement prévues sont reportées (Mike pas généré).
La piste procédurale est shippable telle quelle ; les Suno tracks remplaceront
les builders de `MusicManager.TRACKS` plus tard sans casser l'API.

## Livré (par commit)

| Commit | Sujet | Détail |
|---|---|---|
| `3e2c83e` | feat(v3): MusicManager 4 ambiances procédurales | Web Audio drones + arpèges + drum patterns. 4 tracks : menu (warm pad C major), calm (nature pad A minor), intense (sawtooth + drums 120 BPM), boss (low bass + drums 95 BPM). API : play/stop/setMusicVolume/setMuted/getCurrentTrack. Crossfade 800ms. |
| `1b1ca93` | feat(v3): auto-switch musique selon game state | Boss-spawned → boss, wave-start (>=4) → intense, wave-cleared → calm, level-won/lost → menu, level-loaded → calm. Boss prioritaire (override jusqu'à fin niveau). |
| `63d3b82` | feat(v3): SFX étendus (6 nouveaux) | sfxGemGain (chime montant), sfxAchievement (fanfare 4 notes), sfxPerkPick (twang court), sfxSkinEquip (chime double), sfxBossCharge (sweep grave→aigu), sfxLevelUp (fanfare ascendante). |
| `f89c214` | feat(v3): settings audio sliders + ⚙️ HUD | Overlay #settings avec sliders Music/SFX 0-100%. Persisté SaveSystem (`musicVolume`/`sfxVolume`). Bouton ⚙️ HUD top-right. |

## 4 ambiances procédurales

| Track | Mood | Composition Web Audio |
|---|---|---|
| **menu** | Calme héroïque | Pad sine G2/D3/G3 + arpège C major (C5-D5-E5-G5-E5-D5) toutes 350ms |
| **calm** | Apaisé jouable | Pad sine A2/E3/A3 + arpège A minor (A5-C6-E6-C6) toutes 600ms |
| **intense** | Combat actif | Pad sawtooth A1/D2/A2 + arpège dramatique 200ms + drums 120 BPM kick/hat |
| **boss** | Menace épique | Pad sawtooth low D1/G1/D2 + arpège dissonant + drums 95 BPM lourds |

Chaque track utilise des `OscillatorNode` + `GainNode` + scheduled timers.
Crossfade 800ms entre tracks (linearRampToValueAtTime sur le `musicGain`).

## Auto-switch logic

```js
boss-spawned → MusicManager.play("boss")  // priorité absolue
wave-start (n>=4) → play("intense")  // si pas en boss
wave-start (n<4) → play("calm")
wave-cleared → play("calm")
level-won/lost → play("menu")
level-loaded → play("calm")
```

## SFX complet (15 SFX)

J1-J3 livrés (9) : heroShoot, towerShoot, enemyHit, enemyDie, towerBuilt, waveStart, castleHit, levelWon, levelLost.

J5 ajoutés (6) :

| SFX | Trigger | Timbre |
|---|---|---|
| `sfxGemGain` | boss kill drop gem | chime 3 notes (D6-F#6-A6) sine |
| `sfxAchievement` | unlock achievement / drop skin | fanfare 4 notes triangle |
| `sfxPerkPick` | perk choice click | twang 2 notes triangle |
| `sfxSkinEquip` | équip skin | chime double sine |
| `sfxBossCharge` | boss charge start | sweep 60→220Hz sawtooth |
| `sfxLevelUp` | hero level-up | fanfare 4 notes ascending triangle |

## Settings audio

Overlay `#settings` (bouton ⚙️ HUD) :
- Slider **Music** 0-100% (par défaut 35%)
- Slider **SFX** 0-100% (par défaut 50%)
- Persistance dans `crowdef:save` v3 (`musicVolume`, `sfxVolume`)
- Mute (bouton 🔊) coupe les deux indépendamment des sliders

Live-update : changer le slider applique l'effet au volume immédiatement
(pas besoin de fermer le panneau).

## Tests étendus

`scripts/auto-test-crowdef.mjs` v5 — **22 asserts** (vs 17 en J4.B) :

Phases 1-3.5 : 17 asserts inchangés.
Phase 4 (music auto-switch, **nouveau**) :

18. ✓ `__cd.music` exposé
19. ✓ `play("calm")` set currentTrack à "calm"
20. ✓ `play("boss")` switch correctement
21. ✓ `setMusicVolume(0.42)` persiste
22. ✓ `stop()` clear currentTrack à null

Run final : 22/22 ✓, FPS avg 20.5.

## Découvert / Pivots

- **Procédural plutôt que Suno** : décision pratique pour shipper J5 sans bloquer.
  Les builders sont dans `TRACKS = { menu(), calm(), intense(), boss() }` — facile
  à remplacer par des `<audio>` avec URL Suno plus tard sans toucher l'API.
- **Boss music priorité** : pendant un boss, la musique reste sur "boss" même si
  une wave normale démarre (l'inverse n'a pas de sens narrativement).
- **Volume séparé** : Mike (et plus tard Milan) peut couper la musique sans
  perdre le feedback SFX, ou inversement.
- **Web Audio context auto-init** : MusicManager.start() doit être appelé après
  un user gesture (browser policy). C'est wired sur le premier `pointerdown`/`keydown`/`touchstart`.

## Fichiers touchés J5

**Nouveaux** :
- `src-v3/systems/MusicManager.js` (234 LOC)
- `docs/changelog/J5-audio.md` (ce fichier)

**Modifiés** :
- `src-v3/main.js` (auto-switch listeners, settings UI handler, ~70 LOC)
- `src-v3/index.html` (overlay settings + bouton ⚙️ + CSS)
- `src-v3/systems/Audio.js` (6 nouveaux SFX)
- `src-v3/systems/SaveSystem.js` (musicVolume/sfxVolume getters/setters)
- `scripts/auto-test-crowdef.mjs` (phase 4 music)

## Pour la suite (J6.A)

- **J6.A** : Forêt Sombre (World 2) — 8 niveaux, theme forêt, ennemis spécifiques (volants ?), boss "Sorcier de la Forêt"
- Décisions à demander Mike :
  - Theme visuel W2 : couleurs (vert sombre / pourpre / brouillard ?)
  - Ennemi volant introduit en W2 ou attendre W4 (Volcan) ?
  - Mécanique boss W2 : invocation de minions ? téléportation ? AoE area ?
