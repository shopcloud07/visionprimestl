// JS principal do projeto Mega Pack STL
// COMPORTAMENTO: Universal (Funciona para Kiwify, Hotmart, GG, etc)

// Tratamento de erros global
window.addEventListener("error", (e) => {
  console.error("Erro capturado:", e.error);
});

// ==============================================================
// 1. FUNÇÃO CÉREBRO: Captura UTMs e Cria SRC automaticamente
// ==============================================================
function getUtmParams() {
  const urlParams = new URLSearchParams(window.location.search);
  const utmParams = new URLSearchParams();

  // ADICIONADO: 'src' na lista para garantir rastreamento na Kiwify
  const utmKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'utm_id', 'src'];

  // 1ª PRIORIDADE: UTMs da URL atual
  utmKeys.forEach(key => {
    if (urlParams.has(key)) {
      utmParams.set(key, urlParams.get(key));
    }
  });

  // 2ª PRIORIDADE: SessionStorage (Navegação interna)
  if (utmParams.toString() === '') {
    try {
      const capturedUtms = sessionStorage.getItem('captured_utms');
      if (capturedUtms) {
        const parsed = JSON.parse(capturedUtms);
        utmKeys.forEach(key => {
          if (parsed[key]) utmParams.set(key, parsed[key]);
        });
      }
    } catch (e) { console.log('Erro session:', e); }
  }

  // 3ª PRIORIDADE: LocalStorage (Persistência longa)
  if (utmParams.toString() === '') {
    try {
      const utmifyData = localStorage.getItem('utms');
      if (utmifyData) {
        const parsed = JSON.parse(utmifyData);
        utmKeys.forEach(key => {
          if (parsed[key]) utmParams.set(key, parsed[key]);
        });
      }
    } catch (e) { console.log('Erro local:', e); }
  }

  // --- A MÁGICA (CORREÇÃO DE RASTREAMENTO) ---
  // Se temos a origem (utm_source) mas NÃO temos o src, criamos o src igual à source.
  // Isso salva o rastreamento na Kiwify se o parâmetro src não vier do anúncio.
  if (utmParams.has('utm_source') && !utmParams.has('src')) {
      utmParams.set('src', utmParams.get('utm_source'));
  }
  // -------------------------------------------

  return utmParams.toString();
}

// Função para redirecionar com UTMs (Usada em botões manuais)
function redirectWithUtm(url) {
  if (!url || url === '#' || url.startsWith('#')) return;
  const utmString = getUtmParams();
  const separator = url.includes('?') ? '&' : '?';
  const finalUrl = utmString ? `${url}${separator}${utmString}` : url;
  console.log('Redirecionando para:', finalUrl);
  window.location.href = finalUrl;
}

document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM carregado com sucesso!");

  // --- DEBUG DE UTMS ---
  const utms = getUtmParams();
  console.log('========== DEBUG UTMs ==========');
  console.log('URL atual:', window.location.href);
  console.log('Parâmetros que serão enviados:', utms || 'NENHUM - Tráfego Orgânico/Direto');
  
  if (utms) {
    console.log('%c✓ RASTREAMENTO ATIVO', 'color: green; font-weight: bold;');
  }
  console.log('================================');


  // --- ATUALIZA ANO ---
  const yearSpan = document.getElementById("ano-atual");
  if (yearSpan) yearSpan.textContent = new Date().getFullYear().toString();


  // ==============================================================
  // 2. FUNÇÃO UNIVERSAL: Caça TODOS os links de checkout na página
  // ==============================================================
  function updateAllCheckoutLinks() {
    // SELETOR INTELIGENTE: Pega todos os links que começam com "http" (links externos)
    // Isso cobre Kiwify, Hotmart, Eduzz, GGCheckout, etc.
    const allExternalLinks = document.querySelectorAll('a[href^="http"]');
    
    allExternalLinks.forEach(link => {
      // Evita processar o mesmo link duas vezes
      if (link.dataset.utmUpdated) return;

      // Pula o botão "NÃO" do modal pois ele precisa de lógica especial (fechar modal)
      if (link.id === 'btn-upgrade-no') return;

      // Pula o botão Básico — ele abre o modal de upgrade, não redireciona direto
      if (link.id === 'btn-comprar-basico') return;

      // Adiciona evento de clique
      link.dataset.utmUpdated = "true";
      link.addEventListener("click", (e) => {
        // Pega o href ATUAL do HTML (permite que você mude o link no editor visual sem mexer no código)
        const originalUrl = link.getAttribute("href");
        
        // Se for link de âncora (#) ou vazio, ignora
        if (!originalUrl || originalUrl.startsWith('#')) return;

        e.preventDefault(); // Para o clique normal
        redirectWithUtm(originalUrl); // Faz o redirecionamento turbinado
      });
    });
  }

  // Executa a função universal
  updateAllCheckoutLinks();
  // Repete após 1.5s para garantir (caso o site carregue algo depois)
  setTimeout(updateAllCheckoutLinks, 1500);


  // ==============================================================
  // 3. BOTÕES ESPECÍFICOS (Lógica preservada mas melhorada)
  // ==============================================================

  // Botão Pacote Premium (Agora pega o link do HTML automaticamente)
  const btnComprarPremium = document.getElementById("btn-comprar-premium");
  if (btnComprarPremium) {
    btnComprarPremium.addEventListener("click", function(e) {
      e.preventDefault();
      // Pega o link que você colocou no botão lá no editor visual
        const urlAlvo = this.getAttribute("href") || "#"; 
      redirectWithUtm(urlAlvo);
    });
  }

  // Modal de Upgrade (Lógica Complexa)
  const btnComprarBasico = document.getElementById("btn-comprar-basico");
  const upgradeModal = document.getElementById("upgrade-modal");
  const btnUpgradeYes = document.getElementById("btn-upgrade-yes");
  const btnUpgradeNo = document.getElementById("btn-upgrade-no");

  if (btnComprarBasico && upgradeModal) {
    btnComprarBasico.addEventListener("click", (e) => {
      e.preventDefault();
      upgradeModal.classList.add("active");
    });
  }

  if (btnUpgradeYes) {
    btnUpgradeYes.addEventListener("click", (e) => {
      e.preventDefault();
      // Link do botão SIM (Pega do HTML ou usa o fixo se vazio)
        const urlSim = btnUpgradeYes.getAttribute("href") || "#";
      redirectWithUtm(urlSim);
    });
  }

  if (btnUpgradeNo) {
    btnUpgradeNo.addEventListener("click", (e) => {
      e.preventDefault(); // Previne navegação imediata se for link
      upgradeModal.classList.remove("active");
      // Link do botão NÃO (Pega do HTML ou usa o fixo se vazio)
        const urlNao = btnUpgradeNo.getAttribute("href") || "#";
      // Pequeno delay para a modal fechar visualmente antes de ir
      setTimeout(() => redirectWithUtm(urlNao), 200);
    });
  }

  // Fechar modal no overlay
  if (upgradeModal) {
    const overlay = upgradeModal.querySelector(".upgrade-modal__overlay");
    if (overlay) {
      overlay.addEventListener("click", () => {
        upgradeModal.classList.remove("active");
      });
    }
  }

  // Botão Garantia + qualquer link apontando para #secao-precos (Rolagem suave)
  function scrollToOfertas(e) {
    e && e.preventDefault();
    const secaoPrecos = document.getElementById("secao-precos");
    if (secaoPrecos) secaoPrecos.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const btnComprarGarantia = document.getElementById("btn-comprar-garantia");
  if (btnComprarGarantia) btnComprarGarantia.addEventListener("click", scrollToOfertas);

  document.querySelectorAll('a[href="#secao-precos"]').forEach(link => {
    link.addEventListener("click", scrollToOfertas);
  });

  // ==============================================================
  // 4. CARROSSEIS (Galeria e Whatsapp)
  // ==============================================================
  const setupCarousel = (selector, prevBtnSel, nextBtnSel) => {
    const carousel = document.querySelector(selector);
    if (!carousel) return;

    const track = carousel.querySelector(`${selector}__track`);
    const slides = carousel.querySelectorAll(`${selector}__slide`);
    const prevBtn = carousel.querySelector(prevBtnSel);
    const nextBtn = carousel.querySelector(nextBtnSel);
    
    if(!track || slides.length === 0) return;

    let currentIndex = 0;
    const totalSlides = slides.length;
    let isTransitioning = false;

    const update = () => {
      track.style.transform = `translateX(-${currentIndex * 100}%)`;
    };

    const next = () => {
      if (isTransitioning) return;
      isTransitioning = true;
      currentIndex = (currentIndex + 1) % totalSlides;
      update();
      setTimeout(() => isTransitioning = false, 300);
    };

    const prev = () => {
      if (isTransitioning) return;
      isTransitioning = true;
      currentIndex = (currentIndex - 1 + totalSlides) % totalSlides;
      update();
      setTimeout(() => isTransitioning = false, 300);
    };

    if (nextBtn) nextBtn.addEventListener("click", next);
    if (prevBtn) prevBtn.addEventListener("click", prev);
  };


  setupCarousel(".whatsapp-carousel", ".whatsapp-carousel__btn--prev", ".whatsapp-carousel__btn--next");

  // ==============================================================
  // 5. TIMER
  // ==============================================================
  const countdownTimer = document.getElementById("countdown-timer");
  if (countdownTimer) {
    let minutes = 13;
    let seconds = 22;
    const updateTimer = () => {
      countdownTimer.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
      if (seconds === 0) {
        if (minutes === 0) { minutes = 13; seconds = 22; } 
        else { minutes--; seconds = 59; }
      } else { seconds--; }
    };
    setInterval(updateTimer, 1000);
    updateTimer();
  }

  console.log("JavaScript carregado: Modo Universal Ativo.");
});