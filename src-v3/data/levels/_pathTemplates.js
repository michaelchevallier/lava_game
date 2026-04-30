// Multi-path templates partagés par les niveaux W3-W4.
// Chaque template renvoie { paths: [[points...], ...] } compatible level.paths.
// Les options (start, exit, span...) permettent de varier le rendu sans re-coder
// la géométrie. Ground = 120×120 ; chemins finissent dans la zone château.

const DEF_EXIT = [2, 0, 6];

function clone(p) { return [p[0], p[1], p[2]]; }

// MERGE Y — 2 entrées opposées (nord/sud) qui convergent vers un point milieu
// puis tronc commun jusqu'à la sortie. Tension : couvrir 2 entrées + 1 tronc.
export function mergeY(opts = {}) {
  const startA = opts.startA || [-22, 0, -10];
  const startB = opts.startB || [-22, 0, 10];
  const merge = opts.merge || [-2, 0, 0];
  const exit = opts.exit || DEF_EXIT;
  return {
    paths: [
      [startA, [-17, 0, -8], [-12, 0, -5], [-7, 0, -3], clone(merge), [0, 0, 2], exit],
      [startB, [-17, 0, 8], [-12, 0, 5], [-7, 0, 3], clone(merge), [0, 0, 2], exit],
    ],
  };
}

// SPLIT V — entrée commune, divergence mid-path, convergence finale.
// Tension : joueur doit deviner où renforcer (ennemis random sur les branches).
export function splitV(opts = {}) {
  const start = opts.start || [-22, 0, 0];
  const split = opts.split || [-8, 0, 0];
  const merge = opts.merge || [4, 0, 2];
  const exit = opts.exit || DEF_EXIT;
  return {
    paths: [
      [start, [-17, 0, 2], [-13, 0, 1], clone(split), [-4, 0, -4], [0, 0, -3], [2, 0, -1], clone(merge), exit],
      [start, [-17, 0, -2], [-13, 0, -1], clone(split), [-4, 0, 4], [0, 0, 5], [2, 0, 4], clone(merge), exit],
    ],
  };
}

// PARALLÈLES + CROSSOVER — 2 lanes qui se croisent au milieu.
// Tension : pas de stratégie lane-locking, ennemis swappent lateralement.
export function parallels(opts = {}) {
  const startA = opts.startA || [-22, 0, -6];
  const startB = opts.startB || [-22, 0, 6];
  const cross = opts.cross || [-3, 0, 0];
  const exit = opts.exit || DEF_EXIT;
  return {
    paths: [
      [startA, [-17, 0, -6], [-12, 0, -5], [-7, 0, -3], clone(cross), [1, 0, 3], [4, 0, 4], exit],
      [startB, [-17, 0, 6], [-12, 0, 5], [-7, 0, 3], clone(cross), [1, 0, -1], [4, 0, 3], exit],
    ],
  };
}

// ENCERCLEMENT — 1 path court direct + 1 long qui contourne par l'extérieur.
// Tension : choisir quelle lane prioriser (le court arrive vite).
export function encirclement(opts = {}) {
  const start = opts.start || [-22, 0, 0];
  const exit = opts.exit || DEF_EXIT;
  const longSwing = opts.longSwing || -12;
  return {
    paths: [
      // Court : ligne quasi-droite vers le château
      [start, [-15, 0, -1], [-9, 0, 0], [-3, 0, 1], [1, 0, 3], exit],
      // Long : descend, contourne, remonte
      [start, [-18, 0, -4], [-13, 0, -7], [-7, 0, longSwing], [0, 0, longSwing], [5, 0, -5], [6, 0, 2], exit],
    ],
  };
}

// SERPENTINE — chemin unique très long en S. Pour W4 + endless.
export function serpentine(opts = {}) {
  const start = opts.start || [-22, 0, -8];
  const exit = opts.exit || DEF_EXIT;
  return {
    paths: [
      [
        start, [-18, 0, -4], [-15, 0, 4], [-12, 0, 8], [-7, 0, 6], [-4, 0, 0],
        [-2, 0, -6], [2, 0, -8], [5, 0, -4], [4, 0, 1], [1, 0, 4], exit,
      ],
    ],
  };
}
