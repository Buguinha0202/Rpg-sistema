const fs = require('fs');

const data = JSON.parse(fs.readFileSync('campanhas.json', 'utf8'));

// Mapa Oficial Mansão Leone / Mansão Tipora da Ordem
const mapaMansaoOficial = {
  id: "mapa_mansao_oficial",
  nome: "Mansão Antiga (Salão 2.5D)",
  url: "/uploads/mansao_tipora.webp",
  tokens: [],
  fogData: null,
  drawData: null,
  camera: { x: 0, y: 0, zoom: 1 }
};

const mapaAcampamento = {
  id: "mapa_acampamento_oficial",
  nome: "Acampamento na Floresta",
  url: "/uploads/Mapa_Acampamento_2022.webp",
  tokens: [],
  fogData: null,
  drawData: null,
  camera: { x: 0, y: 0, zoom: 1 }
};

const mapaCasaJuno = {
  id: "mapa_casa_juno_oficial",
  nome: "Casa Juno",
  url: "/uploads/casa_juno.webp",
  tokens: [],
  fogData: null,
  drawData: null,
  camera: { x: 0, y: 0, zoom: 1 }
};

data.forEach(camp => {
  if (camp.id === 'natal-macabro' || camp.id === 'abc') {
    if (!camp.tabuleiro) camp.tabuleiro = {};
    if (!camp.tabuleiro.galeriaMapas) camp.tabuleiro.galeriaMapas = [];

    // Remove o mapa antigo da cozinha
    camp.tabuleiro.galeriaMapas = camp.tabuleiro.galeriaMapas.filter(m => !m.url.includes('unsplash.com'));

    // Adiciona os mapas autênticos do próprio projeto
    const adicionarSeNaoExiste = (mapa) => {
      const idx = camp.tabuleiro.galeriaMapas.findIndex(m => m.id === mapa.id);
      if (idx !== -1) {
        camp.tabuleiro.galeriaMapas[idx] = mapa;
      } else {
        camp.tabuleiro.galeriaMapas.unshift(mapa);
      }
    };

    adicionarSeNaoExiste(mapaCasaJuno);
    adicionarSeNaoExiste(mapaAcampamento);
    adicionarSeNaoExiste(mapaMansaoOficial);

    // Define a Mansão como o mapa ativo padrão
    camp.tabuleiro.mapaAtivoId = mapaMansaoOficial.id;
    camp.tabuleiro.mapaAtivoUrl = mapaMansaoOficial.url;

    // Atualiza também os locais da investigação
    if (!camp.locais) camp.locais = [];
    camp.locais = camp.locais.filter(l => !l.imagem?.includes('unsplash.com'));
    camp.locais.unshift({
      id: "local_mansao_oficial",
      nome: "Mansão Antiga (Investigação 2.5D)",
      imagem: "/uploads/mansao_tipora.webp",
      comodos: [
        { id: "comodo_mansao_salao", nome: "Salão Principal", andar: "Térreo", imagem: "/uploads/mansao_tipora.webp", pistas: [] },
        { id: "comodo_mansao_casa", nome: "Casa Juno", andar: "1º Andar", imagem: "/uploads/casa_juno.webp", pistas: [] },
        { id: "comodo_mansao_acamp", nome: "Pátio / Floresta", andar: "Exterior", imagem: "/uploads/Mapa_Acampamento_2022.webp", pistas: [] }
      ]
    });
  }
});

fs.writeFileSync('campanhas.json', JSON.stringify(data, null, 2), 'utf8');
console.log('campanhas.json atualizado com /uploads/mansao_tipora.webp!');
