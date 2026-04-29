# Review Équilibrage & Progression

## Verdict global

Le pivot post-balance corrige le « trop facile » mais introduit des cliffs durs (W1.1 → W1.8, et surtout endless après wave ~18) ; l'économie méta est sous-tunée (ROI gemmes très faible, friction du reset assumée). **Note : 6.5 / 10**.

## Courbe difficulté W1 → W4 → endless

**W1 (intro)** — courbe globalement saine mais cliff sur W1.8.
- W1.1 : 4 waves, 1 brute, 88 enemies effectifs (post SWARM ×1.4). Castle 120 HP, leak basic = -5 → tolérance ~24 leaks. **OK**.
- W1.4 (intro shielded) : 5 waves, 4 shielded final wave. Castle 130 HP, mais aucun ballista en slot (tous archer/tank/mage/ballista premier ballista en W1.5). Le briefing dit « visez de derrière » mais joueur n'a pas de tour qui pierce. **Cliff léger** — passer slot 4 en `ballista` plutôt que ballista uniquement en W1.5.
- W1.8 (boss Brigand) : 6 waves, 2 mid-bosses + 1 boss, ~118 non-boss enemies × 1.4 = **165 spawns**. Brigand HP 80, charge ×4 speed 0.6 → traverse curve en ~6s pendant charge. Castle HP 160. Slots cumul 465. StartCoins 180 → manque 285¢ à grinder. Or-par-kill 0.55 × moyenne 4 = ~2.2¢/kill, 165 kills = 363¢. **Tendu mais faisable** si zéro leak. Cliff sensible vs W1.7.

**W2 (forêt)** — saut sec depuis W1.
- W2.1 : 5 waves vs 4 dans W1.1-3, intro assassin (stealth). Castle 130 HP, 4 slots cumul 290¢ vs 245 en W1.5. **Saut acceptable** mais aucun tutoriel stealth.
- W2.8 : warlord_boss summon `runner` toutes les 5s, HP 100. Castle 180. Sur la durée du boss (100/dmg moy ~2 = 50s avant kill), ~10 runners summon supplémentaires + spawn pool. **Probable trop dur** sans hero level 4+.

**W3 (désert)** — gros saut difficulté avec multi-paths.
- W3.1 : 2 paths simultanés. Slots 5, mais 2 archers + 2 ballistas se partagent les paths (1 chacun). Si flyer spam (8/14/12 par wave), un seul ballista par path doit tout gérer + flyers volent (les tank au sol ne peuvent pas leur faire face directement). **Cliff dur** — castle 150 HP est bas pour la pression.
- W3.8 corsair : AOE blast 30 dmg toutes les 8s sur le hero s'il est à proximité. Castle 200 HP = 6-7 blasts max. Hero doit kite tout en tirant. **Difficulté OK pour une finale.**

**W4 (volcan)** — courbe dense correcte.
- W4.1 : intro imp (HP 4 vs basic HP 3, dmg 8). Castle 180 HP, mais 5 waves très chargées. Saut sensé.
- W4.8 dragon : 3 paths (deux simultanés + path 3 latéral), boss HP 180 + AOE 35 + summon imp. Castle 250 HP, 6 slots cumul 565¢. **Conçu comme final boss propre** mais le path 3 n'a qu'1 tank en couverture — exploit à abuser ou cliff infranchissable selon densité de spawn sur ce path (round-robin random).

**Endless** — soft cap dur autour de wave 18-20.
- Wave 0 : spawn 480ms, ratio 1.0, ~22 enemies basic+runner = vague easy.
- Wave 15 : spawn 360ms, ratio 3.7×, tier 3 (flyers + imps + assassins). ~140 enemies par wave.
- Wave 25 : spawn 280ms, ratio 5.5×, tier 4. ~280 enemies par wave × 1.4 SWARM = **400 spawns** en 112s.
- Wave 30 : spawn 240ms, ratio 6.4×. **~370 enemies, vague de 89s avec midboss tous les 3 waves**. Castle 200 HP, slots cumul 575¢.

Avec SWARM ×1.4 et spawn ×0.75, **endless devient un mur dès tier 3-4** alors que la roadmap originelle le prévoyait sur 30 waves. Soft cap réel : wave **17-19**.

## Économie en-run

**W1.1** :
- Total enemies effectifs : ~88 basics+runners + 3 brutes = revenu kill ≈ 88×2×0.55 + 3×8×0.55 = 97 + 13 = **110¢**
- + start 100 = 210¢ total
- Slots = 150¢ → reste 60¢ pour micro-marges. **Sain pour l'intro.**

**W2.4 (mid-game)** : 5 waves, ~94 non-boss + 1 mid-boss. Reward kill 0.55 × moy 3 = 1.65¢ × 94 = 155¢ + start 145 = 300¢. Slots 5 cumul 360¢. **Tendu de -60¢** → joueur doit upgrade tours partiellement, jamais full.

**W4.4** : ~110 enemies + 2 mid-boss. Revenu ≈ 1.6×110 + 15×2×0.55 = 192¢ + start 210 = 402¢. Slots 5 cumul 520¢. **Manque 118¢** — joueur ne peut pas full les 5 slots, doit choisir.

**Constat** : à partir de W2, le joueur **ne peut pas remplir tous les slots level 1**. Les upgrades (×2 et ×4 du base cost) sont réservés à très peu de tours. Combo perk `coin_gain` (+50%) devient mandatory. **Castle HP** vs damage incoming : ratio HP/damage moyen wave finale ≈ 8-12 leaks → punition rapide.

## Économie méta (gemmes/upgrades/skins)

**Drops gemmes** : 2 mid-boss × 5 + 1 boss × 20 = 30💎 par run de monde 1, 35💎 monde 2-4 (3 mid-boss W3/W4 niveaux 4-5 + boss).

**Total upgrades** : 10 × (5+15+40) = **600💎** total. Pas de cap par niveau.
- Avec gem_multi tier 3 lvl 3 (×2.0) : 600 / 2 = 300💎 effectifs.
- 600 / 30 = **20 clears de monde 1** ou 600 / 30-35 = ~17 clears mixtes pour tout maxer.
- À ~5-8 min par level × 8 levels = 50min/clear → **~17h grind pour max upgrades**.

**Reset cost 10💎** : 33% d'un clear W1 boss-only. Pas pénalisant en milieu/fin de jeu, **friction OK**. Refund total est généreux.

**Skins** :
- Hero achat : 50/80/120/200 = 450💎 cumul
- Castle achat : 150💎
- VFX achat : 100💎
- Total achat : **700💎** (au-dessus du coût total upgrades).
- Drops boss : 4 skins gratuits. Bonus skin +5% est **flat** (vs upgrades qui scale en %), donc **skins drop = strictement supérieur** aux skins achetés (+ identité visuelle). ROI achat très faible — un joueur rationnel skip les skins payants.

**Décalage** : `xp_boost` upgrade donne +30% XP au lvl 3. Hero level cap = 6 (XP_CURVE 5 paliers). XP/kill = 1, total kills run W1 ≈ 88-130. 130 × 1.3 = 169 XP. Curve cumul 30+50+75+100+130 = 385. **Hero atteint à peine niveau 4 sur run complet W1**. Le perk-reroll lvl 3 (+3 perks) n'a d'impact que niveaux 2-6. **xp_boost devrait être +20/40/60% pour vraiment unlock le roguelite layer**.

## Mécaniques boss : difficulté vs lisibilité

**Brigand W1 (charge)** — chargeMs 1500, cooldown 6000, ×4 speed. Pendant charge, le boss couvre **6 unités** (1.5s × 0.6 × 4) avant retour normal. Sur une path de ~22 unités, c'est 27% de la course. Lisible (particules rouges + event boss-charge), **bien tuné**.

**Sorcier W2 (summon)** — 1 runner toutes les 5s. HP 100 → ~50s vie boss → ~10 minions. Trop si le joueur n'a pas le hero ranged contre les minions. **Suggéré : summonCooldownMs 7000** ou type basic plutôt que runner (moins rapide).

**Corsaire W3 (AOE)** — 30 dmg radius 4.5, cooldown 8s. Lisible (event aoe + shake). Le joueur peut esquiver en sortant de range. **Bien tuné.**

**Dragon W4 (combo)** — flyer + AOE 35 dmg radius 5 + summon imp toutes les 4.5s. HP 180 → 60-90s vie → ~15 imps + 12 AOE. **Cumul potentiellement injuste** sur path latéral (path 3) qui n'a qu'un tank slot. Le boss volant ne peut être touché que par les ballistas (ranged) et le hero. **Suggéré : aoeBlastMs 7500 (au lieu de 6000) ou réduire summon à imp toutes les 6s**.

## Endless : pacing

- **Tier 0 (waves 1-5)** : intro douce, ratio 1.0 → 1.72. **Trop facile**, gain méta marginal.
- **Tier 1 (6-10)** : assassin + brute apparaissent, ratio 1.9 → 2.62. Pacing OK.
- **Tier 2 (11-15)** : 5 types simultanés, ratio 2.8 → 3.52. **Bon spike de difficulté**.
- **Tier 3 (16-20)** : flyer/imp/shielded mix, ratio 3.7 → 4.42, midboss à wave 19. **Pic de challenge**.
- **Tier 4 (21-30)** : ratio 4.6 → 6.22, midboss tous les 3 waves. **Mur infranchissable** sans build hero perfect (4-5 perks dmg/multishot/pierce).

**Soft cap réaliste** : wave 18-20. Le design implique 30 waves mais le delta spawn rate (480→220ms = -54%) combiné au ratio ×6.4 et SWARM ×1.4 produit une explosion de pression non-linéaire. **L'or de start 200 + slots cumul 575 est sous-dimensionné** — le joueur n'a pas le temps d'amortir 6 slots avant tier 3.

## Top 5 ajustements concrets

1. **Endless : passer ratio de 1+i*0.18 à 1+i*0.14, et spawn rate min de 220→280ms.** Étend le soft cap à wave 24-26 (vs 18-20) et rend le tier 4 jouable. Coût : trivial (1 ligne dans `endless.js`).

2. **`xp_boost` upgrade : passer +10/20/30% à +25/50/100%.** Avec 130 kills/run × 1.0 = 130 XP < 385 XP cumul cap → hero stagne lvl 3-4. Avec ×2.0 lvl 3 → 260 XP, atteint lvl 5. **Débloque vraiment le roguelite layer**. (`metaUpgrades.js` lignes 53-57.)

3. **W2.4 / W3.4 / W4.4 : startCoins +20/+25/+30.** Données actuelles 145/170/210 vs slots 360/440/520. Le delta de 215/270/310¢ est trop large — le joueur ne peut full base level avant wave 4-5. Passer à **165 / 195 / 240** réduit le manque à 195/245/280, plus jouable avec le perk coin_gain.

4. **W2.8 warlord summonCooldownMs : 5000 → 7500, et W4.8 dragon summon : 4500 → 6500.** Réduit la pression de minion-spam pendant la fight boss qui est déjà saturée. Le combo flyer+AOE+summon Dragon est actuellement un exploit de leak.

5. **Slot upgrade costs : passer multipliers de [1, 2, 4] à [1, 1.6, 3].** Actuellement archer 30¢ → 60¢ → 120¢ = 210¢ cumul pour max. Avec 1/1.6/3 : 30/48/90 = 168¢. Rend les upgrades **viables** (actuellement quasi-jamais level 3 avant boss W1). (`Slot.js` ligne 44.)

## Notes

**Décalages détectés** :

- **Bug potentiel** : `BUILD_DRAIN_PER_SEC = 30` (Slot.js). Pour un slot 175¢ (W4.8), faut **5.8s** dans le cercle pour build. Vague active dure ~50-60s. Le joueur doit donc passer ~10% de la wave statique. Acceptable, mais sur slot upgrade lvl 3 à 175×4=700¢ (avec multipliers actuels) → **23s** de drain pour un seul tier 3. Inadéquat.

- **Round-robin paths** : `_spawnEnemy` choisit `pathIdx = Math.random()`. Sur W4.8 avec 3 paths, le path 3 reçoit 33% des spawns mais n'a qu'1 slot tank. Si streak de 5 spawn consécutifs sur path 3 (probabilité ~0.4%, mais arrive sur 6 waves × 50 spawns), **leak garanti**. Préférer un round-robin déterministe ou pondéré par nombre de slots du path.

- **Skins drop > skins achat** : tous les skins drop ont +5% bonus = identique aux skins achat 50-200💎. **Aucun incentive économique à acheter** (le joueur clear les bosses en route). Suggéré : skins achat à **+8%** ou skins exclusifs avec stat unique (multishot fixe, +1 lifesteal) plutôt qu'un % bonus banal.

- **Exploit perk** : `coin_gain` est stackable, +50% par stack. Le perk_reroll lvl 3 propose +3 perks au level-up = quasi-garanti de roll coin_gain × 2-3 fois sur 6 levelups → +150-300% or. **Combo casse** l'économie — le joueur peut full upgrade tous slots wave 3 sur W4.8.

- **Dépendance shielded** : shielded `shieldHP: 4`, blocked uniquement si dot facing > 0 (frontal). Tower placement = lateralOffset 2.4 unités du path → la majorité des tirs sont **latéraux** et bypass le shield. La mécanique "viser de derrière" du briefing est en fait quasi-automatique. **Shielded enemy actuellement under-tuned** — passer shieldHP à 6 ou rendre le shield 360°.

- **gameSpeed 1.3 default** : combiné au SWARM ×1.4 et spawn ×0.75, la pression effective est ~1.3 × 1.4 / 0.75 = **~2.4× vs pré-balance**. C'est sans doute un peu trop pour un public 8 ans (cible Milan). Suggéré : `gameSpeed = 1.15` default, accélération à 1.5/2× sur bouton joueur.

**Fichiers analysés** :
- `/Users/mike/Work/milan project/src-v3/data/levels/world{1,2,3,4}-{1,4,5,8}.js`
- `/Users/mike/Work/milan project/src-v3/data/levels/endless.js`
- `/Users/mike/Work/milan project/src-v3/data/{perks,metaUpgrades,skins}.js`
- `/Users/mike/Work/milan project/src-v3/systems/LevelRunner.js`
- `/Users/mike/Work/milan project/src-v3/entities/{Enemy,Tower,Hero,Slot}.js`
