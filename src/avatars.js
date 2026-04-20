export const AVATARS = [
  { id: "mario",    name: "Mario",     color: "#e63946", origSprite: "player",  skelSprite: "player_skel" },
  { id: "luigi",    name: "Luigi",     color: "#7cc947", origSprite: "luigi",   skelSprite: "luigi_skel" },
  { id: "pika",     name: "Pika",      color: "#ffd23f", origSprite: "pika",    skelSprite: "pika_skel" },
  { id: "toad",     name: "Toad",      color: "#ff4c6d", origSprite: "toad",    skelSprite: "toad_skel" },
  { id: "sonic",    name: "Sonic",     color: "#3a7bd5" },
  { id: "link",     name: "Link",      color: "#3aaa35" },
  { id: "pacman",   name: "Pac-Man",   color: "#ffd700" },
  { id: "kirby",    name: "Kirby",     color: "#ff9eba" },
  { id: "yoshi",    name: "Yoshi",     color: "#5cba47" },
  { id: "bowser",   name: "Bowser",    color: "#ff7f00" },
  { id: "donkey",   name: "DK",        color: "#8b4513" },
  { id: "mega",     name: "Mega Man",  color: "#3296ff" },
  { id: "samus",    name: "Samus",     color: "#ff8800" },
  { id: "crash",    name: "Crash",     color: "#ff5500" },
  { id: "steve",    name: "Steve",     color: "#5fa3d9" },
  { id: "pokeball", name: "Pokeball",  color: "#dc0a2d" },
  { id: "tetris",   name: "Tetris",    color: "#a020f0" },
  { id: "invader",  name: "Invader",   color: "#39ff14" },
  { id: "chief",    name: "M.Chief",   color: "#4a5d2c" },
  { id: "astro",    name: "Astro",     color: "#3399cc" },
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
