export const CUTSCENES = {
  1: {
    title: "MILAN PARK DEFENSE",
    color: "#ffd23f",
    bgTop: 0x6cce5c,
    bgBottom: 0x2a6a1a,
    panels: [
      "L'été. Le parc d'attractions de Milan ouvre ses portes...",
      "Mais sous la pelouse, la lave gronde. Les visiteurs n'écoutent plus rien.",
      "Tu dois les transformer en squelettes. Pour leur plaisir. Et le tien.",
    ],
    art: [
      "       ☀️",
      "    🌳    🌳",
      "  🎪 → → → → 🚪",
      "    💀💀💀",
    ],
  },
  2: {
    title: "Crépuscule",
    color: "#aaaaff",
    bgTop: 0x1a1a4a,
    bgBottom: 0x4a2a6a,
    panels: [
      "La nuit tombe. Les voleurs de pièces sortent de l'ombre...",
      "Les squelettes du jour reviennent en bande. Lave inutile contre eux.",
      "Sors les blocs d'eau. Et un ventilateur ou deux.",
    ],
    art: [
      "    🌙   ⭐",
      "  💀 💰💰 💀",
      "🎪 ← ←   → 🚪",
      "    ⚡⚡⚡",
    ],
  },
  3: {
    title: "Tempête",
    color: "#88ccff",
    bgTop: 0x2a4a6a,
    bgBottom: 0x4a6a8a,
    panels: [
      "L'orage gronde. Le sol tremble. Les pousseurs arrivent.",
      "Ils renversent tout sur leur passage. Tes tours, tes blocs, tout.",
      "Le trampoline glacé et la catapulte sont tes derniers alliés.",
    ],
    art: [
      "  ⚡  ☁️  ⚡",
      "    💪💪💪",
      "🎪 ⊟ ⊟ → 🚪",
      "  💧 💧 💧",
    ],
  },
  4: {
    title: "Le Volcan",
    color: "#ff4400",
    bgTop: 0x4a0a0a,
    bgBottom: 0x8a2a04,
    panels: [
      "La caldeira est entrée en éruption. Le parc brûle.",
      "Une Reine émerge de la lave. Elle a faim.",
      "Tu es la dernière barrière entre elle et la sortie.",
    ],
    art: [
      "    🌋  🌋",
      "  🔥 🔥 🔥 🔥",
      "🎪 → 👑 → 🚪",
      "  💀 💀 💀 💀",
    ],
  },
  5: {
    title: "Apocalypse",
    color: "#ff66ff",
    bgTop: 0x0a0a0a,
    bgBottom: 0x4a004a,
    panels: [
      "Le Patron de la Foire surgit. Trois phases. Aucune pitié.",
      "Tous tes outils. Toute ta concentration. Tout ton sang-froid.",
      "Le parc, ou rien.",
    ],
    art: [
      "  🎩  🎪  🎩",
      "👁️       👁️",
      "🎪 → 🃏 → 🚪",
      "  ⚔️ ⚔️ ⚔️",
    ],
  },
};

export function getCutscene(worldId) {
  return CUTSCENES[worldId] || null;
}
