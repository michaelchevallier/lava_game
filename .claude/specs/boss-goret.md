# Spec — Boss Goret (round 3 backlog final, 5/5)

> Fichier écrit pour compatibilité workflow (cf. `/Users/mike/.claude/plans/`). Copie identique conseillée
> dans `.claude/specs/boss-goret.md` côté repo si le workflow historique l'utilise (voir autres specs :
> `parade-qte.md`, `reparation-express.md`, `aire-tir-mobile.md`).

## 1. Contexte

Backlog CLAUDE.md :
> "tous 4min cochon rose fonce sur wagon le + chargé, jet de pièces pour vaincre +250pts + 2 tiles rares drop"

Dernier des 5 backlogs round 3 (parade-qte = 8acc407, réparation-express = spec existant, aire-tir-mobile = spec existant). Objectif : mini-boss visuel qui traverse le parc et menace le wagon le plus chargé — le joueur doit réagir en "jetant" 3 pièces (hitmarkers auto-aim parabolic) pour neutraliser avant impact.

Pattern référent :
- **`createReparationExpress`** (src/reparation-express.js, 186 L) — factory `k.loop(0.5, checkTick)` + `active` state + spawn/cleanup + `__debug()` via `window.__reparation`.
- **`createSkullStand`** (src/skull-stand.js, 413 L) — spawn auto entities avec `onUpdate`, spawnDart (parabole calculée analytiquement dx/dy), `k.onCollide("dart", "duck-stand", …)`.
- **`createParadeQTE`** (src/parade-qte.js, 172 L) — `getActivePlayers()` injection via `main.js`, `showPopup`, `audio.combo`, `k.isKeyPressed` sur `p.parryKeys`.
- **Train Fantôme** (main.js L740-753) + **Inverse Apocalypse Train** (main.js L755-774) — pattern `k.loop(N, () => {...})` avec gate `if (k.time() < cooldown) return;` et `hasTrainEvent` check.

## 2. Fichiers impactés

| Fichier | Ranges | Action |
|---|---|---|
| **`src/boss-goret.js`** (NEW, ~250-300 L) | — | Factory `createBossGoret({…})` |
| `src/sprites.js` | L1-50 + L1131-1180 (`loadAllSprites`) | + `SPR_BOSS_GORET` (20×14 rows) + `SPR_BOSS_GORET_WALK` (2e frame) + 2 lignes `k.loadSprite("boss_goret_a"/"boss_goret_b", …)` |
| `src/main.js` | L54 (import), L572-575 (instanciation après `createReparationExpress`) | import `createBossGoret`; gate campaign ; passer `getWagons`, `getActivePlayers`, `placeTile`, `audio`, `showPopup`, `gameState`, `juice`, `WIDTH`, `HEIGHT`, `TILE`, `GROUND_ROW` |
| `src/players.js` | L267-273 (handler `opts.keys.board`) | insérer `if (window.__bossGoret?.tryThrowCoin?.(p)) return;` avant `tryBoardWagon` |
| `src/audio.js` | L115-116 (fin export) | + `boss: () => { beep(110, 0.4, "sawtooth", 0.16, 60); noise(0.3, 0.12); }` (1 ligne utile) |
| `src/constants.js` | éventuel | rien (pas de nouvelle tile, on réutilise `portal` et `trampoline` pour le drop) |

Pas de touche clavier nouvelle : on réutilise `board` (E/O) quand un joueur a une pièce en poche ET qu'un Boss est actif. Priorité d'interception **avant** `tryRepair` / `tryFire` / `tryBoardWagon` pour que le jet de pièce prime si Boss présent.

## 3. Comportement attendu

1. Toutes les 4 min (240 s ±20 s jitter), un **Boss Goret** apparaît depuis le bord gauche ou droit (50/50), aligné au sol.
2. Warm-up : **pas avant 60 s** de scène. Cooldown suspendu si `ghostTrain` ou `inverseTrain` actif.
3. Le Boss cible **le wagon le plus chargé** au moment du spawn (score = nb passagers humains × 2 + nb passagers skeleton + (wagon.isGolden ? 5 : 0)). Il fonce **horizontalement** à 180 px/s vers lui (no tracking — sa cible est fixée au spawn, mais sa direction x peut s'inverser si le wagon le dépasse → simple lock sur `targetX = wagon.pos.x + 30`).
4. Le Boss a 3 HP. Aucun ciblage par click : le joueur appuie sur **board** (E Mario / O Pika) quand il a ≥ 1 pièce en poche → lance automatiquement une pièce parabolique vers le Boss (auto-aim).
5. La pièce est collectée en passant dessus (pickup au contact d'un coin placé dans le parc) dans la limite `p._coinsPocket ≤ 3`. Visuel : 3 petits cercles jaunes au-dessus de la tête du joueur.
6. Chaque pièce qui touche la hitbox du Boss fait −1 HP + flash blanc + 15 particules roses. Au **3e hit** : Boss vaincu, explose en 30 particules roses, +250 pts au tueur, +50 pts bonus à tous les joueurs à l'écran, audio apocalypse, 2 tiles rares spawn au sol : **portal** + **trampoline** (placées aux 2 tiles juste au-dessus de `GROUND_ROW` autour du Boss, si occupées → 1 colonne à gauche/droite jusqu'à trouver un slot libre).
7. Si le Boss atteint le wagon cible (collision rect ↔ rect à 48 px) **avant** les 3 hits : wagon **STUN 3 s** (multiplicateur vitesse ×0.2 via `wagon.frozenUntil = k.time() + 3`), −50 pts au score global, popup `BOSS GORET !` taille 36 rouge. Le Boss **fuit** ensuite vers le bord opposé (inversion direction x). S'il sort du monde : pas de drop, cooldown de **2 min** au lieu de 4 (pour "revenge round").
8. Désactivé si `router.get().mode === "campaign"`.
9. Debug : `window.__bossGoret.__debug()` → `{ active, hp, position:{x,y}, cooldown, targetWagonId }`.
10. Audio : `audio.boss()` au spawn (grognement), `audio.hit()` à chaque pièce reçue (ou `audio.crack()`), `audio.apocalypse?.() || audio.combo()` à la victoire.

## 4. Pseudo-code des fixes

### 4.1 Sprite Boss Goret (src/sprites.js, ~L600)

```js
// Boss Goret 20×14 — cochon rose vif profil vers droite, yeux rouges, museau gris
const SPR_BOSS_GORET_A = [
  "....................",
  "....PPPPPPPPPP......",
  "...PPPPPPPPPPPPP....",
  "..PPppPPPPPPPPPPPP..",
  "..PPppPPPPPPPPPPPP..",
  "..PPPPPPRKPPPKKPPn..",  // oeil rouge + museau dark
  "..PPPPPPPKPPPKKPnn..",
  "..PPPPPPPPPPPPnnnn..",
  "...PPPPPPPPPPPPPP...",
  "...PP..PP...PP..PP..",  // 4 pattes frame A
  "...PP..PP...PP..PP..",
  "...BB..BB...BB..BB..",
  "....................",
  "........pPP.........",  // queue tire-bouchon
];
// Frame B — pattes décalées pour marche (swap gauche/droite)
const SPR_BOSS_GORET_B = [ /* idem mais jambes en stride inverse */ ];
// loadAllSprites: + k.loadSprite("boss_goret_a", makeSpriteUrl(SPR_BOSS_GORET_A, 2)),
//                 + k.loadSprite("boss_goret_b", makeSpriteUrl(SPR_BOSS_GORET_B, 2)),
```
Palette déjà dispo : `P/p` rose, `R` rouge, `K` noir, `n` gris, `B/b` marron.

### 4.2 Factory src/boss-goret.js (squelette)

```js
import { TILE, GROUND_ROW, WIDTH } from "./constants.js";

export function createBossGoret({
  k, audio, gameState, juice, showPopup, placeTile, tileMap,
  getActivePlayers, getWagons, isCampaign,
}) {
  if (isCampaign?.()) return { tryThrowCoin: () => false, __debug: () => ({ active: false }) };

  let active = null;
  let nextSpawnAt = k.time() + 60 + Math.random() * 10; // warm-up 60s
  const SPAWN_COOLDOWN = 240;
  const RETRY_COOLDOWN = 120;

  function scoreWagon(w) {
    if (!w.passengers) return 0;
    const humans = w.passengers.filter(p => p.type === "human").length;
    const skels = w.passengers.filter(p => p.type === "skeleton").length;
    return humans * 2 + skels + (w.isGolden ? 5 : 0);
  }

  function pickTargetWagon() {
    const wagons = getWagons().filter(w => !w.ghostTrain && !w.inverseTrain && !w.isSpectral);
    if (wagons.length === 0) return null;
    wagons.sort((a, b) => scoreWagon(b) - scoreWagon(a));
    return wagons[0];
  }

  function spawnBoss() {
    const target = pickTargetWagon();
    if (!target) { nextSpawnAt = k.time() + 15; return; }
    const fromLeft = Math.random() < 0.5;
    const startX = fromLeft ? -60 : WIDTH + 60;
    const dir = fromLeft ? 1 : -1;
    const y = (GROUND_ROW - 1) * TILE - 4;

    const boss = k.add([
      k.sprite("boss_goret_a"),
      k.pos(startX, y),
      k.area({ shape: new k.Rect(k.vec2(0,0), 40, 28) }),
      k.anchor("topleft"),
      k.z(7),
      "boss-goret",
      { hp: 3, dir, targetWagon: target, fleeing: false, frame: 0, _flashUntil: 0 },
    ]);

    boss.onUpdate(() => {
      boss.frame = Math.floor(k.time() / 0.15) % 2;
      boss.sprite = boss.frame === 0 ? "boss_goret_a" : "boss_goret_b";
      if (boss._flashUntil > k.time()) boss.color = k.rgb(255,255,255);
      else boss.color = k.rgb(255,255,255); // tint normal

      const speed = boss.fleeing ? 260 : 180;
      boss.pos.x += boss.dir * speed * k.dt();
      if (boss.pos.x < -120 || boss.pos.x > WIDTH + 120) {
        if (!boss.fleeing) endBoss(false, null); // vaincu ? non → jamais atteint la cible
        else endBoss(true, null); // fuite complète
        k.destroy(boss);
      }
    });

    boss.onCollide("wagon", (w) => {
      if (boss.fleeing) return;
      if (w !== boss.targetWagon) return;
      w.frozenUntil = k.time() + 3;
      gameState.score = Math.max(0, gameState.score - 50);
      showPopup(WIDTH / 2, 120, "BOSS GORET !", k.rgb(255, 60, 60), 36);
      juice.dirShake(boss.dir, 0, 10, 0.3);
      audio.transform();
      boss.fleeing = true;
      boss.dir = -boss.dir;
    });

    active = { boss, spawnAt: k.time() };
    audio.boss?.() || audio.hit?.();
    showPopup(boss.pos.x + 20, boss.pos.y - 20, "BOSS GORET !", k.rgb(255,80,180), 28);
  }

  function hitBoss(fromPlayer) {
    if (!active) return;
    const b = active.boss;
    b.hp -= 1;
    b._flashUntil = k.time() + 0.15;
    audio.crack?.() || audio.hit?.();
    // particules roses
    for (let i = 0; i < 15; i++) {
      const a = (Math.PI * 2 * i) / 15;
      k.add([
        k.circle(2 + Math.random() * 2),
        k.pos(b.pos.x + 20, b.pos.y + 14),
        k.color(k.rgb(255, 100 + Math.random()*80, 200)),
        k.opacity(1), k.lifespan(0.5, { fade: 0.3 }), k.z(14),
        "particle-grav",
        { vx: Math.cos(a) * 80, vy: Math.sin(a) * 80 - 30, grav: 200 },
      ]);
    }
    if (b.hp <= 0) endBoss(true, fromPlayer);
  }

  function endBoss(vaincu, byPlayer) {
    if (!active) return;
    const b = active.boss;
    if (vaincu && byPlayer) {
      gameState.score += 250;
      showPopup(b.pos.x + 20, b.pos.y - 40, "+250 BOSS VAINCU !", k.rgb(255, 80, 180), 30);
      audio.apocalypse?.() || audio.combo?.();
      // bonus +50 pour chaque joueur à l'écran
      for (const p of getActivePlayers()) {
        if (!p?.exists?.() || p.isSkeleton) continue;
        if (p.pos.x > 0 && p.pos.x < WIDTH) {
          gameState.score += 50;
          showPopup(p.pos.x + 14, p.pos.y - 50, "+50 BONUS", k.rgb(120, 220, 255), 18);
        }
      }
      // drop 2 tiles rares
      dropRareTiles(b.pos.x, b.pos.y);
      nextSpawnAt = k.time() + SPAWN_COOLDOWN + (Math.random() - 0.5) * 40;
    } else {
      // fuite non-récompensée : respawn court 2 min
      nextSpawnAt = k.time() + RETRY_COOLDOWN;
    }
    if (b.exists?.()) k.destroy(b);
    active = null;
  }

  function dropRareTiles(x, y) {
    const DROPS = ["portal", "trampoline"];
    const col0 = Math.floor((x + 20) / TILE);
    const row = GROUND_ROW - 1;
    for (let i = 0; i < DROPS.length; i++) {
      for (let offset = 0; offset < 5; offset++) {
        const col = col0 + (i === 0 ? -1 : 1) + (i === 0 ? -offset : offset);
        const key = `${col},${row}`;
        if (!tileMap.has(key)) { placeTile(col, row, DROPS[i]); break; }
      }
    }
  }

  function tryThrowCoin(p) {
    if (!active) return false;
    if (!p._coinsPocket || p._coinsPocket <= 0) return false;
    if (p.isSkeleton) return false;
    if (p.stunnedUntil && k.time() < p.stunnedUntil) return false;
    p._coinsPocket -= 1;
    spawnCoinProjectile(p, active.boss);
    return true;
  }

  function spawnCoinProjectile(from, boss) {
    const ox = from.pos.x + 14;
    const oy = from.pos.y + 10;
    const tx = boss.pos.x + 20;
    const ty = boss.pos.y + 14;
    const dx = tx - ox; const dy = ty - oy;
    const t = Math.max(0.25, Math.abs(dx) / 400);
    const GRAV = 400;
    const vx0 = dx / t;
    const vy0 = dy / t - 0.5 * GRAV * t;
    const proj = k.add([
      k.circle(5),
      k.pos(ox, oy),
      k.area({ shape: new k.Rect(k.vec2(-5,-5), 10, 10) }),
      k.color(k.rgb(255, 220, 60)),
      k.outline(1, k.rgb(180, 130, 0)),
      k.z(14),
      "boss-coin",
      { vx: vx0, vy: vy0, life: 0, thrower: from },
    ]);
    proj.onUpdate(() => {
      proj.life += k.dt();
      proj.pos.x += proj.vx * k.dt();
      proj.pos.y += proj.vy * k.dt();
      proj.vy += GRAV * k.dt();
      if (proj.life > 1.5) k.destroy(proj);
    });
    audio.coin?.();
  }

  k.onCollide("boss-coin", "boss-goret", (coin, b) => {
    k.destroy(coin);
    hitBoss(coin.thrower);
  });

  // Pickup pièces dans la poche
  k.loop(0.1, () => {
    for (const p of getActivePlayers()) {
      if (!p?.exists?.() || p.isSkeleton) continue;
      if ((p._coinsPocket || 0) >= 3) continue;
      for (const c of k.get("coin")) {
        if (c._pocketed) continue;
        const dx = c.pos.x - (p.pos.x + 14);
        const dy = c.pos.y - (p.pos.y + 22);
        if (dx*dx + dy*dy < 18*18) {
          c._pocketed = true;
          p._coinsPocket = (p._coinsPocket || 0) + 1;
          audio.pop?.();
          if (c.exists?.()) k.destroy(c);
        }
      }
    }
  });

  function checkTick() {
    const now = k.time();
    if (active) return;
    if (now < nextSpawnAt) return;
    const hasTrainEvent = getWagons().some(w => w.ghostTrain || w.inverseTrain);
    if (hasTrainEvent) { nextSpawnAt = now + 10; return; }
    spawnBoss();
  }
  k.loop(0.5, checkTick);

  const api = {
    tryThrowCoin,
    __debug: () => ({
      active: !!active,
      hp: active?.boss?.hp || 0,
      position: active?.boss ? { x: active.boss.pos.x, y: active.boss.pos.y } : null,
      cooldown: Math.max(0, nextSpawnAt - k.time()),
      targetWagonId: active?.boss?.targetWagon ? "wagon" : null,
    }),
  };
  return api;
}
```

### 4.3 Hook draw poche pièces dans players.js (onDraw existant L167-186)

```js
// Dans p.onDraw (L167) après le stun rendering :
const pocket = p._coinsPocket || 0;
if (pocket > 0 && !p.ridingWagon) {
  for (let i = 0; i < pocket; i++) {
    k.drawCircle({
      pos: k.vec2(14 - (pocket - 1) * 4 + i * 8, -20),
      radius: 3,
      color: k.rgb(255, 220, 60),
      outline: { color: k.rgb(180, 130, 0), width: 1 },
    });
  }
}
```

### 4.4 Instanciation main.js

```js
// Dans main.js après createReparationExpress (~L575)
if (router.get().mode !== "campaign") {
  const bossGoret = createBossGoret({
    k, audio, gameState, juice,
    showPopup: (...args) => showPopup(...args),
    placeTile, tileMap,
    getActivePlayers: () => activePlayers,
    getWagons: () => k.get("wagon"),
    isCampaign: () => router.get().mode === "campaign",
  });
  window.__bossGoret = bossGoret;
}
```

### 4.5 Gate `opts.keys.board` dans players.js (L267-273)

```js
k.onKeyPress(opts.keys.board, () => {
  if (p.stunnedUntil && k.time() < p.stunnedUntil) return;
  if (window.__bossGoret?.tryThrowCoin?.(p)) return;   // ← NEW, priorité haute
  if (window.__reparation?.tryRepair?.(p)) return;
  if (window.__skullStand?.tryFire?.(p)) return;
  if (p.ridingWagon) exitWagon(p);
  else tryBoardWagon(p);
});
```

## 5. Critères de succès

- [ ] `window.__bossGoret.__debug()` retourne `{active:false, cooldown: >0}` au démarrage, puis `active:true` ~60s après.
- [ ] Test live : spawn Boss force via `window.__bossGoret` (ajouter `__forceSpawn: () => spawnBoss()` si besoin debug).
- [ ] Les 2 frames marche alternent (visuellement pattes bougent 2 positions).
- [ ] Jet de pièce : ramasser une pièce (au sol via outil `coin` placée) → `p._coinsPocket` passe à 1 → 3 petites boules jaunes au-dessus du joueur → presser E/O → projectile parabolique auto-aim vers Boss → Boss −1 HP + flash blanc 150 ms + particules roses.
- [ ] 3 hits → Boss explose (+250 au tueur, +50 à chaque joueur actif on-screen), 2 tiles (portal + trampoline) apparaissent sur la ligne GROUND_ROW-1 aux abords du Boss.
- [ ] Si Boss atteint le wagon cible avant 3 hits : wagon se déplace ~0.2× vitesse durant 3 s, popup `BOSS GORET !` rouge, −50 pts, Boss fuit vers bord opposé à 260 px/s.
- [ ] Mode campagne : `window.__bossGoret` existe mais `__debug().active` reste false éternellement (factory court-circuitée).
- [ ] Pas de `console.log` / `console.error` rouges en prod.
- [ ] FPS stable ≥ 55 même durant spawn + 3 wagons + cascade de pièces.
- [ ] Bundle gz ≤ 103.5 KB (actuel 101.63, budget +1.87 KB réel).
- [ ] `npm run build` passe.
- [ ] `k.get("*").length` après kill Boss ne grimpe pas (particules/coins nettoyés).
- [ ] `wagon.frozenUntil` déjà géré dans wagons.js L350 → `speedMult *= 0.35` déjà appliqué, aucun ajout nécessaire côté wagons.

## 6. Effort estimé — 2 commits atomiques

### Commit 1 : `feat(boss): squelette Boss Goret — sprite + spawn/move + collision wagon (stun)`

Fichiers :
- `src/sprites.js` : + 2 sprites + 2 `loadSprite`
- `src/boss-goret.js` (NEW) : tout sauf la logique pièce-projectile / pickup poche / drop tiles — livrer `spawnBoss`, `endBoss(false)` (timeout ou fuite), `collide wagon → stun`, `checkTick`, `__debug`.
- `src/main.js` : import + instanciation gated + `window.__bossGoret`
- `src/audio.js` : + `boss()`

Livre un Boss qui apparaît, marche, tamponne 1 wagon et fuit. Pas encore tuable.

**Test** : `window.__bossGoret.__debug()` → active true après 60s, voir cochon traverser, toucher wagon = stun visible, popup rouge, boss s'en va.

### Commit 2 : `feat(boss): mécanique jet de pièces + victoire + drop 2 tiles rares`

Fichiers :
- `src/boss-goret.js` : + `tryThrowCoin`, `spawnCoinProjectile`, pickup `k.loop(0.1)`, `hitBoss`, `endBoss(true, player)`, `dropRareTiles`, `k.onCollide("boss-coin", "boss-goret", …)`.
- `src/players.js` : gate dans `opts.keys.board` handler (L267) + draw poche dans `onDraw` (L167).

**Test** : poser 3 pièces avec outil coin, les ramasser (voir 3 boules jaunes), attendre Boss, presser E → projectile touche → −1 HP → 3 hits → explosion + 250pts + 2 tiles apparaissent.

### Ordre recommandé

1. Commit 1 (sprite + spawn/collision)
2. Build + test live (Chrome MCP si dispo)
3. Commit 2 (jet + victoire)
4. Build + test complet (scénario end-to-end)
5. Push (auto-deploy CI)

## 7. Risques & mitigations

| Risque | Mitigation |
|---|---|
| **Collision circulaire wagon ↔ boss double-fire** (les 2 hitboxes se touchent plusieurs frames) | Gate `if (boss._stunnedWagonOnce) return;` dans handler `onCollide("wagon")` ; set à true après 1er contact. |
| **KAPLAY pitfall `frame`/`animFrame` property** | Utiliser `boss.frame` custom ET `boss.sprite = "boss_goret_a"/"b"` avec swap direct (pas `boss.use(k.sprite())`). Pattern déjà validé dans wagons.js L436-437. |
| **`opts.keys.board` conflict avec embarquement wagon** | Le check `tryThrowCoin` return true ⇒ short-circuit tryBoard. Si joueur veut monter dans wagon alors qu'il a des pièces → il jette d'abord. Documenter dans tooltip. Alternative : seuillé à 1 pièce min (déjà fait). Si trop gênant, gate par "Boss doit être actif" (déjà fait dans `tryThrowCoin` : `if (!active) return false;`). Donc **pas de conflit hors combat**. |
| **Bundle +2.5 KB cap dur 103.5 KB** | Sprite 20×14 = 280 chars × 2 frames = ~600 chars ASCII + 2 `loadSprite`. Factory ~250 L JS = ~6 KB minifié ~2 KB gz. Safe. Si overshoot → sprite minimal géométrique (drawCircle rose 24 + drawRect museau gris + 2 pts rouges) en remplaçant `k.sprite` par `onDraw`. |
| **`placeTile` si slot déjà pris** | Boucle `for (let offset = 0; offset < 5; offset++)` cherche cols libres ; si aucun en 5 cols → skip ce drop (silencieux). |
| **Boss spawn pendant mode course F2** | La course utilise `cfg.enableRace` mais pas un flag global. Ajouter `if (window.__race?.isActive?.()) return;` dans `checkTick` si besoin — à évaluer en test. Sinon ignorer : 2 wagons course déjà des cas spéciaux (`isRace`). Le `scoreWagon` les inclut potentiellement, filtrer aussi `!w.isRace`. |
| **`wagon.frozenUntil` stun** | Déjà appliqué dans wagons.js L350 `if (frozen) speedMult *= 0.35`. **Check: 0.35 ≠ 0.2 du spec**. Soit : (a) accepter 0.35 (déjà OK pour sensation "ralenti sévère"), (b) ajouter `wagon.bossStunUntil` distinct avec mult 0.2. **Recommandation** : (a) réutiliser `frozenUntil` pour simplicité ; mettre à jour la spec UX = "ralenti 3s". |
| **Pickup pièce collision avec collectCoin auto des wagons** | `c._pocketed = true` avant destroy. Si wagon passe pendant la loop 0.1, race condition possible. Mitigation : check `if (c._pocketed || c.magnetLocked) continue;` dans wagon-collisions.js handler coin (déjà filter magnet). Risque acceptable — fallback : la pièce disparaît, pas de double-count. |
| **Pas de `getWagons` exposé** | `k.get("wagon")` suffit, injecter `getWagons: () => k.get("wagon")` depuis main.js. |
| **Train Fantôme spawn pendant Boss actif** | Boss continue sa course. `hasTrainEvent` dans `checkTick` évite le **spawn** d'un nouveau Boss mais pas la cohabitation. Acceptable gameplay. |
| **Campaign bypass** | `if (isCampaign?.()) return { tryThrowCoin: () => false, __debug: () => ({active:false}) };` dès début factory. Symétrique au skull-stand. |

## 8. Test plan

### Unit (manual via console)

```js
// 1. Spawn immédiat
window.__bossGoret.__debug()  // attendre active:false, cooldown décroît
// Force : ajouter __forceSpawn en debug et call
window.__bossGoret.__forceSpawn?.()  // boss apparaît

// 2. Pickup pièce
window.__k.get("player")[0]._coinsPocket = 3  // bypass pickup
// voir 3 boules jaunes dessiner au-dessus du joueur

// 3. Jet
// Appuyer E (Mario) → projectile jaune parabolique vers boss
// 3 hits → explosion + 2 tiles apparaissent au sol

// 4. Stun wagon
// Ne rien faire → boss touche wagon le + chargé → popup BOSS GORET! + wagon ralenti 3s

// 5. Fuite sortie
// Laisser Boss fuir après stun → sort écran → __debug().cooldown = 120s (pas 240)
```

### Scénarios live à valider

1. **Sandbox 2P** : 240s d'attente → Boss apparaît.
2. **Wagon doré** : doit être prioritaire cible (scoreWagon +5).
3. **Ghost train actif** : pas de Boss spawn pendant (hasTrainEvent).
4. **Campaign** : `window.__bossGoret.__debug().active` reste false.
5. **Mode race** : Boss ne spawn pas (filter `!w.isRace`) ou ignore les wagons race.
6. **3 hits rapprochés < 1s** : no double-destroy, 1 seul endBoss.
7. **Mobile P1** : la touche `E` mobile (button `mc-wagon` ?) — NB : mobile n'a pas de dédié. Accepté, mobile fallback → boss écrase wagon.

## 9. Décompte

| Métrique | Estimation |
|---|---|
| Lignes `src/boss-goret.js` | ~280 L |
| Lignes modifiées ailleurs | ~35 L (sprites +20, main +10, players +5, audio +1) |
| Bundle gz delta | +1.8 KB (sous cap 103.5) |
| Commits | 2 |
| Temps dev Sonnet | ~15-20 min |

