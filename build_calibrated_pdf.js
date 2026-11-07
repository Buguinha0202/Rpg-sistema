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

const htmlContent = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>Natal Macabro - Módulo Oficial de Campanha</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700;900&family=Cinzel+Decorative:wght@700&family=Inter:wght@400;500;600;700;800&family=Crimson+Pro:ital,wght@0,400;0,600;0,700;1,400;1,600&display=swap" rel="stylesheet">
<style>
  @page {
    size: A4 portrait;
    margin: 10mm 12mm 12mm 12mm;
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
    line-height: 1.38;
    color: #1c1815;
    background-color: #faf8f3;
  }

  .page {
    position: relative;
    page-break-after: always;
    min-height: 275mm;
    padding-bottom: 8mm;
  }

  .page:last-child {
    page-break-after: avoid;
  }

  /* Header & Footer */
  .page-header {
    border-bottom: 2px solid #851212;
    padding-bottom: 3px;
    margin-bottom: 10px;
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    font-family: 'Cinzel', serif;
    font-size: 8.5pt;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    color: #701010;
  }

  .page-footer {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    border-top: 1px solid #dcd2c4;
    padding-top: 3px;
    display: flex;
    justify-content: space-between;
    font-family: 'Cinzel', serif;
    font-size: 8pt;
    color: #7d7265;
    letter-spacing: 1px;
  }

  /* Typography */
  h1.chapter-title {
    font-family: 'Cinzel Decorative', 'Cinzel', serif;
    font-size: 20pt;
    font-weight: 700;
    color: #5c0a0a;
    text-align: center;
    margin: 0 0 2px 0;
    letter-spacing: 1px;
    text-transform: uppercase;
  }

  .chapter-subtitle {
    font-family: 'Cinzel', serif;
    font-size: 9.5pt;
    font-weight: 700;
    text-align: center;
    color: #3d352e;
    letter-spacing: 2.5px;
    text-transform: uppercase;
    margin-bottom: 8px;
  }

  .ornament-divider {
    text-align: center;
    color: #851212;
    margin-bottom: 8px;
    font-size: 10pt;
    letter-spacing: 5px;
  }

  h2 {
    font-family: 'Cinzel', serif;
    font-size: 12pt;
    font-weight: 700;
    color: #6a1010;
    border-bottom: 1px solid #cbbaaa;
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
    column-gap: 16px;
    text-align: justify;
  }

  .full-width {
    column-span: all;
  }

  /* World Tags Bar */
  .world-tags-bar {
    background: #1f1a17;
    color: #e5ded2;
    border-radius: 3px;
    padding: 6px 10px;
    font-family: 'Inter', sans-serif;
    font-size: 8pt;
    margin-bottom: 10px;
    display: flex;
    justify-content: space-between;
    flex-wrap: wrap;
    border-left: 4px solid #9e1a1a;
    gap: 8px;
  }

  .world-tag-item strong {
    color: #df9e30;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  /* Boxed Read-Aloud Text */
  .read-aloud {
    background: #f3ece0;
    border: 1px solid #d8ccba;
    border-left: 4px solid #851212;
    padding: 8px 11px;
    margin: 6px 0 9px 0;
    font-style: italic;
    font-size: 9.8pt;
    line-height: 1.4;
    color: #221c17;
  }

  .read-aloud strong {
    font-style: normal;
    color: #6a1010;
  }

  /* Room Keying */
  .room-key {
    background: #fff;
    border: 1px solid #ded3c3;
    border-radius: 3px;
    padding: 7px 9px;
    margin-bottom: 8px;
    break-inside: avoid;
    box-shadow: 0 1px 2px rgba(0,0,0,0.03);
  }

  .room-header {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 3px;
  }

  .room-badge {
    background: #731313;
    color: #fff;
    font-family: 'Inter', sans-serif;
    font-size: 7.5pt;
    font-weight: 800;
    padding: 2px 5px;
    border-radius: 2px;
    letter-spacing: 0.5px;
  }

  .room-name {
    font-family: 'Cinzel', serif;
    font-size: 10pt;
    font-weight: 700;
    color: #221c17;
  }

  ul.clue-list {
    list-style: none;
    padding-left: 0;
    margin: 4px 0 0 0;
    font-size: 9.3pt;
  }

  ul.clue-list > li {
    position: relative;
    padding-left: 14px;
    margin-bottom: 4px;
    line-height: 1.32;
  }

  ul.clue-list > li::before {
    content: "▪";
    position: absolute;
    left: 0;
    color: #851212;
    font-size: 10pt;
    top: -1px;
  }

  .dt-tag {
    font-family: 'Inter', sans-serif;
    font-weight: 800;
    font-size: 7.5pt;
    background: #efe4d3;
    color: #6a1010;
    padding: 1px 4px;
    border-radius: 2px;
    border: 1px solid #d5c2ab;
    margin-right: 3px;
  }

  .obj-tag {
    font-weight: 700;
    color: #1a1715;
  }

  /* Plan / Blueprint */
  .map-container {
    background: #191e24;
    border: 2px solid #851212;
    border-radius: 4px;
    padding: 8px;
    margin: 8px 0;
    break-inside: avoid;
    box-shadow: 0 2px 5px rgba(0,0,0,0.2);
  }

  .map-title {
    font-family: 'Cinzel', serif;
    font-size: 8.5pt;
    font-weight: 700;
    color: #d6b47c;
    letter-spacing: 1px;
    text-transform: uppercase;
    text-align: center;
    margin-bottom: 6px;
  }

  /* Doom Clock - Formatação Corrigida */
  .doom-clock-card {
    background: #201c19;
    border: 1px solid #571616;
    border-left: 4px solid #a31c1c;
    border-radius: 3px;
    padding: 8px 10px;
    margin: 8px 0;
    font-family: 'Inter', sans-serif;
    break-inside: avoid;
  }

  .clock-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 6px;
  }

  .clock-title {
    font-family: 'Cinzel', serif;
    font-size: 9pt;
    color: #e5a93c;
    font-weight: 700;
    letter-spacing: 0.5px;
  }

  .clock-hint {
    font-size: 7pt;
    color: #b8aba0;
  }

  .clock-grid {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 4px;
  }

  .clock-step {
    background: #2e2824;
    border: 1px solid #483d35;
    padding: 4px 2px;
    border-radius: 2px;
    text-align: center;
  }

  .clock-step.danger {
    background: #541111;
    border-color: #8c1d1d;
  }

  .step-num {
    font-size: 7pt;
    font-weight: 800;
    color: #df9e30;
    display: block;
  }

  .clock-step.danger .step-num {
    color: #ff9191;
  }

  .step-text {
    font-size: 6.5pt;
    color: #d2c8bf;
    line-height: 1.1;
    display: block;
    margin-top: 2px;
  }

  /* Table */
  table.simple-table {
    width: 100%;
    border-collapse: collapse;
    font-family: 'Inter', sans-serif;
    font-size: 8.5pt;
    margin: 6px 0;
    break-inside: avoid;
  }

  table.simple-table th {
    background: #2a221d;
    color: #f5eedb;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    padding: 4px 6px;
    text-align: left;
    border-bottom: 2px solid #851212;
    font-size: 7.5pt;
  }

  table.simple-table td {
    padding: 4px 6px;
    border-bottom: 1px solid #e5dac9;
    vertical-align: top;
    line-height: 1.25;
  }

  table.simple-table tr:nth-child(even) td {
    background: #f4eee3;
  }

  /* Statblock */
  .statblock {
    background: #fdfaf3;
    border: 2px solid #851212;
    border-radius: 3px;
    padding: 8px 10px;
    margin: 8px 0;
    break-inside: avoid;
  }

  .statblock-name {
    font-family: 'Cinzel Decorative', serif;
    font-size: 13pt;
    font-weight: 700;
    color: #6a1010;
    margin: 0;
  }

  .statblock-meta {
    font-size: 8pt;
    color: #5c5249;
    margin: 0 0 4px 0;
    font-style: italic;
  }

  .stat-grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    background: #eee5d6;
    border-radius: 2px;
    padding: 3px 0;
    margin: 5px 0;
    text-align: center;
    font-family: 'Inter', sans-serif;
  }

  .stat-box .stat-label {
    font-size: 7pt;
    font-weight: 700;
    color: #731313;
  }

  .stat-box .stat-val {
    font-size: 9.5pt;
    font-weight: 800;
    color: #1a1715;
  }

  .stat-trait {
    margin: 4px 0;
    font-size: 8.8pt;
    line-height: 1.32;
  }

  .stat-trait strong {
    font-family: 'Inter', sans-serif;
    color: #2b231d;
  }

  .inline-img {
    width: 100%;
    border-radius: 2px;
    border: 1px solid #851212;
    margin: 4px 0;
  }

  .img-caption {
    font-size: 7pt;
    text-align: center;
    color: #6e6459;
    font-style: italic;
    margin-bottom: 5px;
    display: block;
  }
</style>
</head>
<body>

<!-- PÁGINA 1: A CASA JUNO & PLANTA BAIXA TÁTICA -->
<div class="page">
  <div class="page-header">
    <span>Módulo de Campanha: Natal Macabro</span>
    <span>Ato II: A Casa Juno</span>
  </div>

  <h1 class="chapter-title">A Casa Juno</h1>
  <div class="chapter-subtitle">O Casarão de Natal e a Falsa Paz</div>
  <div class="ornament-divider">❖ &nbsp; ❖ &nbsp; ❖</div>

  <div class="world-tags-bar full-width">
    <div class="world-tag-item"><strong>Inimigos:</strong> Park Jae-Yoon ("X") &bull; Cães de Caça</div>
    <div class="world-tag-item"><strong>Amigos:</strong> Nenhum (Delegado Aguiar mente e está em conluio)</div>
    <div class="world-tag-item"><strong>Complicações:</strong> Corte de energia iminente &bull; Janelas gradeadas &bull; Tempestade violenta</div>
    <div class="world-tag-item"><strong>Ponto Crítico:</strong> Porta dos fundos trancada na cozinha (precisa de chave ou arrombamento)</div>
  </div>

  <div class="columns">
    <div class="read-aloud">
      "Vocês batem a porta pesada de madeira atrás de vocês. Do lado de fora, a chuva continua caindo forte e dá pra ouvir os cachorros latindo e arranhando a madeira, mas a porta é grossa e aguenta firme.<br><br>
      Quando vocês se viram e olham para o interior do casarão, o contraste é enorme. O lugar tá quente, limpo, perfeitamente preservado e com um cheiro bom de pinho. Tem luz elétrica acesa, uma lareira estalando lenha que aquece a sala, e bem no centro tem uma árvore de Natal imensa, cheia de enfeites vermelhos e com várias caixas de presentes embaixo.<br><br>
      No balcão perto da escada, um telefone fixo antigo tá com uma luzinha verde acesa — o aparelho parece funcionar."
    </div>

    <h2>Orientações para o Mestre</h2>
    <p>Deixe o grupo respirar aliviado por alguns minutos. Essa calmaria é uma armadilha psicológica. Permita que eles vasculhem os cômodos, conversem sobre o que aconteceu no ônibus e tentem usar o telefone.</p>
    <p>O Delegado Jonas Aguiar vai aparecer na viatura (Cena 7), passar a falsa segurança de que o socorro está vindo, pedir para ninguém sair da casa e entregar seu cartão de visita antes de ir embora. Assim que a viatura sumir na serra, o isolamento real começa.</p>

    <!-- PLANTA BAIXA VETORIAL SVG (TÉRRERO E SUPERIOR) -->
    <div class="map-container">
      <div class="map-title">📐 Planta Baixa da Casa Juno (Locais Chaveados)</div>
      <svg viewBox="0 0 520 230" width="100%" height="auto" style="display:block;">
        <!-- Fundo da grade -->
        <defs>
          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#252c36" stroke-width="0.8"/>
          </pattern>
        </defs>
        <rect width="520" height="230" fill="#13171c"/>
        <rect width="520" height="230" fill="url(#grid)"/>

        <!-- TÉRREO (Lado Esquerdo) -->
        <text x="130" y="20" fill="#df9e30" font-family="'Cinzel', serif" font-size="11" font-weight="bold" text-anchor="middle">PRIMEIRO PAVIMENTO (TÉRREO)</text>
        
        <!-- Paredes Externas Térreo -->
        <rect x="25" y="32" width="210" height="175" fill="#1e252f" stroke="#851212" stroke-width="2.5"/>
        
        <!-- Divisões Internas -->
        <line x1="140" y1="32" x2="140" y2="140" stroke="#4f5d6f" stroke-width="2"/>
        <line x1="25" y1="140" x2="235" y2="140" stroke="#4f5d6f" stroke-width="2"/>
        <line x1="140" y1="140" x2="140" y2="207" stroke="#4f5d6f" stroke-width="2"/>

        <!-- Cômodos Térreo com Badges -->
        <!-- 01: Salão Principal -->
        <rect x="28" y="35" width="110" height="102" fill="#242b36"/>
        <circle cx="45" cy="50" r="10" fill="#731313"/>
        <text x="45" y="53.5" fill="#fff" font-family="'Inter', sans-serif" font-size="9" font-weight="bold" text-anchor="middle">01</text>
        <text x="60" y="53" fill="#eae3d2" font-family="'Inter', sans-serif" font-size="8.5" font-weight="bold">Salão Principal</text>
        <text x="60" y="65" fill="#9faec0" font-family="'Inter', sans-serif" font-size="7">Árvore &bull; Lareira &bull; Telefone</text>
        <!-- Ícone Árvore e Lareira -->
        <polygon points="50,110 40,128 60,128" fill="#2d6a4f"/>
        <rect x="26" y="75" width="4" height="24" fill="#d9534f"/>

        <!-- 02: Sala de Jantar -->
        <rect x="142" y="35" width="90" height="102" fill="#202732"/>
        <circle cx="160" cy="50" r="10" fill="#731313"/>
        <text x="160" y="53.5" fill="#fff" font-family="'Inter', sans-serif" font-size="9" font-weight="bold" text-anchor="middle">02</text>
        <text x="175" y="53" fill="#eae3d2" font-family="'Inter', sans-serif" font-size="8.5" font-weight="bold">Sala de Jantar</text>
        <text x="175" y="65" fill="#9faec0" font-family="'Inter', sans-serif" font-size="7">Mesa &bull; Panfleto 2013</text>
        <!-- Mesa de jantar -->
        <rect x="160" y="80" width="55" height="30" rx="3" fill="#3a302a" stroke="#634832"/>

        <!-- 03: Cozinha & Despensa -->
        <rect x="28" y="143" width="110" height="61" fill="#222934"/>
        <circle cx="45" cy="160" r="10" fill="#731313"/>
        <text x="45" y="163.5" fill="#fff" font-family="'Inter', sans-serif" font-size="9" font-weight="bold" text-anchor="middle">03</text>
        <text x="60" y="163" fill="#eae3d2" font-family="'Inter', sans-serif" font-size="8.5" font-weight="bold">Cozinha (Fuga)</text>
        <text x="60" y="174" fill="#e76f51" font-family="'Inter', sans-serif" font-size="7" font-weight="bold">Porta Trancada com "X"</text>
        <!-- Porta dos Fundos -->
        <rect x="24" y="180" width="4" height="18" fill="#e76f51"/>
        <text x="12" y="192" fill="#ff7b72" font-family="'Inter', sans-serif" font-size="6.5" font-weight="bold" transform="rotate(-90 12,192)">SAÍDA</text>

        <!-- Escada Térreo -->
        <rect x="142" y="143" width="90" height="61" fill="#1b2129"/>
        <text x="187" y="165" fill="#d4c7b8" font-family="'Inter', sans-serif" font-size="8" font-weight="bold" text-anchor="middle">ESCADA</text>
        <line x1="150" y1="173" x2="225" y2="173" stroke="#5a687a" stroke-dasharray="3,3"/>
        <line x1="150" y1="181" x2="225" y2="181" stroke="#5a687a" stroke-dasharray="3,3"/>
        <line x1="150" y1="189" x2="225" y2="189" stroke="#5a687a" stroke-dasharray="3,3"/>
        <text x="187" y="200" fill="#8898aa" font-family="'Inter', sans-serif" font-size="6.5" text-anchor="middle">SOBE PARA O 1º ANDAR</text>


        <!-- SEGUNDO PAVIMENTO (Lado Direito) -->
        <text x="390" y="20" fill="#df9e30" font-family="'Cinzel', serif" font-size="11" font-weight="bold" text-anchor="middle">SEGUNDO PAVIMENTO (ANDAR SUPERIOR)</text>
        
        <!-- Paredes Externas Superior -->
        <rect x="285" y="32" width="210" height="175" fill="#1e252f" stroke="#851212" stroke-width="2.5"/>
        
        <!-- Divisões Internas Superior -->
        <line x1="390" y1="32" x2="390" y2="135" stroke="#4f5d6f" stroke-width="2"/>
        <line x1="285" y1="135" x2="495" y2="135" stroke="#4f5d6f" stroke-width="2"/>

        <!-- 04: Sala de Jogos -->
        <rect x="288" y="35" width="100" height="97" fill="#242b36"/>
        <circle cx="305" cy="50" r="10" fill="#731313"/>
        <text x="305" y="53.5" fill="#fff" font-family="'Inter', sans-serif" font-size="9" font-weight="bold" text-anchor="middle">04</text>
        <text x="320" y="53" fill="#eae3d2" font-family="'Inter', sans-serif" font-size="8.5" font-weight="bold">Sala de Jogos</text>
        <text x="320" y="65" fill="#9faec0" font-family="'Inter', sans-serif" font-size="7">Mesa Sinuca &bull; Chaves</text>
        <!-- Mesa de sinuca -->
        <rect x="315" y="75" width="50" height="28" rx="2" fill="#1e4d2b" stroke="#40916c"/>
        <text x="340" y="92" fill="#a7c957" font-family="'Inter', sans-serif" font-size="6" text-anchor="middle">CHAVES NA CAÇAPA</text>

        <!-- 05: Quarto de Hóspedes -->
        <rect x="393" y="35" width="99" height="97" fill="#202732"/>
        <circle cx="410" cy="50" r="10" fill="#731313"/>
        <text x="410" y="53.5" fill="#fff" font-family="'Inter', sans-serif" font-size="9" font-weight="bold" text-anchor="middle">05</text>
        <text x="425" y="53" fill="#eae3d2" font-family="'Inter', sans-serif" font-size="8.5" font-weight="bold">Qto. Hóspedes</text>
        <text x="425" y="65" fill="#9faec0" font-family="'Inter', sans-serif" font-size="7">Cama &bull; Livro Infantil</text>
        <rect x="445" y="80" width="35" height="42" fill="#4a5568"/>

        <!-- 06: Suíte Principal -->
        <rect x="288" y="138" width="130" height="66" fill="#222934"/>
        <circle cx="305" cy="155" r="10" fill="#731313"/>
        <text x="305" y="158.5" fill="#fff" font-family="'Inter', sans-serif" font-size="9" font-weight="bold" text-anchor="middle">06</text>
        <text x="320" y="158" fill="#eae3d2" font-family="'Inter', sans-serif" font-size="8.5" font-weight="bold">Suíte Principal</text>
        <text x="320" y="169" fill="#9faec0" font-family="'Inter', sans-serif" font-size="7">Pinturas &bull; Jornal de 2013</text>
        <rect x="375" y="150" width="38" height="48" fill="#4a5568"/>

        <!-- Ponto do Bote de Jae (Vão da Escada) -->
        <rect x="420" y="138" width="72" height="66" fill="#1b2129"/>
        <rect x="430" y="145" width="52" height="24" fill="#541111" stroke="#ff4d4d"/>
        <text x="456" y="157" fill="#fff" font-family="'Inter', sans-serif" font-size="6.5" font-weight="bold" text-anchor="middle">BOTE DE JAE</text>
        <text x="456" y="165" fill="#ffb3b3" font-family="'Inter', sans-serif" font-size="5.5" text-anchor="middle">VÃO DA ESCADA</text>
      </svg>
    </div>

    <!-- RELÓGIO DE TENSÃO CORRIGIDO E CALIBRADO -->
    <div class="doom-clock-card">
      <div class="clock-header">
        <span class="clock-title">⏳ Relógio de Tensão: A Falsa Calmaria</span>
        <span class="clock-hint">Avance 1 casa a cada busca demorada ou falha ruidosa</span>
      </div>
      <div class="clock-grid">
        <div class="clock-step">
          <span class="step-num">1</span>
          <span class="step-text">Alívio &bull; Lareira</span>
        </div>
        <div class="clock-step">
          <span class="step-num">2</span>
          <span class="step-text">190 atende e chia</span>
        </div>
        <div class="clock-step">
          <span class="step-num">3</span>
          <span class="step-text">Aguiar visita e sai</span>
        </div>
        <div class="clock-step">
          <span class="step-num">4</span>
          <span class="step-text">Assoalho range</span>
        </div>
        <div class="clock-step">
          <span class="step-num">5</span>
          <span class="step-text">Lâmpadas piscam</span>
        </div>
        <div class="clock-step danger">
          <span class="step-num">6</span>
          <span class="step-text"><strong>O APAGÃO</strong></span>
        </div>
      </div>
    </div>

    <h2>Tabela de Ruídos e Tensão na Casa (d6)</h2>
    <p>Role nesta tabela quando os jogadores tirarem uma falha ou hesitarem sobre o que fazer:</p>

    <table class="simple-table">
      <thead>
        <tr>
          <th style="width: 12%;">d6</th>
          <th>O que acontece no casarão</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>1</strong></td>
          <td>Um rangido pesado e lento de madeira ecoa bem acima de vocês, no forro do andar superior.</td>
        </tr>
        <tr>
          <td><strong>2</strong></td>
          <td>O telefone fixo dá um toque curto e estalado. Ao tirar do gancho, a linha está completamente muda.</td>
        </tr>
        <tr>
          <td><strong>3</strong></td>
          <td>O vento bate forte numa veneziana solta do lado de fora. Os cães começam a latir e rondar a casa.</td>
        </tr>
        <tr>
          <td><strong>4</strong></td>
          <td>O calor da lareira diminui de repente com uma rajada de ar gelado que desce pela chaminé.</td>
        </tr>
        <tr>
          <td><strong>5</strong></td>
          <td>Cheiro forte de borracha queimada vem do corredor: o quadro de disjuntores está soltando faíscas.</td>
        </tr>
        <tr>
          <td><strong>6</strong></td>
          <td><strong>O Apagão Acontece:</strong> As lâmpadas estouram. O casarão cai na escuridão total.</td>
        </tr>
      </tbody>
    </table>

  </div>

  <div class="page-footer">
    <span>Natal Macabro &bull; Livro de Campanha</span>
    <span>Página 11</span>
  </div>
</div>

<!-- PÁGINA 2: PISTAS ANCORADAS POR CÔMODO & AMEAÇA JAE -->
<div class="page">
  <div class="page-header">
    <span>Ato II: A Casa Juno</span>
    <span>Pistas por Cômodo &amp; O Bote</span>
  </div>

  <div class="columns">

    <h2>Pistas e Evidências Ancoradas por Cômodo</h2>
    <p>Cada cômodo da planta guarda exatamente as pistas de acordo com a pontuação do teste de <strong>Investigação</strong> ou <strong>Percepção</strong> do jogador:</p>

    <!-- 01: SALÃO PRINCIPAL -->
    <div class="room-key">
      <div class="room-header">
        <span class="room-badge">01</span>
        <span class="room-name">Salão Principal &amp; Lareira</span>
      </div>
      <ul class="clue-list">
        <li><span class="dt-tag">DT 10</span> <span class="obj-tag">O Retrato de Alice Lucina:</span> Moldura com vidro quebrado mostrando uma mulher jovem de vestido branco com um sorriso perturbador.</li>
        <li><span class="dt-tag">DT 15</span> <span class="obj-tag">Entalhe na Parede:</span> Bem ao lado do quadro de Alice, há um grande "X" marcado a faca na madeira da parede.</li>
        <li><span class="dt-tag">DT 10</span> <span class="obj-tag">Caixas de Presente:</span> A maioria sob a árvore está vazia.</li>
        <li><span class="dt-tag">DT 15</span> <span class="obj-tag">Caixa de Papel Vermelho:</span> Dentro dela há pedaços de carvão e um dente humano solto.</li>
      </ul>
    </div>

    <!-- 02: SALA DE JANTAR -->
    <div class="room-key">
      <div class="room-header">
        <span class="room-badge">02</span>
        <span class="room-name">Sala de Jantar</span>
      </div>
      <ul class="clue-list">
        <li><span class="dt-tag">DT 10</span> <span class="obj-tag">Mesa Principal:</span> Aberto sobre o mogno está o <strong>Panfleto do Acampamento Lua da Benquerença (2013)</strong> com o mapa da região e anotações de rituais nas bordas.</li>
        <li><span class="dt-tag">DT 15</span> <span class="obj-tag">Atrás do Aparador:</span> Riscos na madeira agrupados de 5 em 5, como alguém contando dias ou vítimas.</li>
      </ul>
    </div>

    <!-- 03: COZINHA (PONTO DE SAÍDA) -->
    <div class="room-key">
      <div class="room-header">
        <span class="room-badge">03</span>
        <span class="room-name">Cozinha &amp; Despensa (Ponto de Fuga)</span>
      </div>
      <ul class="clue-list">
        <li><span class="dt-tag">DT 10</span> <span class="obj-tag">A Porta dos Fundos:</span> Trancada com ferrolho duplo de latão. Esculpido na madeira: <em>"Vamos brincar, eu me escondo, vocês procuram. O 'X' marca o lugar"</em> com o desenho de uma chave.</li>
        <li><span class="dt-tag">DT 20</span> <span class="obj-tag">O Fogão:</span> Marcado com "X" de tinta vermelha fresca. Dentro do forno: duas garrafas de álcool e panos secos para improvisar tochas.</li>
      </ul>
    </div>

    <!-- 04: SALA DE JOGOS -->
    <div class="room-key">
      <div class="room-header">
        <span class="room-badge">04</span>
        <span class="room-name">Sala de Jogos (Andar Superior)</span>
      </div>
      <ul class="clue-list">
        <li><span class="dt-tag">DT 10</span> <span class="obj-tag">Cômoda do Corredor:</span> Álbum de fotos da família Lucina brindando com tigelas de sangue humano.</li>
        <li><span class="dt-tag">DT 20</span> <span class="obj-tag">Fundo Falso da Cômoda:</span> Processo do Juizado de 1982: Requisição de Adoção Negada de Alice Lucina por perversão.</li>
        <li><span class="dt-tag">DT 15</span> <span class="obj-tag">A Mesa de Sinuca (Item Obrigatório):</span> Na última caçapa de couro, o jogador encontra o <strong>Molho com 10 Chaves Antigas de Bronze</strong>. Uma delas destranca a porta da cozinha!</li>
      </ul>
    </div>

    <!-- 05: QUARTO DE HÓSPEDES -->
    <div class="room-key">
      <div class="room-header">
        <span class="room-badge">05</span>
        <span class="room-name">Quarto de Hóspedes</span>
      </div>
      <ul class="clue-list">
        <li><span class="dt-tag">DT 10</span> <span class="obj-tag">Cama de Solteiro:</span> Panfleto amassado com o mapa da colina e das trilhas.</li>
        <li><span class="dt-tag">DT 15</span> <span class="obj-tag">Atrás da Cabeceira:</span> Página rasgada do livro infantil "A Travessura do Papai Noel", mostrando a figura com chifres esquartejando crianças na mata.</li>
      </ul>
    </div>

    <!-- 06: SUÍTE PRINCIPAL -->
    <div class="room-key">
      <div class="room-header">
        <span class="room-badge">06</span>
        <span class="room-name">Suíte Principal</span>
      </div>
      <ul class="clue-list">
        <li><span class="dt-tag">DT 10</span> <span class="obj-tag">Paredes e Quadros:</span> Pinturas sacras profanadas com tinta preta nos rostos e versículos de sacrifício entalhados nas molduras.</li>
        <li><span class="dt-tag">DT 15</span> <span class="obj-tag">Sob o Colchão Rasgado:</span> Jornal <em>O Inquisidor</em> de 25 de dezembro de 2013: <em>"A Caçadora de Gente finalmente é presa"</em>.</li>
      </ul>
    </div>

    <h2>Cena 10: O Bote de Park Jae-Yoon</h2>
    <div class="read-aloud">
      "O silêncio no andar de cima fica pesado demais. As tábuas pararam de ranger. Quando vocês se viram no corredor para ir em direção à escada, vocês veem uma figura parada bem no vão, bloqueando a descida.<br><br>
      Ela é magra, ágil, veste roupas pretas justas e uma máscara branca lisa marcada apenas com um grande 'X' feito com fita preta. Pelas aberturas da máscara, dá para ver uma maquiagem pesada e lábios pintados com um batom vermelho muito forte, esticados num sorriso congelado. Na mão direita, ela segura uma faca militar longa, pingando sangue fresco no chão.<br><br>
      Ela inclina a cabeça de lado, levanta devagar o dedo indicador até os lábios e solta um sussurro bem baixinho: <strong>'Shhhhh...'</strong>"
    </div>

    <!-- IMAGEM DE JAE -->
    <img src="${imgJae}" class="inline-img" style="max-height: 105px; object-fit: cover; object-position: top;" alt="Park Jae-Yoon">
    <span class="img-caption">Park Jae-Yoon: sorriso congelado, faca militar e passos sem som.</span>

    <!-- FICHA OFICIAL DE JAE -->
    <div class="statblock">
      <h3 class="statblock-name">Park Jae-Yoon ("X")</h3>
      <p class="statblock-meta">Assassina Silenciosa &bull; Terror de Sobrevivência (Combate Mortal)</p>

      <div class="stat-grid">
        <div class="stat-box"><span class="stat-label">FOR</span><div class="stat-val">3</div></div>
        <div class="stat-box"><span class="stat-label">AGI</span><div class="stat-val">4</div></div>
        <div class="stat-box"><span class="stat-label">VIG</span><div class="stat-val">3</div></div>
        <div class="stat-box"><span class="stat-label">INT</span><div class="stat-val">2</div></div>
        <div class="stat-box"><span class="stat-label">PRE</span><div class="stat-val">4</div></div>
      </div>

      <div class="stat-trait">
        <strong>A Regra do "Shhh" (Invulnerabilidade):</strong> Ataques físicos contra Jae não tiram sua vida. Um acerto em <em>Luta ou Atletismo (DT 20)</em> apenas a empurra para trás ou a atrasa por 1 rodada para o grupo correr.
      </div>
      <div class="stat-trait">
        <strong>Ataque de Faca Militar:</strong> Em caso de falha dos jogadores ou se for alcançado, Jae desfere uma estocada profunda (<em>1d8+4 de dano e sangramento</em>).
      </div>
      <div class="stat-trait">
        <strong>Perseguição Estendida:</strong> Em corrida aberta, o Mestre rola o Atletismo de Jae (3 dados com bônus de +5). Quem tirar o menor resultado sofre o golpe da rodada.
      </div>
    </div>

  </div>

  <div class="page-footer">
    <span>Natal Macabro &bull; Livro de Campanha</span>
    <span>Página 12</span>
  </div>
</div>

</body>
</html>
`;

const htmlPath = path.join(__dirname, 'Natal_Macabro_Amostra_Profissional.html');
const pdfPath = path.join(__dirname, 'Natal_Macabro_Amostra_Profissional.pdf');

fs.writeFileSync(htmlPath, htmlContent, 'utf8');
console.log('HTML reconstruído com sucesso em:', htmlPath);

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
console.log('Compilando novo PDF...');

try {
    execSync(`"${edgePath}" --headless=new --disable-gpu --run-all-compositor-stages-before-draw --print-to-pdf="${pdfPath}" "${htmlPath}"`, { stdio: 'inherit' });
    console.log('PDF regerado com sucesso em:', pdfPath);
} catch (err) {
    console.error('Erro ao compilar:', err);
}
