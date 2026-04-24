export function renderAlchemyTab(save, listCombosFn) {
  if (!listCombosFn) return "<em style='color:#b4c8e8'>Chargement...</em>";
  const defs = listCombosFn().filter((d) => d.id !== "test");
  const total = defs.length;
  const found = defs.filter((d) => save.combos & (1 << d.bitIndex)).length;

  const cards = defs.map((def) => {
    const has = !!(save.combos & (1 << def.bitIndex));
    const col = `rgb(${def.color[0]},${def.color[1]},${def.color[2]})`;
    const stars = "★".repeat(def.difficulty) + "☆".repeat(Math.max(0, 3 - def.difficulty));
    const filt = has ? "" : "filter:blur(3px) grayscale(1);";
    const op = has ? "1" : "0.35";
    const border = has ? col : "#444";
    const bg = has ? "#2a3050" : "#1a1f30";
    const nameHtml = has
      ? `<div style="font-size:11px;color:${col};font-weight:bold;margin:4px 0 2px">${def.name}</div>`
      : `<div style="font-size:11px;color:#667;font-weight:bold;margin:4px 0 2px">???</div>`;
    const descHtml = has
      ? `<div style="font-size:9px;color:#b4c8e8;line-height:1.3">${def.codexDesc}</div>`
      : `<div style="font-size:9px;color:#556;line-height:1.3">Decouvre ce combo</div>`;
    const tilesHtml = has
      ? `<div style="font-size:9px;color:#7b92c2;margin-top:3px">${def.codexTiles.join(" + ")}</div>`
      : `<div style="font-size:9px;color:#445;margin-top:3px">???</div>`;
    return `
      <div style="
        background:${bg};padding:10px 8px;border-radius:6px;text-align:center;
        border:1px solid ${border};opacity:${op};
        display:flex;flex-direction:column;align-items:center;
      ">
        <div style="font-size:26px;${filt}">${def.codexEmoji}</div>
        ${nameHtml}
        ${descHtml}
        ${tilesHtml}
        <div style="font-size:9px;color:#ffd23f;margin-top:4px">${stars}</div>
      </div>
    `;
  }).join("");

  return `
    <div style="text-align:center;margin-bottom:14px;color:#b4c8e8;font-size:13px">
      <span style="color:#c090f0;font-weight:bold;font-size:15px">
        ${found} / ${total}
      </span>
      &nbsp;alchimies decouvertes
    </div>
    <div style="
      display:grid;
      grid-template-columns:repeat(4,1fr);
      gap:8px;
    ">${cards}</div>
  `;
}
