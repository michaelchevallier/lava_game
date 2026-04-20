export function showInteractionsModal() {
  const existing = document.getElementById("help-modal");
  if (existing) { existing.remove(); return; }

  const modal = document.createElement("div");
  modal.id = "help-modal";
  modal.style.cssText =
    "position:fixed;inset:0;background:rgba(0,0,0,0.88);display:flex;align-items:flex-start;justify-content:center;z-index:99999;font-family:system-ui,sans-serif;overflow-y:auto;padding:20px;box-sizing:border-box";

  const box = document.createElement("div");
  box.style.cssText =
    "background:#1a2236;color:white;padding:24px 28px;border-radius:10px;max-width:680px;width:92vw;border:2px solid #ffd23f;position:relative;margin:auto";

  box.innerHTML = `
<button id="help-close" style="position:absolute;top:14px;right:16px;background:#444;color:white;border:0;border-radius:4px;padding:6px 14px;cursor:pointer;font-size:14px">Fermer</button>
<h2 style="margin:0 0 18px 0;color:#ffd23f;font-size:20px">Comment jouer &mdash; Aide & Glossaire</h2>

<h3 style="color:#ff9a4a;margin:14px 0 8px 0;font-size:15px;border-bottom:1px solid #333;padding-bottom:6px">🧱 Tuiles de construction</h3>
<table style="width:100%;border-collapse:collapse;font-size:13px">
  <colgroup><col style="width:32px"><col style="width:160px"><col></colgroup>
  <tbody>
    <tr><td>🟧</td><td style="padding:3px 8px;color:#ffa060;font-weight:bold">Lave</td><td style="padding:3px 0;color:#ccc">Transforme le passager humain en squelette au passage du wagon.</td></tr>
    <tr><td>🟦</td><td style="padding:3px 8px;color:#60c0ff;font-weight:bold">Eau</td><td style="padding:3px 0;color:#ccc">Annule la transformation : le squelette redevient humain.</td></tr>
    <tr><td>➖</td><td style="padding:3px 8px;color:#dde;font-weight:bold">Rail horizontal</td><td style="padding:3px 0;color:#ccc">Le wagon roule dessus à vitesse normale.</td></tr>
    <tr><td>↗</td><td style="padding:3px 8px;color:#90d0ff;font-weight:bold">Rail montant</td><td style="padding:3px 0;color:#ccc">Le wagon monte en pente vers la droite.</td></tr>
    <tr><td>↘</td><td style="padding:3px 8px;color:#90d0ff;font-weight:bold">Rail descendant</td><td style="padding:3px 0;color:#ccc">Le wagon descend en pente vers la droite.</td></tr>
    <tr><td>🔁</td><td style="padding:3px 8px;color:#c090f0;font-weight:bold">Looping (rail boucle)</td><td style="padding:3px 0;color:#ccc">Le wagon fait une boucle complète à 360° (+50 pts).</td></tr>
    <tr><td>🪙</td><td style="padding:3px 8px;color:#ffd23f;font-weight:bold">Pièce</td><td style="padding:3px 0;color:#ccc">+10 pts au passage du wagon, se régénère.</td></tr>
    <tr><td>⚡</td><td style="padding:3px 8px;color:#ffe060;font-weight:bold">Boost</td><td style="padding:3px 0;color:#ccc">Vitesse ×2.2 pendant 1.5s. Cumulable : DOUBLE BOOST ×3, MEGA BOOST ×4.5.</td></tr>
    <tr><td>🎢</td><td style="padding:3px 8px;color:#ff60a0;font-weight:bold">Trampoline</td><td style="padding:3px 0;color:#ccc">Fait rebondir le wagon en l'air.</td></tr>
    <tr><td>🌬</td><td style="padding:3px 8px;color:#b0e0f0;font-weight:bold">Ventilateur</td><td style="padding:3px 0;color:#ccc">Pousse le wagon vers le haut.</td></tr>
    <tr><td>🔮</td><td style="padding:3px 8px;color:#c090f0;font-weight:bold">Portail (×2)</td><td style="padding:3px 0;color:#ccc">Téléporte le wagon entre les 2 portails appariés.</td></tr>
    <tr><td>🧊</td><td style="padding:3px 8px;color:#c8ebff;font-weight:bold">Glace</td><td style="padding:3px 0;color:#ccc">Le wagon glisse plus vite (×1.6).</td></tr>
    <tr><td>🧲</td><td style="padding:3px 8px;color:#e050a0;font-weight:bold">Aimant</td><td style="padding:3px 0;color:#ccc">Attire les pièces voisines vers le wagon.</td></tr>
    <tr><td>🌉</td><td style="padding:3px 8px;color:#a06428;font-weight:bold">Pont</td><td style="padding:3px 0;color:#ccc">Se casse au 2e passage, devient lave.</td></tr>
    <tr><td>🎡</td><td style="padding:3px 8px;color:#50dce0;font-weight:bold">Grande Roue (3×3)</td><td style="padding:3px 0;color:#ccc">Tourne en continu et lâche pièces ou VIP.</td></tr>
    <tr><td>🕳</td><td style="padding:3px 8px;color:#a050ff;font-weight:bold">Tunnel Maudit</td><td style="padding:3px 0;color:#ccc">Wagon disparaît, ressort avec humains→squelettes + duplication (max 4 passagers).</td></tr>
    <tr><td>🟫</td><td style="padding:3px 8px;color:#a08060;font-weight:bold">Sol</td><td style="padding:3px 0;color:#ccc">Crée du sol éditable n'importe où.</td></tr>
    <tr><td>❌</td><td style="padding:3px 8px;color:#e05050;font-weight:bold">Gomme</td><td style="padding:3px 0;color:#ccc">Efface la tuile sous le curseur.</td></tr>
  </tbody>
</table>

<h3 style="color:#ffe060;margin:18px 0 8px 0;font-size:15px;border-bottom:1px solid #333;padding-bottom:6px">✨ Combos & interactions émergentes</h3>
<ul style="margin:0;padding-left:18px;font-size:13px;color:#ccc;line-height:1.7">
  <li>💧 + 🟧 <b style="color:#fff">Eau + Lave adjacents</b> &mdash; vapeur entre les deux tuiles.</li>
  <li>🪙🪙🪙 <b style="color:#ffd23f">3 pièces alignées en diagonale</b> &mdash; "CHAINE D'OR" : freeze combo 4s.</li>
  <li>🚂🚂 <b style="color:#fff">2 wagons en collision</b> &mdash; "CRASH! +50 pts" + étincelles.</li>
  <li>🧲 + 🔮 <b style="color:#fff">Aimant + Portail</b> &mdash; "Téléport Magnétique" : pluie de pièces.</li>
  <li>🧊🧊🧊 + 🧲 <b style="color:#fff">Glace en zone + Aimant</b> &mdash; Couronne d'Hiver (visuel pulse).</li>
  <li>💀 <b style="color:#fff">Squelette éliminé</b> &mdash; "Dette Fantôme" : un fantôme repart à gauche.</li>
  <li>🦆 <b style="color:#fff">Bassin ≥3 tuiles eau</b> &mdash; canards à pêcher au clic (+30 / +200 doré).</li>
  <li>🏗 <b style="color:#fff">Cascades de transformations</b> &mdash; Combo ×2/×3/×5/×8 → APOCALYPSE.</li>
  <li>🎳 <b style="color:#ff8060">3 tuiles sol empilées</b> &mdash; "CHAMBOULE-TOUT" : boîtes clic +20 pts, triple &lt;3s = +100 bonus.</li>
  <li>🎰 <b style="color:#ffb040">5 pièces en + (centre+N/S/E/O)</b> &mdash; "ROUE DE FORTUNE" : clic pour spin, récompense +10→+500 pts.</li>
</ul>

<h3 style="color:#80e0ff;margin:18px 0 8px 0;font-size:15px;border-bottom:1px solid #333;padding-bottom:6px">🎮 Mécaniques de jeu</h3>
<ul style="margin:0;padding-left:18px;font-size:13px;color:#ccc;line-height:1.7">
  <li>🚃 <b style="color:#fff">Multi-passagers</b> &mdash; jusqu'à 4 visiteurs montent automatiquement dans un wagon.</li>
  <li>🎯 <b style="color:#ff80e0">Combo ×2 / ×3 / ×5 / ×8</b> &mdash; enchaîner des transformations rapides en moins de 2.5 s.</li>
  <li>⚡ <b style="color:#ffe060">APOCALYPSE ×5</b> &mdash; cascade qui transforme tous les visiteurs visibles.</li>
  <li>👻 <b style="color:#aaa">Train Fantôme</b> &mdash; toutes les 45 s, wagon noir aux yeux rouges, +100 pts si transformé.</li>
  <li>🔄 <b style="color:#ff80a0">Train Inverse</b> &mdash; spawn anti-AFK après 20s sans action, +500 pts si éliminé.</li>
  <li>👑 <b style="color:#ffd23f">Wagon Doré</b> &mdash; 7% de chance, points ×2.</li>
  <li>🎩 <b style="color:#fff">VIP</b> &mdash; 1 visiteur sur 8 porte un chapeau : +50 pts au lieu de +10.</li>
  <li>🏁 <b style="color:#ffd23f">Course de Wagons (F2)</b> &mdash; mode 2P 3 tours, gagnant +500 pts.</li>
  <li>🎆 <b style="color:#ffa0ff">Feux d'artifice</b> &mdash; à chaque palier : 50 / 100 / 250 / 500 / 1000 pts.</li>
  <li>🏅 <b style="color:#ffe080">Tier system</b> &mdash; objectifs progressifs débloquent les tuiles avancées.</li>
  <li>📜 <b style="color:#c090f0">Carnet des Spectres</b> &mdash; 25 collectibles à débloquer (cog → Carnet).</li>
</ul>

<h3 style="color:#ffb080;margin:18px 0 8px 0;font-size:15px;border-bottom:1px solid #333;padding-bottom:6px">🌦 Événements aléatoires</h3>
<ul style="margin:0;padding-left:18px;font-size:13px;color:#ccc;line-height:1.7">
  <li>⚡ <b style="color:#fff">Orage</b> &mdash; éclair frappe au sol, transforme les visiteurs proches.</li>
  <li>🪙 <b style="color:#ffd23f">Pluie d'Or</b> &mdash; pièces tombent du ciel pendant quelques secondes.</li>
  <li>🌪 <b style="color:#aaf">Vent fort</b> &mdash; pousse les wagons et visiteurs.</li>
  <li>👻 <b style="color:#c090f0">Voleur Fantôme</b> &mdash; arrive toutes les 25-35s, vole les pièces (3 collisions joueur pour le vaincre).</li>
</ul>

<h3 style="color:#a0e080;margin:18px 0 8px 0;font-size:15px;border-bottom:1px solid #333;padding-bottom:6px">🕹 Contrôles clavier</h3>
<table style="width:100%;border-collapse:collapse;font-size:13px">
  <thead>
    <tr style="color:#aaa;text-align:left">
      <th style="padding:4px 8px 6px 0">Joueur</th>
      <th style="padding:4px 8px 6px 0">Couleur</th>
      <th style="padding:4px 8px 6px 0">Marche</th>
      <th style="padding:4px 8px 6px 0">Saut</th>
      <th style="padding:4px 8px 6px 0">Wagon</th>
      <th style="padding:4px 8px 6px 0">Respawn</th>
    </tr>
  </thead>
  <tbody style="color:#ccc">
    <tr><td style="padding:3px 0">Joueur 1</td><td style="padding:3px 8px"><span style="color:#ff6060">🔴</span></td><td style="padding:3px 8px;font-family:monospace;color:#fff">A / D</td><td style="padding:3px 8px;font-family:monospace;color:#fff">Espace / Z</td><td style="padding:3px 8px;font-family:monospace;color:#fff">E</td><td style="padding:3px 8px;font-family:monospace;color:#fff">Q</td></tr>
    <tr><td style="padding:3px 0">Joueur 2</td><td style="padding:3px 8px"><span style="color:#ffe060">🟡</span></td><td style="padding:3px 8px;font-family:monospace;color:#fff">J / L</td><td style="padding:3px 8px;font-family:monospace;color:#fff">I</td><td style="padding:3px 8px;font-family:monospace;color:#fff">O</td><td style="padding:3px 8px;font-family:monospace;color:#fff">H</td></tr>
  </tbody>
</table>
<p style="font-size:11px;color:#888;margin:8px 0 0 0">Quand tu es dans le wagon : <b style="color:#aaa">←</b> freine &nbsp;·&nbsp; <b style="color:#aaa">→</b> accélère.</p>

<h3 style="color:#ffd23f;margin:18px 0 8px 0;font-size:15px;border-bottom:1px solid #333;padding-bottom:6px">⌨️ Raccourcis globaux</h3>
<p style="font-size:12px;color:#ccc;margin:0;line-height:1.8">
  <b style="color:#fff">X</b> Spawn wagon &nbsp;·&nbsp;
  <b style="color:#fff">F2</b> Course de Wagons (2P) &nbsp;·&nbsp;
  <b style="color:#fff">C</b> Vider visiteurs &nbsp;·&nbsp;
  <b style="color:#fff">R</b> Reset parc &nbsp;·&nbsp;
  <b style="color:#fff">P / Echap</b> Pause &nbsp;·&nbsp;
  <b style="color:#fff">M</b> Son ON/OFF &nbsp;·&nbsp;
  <b style="color:#fff">N</b> Jour / Nuit
</p>

<h3 style="color:#ffb0b0;margin:18px 0 8px 0;font-size:15px;border-bottom:1px solid #333;padding-bottom:6px">📱 Mobile</h3>
<ul style="margin:0;padding-left:18px;font-size:13px;color:#ccc;line-height:1.7">
  <li>4 boutons tactiles : <b style="color:#fff">◀ ▶ ⬆ 🚃</b> (gauche, droite, saut, wagon).</li>
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
