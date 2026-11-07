const fs = require('fs');
const path = require('path');

const p = path.join(__dirname, '..', 'public/js/mestre.js');
let c = fs.readFileSync(p, 'utf8');
const isCRLF = c.includes('\r\n');
c = c.replace(/\r\n/g, '\n');

const target = `    const pins = obterPinsDoMapaAtual();
    if (!pins || pins.length === 0) {
      lista.innerHTML = '<p style="color:#717182; font-size:0.85rem; padding:15px; text-align:center;">Nenhuma evidência registrada nesta cena.</p>';
      return;
    }
    pins.forEach(pin => {
      const div = document.createElement('div');
      div.className = 'item-catalogo-evidencia';
      div.style = "display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.07); padding:8px 10px; border-radius:6px;";
      div.innerHTML = \`
        <div style="display:flex; align-items:center; gap:12px; max-width:65%;">
          <div style="width:40px; height:40px; border-radius:4px; overflow:hidden; background:#0f0f16; border:1px solid rgba(234,179,8,0.4); display:flex; align-items:center; justify-content:center; flex-shrink:0;">
            \${pin.imagem ? \`<img src="\${pin.imagem}" style="width:100%; height:100%; object-fit:cover;">\` : \`<span style="font-weight:900; color:#eab308; font-size:0.8rem;">\${pin.numero ? String(pin.numero).padStart(2, '0') : '🔍'}</span>\`}
          </div>
          <div>
            <div style="color:#fff; font-weight:bold; font-size:0.85rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:140px;">\${pin.titulo}</div>
            <div style="color:#a1a1aa; font-size:0.72rem; margin-top:2px;">Coord: \${pin.x}%, \${pin.y}%</div>
          </div>
        </div>
        <div style="display:flex; gap:6px; align-items:center;">
          <button onclick="focarPinNoMapa('\${pin.id}')" style="background:rgba(234,179,8,0.15); border:1px solid #eab308; color:#fef08a; padding:4px 8px; border-radius:4px; font-size:0.75rem; cursor:pointer; font-weight:bold;" title="Ver e Focar no Mapa">👁 Ver</button>
          \${pin.imagem ? \`<button onclick="projetarImagemPinDireto('\${pin.imagem}', '\${pin.titulo.replace(/'/g, "\\\\'")}')" style="background:#581c87; border:1px solid #a855f7; color:#fff; padding:4px 8px; border-radius:4px; font-size:0.75rem; cursor:pointer; font-weight:bold;" title="Projetar na TV">📺 TV</button>\` : ''}
        </div>
      \`;
      lista.appendChild(div);
    });
    return;`;

const replacement = `    const pins = obterPinsDoMapaAtual();
    if (!pins || pins.length === 0) {
      lista.innerHTML = '<p style="color:#717182; font-size:0.85rem; padding:15px; text-align:center;">Nenhuma evidência registrada nesta cena.</p>';
      return;
    }
    if (imagemAtivaNaTV) {
      const banner = document.createElement('div');
      banner.style = "margin-bottom:10px;";
      banner.innerHTML = \`<button onclick="fecharPistaNaTV(); renderizarCatalogo();" style="width:100%; background:#dc2626; color:#fff; border:1px solid #ef4444; border-radius:6px; padding:8px; font-weight:bold; font-size:0.8rem; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:6px; box-shadow:0 0 10px rgba(220,38,38,0.5);"><span>✕</span> Ocultar Imagem da TV</button>\`;
      lista.appendChild(banner);
    }
    pins.forEach(pin => {
      const isProjetada = (imagemAtivaNaTV && pin.imagem && imagemAtivaNaTV === pin.imagem);
      const div = document.createElement('div');
      div.className = 'item-catalogo-evidencia';
      div.style = "display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.07); padding:8px 10px; border-radius:6px;";
      div.innerHTML = \`
        <div style="display:flex; align-items:center; gap:12px; max-width:60%;">
          <div style="width:40px; height:40px; border-radius:4px; overflow:hidden; background:#0f0f16; border:1px solid rgba(234,179,8,0.4); display:flex; align-items:center; justify-content:center; flex-shrink:0;">
            \${pin.imagem ? \`<img src="\${pin.imagem}" style="width:100%; height:100%; object-fit:cover;">\` : \`<span style="font-weight:900; color:#eab308; font-size:0.8rem;">\${pin.numero ? String(pin.numero).padStart(2, '0') : '🔍'}</span>\`}
          </div>
          <div>
            <div style="color:#fff; font-weight:bold; font-size:0.85rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:140px;">\${pin.titulo}</div>
            <div style="color:#a1a1aa; font-size:0.72rem; margin-top:2px;">Coord: \${pin.x}%, \${pin.y}%</div>
          </div>
        </div>
        <div style="display:flex; gap:6px; align-items:center;">
          <button onclick="focarPinNoMapa('\${pin.id}')" style="background:rgba(234,179,8,0.15); border:1px solid #eab308; color:#fef08a; padding:4px 8px; border-radius:4px; font-size:0.75rem; cursor:pointer; font-weight:bold;" title="Ver e Focar no Mapa">👁 Ver</button>
          \${pin.imagem ? (isProjetada ?
            \`<button onclick="fecharPistaNaTV(); renderizarCatalogo();" style="background:#dc2626; border:1px solid #ef4444; color:#fff; padding:4px 8px; border-radius:4px; font-size:0.75rem; cursor:pointer; font-weight:bold;" title="Ocultar da TV">✕ Ocultar</button>\` :
            \`<button onclick="projetarImagemPinDireto('\${pin.imagem}', '\${pin.titulo.replace(/'/g, "\\\\\\'")}'); renderizarCatalogo();" style="background:#581c87; border:1px solid #a855f7; color:#fff; padding:4px 8px; border-radius:4px; font-size:0.75rem; cursor:pointer; font-weight:bold;" title="Projetar na TV">📺 TV</button>\`
          ) : ''}
        </div>
      \`;
      lista.appendChild(div);
    });
    return;`;

if (c.includes(target)) {
  c = c.replace(target, replacement);
  if (isCRLF) c = c.replace(/\n/g, '\r\n');
  fs.writeFileSync(p, c, 'utf8');
  console.log('Sucesso ao atualizar renderizarCatalogo!');
} else {
  console.error('Target nao encontrado');
}
