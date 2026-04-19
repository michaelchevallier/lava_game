export const SPECTRES = [
  { id: 0,  emoji: "🤡", name: "Le Clown",        desc: "10 rebonds trampoline en 1 partie" },
  { id: 1,  emoji: "👰", name: "La Mariée",        desc: "3 VIP transformés d'affilée" },
  { id: 2,  emoji: "👶", name: "L'Enfant Perdu",   desc: "Finir une partie avec exactement 0 pts" },
  { id: 3,  emoji: "🎩", name: "Le Magicien",      desc: "Utiliser un portail 5 fois" },
  { id: 4,  emoji: "🐌", name: "Le Lent",          desc: "Wagon vitesse à 50% pendant 10s" },
  { id: 5,  emoji: "🚀", name: "Le Speedy",        desc: "Wagon vitesse à 200% pendant 10s" },
  { id: 6,  emoji: "🔥", name: "L'Embraseur",      desc: "100 squelettes en cumul" },
  { id: 7,  emoji: "⚡", name: "L'Apocalyptique",  desc: "Déclencher APOCALYPSE 5 fois" },
  { id: 8,  emoji: "⏱",  name: "Le Temporel",      desc: "Atteindre BULLET TIME une fois" },
  { id: 9,  emoji: "🌊", name: "L'Hydraulicien",   desc: "Construire une cascade (3+ eau vertical)" },
  { id: 10, emoji: "🌬", name: "L'Aérien",         desc: "Catapulter un wagon (Trampo+Fan)" },
  { id: 11, emoji: "🧲", name: "Le Magnétique",    desc: "Créer un Magnet Field" },
  { id: 12, emoji: "🎡", name: "Le Forain",        desc: "Placer une Grande Roue" },
  { id: 13, emoji: "🦆", name: "Le Pêcheur",       desc: "Pêcher 10 canards" },
  { id: 14, emoji: "⭐", name: "Le Chanceux",       desc: "Pêcher 1 canard doré" },
  { id: 15, emoji: "🌉", name: "Le Bâtisseur",     desc: "Casser un pont" },
  { id: 16, emoji: "🔄", name: "Le Loopeur",       desc: "Compléter un Loop x3" },
  { id: 17, emoji: "💎", name: "L'Avare",          desc: "Collecter 100 pièces en cumul" },
  { id: 18, emoji: "🎢", name: "Le Constructeur",  desc: "Placer 50 tiles en 1 partie" },
  { id: 19, emoji: "🌙", name: "Le Nocturne",      desc: "Activer mode nuit" },
  { id: 20, emoji: "🌅", name: "Le Matinal",       desc: "Activer mode jour (depuis nuit)" },
  { id: 21, emoji: "👥", name: "Le Sociable",      desc: "4 joueurs simultanés" },
  { id: 22, emoji: "📱", name: "Le Mobile",        desc: "Jouer en mode mobile" },
  { id: 23, emoji: "💾", name: "L'Archiviste",     desc: "Exporter un parc" },
];

export function createSpectresSystem({ save, persistSave, audio, showPopup, k, WIDTH }) {
  function unlock(id) {
    const mask = 1 << id;
    if ((save.spectres & mask) !== 0) return;
    save.spectres = (save.spectres || 0) | mask;
    persistSave(save);
    audio.combo();
    const spec = SPECTRES[id];
    showPopup(WIDTH / 2, 200, `NOUVEAU SPECTRE : ${spec.name}`, k.rgb(255, 200, 80), 22);
  }

  function hasUnlocked(id) {
    return ((save.spectres || 0) & (1 << id)) !== 0;
  }

  function showCarnet() {
    const existing = document.getElementById("carnet-modal");
    if (existing) existing.remove();
    const modal = document.createElement("div");
    modal.id = "carnet-modal";
    modal.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,0.85);display:flex;align-items:center;justify-content:center;z-index:99999;font-family:system-ui,sans-serif;overflow:auto;padding:20px";
    const grid = SPECTRES.map(s => {
      const unlocked = hasUnlocked(s.id);
      const bg = unlocked ? "#2a3050" : "#1a1f30";
      const op = unlocked ? "1" : "0.35";
      const filt = unlocked ? "" : "filter:blur(3px) grayscale(1);";
      return `
        <div style="background:${bg};padding:12px;border-radius:6px;text-align:center;border:1px solid ${unlocked ? '#ffd23f' : '#444'};opacity:${op}">
          <div style="font-size:32px;${filt}">${s.emoji}</div>
          <div style="font-size:11px;color:white;margin-top:4px">${unlocked ? s.name : '???'}</div>
          <div style="font-size:9px;color:#aab;margin-top:2px">${unlocked ? '' : s.desc}</div>
        </div>
      `;
    }).join('');
    const unlockedCount = SPECTRES.filter(s => hasUnlocked(s.id)).length;
    modal.innerHTML = `
      <div style="background:#1a2236;color:white;padding:24px;border-radius:8px;max-width:680px;width:90vw;max-height:85vh;overflow-y:auto;border:2px solid #ffd23f">
        <h2 style="margin:0 0 8px 0;color:#ffd23f">Carnet des Spectres</h2>
        <p style="color:#aab;font-size:13px;margin:0 0 16px 0">${unlockedCount} / ${SPECTRES.length} découverts</p>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px">${grid}</div>
        <button id="carnet-close" style="margin-top:18px;padding:10px 18px;background:#555;color:white;border:0;border-radius:4px;cursor:pointer;float:right">Fermer</button>
      </div>
    `;
    document.body.appendChild(modal);
    modal.querySelector("#carnet-close").onclick = () => modal.remove();
    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
  }

  return { unlock, hasUnlocked, showCarnet };
}
