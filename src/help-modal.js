export function showInteractionsModal() {
  const existing = document.getElementById("help-modal");
  if (existing) { existing.remove(); return; }

  const modal = document.createElement("div");
  modal.id = "help-modal";
  modal.style.cssText =
    "position:fixed;inset:0;background:rgba(0,0,0,0.88);display:flex;align-items:flex-start;justify-content:center;z-index:99999;font-family:system-ui,sans-serif;overflow-y:auto;padding:20px;box-sizing:border-box";

  const box = document.createElement("div");
  box.style.cssText =
    "background:#1a2236;color:white;padding:24px 28px;border-radius:10px;max-width:620px;width:90vw;border:2px solid #ffd23f;position:relative;margin:auto";

  box.innerHTML = `
<button id="help-close" style="position:absolute;top:14px;right:16px;background:#444;color:white;border:0;border-radius:4px;padding:6px 14px;cursor:pointer;font-size:14px">Fermer</button>
<h2 style="margin:0 0 20px 0;color:#ffd23f;font-size:20px">Comment jouer &mdash; Aide / Interactions</h2>

<h3 style="color:#ff9a4a;margin:16px 0 10px 0;font-size:15px;border-bottom:1px solid #333;padding-bottom:6px">🧱 Tuiles de construction</h3>
<table style="width:100%;border-collapse:collapse;font-size:13px">
  <colgroup><col style="width:32px"><col style="width:170px"><col></colgroup>
  <tbody>
    <tr><td>🟧</td><td style="padding:4px 8px;color:#ffa060;font-weight:bold">Lave</td><td style="padding:4px 0;color:#ccc">Transforme le passager humain en squelette au passage du wagon.</td></tr>
    <tr><td>🟦</td><td style="padding:4px 8px;color:#60c0ff;font-weight:bold">Eau</td><td style="padding:4px 0;color:#ccc">Annule la transformation : le squelette redevient humain.</td></tr>
    <tr><td>➖</td><td style="padding:4px 8px;color:#dde;font-weight:bold">Rail horizontal</td><td style="padding:4px 0;color:#ccc">Solide, le wagon roule dessus à vitesse normale.</td></tr>
    <tr><td>↗</td><td style="padding:4px 8px;color:#90d0ff;font-weight:bold">Rail diagonal montant</td><td style="padding:4px 0;color:#ccc">Le wagon monte en pente vers la droite.</td></tr>
    <tr><td>↘</td><td style="padding:4px 8px;color:#90d0ff;font-weight:bold">Rail diagonal descendant</td><td style="padding:4px 0;color:#ccc">Le wagon descend en pente vers la droite.</td></tr>
    <tr><td>🪙</td><td style="padding:4px 8px;color:#ffd23f;font-weight:bold">Pièce</td><td style="padding:4px 0;color:#ccc">+5 pts au passage du wagon, disparaît puis se régénère.</td></tr>
    <tr><td>⚡</td><td style="padding:4px 8px;color:#ffe060;font-weight:bold">Boost</td><td style="padding:4px 0;color:#ccc">Multiplie la vitesse du wagon ×2.2 pendant 1.5 secondes.</td></tr>
    <tr><td>🎢</td><td style="padding:4px 8px;color:#ff60a0;font-weight:bold">Trampoline</td><td style="padding:4px 0;color:#ccc">Fait rebondir le wagon en l'air au passage.</td></tr>
    <tr><td>🌬</td><td style="padding:4px 8px;color:#b0e0f0;font-weight:bold">Ventilateur</td><td style="padding:4px 0;color:#ccc">Pousse le wagon vers le haut avec une force ascendante.</td></tr>
    <tr><td>🔮</td><td style="padding:4px 8px;color:#c090f0;font-weight:bold">Portail (×2)</td><td style="padding:4px 0;color:#ccc">Téléporte le wagon entre les 2 portails appariés (bleu ↔ violet).</td></tr>
    <tr><td>🧊</td><td style="padding:4px 8px;color:#c8ebff;font-weight:bold">Glace</td><td style="padding:4px 0;color:#ccc">Réduit le frottement : le wagon glisse plus vite.</td></tr>
    <tr><td>🧲</td><td style="padding:4px 8px;color:#e050a0;font-weight:bold">Aimant</td><td style="padding:4px 0;color:#ccc">Attire les pièces voisines vers le wagon au passage.</td></tr>
    <tr><td>🌉</td><td style="padding:4px 8px;color:#a06428;font-weight:bold">Pont</td><td style="padding:4px 0;color:#ccc">Solide au 1er wagon ; se casse au 2e et se transforme en lave.</td></tr>
    <tr><td>🎡</td><td style="padding:4px 8px;color:#50dce0;font-weight:bold">Grande Roue (3×3)</td><td style="padding:4px 0;color:#ccc">Tourne en continu et lâche des pièces ou un VIP depuis le sommet.</td></tr>
    <tr><td>❌</td><td style="padding:4px 8px;color:#e05050;font-weight:bold">Gomme</td><td style="padding:4px 0;color:#ccc">Efface la tuile sous le curseur.</td></tr>
  </tbody>
</table>

<h3 style="color:#ffe060;margin:20px 0 10px 0;font-size:15px;border-bottom:1px solid #333;padding-bottom:6px">✨ Combos émergents</h3>
<ul style="margin:0;padding-left:18px;font-size:13px;color:#ccc;line-height:1.8">
  <li>💧+🟧 <b style="color:#fff">Eau + Lave adjacents</b> &mdash; génère de la vapeur entre les deux tuiles.</li>
  <li>🪙🪙🪙 <b style="color:#ffd23f">3 pièces alignées en diagonale</b> &mdash; <b style="color:#ffd23f">"CHAINE D'OR"</b> : combo freeze 4 secondes.</li>
  <li>🚂🚂 <b style="color:#fff">2 wagons en collision</b> &mdash; <b style="color:#ff8060">"CRASH! +50 pts"</b>.</li>
  <li>💀 <b style="color:#fff">Squelette éliminé</b> &mdash; <b style="color:#aaa">"Dette Fantôme"</b> : un squelette fantôme repart en arrière et peut rembarquer.</li>
  <li>🦆 <b style="color:#fff">Bassin ≥ 3 tuiles eau</b> &mdash; des canards apparaissent ; clic pour +30 pts (ou +200 si canard doré).</li>
</ul>

<h3 style="color:#80e0ff;margin:20px 0 10px 0;font-size:15px;border-bottom:1px solid #333;padding-bottom:6px">🎮 Mécaniques de jeu</h3>
<ul style="margin:0;padding-left:18px;font-size:13px;color:#ccc;line-height:1.8">
  <li>🎯 <b style="color:#ff80e0">Combo ×2 / ×3 / ×5 / ×8</b> &mdash; enchaîner des transformations rapides en moins de 2 s.</li>
  <li>⚡ <b style="color:#ffe060">APOCALYPSE ×5</b> &mdash; cascade qui transforme tous les visiteurs visibles à l'écran.</li>
  <li>👻 <b style="color:#aaa">Train Fantôme</b> &mdash; toutes les 45 s, wagon noir aux yeux rouges ; +100 pts si transformé.</li>
  <li>🎩 <b style="color:#fff">VIP</b> &mdash; 1 visiteur sur 8 porte un chapeau haut-de-forme : +50 pts au lieu de +10.</li>
  <li>🎆 <b style="color:#ffa0ff">Feux d'artifice</b> &mdash; déclenchés à chaque palier de score : 50 / 100 / 250 / 500 / 1000 pts.</li>
</ul>

<h3 style="color:#a0e080;margin:20px 0 10px 0;font-size:15px;border-bottom:1px solid #333;padding-bottom:6px">🕹 Contrôles clavier</h3>
<table style="width:100%;border-collapse:collapse;font-size:13px">
  <thead>
    <tr style="color:#aaa;text-align:left">
      <th style="padding:4px 8px 6px 0">Joueur</th>
      <th style="padding:4px 8px 6px 0">Couleur</th>
      <th style="padding:4px 8px 6px 0">Marche</th>
      <th style="padding:4px 8px 6px 0">Saut</th>
      <th style="padding:4px 8px 6px 0">Wagon</th>
    </tr>
  </thead>
  <tbody style="color:#ccc">
    <tr><td style="padding:3px 0">Mario</td><td style="padding:3px 8px"><span style="color:#ff6060">🔴</span></td><td style="padding:3px 8px;font-family:monospace;color:#fff">A / D</td><td style="padding:3px 8px;font-family:monospace;color:#fff">Espace / Z</td><td style="padding:3px 8px;font-family:monospace;color:#fff">E</td></tr>
    <tr><td style="padding:3px 0">Pika</td><td style="padding:3px 8px"><span style="color:#ffe060">🟡</span></td><td style="padding:3px 8px;font-family:monospace;color:#fff">J / L</td><td style="padding:3px 8px;font-family:monospace;color:#fff">I</td><td style="padding:3px 8px;font-family:monospace;color:#fff">O</td></tr>
    <tr><td style="padding:3px 0">Luigi</td><td style="padding:3px 8px"><span style="color:#60e060">🟢</span></td><td style="padding:3px 8px;font-family:monospace;color:#fff">← / →</td><td style="padding:3px 8px;font-family:monospace;color:#fff">↑</td><td style="padding:3px 8px;font-family:monospace;color:#fff">Entrée</td></tr>
    <tr><td style="padding:3px 0">Toad</td><td style="padding:3px 8px"><span style="color:#c070ff">🟣</span></td><td style="padding:3px 8px;font-family:monospace;color:#fff">F / H</td><td style="padding:3px 8px;font-family:monospace;color:#fff">T</td><td style="padding:3px 8px;font-family:monospace;color:#fff">G</td></tr>
  </tbody>
</table>
<p style="font-size:11px;color:#888;margin:8px 0 0 0">Raccourcis globaux : <b style="color:#aaa">X</b> Spawn wagon &nbsp;·&nbsp; <b style="color:#aaa">C</b> Vider visiteurs &nbsp;·&nbsp; <b style="color:#aaa">R</b> Reset &nbsp;·&nbsp; <b style="color:#aaa">P / Echap</b> Pause &nbsp;·&nbsp; <b style="color:#aaa">M</b> Son &nbsp;·&nbsp; <b style="color:#aaa">N</b> Nuit</p>

<h3 style="color:#ffb0b0;margin:20px 0 10px 0;font-size:15px;border-bottom:1px solid #333;padding-bottom:6px">📱 Mobile</h3>
<ul style="margin:0;padding-left:18px;font-size:13px;color:#ccc;line-height:1.8">
  <li>4 boutons tactiles overlay : <b style="color:#fff">◀ ▶ ⬆ 🚃</b> (gauche, droite, saut, wagon).</li>
  <li>Ajouter <b style="color:#ffd23f">?mobile=1</b> dans l'URL pour afficher les boutons sur desktop.</li>
</ul>

<div style="text-align:center;margin-top:20px">
  <button id="help-close-bot" style="background:#3a5080;color:white;border:0;border-radius:4px;padding:10px 28px;cursor:pointer;font-size:14px;font-weight:bold">Fermer</button>
</div>
`;

  modal.appendChild(box);
  document.body.appendChild(modal);

  const close = () => modal.remove();
  box.querySelector("#help-close").onclick = close;
  box.querySelector("#help-close-bot").onclick = close;
  modal.onclick = (e) => { if (e.target === modal) close(); };
}
