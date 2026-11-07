const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const app = express();
const server = http.createServer(app);

// 1. Limite do Socket.io para 50MB (mapas e tokens)
const io = new Server(server, {
  maxHttpBufferSize: 5e7
});

// 2. Limite do Express para 50MB
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.get('/favicon.ico', (req, res) => res.status(204).end());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/dice-box', express.static(path.join(__dirname, 'node_modules', '@3d-dice', 'dice-box', 'dist')));

// --- CONFIGURAÇÃO DE UPLOAD DE ARQUIVOS (MULTER) ---
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, 'public', 'uploads');
    if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Nenhum arquivo recebido' });
  res.json({ url: '/uploads/' + req.file.filename });
});

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

let salvandoTimer = null;
function salvarCampanhas() {
  if (salvandoTimer) clearTimeout(salvandoTimer);
  salvandoTimer = setTimeout(() => {
    try {
      const dados = JSON.stringify(memoriaCampanhas, null, 2);
      fs.writeFile(DATA_FILE, dados, 'utf-8', (err) => {
        if (err) console.error("Erro ao salvar campanhas no disco:", err);
      });
    } catch (e) {
      console.error("Erro na serialização das campanhas:", e);
    }
  }, 100);
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
  if (!nova || !nova.id) return res.status(400).json({ error: 'Campanha inválida' });
  const idx = memoriaCampanhas.findIndex(c => String(c.id) === String(nova.id));
  if (idx >= 0) memoriaCampanhas[idx] = nova;
  else memoriaCampanhas.push(nova);
  salvarCampanhas();
  res.json({ status: 'ok', campanha: nova });
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
    const idx = camp.personagens.findIndex(antigo => String(antigo.id) === String(p.id) || antigo.nome === p.nome);
    if (idx >= 0) camp.personagens[idx] = p; else camp.personagens.push(p);
  });
  salvarCampanhas();

  if (String(estadoGlobal.campanhaAtivaId) === String(req.params.id)) {
    io.emit('personagens_campanha_atualizados', camp.personagens);
  }
  res.json({ status: 'ok', personagens: camp.personagens });
});

let estadoVTT = { mapaAtivoUrl: '/uploads/mansao_tipora.webp', emStandby: false, standbyImg: '' };

io.on('connection', (socket) => {
  let campAtiva = null;
  if (estadoGlobal.campanhaAtivaId) {
    campAtiva = memoriaCampanhas.find(c => String(c.id) === String(estadoGlobal.campanhaAtivaId));
  } else if (memoriaCampanhas.length > 0) {
    campAtiva = memoriaCampanhas[0];
    estadoGlobal.campanhaAtivaId = campAtiva.id;
  }
  if (campAtiva && campAtiva.tabuleiro && campAtiva.tabuleiro.mapaAtivoUrl) {
    estadoVTT.mapaAtivoUrl = campAtiva.tabuleiro.mapaAtivoUrl;
  }
  socket.emit('sincronizar_estado_inicial', {
    ...estadoGlobal,
    personagensCampanha: campAtiva ? campAtiva.personagens || [] : []
  });

  socket.on('mestre_selecionou_campanha', (campanhaId) => {
    estadoGlobal.campanhaAtivaId = campanhaId;
    const camp = memoriaCampanhas.find(c => String(c.id) === String(campanhaId));
    if (camp && camp.tabuleiro && camp.tabuleiro.mapaAtivoUrl) {
      estadoVTT.mapaAtivoUrl = camp.tabuleiro.mapaAtivoUrl;
    }
    io.emit('campanha_ativa_alterada', {
      campanhaId: campanhaId,
      nomeCampanha: camp ? camp.nome : '',
      personagens: camp ? camp.personagens || [] : []
    });
  });

  socket.on('tv_atualizar_iniciativa', (dados) => io.emit('tv_atualizar_iniciativa', dados));

  socket.on('tv_solicitar_mapa_ativo', () => {
    let mapaUrl = estadoVTT.mapaAtivoUrl || '/uploads/mansao_tipora.webp';
    let tokens = [];
    let cam = null;
    let camp = null;
    if (estadoGlobal.campanhaAtivaId) {
      camp = memoriaCampanhas.find(c => String(c.id) === String(estadoGlobal.campanhaAtivaId));
    }
    if (!camp && memoriaCampanhas.length > 0) camp = memoriaCampanhas[0];
    if (camp && camp.tabuleiro) {
      if (camp.tabuleiro.mapaAtivoUrl) mapaUrl = camp.tabuleiro.mapaAtivoUrl;
      if (camp.tabuleiro.tokens) tokens = camp.tabuleiro.tokens;
      if (camp.tabuleiro.camera) cam = camp.tabuleiro.camera;
    }
    estadoVTT.mapaAtivoUrl = mapaUrl;
    if (estadoGlobal.modo === 'cena' && estadoGlobal.cenaAtiva) {
      socket.emit('tv_mostrar_cena', estadoGlobal.cenaAtiva);
    } else {
      socket.emit('tv_trocar_mapa', mapaUrl);
      if (tokens && tokens.length > 0) socket.emit('tv_atualizar_tokens', tokens);
      if (cam) socket.emit('tv_aplicar_camera', cam);
    }
    if (estadoGlobal.pistaAbertaUrl) {
      socket.emit('tv_mostrar_handout', estadoGlobal.pistaAbertaUrl);
    }
    socket.emit('tv_definir_standby', { emStandby: estadoVTT.emStandby, mapaAtivoUrl: mapaUrl, standbyImg: estadoVTT.standbyImg });
  });

  // Handler unificado de status do agente
  socket.on('atualizar_dados_personagem', ({ campanhaId, personagem }) => {
    if (!personagem) return;
    const cIdx = memoriaCampanhas.findIndex(c => String(c.id) === String(campanhaId));
    if (cIdx >= 0) {
      if (!memoriaCampanhas[cIdx].personagens) memoriaCampanhas[cIdx].personagens = [];
      const lista = memoriaCampanhas[cIdx].personagens;
      const pIdx = lista.findIndex(p => (personagem.id && String(p.id) === String(personagem.id)) || p.nome === personagem.nome);
      if (pIdx >= 0) {
        lista[pIdx] = { ...lista[pIdx], ...personagem };
      } else {
        lista.push(personagem);
      }
      salvarCampanhas();
      io.emit('sincronizar_ficha_atualizada', { campanhaId, personagem });
      io.emit('alerta_status_agente_atualizado', { campanhaId, personagem });
      if (String(estadoGlobal.campanhaAtivaId) === String(campanhaId)) {
        io.emit('personagens_campanha_atualizados', lista);
      }
    }
  });

  socket.emit('tv_sincronizar_inicial', {
    ...estadoVTT,
    modo: estadoGlobal.modo,
    cenaAtiva: estadoGlobal.cenaAtiva,
    pistaAbertaUrl: estadoGlobal.pistaAbertaUrl
  });
  socket.on('tv_definir_standby', (dados) => {
    estadoVTT.emStandby = dados.emStandby;
    if (dados.standbyImg !== undefined) estadoVTT.standbyImg = dados.standbyImg;
    if (dados.mapaAtivoUrl) estadoVTT.mapaAtivoUrl = dados.mapaAtivoUrl;
    io.emit('tv_definir_standby', dados);
    if (dados.emStandby) {
      io.emit('voltar_standby', { imagemStandby: dados.standbyImg });
    }
  });

  socket.on('tv_trocar_mapa', (url) => { estadoGlobal.modo = 'tabuleiro'; estadoVTT.mapaAtivoUrl = url; io.emit('tv_trocar_mapa', url); });
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

  socket.on('rolagem_jogador', (dados) => { io.emit('alerta_rolagem_mesa', dados); });

  // Sistema de Handouts (Pistas) para TV e Tablet
  socket.on('tv_mostrar_handout', (url) => {
    estadoGlobal.pistaAbertaUrl = url;
    io.emit('tv_mostrar_handout', url);
    io.emit('mostrar_handout_tablet', url);
  });
  socket.on('tv_esconder_handout', () => {
    estadoGlobal.pistaAbertaUrl = null;
    io.emit('tv_esconder_handout');
    io.emit('fechar_handout_tablet');
  });

  // Cenários do Tablet e TV
  socket.on('transmitir_cena_tablet', (dados) => {
    estadoGlobal.modo = 'cena';
    estadoGlobal.cenaAtiva = dados;
    io.emit('atualizar_tablet', dados);
    io.emit('tv_mostrar_cena', dados);
  });
  socket.on('tv_mostrar_cena', (dados) => {
    estadoGlobal.modo = 'cena';
    estadoGlobal.cenaAtiva = dados;
    io.emit('tv_mostrar_cena', dados);
  });
});

server.listen(3000, '0.0.0.0', () => console.log(`Servidor rodando em http://localhost:3000`));
