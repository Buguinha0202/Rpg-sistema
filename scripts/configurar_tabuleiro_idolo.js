const fs = require('fs');
const path = require('path');

const campanhasPath = path.join(__dirname, '..', 'campanhas.json');
const campanhas = JSON.parse(fs.readFileSync(campanhasPath, 'utf8'));

const idoloIndex = campanhas.findIndex(c => c.id === 'a-maldicao-do-idolo-de-pedra');
if (idoloIndex === -1) {
  console.error('Campanha a-maldicao-do-idolo-de-pedra não encontrada!');
  process.exit(1);
}

const c = campanhas[idoloIndex];

// 1. Configurar os tokens iniciais na posição canônica do início da missão no Porão
const initialTokens = [
  {
    id: "tok_alan",
    nome: "Alan",
    img: "/uploads/idolo_pedra/tokens/Token - Alan.png",
    pv: 9,
    pvMax: 10,
    defesa: 12,
    x: 51.5,
    y: 25.5,
    tamanho: 70,
    escala: 1,
    visivel: true,
    isMonstro: false,
    ataques: [
      { nome: "Ataque Desarmado", teste: "1d20", bonus: 2, dano: "1d4" },
      { nome: "Faca de Churrasco", teste: "2d20", bonus: 2, dano: "1d8+2" }
    ]
  },
  {
    id: "tok_victor",
    nome: "Victor",
    img: "/uploads/idolo_pedra/tokens/Token - Victor.png",
    pv: 8,
    pvMax: 8,
    defesa: 11,
    x: 54.5,
    y: 27.5,
    tamanho: 70,
    escala: 1,
    visivel: true,
    isMonstro: false,
    ataques: [
      { nome: "Ataque Desarmado", teste: "1d20", bonus: 1, dano: "1d4" }
    ]
  },
  {
    id: "tok_edgar",
    nome: "Edgar (Acorrentado)",
    img: "/uploads/idolo_pedra/tokens/Token - Edgar.png",
    pv: 14,
    pvMax: 14,
    defesa: 10,
    x: 25.5,
    y: 36.5,
    tamanho: 75,
    escala: 1.1,
    visivel: true,
    isMonstro: false,
    ataques: [
      { nome: "Golpe Pesado", teste: "2d20", bonus: 4, dano: "1d6+4" }
    ]
  },
  {
    id: "tok_eloisa",
    nome: "Eloísa",
    img: "/uploads/idolo_pedra/tokens/Token - Eloísa.png",
    pv: 10,
    pvMax: 10,
    defesa: 12,
    x: 28.5,
    y: 39.5,
    tamanho: 70,
    escala: 1,
    visivel: true,
    isMonstro: false,
    ataques: [
      { nome: "Ataque Desarmado", teste: "1d20", bonus: 2, dano: "1d4" }
    ]
  },
  {
    id: "tok_kenia",
    nome: "Kênia",
    img: "/uploads/idolo_pedra/tokens/Token - Kênia.png",
    pv: 8,
    pvMax: 8,
    defesa: 11,
    x: 53.0,
    y: 11.0,
    tamanho: 70,
    escala: 1,
    visivel: true,
    isMonstro: false,
    ataques: [
      { nome: "Ataque Desarmado", teste: "1d20", bonus: 1, dano: "1d4" }
    ]
  },
  {
    id: "tok_idolo",
    nome: "Ídolo de Pedra",
    img: "/uploads/idolo_pedra/pontos/idolo_de_pedra.jpg",
    pv: 20,
    pvMax: 20,
    defesa: 15,
    x: 11.0,
    y: 9.5,
    tamanho: 65,
    escala: 0.9,
    visivel: false,
    isMonstro: true,
    ataques: [
      { nome: "Pulso de Angústia", teste: "Automático", bonus: 0, dano: "1 PD" }
    ]
  }
];

// 2. Configurar a Galeria de Mapas oficial da missão
const galeriaMapas = [
  {
    id: "mapa_01_o_porao",
    nome: "Mapa 01 - O Porão (Inicial)",
    url: "/uploads/idolo_pedra/mapas/Mapa 01 - O Porão.jpg",
    tokens: JSON.parse(JSON.stringify(initialTokens)),
    fogData: null,
    drawData: null,
    camera: { x: 0, y: 0, zoom: 1 }
  },
  {
    id: "mapa_02_sala_secreta",
    nome: "Mapa 02 - O Porão + Sala Secreta",
    url: "/uploads/idolo_pedra/mapas/Mapa 02 - O Porão + Sala Secreta.jpg",
    tokens: [],
    fogData: null,
    drawData: null,
    camera: { x: 0, y: 0, zoom: 1 }
  },
  {
    id: "mapa_03_completo",
    nome: "Mapa 03 - O Porão Completo (Com Duto)",
    url: "/uploads/idolo_pedra/mapas/Mapa 03 - O Porão + Sala Secreta + Duto de Ventilação (completo).jpg",
    tokens: [],
    fogData: null,
    drawData: null,
    camera: { x: 0, y: 0, zoom: 1 }
  }
];

// 3. Catálogo de Agentes / Gaveta de Tokens
const catalogoAgentes = [
  {
    id: "cat_alan",
    nome: "Alan",
    img: "/uploads/idolo_pedra/tokens/Token - Alan.png",
    pv: 9,
    pvMax: 10,
    defesa: 12,
    isMonstro: false
  },
  {
    id: "cat_victor",
    nome: "Victor",
    img: "/uploads/idolo_pedra/tokens/Token - Victor.png",
    pv: 8,
    pvMax: 8,
    defesa: 11,
    isMonstro: false
  },
  {
    id: "cat_eloisa",
    nome: "Eloísa",
    img: "/uploads/idolo_pedra/tokens/Token - Eloísa.png",
    pv: 10,
    pvMax: 10,
    defesa: 12,
    isMonstro: false
  },
  {
    id: "cat_edgar",
    nome: "Edgar (Acorrentado)",
    img: "/uploads/idolo_pedra/tokens/Token - Edgar.png",
    pv: 14,
    pvMax: 14,
    defesa: 10,
    isMonstro: false
  },
  {
    id: "cat_kenia",
    nome: "Kênia",
    img: "/uploads/idolo_pedra/tokens/Token - Kênia.png",
    pv: 8,
    pvMax: 8,
    defesa: 11,
    isMonstro: false
  },
  {
    id: "cat_idolo",
    nome: "Ídolo de Pedra",
    img: "/uploads/idolo_pedra/pontos/idolo_de_pedra.jpg",
    pv: 20,
    pvMax: 20,
    defesa: 15,
    isMonstro: true
  }
];

// Inserir tabuleiro completo na campanha
c.tabuleiro = {
  mapaAtivoId: "mapa_01_o_porao",
  mapaAtivoUrl: "/uploads/idolo_pedra/mapas/Mapa 01 - O Porão.jpg",
  galeriaMapas: galeriaMapas,
  tokens: JSON.parse(JSON.stringify(initialTokens)),
  catalogoAgentes: catalogoAgentes,
  fogData: null,
  drawData: null,
  camera: { x: 0, y: 0, zoom: 1 }
};

// Garantir que a imagem do cômodo inicial também seja Mapa 01
if (c.locais && c.locais[0] && c.locais[0].comodos && c.locais[0].comodos[0]) {
  c.locais[0].comodos[0].imagem = "/uploads/idolo_pedra/mapas/Mapa 01 - O Porão.jpg";
}

fs.writeFileSync(campanhasPath, JSON.stringify(campanhas, null, 2), 'utf8');
console.log('Tabuleiro configurado com sucesso para A Maldição do Ídolo de Pedra!');
console.log('Mapa ativo inicial:', c.tabuleiro.mapaAtivoUrl);
console.log('Tokens iniciais:', c.tabuleiro.tokens.map(t => `${t.nome} (${t.x}%, ${t.y}%)`));
