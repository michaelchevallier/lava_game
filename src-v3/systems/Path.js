import * as THREE from "three";

const DEFAULT_POINTS = [
  [-15, 0, -8], [-9, 0, -2], [-5, 0, -7], [0, 0, -3],
  [4, 0, -8], [8, 0, -2], [6, 0, 4], [2, 0, 6],
];

export function buildPath(rawPoints) {
  const src = rawPoints || DEFAULT_POINTS;
  const points = src.map((p) => new THREE.Vector3(p[0], p[1], p[2]));
  return new THREE.CatmullRomCurve3(points, false, "centripetal", 0.5);
}

function buildRibbon(curve, halfWidth, yOffset, samples = null) {
  if (samples == null) {
    const len = curve.getLength();
    samples = Math.max(120, Math.min(3000, Math.floor(len * 4)));
  }
  const samplesArr = curve.getSpacedPoints(samples);
  const positions = [];
  const indices = [];
  const uvs = [];
  for (let i = 0; i < samplesArr.length; i++) {
    const p = samplesArr[i];
    const t = i / (samplesArr.length - 1);
    const tangent = curve.getTangentAt(t).normalize();
    const normal = new THREE.Vector3(0, 1, 0);
    const side = new THREE.Vector3().crossVectors(tangent, normal).normalize().multiplyScalar(halfWidth);
    const left = p.clone().add(side);
    const right = p.clone().sub(side);
    positions.push(left.x, yOffset, left.z);
    positions.push(right.x, yOffset, right.z);
    uvs.push(0, t * 30); // tile texture along path
    uvs.push(1, t * 30);
  }
  for (let i = 0; i < samplesArr.length - 1; i++) {
    const a = i * 2, b = a + 1, c = a + 2, d = a + 3;
    indices.push(a, b, c);
    indices.push(b, d, c);
  }
  const geom = new THREE.BufferGeometry();
  geom.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geom.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geom.setIndex(indices);
  geom.computeVertexNormals();
  return geom;
}

let _pathTextureCache = null;
function makePathTexture() {
  if (_pathTextureCache) return _pathTextureCache;
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");

  // Base saddle brown solide
  ctx.fillStyle = "#7a4a22";
  ctx.fillRect(0, 0, 256, 256);
  // Patches plus clairs (terre sèche)
  for (let i = 0; i < 200; i++) {
    const x = Math.random() * 256;
    const y = Math.random() * 256;
    const r = 4 + Math.random() * 10;
    const lr = 130 + Math.random() * 40;
    const lg = 80 + Math.random() * 30;
    const lb = 40 + Math.random() * 20;
    ctx.fillStyle = `rgba(${Math.round(lr)}, ${Math.round(lg)}, ${Math.round(lb)}, ${0.4 + Math.random() * 0.3})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  // Pebbles très foncés
  for (let i = 0; i < 160; i++) {
    const x = Math.random() * 256;
    const y = Math.random() * 256;
    const r = 1.5 + Math.random() * 4;
    const dr = 50 + Math.random() * 30;
    const dg = 30 + Math.random() * 20;
    const db = 15 + Math.random() * 15;
    ctx.fillStyle = `rgba(${Math.round(dr)}, ${Math.round(dg)}, ${Math.round(db)}, ${0.6 + Math.random() * 0.3})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  _pathTextureCache = tex;
  return tex;
}

let _grassBorderTextureCache = null;
function makeGrassBorderTexture() {
  if (_grassBorderTextureCache) return _grassBorderTextureCache;
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  const grad = ctx.createLinearGradient(0, 0, 0, 128);
  grad.addColorStop(0, "#4a7a2a");
  grad.addColorStop(1, "#3a6a20");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);
  ctx.strokeStyle = "rgba(40, 60, 20, 0.7)";
  ctx.lineWidth = 1.2;
  for (let i = 0; i < 80; i++) {
    const x = Math.random() * 128;
    const y = Math.random() * 128;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + (Math.random() - 0.5) * 4, y - 4 - Math.random() * 6);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  _grassBorderTextureCache = tex;
  return tex;
}

let _arrowMatCache = null;
function makeArrowMaterial() {
  if (_arrowMatCache) return _arrowMatCache;
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, 64, 64);
  ctx.fillStyle = "#fff5d8";
  ctx.strokeStyle = "rgba(0, 0, 0, 0.3)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(32, 6);
  ctx.lineTo(54, 38);
  ctx.lineTo(40, 38);
  ctx.lineTo(40, 58);
  ctx.lineTo(24, 58);
  ctx.lineTo(24, 38);
  ctx.lineTo(10, 38);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  _arrowMatCache = new THREE.MeshBasicMaterial({
    map: tex, transparent: true, opacity: 0.7, depthWrite: false,
  });
  return _arrowMatCache;
}

export function makePathLine(curve, mat, opts = {}) {
  const group = new THREE.Group();

  const innerColor = opts.innerColor != null ? opts.innerColor : 0xffffff;
  const borderColor = opts.borderColor != null ? opts.borderColor : 0x3a200a;

  const borderHalf = 2.1;
  const innerHalf = 1.7;
  const borderMat = new THREE.MeshBasicMaterial({
    color: borderColor,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -4,
  });
  const borderGeom = buildRibbon(curve, borderHalf, 0.02);
  const borderMesh = new THREE.Mesh(borderGeom, borderMat);
  borderMesh.renderOrder = 1;
  group.add(borderMesh);

  const innerMat = new THREE.MeshBasicMaterial({
    map: makePathTexture(),
    color: innerColor,
    polygonOffset: true,
    polygonOffsetFactor: -3,
    polygonOffsetUnits: -6,
  });
  const innerGeom = buildRibbon(curve, innerHalf, 0.04);
  const innerMesh = new THREE.Mesh(innerGeom, innerMat);
  innerMesh.renderOrder = 2;
  group.add(innerMesh);

  return group;
}
