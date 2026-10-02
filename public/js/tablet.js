const socket = io();
const standbyEl = document.getElementById('tela-standby');
const cenarioEl = document.getElementById('cenario');
const camadaMapaEl = document.getElementById('camada-mapa');
const tabuleiroBg = document.getElementById('tabuleiro-bg');
const tabuleiroTokens = document.getElementById('tabuleiro-tokens');
const handoutModal = document.getElementById('handout-modal');
const handoutImg = document.getElementById('handout-img');

let tokensLocais = [];
let urlStandbyAtual = '';

socket.on('sincronizar_estado_inicial', (estado) => {
  urlStandbyAtual = estado.imagemStandbyPersonalizada || '';
  tokensLocais = estado.estadoMapa.tokens || [];

  if (estado.estadoMapa.mapaUrl) {
    tabuleiroBg.style.backgroundImage = `url('${estado.estadoMapa.mapaUrl}')`;
  }

  if (estado.modo === 'mapa' && estado.estadoMapa.ativo) {
    ativarMapaNaTela();
  } else if (estado.modo === 'cena' && estado.cenaAtiva) {
    exibirCenaNaTela(estado.cenaAtiva);
  } else {
    ativarStandbyNaTela();
  }

  if (estado.pistaAbertaUrl) {
    handoutImg.src = estado.pistaAbertaUrl;
    handoutModal.style.display = 'flex';
  }
});

socket.on('voltar_standby', (dados) => {
  if (dados && dados.imagemStandby !== undefined) {
    urlStandbyAtual = dados.imagemStandby;
  }
  ativarStandbyNaTela();
});

function ativarStandbyNaTela() {
  camadaMapaEl.style.display = 'none';
  cenarioEl.style.opacity = '0';
  if (urlStandbyAtual) {
    standbyEl.style.backgroundImage = `url('${urlStandbyAtual}')`;
  } else {
    standbyEl.style.backgroundImage = 'none';
  }
  standbyEl.style.display = 'flex';
  setTimeout(() => { standbyEl.style.opacity = '1'; }, 20);
}

socket.on('atualizar_tablet', (dados) => exibirCenaNaTela(dados));

function exibirCenaNaTela(dados) {
  camadaMapaEl.style.display = 'none';
  standbyEl.style.opacity = '0';
  setTimeout(() => { standbyEl.style.display = 'none'; }, 400);

  cenarioEl.style.opacity = '0';
  setTimeout(() => {
    cenarioEl.style.backgroundImage = `url('${dados.imagem}')`;
    cenarioEl.style.opacity = '1';
  }, 300);
}

socket.on('mapa_modo_alterado', (estado) => {
  tokensLocais = estado.tokens || [];
  if (estado.mapaUrl) tabuleiroBg.style.backgroundImage = `url('${estado.mapaUrl}')`;
  if (estado.ativo) ativarMapaNaTela();
  else camadaMapaEl.style.display = 'none';
});

function ativarMapaNaTela() {
  standbyEl.style.display = 'none';
  cenarioEl.style.opacity = '0';
  camadaMapaEl.style.display = 'flex';
  renderizarTokens();
}

socket.on('planta_fundo_alterada', (url) => {
  tabuleiroBg.style.backgroundImage = `url('${url}')`;
});

function renderizarTokens() {
  tabuleiroTokens.innerHTML = '';
  tokensLocais.forEach(tok => {
    if (!tok.visivel) return;

    const el = document.createElement('div');
    el.className = 'token';
    el.id = `tablet_${tok.id}`;
    el.style.backgroundColor = tok.cor;
    el.style.left = `${tok.x}%`;
    el.style.top = `${tok.y}%`;
    el.innerText = tok.nome.charAt(0);

    const label = document.createElement('span');
    label.className = 'token-label';
    label.innerText = tok.nome;
    el.appendChild(label);

    tabuleiroTokens.appendChild(el);
  });
}

socket.on('token_atualizado', (tok) => {
  const idx = tokensLocais.findIndex(t => t.id === tok.id);
  if (idx >= 0) tokensLocais[idx] = tok;
  const el = document.getElementById(`tablet_${tok.id}`);
  if (el) {
    el.style.left = `${tok.x}%`;
    el.style.top = `${tok.y}%`;
  } else if (tok.visivel) {
    renderizarTokens();
  }
});

socket.on('token_visibilidade_alterada', (tok) => {
  const idx = tokensLocais.findIndex(t => t.id === tok.id);
  if (idx >= 0) tokensLocais[idx] = tok;
  renderizarTokens();
});

socket.on('mostrar_handout_tablet', (url) => {
  if (url) {
    handoutImg.src = url;
    handoutModal.style.display = 'flex';
  }
});

socket.on('fechar_handout_tablet', () => {
  handoutModal.style.display = 'none';
});

socket.on('alerta_rolagem_mesa', (dados) => {
  let alertaEl = document.getElementById('notificacao-jogador-mesa');
  if (!alertaEl) {
    alertaEl = document.createElement('div');
    alertaEl.id = 'notificacao-jogador-mesa';
    alertaEl.style.cssText = `
      position: fixed;
      top: 20px;
      left: 20px;
      background: rgba(15, 15, 20, 0.95);
      border-left: 4px solid #ef4444;
      border-radius: 4px;
      padding: 10px 18px;
      color: #fff;
      font-family: 'Segoe UI', sans-serif;
      box-shadow: 0 4px 20px rgba(0,0,0,0.9);
      z-index: 300;
      font-size: 0.9rem;
      transition: opacity 0.3s ease;
    `;
    document.body.appendChild(alertaEl);
  }
  alertaEl.innerHTML = `<strong>${dados.jogador}</strong> rolou <em>${dados.teste}</em>:<br><span style="font-size: 1.4rem; color: #ef4444; font-weight: 900;">${dados.total}</span> <span style="font-size:0.75rem; color:#a1a1aa;">(${dados.detalhes})</span>`;
  alertaEl.style.display = 'block';
  alertaEl.style.opacity = '1';

  setTimeout(() => {
    alertaEl.style.opacity = '0';
    setTimeout(() => { alertaEl.style.display = 'none'; }, 300);
  }, 6000);
});