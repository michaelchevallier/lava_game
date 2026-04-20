// sizeMult : échelle visuelle du sprite joueur (1 = taille visiteur normal, max 5)
// Chaque perso a sa propre taille pour le distinguer et l'identifier (plombier court, boss géant, etc.)
// hitbox : [x, y, w, h] en coords locales du sprite. Les sprites 20×30 (scale 2 = 40×60)
// utilisent un hitbox plus grand pour coller au sol ; les 14×22 (scale 2 = 28×44) le petit.
export const AVATARS = [
  { id: "mario",    name: "Mario",     color: "#e63946", origSprite: "player",   skelSprite: "player_skel",      sizeMult: 1.5, hitbox: [8, 6, 24, 54] },
  { id: "luigi",    name: "Luigi",     color: "#7cc947", origSprite: "luigi",    skelSprite: "luigi_skel",       sizeMult: 1.7, hitbox: [8, 6, 24, 54] },
  { id: "pika",     name: "Pika",      color: "#ffd23f", origSprite: "pika",     skelSprite: "pika_skel",        sizeMult: 1.3, hitbox: [8, 6, 24, 54] },
  { id: "toad",     name: "Toad",      color: "#ff4c6d", origSprite: "toad",     skelSprite: "toad_skel",        sizeMult: 1.35, hitbox: [8, 6, 24, 54] },
  { id: "sonic",    name: "Sonic",     color: "#3a7bd5", origSprite: "sonic",    skelSprite: "skeleton_generic", sizeMult: 1.5 },
  { id: "link",     name: "Link",      color: "#3aaa35", origSprite: "link",     skelSprite: "skeleton_generic", sizeMult: 1.6 },
  { id: "pacman",   name: "Pac-Man",   color: "#ffd700", origSprite: "pacman",   skelSprite: "skeleton_generic", sizeMult: 1.8 },
  { id: "kirby",    name: "Kirby",     color: "#ff9eba", origSprite: "kirby",    skelSprite: "skeleton_generic", sizeMult: 1.3 },
  { id: "yoshi",    name: "Yoshi",     color: "#5cba47", origSprite: "yoshi",    skelSprite: "skeleton_generic", sizeMult: 1.9 },
  { id: "bowser",   name: "Bowser",    color: "#ff7f00", origSprite: "bowser",   skelSprite: "skeleton_generic", sizeMult: 2.6 },
  { id: "donkey",   name: "DK",        color: "#8b4513", origSprite: "donkey",   skelSprite: "skeleton_generic", sizeMult: 2.4 },
  { id: "mega",     name: "Mega Man",  color: "#3296ff", origSprite: "mega",     skelSprite: "skeleton_generic", sizeMult: 1.5 },
  { id: "samus",    name: "Samus",     color: "#ff8800", origSprite: "samus",    skelSprite: "skeleton_generic", sizeMult: 1.8 },
  { id: "crash",    name: "Crash",     color: "#ff5500", origSprite: "crash",    skelSprite: "skeleton_generic", sizeMult: 1.6 },
  { id: "steve",    name: "Steve",     color: "#5fa3d9", origSprite: "steve",    skelSprite: "skeleton_generic", sizeMult: 1.7 },
  { id: "pokeball", name: "Pokeball",  color: "#dc0a2d", origSprite: "pokeball", skelSprite: "skeleton_generic", sizeMult: 1.2 },
  { id: "tetris",   name: "Tetris",    color: "#a020f0", origSprite: "tetris",   skelSprite: "skeleton_generic", sizeMult: 1.6 },
  { id: "invader",  name: "Invader",   color: "#39ff14", origSprite: "invader",  skelSprite: "skeleton_generic", sizeMult: 1.4 },
  { id: "chief",    name: "M.Chief",   color: "#4a5d2c", origSprite: "chief",    skelSprite: "skeleton_generic", sizeMult: 2.1 },
  { id: "astro",    name: "Astro",     color: "#3399cc", origSprite: "astro",    skelSprite: "skeleton_generic", sizeMult: 1.7 },
];

export function getAvatarById(id) {
  return AVATARS.find(a => a.id === id) || AVATARS[0];
}

export function avatarBadgeHtml(avatar, size = 48, selected = false) {
  const border = selected
    ? `3px solid #ffd23f`
    : `2px solid rgba(255,255,255,0.25)`;
  const scale = selected ? "scale(1.05)" : "scale(1)";
  const bg = selected ? avatar.color : avatar.color + "cc";
  const label = avatar.name.length > 6 ? avatar.name.slice(0, 5) + "." : avatar.name;
  const fontSize = size * 0.22;
  return `<div
    data-avatar-id="${avatar.id}"
    title="${avatar.name}"
    style="
      width:${size}px;height:${size}px;border-radius:8px;
      background:${bg};
      display:flex;flex-direction:column;align-items:center;justify-content:center;
      color:#fff;font-weight:bold;
      font-size:${fontSize}px;
      border:${border};
      text-shadow:1px 1px 0 rgba(0,0,0,0.6);
      cursor:pointer;
      transform:${scale};
      transition:transform 0.12s,border 0.12s,background 0.12s;
      box-sizing:border-box;
      user-select:none;
      text-align:center;
      line-height:1.2;
      padding:2px;
    "
  >${avatar.id.slice(0,1).toUpperCase()}<span style="font-size:${fontSize * 0.85}px;font-weight:normal;opacity:0.9">${label}</span></div>`;
}
