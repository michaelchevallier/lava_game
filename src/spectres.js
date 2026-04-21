export const SPECTRE_CATEGORIES = [
  {
    id: "maitres_feu",
    name: "Maîtres du Feu",
    emoji: "🔥",
    title: "Pyromancien",
    color: "#ff6b1c",
    spectres: [
      { id: "first_skel", emoji: "💀", name: "Premier Sang", desc: "Transforme ton 1er wagon" },
      { id: "ten_skel", emoji: "🔥", name: "L'Incinérateur", desc: "10 squelettes en cumul" },
      { id: "hundred_skel", emoji: "🌋", name: "L'Immolateur", desc: "100 squelettes en cumul" },
      { id: "apocalypse", emoji: "⚡", name: "L'Apocalyptique", desc: "Déclenche 1 APOCALYPSE" },
    ],
  },
  {
    id: "virtuoses",
    name: "Virtuoses",
    emoji: "🎭",
    title: "Virtuose",
    color: "#c090f0",
    spectres: [
      { id: "gold_chain", emoji: "💰", name: "Le Diagonale", desc: "Déclenche 1 chaîne d'or (3 pièces)" },
      { id: "triple_loop", emoji: "🔄", name: "Le Loopeur", desc: "Enchaîne 1 Loop x3" },
      { id: "constellation", emoji: "🌌", name: "Le Constellier", desc: "Déclenche 1 constellation spectrale" },
      { id: "first_platinum", emoji: "🏆", name: "Le Perfectionniste", desc: "Débloque 1ère médaille platine" },
    ],
  },
  {
    id: "sprinters",
    name: "Sprinters",
    emoji: "🚀",
    title: "Sprinter",
    color: "#ffd23f",
    spectres: [
      { id: "world_clear", emoji: "🏁", name: "Le Finisseur", desc: "Termine tous les niveaux d'un Monde" },
      { id: "five_platinum", emoji: "🥇", name: "Le Médaillé", desc: "Débloque 5 médailles platine" },
      { id: "beat_record", emoji: "⏱", name: "Le Champion", desc: "Bats un record speedrun foyer" },
      { id: "run_3000", emoji: "🎰", name: "Le Runner", desc: "Atteins 3000 pts en Run Arcade" },
    ],
  },
  {
    id: "tresoriers",
    name: "Trésoriers",
    emoji: "💎",
    title: "Trésorier",
    color: "#ffc000",
    spectres: [
      { id: "coins_10", emoji: "🪙", name: "Le Premier Sou", desc: "10 pièces en cumul" },
      { id: "coins_50", emoji: "💰", name: "Le Collecteur", desc: "50 pièces en cumul" },
      { id: "coins_200", emoji: "💎", name: "L'Avare", desc: "200 pièces en cumul" },
      { id: "coins_1000", emoji: "👑", name: "Le Crésus", desc: "1000 pièces en cumul" },
    ],
  },
  {
    id: "architectes",
    name: "Architectes",
    emoji: "🏗️",
    title: "Architecte",
    color: "#7cc947",
    spectres: [
      { id: "first_save", emoji: "💾", name: "L'Archiviste", desc: "Exporte ton 1er parc" },
      { id: "park_50tiles", emoji: "🏛", name: "Le Bâtisseur", desc: "Place 50 tuiles en 1 partie" },
      { id: "magnet_field", emoji: "🧲", name: "Le Magnétique", desc: "Crée un champ magnétique" },
      { id: "geyser_master", emoji: "💦", name: "L'Hydraulicien", desc: "Déclenche un geyser (eau + ventilateur)" },
    ],
  },
  {
    id: "explorateurs",
    name: "Explorateurs",
    emoji: "🧭",
    title: "Explorateur",
    color: "#3a7bd5",
    spectres: [
      { id: "world_all", emoji: "🌍", name: "Le Globe-Trotter", desc: "Atteins le Monde 6" },
      { id: "night_mode", emoji: "🌙", name: "Le Nocturne", desc: "Active le mode nuit" },
      { id: "mobile", emoji: "📱", name: "Le Nomade", desc: "Joue en version mobile" },
      { id: "streak_7d", emoji: "🔥", name: "Le Fidèle", desc: "7 jours consécutifs au parc" },
    ],
  },
];

// Liste plate pour lookup rapide
export const ALL_SPECTRES = SPECTRE_CATEGORIES.flatMap((cat) =>
  cat.spectres.map((s) => ({ ...s, category: cat.id }))
);

// Mapping ancien id numérique → nouveau string id (migration douce v1 → v2)
const LEGACY_MAP = {
  6: "hundred_skel",
  7: "apocalypse",
  11: "magnet_field",
  13: "coins_50",   // 10 canards (approximation)
  16: "triple_loop",
  17: "coins_50",
  18: "park_50tiles",
  19: "night_mode",
  22: "mobile",
  23: "first_save",
  24: "constellation",
};

function resolveKey(idOrNum) {
  if (typeof idOrNum === "number") return LEGACY_MAP[idOrNum] || null;
  return idOrNum;
}

export function migrateSpectres(save) {
  if (!save) return;
  const cur = save.spectres;
  if (!cur || typeof cur !== "object" || Array.isArray(cur)) {
    // Ancien bitmask numérique ou inexistant → convertir
    const bitmask = typeof cur === "number" ? cur : 0;
    const next = {};
    for (const cat of SPECTRE_CATEGORIES) next[cat.id] = {};
    for (const [numStr, newId] of Object.entries(LEGACY_MAP)) {
      const num = parseInt(numStr, 10);
      if ((bitmask & (1 << num)) !== 0) {
        const cat = SPECTRE_CATEGORIES.find((c) => c.spectres.some((s) => s.id === newId));
        if (cat) next[cat.id][newId] = true;
      }
    }
    save.spectres = next;
  } else {
    // Déjà nouveau schéma — assure toutes les catégories présentes
    for (const cat of SPECTRE_CATEGORIES) {
      if (!cur[cat.id]) cur[cat.id] = {};
    }
  }
  if (!Array.isArray(save.titles)) save.titles = [];
}

export function createSpectresSystem({ save, persistSave, audio, showPopup, k, WIDTH }) {
  migrateSpectres(save);
  const unlockListeners = [];

  function onUnlock(cb) {
    unlockListeners.push(cb);
  }

  function findSpectre(key) {
    for (const cat of SPECTRE_CATEGORIES) {
      const s = cat.spectres.find((x) => x.id === key);
      if (s) return { cat, spec: s };
    }
    return null;
  }

  function hasUnlocked(idOrNum) {
    const key = resolveKey(idOrNum);
    if (!key) return false;
    const found = findSpectre(key);
    if (!found) return false;
    return !!save.spectres?.[found.cat.id]?.[key];
  }

  function categoryComplete(catId) {
    const cat = SPECTRE_CATEGORIES.find((c) => c.id === catId);
    if (!cat) return false;
    return cat.spectres.every((s) => !!save.spectres?.[catId]?.[s.id]);
  }

  function unlock(idOrNum) {
    const key = resolveKey(idOrNum);
    if (!key) return;
    const found = findSpectre(key);
    if (!found) return;
    const { cat, spec } = found;
    if (!save.spectres) save.spectres = {};
    if (!save.spectres[cat.id]) save.spectres[cat.id] = {};
    if (save.spectres[cat.id][key]) return;
    save.spectres[cat.id][key] = true;

    let titleUnlocked = null;
    if (categoryComplete(cat.id) && !save.titles.includes(cat.title)) {
      save.titles.push(cat.title);
      titleUnlocked = cat.title;
    }

    persistSave(save);
    audio.combo();
    showPopup(WIDTH / 2, 200, `SPECTRE DÉBLOQUÉ : ${spec.name}`, k.rgb(255, 200, 80), 22);
    if (titleUnlocked) {
      setTimeout(() => {
        showPopup(WIDTH / 2, 240, `TITRE : ${titleUnlocked}`, k.rgb(180, 220, 255), 26);
      }, 800);
    }
    unlockListeners.forEach((cb) => cb(key, spec, cat));
  }

  function unlockedCount() {
    let n = 0;
    for (const cat of SPECTRE_CATEGORIES) {
      for (const s of cat.spectres) {
        if (save.spectres?.[cat.id]?.[s.id]) n++;
      }
    }
    return n;
  }

  function showCarnet() {
    const existing = document.getElementById("carnet-modal");
    if (existing) existing.remove();
    const modal = document.createElement("div");
    modal.id = "carnet-modal";
    modal.style.cssText =
      "position:fixed;inset:0;background:rgba(0,0,0,0.85);display:flex;align-items:center;justify-content:center;z-index:99999;font-family:system-ui,sans-serif;overflow:auto;padding:20px";
    const total = ALL_SPECTRES.length;
    const unlocked = unlockedCount();

    const catsHtml = SPECTRE_CATEGORIES.map((cat) => {
      const done = categoryComplete(cat.id);
      const items = cat.spectres.map((s) => {
        const has = !!save.spectres?.[cat.id]?.[s.id];
        const bg = has ? "#2a3050" : "#1a1f30";
        const op = has ? "1" : "0.35";
        const filt = has ? "" : "filter:blur(3px) grayscale(1);";
        return `
          <div style="background:${bg};padding:12px;border-radius:6px;text-align:center;border:1px solid ${has ? cat.color : "#444"};opacity:${op}">
            <div style="font-size:30px;${filt}">${s.emoji}</div>
            <div style="font-size:11px;color:white;margin-top:4px;font-weight:bold">${has ? s.name : "???"}</div>
            <div style="font-size:9px;color:#aab;margin-top:2px;line-height:1.3">${has ? "" : s.desc}</div>
          </div>
        `;
      }).join("");
      const titleBadge = done
        ? `<span style="margin-left:10px;background:${cat.color};color:#000;padding:2px 8px;border-radius:4px;font-size:10px;font-weight:bold">TITRE: ${cat.title}</span>`
        : "";
      return `
        <div style="margin-bottom:18px">
          <div style="display:flex;align-items:center;margin-bottom:8px">
            <span style="font-size:20px;margin-right:8px">${cat.emoji}</span>
            <span style="color:${cat.color};font-size:14px;font-weight:bold;letter-spacing:1px">${cat.name}</span>
            ${titleBadge}
          </div>
          <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px">${items}</div>
        </div>
      `;
    }).join("");

    modal.innerHTML = `
      <div style="background:#1a2236;color:white;padding:24px;border-radius:8px;max-width:720px;width:92vw;max-height:88vh;overflow-y:auto;border:2px solid #ffd23f">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
          <h2 style="margin:0;color:#ffd23f;font-size:20px;letter-spacing:1px">Carnet des Spectres</h2>
          <button id="carnet-close" style="padding:8px 14px;background:rgba(0,0,0,0.45);color:#b4c8e8;border:1.5px solid #3c4e6e;border-radius:6px;cursor:pointer;font-family:inherit;font-size:13px">Fermer ✕</button>
        </div>
        <p style="color:#aab;font-size:12px;margin:0 0 16px 0">${unlocked} / ${total} découverts · 6 catégories × 4 spectres · chaque catégorie complétée débloque un titre</p>
        ${catsHtml}
      </div>
    `;
    document.body.appendChild(modal);
    modal.querySelector("#carnet-close").onclick = () => modal.remove();
    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
  }

  return { unlock, hasUnlocked, showCarnet, onUnlock, unlockedCount, categoryComplete };
}
