import * as THREE from "three";

const DEFAULT_POINTS = [
  [-15, 0, -8], [-9, 0, -2], [-5, 0, -7], [0, 0, -3],
  [4, 0, -8], [8, 0, -2], [6, 0, 4], [2, 0, 6],
];

export function buildPath(rawPoints) {
  const src = rawPoints || DEFAULT_POINTS;
  const points = src.map((p) => new THREE.Vector3(p[0], p[1], p[2]));
  return new THREE.CatmullRomCurve3(points, false, "catmullrom", 0.5);
}

function buildRibbon(curve, halfWidth, yOffset, samples = null) {
  if (samples == null) {
    const len = curve.getLength();
    samples = Math.max(80, Math.min(2000, Math.floor(len * 1.5)));
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

  // Base white — material.color tints to theme palette
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, 256, 256);
  // Darker patches (multiply blend with theme color)
  for (let i = 0; i < 120; i++) {
    const x = Math.random() * 256;
    const y = Math.random() * 256;
    const r = 4 + Math.random() * 8;
    const tone = 200 + Math.random() * 40;
    ctx.fillStyle = `rgba(${tone}, ${tone}, ${tone}, ${0.3 + Math.random() * 0.3})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  // Pebbles/dirt darker spots
  for (let i = 0; i < 80; i++) {
    const x = Math.random() * 256;
    const y = Math.random() * 256;
    const r = 2 + Math.random() * 4;
    const tone = 130 + Math.random() * 50;
    ctx.fillStyle = `rgba(${tone}, ${tone}, ${tone}, ${0.4 + Math.random() * 0.3})`;
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

  const innerColor = opts.innerColor != null ? opts.innerColor : 0xc89060;
  const borderColor = opts.borderColor != null ? opts.borderColor : 0x3a2410;

  const borderHalf = 3.4;
  const innerHalf = 2.8;
  const borderMat = new THREE.MeshBasicMaterial({
    color: borderColor,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });
  const borderGeom = buildRibbon(curve, borderHalf, 0.08);
  const borderMesh = new THREE.Mesh(borderGeom, borderMat);
  borderMesh.renderOrder = 1;
  group.add(borderMesh);

  const innerMat = new THREE.MeshBasicMaterial({
    map: makePathTexture(),
    color: innerColor,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
  });
  const innerGeom = buildRibbon(curve, innerHalf, 0.14);
  const innerMesh = new THREE.Mesh(innerGeom, innerMat);
  innerMesh.renderOrder = 2;
  group.add(innerMesh);

  const arrowMat = makeArrowMaterial();
  const arrowGeom = new THREE.PlaneGeometry(0.7, 0.7);
  const len = curve.getLength();
  const spacing = 3.5;
  const count = Math.max(2, Math.floor(len / spacing));
  for (let i = 1; i < count; i++) {
    const t = i / count;
    const p = curve.getPointAt(t);
    const tangent = curve.getTangentAt(t).normalize();
    const arrow = new THREE.Mesh(arrowGeom, arrowMat);
    arrow.rotation.x = -Math.PI / 2;
    arrow.rotation.z = -Math.atan2(tangent.x, tangent.z);
    arrow.position.set(p.x, 0.02, p.z);
    group.add(arrow);
  }

  return group;
}
