export function hueToRgb(k, h) {
  h = ((h % 360) + 360) % 360;
  const x = 1 - Math.abs(((h / 60) % 2) - 1);
  let r, g, b;
  if (h < 60)       [r, g, b] = [1, x, 0];
  else if (h < 120) [r, g, b] = [x, 1, 0];
  else if (h < 180) [r, g, b] = [0, 1, x];
  else if (h < 240) [r, g, b] = [0, x, 1];
  else if (h < 300) [r, g, b] = [x, 0, 1];
  else               [r, g, b] = [1, 0, x];
  return k.rgb(Math.round(r * 255), Math.round(g * 255), Math.round(b * 255));
}

export function getRoyalLevel(plays) {
  if (plays >= 200) return "spectral";
  if (plays >= 100) return "throne";
  if (plays >= 50) return "cape";
  if (plays >= 20) return "crown";
  if (plays >= 10) return "tophat";
  if (plays >= 5) return "hat";
  return "none";
}

export function drawWagonBody(k, x, y, theme) {
  const body = k.add([
    k.rect(60, 30),
    k.pos(x, y),
    k.rotate(0),
    k.color(k.rgb(theme.body[0], theme.body[1], theme.body[2])),
    k.outline(2, k.rgb(20, 10, 5)),
    k.z(3),
    "wagon-part",
  ]);
  const frontRim = k.add([
    k.rect(4, 34),
    k.pos(x, y - 2),
    k.rotate(0),
    k.color(k.rgb(58, 58, 58)),
    k.outline(1, k.rgb(20, 20, 20)),
    k.z(4),
    "wagon-part",
  ]);
  const backRim = k.add([
    k.rect(4, 34),
    k.pos(x + 56, y - 2),
    k.rotate(0),
    k.color(k.rgb(58, 58, 58)),
    k.outline(1, k.rgb(20, 20, 20)),
    k.z(4),
    "wagon-part",
  ]);
  const plank1 = k.add([
    k.rect(52, 2),
    k.pos(x + 4, y + 8),
    k.rotate(0),
    k.color(k.rgb(theme.dark[0], theme.dark[1], theme.dark[2])),
    k.z(4),
    "wagon-part",
  ]);
  const plank2 = k.add([
    k.rect(52, 2),
    k.pos(x + 4, y + 20),
    k.rotate(0),
    k.color(k.rgb(theme.dark[0], theme.dark[1], theme.dark[2])),
    k.z(4),
    "wagon-part",
  ]);
  const trim = k.add([
    k.rect(60, 3),
    k.pos(x, y - 3),
    k.rotate(0),
    k.color(k.rgb(theme.trim[0], theme.trim[1], theme.trim[2])),
    k.z(4),
    "wagon-part",
  ]);
  return [body, frontRim, backRim, plank1, plank2, trim];
}

export function drawRoyalOverlay(k, wagon, level) {
  const decos = [];
  if (level === "none") return decos;

  const wx = wagon.pos.x;
  const wy = wagon.pos.y;

  if (level === "hat") {
    const brim = k.add([
      k.rect(16, 3),
      k.pos(wx + 14, wy - 42),
      k.color(k.rgb(60, 180, 80)),
      k.outline(1, k.rgb(0, 0, 0)),
      k.z(8),
      "wagon-part",
      { royalOffX: 14, royalOffY: -42 },
    ]);
    const cone = k.add([
      k.rect(8, 8),
      k.pos(wx + 18, wy - 50),
      k.color(k.rgb(60, 180, 80)),
      k.outline(1, k.rgb(0, 0, 0)),
      k.z(8),
      "wagon-part",
      { royalOffX: 18, royalOffY: -50 },
    ]);
    decos.push(brim, cone);
  }

  if (level === "tophat") {
    const brim = k.add([
      k.rect(18, 3),
      k.pos(wx + 13, wy - 43),
      k.color(k.rgb(20, 20, 20)),
      k.outline(1, k.rgb(0, 0, 0)),
      k.z(8),
      "wagon-part",
      { royalOffX: 13, royalOffY: -43 },
    ]);
    const cylinder = k.add([
      k.rect(14, 12),
      k.pos(wx + 15, wy - 55),
      k.color(k.rgb(20, 20, 20)),
      k.outline(1, k.rgb(0, 0, 0)),
      k.z(8),
      "wagon-part",
      { royalOffX: 15, royalOffY: -55 },
    ]);
    const band = k.add([
      k.rect(14, 3),
      k.pos(wx + 15, wy - 47),
      k.color(k.rgb(255, 210, 60)),
      k.z(9),
      "wagon-part",
      { royalOffX: 15, royalOffY: -47 },
    ]);
    decos.push(brim, cylinder, band);
  }

  if (level === "crown" || level === "cape" || level === "throne") {
    for (let i = 0; i < 5; i++) {
      const h = 4 + (i % 2) * 4;
      const px = wx + 10 + i * 4;
      const py = wy - 42 - h;
      const tooth = k.add([
        k.rect(3, h),
        k.pos(px, py),
        k.color(k.rgb(255, 215, 60)),
        k.outline(1, k.rgb(180, 130, 0)),
        k.z(8),
        "wagon-part",
        { royalOffX: 10 + i * 4, royalOffY: -42 - h, isCrownTooth: true, toothH: h },
      ]);
      decos.push(tooth);
    }
    const crownBase = k.add([
      k.rect(22, 4),
      k.pos(wx + 10, wy - 42),
      k.color(k.rgb(255, 215, 60)),
      k.outline(1, k.rgb(180, 130, 0)),
      k.z(8),
      "wagon-part",
      { royalOffX: 10, royalOffY: -42 },
    ]);
    decos.push(crownBase);
  }

  if (level === "cape" || level === "throne") {
    const cape = k.add([
      k.rect(20, 26),
      k.pos(wx - 8, wy - 10),
      k.color(k.rgb(180, 30, 30)),
      k.outline(1, k.rgb(80, 0, 0)),
      k.z(2),
      "wagon-part",
      { isCape: true },
    ]);
    decos.push(cape);
  }

  return decos;
}
