// Off-screen garbage collector : runs every 2s, destroys cullable entities
// whose position is well outside the playable bounds.
// Tiles + persistent decor are NEVER touched — only mobile entities that
// have walked/flown out of view.

const CULLABLE_TAGS = [
  "visitor",
  "crowd",
  "duck",
  "duck-part",
  "ghost",
  "lava-ghost",
  "skull-target",
  "skull-part",
  "season-confetti",
  "ground-particle",
];

export function createGCSystem({ k, WIDTH, HEIGHT, WORLD_WIDTH, MARGIN = 200 }) {
  const right = (WORLD_WIDTH || WIDTH) + MARGIN;
  const left = -(WORLD_WIDTH || WIDTH) - MARGIN;
  function cull() {
    const minX = left;
    const maxX = right;
    const maxY = HEIGHT + MARGIN;
    let killed = 0;
    for (const tag of CULLABLE_TAGS) {
      const ents = k.get(tag);
      for (const e of ents) {
        if (!e.exists() || !e.pos) continue;
        // Skip entities currently in animation overrides (constellation, tunnel, loop)
        if (e._constActive || e._inTunnel || e.inLoop) continue;
        if (e.pos.x < minX || e.pos.x > maxX || e.pos.y > maxY) {
          // For visitors with crown extras, destroy them too
          if (e.crown && Array.isArray(e.crown)) {
            for (const c of e.crown) { if (c.exists()) k.destroy(c); }
          }
          if (e.parts && Array.isArray(e.parts)) {
            for (const p of e.parts) { if (p.exists()) k.destroy(p); }
          }
          k.destroy(e);
          killed++;
        }
      }
    }
    return killed;
  }

  k.loop(1, cull);
  return { cull };
}
