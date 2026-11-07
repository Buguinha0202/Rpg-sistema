const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function toBase64(filePath) {
    if (fs.existsSync(filePath)) {
        const ext = path.extname(filePath).replace('.', '');
        const mime = ext === 'webp' ? 'image/webp' : ext === 'png' ? 'image/png' : 'image/jpeg';
        const data = fs.readFileSync(filePath).toString('base64');
        return `data:${mime};base64,${data}`;
    }
    return '';
}

const imgCasaJuno = toBase64(path.join(__dirname, 'public/uploads/casa_juno.webp'));
const imgJae = toBase64(path.join(__dirname, 'public/uploads/JaeComCapuz.webp'));
const imgMansao = toBase64(path.join(__dirname, 'public/uploads/mansao_tipora.webp'));
const imgX = toBase64(path.join(__dirname, 'public/uploads/X.webp'));

const htmlContent = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>Natal Macabro - Amostra Oficial de Livro de Campanha</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700;900&family=Cinzel+Decorative:wght@700&family=Crimson+Pro:ital,wght@0,400;0,600;0,700;1,400;1,600&family=Inter:wght@400;600;700;900&display=swap" rel="stylesheet">
<style>
  @page {
    size: A4 portrait;
    margin: 12mm 14mm 14mm 14mm;
    @bottom-right {
      content: counter(page);
    }
  }

  * {
    box-sizing: border-box;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  body {
    margin: 0;
    padding: 0;
    font-family: 'Crimson Pro', Georgia, serif;
    font-size: 10.5pt;
    line-height: 1.42;
    color: #1a1715;
    background-color: #fcfbf7;
  }

  .page {
    position: relative;
    page-break-after: always;
    min-height: 270mm;
    padding: 0;
  }

  .page:last-child {
    page-break-after: avoid;
  }

  /* Header & Footer */
  .page-header {
    border-bottom: 2px solid #8b0000;
    padding-bottom: 3px;
    margin-bottom: 12px;
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    font-family: 'Cinzel', serif;
    font-size: 8.5pt;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    color: #661010;
  }

  .page-footer {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    border-top: 1px solid #d4c8b8;
    padding-top: 4px;
    display: flex;
    justify-content: space-between;
    font-family: 'Cinzel', serif;
    font-size: 8pt;
    color: #8c8275;
    letter-spacing: 1px;
  }

  /* Typography */
  h1.chapter-title {
    font-family: 'Cinzel Decorative', 'Cinzel', serif;
    font-size: 21pt;
    font-weight: 700;
    color: #5c0a0a;
    text-align: center;
    margin: 0 0 2px 0;
    letter-spacing: 1px;
    text-transform: uppercase;
  }

  .chapter-subtitle {
    font-family: 'Cinzel', serif;
    font-size: 10pt;
    font-weight: 700;
    text-align: center;
    color: #3d352e;
    letter-spacing: 3px;
    text-transform: uppercase;
    margin-bottom: 10px;
  }

  .ornament-divider {
    text-align: center;
    color: #8b0000;
    margin-bottom: 10px;
    font-size: 12pt;
    letter-spacing: 6px;
  }

  h2 {
    font-family: 'Cinzel', serif;
    font-size: 13pt;
    font-weight: 700;
    color: #6a1010;
    border-bottom: 1px solid #c9b097;
    padding-bottom: 2px;
    margin: 10px 0 6px 0;
    letter-spacing: 0.8px;
    text-transform: uppercase;
  }

  h3 {
    font-family: 'Cinzel', serif;
    font-size: 10.5pt;
    font-weight: 700;
    color: #2b231d;
    margin: 8px 0 3px 0;
  }

  /* Two column layout */
  .columns {
    column-count: 2;
    column-gap: 18px;
    text-align: justify;
  }

  .full-width {
    column-span: all;
  }

  /* World Tags Box (Worlds Without Number) */
  .world-tags-bar {
    background: #201b18;
    color: #eae3d2;
    border-radius: 3px;
    padding: 6px 10px;
    font-family: 'Inter', sans-serif;
    font-size: 8pt;
    margin-bottom: 12px;
    display: flex;
    justify-content: space-between;
    flex-wrap: wrap;
    border-left: 4px solid #b32424;
  }

  .world-tag-item strong {
    color: #e5a93c;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  /* Boxed Read-Aloud Text (Curse of Strahd) */
  .read-aloud {
    background: #f4efe6;
    border: 1px solid #dcd1c0;
    border-left: 4px solid #8b0000;
    padding: 8px 12px;
    margin: 8px 0 10px 0;
    font-style: italic;
    font-size: 10pt;
    line-height: 1.45;
    color: #231c18;
    box-shadow: inset 0 0 10px rgba(0,0,0,0.02);
  }

  .read-aloud strong {
    font-style: normal;
    color: #6a1010;
  }

  /* 10 Secrets & Clues Box (Lazy Dungeon Master) */
  .secrets-box {
    background: #faf6f0;
    border: 2px solid #8b0000;
    border-radius: 4px;
    padding: 8px 12px;
    margin: 10px 0;
    break-inside: avoid;
  }

  .secrets-box h4 {
    margin: 0 0 6px 0;
    font-family: 'Cinzel', serif;
    font-size: 10pt;
    color: #8b0000;
    text-transform: uppercase;
    letter-spacing: 1px;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .secrets-box ol {
    margin: 0;
    padding-left: 18px;
    font-size: 9.5pt;
    line-height: 1.35;
  }

  .secrets-box li {
    margin-bottom: 4px;
  }

  /* Keyed Room (The Dark of Hot Springs Island) */
  .room-key {
    background: #fff;
    border: 1px solid #e2d7c7;
    border-radius: 3px;
    padding: 8px 10px;
    margin-bottom: 10px;
    break-inside: avoid;
    box-shadow: 0 1px 3px rgba(0,0,0,0.04);
  }

  .room-badge {
    display: inline-block;
    background: #731313;
    color: #fff;
    font-family: 'Inter', sans-serif;
    font-size: 8pt;
    font-weight: 900;
    padding: 2px 6px;
    border-radius: 2px;
    margin-right: 6px;
    letter-spacing: 0.5px;
  }

  .room-name {
    font-family: 'Cinzel', serif;
    font-size: 10.5pt;
    font-weight: 700;
    color: #221c17;
  }

  .room-senses {
    font-size: 8.5pt;
    color: #7a6e63;
    font-style: italic;
    margin: 2px 0 6px 0;
    display: block;
  }

  ul.hsi-bullets {
    list-style: none;
    padding-left: 0;
    margin: 4px 0 0 0;
    font-size: 9.5pt;
  }

  ul.hsi-bullets > li {
    position: relative;
    padding-left: 14px;
    margin-bottom: 5px;
    line-height: 1.35;
  }

  ul.hsi-bullets > li::before {
    content: "▪";
    position: absolute;
    left: 0;
    color: #8b0000;
    font-size: 11pt;
    top: -1px;
  }

  .item-bold {
    font-weight: 700;
    color: #1a1715;
    text-transform: uppercase;
    font-size: 8.5pt;
    letter-spacing: 0.3px;
    background: #f1ebd8;
    padding: 0 3px;
    border-radius: 2px;
  }

  /* Tables (Shadowdark) */
  table.dark-table {
    width: 100%;
    border-collapse: collapse;
    font-family: 'Inter', sans-serif;
    font-size: 8.5pt;
    margin: 8px 0;
    break-inside: avoid;
  }

  table.dark-table th {
    background: #2a221d;
    color: #f5eedb;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.6px;
    padding: 5px 8px;
    text-align: left;
    border-bottom: 2px solid #8b0000;
  }

  table.dark-table td {
    padding: 4px 8px;
    border-bottom: 1px solid #e8decb;
    vertical-align: top;
  }

  table.dark-table tr:nth-child(even) td {
    background: #f7f3ea;
  }

  /* Statblock (Monster / Killer) */
  .statblock {
    background: #fdfaf3;
    border: 2px solid #8b0000;
    border-radius: 4px;
    padding: 8px 12px;
    margin: 10px 0;
    break-inside: avoid;
    box-shadow: 2px 2px 6px rgba(0,0,0,0.06);
  }

  .statblock-header {
    border-bottom: 2px solid #8b0000;
    padding-bottom: 4px;
    margin-bottom: 6px;
  }

  .statblock-name {
    font-family: 'Cinzel Decorative', serif;
    font-size: 14pt;
    font-weight: 700;
    color: #6a1010;
    margin: 0;
  }

  .statblock-meta {
    font-style: italic;
    font-size: 8.5pt;
    color: #5c5249;
    margin: 0;
  }

  .stat-grid {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    background: #efe8dc;
    border-radius: 3px;
    padding: 4px 0;
    margin: 6px 0;
    text-align: center;
    font-family: 'Inter', sans-serif;
  }

  .stat-box .stat-label {
    font-size: 7.5pt;
    font-weight: 700;
    color: #731313;
  }

  .stat-box .stat-val {
    font-size: 10pt;
    font-weight: 900;
    color: #1a1715;
  }

  .stat-line {
    font-family: 'Inter', sans-serif;
    font-size: 8.5pt;
    margin: 3px 0;
    line-height: 1.35;
  }

  .stat-line strong {
    color: #6a1010;
  }

  .stat-trait {
    margin: 5px 0;
    font-size: 9pt;
    line-height: 1.35;
  }

  .stat-trait strong {
    font-family: 'Inter', sans-serif;
    color: #2b231d;
  }

  .section-divider-bar {
    height: 1px;
    background: linear-gradient(to right, transparent, #8b0000, transparent);
    margin: 8px 0;
  }

  /* Images styling */
  .inline-illustration {
    width: 100%;
    border-radius: 3px;
    border: 1px solid #8b0000;
    margin: 6px 0;
    box-shadow: 0 2px 5px rgba(0,0,0,0.15);
  }

  .caption {
    font-size: 7.5pt;
    text-align: center;
    color: #6e6459;
    font-style: italic;
    margin-top: -3px;
    margin-bottom: 6px;
    display: block;
  }

  /* Doom Clock */
  .doom-clock-container {
    background: #1e1916;
    color: #f0e6d6;
    border: 1px solid #731313;
    border-radius: 4px;
    padding: 8px 10px;
    margin: 8px 0;
    font-family: 'Inter', sans-serif;
    break-inside: avoid;
  }

  .doom-clock-title {
    font-family: 'Cinzel', serif;
    font-size: 9.5pt;
    color: #e5a93c;
    font-weight: 700;
    letter-spacing: 0.8px;
    margin-bottom: 4px;
  }

  .clock-segments {
    display: flex;
    gap: 4px;
    margin: 6px 0;
  }

  .clock-seg {
    flex: 1;
    background: #332b25;
    border: 1px solid #57483e;
    height: 14px;
    border-radius: 2px;
    position: relative;
    text-align: center;
    font-size: 7pt;
    font-weight: bold;
    color: #bbb;
    line-height: 14px;
  }

  .clock-seg.active {
    background: #a31c1c;
    border-color: #e5a93c;
    color: #fff;
  }
</style>
</head>
<body>

<!-- PÁGINA 1: VISÃO GERAL, WORLD TAGS & OS 10 SEGREDOS -->
<div class="page">
  <div class="page-header">
    <span>Módulo de Campanha: Natal Macabro</span>
    <span>Ato II: O Casarão da Falsa Paz</span>
  </div>

  <h1 class="chapter-title">A Casa Juno</h1>
  <div class="chapter-subtitle">O Refúgio de Natal e a Caçada no Escuro</div>
  <div class="ornament-divider">❖ &nbsp; ❖ &nbsp; ❖</div>

  <div class="world-tags-bar full-width">
    <div class="world-tag-item"><strong>Inimigos:</strong> Park Jae-Yoon ("X") &bull; Cães de Caça</div>
    <div class="world-tag-item"><strong>Amigos:</strong> Ninguém (O Delegado Aguiar é um embuste)</div>
    <div class="world-tag-item"><strong>Complicações:</strong> Apagão iminente &bull; Janelas gradeadas &bull; Tempestade violenta</div>
    <div class="world-tag-item"><strong>Coisas:</strong> Chaves antigas &bull; Machado de lenha &bull; Diário de Jorge &bull; Álcool etílico</div>
  </div>

  <div class="columns">
    <div class="read-aloud">
      "Vocês batem a pesada porta de carvalho às suas costas. No mesmo instante, o urro da tempestade e os latidos ferozes da matilha ficam abafados lá fora. O contraste do interior é perturbador: o ar cheira a lenha seca e pinho silvestre. Uma lareira colossal queima com brasas rubras, e no centro da sala ergue-se uma árvore de Natal iluminada, enfeitada de veludo vermelho, cercando caixas embrulhadas com fitas de cetim. Sobre o aparador, a luz verde de um telefone fixo parece piscar convidativa..."
    </div>

    <h2>Começo Forte (A Falsa Segurança)</h2>
    <p>O objetivo do casarão é desarmar a paranoia dos jogadores por dez minutos. O ambiente é acolhedor, quente e parece um porto seguro contra o terror da rodovia. O Mestre deve deixar o grupo respirar, explorar livremente os cômodos e fazer contato telefônico antes do desfecho do isolamento.</p>

    <!-- FOTO DA CASA JUNO -->
    <img src="${imgCasaJuno}" class="inline-illustration" alt="Interior da Casa Juno">
    <span class="caption">A Casa Juno: calor ilusório antes do corte de energia.</span>

    <!-- DOOM CLOCK (REVISADO DE SHADOWDARK/BLADES) -->
    <div class="doom-clock-container">
      <div class="doom-clock-title">⏳ Relógio de Tensão: A Ceia da Meia-Noite</div>
      <div style="font-size: 8pt; margin-bottom: 4px;">Avance 1 segmento a cada teste ruidoso falho, hesitação longa ou busca demorada.</div>
      <div class="clock-segments">
        <div class="clock-seg active">1. Calor</div>
        <div class="clock-seg active">2. Telefone</div>
        <div class="clock-seg">3. Viatura</div>
        <div class="clock-seg">4. Ruídos</div>
        <div class="clock-seg">5. Luz Pisca</div>
        <div class="clock-seg" style="background:#5c0a0a; color:#ffb0b0;">6. APAGÃO</div>
      </div>
      <div style="font-size: 7.5pt; color: #cfc2b2; margin-top: 4px;">
        <em>No segmento 6:</em> As lâmpadas explodem em curto. Cheiro acre de plástico queimado. <strong>Park Jae-Yoon</strong> já está dentro da casa.
      </div>
    </div>

    <!-- 10 SEGREDOS E PISTAS (Sly Flourish / Return of Lazy DM) -->
    <div class="secrets-box">
      <h4>📜 10 Segredos &amp; Pistas Portáteis (Entregue onde investigarem)</h4>
      <ol>
        <li>O ônibus não quebrou por acaso; uma chapa soldada com <em>miguelitos</em> foi armada na curva.</li>
        <li>O motorista Dalmo fuma cigarros de cravo — há bitucas idênticas pisadas no barro da varanda.</li>
        <li>Alice Lucina foi presa em 25/12/2013; hoje completa exatamente 10 anos de seu ritual inconcluso.</li>
        <li>O Delegado Aguiar nunca chamou reforços; o rádio da viatura policial estava desconectado.</li>
        <li>A árvore de Natal foi decorada há poucas horas; a resina nos galhos ainda está fresca e pegajosa.</li>
        <li>Um dos sobreviventes anteriores, Jorge, deixou mensagens gravadas a faca antes de desaparecer.</li>
        <li>Há um gerador a diesel enferrujado na Cabana Eclipse que pode religar as travas do portão.</li>
        <li>A figura de máscara "X" não fala; ela apenas imita o som de uma navalha cortando carne.</li>
        <li>A porta da cozinha tem três trancas, mas a madeira ao redor do batente está apodrecida.</li>
        <li>Existe um túmulo sem identificação no cume da colina que guarda uma máscara de cerâmica rubra.</li>
      </ol>
    </div>

    <h2>Tabela de Tensão Imediata</h2>
    <p>Quando os jogadores hesitarem ou tirarem falhas em testes de perícia, role 1d6:</p>

    <!-- TABELA SHADOWDARK -->
    <table class="dark-table">
      <thead>
        <tr>
          <th style="width: 15%;">d6</th>
          <th>Evento / Ruído Sinistro</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>1</strong></td>
          <td>Um estalo seco de galho sob a janela. Uma mão enluvada bate de leve no vidro e some.</td>
        </tr>
        <tr>
          <td><strong>2</strong></td>
          <td>O telefone fixo toca <strong>uma única vez</strong> com som estridente. Ao atender, apenas respiração lenta.</td>
        </tr>
        <tr>
          <td><strong>3</strong></td>
          <td>Uma bola de vidro da árvore cai no assoalho e se despedaça. O reflexo nos cacos revela uma sombra no teto.</td>
        </tr>
        <tr>
          <td><strong>4</strong></td>
          <td>As lâmpadas diminuem de intensidade; o som do vento assobia pelas frestas imitando choro infantil.</td>
        </tr>
        <tr>
          <td><strong>5</strong></td>
          <td>Um relógio de pêndulo no corredor dispara sete badaladas roucas totalmente fora de hora.</td>
        </tr>
        <tr>
          <td><strong>6</strong></td>
          <td><strong>Ataque de Emboscada:</strong> Uma lâmina tática perfura a madeira ao lado da cabeça de um personagem!</td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="page-footer">
    <span>Natal Macabro &bull; Módulo de Campanha</span>
    <span>Página 12</span>
  </div>
</div>

<!-- PÁGINA 2: MAPEAMENTO HOT SPRINGS ISLAND & STATBLOCK DA ASSASSINA -->
<div class="page">
  <div class="page-header">
    <span>Ato II: A Casa Juno</span>
    <span>Locais Chaveados &amp; Ameaça</span>
  </div>

  <div class="columns">

    <h2>Locais Chaveados da Casa Juno</h2>
    <p>Organizados no padrão <em>The Dark of Hot Springs Island</em>: tópicos rápidos, negritos nos elementos interagíveis e três rotas de resolução para evitar travamentos.</p>

    <!-- SALA 01: SALÃO PRINCIPAL -->
    <div class="room-key">
      <span class="room-badge">01</span>
      <span class="room-name">Salão Principal &amp; Lareira</span>
      <span class="room-senses">Cheiro de pinheiro fresco &bull; Calor estalante &bull; Som de unhas caninas arranhando as paredes externas</span>
      <ul class="hsi-bullets">
        <li><span class="item-bold">A Árvore de Natal:</span> 2,5 metros de altura. Bolas vermelhas espelhadas. Sob ela, caixas com laços finos. A maior caixa contém cinzas de ossos e um <strong>Dente Humano Molar</strong> arrancado.</li>
        <li><span class="item-bold">O Retrato de Alice Lucina:</span> Pintura a óleo com moldura de carvalho rachada.
          <em>Se examinado de perto:</em> Os olhos da tela foram furados com ponta de lâmina. No verso, o símbolo <strong>"X"</strong> entalhado a faca recente.</li>
        <li><span class="item-bold">O Suporte da Lareira:</span> Ferro fundido ornamentado. Contém um <strong>Atiçador de Ferro Pesado</strong> (Arma 1d6+FOR) e um <strong>Machado de Lenha</strong> (pode arrombar portas de madeira em 2 rodadas).</li>
      </ul>
    </div>

    <!-- SALA 02: COZINHA E PONTO DE FUGA -->
    <div class="room-key">
      <span class="room-badge">02</span>
      <span class="room-name">Cozinha dos Fundos (Ponto de Fuga)</span>
      <span class="room-senses">Piso de cerâmica fria &bull; Cheiro de gordura velha e ferrugem &bull; Vento uivando sob o batente</span>
      <ul class="hsi-bullets">
        <li><span class="item-bold">A Porta dos Fundos:</span> Trancada por fora com ferrolho reforçado de latão. Inscrição talhada a faca: <em>"O 'X' marca o lugar..."</em>.
          <br><strong>3 Rotas de Escape (Regra de Três Pistas):</strong>
          <br>&bull; <em>Rota A (Chaves):</em> Destrancada com o <strong>Molho de Chaves de Bronze</strong> encontrado na Sala de Jogos.
          <br>&bull; <em>Rota B (Força Bruta):</em> Arrombada com 3 golpes do <strong>Machado de Lenha</strong> da lareira (atrai Jae no 2º golpe).
          <br>&bull; <em>Rota C (Despensa):</em> Uma janela basculante alta travada por pregos; requer teste de <strong>Ladinagem DT 12</strong> ou <strong>Força DT 14</strong> para arrancar a chapa.</li>
        <li><span class="item-bold">O Fogão Antigo:</span> Marcado com "X" de tinta vermelha escorrida. Dentro do forno: <strong>2 Garrafas de Álcool 70%</strong> e panos secos (podem criar tochas defensivas ou coquetéis artesanais).</li>
      </ul>
    </div>

    <!-- SALA 03: SALA DE JOGOS E MEZANINO -->
    <div class="room-key">
      <span class="room-badge">03</span>
      <span class="room-name">Sala de Jogos (Andar Superior)</span>
      <span class="room-senses">Tábua que range alto &bull; Pano verde da sinuca mofado &bull; Troféus de caça na parede</span>
      <ul class="hsi-bullets">
        <li><span class="item-bold">A Mesa de Sinuca:</span> Bolas espalhadas formando a letra X.
          <em>Se vasculharem as caçapas de couro:</em> Na caçapa do canto nordeste, encontra-se o <strong>Molho com 10 Chaves Antigas</strong>.</li>
        <li><span class="item-bold">A Cabeça de Cervo Empalhada:</span> Fixada na parede acima da escada. Um olho de vidro caiu. Por trás do pedestal de madeira há um compartimento oculto guardando <strong>1 Caixa com 6 Balas de Calibre .38</strong>.</li>
        <li><span class="item-bold">Ponto Crítico de Emboscada:</span> No segundo em que as chaves são recolhidas, o som de assobio cessa no andar de baixo. <strong>Park Jae-Yoon</strong> surge silenciosa no vão da escada.</li>
      </ul>
    </div>

    <!-- FOTO DE JAE COM CAPUZ -->
    <img src="${imgJae}" class="inline-illustration" alt="Park Jae-Yoon (X)" style="max-height: 120px; object-fit: cover; object-position: top;">
    <span class="caption">Park Jae-Yoon: sorriso imóvel, faca militar e zero piedade.</span>

    <!-- STATBLOCK OFICIAL DE JAE (PADRÃO 5E / SHADOWDARK / OSR) -->
    <div class="statblock">
      <div class="statblock-header">
        <h3 class="statblock-name">Park Jae-Yoon ("X")</h3>
        <p class="statblock-meta">Humana (Assassina Ritualística do Sangue) &bull; Ameaça Nível 4 (Letal)</p>
      </div>

      <div class="stat-grid">
        <div class="stat-box"><span class="stat-label">FOR</span><div class="stat-val">+3 (16)</div></div>
        <div class="stat-box"><span class="stat-label">AGI</span><div class="stat-val">+4 (18)</div></div>
        <div class="stat-box"><span class="stat-label">VIG</span><div class="stat-val">+3 (16)</div></div>
        <div class="stat-box"><span class="stat-label">INT</span><div class="stat-val">+2 (14)</div></div>
        <div class="stat-box"><span class="stat-label">PRE</span><div class="stat-val">+4 (18)</div></div>
        <div class="stat-box"><span class="stat-label">DEF</span><div class="stat-val">17</div></div>
      </div>

      <div class="stat-line"><strong>Pontos de Vida:</strong> Incalculável (Sobrevivência/Fuga, não combate direto)</div>
      <div class="stat-line"><strong>Deslocamento:</strong> 12m (Mais rápida que qualquer sobrevivente comum)</div>
      <div class="stat-line"><strong>Perícias:</strong> Furtividade +8, Atletismo +7, Intimidação +8, Percepção +6</div>

      <div class="section-divider-bar"></div>

      <div class="stat-trait">
        <strong>Aura de Silêncio Sobrenatural:</strong> Jae não emite som de passos sobre madeira ou folhas secas. Qualquer tentativa de ouvi-la antes do bote requer <em>Percepção DT 18</em>.
      </div>
      <div class="stat-trait">
        <strong>A Regra do "Shhh":</strong> Ataques físicos contra Jae não a reduzem a 0 PV. Golpes bem-sucedidos (DT 16) apenas a <strong>atordoam ou empurram por 1 rodada</strong>, permitindo que os sobreviventes ganhem distância.
      </div>

      <div class="section-divider-bar"></div>
      <div style="font-family: 'Cinzel', serif; font-size: 9pt; font-weight: bold; color: #6a1010; margin-bottom: 2px;">AÇÕES (1 POR RODADA)</div>

      <div class="stat-trait">
        <strong>Estocada Tática:</strong> Corpo a corpo, +7 para acertar. <em>Dano:</em> 1d8+4 perfurante mais sangramento contínuo (1d4 PV por rodada até receber curativo ou torniquete).
      </div>
      <div class="stat-trait">
        <strong>O Bote das Sombras (Recarga 4-6 no d6):</strong> Jae apaga a lâmpada mais próxima ou arremessa uma cadeira, saltando sobre o personagem mais isolado. A vítima deve passar em <em>Reflexos DT 15</em> ou é derrubada e fica indefesa.
      </div>

      <div class="section-divider-bar"></div>
      <div style="font-family: 'Cinzel', serif; font-size: 8.5pt; color: #52473d; font-style: italic;">
        <strong>Diretriz do Mestre:</strong> Jae nunca persegue em disparada cega. Ela caminha no ritmo da batida do coração da vítima, arrastando a lâmina nas paredes para cultivar o desespero psicológico.
      </div>
    </div>

  </div>

  <div class="page-footer">
    <span>Natal Macabro &bull; Módulo de Campanha</span>
    <span>Página 13</span>
  </div>
</div>

</body>
</html>
`;

const htmlPath = path.join(__dirname, 'Natal_Macabro_Amostra_Profissional.html');
const pdfPath = path.join(__dirname, 'Natal_Macabro_Amostra_Profissional.pdf');

fs.writeFileSync(htmlPath, htmlContent, 'utf8');
console.log('HTML gerado com sucesso em:', htmlPath);

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
console.log('Compilando PDF via Edge headless...');

try {
    execSync(`"${edgePath}" --headless=new --disable-gpu --run-all-compositor-stages-before-draw --print-to-pdf="${pdfPath}" "${htmlPath}"`, { stdio: 'inherit' });
    console.log('PDF gerado com sucesso:', pdfPath);
} catch (err) {
    console.error('Erro ao compilar PDF:', err);
}
