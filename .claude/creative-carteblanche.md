# Carte Blanche — Réinventer Milan Lava Park

*Session game design 2026-04-21, Opus 4.7. Brief user : "carte blanche, sois audacieux, va au-delà". Cible : Milan 8 ans. Contraintes : 1 tuile max, 2 wagons, time trial OK ; bundle libéré ; pas de combo juice gratuit, pas d'avis écrits auto — du **vrai gameplay**.*

---

## 0. TL;DR (pour relecture rapide)

- **Ce qui manque** : le joueur résout les 38 niveaux **une fois**, puis plus rien n'a de texture. Pas de rejouabilité, pas d'auteur, pas d'imprévu. Le sandbox n'a pas d'intention, la campagne n'a pas d'écho, et Milan ne peut **rien raconter** à son père le soir sauf "j'ai fini".
- **Ma recommandation n°1, opinionated** : **"LE PARC PARLE" — des visiteurs VIP qui arrivent avec un contrat (un objectif lisible + une contrainte dure), paient en tickets, et font vivre un parc durable qui se charge entre sessions.** C'est la fusion campagne / sandbox / run la plus naturelle : chaque session = 3 contrats tirés au sort + un parc persistant qui évolue. Voir §3.
- **Top 3 features à faire maintenant** : (1) **Tickets VIP & Contrats quotidiens** (cœur de la reco), (2) **Mode Éditeur + partage URL** (le parc = un artefact qu'on s'échange), (3) **Règles du Parc modifiables** (Baba-Is-You lite : 3 tuiles qui inversent une règle pendant X secondes). Voir §4.
- **Ce qu'on casse** : rien. Tout se greffe sur les hooks existants (`onSkeleton`, `onCoin`, `onLoop`, `onApocalypse`, serializer v2:, campaign `progress()`). Le sandbox reste intact.

---

## 1. Ce qui manque au jeu actuel (critique)

### 1.1 Pas de "pourquoi" entre deux sessions

Le jeu a 30 systèmes (fantômes, saisons, tiers, quêtes journalières, achievements, ducks, skull-stand, grande roue, rail loops, apocalypse, etc.) mais **aucun d'entre eux n'écrit quelque chose que Milan veut vérifier demain**. Les 3 modes sont trois cul-de-sacs :

- **Campagne** : linéaire, verrouillée par étoiles, jetable dès terminée. Milan la boucle en ~3 sessions (38 niveaux × ~2 min chacun). Ensuite ? Rien.
- **Run 180s** : le score flotte sans contexte. "5 200 pts" c'est beaucoup ou peu ? Le podium top-5 local ne donne pas d'écho.
- **Sandbox** : la page blanche plus le fait que **rien ne persiste de manière signifiante** = ennui rapide. Le parc n'est pas un artefact qu'on sauvegarde avec fierté.

**Conséquence concrète** : à session N+1, Milan ouvre le jeu et se dit "j'ai déjà fait". Pas "je veux voir si mon parc a encore ses visiteurs d'hier", pas "je veux savoir quel contrat tombe aujourd'hui", pas "je veux finir MON parc".

### 1.2 Le contenu dynamique est en autopilote

Le user lui-même a écrit dans le backlog round 3 : *"tout est plus ou moins en autopilote"*. Les visiteurs marchent, les ballons flottent, le voleur de pièces arrive à ses intervalles. Le joueur regarde plutôt qu'il n'agit. Pire : la campagne a résolu ça par des objectifs clairs + time limits, mais **le sandbox et le run ont perdu cette rigueur** — ils sont redevenus mous.

Le jeu n'a pas tranché entre "puzzle" et "simulation". Du coup il est *un peu* les deux et *vraiment* ni l'un ni l'autre.

### 1.3 L'outil de création est sous-exploité

Il y a un serializer `v2:` qui sait parfaitement encoder un parc en ~100-400 caractères btoa-friendly. Il y a un layout language (`col.row.code`) que les niveaux utilisent déjà. Il y a un export modal déjà codé. **Et personne ne s'en sert**. C'est un pistolet chargé sur la table du scénariste.

Milan a 8 ans. **À 8 ans on veut construire un truc et le montrer à quelqu'un.** Pas forcément en ligne — son père, son grand frère, sa maîtresse. Le code btoa dans une modale est exactement le bon niveau d'abstraction si on le scénarise bien.

---

## 2. Cinq à huit directions innovantes

### Direction A — "LE PARC PARLE" : Visiteurs VIP & Contrats (tycoon narratif)

**Pitch.** Chaque jour, 3 VIP pré-écrits arrivent au parc avec un **contrat** : un objectif lisible + une contrainte dure + une récompense en Tickets. Le joueur charge son parc persistant et doit **configurer les tuiles pour satisfaire le contrat**. Quand un VIP est content, il laisse un **témoignage illustré** qui reste dans un almanach. Quand il part furieux, il **bannit une tuile** pendant 24h.

**Mécanique détaillée.**
- Pool de ~40 VIP nommés, chacun avec personnalité courte ("Mémé Ginette, 63 ans, adore les squelettes mais déteste les boucles — lui donner 3 transformations lave sans looping").
- Chaque session : seed journalière → tire 3 contrats parmi le pool, jamais vus dans les 7 derniers jours.
- Un contrat = un objectif (ex: `skeleton: 2`) + une **contrainte anti-spam** (`forbidLoop`, `maxTiles: 5`, `onlyLavaAndCoin`, `timeUnder: 60s`).
- Récompense : 1-3 **Tickets d'Or**. Tickets achètent : nouvelles tuiles (`rail_loop` n'est plus gratuit, il coûte 5 tickets à débloquer la 1ère fois), skins wagon, **patches de règles** (voir direction E).
- Le parc est **persistant entre sessions** : le layout est sauvegardé, les wagons ont un score cumulé "total squelettes historique", les VIP satisfaits laissent des traces visuelles (petite statue derrière la tuile qui a résolu leur contrat).
- **Témoignage** : `"⭐⭐⭐⭐⭐ — M. Lebrun, 41 ans : 'Le grand looping de la 3ème voie vaut le déplacement. Mes enfants ont hurlé.'"` — stocké dans un almanach HTML, 1 témoignage ≠ 1 visiteur random mais le VIP satisfait. **Ce n'est pas du fluff** parce que ça **remplace** les avis random actuels et arrive seulement en cas de victoire sur un contrat — c'est la matérialisation d'une action gagnée.

**Pourquoi c'est fort pour Milan Lava Park.**
- **Milan, 8 ans, aime les histoires.** Les noms/âges/répliques suffisent à créer un fil narratif sans cinématique.
- **Seed journalière** = "hier tu avais Mémé Ginette, aujourd'hui c'est le Préfet Marteau". Milan ouvre le jeu pour voir **qui vient aujourd'hui**. C'est de la rétention sans effort.
- **Contraintes dures** redonnent la tension des niveaux campagne au sandbox. Le sandbox devient un sandbox-avec-missions, donc plus un sandbox mou.
- **Persistance** : Milan charge SON parc, pas un nouveau. Il garde les wagons dorés débloqués. Il voit les statues des VIP précédents. Le parc devient **sa maison**.
- **Monétisation fictive via Tickets** : pas de vraie monnaie mais même boucle que RCT/Animal Crossing. On débloque le `rail_loop` au 3ème jour, pas dès le départ — ça étale le contenu.

**Complexité : L** (~12h dev, faisable sur 1 sprint).  
**Effet attendu.** La question "pourquoi rouvrir le jeu demain ?" a enfin une réponse binaire : *"voir les VIP d'aujourd'hui"*. Le parc a un auteur (Milan), une histoire (les VIP satisfaits s'empilent), une économie (tickets). C'est la fusion des 3 modes en 1 mode unifié.

---

### Direction B — MODE ÉDITEUR + PARTAGE URL (sandbox créateur)

**Pitch.** Un bouton "Créer un défi" qui permet à Milan de **poser son propre niveau** : grille vide, il dessine rails/tuiles, pose l'objectif (`skeleton: 3`), définit le budget tuiles de celui qui va résoudre, puis **partage un lien**. Le père reçoit le lien par SMS, clique, voit "Milan t'a posé un défi : 3 squelettes en 5 tuiles. Lien : lava_game?park=eJw..."

**Mécanique détaillée.**
- Écran éditeur = campagne-menu recyclée + toolbar complète + écran "paramètres du défi" (objectifs, budget, wagons, timeLimit).
- Le serializer existant `v2:` encode déjà tout. Extension minimale : préfixe `v3:` ajoute objectif+budget en header. Ex : `v3:skel3|t5|w2||3.13.R,4.13.R,8.12.L`
- URL param `?park=<btoa>` → ouvre directement le défi, skip splash.
- Les défis résolus sont stockés en localStorage `defisResolus[]` pour un retour au sender : "Papa a résolu ton défi en 47s ⭐⭐⭐".
- **12 défis baked-in** livrés avec le jeu pour démarrer, signés "Milan Lava Park Team" — donnent le vocabulaire de ce qui est un bon défi.
- **Galerie locale** : liste des défis reçus, statut (résolu/en cours), envoyeur (prénom saisi à l'ouverture, localStorage).

**Pourquoi c'est fort pour Milan Lava Park.**
- **Le serializer est déjà là.** Le coût tech est ~3-4h pour l'édition + encoding header. Le reste c'est de l'UX.
- **Milan + son père/frère** = boucle sociale forte. C'est un jeu asynchrone, pas un MMO. Pas besoin de serveur.
- **La PWA marche offline** et un SMS avec URL fonctionne partout. Zéro backend.
- **Auto-réparation de la fin de campagne** : quand Milan termine les 38 niveaux, il a maintenant 2 choses à faire : créer des défis, résoudre ceux des autres. Le tutoriel devient naturellement "regarde, fais comme les niveaux mais c'est toi qui les fabriques."

**Complexité : M** (~6-8h dev).  
**Effet attendu.** Le parc devient un **objet social**. Milan se met à construire "un parc pour Papa", "un parc pour Tata". Rétention x3 minimum parce que le jeu s'insère dans la vie familiale, pas dans une console isolée.

---

### Direction C — MODE "RÈGLES DU PARC" (Baba-Is-You lite)

**Pitch.** Trois tuiles spéciales permettent au joueur de **modifier les règles du monde** pendant quelques secondes. Ex : poser la tuile `LAVA=GOLD` transforme toutes les lave en pièces pendant 10s. Poser `WAGON=HERO` rend tous les wagons immunisés aux transformations. Ça ouvre un nouveau plan de puzzle où la **règle elle-même** devient une ressource.

**Mécanique détaillée.**
- 5-6 tuiles "Règle" : `LAVA=GOLD`, `WAGON=HERO`, `COIN=BOOST`, `WATER=LAVA` (inverse le cycle), `SKELETON=RIVIVE` (transforme automatique tout squelette qui passe sur rail), `TIME=SLOW` (ralenti monde sauf joueur 8s).
- Coût : **1 ticket par activation**, durée 8-12s, recharge 20s.
- Visuel : écran teinte couleur de la règle active (filter CSS `hue-rotate` + overlay HUD "⚠️ LAVA=GOLD : 7s").
- Interactions émergentes : `LAVA=GOLD` + `APOCALYPSE` = pluie de pièces massive. `WATER=LAVA` + fan = geyser de lave. Ces combos ne sont pas scriptés, ils émergent.
- **Niveaux monde 6** dédiés : "Niveau 6-1 : tu n'as QUE la règle `LAVA=GOLD`. Atteins 500 pts."

**Pourquoi c'est fort pour Milan Lava Park.**
- **Milan va adorer.** Baba-Is-You c'est de la magie pour un enfant — "je change les règles du jeu !"
- **Réutilise massif.** Les règles reprennent la logique de `checkCoinResonance`, `checkLava`, etc. déjà codées. On ajoute juste un **predicate global mutable** qui modifie le comportement de ces fonctions pendant X secondes.
- **Extensible.** 5 règles au lancement, on peut en ajouter à chaque mise à jour sans casser.
- **Émergent = storytelling gratuit.** Milan se raconte "j'ai fait une fontaine de pièces géante grâce à LAVA=GOLD + APOCALYPSE". Il n'y a pas besoin d'écrire cette histoire.

**Complexité : M** (~8h dev, tests émergents = chronophages).  
**Effet attendu.** Profondeur stratégique +30% sans ajouter de tuile physique. Le jeu devient plus "intelligent" sans devenir plus compliqué pour Milan — les règles sont nommées en français et claires.

---

### Direction D — MODE "CHRONIQUE" : une journée vivante (simulation courte)

**Pitch.** Au lieu d'un run 180s chronométrique, une **journée de 6 phases de 30s chacune** — Matin (visiteurs rares), Midi (afflux), Après-midi (VIP), Orage (contrainte météo), Soir (feu d'artifice), Nuit (bilan). Chaque phase a sa couleur, ses contraintes, ses opportunités. Le score est la **somme des 6 phases**, mais le bilan final raconte une journée.

**Mécanique détaillée.**
- Sky existe déjà (jour/nuit/lune/étoiles). On ancre à un timeline 3 minutes.
- Matin : spawn lent, visiteurs hésitants (bonus × 1.5 sur premiers squelettes).
- Midi : afflux × 3 (multi-wagons obligatoires ou combos perdus).
- Après-midi : 1 VIP à satisfaire sinon pénalité -100 au score.
- Orage : pluie 15s, les lave s'éteignent temporairement, il faut rediriger les wagons sur rails secs.
- Soir : feu d'artifice = toutes les apocalypses × 2.
- Nuit : bilan narratif "Journée du 21 avril : 2 840 pts, 12 squelettes, 1 VIP content (Mémé Ginette), 0 VIP furieux. ⭐⭐".
- Le bilan est **stocké dans un journal de bord** (7 dernières journées), consultable.

**Pourquoi c'est fort pour Milan Lava Park.**
- **Le run 180s actuel est plat** : 180s de la même chose. Ici chaque 30s change d'ambiance, d'objectif implicite, de règle.
- **Sky, weather, saisons existent déjà** — 60% du code est déjà là.
- **Narration émergente** : le journal raconte 7 histoires différentes. "Hier j'ai eu une journée orage catastrophique".
- **Compatible direction A (VIP)** : la phase "Après-midi" EST le moment où les VIP arrivent.
- **Respecte la contrainte Milan 8 ans** : 3 min c'est court, mais c'est rythmé donc pas ennuyeux.

**Complexité : M** (~7h dev).  
**Effet attendu.** Le mode run devient re-jouable à l'infini parce que chaque journée est légèrement différente selon la seed (quel VIP, quelle météo, quel bonus du soir). Le "podium top 5" devient un "journal des 7 derniers jours", beaucoup plus évocateur.

---

### Direction E — MODE "ESCAPE" : mini-puzzles enchaînés sans reset (scénarisation)

**Pitch.** Un mode où le **parc est fixe** et Milan doit résoudre 5 énigmes successives en y déplaçant des tuiles limitées. Entre chaque énigme, **l'état du parc persiste** — les wagons transformés restent squelettes, les pièces collectées ne reviennent pas, les ponts cassés ne se réparent pas. C'est du one-shot, on ne peut pas retry une sous-énigme, on peut seulement relancer toute la chambre depuis le début.

**Mécanique détaillée.**
- 8-10 "chambres" de 5 énigmes chacune, progression narrative : "Le parc abandonné", "Le cirque hanté", "Le musée mécanique", etc.
- Chaque énigme = un objectif minimal ("1 squelette") + une contrainte héritée de l'énigme précédente ("tu n'as plus que 3 tuiles", "la lave au milieu a été consommée").
- **Pas de respawn** : coin pris = coin parti. Wagon utilisé = wagon perdu. Le joueur doit planifier les 5 énigmes en connaissance du parc global.
- **Histoire légère** : 2 phrases textuelles entre chaque énigme, 6 phrases à la fin. "Le forain te remercie. Il te laisse son aimant magique." (Débloque la tuile `magnet`.)
- **Chambre finale** = intégration totale : toutes les tuiles, toutes les règles.

**Pourquoi c'est fort pour Milan Lava Park.**
- **Zachtronics-like** : chaque chambre est un "circuit" qu'on optimise. Milan 8 ans peut ne pas finir les chambres expertes, mais les chambres 1-3 sont faisables.
- **Exploite la profondeur** des combos existants (chaînes, apocalypse, constellations) sans demander d'en coder de nouveaux.
- **Narration émergente + scriptée** — le squelette du monde 5 énigmes est là, il suffit de scénariser.
- **Persistance intra-chambre** force la planification, ce qui est un nouveau skill vs la campagne actuelle où chaque niveau est un reset.

**Complexité : L** (~10-12h dev + design de 50 puzzles).  
**Effet attendu.** Ajoute ~3-5h de gameplay experts après la campagne, avec de la vraie difficulté. Pour les joueurs qui finissent les 38 niveaux en 3 jours et se disent "et maintenant ?".

---

### Direction F — MODE SABOTEUR : un wagon adverse (action + adaptation)

**Pitch.** Un wagon "ennemi" noir apparaît toutes les 45s, roule sur TES rails et **détruit une tuile au hasard à chaque fois qu'il en touche une**. Milan doit soit l'éviter (construire des pièges, le détourner avec portal), soit le tuer (lava). Mais s'il le tue, il laisse une **cicatrice** (tuile défoncée qui ne se répare qu'après 30s ou 3 pièces offertes).

**Mécanique détaillée.**
- Wagon saboteur = sprite violet/noir, trail de fumée, son de grincement.
- Pas de collider physique, il roule juste sur rails et "mange" 1 tuile par seconde de contact.
- Meurt si traverse lava (sans produire squelette).
- Cicatrice = tuile inactive visuellement moche, le joueur doit "offrir" 3 coins (les placer sur la cicatrice) pour la réparer, ou attendre 30s.
- Annonce 3s avant le spawn : texte rouge "⚠️ Saboteur en approche !" + flash bordure écran.
- **Mode auto-activé en sandbox** au bout de 2 min (pour éviter la somnolence). Désactivable dans settings.
- **Mode obligatoire en "Défense"** — un sous-mode où TOUT est saboteur, jusqu'à ce que le parc meurt (game over classique).

**Pourquoi c'est fort pour Milan Lava Park.**
- **Anti-autopilote.** Le user lui-même a identifié le problème. Un ennemi actif force l'attention.
- **Mécanique simple** à implémenter (wagon existe déjà, il suffit d'un flag "hostile" qui change le comportement).
- **Combo avec tout le reste** : Milan peut le détruire avec lava + wagon normal en trigger, ou le piéger dans un vortex portal.
- **Mode "Défense"** = nouveau run de 3-5 min à haute tension, remplace éventuellement le run 180s vide.

**Complexité : S-M** (~5h dev).  
**Effet attendu.** Retour à la tension du jeu. Le sandbox cesse d'être mou. Milan doit **protéger** son œuvre. Ça change radicalement le rapport au parc.

---

### Direction G — COOPÉRATION ASYNCHRONE "Le Parc du Foyer" (famille)

**Pitch.** Un **parc partagé en localStorage** où chaque membre de la famille (profil saisi à l'entrée) peut poser **3 tuiles maximum par jour**. À la fin de la semaine, le parc est joué automatiquement en "démo" et le score est attribué à tout le foyer. Milan voit "Papa a posé un rail loop ici hier ⭐".

**Mécanique détaillée.**
- 4 profils (Milan, Papa, Maman, Frère) avec couleur d'aura de tuile.
- Chaque profil a 3 "droits de pose" par jour (reset minuit local).
- Interface "Voir le parc famille" → affiche les auras colorées sur les tuiles posées.
- **Dimanche soir, "Grande Démo"** : tout le parc est joué en mode démo, 90s de chaos automatique, le score est stocké dans l'historique famille.
- **Règle sociale** : personne ne peut effacer les tuiles d'un autre. On peut seulement ajouter.
- **Conflit créatif intentionnel** : les 4 joueurs peuvent avoir des visions différentes, le parc devient un palimpseste.

**Pourquoi c'est fort pour Milan Lava Park.**
- **Zéro backend**, pure localStorage. Si plusieurs appareils, chacun a son parc, mais un export-share bouton permet l'échange manuel.
- **Ritualise la semaine** : "dimanche soir on joue la démo ensemble sur la TV de la cuisine".
- **Exploite la dimension PWA** : une seule install, plusieurs profils.
- **Demande un foyer impliqué**, donc c'est une feature optionnelle (bouton "Activer mode famille"). Si personne ne l'active, le jeu marche normalement.

**Complexité : M** (~6-8h dev, mais essentiellement UX).  
**Effet attendu.** Transforme le jeu en rituel familial. Milan n'est plus seul avec son jeu. Le risque : tout le monde s'en fout sauf Milan, et le mode est inutile. Donc à tester avec discipline.

---

### Direction H — MODE "RYTHME" : Crypt-of-the-Necrodancer lite (1 niveau expérimental)

**Pitch.** Un sous-mode 1 parc où les wagons ne bougent que **sur le beat** d'une musique 4/4, et où les tuiles posées sur un temps fort **doublent** leur effet. Milan doit poser ses tuiles **en rythme** pour maximiser le score.

**Mécanique détaillée.**
- Musique procédurale 120 BPM (audio.js procédural peut faire ça), 4 temps par mesure.
- Chaque beat = 500ms. Un wagon avance de 1 tile par beat (pas de physique continue).
- Une tuile posée pendant les 100ms d'un downbeat = effet doublé (lave ignore 1 wagon avant d'en transformer un autre, coin compte double, apocalypse n'a besoin que de 4 au lieu de 5).
- HUD = barre de rythme en bas, pulse au beat, les moments "strong" sont dorés.
- **1 seul parc** de 2 min, optionnel, bouton "Rythmes" dans le splash.

**Pourquoi c'est fort pour Milan Lava Park.**
- **Expérimental**, pas central. Mais ça peut exploser en popularité.
- **Milan 8 ans aime les défis de rythme** (cf. succès TikTok des enfants).
- **Audio.js procédural** peut produire un beat propre. Pas besoin de sample.
- **Risque** : déporte le gameplay vers l'action-réflexe, ce qui n'est pas le ton du jeu. À faire seulement après A/B/C.

**Complexité : L** (~10h dev, audio = douleur).  
**Effet attendu.** Mode bonus fun, 2-3 sessions de découverte, ensuite utilisé rarement. Sauf si Milan adore.

---

## 3. LE PLAN INTÉGRATEUR : la direction recommandée

### Recommandation opinionated : **Direction A ("LE PARC PARLE" : VIP + Contrats + Persistance)**

**Pourquoi LA seule, par élimination raisonnée** :

- **B (Éditeur URL)** est excellent mais **ne résout pas "pourquoi rouvrir le jeu demain"** — c'est une feature, pas un cœur. Il doit **suivre** A, pas remplacer.
- **C (Règles du parc)** est génial mais **trop abstrait pour Milan 8 ans** en premier contact. Milan doit d'abord **vouloir ouvrir le jeu**, ensuite il pourra apprécier les mécaniques exotiques. C peut venir en direction 2 ou 3.
- **D (Chronique)** se fond **dans** A : les 6 phases de la journée sont naturellement le déroulé d'une visite de VIP. Donc D est **absorbée par A**.
- **E (Escape)** est un mode pour joueur avancé, pas pour le cœur d'âge 8 ans à l'onboarding. Il vient après.
- **F (Saboteur)** résout l'autopilote mais **rétrécit le champ** à l'action. Le risque c'est que Milan se fatigue de l'alerte permanente. Mieux : intégrer le saboteur **dans** les contrats VIP ("Mémé Ginette dit : 'empêche le saboteur de détruire plus de 2 tuiles pendant sa visite'") — donc F absorbé dans A.
- **G (Famille)** est charmant mais **dépend du foyer**. On ne peut pas construire autour d'un pari social incertain.
- **H (Rythme)** est un bonus expérimental.

**A est la seule direction qui** :
1. Répond à la question "pourquoi revenir ?" (il y a de nouveaux VIP aujourd'hui).
2. Crée un **auteur** (le parc est celui de Milan, avec ses statues de VIP passés).
3. Introduit une **économie** (tickets) sans effort monétaire.
4. **Absorbe** les autres directions (D dans les phases de contrats, F dans les contraintes VIP, E dans les chambres spéciales VIP).
5. **Rien à casser** : la campagne reste intacte, le sandbox actuel reste intact, le run devient naturellement "le run d'aujourd'hui" (celui du contrat).

### Comment A se déploie concrètement

**Session 1** (onboarding Milan) :
- Splash → nouveau bouton "Mon Parc" (à côté de Campagne/Run/Sandbox).
- Clic → charge le parc persistant (ou écran "Nomme ton parc" si 1ère fois).
- 3 VIP de la journée affichés en card à gauche, chacun avec prénom, âge, photo 8bit, demande, récompense.
- Milan clique un VIP → son contrat se charge (timer s'il y en a un, contraintes grisées sur la toolbar, objectif en HUD).
- Fin du contrat → témoignage animé apparaît ("★★★★★ Mémé Ginette : 'Incroyable'"), tickets ajoutés.
- Milan peut enchaîner les 3 VIP, ou s'arrêter.
- Puis, tickets → menu "Boutique" : débloquer tuile `rail_loop` pour toujours (5 tickets), skin wagon doré (3 tickets), etc.

**Session 2+** :
- Milan revient, nouveaux VIP. Son parc est toujours là. Ses statues de VIP précédents trônent derrière les tuiles qui ont résolu leurs contrats. **Continuité**.

**Nouveau cœur narratif** :
- L'almanach des VIP croisés. 40 portraits, 40 témoignages. Milan les collectionne.
- Achievements liés ("5 VIP de plus de 60 ans satisfaits", "3 VIP consécutifs sans utiliser la lave").

### Pourquoi c'est VRAIMENT du gameplay (pas du fluff)

User a rejeté les "avis écrits auto". La différence fondamentale avec A :
- **Avis auto** = génération random chaque 10s, zéro enjeu, zéro mémoire, du bruit d'ambiance.
- **VIP contrats** = un avis n'arrive QUE si Milan a résolu un contrat (= action). Il est **le résultat d'un gameplay**, pas du chrome.

Le verbe central de A c'est **"satisfaire"**. Chaque partie a 3 satisfactions possibles. Chaque satisfaction est un artefact permanent.

### Ce qu'on NE fait PAS dans la direction A (antidote au fluff)

- ❌ Pas de feed d'avis random défilant.
- ❌ Pas d'animations gratuites (squash & stretch, confettis en continu, screenshakes décoratifs).
- ❌ Pas de musique d'ambiance cinématique.
- ✅ UN témoignage par VIP satisfait, QUAND le contrat est résolu, QUI RESTE dans l'almanach.

---

## 4. Top 3 features prioritaires

### #1 — Contrats VIP quotidiens (cœur de A)

**Descriptif.** 3 VIP tirés chaque jour (seed deterministe par date), contrat = objectif + contrainte + récompense tickets. Pool initial : 20 VIP pour commencer (extensible).

**Dépendances techniques existantes** :
- `campaign.js` → le moteur `progress(type, amount)` fonctionne déjà pour tracker skeleton/coin/loop/etc. On le réutilise tel quel.
- `levels.js` → le format `objectives + allowedTools + tileBudget + timeLimit + failOn` est déjà parfait pour un contrat. Un VIP = un level généré en mémoire à partir du pool.
- `serializer.js` → on sauvegarde le parc persistant dans `save.vipPark` en v2:.
- `campaign-result.js` → l'écran fin peut être recyclé pour afficher le témoignage.
- `tiers.js` → sait gérer une devise locale, on remplace "tier" par "ticket".

**Nouveau code nécessaire** :
- `src/vip.js` — pool de VIP hardcodés, fonction `generateDailyContracts(seed)`.
- `src/vip-card.js` — UI card VIP (HTML, pas canvas).
- `src/almanac.js` — stockage et affichage des témoignages débloqués.
- Extension de `save` : `{ vip: { dailySeed, completedToday: [], almanac: [...], tickets: 0, unlockedTools: ["lava","water",...] }, park: { layout: "v2:..." } }`.

**Estimation dev** : **10-14 heures** réparties en 3 sous-tâches :
- 4h : pool VIP + generator + UI card.
- 4h : hook dans campaign-result + almanac + persistance.
- 3h : boutique tickets + déblocage tuiles.
- 2-3h : tests + polish + design des 20 premiers VIP.

**Risques principaux** :
- **Design des VIP** : il faut 20 contrats variés et équilibrés. Difficile à équilibrer sans playtest. Solution : livrer 10 au lancement, ajouter 10 au bout de 2 semaines d'observation Milan.
- **Persistance du parc** : conflit possible si le joueur casse son parc en configurant mal. Solution : bouton "Reset parc" dans settings + snapshot auto avant chaque contrat ("Annuler les changements du contrat").
- **Effet "corvée"** : si les 3 VIP sont obligatoires, ça devient une liste de tâches. Solution : les 3 sont **optionnels**, on peut en faire 0-1-2-3, et seuls les résolus donnent des tickets. Le joueur peut juste "visiter son parc" sans contrat.

---

### #2 — Mode Éditeur + Partage URL (Direction B)

**Descriptif.** Un bouton "Crée un défi" qui permet de poser un parc + objectif + budget + temps, puis partage via URL.

**Dépendances techniques existantes** :
- `serializer.js` → `serializeTiles` et `deserializeTiles` sont déjà là. On étend `v2:` en `v3:` avec header objectif/budget.
- `campaign.js` → le moteur `progress()` tourne déjà pour tout objectif.
- `splash.js` → on ajoute une 4ème carte "Créer / Défis".
- **URL param parsing** dans `main.js` : déjà présent pour `?mobile=1`, on ajoute `?park=<code>`.

**Nouveau code nécessaire** :
- `src/editor.js` — mode de jeu "éditeur" (toolbar complète + panneau "paramètres du défi").
- `src/editor-share.js` — modal "partage" (génère URL shareable, copy-to-clipboard).
- `src/challenges-received.js` — liste des défis reçus en localStorage (dédoublonnage par hash).

**Estimation dev** : **6-8 heures**.

**Risques principaux** :
- **URL length** : certains SMS cassent au-delà de 500 chars. btoa d'un parc complet peut faire 400-800 chars. Solution : utiliser LZ compression (lz-string lib ~2 KB, mais elle double le bundle). Alternative : limiter les parcs partageables à 30 tuiles max (suffisant).
- **Déterminisme** : le même défi doit être résoluble identiquement chez deux joueurs. Pièges KAPLAY (`get("*")` ordre non-déterministe — cf. CLAUDE.md). Solution : on ne compare pas des replays, juste le score final → ok, pas de problème de déterminisme.
- **Ambiguïté UX** : "créer un défi" vs "résoudre un défi reçu" sont deux choses différentes. Solution : deux boutons distincts sur la carte splash.

---

### #3 — Règles du Parc (Direction C, version minimale)

**Descriptif.** 3 tuiles règles seulement au départ : `LAVA=GOLD`, `WAGON=HERO`, `TIME=SLOW`. Coûtent 1 ticket par activation, 10s d'effet.

**Dépendances techniques existantes** :
- `tiles.js` → `placeTile` est extensible, on ajoute 3 nouveaux types de tuiles.
- `tiers.js` ou le nouveau ticket system (feature #1) → achat d'activation.
- Pour `LAVA=GOLD` : `checkLava` dans wagons.js → on passe par un hook `getLavaEffect()` qui retourne soit "transform" soit "coin" selon règle active.
- Pour `WAGON=HERO` : flag global `gameState.wagonImmune = true` pendant 10s.
- Pour `TIME=SLOW` : `k.dt()` x 0.5 sauf pour joueurs.

**Nouveau code nécessaire** :
- `src/rules.js` — état global + activations + timers + visuels.
- Extension de la toolbar : 3 nouveaux slots (cachés tant que non débloqués).
- Visuels : overlay teinte écran + HUD countdown.

**Estimation dev** : **5-7 heures**.

**Risques principaux** :
- **Breaking** : si `LAVA=GOLD` active à mi-chemin d'une transformation, le wagon est déjà dans un état indéterminé. Solution : la règle s'applique aux **nouvelles** collisions, pas aux en-cours.
- **Équilibrage** : `TIME=SLOW` peut rendre trivial les niveaux campagne. Solution : **désactiver les règles en mode campagne**, activer seulement en mode Parc (feature #1) et sandbox.
- **Cohérence visuelle** : les règles sont invisibles par défaut (c'est un état). Solution : bordure écran colorée + texte HUD "⚠️ LAVA=GOLD actif, 7s" + icône permanente sur le coin HUD tant que la règle tourne.

---

### Pourquoi ces 3 et pas d'autres

- **#1 résout le problème n°1** : "pourquoi rouvrir le jeu demain". Sans ça, les #2 et #3 sont des features sur un jeu qui ne retient pas. L'ordre est critique.
- **#2 multiplie la valeur** : une fois le parc persistant, partager un challenge prend tout son sens. C'est le hub social.
- **#3 augmente la profondeur** une fois que le joueur est accroché. Parfait en feature "patch 1.1".

### Ce que je NE mettrais PAS dans le top 3 (mais qui vient après)

- **Mode Saboteur (F)** : intégrer comme contrainte VIP plutôt qu'en mode à part.
- **Mode Chronique (D)** : fondu dans les phases de VIP de #1.
- **Mode Escape (E)** : après 2-3 semaines, quand la campagne est bouclée. Contenu experts.
- **Mode Famille (G)** : test UX optionnel, 3ème mois.
- **Mode Rythme (H)** : expérimental, uniquement si tout le reste est stable.

---

## 5. Questions ouvertes que j'aurais voulu poser

1. **Milan joue-t-il seul ou accompagné ?** — décisif pour trancher entre A (solo-centré) et G (famille). Le brief dit "Milan 8 ans" mais rien sur son environnement.
2. **Durée session moyenne actuelle ?** — si 5 min, pas la peine d'investir dans du long-terme (A). Si 30 min + 3x/semaine, A devient évident. Y a-t-il des analytics localStorage ?
3. **Le user cible aussi d'autres enfants, ou c'est vraiment Milan seul ?** — décisif pour l'URL sharing (B). Si Milan est le seul utilisateur, B sert juste à partager avec papa. Si d'autres enfants jouent, B devient central.
4. **Appétit pour la narration ?** — le user a rejeté les avis écrits auto, mais accepte peut-être les VIP nommés. Sont-ce *tous* les textes qu'il rejette, ou juste les textes fluff sans gameplay derrière ?
5. **Combien de temps Milan a mis à finir la campagne ?** — si 2h, le jeu a déjà un problème de contenu. Si 15h, A est moins urgent et on peut privilégier les directions profondes (C, E).
6. **Le user a-t-il un smartphone à proximité quand Milan joue ?** — PWA sur téléphone = partage URL ultra-naturel. Sur laptop = plus compliqué.
7. **Y a-t-il un mode "parent" possible ?** — un mode où le père peut construire des défis et les envoyer à Milan par URL (direction B inversée, père crée, Milan résout).
8. **Le user trouve-t-il les 38 niveaux encore équilibrés pour un enfant de 8 ans ?** — le monde 5 énigmes est ambitieux. Si Milan bloque sur un niveau, ça peut tuer le fun avant même qu'on parle de VIP.
9. **Contrainte bundle vraiment libérée ?** — handover dit 144 KB total, user "a abandonné la cible 100 KB". Mais s'il y a un seuil caché (300 KB ? 500 KB ?), il faut le savoir avant d'ajouter lz-string, beaucoup de textes VIP, etc.
10. **Backend envisageable ?** — le user a toujours refusé, mais la direction G et B bénéficieraient énormément d'un petit Firebase/Supabase (100h free tier suffit pour 1 famille). Est-ce une position idéologique ou technique ?

---

## 6. Notes finales pour l'implémenteur

### Tout se greffe sur ce qui existe déjà

- **Hooks campagne** (`onSkeleton`, `onCoin`, `onLoop`, `onApocalypse`, `onCatapult`) → réutilisés tels quels pour VIP.
- **Serializer v2:** → extension triviale en v3: pour header de défi.
- **`campaign.js` `progress()` engine** → le moteur VIP EST le moteur campagne, on lui passe un "level" généré dynamiquement.
- **`campaign-result.js` overlay** → recyclé pour témoignage VIP (juste le design change).
- **`splash.js`** → ajouter 1-2 cartes.

### Les seules nouveautés structurelles

- **État persistant** : ajouter un sous-arbre `save.vip` + `save.park` dans localStorage. Petit risque de casse de save si on oublie un defaulter.
- **Seed journalière** : `new Date().toISOString().slice(0,10)` suffit comme seed. Pas besoin de vrai RNG.
- **VIP pool** : data-driven dans un fichier `vip-pool.js`. Pas de code, juste des configs.

### Pièges connus à éviter (cf. CLAUDE.md)

- Ne PAS utiliser `get("*")` pour iter pendant une frame de VIP check.
- Ne PAS mettre des noms de VIP avec `[`, `\`, ou `(...)` bizarres dans `drawText`.
- La touche pour activer un contrat : PAS `D` ni `T` (conflit). Suggère **Enter** ou click souris seulement.
- Éviter `k.fixed()` sur l'overlay VIP fullscreen → utiliser HTML DOM comme le fait déjà campaign-result.

### Ce qui tue la direction A si mal géré

1. **Les contrats VIP deviennent ennuyeux** si on en met 3 tous les jours ET qu'ils se ressemblent. Pool de 20 au lancement est le **minimum absolu**.
2. **Les tickets deviennent inutiles** si tout est débloqué trop vite. Équilibrage : viser 5 sessions avant de débloquer `rail_loop`, 15 sessions pour tout débloquer.
3. **La persistance devient une corvée** si le parc se sauvegarde mal. Tester localStorage robustement (quota, JSON parse fail, migration v1→v2).

---

## 7. Une dernière idée folle, gratuitement

**Le fantôme du parc.** Un ancien propriétaire décédé revient sous forme d'étoile filante une fois par semaine (dimanche soir). Il **commente** ton parc à voix haute (1 phrase tirée d'un pool de 30). Si ton parc a X tuiles, il dit "Il y a du monde ici". Si tu as résolu 3 VIP, il dit "Je vois que tu sais accueillir". Si tu n'as rien fait, il dit "C'est bien silencieux ce soir...". Il laisse ensuite une tuile rare (magnet, bridge, rail_loop) en cadeau. Pas de gameplay dur, juste de la **narration qui réagit à l'état**. 15 min de dev si on se limite à 30 phrases.

C'est **du fluff narratif**, donc en principe rejeté par le user. MAIS : c'est hebdomadaire (rare), il laisse un CADEAU (gameplay), et c'est une récompense de constance. Ça peut valoir la peine.

---

*Fin du document. Opus 4.7, 2026-04-21. Recommandation centrale : direction A. Questions bienvenues.*
