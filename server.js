const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const fs = require('fs');
const path = require('path');

const app = express();
const server = http.createServer(app);

// 1. Aumentamos o limite do Socket.io para 50MB (para permitir o tráfego dos mapas e tokens)
const io = new Server(server, {
  maxHttpBufferSize: 5e7 // 50.000.000 bytes = 50MB
});

// 2. Aumentamos o limite do Express para 50MB (para requisições comuns)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/dice-box', express.static(path.join(__dirname, 'node_modules', '@3d-dice', 'dice-box', 'dist')));

// ================= BANCO DE DADOS BLINDADO CONTRA CORRUPÇÃO =================
const DATA_FILE = path.join(__dirname, 'campanhas.json');
let memoriaCampanhas = [];

function carregarBanco() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      if (fs.existsSync(DATA_FILE + '.bak')) {
        fs.copyFileSync(DATA_FILE + '.bak', DATA_FILE);
      } else {
        fs.writeFileSync(DATA_FILE, '[]', 'utf-8');
      }
    }
    let conteudo = fs.readFileSync(DATA_FILE, 'utf-8').trim();
    // Recupera do backup se o arquivo principal zerou por reiniciar
    if (!conteudo && fs.existsSync(DATA_FILE + '.bak')) {
      conteudo = fs.readFileSync(DATA_FILE + '.bak', 'utf-8').trim();
    }
    memoriaCampanhas = conteudo ? JSON.parse(conteudo) : [];
  } catch (err) {
    console.error("Erro ao ler banco:", err);
    memoriaCampanhas = [];
  }
}
carregarBanco();

// SUBSTITUA ESTA FUNÇÃO NO SERVER.JS
function salvarCampanhas() {
  const dados = JSON.stringify(memoriaCampanhas, null, 2);
  
  // Usa writeFile assíncrono ao invés de writeFileSync
  fs.writeFile(DATA_FILE, dados, 'utf-8', (err) => {
    if (err) {
      console.error("Erro ao salvar campanhas no disco:", err);
    }
  });
}

let estadoGlobal = {
  modo: 'standby',
  campanhaAtivaId: null,
  cenaAtiva: null,
  imagemStandbyPersonalizada: '',
  pistaAbertaUrl: null,
  estadoMapa: { ativo: false, mapaUrl: '', tokens: [] }
};

app.get('/api/campanhas', (req, res) => res.json(memoriaCampanhas));

app.post('/api/campanhas', (req, res) => {
  const nova = req.body;
  const idx = memoriaCampanhas.findIndex(c => String(c.id) === String(nova.id));
  if (idx >= 0) memoriaCampanhas[idx] = nova;
  else memoriaCampanhas.push(nova);
  salvarCampanhas();
  res.json({ status: 'ok' });
});

app.delete('/api/campanhas/:id', (req, res) => {
  memoriaCampanhas = memoriaCampanhas.filter(c => String(c.id) !== String(req.params.id));
  salvarCampanhas();
  res.json({ status: 'ok' });
});

app.post('/api/campanhas/:id/personagens', (req, res) => {
  const camp = memoriaCampanhas.find(c => String(c.id) === String(req.params.id));
  if (!camp) return res.status(404).json({ error: 'Campanha não encontrada' });
  if (!camp.personagens) camp.personagens = [];

  const lista = Array.isArray(req.body) ? req.body : [req.body];
  lista.forEach(p => {
    const idx = camp.personagens.findIndex(antigo => String(antigo.id) === String(p.id));
    if (idx >= 0) camp.personagens[idx] = p; else camp.personagens.push(p);
  });
  salvarCampanhas();

  if (String(estadoGlobal.campanhaAtivaId) === String(req.params.id)) io.emit('personagens_campanha_atualizados', camp.personagens);
  res.json({ status: 'ok', personagens: camp.personagens });
});

let estadoVTT = { mapaAtivoUrl: '', emStandby: true, standbyImg: '' };

io.on('connection', (socket) => {
  let campAtiva = null;
  if (estadoGlobal.campanhaAtivaId) campAtiva = memoriaCampanhas.find(c => String(c.id) === String(estadoGlobal.campanhaAtivaId));
  socket.emit('sincronizar_estado_inicial', { ...estadoGlobal, personagensCampanha: campAtiva ? campAtiva.personagens || [] : [] });

  socket.on('mestre_selecionou_campanha', (campanhaId) => {
    estadoGlobal.campanhaAtivaId = campanhaId;
    const camp = memoriaCampanhas.find(c => String(c.id) === String(campanhaId));
    io.emit('campanha_ativa_alterada', { campanhaId: campanhaId, nomeCampanha: camp ? camp.nome : '', personagens: camp ? camp.personagens || [] : [] });
  });

  // Salva os status do jogador e avisa o Mestre
  socket.on('atualizar_dados_personagem', ({ campanhaId, personagem }) => {
    const cIdx = memoriaCampanhas.findIndex(c => String(c.id) === String(campanhaId));
    if (cIdx >= 0) {
      const pIdx = memoriaCampanhas[cIdx].personagens.findIndex(p => p.nome === personagem.nome);
      if (pIdx >= 0) {
        // Atualiza a ficha no servidor e salva no JSON
        memoriaCampanhas[cIdx].personagens[pIdx] = personagem;
        salvarCampanhas();
        // Avisa apenas para atualizar as telas (Mestre e outros possíveis jogadores)
        io.emit('sincronizar_ficha_atualizada', { campanhaId, personagem });
      }
    }
  });

  socket.emit('tv_sincronizar_inicial', estadoVTT);
  socket.on('tv_definir_standby', (dados) => {
    estadoVTT.emStandby = dados.emStandby;
    if (dados.standbyImg !== undefined) estadoVTT.standbyImg = dados.standbyImg;
    if (dados.mapaAtivoUrl) estadoVTT.mapaAtivoUrl = dados.mapaAtivoUrl;
    io.emit('tv_definir_standby', dados);
  });

  socket.on('tv_trocar_mapa', (url) => { estadoVTT.mapaAtivoUrl = url; io.emit('tv_trocar_mapa', url); });
  socket.on('tv_rolar_dado_box', (dados) => io.emit('tv_rolar_dado_box', dados));
  socket.on('tv_desenhar_traco', (dados) => io.emit('tv_desenhar_traco', dados));
  socket.on('tv_atualizar_desenho', (dataUrl) => io.emit('tv_atualizar_desenho', dataUrl));
  socket.on('tv_limpar_desenho', () => io.emit('tv_limpar_desenho'));
  socket.on('tv_atualizar_fog', (dataUrl) => io.emit('tv_atualizar_fog', dataUrl));
  socket.on('tv_fog_cover_all', () => io.emit('tv_fog_cover_all'));
  socket.on('tv_fog_reveal_all', () => io.emit('tv_fog_reveal_all'));
  socket.on('tv_desenhar_fog', (dados) => io.emit('tv_desenhar_fog', dados));
  socket.on('tv_atualizar_regua', (dados) => io.emit('tv_atualizar_regua', dados));
  socket.on('tv_limpar_regua', () => io.emit('tv_limpar_regua'));
  socket.on('tv_ping', (dados) => io.emit('tv_ping', dados));
  socket.on('tv_atualizar_tokens', (tokens) => io.emit('tv_atualizar_tokens', tokens));
  socket.on('tv_aplicar_camera', (cam) => io.emit('tv_aplicar_camera', cam));

  socket.on('salvar_tabuleiro', ({ campanhaId, tabuleiro }) => {
    const idx = memoriaCampanhas.findIndex(c => String(c.id) === String(campanhaId));
    if (idx >= 0) {
      memoriaCampanhas[idx].tabuleiro = tabuleiro;
      salvarCampanhas();
    }
  });
  
  socket.on('atualizar_dados_personagem', ({ campanhaId, personagem }) => {
    const camp = memoriaCampanhas.find(c => String(c.id) === String(campanhaId));
    if (camp && camp.personagens) {
      const idx = camp.personagens.findIndex(p => String(p.id) === String(personagem.id));
      if (idx >= 0) {
        camp.personagens[idx] = personagem;
        salvarCampanhas();
        io.emit('alerta_status_agente_atualizado', { campanhaId, personagem });
      }
    }
  });

  socket.on('rolagem_jogador', (dados) => { io.emit('alerta_rolagem_mesa', dados); });

  // Sistema de Handouts (Pistas) na TV
  socket.on('tv_mostrar_handout', (url) => io.emit('tv_mostrar_handout', url));
  socket.on('tv_esconder_handout', () => io.emit('tv_esconder_handout'));
});



server.listen(3000, '0.0.0.0', () => console.log(`Servidor rodando em http://localhost:3000`));