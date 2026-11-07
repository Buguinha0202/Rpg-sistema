const fs = require('fs');
const path = require('path');

const mestreJsPath = path.join(__dirname, '..', 'public/js/mestre.js');
let content = fs.readFileSync(mestreJsPath, 'utf8');

// Normalize to LF for matching
const wasCRLF = content.includes('\r\n');
content = content.replace(/\r\n/g, '\n');

// 1. Atualizar sincronizar_estado_inicial
const estadoInicialOriginal = `socket.on('sincronizar_estado_inicial', (estado) => {
  if (!estado) return;
  if (estado.campanhaAtivaId) vttCampanhaAtivaId = estado.campanhaAtivaId;
  const btnPista = document.getElementById('btn-recolher-pista');
  if (btnPista) btnPista.style.display = estado.pistaAbertaUrl ? 'block' : 'none';
});`;

const estadoInicialNovo = `socket.on('sincronizar_estado_inicial', (estado) => {
  if (!estado) return;
  if (estado.campanhaAtivaId) vttCampanhaAtivaId = estado.campanhaAtivaId;
  if (estado.pistaAbertaUrl) {
    atualizarUIHandoutVisivel(estado.pistaAbertaUrl);
  } else {
    atualizarUIHandoutOculto();
  }
});

socket.on('tv_mostrar_handout', (url) => {
  atualizarUIHandoutVisivel(url);
});

socket.on('tv_esconder_handout', () => {
  atualizarUIHandoutOculto();
});`;

if (content.includes(estadoInicialOriginal)) {
  content = content.replace(estadoInicialOriginal, estadoInicialNovo);
  console.log('1. sincronizar_estado_inicial atualizado!');
} else {
  console.log('1. sincronizar_estado_inicial não encontrado.');
}

// 2. Atualizar fecharPistaNoTablet e mostrarPistaNoTablet
const pistasTabletOriginal = `function fecharPistaNoTablet() {
  socket.emit('tv_esconder_handout');
  const btnPista = document.getElementById('btn-recolher-pista');
  if (btnPista) btnPista.style.display = 'none';
  mostrarToast('Pista ocultada das telas.');
}
window.fecharPistaNoTablet = fecharPistaNoTablet;

function mostrarPistaNoTablet(url) {
  if (!url) return;
  socket.emit('tv_mostrar_handout', url);
  const btnPista = document.getElementById('btn-recolher-pista');
  if (btnPista) btnPista.style.display = 'block';
  mostrarToast('Pista transmitida para as telas!');
}
window.mostrarPistaNoTablet = mostrarPistaNoTablet;`;

const pistasTabletNovo = `function fecharPistaNoTablet() {
  fecharPistaNaTV();
}
window.fecharPistaNoTablet = fecharPistaNoTablet;

function mostrarPistaNoTablet(url) {
  if (!url) return;
  socket.emit('tv_mostrar_handout', url);
  atualizarUIHandoutVisivel(url);
  mostrarToast('Pista transmitida para as telas!');
}
window.mostrarPistaNoTablet = mostrarPistaNoTablet;`;

if (content.includes(pistasTabletOriginal)) {
  content = content.replace(pistasTabletOriginal, pistasTabletNovo);
  console.log('2. fecharPistaNoTablet e mostrarPistaNoTablet atualizados!');
} else {
  console.log('2. fecharPistaNoTablet não encontrado.');
}

// 3. Atualizar abrirCardInspecaoVTT
const cardInspecaoSnippet = `  if (pin.imagem) {
    if (imgEl) imgEl.src = pin.imagem;
    if (wrapperImg) wrapperImg.style.display = 'block';
    if (btnTv) btnTv.style.display = 'flex';
  } else {
    if (wrapperImg) wrapperImg.style.display = 'none';
    if (btnTv) btnTv.style.display = 'none';
  }`;

const cardInspecaoNovo = `  const btnOcultar = document.getElementById('btn-vtt-pin-ocultar-tv');
  if (pin.imagem) {
    if (imgEl) imgEl.src = pin.imagem;
    if (wrapperImg) wrapperImg.style.display = 'block';
    if (imagemAtivaNaTV === pin.imagem) {
      if (btnTv) btnTv.style.display = 'none';
      if (btnOcultar) btnOcultar.style.display = 'flex';
    } else {
      if (btnTv) btnTv.style.display = 'flex';
      if (btnOcultar) btnOcultar.style.display = 'none';
    }
  } else {
    if (wrapperImg) wrapperImg.style.display = 'none';
    if (btnTv) btnTv.style.display = 'none';
    if (btnOcultar) btnOcultar.style.display = 'none';
  }`;

if (content.includes(cardInspecaoSnippet)) {
  content = content.replace(cardInspecaoSnippet, cardInspecaoNovo);
  console.log('3. abrirCardInspecaoVTT atualizado com suporte a ocultar!');
} else {
  console.log('3. cardInspecaoSnippet não encontrado.');
}

// 4. Substituir projetarPinAtualTV e adicionar fecharPistaNaTV
const projetarSnippet = `function projetarPinAtualTV() {
  if (!pinFocadoVTT || !pinFocadoVTT.imagem) return;
  socket.emit('tv_mostrar_handout', pinFocadoVTT.imagem);
  const btnRec = document.getElementById('btn-recolher-pista');
  if (btnRec) btnRec.style.display = 'block';
  mostrarToast(\`Imagem "\${pinFocadoVTT.titulo}" projetada na TV!\`, 'sucesso');
}
window.projetarPinAtualTV = projetarPinAtualTV;`;

const projetarNovo = `let imagemAtivaNaTV = null;

function atualizarUIHandoutVisivel(url) {
  imagemAtivaNaTV = url;
  const vttBtnRec = document.getElementById('vtt-btn-recolher-pista');
  if (vttBtnRec) vttBtnRec.style.display = 'inline-flex';
  const btnCockpit = document.getElementById('btn-recolher-pista');
  if (btnCockpit) btnCockpit.style.display = 'block';

  const btnProjetar = document.getElementById('btn-vtt-pin-projetar-tv');
  const btnOcultar = document.getElementById('btn-vtt-pin-ocultar-tv');
  if (btnProjetar && btnOcultar) {
    btnProjetar.style.display = 'none';
    btnOcultar.style.display = 'flex';
  }
}
window.atualizarUIHandoutVisivel = atualizarUIHandoutVisivel;

function atualizarUIHandoutOculto() {
  imagemAtivaNaTV = null;
  const vttBtnRec = document.getElementById('vtt-btn-recolher-pista');
  if (vttBtnRec) vttBtnRec.style.display = 'none';
  const btnCockpit = document.getElementById('btn-recolher-pista');
  if (btnCockpit) btnCockpit.style.display = 'none';

  const btnProjetar = document.getElementById('btn-vtt-pin-projetar-tv');
  const btnOcultar = document.getElementById('btn-vtt-pin-ocultar-tv');
  if (btnProjetar && btnOcultar) {
    if (pinFocadoVTT && pinFocadoVTT.imagem) {
      btnProjetar.style.display = 'flex';
    }
    btnOcultar.style.display = 'none';
  }
}
window.atualizarUIHandoutOculto = atualizarUIHandoutOculto;

function fecharPistaNaTV() {
  if (typeof socket !== 'undefined') {
    socket.emit('tv_esconder_handout');
  }
  atualizarUIHandoutOculto();
  mostrarToast('Imagem recolhida da TV! O tabuleiro está visível.', 'sucesso');
}
window.fecharPistaNaTV = fecharPistaNaTV;

function projetarPinAtualTV() {
  if (!pinFocadoVTT || !pinFocadoVTT.imagem) return;
  socket.emit('tv_mostrar_handout', pinFocadoVTT.imagem);
  atualizarUIHandoutVisivel(pinFocadoVTT.imagem);
  mostrarToast(\`Imagem "\${pinFocadoVTT.titulo}" projetada na TV!\`, 'sucesso');
}
window.projetarPinAtualTV = projetarPinAtualTV;`;

if (content.includes(projetarSnippet)) {
  content = content.replace(projetarSnippet, projetarNovo);
  console.log('4. projetarPinAtualTV e fecharPistaNaTV inseridos!');
} else {
  console.log('4. projetarSnippet não encontrado.');
}

const projetarDiretoSnippet = `function projetarImagemPinDireto(url, titulo) {
  if (!url) return;
  socket.emit('tv_mostrar_handout', url);
  const btnRec = document.getElementById('btn-recolher-pista');
  if (btnRec) btnRec.style.display = 'block';
  mostrarToast(\`Imagem "\${titulo || 'Evidência'}" projetada na TV!\`, 'sucesso');
}
window.projetarImagemPinDireto = projetarImagemPinDireto;`;

const projetarDiretoNovo = `function projetarImagemPinDireto(url, titulo) {
  if (!url) return;
  socket.emit('tv_mostrar_handout', url);
  atualizarUIHandoutVisivel(url);
  mostrarToast(\`Imagem "\${titulo || 'Evidência'}" projetada na TV!\`, 'sucesso');
}
window.projetarImagemPinDireto = projetarImagemPinDireto;

window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (imagemAtivaNaTV) {
      fecharPistaNaTV();
    } else if (pinFocadoVTT) {
      fecharCardInspecaoVTT();
    }
  }
});`;

if (content.includes(projetarDiretoSnippet)) {
  content = content.replace(projetarDiretoSnippet, projetarDiretoNovo);
  console.log('5. projetarImagemPinDireto e atalho ESC adicionados!');
} else {
  console.log('5. projetarDiretoSnippet não encontrado.');
}

if (wasCRLF) {
  content = content.replace(/\n/g, '\r\n');
}

fs.writeFileSync(mestreJsPath, content, 'utf8');
console.log('public/js/mestre.js salvo com sucesso!');
