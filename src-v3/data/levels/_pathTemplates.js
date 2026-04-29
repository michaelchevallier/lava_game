// Multi-path templates partagés par les niveaux W3-W4.
// Chaque template renvoie { paths: [[points...], ...] } compatible level.paths.
// Les options (start, exit, span...) permettent de varier le rendu sans re-coder
// la géométrie. Les courbes restent dans la zone constructible (x in [-16,8],
// z in [-9, 9]) et finissent dans la zone château (x>=2, z proche de 5-6).

const DEF_EXIT = [2, 0, 6];

function clone(p) { return [p[0], p[1], p[2]]; }

// MERGE Y — 2 entrées opposées (nord/sud) qui convergent vers un point milieu
// puis tronc commun jusqu'à la sortie. Tension : couvrir 2 entrées + 1 tronc.
export function mergeY(opts = {}) {
  const startA = opts.startA || [-15, 0, -7];
  const startB = opts.startB || [-15, 0, 7];
  const merge = opts.merge || [-2, 0, 0];
  const exit = opts.exit || DEF_EXIT;
  return {
    paths: [
      [startA, [-10, 0, -5], [-6, 0, -2], clone(merge), [0, 0, 2], exit],
      [startB, [-10, 0, 5], [-6, 0, 2], clone(merge), [0, 0, 2], exit],
    ],
  };
}

// SPLIT V — entrée commune, divergence mid-path, convergence finale.
// Tension : joueur doit deviner où renforcer (ennemis random sur les branches).
export function splitV(opts = {}) {
  const start = opts.start || [-15, 0, 0];
  const split = opts.split || [-6, 0, 0];
  const merge = opts.merge || [3, 0, 2];
  const exit = opts.exit || DEF_EXIT;
  return {
    paths: [
      [start, [-11, 0, 1], clone(split), [-3, 0, -3], [1, 0, -2], clone(merge), exit],
      [start, [-11, 0, -1], clone(split), [-3, 0, 3], [1, 0, 4], clone(merge), exit],
    ],
  };
}

// PARALLÈLES + CROSSOVER — 2 lanes qui se croisent au milieu.
// Tension : pas de stratégie lane-locking, ennemis swappent lateralement.
export function parallels(opts = {}) {
  const startA = opts.startA || [-15, 0, -4];
  const startB = opts.startB || [-15, 0, 4];
  const cross = opts.cross || [-2, 0, 0];
  const exit = opts.exit || DEF_EXIT;
  return {
    paths: [
      [startA, [-10, 0, -4], [-6, 0, -2], clone(cross), [1, 0, 3], [3, 0, 4], exit],
      [startB, [-10, 0, 4], [-6, 0, 2], clone(cross), [1, 0, -1], [3, 0, 3], exit],
    ],
  };
}

// ENCERCLEMENT — 1 path court direct + 1 long qui contourne par l'extérieur.
// Tension : choisir quelle lane prioriser (le court arrive vite).
export function encirclement(opts = {}) {
  const start = opts.start || [-15, 0, 0];
  const exit = opts.exit || DEF_EXIT;
  const longSwing = opts.longSwing || -8;
  return {
    paths: [
      // Court : ligne quasi-droite vers le château
      [start, [-9, 0, -1], [-3, 0, 1], [1, 0, 3], exit],
      // Long : descend, contourne, remonte
      [start, [-11, 0, -3], [-7, 0, longSwing], [-1, 0, longSwing], [4, 0, -3], [5, 0, 2], exit],
    ],
  };
}
