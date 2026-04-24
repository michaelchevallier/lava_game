import { TILE, gridKey } from "./constants.js";

export function createComboSystem({ k, tileMap, gameState, audio, showPopup, showComboPopup, spectres, save, persistSave }) {
  const DEFS = [];
  const BY_TRIGGER_PLACE = new Map();
  const BY_TRIGGER_WAGON = [];
  const BY_TRIGGER_MANUAL = new Map();

  function registerCombo(def) {
    DEFS.push(def);
    if (def.triggerType === "place") {
      for (const t of def.triggerTiles) {
        if (!BY_TRIGGER_PLACE.has(t)) BY_TRIGGER_PLACE.set(t, []);
        BY_TRIGGER_PLACE.get(t).push(def);
      }
    } else if (def.triggerType === "wagon-tick") {
      BY_TRIGGER_WAGON.push(def);
    } else if (def.triggerType === "manual") {
      BY_TRIGGER_MANUAL.set(def.id, def);
    }
  }

  function spawnBurst(cx, cy, color, count) {
    const pCount = (window.__entityCounts?.particle || 0);
    if (pCount >= 280) return;
    for (let i = 0; i < count; i++) {
      const a = (Math.PI * 2 * i) / count;
      k.add([
        k.circle(3 + Math.random() * 2),
        k.pos(cx, cy),
        k.color(k.rgb(color[0], color[1], color[2])),
        k.opacity(1),
        k.lifespan(0.7, { fade: 0.5 }),
        k.z(15),
        "particle-grav",
        { vx: Math.cos(a) * 80, vy: Math.sin(a) * 80 - 30, grav: 200 },
      ]);
    }
  }

  function fireCombo(def, ctx) {
    const isNew = !(save.combos & (1 << def.bitIndex));
    if (isNew) {
      save.combos |= (1 << def.bitIndex);
      persistSave(save);
      showComboPopup(`DECOUVERT ! ${def.name}`, def.color, def.score, { fanfare: true });
    } else {
      showComboPopup(def.name, def.color, def.score);
    }
    if (def.score > 0) gameState.score += def.score;
    audio.combo?.();
    def.apply({ k, ctx, gameState, tileMap, audio, showPopup, spectres, def, spawnBurst });
  }

  function checkCombos(col, row, placedType) {
    const defs = BY_TRIGGER_PLACE.get(placedType);
    if (!defs) return;
    for (const def of defs) {
      const ctx = def.test(tileMap, col, row);
      if (ctx) fireCombo(def, ctx);
    }
  }

  function tickWagon(wagon) {
    wagon._comboCdUntil ||= {};
    for (const def of BY_TRIGGER_WAGON) {
      if ((wagon._comboCdUntil[def.id] || 0) > k.time()) continue;
      const ctx = def.test(tileMap, wagon, k);
      if (ctx) {
        wagon._comboCdUntil[def.id] = k.time() + (def.debounce || 1);
        fireCombo(def, { ...ctx, wagon });
      }
    }
  }

  function manualFire(defId, ctx) {
    const def = BY_TRIGGER_MANUAL.get(defId);
    if (def) fireCombo(def, ctx || {});
  }

  function listCombos() { return DEFS; }

  function isDiscovered(id) {
    const def = DEFS.find((d) => d.id === id);
    return def ? !!(save.combos & (1 << def.bitIndex)) : false;
  }

  registerCombo({
    id: "test",
    bitIndex: 31,
    name: "TEST",
    color: [200, 200, 200],
    score: 0,
    difficulty: 1,
    triggerType: "manual",
    codexEmoji: "🧪",
    codexDesc: "Combo de test interne",
    codexTiles: ["?"],
    test() { return {}; },
    apply() {},
  });

  return { registerCombo, checkCombos, tickWagon, manualFire, listCombos, isDiscovered, spawnBurst };
}
