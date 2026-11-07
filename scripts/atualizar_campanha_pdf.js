const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'campanhas.json');
const publicFilePath = path.join(__dirname, '..', 'public', 'campanhas.json');
const campanhas = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

const ameacaJae = {
  id: 'ameaca_park_jae_yoon',
  nome: 'Park Jae-Yoon ("X")',
  tipo: 'Humana (Assassina Ritualística do Sangue)',
  elemento: 'sangue',
  vd: 'Nível 4 (Letal)',
  pv: 999,
  pvMax: 999,
  defesa: 17,
  deslocamento: '12m',
  img: '/uploads/park_jae_yoon.jpg',
  atributos: { FOR: 3, AGI: 4, VIG: 3, INT: 2, PRE: 4 },
  pericias: 'Furtividade +8, Atletismo +7, Intimidação +8, Percepção +6',
  habilidades: [
    { nome: 'Aura de Silêncio Sobrenatural', desc: 'Jae não emite som de passos sobre madeira ou folhas secas. Requer Percepção DT 18 para ouvi-la antes do bote.' },
    { nome: 'A Regra do "Shhh"', desc: 'Ataques físicos contra Jae não a reduzem a 0 PV. Golpes bem-sucedidos (DT 16) apenas a atordoam ou empurram por 1 rodada, permitindo que sobreviventes ganhem distância.' },
    { nome: 'Estocada Tática', desc: 'Corpo a corpo, +7 para acertar. Dano: 1d8+4 perfurante mais sangramento contínuo (1d4 PV por rodada até receber curativo ou torniquete).' },
    { nome: 'O Bote das Sombras (Recarga 4-6 no d6)', desc: 'Jae apaga a lâmpada mais próxima ou arremessa cadeira, saltando sobre o personagem mais isolado. A vítima deve passar em Reflexos DT 15 ou é derrubada e fica indefesa.' },
    { nome: 'Diretriz do Mestre', desc: 'Jae nunca persegue em disparada cega. Ela caminha no ritmo da batida do coração da vítima, arrastando a lâmina nas paredes para cultivar o desespero psicológico.' }
  ]
};

const localCasaJuno = {
  id: 'local_casa_juno_ato2',
  nome: 'A Casa Juno (Ato II: O Casarão da Falsa Paz)',
  imagem: '/uploads/casa_juno_salao.jpg',
  comodos: [
    {
      id: 'comodo_juno_salao',
      nome: 'Salão Principal & Lareira',
      andar: 'Térreo',
      imagem: '/uploads/casa_juno_salao.jpg',
      narracao: 'Vocês batem a pesada porta de carvalho às suas costas. No mesmo instante, o urro da tempestade e os latidos ferozes da matilha ficam abafados lá fora. O ar cheira a lenha seca e pinho silvestre. Uma lareira colossal queima com brasas rubras, e no centro da sala ergue-se uma árvore de Natal iluminada, enfeitada de veludo vermelho e caixas com fitas de cetim. Sobre o aparador, a luz verde de um telefone fixo parece piscar...',
      pins: [
        { id: 'pin_arvore', titulo: 'Árvore de Natal Sinistra', desc: '2,5 metros de altura com bolas vermelhas espelhadas. A maior caixa contém cinzas de ossos e um Dente Humano Molar arrancado.', x: 48, y: 55 },
        { id: 'pin_retrato', titulo: 'Retrato de Alice Lucina', desc: 'Pintura a óleo com moldura de carvalho rachada. Se examinado de perto: os olhos da tela foram furados com ponta de lâmina. No verso, o símbolo "X" entalhado a faca recente.', x: 25, y: 35 },
        { id: 'pin_lareira', titulo: 'Lareira & Ferramentas', desc: 'Ferro fundido ornamentado. Contém um Atiçador de Ferro Pesado (Arma 1d6+FOR) e um Machado de Lenha (arromba portas de madeira em 2 rodadas).', x: 75, y: 48 },
        { id: 'pin_telefone', titulo: 'Telefone Fixo Antigo', desc: 'Luz verde piscando convidativa. Toca uma única vez com som estridente. Ao atender, apenas respiração lenta e compassada.', x: 85, y: 65 }
      ]
    },
    {
      id: 'comodo_juno_cozinha',
      nome: 'Cozinha dos Fundos (Ponto de Fuga)',
      andar: 'Térreo',
      imagem: '/uploads/casa_juno_cozinha.jpg',
      narracao: 'Piso de cerâmica fria, cheiro de gordura velha e ferrugem. O vento uiva sob o batente da porta trancada por fora com ferrolho de latão...',
      pins: [
        { id: 'pin_porta_fundos', titulo: 'Porta dos Fundos Trancada', desc: 'Trancada por fora com ferrolho reforçado de latão. Inscrição talhada a faca: "O \'X\' marca o lugar...". Rota A: Chaves de Bronze. Rota B: 3 golpes de Machado de Lenha. Rota C: Janela basculante (Ladinagem DT 12 / Força DT 14).', x: 50, y: 42 },
        { id: 'pin_fogao', titulo: 'Fogão Antigo com "X" de Sangue', desc: 'Marcado com "X" de tinta vermelha escorrida. Dentro do forno: 2 Garrafas de Álcool 70% e panos secos (podem criar tochas defensivas ou coquetéis artesanais).', x: 28, y: 68 },
        { id: 'pin_janela', titulo: 'Janela Basculante Alta', desc: 'Travada por pregos acima do batente; requer teste de Ladinagem DT 12 ou Força DT 14 para arrancar a chapa de proteção.', x: 72, y: 25 }
      ]
    },
    {
      id: 'comodo_juno_jogos',
      nome: 'Sala de Jogos (Andar Superior)',
      andar: '1º Andar',
      imagem: '/uploads/casa_juno_salao.jpg',
      narracao: 'Tábua que range alto. Pano verde da sinuca mofado e troféus de caça na parede.',
      pins: [
        { id: 'pin_sinuca', titulo: 'Mesa de Sinuca com Bolas em "X"', desc: 'Bolas espalhadas formando a letra X. Se vasculharem as caçapas de couro: na caçapa nordeste encontra-se o Molho com 10 Chaves Antigas de Bronze (abrem a porta dos fundos).', x: 45, y: 60 },
        { id: 'pin_cervo', titulo: 'Cabeça de Cervo Empalhada', desc: 'Fixada na parede acima da escada. Um olho de vidro caiu. Compartimento oculto por trás do pedestal guarda 1 Caixa com 6 Balas de Calibre .38.', x: 70, y: 30 },
        { id: 'pin_emboscada', titulo: 'Vão da Escada (Emboscada Crítica)', desc: 'No segundo em que as chaves são recolhidas, o som de assobio cessa no andar de baixo. Park Jae-Yoon surge silenciosa no vão da escada empunhando a faca militar.', x: 20, y: 45 }
      ]
    }
  ]
};

campanhas.forEach(c => {
  if (!c.locais) c.locais = [];
  const idx = c.locais.findIndex(l => l.id === localCasaJuno.id);
  if (idx >= 0) c.locais[idx] = localCasaJuno;
  else c.locais.unshift(localCasaJuno);

  if (!c.ameacas) c.ameacas = [];
  const aIdx = c.ameacas.findIndex(a => a.id === ameacaJae.id);
  if (aIdx >= 0) c.ameacas[aIdx] = ameacaJae;
  else c.ameacas.push(ameacaJae);

  if (c.tabuleiro) {
    if (!c.tabuleiro.galeriaMapas) c.tabuleiro.galeriaMapas = [];
    const mapasNovos = [
      { id: 'mapa_juno_salao', nome: 'Casa Juno - Salão Principal', url: '/uploads/casa_juno_salao.jpg', tokens: [], fogData: null, drawData: null, camera: { x: 0, y: 0, zoom: 1 } },
      { id: 'mapa_juno_cozinha', nome: 'Casa Juno - Cozinha dos Fundos', url: '/uploads/casa_juno_cozinha.jpg', tokens: [], fogData: null, drawData: null, camera: { x: 0, y: 0, zoom: 1 } }
    ];
    mapasNovos.forEach(mn => {
      const gIdx = c.tabuleiro.galeriaMapas.findIndex(gm => gm.id === mn.id);
      if (gIdx >= 0) c.tabuleiro.galeriaMapas[gIdx] = mn;
      else c.tabuleiro.galeriaMapas.unshift(mn);
    });

    if (!c.tabuleiro.catalogoAmeacas) c.tabuleiro.catalogoAmeacas = [];
    const tokJae = { id: 'tok_park_jae_yoon', nome: 'Park Jae-Yoon ("X")', img: '/uploads/park_jae_yoon.jpg', pv: 999, pvMax: 999, defesa: 17, isMonstro: true };
    const tIdx = c.tabuleiro.catalogoAmeacas.findIndex(t => t.id === tokJae.id);
    if (tIdx >= 0) c.tabuleiro.catalogoAmeacas[tIdx] = tokJae;
    else c.tabuleiro.catalogoAmeacas.push(tokJae);
  }
});

fs.writeFileSync(filePath, JSON.stringify(campanhas, null, 2), 'utf-8');
fs.writeFileSync(publicFilePath, JSON.stringify(campanhas, null, 2), 'utf-8');
console.log('Campanhas atualizadas com sucesso com os dados da Casa Juno!');
