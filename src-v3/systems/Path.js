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

function buildRibbon(curve, halfWidth, yOffset, samples = 140) {
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
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#9a7038";
  ctx.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 80; i++) {
    const x = Math.random() * 128;
    const y = Math.random() * 128;
    const r = 2 + Math.random() * 5;
    ctx.fillStyle = `rgba(${100 + Math.random() * 80}, ${70 + Math.random() * 60}, ${40 + Math.random() * 30}, 0.7)`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.strokeStyle = "rgba(50, 30, 15, 0.5)";
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 30; i++) {
    ctx.beginPath();
    ctx.moveTo(Math.random() * 128, Math.random() * 128);
    ctx.lineTo(Math.random() * 128, Math.random() * 128);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  _pathTextureCache = tex;
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

export function makePathLine(curve, mat) {
  const group = new THREE.Group();

  const borderHalf = 1.85;
  const innerHalf = 1.55;
  const borderColor = mat?.color ? mat.color.clone().multiplyScalar(0.55) : new THREE.Color(0x4a3018);
  const borderMat = new THREE.MeshLambertMaterial({ color: borderColor });
  const borderGeom = buildRibbon(curve, borderHalf, 0.005);
  const borderMesh = new THREE.Mesh(borderGeom, borderMat);
  borderMesh.receiveShadow = true;
  group.add(borderMesh);

  const innerMat = new THREE.MeshLambertMaterial({
    map: makePathTexture(),
  });
  const innerGeom = buildRibbon(curve, innerHalf, 0.012);
  const innerMesh = new THREE.Mesh(innerGeom, innerMat);
  innerMesh.receiveShadow = true;
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
