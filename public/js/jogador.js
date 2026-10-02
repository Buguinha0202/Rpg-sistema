const socket = io({ transports: ['websocket'], upgrade: false });
let campanhaAtivaId = null;
let listaPersonagensCampanha = [];
let agenteAtual = null;
let timerLimparDado = null;
let rolandoAgora = false; 

window.modificadorDadoJogador = 'normal';

window.setModificadorJogador = function(mod) {
  window.modificadorDadoJogador = mod;
  
  const btnNormal = document.getElementById('btn-mod-normal');
  const btnVant = document.getElementById('btn-mod-vantagem');
  const btnDesv = document.getElementById('btn-mod-desvantagem');
  
  [btnNormal, btnVant, btnDesv].forEach(b => {
    if(b) {
      b.style.background = 'transparent';
      b.style.color = '#71717a';
      b.style.borderColor = 'transparent';
    }
  });

  // Pega a cor oficial da classe do agente (Roxo, Amarelo ou Vermelho)
  const classe = (agenteAtual?.classe || '').toLowerCase();
  let corAtiva = '#9333ea'; 
  if (classe.includes('especialista')) corAtiva = '#eab308';
  else if (classe.includes('combatente')) corAtiva = '#dc2626';

  const ativo = mod === 'normal' ? btnNormal : (mod === 'vantagem' ? btnVant : btnDesv);
  if (ativo) {
    ativo.style.background = corAtiva;
    ativo.style.color = '#fff';
    ativo.style.borderColor = corAtiva;
  }
};

// Tabela Oficial Completa
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

socket.on('sincronizar_estado_inicial', (estado) => {
  campanhaAtivaId = estado.campanhaAtivaId;
  listaPersonagensCampanha = estado.personagensCampanha || [];
  atualizarTelaSelecao();
});

socket.on('campanha_ativa_alterada', (dados) => {
  campanhaAtivaId = dados.campanhaId;
  listaPersonagensCampanha = dados.personagens || [];
  atualizarTelaSelecao(dados.nomeCampanha);
});

socket.on('personagens_campanha_atualizados', (novos) => {
  listaPersonagensCampanha = novos;
  atualizarTelaSelecao();
});

function atualizarTelaSelecao(nomeCamp) {
  const aviso = document.getElementById('aviso-campanha');
  const lista = document.getElementById('lista-escolha-agentes');
  lista.innerHTML = '';

  if (!campanhaAtivaId) {
    if (aviso) aviso.innerText = 'Aguardando o Mestre abrir uma missão no Cockpit...';
    return;
  }
  if (aviso) aviso.innerText = `Missão: ${nomeCamp || 'Ativa'} — Selecione seu Agente:`;

  if (listaPersonagensCampanha.length === 0) {
    lista.innerHTML = '<p style="font-size:0.8rem; color:#717182; text-align:center;">Nenhum agente na campanha.</p>';
    return;
  }

  listaPersonagensCampanha.forEach(ag => {
    const btn = document.createElement('div');
    btn.className = 'btn-agente-seletor-card';
    btn.innerHTML = `<span>${ag.nome}</span> <span style="color:#a855f7; font-size:0.8rem;">ACESSAR ➔</span>`;
    btn.onclick = () => carregarFichaAgente(ag);
    lista.appendChild(btn);
  });
}

function carregarFichaAgente(agente) {
  agenteAtual = agente;
  document.getElementById('seletor-agente').style.display = 'none';

  // Define a cor do dado baseado na Classe do Agente
  const classe = (agente.classe || '').toLowerCase();
  let corDado = '#b91c1c'; // Padrão: Vermelho Sangue
  if (classe.includes('ocultista')) corDado = '#9333ea'; // Ocultista = Roxo
  else if (classe.includes('especialista')) corDado = '#eab308'; // Especialista = Amarelo
  else if (classe.includes('combatente')) corDado = '#dc2626'; // Combatente = Vermelho

  if (window.diceBox) {
    window.diceBox.updateConfig({ themeColor: corDado });
  }

  document.getElementById('ficha-nome').innerText = agente.nome;
  document.getElementById('ficha-jogador').innerText = agente.jogador || 'Agente';
  document.getElementById('ficha-origem').innerText = agente.origem || 'Sobrevivente';
  document.getElementById('ficha-classe').innerText = agente.classe || 'Especialista';

  document.getElementById('val-agi').innerText = agente.atributos?.AGI || 1;
  document.getElementById('val-for').innerText = agente.atributos?.FOR || 1;
  document.getElementById('val-int').innerText = agente.atributos?.INT || 1;
  document.getElementById('val-pre').innerText = agente.atributos?.PRE || 1;
  document.getElementById('val-vig').innerText = agente.atributos?.VIG || 1;

  document.getElementById('val-nex').innerText = agente.nex || '5%';
  document.getElementById('val-pe-rodada').innerText = agente.peRodada || (agente.atributos?.PRE || 1);

  const agi = agente.atributos?.AGI || 1;
  const defEquip = agente.defesaEquip || 0;
  const defTotal = 10 + agi + defEquip;
  document.getElementById('val-defesa-total').innerText = defTotal;
  document.getElementById('val-defesa-equip').innerText = defEquip;
  document.getElementById('val-bloqueio').innerText = agente.atributos?.FOR || 1;
  document.getElementById('val-esquiva').innerText = defTotal + agi;

  atualizarDisplaysStatus();
  renderizarTabelaPericias();
  renderizarInventario('todos');
  renderizarHabilidades();
  atualizarImagemAvatar();
}

function atualizarDisplaysStatus() {
  document.getElementById('display-pv').innerText = `${agenteAtual.pv} / ${agenteAtual.pvMax || agenteAtual.pv}`;
  document.getElementById('display-san').innerText = `${agenteAtual.san} / ${agenteAtual.sanMax || agenteAtual.san}`;
  document.getElementById('display-pe').innerText = `${agenteAtual.pe} / ${agenteAtual.peMax || agenteAtual.pe}`;
}

function alterarStatus(tipo, delta) {
  if (!agenteAtual) return;
  const maxKey = `${tipo}Max`;
  const maxVal = agenteAtual[maxKey] || 99;
  agenteAtual[tipo] = Math.max(0, Math.min(maxVal, agenteAtual[tipo] + delta));
  atualizarDisplaysStatus();
  socket.emit('atualizar_dados_personagem', { campanhaId: campanhaAtivaId, personagem: agenteAtual });
}

// PERÍCIAS
let destreinadasVisiveis = false;

function renderizarTabelaPericias() {
  const tbody = document.getElementById('lista-pericias-tbody');
  tbody.innerHTML = '';
  const periciasTreinadas = agenteAtual.pericias || [];

  TABELA_PERICIAS_ORDEM.forEach(p => {
    const cadastro = periciasTreinadas.find(item => item.nome.toLowerCase() === p.nome.toLowerCase());
    const ehTreinada = cadastro && cadastro.treinada;
    const treinoVal = ehTreinada ? 5 : 0;
    const outros = cadastro?.outros || 0;
    const totalBonus = treinoVal + outros;

    let sufixo = '';
    if (p.penTreino) sufixo += '+';
    if (p.treinadoApenas) sufixo += '*';

    const tr = document.createElement('tr');
    tr.className = ehTreinada ? 'pericia-treinada-row' : 'pericia-destreinada-row';
    if (destreinadasVisiveis && !ehTreinada) tr.classList.add('show');

    tr.innerHTML = `
      <td class="pericia-nome-cell" onclick="rolarPericia('${p.nome}', '${p.attr}', ${totalBonus})">
        <svg class="d20-icon-mini" viewBox="0 0 24 24"><polygon points="12,2 22,8.5 22,15.5 12,22 2,15.5 2,8.5" fill="none" stroke="currentColor" stroke-width="1.8"/><line x1="12" y1="2" x2="12" y2="22" stroke="currentColor" stroke-width="1.2"/><line x1="2" y1="8.5" x2="22" y2="8.5" stroke="currentColor" stroke-width="1.2"/></svg>
        ${ehTreinada ? '<span class="indicador-treino"></span>' : ''}
        <span>${p.nome}${sufixo}</span>
      </td>
      <td class="pericia-destaque">( ${p.attr} )</td>
      <td class="pericia-destaque">( ${totalBonus} )</td>
      <td><span class="pericia-treino-val">${treinoVal}</span></td>
      <td><span class="pericia-treino-val">${outros}</span></td>
    `;
    tbody.appendChild(tr);
  });
}

function toggleDestreinadas() {
  destreinadasVisiveis = !destreinadasVisiveis;
  const linhas = document.querySelectorAll('.pericia-destreinada-row');
  linhas.forEach(linha => {
    if (destreinadasVisiveis) linha.classList.add('show');
    else linha.classList.remove('show');
  });
  document.getElementById('btn-toggle-destreinadas').innerText = destreinadasVisiveis ? 'Ocultar Perícias Destreinadas' : 'Mostrar Todas as Perícias';
}

function mudarAbaDireita(aba) {
  document.querySelectorAll('.tab-dir-btn').forEach(b => b.classList.remove('ativa'));
  document.querySelectorAll('.subpainel-direita').forEach(p => p.classList.remove('ativo'));

  if (aba === 'pericias') { document.querySelectorAll('.tab-dir-btn')[0].classList.add('ativa'); document.getElementById('painel-pericias').classList.add('ativo'); }
  else if (aba === 'inventario') { document.querySelectorAll('.tab-dir-btn')[1].classList.add('ativa'); document.getElementById('painel-inventario').classList.add('ativo'); }
  else if (aba === 'habilidades') { document.querySelectorAll('.tab-dir-btn')[2].classList.add('ativa'); document.getElementById('painel-habilidades').classList.add('ativo'); }
}

// INVENTÁRIO & ARMAS (COM ATAQUE E DANO SEPARADOS)
function filtrarInventario(filtro) {
  document.querySelectorAll('.subtab-inv').forEach(b => b.classList.remove('ativa'));
  event.target.classList.add('ativa');
  renderizarInventario(filtro);
}

function renderizarInventario(filtro = 'todos') {
  const container = document.getElementById('lista-itens-cris');
  container.innerHTML = '';
  let itensMostrar = [];

  if (filtro === 'todos' || filtro === 'armas') {
    (agenteAtual.armas || []).forEach(a => itensMostrar.push({ ...a, isArma: true, tipo: 'armas' }));
  }
  if (filtro === 'todos' || filtro !== 'armas') {
    (agenteAtual.inventario || []).forEach((it, idx) => {
      if (filtro === 'todos' || it.tipo === filtro) itensMostrar.push({ ...it, originalIndex: idx });
    });
  }

  if (itensMostrar.length === 0) {
    container.innerHTML = '<p style="font-size:0.8rem; color:#717182; text-align:center; padding:12px;">Nenhum item nesta aba.</p>';
    return;
  }

  itensMostrar.forEach(it => {
    let btnAcao = '';
    
    // Se for arma, mostra os botões Teste(D20) e Dano(Dx)
    if (it.isArma) {
      btnAcao = `
        <div style="display:flex; gap:6px;">
          <button class="btn-inv-acao" style="background:#1c1c28; border:1px solid #3f3f54;" onclick="rolarAtaqueArmaMock('${it.nome}', '${it.dadosAttr}', ${it.bonus || 0})">🎯 TESTE</button>
          <button class="btn-inv-acao" style="background:#991b1b;" onclick="rolarDanoFisico('${it.nome}', '${it.dano}')">🩸 DANO</button>
        </div>
      `;
    } 
    else if (it.tipo === 'consumivel') btnAcao = `<button class="btn-inv-acao" onclick="usarItem(${it.originalIndex})">USAR (${it.qtd || 1})</button>`;
    else if (it.tipo === 'equipamento') btnAcao = `<button class="btn-inv-acao" style="background:#2563eb;" onclick="alternarEquip(${it.originalIndex})">${it.equipado ? 'EQUIPADO' : 'EQUIPAR'}</button>`;

    const card = document.createElement('div');
    card.className = 'card-item-cris';
    card.innerHTML = `
      <div><div style="font-weight:800; color:#fff; font-size:0.85rem;">${it.nome}</div><div style="font-size:0.72rem; color:#9494a8; margin-top:2px;">${it.dano ? '<span style="color:#fca5a5;">Dano: ' + it.dano + '</span> | ' : ''}${it.desc || ''}</div></div>
      <div>${btnAcao}</div>
    `;
    container.appendChild(card);
  });
}

function usarItem(idx) {
  const it = agenteAtual.inventario[idx];
  if (!it) return;
  it.qtd = (it.qtd || 1) - 1;
  if (it.curaPv) alterarStatus('pv', it.curaPv);
  if (it.curaSan) alterarStatus('san', it.curaSan);
  if (it.qtd <= 0) agenteAtual.inventario.splice(idx, 1);
  renderizarInventario('todos');
}

function alternarEquip(idx) {
  const it = agenteAtual.inventario[idx];
  if (!it) return;
  it.equipado = !it.equipado;
  renderizarInventario('todos');
  socket.emit('atualizar_dados_personagem', { campanhaId: campanhaAtivaId, personagem: agenteAtual });
}

function renderizarHabilidades() {
  const container = document.getElementById('lista-habilidades-cris');
  container.innerHTML = '';
  const habs = agenteAtual.habilidades || [];
  if (habs.length === 0) {
    container.innerHTML = '<p style="font-size:0.8rem; color:#717182; text-align:center; padding:12px;">Nenhuma habilidade registrada.</p>';
    return;
  }
  habs.forEach(h => {
    const card = document.createElement('div');
    card.className = 'card-item-cris';
    card.innerHTML = `<div><div style="font-weight:800; color:#fff; font-size:0.85rem;">${h.titulo} <small style="color:#a855f7;">(${h.custo || 'Passiva'})</small></div><div style="font-size:0.75rem; color:#9494a8; margin-top:3px;">${h.desc}</div></div>`;
    container.appendChild(card);
  });
}

// ================= MOTOR DE FÍSICA 3D (ATAQUES E DANO) =================
function rolarAtributo(nome, val) { executarRolagemD20(`TESTE DE ${nome.toUpperCase()}`, Math.max(1, val), 0); }
function rolarPericia(nome, attr, bonus) { executarRolagemD20(`PERÍCIA: ${nome.toUpperCase()}`, Math.max(1, agenteAtual.atributos[attr] || 1), bonus); }

// Apenas o Acerto (D20s)
function rolarAtaqueArmaMock(nome, attr, bonus) {
  const qtdDados = Math.max(1, agenteAtual.atributos[attr] || 1);
  executarRolagemD20(`ATAQUE: ${nome.toUpperCase()}`, qtdDados, bonus);
}

// Lançamento dos dados físicos de Dano (D6, D8, etc)
function rolarDanoFisico(nomeArma, formulaDano) {
  if (!formulaDano) { alert("Esta arma não possui fórmula de dano configurada."); return; }

  // Lê a expressão escrita pela IA/Jogador (Ex: "1d8", "2d6+2")
  const regex = /^(\d+d\d+)\s*(?:([+-])\s*(\d+))?/i;
  const match = formulaDano.trim().match(regex);

  if (!match) { alert("A fórmula de dano precisa ser algo como 1d8, 2d6 ou 1d10+2"); return; }

  const notacao = match[1]; // Ex: "1d8"
  const sinal = match[2] || '+';
  let bonus = parseInt(match[3]) || 0;
  if (sinal === '-') bonus *= -1;

  executarRolagemDano(`DANO: ${nomeArma.toUpperCase()}`, notacao, bonus);
}

// ==== Função 1: Rolagens de D20 (Testes/Ataques) ====
// ==== Função 1: Rolagens de D20 (Testes/Ataques) ====
async function executarRolagemD20(titulo, qtdBase, bonus) {
  if (!window.diceBoxReady || !window.diceBox) { alert("A física dos dados está inicializando!"); return; }
  
  if (rolandoAgora) return;
  rolandoAgora = true;
  
  if (timerLimparDado) clearTimeout(timerLimparDado);
  window.diceBox.clear();
  
  const toast = document.getElementById('toast-rolagem');
  toast.classList.remove('show');
  
  // Define a cor baseada na classe
  const classe = (agenteAtual?.classe || '').toLowerCase();
  let corCorpo = '#9333ea';
  if (classe.includes('especialista')) corCorpo = '#eab308';
  else if (classe.includes('combatente')) corCorpo = '#dc2626';

  toast.style.borderLeftColor = corCorpo;
  document.getElementById('toast-texto').style.color = '#fff';
  document.getElementById('toast-texto').style.textShadow = `0 0 15px ${corCorpo}99`;
  
  // APLICAÇÃO DA REGRA DO ORDO REALITAS (Vantagem / Desvantagem)
  const mod = window.modificadorDadoJogador || 'normal';
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
  
  try {
    const resultado = await window.diceBox.roll(`${qtdReal}d20`);
    
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
    if (rolagens.length === 0) rolagens.push(Math.floor(Math.random() * 20) + 1);

    // Seleção de Melhor/Pior
    let valorDado = 0;
    let strMod = '';
    
    if (vaiPegarPior) {
      valorDado = Math.min(...rolagens);
      strMod = `0 Dados (Pior de 2)`;
    } else {
      valorDado = Math.max(...rolagens);
      if (mod === 'vantagem') strMod = `Vantagem`;
      else if (mod === 'desvantagem') strMod = `Desvantagem`;
    }

    const total = valorDado + bonus;
    
    let detalhes = `[${rolagens.join(', ')}] | ${strMod ? strMod + ' ➔ ' : ''}Dado: ${valorDado}`;
    if (bonus > 0) detalhes += ` + Bônus: ${bonus}`;

    document.getElementById('toast-titulo').innerText = titulo;
    document.getElementById('toast-texto').innerText = total;
    document.getElementById('toast-detalhe-info').innerText = detalhes;
    toast.classList.add('show');

    socket.emit('rolagem_jogador', { jogador: agenteAtual.nome, teste: titulo, total: total, detalhes: detalhes });

    // REVERTE O BOTÃO PARA NORMAL AUTOMATICAMENTE APÓS A ROLAGEM
    window.setModificadorJogador('normal');

    timerLimparDado = setTimeout(() => {
      window.diceBox.clear();
      toast.classList.remove('show');
    }, 3500);

  } catch (err) { console.error(err); window.diceBox.clear(); }
  finally { rolandoAgora = false; }
}

// ==== Função 2: Rolagens Poliedros de Dano ====
async function executarRolagemDano(titulo, notacao, bonus) {
  if (!window.diceBoxReady || !window.diceBox) return;
  
  if (rolandoAgora) return;
  rolandoAgora = true;
  
  if (timerLimparDado) clearTimeout(timerLimparDado);
  window.diceBox.clear();

  const toast = document.getElementById('toast-rolagem');
  toast.classList.remove('show');

  // Muda o visual do Pop-up para Vermelho Sangue (Indicar que é Dano)
  toast.style.borderLeftColor = '#ef4444';
  document.getElementById('toast-texto').style.color = '#fca5a5';
  document.getElementById('toast-texto').style.textShadow = '0 0 15px rgba(239,68,68,0.8)';
  
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

    // No dano, nós SOMAMOS todos os dados que caíram
    const somaDados = rolagens.reduce((a, b) => a + b, 0);
    const total = somaDados + bonus;
    
    let detalhes = `[${rolagens.join(' + ')}]`;
    if (bonus !== 0) detalhes += ` ${bonus > 0 ? '+' : ''} ${bonus}`;

    document.getElementById('toast-titulo').innerText = titulo;
    document.getElementById('toast-texto').innerText = total;
    document.getElementById('toast-detalhe-info').innerText = detalhes;
    toast.classList.add('show');

    socket.emit('rolagem_jogador', { jogador: agenteAtual.nome, teste: titulo, total: total, detalhes: detalhes });

    timerLimparDado = setTimeout(() => {
      window.diceBox.clear();
      toast.classList.remove('show');
    }, 3500);

  } catch (err) { console.error(err); window.diceBox.clear(); }
  finally { rolandoAgora = false; }
}

// ==========================================
// UPLOAD DE AVATAR DO JOGADOR
// ==========================================
window.fazerUploadAvatar = async function(input) {
  if (!input.files || !input.files[0] || !agenteAtual) return;
  
  const formData = new FormData();
  formData.append('file', input.files[0]);
  
  try {
    // Usa a mesma rota inteligente de arquivos que fizemos pro Mestre!
    const res = await fetch('/api/upload', { method: 'POST', body: formData });
    const data = await res.json();
    
    // Salva a URL da imagem na ficha
    agenteAtual.avatar = data.url;
    
    atualizarImagemAvatar();
    
    // Avisa o servidor e o Mestre que a ficha mudou
    socket.emit('atualizar_dados_personagem', { campanhaId: campanhaAtivaId, personagem: agenteAtual });
    
  } catch (e) {
    console.error("Erro no upload do avatar:", e);
    alert("Falha ao enviar a imagem. Verifique o servidor.");
  }
};

function atualizarImagemAvatar() {
  const divAvatar = document.getElementById('ficha-avatar');
  const textoAvatar = document.getElementById('texto-avatar');
  
  if (!divAvatar) return;

  if (agenteAtual && agenteAtual.avatar) {
    divAvatar.style.backgroundImage = `url('${agenteAtual.avatar}')`;
    if (textoAvatar) textoAvatar.style.display = 'none';
  } else {
    divAvatar.style.backgroundImage = 'none';
    if (textoAvatar) textoAvatar.style.display = 'block';
  }
}

// ==========================================
// RECEBER DANO DO MESTRE (SINCRONIZAÇÃO)
// ==========================================

// 1. Cria a div do flash vermelho e o container de toasts dinamicamente
document.addEventListener('DOMContentLoaded', () => {
  const overlayDano = document.createElement('div');
  overlayDano.id = 'overlay-dano';
  document.body.appendChild(overlayDano);

  const toastContainer = document.createElement('div');
  toastContainer.id = 'toast-jogador-container';
  document.body.appendChild(toastContainer);
});

function mostrarToastDano(mensagem) {
  const container = document.getElementById('toast-jogador-container');
  if(!container) return;
  const toast = document.createElement('div');
  toast.className = 'toast-jogador';
  toast.innerHTML = `🩸 ${mensagem}`;
  container.appendChild(toast);
  setTimeout(() => { if(toast.parentNode) toast.parentNode.removeChild(toast); }, 4000);
}

// 2. Escuta o servidor avisando que a ficha mudou
socket.on('alerta_status_agente_atualizado', ({ campanhaId, personagem }) => {
  // Verifica se a atualização é para o personagem que este jogador está usando
  if (typeof agenteAtual !== 'undefined' && agenteAtual && agenteAtual.id === personagem.id) {
    
    // Calcula se tomou dano
    const danoTomado = agenteAtual.pv - personagem.pv;
    const curado = personagem.pv - agenteAtual.pv;

    // Atualiza a variável local
    agenteAtual = personagem;
    
    // Atualiza o HTML da barra de vida (ajuste os IDs conforme o seu jogador.js atualiza a tela)
    const displayPv = document.getElementById('display-pv');
    if (displayPv) displayPv.innerText = `${agenteAtual.pv} / ${agenteAtual.pvMax || agenteAtual.pv}`;

    // Se tomou dano, pisca a tela e mostra o aviso!
    if (danoTomado > 0) {
      mostrarToastDano(`VOCÊ SOFREU ${danoTomado} DE DANO!`);
      
      const overlay = document.getElementById('overlay-dano');
      if (overlay) {
        overlay.classList.remove('piscar-dano');
        void overlay.offsetWidth; // Força o reflow para reiniciar a animação
        overlay.classList.add('piscar-dano');
      }
    } else if (curado > 0) {
      mostrarToastDano(`Você recuperou ${curado} PV!`);
    }
  }
});