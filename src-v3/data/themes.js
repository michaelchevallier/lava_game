export const THEMES = {
  plaine: {
    bg: 0x6fc16d,
    fog: 0x7fd07c,
    ground: 0x6fc16d,
    dirt: 0xe5c89a,
    treeTrunk: 0x6a4422,
    treeLeaves: 0x2f8a3a,
    pathInner: 0xe5c89a,
    pathBorder: 0xa07840,
  },
  foret: {
    bg: 0x2c4a32,
    fog: 0x3d5a40,
    ground: 0x3a5a32,
    dirt: 0xc8a878,
    treeTrunk: 0x3a2010,
    treeLeaves: 0x1a4a22,
    pathInner: 0xd4b888,
    pathBorder: 0x6a4a2a,
  },
  desert: {
    bg: 0xd4a868,
    fog: 0xeac890,
    ground: 0xc89860,
    dirt: 0xf0d8a0,
    treeTrunk: 0x8a5a2a,
    treeLeaves: 0xa8a050,
    pathInner: 0xf0d8a0,
    pathBorder: 0x9a6830,
  },
  volcan: {
    bg: 0x4a1a0a,
    fog: 0x6a2a1a,
    ground: 0x5a2a1a,
    dirt: 0x9a5a30,
    treeTrunk: 0x1a0a0a,
    treeLeaves: 0x6a2010,
    pathInner: 0xc88858,
    pathBorder: 0x6a3010,
  },
};

export function getTheme(themeId) {
  return THEMES[themeId] || THEMES.plaine;
}
