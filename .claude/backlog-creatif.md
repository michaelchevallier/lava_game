# Backlog créatif — Milan Lava Park

Sortie des agents créatifs opus, à traiter dans les cycles d'auto-improvement suivants. Ordre indicatif (impact/effort), à réviser à chaque cycle.

## Attractions (parc d'attractions)

### 1. Toboggan Géant (priorité 5/5, 2 commits) ⭐ TOP créatif
Structure 1x5 verticale en escalier. Wagon au sommet → glissade x3 + traînée de feu, atterrissage = crater de lava temporaire 4s.
- Combine : rail_down + lava + boost
- Combos émergents : trampo au pied (rebond parabolique), ice au sommet (glissade infinie x5)
- Fichiers : tiles.js (tile slide), wagons.js (mode glissade + spawn lava temp)

### 2. Tunnel de l'Amour Maudit (4/5, 1 commit)
Tile horizontal 1x4 noir. Wagon entre, disparaît 3s, ressort avec 2x passagers squelettes (duplication). 2 wagons en même temps = fusion.
- Combine : portal + train fantôme (multiplication)
- Cascade : tunnel + wagon doré = sortie de 2 dorés
- Fichiers : wagons.js, tiles.js

### 3. Stand de Tir aux Crânes (4/5, 2 commits)
Structure 5x2. 5 crânes mobiles défilent. Click = +50pts, 1/20 doré +300pts + pluie de 5 coins. Wagon passant = crânes hurlent + changent direction.
- Combine : pêche aux canards (mécanique clic) + coin shower
- Combo fan adjacent : crânes flottent zigzag +100% pts
- Fichiers : nouvelle entité skull-target (réutilise pattern duck)

### 4. Maison Hantée (4/5, 3 commits)
Structure 4x4 fermée avec porte. Wagon entre → génère 3 fantômes errants autonomes (10s) qui transforment joueurs touchés. +25pts/fantôme retourné.
- Combine : train fantôme (spectres) + magnet (attire fantômes errants)
- 2 maisons = fantômes voyagent entre les deux (chaîne)
- Risque : entité autonome (pathfinding simple) = effort plus élevé

## Combos émergents (interactions tiles/entités)

### 5. Carillon des Damnés (priorité 4/5, 2 commits)
3+ trampolines alignés horizontalement (gap max 2 tiles), wagon rebondit 3 en <1.5s → onde sonore (cercle 256px) transforme TOUS visiteurs zone en squelettes simultanément. +30pts par visiteur (vs +10 normal).
- Notes : do-mi-sol ascendant + cloche grave + flash blanc
- Fichiers : wagons.js (track lastTrampolineHits[]), audio.js, tiles.js

### 6. Triangle de Tartare (4/5, 2 commits)
3 lava en triangle équilatéral (côté 2 tiles). Centre = "œil de lave" pulsant. Émet particule fantôme toutes 3s qui kill visiteur le plus proche (+50pts).
- Limite : max 2 triangles actifs
- Conflit : eau sur sommet = œil meurt
- Fichiers : tiles.js checkLavaTriangle, main.js component tartare-eye

### 7. Couronne d'Hiver (3/5, 3 commits)
Magnet entouré de 4 ice cardinales (N/S/E/O dist 1). Magnet → couronne dorée. Pendant 8s : wagons radius 5 tiles à 30% vitesse + traînée bleue. Joueurs jump x1.5.
- Combo set-up pour autres combos
- Fichiers : tiles.js checkIceCrown, wagons.js inCrownZone, main.js jump

### 8. Métronome Infernal (4/5, 2 commits)
2 boosts alignés verticalement (col same, gap 3 tiles, lava entre). Wagon traverse top→bottom <0.8s → battement 4 pulses BPM 180. Pendant 3s : tous wagons +50% vitesse + score x2.
- Synergie forte avec Carillon ou Triangle pendant la fenêtre x2
- Fichiers : tiles.js détection, wagons.js track timing, main.js multiplier global

### 9. Constellation Spectrale ⭐ EN COURS CYCLE 1
[Voir spec implémentation cycle 1]

## Suggestions futures (à brainstormer)

- Pêche miraculeuse (eau profonde + canne)
- Palais des glaces (déforme les sprites au passage)
- Auto-tamponneuses arena (zone)
- Saltimbanques jongleurs (déco vivante)
- Manège enchanté (chevaux qui descendent à des moments aléatoires)

---

# Backlog créatif round 2 (polish + progression)

Sortie des 2 nouveaux opus créatifs lancés mid-cycle.

## Polish / game-feel
- [x] Slow-Mo Cinématique (TOP — cycle 7) — 100ème âme / record / apocalypse
- [ ] Squash & Stretch transformation (1 commit, 5/5) — visiteur compresse + bounce + flash blanc
- [ ] Hésitation visiteur (2 commits, 4/5) — passenger tourne tête vers menace, "?" puis "!"
- [ ] HUD Living Numbers (1 commit, 4/5) — score roule (déjà partiel : displayScore lerp existe)
- [x] Wagon Expressif (cycle 8 partiel — overlap avec Wagon-Roi)

## Progression / rétention
- [x] Almanach du Forain (TOP — cycle 9) — 3 quêtes journalières + streak 7j
- [x] Saisons du Parc (cycle 10) — Halloween/Noël/Carnaval cycliques 2 semaines
- [ ] Wagon-Roi évolutif (déjà fait cycle 8) — visuel 7 paliers selon save.plays
- [ ] Le Conte du Parc (1 commit, 3/5) — 14 phrases lore textuel par palier
- [ ] Concours du Foyer (2 commits, 4/5) — records par perso (Mario/Pika/Luigi/Toad)

---

# Round 3 — Interactions joueur (anti-autopilote)

User feedback : "tout est plus ou moins en autopilote quoi". 8 idées proposées.

## TOP 2 (recommandation forte)

### #3 Quêtes Visiteurs ⭐ (5/5, 2 commits)
Toutes 45s un visiteur affiche bulle "3 pièces SVP" / "emmène moi à la grande roue" / "veut voir un splash". 30s pour livrer (apporter objet ou escorter dans wagon). +50-150 pts. Combine tous systèmes existants (wagons, grande roue, pêche, stand tir, pièces).
- Fichiers : nouveau quests.js + extension wagons.js + bulles HUD

### #6 Course de Wagons (5/5, 2 commits)
Touche R = mode race : 2 wagons rouge/bleu spawnent, chaque joueur boarde le sien, 3 tours du parc, gagnant +500. Tiles posées affectent les 2 (sabotage/coop).
- Fichiers : mode race main.js + checkpoints invisibles + HUD compteur

## Autres (4-5/5)

### #1 Voleur de Pièces (5/5, 1 commit)
Toutes 20-30s fantôme violet vole pièces, joueur fonce dessus pour le vaincre (3 PV). Drop "Lanterne Bénie" anti-fantôme 30s.

### #2 Parade Lave QTE (4/5, 1 commit)
Wagon dans lave = éclaboussure vers joueur, indicateur 0.6s touche à presser, parade flash blanc. Sinon stun 1.5s. Combo x5 = "Surfeur de Lave" 200pts.

### #4 Stand Tir Mobile (4/5, 1 commit)
Évolution stand : canards défilent en file, click fléchette parabolique. 3 canards = JACKPOT 300pts + cosmétique chapeau random.

### #5 Réparation Express (4/5, 1 commit)
Rail aléatoire se brise toutes 60s, 10s pour le replacer, sinon wagon déraille -100pts. Streak 5 = bouclier "Maintenance Pro" 90s.

### #7 Météo Capricieuse (4/5, 1 commit)
Toutes 90s : 3s avertissement puis éclairs/pluie de pièces/vent latéral. Joueur réagit (abri, ramasser, contre-balancer).

### #8 Boss Goret (5/5, 2 commits)
Tous 4 min : gros cochon rose à lunettes fonce sur wagon le + chargé, joueur jette pièces (touche F) pour le vaincre. 10 pièces = boss vaincu +250pts + 2 tiles rares drop.
