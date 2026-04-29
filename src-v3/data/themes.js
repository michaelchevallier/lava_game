export const THEMES = {
  plaine: {
    bg: 0x6fc16d,
    fog: 0x7fd07c,
    ground: 0x6fc16d,
    dirt: 0xcca06a,
    treeTrunk: 0x6a4422,
    treeLeaves: 0x2f8a3a,
    pathInner: 0x8a5530,
    pathBorder: 0x2a1808,
  },
  foret: {
    bg: 0x2c4a32,
    fog: 0x3d5a40,
    ground: 0x3a5a32,
    dirt: 0x6a4a2a,
    treeTrunk: 0x3a2010,
    treeLeaves: 0x1a4a22,
    pathInner: 0xc89060,
    pathBorder: 0x3a2410,
  },
  desert: {
    bg: 0xd4a868,
    fog: 0xeac890,
    ground: 0xc89860,
    dirt: 0x9a6830,
    treeTrunk: 0x8a5a2a,
    treeLeaves: 0xa8a050,
    pathInner: 0x6a3a18,
    pathBorder: 0x1a0a04,
  },
  volcan: {
    bg: 0x4a1a0a,
    fog: 0x6a2a1a,
    ground: 0x5a2a1a,
    dirt: 0x3a1a0a,
    treeTrunk: 0x1a0a0a,
    treeLeaves: 0x6a2010,
    pathInner: 0xd4a060,
    pathBorder: 0x6a3010,
  },
};

export function getTheme(themeId) {
  return THEMES[themeId] || THEMES.plaine;
}
