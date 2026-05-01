// Multi-path templates partagés par les niveaux W3-W4.
// Chaque template renvoie { paths: [[points...], ...] } compatible level.paths.
// Les options (start, exit, span...) permettent de varier le rendu sans re-coder
// la géométrie. Ground = 120×120 ; chemins finissent dans la zone château.

const DEF_EXIT = [2, 0, 6];

function clone(p) { return [p[0], p[1], p[2]]; }

// MERGE Y — 2 entrées opposées (nord/sud) qui convergent puis tronc commun.
export function mergeY(opts = {}) {
  const startA = opts.startA || [-32, 0, -14];
  const startB = opts.startB || [-32, 0, 14];
  const merge = opts.merge || [-4, 0, 0];
  const exit = opts.exit || DEF_EXIT;
  return {
    paths: [
      [startA, [-26, 0, -12], [-22, 0, -8], [-18, 0, -10], [-14, 0, -6], [-10, 0, -8], [-7, 0, -4], clone(merge), [0, 0, 2], exit],
      [startB, [-26, 0, 12], [-22, 0, 8], [-18, 0, 10], [-14, 0, 6], [-10, 0, 8], [-7, 0, 4], clone(merge), [0, 0, 2], exit],
    ],
  };
}

// SPLIT V — entrée commune, divergence en zigzag, convergence finale.
export function splitV(opts = {}) {
  const start = opts.start || [-32, 0, 0];
  const split = opts.split || [-10, 0, 0];
  const merge = opts.merge || [4, 0, 2];
  const exit = opts.exit || DEF_EXIT;
  return {
    paths: [
      [start, [-28, 0, 4], [-24, 0, -2], [-20, 0, 6], [-15, 0, 1], clone(split), [-4, 0, -8], [-1, 0, -4], [2, 0, -7], [3, 0, -2], clone(merge), exit],
      [start, [-28, 0, -4], [-24, 0, 2], [-20, 0, -6], [-15, 0, -1], clone(split), [-4, 0, 8], [-1, 0, 4], [2, 0, 7], [3, 0, 2], clone(merge), exit],
    ],
  };
}

// PARALLÈLES + CROSSOVER — 2 lanes serpentines qui se croisent.
export function parallels(opts = {}) {
  const startA = opts.startA || [-32, 0, -10];
  const startB = opts.startB || [-32, 0, 10];
  const cross = opts.cross || [-4, 0, 0];
  const exit = opts.exit || DEF_EXIT;
  return {
    paths: [
      [startA, [-26, 0, -8], [-22, 0, -12], [-17, 0, -6], [-13, 0, -10], [-9, 0, -4], clone(cross), [-1, 0, 4], [3, 0, 6], exit],
      [startB, [-26, 0, 8], [-22, 0, 12], [-17, 0, 6], [-13, 0, 10], [-9, 0, 4], clone(cross), [-1, 0, -3], [3, 0, 5], exit],
    ],
  };
}

// ENCERCLEMENT — 1 court + 1 long qui contourne avec maze loops.
export function encirclement(opts = {}) {
  const start = opts.start || [-32, 0, 0];
  const exit = opts.exit || DEF_EXIT;
  const longSwing = opts.longSwing || -16;
  return {
    paths: [
      // Court : zigzag court mais avec quelques détours
      [start, [-26, 0, 2], [-22, 0, -2], [-17, 0, 1], [-12, 0, -1], [-7, 0, 2], [-3, 0, 0], [1, 0, 3], exit],
      // Long : maze descendant, contournement, remontée serpentine
      [start, [-28, 0, -4], [-24, 0, -8], [-20, 0, -12], [-14, 0, longSwing], [-7, 0, longSwing], [-1, 0, longSwing + 3], [4, 0, -10], [7, 0, -4], [6, 0, 2], exit],
    ],
  };
}

// SERPENTINE — chemin unique LONG en S serré (maze feel). Pour W4+ et endless.
export function serpentine(opts = {}) {
  const start = opts.start || [-32, 0, -12];
  const exit = opts.exit || DEF_EXIT;
  return {
    paths: [
      [
        start,
        [-28, 0, -10], [-24, 0, -6], [-22, 0, 0], [-20, 0, 8], [-16, 0, 12],
        [-12, 0, 10], [-10, 0, 4], [-12, 0, -2], [-9, 0, -8], [-5, 0, -12],
        [0, 0, -10], [4, 0, -6], [6, 0, -2], [4, 0, 2], [1, 0, 4], exit,
      ],
    ],
  };
}

// MAZE — 2 chemins ultra serpentins avec cross loops, end-game W4-7/W4-8 only.
export function maze(opts = {}) {
  const exit = opts.exit || DEF_EXIT;
  return {
    paths: [
      [
        [-34, 0, -10], [-30, 0, -6], [-28, 0, -10], [-24, 0, -8], [-22, 0, -12],
        [-18, 0, -10], [-16, 0, -4], [-12, 0, -8], [-10, 0, -2], [-6, 0, -6],
        [-4, 0, 0], [-6, 0, 4], [-2, 0, 6], [2, 0, 4], exit,
      ],
      [
        [-34, 0, 10], [-30, 0, 6], [-28, 0, 10], [-24, 0, 8], [-22, 0, 12],
        [-18, 0, 10], [-16, 0, 4], [-12, 0, 8], [-10, 0, 2], [-6, 0, 6],
        [-4, 0, 0], [-6, 0, -4], [-2, 0, -2], [2, 0, 4], exit,
      ],
    ],
  };
}

// MAZE XXL — path programmatic serpentine pour map 240u (path ~150-200u).
// 6-8 rooms × 5 waypoints zigzag par room → path total ~150-200u sur ground 240u.
export function mazeXXL(opts = {}) {
  const rooms = opts.rooms || 7;
  const startX = opts.startX || -110;
  const endX = opts.endX || 0;
  const ampZ = opts.ampZ || 30;
  const exit = opts.exit || [2, 0, 6];
  const pts = [];
  const stepX = (endX - startX) / rooms;
  for (let r = 0; r < rooms; r++) {
    const x0 = startX + r * stepX;
    const dir = r % 2 === 0 ? 1 : -1;
    pts.push([x0, 0, dir * ampZ * 0.3]);
    pts.push([x0 + stepX * 0.2, 0, -dir * ampZ * 0.7]);
    pts.push([x0 + stepX * 0.45, 0, dir * ampZ * 0.5]);
    pts.push([x0 + stepX * 0.7, 0, -dir * ampZ * 0.4]);
    pts.push([x0 + stepX * 0.9, 0, dir * ampZ * 0.2]);
  }
  pts.push([1, 0, 3]);
  pts.push(exit);
  return { paths: [pts] };
}

// MEGA-MAZE — chemin extrêmement long en zigzag-spirale pour endless/W4-final.
// Génère programmatiquement N "rooms" zigzag chained pour avoir une path sur ~300u.
export function megaMaze(opts = {}) {
  const exit = opts.exit || DEF_EXIT;
  const rooms = opts.rooms || 6;
  const startX = opts.startX || -120;
  const endX = opts.endX || 0;
  const ampZ = opts.ampZ || 32;
  const points = [];
  const stepX = (endX - startX) / rooms;
  for (let r = 0; r < rooms; r++) {
    const x0 = startX + r * stepX;
    const x1 = startX + (r + 1) * stepX;
    const dirSign = r % 2 === 0 ? 1 : -1;
    // zigzag inside the room: 4 waypoints
    points.push([x0, 0, dirSign * ampZ * 0.3]);
    points.push([x0 + stepX * 0.25, 0, -dirSign * ampZ * 0.7]);
    points.push([x0 + stepX * 0.5, 0, dirSign * ampZ * 0.5]);
    points.push([x0 + stepX * 0.75, 0, -dirSign * ampZ * 0.4]);
    points.push([x1, 0, dirSign * ampZ * 0.2]);
  }
  // Final approach
  points.push([endX + 1, 0, 3]);
  points.push(exit);
  return { paths: [points] };
}
