import * as THREE from "three";

let cachedGradient = null;

function makeGradientTexture() {
  if (cachedGradient) return cachedGradient;
  const canvas = document.createElement("canvas");
  canvas.width = 4;
  canvas.height = 1;
  const ctx = canvas.getContext("2d");
  // 3-step ramp: deep shadow / mid / bright highlight
  ctx.fillStyle = "#5a5a5a"; ctx.fillRect(0, 0, 1, 1);
  ctx.fillStyle = "#aaaaaa"; ctx.fillRect(1, 0, 2, 1);
  ctx.fillStyle = "#ffffff"; ctx.fillRect(3, 0, 1, 1);
  const tex = new THREE.CanvasTexture(canvas);
  tex.minFilter = THREE.NearestFilter;
  tex.magFilter = THREE.NearestFilter;
  tex.needsUpdate = true;
  cachedGradient = tex;
  return tex;
}

export function makeToonMaterial(opts = {}) {
  return new THREE.MeshToonMaterial({
    color: opts.color ?? 0xffffff,
    map: opts.map ?? null,
    gradientMap: makeGradientTexture(),
    transparent: !!opts.transparent,
    side: opts.side ?? THREE.FrontSide,
  });
}

export function applyToonToScene(root, opts = {}) {
  root.traverse((node) => {
    if (!node.isMesh && !node.isSkinnedMesh) return;
    const orig = node.material;
    const list = Array.isArray(orig) ? orig : [orig];
    const mapped = list.map((m) => {
      if (!m) return makeToonMaterial(opts);
      const newMat = makeToonMaterial({
        color: opts.color ?? (m.color ? m.color.getHex() : 0xffffff),
        map: m.map ?? null,
        side: m.side,
      });
      return newMat;
    });
    node.material = Array.isArray(orig) ? mapped : mapped[0];
    if (node.castShadow == null) node.castShadow = true;
    node.castShadow = true;
  });
}
