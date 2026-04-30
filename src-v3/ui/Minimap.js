const W = 240;
const H = 140;
const PAD = 8;

let canvas = null;
let ctx = null;
let _bounds = null;

export const Minimap = {
  init(parent) {
    canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    canvas.id = "minimap";
    Object.assign(canvas.style, {
      position: "fixed",
      top: "78px",
      right: "18px",
      width: `${W}px`,
      height: `${H}px`,
      border: "2px solid #ffd23f",
      borderRadius: "8px",
      background: "rgba(20,28,36,0.85)",
      zIndex: "22",
      pointerEvents: "none",
      boxShadow: "0 4px 0 rgba(0,0,0,0.4)",
    });
    (parent || document.body).appendChild(canvas);
    ctx = canvas.getContext("2d");
  },

  setVisible(v) {
    if (canvas) canvas.style.display = v ? "" : "none";
  },

  computeBounds(runner) {
    const paths = runner.paths || (runner.path ? [runner.path] : []);
    if (!paths.length) return null;
    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
    for (const path of paths) {
      const samples = path.getSpacedPoints(40);
      for (const p of samples) {
        if (p.x < minX) minX = p.x;
        if (p.x > maxX) maxX = p.x;
        if (p.z < minZ) minZ = p.z;
        if (p.z > maxZ) maxZ = p.z;
      }
    }
    const margin = 8;
    minX -= margin; maxX += margin; minZ -= margin; maxZ += margin;
    return { minX, maxX, minZ, maxZ };
  },

  refreshBounds(runner) {
    _bounds = this.computeBounds(runner);
  },

  update(runner) {
    if (!ctx || !canvas) return;
    if (!_bounds) {
      _bounds = this.computeBounds(runner);
      if (!_bounds) return;
    }
    const { minX, maxX, minZ, maxZ } = _bounds;
    const spanX = Math.max(1, maxX - minX);
    const spanZ = Math.max(1, maxZ - minZ);
    const usableW = W - PAD * 2;
    const usableH = H - PAD * 2;
    const sx = usableW / spanX;
    const sz = usableH / spanZ;
    const s = Math.min(sx, sz);
    const offX = PAD + (usableW - spanX * s) / 2;
    const offZ = PAD + (usableH - spanZ * s) / 2;
    const W2P = (x, z) => ({
      x: offX + (x - minX) * s,
      y: offZ + (z - minZ) * s,
    });

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "rgba(20,28,36,0.4)";
    ctx.fillRect(0, 0, W, H);

    const paths = runner.paths || (runner.path ? [runner.path] : []);
    ctx.strokeStyle = "#ffd23f";
    ctx.lineWidth = 2;
    for (const path of paths) {
      const samples = path.getSpacedPoints(80);
      ctx.beginPath();
      for (let i = 0; i < samples.length; i++) {
        const p = W2P(samples[i].x, samples[i].z);
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      }
      ctx.stroke();

      // entry
      const entry = path.getPointAt(0);
      const ep = W2P(entry.x, entry.z);
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(ep.x, ep.y, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // build points (occupied or near)
    if (runner.buildPoints && runner.hero) {
      const heroPos = runner.hero.group.position;
      for (const bp of runner.buildPoints) {
        const dx = bp.pos.x - heroPos.x;
        const dz = bp.pos.z - heroPos.z;
        if (!bp.occupied && (dx * dx + dz * dz) > 900) continue;
        const p = W2P(bp.pos.x, bp.pos.z);
        ctx.fillStyle = bp.occupied ? "#ffd23f" : "rgba(120,220,255,0.7)";
        ctx.fillRect(p.x - 0.5, p.y - 0.5, 1.5, 1.5);
      }
    }

    // enemies
    if (runner.enemies) {
      for (const e of runner.enemies) {
        if (e.dead || e._dying) continue;
        const p = W2P(e.group.position.x, e.group.position.z);
        const isBoss = e.isBoss;
        ctx.fillStyle = isBoss ? "#ffaa20" : "#ff4040";
        ctx.beginPath();
        ctx.arc(p.x, p.y, isBoss ? 4 : 2.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // castle (end of first path)
    const firstPath = paths[0];
    if (firstPath) {
      const end = firstPath.getPointAt(1);
      const ep = W2P(end.x, end.z);
      ctx.font = "12px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#fff";
      ctx.fillText("🏰", ep.x, ep.y);
    }

    // hero with direction arrow
    if (runner.hero) {
      const hp = W2P(runner.hero.group.position.x, runner.hero.group.position.z);
      ctx.fillStyle = "#5fe079";
      ctx.beginPath();
      ctx.arc(hp.x, hp.y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#0a1418";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      const rot = runner.hero.group.rotation.y;
      const ax = hp.x + Math.sin(rot) * 8;
      const ay = hp.y + Math.cos(rot) * 8;
      ctx.strokeStyle = "#5fe079";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(hp.x, hp.y);
      ctx.lineTo(ax, ay);
      ctx.stroke();
    }
  },
};
