const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const htmlContent = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>Natal Macabro - Padrão Ordem Paranormal 2</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=IBM+Plex+Mono:ital,wght@0,400;0,600;0,700;1,400&family=Inter:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400&display=swap" rel="stylesheet">
<style>
  @page {
    size: A4 portrait;
    margin: 10mm 12mm 10mm 12mm;
  }

  * {
    box-sizing: border-box;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  body {
    margin: 0;
    padding: 0;
    font-family: 'Inter', sans-serif;
    font-size: 8.8pt;
    line-height: 1.36;
    color: #161616;
    background-color: #f4f2ed;
  }

  .page {
    position: relative;
    height: 276mm;
    max-height: 276mm;
    overflow: hidden;
    page-break-after: always;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }

  .page:last-child {
    page-break-after: avoid;
  }

  .page-body {
    flex: 1;
  }

  /* Títulos estilo Ordem 2 (Bebas Neue + linhas geométricas pretas) */
  .section-title-wrap {
    display: flex;
    align-items: center;
    margin-bottom: 8px;
    gap: 12px;
  }

  h1.op-title {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 29pt;
    font-weight: 400;
    letter-spacing: 1px;
    color: #111;
    margin: 0;
    line-height: 0.95;
  }

  .op-title-line {
    flex: 1;
    height: 3px;
    background: #111;
    position: relative;
  }

  .op-title-line::after {
    content: "";
    position: absolute;
    right: 0;
    top: -5px;
    width: 35px;
    height: 8px;
    border-top: 2px solid #111;
    border-right: 2px solid #111;
  }

  h2.op-h2 {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 18pt;
    font-weight: 400;
    color: #111;
    margin: 8px 0 5px 0;
    padding-bottom: 1px;
    border-bottom: 3px double #111;
    letter-spacing: 0.8px;
  }

  /* Grid de 2 Colunas */
  .two-col-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
    align-items: start;
  }

  p {
    margin: 0 0 6px 0;
    text-align: left;
  }

  /* Caixa de Narração Oficial Ordem 2 (Borda preta, ícone de voz no topo, fonte monoespaçada) */
  .narration-box {
    position: relative;
    background: #fbfaf7;
    border: 1.5px solid #1a1a1a;
    padding: 13px 11px 9px 11px;
    margin: 12px 0 8px 0;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 8.1pt;
    line-height: 1.38;
    color: #1a1a1a;
  }

  .narration-icon {
    position: absolute;
    top: -12px;
    left: 50%;
    transform: translateX(-50%);
    width: 24px;
    height: 24px;
    background: #111;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    border: 2px solid #f4f2ed;
  }

  .narration-box p {
    margin: 0 0 6px 0;
  }

  .narration-box p:last-child {
    margin-bottom: 0;
  }

  .narration-box strong {
    font-weight: 700;
    color: #000;
  }

  .char-diamond {
    color: #111;
    font-weight: 700;
  }

  /* Nota de Trilha Sonora lateral */
  .soundtrack-tip {
    background: #e9e5dc;
    border-left: 3px solid #111;
    padding: 5px 8px;
    margin: 0 0 8px 0;
    font-size: 8pt;
    line-height: 1.32;
  }

  /* QUADRO DE PONTO DE INTERESSE (PADRÃO EXATO ORDEM 2 - PÁGINA 22/38) */
  .poi-card {
    border: 1.5px solid #1a1a1a;
    background: #fff;
    margin-bottom: 8px;
  }

  /* 1. Cabeçalho Preto */
  .poi-header {
    background: #141414;
    color: #fff;
    display: flex;
    align-items: stretch;
    justify-content: space-between;
  }

  .poi-header-left {
    display: flex;
    align-items: flex-start;
    gap: 7px;
    padding: 5px 8px;
    flex: 1;
  }

  .poi-search-icon {
    margin-top: 2px;
    flex-shrink: 0;
  }

  .poi-title-block {
    flex: 1;
  }

  .poi-title {
    font-family: 'Inter', sans-serif;
    font-size: 8.6pt;
    font-weight: 800;
    text-transform: uppercase;
    color: #fff;
    letter-spacing: 0.2px;
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 5px;
  }

  .key-evidence-badge {
    background: #b5d66c;
    color: #111;
    font-size: 6.8pt;
    font-weight: 800;
    padding: 0 4px;
    letter-spacing: 0.2px;
  }

  .poi-basic-desc {
    font-family: 'Inter', sans-serif;
    font-style: italic;
    font-size: 7.7pt;
    color: #d8d8d8;
    margin-top: 1px;
    line-height: 1.25;
  }

  .poi-number-box {
    background: #9e988e;
    color: #fff;
    font-family: 'Inter', sans-serif;
    font-size: 13pt;
    font-weight: 800;
    min-width: 34px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 5px;
  }

  /* 2. Faixa de Desafio / Bloqueio de Acesso (Salmão/Terracota) */
  .poi-access-block {
    background: #dca68e;
    border-top: 1px solid #1a1a1a;
    display: flex;
    font-family: 'Inter', sans-serif;
    font-size: 7.5pt;
    color: #111;
  }

  .access-left {
    width: 33%;
    padding: 4px 6px;
    font-weight: 800;
    text-transform: uppercase;
    border-right: 1px solid #1a1a1a;
    line-height: 1.2;
    font-size: 7pt;
  }

  .access-right {
    width: 67%;
    display: flex;
    flex-direction: column;
  }

  .access-option {
    padding: 3px 6px;
    border-bottom: 1px solid #1a1a1a;
    font-weight: 700;
    font-size: 7.3pt;
  }

  .access-option:last-child {
    border-bottom: none;
  }

  /* 3. Quadro de Perícias */
  table.poi-table {
    width: 100%;
    border-collapse: collapse;
    border-top: 1px solid #1a1a1a;
    font-size: 7.7pt;
  }

  table.poi-table th {
    background: #fff;
    color: #111;
    font-family: 'Inter', sans-serif;
    font-weight: 800;
    text-align: left;
    padding: 3px 6px;
    border-bottom: 1px solid #1a1a1a;
    border-right: 1px solid #1a1a1a;
    font-size: 7.3pt;
  }

  table.poi-table th:last-child {
    border-right: none;
  }

  table.poi-table td {
    padding: 4px 6px;
    border-bottom: 1px solid #1a1a1a;
    border-right: 1px solid #1a1a1a;
    vertical-align: middle;
  }

  table.poi-table td:last-child {
    border-right: none;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 7.4pt;
    line-height: 1.3;
  }

  .skill-col {
    font-family: 'Inter', sans-serif;
    font-weight: 700;
    width: 23%;
    font-size: 7.5pt;
  }

  .dt-col {
    font-family: 'IBM Plex Mono', monospace;
    font-weight: 700;
    text-align: center;
    width: 8%;
  }

  /* Cores exatas do Playtest Ordem 2 por Perícia */
  tr.row-percepcao td { background-color: #cde7c7; }
  tr.row-pesquisar td { background-color: #efe2b2; }
  tr.row-intuicao td  { background-color: #bce2e8; }
  tr.row-maquinas td  { background-color: #f3d1b8; }
  tr.row-crime td     { background-color: #dec9e9; }

  .handout-tag {
    background: #141414;
    color: #fff;
    font-family: 'Inter', sans-serif;
    font-weight: 800;
    font-size: 6.8pt;
    padding: 1px 4px;
    letter-spacing: 0.2px;
    text-transform: uppercase;
    display: inline-block;
  }

  /* 4. Descrição Contextual (Fundo Cinza + Ícone de Livro Aberto) */
  .poi-context {
    background: #e4e2dd;
    padding: 5px 8px;
    display: flex;
    gap: 8px;
    align-items: flex-start;
    font-family: 'Inter', sans-serif;
    font-size: 7.5pt;
    line-height: 1.3;
    color: #1f1f1f;
  }

  .context-book-icon {
    flex-shrink: 0;
    margin-top: 1px;
  }

  .poi-context p {
    margin: 0 0 3px 0;
  }

  .poi-context p:last-child {
    margin-bottom: 0;
  }

  /* Mapa estilo Página 34 de Ordem 2 */
  .map-showcase {
    background: #111317;
    border: 2px solid #111;
    padding: 8px 10px;
    margin-top: 8px;
    color: #fff;
  }

  .map-legend-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
    margin-top: 6px;
    padding-top: 6px;
    border-top: 1px solid #333;
    font-family: 'Inter', sans-serif;
    font-size: 7.5pt;
  }

  .map-legend-col h4 {
    margin: 0 0 3px 0;
    color: #fff;
    font-size: 8pt;
    font-weight: 800;
    text-transform: uppercase;
  }

  .map-legend-item {
    margin-bottom: 1.5px;
    color: #ccc;
  }

  .map-legend-item strong {
    color: #fff;
  }

  /* Tabela de Rodadas (Estilo Página 53 "A Dívida Precisa Ser Paga") */
  .rounds-box {
    border: 1.5px solid #141414;
    background: #ebe7df;
    margin-bottom: 8px;
  }

  .rounds-header {
    background: #141414;
    color: #fff;
    font-family: 'Bebas Neue', sans-serif;
    font-size: 14pt;
    text-align: center;
    padding: 3px 8px;
    letter-spacing: 1px;
  }

  table.rounds-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 7.5pt;
  }

  table.rounds-table th {
    background: #2b2b2b;
    color: #fff;
    padding: 3px 6px;
    text-align: left;
    font-size: 7.2pt;
    text-transform: uppercase;
  }

  table.rounds-table td {
    padding: 4px 6px;
    border-bottom: 1px solid #b8b2a6;
    border-right: 1px solid #b8b2a6;
    vertical-align: top;
    line-height: 1.28;
  }

  table.rounds-table td:first-child {
    width: 13%;
    text-align: center;
    font-weight: 800;
    font-family: 'Inter', sans-serif;
  }

  table.rounds-table td:last-child {
    border-right: none;
  }

  .round-quote {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 7.3pt;
    margin-bottom: 3px;
    display: block;
    color: #111;
  }

  /* Rodapé de Página estilo Ordem 2 */
  .op-footer {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    font-family: 'Inter', sans-serif;
    font-size: 8.5pt;
    font-weight: 700;
    color: #111;
    padding-top: 4px;
  }

  .op-footer-line {
    flex: 1;
    height: 2px;
    background: #111;
  }
</style>
</head>
<body>

<!-- PÁGINA 1: INTRODUÇÃO DA CENA, CAIXAS DE NARRAÇÃO E MAPA DE PONTOS DE INTERESSE -->
<div class="page">
  <div class="page-body">
    <div class="section-title-wrap">
      <h1 class="op-title">NATAL MACABRO, ATO II</h1>
      <div class="op-title-line"></div>
    </div>

    <div class="two-col-grid">
      <!-- COLUNA ESQUERDA -->
      <div>
        <p>Após escaparem dos cães de caça na trilha escura da mata, os sobreviventes alcançam a varanda da <strong>Casa Juno</strong> e trancam a porta pesada de madeira por dentro. Leia o texto a seguir:</p>

        <!-- CAIXA DE NARRAÇÃO OFICIAL ORDEM 2 -->
        <div class="narration-box">
          <div class="narration-icon">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="white"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
          </div>
          <p>Vocês batem a porta pesada de madeira. No mesmo segundo, o barulho da chuva lá fora fica abafado. Dá para ouvir as unhas dos cachorros raspando a madeira do lado de fora e os latidos roucos, mas a porta é grossa e segura bem.</p>
          <p>Quando vocês se viram e olham para o interior do casarão, o contraste é enorme. O lugar está quente, limpo, preservado e com um cheiro bom de pinho.</p>
          <p><span class="char-diamond">◆</span> <strong>Rodrigo</strong>, você nota que a luz elétrica está acesa e firme, mas a fiação perto do teto parece antiga e mal isolada.</p>
          <p><span class="char-diamond">◆</span> <strong>Husgo e Nicolau</strong>, vocês sentem o calor vindo de uma <strong>lareira</strong> estalando lenha. Ao lado dela, há um <strong>retrato na parede</strong> com o vidro rachado.</p>
          <p>Bem no centro da sala, há uma <strong>árvore de Natal</strong> imensa, cheia de enfeites vermelhos e com várias caixas de presentes embaixo. Mais adiante, o corredor leva para uma <strong>sala de jantar</strong>, uma <strong>cozinha</strong> nos fundos e uma escada que sobe para o segundo andar.</p>
          <p>Por fim, no balcão perto da escada, um <strong>telefone fixo</strong> antigo está com uma luzinha verde acesa — o aparelho parece funcionar.</p>
          <p>O que vocês fazem?</p>
        </div>
      </div>

      <!-- COLUNA DIREITA -->
      <div>
        <div class="soundtrack-tip">
          <strong>▶ Trilha Sonora:</strong> Enquanto as luzes estiverem acesas e o grupo conversar com o Delegado Aguiar, mantenha apenas o som de chuva abafada e lareira. Assim que ocorrer <strong>O Apagão</strong>, troque para a trilha de tensão <em>Caçada Silenciosa</em>.
        </div>

        <h2 class="op-h2">A VISITA DO DELEGADO E O APAGÃO</h2>
        <p>Se os jogadores usarem o <strong>telefone fixo</strong> para ligar para o 190, a telefonista atende com chiado na linha e avisa que a viatura do <strong>Delegado Jonas Aguiar</strong> já está subindo a serra. Poucos minutos depois, batidas firmes soam na porta e o giroflex azul e vermelho ilumina a janela.</p>
        <p>Aguiar é calmo, firme e passa uma imagem protetora. Ele diz que a caçamba da caminhonete está cheia de galhos e ferramentas e não cabe todo mundo agora, mas entrega o <strong>HANDOUT 02 - CARTÃO DO DELEGADO AGUIAR</strong> e garante: <em>"Vou fazer uma ronda nas cabanas da represa e já volto com uma van. Não saiam da casa sob hipótese alguma"</em>.</p>
        <p>Dois minutos após a viatura ir embora, leia para o grupo:</p>

        <div class="narration-box">
          <div class="narration-icon">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="white"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
          </div>
          <p>Um estalo violento de curto-circuito ecoa do lado de fora. Todas as lâmpadas do casarão piscam e se apagam de uma vez. A escuridão engole a casa por completo, e a lareira solta uma fumaça densa com cheiro forte de plástico queimado.</p>
          <p>No andar de cima, uma tábua de madeira range devagar. Vocês não estão sozinhos.</p>
        </div>
      </div>
    </div>

    <!-- MAPA ESTILO PÁGINA 34 DO PLAYTEST ORDEM 2 -->
    <div class="map-showcase">
      <svg viewBox="0 0 640 195" width="100%" height="auto" style="display:block;">
        <defs>
          <pattern id="floorgrid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#22262e" stroke-width="0.8"/>
          </pattern>
        </defs>
        <rect width="640" height="195" fill="#13161b"/>
        <rect width="640" height="195" fill="url(#floorgrid)"/>

        <!-- TÉRREO -->
        <text x="155" y="16" fill="#d4d4d4" font-family="'Bebas Neue', sans-serif" font-size="13" letter-spacing="1" text-anchor="middle">PRIMEIRO PAVIMENTO (TÉRREO)</text>
        <rect x="20" y="23" width="275" height="162" fill="#1d222a" stroke="#5c4033" stroke-width="4"/>
        <!-- Paredes internas térreo -->
        <line x1="165" y1="23" x2="165" y2="115" stroke="#4a3525" stroke-width="3"/>
        <line x1="20" y1="115" x2="295" y2="115" stroke="#4a3525" stroke-width="3"/>
        <line x1="165" y1="115" x2="165" y2="185" stroke="#4a3525" stroke-width="3"/>

        <!-- Objetos Térreo -->
        <circle cx="85" cy="68" r="16" fill="#1b4332" stroke="#2d6a4f" stroke-width="2"/>
        <rect x="22" y="50" width="10" height="32" fill="#7f2b1e"/>
        <rect x="195" y="50" width="70" height="34" rx="3" fill="#3d2817" stroke="#5c3d24"/>
        <rect x="125" y="120" width="32" height="16" fill="#3a3f47"/>
        <rect x="18" y="140" width="6" height="25" fill="#b54434"/>
        <rect x="180" y="128" width="95" height="42" fill="#161920" stroke="#383e4c"/>
        <line x1="195" y1="128" x2="195" y2="170" stroke="#383e4c"/>
        <line x1="210" y1="128" x2="210" y2="170" stroke="#383e4c"/>
        <line x1="225" y1="128" x2="225" y2="170" stroke="#383e4c"/>
        <line x1="240" y1="128" x2="240" y2="170" stroke="#383e4c"/>
        <line x1="255" y1="128" x2="255" y2="170" stroke="#383e4c"/>

        <!-- Pins Numerados Térreo -->
        <g font-family="'Inter', sans-serif" font-size="9" font-weight="800" text-anchor="middle">
          <circle cx="85" cy="68" r="9" fill="#111" stroke="#fff" stroke-width="1.5"/><text x="85" y="71" fill="#fff">1</text>
          <circle cx="42" cy="39" r="9" fill="#111" stroke="#fff" stroke-width="1.5"/><text x="42" y="42" fill="#fff">2</text>
          <circle cx="145" cy="100" r="9" fill="#111" stroke="#fff" stroke-width="1.5"/><text x="145" y="103" fill="#fff">3</text>
          <circle cx="230" cy="67" r="9" fill="#111" stroke="#fff" stroke-width="1.5"/><text x="230" y="70" fill="#fff">4</text>
          <circle cx="275" cy="40" r="9" fill="#111" stroke="#fff" stroke-width="1.5"/><text x="275" y="43" fill="#fff">5</text>
          <circle cx="38" cy="152" r="9" fill="#111" stroke="#fff" stroke-width="1.5"/><text x="38" y="155" fill="#fff">6</text>
          <circle cx="140" cy="144" r="9" fill="#111" stroke="#fff" stroke-width="1.5"/><text x="140" y="147" fill="#fff">7</text>
        </g>

        <!-- SEGUNDO PAVIMENTO -->
        <text x="475" y="16" fill="#d4d4d4" font-family="'Bebas Neue', sans-serif" font-size="13" letter-spacing="1" text-anchor="middle">SEGUNDO PAVIMENTO (ANDAR SUPERIOR)</text>
        <rect x="340" y="23" width="275" height="162" fill="#1d222a" stroke="#5c4033" stroke-width="4"/>
        <line x1="480" y1="23" x2="480" y2="115" stroke="#4a3525" stroke-width="3"/>
        <line x1="340" y1="115" x2="615" y2="115" stroke="#4a3525" stroke-width="3"/>

        <!-- Objetos Superior -->
        <rect x="375" y="50" width="65" height="34" rx="2" fill="#1e4d2b" stroke="#40916c" stroke-width="1.5"/>
        <rect x="555" y="38" width="45" height="55" fill="#3b4252"/>
        <rect x="360" y="128" width="65" height="45" fill="#4c3b4d"/>

        <!-- Pins Numerados Superior -->
        <g font-family="'Inter', sans-serif" font-size="9" font-weight="800" text-anchor="middle">
          <circle cx="358" cy="100" r="9" fill="#111" stroke="#fff" stroke-width="1.5"/><text x="358" y="103" fill="#fff">8</text>
          <circle cx="407" cy="67" r="9" fill="#111" stroke="#fff" stroke-width="1.5"/><text x="407" y="70" fill="#fff">9</text>
          <circle cx="577" cy="65" r="9" fill="#111" stroke="#fff" stroke-width="1.5"/><text x="577" y="68" fill="#fff">10</text>
          <circle cx="465" cy="138" r="9" fill="#111" stroke="#fff" stroke-width="1.5"/><text x="465" y="141" fill="#fff">11</text>
          <circle cx="392" cy="150" r="9" fill="#111" stroke="#fff" stroke-width="1.5"/><text x="392" y="153" fill="#fff">12</text>
          <circle cx="555" cy="150" r="11" fill="#8b0000" stroke="#fff" stroke-width="1.5"/><text x="555" y="153" fill="#fff">X</text>
        </g>
      </svg>

      <div class="map-legend-grid">
        <div class="map-legend-col">
          <h4>Térreo (Salas)</h4>
          <div class="map-legend-item"><strong>1.</strong> Árvore de Natal e Presentes</div>
          <div class="map-legend-item"><strong>2.</strong> Retrato de Alice e Lareira</div>
          <div class="map-legend-item"><strong>3.</strong> Telefone Fixo no Balcão</div>
          <div class="map-legend-item"><strong>4.</strong> Mesa de Jantar</div>
        </div>
        <div class="map-legend-col">
          <h4>Térreo (Cozinha)</h4>
          <div class="map-legend-item"><strong>5.</strong> Aparador e Parede Riscada</div>
          <div class="map-legend-item"><strong>6.</strong> Porta dos Fundos (Saída)</div>
          <div class="map-legend-item"><strong>7.</strong> Fogão Marcado com "X"</div>
        </div>
        <div class="map-legend-col">
          <h4>Segundo Pavimento</h4>
          <div class="map-legend-item"><strong>8.</strong> Cômoda do Corredor</div>
          <div class="map-legend-item"><strong>9.</strong> Mesa de Sinuca (Chaves)</div>
          <div class="map-legend-item"><strong>10.</strong> Quarto de Hóspedes</div>
          <div class="map-legend-item"><strong>11 e 12.</strong> Suíte Principal &bull; <strong>X.</strong> Bote de Jae</div>
        </div>
      </div>
    </div>
  </div>

  <div class="op-footer">
    <div class="op-footer-line"></div>
    <span>34</span>
    <div class="op-footer-line"></div>
  </div>
</div>

<!-- PÁGINA 2: PONTOS DE INTERESSE NO PADRÃO EXATO DO PLAYTEST ORDEM 2 -->
<div class="page">
  <div class="page-body">
    <div class="section-title-wrap">
      <h1 class="op-title">PONTOS DE INTERESSE</h1>
      <div class="op-title-line"></div>
    </div>
    <p style="margin-bottom: 8px;">A seguir está a descrição de cada ponto de interesse da Casa Juno, seguindo a legenda do mapa. Na primeira vez que um personagem usar a ação investigar em um ponto, leia a descrição básica em itálico no cabeçalho.</p>

    <div class="two-col-grid">
      <!-- COLUNA ESQUERDA DE PONTOS DE INTERESSE -->
      <div>
        <!-- PONTO 01: ÁRVORE DE NATAL -->
        <div class="poi-card">
          <div class="poi-header">
            <div class="poi-header-left">
              <svg class="poi-search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <div class="poi-title-block">
                <div class="poi-title">ÁRVORE DE NATAL E PRESENTES</div>
                <div class="poi-basic-desc">Uma árvore de Natal grande e iluminada no centro da sala, cercada por várias caixas embrulhadas com papel colorido.</div>
              </div>
            </div>
            <div class="poi-number-box">01</div>
          </div>
          <table class="poi-table">
            <thead>
              <tr><th class="skill-col">Perícia</th><th class="dt-col">DT</th><th>Informação</th></tr>
            </thead>
            <tbody>
              <tr class="row-percepcao">
                <td class="skill-col">Percepção</td>
                <td class="dt-col">6</td>
                <td>A maioria das caixas de presente embaixo da árvore é leve demais e está completamente vazia.</td>
              </tr>
              <tr class="row-pesquisar">
                <td class="skill-col">Pesquisar</td>
                <td class="dt-col">8</td>
                <td>Dentro de uma caixa de papel vermelho, há pedaços de carvão e um dente humano solto com a raiz suja de sangue seco.</td>
              </tr>
            </tbody>
          </table>
          <div class="poi-context">
            <svg class="context-book-icon" width="16" height="16" viewBox="0 0 24 24" fill="#141414"><path d="M21 5c-1.11-.35-2.33-.5-3.5-.5-1.95 0-4.05.4-5.5 1.5-1.45-1.1-3.55-1.5-5.5-1.5S2.45 4.9 1 6v14.65c0 .25.25.5.5.5.1 0 .15-.05.25-.05C3.1 20.45 5.05 20 6.5 20c1.95 0 4.05.4 5.5 1.5 1.35-.85 3.8-1.5 5.5-1.5 1.65 0 3.35.3 4.75 1.05.1.05.15.05.25.05.25 0 .5-.25.5-.5V6c-.6-.45-1.25-.75-2-1zm0 13.5c-1.1-.35-2.3-.5-3.5-.5-1.7 0-4.15.65-5.5 1.5V8c1.35-.85 3.8-1.5 5.5-1.5 1.2 0 2.4.15 3.5.5v11.5z"/></svg>
            <div>
              <p>Os assassinos montaram a árvore para criar um choque psicológico entre o clima natalino e o massacre. O dente pertence a Jorge, uma vítima anterior que tentou se esconder na casa.</p>
            </div>
          </div>
        </div>

        <!-- PONTO 02: RETRATO E LAREIRA -->
        <div class="poi-card">
          <div class="poi-header">
            <div class="poi-header-left">
              <svg class="poi-search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <div class="poi-title-block">
                <div class="poi-title">RETRATO DE ALICE E LAREIRA</div>
                <div class="poi-basic-desc">Um quadro antigo com moldura de vidro quebrado pendurado ao lado da lareira acesa.</div>
              </div>
            </div>
            <div class="poi-number-box">02</div>
          </div>
          <table class="poi-table">
            <thead>
              <tr><th class="skill-col">Perícia</th><th class="dt-col">DT</th><th>Informação</th></tr>
            </thead>
            <tbody>
              <tr class="row-percepcao">
                <td class="skill-col" rowspan="2">Percepção</td>
                <td class="dt-col">6</td>
                <td>O retrato mostra uma mulher jovem de vestido branco e sorriso perturbador: Alice Lucina.</td>
              </tr>
              <tr class="row-percepcao">
                <td class="dt-col">8</td>
                <td>Ao lado da moldura, há um grande "X" entalhado a faca na madeira da parede.</td>
              </tr>
            </tbody>
          </table>
          <div class="poi-context">
            <svg class="context-book-icon" width="16" height="16" viewBox="0 0 24 24" fill="#141414"><path d="M21 5c-1.11-.35-2.33-.5-3.5-.5-1.95 0-4.05.4-5.5 1.5-1.45-1.1-3.55-1.5-5.5-1.5S2.45 4.9 1 6v14.65c0 .25.25.5.5.5.1 0 .15-.05.25-.05C3.1 20.45 5.05 20 6.5 20c1.95 0 4.05.4 5.5 1.5 1.35-.85 3.8-1.5 5.5-1.5 1.65 0 3.35.3 4.75 1.05.1.05.15.05.25.05.25 0 .5-.25.5-.5V6c-.6-.45-1.25-.75-2-1zm0 13.5c-1.1-.35-2.3-.5-3.5-.5-1.7 0-4.15.65-5.5 1.5V8c1.35-.85 3.8-1.5 5.5-1.5 1.2 0 2.4.15 3.5.5v11.5z"/></svg>
            <div>
              <p>Sempre que investigarem um local marcado com "X", role 1d6 em segredo: em 1 ou 2, um barulho de passos ecoa no andar de cima. Ao lado da lareira há um <strong>atiçador de ferro</strong> que pode ser usado como arma.</p>
            </div>
          </div>
        </div>

        <!-- PONTO 04 E 05: MESA DE JANTAR E APARADOR -->
        <div class="poi-card">
          <div class="poi-header">
            <div class="poi-header-left">
              <svg class="poi-search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <div class="poi-title-block">
                <div class="poi-title">MESA DE JANTAR E APARADOR</div>
                <div class="poi-basic-desc">Uma mesa extensa de mogno escuro com papéis abertos em cima e um aparador de pratos encostado na parede.</div>
              </div>
            </div>
            <div class="poi-number-box">04</div>
          </div>
          <table class="poi-table">
            <thead>
              <tr><th class="skill-col">Perícia</th><th class="dt-col">DT</th><th>Informação</th></tr>
            </thead>
            <tbody>
              <tr class="row-pesquisar">
                <td class="skill-col">Pesquisar</td>
                <td class="dt-col">6</td>
                <td>Sobre a mesa está o <span class="handout-tag">HANDOUT 06 - PANFLETO (2013)</span>, mostrando o mapa da Casa Juno, píer, tendas e anotações rituais nas bordas.</td>
              </tr>
              <tr class="row-percepcao">
                <td class="skill-col">Percepção</td>
                <td class="dt-col">8</td>
                <td>Atrás do aparador (Ponto 05), há riscos verticais talhados na madeira agrupados de cinco em cinco, como uma contagem.</td>
              </tr>
            </tbody>
          </table>
          <div class="poi-context">
            <svg class="context-book-icon" width="16" height="16" viewBox="0 0 24 24" fill="#141414"><path d="M21 5c-1.11-.35-2.33-.5-3.5-.5-1.95 0-4.05.4-5.5 1.5-1.45-1.1-3.55-1.5-5.5-1.5S2.45 4.9 1 6v14.65c0 .25.25.5.5.5.1 0 .15-.05.25-.05C3.1 20.45 5.05 20 6.5 20c1.95 0 4.05.4 5.5 1.5 1.35-.85 3.8-1.5 5.5-1.5 1.65 0 3.35.3 4.75 1.05.1.05.15.05.25.05.25 0 .5-.25.5-.5V6c-.6-.45-1.25-.75-2-1zm0 13.5c-1.1-.35-2.3-.5-3.5-.5-1.7 0-4.15.65-5.5 1.5V8c1.35-.85 3.8-1.5 5.5-1.5 1.2 0 2.4.15 3.5.5v11.5z"/></svg>
            <div>
              <p>O panfleto permite que os jogadores entendam a geografia externa antes de saírem na chuva (mostrando a trilha da colina e a Cabana Eclipse). Os riscos na parede contam as vítimas sacrificadas pelo casal Lucina.</p>
            </div>
          </div>
        </div>
      </div>

      <!-- COLUNA DIREITA DE PONTOS DE INTERESSE E CONTAGEM DE RODADAS -->
      <div>
        <!-- PONTO 06: PORTA DOS FUNDOS DA COZINHA -->
        <div class="poi-card">
          <div class="poi-header">
            <div class="poi-header-left">
              <svg class="poi-search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <div class="poi-title-block">
                <div class="poi-title">COZINHA, PORTA DOS FUNDOS</div>
                <div class="poi-basic-desc">A porta que dá acesso ao quintal e à trilha da colina está trancada com fechadura dupla de latão.</div>
              </div>
            </div>
            <div class="poi-number-box">06</div>
          </div>
          <div class="poi-access-block">
            <div class="access-left">🔒 DESAFIO DE ACESSO<br>• PORTA TRANCADA</div>
            <div class="access-right">
              <div class="access-option">DESTRANCAR (Testar o Molho de 10 Chaves — Crime/Agilidade DT 8)</div>
              <div class="access-option">ARROMBAR (DT 10, PA 12 — Faz barulho alto e atrai Jae)</div>
              <div class="access-option">ITEM (Chave antiga de bronze encontrada na Sala de Jogos)</div>
            </div>
          </div>
          <table class="poi-table">
            <thead>
              <tr><th class="skill-col">Perícia</th><th class="dt-col">DT</th><th>Informação</th></tr>
            </thead>
            <tbody>
              <tr class="row-percepcao">
                <td class="skill-col">Percepção</td>
                <td class="dt-col">6</td>
                <td>Entalhado na madeira a faca: "Vamos brincar, eu me escondo, vocês procuram. O 'X' marca o lugar" junto ao desenho de uma chave.</td>
              </tr>
              <tr class="row-pesquisar">
                <td class="skill-col">Pesquisar</td>
                <td class="dt-col">10</td>
                <td>No fogão ao lado (Ponto 07), marcado com "X" em tinta vermelha fresca, há duas garrafas de álcool e panos secos no forno.</td>
              </tr>
            </tbody>
          </table>
          <div class="poi-context">
            <svg class="context-book-icon" width="16" height="16" viewBox="0 0 24 24" fill="#141414"><path d="M21 5c-1.11-.35-2.33-.5-3.5-.5-1.95 0-4.05.4-5.5 1.5-1.45-1.1-3.55-1.5-5.5-1.5S2.45 4.9 1 6v14.65c0 .25.25.5.5.5.1 0 .15-.05.25-.05C3.1 20.45 5.05 20 6.5 20c1.95 0 4.05.4 5.5 1.5 1.35-.85 3.8-1.5 5.5-1.5 1.65 0 3.35.3 4.75 1.05.1.05.15.05.25.05.25 0 .5-.25.5-.5V6c-.6-.45-1.25-.75-2-1zm0 13.5c-1.1-.35-2.3-.5-3.5-.5-1.7 0-4.15.65-5.5 1.5V8c1.35-.85 3.8-1.5 5.5-1.5 1.2 0 2.4.15 3.5.5v11.5z"/></svg>
            <div>
              <p>Rota de fuga principal da Casa Juno. Na porta da geladeira também está preso com ímã o <strong>HANDOUT 04 - PÁGINA 1 DO DIÁRIO DE JORGE</strong>.</p>
            </div>
          </div>
        </div>

        <!-- PONTO 09: MESA DE SINUCA (EVIDÊNCIA-CHAVE) -->
        <div class="poi-card">
          <div class="poi-header">
            <div class="poi-header-left">
              <svg class="poi-search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <div class="poi-title-block">
                <div class="poi-title">MESA DE SINUCA <span class="key-evidence-badge">[EVIDÊNCIA-CHAVE]</span></div>
                <div class="poi-basic-desc">Mesa de bilhar no segundo andar com feltro verde rasgado e caçapas de couro.</div>
              </div>
            </div>
            <div class="poi-number-box">09</div>
          </div>
          <table class="poi-table">
            <thead>
              <tr><th class="skill-col">Perícia</th><th class="dt-col">DT</th><th>Informação</th></tr>
            </thead>
            <tbody>
              <tr class="row-percepcao">
                <td class="skill-col">Percepção</td>
                <td class="dt-col">6</td>
                <td>Há um grande "X" riscado a giz branco bem no centro do pano verde da mesa.</td>
              </tr>
              <tr class="row-pesquisar">
                <td class="skill-col">Pesquisar</td>
                <td class="dt-col">8</td>
                <td>No fundo da última caçapa de couro, seus dedos puxam um <strong>Molho com 10 Chaves Antigas de Bronze</strong>.</td>
              </tr>
            </tbody>
          </table>
          <div class="poi-context">
            <svg class="context-book-icon" width="16" height="16" viewBox="0 0 24 24" fill="#141414"><path d="M21 5c-1.11-.35-2.33-.5-3.5-.5-1.95 0-4.05.4-5.5 1.5-1.45-1.1-3.55-1.5-5.5-1.5S2.45 4.9 1 6v14.65c0 .25.25.5.5.5.1 0 .15-.05.25-.05C3.1 20.45 5.05 20 6.5 20c1.95 0 4.05.4 5.5 1.5 1.35-.85 3.8-1.5 5.5-1.5 1.65 0 3.35.3 4.75 1.05.1.05.15.05.25.05.25 0 .5-.25.5-.5V6c-.6-.45-1.25-.75-2-1zm0 13.5c-1.1-.35-2.3-.5-3.5-.5-1.7 0-4.15.65-5.5 1.5V8c1.35-.85 3.8-1.5 5.5-1.5 1.2 0 2.4.15 3.5.5v11.5z"/></svg>
            <div>
              <p>Uma das chaves abre a Porta dos Fundos (Ponto 06). Na cômoda do corredor (Ponto 08), há o álbum de fotos de sangue (DT 6) e a adoção negada de Alice (DT 10). Nos quartos (10 a 12), estão a página do livro infantil e o jornal de 2013.</p>
            </div>
          </div>
        </div>

        <!-- CONTAGEM DE RODADAS ESTILO PÁGINA 53 DO PLAYTEST -->
        <div class="rounds-box">
          <div class="rounds-header">O BOTE DE PARK JAE-YOON ("X")</div>
          <table class="rounds-table">
            <thead>
              <tr><th>Rodada</th><th>Efeito na Cena (Ativado ao pegar as chaves)</th></tr>
            </thead>
            <tbody>
              <tr>
                <td>0</td>
                <td>
                  <span class="round-quote">"No vão da escada, uma figura de roupas pretas e máscara branca com um 'X' bloqueia a descida. Ela segura uma faca militar pingando sangue e sussurra: 'Shhhhh...'"</span>
                  Todos fazem teste de <strong>Disciplina (DT 7)</strong>; falha perde <strong>2 PD</strong>.
                </td>
              </tr>
              <tr>
                <td>1</td>
                <td>
                  <strong>Passar pela Escada:</strong> Exige <strong>Luta/Atletismo (DT 10)</strong> para empurrá-la com um móvel por 1 rodada ou correr com <strong>Acrobacia (DT 10)</strong>. Falha sofre facada (<strong>d8+2 PV</strong>) ou queda (<strong>2 PV</strong>).
                </td>
              </tr>
              <tr>
                <td>2+</td>
                <td>
                  Na cozinha, quem tem o molho testa as chaves (<strong>Crime/Agilidade DT 8</strong>) enquanto aliados usam <strong>Sustentar (Atletismo DT 7)</strong> com a mesa ou geladeira para segurar Jae por 1 rodada.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>

  <div class="op-footer">
    <div class="op-footer-line"></div>
    <span>35</span>
    <div class="op-footer-line"></div>
  </div>
</div>

</body>
</html>
`;

const htmlPath = path.join(__dirname, 'Natal_Macabro_Amostra_Profissional.html');
const pdfPath = path.join(__dirname, 'Natal_Macabro_Amostra_Profissional.pdf');

fs.writeFileSync(htmlPath, htmlContent, 'utf8');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
try {
    execSync(`"${edgePath}" --headless=new --disable-gpu --no-pdf-header-footer --run-all-compositor-stages-before-draw --print-to-pdf="${pdfPath}" "${htmlPath}"`, { stdio: 'inherit' });
    console.log('PDF Ordem 2 compilado sem cabecalhos de navegador:', pdfPath);
} catch (err) {
    console.error('Erro ao compilar:', err);
}
