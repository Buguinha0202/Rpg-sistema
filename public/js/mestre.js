// =========================================================================
// C.R.I.S. - TERMINAL DO MESTRE (CORE JS INTEGRADO)
// =========================================================================

const socket = io({ transports: ['websocket'], upgrade: false });

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

socket.on('sincronizar_ficha_atualizada', ({ campanhaId, personagem }) => {
  if (!campanhaAtiva || String(campanhaAtiva.id) !== String(campanhaId)) return;
  const pIdx = campanhaAtiva.personagens.findIndex(p => p.nome === personagem.nome);
  if (pIdx >= 0) {
    campanhaAtiva.personagens[pIdx] = personagem;
    renderizarMonitoresAgentesCockpit(); 
  }
});

socket.on('alerta_rolagem_mesa', (dados) => {
  const agora = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

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
        <div><div class="feed-box-val">${dados.total}</div><div class="feed-box-lbl">TOTAL</div></div>
        <div><div class="feed-box-val" style="font-size:0.75rem;">${dados.detalhes || '-'}</div><div class="feed-box-lbl">DADOS</div></div>
      </div>
      <div class="feed-card-hora">${agora}</div>
    `;
    feedLista.prepend(card);
  }

  const vttLog = document.getElementById('vtt-log-container');
  if (vttLog) {
    const li = document.createElement('li');
    li.className = 'vtt-log-item';
    li.innerHTML = `
      <div>
        <strong style="color:#a855f7;">${dados.jogador}</strong>
        <span style="font-size:0.75rem; color:#75838b; margin-left:6px;">${dados.teste} às ${agora}</span>
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
  await fetch('/api/campanhas', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(c) });
}
window.persistirCampanhaNoServidor = persistirCampanhaNoServidor;

async function carregarCampanhas() {
  try {
    const res = await fetch('/api/campanhas?_t=' + Date.now()); 
    campanhas = await res.json();
    renderizarHub();
  } catch (e) {}
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
          <div style="font-size:0.75rem; color:#9494a8; margin-top:3px;">${(camp.personagens || []).length} Agentes</div>
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
  montarCombate();
  mudarAbaCockpit('agentes');
  mudarView('view-cockpit');
}
window.entrarNoCockpit = entrarNoCockpit;

async function excluirCampanha(id) {
  const camp = campanhas.find(c => String(c.id) === String(id));
  if (!camp || !confirm(`Excluir campanha "${camp.nome}"?`)) return;
  campanhas = campanhas.filter(c => String(c.id) !== String(id));
  renderizarHub();
  try { await fetch(`/api/campanhas/${id}`, { method: 'DELETE' }); } catch (err) {}
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
  if (!nome) return; 
  if (!id) id = nome.toLowerCase().replace(/[^a-z0-9]/g, '-');
  const nova = { id, nome, imagemStandby: standby || '', locais: [], personagens: [], ameacas: [] };
  await fetch('/api/campanhas', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(nova) });
  fecharModalNovaCampanha();
  mostrarToast("Campanha criada com sucesso!");
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
  mostrarToast("Alterações salvas!");
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
    card.innerHTML = `<div><div style="font-weight:800; color:#fff;">${p.nome}</div><div style="font-size:0.75rem; color:#717182;">PV: ${p.pv}/${p.pvMax || p.pv}</div></div><button class="btn-cris-subtle" style="color:#ef4444;" onclick="removerPersonagemDaCampanha(${idx})">Remover</button>`;
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
  if (agentes.length === 0) return grid.innerHTML = '<p style="color:#717182;">Nenhum agente.</p>';
  agentes.forEach(ag => {
    const card = document.createElement('div');
    card.className = 'card-monitor-agente';
    card.innerHTML = `
      <div class="monitor-top"><div class="monitor-avatar" style="background-image:url('${ag.img || ''}')"></div><div><div class="monitor-info-nome">${ag.nome}</div></div></div>
      <div class="monitor-barras-grupo" style="margin-top: 10px;">
        <div style="display:flex; justify-content:space-between;"><span>PV</span><div class="solid-bar vida" style="width:75%;">${ag.pv}/${ag.pvMax}</div></div>
        <div style="display:flex; justify-content:space-between;"><span>SAN</span><div class="solid-bar sanidade" style="width:75%;">${ag.san}/${ag.sanMax}</div></div>
      </div>`;
    grid.appendChild(card);
  });
}
window.renderizarMonitoresAgentesCockpit = renderizarMonitoresAgentesCockpit;

function montarCombate() { }
window.montarCombate = montarCombate;

// =========================================================================
// ================= MODO TABULEIRO DEFINITIVO (VTT BEYOND) =================
// =========================================================================

var vttState = {
  mapaAtivoId: null, mapaAtivoUrl: '', camera: { x: 0, y: 0, zoom: 1 },
  tokens: [], catalogoAgentes: [], catalogoMonstros: [], galeriaMapas: [],
  fogData: null, drawData: null, journalEntries: [], rollTarget: 'Self', gridTamanho: 70
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

var tMousedownX = 0;
var tMousedownY = 0;
const FOG_W = 1920; const FOG_H = 1080;
var fogModo = 'eraser'; var fogRaio = 60; var desenhandoFog = false;
var drawCor = '#ef4444'; var drawTamanho = 6; var drawModo = 'brush'; var desenhandoDraw = false;
var desenhandoRuler = false; var pontoInicialRuler = null; var timerLimparRuler = null; 
var timerDebounceSalvarTabuleiro = null;

function obterIdCampanhaSeguro() {
  if (vttCampanhaAtivaId) return vttCampanhaAtivaId;
  if (typeof campanhaAtiva !== 'undefined' && campanhaAtiva && campanhaAtiva.id) return campanhaAtiva.id;
  return null;
}
window.obterIdCampanhaSeguro = obterIdCampanhaSeguro;

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
    
    // --- NOVO: AUTO-CRIAR TOKENS NA GAVETA (CATÁLOGO) EM VEZ DO MAPA ---
    if (c.personagens && c.personagens.length > 0) {
      if (!vttState.catalogoAgentes) vttState.catalogoAgentes = [];
      
      c.personagens.forEach((p) => {
        // Verifica se o jogador já está na gaveta de tokens
        const jaNoCatalogo = vttState.catalogoAgentes.find(t => t.nome === p.nome);
        
        if (!jaNoCatalogo) {
          vttState.catalogoAgentes.push({
            id: "cat_agente_" + Date.now() + Math.random().toString(16).slice(2),
            nome: p.nome,
            img: p.avatar || 'https://via.placeholder.com/60?text=?',
            pv: p.pv || 10, pvMax: p.pvMax || 10,
            defesa: p.defesa || 10,
            isMonstro: false
          });
        } else {
          // Se já tá na gaveta, apenas atualiza a vida e defesa pra garantir sincronia
          jaNoCatalogo.pv = p.pv;
          jaNoCatalogo.pvMax = p.pvMax;
          jaNoCatalogo.defesa = p.defesa || 10;
        }
      });
    }
    // -------------------------------------------------------------------

    if (vttState.mapaAtivoUrl) {
      const img = document.getElementById('beta-mapa-img');
      const container = document.getElementById('beta-mapa-container');
      if (img) { 
        img.onload = function() {
          if(container) {
            container.style.width = this.naturalWidth + 'px';
            container.style.height = this.naturalHeight + 'px';
          }
          atualizarCamera(false);
        };
        img.src = vttState.mapaAtivoUrl; 
        img.style.opacity = '1'; 
      }
      let mapaAtual = (vttState.galeriaMapas || []).find(m => String(m.id) === String(vttState.mapaAtivoId));
      if (mapaAtual) {
        const labelNome = document.getElementById('nome-mapa-atual');
        if (labelNome) labelNome.innerText = mapaAtual.nome;
      }
      desenharTokensBetaNoMestre();
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
  const container = document.getElementById('beta-mapa-container');
  if (img) { 
    img.onload = function() {
      if(container) {
        container.style.width = this.naturalWidth + 'px';
        container.style.height = this.naturalHeight + 'px';
      }
      resetarZoomManual();
    };
    img.src = novoMapa.url; 
    img.style.opacity = '1'; 
  }
  
  const labelNome = document.getElementById('nome-mapa-atual');
  if (labelNome) labelNome.innerText = novoMapa.nome;

  desenharTokensBetaNoMestre();
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
  const modalTab = document.getElementById('modal-tabuleiro');
  if (!modalTab) return;
  modalTab.style.display = 'block';
  fecharTopMenus();
  fecharPopoversInferiores();
  fecharGaveta();

  const id = obterIdCampanhaSeguro();
  
  if(id) {
    fetch('/api/campanhas?_t=' + Date.now())
      .then(res => res.json())
      .then(listaCamp => {
        const camp = listaCamp.find(c => String(c.id) === String(id));
        carregarEstadoTabuleiro(camp);
        renderizarCatalogo();
        renderizarGaleriaMapas();
      }).catch(e => {});
  } else {
    // MODO SANDBOX: Inicia a mesa zerada caso não exista campanha ativa
    vttState.mapaAtivoId = null;
    vttState.mapaAtivoUrl = '';
    vttState.tokens = [];
    const img = document.getElementById('beta-mapa-img');
    if (img) img.style.opacity = '0';
    desenharTokensBetaNoMestre();
    renderizarCatalogo();
    renderizarGaleriaMapas();
  }
}
window.abrirModoTabuleiro = abrirModoTabuleiro;

function fecharModoTabuleiro() { const m = document.getElementById('modal-tabuleiro'); if (m) m.style.display = 'none'; }
window.fecharModoTabuleiro = fecharModoTabuleiro;

function toggleTopDropdown(nome) { fecharPopoversInferiores(); document.querySelectorAll('.vtt-submenu').forEach(m => m.style.display = 'none'); if (topDropdownAtivo === nome) { fecharTopMenus(); return; } fecharTopMenus(); const el = document.getElementById('top-dropdown-' + nome); if (el) { el.style.display = 'flex'; topDropdownAtivo = nome; if (nome === 'scenarios') renderizarScenariosDropdown(); } }
window.toggleTopDropdown = toggleTopDropdown;
function fecharTopMenus() { document.querySelectorAll('.vtt-dropdown-menu').forEach(m => m.style.display = 'none'); topDropdownAtivo = null; }
window.fecharTopMenus = fecharTopMenus;
function toggleTopPopover(nome) { fecharTopMenus(); fecharPopoversInferiores(); const el = document.getElementById('top-popover-' + nome); if (el) el.style.display = el.style.display === 'flex' ? 'none' : 'flex'; }
window.toggleTopPopover = toggleTopPopover;

function abrirModalMapBrowser() { fecharTopMenus(); document.getElementById('modal-map-browser').style.display = 'flex'; renderizarGaleriaMapas(); }
window.abrirModalMapBrowser = abrirModalMapBrowser;
function fecharModalMapBrowser() { document.getElementById('modal-map-browser').style.display = 'none'; }
window.fecharModalMapBrowser = fecharModalMapBrowser;
function selecionarRollTarget(alvo) { vttState.rollTarget = alvo; document.getElementById('vtt-roll-target-label').innerText = alvo; document.getElementById('target-check-Self').style.color = alvo === 'Self' ? 'var(--vtt-gold)' : 'transparent'; document.getElementById('target-check-Everyone').style.color = alvo === 'Everyone' ? 'var(--vtt-gold)' : 'transparent'; fecharTopMenus(); }
window.selecionarRollTarget = selecionarRollTarget;

function renderizarScenariosDropdown() {
  const list = document.getElementById('top-scenarios-list');
  if (!list) return;
  list.innerHTML = '';
  if (!vttState.galeriaMapas || vttState.galeriaMapas.length === 0) return;
  vttState.galeriaMapas.forEach(mapa => {
    const isAtivo = (String(vttState.mapaAtivoId) === String(mapa.id) || vttState.mapaAtivoUrl === mapa.url);
    const item = document.createElement('div');
    item.className = 'vtt-dropdown-item';
    item.innerHTML = `<span onclick="aplicarMapaNaMesa('${mapa.id}')" style="flex:1; font-weight:${isAtivo?'bold':'normal'}; color:${isAtivo?'#fff':'gray'};">${isAtivo?'● ':''}${mapa.nome}</span><button onclick="deletarMapa('${mapa.id}'); event.stopPropagation();" style="background:transparent;border:none;color:gray;">✕</button>`;
    list.appendChild(item);
  });
}
window.renderizarScenariosDropdown = renderizarScenariosDropdown;

async function salvarNovoMapa() {
  const nome = document.getElementById('add-mapa-nome').value.trim();
  const fileInput = document.getElementById('add-mapa-file');
  if (!nome || !fileInput.files[0]) return;

  const formData = new FormData();
  formData.append('file', fileInput.files[0]);

  try {
    const res = await fetch('/api/upload', { method: 'POST', body: formData });
    const data = await res.json();

    if (!vttState.galeriaMapas) vttState.galeriaMapas = [];
    
    const novo = { id: Date.now().toString(), nome: nome, url: data.url, tokens: [], fogData: null, drawData: null, camera: { x: 0, y: 0, zoom: 1 } };
    vttState.galeriaMapas.push(novo);
    
    salvarEstadoTabuleiro(); 
    renderizarGaleriaMapas();
    
    document.getElementById('add-mapa-nome').value = ''; 
    fileInput.value = '';
    aplicarMapaNaMesa(novo.id);
  } catch (e) {
    console.error("Erro no upload do mapa:", e);
    alert("Falha ao fazer upload do mapa.");
  }
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

function renderizarGaleriaMapas() {
  const grid = document.getElementById('grid-mapas');
  if (!grid) return;
  grid.innerHTML = '';
  if (!vttState.galeriaMapas) return;
  vttState.galeriaMapas.forEach(m => {
    const div = document.createElement('div');
    div.style = "width:200px; background:var(--vtt-bg-box); border:1px solid var(--vtt-border); border-radius:6px; display:flex; flex-direction:column;";
    div.innerHTML = `
      <div style="height:110px; background-image:url('${m.url}'); background-size:cover; border-radius:6px 6px 0 0;"></div>
      <div style="padding:10px; display:flex; justify-content:space-between; align-items:center;">
        <span style="color:#fff; font-size:0.85rem;">${m.nome}</span>
        <button onclick="aplicarMapaNaMesa('${m.id}')" style="background:#2563eb; color:#fff; border:none; padding:4px 8px; border-radius:4px; font-weight:bold; cursor:pointer;">MESA</button>
      </div>`;
    grid.appendChild(div);
  });
}
window.renderizarGaleriaMapas = renderizarGaleriaMapas;

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

function mudarAbaCatalogo(aba) { 
  catalogoAtivo = aba; 
  const tJog = document.getElementById('tab-cat-jogadores');
  const tMon = document.getElementById('tab-cat-monstros');
  if (tJog && tMon) {
    tJog.style.borderBottomColor = aba === 'jogadores' ? 'var(--vtt-active-red)' : 'transparent';
    tJog.style.color = aba === 'jogadores' ? 'var(--text-main)' : 'var(--vtt-text-muted)';
    tMon.style.borderBottomColor = aba === 'monstros' ? 'var(--vtt-active-red)' : 'transparent';
    tMon.style.color = aba === 'monstros' ? 'var(--text-main)' : 'var(--vtt-text-muted)';
  }
  renderizarCatalogo(); 
}
window.mudarAbaCatalogo = mudarAbaCatalogo;

async function adicionarAoCatalogo() {
  const nome = document.getElementById('novo-nome-token').value.trim();
  const fileInput = document.getElementById('novo-img-token');
  if (!nome || !fileInput.files[0]) return;

  const formData = new FormData();
  formData.append('file', fileInput.files[0]);

  try {
    const res = await fetch('/api/upload', { method: 'POST', body: formData });
    const data = await res.json();

    const novoItem = { id: Date.now().toString(), nome: nome, img: data.url, isMonstro: catalogoAtivo === 'monstros' };
    
    if (!vttState.catalogoAgentes) vttState.catalogoAgentes = [];
    if (!vttState.catalogoMonstros) vttState.catalogoMonstros = [];
    
    if (catalogoAtivo === 'jogadores') vttState.catalogoAgentes.push(novoItem); 
    else vttState.catalogoMonstros.push(novoItem);
    
    document.getElementById('novo-nome-token').value = ''; 
    fileInput.value = '';
    
    salvarEstadoTabuleiro(); 
    renderizarCatalogo();
  } catch (e) {
    console.error("Erro no upload do token:", e);
    alert("Falha ao fazer upload do token.");
  }
}
window.adicionarAoCatalogo = adicionarAoCatalogo;

function deletarDoCatalogo(id, isMonstro) {
  if (isMonstro) vttState.catalogoMonstros = (vttState.catalogoMonstros || []).filter(x => x.id !== id);
  else vttState.catalogoAgentes = (vttState.catalogoAgentes || []).filter(x => x.id !== id);
  salvarEstadoTabuleiro(); renderizarCatalogo();
}
window.deletarDoCatalogo = deletarDoCatalogo;

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
        <!-- IMAGEM CLICÁVEL PARA EDITAR -->
        <div style="position:relative; cursor:pointer;" onclick="prepararEdicaoToken('${item.id}', ${item.isMonstro})" title="Clique para trocar a imagem">
          <img src="${item.img || 'https://via.placeholder.com/45?text=?'}" style="width:45px; height:45px; border-radius:50%; object-fit:cover; border:2px solid var(--vtt-border); transition: 0.2s;" onmouseover="this.style.borderColor='var(--vtt-gold)'" onmouseout="this.style.borderColor='var(--vtt-border)'">
          <div style="position:absolute; bottom:-4px; right:-4px; background:var(--vtt-bg-box); border-radius:50%; padding:2px; font-size:0.6rem; border: 1px solid var(--vtt-border);">✏️</div>
        </div>
        <div style="color:#fff; font-weight:bold;">${item.nome}</div>
      </div>
      <div style="display:flex; gap:6px; align-items:center;">
        <button onclick="deletarDoCatalogo('${item.id}', ${item.isMonstro})" style="color:gray; border:none; background:transparent; cursor:pointer; font-size: 1.1rem;" title="Excluir">🗑</button>
        <button onclick="colocarTokenNaMesa('${item.id}')" style="color:var(--vtt-gold); border:none; background:transparent; font-size:1.8rem; font-weight:bold; cursor:pointer;" title="Colocar na Mesa">+</button>
      </div>`;
    lista.appendChild(div);
  });
}
window.renderizarCatalogo = renderizarCatalogo;

// =========================================================================
// TOKENS NA MESA
// =========================================================================

function colocarTokenNaMesa(catalogoId) {
  const base = [...(vttState.catalogoAgentes || []), ...(vttState.catalogoMonstros || [])].find(t => t.id === catalogoId);
  if (!base) return;

  const novoToken = {
    id: "tok_" + Date.now(),
    nome: base.nome,
    img: base.img || 'https://via.placeholder.com/60?text=?',
    pv: base.pv || 12, pvMax: base.pvMax || 12,
    defesa: base.defesa || 15, // <--- ADICIONE ESTA LINHA (Defesa padrão 15 para testes)
    x: 50, y: 50,
    tamanho: 70, escala: 1, visivel: true
  };

  const mapa = (vttState.galeriaMapas || []).find(m => String(m.id) === String(vttState.mapaAtivoId));
  
  if (mapa) {
    if (!mapa.tokens) mapa.tokens = [];
    mapa.tokens.push(novoToken);
    vttState.tokens = mapa.tokens;
  } else {
    if (!vttState.tokens) vttState.tokens = [];
    vttState.tokens.push(novoToken);
  }
  
  salvarEstadoTabuleiro();
  desenharTokensBetaNoMestre();
  if (isTransmitindoLive && typeof socket !== 'undefined') socket.emit('tv_atualizar_tokens', vttState.tokens);
}
window.colocarTokenNaMesa = colocarTokenNaMesa;

function desenharTokensBetaNoMestre() {
  const container = document.getElementById('beta-camada-tokens');
  if (!container) return;
  container.innerHTML = '';
  
  const tokensParaDesenhar = vttState.tokens || [];

  tokensParaDesenhar.forEach(tok => {
    const el = document.createElement('div');
    el.className = 'token-mestre-arrastavel token-mesa-item';
    el.id = 'token-ui-' + tok.id;
    
    const tamanhoPx = 70 * (tok.escala || 1);
    el.style.cssText = `
      position: absolute;
      left: ${tok.x}%;
      top: ${tok.y}%;
      width: ${tamanhoPx}px;
      height: ${tamanhoPx}px;
      cursor: grab;
      user-select: none;
      z-index: ${tok.id === tokenSelecionadoId ? '100' : '50'};
      transform: translate(-50%, -50%);
      border-radius: 0;
      background: transparent;
    `;
    
   if (tok.id === tokenSelecionadoId) el.style.filter = `drop-shadow(0 0 15px #e40712)`; 
    else if (window.tokensSelecionadosMulti && window.tokensSelecionadosMulti.includes(tok.id)) el.style.filter = `drop-shadow(0 0 15px #c19429)`; 
    if (tok.visivel === false) el.style.opacity = '0.35';

    if (tok.img) {
      el.innerHTML = `<img src="${tok.img}" draggable="false" style="width:100%; height:100%; object-fit:contain; pointer-events:none; border-radius:0;">`;
    }

    el.onmousedown = function(e) {
      if(ferramentaAtiva !== 'select') return;
      e.stopPropagation();
      
      // CORREÇÃO: Se estiver mirando para atacar, NÃO inicia o arrasto!
      if (window.modoMiraAtivo) return; 

      selecionarToken(tok.id); 
      tokenArrastandoId = tok.id;
      tMousedownX = e.clientX;
      tMousedownY = e.clientY;
    };
    
    el.onmouseup = function(e) {
      if(ferramentaAtiva !== 'select') return;
      
      // Se estiver no Modo de Mira, resolve o ataque e para por aqui
      if (window.modoMiraAtivo) {
        e.stopPropagation();
        tokenArrastandoId = null; // Garante que o token soltou do mouse
        resolverAtaqueTatico(tok.id);
        return;
      }

      const dist = Math.abs(e.clientX - tMousedownX) + Math.abs(e.clientY - tMousedownY);
      if (dist < 5) {
        const rect = el.getBoundingClientRect();
        const XdoMenu = rect.left + (rect.width / 2);
        const YdoMenu = rect.top - 10; 
        abrirToolbarToken(tok.id, tok.nome, tok.pv, tok.pvMax, XdoMenu, YdoMenu);
      }
      tokenArrastandoId = null;
      salvarEstadoTabuleiro();
    };
    container.appendChild(el);
  });
}
window.desenharTokensBetaNoMestre = desenharTokensBetaNoMestre;

// =========================================================================
// O MENU FLUTUANTE (TOOLBAR) E AÇÕES DO TOKEN
// =========================================================================

window.tokenFocadoId = null; 

function abrirToolbarToken(id, nome, hp, hpMax, x, y) {
  window.tokenFocadoId = id; 
  const toolbar = document.getElementById('token-toolbar');
  if (!toolbar) return;
  document.getElementById('tt-nome').innerText = nome || 'Token';
  document.getElementById('tt-hp').innerText = `${hp || 0}/${hpMax || 0}`;
  toolbar.style.left = `${x}px`;
  toolbar.style.top = `${y}px`;
  toolbar.style.display = 'flex';
}
window.abrirToolbarToken = abrirToolbarToken;

function fecharToolbarToken() {
  const toolbar = document.getElementById('token-toolbar');
  if (toolbar) toolbar.style.display = 'none';
  window.tokenFocadoId = null;
  
  const submenu = document.getElementById('token-submenu-visuais');
  if (submenu) submenu.style.display = 'none';
}
window.fecharToolbarToken = fecharToolbarToken;

function selecionarToken(id) { tokenSelecionadoId = id; desenharTokensBetaNoMestre(); }
window.selecionarToken = selecionarToken;

function deletarTokenSelecionado() {
  const alvo = tokenFocadoId || tokenSelecionadoId;
  if(!alvo) return;
  vttState.tokens = (vttState.tokens || []).filter(tok => tok.id !== alvo);
  if(tokenSelecionadoId === alvo) tokenSelecionadoId = null;
  fecharToolbarToken(); desenharTokensBetaNoMestre();
  if (isTransmitindoLive && typeof socket !== 'undefined') socket.emit('tv_atualizar_tokens', vttState.tokens);
  salvarEstadoTabuleiro();
}
window.deletarTokenSelecionado = deletarTokenSelecionado;
window.removerTokenDaMesa = deletarTokenSelecionado;

function editarHpToken() {
  if (!tokenFocadoId) return;
  const novoHp = prompt("Novo HP:");
  if (novoHp !== null) {
     const t = (vttState.tokens || []).find(x => x.id === tokenFocadoId);
     if(t) { 
       t.pv = parseInt(novoHp); 
       document.getElementById('tt-hp').innerText = t.pv + '/' + (t.pvMax||t.pv); 
       
       // Sincroniza com a ficha
       if (campanhaAtiva && campanhaAtiva.personagens) {
          const pIdx = campanhaAtiva.personagens.findIndex(p => p.nome === t.nome);
          if (pIdx >= 0) {
            campanhaAtiva.personagens[pIdx].pv = t.pv;
            if (typeof socket !== 'undefined') {
              socket.emit('atualizar_dados_personagem', { campanhaId: campanhaAtiva.id, personagem: campanhaAtiva.personagens[pIdx] });
            }
          }
       }
       salvarEstadoTabuleiro(); 
     }
  }
}
window.editarHpToken = editarHpToken;

function toggleVisibilidadeToken() {
  const t = (vttState.tokens || []).find(x => x.id === tokenFocadoId);
  if (t) {
    t.visivel = (t.visivel === false) ? true : false;
    desenharTokensBetaNoMestre(); fecharToolbarToken();
    if (isTransmitindoLive && typeof socket !== 'undefined') socket.emit('tv_atualizar_tokens', vttState.tokens);
    salvarEstadoTabuleiro();
  }
}
window.toggleVisibilidadeToken = toggleVisibilidadeToken;

function limparMesaTV() {
  vttState.tokens = []; 
  tokenSelecionadoId = null; 
  window.tokenFocadoId = null;
  fecharToolbarToken(); 
  desenharTokensBetaNoMestre();
  if (isTransmitindoLive && typeof socket !== 'undefined') socket.emit('tv_atualizar_tokens', vttState.tokens);
  salvarEstadoTabuleiro();
}
window.limparMesaTV = limparMesaTV;

// =========================================================================
// O MAPA, AS FERRAMENTAS E O MOUSE DO MESTRE
// =========================================================================

function obterContextoSeguro(id) { const c = document.getElementById(id); if (!c) return null; if (c.width !== FOG_W) c.width = FOG_W; if (c.height !== FOG_H) c.height = FOG_H; return c.getContext('2d'); }
function inicializarFogCanvas() { return obterContextoSeguro('beta-fog-canvas'); }
function inicializarDrawCanvas() { return obterContextoSeguro('beta-draw-canvas'); }
function inicializarRulerCanvas() { return obterContextoSeguro('beta-ruler-canvas'); }
function definirModoFog(modo, botao) { fogModo = modo; document.querySelectorAll('.sub-fog-btn').forEach(b => b.classList.remove('active')); if (botao) botao.classList.add('active'); }
window.definirModoFog = definirModoFog;
function alternarTamanhoFog() { if (fogRaio === 35) { fogRaio = 60; } else if (fogRaio === 60) { fogRaio = 110; } else { fogRaio = 35; } }
window.alternarTamanhoFog = alternarTamanhoFog;

function fogCoverAll() { const ctx = inicializarFogCanvas(); if (!ctx) return; ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = '#050508'; ctx.fillRect(0, 0, FOG_W, FOG_H); salvarESincronizarFog(); if (isTransmitindoLive && typeof socket !== 'undefined') socket.emit('tv_fog_cover_all'); }
window.fogCoverAll = fogCoverAll;
function fogRevealAll() { const ctx = inicializarFogCanvas(); if (!ctx) return; ctx.clearRect(0, 0, FOG_W, FOG_H); salvarESincronizarFog(); if (isTransmitindoLive && typeof socket !== 'undefined') socket.emit('tv_fog_reveal_all'); }
window.fogRevealAll = fogRevealAll;

function aplicarTracoFog(x, y, isNovoTraco) {
  const ctx = inicializarFogCanvas(); if (!ctx) return;
  ctx.lineWidth = fogRaio * 2; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  if (fogModo === 'eraser') { ctx.globalCompositeOperation = 'destination-out'; } else { ctx.globalCompositeOperation = 'source-over'; ctx.strokeStyle = '#050508'; ctx.fillStyle = '#050508'; }
  if (isNovoTraco) { ctx.beginPath(); ctx.arc(x, y, fogRaio, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.moveTo(x, y); } else { ctx.lineTo(x, y); ctx.stroke(); }
  if (isTransmitindoLive && typeof socket !== 'undefined') socket.emit('tv_desenhar_fog', { x, y, isNovoTraco, modo: fogModo, tamanho: fogRaio * 2 });
}
function salvarESincronizarFog() {
  const canvas = document.getElementById('beta-fog-canvas'); if (!canvas) return;
  try {
    const dataUrl = canvas.toDataURL('image/webp', 0.4); vttState.fogData = dataUrl;
    if (vttState.mapaAtivoId) { let m = (vttState.galeriaMapas || []).find(x => String(x.id) === String(vttState.mapaAtivoId)); if (m) m.fogData = dataUrl; }
    if (isTransmitindoLive && typeof socket !== 'undefined') socket.emit('tv_atualizar_fog', dataUrl); agendarSalvamentoTabuleiro();
  } catch (e) { }
}
function restaurarFogSalvo(dataUrl) {
  const ctx = inicializarFogCanvas(); if (!ctx) return; ctx.globalCompositeOperation = 'source-over';
  if (!dataUrl) { ctx.clearRect(0, 0, FOG_W, FOG_H); return; }
  const img = new Image(); img.onload = () => { ctx.clearRect(0, 0, FOG_W, FOG_H); ctx.drawImage(img, 0, 0, FOG_W, FOG_H); }; img.src = dataUrl;
}
window.restaurarFogSalvo = restaurarFogSalvo;

function definirModoDrawDDB(modo, btn) { drawModo = modo; document.querySelectorAll('.styles-module__aZFQeq__button').forEach(b => b.classList.remove('variations-module__bhNYuq__active')); if (btn) btn.classList.add('variations-module__bhNYuq__active'); }
window.definirModoDrawDDB = definirModoDrawDDB;
function selecionarCorDrawDDB(hex) { drawCor = hex; drawModo = 'brush'; document.getElementById('svg-draw-droplet').style.color = hex; document.getElementById('palette-draw-ddb').classList.remove('aberto'); }
window.selecionarCorDrawDDB = selecionarCorDrawDDB;
function togglePaletteDrawDDB() { document.getElementById('palette-draw-ddb').classList.toggle('aberto'); }
window.togglePaletteDrawDDB = togglePaletteDrawDDB;

function aplicarTracoDraw(x, y, isNovoTraco) {
  const ctx = inicializarDrawCanvas(); if (!ctx) return;
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  if (drawModo === 'eraser') { ctx.globalCompositeOperation = 'destination-out'; ctx.lineWidth = drawTamanho * 4; } else { ctx.globalCompositeOperation = 'source-over'; ctx.strokeStyle = drawCor; ctx.fillStyle = drawCor; ctx.lineWidth = drawTamanho; }
  if (isNovoTraco) { ctx.beginPath(); ctx.arc(x, y, (drawModo === 'eraser' ? drawTamanho * 2 : drawTamanho / 2), 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.moveTo(x, y); } else { ctx.lineTo(x, y); ctx.stroke(); }
  if (isTransmitindoLive && typeof socket !== 'undefined') socket.emit('tv_desenhar_traco', { x, y, isNovoTraco, cor: drawCor, modo: drawModo, tamanho: drawTamanho });
}
function salvarESincronizarDraw() {
  const canvas = document.getElementById('beta-draw-canvas'); if (!canvas) return;
  try {
    const dataUrl = canvas.toDataURL('image/webp', 0.5); vttState.drawData = dataUrl;
    if (vttState.mapaAtivoId) { let m = (vttState.galeriaMapas || []).find(x => String(x.id) === String(vttState.mapaAtivoId)); if (m) m.drawData = dataUrl; }
    if (isTransmitindoLive && typeof socket !== 'undefined') socket.emit('tv_atualizar_desenho', dataUrl); agendarSalvamentoTabuleiro();
  } catch (e) {}
}
function limparDesenhoMestreETV() {
  const canvas = document.getElementById('beta-draw-canvas'); if (canvas) { const ctx = canvas.getContext('2d'); ctx.clearRect(0, 0, FOG_W, FOG_H); }
  vttState.drawData = null; if (vttState.mapaAtivoId) { let m = (vttState.galeriaMapas || []).find(x => String(x.id) === String(vttState.mapaAtivoId)); if (m) m.drawData = null; }
  salvarEstadoTabuleiro(); if (isTransmitindoLive && typeof socket !== 'undefined') socket.emit('tv_limpar_desenho');
}
window.limparDesenhoMestreETV = limparDesenhoMestreETV;

function restaurarDrawSalvo(dataUrl) {
  const ctx = inicializarDrawCanvas(); if (!ctx) return; ctx.globalCompositeOperation = 'source-over';
  if (!dataUrl) { ctx.clearRect(0, 0, FOG_W, FOG_H); return; }
  const img = new Image(); img.onload = () => { ctx.clearRect(0, 0, FOG_W, FOG_H); ctx.drawImage(img, 0, 0, FOG_W, FOG_H); }; img.src = dataUrl;
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
  const canvas = document.getElementById('beta-ruler-canvas'); if (canvas) canvas.getContext('2d').clearRect(0, 0, FOG_W, FOG_H);
  if (isTransmitindoLive && typeof socket !== 'undefined') socket.emit('tv_limpar_regua');
}

function dispararEfeitoPing(xPct, yPct, cor = '#ef4444') {
  const container = document.getElementById('beta-mapa-container'); if (!container) return;
  const beacon = document.createElement('div'); beacon.className = 'vtt-ping-beacon'; beacon.style.left = xPct + '%'; beacon.style.top = yPct + '%';
  beacon.innerHTML = `<div class="vtt-ping-ring" style="border-color: ${cor};"></div><div class="vtt-ping-dot" style="background-color: ${cor}; box-shadow: 0 0 12px ${cor};"></div>`;
  container.appendChild(beacon); setTimeout(() => beacon.remove(), 1400);
}
window.dispararEfeitoPing = dispararEfeitoPing;

function obterCoordsMapa(e) {
  const container = document.getElementById('beta-mapa-container'); if (!container) return { x: 0, y: 0 };
  const rect = container.getBoundingClientRect(); return { x: (e.clientX - rect.left) * (FOG_W / rect.width), y: (e.clientY - rect.top) * (FOG_H / rect.height) };
}

// ==========================================
// CONTROLES DE MOUSE E SELEÇÃO MÚLTIPLA
// ==========================================
window.tokensSelecionadosMulti = [];
let isMarqueeSelecting = false;
let startMarquee = { x: 0, y: 0 };

function aplicarSnapToGridPct(xPct, yPct, rect) {
  if (!snapToGridAtivo) return { x: xPct, y: yPct };
  const gridSize = parseInt(document.getElementById('vtt-grid-size-input').value) || 70;
  const gridPctX = (gridSize / rect.width) * 100;
  const gridPctY = (gridSize / rect.height) * 100;
  const snappedX = Math.round(xPct / gridPctX) * gridPctX;
  const snappedY = Math.round(yPct / gridPctY) * gridPctY;
  return { x: snappedX, y: snappedY };
}

const viewportEl = document.getElementById('beta-viewport');
if (viewportEl) {
  viewportEl.onmousedown = function(e) {
    if (e.target.closest('.vtt-sidebar-tools') || e.target.closest('.vtt-topbar-container') || e.target.closest('.vtt-bottom-popover') || e.target.closest('.vtt-dropdown-menu') || e.target.closest('.vtt-submenu') || e.target.closest('.vtt-drawer') || e.target.closest('#token-toolbar') || e.target.closest('#multi-token-toolbar')) return;
    
    if(!e.target.closest('[id^="token-ui-"]')) {
      fecharToolbarToken();
      if (window.tokensSelecionadosMulti && window.tokensSelecionadosMulti.length > 0) {
         window.tokensSelecionadosMulti = [];
         const mMenu = document.getElementById('multi-token-toolbar');
         if (mMenu) mMenu.style.display = 'none';
         desenharTokensBetaNoMestre();
      }
    }

    if (['ping', 'pings'].includes(ferramentaAtiva) || e.shiftKey) {
      e.preventDefault(); const rect = document.getElementById('beta-mapa-container').getBoundingClientRect();
      const xPct = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100)); const yPct = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
      dispararEfeitoPing(xPct, yPct); if (isTransmitindoLive && typeof socket !== 'undefined') socket.emit('tv_ping', { xPct, yPct, cor: '#ef4444' }); return;
    }
    if (ferramentaAtiva === 'draw' && e.button === 0) { e.preventDefault(); desenhandoDraw = true; const pos = obterCoordsMapa(e); aplicarTracoDraw(pos.x, pos.y, true); return; }
    if (ferramentaAtiva === 'fog' && e.button === 0) { e.preventDefault(); desenhandoFog = true; const pos = obterCoordsMapa(e); aplicarTracoFog(pos.x, pos.y, true); return; }
    if (ferramentaAtiva === 'ruler' && e.button === 0) { e.preventDefault(); if (timerLimparRuler) clearTimeout(timerLimparRuler); desenhandoRuler = true; pontoInicialRuler = obterCoordsMapa(e); return; }
    
    if (ferramentaAtiva === 'select' && !e.target.closest('[id^="token-ui-"]') && e.button === 0) {
      isMarqueeSelecting = true;
      startMarquee = { x: e.clientX, y: e.clientY }; 
      
      let box = document.getElementById('vtt-marquee-box');
      if(!box) {
         box = document.createElement('div');
         box.id = 'vtt-marquee-box';
         box.style.cssText = 'position: fixed; border: 1px solid #38bdf8; background: rgba(56, 189, 248, 0.2); pointer-events: none; z-index: 999999;';
         document.body.appendChild(box);
      }
      box.style.left = startMarquee.x + 'px';
      box.style.top = startMarquee.y + 'px';
      box.style.width = '0px';
      box.style.height = '0px';
      box.style.display = 'block';
      return;
    }

    if (ferramentaAtiva === 'pan' || !e.target.closest('[id^="token-ui-"]')) { 
      isDraggingMap = true; 
      viewportEl.style.cursor = 'grabbing'; 
    }
  };
  
  viewportEl.addEventListener('wheel', function(e) { e.preventDefault(); vttState.camera.zoom = Math.max(0.5, Math.min(4, vttState.camera.zoom + (e.deltaY < 0 ? 0.1 : -0.1))); atualizarCamera(true); }, { passive: false });
}

let timerEnvioArrastoTV = null;
window.addEventListener('mousemove', (e) => {
  if (isMarqueeSelecting) {
    const box = document.getElementById('vtt-marquee-box');
    if (box) {
      const minX = Math.min(startMarquee.x, e.clientX);
      const minY = Math.min(startMarquee.y, e.clientY);
      const width = Math.abs(e.clientX - startMarquee.x);
      const height = Math.abs(e.clientY - startMarquee.y);
      box.style.left = minX + 'px';
      box.style.top = minY + 'px';
      box.style.width = width + 'px';
      box.style.height = height + 'px';
    }
    return;
  }

  if (tokenArrastandoId) {
    e.preventDefault();
    const t = (vttState.tokens || []).find(x => x.id === tokenArrastandoId);
    if (t) {
      const container = document.getElementById('beta-mapa-container');
      const rect = container.getBoundingClientRect();
      
      let rawX = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
      let rawY = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
      
      // APLICA O SNAP TO GRID AQUI
      let snapped = aplicarSnapToGridPct(rawX, rawY, rect);
      t.x = snapped.x;
      t.y = snapped.y;

      const divToken = document.getElementById('token-ui-' + t.id);
      if (divToken) { divToken.style.left = t.x + '%'; divToken.style.top = t.y + '%'; }
      if (isTransmitindoLive && typeof socket !== 'undefined') {
        if (!timerEnvioArrastoTV) { timerEnvioArrastoTV = setTimeout(() => { socket.emit('tv_atualizar_tokens', vttState.tokens); timerEnvioArrastoTV = null; }, 30); }
      }
    }
    return;
  }
  
  if (isDraggingMap) { e.preventDefault(); vttState.camera.x += e.movementX; vttState.camera.y += e.movementY; atualizarCamera(false); return; }
  
  if (desenhandoDraw && ferramentaAtiva === 'draw') { const pos = obterCoordsMapa(e); aplicarTracoDraw(pos.x, pos.y, false); return; }
  if (desenhandoFog && ferramentaAtiva === 'fog') { const pos = obterCoordsMapa(e); aplicarTracoFog(pos.x, pos.y, false); return; }
  if (desenhandoRuler && ferramentaAtiva === 'ruler' && pontoInicialRuler) { const pos = obterCoordsMapa(e); const ctx = inicializarRulerCanvas(); if (ctx) { renderizarLinhaRegua(ctx, pontoInicialRuler, pos, vttState.gridTamanho || 70); if (isTransmitindoLive && typeof socket !== 'undefined') socket.emit('tv_atualizar_regua', { p1: pontoInicialRuler, p2: pos, gradePx: vttState.gridTamanho || 70 }); } }
});

window.addEventListener('mouseup', (e) => {
  if (isMarqueeSelecting) {
    isMarqueeSelecting = false;
    const box = document.getElementById('vtt-marquee-box');
    if (box) box.style.display = 'none';

    window.tokensSelecionadosMulti = [];
    
    const boxRect = {
        left: Math.min(startMarquee.x, e.clientX),
        right: Math.max(startMarquee.x, e.clientX),
        top: Math.min(startMarquee.y, e.clientY),
        bottom: Math.max(startMarquee.y, e.clientY)
    };

    if (Math.abs(boxRect.right - boxRect.left) > 10 || Math.abs(boxRect.bottom - boxRect.top) > 10) {
        const tokenElements = document.querySelectorAll('[id^="token-ui-"]');
        tokenElements.forEach(el => {
           const rect = el.getBoundingClientRect(); 
           if (rect.left < boxRect.right && rect.right > boxRect.left && rect.top < boxRect.bottom && rect.bottom > boxRect.top) {
               const id = el.id.replace('token-ui-', '');
               window.tokensSelecionadosMulti.push(id);
           }
        });
    }

    desenharTokensBetaNoMestre(); 

    let multiMenu = document.getElementById('multi-token-toolbar');
    if (!multiMenu) {
        multiMenu = document.createElement('div');
        multiMenu.id = 'multi-token-toolbar';
        multiMenu.style.cssText = "display: none; position: fixed; z-index: 999999; background: rgba(15, 15, 20, 0.95); border: 1px solid var(--vtt-gold, #c19429); border-radius: 8px; box-shadow: 0 8px 32px rgba(0,0,0,0.9); padding: 8px 12px; backdrop-filter: blur(8px); transform: translate(-50%, -120%); flex-direction: column; gap: 8px; font-family: 'Inter', sans-serif;";
        multiMenu.innerHTML = `
          <div style="font-size: 0.8rem; font-weight: 800; color: #fff; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 6px; text-align: center;">
            <span id="multi-token-count" style="color: var(--vtt-gold);">0</span> Tokens Selecionados
          </div>
          <div style="display: flex; gap: 6px;">
            <button onclick="multiAcaoTokens('add')" title="Add ao Combate" style="background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); color: #d4d4d8; padding: 6px 10px; border-radius: 6px; cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 4px; font-size: 0.65rem;">
              <span style="font-size: 1rem;">⚔️</span><span>Add</span>
            </button>
            <button onclick="multiAcaoTokens('hide')" title="Ocultar/Revelar" style="background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); color: #d4d4d8; padding: 6px 10px; border-radius: 6px; cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 4px; font-size: 0.65rem;">
              <span style="font-size: 1rem;">👁️</span><span>Hide</span>
            </button>
            <button onclick="multiAcaoTokens('size')" title="Tamanho" style="background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); color: #d4d4d8; padding: 6px 10px; border-radius: 6px; cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 4px; font-size: 0.65rem;">
              <span style="font-size: 1rem;">➕</span><span>Size</span>
            </button>
            <button onclick="multiAcaoTokens('delete')" title="Excluir" style="background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); color: #f87171; padding: 6px 10px; border-radius: 6px; cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 4px; font-size: 0.65rem;">
              <span style="font-size: 1rem;">🗑️</span><span>Del</span>
            </button>
          </div>`;
        document.body.appendChild(multiMenu);
    }

    if (window.tokensSelecionadosMulti.length > 0) {
      const contador = document.getElementById('multi-token-count');
      if (contador) contador.innerText = window.tokensSelecionadosMulti.length;
      
      multiMenu.style.display = 'flex';
      multiMenu.style.left = e.clientX + 'px';
      multiMenu.style.top = (e.clientY - 40) + 'px';
    } else {
      multiMenu.style.display = 'none';
    }
  }

  if (tokenArrastandoId) { tokenArrastandoId = null; salvarEstadoTabuleiro(); }
  if (isDraggingMap) { isDraggingMap = false; const vp = document.getElementById('beta-viewport'); if (vp) vp.style.cursor = (['fog', 'draw', 'ruler'].includes(ferramentaAtiva)) ? 'crosshair' : 'grab'; salvarEstadoTabuleiro(); }
  if (desenhandoDraw) { desenhandoDraw = false; salvarESincronizarDraw(); }
  if (desenhandoFog) { desenhandoFog = false; salvarESincronizarFog(); }
  if (desenhandoRuler) { desenhandoRuler = false; pontoInicialRuler = null; timerLimparRuler = setTimeout(() => { limparRulerMestreETV(); }, 1200); }
});

// --- ROLAGEM DE DADOS ---
var timerLimparDadoMestre = null;

window.qtdDadosRolar = 1;
window.modificadorDado = 'normal'; 

function mudarQtdDados(delta) {
  window.qtdDadosRolar += delta;
  if (window.qtdDadosRolar < 1) window.qtdDadosRolar = 1;
  if (window.qtdDadosRolar > 20) window.qtdDadosRolar = 20; 
  document.getElementById('display-qtd-dados').innerText = window.qtdDadosRolar;
}
window.mudarQtdDados = mudarQtdDados;

function setModificadorDado(mod) {
  window.modificadorDado = mod;
  
  const btnNormal = document.getElementById('btn-mod-normal');
  const btnVant = document.getElementById('btn-mod-vantagem');
  const btnDesv = document.getElementById('btn-mod-desvantagem');
  
  if (btnNormal && btnVant && btnDesv) {
    [btnNormal, btnVant, btnDesv].forEach(b => {
      b.style.background = 'transparent';
      b.style.color = 'var(--vtt-text-muted)';
      b.style.borderColor = 'var(--vtt-border)';
    });

    const ativo = mod === 'normal' ? btnNormal : (mod === 'vantagem' ? btnVant : btnDesv);
    ativo.style.background = 'var(--vtt-active-red)';
    ativo.style.color = '#fff';
    ativo.style.borderColor = 'var(--vtt-active-red)';
  }
}
window.setModificadorDado = setModificadorDado;

async function rolarDadoVirtual(faces) {
  if (!window.diceBoxReady || !window.diceBox) return;
  if (timerLimparDadoMestre) clearTimeout(timerLimparDadoMestre);
  window.diceBox.clear();
  
  const qtdBase = window.qtdDadosRolar || 1;
  const mod = window.modificadorDado || 'normal';
  
  let qtdReal = qtdBase;
  let vaiPegarPior = false;

  if (mod === 'vantagem') {
    qtdReal = qtdBase + 1;
  } else if (mod === 'desvantagem') {
    qtdReal = qtdBase - 1;
    if (qtdReal <= 0) {
      qtdReal = 2; 
      vaiPegarPior = true; 
    }
  }
  
  const notacao = `${qtdReal}d${faces}`; 
  const target = vttState.rollTarget || 'Self';
  
  // A MÁGICA QUE RESOLVE O DADO PEQUENO:
  const diceCanvas = document.querySelector('#palco-dados-oficial canvas'); 
  if (diceCanvas) { diceCanvas.style.width = '100vw'; diceCanvas.style.height = '100vh'; }
  window.dispatchEvent(new Event('resize'));
  
  try {
    const resultado = await window.diceBox.roll(notacao);
    
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
    
    if (rolagens.length === 0) rolagens = [Math.floor(Math.random() * faces) + 1];

    let valorFinal = 0;
    let detalheStr = '';
    
    if (vaiPegarPior) {
      valorFinal = Math.min(...rolagens); 
      detalheStr = `0 Dados (Pior de 2) ➔ (${rolagens.join(', ')})`;
    } else {
      valorFinal = Math.max(...rolagens); 
      if (qtdReal > 1) {
        const modNome = mod === 'normal' ? 'Normal' : mod.charAt(0).toUpperCase() + mod.slice(1);
        detalheStr = `${modNome} (Maior) ➔ (${rolagens.join(', ')})`;
      }
    }

    const disp = document.getElementById('resultado-dado-display'); 
    if (disp) {
      disp.innerHTML = `
        <div style="font-size:1.4rem; color:var(--vtt-gold); line-height: 1.2;">${qtdReal}d${faces} ➔ <strong>${valorFinal}</strong></div>
        <div style="font-size:0.75rem; color:var(--vtt-text-muted); margin-top:2px;">${detalheStr}</div>
      `;
    }
    
    if (target === 'Everyone' && typeof socket !== 'undefined') { 
      socket.emit('tv_rolar_dado_box', { valor: valorFinal, faces: faces, autor: 'Mestre', detalhes: detalheStr }); 
    }
    
    setModificadorDado('normal');
    timerLimparDadoMestre = setTimeout(() => { window.diceBox.clear(); }, 6000);
  } catch (err) { 
    window.diceBox.clear(); 
  }
}
window.rolarDadoVirtual = rolarDadoVirtual;

function alternarDisplayMap() {
  isTransmitindoLive = !isTransmitindoLive;
  const btn = document.getElementById('btn-toggle-display'); const label = document.getElementById('display-map-label'); const icon = document.getElementById('display-map-icon');
  let standbyImg = ''; if (campanhaAtiva) standbyImg = campanhaAtiva.imagemStandby || campanhaAtiva.standby || '';
  if (isTransmitindoLive) {
    if (btn) btn.classList.add('live-active'); if (label) label.innerText = 'Em Standby (Pausar)'; if (icon) icon.innerText = '⏹';
    if (typeof socket !== 'undefined') {
      socket.emit('tv_definir_standby', { emStandby: false, mapaAtivoUrl: vttState.mapaAtivoUrl || '' });
      socket.emit('tv_trocar_mapa', vttState.mapaAtivoUrl || ''); socket.emit('tv_atualizar_tokens', vttState.tokens || []);
      if (vttState.fogData) socket.emit('tv_atualizar_fog', vttState.fogData || null); if (vttState.drawData) socket.emit('tv_atualizar_desenho', vttState.drawData || null);
      socket.emit('tv_aplicar_camera', vttState.camera);
    }
  } else {
    if (btn) btn.classList.remove('live-active'); if (label) label.innerText = 'Transmitir na TV'; if (icon) icon.innerText = '▷';
    if (typeof socket !== 'undefined') { socket.emit('tv_definir_standby', { emStandby: true, standbyImg: standbyImg }); }
  }
}
window.alternarDisplayMap = alternarDisplayMap;

socket.on('tv_solicitar_mapa_ativo', () => {
  if (isTransmitindoLive && vttState.mapaAtivoUrl) {
    socket.emit('tv_definir_standby', { emStandby: false, mapaAtivoUrl: vttState.mapaAtivoUrl });
    socket.emit('tv_trocar_mapa', vttState.mapaAtivoUrl); socket.emit('tv_atualizar_tokens', vttState.tokens || []);
    if (vttState.fogData) socket.emit('tv_atualizar_fog', vttState.fogData || null); if (vttState.drawData) socket.emit('tv_atualizar_desenho', vttState.drawData || null); socket.emit('tv_aplicar_camera', vttState.camera);
  }
});

function toggleBottomPopover(nome) { fecharTopMenus(); document.querySelectorAll('.vtt-submenu').forEach(m => m.style.display = 'none'); if (popoverInferiorAtivo === nome) { fecharPopoversInferiores(); return; } fecharPopoversInferiores(); const el = document.getElementById('popover-' + nome); const btn = document.getElementById('btn-pop-' + nome); if (el) { el.style.display = 'flex'; if (btn) btn.classList.add('active'); popoverInferiorAtivo = nome; } }
window.toggleBottomPopover = toggleBottomPopover;
function fecharPopoversInferiores() { document.querySelectorAll('.vtt-bottom-popover').forEach(p => p.style.display = 'none'); ['dmprep', 'rolldice', 'gamelog', 'gameinfo'].forEach(n => { const b = document.getElementById('btn-pop-' + n); if (b) b.classList.remove('active'); }); popoverInferiorAtivo = null; }
window.fecharPopoversInferiores = fecharPopoversInferiores;

// =========================================================================
// O MENU DE COMBATE E O TOOLBAR DE CONTEXTO
// =========================================================================

window.combatentesAtivos = window.combatentesAtivos || [];
window.turnoAtualIndex = window.turnoAtualIndex || 0;

function toggleSidebarEncounter() {
  const sidebar = document.getElementById('sidebar-encounter');
  if (!sidebar) return;
  if (sidebar.style.transform.includes('-100')) {
    sidebar.style.transform = 'translateX(0)';
  } else {
    sidebar.style.transform = 'translateX(-100%)';
  }
}
window.toggleSidebarEncounter = toggleSidebarEncounter;

function adicionarTokenNaIniciativa() {
  if (!tokenFocadoId) return;
  const tokenData = (vttState.tokens || []).find(t => t.id === tokenFocadoId);
  if (!tokenData) return;

  const jaExiste = combatentesAtivos.find(c => c.id === tokenData.id);
  if (jaExiste) return; 

  combatentesAtivos.push({
    id: tokenData.id,
    nome: tokenData.nome || 'Agente',
    hp: tokenData.hp || tokenData.pv || 0,
    hpMax: tokenData.hpMax || tokenData.pvMax || 0,
    iniciativa: 0
  });

  fecharToolbarToken();
  const sidebar = document.getElementById('sidebar-encounter');
  if (sidebar && sidebar.style.transform.includes('-100')) toggleSidebarEncounter();
  renderizarTrackerIniciativa();
}
window.adicionarTokenNaIniciativa = adicionarTokenNaIniciativa;

window.rolarIniciativaTodos = function() {
  combatentesAtivos.forEach(c => { c.iniciativa = Math.floor(Math.random() * 20) + 1; });
  combatentesAtivos.sort((a, b) => b.iniciativa - a.iniciativa);
  turnoAtualIndex = 0;
  renderizarTrackerIniciativa();
};

window.atualizarValorIniciativa = function(id, valor) {
  const c = combatentesAtivos.find(c => c.id === id);
  if (c) c.iniciativa = parseInt(valor) || 0;
};

window.avancarTurnoCombate = function() {
  if (combatentesAtivos.length === 0) return;
  turnoAtualIndex++;
  if (turnoAtualIndex >= combatentesAtivos.length) turnoAtualIndex = 0;
  renderizarTrackerIniciativa();
};

window.removerDoCombate = function(id) {
  combatentesAtivos = combatentesAtivos.filter(c => c.id !== id);
  if (turnoAtualIndex >= combatentesAtivos.length) turnoAtualIndex = 0;
  renderizarTrackerIniciativa();
}

window.limparCombate = function() {
  combatentesAtivos = [];
  turnoAtualIndex = 0;
  renderizarTrackerIniciativa();
};

window.adicionarTodosAoCombate = function() {
  const tokensMesa = vttState.tokens || [];
  if (tokensMesa.length === 0) return;

  let adicionados = 0;
  tokensMesa.forEach(t => {
    if (!combatentesAtivos.find(c => c.id === t.id)) {
      combatentesAtivos.push({ id: t.id, nome: t.nome || 'Agente', hp: t.hp || t.pv || 0, hpMax: t.hpMax || t.pvMax || 0, iniciativa: 0 });
      adicionados++;
    }
  });

  if (adicionados > 0) {
    const sidebar = document.getElementById('sidebar-encounter');
    if (sidebar && sidebar.style.transform.includes('-100')) toggleSidebarEncounter();
    renderizarTrackerIniciativa();
  }
};

function renderizarTrackerIniciativa() {
  const container = document.getElementById('lista-combatentes');
  if (!container) return;

  if (combatentesAtivos.length === 0) {
    container.innerHTML = `<div style="color: var(--vtt-text-muted); font-size: 0.85rem; text-align: center; margin-top: 20px;">Nenhum agente no combate.</div>`;
    return;
  }

  let html = '';
  combatentesAtivos.forEach((c, index) => {
    const isTurno = (index === turnoAtualIndex);
    const borderCor = isTurno ? '#22c55e' : 'var(--vtt-border)';
    const bgCor = isTurno ? 'rgba(34, 197, 94, 0.15)' : 'var(--vtt-bg-pane)';

    html += `
      <div draggable="true" 
           ondragstart="iniciarArrasteTracker(event, ${index})" 
           ondragover="permitirSoltarTracker(event)" 
           ondrop="soltarTracker(event, ${index})" 
           style="background: ${bgCor}; border: 1px solid ${borderCor}; border-radius: 6px; padding: 10px; display: flex; align-items: center; justify-content: space-between; cursor: grab; margin-bottom: 6px; transition: 0.2s;">
        <div style="display: flex; align-items: center; gap: 10px;">
          <span style="color: var(--vtt-text-muted); cursor: grab; font-size: 1.2rem;" title="Arraste para reordenar">☰</span>
          <div style="display: flex; flex-direction: column;">
            <strong style="color: ${isTurno ? '#22c55e' : '#fff'}; font-size: 0.9rem;">${isTurno ? '▶ ' : ''}${c.nome}</strong>
            <span style="color: #b91c1c; font-size: 0.75rem; font-weight: bold;">HP: ${c.hp}/${c.hpMax}</span>
          </div>
        </div>
        <div style="display: flex; align-items: center; gap: 6px;">
          <input type="number" value="${c.iniciativa}" onchange="atualizarValorIniciativa('${c.id}', this.value)" style="width: 42px; background: var(--vtt-bg-box); color: #fff; border: 1px solid var(--vtt-border); border-radius: 4px; padding: 4px; text-align: center; font-weight: bold;">
          <button onclick="removerDoCombate('${c.id}')" title="Remover" style="background: transparent; color: #f87171; border: none; cursor: pointer; padding: 4px; font-size: 1rem;">✕</button>
        </div>
      </div>
    `;
  });
  container.innerHTML = html;

  if (isTransmitindoLive && typeof socket !== 'undefined') {
    socket.emit('tv_atualizar_iniciativa', {
      combatentes: combatentesAtivos,
      turnoIndex: turnoAtualIndex
    });
  }
}
window.renderizarTrackerIniciativa = renderizarTrackerIniciativa;

window.iniciarArrasteTracker = function(e, index) { e.dataTransfer.setData('text/plain', index); };
window.permitirSoltarTracker = function(e) { e.preventDefault(); };
window.soltarTracker = function(e, dropIndex) {
  e.preventDefault();
  const dragIndex = parseInt(e.dataTransfer.getData('text/plain'));
  if (dragIndex === dropIndex) return;
  const arrastado = combatentesAtivos.splice(dragIndex, 1)[0];
  combatentesAtivos.splice(dropIndex, 0, arrastado);
  turnoAtualIndex = 0;
  renderizarTrackerIniciativa();
};

// ==========================================
// ATALHOS DO TECLADO E FECHAMENTO DE TELAS
// ==========================================
window.addEventListener('keydown', (e) => {
  const tag = (e.target.tagName || '').toLowerCase();
  
  if (tag === 'input' || tag === 'textarea' || e.target.isContentEditable) { 
    if (e.key === 'Escape') e.target.blur(); 
    return; 
  }
  
  const tecla = e.key.toLowerCase();

  if (tecla === 'escape') { 
    const btnPan = document.querySelector(`.vtt-btn[onclick*="'pan'"]`);
    if(btnPan) ativarFerramenta(btnPan, 'pan'); 
    
    fecharTopMenus(); 
    fecharPopoversInferiores(); 
    fecharGaveta(); 
    tokenSelecionadoId = null; 
    fecharToolbarToken();
    
    window.tokensSelecionadosMulti = [];
    const mMenu = document.getElementById('multi-token-toolbar');
    if (mMenu) mMenu.style.display = 'none';
    
    desenharTokensBetaNoMestre(); 
    
    const modalAtalhos = document.getElementById('modal-shortcuts');
    if (modalAtalhos) modalAtalhos.style.display = 'none';
    
    const modalJournal = document.getElementById('modal-campaign-journal');
    if (modalJournal) modalJournal.style.display = 'none';
    
    return; 
  }

  if (tecla === 'j') {
    e.preventDefault();
    toggleTopPopover('quickjot');
    setTimeout(() => {
      const input = document.getElementById('quick-jot-text');
      if (input && input.offsetParent !== null) input.focus();
    }, 50);
    return;
  }

  if (tecla === 'd') {
    e.preventDefault();
    const btn = document.querySelector(`.vtt-btn[onclick*="'draw'"]`);
    ativarFerramenta(btn, 'draw');
    return;
  }

  if (tecla === 'f') {
    e.preventDefault();
    const btn = document.querySelector(`.vtt-btn[onclick*="'fog'"]`);
    ativarFerramenta(btn, 'fog');
    return;
  }

  if (tecla === 'r') {
    e.preventDefault();
    const btn = document.querySelector(`.vtt-btn[onclick*="'ruler'"]`);
    ativarFerramenta(btn, 'ruler');
    return;
  }
});

document.addEventListener('DOMContentLoaded', () => {
  carregarCampanhas();
});

function alterarTamanhoToken(delta) {
  if (!window.tokenFocadoId) return;
  const t = (vttState.tokens || []).find(x => x.id === window.tokenFocadoId);
  if (t) {
    t.escala = (t.escala || 1) + delta;
    if (t.escala < 0.3) t.escala = 0.3; 
    if (t.escala > 5.0) t.escala = 5.0; 
    
    desenharTokensBetaNoMestre();
    if (isTransmitindoLive && typeof socket !== 'undefined') socket.emit('tv_atualizar_tokens', vttState.tokens);
    salvarEstadoTabuleiro();
  }
}
window.alterarTamanhoToken = alterarTamanhoToken;

function toggleSubmenuToken() {
  const submenu = document.getElementById('token-submenu-visuais');
  if (!submenu) return;
  submenu.style.display = submenu.style.display === 'flex' ? 'none' : 'flex';
}
window.toggleSubmenuToken = toggleSubmenuToken;

window.alternarTelaCheia = function() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(err => console.log(err));
  } else {
    if (document.exitFullscreen) document.exitFullscreen();
  }
};

window.abrirModalCampaignJournal = function() {
  fecharTopMenus();
  const modal = document.getElementById('modal-campaign-journal');
  if (modal) modal.style.display = 'flex';
};

window.fecharModalCampaignJournal = function() {
  const modal = document.getElementById('modal-campaign-journal');
  if (modal) modal.style.display = 'none';
};

window.salvarQuickJot = function() {
  const input = document.getElementById('quick-jot-text');
  const texto = input ? input.value.trim() : '';
  if (!texto) return;

  const container = document.getElementById('campaign-journal-entries');
  if (container) {
    if (container.innerText.includes('Nenhuma anotação')) container.innerHTML = '';
    
    const div = document.createElement('div');
    div.style = "padding: 10px; background: var(--vtt-bg-pane); border-left: 3px solid var(--vtt-gold); margin-bottom: 10px; border-radius: 4px;";
    div.innerHTML = `<strong style="color: var(--vtt-text-main); font-size: 0.75rem;">${new Date().toLocaleTimeString('pt-BR')}</strong><div style="margin-top: 4px; color: var(--text-main);">${texto}</div>`;
    
    container.prepend(div);
  }
  
  if (input) input.value = '';
  fecharTopMenus();
};

window.abrirModalAtalhos = function() {
  fecharTopMenus();
  fecharPopoversInferiores();
  const modal = document.getElementById('modal-shortcuts');
  if (modal) modal.style.display = 'flex';
};

function atualizarTamanhoGrid(valor) {
  const novoTamanho = parseInt(valor);
  if (novoTamanho && novoTamanho >= 10 && novoTamanho <= 500) {
    vttState.gridTamanho = novoTamanho;
    salvarEstadoTabuleiro();
  } else {
    document.getElementById('vtt-grid-size-input').value = vttState.gridTamanho || 70;
  }
}
window.atualizarTamanhoGrid = atualizarTamanhoGrid;

const carregarEstadoAntigo = window.carregarEstadoTabuleiro;
window.carregarEstadoTabuleiro = function(c) {
  carregarEstadoAntigo(c);
  const inputGrid = document.getElementById('vtt-grid-size-input');
  if (inputGrid && vttState.gridTamanho) {
    inputGrid.value = vttState.gridTamanho;
  }
};

window.multiAcaoTokens = function(acao) {
  if (window.tokensSelecionadosMulti.length === 0) return;
  
  if (acao === 'delete') {
    vttState.tokens = (vttState.tokens || []).filter(t => !window.tokensSelecionadosMulti.includes(t.id));
  } 
  else if (acao === 'hide') {
    vttState.tokens.forEach(t => {
      if (window.tokensSelecionadosMulti.includes(t.id)) t.visivel = !t.visivel; 
    });
  } 
  else if (acao === 'size') {
    vttState.tokens.forEach(t => {
      if (window.tokensSelecionadosMulti.includes(t.id)) t.escala = Math.min(5.0, (t.escala || 1) + 0.25);
    });
  } 
  else if (acao === 'add') {
    vttState.tokens.forEach(t => {
      if (window.tokensSelecionadosMulti.includes(t.id) && !combatentesAtivos.find(c => c.id === t.id)) {
        combatentesAtivos.push({ id: t.id, nome: t.nome || 'Agente', hp: t.hp || t.pv || 0, hpMax: t.hpMax || t.pvMax || 0, iniciativa: 0 });
      }
    });
    renderizarTrackerIniciativa();
    const sidebar = document.getElementById('sidebar-encounter');
    if (sidebar && sidebar.style.transform.includes('-100')) toggleSidebarEncounter();
  }

  document.getElementById('multi-token-toolbar').style.display = 'none';
  window.tokensSelecionadosMulti = [];
  
  desenharTokensBetaNoMestre();
  salvarEstadoTabuleiro();
  if (isTransmitindoLive && typeof socket !== 'undefined') socket.emit('tv_atualizar_tokens', vttState.tokens);
};

window.sincronizarTokensComCampanha = function(fichasDosJogadores) {
  if (!vttState.catalogoAgentes) vttState.catalogoAgentes = [];
  if (!fichasDosJogadores || fichasDosJogadores.length === 0) return;

  let houveMudanca = false;

  fichasDosJogadores.forEach(ficha => {
    const tokenJaExiste = vttState.catalogoAgentes.find(t => t.nome === ficha.nome);
    
    if (!tokenJaExiste) {
      vttState.catalogoAgentes.push({
        id: 'agente-' + Date.now() + Math.random().toString(36).substr(2, 5),
        nome: ficha.nome,
        img: ficha.avatar || '', 
        isMonstro: false,
        hp: ficha.pvAtual || ficha.pvMax || 0,
        hpMax: ficha.pvMax || 0,
        sanidade: ficha.sanAtual || ficha.sanMax || 0,
        sanidadeMax: ficha.sanMax || 0
      });
      houveMudanca = true;
    }
  });

  if (houveMudanca) {
    salvarEstadoTabuleiro();
    if (typeof renderizarCatalogo === 'function') renderizarCatalogo();
  }
};

// ==========================================
// TOAST NOTIFICATIONS (FEEDBACK VISUAL)
// ==========================================
function mostrarToast(mensagem, tipo = 'sucesso') {
  const container = document.getElementById('toast-container');
  if(!container) return;
  const toast = document.createElement('div');
  toast.className = 'cris-toast';
  
  const icon = tipo === 'sucesso' ? '✅' : tipo === 'erro' ? '❌' : '⚠️';
  toast.innerHTML = `<span>${icon}</span> <span>${mensagem}</span>`;
  
  container.appendChild(toast);
  
  setTimeout(() => {
    if(toast.parentNode) toast.parentNode.removeChild(toast);
  }, 3000);
}
window.mostrarToast = mostrarToast;

// ==========================================
// BUSCA GLOBAL (CTRL + K)
// ==========================================
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault(); 
    abrirBuscaGlobal();
  }
  if (e.key === 'Escape') {
    fecharBuscaGlobal();
  }
});

function abrirBuscaGlobal() {
  const modal = document.getElementById('modal-busca-global');
  if(modal) {
    modal.style.display = 'flex';
    document.getElementById('input-busca-global').focus();
  }
}
window.abrirBuscaGlobal = abrirBuscaGlobal;

function fecharBuscaGlobal(e) {
  if (e && e.target.id !== 'modal-busca-global') return;
  const modal = document.getElementById('modal-busca-global');
  if(modal) {
    modal.style.display = 'none';
    document.getElementById('input-busca-global').value = '';
    document.getElementById('resultados-busca-global').style.display = 'none';
  }
}
window.fecharBuscaGlobal = fecharBuscaGlobal;

const inputBusca = document.getElementById('input-busca-global');
if(inputBusca) {
  inputBusca.addEventListener('input', function(e) {
    const termo = e.target.value.toLowerCase();
    const resultadosBox = document.getElementById('resultados-busca-global');
    
    if(termo.length < 2) {
      resultadosBox.style.display = 'none';
      return;
    }
    
    const mockData = [
      { tipo: 'Monstro', nome: 'Zumbi de Sangue' },
      { tipo: 'Agente', nome: 'Arthur Cervero' },
      { tipo: 'Regra', nome: 'Condição: Pasmo' }
    ];
    
    const filtrados = mockData.filter(item => item.nome.toLowerCase().includes(termo));
    
    if(filtrados.length > 0) {
      resultadosBox.innerHTML = filtrados.map(item => 
        `<div class="resultado-item"><strong>[${item.tipo}]</strong> ${item.nome}</div>`
      ).join('');
      resultadosBox.style.display = 'block';
    } else {
      resultadosBox.innerHTML = `<div class="resultado-item">Nenhum resultado encontrado.</div>`;
      resultadosBox.style.display = 'block';
    }
  });
}

// ==========================================
// SNAP TO GRID (ÍMÃ NO VTT)
// ==========================================
let snapToGridAtivo = false;

function toggleSnapToGrid() {
  snapToGridAtivo = !snapToGridAtivo;
  const btn = document.getElementById('btn-snap-grid');
  if(snapToGridAtivo) {
    if(btn) btn.classList.add('active');
    mostrarToast("Snap to Grid Ativado!");
  } else {
    if(btn) btn.classList.remove('active');
    mostrarToast("Snap to Grid Desativado.", "aviso");
  }
}
window.toggleSnapToGrid = toggleSnapToGrid;

// ==========================================
// ROLAGENS RÁPIDAS (ORDEM PARANORMAL)
// ==========================================
window.rolarSanidade = function() {
  mostrarToast("Rolando Teste de Sanidade...");
  window.qtdDadosRolar = 1;
  document.getElementById('display-qtd-dados').innerText = '1';
  setModificadorDado('normal');
  rolarDadoVirtual(20);
};

window.rolarDanoMental = function() {
  mostrarToast("Rolando Dano Mental...");
  window.qtdDadosRolar = 1;
  document.getElementById('display-qtd-dados').innerText = '1';
  setModificadorDado('normal');
  rolarDadoVirtual(6);
};

// ==========================================
// COMBATE RÁPIDO: ATAQUES DE AMEAÇAS
// ==========================================
window.rolarAtaqueMonstro = function(nomeAtaque, qtdDados, bonusTeste, danoStr) {
  mostrarToast(`Ameaça ataca com ${nomeAtaque}!`, 'aviso');
  
  // 1. Ajusta a quantidade de dados no painel de dados automaticamente
  window.qtdDadosRolar = qtdDados;
  const displayQtd = document.getElementById('display-qtd-dados');
  if(displayQtd) displayQtd.innerText = qtdDados;
  
  setModificadorDado('normal');
  
  // 2. Rola o d20 3D na tela (Mestre e TV)
  rolarDadoVirtual(20);
  
  // 3. Envia o aviso do ataque e do dano para o Feed de Resultados (Coluna da Esquerda)
  const agora = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const feedLista = document.getElementById('feed-rolagens-lista');
  
  if (feedLista) {
    const avisoVazio = feedLista.querySelector('.feed-empty-aviso');
    if (avisoVazio) avisoVazio.remove();
    
    const card = document.createElement('div');
    card.className = 'card-feed-rolagem';
    card.style.borderLeft = '4px solid #ef4444'; // Borda vermelha para destacar que é um monstro
    
    card.innerHTML = `
      <div class="feed-card-nome" style="color:#ef4444; font-weight:bold;">Ameaça (Mestre)</div>
      <div class="feed-card-acao">Ataque: ${nomeAtaque}</div>
      <div class="feed-card-boxes">
        <div><div class="feed-box-val" style="font-size:1.1rem;">+${bonusTeste}</div><div class="feed-box-lbl">BÔNUS ACERTO</div></div>
        <div><div class="feed-box-val" style="font-size:0.9rem; color:#ef4444;">${danoStr}</div><div class="feed-box-lbl">DANO</div></div>
      </div>
      <div class="feed-card-hora">${agora}</div>
    `;
    
    feedLista.prepend(card);
  }
};

// ==========================================
// SISTEMA DINÂMICO DE ATAQUES NO TABULEIRO
// ==========================================

window.toggleSubmenuAtaques = function() {
  const submenuAtaques = document.getElementById('token-submenu-ataques');
  const submenuVisuais = document.getElementById('token-submenu-visuais');
  
  if (!submenuAtaques) return;

  // Fecha o menu de visuais se estiver aberto para não encavalar
  if (submenuVisuais) submenuVisuais.style.display = 'none';

  // Se já está aberto, apenas fecha
  if (submenuAtaques.style.display === 'flex') {
    submenuAtaques.style.display = 'none';
    return;
  }

  // Pega os dados do token que está selecionado agora
  const tokenAtual = (vttState.tokens || []).find(x => x.id === window.tokenFocadoId);
  if (!tokenAtual) return;

  submenuAtaques.innerHTML = ''; // Limpa o menu

  // --- INTEGRAÇÃO DINÂMICA ---
  // Se o token não tiver ataques cadastrados no banco de dados ainda, 
  // nós injetamos ataques genéricos para você poder testar imediatamente.
  if (!tokenAtual.ataques || tokenAtual.ataques.length === 0) {
    // Cria ataques de exemplo baseados no nome do token
    tokenAtual.ataques = [
      { nome: 'Ataque Padrão', teste: '2d20', bonus: 5, dano: '1d6+2' },
      { nome: 'Ataque Forte', teste: '1d20', bonus: 2, dano: '2d8+4' }
    ];
  }

  // Monta os botões de ataque dinamicamente baseados na array do token
  tokenAtual.ataques.forEach(atk => {
    const btn = document.createElement('button');
    // Estilo do botão de ataque (diferente dos botões normais do menu)
    btn.style.cssText = "background: #181822; border: 1px solid #22222e; border-radius: 4px; padding: 8px; display: flex; flex-direction: column; align-items: flex-start; cursor: pointer; width: 100%; text-align: left; transition: 0.2s;";
    
    btn.innerHTML = `
      <strong style="color: #fff; font-size: 0.85rem;">${atk.nome}</strong>
      <span style="color: #38bdf8; font-size: 0.7rem; margin-top: 2px;">Teste: ${atk.teste}+${atk.bonus} | Dano: <span style="color:#ef4444;">${atk.dano}</span></span>
    `;
    
    // Efeito de hover via JS
    btn.onmouseover = () => btn.style.borderColor = '#ef4444';
    btn.onmouseout = () => btn.style.borderColor = '#22222e';

    btn.onclick = () => {
      // CHAMA O NOVO MODO DE MIRA (Passando o nome, os dados de acerto, o bônus e os dados de dano)
      iniciarAtaqueTatico(atk.nome, atk.teste, atk.bonus, atk.dano);
      
      // Fecha o menu após escolher o ataque
      submenuAtaques.style.display = 'none';
    };
    
    submenuAtaques.appendChild(btn);
  });

  submenuAtaques.style.display = 'flex';
};

window.rolarAtaqueToken = function(nomeToken, nomeAtaque, qtdDados, bonusTeste, danoStr) {
  mostrarToast(`${nomeToken} usou ${nomeAtaque}!`, 'aviso');
  
  // 1. Ajusta os dados 3D
  window.qtdDadosRolar = qtdDados;
  const displayQtd = document.getElementById('display-qtd-dados');
  if(displayQtd) displayQtd.innerText = qtdDados;
  
  setModificadorDado('normal');
  
  // 2. Rola o d20 3D na tela
  rolarDadoVirtual(20);
  
  // 3. Envia para o Feed de Resultados
  const agora = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const feedLista = document.getElementById('feed-rolagens-lista');
  
  if (feedLista) {
    const avisoVazio = feedLista.querySelector('.feed-empty-aviso');
    if (avisoVazio) avisoVazio.remove();
    
    const card = document.createElement('div');
    card.className = 'card-feed-rolagem';
    card.style.borderLeft = '4px solid #ef4444'; 
    
    card.innerHTML = `
      <div class="feed-card-nome" style="color:#ef4444; font-weight:bold;">${nomeToken}</div>
      <div class="feed-card-acao">Ataque: ${nomeAtaque}</div>
      <div class="feed-card-boxes">
        <div><div class="feed-box-val" style="font-size:1.1rem;">+${bonusTeste}</div><div class="feed-box-lbl">BÔNUS ACERTO</div></div>
        <div><div class="feed-box-val" style="font-size:0.9rem; color:#ef4444;">${danoStr}</div><div class="feed-box-lbl">DANO</div></div>
      </div>
      <div class="feed-card-hora">${agora}</div>
    `;
    
    feedLista.prepend(card);
  }
};

// Modificação na função fecharToolbarToken para garantir que o menu de ataques feche junto
const fecharToolbarAntigo = window.fecharToolbarToken;
window.fecharToolbarToken = function() {
  fecharToolbarAntigo();
  const submenuAtaques = document.getElementById('token-submenu-ataques');
  if (submenuAtaques) submenuAtaques.style.display = 'none';
};

// ==========================================
// MOTOR DE COMBATE TÁTICO AUTOMATIZADO
// ==========================================

window.modoMiraAtivo = false;
window.dadosAtaquePendente = null;

// 1. O botão de ataque agora chama esta função
window.iniciarAtaqueTatico = function(nomeAtaque, testeStr, bonus, danoStr) {
  const atacante = (vttState.tokens || []).find(x => x.id === window.tokenFocadoId);
  if (!atacante) return;

  // Salva os dados do ataque na memória
  window.dadosAtaquePendente = {
    atacanteId: atacante.id,
    atacanteNome: atacante.nome,
    nomeAtaque: nomeAtaque,
    testeStr: testeStr, // ex: "2d20"
    bonus: bonus,       // ex: 5
    danoStr: danoStr    // ex: "1d6+2"
  };

  window.modoMiraAtivo = true;
  fecharToolbarToken();
  
  // Muda o cursor do mapa para uma mira
  document.getElementById('beta-viewport').style.cursor = 'crosshair';
  mostrarToast(`Selecione o alvo para o ataque: ${nomeAtaque}`, 'aviso');
};

// 2. Quando você clica no alvo, esta função é disparada
window.resolverAtaqueTatico = async function(alvoId) {
  window.modoMiraAtivo = false;
  document.getElementById('beta-viewport').style.cursor = 'grab'; // Volta o cursor ao normal

  const atkData = window.dadosAtaquePendente;
  const alvo = (vttState.tokens || []).find(x => x.id === alvoId);
  
  if (!alvo || !atkData) {
    mostrarToast("Ataque cancelado.", "erro");
    return;
  }

  mostrarToast(`${atkData.atacanteNome} está atacando ${alvo.nome}...`);
  
  // Limpa os dados da tela
  if (window.diceBox) window.diceBox.clear();

  try {
    // --- A MÁGICA PARA O DADO NÃO FICAR PEQUENO ---
    const diceCanvas = document.querySelector('#palco-dados-oficial canvas'); 
    if (diceCanvas) { diceCanvas.style.width = '100vw'; diceCanvas.style.height = '100vh'; }
    window.dispatchEvent(new Event('resize'));
    // ----------------------------------------------

    // --- FASE 1: ROLAGEM DE ACERTO ---
    const resultadoAcerto = await window.diceBox.roll(atkData.testeStr);
    
    // Pega o maior valor rolado (Regra de Ordem Paranormal)
    let rolagens = [];
    resultadoAcerto.forEach(item => {
      if (item.rolls) item.rolls.forEach(d => rolagens.push(d.value));
      else if (item.value !== undefined) rolagens.push(item.value);
    });
    
    const maiorDado = Math.max(...rolagens);
    const totalAcerto = maiorDado + atkData.bonus;
    const defesaAlvo = alvo.defesa || 10; // Se o token não tiver defesa, assume 10

    // Registra no feed
    registrarNoFeedCombate(atkData.atacanteNome, alvo.nome, atkData.nomeAtaque, totalAcerto, `${atkData.testeStr}+${atkData.bonus} vs CA ${defesaAlvo}`);

    // --- FASE 2: COMPARAÇÃO (ACERTOU OU ERROU?) ---
    if (totalAcerto >= defesaAlvo) {
      mostrarToast(`ACERTOU! (Tirou ${totalAcerto} vs CA ${defesaAlvo}). Rolando dano...`, "sucesso");
      
      // Espera 2.5 segundos para o mestre ver os dados de acerto, limpa e rola o dano
      setTimeout(async () => {
        window.diceBox.clear();
        
        // --- GARANTE O TAMANHO DO CANVAS PARA O DANO TAMBÉM ---
        if (diceCanvas) { diceCanvas.style.width = '100vw'; diceCanvas.style.height = '100vh'; }
        window.dispatchEvent(new Event('resize'));
        // ------------------------------------------------------

        // Rola o dano
        const resultadoDano = await window.diceBox.roll(atkData.danoStr);
        let totalDano = 0;
        resultadoDano.forEach(item => totalDano += item.value);

        mostrarToast(`${alvo.nome} sofreu ${totalDano} de dano!`, "erro");
        
       // --- FASE 3: APLICA O DANO AUTOMATICAMENTE ---
        alvo.pv -= totalDano;
        if (alvo.pv < 0) alvo.pv = 0; // Não deixa a vida ficar negativa

        // ---> NOVO: AVISA O SERVIDOR PARA ATUALIZAR A FICHA DO JOGADOR <---
        if (campanhaAtiva && campanhaAtiva.personagens) {
          const pIdx = campanhaAtiva.personagens.findIndex(p => p.nome === alvo.nome);
          if (pIdx >= 0) {
            campanhaAtiva.personagens[pIdx].pv = alvo.pv; // Atualiza a ficha no mestre
            // Manda pro servidor salvar e avisar o jogador
            if (typeof socket !== 'undefined') {
              socket.emit('atualizar_dados_personagem', {
                campanhaId: campanhaAtiva.id,
                personagem: campanhaAtiva.personagens[pIdx]
              });
            }
          }
        }
        // -------------------------------------------------------------------

        

        // Atualiza a tela, o tracker e a TV
        desenharTokensBetaNoMestre();
        renderizarTrackerIniciativa();
        salvarEstadoTabuleiro();
        if (typeof socket !== 'undefined') socket.emit('tv_atualizar_tokens', vttState.tokens);

        registrarNoFeedCombate("SISTEMA", alvo.nome, "Dano Sofrido", totalDano, `Restam ${alvo.pv} PV`);

        // ---> CORREÇÃO AQUI: Limpa os dados de dano após 5 segundos <---
        setTimeout(() => { 
          if (window.diceBox) window.diceBox.clear(); 
        }, 5000);

      }, 2500);

    } else {
      // ERROU
      mostrarToast(`ERROU! (Tirou ${totalAcerto} vs CA ${defesaAlvo}).`, "erro");
      setTimeout(() => { window.diceBox.clear(); }, 4000); // Limpa os dados de erro depois de 4s
    }

  } catch (e) {
    console.error("Erro no combate:", e);
    window.diceBox.clear();
  }
};

// Função auxiliar para deixar o feed bonito
function registrarNoFeedCombate(atacante, alvo, acao, valor, detalhe) {
  const feedLista = document.getElementById('feed-rolagens-lista');
  if (!feedLista) return;
  
  const avisoVazio = feedLista.querySelector('.feed-empty-aviso');
  if (avisoVazio) avisoVazio.remove();
  
  const card = document.createElement('div');
  card.className = 'card-feed-rolagem';
  card.style.borderLeft = atacante === 'SISTEMA' ? '4px solid #b91c1c' : '4px solid #c19429'; 
  
  card.innerHTML = `
    <div class="feed-card-nome" style="color:#c19429; font-weight:bold;">${atacante} ➔ ${alvo}</div>
    <div class="feed-card-acao">${acao}</div>
    <div class="feed-card-boxes">
      <div><div class="feed-box-val" style="font-size:1.1rem;">${valor}</div><div class="feed-box-lbl">RESULTADO</div></div>
      <div><div class="feed-box-val" style="font-size:0.75rem; color:#9494a8;">${detalhe}</div><div class="feed-box-lbl">DETALHES</div></div>
    </div>
  `;
  feedLista.prepend(card);
}

// ==========================================
// EDIÇÃO DE IMAGEM DO TOKEN DIRETO NA GAVETA
// ==========================================
window.tokenSendoEditado = null;

window.prepararEdicaoToken = function(id, isMonstro) {
  window.tokenSendoEditado = { id, isMonstro };
  
  // Cria um input de arquivo invisível dinamicamente se não existir
  let input = document.getElementById('input-edita-token-dinamico');
  if (!input) {
    input = document.createElement('input');
    input.type = 'file';
    input.id = 'input-edita-token-dinamico';
    input.accept = 'image/png, image/jpeg, image/webp';
    input.style.display = 'none';
    
    input.onchange = async function(e) {
      if (!e.target.files[0] || !window.tokenSendoEditado) return;
      
      const formData = new FormData();
      formData.append('file', e.target.files[0]);
      
      try {
        mostrarToast("Enviando nova imagem...", "aviso");
        
        // Faz o upload pro servidor
        const res = await fetch('/api/upload', { method: 'POST', body: formData });
        const data = await res.json();
        
        const { id, isMonstro } = window.tokenSendoEditado;
        const catalogo = isMonstro ? vttState.catalogoMonstros : vttState.catalogoAgentes;
        const tokenCat = catalogo.find(t => t.id === id);
        
        if (tokenCat) {
          tokenCat.img = data.url; // Atualiza a imagem no catálogo
          
          // Se o token já estiver na mesa, atualiza a imagem dele lá também!
          if (vttState.tokens) {
            vttState.tokens.forEach(t => {
              if (t.nome === tokenCat.nome) { 
                t.img = data.url;
              }
            });
          }
          
          salvarEstadoTabuleiro();
          renderizarCatalogo();
          desenharTokensBetaNoMestre();
          
          if (isTransmitindoLive && typeof socket !== 'undefined') {
            socket.emit('tv_atualizar_tokens', vttState.tokens);
          }
          
          mostrarToast("Imagem do token atualizada com sucesso!", "sucesso");
        }
      } catch (err) {
        console.error(err);
        mostrarToast("Erro ao enviar imagem.", "erro");
      }
      
      // Reseta o input para poder usar de novo
      e.target.value = '';
      window.tokenSendoEditado = null;
    };
    document.body.appendChild(input);
  }
  
  // Simula o clique no input invisível para abrir a janela do Windows/Mac
  input.click();
};