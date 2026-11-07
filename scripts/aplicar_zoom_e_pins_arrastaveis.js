const fs = require('fs');
const path = require('path');

const mestreJsPath = path.join(__dirname, '..', 'public/js/mestre.js');
let content = fs.readFileSync(mestreJsPath, 'utf8');

const isCRLF = content.includes('\r\n');
content = content.replace(/\r\n/g, '\n');

// 1. Atualizar ajustarZoomManual
const ajustarZoomOld = `function ajustarZoomManual(delta) { vttState.camera.zoom = Math.max(0.5, Math.min(4, vttState.camera.zoom + delta)); atualizarCamera(true); }`;
const ajustarZoomNew = `function ajustarZoomManual(delta) {
  const viewport = document.getElementById('beta-viewport');
  const vpW = viewport ? viewport.offsetWidth : window.innerWidth;
  const vpH = viewport ? viewport.offsetHeight : window.innerHeight;
  const mx = vpW / 2;
  const my = vpH / 2;
  const zoomOld = vttState.camera.zoom;
  const zoomNew = Math.max(0.35, Math.min(5.0, zoomOld + delta));
  if (Math.abs(zoomNew - zoomOld) < 0.001) return;
  vttState.camera.x = mx - (mx - vttState.camera.x) * (zoomNew / zoomOld);
  vttState.camera.y = my - (my - vttState.camera.y) * (zoomNew / zoomOld);
  vttState.camera.zoom = zoomNew;
  atualizarCamera(true);
}`;

if (content.includes(ajustarZoomOld)) {
  content = content.replace(ajustarZoomOld, ajustarZoomNew);
  console.log('1. ajustarZoomManual atualizado!');
} else {
  console.log('1. ajustarZoomManual padrão diferente.');
}

// 2. Atualizar wheel listener para dar zoom no cursor do mouse
const wheelOld = `  viewportEl.addEventListener('wheel', function(e) { e.preventDefault(); vttState.camera.zoom = Math.max(0.5, Math.min(4, vttState.camera.zoom + (e.deltaY < 0 ? 0.1 : -0.1))); atualizarCamera(true); }, { passive: false });`;

const wheelNew = `  viewportEl.addEventListener('wheel', function(e) {
    e.preventDefault();
    const rect = viewportEl.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const zoomOld = vttState.camera.zoom;
    const factor = e.deltaY < 0 ? 1.14 : (1 / 1.14);
    const zoomNew = Math.max(0.35, Math.min(5.0, zoomOld * factor));
    
    if (Math.abs(zoomNew - zoomOld) < 0.001) return;

    vttState.camera.x = mouseX - (mouseX - vttState.camera.x) * (zoomNew / zoomOld);
    vttState.camera.y = mouseY - (mouseY - vttState.camera.y) * (zoomNew / zoomOld);
    vttState.camera.zoom = zoomNew;

    atualizarCamera(true);
  }, { passive: false });`;

if (content.includes(wheelOld)) {
  content = content.replace(wheelOld, wheelNew);
  console.log('2. wheel zoom no cursor do mouse atualizado!');
} else {
  console.log('2. wheelOld não encontrado.');
}

// 3. Atualizar mousemove para incluir arrasto de pins
const mousemovePinOld = `window.addEventListener('mousemove', (e) => {
  if (isMarqueeSelecting) {`;

const mousemovePinNew = `let pinArrastando = null;
let pinDragStartPos = { x: 0, y: 0 };
let pinFoiArrastado = false;

window.addEventListener('mousemove', (e) => {
  if (pinArrastando) {
    e.preventDefault();
    const dist = Math.hypot(e.clientX - pinDragStartPos.x, e.clientY - pinDragStartPos.y);
    if (dist > 3) {
      pinFoiArrastado = true;
    }
    const container = document.getElementById('beta-mapa-container');
    if (container) {
      const rect = container.getBoundingClientRect();
      let rawX = Math.max(0.5, Math.min(99.5, ((e.clientX - rect.left) / rect.width) * 100));
      let rawY = Math.max(0.5, Math.min(99.5, ((e.clientY - rect.top) / rect.height) * 100));
      
      pinArrastando.x = Math.round(rawX * 10) / 10;
      pinArrastando.y = Math.round(rawY * 10) / 10;

      const pinEl = document.getElementById('vtt-pin-' + pinArrastando.id);
      if (pinEl) {
        pinEl.style.left = pinArrastando.x + '%';
        pinEl.style.top = pinArrastando.y + '%';
      }
    }
    return;
  }

  if (isMarqueeSelecting) {`;

if (content.includes(mousemovePinOld)) {
  content = content.replace(mousemovePinOld, mousemovePinNew);
  console.log('3. mousemove atualizado com suporte a arrastar pins!');
} else {
  console.log('3. mousemovePinOld não encontrado.');
}

// 4. Atualizar mouseup para soltar o pin e salvar
const mouseupPinOld = `  if (tokenArrastandoId) { tokenArrastandoId = null; salvarEstadoTabuleiro(); }`;

const mouseupPinNew = `  if (pinArrastando) {
    const pinEl = document.getElementById('vtt-pin-' + pinArrastando.id);
    if (pinEl) {
      pinEl.classList.remove('arrastando');
    }
    if (pinFoiArrastado) {
      salvarPosicaoPinAtualizada(pinArrastando);
      mostrarToast(\`Evidência "\${pinArrastando.titulo}" reposicionada para (\${pinArrastando.x}%, \${pinArrastando.y}%)\`, 'sucesso');
    } else {
      abrirCardInspecaoVTT(pinArrastando);
    }
    pinArrastando = null;
    pinFoiArrastado = false;
  }

  if (tokenArrastandoId) { tokenArrastandoId = null; salvarEstadoTabuleiro(); }`;

if (content.includes(mouseupPinOld)) {
  content = content.replace(mouseupPinOld, mouseupPinNew);
  console.log('4. mouseup atualizado com término de arrasto de pins!');
} else {
  console.log('4. mouseupPinOld não encontrado.');
}

// 5. Atualizar touchmove e touchend
const touchmoveOld = `window.addEventListener('touchmove', function(e) {
  if (tokenArrastandoId && e.touches && e.touches.length > 0) {`;

const touchmoveNew = `window.addEventListener('touchmove', function(e) {
  if (pinArrastando && e.touches && e.touches.length > 0) {
    e.preventDefault();
    const touch = e.touches[0];
    const dist = Math.hypot(touch.clientX - pinDragStartPos.x, touch.clientY - pinDragStartPos.y);
    if (dist > 5) pinFoiArrastado = true;
    const container = document.getElementById('beta-mapa-container');
    if (container) {
      const rect = container.getBoundingClientRect();
      let rawX = Math.max(0.5, Math.min(99.5, ((touch.clientX - rect.left) / rect.width) * 100));
      let rawY = Math.max(0.5, Math.min(99.5, ((touch.clientY - rect.top) / rect.height) * 100));
      pinArrastando.x = Math.round(rawX * 10) / 10;
      pinArrastando.y = Math.round(rawY * 10) / 10;
      const pinEl = document.getElementById('vtt-pin-' + pinArrastando.id);
      if (pinEl) {
        pinEl.style.left = pinArrastando.x + '%';
        pinEl.style.top = pinArrastando.y + '%';
      }
    }
    return;
  }
  if (tokenArrastandoId && e.touches && e.touches.length > 0) {`;

if (content.includes(touchmoveOld)) {
  content = content.replace(touchmoveOld, touchmoveNew);
  console.log('5. touchmove atualizado com arrasto de pins no celular!');
} else {
  console.log('5. touchmoveOld não encontrado.');
}

const touchendOld = `window.addEventListener('touchend', function(e) {
  if (tokenArrastandoId) {
    tokenArrastandoId = null;
    salvarEstadoTabuleiro();
  }
});`;

const touchendNew = `window.addEventListener('touchend', function(e) {
  if (pinArrastando) {
    const pinEl = document.getElementById('vtt-pin-' + pinArrastando.id);
    if (pinEl) pinEl.classList.remove('arrastando');
    if (pinFoiArrastado) {
      salvarPosicaoPinAtualizada(pinArrastando);
      mostrarToast(\`Evidência "\${pinArrastando.titulo}" reposicionada para (\${pinArrastando.x}%, \${pinArrastando.y}%)\`, 'sucesso');
    } else {
      abrirCardInspecaoVTT(pinArrastando);
    }
    pinArrastando = null;
    pinFoiArrastado = false;
  }
  if (tokenArrastandoId) {
    tokenArrastandoId = null;
    salvarEstadoTabuleiro();
  }
});`;

if (content.includes(touchendOld)) {
  content = content.replace(touchendOld, touchendNew);
  console.log('6. touchend atualizado com soltura de pins no celular!');
} else {
  console.log('6. touchendOld não encontrado.');
}

// 7. Atualizar desenharPinsNoVTT para anexar eventos mousedown e touchstart
const desenharPinsOld = `function desenharPinsNoVTT() {
  const camada = document.getElementById('beta-camada-pins');
  if (!camada) return;
  camada.innerHTML = '';
  
  const pins = obterPinsDoMapaAtual();
  pins.forEach(pin => {
    const el = document.createElement('div');
    el.className = 'vtt-pin-marker' + (pinFocadoVTT && pinFocadoVTT.id === pin.id ? ' ativo' : '');
    el.id = 'vtt-pin-' + pin.id;
    el.style.left = pin.x + '%';
    el.style.top = pin.y + '%';
    el.innerText = pin.numero ? String(pin.numero).padStart(2, '0') : '🔍';
    el.title = pin.titulo || 'Ponto de Inspeção';

    el.onclick = (e) => {
      e.stopPropagation();
      abrirCardInspecaoVTT(pin);
    };

    camada.appendChild(el);
  });
}`;

const desenharPinsNew = `async function salvarPosicaoPinAtualizada(pin) {
  if (!pin) return;
  if (campanhaAtiva && campanhaAtiva.locais) {
    campanhaAtiva.locais.forEach(loc => {
      (loc.comodos || []).forEach(com => {
        (com.pins || []).forEach(p => {
          if (p.id === pin.id || (pin.numero && p.numero === pin.numero)) {
            p.x = pin.x;
            p.y = pin.y;
          }
        });
      });
    });
    await persistirCampanhaNoServidor(campanhaAtiva);
  }
  if (typeof renderizarCatalogo === 'function' && catalogoAtivo === 'evidencias') {
    renderizarCatalogo();
  }
}
window.salvarPosicaoPinAtualizada = salvarPosicaoPinAtualizada;

function desenharPinsNoVTT() {
  const camada = document.getElementById('beta-camada-pins');
  if (!camada) return;
  camada.innerHTML = '';
  
  const pins = obterPinsDoMapaAtual();
  pins.forEach(pin => {
    const el = document.createElement('div');
    el.className = 'vtt-pin-marker' + (pinFocadoVTT && pinFocadoVTT.id === pin.id ? ' ativo' : '');
    el.id = 'vtt-pin-' + pin.id;
    el.style.left = pin.x + '%';
    el.style.top = pin.y + '%';
    el.innerText = pin.numero ? String(pin.numero).padStart(2, '0') : '🔍';
    el.title = pin.titulo ? \`\${pin.titulo} (Clique para inspecionar, Arraste para mover)\` : 'Ponto de Inspeção';

    el.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;
      e.stopPropagation();
      pinArrastando = pin;
      pinDragStartPos = { x: e.clientX, y: e.clientY };
      pinFoiArrastado = false;
      el.classList.add('arrastando');
    });

    el.addEventListener('touchstart', (e) => {
      if (e.touches && e.touches.length === 1) {
        const touch = e.touches[0];
        pinArrastando = pin;
        pinDragStartPos = { x: touch.clientX, y: touch.clientY };
        pinFoiArrastado = false;
        el.classList.add('arrastando');
      }
    }, { passive: true });

    camada.appendChild(el);
  });
}`;

if (content.includes(desenharPinsOld)) {
  content = content.replace(desenharPinsOld, desenharPinsNew);
  console.log('7. desenharPinsNoVTT atualizado com suporte completo a arrastar!');
} else {
  console.log('7. desenharPinsOld não encontrado.');
}

if (isCRLF) {
  content = content.replace(/\n/g, '\r\n');
}

fs.writeFileSync(mestreJsPath, content, 'utf8');
console.log('public/js/mestre.js atualizado com sucesso!');
