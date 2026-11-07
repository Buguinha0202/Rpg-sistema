const fs = require('fs');
const path = require('path');

const baseUploads = path.join(__dirname, '..', 'public/uploads/idolo_pedra');
const pontosDir = path.join(baseUploads, 'pontos');
const handoutsDir = path.join(baseUploads, 'handouts');
const mapasDir = path.join(baseUploads, 'mapas');
const tokensDir = path.join(baseUploads, 'tokens');
const fichasDir = path.join(baseUploads, 'fichas');

// 1. Organizar e renomear as imagens extraídas para nomes amigáveis
const renomear = [
  { de: 'page_34_img_0_1167x1456.jpeg', para: 'mapa_porao_pins.jpg' },
  { de: 'page_39_img_3_1165x743.jpeg', para: 'painel_eletrico.jpg' },
  { de: 'page_41_img_3_1165x729.jpeg', para: 'altar_madeira.jpg' },
  { de: 'page_44_img_1_547x1408.jpeg', para: 'celular_gustavo_tela.jpg' },
  { de: 'page_45_img_1_1167x1408.jpeg', para: 'celular_mesa_porao.jpg' },
  { de: 'page_46_img_1_670x1564.jpeg', para: 'estante_livros.jpg' },
  { de: 'page_48_img_0_299x363.jpeg', para: 'poster_lutadores.jpg' },
  { de: 'page_48_img_1_302x367.jpeg', para: 'poster_futebol.jpg' },
  { de: 'page_49_img_0_299x363.jpeg', para: 'poster_tufao.jpg' },
  { de: 'page_49_img_1_299x363.jpeg', para: 'poster_thunderland.jpg' },
  { de: 'page_50_img_2_1165x783.jpeg', para: 'porta_saida_trancatron.jpg' },
  { de: 'page_51_img_3_1167x802.jpeg', para: 'idolo_de_pedra.jpg' },
  { de: 'page_54_img_1_1165x782.jpeg', para: 'sala_secreta_geral.jpg' },
  { de: 'page_57_img_0_1167x902.jpeg', para: 'computador_crt.jpg' },
  { de: 'page_59_img_3_1167x723.jpeg', para: 'freezer_cadaver.jpg' },
  { de: 'page_61_img_1_862x691.jpeg', para: 'sobreviventes_idolo.jpg' }
];

renomear.forEach(item => {
  const origem = path.join(pontosDir, item.de);
  const destino = path.join(pontosDir, item.para);
  if (fs.existsSync(origem)) {
    fs.copyFileSync(origem, destino);
    console.log(`Renomeado: ${item.para}`);
  }
});

// 2. Montar objeto da campanha "A Maldição do Ídolo de Pedra"
const campanhaIdolo = {
  id: "a-maldicao-do-idolo-de-pedra",
  nome: "A Maldição do Ídolo de Pedra (Ordem 2)",
  imagemStandby: "/uploads/idolo_pedra/pontos/idolo_de_pedra.jpg",
  descricao: "Módulo Oficial de Ordem Paranormal RPG 2. Cinco sobreviventes acordam presos em um porão desconhecido sem memórias de 2022, precisando decifrar enigmas e pagar uma terrível dívida paranormal antes que os cadáveres se levantem.",
  locais: [
    {
      id: "local_o_porao",
      nome: "O Porão de Gustavo",
      imagem: "/uploads/idolo_pedra/mapas/Mapa 01 - O Porão.jpg",
      comodos: [
        {
          id: "comodo_porao_principal",
          nome: "Porão Principal (Investigação & Fuga)",
          andar: "Subsolo",
          imagem: "/uploads/idolo_pedra/pontos/mapa_porao_pins.jpg",
          imagemBatalha: "/uploads/idolo_pedra/mapas/Mapa 01 - O Porão.jpg",
          narracao: "Vocês acordam caídos em um chão frio de concreto. Respiram um ar abafado, que mistura cheiro de mofo com algo metálico difícil de reconhecer. A luz é fraca e pisca de tempos em tempos. Olham em volta e veem uns aos outros, mas não se conhecem e nem conhecem este lugar. Vocês não sabem como chegaram aqui. Sua última memória é a comemoração do ano novo de 2021 para 2022.",
          pins: [
            {
              id: "pin_01_deposito_a",
              numero: 1,
              titulo: "01. Depósito A (Cela com Grade)",
              desc: "Depósito com paredes de grade e porta trancada. Há estantes vazias e um painel elétrico na parede. ARROMBAR (DT 10, PA 10) ou DESTRANCAR (senha: 3d6, 3 tentativas).",
              imagem: "/uploads/idolo_pedra/pontos/mapa_porao_pins.jpg",
              x: 41,
              y: 7
            },
            {
              id: "pin_02_chaves",
              numero: 2,
              titulo: "02. Molho de Chaves 1 (No Chão da Cela)",
              desc: "Molho com 3 chaves (duas grandes que abrem os depósitos A e B, e uma pequena de cadeado que abre as correntes de Edgar). Há um pouco de sangue nas chaves.",
              x: 55,
              y: 13
            },
            {
              id: "pin_03_painel",
              numero: 3,
              titulo: "03. Painel Elétrico do Porão",
              desc: "Painel confuso e mal instalado. Hack Técnico (rolagem para definir tempo da equação). Possui 2 disjuntores: 'Porão' (liga luzes e teclado TRANCATRON da saída) e 'Segredo' (liga o computador da sala secreta).",
              imagem: "/uploads/idolo_pedra/pontos/painel_eletrico.jpg",
              x: 58,
              y: 7
            },
            {
              id: "pin_04_deposito_b",
              numero: 4,
              titulo: "04. Depósito B (Onde Victor Acordou)",
              desc: "Paredes de grade, caixas velhas, um ursinho de pelúcia bordado 'L' e fragmentos de uma tigela ritualística antiga manchada de sangue fresco (usada para golpear Alan).",
              x: 41,
              y: 18
            },
            {
              id: "pin_05_rabiscos",
              numero: 5,
              titulo: "05. Rabiscos de Giz no Chão",
              desc: "Diagrama ritualístico borrado a giz branco. Foi desenhado por Victor para apagar a memória de Alan, mas acidentalmente apagou as memórias de todos.",
              x: 50,
              y: 24
            },
            {
              id: "pin_06_altar",
              numero: 6,
              titulo: "06. Altar de Madeira com Sangue",
              desc: "Cômoda de madeira usada como altar de sacrifício, coberta de sangue fresco e correntes nos pés. Uma faca de churrasco ensanguentada está caída ao lado (arma: dano RA + 2).",
              imagem: "/uploads/idolo_pedra/pontos/altar_madeira.jpg",
              x: 26,
              y: 33
            },
            {
              id: "pin_07_sigilo_teto",
              numero: 7,
              titulo: "07. Sigilo Vermelho no Teto",
              desc: "Símbolo enorme desenhado com sangue fresco por cima de uma camada marrom seca antiga. É o mesmo símbolo tatuado no pulso de todos os sobreviventes! Exige ALCANÇAR (DT 7) para examinar de perto.",
              imagem: "/uploads/idolo_pedra/handouts/Handout 02 - Símbolo no Teto.jpg",
              x: 18,
              y: 24
            },
            {
              id: "pin_08_armario_metal",
              numero: 8,
              titulo: "08. Armário de Ferramentas (Onde Está o Ídolo)",
              desc: "Trancado com cadeado ensanguentado (DESTRANCAR 5d6 ou Molho de Chaves 2). Dentro há a jaqueta de Gustavo furada nas costas com o RG dele, e o ÍDOLO DE PEDRA enrolado!",
              x: 10,
              y: 8
            },
            {
              id: "pin_09_celular",
              numero: 9,
              titulo: "09. Celular de Gustavo sobre a Mesa",
              desc: "Tela diz 'Olá, Gustavo' com data de 13 de outubro de 2022. Exige Hack Social (4 perguntas pessoais sobre a vida de Gustavo). Permite ler e-mails e abrir a saída via TRANCATRON.",
              imagem: "/uploads/idolo_pedra/pontos/celular_mesa_porao.jpg",
              x: 23,
              y: 54
            },
            {
              id: "pin_10_duto",
              numero: 10,
              titulo: "10. Duto de Ventilação Alto",
              desc: "Fechado por grade alta (ALCANÇAR DT 7 + ARROMBAR DT 7, PA 10). Espaço estreito para se arrastar até a Sala Secreta por cima.",
              x: 30,
              y: 56
            },
            {
              id: "pin_11_estante",
              numero: 11,
              titulo: "11. Estante de Livros (Passagem Secreta)",
              desc: "Porta disfarçada de estante de 5 prateleiras. É preciso puxar os 4 livros certos indicados pelos pôsteres para destravar os trilhos e SUSTENTAR (DT 7) para passar.",
              imagem: "/uploads/idolo_pedra/pontos/estante_livros.jpg",
              x: 75,
              y: 51
            },
            {
              id: "pin_12_poster1",
              numero: 12,
              titulo: "12. Pôster: Lutadores de Rua",
              desc: "Videogame dos anos 90 com o campeão mascarado 'Zika'. Indica o livro da Prateleira 4: 'Pixel a Pixel: Como Me Tornei Uma Lenda Dos Games'.",
              imagem: "/uploads/idolo_pedra/handouts/Handout 07 - Pôster Lutadores de Rua.jpg",
              x: 19,
              y: 5
            },
            {
              id: "pin_13_poster2",
              numero: 13,
              titulo: "13. Pôster: Unidos do Invisível F.C.",
              desc: "Pôster de futebol clássico do 'gol que ninguém viu'. Indica o livro da Prateleira 2: 'O Gol Que Ninguém Viu - Edinho Canhoto'.",
              imagem: "/uploads/idolo_pedra/handouts/Handout 08 - Pôster Unidos do Invisível Futebol Clube.jpg",
              x: 5,
              y: 16
            },
            {
              id: "pin_14_poster3",
              numero: 14,
              titulo: "14. Pôster: Eric Tufão 3",
              desc: "Filme de ação com 3 explosões ao fundo estrelando Arnaldo Fritz. Indica o livro da Prateleira 3: 'Explosivos Industriais Vol. III'.",
              imagem: "/uploads/idolo_pedra/handouts/Handout 9 - Pôster Eric Tufão 3 - A Explosão Explosiva.jpg",
              x: 5,
              y: 44
            },
            {
              id: "pin_15_poster4",
              numero: 15,
              titulo: "15. Pôster: Thunderland 2008",
              desc: "Festival de rock com a banda Dragões Metálicos de Kurt Hemmis. Indica o livro da Prateleira 5: 'Aprenda Guitarra Sem Ter Uma Guitarra'.",
              imagem: "/uploads/idolo_pedra/handouts/Handout 10 - Thunderland 2008.jpg",
              x: 69,
              y: 40
            },
            {
              id: "pin_16_porta_saida",
              numero: 16,
              titulo: "16. Porta de Metal com TRANCATRON (Saída)",
              desc: "Única rota de escape do porão. Painel eletrônico com senha de 6 dígitos: 160322 (16 de março de 2022, data do primeiro ritual).",
              imagem: "/uploads/idolo_pedra/pontos/porta_saida_trancatron.jpg",
              x: 11,
              y: 54
            },
            {
              id: "pin_17_idolo",
              numero: 17,
              titulo: "17. O Ídolo de Pedra (Objeto Amaldiçoado)",
              desc: "Estatueta de 30cm e duas faces com entranhas podres orgânicas por dentro. Ao ser aberta, ativa a contagem de rodadas de 'A Dívida Precisa Ser Paga'!",
              imagem: "/uploads/idolo_pedra/pontos/idolo_de_pedra.jpg",
              x: 17,
              y: 14
            }
          ]
        },
        {
          id: "comodo_sala_secreta",
          nome: "A Sala Secreta (Man Cave de Gustavo)",
          andar: "Subsolo",
          imagem: "/uploads/idolo_pedra/pontos/sala_secreta_geral.jpg",
          imagemBatalha: "/uploads/idolo_pedra/mapas/Mapa 03 - O Porão + Sala Secreta + Duto de Ventilação (completo).jpg",
          narracao: "Vocês acessam uma sala ampla com paredes cobertas por espuma acústica preta. Há uma mesa de poker, outra de sinuca, uma grelha de churrasco com coifa, um computador antigo de tubo desligado e um freezer grande manchado de sangue.",
          pins: [
            {
              id: "pin_18_poker",
              numero: 18,
              titulo: "18. Mesa de Poker",
              desc: "Cartas e fichas espalhadas. Uma cadeira derrubada segue uma trilha de sangue arrastado no chão em direção ao freezer.",
              x: 82,
              y: 44
            },
            {
              id: "pin_19_sinuca",
              numero: 19,
              titulo: "19. Mesa de Bilhar",
              desc: "Bolas de sinuca e um taco jogado. Ambiente onde Gustavo confraternizava com seus amigos.",
              x: 76,
              y: 23
            },
            {
              id: "pin_20_churrasqueira",
              numero: 20,
              titulo: "20. Grelha de Churrasco & Coifa",
              desc: "Espaço para churrasco com isolamento acústico. A coifa se conecta ao teto mas o duto é estreito demais para fuga.",
              x: 87,
              y: 22
            },
            {
              id: "pin_21_armario_roupas",
              numero: 21,
              titulo: "21. Armário de Roupas Revirado",
              desc: "Roupas manchadas de sangue que Alan trocou após esfaquear Gustavo. Nos bolsos estão o Molho de Chaves 2 (que abre o freezer e o armário do Ídolo) e a identidade de Alan!",
              imagem: "/uploads/idolo_pedra/handouts/Handout 11 - RG de Alan.jpg",
              x: 69,
              y: 29
            },
            {
              id: "pin_22_computador",
              numero: 22,
              titulo: "22. Computador CRT de Gustavo",
              desc: "Computador lento e desorganizado. Exige Hack Técnico. Nos e-mails, revela que o primeiro ritual ocorreu no dia 16 de março (senha da porta: 160322).",
              imagem: "/uploads/idolo_pedra/pontos/computador_crt.jpg",
              x: 68,
              y: 9
            },
            {
              id: "pin_23_freezer",
              numero: 23,
              titulo: "23. Freezer Trancado com Cadeado",
              desc: "Freezer de carne trancado com cadeado sujo de sangue fresco (DESTRANCAR 4d6 ou Molho de Chaves 2). Exige teste de Disciplina DT 10 ao abrir pelo choque.",
              x: 86,
              y: 11
            },
            {
              id: "pin_24_corpo_freezer",
              numero: 24,
              titulo: "24. Cadáver de Gustavo",
              desc: "O corpo de Gustavo congelado e dobrado em posição bizarra com 3 facadas nas costas. Em seu bolso há a foto de aniversário da filha Laura (02/09/2015) e a pulseira de bodas de prata com Olívia (10/08/1997), essenciais para o Hack Social do celular!",
              imagem: "/uploads/idolo_pedra/pontos/freezer_cadaver.jpg",
              x: 81,
              y: 15
            }
          ]
        }
      ]
    }
  ],
  personagens: [
    {
      id: "sobrevivente_alan",
      nome: "Alan (O Arqueólogo)",
      origem: "Cientista",
      classe: "Executor",
      perfil: "Executor",
      nivel: 2,
      pv: 9,
      pvMax: 10,
      san: 16,
      sanMax: 16,
      pe: 16,
      peMax: 16,
      pd: 16,
      pdMax: 16,
      atributos: { "FIS": 6, "MEN": 8, "EMO": 8 },
      pericias: { "Aptidão (Exatas)": "d8", "Investigação": "d8", "Percepção": "d6", "Luta": "d6" },
      avatar: "/uploads/idolo_pedra/tokens/Token - Alan.png",
      fichaImagem: "/uploads/idolo_pedra/fichas/Ficha - Alan.jpg",
      historicoImagem: "/uploads/idolo_pedra/historicos/Histórico - Alan.jpg"
    },
    {
      id: "sobrevivente_victor",
      nome: "Victor (O Professor)",
      origem: "Professor",
      classe: "Analista",
      perfil: "Analista",
      nivel: 2,
      pv: 8,
      pvMax: 8,
      san: 18,
      sanMax: 18,
      pe: 18,
      peMax: 18,
      pd: 18,
      pdMax: 18,
      atributos: { "FIS": 6, "MEN": 10, "EMO": 6 },
      pericias: { "Aptidão (Humanas)": "d10", "Pesquisa": "d8", "Intuição": "d8", "Ocultismo": "d6" },
      avatar: "/uploads/idolo_pedra/tokens/Token - Victor.png",
      fichaImagem: "/uploads/idolo_pedra/fichas/Ficha - Victor.jpg",
      historicoImagem: "/uploads/idolo_pedra/historicos/Histórico - Victor.jpg"
    },
    {
      id: "sobrevivente_eloisa",
      nome: "Eloísa (A Influencer)",
      origem: "Influencer",
      classe: "Vigilante",
      perfil: "Vigilante",
      nivel: 2,
      pv: 10,
      pvMax: 10,
      san: 14,
      sanMax: 14,
      pe: 14,
      peMax: 14,
      pd: 14,
      pdMax: 14,
      atributos: { "FIS": 8, "MEN": 6, "EMO": 8 },
      pericias: { "Persuasão": "d8", "Tecnologia": "d8", "Enganação": "d8", "Acrobacia": "d6" },
      avatar: "/uploads/idolo_pedra/tokens/Token - Eloísa.png",
      fichaImagem: "/uploads/idolo_pedra/fichas/Ficha - Eloísa.jpg",
      historicoImagem: "/uploads/idolo_pedra/historicos/Histórico - Eloísa.jpg"
    },
    {
      id: "sobrevivente_edgar",
      nome: "Edgar (O Portuário)",
      origem: "Trabalhador Portuário",
      classe: "Executor",
      perfil: "Executor",
      nivel: 2,
      pv: 14,
      pvMax: 14,
      san: 12,
      sanMax: 12,
      pe: 12,
      peMax: 12,
      pd: 12,
      pdMax: 12,
      atributos: { "FIS": 10, "MEN": 6, "EMO": 6 },
      pericias: { "Atletismo": "d10", "Luta": "d8", "Vigor": "d10", "Sobrevivência": "d6" },
      avatar: "/uploads/idolo_pedra/tokens/Token - Edgar.png",
      fichaImagem: "/uploads/idolo_pedra/fichas/Ficha - Edgar.jpg",
      historicoImagem: "/uploads/idolo_pedra/historicos/Histórico - Edgar.jpg"
    },
    {
      id: "sobrevivente_kenia",
      nome: "Kênia (A Estudante)",
      origem: "Estudante de Direito",
      classe: "Analista",
      perfil: "Analista",
      nivel: 2,
      pv: 8,
      pvMax: 8,
      san: 16,
      sanMax: 16,
      pe: 16,
      peMax: 16,
      pd: 16,
      pdMax: 16,
      atributos: { "FIS": 6, "MEN": 8, "EMO": 8 },
      pericias: { "Aptidão (Burocracia)": "d8", "Pesquisa": "d8", "Intuição": "d8", "Percepção": "d6" },
      avatar: "/uploads/idolo_pedra/tokens/Token - Kênia.png",
      fichaImagem: "/uploads/idolo_pedra/fichas/Ficha - Kênia.jpg",
      historicoImagem: "/uploads/idolo_pedra/historicos/Histórico - Kênia.jpg"
    }
  ],
  handouts: [
    { id: "h01", titulo: "Handout 01 - Conversa Eloísa", url: "/uploads/idolo_pedra/handouts/Handout 01 - Conversa Eloísa.png" },
    { id: "h02", titulo: "Handout 02 - Símbolo no Teto", url: "/uploads/idolo_pedra/handouts/Handout 02 - Símbolo no Teto.jpg" },
    { id: "h03", titulo: "Handout 03 - RG de Gustavo", url: "/uploads/idolo_pedra/handouts/Handout 03 - RG de Gustavo.jpg" },
    { id: "h04", titulo: "Handout 04 - Anotações Arqueológicas", url: "/uploads/idolo_pedra/handouts/Handout 04 - Anotações Arqueológicas.jpg" },
    { id: "h05a", titulo: "Handout 05A - Conversa Grupo", url: "/uploads/idolo_pedra/handouts/Handout 05A - Conversa Grupo.png" },
    { id: "h05b", titulo: "Handout 05B - Conversa Alan", url: "/uploads/idolo_pedra/handouts/Handout 05B - Conversa Alan.png" },
    { id: "h05c", titulo: "Handout 05C - Conversa Victor", url: "/uploads/idolo_pedra/handouts/Handout 05C - Conversa Victor.png" },
    { id: "h06", titulo: "Handout 06 - Estante de Livros", url: "/uploads/idolo_pedra/handouts/Handout 06 - Estante de Livros.jpg" },
    { id: "h07", titulo: "Handout 07 - Pôster Lutadores de Rua", url: "/uploads/idolo_pedra/handouts/Handout 07 - Pôster Lutadores de Rua.jpg" },
    { id: "h08", titulo: "Handout 08 - Pôster Unidos do Invisível", url: "/uploads/idolo_pedra/handouts/Handout 08 - Pôster Unidos do Invisível Futebol Clube.jpg" },
    { id: "h09", titulo: "Handout 09 - Pôster Eric Tufão 3", url: "/uploads/idolo_pedra/handouts/Handout 9 - Pôster Eric Tufão 3 - A Explosão Explosiva.jpg" },
    { id: "h10", titulo: "Handout 10 - Thunderland 2008", url: "/uploads/idolo_pedra/handouts/Handout 10 - Thunderland 2008.jpg" },
    { id: "h11", titulo: "Handout 11 - RG de Alan", url: "/uploads/idolo_pedra/handouts/Handout 11 - RG de Alan.jpg" },
    { id: "h12a", titulo: "Handout 12A - E-mail de Gustavo 1", url: "/uploads/idolo_pedra/handouts/Handout 12A - E-mail de Gustavo 1.png" },
    { id: "h12b", titulo: "Handout 12B - E-mail de Gustavo 2", url: "/uploads/idolo_pedra/handouts/Handout 12B - Email de Gustavo 2.png" },
    { id: "h12c", titulo: "Handout 12C - E-mail de Gustavo 3", url: "/uploads/idolo_pedra/handouts/Handout 12C - E-mail de Gustavo 3.png" },
    { id: "h13", titulo: "Handout 13 - Cadáver de Gustavo", url: "/uploads/idolo_pedra/handouts/Handout 13 - Cadáver de Gustavo.jpg" },
    { id: "h14", titulo: "Handout 14 - Foto de Aniversário", url: "/uploads/idolo_pedra/handouts/Handout 14 - Foto de aniversário.jpg" }
  ]
};

// 3. Atualizar campanhas.json preservando as existentes
const campanhasPath = path.join(__dirname, '..', 'campanhas.json');
let campanhas = [];
if (fs.existsSync(campanhasPath)) {
  try {
    campanhas = JSON.parse(fs.readFileSync(campanhasPath, 'utf8'));
  } catch (e) {
    campanhas = [];
  }
}

// Substituir ou inserir
const index = campanhas.findIndex(c => c.id === campanhaIdolo.id);
if (index >= 0) {
  campanhas[index] = campanhaIdolo;
  console.log('Campanha atualizada em campanhas.json!');
} else {
  campanhas.unshift(campanhaIdolo);
  console.log('Campanha inserida como primeira em campanhas.json!');
}

fs.writeFileSync(campanhasPath, JSON.stringify(campanhas, null, 2), 'utf8');
console.log('campanhas.json gravado com sucesso! Total de campanhas:', campanhas.length);
