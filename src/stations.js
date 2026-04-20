// Gares décor aux bords du monde — purement visuel, zéro gameplay.
// ENTREE à gauche (-TILE*4), SORTIE à droite (WORLD_WIDTH + TILE*1).

export function createStations({ k, WORLD_WIDTH, TILE, GROUND_ROW }) {
  const groundY = GROUND_ROW * TILE;
  const stationY = groundY - TILE * 3;
  const STATION_COLOR = k.rgb(150, 80, 40);
  const ROOF_COLOR = k.rgb(200, 60, 60);
  const POLE_OUTLINE = k.rgb(60, 30, 15);
  const SIGN_COLOR = k.rgb(255, 240, 200);
  const SIGN_OUTLINE = k.rgb(80, 50, 20);
  const ROOF_OUTLINE = k.rgb(80, 20, 20);

  for (const side of ["left", "right"]) {
    const baseX = side === "left" ? -TILE * 4 : WORLD_WIDTH + TILE * 1;
    const label = side === "left" ? "ENTREE" : "SORTIE";
    const labelColor = side === "left" ? k.rgb(100, 220, 100) : k.rgb(220, 100, 100);
    // Toit rouge
    k.add([
      k.rect(TILE * 3, 10),
      k.pos(baseX, stationY - 14),
      k.color(ROOF_COLOR),
      k.outline(2, ROOF_OUTLINE),
      k.z(-9),
    ]);
    // 2 poteaux verticaux
    for (const px of [baseX + 4, baseX + TILE * 3 - 10]) {
      k.add([
        k.rect(6, TILE * 3),
        k.pos(px, stationY - 4),
        k.color(STATION_COLOR),
        k.outline(1, POLE_OUTLINE),
        k.z(-9),
      ]);
    }
    // Panneau beige
    k.add([
      k.rect(TILE * 2.6, 16),
      k.pos(baseX + TILE * 0.2, stationY + 4),
      k.color(SIGN_COLOR),
      k.outline(2, SIGN_OUTLINE),
      k.z(-8),
    ]);
    // Texte panneau
    k.add([
      k.pos(baseX + TILE * 1.5, stationY + 12),
      k.anchor("center"),
      k.z(-7),
      {
        draw() {
          k.drawText({ text: label, size: 11, pos: k.vec2(0, 0), anchor: "center", color: labelColor });
        },
      },
    ]);
  }
}
