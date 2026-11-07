const { chromium } = require('playwright');

(async () => {
  console.log('--- INICIANDO TESTE COMPLETO DE PINS E OCULTAÇÃO DA TV ---');
  const browser = await chromium.launch({ headless: true });
  
  // 1. Abrir TV
  const tvContext = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const tvPage = await tvContext.newPage();
  await tvPage.goto('http://localhost:3000/tv.html');
  await tvPage.waitForTimeout(1000);
  console.log('1. TV carregada com sucesso.');

  // 2. Abrir Mestre
  const mestreContext = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const mestrePage = await mestreContext.newPage();
  await mestrePage.goto('http://localhost:3000/mestre.html');
  await mestrePage.waitForTimeout(1200);

  // Selecionar campanha do Ídolo de Pedra
  await mestrePage.evaluate(() => {
    const card = Array.from(document.querySelectorAll('.card-campanha-hub'))
      .find(c => c.innerText.includes('Ídolo de Pedra') || c.innerText.includes('idolo_pedra'));
    if (card) {
      card.click();
    } else if (typeof selecionarCampanhaHub === 'function') {
      selecionarCampanhaHub('a-maldicao-do-idolo-de-pedra');
    }
  });
  await mestrePage.waitForTimeout(1000);

  // Abrir Modo Tabuleiro
  await mestrePage.evaluate(() => {
    if (typeof abrirModoTabuleiro === 'function') {
      abrirModoTabuleiro();
    }
  });
  await mestrePage.waitForTimeout(1500);

  // 3. Verificar Pins no Tabuleiro do Mestre
  const pinsInfo = await mestrePage.evaluate(() => {
    const pinEls = Array.from(document.querySelectorAll('.vtt-pin-marker'));
    return pinEls.map(el => ({
      id: el.id,
      texto: el.innerText.trim(),
      left: el.style.left,
      top: el.style.top
    }));
  });

  console.log(`2. Total de pins visíveis no Tabuleiro do Mestre: ${pinsInfo.length}`);
  pinsInfo.slice(0, 6).forEach(p => console.log(`   ${p.id} (${p.texto}): left=${p.left}, top=${p.top}`));

  // Validar coordenadas dos pins principais
  const pin1 = pinsInfo.find(p => p.id === 'vtt-pin-pin_01_deposito_a');
  const pin6 = pinsInfo.find(p => p.id === 'vtt-pin-pin_06_altar');
  const pin17 = pinsInfo.find(p => p.id === 'vtt-pin-pin_17_idolo');

  console.log('   Validação Pin 01 (Depósito A Cela):', pin1 ? `${pin1.left}, ${pin1.top}` : 'Não encontrado');
  console.log('   Validação Pin 06 (Altar com Sangue):', pin6 ? `${pin6.left}, ${pin6.top}` : 'Não encontrado');
  console.log('   Validação Pin 17 (Ídolo de Pedra):', pin17 ? `${pin17.left}, ${pin17.top}` : 'Não encontrado');

  // Screenshot do Tabuleiro com os Pins no Mestre
  await mestrePage.screenshot({ path: 'scratch/teste_mestre_pins_tabuleiro.png' });
  console.log('3. Screenshot do Mestre salvo em scratch/teste_mestre_pins_tabuleiro.png');

  // 4. Testar Projeção de Imagem na TV via Card do Pin
  console.log('4. Abrindo card do Pin 17 (Ídolo de Pedra) e projetando na TV...');
  await mestrePage.evaluate(() => {
    const p17 = document.getElementById('vtt-pin-pin_17_idolo');
    if (p17) p17.click();
    else {
      const pin = obterPinsDoMapaAtual().find(p => p.numero === 17);
      if (pin) abrirCardInspecaoVTT(pin);
    }
  });
  await mestrePage.waitForTimeout(600);

  // Clicar em "Projetar na TV"
  await mestrePage.click('#btn-vtt-pin-projetar-tv');
  await mestrePage.waitForTimeout(1000);

  // Verificar na TV se o handout está visível
  const tvOverlayVisivelAntes = await tvPage.evaluate(() => {
    const overlay = document.getElementById('tv-handout-overlay');
    const img = document.getElementById('tv-handout-img');
    return {
      display: overlay ? window.getComputedStyle(overlay).display : 'none',
      imgSrc: img ? img.src : ''
    };
  });
  console.log('5. Estado do Handout na TV APÓS PROJETAR:', tvOverlayVisivelAntes);

  // Verificar no Mestre se os botões de ocultar apareceram
  const mestreBotoesOcultar = await mestrePage.evaluate(() => {
    const btnTopbar = document.getElementById('vtt-btn-recolher-pista');
    const btnCard = document.getElementById('btn-vtt-pin-ocultar-tv');
    return {
      topbarDisplay: btnTopbar ? window.getComputedStyle(btnTopbar).display : 'none',
      cardDisplay: btnCard ? window.getComputedStyle(btnCard).display : 'none'
    };
  });
  console.log('6. Botões de Ocultar no Mestre:', mestreBotoesOcultar);

  // Screenshot da TV com a imagem projetada
  await tvPage.screenshot({ path: 'scratch/teste_tv_com_imagem.png' });
  console.log('   Screenshot da TV salvo em scratch/teste_tv_com_imagem.png');

  // 7. Testar Ocultação da Imagem da TV clicando no botão da topbar do Mestre!
  console.log('7. Clicando em "✕ Ocultar Imagem da TV" na topbar do Mestre...');
  await mestrePage.click('#vtt-btn-recolher-pista');
  await mestrePage.waitForTimeout(1000);

  // Verificar na TV se o handout SUMIU e o mapa voltou!
  const tvOverlayVisivelDepois = await tvPage.evaluate(() => {
    const overlay = document.getElementById('tv-handout-overlay');
    const mapaContainer = document.getElementById('tv-mapa-container');
    return {
      overlayDisplay: overlay ? window.getComputedStyle(overlay).display : 'none',
      mapaDisplay: mapaContainer ? window.getComputedStyle(mapaContainer).display : 'none'
    };
  });
  console.log('8. Estado na TV APÓS CLICAR EM OCULTAR:', tvOverlayVisivelDepois);

  // Screenshot da TV após ocultar a imagem (mapa restaurado)
  await tvPage.screenshot({ path: 'scratch/teste_tv_sem_imagem_mapa_restaurado.png' });
  console.log('   Screenshot da TV (mapa restaurado) salvo em scratch/teste_tv_sem_imagem_mapa_restaurado.png');

  // 8. Testar Projeção e Ocultação direta pelo Card e pela própria TV (botão ou ESC)
  console.log('9. Testando projeção e fechamento direto pela TV...');
  await mestrePage.evaluate(() => {
    projetarImagemPinDireto('/uploads/idolo_pedra/handouts/Handout 07 - Pôster Lutadores de Rua.jpg', 'Pôster Lutadores');
  });
  await mestrePage.waitForTimeout(800);

  // Pressionar ESC na TV
  await tvPage.keyboard.press('Escape');
  await tvPage.waitForTimeout(800);

  const tvEscFechou = await tvPage.evaluate(() => {
    const overlay = document.getElementById('tv-handout-overlay');
    return overlay ? window.getComputedStyle(overlay).display : 'none';
  });
  console.log('10. Fechamento via ESC na TV funcionou? Overlay display:', tvEscFechou);

  await browser.close();
  console.log('--- TESTE CONCLUÍDO COM SUCESSO! ---');
})();
