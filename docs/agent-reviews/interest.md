# Review Identité visuelle & Intérêt

## Verdict global

POST.C transforme le jeu d'une démo grise (cônes verts génériques) en un univers avec une vraie patte stylisée Quaternius — mais le réglage des assets nature n'est pas fini : la Forêt Sombre est noyée sous des arbres twisted rouges géants, et le Volcan/Désert masquent les slots et le path. **Note : 6.5/10.** L'os est très bon, le polish final est à 1-2 sprints d'aboutir.

## Différenciation des 4 mondes

Comparaison directe `post-balance-v1/` (avant POST.C) → `final/` (après) :

| Monde | Avant | Après | Verdict |
|---|---|---|---|
| **Plaine (W1)** | Sol vert + cônes vert sombre identiques | Vert clair + arbres feuillus volumétriques + fleurs jaunes/rouges + rochers + buissons fleuris | **Identité parfaite.** Le screenshot W1-1 final est radicalement plus chaleureux et accueillant. |
| **Forêt (W2)** | Sol vert très sombre + cônes — quasi-identique à W1 mais plus dark | Pins sombres + arbres twisted rouges sang surdimensionnés + champignons | **Identité forte mais cassée par un bug de scale.** Les `nature_twisted1` rouges sang occupent 30-40% de l'écran (W2-1, W2-4, W2-5, W2-8). C'est le défaut visuel #1 du jeu. |
| **Désert (W3)** | Sol ocre + cônes verts (rien à voir avec un désert) | Sol sable + arbres morts noirs squelettes + gros rochers gris + galets | **Très grosse réussite.** Le contraste noir-sur-ocre est immédiatement lisible comme "désert hostile". |
| **Volcan (W4)** | Sol rouge sombre + cônes rouges (incohérent) | Sol rouge brun + arbres morts noirs cendres + rochers, ambiance braise | **Identité réussie mais lisibilité menacée.** Les arbres morts couvrent souvent les slots eux-mêmes. |

**Écart entre les mondes** : avant POST.C, on aurait pu masquer la teinte de fond et confondre W1/W2/W3. Maintenant, un blink test sur 1 frame suffit à dire où on est. Énorme gain narratif.

## Lisibilité gameplay

- **Path** : malgré les 3 couches (bordure foncée, texture pavée, flèches blanches), il **n'est pas visible sur la majorité des screenshots final/** parce que la caméra suit le héros et que le path passe hors-champ ou est masqué par les arbres. À tester en mouvement, mais sur images statiques c'est un signal préoccupant.
- **Slots dorés** : les cercles fins jaunes avec coût `€XX` sont **excellents** — petits, clairs, info-dense. Ne pas y toucher.
- **Hero** : minuscule (knight gris) au centre, parfois noyé dans la végétation (W2-5, W4-1, W4-8). Il faudrait un outline ou un highlight plus marqué.
- **Ennemis** : pas visibles sur les screenshots (pris avant Vague 1). Mais d'après le code, `bodyColor` est appliqué uniformément par type — peu d'identité forme/silhouette, juste teinte. Risque de soupe visuelle en gros packs.
- **Échelle tours ×1.5** : les tours posées sont lisibles. Le héros par contre paraît sous-dimensionné face aux arbres et rochers — mais c'est acceptable pour un top-down Kingshot-like.

## Avant/Après POST.C-D (impact des changes)

| Axe | Avant | Après | Gain |
|---|---|---|---|
| Variété sol/foliage | 2 props max (cône, sol uni) | 6-9 props par theme | **+++** |
| Lecture du monde | "C'est quoi ce niveau ?" | "Désert / Forêt / Volcan évident" | **+++** |
| Path visible | ligne brune simple | bordure + texture pavée + flèches | **++** (mais masqué par decor) |
| Density visuelle | Vide, déprimant | Foisonnant, vivant | **++** |
| Lisibilité slots/hero | Très clean | Encombré par decor | **−** (régression dans W2/W4) |

**Le ROI net est très positif** mais on a sacrifié de la lisibilité. Le tuning manque.

## Top 5 priorités visuelles à fort ROI

1. **Bug critique : clamp scale `nature_twisted1` à 0.3-0.5 et limiter sa fréquence dans la palette `foret`.** Actuellement il est mêlé aux pins (`nature_pine1-3`) avec scale 1.0-1.6 et il fait 5× la taille des pins. Le screenshot W2-1 est inutilisable. (1h de travail, gain énorme)
2. **Carte d'exclusion autour du path et des slots** : `isOnPath()` exclut déjà 4.5 unités², mais les slots + path élargi ne sont pas exclus → propsspawnés dessus. Étendre l'exclusion à 3 unités autour de chaque slot et 4 unités autour du path. (W3-8, W4-1, W4-8 : arbres morts en plein milieu des slots) (2h)
3. **Outline héros / boss** : le système `Outline.js` existe déjà — l'activer sur le héros (cyan) + boss actif (rouge pulsant). Sur les fonds chargés W2/W4, le héros disparaît. (1h)
4. **Tower preview UI** : le panneau jaune flottant (Mage / Tank / Baliste) est verbeux, recouvre la zone de combat (visible sur W2-5, W3-5, W4-8). Le déplacer en HUD fixe (overlay coin haut-droit) ou réduire la taille. (1h)
5. **Path visible en permanence** : ajouter un léger `emissive` sur la texture pavée du path, ou un trim néon discret sur la bordure (couleur theme — doré plaine, vert pâle forêt, rouge ambré volcan). Garantit que le tracé est lu en 0.2s même sous la canopée. (3h)

## Variété intra-monde et rejouabilité

**Faible.** Les 8 niveaux d'un monde partagent strictement la même palette de props (THEME_PALETTE est unique par theme). On voit ça nettement en comparant W1-1 / W1-3 / W1-5 / W1-7 : mêmes arbres, mêmes fleurs, juste positionnés aléatoirement. Idem W3-1 / W3-5 / W3-8.

Pour augmenter la rejouabilité visuelle :
- Ajouter 1-2 props "vedette" par level (ex. W1-4 a une grosse statue, W1-7 une fontaine, W2-3 une cabane abandonnée). Coût : 1 asset + condition de spawn.
- Varier le ratio `bigCount/mediumCount/smallCount` par level (W1-1 = clairière sparse, W1-8 = forêt dense).
- Variation horaire : W1-8 et W4-8 (boss) en sunset (lumière directionnelle orange + bg légèrement teinté).

Actuellement, refaire un niveau pour 3⭐ se fait au son et au gameplay, pas au visuel.

## Identité des boss

D'après le code (`Enemy.js`, `bossOverlay` dans skins) et la spec :

| Boss | Asset | bossOverlay | Mémorabilité |
|---|---|---|---|
| **Brigand pirate (W1-8)** | knight + rouge `#c63a10` | Oui | OK — mais "pirate rouge sur knight" pas évident, on ne lit pas "pirate" |
| **Sorcier de la forêt (W2-8)** | soldier + orange `#ff7a00` | Oui | Faible — "soldier orange" ne lit pas "sorcier", aucun élément magique (aura, robe, staff) |
| **Capitaine Corsaire (W3-8)** | pirate + bleu `#5fbcff` | Oui | Bonne — l'asset pirate Quaternius est reconnaissable, le bleu cyan tranche sur l'ocre |
| **Dragon de Lave (W4-8)** | wizard + or `#ffd23f` | Oui | **Faible** — un wizard volant doré n'est pas un dragon. Manque de gueule de la marque ("dragon" = aile/corne/écaille). |

**Manque général** : aucun boss n'a de **silhouette** différenciante du sbire. Tous reposent sur le scale (1.2-1.5×) et la teinte. Idéalement chaque boss devrait avoir un asset Quaternius dédié (ex. `nature_dragonhead` pour W4-8) ou un overlay particles permanent (aura noire pour Sorcier, brume bleue pour Corsaire, flammes orange pour Dragon).

Le `boss-banner` HTML + `bossBannerFill` est très réussi côté UI — c'est le **modèle 3D** qui pèche.

## Notes

- **Skins génériques** : les 12 skins sont 4 héros + 4 drops boss + 3 castles + 3 vfx. Les 4 drops boss réutilisent les **mêmes assets** que les héros de base (`knight`, `soldier`, `pirate`, `knightgolden`) avec juste un `bossOverlay` couleur. Conséquence : le skin "Pourfendeur du Brigand" est visuellement identique au "Chevalier" base, juste teinté rouge. Pour 50-200💎, c'est très peu satisfaisant. Il faudrait au minimum un cape/heaume distinct, ou un asset différent par drop (Quaternius offre `barbarian`, `paladin`, `ninja`, etc.).
- **Castle skins** : 3 variantes seulement (gris/bleu, bleu/jaune, noir/violet) sur la même géométrie box+cone. Très pauvre. Une simple 4ème variante "tower fortifiée" (cylinder + crenellations) doublerait l'intérêt.
- **VFX skins** : 3 couleurs de particules. Trop minimaliste — devrait inclure forme (étoile, cœur, lightning) en plus de la couleur.
- **Endless** : `endless.png` final est l'un des plus beaux screens — variété + clearings + path lisible (les 4 ennemis ne masquent rien). C'est le seul shot où on a "envie d'y jouer" immédiatement.
- **Cohérence stylistique** : top-down Quaternius low-poly tient globalement, mais les `nature_twisted1` rouge sang ne matchent pas le ton "8 ans cible Milan" — c'est presque horror dans W2-5/W2-8. À retirer ou recolorer en orange automnal.
- **HUD top-bar** : très clean, lisible, identité ronde + dorée cohérente. Ne pas toucher.
- **Damage popups + boss-banner + danger-vignette** : hookés correctement (cf. `main.js:538-546`), mais impossibles à juger sans video. Sur screenshots → invisibles.
