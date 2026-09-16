// =========================================================================
// C.R.I.S. - TERMINAL DO MESTRE (CORE JS INTEGRADO)
// =========================================================================

const socket = io();

let campanhas = [];
let campanhaAtiva = null;
let campanhaSendoEditada = null;
let localAtivo = null;
let comodoAtivo = null;
let cenaTransmitidaId = null;

socket.on('sincronizar_estado_inicial', (estado) => {
  if (!estado) return;
  if (estado.campanhaAtivaId) vttCampanhaAtivaId = estado.campanhaAtivaId;
  const btnPista = document.getElementById('btn-recolher-pista');
  if (btnPista) btnPista.style.display = estado.pistaAbertaUrl ? 'block' : 'none';
});

// Atualiza a vida/sanidade na tela do mestre ao vivo
socket.on('sincronizar_ficha_atualizada', ({ campanhaId, personagem }) => {
  if (!campanhaAtiva || String(campanhaAtiva.id) !== String(campanhaId)) return;
  
  const pIdx = campanhaAtiva.personagens.findIndex(p => p.nome === personagem.nome);
  if (pIdx >= 0) {
    campanhaAtiva.personagens[pIdx] = personagem;
    renderizarMonitoresAgentesCockpit(); // Atualiza os barrinhos instantaneamente!
  }
});

// =========================================================================
// RECEBER ROLAGENS DOS JOGADORES NO FEED E NO GAME LOG
// =========================================================================
socket.on('alerta_rolagem_mesa', (dados) => {
  const agora = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  // 1. Atualiza a coluna lateral "Resultados" no Cockpit do Mestre
  const feedLista = document.getElementById('feed-rolagens-lista');
  if (feedLista) {
    const avisoVazio = feedLista.querySelector('.feed-empty-aviso');
    if (avisoVazio) avisoVazio.remove();

    const card = document.createElement('div');
    card.className = 'card-feed-rolagem';
    card.innerHTML = `
      <div class="feed-card-nome">${dados.jogador}</div>
      <div class="feed-card-acao">${dados.teste}</div>
      <div class="feed-card-boxes">
        <div>
          <div class="feed-box-val">${dados.total}</div>
          <div class="feed-box-lbl">TOTAL</div>
        </div>
        <div>
          <div class="feed-box-val" style="font-size:0.75rem; word-break:break-all; display:flex; align-items:center; justify-content:center;">
            ${dados.detalhes || '-'}
          </div>
          <div class="feed-box-lbl">DADOS</div>
        </div>
      </div>
      <div class="feed-card-hora">${agora}</div>
    `;
    feedLista.prepend(card);
  }

  // 2. Atualiza o popover "Game Log" dentro do Modo Tabuleiro (VTT)
  const vttLog = document.getElementById('vtt-log-container');
  if (vttLog) {
    const li = document.createElement('li');
    li.className = 'vtt-log-item';
    li.innerHTML = `
      <div>
        <strong style="color:#a855f7;">${dados.jogador}</strong>
        <span style="font-size:0.75rem; color:#75838b; margin-left:6px;">${dados.teste} às ${agora}</span>
        <div style="font-size:0.7rem; color:#717182;">${dados.detalhes || ''}</div>
      </div>
      <span class="vtt-badge-check" style="font-size:1.1rem; font-weight:bold; color:#fff;">${dados.total}</span>
    `;
    vttLog.prepend(li);
  }
});

function mudarView(viewId) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('ativa'));
  const target = document.getElementById(viewId);
  if (target) target.classList.add('ativa');
}
window.mudarView = mudarView;

function voltarParaHub() {
  campanhaAtiva = null;
  campanhaSendoEditada = null;
  mudarView('view-hub');
  carregarCampanhas();
}
window.voltarParaHub = voltarParaHub;

async function persistirCampanhaNoServidor(camp) {
  const c = camp || campanhaAtiva;
  if (!c) return;
  await fetch('/api/campanhas', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(c)
  });
}
window.persistirCampanhaNoServidor = persistirCampanhaNoServidor;

async function carregarCampanhas() {
  try {
    // O Date.now() força o navegador a pegar o arquivo real em vez do cache
    const res = await fetch('/api/campanhas?_t=' + Date.now()); 
    campanhas = await res.json();
    renderizarHub();
  } catch (e) {
    console.error("Erro ao buscar campanhas:", e);
  }
}
window.carregarCampanhas = carregarCampanhas;

function renderizarHub() {
  const listaEl = document.getElementById('lista-campanhas');
  if (!listaEl) return;
  listaEl.innerHTML = '';
  if (!campanhas || campanhas.length === 0) {
    listaEl.innerHTML = '<p style="color:#717182; font-size:0.85rem; padding:20px; text-align:center;">Nenhuma campanha registrada.</p>';
    return;
  }
  campanhas.forEach(camp => {
    const thumb = camp.imagemStandby || camp.standby || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=400';
    const card = document.createElement('div');
    card.className = 'card-campanha-cris';
    card.innerHTML = `
      <div style="display:flex; gap:14px; align-items:center;">
        <div class="campanha-thumb-box" style="background-image:url('${thumb}')"></div>
        <div>
          <div style="font-size:1.05rem; font-weight:800; color:#fff;">${camp.nome}</div>
          <div style="font-size:0.75rem; color:#9494a8; margin-top:3px;">
            ${(camp.personagens || []).length} Agentes • ${(camp.locais || []).length} Cenários
          </div>
        </div>
      </div>
      <div style="display:flex; gap:8px;">
        <button class="btn-cris-purple" onclick="entrarNoCockpit('${camp.id}')">Acessar</button>
        <button class="btn-cris-subtle" onclick="abrirTelaEdicaoCampanha('${camp.id}')">Editar</button>
        <button class="btn-cris-subtle" style="color:#ef4444;" onclick="excluirCampanha('${camp.id}')">✕</button>
      </div>
    `;
    listaEl.appendChild(card);
  });
}
window.renderizarHub = renderizarHub;

function entrarNoCockpit(id) {
  campanhaAtiva = campanhas.find(c => String(c.id) === String(id));
  if (!campanhaAtiva) return;
  const tit = document.getElementById('cockpit-titulo-campanha');
  if (tit) tit.innerText = campanhaAtiva.nome.toUpperCase();
  socket.emit('mestre_selecionou_campanha', campanhaAtiva.id);
  renderizarMonitoresAgentesCockpit();
  montarDeckLocais();
  montarCombate();
  mudarAbaCockpit('agentes');
  mudarView('view-cockpit');
}
window.entrarNoCockpit = entrarNoCockpit;

async function excluirCampanha(id) {
  const camp = campanhas.find(c => String(c.id) === String(id));
  if (!camp) return;
  if (!confirm(`Excluir permanentemente a campanha "${camp.nome}"?`)) return;

  campanhas = campanhas.filter(c => String(c.id) !== String(id));
  renderizarHub();
  try { await fetch(`/api/campanhas/${id}`, { method: 'DELETE' }); } catch (err) { console.error("Erro ao deletar:", err); }
}
window.excluirCampanha = excluirCampanha;

function abrirModalNovaCampanha() {
  document.getElementById('novo-camp-nome').value = '';
  document.getElementById('novo-camp-id').value = '';
  document.getElementById('novo-camp-standby').value = '';
  document.getElementById('modal-nova-campanha').style.display = 'flex';
}
window.abrirModalNovaCampanha = abrirModalNovaCampanha;

function fecharModalNovaCampanha() { document.getElementById('modal-nova-campanha').style.display = 'none'; }
window.fecharModalNovaCampanha = fecharModalNovaCampanha;

function alternarModoCriacaoCampanha(modo) {
  document.getElementById('form-campanha-manual').style.display = modo === 'manual' ? 'block' : 'none';
  document.getElementById('form-campanha-json').style.display = modo === 'json' ? 'block' : 'none';
}
window.alternarModoCriacaoCampanha = alternarModoCriacaoCampanha;

async function salvarNovaCampanhaManual() {
  const nome = document.getElementById('novo-camp-nome').value.trim();
  let id = document.getElementById('novo-camp-id').value.trim();
  const standby = document.getElementById('novo-camp-standby').value.trim();
  if (!nome) return alert('Informe o nome.');
  if (!id) id = nome.toLowerCase().replace(/[^a-z0-9]/g, '-');
  const nova = { id, nome, imagemStandby: standby || '', locais: [], personagens: [], ameacas: [] };
  await fetch('/api/campanhas', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(nova) });
  fecharModalNovaCampanha();
  await carregarCampanhas();
  abrirTelaEdicaoCampanha(id);
}
window.salvarNovaCampanhaManual = salvarNovaCampanhaManual;

function abrirTelaEdicaoCampanha(id) {
  campanhaSendoEditada = campanhas.find(c => String(c.id) === String(id));
  if (!campanhaSendoEditada) return;
  document.getElementById('edicao-nome-campanha').innerText = `Editar: ${campanhaSendoEditada.nome}`;
  document.getElementById('edit-camp-nome').value = campanhaSendoEditada.nome || '';
  document.getElementById('edit-camp-id').value = campanhaSendoEditada.id || '';
  document.getElementById('edit-camp-standby').value = campanhaSendoEditada.imagemStandby || campanhaSendoEditada.standby || '';
  renderizarPersonagensNaEdicao();
  document.getElementById('json-campanha-completa-input').value = JSON.stringify(campanhaSendoEditada, null, 2);
  mudarAbaEdicao('geral');
  mudarView('view-editar-campanha');
}
window.abrirTelaEdicaoCampanha = abrirTelaEdicaoCampanha;

function mudarAbaEdicao(aba) {
  document.querySelectorAll('.tab-edicao-btn').forEach(b => b.classList.remove('ativa'));
  document.querySelectorAll('.painel-edicao').forEach(p => p.classList.remove('ativo'));
  if (aba === 'geral') { document.querySelectorAll('.tab-edicao-btn')[0].classList.add('ativa'); document.getElementById('aba-edicao-geral').classList.add('ativo'); }
  else if (aba === 'personagens') { document.querySelectorAll('.tab-edicao-btn')[1].classList.add('ativa'); document.getElementById('aba-edicao-personagens').classList.add('ativo'); }
  else if (aba === 'avancado') { document.querySelectorAll('.tab-edicao-btn')[2].classList.add('ativa'); document.getElementById('aba-edicao-avancado').classList.add('ativo'); }
}
window.mudarAbaEdicao = mudarAbaEdicao;

async function salvarAlteracoesCampanhaEmEdicao() {
  if (!campanhaSendoEditada) return;
  campanhaSendoEditada.nome = document.getElementById('edit-camp-nome').value.trim();
  campanhaSendoEditada.id = document.getElementById('edit-camp-id').value.trim();
  campanhaSendoEditada.imagemStandby = document.getElementById('edit-camp-standby').value.trim();
  await persistirCampanhaNoServidor(campanhaSendoEditada);
  alert('Alterações salvas com sucesso!');
  voltarParaHub();
}
window.salvarAlteracoesCampanhaEmEdicao = salvarAlteracoesCampanhaEmEdicao;

function renderizarPersonagensNaEdicao() {
  const container = document.getElementById('lista-personagens-edicao');
  if (!container) return;
  container.innerHTML = '';
  const pers = campanhaSendoEditada.personagens || [];
  if (pers.length === 0) { container.innerHTML = '<p>Nenhum agente.</p>'; return; }
  pers.forEach((p, idx) => {
    const card = document.createElement('div');
    card.className = 'card-campanha-cris';
    card.innerHTML = `<div><div style="font-weight:800; color:#fff;">${p.nome} <span style="font-size:0.75rem; color:#9494a8;">(${p.origem || 'Agente'})</span></div><div style="font-size:0.75rem; color:#717182; margin-top:2px;">PV: ${p.pv}/${p.pvMax || p.pv}</div></div><button class="btn-cris-subtle" style="color:#ef4444;" onclick="removerPersonagemDaCampanha(${idx})">Remover</button>`;
    container.appendChild(card);
  });
}
window.renderizarPersonagensNaEdicao = renderizarPersonagensNaEdicao;

function removerPersonagemDaCampanha(idx) { campanhaSendoEditada.personagens.splice(idx, 1); renderizarPersonagensNaEdicao(); }
window.removerPersonagemDaCampanha = removerPersonagemDaCampanha;

function mudarAbaCockpit(aba) {
  document.querySelectorAll('.cockpit-tab').forEach(b => b.classList.remove('ativa'));
  document.querySelectorAll('.subview-cockpit').forEach(s => s.classList.remove('ativa'));
  if (aba === 'agentes') { document.querySelectorAll('.cockpit-tab')[0].classList.add('ativa'); document.getElementById('aba-cockpit-agentes').classList.add('ativa'); }
  else if (aba === 'cenarios') { document.querySelectorAll('.cockpit-tab')[1].classList.add('ativa'); document.getElementById('aba-cockpit-cenarios').classList.add('ativa'); }
  else if (aba === 'ameacas') { document.querySelectorAll('.cockpit-tab')[2].classList.add('ativa'); document.getElementById('aba-cockpit-ameacas').classList.add('ativa'); }
}
window.mudarAbaCockpit = mudarAbaCockpit;

function renderizarMonitoresAgentesCockpit() {
  const grid = document.getElementById('grid-monitores-agentes');
  if (!grid) return;
  grid.innerHTML = '';
  
  const agentes = (campanhaAtiva && campanhaAtiva.personagens) ? campanhaAtiva.personagens : [];
  if (agentes.length === 0) return grid.innerHTML = '<p style="color:#717182;">Nenhum agente registrado.</p>';
  
  agentes.forEach(ag => {
    const card = document.createElement('div');
    card.className = 'card-monitor-agente';
    card.innerHTML = `
      <div class="monitor-top">
        <div class="monitor-avatar" style="background-image:url('${ag.img || 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?q=80&w=200'}')"></div>
        <div>
          <div class="monitor-info-nome">${ag.nome}</div>
          <div class="monitor-info-detalhe">${ag.classe || 'Agente'} • NEX: ${ag.nex || '5%'}</div>
        </div>
      </div>
      <div class="monitor-barras-grupo" style="margin-top: 10px;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <span class="monitor-bar-label">PV</span>
          <div class="solid-bar vida" style="width:75%;">${ag.pv} / ${ag.pvMax || ag.pv}</div>
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <span class="monitor-bar-label">SAN</span>
          <div class="solid-bar sanidade" style="width:75%;">${ag.san} / ${ag.sanMax || ag.san}</div>
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <span class="monitor-bar-label">PE</span>
          <div class="solid-bar esforco" style="width:75%;">${ag.pe} / ${ag.peMax || ag.pe}</div>
        </div>
      </div>
      <div class="monitor-defesas-linha" style="margin-top:10px;">
        <div class="def-item"><span>DEFESA</span><strong>${10 + (ag.atributos?.AGI || 1) + (ag.defesaEquip || 0)}</strong></div>
        <div class="def-item"><span>BLOQUEIO</span><strong>${ag.atributos?.FOR || 1}</strong></div>
        <div class="def-item"><span>ESQUIVA</span><strong>${10 + (ag.atributos?.AGI || 1)*2 + (ag.defesaEquip || 0)}</strong></div>
      </div>
    `;
    grid.appendChild(card);
  });
}
window.renderizarMonitoresAgentesCockpit = renderizarMonitoresAgentesCockpit;

function montarDeckLocais() {
  const deck = document.getElementById('deck-locais');
  if (!deck) return;
  deck.innerHTML = '';
  (campanhaAtiva.locais || []).forEach(local => {
    const card = document.createElement('div');
    card.className = 'card-deck';
    card.innerHTML = `<div class="card-thumb" style="background-image:url('${local.imagemCapa || ''}')"></div><div class="card-body"><div style="font-size:1rem; font-weight:800; color:#fff;">${local.nome}</div></div>`;
    deck.appendChild(card);
  });
}
window.montarDeckLocais = montarDeckLocais;

function montarCombate() {
  const container = document.getElementById('lista-ataques');
  if (!container) return;
  container.innerHTML = '';
  if (!campanhaAtiva || !campanhaAtiva.ameacas || campanhaAtiva.ameacas.length === 0) return;
  const ameaca = campanhaAtiva.ameacas[0];
  document.getElementById('nome-ameaca').innerText = `${ameaca.nome} (PV: ${ameaca.pv} | DEF: ${ameaca.defesa})`;
}
window.montarCombate = montarCombate;

// =========================================================================
// ================= MODO TABULEIRO DEFINITIVO (VTT BEYOND) =================
// =========================================================================

var vttState = {
  mapaAtivoId: null,
  mapaAtivoUrl: '',
  camera: { x: 0, y: 0, zoom: 1 },
  tokens: [],
  catalogoAgentes: [],
  catalogoMonstros: [],
  galeriaMapas: [],
  fogData: null,
  drawData: null,
  journalEntries: [],
  rollTarget: 'Self',
  gridTamanho: 70
};

var vttCampanhaAtivaId = null;
var tokenSelecionadoId = null;
var tokenArrastandoId = null;
var isDraggingMap = false;
var gavetaAbertaTipo = null;
var catalogoAtivo = 'jogadores';
var ferramentaAtiva = 'select';
var topDropdownAtivo = null;
var popoverInferiorAtivo = null;
var isTransmitindoLive = false;

const FOG_W = 1920;
const FOG_H = 1080;
var fogModo = 'eraser';
var fogRaio = 60;
var desenhandoFog = false;

var drawCor = '#ef4444';
var drawTamanho = 6;
var drawModo = 'brush';
var desenhandoDraw = false;

var desenhandoRuler = false;
var pontoInicialRuler = null;
var timerLimparRuler = null; // <--- ADICIONE ESTA LINHA!
var timerDebounceSalvarTabuleiro = null;

function obterIdCampanhaSeguro() {
  if (vttCampanhaAtivaId) return vttCampanhaAtivaId;
  if (typeof campanhaAtiva !== 'undefined' && campanhaAtiva && campanhaAtiva.id) return campanhaAtiva.id;
  return null;
}
window.obterIdCampanhaSeguro = obterIdCampanhaSeguro;

// ====== 1. CÂMERA ======
function atualizarCamera(deveSalvar = false) {
  const container = document.getElementById('beta-mapa-container');
  if (container) container.style.transform = `translate(${vttState.camera.x}px, ${vttState.camera.y}px) scale(${vttState.camera.zoom})`;
  const zoomDisplay = document.getElementById('vtt-zoom-display');
  if (zoomDisplay) zoomDisplay.innerText = Math.round(vttState.camera.zoom * 100) + '%';
  if (isTransmitindoLive && typeof socket !== 'undefined') socket.emit('tv_aplicar_camera', vttState.camera);
  if (deveSalvar) salvarEstadoTabuleiro();
}
window.atualizarCamera = atualizarCamera;

function ajustarZoomManual(delta) { vttState.camera.zoom = Math.max(0.5, Math.min(4, vttState.camera.zoom + delta)); atualizarCamera(true); }
window.ajustarZoomManual = ajustarZoomManual;
function resetarZoomManual() { vttState.camera.zoom = 1; atualizarCamera(true); }
window.resetarZoomManual = resetarZoomManual;

// ====== 2. SALVAMENTO CORRIGIDO (SEM APAGAR TOKENS NO F5) ======
function salvarEstadoDoMapaAtual() {
  if (!vttState.mapaAtivoId && !vttState.mapaAtivoUrl) return;
  let mapa = (vttState.galeriaMapas || []).find(m => String(m.id) === String(vttState.mapaAtivoId) || m.url === vttState.mapaAtivoUrl);
  if (mapa) {
    mapa.tokens = JSON.parse(JSON.stringify(vttState.tokens || []));
    mapa.fogData = vttState.fogData || null;
    mapa.drawData = vttState.drawData || null;
    mapa.camera = Object.assign({}, vttState.camera);
  }
}
window.salvarEstadoDoMapaAtual = salvarEstadoDoMapaAtual;

function agendarSalvamentoTabuleiro() {
  if (timerDebounceSalvarTabuleiro) clearTimeout(timerDebounceSalvarTabuleiro);
  timerDebounceSalvarTabuleiro = setTimeout(() => { salvarEstadoTabuleiro(); }, 1200);
}

function salvarEstadoTabuleiro() {
  salvarEstadoDoMapaAtual();
  const id = obterIdCampanhaSeguro();
  if (id && typeof socket !== 'undefined') socket.emit('salvar_tabuleiro', { campanhaId: id, tabuleiro: vttState });
}
window.salvarEstadoTabuleiro = salvarEstadoTabuleiro;

function carregarEstadoTabuleiro(c) {
  if (c && c.tabuleiro) {
    vttState = JSON.parse(JSON.stringify(c.tabuleiro));

    if (vttState.mapaAtivoUrl) {
      const img = document.getElementById('beta-mapa-img');
      if (img) { img.src = vttState.mapaAtivoUrl; img.style.opacity = '1'; }
      
      let mapaAtual = (vttState.galeriaMapas || []).find(m => String(m.id) === String(vttState.mapaAtivoId));
      if (mapaAtual) {
        const labelNome = document.getElementById('nome-mapa-atual');
        if (labelNome) labelNome.innerText = mapaAtual.nome;
        
        // RECUPERAÇÃO FORÇADA DOS TOKENS DO MAPA
        if (mapaAtual.tokens && mapaAtual.tokens.length > 0) {
           vttState.tokens = JSON.parse(JSON.stringify(mapaAtual.tokens));
        }
      }
      
      desenharTokensBetaNoMestre();
      atualizarCamera(false);
      restaurarFogSalvo(vttState.fogData);
      restaurarDrawSalvo(vttState.drawData);
    } else {
      atualizarCamera(false);
      desenharTokensBetaNoMestre();
    }
  }
}
window.carregarEstadoTabuleiro = carregarEstadoTabuleiro;

function aplicarMapaNaMesa(mapaIdOuUrl) {
  salvarEstadoDoMapaAtual();
  let novoMapa = (vttState.galeriaMapas || []).find(m => String(m.id) === String(mapaIdOuUrl) || m.url === mapaIdOuUrl);
  if (!novoMapa) {
    novoMapa = { id: Date.now().toString(), nome: 'Mapa', url: mapaIdOuUrl, tokens: [], fogData: null, drawData: null, camera: { x: 0, y: 0, zoom: 1 } };
    if (!vttState.galeriaMapas) vttState.galeriaMapas = [];
    vttState.galeriaMapas.push(novoMapa);
  }

  vttState.mapaAtivoId = String(novoMapa.id);
  vttState.mapaAtivoUrl = novoMapa.url;
  vttState.tokens = JSON.parse(JSON.stringify(novoMapa.tokens || []));
  vttState.fogData = novoMapa.fogData || null;
  vttState.drawData = novoMapa.drawData || null;
  vttState.camera = Object.assign({}, novoMapa.camera || { x: 0, y: 0, zoom: 1 });

  const img = document.getElementById('beta-mapa-img');
  if (img) { img.src = novoMapa.url; img.style.opacity = '1'; }
  const labelNome = document.getElementById('nome-mapa-atual');
  if (labelNome) labelNome.innerText = novoMapa.nome;

  desenharTokensBetaNoMestre();
  atualizarCamera(false);
  restaurarFogSalvo(vttState.fogData);
  restaurarDrawSalvo(vttState.drawData);

  if (isTransmitindoLive && typeof socket !== 'undefined') {
    socket.emit('tv_trocar_mapa', novoMapa.url);
    socket.emit('tv_atualizar_tokens', vttState.tokens);
    socket.emit('tv_atualizar_fog', vttState.fogData);
    socket.emit('tv_atualizar_desenho', vttState.drawData);
    socket.emit('tv_aplicar_camera', vttState.camera);
  }
  agendarSalvamentoTabuleiro();
  fecharTopMenus();
  fecharModalMapBrowser();
}
window.aplicarMapaNaMesa = aplicarMapaNaMesa;

function abrirModoTabuleiro() {
  const id = obterIdCampanhaSeguro();
  if (!id) return alert("Selecione uma missão antes de abrir o mapa!");

  const modalTab = document.getElementById('modal-tabuleiro');
  if (!modalTab) return;

  modalTab.style.display = 'block';
  fecharTopMenus();
  fecharPopoversInferiores();
  fecharGaveta();

  // Puxa o tabuleiro mais recente sem usar o cache do navegador
  fetch('/api/campanhas?_t=' + Date.now())
    .then(res => res.json())
    .then(listaCamp => {
      const camp = listaCamp.find(c => String(c.id) === String(id));
      carregarEstadoTabuleiro(camp);
      renderizarCatalogo();
      renderizarGaleriaMapas();
    })
    .catch(err => console.error("Erro ao carregar tabuleiro:", err));

    // Puxa o tabuleiro mais recente sem usar o cache do navegador
  fetch('/api/campanhas?_t=' + Date.now())
    .then(res => res.json())
    .then(listaCamp => {
      const camp = listaCamp.find(c => String(c.id) === String(id));
      carregarEstadoTabuleiro(camp);
      renderizarCatalogo();
      renderizarGaleriaMapas();
      renderizarDMPrep(); // <---- ADICIONE ESTA LINHA AQUI!
    })
    .catch(err => console.error("Erro ao carregar tabuleiro:", err));
}
window.abrirModoTabuleiro = abrirModoTabuleiro;

function fecharModoTabuleiro() { const m = document.getElementById('modal-tabuleiro'); if (m) m.style.display = 'none'; }
window.fecharModoTabuleiro = fecharModoTabuleiro;

// --- MENUS SUPERIORES ---
function toggleTopDropdown(nome) {
  fecharPopoversInferiores();
  document.querySelectorAll('.vtt-submenu').forEach(m => m.style.display = 'none');
  if (topDropdownAtivo === nome) { fecharTopMenus(); return; }
  fecharTopMenus();
  const el = document.getElementById('top-dropdown-' + nome);
  if (el) { el.style.display = 'flex'; topDropdownAtivo = nome; if (nome === 'scenarios') renderizarScenariosDropdown(); }
}
window.toggleTopDropdown = toggleTopDropdown;
function fecharTopMenus() { document.querySelectorAll('.vtt-dropdown-menu').forEach(m => m.style.display = 'none'); topDropdownAtivo = null; }
window.fecharTopMenus = fecharTopMenus;
function toggleTopPopover(nome) { fecharTopMenus(); fecharPopoversInferiores(); const el = document.getElementById('top-popover-' + nome); if (el) el.style.display = el.style.display === 'flex' ? 'none' : 'flex'; }
window.toggleTopPopover = toggleTopPopover;

function abrirModalMapBrowser() { fecharTopMenus(); document.getElementById('modal-map-browser').style.display = 'flex'; renderizarGaleriaMapas(); }
window.abrirModalMapBrowser = abrirModalMapBrowser;
function fecharModalMapBrowser() { document.getElementById('modal-map-browser').style.display = 'none'; }
window.fecharModalMapBrowser = fecharModalMapBrowser;
function selecionarRollTarget(alvo) {
  vttState.rollTarget = alvo;
  document.getElementById('vtt-roll-target-label').innerText = alvo;
  document.getElementById('target-check-Self').style.color = alvo === 'Self' ? 'var(--vtt-gold)' : 'transparent';
  document.getElementById('target-check-Everyone').style.color = alvo === 'Everyone' ? 'var(--vtt-gold)' : 'transparent';
  fecharTopMenus();
}
window.selecionarRollTarget = selecionarRollTarget;

// --- GALERIA DE MAPAS ---
function renderizarScenariosDropdown() {
  const list = document.getElementById('top-scenarios-list');
  if (!list) return;
  list.innerHTML = '';
  if (!vttState.galeriaMapas || vttState.galeriaMapas.length === 0) return list.innerHTML = `<div style="padding:12px;color:gray;">Vazio.</div>`;
  vttState.galeriaMapas.forEach(mapa => {
    const isAtivo = (String(vttState.mapaAtivoId) === String(mapa.id) || vttState.mapaAtivoUrl === mapa.url);
    const item = document.createElement('div');
    item.className = 'vtt-dropdown-item';
    item.innerHTML = `<span onclick="aplicarMapaNaMesa('${mapa.id}')" style="flex:1; font-weight:${isAtivo?'bold':'normal'}; color:${isAtivo?'#fff':'gray'};">${isAtivo?'● ':''}${mapa.nome}</span>
                      <button onclick="deletarMapa('${mapa.id}'); event.stopPropagation();" style="background:transparent;border:none;color:gray;">✕</button>`;
    list.appendChild(item);
  });
}
window.renderizarScenariosDropdown = renderizarScenariosDropdown;

function salvarNovoMapa() {
  const nome = document.getElementById('add-mapa-nome').value.trim();
  const file = document.getElementById('add-mapa-file');
  if (!nome || !file.files[0]) return alert("Preencha tudo!");
  const reader = new FileReader();
  reader.onload = function(e) {
    if (!vttState.galeriaMapas) vttState.galeriaMapas = [];
    const novo = { id: Date.now().toString(), nome: nome, url: e.target.result, tokens: [], fogData: null, drawData: null, camera: { x: 0, y: 0, zoom: 1 } };
    vttState.galeriaMapas.push(novo);
    salvarEstadoTabuleiro();
    renderizarGaleriaMapas();
    document.getElementById('add-mapa-nome').value = ''; file.value = '';
    aplicarMapaNaMesa(novo.id);
  };
  reader.readAsDataURL(file.files[0]);
}
window.salvarNovoMapa = salvarNovoMapa;

function deletarMapa(id) {
  vttState.galeriaMapas = (vttState.galeriaMapas || []).filter(m => String(m.id) !== String(id));
  if (String(vttState.mapaAtivoId) === String(id)) {
    vttState.mapaAtivoId = null; vttState.mapaAtivoUrl = ''; vttState.tokens = []; vttState.fogData = null; vttState.drawData = null;
    const img = document.getElementById('beta-mapa-img'); if (img) img.style.opacity = '0';
    desenharTokensBetaNoMestre(); fogRevealAll(); limparDesenhoMestreETV();
  }
  salvarEstadoTabuleiro(); renderizarGaleriaMapas(); renderizarScenariosDropdown();
}
window.deletarMapa = deletarMapa;

// =========================================================================
// ATUALIZAR IMAGENS DOS MAPAS (VTT AUTO-SETUP)
// =========================================================================
function renderizarGaleriaMapas() {
  const grid = document.getElementById('grid-mapas');
  if (!grid) return;
  grid.innerHTML = '';
  if (!vttState.galeriaMapas || vttState.galeriaMapas.length === 0) return grid.innerHTML = '<div style="color:gray;">Nenhum mapa.</div>';
  
  vttState.galeriaMapas.forEach(m => {
    const div = document.createElement('div');
    div.style = "width:200px; background:var(--vtt-bg-box); border:1px solid var(--vtt-border); border-radius:6px; display:flex; flex-direction:column;";
    div.innerHTML = `
      <div style="height:110px; background-image:url('${m.url || 'https://via.placeholder.com/200x110?text=Sem+Mapa'}'); background-size:cover; border-radius:6px 6px 0 0;"></div>
      <div style="padding:10px; display:flex; justify-content:space-between; align-items:center;">
        <span style="color:#fff; font-size:0.85rem; max-width:120px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${m.nome}">${m.nome}</span>
        <button onclick="aplicarMapaNaMesa('${m.id}')" style="background:#2563eb; color:#fff; border:none; padding:4px 8px; border-radius:4px; font-weight:bold; cursor:pointer;">MESA</button>
      </div>
      <div style="display:flex; border-top:1px solid var(--vtt-border);">
        <button onclick="atualizarImagemMapa('${m.id}')" style="flex:1; background:transparent; color:#38bdf8; border:none; padding:6px; border-right:1px solid var(--vtt-border); cursor:pointer;">🖼️ Imagem</button>
        <button onclick="deletarMapa('${m.id}')" style="flex:1; background:transparent; color:#ef4444; border:none; padding:6px; cursor:pointer;">🗑️ Excluir</button>
      </div>`;
    grid.appendChild(div);
  });
}
window.renderizarGaleriaMapas = renderizarGaleriaMapas;

function atualizarImagemMapa(id) {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.onchange = e => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = ev => {
      const mapa = vttState.galeriaMapas.find(x => String(x.id) === String(id));
      if(mapa) {
        mapa.url = ev.target.result;
        salvarEstadoTabuleiro();
        renderizarGaleriaMapas();
        // Se o mapa alterado for o que está aberto na tela, atualiza a imagem ao vivo
        if(String(vttState.mapaAtivoId) === String(id)) aplicarMapaNaMesa(id);
      }
    }
    reader.readAsDataURL(file);
  };
  input.click();
}
window.atualizarImagemMapa = atualizarImagemMapa;

// --- FERRAMENTAS E GAVETAS ---
function ativarFerramenta(btn, nome) {
  document.querySelectorAll('.vtt-sidebar-tools .vtt-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  ferramentaAtiva = nome;
  document.querySelectorAll('.vtt-submenu').forEach(m => m.style.display = 'none');
  const sub = document.getElementById('submenu-' + nome);
  if (sub) sub.style.display = 'flex';
  const vp = document.getElementById('beta-viewport');
  if (vp) vp.style.cursor = (nome === 'pan' || nome === 'select') ? 'grab' : 'crosshair';
}
window.ativarFerramenta = ativarFerramenta;

function toggleGaveta(tipo) {
  document.querySelectorAll('.vtt-submenu').forEach(m => m.style.display = 'none');
  if (gavetaAbertaTipo === tipo) { fecharGaveta(); return; }
  const alvo = document.getElementById('drawer-' + tipo);
  if (alvo) { alvo.style.transform = 'translateX(0)'; gavetaAbertaTipo = tipo; if (tipo === 'token') renderizarCatalogo(); }
}
window.toggleGaveta = toggleGaveta;
function fecharGaveta() { const el = document.getElementById('drawer-token'); if (el) el.style.transform = 'translateX(-150%)'; gavetaAbertaTipo = null; }
window.fecharGaveta = fecharGaveta;

// SUBSTITUA A FUNÇÃO mudarAbaCatalogo EXISTENTE POR ESTA:
function mudarAbaCatalogo(aba) { 
  catalogoAtivo = aba; 
  
  // Atualiza as cores (UI Feedback)
  const tabJogadores = document.getElementById('tab-cat-jogadores');
  const tabMonstros = document.getElementById('tab-cat-monstros');
  
  if (tabJogadores && tabMonstros) {
    tabJogadores.style.borderBottomColor = aba === 'jogadores' ? 'var(--vtt-active-red)' : 'transparent';
    tabJogadores.style.color = aba === 'jogadores' ? 'var(--vtt-text-main)' : 'var(--vtt-text-muted)';
    
    tabMonstros.style.borderBottomColor = aba === 'monstros' ? 'var(--vtt-active-red)' : 'transparent';
    tabMonstros.style.color = aba === 'monstros' ? 'var(--vtt-text-main)' : 'var(--vtt-text-muted)';
  }
  
  renderizarCatalogo(); 
}
window.mudarAbaCatalogo = mudarAbaCatalogo;

function adicionarAoCatalogo() {
  const nome = document.getElementById('novo-nome-token').value.trim();
  const file = document.getElementById('novo-img-token');
  if (!nome || !file.files[0]) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    const novoItem = { id: Date.now().toString(), nome: nome, img: e.target.result, isMonstro: catalogoAtivo === 'monstros' };
    if (!vttState.catalogoAgentes) vttState.catalogoAgentes = [];
    if (!vttState.catalogoMonstros) vttState.catalogoMonstros = [];
    if (catalogoAtivo === 'jogadores') vttState.catalogoAgentes.push(novoItem); else vttState.catalogoMonstros.push(novoItem);
    document.getElementById('novo-nome-token').value = ''; file.value = '';
    salvarEstadoTabuleiro(); renderizarCatalogo();
  };
  reader.readAsDataURL(file.files[0]);
}
window.adicionarAoCatalogo = adicionarAoCatalogo;

function deletarDoCatalogo(id, isMonstro) {
  if (isMonstro) vttState.catalogoMonstros = (vttState.catalogoMonstros || []).filter(x => x.id !== id);
  else vttState.catalogoAgentes = (vttState.catalogoAgentes || []).filter(x => x.id !== id);
  salvarEstadoTabuleiro(); renderizarCatalogo();
}
window.deletarDoCatalogo = deletarDoCatalogo;

// =========================================================================
// ATUALIZAR IMAGENS DOS TOKENS (VTT AUTO-SETUP)
// =========================================================================
function renderizarCatalogo() {
  const lista = document.getElementById('lista-catalogo');
  if (!lista) return;
  lista.innerHTML = '';
  let arrayAtual = catalogoAtivo === 'jogadores' ? (vttState.catalogoAgentes || []) : (vttState.catalogoMonstros || []);
  
  arrayAtual.forEach(item => {
    const div = document.createElement('div');
    div.style = "display:flex; justify-content:space-between; align-items:center;";
    div.innerHTML = `
      <div style="display:flex; align-items:center; gap:15px;">
        <img src="${item.img || 'https://via.placeholder.com/45?text=?'}" style="width:45px; height:45px; border-radius:50%; object-fit:cover; border:1px solid var(--vtt-border);">
        <div style="color:#fff;">${item.nome}</div>
      </div>
      <div style="display:flex; gap:6px; align-items:center;">
        <button onclick="atualizarImagemCatalogo('${item.id}', ${item.isMonstro})" style="color:#38bdf8; border:none; background:transparent; font-size:1.1rem; cursor:pointer;" title="Alterar Imagem">🖼️</button>
        <button onclick="deletarDoCatalogo('${item.id}', ${item.isMonstro})" style="color:gray; border:none; background:transparent; cursor:pointer;" title="Excluir">🗑</button>
        <button onclick="colocarTokenNaMesa('${item.id}')" style="color:var(--vtt-gold); border:none; background:transparent; font-size:1.5rem; font-weight:bold; cursor:pointer;" title="Colocar na Mesa">+</button>
      </div>`;
    lista.appendChild(div);
  });
}
window.renderizarCatalogo = renderizarCatalogo;

function atualizarImagemCatalogo(id, isMonstro) {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.onchange = e => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = ev => {
      const cat = isMonstro ? vttState.catalogoMonstros : vttState.catalogoAgentes;
      const item = cat.find(x => x.id === id);
      if(item) { 
        item.img = ev.target.result; 
        salvarEstadoTabuleiro(); 
        renderizarCatalogo(); 
      }
    }
    reader.readAsDataURL(file);
  };
  input.click();
}
window.atualizarImagemCatalogo = atualizarImagemCatalogo;

// --- TOKENS NA MESA ---
function colocarTokenNaMesa(idProcurado) {
  let item = (vttState.catalogoAgentes || []).find(i => String(i.id) === String(idProcurado)) || (vttState.catalogoMonstros || []).find(i => String(i.id) === String(idProcurado));
  if (!item) return;
  const novoToken = { id: Date.now().toString(), nome: item.nome, img: item.img, x: 50, y: 50, visivel: true, escala: 1 };
  if (!vttState.tokens) vttState.tokens = [];
  vttState.tokens.push(novoToken);
  selecionarToken(novoToken.id);
  desenharTokensBetaNoMestre();
  if (isTransmitindoLive && typeof socket !== 'undefined') socket.emit('tv_atualizar_tokens', vttState.tokens);
  salvarEstadoTabuleiro();
}
window.colocarTokenNaMesa = colocarTokenNaMesa;

function selecionarToken(id) {
  tokenSelecionadoId = id;
  const menu = document.getElementById('menu-token');
  const t = (vttState.tokens || []).find(x => x.id === id);
  if (!t || !menu) { if (menu) menu.style.display = 'none'; return; }
  menu.style.display = 'flex';
  document.getElementById('menu-token-nome').innerText = t.nome;
  document.getElementById('token-escala').value = t.escala || 1;
  const btnVis = document.getElementById('btn-token-vis');
  btnVis.innerText = t.visivel ? '👁️ Visível' : '👻 Invisível';
  desenharTokensBetaNoMestre();
}
window.selecionarToken = selecionarToken;

function deletarTokenSelecionado() {
  vttState.tokens = (vttState.tokens || []).filter(tok => tok.id !== tokenSelecionadoId);
  tokenSelecionadoId = null;
  document.getElementById('menu-token').style.display = 'none';
  desenharTokensBetaNoMestre();
  if (isTransmitindoLive && typeof socket !== 'undefined') socket.emit('tv_atualizar_tokens', vttState.tokens);
  salvarEstadoTabuleiro();
}
window.deletarTokenSelecionado = deletarTokenSelecionado;

function mudarEscalaToken(val) {
  const t = (vttState.tokens || []).find(x => x.id === tokenSelecionadoId);
  if (t) {
    t.escala = parseFloat(val);
    if (isTransmitindoLive && typeof socket !== 'undefined') socket.emit('tv_atualizar_tokens', vttState.tokens);
    desenharTokensBetaNoMestre();
    salvarEstadoTabuleiro();
  }
}
window.mudarEscalaToken = mudarEscalaToken;

function toggleVisibilidadeToken() {
  const t = (vttState.tokens || []).find(x => x.id === tokenSelecionadoId);
  if (t) {
    t.visivel = !t.visivel;
    selecionarToken(t.id);
    if (isTransmitindoLive && typeof socket !== 'undefined') socket.emit('tv_atualizar_tokens', vttState.tokens);
    salvarEstadoTabuleiro();
  }
}
window.toggleVisibilidadeToken = toggleVisibilidadeToken;

function limparMesaTV() {
  vttState.tokens = [];
  tokenSelecionadoId = null;
  document.getElementById('menu-token').style.display = 'none';
  desenharTokensBetaNoMestre();
  if (isTransmitindoLive && typeof socket !== 'undefined') socket.emit('tv_atualizar_tokens', vttState.tokens);
  salvarEstadoTabuleiro();
}
window.limparMesaTV = limparMesaTV;

function desenharTokensBetaNoMestre() {
  const camada = document.getElementById('beta-camada-tokens');
  if (!camada) return;
  camada.innerHTML = '';
  (vttState.tokens || []).forEach(t => {
    const div = document.createElement('div');
    div.id = 'token-ui-' + t.id;
    div.className = 'token-mestre-arrastavel';
    div.style.position = 'absolute';
    div.style.left = t.x + '%';
    div.style.top = t.y + '%';
    div.style.zIndex = (t.id === tokenSelecionadoId) ? '100' : '50';
    const tamanho = 70 * (t.escala || 1);
    div.style.width = tamanho + 'px';
    div.style.height = tamanho + 'px';
    div.style.cursor = 'grab';
    div.style.transform = 'translate(-50%, -50%)';
    if (t.id === tokenSelecionadoId) div.style.filter = `drop-shadow(0 0 15px #e40712)`;
    if (!t.visivel) div.style.opacity = '0.35';

    if (t.img) {
      div.style.background = 'transparent';
      div.innerHTML = `<img src="${t.img}" draggable="false" style="width:100%; height:100%; object-fit:contain; pointer-events:none;">`;
    }
    div.onmousedown = function(e) {
      e.preventDefault(); e.stopPropagation();
      selecionarToken(t.id); tokenArrastandoId = t.id;
    };
    camada.appendChild(div);
  });
}
window.desenharTokensBetaNoMestre = desenharTokensBetaNoMestre;

function obterContextoSeguro(id) {
  const c = document.getElementById(id);
  if (!c) return null;
  if (c.width !== FOG_W) c.width = FOG_W;
  if (c.height !== FOG_H) c.height = FOG_H;
  return c.getContext('2d');
}
function inicializarFogCanvas() { return obterContextoSeguro('beta-fog-canvas'); }
function inicializarDrawCanvas() { return obterContextoSeguro('beta-draw-canvas'); }
function inicializarRulerCanvas() { return obterContextoSeguro('beta-ruler-canvas'); }

function definirModoFog(modo, botao) { fogModo = modo; document.querySelectorAll('.sub-fog-btn').forEach(b => b.classList.remove('active')); if (botao) botao.classList.add('active'); }
window.definirModoFog = definirModoFog;
function alternarTamanhoFog(botao) { if (fogRaio === 35) { fogRaio = 60; } else if (fogRaio === 60) { fogRaio = 110; } else { fogRaio = 35; } }
window.alternarTamanhoFog = alternarTamanhoFog;

function fogCoverAll() { const ctx = inicializarFogCanvas(); if (!ctx) return; ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = '#050508'; ctx.fillRect(0, 0, FOG_W, FOG_H); salvarESincronizarFog(); if (isTransmitindoLive && typeof socket !== 'undefined') socket.emit('tv_fog_cover_all'); }
window.fogCoverAll = fogCoverAll;
function fogRevealAll() { const ctx = inicializarFogCanvas(); if (!ctx) return; ctx.clearRect(0, 0, FOG_W, FOG_H); salvarESincronizarFog(); if (isTransmitindoLive && typeof socket !== 'undefined') socket.emit('tv_fog_reveal_all'); }
window.fogRevealAll = fogRevealAll;

function aplicarTracoFog(x, y, isNovoTraco) {
  const ctx = inicializarFogCanvas();
  if (!ctx) return;
  ctx.lineWidth = fogRaio * 2; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  if (fogModo === 'eraser') { ctx.globalCompositeOperation = 'destination-out'; } else { ctx.globalCompositeOperation = 'source-over'; ctx.strokeStyle = '#050508'; ctx.fillStyle = '#050508'; }
  if (isNovoTraco) { ctx.beginPath(); ctx.arc(x, y, fogRaio, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.moveTo(x, y); } else { ctx.lineTo(x, y); ctx.stroke(); }
  if (isTransmitindoLive && typeof socket !== 'undefined') socket.emit('tv_desenhar_fog', { x, y, isNovoTraco, modo: fogModo, tamanho: fogRaio * 2 });
}
function salvarESincronizarFog() {
  const canvas = document.getElementById('beta-fog-canvas');
  if (!canvas) return;
  try {
    const dataUrl = canvas.toDataURL('image/webp', 0.4);
    vttState.fogData = dataUrl;
    if (vttState.mapaAtivoId) { let m = (vttState.galeriaMapas || []).find(x => String(x.id) === String(vttState.mapaAtivoId)); if (m) m.fogData = dataUrl; }
    if (isTransmitindoLive && typeof socket !== 'undefined') socket.emit('tv_atualizar_fog', dataUrl);
    agendarSalvamentoTabuleiro();
  } catch (e) { console.error(e); }
}
function restaurarFogSalvo(dataUrl) {
  const ctx = inicializarFogCanvas();
  if (!ctx) return;
  ctx.globalCompositeOperation = 'source-over';
  if (!dataUrl) { ctx.clearRect(0, 0, FOG_W, FOG_H); return; }
  const img = new Image(); 
  img.onload = () => { 
    ctx.clearRect(0, 0, FOG_W, FOG_H); 
    ctx.drawImage(img, 0, 0, FOG_W, FOG_H); 
  }; 
  img.src = dataUrl;
}
window.restaurarFogSalvo = restaurarFogSalvo;

function definirModoDrawDDB(modo, btn) { drawModo = modo; document.querySelectorAll('.styles-module__aZFQeq__button').forEach(b => b.classList.remove('variations-module__bhNYuq__active')); if (btn) btn.classList.add('variations-module__bhNYuq__active'); }
window.definirModoDrawDDB = definirModoDrawDDB;
function selecionarCorDrawDDB(hex, btn) { drawCor = hex; drawModo = 'brush'; document.getElementById('svg-draw-droplet').style.color = hex; document.getElementById('palette-draw-ddb').classList.remove('aberto'); }
window.selecionarCorDrawDDB = selecionarCorDrawDDB;
function togglePaletteDrawDDB() { document.getElementById('palette-draw-ddb').classList.toggle('aberto'); }
window.togglePaletteDrawDDB = togglePaletteDrawDDB;

function aplicarTracoDraw(x, y, isNovoTraco) {
  const ctx = inicializarDrawCanvas();
  if (!ctx) return;
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  if (drawModo === 'eraser') { ctx.globalCompositeOperation = 'destination-out'; ctx.lineWidth = drawTamanho * 4; } else { ctx.globalCompositeOperation = 'source-over'; ctx.strokeStyle = drawCor; ctx.fillStyle = drawCor; ctx.lineWidth = drawTamanho; }
  if (isNovoTraco) { ctx.beginPath(); ctx.arc(x, y, (drawModo === 'eraser' ? drawTamanho * 2 : drawTamanho / 2), 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.moveTo(x, y); } else { ctx.lineTo(x, y); ctx.stroke(); }
  if (isTransmitindoLive && typeof socket !== 'undefined') socket.emit('tv_desenhar_traco', { x, y, isNovoTraco, cor: drawCor, modo: drawModo, tamanho: drawTamanho });
}
function salvarESincronizarDraw() {
  const canvas = document.getElementById('beta-draw-canvas');
  if (!canvas) return;
  try {
    const dataUrl = canvas.toDataURL('image/webp', 0.5);
    vttState.drawData = dataUrl;
    if (vttState.mapaAtivoId) { let m = (vttState.galeriaMapas || []).find(x => String(x.id) === String(vttState.mapaAtivoId)); if (m) m.drawData = dataUrl; }
    if (isTransmitindoLive && typeof socket !== 'undefined') socket.emit('tv_atualizar_desenho', dataUrl);
    agendarSalvamentoTabuleiro();
  } catch (e) {}
}
function limparDesenhoMestreETV() {
  const canvas = document.getElementById('beta-draw-canvas');
  if (canvas) { const ctx = canvas.getContext('2d'); ctx.clearRect(0, 0, FOG_W, FOG_H); }
  vttState.drawData = null;
  if (vttState.mapaAtivoId) { let m = (vttState.galeriaMapas || []).find(x => String(x.id) === String(vttState.mapaAtivoId)); if (m) m.drawData = null; }
  salvarEstadoTabuleiro();
  if (isTransmitindoLive && typeof socket !== 'undefined') socket.emit('tv_limpar_desenho');
}
window.limparDesenhoMestreETV = limparDesenhoMestreETV;

function restaurarDrawSalvo(dataUrl) {
  const ctx = inicializarDrawCanvas();
  if (!ctx) return;
  ctx.globalCompositeOperation = 'source-over';
  if (!dataUrl) { ctx.clearRect(0, 0, FOG_W, FOG_H); return; }
  const img = new Image(); 
  img.onload = () => { 
    ctx.clearRect(0, 0, FOG_W, FOG_H); 
    ctx.drawImage(img, 0, 0, FOG_W, FOG_H); 
  }; 
  img.src = dataUrl;
}
window.restaurarDrawSalvo = restaurarDrawSalvo;

function renderizarLinhaRegua(ctx, p1, p2, gradePx = 70) {
  ctx.clearRect(0, 0, FOG_W, FOG_H);
  ctx.beginPath(); ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 4; ctx.setLineDash([10, 8]); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = '#38bdf8'; ctx.beginPath(); ctx.arc(p1.x, p1.y, 6, 0, Math.PI * 2); ctx.arc(p2.x, p2.y, 6, 0, Math.PI * 2); ctx.fill();
  const distPixels = Math.hypot(p2.x - p1.x, p2.y - p1.y); const metros = ((distPixels / gradePx) * 1.5).toFixed(1).replace('.0', '');
  const midX = (p1.x + p2.x) / 2; const midY = (p1.y + p2.y) / 2;
  ctx.font = 'bold 16px sans-serif'; const textWidth = ctx.measureText(`${metros} m`).width; const pillW = textWidth + 24; const pillH = 28;
  ctx.fillStyle = 'rgba(15, 23, 42, 0.9)'; ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 2;
  ctx.beginPath(); if (ctx.roundRect) { ctx.roundRect(midX - pillW / 2, midY - pillH / 2, pillW, pillH, 6); } else { ctx.rect(midX - pillW / 2, midY - pillH / 2, pillW, pillH); }
  ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#ffffff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(`${metros} m`, midX, midY + 1);
}
function limparRulerMestreETV() {
  const canvas = document.getElementById('beta-ruler-canvas');
  if (canvas) canvas.getContext('2d').clearRect(0, 0, FOG_W, FOG_H);
  if (isTransmitindoLive && typeof socket !== 'undefined') socket.emit('tv_limpar_regua');
}

function dispararEfeitoPing(xPct, yPct, cor = '#ef4444') {
  const container = document.getElementById('beta-mapa-container');
  if (!container) return;
  const beacon = document.createElement('div');
  beacon.className = 'vtt-ping-beacon'; beacon.style.left = xPct + '%'; beacon.style.top = yPct + '%';
  beacon.innerHTML = `<div class="vtt-ping-ring" style="border-color: ${cor};"></div><div class="vtt-ping-dot" style="background-color: ${cor}; box-shadow: 0 0 12px ${cor};"></div>`;
  container.appendChild(beacon);
  setTimeout(() => beacon.remove(), 1400);
}
window.dispararEfeitoPing = dispararEfeitoPing;

// --- EVENTOS DO MOUSE (BLINDADOS) ---
function obterCoordsMapa(e) {
  const container = document.getElementById('beta-mapa-container');
  if (!container) return { x: 0, y: 0 };
  const rect = container.getBoundingClientRect();
  return { x: (e.clientX - rect.left) * (FOG_W / rect.width), y: (e.clientY - rect.top) * (FOG_H / rect.height) };
}
const viewportEl = document.getElementById('beta-viewport');
if (viewportEl) {
  viewportEl.onmousedown = function(e) {
    if (e.target.closest('.vtt-sidebar-tools') || e.target.closest('.vtt-topbar-container') || e.target.closest('.vtt-bottom-popover') || e.target.closest('.vtt-dropdown-menu') || e.target.closest('.vtt-submenu') || e.target.closest('.vtt-drawer') || e.target.closest('#menu-token')) return;

    if (['ping', 'pings'].includes(ferramentaAtiva) || e.shiftKey) {
      e.preventDefault();
      const rect = document.getElementById('beta-mapa-container').getBoundingClientRect();
      const xPct = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
      const yPct = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
      dispararEfeitoPing(xPct, yPct);
      if (isTransmitindoLive && typeof socket !== 'undefined') socket.emit('tv_ping', { xPct, yPct, cor: '#ef4444' });
      return;
    }
    if (ferramentaAtiva === 'draw' && e.button === 0) { e.preventDefault(); desenhandoDraw = true; const pos = obterCoordsMapa(e); aplicarTracoDraw(pos.x, pos.y, true); return; }
    if (ferramentaAtiva === 'fog' && e.button === 0) { e.preventDefault(); desenhandoFog = true; const pos = obterCoordsMapa(e); aplicarTracoFog(pos.x, pos.y, true); return; }
    if (ferramentaAtiva === 'ruler' && e.button === 0) { e.preventDefault(); if (timerLimparRuler) clearTimeout(timerLimparRuler); desenhandoRuler = true; pontoInicialRuler = obterCoordsMapa(e); return; }
    if (!e.target.closest('.token-mestre-arrastavel')) { isDraggingMap = true; viewportEl.style.cursor = 'grabbing'; }
  };
  viewportEl.addEventListener('wheel', function(e) {
    e.preventDefault();
    vttState.camera.zoom = Math.max(0.5, Math.min(4, vttState.camera.zoom + (e.deltaY < 0 ? 0.1 : -0.1)));
    atualizarCamera(true);
  }, { passive: false });
}

window.addEventListener('mousemove', (e) => {
  if (tokenArrastandoId) {
    e.preventDefault();
    const t = (vttState.tokens || []).find(x => x.id === tokenArrastandoId);
    if (t) {
      const rect = document.getElementById('beta-camada-tokens').getBoundingClientRect();
      t.x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
      t.y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
      const divToken = document.getElementById('token-ui-' + t.id);
      if (divToken) { divToken.style.left = t.x + '%'; divToken.style.top = t.y + '%'; }
      if (isTransmitindoLive && typeof socket !== 'undefined') socket.emit('tv_atualizar_tokens', vttState.tokens);
    }
    return;
  }
  if (isDraggingMap) { e.preventDefault(); vttState.camera.x += e.movementX; vttState.camera.y += e.movementY; atualizarCamera(false); return; }
  if (desenhandoDraw && ferramentaAtiva === 'draw') { const pos = obterCoordsMapa(e); aplicarTracoDraw(pos.x, pos.y, false); return; }
  if (desenhandoFog && ferramentaAtiva === 'fog') { const pos = obterCoordsMapa(e); aplicarTracoFog(pos.x, pos.y, false); return; }
  if (desenhandoRuler && ferramentaAtiva === 'ruler' && pontoInicialRuler) {
    const pos = obterCoordsMapa(e); const ctx = inicializarRulerCanvas();
    if (ctx) { renderizarLinhaRegua(ctx, pontoInicialRuler, pos, vttState.gridTamanho || 70); if (isTransmitindoLive && typeof socket !== 'undefined') socket.emit('tv_atualizar_regua', { p1: pontoInicialRuler, p2: pos, gradePx: vttState.gridTamanho || 70 }); }
  }
});

window.addEventListener('mouseup', () => {
  const vp = document.getElementById('beta-viewport');
  if (tokenArrastandoId) { tokenArrastandoId = null; salvarEstadoTabuleiro(); }
  if (isDraggingMap) { isDraggingMap = false; if (vp) vp.style.cursor = (['fog', 'draw', 'ruler'].includes(ferramentaAtiva)) ? 'crosshair' : 'grab'; salvarEstadoTabuleiro(); }
  if (desenhandoDraw) { desenhandoDraw = false; salvarESincronizarDraw(); }
  if (desenhandoFog) { desenhandoFog = false; salvarESincronizarFog(); }
  if (desenhandoRuler) { desenhandoRuler = false; pontoInicialRuler = null; timerLimparRuler = setTimeout(() => { limparRulerMestreETV(); }, 1200); }
});

// --- ROLAGEM DE DADOS (CORRIGIDA) ---
function adicionarAoGameLog(faces, resultado, target) {
  const container = document.getElementById('vtt-log-container');
  if (!container) return;
  const agora = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const isCritico = faces === 20 && resultado === 20;
  const badgeClass = isCritico ? 'vtt-badge-damage' : (faces === 20 && resultado === 1) ? 'vtt-badge-tohit' : 'vtt-badge-check';
  const li = document.createElement('li');
  li.className = 'vtt-log-item';
  li.innerHTML = `<div><strong style="color:#fff;">d${faces}</strong><span style="font-size:0.75rem; color:#75838b; margin-left:6px;">(${target} às ${agora})</span></div><span class="${badgeClass}" style="font-size: 1rem;">${resultado}</span>`;
  container.prepend(li);
}
window.adicionarAoGameLog = adicionarAoGameLog;

var timerLimparDadoMestre = null;


async function rolarDadoVirtual(faces) {
  if (!window.diceBoxReady || !window.diceBox) return alert("Física inicializando...");
  if (timerLimparDadoMestre) clearTimeout(timerLimparDadoMestre);

  window.diceBox.clear();
  const notacao = `1d${faces}`;
  const target = vttState.rollTarget || 'Self';

  // FORÇA O TAMANHO DO CANVAS INJETADO E REDIMENSIONA O MUNDO
  const diceCanvas = document.querySelector('#palco-dados-oficial canvas');
  if (diceCanvas) {
    diceCanvas.style.width = '100vw';
    diceCanvas.style.height = '100vh';
  }
  window.dispatchEvent(new Event('resize'));

  try {
    // 1. Rola o dado físico
    const resultado = await window.diceBox.roll(notacao);
    
    // 2. Extrai o número REAL idêntico à ficha de jogador
    let rolagens = [];
    if (Array.isArray(resultado)) {
      resultado.forEach(item => {
        if (item.rolls && Array.isArray(item.rolls)) {
          item.rolls.forEach(d => rolagens.push(d.value));
        } else if (item.value !== undefined) {
          rolagens.push(item.value);
        }
      });
    }
    const valor = rolagens.length > 0 ? rolagens[0] : Math.floor(Math.random() * faces) + 1;

    // 3. Mostra a notificação
    const toast = document.getElementById('toast-rolagem');
    if (toast) {
      document.getElementById('toast-titulo').innerText = `ROLAGEM D${faces} (${target})`;
      document.getElementById('toast-texto').innerText = valor;
      toast.classList.add('show');
    }

    const disp = document.getElementById('resultado-dado-display');
    if (disp) disp.innerText = `d${faces}: ${valor}`;

    if (typeof adicionarAoGameLog === 'function') {
      adicionarAoGameLog(faces, valor, target);
    }

    // 4. Envia o número verdadeiro para a TV exibir o alerta
    if (target === 'Everyone' && typeof socket !== 'undefined') {
      socket.emit('tv_rolar_dado_box', { valor: valor, faces: faces, autor: 'Mestre' });
    }

    timerLimparDadoMestre = setTimeout(() => {
      window.diceBox.clear();
      if (toast) toast.classList.remove('show');
    }, 4000);
  } catch (err) {
    console.error("Erro no dado:", err);
    window.diceBox.clear();
  }
}
window.rolarDadoVirtual = rolarDadoVirtual;

function alternarDisplayMap() {
  isTransmitindoLive = !isTransmitindoLive;
  const btn = document.getElementById('btn-toggle-display');
  const label = document.getElementById('display-map-label');
  const icon = document.getElementById('display-map-icon');
  let standbyImg = ''; if (campanhaAtiva) standbyImg = campanhaAtiva.imagemStandby || campanhaAtiva.standby || '';

  if (isTransmitindoLive) {
    if (btn) btn.classList.add('live-active');
    if (label) label.innerText = 'Em Standby (Pausar)';
    if (icon) icon.innerText = '⏹';
    if (typeof socket !== 'undefined') {
      socket.emit('tv_definir_standby', { emStandby: false, mapaAtivoUrl: vttState.mapaAtivoUrl || '' });
      socket.emit('tv_trocar_mapa', vttState.mapaAtivoUrl || '');
      socket.emit('tv_atualizar_tokens', vttState.tokens || []);
      if (vttState.fogData) socket.emit('tv_atualizar_fog', vttState.fogData || null);
      if (vttState.drawData) socket.emit('tv_atualizar_desenho', vttState.drawData || null);
      socket.emit('tv_aplicar_camera', vttState.camera);
    }
  } else {
    if (btn) btn.classList.remove('live-active');
    if (label) label.innerText = 'Transmitir na TV';
    if (icon) icon.innerText = '▷';
    if (typeof socket !== 'undefined') {
      socket.emit('tv_definir_standby', { emStandby: true, standbyImg: standbyImg });
    }
  }
}
window.alternarDisplayMap = alternarDisplayMap;

socket.on('tv_solicitar_mapa_ativo', () => {
  if (isTransmitindoLive && vttState.mapaAtivoUrl) {
    socket.emit('tv_definir_standby', { emStandby: false, mapaAtivoUrl: vttState.mapaAtivoUrl });
    socket.emit('tv_trocar_mapa', vttState.mapaAtivoUrl);
    socket.emit('tv_atualizar_tokens', vttState.tokens || []);
    if (vttState.fogData) socket.emit('tv_atualizar_fog', vttState.fogData || null);
    if (vttState.drawData) socket.emit('tv_atualizar_desenho', vttState.drawData || null);
    socket.emit('tv_aplicar_camera', vttState.camera);
  }
});

function toggleBottomPopover(nome) { fecharTopMenus(); document.querySelectorAll('.vtt-submenu').forEach(m => m.style.display = 'none'); if (popoverInferiorAtivo === nome) { fecharPopoversInferiores(); return; } fecharPopoversInferiores(); const el = document.getElementById('popover-' + nome); const btn = document.getElementById('btn-pop-' + nome); if (el) { el.style.display = 'flex'; if (btn) btn.classList.add('active'); popoverInferiorAtivo = nome; } }
window.toggleBottomPopover = toggleBottomPopover;
function fecharPopoversInferiores() { document.querySelectorAll('.vtt-bottom-popover').forEach(p => p.style.display = 'none'); ['dmprep', 'rolldice', 'gamelog', 'gameinfo'].forEach(n => { const b = document.getElementById('btn-pop-' + n); if (b) b.classList.remove('active'); }); popoverInferiorAtivo = null; }
window.fecharPopoversInferiores = fecharPopoversInferiores;

// =========================================================================
// SISTEMA DE DIÁRIO DE CAMPANHA E ANOTAÇÕES (QUICK JOT)
// =========================================================================

function salvarQuickJot() {
  const textarea = document.getElementById('quick-jot-text');
  if (!textarea) return;
  const texto = textarea.value.trim();
  if (!texto) return; // Não salva anotações vazias

  // Garante que o array existe
  if (!vttState.journalEntries) vttState.journalEntries = [];
  
  const agora = new Date();
  const horaStr = agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const dataStr = agora.toLocaleDateString('pt-BR');
  
  // Adiciona a anotação no histórico
  vttState.journalEntries.push({
    id: Date.now().toString(),
    texto: texto,
    hora: horaStr,
    data: dataStr
  });

  textarea.value = ''; // Limpa o campo
  fecharTopMenus();
  salvarEstadoTabuleiro(); // Salva no JSON
  alert('Anotação salva no diário!');
}
window.salvarQuickJot = salvarQuickJot;

function abrirModalCampaignJournal() {
  fecharTopMenus();
  const modal = document.getElementById('modal-campaign-journal');
  if (modal) modal.style.display = 'flex';
  renderizarJournal();
}
window.abrirModalCampaignJournal = abrirModalCampaignJournal;

// =========================================================================
// RENDERIZAÇÃO DO DM PREP NOTES (ABAS CORRIGIDAS E FIXAS NO TOPO)
// =========================================================================

function renderizarDMPrep() {
  const container = document.querySelector('#popover-dmprep > div');
  if (!container) return;
  container.innerHTML = '';
  // Remove o padding interno padrão para colar as abas no topo
  container.style.padding = '0'; 
  
  const notas = (campanhaAtiva && campanhaAtiva.dmPrep) ? campanhaAtiva.dmPrep : [];
  if (notas.length === 0) {
    container.innerHTML = '<div style="color:var(--vtt-text-muted); text-align:center; padding:20px;">Nenhuma nota de mestre cadastrada no JSON desta campanha.</div>';
    return;
  }

  // 1. Cria a barra superior FIXA (Sticky)
  const tabsContainer = document.createElement('div');
  tabsContainer.style.cssText = "display: flex; gap: 8px; overflow-x: auto; background: var(--vtt-bg-pane); padding: 12px 16px; border-bottom: 1px solid var(--vtt-border); position: sticky; top: 0; z-index: 50; scrollbar-width: thin; flex-shrink: 0;";
  
  // 2. Cria a área de rolagem do texto
  const contentContainer = document.createElement('div');
  contentContainer.style.cssText = "padding: 16px;";

  notas.forEach((nota, idx) => {
    // Criação dos Botões (Abas)
    const btnTab = document.createElement('button');
    btnTab.innerText = `Cena ${idx + 1}`;
    btnTab.title = nota.titulo || `Cena ${idx + 1}`;
    
    // CSS dinâmico das abas
    const estiloAtivo = "flex-shrink: 0; white-space: nowrap; padding: 6px 12px; border-radius: 4px; font-size: 0.8rem; font-weight: bold; cursor: pointer; transition: 0.15s; background: var(--vtt-bg-box); color: #fff; border: 1px solid var(--vtt-border);";
    const estiloInativo = "flex-shrink: 0; white-space: nowrap; padding: 6px 12px; border-radius: 4px; font-size: 0.8rem; font-weight: bold; cursor: pointer; transition: 0.15s; background: transparent; color: var(--vtt-text-muted); border: 1px solid transparent;";
    
    btnTab.style.cssText = idx === 0 ? estiloAtivo : estiloInativo;

    // Criação do Conteúdo da Cena
    const section = document.createElement('div');
    section.style.display = idx === 0 ? 'block' : 'none'; 
    
    let html = `<h2 style="color: #fff; margin: 0 0 12px 0; font-size: 1.15rem; border-bottom: 2px solid var(--vtt-gold); padding-bottom: 6px; text-transform: uppercase; letter-spacing: 1px;">${nota.titulo || 'Nova Cena'}</h2>`;
    
    // Lógica do Handout/Pistas na Cena com UPLOAD
    if (nota.handout) {
      const hasImage = !!nota.handout.url;
      
      html += `<div style="display: flex; gap: 8px; margin-bottom: 14px; background: var(--vtt-bg-box); padding: 10px; border-radius: 6px; border: 1px solid var(--vtt-border); align-items: center;">
                 <div style="flex: 1;">
                   <strong style="color: #fff; font-size: 0.85rem; display: block;">Evidência: ${nota.handout.titulo}</strong>
                 </div>`;
                 
      if (hasImage) {
        html += `<div style="display: flex; gap: 4px;">
                   <button style="background: var(--vtt-gold); color: #000; border: none; padding: 4px 10px; border-radius: 4px; font-size: 0.75rem; font-weight: bold; cursor: pointer;" onclick="exibirHandoutNaTV(${idx})">👁️ TV</button>
                   <button style="background: transparent; color: #f87171; border: 1px solid #f87171; padding: 4px 10px; border-radius: 4px; font-size: 0.75rem; font-weight: bold; cursor: pointer;" onclick="esconderHandoutDaTV()">✕ Ocultar</button>
                   <button style="background: transparent; color: #38bdf8; border: 1px solid #38bdf8; padding: 4px; border-radius: 4px; font-size: 0.75rem; cursor: pointer;" title="Alterar Imagem" onclick="atualizarImagemHandout(${idx})">✏️</button>
                 </div>`;
      } else {
        // Se NÃO tem imagem, mostra um botãozão azul convidativo para fazer o upload
        html += `<div style="display: flex; gap: 4px;">
                   <button style="background: #2563eb; color: #fff; border: none; padding: 4px 10px; border-radius: 4px; font-size: 0.75rem; font-weight: bold; cursor: pointer;" onclick="atualizarImagemHandout(${idx})">🖼️ Upar Imagem</button>
                 </div>`;
      }
      
      html += `</div>`;
    }

    if (nota.intro) {
      html += `<h3 style="color: var(--vtt-gold); font-size: 0.95rem; margin-bottom: 6px;">Intro</h3>`;
      if (nota.intro.readAloud) html += `<blockquote style="margin: 0 0 10px 0; padding: 12px 14px; background: rgba(193, 148, 41, 0.08); border-left: 3px solid var(--vtt-gold); font-style: italic; color: #e4e4e7; font-size: 0.9rem; line-height: 1.5;">"${nota.intro.readAloud}"</blockquote>`;
      if (nota.intro.keyInfo) html += `<div style="font-size: 0.85rem; color: #d4d4d8; margin-bottom: 14px; background: var(--vtt-bg-box); padding: 8px; border-radius: 4px;"><strong>💡 Key Info:</strong> ${nota.intro.keyInfo}</div>`;
    }
    
    if (nota.purpose) {
      html += `<h3 style="color: var(--vtt-gold); font-size: 0.95rem; margin-bottom: 6px;">Purpose</h3><div style="font-size: 0.85rem; color: #d4d4d8; margin-bottom: 14px; line-height: 1.5;">`;
      if (nota.purpose.storyDrive) html += `<div style="margin-bottom: 4px;"><strong>Story Drive:</strong> ${nota.purpose.storyDrive}</div>`;
      if (nota.purpose.goal) html += `<div><strong>Goal:</strong> ${nota.purpose.goal}</div></div>`;
    }
    
    if (nota.outcomes) {
      html += `<h3 style="color: var(--vtt-gold); font-size: 0.95rem; margin-bottom: 6px;">Outcomes</h3><div style="font-size: 0.85rem; color: #d4d4d8; margin-bottom: 14px; line-height: 1.5;">`;
      if (nota.outcomes.rewards) html += `<div style="margin-bottom: 4px;"><strong style="color: #4ade80;">Rewards:</strong> ${nota.outcomes.rewards}</div>`;
      if (nota.outcomes.consequences) html += `<div><strong style="color: #f87171;">Consequences:</strong> ${nota.outcomes.consequences}</div></div>`;
    }
    
    if (nota.locationInfo) html += `<h3 style="color: var(--vtt-gold); font-size: 0.95rem; margin-bottom: 6px;">Location Info</h3><div style="font-size: 0.85rem; color: #d4d4d8; margin-bottom: 14px; background: var(--vtt-bg-box); padding: 10px; border-radius: 4px; border: 1px dashed var(--vtt-border); line-height: 1.5;">${nota.locationInfo}</div>`;
    
    if (nota.activities && nota.activities.length > 0) {
      html += `<h3 style="color: var(--vtt-gold); font-size: 0.95rem; margin-bottom: 6px;">Activities & Interactions</h3><ul style="font-size: 0.85rem; color: #d4d4d8; margin: 0 0 14px 20px; padding: 0; line-height: 1.6;">`;
      nota.activities.forEach(act => html += `<li style="margin-bottom: 4px;">${act}</li>`);
      html += `</ul>`;
    }
    
    if (nota.sceneSummaries && nota.sceneSummaries.length > 0) {
      html += `<h3 style="color: var(--vtt-gold); font-size: 0.95rem; margin-bottom: 6px;">Scene Summaries</h3><div style="display: flex; flex-direction: column; gap: 8px;">`;
      nota.sceneSummaries.forEach(scene => {
        html += `<div style="background: var(--vtt-bg-box); padding: 10px; border-left: 3px solid #38bdf8; border-radius: 4px; font-size: 0.85rem; line-height: 1.5;">
                   <strong style="color: #38bdf8; display: block; margin-bottom: 4px; font-size: 0.95rem;">${scene.nome}</strong><span style="color: #d4d4d8;">${scene.desc}</span>
                 </div>`;
      });
      html += `</div>`;
    }
    
    section.innerHTML = html;

    // Lógica do clique na aba
    btnTab.onclick = () => {
      Array.from(tabsContainer.children).forEach(b => b.style.cssText = estiloInativo);
      btnTab.style.cssText = estiloAtivo;
      Array.from(contentContainer.children).forEach(s => s.style.display = 'none');
      section.style.display = 'block';
    };

    tabsContainer.appendChild(btnTab);
    contentContainer.appendChild(section);
  });

  container.appendChild(tabsContainer);
  container.appendChild(contentContainer);
}
window.renderizarDMPrep = renderizarDMPrep;

function fecharModalCampaignJournal() {
  const modal = document.getElementById('modal-campaign-journal');
  if (modal) modal.style.display = 'none';
}
window.fecharModalCampaignJournal = fecharModalCampaignJournal;

function renderizarJournal() {
  const container = document.getElementById('campaign-journal-entries');
  if (!container) return;
  container.innerHTML = '';
  
  if (!vttState.journalEntries || vttState.journalEntries.length === 0) {
    container.innerHTML = '<p style="color: var(--vtt-text-muted);">Nenhuma anotação gravada ainda.</p>';
    return;
  }

  // Clona e inverte o array para mostrar os mais recentes no topo
  [...vttState.journalEntries].reverse().forEach(entry => {
    const div = document.createElement('div');
    div.style = "background: var(--vtt-bg-box); padding: 12px; border: 1px solid var(--vtt-border); border-radius: 6px; margin-bottom: 12px;";
    div.innerHTML = `
      <div style="font-size: 0.75rem; color: var(--vtt-gold); margin-bottom: 6px; font-weight: bold;">${entry.data} às ${entry.hora}</div>
      <div style="color: var(--vtt-text-main); white-space: pre-wrap;">${entry.texto}</div>
    `;
    container.appendChild(div);
  });
}
window.renderizarJournal = renderizarJournal;

// =========================================================================
// CRIAÇÃO MANUAL DE AGENTES (FICHAS)
// =========================================================================

const LISTA_PERICIAS_SISTEMA = [
  'Acrobacia', 'Adestramento', 'Artes', 'Atletismo', 'Atualidades', 'Ciências',
  'Crime', 'Diplomacia', 'Enganação', 'Fortitude', 'Furtividade', 'Iniciativa',
  'Intimidação', 'Intuição', 'Investigação', 'Luta', 'Medicina', 'Ocultismo',
  'Percepção', 'Pilotagem', 'Pontaria', 'Profissão', 'Reflexos', 'Religião',
  'Sobrevivência', 'Tática', 'Tecnologia', 'Vontade'
];

function abrirModalNovoPersonagemManual() {
  document.getElementById('p-manual-nome').value = '';
  document.getElementById('p-manual-origem').value = '';
  document.getElementById('p-manual-pv').value = '10';
  document.getElementById('p-manual-san').value = '10';
  document.getElementById('p-manual-pe').value = '2';
  
  document.getElementById('p-manual-agi').value = '1';
  document.getElementById('p-manual-for').value = '1';
  document.getElementById('p-manual-int').value = '1';
  document.getElementById('p-manual-pre').value = '1';
  document.getElementById('p-manual-vig').value = '1';
  
  document.getElementById('lista-itens-inventario-modal').innerHTML = '';
  
  // Renderiza a lista de seleção de perícias
  const boxPericias = document.getElementById('grid-pericias-manual-modal');
  if (boxPericias) {
    boxPericias.innerHTML = '';
    LISTA_PERICIAS_SISTEMA.forEach(pericia => {
      const label = document.createElement('label');
      label.style = 'display:flex; align-items:center; gap:6px; font-size:0.75rem; color:#d4d4d8; cursor:pointer; user-select:none;';
      label.innerHTML = `<input type="checkbox" value="${pericia}" class="chk-pericia-manual" style="cursor:pointer;"> ${pericia}`;
      boxPericias.appendChild(label);
    });
  }
  
  document.getElementById('modal-personagem-manual').style.display = 'flex';
}
window.abrirModalNovoPersonagemManual = abrirModalNovoPersonagemManual;

function fecharModalNovoPersonagemManual() {
  document.getElementById('modal-personagem-manual').style.display = 'none';
}
window.fecharModalNovoPersonagemManual = fecharModalNovoPersonagemManual;

function adicionarLinhaItemInventario() {
  const container = document.getElementById('lista-itens-inventario-modal');
  const div = document.createElement('div');
  div.className = 'item-builder-linha';
  
  // Cria os campos de nome do item e fórmula de dano (se for arma)
  div.innerHTML = `
    <input type="text" class="cris-field-input item-nome" placeholder="Nome do Item/Arma" style="margin-bottom:4px; padding:6px;">
    <div style="display:flex; gap:4px;">
      <input type="text" class="cris-field-input item-dano" placeholder="Dano (Ex: 1d8+2)" style="margin-bottom:0; padding:6px;">
      <button class="btn-cris-subtle" style="color:#ef4444; padding:6px;" onclick="this.parentElement.parentElement.remove()">✕</button>
    </div>
  `;
  container.appendChild(div);
}
window.adicionarLinhaItemInventario = adicionarLinhaItemInventario;

function salvarNovoPersonagemManual() {
  if (!campanhaSendoEditada) return alert("Nenhuma campanha em edição!");

  const nome = document.getElementById('p-manual-nome').value.trim();
  if (!nome) return alert("O nome do agente é obrigatório!");

  const pv = parseInt(document.getElementById('p-manual-pv').value) || 10;
  const san = parseInt(document.getElementById('p-manual-san').value) || 10;
  const pe = parseInt(document.getElementById('p-manual-pe').value) || 2;
  const agi = parseInt(document.getElementById('p-manual-agi').value) || 1;
  const forca = parseInt(document.getElementById('p-manual-for').value) || 1;
  const int = parseInt(document.getElementById('p-manual-int').value) || 1;
  const pre = parseInt(document.getElementById('p-manual-pre').value) || 1;
  const vig = parseInt(document.getElementById('p-manual-vig').value) || 1;

  const inventario = [];
  document.querySelectorAll('.item-builder-linha').forEach(linha => {
    const nomeItem = linha.querySelector('.item-nome').value.trim();
    const danoItem = linha.querySelector('.item-dano').value.trim();
    if (nomeItem) {
      inventario.push({
        nome: nomeItem,
        dano: danoItem,
        isArma: !!danoItem,
        tipo: danoItem ? 'armas' : 'equipamento'
      });
    }
  });

  // Coleta as perícias marcadas
  const pericias = [];
  document.querySelectorAll('.chk-pericia-manual:checked').forEach(chk => {
    pericias.push({ nome: chk.value, treinada: true, outros: 0 });
  });

  const novoAgente = {
    id: "agente_" + Date.now(),
    nome: nome,
    origem: document.getElementById('p-manual-origem').value.trim(),
    classe: document.getElementById('p-manual-origem').value.trim(),
    pv: pv, pvMax: pv,
    san: san, sanMax: san,
    pe: pe, peMax: pe,
    atributos: { AGI: agi, FOR: forca, INT: int, PRE: pre, VIG: vig },
    inventario: inventario,
    armas: inventario.filter(i => i.isArma),
    pericias: pericias,
    habilidades: []
  };

  if (!campanhaSendoEditada.personagens) campanhaSendoEditada.personagens = [];
  campanhaSendoEditada.personagens.push(novoAgente);

  renderizarPersonagensNaEdicao();
  
  const textareaJson = document.getElementById('json-campanha-completa-input');
  if (textareaJson) textareaJson.value = JSON.stringify(campanhaSendoEditada, null, 2);

  fecharModalNovoPersonagemManual();
}
window.salvarNovoPersonagemManual = salvarNovoPersonagemManual;
window.salvarNovoPersonagemManual = salvarNovoPersonagemManual;

// SUBSTITUA O EVENTO DE KEYDOWN INTEIRO NO FINAL DO MESTRE.JS POR ESTE:
window.addEventListener('keydown', (e) => {
  const tag = (e.target.tagName || '').toLowerCase();
  
  // Ignora atalhos se o mestre estiver digitando em um campo de texto
  if (tag === 'input' || tag === 'textarea' || e.target.isContentEditable) { 
    if (e.key === 'Escape') e.target.blur(); 
    return; 
  }
  
  // Tecla ESC: Cancela seleções, fecha menus e limpa estado do cursor
  if (e.key === 'Escape') { 
    ativarFerramenta(document.querySelector('.vtt-sidebar-tools .vtt-btn'), 'select'); 
    fecharTopMenus(); 
    fecharPopoversInferiores(); 
    fecharGaveta(); 
    tokenSelecionadoId = null; 
    
    // Oculta o menu de propriedades do token
    const menu = document.getElementById('menu-token');
    if (menu) menu.style.display = 'none';
    
    desenharTokensBetaNoMestre(); 
    return; 
  }

  // Atalho 'J': Abre o Quick Jot (Anotação Rápida)
  if (e.key.toLowerCase() === 'j') {
    e.preventDefault();
    toggleTopPopover('quickjot');
    const popover = document.getElementById('top-popover-quickjot');
    const textarea = document.getElementById('quick-jot-text');
    
    // Se o menu abriu, foca automaticamente na caixa de texto
    if (popover && popover.style.display === 'flex' && textarea) {
      setTimeout(() => textarea.focus(), 50);
    }
  }
});

// Inicia o carregamento das campanhas assim que o script é lido
document.addEventListener('DOMContentLoaded', () => {
  carregarCampanhas();
});

// =========================================================================
// IMPORTAÇÃO E ATUALIZAÇÃO VIA SCRIPTS JSON (COM VTT AUTO-SETUP)
// =========================================================================

// Função auxiliar para pré-carregar os dados no Tabuleiro
function processarAutoSetupVTT(dados) {
  if (!dados.tabuleiro) dados.tabuleiro = {};
  if (!dados.tabuleiro.galeriaMapas) dados.tabuleiro.galeriaMapas = [];
  if (!dados.tabuleiro.catalogoMonstros) dados.tabuleiro.catalogoMonstros = [];
  if (!dados.tabuleiro.catalogoAgentes) dados.tabuleiro.catalogoAgentes = [];

  // 1. Converte mapasVTT para a Galeria de Mapas real do sistema
  if (dados.mapasVTT) {
    dados.mapasVTT.forEach(m => {
      // Só adiciona se o mapa não existir ainda
      if (!dados.tabuleiro.galeriaMapas.find(x => x.nome === m.nome)) {
        dados.tabuleiro.galeriaMapas.push({
          id: "map_" + Date.now() + Math.random().toString(16).slice(2),
          nome: m.nome,
          url: m.url || "", // Pode estar vazio, o mestre sobe a imagem depois
          tokens: [], fogData: null, drawData: null, camera: { x: 0, y: 0, zoom: 1 }
        });
      }
    });
  }

  // 2. Converte tokensVTT para o Catálogo do Mestre
  if (dados.tokensVTT) {
    dados.tokensVTT.forEach(t => {
      const cat = t.isMonstro ? dados.tabuleiro.catalogoMonstros : dados.tabuleiro.catalogoAgentes;
      if (!cat.find(x => x.nome === t.nome)) {
        cat.push({
          id: "tok_" + Date.now() + Math.random().toString(16).slice(2),
          nome: t.nome,
          img: t.img || "", // Imagem pode ser vazia por enquanto
          isMonstro: !!t.isMonstro
        });
      }
    });
  }
  return dados;
}

async function salvarNovaCampanhaJson() {
  const input = document.getElementById('novo-camp-json-input');
  if (!input) return;
  const raw = input.value.trim();
  if (!raw) return alert("Cole o JSON da campanha primeiro!");

  try {
    let dados = JSON.parse(raw);
    if (!dados.nome) return alert("O JSON deve conter pelo menos o campo 'nome'.");
    if (!dados.id) dados.id = dados.nome.toLowerCase().replace(/[^a-z0-9]/g, '-');
    if (!dados.personagens) dados.personagens = [];
    if (!dados.locais) dados.locais = [];

    // MÁGICA: Pré-monta o tabuleiro com mapas e tokens vazios
    dados = processarAutoSetupVTT(dados);

    await fetch('/api/campanhas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados)
    });

    fecharModalNovaCampanha();
    await carregarCampanhas();
    abrirTelaEdicaoCampanha(dados.id);
    alert(`Campanha "${dados.nome}" importada com sucesso e Tabuleiro pré-configurado!`);
  } catch (err) {
    alert("JSON inválido! Verifique a formatação do script.");
    console.error(err);
  }
}
window.salvarNovaCampanhaJson = salvarNovaCampanhaJson;

// 2. Importar apenas uma lista de Agentes (JSON) dentro da aba Agentes
function importarJsonPersonagensNaEdicao() {
  if (!campanhaSendoEditada) return alert("Nenhuma campanha selecionada para edição.");
  const input = document.getElementById('json-personagens-edicao-input');
  if (!input) return;
  const raw = input.value.trim();
  if (!raw) return alert("Cole o JSON dos agentes primeiro!");

  try {
    let agentesNovos = JSON.parse(raw);
    if (!Array.isArray(agentesNovos)) agentesNovos = [agentesNovos];

    if (!campanhaSendoEditada.personagens) campanhaSendoEditada.personagens = [];
    
    agentesNovos.forEach(ag => {
      if (!ag.id) ag.id = 'agente_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5);
      campanhaSendoEditada.personagens.push(ag);
    });

    renderizarPersonagensNaEdicao();
    input.value = '';
    
    const textareaCompleto = document.getElementById('json-campanha-completa-input');
    if (textareaCompleto) textareaCompleto.value = JSON.stringify(campanhaSendoEditada, null, 2);

    alert(`${agentesNovos.length} agente(s) adicionado(s) com sucesso! Não se esqueça de clicar em "Salvar Alterações".`);
  } catch (err) {
    alert("JSON de agentes inválido! Formato esperado: [ { \"nome\": \"...\", ... } ]");
    console.error(err);
  }
}
window.importarJsonPersonagensNaEdicao = importarJsonPersonagensNaEdicao;

// 3. Substituir todos os dados da campanha pelo JSON da aba "Avançado"
function aplicarJsonCompletoNaCampanha() {
  if (!campanhaSendoEditada) return;
  const input = document.getElementById('json-campanha-completa-input');
  if (!input) return;
  const raw = input.value.trim();

  try {
    let dados = JSON.parse(raw);
    dados = processarAutoSetupVTT(dados); // Garante a injeção do tabuleiro na edição também
    campanhaSendoEditada = Object.assign(campanhaSendoEditada, dados);

    document.getElementById('edit-camp-nome').value = campanhaSendoEditada.nome || '';
    document.getElementById('edit-camp-id').value = campanhaSendoEditada.id || '';
    document.getElementById('edit-camp-standby').value = campanhaSendoEditada.imagemStandby || campanhaSendoEditada.standby || '';

    renderizarPersonagensNaEdicao();
    alert("Estrutura da campanha atualizada! Mapas e Tokens novos foram enviados pro VTT. Lembre-se de clicar em 'Salvar Alterações'.");
  } catch (err) {
    alert("JSON inválido! Corrija os erros de sintaxe antes de aplicar.");
    console.error(err);
  }
}
window.aplicarJsonCompletoNaCampanha = aplicarJsonCompletoNaCampanha;

// =========================================================================
// CONTROLE DE PISTAS (HANDOUTS) NA TV
// =========================================================================

function exibirHandoutNaTV(notaIdx) {
  if (campanhaAtiva && campanhaAtiva.dmPrep && campanhaAtiva.dmPrep[notaIdx] && campanhaAtiva.dmPrep[notaIdx].handout) {
    const url = campanhaAtiva.dmPrep[notaIdx].handout.url;
    
    // Verifica se a imagem realmente existe na memória
    if (!url) {
      alert("Aviso: Nenhuma imagem foi upada nesta pista! Clique no botão 🖼️ Upar Imagem primeiro.");
      return;
    }
    
    // Se existir, manda pra TV
    socket.emit('tv_mostrar_handout', url);
  } else {
    alert("Erro interno: Pista não encontrada na memória da campanha.");
  }
}
window.exibirHandoutNaTV = exibirHandoutNaTV;

function esconderHandoutDaTV() {
  socket.emit('tv_esconder_handout');
}
window.esconderHandoutDaTV = esconderHandoutDaTV;

// =========================================================================
// UPLOAD DE IMAGEM PARA PISTAS (HANDOUTS) DIRETAMENTE NO DM PREP
// =========================================================================
function atualizarImagemHandout(notaIdx) {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.onchange = e => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = async ev => {
      // Verifica se a campanha, as notas e o handout existem
      if (campanhaAtiva && campanhaAtiva.dmPrep && campanhaAtiva.dmPrep[notaIdx] && campanhaAtiva.dmPrep[notaIdx].handout) {
        
        // Salva a imagem convertida na variável
        campanhaAtiva.dmPrep[notaIdx].handout.url = ev.target.result;
        
        // Salva a campanha inteira no banco de dados do servidor
        await persistirCampanhaNoServidor(campanhaAtiva);
        
        // Re-desenha as abas para o botão azul sumir e os botões da TV aparecerem
        renderizarDMPrep();
      }
    }
    reader.readAsDataURL(file);
  };
  input.click();
}
window.atualizarImagemHandout = atualizarImagemHandout;