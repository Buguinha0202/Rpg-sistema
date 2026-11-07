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

async function salvarCampanhasNoDisco() {
  if (campanhaAtiva) {
    try {
      await persistirCampanhaNoServidor(campanhaAtiva);
    } catch (err) {
      console.error('Erro ao salvar campanha no disco:', err);
    }
  }
}
window.salvarCampanhasNoDisco = salvarCampanhasNoDisco;


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
  renderizarCenariosCockpit();
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
  else if (aba === 'cenarios') { document.querySelectorAll('.cockpit-tab')[1].classList.add('ativa'); document.getElementById('aba-cockpit-cenarios').classList.add('ativa'); renderizarCenariosCockpit(); }
  else if (aba === 'ameacas') { document.querySelectorAll('.cockpit-tab')[2].classList.add('ativa'); document.getElementById('aba-cockpit-ameacas').classList.add('ativa'); renderizarBestiario(); }
}
window.mudarAbaCockpit = mudarAbaCockpit;

function renderizarMonitoresAgentesCockpit() {
  const grid = document.getElementById('grid-monitores-agentes');
  if (!grid) return;
  grid.innerHTML = '';
  const agentes = (campanhaAtiva && campanhaAtiva.personagens) ? campanhaAtiva.personagens : [];
  if (agentes.length === 0) {
    grid.innerHTML = '<p style="color:#717182; padding:20px; text-align:center;">Nenhum agente registrado nesta campanha.</p>';
    return;
  }

  agentes.forEach(ag => {
    const avatar = ag.avatar || ag.img || 'https://via.placeholder.com/60?text=?';
    const pvMax = ag.pvMax || ag.pv || 20;
    const pvAtual = ag.pv !== undefined ? ag.pv : pvMax;
    const pctPv = Math.min(100, Math.max(0, (pvAtual / (pvMax || 1)) * 100));

    const sanMax = ag.sanMax || ag.san || 20;
    const sanAtual = ag.san !== undefined ? ag.san : sanMax;
    const pctSan = Math.min(100, Math.max(0, (sanAtual / (sanMax || 1)) * 100));

    const peMax = ag.peMax || ag.pe || 5;
    const peAtual = ag.pe !== undefined ? ag.pe : peMax;
    const pctPe = Math.min(100, Math.max(0, (peAtual / (peMax || 1)) * 100));

    const estaMorrendo = pvAtual <= 0;
    const estaEnlouquecendo = sanAtual <= 0;

    const card = document.createElement('div');
    card.className = 'card-monitor-agente' + (estaMorrendo ? ' status-morrendo' : (estaEnlouquecendo ? ' status-enlouquecendo' : ''));
    card.innerHTML = `
      <div class="monitor-top" style="display:flex; justify-content:space-between; align-items:center;">
        <div style="display:flex; gap:12px; align-items:center;">
          <div class="monitor-avatar" style="background-image:url('${avatar}')"></div>
          <div>
            <div class="monitor-info-nome">${ag.nome}</div>
            <div class="monitor-info-detalhe">${ag.origem || ag.classe || 'Agente'} • NEX ${ag.nex || '5%'}</div>
          </div>
        </div>
        <div>
          ${estaMorrendo ? '<span style="font-size:0.65rem; background:#dc2626; color:#fff; padding:3px 6px; border-radius:4px; font-weight:bold;">💀 MORRENDO</span>' : ''}
          ${(!estaMorrendo && estaEnlouquecendo) ? '<span style="font-size:0.65rem; background:#7c3aed; color:#fff; padding:3px 6px; border-radius:4px; font-weight:bold;">🌀 INSANO</span>' : ''}
        </div>
      </div>

      <div class="monitor-atributos-linha">
        <div class="attr-col-item"><span>AGI</span><strong>${ag.atributos?.AGI || 1}</strong></div>
        <div class="attr-col-item"><span>FOR</span><strong>${ag.atributos?.FOR || 1}</strong></div>
        <div class="attr-col-item"><span>INT</span><strong>${ag.atributos?.INT || 1}</strong></div>
        <div class="attr-col-item"><span>PRE</span><strong>${ag.atributos?.PRE || 1}</strong></div>
        <div class="attr-col-item"><span>VIG</span><strong>${ag.atributos?.VIG || 1}</strong></div>
      </div>

      <div class="monitor-barras-grupo">
        <!-- VIDA -->
        <div class="monitor-bar-wrapper">
          <span class="monitor-bar-rotulo" style="color:#f87171;">PV</span>
          <button class="monitor-btn-step step-cinco" onclick="ajustarStatusAgenteMestre('${ag.id}', 'pv', -5)" title="-5 PV">-5</button>
          <button class="monitor-btn-step" onclick="ajustarStatusAgenteMestre('${ag.id}', 'pv', -1)" title="-1 PV">-1</button>
          <div class="monitor-bar-trilho">
            <div class="monitor-bar-preenchimento pv" style="width:${pctPv}%;"></div>
            <span class="monitor-bar-texto">${pvAtual} / ${pvMax}</span>
          </div>
          <button class="monitor-btn-step" onclick="ajustarStatusAgenteMestre('${ag.id}', 'pv', 1)" title="+1 PV">+1</button>
          <button class="monitor-btn-step step-cinco" onclick="ajustarStatusAgenteMestre('${ag.id}', 'pv', 5)" title="+5 PV">+5</button>
        </div>

        <!-- SANIDADE -->
        <div class="monitor-bar-wrapper">
          <span class="monitor-bar-rotulo" style="color:#c084fc;">SAN</span>
          <button class="monitor-btn-step step-cinco" onclick="ajustarStatusAgenteMestre('${ag.id}', 'san', -5)" title="-5 SAN">-5</button>
          <button class="monitor-btn-step" onclick="ajustarStatusAgenteMestre('${ag.id}', 'san', -1)" title="-1 SAN">-1</button>
          <div class="monitor-bar-trilho">
            <div class="monitor-bar-preenchimento san" style="width:${pctSan}%;"></div>
            <span class="monitor-bar-texto">${sanAtual} / ${sanMax}</span>
          </div>
          <button class="monitor-btn-step" onclick="ajustarStatusAgenteMestre('${ag.id}', 'san', 1)" title="+1 SAN">+1</button>
          <button class="monitor-btn-step step-cinco" onclick="ajustarStatusAgenteMestre('${ag.id}', 'san', 5)" title="+5 SAN">+5</button>
        </div>

        <!-- ESFORÇO -->
        <div class="monitor-bar-wrapper">
          <span class="monitor-bar-rotulo" style="color:#fb923c;">PE</span>
          <button class="monitor-btn-step step-cinco" onclick="ajustarStatusAgenteMestre('${ag.id}', 'pe', -5)" title="-5 PE">-5</button>
          <button class="monitor-btn-step" onclick="ajustarStatusAgenteMestre('${ag.id}', 'pe', -1)" title="-1 PE">-1</button>
          <div class="monitor-bar-trilho">
            <div class="monitor-bar-preenchimento pe" style="width:${pctPe}%;"></div>
            <span class="monitor-bar-texto">${peAtual} / ${peMax}</span>
          </div>
          <button class="monitor-btn-step" onclick="ajustarStatusAgenteMestre('${ag.id}', 'pe', 1)" title="+1 PE">+1</button>
          <button class="monitor-btn-step step-cinco" onclick="ajustarStatusAgenteMestre('${ag.id}', 'pe', 5)" title="+5 PE">+5</button>
        </div>
      </div>
    `;
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
var isTransmitindoLive = true;

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

function ajustarZoomManual(delta) {
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
}
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
      desenharPinsNoVTT();
      restaurarFogSalvo(vttState.fogData);
      restaurarDrawSalvo(vttState.drawData);
      if (isTransmitindoLive && typeof socket !== 'undefined' && vttState.mapaAtivoUrl) {
        socket.emit('tv_definir_standby', { emStandby: false, mapaAtivoUrl: vttState.mapaAtivoUrl });
        socket.emit('tv_trocar_mapa', vttState.mapaAtivoUrl);
        socket.emit('tv_atualizar_tokens', vttState.tokens || []);
        if (vttState.fogData) socket.emit('tv_atualizar_fog', vttState.fogData);
        if (vttState.drawData) socket.emit('tv_atualizar_desenho', vttState.drawData);
        socket.emit('tv_aplicar_camera', vttState.camera);
      }
    } else {
      atualizarCamera(false);
      desenharTokensBetaNoMestre();
      if (isTransmitindoLive && typeof socket !== 'undefined' && vttState.mapaAtivoUrl) {
        socket.emit('tv_definir_standby', { emStandby: false, mapaAtivoUrl: vttState.mapaAtivoUrl });
        socket.emit('tv_trocar_mapa', vttState.mapaAtivoUrl);
        socket.emit('tv_atualizar_tokens', vttState.tokens || []);
        socket.emit('tv_aplicar_camera', vttState.camera);
      }
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
  desenharPinsNoVTT();
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
  isTransmitindoLive = true;
  const btn = document.getElementById('btn-toggle-display');
  const label = document.getElementById('display-map-label');
  const icon = document.getElementById('display-map-icon');
  if (btn) btn.classList.add('live-active');
  if (label) label.innerText = 'Transmitindo (Pausar)';
  if (icon) icon.innerText = '⏹';
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
  const tEvi = document.getElementById('tab-cat-evidencias');
  if (tJog) {
    tJog.style.borderBottomColor = aba === 'jogadores' ? 'var(--vtt-active-red)' : 'transparent';
    tJog.style.color = aba === 'jogadores' ? 'var(--vtt-text-main)' : 'var(--vtt-text-muted)';
  }
  if (tMon) {
    tMon.style.borderBottomColor = aba === 'monstros' ? 'var(--vtt-active-red)' : 'transparent';
    tMon.style.color = aba === 'monstros' ? 'var(--vtt-text-main)' : 'var(--vtt-text-muted)';
  }
  if (tEvi) {
    tEvi.style.borderBottomColor = aba === 'evidencias' ? 'var(--vtt-gold)' : 'transparent';
    tEvi.style.color = aba === 'evidencias' ? 'var(--vtt-gold)' : 'var(--vtt-text-muted)';
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
  if (catalogoAtivo === 'evidencias') {
    const pins = obterPinsDoMapaAtual();
    if (!pins || pins.length === 0) {
      lista.innerHTML = '<p style="color:#717182; font-size:0.85rem; padding:15px; text-align:center;">Nenhuma evidência registrada nesta cena.</p>';
      return;
    }
    if (imagemAtivaNaTV) {
      const banner = document.createElement('div');
      banner.style = "margin-bottom:10px;";
      banner.innerHTML = `<button onclick="fecharPistaNaTV(); renderizarCatalogo();" style="width:100%; background:#dc2626; color:#fff; border:1px solid #ef4444; border-radius:6px; padding:8px; font-weight:bold; font-size:0.8rem; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:6px; box-shadow:0 0 10px rgba(220,38,38,0.5);"><span>✕</span> Ocultar Imagem da TV</button>`;
      lista.appendChild(banner);
    }
    pins.forEach(pin => {
      const isProjetada = (imagemAtivaNaTV && pin.imagem && imagemAtivaNaTV === pin.imagem);
      const div = document.createElement('div');
      div.className = 'item-catalogo-evidencia';
      div.style = "display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.07); padding:8px 10px; border-radius:6px;";
      div.innerHTML = `
        <div style="display:flex; align-items:center; gap:12px; max-width:60%;">
          <div style="width:40px; height:40px; border-radius:4px; overflow:hidden; background:#0f0f16; border:1px solid rgba(234,179,8,0.4); display:flex; align-items:center; justify-content:center; flex-shrink:0;">
            ${pin.imagem ? `<img src="${pin.imagem}" style="width:100%; height:100%; object-fit:cover;">` : `<span style="font-weight:900; color:#eab308; font-size:0.8rem;">${pin.numero ? String(pin.numero).padStart(2, '0') : '🔍'}</span>`}
          </div>
          <div>
            <div style="color:#fff; font-weight:bold; font-size:0.85rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:140px;">${pin.titulo}</div>
            <div style="color:#a1a1aa; font-size:0.72rem; margin-top:2px;">Coord: ${pin.x}%, ${pin.y}%</div>
          </div>
        </div>
        <div style="display:flex; gap:6px; align-items:center;">
          <button onclick="focarPinNoMapa('${pin.id}')" style="background:rgba(234,179,8,0.15); border:1px solid #eab308; color:#fef08a; padding:4px 8px; border-radius:4px; font-size:0.75rem; cursor:pointer; font-weight:bold;" title="Ver e Focar no Mapa">👁 Ver</button>
          ${pin.imagem ? (isProjetada ?
            `<button onclick="fecharPistaNaTV(); renderizarCatalogo();" style="background:#dc2626; border:1px solid #ef4444; color:#fff; padding:4px 8px; border-radius:4px; font-size:0.75rem; cursor:pointer; font-weight:bold;" title="Ocultar da TV">✕ Ocultar</button>` :
            `<button onclick="projetarImagemPinDireto('${pin.imagem}', '${pin.titulo.replace(/'/g, "\\\'")}'); renderizarCatalogo();" style="background:#581c87; border:1px solid #a855f7; color:#fff; padding:4px 8px; border-radius:4px; font-size:0.75rem; cursor:pointer; font-weight:bold;" title="Projetar na TV">📺 TV</button>`
          ) : ''}
        </div>
      `;
      lista.appendChild(div);
    });
    return;
  }
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
    el.className = 'token-mestre-arrastavel token-mesa-item standee-token-mestre';
    el.id = 'token-ui-' + tok.id;
    
    // Proporção Standee (altura vertical com ponto de apoio nos pés)
    const larguraPx = 75 * (tok.escala || 1);
    const alturaPx = 110 * (tok.escala || 1);

    el.style.position = 'absolute';
    el.style.left = tok.x + '%';
    el.style.top = tok.y + '%';
    el.style.width = larguraPx + 'px';
    el.style.height = alturaPx + 'px';
    el.style.transform = 'translate(-50%, -88%)';
    el.style.cursor = 'grab';
    el.style.userSelect = 'none';
    el.style.touchAction = 'none';
    el.style.zIndex = tok.id === tokenSelecionadoId ? '100' : '50';
    el.style.display = 'flex';
    el.style.flexDirection = 'column';
    el.style.alignItems = 'center';
    el.style.transition = 'filter 0.2s ease, opacity 0.2s ease';

    if (tok.id === tokenSelecionadoId) el.style.filter = 'drop-shadow(0 0 15px #e40712)'; 
    else if (window.tokensSelecionadosMulti && window.tokensSelecionadosMulti.includes(tok.id)) el.style.filter = 'drop-shadow(0 0 15px #c19429)'; 
    if (tok.visivel === false) el.style.opacity = '0.35';

    if (tok.img) {
      el.innerHTML = `
        <span class="standee-label-mestre">${tok.nome || ''}</span>
        <img src="${tok.img}" draggable="false" style="width:100%; height:100%; object-fit:contain; pointer-events:none; filter: drop-shadow(0 5px 10px rgba(0,0,0,0.8));">
        <div class="standee-sombra-mestre"></div>
      `;
    } else {
      el.innerHTML = `
        <span class="standee-label-mestre">${tok.nome || ''}</span>
        <div style="width: 60px; height: 60px; border-radius: 50%; background: #1c1c28; border: 2px solid #ef4444; color:#fff; display:flex; align-items:center; justify-content:center; font-weight:bold; font-size:1rem; box-shadow: 0 4px 12px rgba(0,0,0,0.8);">
          ${(tok.nome || 'A').substring(0, 2).toUpperCase()}
        </div>
        <div class="standee-sombra-mestre"></div>
      `;
    }

    // Início do arrasto (Unificado Mouse + Touch)
    function iniciarArrastoToken(clientX, clientY, e) {
      if (ferramentaAtiva !== 'select') return;
      if (e && e.stopPropagation) e.stopPropagation();
      if (window.modoMiraAtivo) return;

      selecionarToken(tok.id);
      tokenArrastandoId = tok.id;
      tMousedownX = clientX;
      tMousedownY = clientY;
    }

    // Fim do arrasto
    function finalizarArrastoToken(clientX, clientY, e) {
      if (ferramentaAtiva !== 'select') return;
      if (window.modoMiraAtivo) {
        if (e && e.stopPropagation) e.stopPropagation();
        tokenArrastandoId = null;
        resolverAtaqueTatico(tok.id);
        return;
      }
      const dist = Math.abs(clientX - tMousedownX) + Math.abs(clientY - tMousedownY);
      if (dist < 8) {
        const rect = el.getBoundingClientRect();
        const XdoMenu = rect.left + (rect.width / 2);
        const YdoMenu = rect.top - 10;
        abrirToolbarToken(tok.id, tok.nome, tok.pv, tok.pvMax, XdoMenu, YdoMenu);
      }
      tokenArrastandoId = null;
      salvarEstadoTabuleiro();
    }

    // Handlers para Mouse
    el.onmousedown = function(e) {
      iniciarArrastoToken(e.clientX, e.clientY, e);
    };
    el.onmouseup = function(e) {
      finalizarArrastoToken(e.clientX, e.clientY, e);
    };

    // Handlers para Touch no Celular
    el.ontouchstart = function(e) {
      if (e.touches && e.touches.length > 0) {
        iniciarArrastoToken(e.touches[0].clientX, e.touches[0].clientY, e);
      }
    };
    el.ontouchend = function(e) {
      if (e.changedTouches && e.changedTouches.length > 0) {
        finalizarArrastoToken(e.changedTouches[0].clientX, e.changedTouches[0].clientY, e);
      }
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
  
  viewportEl.addEventListener('wheel', function(e) {
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
  }, { passive: false });
}

let timerEnvioArrastoTV = null;
let pinArrastando = null;
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

  if (pinArrastando) {
    const pinEl = document.getElementById('vtt-pin-' + pinArrastando.id);
    if (pinEl) {
      pinEl.classList.remove('arrastando');
    }
    if (pinFoiArrastado) {
      salvarPosicaoPinAtualizada(pinArrastando);
      mostrarToast(`Evidência "${pinArrastando.titulo}" reposicionada para (${pinArrastando.x}%, ${pinArrastando.y}%)`, 'sucesso');
    } else {
      abrirCardInspecaoVTT(pinArrastando);
    }
    pinArrastando = null;
    pinFoiArrastado = false;
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
if (inputBusca) {
  inputBusca.addEventListener('input', function(e) {
    const termo = e.target.value.toLowerCase().trim();
    const resultadosBox = document.getElementById('resultados-busca-global');
    if (!resultadosBox) return;

    if (termo.length < 2) {
      resultadosBox.style.display = 'none';
      return;
    }

    const catalogoBusca = [];

    // 1. Ações rápidas do sistema
    catalogoBusca.push(
      { tipo: 'Ação', nome: 'Abrir Tabuleiro Tático (VTT)', exec: () => { abrirModoTabuleiro(); fecharBuscaGlobal(); } },
      { tipo: 'Ação', nome: 'Transmitir / Pausar Standby na TV', exec: () => { alternarDisplayMap(); fecharBuscaGlobal(); } },
      { tipo: 'Ação', nome: 'Adicionar Novo Agente de Campo', exec: () => { abrirModalNovoPersonagemManual(); fecharBuscaGlobal(); } },
      { tipo: 'Ação', nome: 'Rolar Dado Virtual D20', exec: () => { rolarDadoVirtual(20); fecharBuscaGlobal(); } },
      { tipo: 'Ação', nome: 'Rolar Teste de Sanidade', exec: () => { rolarSanidade(); fecharBuscaGlobal(); } },
      { tipo: 'Ação', nome: 'Rolar Dano Mental', exec: () => { rolarDanoMental(); fecharBuscaGlobal(); } }
    );

    // 2. Agentes da campanha
    if (campanhaAtiva && campanhaAtiva.personagens) {
      campanhaAtiva.personagens.forEach(ag => {
        catalogoBusca.push({
          tipo: 'Agente',
          nome: `${ag.nome} (PV: ${ag.pv}/${ag.pvMax || ag.pv})`,
          exec: () => { mudarAbaCockpit('agentes'); fecharBuscaGlobal(); mostrarToast(`Focando no agente ${ag.nome}`); }
        });
      });
    }

    // 3. Ameaças / Monstros do VTT
    const monstros = [...(vttState.catalogoMonstros || []), ...(campanhaAtiva?.ameacas || [])];
    monstros.forEach(m => {
      catalogoBusca.push({
        tipo: 'Ameaça',
        nome: m.nome,
        exec: () => { mudarAbaCockpit('ameacas'); fecharBuscaGlobal(); mostrarToast(`Ameaça ${m.nome}`); }
      });
    });

    // 4. Mapas do VTT
    (vttState.galeriaMapas || []).forEach(mapa => {
      catalogoBusca.push({
        tipo: 'Mapa',
        nome: mapa.nome,
        exec: () => { abrirModoTabuleiro(); aplicarMapaNaMesa(mapa.id); fecharBuscaGlobal(); }
      });
    });

    // 5. Cenários e Cômodos
    if (campanhaAtiva && campanhaAtiva.locais) {
      campanhaAtiva.locais.forEach((loc, lIdx) => {
        catalogoBusca.push({
          tipo: 'Cenário',
          nome: loc.nome,
          exec: () => { mudarAbaCockpit('cenarios'); selecionarLocalCockpit(lIdx); fecharBuscaGlobal(); }
        });
        (loc.comodos || []).forEach((com, cIdx) => {
          catalogoBusca.push({
            tipo: 'Cômodo',
            nome: `${loc.nome} ➔ ${com.nome}`,
            exec: () => { selecionarLocalCockpit(lIdx); selecionarComodoCockpit(cIdx); fecharBuscaGlobal(); }
          });
        });
      });
    }

    // 6. Condições e Regras Oficiais
    const condicoes = [
      { nome: 'Pasmo', desc: 'Não pode realizar ações padrão ou de movimento.' },
      { nome: 'Sangrando', desc: 'No início de cada turno, sofre 1d6 de dano de Sangue.' },
      { nome: 'Perturbado', desc: 'Metade da Sanidade restante. Sofre -1d20 em testes mentais.' },
      { nome: 'Abalado', desc: 'Sofre -1d20 em testes de perícia por medo ou pavor.' },
      { nome: 'Vulnerável', desc: 'Sofre -5 na Defesa.' },
      { nome: 'Agarrado', desc: 'Fica desprevenido e imóvel (-5 na Defesa, deslocamento 0).' },
      { nome: 'Inconsciente', desc: 'Indefeso, cai no chão e não pode fazer ações.' },
      { nome: 'Morrendo', desc: 'Com 0 PV. Faz teste de Morte a cada rodada.' }
    ];
    condicoes.forEach(cond => {
      catalogoBusca.push({
        tipo: 'Regra',
        nome: `Condição: ${cond.nome} — ${cond.desc}`,
        exec: () => { mostrarToast(`[${cond.nome}] ${cond.desc}`, 'aviso'); fecharBuscaGlobal(); }
      });
    });

    const filtrados = catalogoBusca.filter(item => item.nome.toLowerCase().includes(termo));

    if (filtrados.length > 0) {
      resultadosBox.innerHTML = '';
      filtrados.slice(0, 10).forEach(item => {
        const div = document.createElement('div');
        div.className = 'resultado-item';
        div.innerHTML = `<span style="color:var(--vtt-gold); font-size:0.75rem; font-weight:800; margin-right:6px;">[${item.tipo.toUpperCase()}]</span> <span>${item.nome}</span>`;
        div.onclick = () => { if (item.exec) item.exec(); };
        resultadosBox.appendChild(div);
      });
      resultadosBox.style.display = 'block';
    } else {
      resultadosBox.innerHTML = `<div class="resultado-item" style="color:#717182;">Nenhum resultado para "${termo}".</div>`;
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

// =========================================================================
// TABELA OFICIAL DE PERÍCIAS E REGISTRO DE AGENTES
// =========================================================================
const TABELA_PERICIAS_ORDEM = [
  { nome: 'Acrobacia', attr: 'AGI', penTreino: true },
  { nome: 'Adestramento', attr: 'PRE', treinadoApenas: true },
  { nome: 'Artes', attr: 'PRE', treinadoApenas: true },
  { nome: 'Atletismo', attr: 'FOR' },
  { nome: 'Atualidades', attr: 'INT' },
  { nome: 'Ciências', attr: 'INT', treinadoApenas: true },
  { nome: 'Crime', attr: 'AGI', penTreino: true, treinadoApenas: true },
  { nome: 'Diplomacia', attr: 'PRE' },
  { nome: 'Enganação', attr: 'PRE' },
  { nome: 'Fortitude', attr: 'VIG' },
  { nome: 'Furtividade', attr: 'AGI', penTreino: true },
  { nome: 'Iniciativa', attr: 'AGI' },
  { nome: 'Intimidação', attr: 'PRE' },
  { nome: 'Intuição', attr: 'PRE' },
  { nome: 'Investigação', attr: 'INT' },
  { nome: 'Luta', attr: 'FOR' },
  { nome: 'Medicina', attr: 'INT' },
  { nome: 'Ocultismo', attr: 'INT', treinadoApenas: true },
  { nome: 'Percepção', attr: 'PRE' },
  { nome: 'Pilotagem', attr: 'AGI', treinadoApenas: true },
  { nome: 'Pontaria', attr: 'AGI' },
  { nome: 'Profissão', attr: 'INT', treinadoApenas: true },
  { nome: 'Reflexos', attr: 'AGI' },
  { nome: 'Religião', attr: 'PRE', treinadoApenas: true },
  { nome: 'Sobrevivência', attr: 'INT' },
  { nome: 'Tática', attr: 'INT', treinadoApenas: true },
  { nome: 'Tecnologia', attr: 'INT', treinadoApenas: true },
  { nome: 'Vontade', attr: 'PRE' }
];

function abrirModalNovoPersonagemManual() {
  const modal = document.getElementById('modal-personagem-manual');
  if (!modal) return;
  document.getElementById('p-manual-nome').value = '';
  document.getElementById('p-manual-origem').value = '';
  document.getElementById('p-manual-pv').value = '20';
  document.getElementById('p-manual-san').value = '20';
  document.getElementById('p-manual-pe').value = '2';
  document.getElementById('p-manual-agi').value = '1';
  document.getElementById('p-manual-for').value = '1';
  document.getElementById('p-manual-int').value = '1';
  document.getElementById('p-manual-pre').value = '1';
  document.getElementById('p-manual-vig').value = '1';
  
  const gridPericias = document.getElementById('grid-pericias-manual-modal');
  if (gridPericias) {
    gridPericias.innerHTML = TABELA_PERICIAS_ORDEM.map(p => `
      <label style="display:flex; align-items:center; gap:4px; font-size:0.75rem; color:#d4d4d8; cursor:pointer;">
        <input type="checkbox" class="chk-pericia-manual" value="${p.nome}" data-attr="${p.attr}">
        <span>${p.nome}</span>
      </label>
    `).join('');
  }
  
  const listaInv = document.getElementById('lista-itens-inventario-modal');
  if (listaInv) listaInv.innerHTML = '';
  atualizarEspacosInventarioModal();
  modal.style.display = 'flex';
}
window.abrirModalNovoPersonagemManual = abrirModalNovoPersonagemManual;

function fecharModalNovoPersonagemManual() {
  const modal = document.getElementById('modal-personagem-manual');
  if (modal) modal.style.display = 'none';
}
window.fecharModalNovoPersonagemManual = fecharModalNovoPersonagemManual;

function adicionarLinhaItemInventario(dados = {}) {
  const lista = document.getElementById('lista-itens-inventario-modal');
  if (!lista) return;
  const row = document.createElement('div');
  row.className = 'linha-item-inv-modal';
  row.style.cssText = 'display:flex; gap:6px; align-items:center; background:#12121b; padding:6px; border-radius:4px; border:1px solid var(--border-subtle); margin-bottom:6px;';
  row.innerHTML = `
    <input type="text" class="inv-item-nome" placeholder="Item" value="${dados.nome || ''}" style="flex:2; background:#08080c; border:1px solid #272738; color:#fff; padding:4px 6px; font-size:0.75rem; border-radius:3px;">
    <select class="inv-item-tipo" style="background:#08080c; border:1px solid #272738; color:#a1a1aa; padding:4px; font-size:0.7rem; border-radius:3px;">
      <option value="equipamento" ${dados.tipo === 'equipamento' ? 'selected' : ''}>Equip</option>
      <option value="arma" ${dados.tipo === 'arma' ? 'selected' : ''}>Arma</option>
      <option value="consumivel" ${dados.tipo === 'consumivel' ? 'selected' : ''}>Consumível</option>
    </select>
    <input type="number" class="inv-item-espaco" placeholder="Esp." value="${dados.espaco !== undefined ? dados.espaco : 1}" style="width:36px; background:#08080c; border:1px solid #272738; color:#fff; padding:4px; font-size:0.75rem; text-align:center; border-radius:3px;" onchange="atualizarEspacosInventarioModal()">
    <button type="button" onclick="this.parentElement.remove(); atualizarEspacosInventarioModal();" style="background:transparent; border:none; color:#ef4444; font-size:0.9rem; cursor:pointer;" title="Remover">✕</button>
  `;
  lista.appendChild(row);
  atualizarEspacosInventarioModal();
}
window.adicionarLinhaItemInventario = adicionarLinhaItemInventario;

function atualizarEspacosInventarioModal() {
  const inputsEspaco = document.querySelectorAll('.inv-item-espaco');
  let total = 0;
  inputsEspaco.forEach(inp => total += (parseInt(inp.value) || 0));
  const elPeso = document.getElementById('peso-atual');
  if (elPeso) elPeso.innerText = total;
  const forca = parseInt(document.getElementById('p-manual-for')?.value) || 1;
  const elMax = document.getElementById('peso-max');
  if (elMax) elMax.innerText = Math.max(5, forca * 5);
}
window.atualizarEspacosInventarioModal = atualizarEspacosInventarioModal;

async function salvarNovoPersonagemManual() {
  const nome = document.getElementById('p-manual-nome').value.trim();
  if (!nome) { alert('Digite o nome do agente.'); return; }
  const origem = document.getElementById('p-manual-origem').value.trim() || 'Sobrevivente';
  const pv = parseInt(document.getElementById('p-manual-pv').value) || 20;
  const san = parseInt(document.getElementById('p-manual-san').value) || 20;
  const pe = parseInt(document.getElementById('p-manual-pe').value) || 2;
  const agi = parseInt(document.getElementById('p-manual-agi').value) || 1;
  const forca = parseInt(document.getElementById('p-manual-for').value) || 1;
  const int = parseInt(document.getElementById('p-manual-int').value) || 1;
  const pre = parseInt(document.getElementById('p-manual-pre').value) || 1;
  const vig = parseInt(document.getElementById('p-manual-vig').value) || 1;

  const pericias = [];
  document.querySelectorAll('.chk-pericia-manual:checked').forEach(chk => {
    pericias.push({ nome: chk.value, attr: chk.dataset.attr, treinada: true, outros: 0 });
  });

  const inventario = [];
  const armas = [];
  document.querySelectorAll('.linha-item-inv-modal').forEach(row => {
    const itemNome = row.querySelector('.inv-item-nome').value.trim();
    if (!itemNome) return;
    const tipo = row.querySelector('.inv-item-tipo').value;
    const espaco = parseInt(row.querySelector('.inv-item-espaco').value) || 1;
    if (tipo === 'arma') {
      armas.push({ nome: itemNome, dadosAttr: 'AGI', bonus: 0, dano: '1d6' });
    } else {
      inventario.push({ nome: itemNome, tipo: tipo, espaco: espaco, qtd: 1 });
    }
  });

  const novoAgente = {
    id: 'agente_' + Date.now(),
    nome: nome,
    jogador: 'Agente',
    origem: origem,
    classe: origem,
    pv: pv, pvMax: pv,
    san: san, sanMax: san,
    pe: pe, peMax: pe,
    atributos: { AGI: agi, FOR: forca, INT: int, PRE: pre, VIG: vig },
    pericias: pericias,
    inventario: inventario,
    armas: armas,
    habilidades: [],
    avatar: ''
  };

  const campAlvo = campanhaSendoEditada || campanhaAtiva;
  if (!campAlvo) { alert('Selecione ou edite uma campanha primeiro.'); return; }
  if (!campAlvo.personagens) campAlvo.personagens = [];
  campAlvo.personagens.push(novoAgente);

  await persistirCampanhaNoServidor(campAlvo);
  if (campanhaSendoEditada) renderizarPersonagensNaEdicao();
  if (campanhaAtiva) {
    renderizarMonitoresAgentesCockpit();
    if (typeof window.sincronizarTokensComCampanha === 'function') {
      window.sincronizarTokensComCampanha(campAlvo.personagens);
    }
  }

  fecharModalNovoPersonagemManual();
  mostrarToast(`Agente "${nome}" registrado com sucesso!`);
}
window.salvarNovoPersonagemManual = salvarNovoPersonagemManual;

function acionarStandby() {
  const standbyImg = campanhaAtiva ? (campanhaAtiva.imagemStandby || campanhaAtiva.standby || '') : '';
  socket.emit('tv_definir_standby', { emStandby: true, standbyImg: standbyImg });
  mostrarToast('Mesa colocada em Standby!', 'aviso');
}
window.acionarStandby = acionarStandby;

function fecharPistaNoTablet() {
  fecharPistaNaTV();
}
window.fecharPistaNoTablet = fecharPistaNoTablet;

function mostrarPistaNoTablet(url) {
  if (!url) return;
  socket.emit('tv_mostrar_handout', url);
  atualizarUIHandoutVisivel(url);
  mostrarToast('Pista transmitida para as telas!');
}
window.mostrarPistaNoTablet = mostrarPistaNoTablet;

function importarJsonPersonagensNaEdicao() {
  const input = document.getElementById('json-personagens-edicao-input');
  if (!input || !input.value.trim()) return;
  try {
    const parsed = JSON.parse(input.value.trim());
    const lista = Array.isArray(parsed) ? parsed : [parsed];
    if (!campanhaSendoEditada.personagens) campanhaSendoEditada.personagens = [];
    lista.forEach(p => {
      const idx = campanhaSendoEditada.personagens.findIndex(x => x.nome === p.nome || (p.id && x.id === p.id));
      if (idx >= 0) campanhaSendoEditada.personagens[idx] = p;
      else campanhaSendoEditada.personagens.push(p);
    });
    renderizarPersonagensNaEdicao();
    document.getElementById('json-campanha-completa-input').value = JSON.stringify(campanhaSendoEditada, null, 2);
    input.value = '';
    mostrarToast(`${lista.length} agentes importados!`);
  } catch (err) {
    alert('Erro ao processar JSON de personagens: ' + err.message);
  }
}
window.importarJsonPersonagensNaEdicao = importarJsonPersonagensNaEdicao;

function aplicarJsonCompletoNaCampanha() {
  const input = document.getElementById('json-campanha-completa-input');
  if (!input || !input.value.trim()) return;
  try {
    const parsed = JSON.parse(input.value.trim());
    campanhaSendoEditada = Object.assign(campanhaSendoEditada || {}, parsed);
    document.getElementById('edit-camp-nome').value = campanhaSendoEditada.nome || '';
    document.getElementById('edit-camp-id').value = campanhaSendoEditada.id || '';
    document.getElementById('edit-camp-standby').value = campanhaSendoEditada.imagemStandby || '';
    renderizarPersonagensNaEdicao();
    mostrarToast('Dados da campanha atualizados a partir do JSON!');
  } catch (err) {
    alert('Erro no JSON da campanha: ' + err.message);
  }
}
window.aplicarJsonCompletoNaCampanha = aplicarJsonCompletoNaCampanha;

async function salvarNovaCampanhaJson() {
  const input = document.getElementById('novo-camp-json-input');
  if (!input || !input.value.trim()) return;
  try {
    const parsed = JSON.parse(input.value.trim());
    if (!parsed.id || !parsed.nome) { alert('O JSON precisa ter "id" e "nome".'); return; }
    await fetch('/api/campanhas', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(parsed) });
    fecharModalNovaCampanha();
    mostrarToast('Campanha importada com sucesso!');
    await carregarCampanhas();
    abrirTelaEdicaoCampanha(parsed.id);
  } catch (err) {
    alert('JSON inválido: ' + err.message);
  }
}
window.salvarNovaCampanhaJson = salvarNovaCampanhaJson;

// =========================================================================
// CENÁRIOS, CÔMODOS & PINS INVESTIGATIVOS
// =========================================================================
function renderizarCenariosCockpit() {
  const deckLocais = document.getElementById('deck-locais');
  if (!deckLocais) return;
  deckLocais.innerHTML = '';
  const locais = (campanhaAtiva && campanhaAtiva.locais) ? campanhaAtiva.locais : [];
  
  if (locais.length === 0) {
    deckLocais.innerHTML = `
      <div onclick="abrirModalNovoCenarioCockpit()" style="background:#13131c; border:2px dashed #2d2d42; border-radius:8px; padding:24px; text-align:center; cursor:pointer; width:100%; transition:0.2s;" onmouseover="this.style.borderColor='#9333ea'" onmouseout="this.style.borderColor='#2d2d42'">
        <div style="font-size:1.8rem; margin-bottom:8px;">🗺️</div>
        <strong style="color:#fff; font-size:0.95rem; display:block;">Nenhum cenário registrado nesta missão</strong>
        <span style="color:#a1a1aa; font-size:0.75rem; margin-top:4px; display:block;">Clique aqui para adicionar seu primeiro local ou mapa de investigação</span>
        <button class="btn-cris-purple" style="margin-top:12px; font-size:0.75rem; padding:6px 14px; pointer-events:none;">+ Adicionar Cenário</button>
      </div>
    `;
    const box = document.getElementById('box-comodos-container');
    if (box) box.style.display = 'none';
    return;
  }

  locais.forEach((loc, idx) => {
    const card = document.createElement('div');
    card.className = 'card-cenario-item';
    const thumb = loc.imagem || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=400';
    card.innerHTML = `
      <div class="card-deck-thumb" style="background-image:url('${thumb}')"></div>
      <div class="card-deck-body">
        <div class="card-deck-titulo">${loc.nome}</div>
        <div class="card-deck-sub">${(loc.comodos || []).length} Cômodos</div>
      </div>
    `;
    card.onclick = () => selecionarLocalCockpit(idx);
    deckLocais.appendChild(card);
  });
}
window.renderizarCenariosCockpit = renderizarCenariosCockpit;

function selecionarLocalCockpit(idx) {
  if (!campanhaAtiva || !campanhaAtiva.locais) return;
  localAtivo = campanhaAtiva.locais[idx];
  if (!localAtivo) return;

  const boxComodos = document.getElementById('box-comodos-container');
  const titLocal = document.getElementById('local-selecionado-titulo');
  const deckComodos = document.getElementById('deck-comodos');
  if (boxComodos) boxComodos.style.display = 'block';
  if (titLocal) titLocal.innerText = `Cenário: ${localAtivo.nome}`;
  if (!deckComodos) return;
  deckComodos.innerHTML = '';

  const comodos = localAtivo.comodos || [];
  if (comodos.length === 0) {
    deckComodos.innerHTML = '<p style="color:#717182; font-size:0.85rem; padding:12px;">Nenhum cômodo adicionado a este cenário.</p>';
    return;
  }

  comodos.forEach((com, cIdx) => {
    const card = document.createElement('div');
    card.className = 'card-comodo-item';
    const thumb = com.imagem || com.img || 'https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=400';
    card.innerHTML = `
      <div class="card-deck-thumb" style="background-image:url('${thumb}')"></div>
      <div class="card-deck-body">
        <div class="card-deck-titulo">${com.nome}</div>
        <div class="card-deck-sub">${(com.pins || []).length} Evidências</div>
      </div>
    `;
    card.onclick = () => selecionarComodoCockpit(cIdx);
    deckComodos.appendChild(card);
  });
}
window.selecionarLocalCockpit = selecionarLocalCockpit;

function abrirModalNovoComodo() {
  document.getElementById('form-comodo-nome').value = '';
  document.getElementById('form-comodo-img').value = '';
  document.getElementById('form-comodo-narracao').value = '';
  document.getElementById('modal-comodo').style.display = 'flex';
}
window.abrirModalNovoComodo = abrirModalNovoComodo;

function fecharModalComodo() {
  document.getElementById('modal-comodo').style.display = 'none';
}
window.fecharModalComodo = fecharModalComodo;

async function salvarFormComodo() {
  const nome = document.getElementById('form-comodo-nome').value.trim();
  const img = document.getElementById('form-comodo-img').value.trim();
  const narracao = document.getElementById('form-comodo-narracao').value.trim();
  if (!nome) { alert('Digite o nome do cômodo.'); return; }
  if (!localAtivo) {
    if (!campanhaAtiva.locais) campanhaAtiva.locais = [];
    localAtivo = { nome: 'Local Principal', imagem: img, comodos: [] };
    campanhaAtiva.locais.push(localAtivo);
  }
  if (!localAtivo.comodos) localAtivo.comodos = [];
  localAtivo.comodos.push({ id: 'comodo_' + Date.now(), nome, imagem: img, narracao, pins: [] });
  await persistirCampanhaNoServidor(campanhaAtiva);
  fecharModalComodo();
  mostrarToast(`Cômodo "${nome}" salvo!`);
  const lIdx = campanhaAtiva.locais.indexOf(localAtivo);
  selecionarLocalCockpit(lIdx >= 0 ? lIdx : 0);
}
window.salvarFormComodo = salvarFormComodo;

function selecionarComodoCockpit(cIdx) {
  if (!localAtivo || !localAtivo.comodos) return;
  comodoAtivo = localAtivo.comodos[cIdx];
  if (!comodoAtivo) return;

  document.getElementById('detalhe-comodo-nome').innerText = comodoAtivo.nome;
  document.getElementById('detalhe-comodo-narracao').innerText = comodoAtivo.narracao || 'Sem narração registrada.';
  const palco = document.getElementById('palco-comodo');
  if (palco) {
    palco.style.backgroundImage = `url('${comodoAtivo.imagem || comodoAtivo.img || ''}')`;
    renderizarPinsComodo();
  }
  mudarView('view-comodo-detalhes');
}
window.selecionarComodoCockpit = selecionarComodoCockpit;

function renderizarPinsComodo() {
  const palco = document.getElementById('palco-comodo');
  if (!palco || !comodoAtivo) return;
  palco.querySelectorAll('.pin-marcador').forEach(p => p.remove());
  (comodoAtivo.pins || []).forEach(pin => {
    const el = document.createElement('div');
    el.className = 'pin-marcador' + (pin.numero ? ' pin-com-numero' : '');
    el.style.left = `${pin.x}%`;
    el.style.top = `${pin.y}%`;
    el.innerText = pin.numero ? String(pin.numero).padStart(2, '0') : '🔍';
    el.title = pin.titulo || 'Evidência';
    el.onclick = (e) => {
      e.stopPropagation();
      exibirDetalhePin(pin);
    };
    palco.appendChild(el);
  });
}
window.renderizarPinsComodo = renderizarPinsComodo;

function exibirDetalhePin(pin) {
  const card = document.getElementById('detalhe-pin-card');
  if (!card) return;
  document.getElementById('pin-card-titulo').innerText = pin.titulo || 'Evidência';
  document.getElementById('pin-card-desc').innerText = pin.desc || '';
  
  const imgEl = document.getElementById('pin-card-img');
  const btnTv = document.getElementById('btn-exibir-pin-tv');
  
  if (imgEl) {
    if (pin.imagem) {
      imgEl.src = pin.imagem;
      imgEl.style.display = 'block';
    } else {
      imgEl.style.display = 'none';
    }
  }

  if (btnTv) {
    if (pin.imagem) {
      btnTv.style.display = 'block';
      btnTv.onclick = () => {
        if (typeof socket !== 'undefined') {
          socket.emit('tv_mostrar_handout', pin.imagem);
          const btnRec = document.getElementById('btn-recolher-pista'); if (btnRec) btnRec.style.display = 'block';
          mostrarNotificacao('Imagem do Ponto enviada para a TV!');
        }
      };
    } else {
      btnTv.style.display = 'none';
    }
  }

  const btnHandout = document.getElementById('btn-exibir-handout-tablet');
  if (btnHandout) {
    btnHandout.onclick = () => mostrarPistaNoTablet(pin.handout || pin.imagem);
  }
  card.style.display = 'block';
}
window.exibirDetalhePin = exibirDetalhePin;

function abrirModalEditarComodoAtual() {
  if (!comodoAtivo) return;
  document.getElementById('form-comodo-nome').value = comodoAtivo.nome || '';
  document.getElementById('form-comodo-img').value = comodoAtivo.imagem || comodoAtivo.img || '';
  document.getElementById('form-comodo-narracao').value = comodoAtivo.narracao || '';
  document.getElementById('modal-comodo').style.display = 'flex';
}
window.abrirModalEditarComodoAtual = abrirModalEditarComodoAtual;

function transmitirComodoAtual() {
  if (!comodoAtivo) return;
  const dados = {
    nome: comodoAtivo.nome,
    imagem: comodoAtivo.imagem || comodoAtivo.img || '',
    narracao: comodoAtivo.narracao || ''
  };
  socket.emit('transmitir_cena_tablet', dados);
  socket.emit('tv_mostrar_cena', dados);
  mostrarToast(`Cenário "${comodoAtivo.nome}" projetado na TV e Tablet!`, 'sucesso');
}
window.transmitirComodoAtual = transmitirComodoAtual;

function transmitirCenaAtualCockpit() {
  if (comodoAtivo) {
    transmitirComodoAtual();
    return;
  }
  if (localAtivo && localAtivo.comodos && localAtivo.comodos.length > 0) {
    comodoAtivo = localAtivo.comodos[0];
    transmitirComodoAtual();
    return;
  }
  if (campanhaAtiva && campanhaAtiva.locais && campanhaAtiva.locais.length > 0) {
    const loc = campanhaAtiva.locais[0];
    const com = (loc.comodos && loc.comodos.length > 0) ? loc.comodos[0] : { nome: loc.nome, imagem: loc.imagem || '' };
    comodoAtivo = com;
    transmitirComodoAtual();
    return;
  }
  if (vttState.mapaAtivoUrl) {
    socket.emit('tv_definir_standby', { emStandby: false, mapaAtivoUrl: vttState.mapaAtivoUrl });
    socket.emit('tv_trocar_mapa', vttState.mapaAtivoUrl);
    socket.emit('tv_atualizar_tokens', vttState.tokens || []);
    socket.emit('tv_aplicar_camera', vttState.camera);
    mostrarToast("Mapa tático transmitido para a TV!", "sucesso");
  }
}
window.transmitirCenaAtualCockpit = transmitirCenaAtualCockpit;
window.transmitirMansaoOficial = transmitirCenaAtualCockpit;

function transmitirMansaoOficial() {
  const dados = {
    nome: "Mansão Antiga (Investigação 2.5D)",
    andar: "Térreo",
    imagem: "/uploads/mansao_tipora.webp",
    narracao: "O ar gélido e o assoalho antigo rangem a cada passo..."
  };
  vttState.mapaAtivoUrl = '/uploads/mansao_tipora.webp';
  isTransmitindoLive = true;
  if (typeof socket !== 'undefined') {
    socket.emit('transmitir_cena_tablet', dados);
    socket.emit('tv_trocar_mapa', '/uploads/mansao_tipora.webp');
    socket.emit('tv_definir_standby', { emStandby: false, mapaAtivoUrl: '/uploads/mansao_tipora.webp' });
    if (vttState.tokens && vttState.tokens.length > 0) {
      socket.emit('tv_atualizar_tokens', vttState.tokens);
    }
  }
  mostrarToast("🏰 Mansão 2.5D transmitida para a TV / Tablet com sucesso!", "sucesso");
}
window.transmitirMansaoOficial = transmitirMansaoOficial;

function abrirModalNovoPin() {
  document.getElementById('form-pin-titulo').value = '';
  document.getElementById('form-pin-desc').value = '';
  document.getElementById('form-pin-handout').value = '';
  document.getElementById('modal-pin').style.display = 'flex';
}
window.abrirModalNovoPin = abrirModalNovoPin;

function fecharModalPin() {
  document.getElementById('modal-pin').style.display = 'none';
}
window.fecharModalPin = fecharModalPin;

async function salvarFormPin() {
  const titulo = document.getElementById('form-pin-titulo').value.trim();
  const desc = document.getElementById('form-pin-desc').value.trim();
  const handout = document.getElementById('form-pin-handout').value.trim();
  if (!titulo) { alert('Digite o título da evidência.'); return; }
  if (!comodoAtivo) return;
  if (!comodoAtivo.pins) comodoAtivo.pins = [];
  comodoAtivo.pins.push({
    id: 'pin_' + Date.now(),
    titulo, desc, handout,
    x: 50, y: 50
  });
  await persistirCampanhaNoServidor(campanhaAtiva);
  fecharModalPin();
  renderizarPinsComodo();
  mostrarToast(`Evidência "${titulo}" adicionada ao cômodo!`);
}
window.salvarFormPin = salvarFormPin;

function ajustarStatusAgenteMestre(agenteId, tipo, delta) {
  if (!campanhaAtiva || !campanhaAtiva.personagens) return;
  const ag = campanhaAtiva.personagens.find(p => String(p.id) === String(agenteId));
  if (!ag) return;
  const maxVal = ag[tipo + 'Max'] || (tipo === 'pv' ? 20 : (tipo === 'san' ? 20 : 5));
  ag[tipo] = Math.max(0, Math.min(maxVal, (ag[tipo] !== undefined ? ag[tipo] : maxVal) + delta));
  
  if (delta < 0) {
    tocarSomProcedural('dano');
  } else {
    tocarSomProcedural('cura');
  }

  socket.emit('atualizar_dados_personagem', { campanhaId: campanhaAtiva.id, personagem: ag });
  renderizarMonitoresAgentesCockpit();
  salvarCampanhasNoDisco();
}
window.ajustarStatusAgenteMestre = ajustarStatusAgenteMestre;


// =========================================================================
// FERRAMENTAS VTT: TAMANHO DE TRAÇO E SUB-FERRAMENTAS
// =========================================================================
function alternarTamanhoDrawDDB(btn) {
  if (drawTamanho === 3) drawTamanho = 6;
  else if (drawTamanho === 6) drawTamanho = 12;
  else if (drawTamanho === 12) drawTamanho = 24;
  else drawTamanho = 3;

  const dot = document.getElementById('svg-draw-size-dot');
  if (dot) {
    const scale = drawTamanho === 3 ? 0.35 : (drawTamanho === 6 ? 0.6 : (drawTamanho === 12 ? 0.9 : 1.2));
    dot.style.transform = `scale(${scale})`;
  }
  if (btn) btn.title = `Tamanho do Traço: ${drawTamanho}px`;
  mostrarToast(`Tamanho do traço: ${drawTamanho}px`, 'sucesso');
}
window.alternarTamanhoDrawDDB = alternarTamanhoDrawDDB;

function ativarSubFerramenta(btn, classe, modo) {
  if (classe) {
    document.querySelectorAll('.' + classe).forEach(b => b.classList.remove('active'));
  }
  if (btn) btn.classList.add('active');
}
window.ativarSubFerramenta = ativarSubFerramenta;


// =========================================================================
// BESTIÁRIO DINÂMICO DE AMEAÇAS (COCKPIT DO MESTRE)
// =========================================================================

const BESTIARIO_PADRAO = [
  {
    id: "ameaca_zumbi_sangue",
    nome: "Zumbi de Sangue",
    elemento: "sangue",
    vd: 20,
    pv: 40,
    pvMax: 40,
    defesa: 15,
    tipo: "Criatura de Sangue",
    img: "https://images.unsplash.com/photo-1509248961158-e54f6934749c?auto=format&fit=crop&w=300&q=80",
    descricao: "Cadáver putrefato reanimado pela torrente primordial de Sangue, movido pela compulsão brutal de rasgar carne.",
    habilidades: [
      { nome: "Presença Perturbadora", desc: "NEX 30% ou menor fica perturbado ao avistar a criatura (Vontade DT 15 anula)." },
      { nome: "Faro de Sangue", desc: "A criatura localiza automaticamente seres feridos a até 18 metros." }
    ],
    ataques: [
      { nome: "Garras", tipo: "Padrão", dados: 2, bonus: 5, dano: "1d6+2 Sangue", desc: "Corpo a Corpo" },
      { nome: "Mordida", tipo: "Livre", dados: 1, bonus: 5, dano: "1d8+2 Sangue", desc: "Apenas se agarrar o alvo" }
    ]
  },
  {
    id: "ameaca_esqueleto_lodo",
    nome: "Esqueleto de Lodo",
    elemento: "morte",
    vd: 20,
    pv: 35,
    pvMax: 35,
    defesa: 14,
    tipo: "Criatura de Morte",
    img: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=300&q=80",
    descricao: "Ossada humana fundida a um lodo espesso e viscoso. O tempo ao seu redor corre de maneira distorcida e decadente.",
    habilidades: [
      { nome: "Lodo Entorpecente", desc: "Quem ataca corpo a corpo tem seu deslocamento reduzido em 3m pela gosma temporal." },
      { nome: "Regeneração Temporal", desc: "Recupera 5 PV no início do seu turno se não foi alvo de dano de Energia." }
    ],
    ataques: [
      { nome: "Pancada Óssea", tipo: "Padrão", dados: 2, bonus: 5, dano: "1d8+3 Morte", desc: "Corpo a Corpo" },
      { nome: "Pústula de Lodo", tipo: "Padrão", dados: 2, bonus: 4, dano: "1d6+2 Morte", desc: "Disparo a 9m, efeito de lentidão" }
    ]
  },
  {
    id: "ameaca_anarquico",
    nome: "Anárquico",
    elemento: "energia",
    vd: 20,
    pv: 30,
    pvMax: 30,
    defesa: 16,
    tipo: "Criatura de Energia",
    img: "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=300&q=80",
    descricao: "Manifestação luminescente de caos puro e eletricidade volátil. Pisca entre o mundo real e a loucura do Outro Lado.",
    habilidades: [
      { nome: "Instabilidade Molecular", desc: "Sua frequência de fase oscila tornando-o imune a dano crítico comum." },
      { nome: "Pulso Eletrostático", desc: "Equipamentos eletrônicos em alcance curto entram em pane temporária." }
    ],
    ataques: [
      { nome: "Descarga Caótica", tipo: "Padrão", dados: 3, bonus: 5, dano: "2d6+3 Energia", desc: "Curto alcance eletrizante" },
      { nome: "Estalo Estático", tipo: "Livre", dados: 2, bonus: 5, dano: "1d10 Energia", desc: "Disparado como reação reflexa" }
    ]
  },
  {
    id: "ameaca_existido",
    nome: "Existido",
    elemento: "conhecimento",
    vd: 20,
    pv: 30,
    pvMax: 30,
    defesa: 13,
    tipo: "Criatura de Conhecimento",
    img: "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=300&q=80",
    descricao: "Alguém que soube demais e teve sua consciência substituída por palavras douradas e sussurros incessantes do Conhecimento.",
    habilidades: [
      { nome: "Sussurros do Outro Lado", desc: "Vontade DT 14 ou sofre 1d4 de dano de Sanidade no início do seu turno." },
      { nome: "Grafia Maldita", desc: "Grava sigilos com sangue no chão que dificultam a esquiva dos agentes." }
    ],
    ataques: [
      { nome: "Murmúrio Perturbador", tipo: "Padrão", dados: 2, bonus: 5, dano: "1d6+2 Mental", desc: "Dano psíquico à distância" },
      { nome: "Toque do Vazio", tipo: "Padrão", dados: 1, bonus: 5, dano: "1d8+2 Físico", desc: "Corpo a corpo desorientador" }
    ]
  },
  {
    id: "ameaca_mutilador_noturno",
    nome: "Mutilador Noturno",
    elemento: "medo",
    vd: 40,
    pv: 75,
    pvMax: 75,
    defesa: 18,
    tipo: "Criatura de Medo",
    img: "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=300&q=80",
    descricao: "Abominação furtiva que se camufla na escuridão. Seus membros alongados terminam em garras de puro pavor primordial.",
    habilidades: [
      { nome: "Furtividade Sobrenatural", desc: "Ganha vantagem e +5 bônus em Furtividade enquanto estiver em penumbra." },
      { nome: "Aura de Pavor", desc: "Agentes a até 9 metros sofrem desvantagem em qualquer teste de resistência mental." }
    ],
    ataques: [
      { nome: "Lâminas de Sombra", tipo: "Padrão", dados: 3, bonus: 10, dano: "2d8+5 Corte", desc: "Golpe duplo dilacerante" },
      { nome: "Abraço do Pavor", tipo: "Completa", dados: 2, bonus: 8, dano: "2d10+4 Medo", desc: "Dano de Medo e Agarrar" }
    ]
  }
];

let bestiarioAtivoId = 'ameaca_zumbi_sangue';
let filtroElementoAtual = 'todos';
let buscaTextoBestiario = '';

function getTodasAmeacas() {
  const customizadas = (campanhaAtiva && Array.isArray(campanhaAtiva.ameacas)) ? campanhaAtiva.ameacas : [];
  const todas = [...BESTIARIO_PADRAO];
  customizadas.forEach(cust => {
    const idx = todas.findIndex(m => m.id === cust.id);
    if (idx !== -1) todas[idx] = cust;
    else todas.push(cust);
  });
  return todas;
}
window.getTodasAmeacas = getTodasAmeacas;

function filtrarBestiarioPorElemento(elemento, btn) {
  filtroElementoAtual = elemento;
  document.querySelectorAll('.btn-filtro-elem').forEach(b => b.classList.remove('ativo'));
  if (btn) btn.classList.add('ativo');
  renderizarBestiario();
}
window.filtrarBestiarioPorElemento = filtrarBestiarioPorElemento;

function filtrarBestiarioPorTexto(txt) {
  buscaTextoBestiario = (txt || '').toLowerCase().trim();
  renderizarBestiario();
}
window.filtrarBestiarioPorTexto = filtrarBestiarioPorTexto;

function selecionarAmeacaBestiario(id) {
  bestiarioAtivoId = id;
  renderizarBestiario();
}
window.selecionarAmeacaBestiario = selecionarAmeacaBestiario;

function renderizarBestiario() {
  const listaCol = document.getElementById('lista-cards-bestiario');
  const detalheCol = document.getElementById('painel-detalhe-ameaca');
  if (!listaCol || !detalheCol) return;

  const todas = getTodasAmeacas();
  const filtradas = todas.filter(m => {
    const bateElem = (filtroElementoAtual === 'todos') || (m.elemento && m.elemento.toLowerCase() === filtroElementoAtual);
    const bateTexto = !buscaTextoBestiario || (m.nome && m.nome.toLowerCase().includes(buscaTextoBestiario)) || (m.tipo && m.tipo.toLowerCase().includes(buscaTextoBestiario));
    return bateElem && bateTexto;
  });

  if (!filtradas.find(m => m.id === bestiarioAtivoId) && filtradas.length > 0) {
    bestiarioAtivoId = filtradas[0].id;
  }

  // Renderiza Lista de Cards
  listaCol.innerHTML = '';
  if (filtradas.length === 0) {
    listaCol.innerHTML = '<div style="color: #717182; text-align: center; padding: 24px; font-size: 0.8rem;">Nenhuma ameaça encontrada para este filtro.</div>';
  } else {
    filtradas.forEach(m => {
      const isSel = (m.id === bestiarioAtivoId);
      const card = document.createElement('div');
      card.className = 'card-bestiario-item' + (isSel ? ' selecionado' : '');
      card.onclick = () => selecionarAmeacaBestiario(m.id);
      
      const elemClass = 'badge-' + (m.elemento || 'sangue').toLowerCase();
      const thumb = m.img || 'https://via.placeholder.com/60?text=?';

      card.innerHTML = `
        <img src="${thumb}" class="card-bestiario-thumb" alt="${m.nome}" onerror="this.src='https://via.placeholder.com/60?text=?'">
        <div class="card-bestiario-meta">
          <div class="card-bestiario-nome">${m.nome}</div>
          <div class="card-bestiario-sub">
            <span class="badge-elemento-tag ${elemClass}">${m.elemento || 'Sangue'}</span>
            <span>VD ${m.vd || 20}</span>
            <span>• ${m.pv || 40} PV</span>
          </div>
        </div>
      `;
      listaCol.appendChild(card);
    });
  }

  // Renderiza Detalhe da Criatura
  const ativa = todas.find(m => m.id === bestiarioAtivoId) || filtradas[0];
  if (!ativa) {
    detalheCol.innerHTML = '<div style="color:#717182; text-align:center; padding: 40px;">Selecione uma ameaça para visualizar seus atributos táticos.</div>';
    return;
  }

  const elemClass = 'badge-' + (ativa.elemento || 'sangue').toLowerCase();
  const corElemento = {
    sangue: '#ef4444',
    morte: '#9494a8',
    energia: '#c084fc',
    conhecimento: '#facc15',
    medo: '#ffffff'
  }[ativa.elemento || 'sangue'] || '#ef4444';

  const ataquesHtml = (ativa.ataques || []).map(atq => {
    const dadosNum = atq.dados || 2;
    const bonusNum = atq.bonus || 5;
    const danoStr = atq.dano || '1d6+2';
    return `
      <button class="detalhe-ataque-card" onclick="rolarAtaqueMonstro('${atq.nome.replace(/'/g, "\\'")}', ${dadosNum}, ${bonusNum}, '${danoStr.replace(/'/g, "\\'")}')">
        <div>
          <strong style="color: #fff; font-size: 0.95rem;">${atq.nome} <span style="font-size: 0.68rem; background: #282838; padding: 2px 6px; border-radius: 4px; margin-left: 6px; color: #a1a1aa;">${atq.tipo || 'Padrão'}</span></strong>
          <div style="font-size: 0.75rem; color: #9494a8; margin-top: 3px;">${atq.desc || 'Ataque de criatura'}</div>
        </div>
        <div style="text-align: right;">
          <div style="color: #38bdf8; font-weight: bold; font-size: 0.9rem;">Teste: ${dadosNum}d20+${bonusNum}</div>
          <div style="color: ${corElemento}; font-weight: bold; font-size: 0.8rem; margin-top: 2px;">Dano: ${danoStr}</div>
        </div>
      </button>
    `;
  }).join('');

  const habilidadesHtml = (ativa.habilidades || []).map(hab => `
    <div class="habilidade-box">
      <div class="habilidade-nome" style="color: ${corElemento};">✦ ${hab.nome}</div>
      <div class="habilidade-desc">${hab.desc}</div>
    </div>
  `).join('');

  detalheCol.innerHTML = `
    <div class="detalhe-header-box">
      <div class="detalhe-header-info">
        <img src="${ativa.img || 'https://via.placeholder.com/60?text=?'}" class="detalhe-avatar-img" alt="${ativa.nome}" onerror="this.src='https://via.placeholder.com/60?text=?'">
        <div class="detalhe-header-textos">
          <h2 style="color: ${corElemento};">${ativa.nome}</h2>
          <div class="detalhe-tipo-linha">
            <span class="badge-elemento-tag ${elemClass}">${ativa.elemento || 'Sangue'}</span>
            <span>• ${ativa.tipo || 'Criatura Paranormal'}</span>
            <span>• VD ${ativa.vd || 20}</span>
          </div>
        </div>
      </div>
      <div class="detalhe-acoes-topo">
        <button class="btn-vtt-spawn" onclick="colocarAmeacaNoVTT('${ativa.id}')" title="Instanciar este monstro no Tabuleiro VTT">
          <span>🎲</span> COLOCAR NO TABULEIRO (VTT)
        </button>
        <button class="btn-cris-subtle" onclick="abrirModalNovaAmeaca('${ativa.id}')" title="Editar dados desta criatura">✏</button>
        <button class="btn-cris-subtle" onclick="excluirAmeaca('${ativa.id}')" title="Excluir do Bestiário">🗑</button>
      </div>
    </div>

    <!-- ESTATÍSTICAS CHAVE -->
    <div class="detalhe-stats-row">
      <div class="stat-box-ameaca">
        <div class="stat-box-label">Pontos de Vida (PV)</div>
        <div class="stat-box-val" style="color: #ef4444;">${ativa.pv || 40} <span style="font-size:0.75rem; color:#717182;">/ ${ativa.pvMax || ativa.pv || 40}</span></div>
      </div>
      <div class="stat-box-ameaca">
        <div class="stat-box-label">Defesa</div>
        <div class="stat-box-val" style="color: #38bdf8;">${ativa.defesa || 15}</div>
      </div>
      <div class="stat-box-ameaca">
        <div class="stat-box-label">Valor de Desafio</div>
        <div class="stat-box-val" style="color: #facc15;">VD ${ativa.vd || 20}</div>
      </div>
    </div>

    <!-- DESCRIÇÃO -->
    ${ativa.descricao ? `
      <div style="background: #0d0d14; border: 1px solid #1c1c28; border-radius: 6px; padding: 10px 14px; font-size: 0.78rem; color: #a1a1aa; line-height: 1.4;">
        ${ativa.descricao}
      </div>
    ` : ''}

    <!-- ATAQUES ROLÁVEIS -->
    <div>
      <div class="detalhe-secao-titulo">
        <span>⚔️ Ações de Combate (Clique para rolar)</span>
        <span style="font-size: 0.68rem; color: #717182;">DADO 3D + FEED</span>
      </div>
      <div style="display: flex; flex-direction: column; gap: 8px;">
        ${ataquesHtml || '<div style="color:#717182; font-size:0.75rem;">Nenhum ataque configurado.</div>'}
      </div>
    </div>

    <!-- HABILIDADES ESPECIAIS -->
    ${habilidadesHtml ? `
      <div>
        <div class="detalhe-secao-titulo">
          <span>🔮 Habilidades Especiais & Passivas</span>
        </div>
        <div>${habilidadesHtml}</div>
      </div>
    ` : ''}
  `;
}
window.renderizarBestiario = renderizarBestiario;

// SPANW DIRETO NO VTT
function colocarAmeacaNoVTT(id) {
  const todas = getTodasAmeacas();
  const ameaca = todas.find(m => m.id === id);
  if (!ameaca) return;

  // Garante registro no catálogo de monstros do VTT
  if (!vttState.catalogoMonstros) vttState.catalogoMonstros = [];
  let noCatalogo = vttState.catalogoMonstros.find(m => m.id === ameaca.id);
  if (!noCatalogo) {
    vttState.catalogoMonstros.push({
      id: ameaca.id,
      nome: ameaca.nome,
      tipo: 'monstro',
      pv: ameaca.pv || 40,
      pvMax: ameaca.pvMax || ameaca.pv || 40,
      defesa: ameaca.defesa || 15,
      img: ameaca.img || 'https://images.unsplash.com/photo-1509248961158-e54f6934749c?auto=format&fit=crop&w=300&q=80'
    });
  }

  // Gera o token na mesa
  colocarTokenNaMesa(ameaca.id);
  mostrarToast(`Ameaça "${ameaca.nome}" colocada no Tabuleiro VTT!`, 'sucesso');
}
window.colocarAmeacaNoVTT = colocarAmeacaNoVTT;

// MODAL DE AMEAÇA
function abrirModalNovaAmeaca(idParaEditar = null) {
  const modal = document.getElementById('modal-nova-ameaca');
  if (!modal) return;

  const containerAtaques = document.getElementById('container-linhas-ataques-form');
  containerAtaques.innerHTML = '';

  if (idParaEditar) {
    const todas = getTodasAmeacas();
    const m = todas.find(x => x.id === idParaEditar);
    if (m) {
      document.getElementById('modal-ameaca-titulo').innerText = 'Editar Ameaça: ' + m.nome;
      document.getElementById('form-ameaca-id').value = m.id;
      document.getElementById('form-ameaca-nome').value = m.nome;
      document.getElementById('form-ameaca-vd').value = m.vd || 20;
      document.getElementById('form-ameaca-elemento').value = m.elemento || 'sangue';
      document.getElementById('form-ameaca-pv').value = m.pv || 40;
      document.getElementById('form-ameaca-defesa').value = m.defesa || 15;
      document.getElementById('form-ameaca-img').value = m.img || '';
      document.getElementById('form-ameaca-desc').value = m.descricao || '';

      (m.ataques || []).forEach(atq => adicionarLinhaAtaqueForm(atq));
      modal.style.display = 'flex';
      return;
    }
  }

  // Modo Nova Ameaça
  document.getElementById('modal-ameaca-titulo').innerText = 'Nova Ameaça Paranormal';
  document.getElementById('form-ameaca-id').value = '';
  document.getElementById('form-ameaca-nome').value = '';
  document.getElementById('form-ameaca-vd').value = 20;
  document.getElementById('form-ameaca-elemento').value = 'sangue';
  document.getElementById('form-ameaca-pv').value = 40;
  document.getElementById('form-ameaca-defesa').value = 15;
  document.getElementById('form-ameaca-img').value = '';
  document.getElementById('form-ameaca-desc').value = '';

  adicionarLinhaAtaqueForm({ nome: 'Ataque Padrão', tipo: 'Padrão', dados: 2, bonus: 5, dano: '1d6+2 Sangue' });
  modal.style.display = 'flex';
}
window.abrirModalNovaAmeaca = abrirModalNovaAmeaca;

function fecharModalNovaAmeaca() {
  const modal = document.getElementById('modal-nova-ameaca');
  if (modal) modal.style.display = 'none';
}
window.fecharModalNovaAmeaca = fecharModalNovaAmeaca;

function adicionarLinhaAtaqueForm(atq = null) {
  const container = document.getElementById('container-linhas-ataques-form');
  if (!container) return;

  const nome = atq?.nome || 'Ataque';
  const tipo = atq?.tipo || 'Padrão';
  const dados = atq?.dados || 2;
  const dano = atq?.dano || '1d6+2';

  const row = document.createElement('div');
  row.className = 'linha-ataque-form-item';
  row.innerHTML = `
    <input type="text" class="form-input-cris atq-nome" placeholder="Nome (Ex: Garras)" value="${nome}">
    <select class="form-input-cris atq-tipo">
      <option value="Padrão" ${tipo === 'Padrão' ? 'selected' : ''}>Padrão</option>
      <option value="Livre" ${tipo === 'Livre' ? 'selected' : ''}>Livre</option>
      <option value="Completa" ${tipo === 'Completa' ? 'selected' : ''}>Completa</option>
    </select>
    <input type="number" class="form-input-cris atq-dados" placeholder="Dados (2)" value="${dados}" title="Quantidade de d20">
    <input type="text" class="form-input-cris atq-dano" placeholder="Dano (1d6+2)" value="${dano}">
    <button type="button" class="btn-cris-subtle" onclick="this.parentElement.remove()" style="color:#ef4444; padding:4px;">✕</button>
  `;
  container.appendChild(row);
}
window.adicionarLinhaAtaqueForm = adicionarLinhaAtaqueForm;

function salvarFormAmeaca() {
  const idExistente = document.getElementById('form-ameaca-id').value;
  const nome = document.getElementById('form-ameaca-nome').value.trim();
  if (!nome) {
    alert('Digite o nome da ameaça!');
    return;
  }

  const vd = parseInt(document.getElementById('form-ameaca-vd').value) || 20;
  const elemento = document.getElementById('form-ameaca-elemento').value;
  const pv = parseInt(document.getElementById('form-ameaca-pv').value) || 40;
  const defesa = parseInt(document.getElementById('form-ameaca-defesa').value) || 15;
  const img = document.getElementById('form-ameaca-img').value.trim();
  const desc = document.getElementById('form-ameaca-desc').value.trim();

  // Coletar ataques
  const ataques = [];
  document.querySelectorAll('.linha-ataque-form-item').forEach(row => {
    const atqNome = row.querySelector('.atq-nome').value.trim();
    if (atqNome) {
      ataques.push({
        nome: atqNome,
        tipo: row.querySelector('.atq-tipo').value,
        dados: parseInt(row.querySelector('.atq-dados').value) || 2,
        bonus: 5,
        dano: row.querySelector('.atq-dano').value.trim() || '1d6+2',
        desc: 'Ação rápida de combate'
      });
    }
  });

  const novaAmeaca = {
    id: idExistente || ('ameaca_' + Date.now()),
    nome,
    vd,
    elemento,
    pv,
    pvMax: pv,
    defesa,
    tipo: 'Criatura de ' + (elemento.charAt(0).toUpperCase() + elemento.slice(1)),
    img: img || 'https://images.unsplash.com/photo-1509248961158-e54f6934749c?auto=format&fit=crop&w=300&q=80',
    descricao: desc,
    habilidades: [
      { nome: "Presença Aterrorizante", desc: "Criatura emana a aura de seu elemento paranormal." }
    ],
    ataques: ataques.length > 0 ? ataques : [
      { nome: 'Garras', tipo: 'Padrão', dados: 2, bonus: 5, dano: '1d6+2 ' + elemento, desc: 'Corpo a Corpo' }
    ]
  };

  if (!campanhaAtiva.ameacas) campanhaAtiva.ameacas = [];
  const idx = campanhaAtiva.ameacas.findIndex(x => x.id === novaAmeaca.id);
  if (idx !== -1) {
    campanhaAtiva.ameacas[idx] = novaAmeaca;
  } else {
    campanhaAtiva.ameacas.push(novaAmeaca);
  }

  bestiarioAtivoId = novaAmeaca.id;
  fecharModalNovaAmeaca();
  renderizarBestiario();
  salvarCampanhasNoDisco();
  mostrarToast(`Ameaça "${nome}" salva com sucesso!`, 'sucesso');
}
window.salvarFormAmeaca = salvarFormAmeaca;

function excluirAmeaca(id) {
  if (!confirm('Deseja realmente remover esta ameaça?')) return;
  if (campanhaAtiva && campanhaAtiva.ameacas) {
    campanhaAtiva.ameacas = campanhaAtiva.ameacas.filter(x => x.id !== id);
    salvarCampanhasNoDisco();
  }
  const todas = getTodasAmeacas();
  bestiarioAtivoId = todas.length > 0 ? todas[0].id : '';
  renderizarBestiario();
  mostrarToast('Ameaça removida.', 'aviso');
}
window.excluirAmeaca = excluirAmeaca;


// =========================================================================
// NOVO CENÁRIO DIRETO NO COCKPIT DO MESTRE
// =========================================================================
function abrirModalNovoCenarioCockpit() {
  const modal = document.getElementById('modal-novo-cenario-cockpit');
  if (!modal) return;
  document.getElementById('form-cenario-cockpit-nome').value = '';
  document.getElementById('form-cenario-cockpit-img').value = '';
  modal.style.display = 'flex';
}
window.abrirModalNovoCenarioCockpit = abrirModalNovoCenarioCockpit;

function fecharModalNovoCenarioCockpit() {
  const modal = document.getElementById('modal-novo-cenario-cockpit');
  if (modal) modal.style.display = 'none';
}
window.fecharModalNovoCenarioCockpit = fecharModalNovoCenarioCockpit;

function salvarFormNovoCenarioCockpit() {
  if (!campanhaAtiva) {
    alert('Nenhuma campanha ativa selecionada.');
    return;
  }
  const nome = document.getElementById('form-cenario-cockpit-nome').value.trim();
  if (!nome) {
    alert('Informe o nome do cenário ou local!');
    return;
  }
  const imagem = document.getElementById('form-cenario-cockpit-img').value.trim() || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=600';
  
  if (!campanhaAtiva.locais) campanhaAtiva.locais = [];
  const novoLocal = {
    id: 'local_' + Date.now(),
    nome,
    imagem,
    comodos: [
      { id: 'comodo_' + Date.now(), nome: 'Entrada Principal', andar: 'Térreo', imagem, pistas: [] }
    ]
  };
  
  campanhaAtiva.locais.push(novoLocal);
  salvarCampanhasNoDisco();
  fecharModalNovoCenarioCockpit();
  renderizarCenariosCockpit();
  selecionarLocalCockpit(campanhaAtiva.locais.length - 1);
  mostrarToast(`Cenário "${nome}" adicionado com sucesso!`, 'sucesso');
}
window.salvarFormNovoCenarioCockpit = salvarFormNovoCenarioCockpit;


// =========================================================================
// SINTETIZADOR DE SOM PROCEDURAL (WEB AUDIO API - SKILL UPGRADE & GAME-FEEL)
// =========================================================================
let audioCtxCockpit = null;

function getAudioContext() {
  if (!audioCtxCockpit) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (AudioCtx) audioCtxCockpit = new AudioCtx();
  }
  if (audioCtxCockpit && audioCtxCockpit.state === 'suspended') {
    audioCtxCockpit.resume();
  }
  return audioCtxCockpit;
}

function tocarSomProcedural(tipo) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    if (tipo === 'dado') {
      // Som percussivo e seco de rolagem de dados
      [0, 0.04, 0.09].forEach((delay, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(320 + i * 80 + Math.random() * 60, now + delay);
        osc.frequency.exponentialRampToValueAtTime(80, now + delay + 0.06);
        gain.gain.setValueAtTime(0.25, now + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.06);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + delay);
        osc.stop(now + delay + 0.06);
      });
    } else if (tipo === 'ataque') {
      // Impacto pesado de golpe de monstro
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(35, now + 0.22);
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.22);
    } else if (tipo === 'dano') {
      // Tom tenso descendente ao perder vida/sanidade
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(90, now + 0.18);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.18);
    } else if (tipo === 'cura') {
      // Acorde harmônico ascendente
      [261.63, 329.63, 392.00].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.05);
        gain.gain.setValueAtTime(0.18, now + i * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.05 + 0.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.05);
        osc.stop(now + i * 0.05 + 0.2);
      });
    } else if (tipo === 'click') {
      // Estalo sutil de interface
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, now);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.02);
    }
  } catch (e) {
    console.warn('Áudio procedural suspenso ou não suportado:', e);
  }
}
window.tocarSomProcedural = tocarSomProcedural;

// =========================================================================
// ROLADOR TÁTICO INTEGRADO AO COCKPIT DO MESTRE
// =========================================================================
let modificadorCockpit = 'normal';
let qtdDadosCockpit = 1;

function setModificadorCockpit(mod) {
  modificadorCockpit = mod;
  document.querySelectorAll('.btn-mod-cockpit').forEach(b => b.classList.remove('ativo'));
  const btn = document.getElementById('btn-cockpit-mod-' + mod);
  if (btn) btn.classList.add('ativo');

  const badge = document.getElementById('cockpit-rolagem-tipo-badge');
  if (badge) {
    badge.innerText = mod.toUpperCase();
    badge.style.background = mod === 'vantagem' ? 'rgba(34, 197, 94, 0.2)' : (mod === 'desvantagem' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(147, 51, 234, 0.2)');
    badge.style.color = mod === 'vantagem' ? '#4ade80' : (mod === 'desvantagem' ? '#f87171' : '#c084fc');
    badge.style.borderColor = mod === 'vantagem' ? '#22c55e' : (mod === 'desvantagem' ? '#ef4444' : 'rgba(147, 51, 234, 0.4)');
  }

  // Sincroniza com as variáveis globais legadas do VTT
  if (typeof setModificadorDado === 'function') {
    setModificadorDado(mod);
  }
  tocarSomProcedural('click');
}
window.setModificadorCockpit = setModificadorCockpit;

function alterarQtdDadosCockpit(delta) {
  qtdDadosCockpit = Math.max(1, Math.min(10, qtdDadosCockpit + delta));
  const el = document.getElementById('display-qtd-cockpit');
  if (el) el.innerText = qtdDadosCockpit;
  window.qtdDadosRolar = qtdDadosCockpit;
  tocarSomProcedural('click');
}
window.alterarQtdDadosCockpit = alterarQtdDadosCockpit;

function rolarDadoDoCockpit(faces) {
  tocarSomProcedural('dado');
  window.qtdDadosRolar = qtdDadosCockpit;
  
  // Sincroniza modificador
  if (typeof setModificadorDado === 'function') {
    setModificadorDado(modificadorCockpit);
  }

  // Executa rolagem virtual 3D
  rolarDadoVirtual(faces);

  // Registra no Feed de Rolagens
  const agora = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const feedLista = document.getElementById('feed-rolagens-lista');
  if (feedLista) {
    const avisoVazio = feedLista.querySelector('.feed-empty-aviso');
    if (avisoVazio) avisoVazio.remove();

    const card = document.createElement('div');
    card.className = 'card-feed-rolagem';
    card.style.borderLeft = '4px solid #a855f7';
    card.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <span style="color:#c084fc; font-weight:900; font-size:0.82rem;">Mestre</span>
        <span style="font-size:0.68rem; color:#717182;">${agora}</span>
      </div>
      <div style="font-size:0.75rem; color:#cbd5e1; margin-top:3px;">Rolagem: <b>${qtdDadosCockpit}d${faces}</b> (${modificadorCockpit.toUpperCase()})</div>
    `;
    feedLista.prepend(card);
  }

  mostrarToast(`Rolando ${qtdDadosCockpit}d${faces} (${modificadorCockpit})...`, 'sucesso');
}
window.rolarDadoDoCockpit = rolarDadoDoCockpit;

function limparFeedRolagens() {
  const feedLista = document.getElementById('feed-rolagens-lista');
  if (feedLista) {
    feedLista.innerHTML = '<div class="feed-empty-aviso">Histórico de rolagens limpo.</div>';
    tocarSomProcedural('click');
  }
}
window.limparFeedRolagens = limparFeedRolagens;


// =========================================================================
// ATALHOS DE TECLADO DO MESTRE (SKILL GAME-UI-UX)
// =========================================================================
window.addEventListener('keydown', (e) => {
  // Ignora se estiver digitando em campo de texto
  if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;

  if (e.key === 'Escape') {
    // Fecha Tabuleiro VTT se aberto
    const modalTab = document.getElementById('modal-tabuleiro');
    if (modalTab && modalTab.style.display !== 'none') {
      fecharModoTabuleiro();
      return;
    }
    // Fecha qualquer outro modal
    document.querySelectorAll('.modal-overlay').forEach(m => {
      if (m.style.display !== 'none') m.style.display = 'none';
    });
  } else if (e.key === '1') {
    mudarAbaCockpit('agentes');
    tocarSomProcedural('click');
  } else if (e.key === '2') {
    mudarAbaCockpit('cenarios');
    tocarSomProcedural('click');
  } else if (e.key === '3') {
    mudarAbaCockpit('ameacas');
    tocarSomProcedural('click');
  } else if (e.key === 'd' || e.key === 'D') {
    rolarDadoDoCockpit(20);
  }
});


// =========================================================================
// TOUCH CONTROLS GLOBAIS PARA CELULAR (MOVER TOKENS & MAPA)
// =========================================================================
window.addEventListener('touchmove', function(e) {
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
  if (tokenArrastandoId && e.touches && e.touches.length > 0) {
    e.preventDefault();
    const touch = e.touches[0];
    const t = (vttState.tokens || []).find(x => x.id === tokenArrastandoId);
    if (t) {
      const container = document.getElementById('beta-mapa-container');
      if (container) {
        const rect = container.getBoundingClientRect();
        let rawX = Math.max(0, Math.min(100, ((touch.clientX - rect.left) / rect.width) * 100));
        let rawY = Math.max(0, Math.min(100, ((touch.clientY - rect.top) / rect.height) * 100));
        
        let snapped = aplicarSnapToGridPct(rawX, rawY, rect);
        t.x = snapped.x;
        t.y = snapped.y;

        const divToken = document.getElementById('token-ui-' + t.id);
        if (divToken) { divToken.style.left = t.x + '%'; divToken.style.top = t.y + '%'; }
        if (isTransmitindoLive && typeof socket !== 'undefined') {
          socket.emit('tv_atualizar_tokens', vttState.tokens);
        }
      }
    }
  }
}, { passive: false });

window.addEventListener('touchend', function(e) {
  if (pinArrastando) {
    const pinEl = document.getElementById('vtt-pin-' + pinArrastando.id);
    if (pinEl) pinEl.classList.remove('arrastando');
    if (pinFoiArrastado) {
      salvarPosicaoPinAtualizada(pinArrastando);
      mostrarToast(`Evidência "${pinArrastando.titulo}" reposicionada para (${pinArrastando.x}%, ${pinArrastando.y}%)`, 'sucesso');
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
});


// =========================================================================
// CAMADA DE PINS & EVIDÊNCIAS DE INVESTIGAÇÃO NO TABULEIRO (VTT)
// =========================================================================
let pinsVisiveisNoVTT = true;
let pinFocadoVTT = null;

function togglePinsNoVTT(btn) {
  pinsVisiveisNoVTT = !pinsVisiveisNoVTT;
  const camada = document.getElementById('beta-camada-pins');
  if (camada) camada.style.display = pinsVisiveisNoVTT ? 'block' : 'none';
  if (btn) btn.classList.toggle('active', pinsVisiveisNoVTT);
  mostrarToast(pinsVisiveisNoVTT ? 'Marcadores de inspeção exibidos.' : 'Marcadores de inspeção ocultados.', 'aviso');
}
window.togglePinsNoVTT = togglePinsNoVTT;

function obterPinsDoMapaAtual() {
  if (!campanhaAtiva || !campanhaAtiva.locais) return [];
  const comodos = (campanhaAtiva.locais || []).flatMap(l => l.comodos || []);
  
  const isMapaPoraoApenas = String(vttState.mapaAtivoId).includes('o_porao') || (vttState.mapaAtivoUrl && vttState.mapaAtivoUrl.includes('Mapa 01'));
  
  let todosPins = [];
  comodos.forEach(c => {
    (c.pins || []).forEach(p => todosPins.push(p));
  });

  if (isMapaPoraoApenas) {
    return todosPins.filter(p => !p.numero || p.numero <= 17);
  }
  return todosPins;
}
window.obterPinsDoMapaAtual = obterPinsDoMapaAtual;

async function salvarPosicaoPinAtualizada(pin) {
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
    el.title = pin.titulo ? `${pin.titulo} (Clique para inspecionar, Arraste para mover)` : 'Ponto de Inspeção';

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
}
window.desenharPinsNoVTT = desenharPinsNoVTT;

function abrirCardInspecaoVTT(pin) {
  if (!pin) return;
  pinFocadoVTT = pin;

  document.querySelectorAll('.vtt-pin-marker').forEach(m => m.classList.remove('ativo'));
  const pinEl = document.getElementById('vtt-pin-' + pin.id);
  if (pinEl) pinEl.classList.add('ativo');

  const card = document.getElementById('vtt-pin-inspect-card');
  const numEl = document.getElementById('vtt-pin-card-num');
  const titEl = document.getElementById('vtt-pin-card-titulo');
  const descEl = document.getElementById('vtt-pin-card-desc');
  const imgEl = document.getElementById('vtt-pin-card-img');
  const wrapperImg = document.getElementById('vtt-pin-img-wrapper');
  const btnTv = document.getElementById('btn-vtt-pin-projetar-tv');

  if (numEl) numEl.innerText = pin.numero ? String(pin.numero).padStart(2, '0') : '🔍';
  if (titEl) titEl.innerText = pin.titulo || 'Evidência / Ponto de Inspeção';
  if (descEl) descEl.innerHTML = formatarDescricaoPin(pin.desc);

  const btnOcultar = document.getElementById('btn-vtt-pin-ocultar-tv');
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
  }

  if (card) {
    card.style.display = 'block';
  }
}
window.abrirCardInspecaoVTT = abrirCardInspecaoVTT;

function fecharCardInspecaoVTT() {
  pinFocadoVTT = null;
  document.querySelectorAll('.vtt-pin-marker').forEach(m => m.classList.remove('ativo'));
  const card = document.getElementById('vtt-pin-inspect-card');
  if (card) card.style.display = 'none';
}
window.fecharCardInspecaoVTT = fecharCardInspecaoVTT;

let imagemAtivaNaTV = null;

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
  mostrarToast(`Imagem "${pinFocadoVTT.titulo}" projetada na TV!`, 'sucesso');
}
window.projetarPinAtualTV = projetarPinAtualTV;

function formatarDescricaoPin(desc) {
  if (!desc) return '<span style="color:#717182;">Sem notas registradas para este ponto.</span>';
  return desc
    .replace(/(DT\s*\d+)/gi, '<strong style="color:#eab308; background:rgba(234,179,8,0.15); padding:1px 5px; border-radius:3px;">$1</strong>')
    .replace(/(ARROMBAR|DESTRANCAR|INVESTIGAÇÃO|PERCEPÇÃO|CRIME|TECNOLOGIA|OCULTISMO|RELIGIÃO)/gi, '<strong style="color:#ef4444;">$1</strong>');
}

function focarPinNoMapa(pinId) {
  const pins = obterPinsDoMapaAtual();
  const pin = pins.find(p => p.id === pinId);
  if (!pin) return;
  abrirCardInspecaoVTT(pin);

  const container = document.getElementById('beta-mapa-container');
  const viewport = document.getElementById('beta-viewport');
  if (container && viewport) {
    const mapW = container.offsetWidth || 3537;
    const mapH = container.offsetHeight || 3750;
    const vpW = viewport.offsetWidth || 1920;
    const vpH = viewport.offsetHeight || 1080;
    const zoom = Math.max(0.65, vttState.camera.zoom);
    vttState.camera.zoom = zoom;
    vttState.camera.x = (vpW / 2) - ((pin.x / 100) * mapW * zoom);
    vttState.camera.y = (vpH / 2) - ((pin.y / 100) * mapH * zoom);
    atualizarCamera(true);
  }
  mostrarToast(`Focando em "${pin.titulo}"`, 'aviso');
}
window.focarPinNoMapa = focarPinNoMapa;

function projetarImagemPinDireto(url, titulo) {
  if (!url) return;
  socket.emit('tv_mostrar_handout', url);
  atualizarUIHandoutVisivel(url);
  mostrarToast(`Imagem "${titulo || 'Evidência'}" projetada na TV!`, 'sucesso');
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
});
