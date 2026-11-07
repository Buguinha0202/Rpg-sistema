const fs = require('fs');
const path = require('path');

// 1. Coordenadas EXATAS calculadas via Homografia SIFT da página 34 do livro oficial
const coordenadasCalibradas = {
  1: { x: 41.5, y: 6.5 },
  2: { x: 56.6, y: 12.7 },
  3: { x: 57.0, y: 6.1 },
  4: { x: 41.6, y: 18.0 },
  5: { x: 53.9, y: 27.5 },
  6: { x: 29.4, y: 33.7 },
  7: { x: 22.1, y: 24.6 },
  8: { x: 14.8, y: 7.2 },
  9: { x: 28.1, y: 56.4 },
  10: { x: 33.2, y: 58.7 },
  11: { x: 72.1, y: 54.5 },
  12: { x: 23.3, y: 3.5 },
  13: { x: 10.9, y: 15.4 },
  14: { x: 11.0, y: 46.6 },
  15: { x: 66.6, y: 43.5 },
  16: { x: 15.8, y: 58.3 },
  17: { x: 21.8, y: 13.8 },
  18: { x: 78.0, y: 44.7 },
  19: { x: 72.6, y: 23.7 },
  20: { x: 81.4, y: 22.0 },
  21: { x: 67.0, y: 29.9 },
  22: { x: 65.5, y: 7.2 },
  23: { x: 82.7, y: 10.2 },
  24: { x: 78.1, y: 14.7 }
};

// 2. Montar objeto da campanha com imagens 100% dedicadas para CADA UM dos 24 pins
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
          imagem: "/uploads/idolo_pedra/mapas/Mapa 01 - O Porão.jpg",
          imagemBatalha: "/uploads/idolo_pedra/mapas/Mapa 01 - O Porão.jpg",
          narracao: "Vocês acordam caídos em um chão frio de concreto. Respiram um ar abafado, que mistura cheiro de mofo com algo metálico difícil de reconhecer. A luz é fraca e pisca de tempos em tempos. Olham em volta e veem uns aos outros, mas não se conhecem e nem conhecem este lugar. Vocês não sabem como chegaram aqui. Sua última memória é a comemoração do ano novo de 2021 para 2022.",
          pins: [
            {
              id: "pin_01_deposito_a",
              numero: 1,
              titulo: "01. Depósito A (Cela com Grade)",
              desc: "Depósito com paredes de grade e porta trancada por correntes. Há estantes vazias, um elíptico quebrado e o painel elétrico na parede. ARROMBAR (DT 10, PA 10) ou DESTRANCAR (senha: 3d6, 3 tentativas).",
              imagem: "/uploads/idolo_pedra/pontos/deposito_a_cela.jpg",
              x: coordenadasCalibradas[1].x,
              y: coordenadasCalibradas[1].y
            },
            {
              id: "pin_02_chaves",
              numero: 2,
              titulo: "02. Molho de Chaves 1 (No Chão da Cela)",
              desc: "Molho com 3 chaves (duas grandes que abrem os depósitos A e B, e uma pequena de cadeado que abre as correntes de Edgar). Há respingos e poças de sangue fresco nas chaves.",
              imagem: "/uploads/idolo_pedra/pontos/chaves_sangue_chao.jpg",
              x: coordenadasCalibradas[2].x,
              y: coordenadasCalibradas[2].y
            },
            {
              id: "pin_03_painel",
              numero: 3,
              titulo: "03. Painel Elétrico do Porão",
              desc: "Painel confuso e mal instalado. Hack Técnico (rolagem para definir tempo da equação). Possui 2 disjuntores: 'Porão' (liga luzes e teclado TRANCATRON da saída) e 'Segredo' (liga o computador da sala secreta).",
              imagem: "/uploads/idolo_pedra/pontos/painel_eletrico.jpg",
              x: coordenadasCalibradas[3].x,
              y: coordenadasCalibradas[3].y
            },
            {
              id: "pin_04_deposito_b",
              numero: 4,
              titulo: "04. Depósito B (Onde Victor Acordou)",
              desc: "Paredes de grade, caixas velhas, um ursinho de pelúcia bordado 'L' e fragmentos de uma tigela ritualística antiga manchada de sangue fresco (usada para golpear Alan).",
              imagem: "/uploads/idolo_pedra/pontos/deposito_b_urso.jpg",
              x: coordenadasCalibradas[4].x,
              y: coordenadasCalibradas[4].y
            },
            {
              id: "pin_05_rabiscos",
              numero: 5,
              titulo: "05. Rabiscos de Giz no Chão",
              desc: "Diagrama ritualístico borrado a giz branco com marcas de arrasto e passos. Foi desenhado por Victor para apagar a memória de Alan, mas acidentalmente apagou as memórias de todos.",
              imagem: "/uploads/idolo_pedra/pontos/rabiscos_giz_chao.jpg",
              x: coordenadasCalibradas[5].x,
              y: coordenadasCalibradas[5].y
            },
            {
              id: "pin_06_altar",
              numero: 6,
              titulo: "06. Altar de Madeira com Sangue",
              desc: "Cômoda de madeira usada como altar de sacrifício, coberta de sangue fresco e correntes nos pés. Uma faca de churrasco ensanguentada está caída ao lado (arma: dano RA + 2).",
              imagem: "/uploads/idolo_pedra/pontos/altar_madeira.jpg",
              x: coordenadasCalibradas[6].x,
              y: coordenadasCalibradas[6].y
            },
            {
              id: "pin_07_sigilo_teto",
              numero: 7,
              titulo: "07. Sigilo Vermelho no Teto",
              desc: "Símbolo enorme desenhado com sangue fresco por cima de uma camada marrom seca antiga. É o mesmo símbolo tatuado no pulso de todos os sobreviventes! Exige ALCANÇAR (DT 7) para examinar de perto.",
              imagem: "/uploads/idolo_pedra/handouts/Handout 02 - Símbolo no Teto.jpg",
              x: coordenadasCalibradas[7].x,
              y: coordenadasCalibradas[7].y
            },
            {
              id: "pin_08_armario_metal",
              numero: 8,
              titulo: "08. Armário de Ferramentas (Onde Está o Ídolo)",
              desc: "Armário de aço industrial trancado com cadeado grosso ensanguentado e correntes (DESTRANCAR 5d6 ou Molho de Chaves 2). Dentro há a jaqueta de Gustavo furada nas costas com o RG dele, ferramentas, e o ÍDOLO DE PEDRA enrolado!",
              imagem: "/uploads/idolo_pedra/pontos/armario_metal_detalhe.jpg",
              x: coordenadasCalibradas[8].x,
              y: coordenadasCalibradas[8].y
            },
            {
              id: "pin_09_celular",
              numero: 9,
              titulo: "09. Celular de Gustavo sobre a Mesa",
              desc: "Tela diz 'Olá, Gustavo' com data de 13 de outubro de 2022. Exige Hack Social (4 perguntas pessoais sobre a vida de Gustavo). Permite ler e-mails e abrir a saída via TRANCATRON.",
              imagem: "/uploads/idolo_pedra/pontos/celular_mesa_porao.jpg",
              x: coordenadasCalibradas[9].x,
              y: coordenadasCalibradas[9].y
            },
            {
              id: "pin_10_duto",
              numero: 10,
              titulo: "10. Duto de Ventilação Alto",
              desc: "Duto retangular alto na parede de concreto fechado por grade de ferro (ALCANÇAR DT 7 + ARROMBAR DT 7, PA 10). Espaço estreito de passagem que conecta o porão diretamente à Sala Secreta por cima.",
              imagem: "/uploads/idolo_pedra/pontos/duto_ventilacao_detalhe.jpg",
              x: coordenadasCalibradas[10].x,
              y: coordenadasCalibradas[10].y
            },
            {
              id: "pin_11_estante",
              numero: 11,
              titulo: "11. Estante de Livros (Passagem Secreta)",
              desc: "Porta disfarçada de estante de 5 prateleiras. É preciso puxar os 4 livros certos indicados pelos pôsteres para destravar os trilhos e SUSTENTAR (DT 7) para passar.",
              imagem: "/uploads/idolo_pedra/pontos/estante_livros.jpg",
              x: coordenadasCalibradas[11].x,
              y: coordenadasCalibradas[11].y
            },
            {
              id: "pin_12_poster1",
              numero: 12,
              titulo: "12. Pôster: Lutadores de Rua",
              desc: "Videogame dos anos 90 com o campeão mascarado 'Zika'. Indica o livro da Prateleira 4: 'Pixel a Pixel: Como Me Tornei Uma Lenda Dos Games'.",
              imagem: "/uploads/idolo_pedra/handouts/Handout 07 - Pôster Lutadores de Rua.jpg",
              x: coordenadasCalibradas[12].x,
              y: coordenadasCalibradas[12].y
            },
            {
              id: "pin_13_poster2",
              numero: 13,
              titulo: "13. Pôster: Unidos do Invisível F.C.",
              desc: "Pôster de futebol clássico do 'gol que ninguém viu'. Indica o livro da Prateleira 2: 'O Gol Que Ninguém Viu - Edinho Canhoto'.",
              imagem: "/uploads/idolo_pedra/handouts/Handout 08 - Pôster Unidos do Invisível Futebol Clube.jpg",
              x: coordenadasCalibradas[13].x,
              y: coordenadasCalibradas[13].y
            },
            {
              id: "pin_14_poster3",
              numero: 14,
              titulo: "14. Pôster: Eric Tufão 3",
              desc: "Filme de ação com 3 explosões ao fundo estrelando Arnaldo Fritz. Indica o livro da Prateleira 3: 'Explosivos Industriais Vol. III'.",
              imagem: "/uploads/idolo_pedra/handouts/Handout 9 - Pôster Eric Tufão 3 - A Explosão Explosiva.jpg",
              x: coordenadasCalibradas[14].x,
              y: coordenadasCalibradas[14].y
            },
            {
              id: "pin_15_poster4",
              numero: 15,
              titulo: "15. Pôster: Thunderland 2008",
              desc: "Festival de rock com a banda Dragões Metálicos de Kurt Hemmis. Indica o livro da Prateleira 5: 'Aprenda Guitarra Sem Ter Uma Guitarra'.",
              imagem: "/uploads/idolo_pedra/handouts/Handout 10 - Thunderland 2008.jpg",
              x: coordenadasCalibradas[15].x,
              y: coordenadasCalibradas[15].y
            },
            {
              id: "pin_16_porta_saida",
              numero: 16,
              titulo: "16. Porta de Metal com TRANCATRON (Saída)",
              desc: "Única rota de escape do porão. Painel eletrônico com senha de 6 dígitos: 160322 (16 de março de 2022, data do primeiro ritual).",
              imagem: "/uploads/idolo_pedra/pontos/porta_saida_trancatron.jpg",
              x: coordenadasCalibradas[16].x,
              y: coordenadasCalibradas[16].y
            },
            {
              id: "pin_17_idolo",
              numero: 17,
              titulo: "17. O Ídolo de Pedra (Objeto Amaldiçoado)",
              desc: "Estatueta de 30cm e duas faces com entranhas podres orgânicas por dentro. Ao ser aberta, ativa a contagem de rodadas de 'A Dívida Precisa Ser Paga'!",
              imagem: "/uploads/idolo_pedra/pontos/idolo_de_pedra.jpg",
              x: coordenadasCalibradas[17].x,
              y: coordenadasCalibradas[17].y
            }
          ]
        },
        {
          id: "comodo_sala_secreta",
          nome: "A Sala Secreta (Man Cave de Gustavo)",
          andar: "Subsolo",
          imagem: "/uploads/idolo_pedra/pontos/sala_secreta_geral.jpg",
          imagemBatalha: "/uploads/idolo_pedra/mapas/Mapa 02 - O Porão + Sala Secreta.jpg",
          narracao: "Vocês acessam uma sala ampla com paredes cobertas por espuma acústica preta. Há uma mesa de poker, outra de sinuca, uma grelha de churrasco com coifa, um computador antigo de tubo desligado e um freezer grande manchado de sangue.",
          pins: [
            {
              id: "pin_18_poker",
              numero: 18,
              titulo: "18. Mesa de Poker",
              desc: "Cartas e fichas espalhadas sobre o tapete geométrico. Uma cadeira derrubada segue uma trilha de sangue arrastado no chão em direção ao freezer.",
              imagem: "/uploads/idolo_pedra/pontos/mesa_poker.jpg",
              x: coordenadasCalibradas[18].x,
              y: coordenadasCalibradas[18].y
            },
            {
              id: "pin_19_sinuca",
              numero: 19,
              titulo: "19. Mesa de Bilhar",
              desc: "Mesa de feltro verde com bolas de sinuca e um taco jogado. Ambiente onde Gustavo confraternizava com seus amigos.",
              imagem: "/uploads/idolo_pedra/pontos/mesa_sinuca.jpg",
              x: coordenadasCalibradas[19].x,
              y: coordenadasCalibradas[19].y
            },
            {
              id: "pin_20_churrasqueira",
              numero: 20,
              titulo: "20. Grelha de Churrasco & Coifa",
              desc: "Espaço para churrasco com isolamento acústico. A coifa se conecta ao teto mas o duto é estreito demais para fuga.",
              imagem: "/uploads/idolo_pedra/pontos/churrasqueira_grelha.jpg",
              x: coordenadasCalibradas[20].x,
              y: coordenadasCalibradas[20].y
            },
            {
              id: "pin_21_roupas",
              numero: 21,
              titulo: "21. Armário de Roupas Revirado",
              desc: "Roupas masculinas tamanho G caídas no chão com manchas de sangue, caixas e ferramentas.",
              imagem: "/uploads/idolo_pedra/pontos/armario_roupas_varal.jpg",
              x: coordenadasCalibradas[21].x,
              y: coordenadasCalibradas[21].y
            },
            {
              id: "pin_22_computador",
              numero: 22,
              titulo: "22. Computador CRT de Gustavo",
              desc: "Computador antigo com monitor de tubo. Exige ligar o disjuntor 'Segredo' no painel elétrico. Contém histórico de compras de livros ocultistas e arquivos pessoais.",
              imagem: "/uploads/idolo_pedra/pontos/computador_crt.jpg",
              x: coordenadasCalibradas[22].x,
              y: coordenadasCalibradas[22].y
            },
            {
              id: "pin_23_freezer",
              numero: 23,
              titulo: "23. Freezer Trancado com Cadeado",
              desc: "Freezer horizontal ligado na tomada com cadeado grosso reforçado e correntes (DESTRANCAR 4d6 ou ARROMBAR DT 14, PA 25). Dentro está o corpo congelado de Gustavo!",
              imagem: "/uploads/idolo_pedra/pontos/freezer_cadaver.jpg",
              x: coordenadasCalibradas[23].x,
              y: coordenadasCalibradas[23].y
            },
            {
              id: "pin_24_cadaver",
              numero: 24,
              titulo: "24. Cadáver de Gustavo",
              desc: "Corpo do homem de cerca de 30 anos com ferimentos profundos de faca nas costas e marcas ritualísticas no peito. No bolso dele está o Molho de Chaves 2 (chave do armário de metal onde está o ídolo).",
              imagem: "/uploads/idolo_pedra/handouts/Handout 13 - Cadáver de Gustavo.jpg",
              x: coordenadasCalibradas[24].x,
              y: coordenadasCalibradas[24].y
            }
          ]
        }
      ]
    }
  ],
  agentes: [
    {
      id: "ag_alan",
      nome: "Alan",
      origem: "Universitário de TI",
      classe: "Sobrevivente",
      pv: 9,
      pvMax: 10,
      pe: 2,
      peMax: 2,
      sanidade: 8,
      sanMax: 8,
      pontosDefesa: 1,
      imagem: "/uploads/idolo_pedra/tokens/Token - Alan.png",
      fichaPdf: "/uploads/idolo_pedra/fichas/Ficha - Alan.pdf",
      atributos: { agi: 2, for: 1, int: 3, pre: 2, vig: 1 },
      pericias: [
        { nome: "Tecnologia", bonus: 5 },
        { nome: "Investigação", bonus: 5 },
        { nome: "Percepção", bonus: 2 }
      ],
      armas: [
        { nome: "Ataque Desarmado", teste: "1d20+1", dano: "1d4" }
      ],
      inventario: [
        { nome: "Carteira sem dinheiro", desc: "Documento de estudante vencido." }
      ]
    },
    {
      id: "ag_victor",
      nome: "Victor",
      origem: "Ocultista Amador",
      classe: "Sobrevivente",
      pv: 8,
      pvMax: 8,
      pe: 3,
      peMax: 3,
      sanidade: 6,
      sanMax: 6,
      pontosDefesa: 0,
      imagem: "/uploads/idolo_pedra/tokens/Token - Victor.png",
      fichaPdf: "/uploads/idolo_pedra/fichas/Ficha - Victor.pdf",
      atributos: { agi: 1, for: 1, int: 2, pre: 3, vig: 1 },
      pericias: [
        { nome: "Ocultismo", bonus: 5 },
        { nome: "Religião", bonus: 5 },
        { nome: "Intuição", bonus: 2 }
      ],
      armas: [
        { nome: "Ataque Desarmado", teste: "1d20+1", dano: "1d4" }
      ],
      inventario: [
        { nome: "Giz branco quebrado", desc: "Usado para traçar sigilos." }
      ]
    },
    {
      id: "ag_edgar",
      nome: "Edgar",
      origem: "Mecânico / Segurança",
      classe: "Sobrevivente",
      pv: 14,
      pvMax: 14,
      pe: 1,
      peMax: 1,
      sanidade: 6,
      sanMax: 6,
      pontosDefesa: 2,
      imagem: "/uploads/idolo_pedra/tokens/Token - Edgar.png",
      fichaPdf: "/uploads/idolo_pedra/fichas/Ficha - Edgar.pdf",
      atributos: { agi: 1, for: 3, int: 1, pre: 1, vig: 3 },
      pericias: [
        { nome: "Atletismo", bonus: 5 },
        { nome: "Luta", bonus: 5 },
        { nome: "Fortitude", bonus: 5 }
      ],
      armas: [
        { nome: "Golpe Pesado (Desarmado)", teste: "1d20+3", dano: "1d4+3" }
      ],
      inventario: [
        { nome: "Chave de fenda gasta", desc: "Ferramenta útil para forçar fechaduras." }
      ]
    },
    {
      id: "ag_eloisa",
      nome: "Eloísa",
      origem: "Enfermeira",
      classe: "Sobrevivente",
      pv: 10,
      pvMax: 10,
      pe: 2,
      peMax: 2,
      sanidade: 9,
      sanMax: 9,
      pontosDefesa: 1,
      imagem: "/uploads/idolo_pedra/tokens/Token - Eloísa.png",
      fichaPdf: "/uploads/idolo_pedra/fichas/Ficha - Eloísa.pdf",
      atributos: { agi: 2, for: 1, int: 2, pre: 2, vig: 2 },
      pericias: [
        { nome: "Medicina", bonus: 5 },
        { nome: "Percepção", bonus: 5 },
        { nome: "Vontade", bonus: 2 }
      ],
      armas: [
        { nome: "Ataque Desarmado", teste: "1d20+1", dano: "1d4" }
      ],
      inventario: [
        { nome: "Atadura limpa", desc: "Estanca sangramentos." }
      ]
    },
    {
      id: "ag_kenia",
      nome: "Kênia",
      origem: "Atleta / Parkour",
      classe: "Sobrevivente",
      pv: 8,
      pvMax: 8,
      pe: 2,
      peMax: 2,
      sanidade: 7,
      sanMax: 7,
      pontosDefesa: 1,
      imagem: "/uploads/idolo_pedra/tokens/Token - Kênia.png",
      fichaPdf: "/uploads/idolo_pedra/fichas/Ficha - Kênia.pdf",
      atributos: { agi: 3, for: 1, int: 1, pre: 2, vig: 1 },
      pericias: [
        { nome: "Acrobacia", bonus: 5 },
        { nome: "Furtividade", bonus: 5 },
        { nome: "Reflexos", bonus: 5 }
      ],
      armas: [
        { nome: "Chute Ágil", teste: "1d20+3", dano: "1d4+1" }
      ],
      inventario: [
        { nome: "Tênis esportivo", desc: "Aderência máxima para escaladas." }
      ]
    }
  ],
  ameacas: [
    {
      id: "am_cadáveres_vivos",
      nome: "Cadáveres Vivos (Os Amaldiçoados do Ídolo)",
      imagem: "/uploads/idolo_pedra/handouts/Handout 13 - Cadáver de Gustavo.jpg",
      vd: 20,
      pv: 25,
      pvMax: 25,
      defesa: 12,
      ataques: [
        { nome: "Garras Putrefatas", teste: "2d20+5", dano: "1d8+3 Morte" },
        { nome: "Abraço Sufocante", teste: "1d20+4", dano: "1d6+2 Dano + Agarrado" }
      ],
      habilidades: [
        { nome: "Putrefação Acelerada", desc: "Ao receber dano de fogo, sofre +5 de dano adicional." },
        { nome: "Resistência de Morte", desc: "Imune a veneno e efeitos mentais." }
      ]
    }
  ],
  handouts: [
    { id: "h01", titulo: "Handout 01 - Bilhete no Chão", url: "/uploads/idolo_pedra/handouts/Handout 01 - Bilhete no Chão.jpg" },
    { id: "h02", titulo: "Handout 02 - Símbolo no Teto", url: "/uploads/idolo_pedra/handouts/Handout 02 - Símbolo no Teto.jpg" },
    { id: "h03", titulo: "Handout 03 - Papel Rasgado 1", url: "/uploads/idolo_pedra/handouts/Handout 03 - Papel Rasgado 1.jpg" },
    { id: "h04", titulo: "Handout 04 - Papel Rasgado 2", url: "/uploads/idolo_pedra/handouts/Handout 04 - Papel Rasgado 2.jpg" },
    { id: "h05", titulo: "Handout 05 - Papel Rasgado 3", url: "/uploads/idolo_pedra/handouts/Handout 05 - Papel Rasgado 3.jpg" },
    { id: "h06", titulo: "Handout 06 - Papel Rasgado 4", url: "/uploads/idolo_pedra/handouts/Handout 06 - Papel Rasgado 4.jpg" },
    { id: "h07", titulo: "Handout 07 - Pôster Lutadores de Rua", url: "/uploads/idolo_pedra/handouts/Handout 07 - Pôster Lutadores de Rua.jpg" },
    { id: "h08", titulo: "Handout 08 - Pôster Futebol", url: "/uploads/idolo_pedra/handouts/Handout 08 - Pôster Unidos do Invisível Futebol Clube.jpg" },
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

// 3. Tabuleiro com Tokens e Galeria de Mapas
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
    x: 14.8,
    y: 7.2,
    tamanho: 65,
    escala: 0.9,
    visivel: false,
    isMonstro: true,
    ataques: [
      { nome: "Pulso de Angústia", teste: "Automático", bonus: 0, dano: "1 PD" }
    ]
  }
];

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

const catalogoAgentes = [
  { id: "cat_alan", nome: "Alan", img: "/uploads/idolo_pedra/tokens/Token - Alan.png", pv: 9, pvMax: 10, defesa: 12, isMonstro: false },
  { id: "cat_victor", nome: "Victor", img: "/uploads/idolo_pedra/tokens/Token - Victor.png", pv: 8, pvMax: 8, defesa: 11, isMonstro: false },
  { id: "cat_eloisa", nome: "Eloísa", img: "/uploads/idolo_pedra/tokens/Token - Eloísa.png", pv: 10, pvMax: 10, defesa: 12, isMonstro: false },
  { id: "cat_edgar", nome: "Edgar (Acorrentado)", img: "/uploads/idolo_pedra/tokens/Token - Edgar.png", pv: 14, pvMax: 14, defesa: 10, isMonstro: false },
  { id: "cat_kenia", nome: "Kênia", img: "/uploads/idolo_pedra/tokens/Token - Kênia.png", pv: 8, pvMax: 8, defesa: 11, isMonstro: false },
  { id: "cat_idolo", nome: "Ídolo de Pedra", img: "/uploads/idolo_pedra/pontos/idolo_de_pedra.jpg", pv: 20, pvMax: 20, defesa: 15, isMonstro: true }
];

campanhaIdolo.tabuleiro = {
  mapaAtivoId: "mapa_01_o_porao",
  mapaAtivoUrl: "/uploads/idolo_pedra/mapas/Mapa 01 - O Porão.jpg",
  galeriaMapas: galeriaMapas,
  tokens: JSON.parse(JSON.stringify(initialTokens)),
  catalogoAgentes: catalogoAgentes,
  fogData: null,
  drawData: null,
  camera: { x: 0, y: 0, zoom: 1 }
};

// 4. Salvar campanhas.json e campanhas.json.bak
const campanhasPath = path.join(__dirname, '..', 'campanhas.json');
const campanhasBakPath = path.join(__dirname, '..', 'campanhas.json.bak');
let campanhas = [];

if (fs.existsSync(campanhasBakPath)) {
  try {
    campanhas = JSON.parse(fs.readFileSync(campanhasBakPath, 'utf8'));
  } catch (e) {
    campanhas = [];
  }
}

campanhas = campanhas.filter(c => c.id !== campanhaIdolo.id);
campanhas.unshift(campanhaIdolo);

const jsonStr = JSON.stringify(campanhas, null, 2);
fs.writeFileSync(campanhasPath, jsonStr, 'utf8');
fs.writeFileSync(campanhasBakPath, jsonStr, 'utf8');

console.log('campanhas.json e campanhas.json.bak salvos com sucesso!');
console.log('Todos os 24 pins agora possuem imagens detalhadas dedicadas!');
