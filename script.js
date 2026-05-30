/**
 * AnimeGen AI - Main Application Script
 * Pure vanilla JS | Volcano Ark · Doubao Seedream 5.0 Lite | localStorage
 */

(function () {
  'use strict';

  // ---- Constants & Storage Keys ----
  const STORAGE = {
    HISTORY: 'animeGen_history',
    QUOTA: 'animeGen_quota',
    PRO: 'animeGen_isPro',
    PRO_EXPIRY: 'animeGen_proExpiry',
    USED_CODES: 'animeGen_usedCodes'
  };

  // Style prompt suffixes appended to user prompt
  const STYLE_SUFFIXES = {
    anime: ', anime style, 2D illustration, vibrant colors, clean lineart, detailed anime eyes, studio quality',
    cyberpunk: ', cyberpunk anime style, neon lights, futuristic city, holographic elements, dark atmosphere, sci-fi aesthetic',
    ancient: ', ancient Chinese fantasy style, traditional hanfu, ink wash painting influence, elegant composition, historical atmosphere',
    realistic: ', semi-realistic anime style, detailed shading, photorealistic lighting, high detail portrait, cinematic quality',
    chibi: ', chibi style, cute Q-version character, oversized head, kawaii expression, simple background, adorable proportions'
  };

  // Map UI size to Seedream API pixel size (2K recommended values)
  const SIZE_TO_API = {
    '512x512': '2048x2048',
    '768x1024': '1728x2304',
    '1024x1024': '2048x2048'
  };

  // 20 high-quality prompt templates
  const PROMPT_TEMPLATES = [
    { title: 'Cherry Blossom Girl', prompt: 'beautiful anime girl with long pink hair standing under cherry blossom trees, petals falling, soft spring sunlight, detailed eyes, masterpiece' },
    { title: 'Cyber Samurai', prompt: 'futuristic samurai warrior in neon-lit Tokyo alley, katana glowing blue, rain reflections, cyberpunk anime style, dramatic pose' },
    { title: 'Magic Academy Student', prompt: 'young witch student in ornate academy uniform, holding glowing spellbook, magical particles, fantasy castle background, detailed illustration' },
    { title: 'Space Pilot', prompt: 'confident female space pilot in sleek mecha suit, cockpit view of stars, sci-fi anime aesthetic, dynamic lighting, heroic expression' },
    { title: 'Forest Spirit', prompt: 'ethereal forest spirit with antlers and flowing green hair, bioluminescent mushrooms, mystical atmosphere, fantasy anime art' },
    { title: 'Street Fashion Idol', prompt: 'trendy anime idol in colorful street fashion, urban Tokyo background, confident pose, pop art colors, magazine cover quality' },
    { title: 'Dragon Rider', prompt: 'brave knight riding a majestic red dragon over clouds, epic fantasy scene, wind in hair, cinematic wide shot, detailed scales' },
    { title: 'Cafe Date Scene', prompt: 'cute couple in cozy anime cafe, warm lighting, coffee cups on table, slice of life style, soft pastel colors, heartwarming mood' },
    { title: 'Dark Vampire Lord', prompt: 'elegant vampire lord in gothic castle, crimson eyes, black cape, moonlight through stained glass, dark fantasy anime, dramatic shadows' },
    { title: 'School Rooftop Sunset', prompt: 'lonely student on school rooftop at golden hour, wind blowing skirt, city skyline, melancholic beautiful atmosphere, shoujo style' },
    { title: 'Mecha Battle', prompt: 'giant mecha in intense battle pose, explosions in background, dynamic action lines, mecha anime style, detailed mechanical design' },
    { title: 'Underwater Mermaid', prompt: 'anime mermaid with iridescent tail swimming among coral reefs, sun rays through water, bubbles, dreamy aquatic colors' },
    { title: 'Ninja in Moonlight', prompt: 'stealthy ninja on rooftop under full moon, mask and headband, action pose, Japanese temple background, cool blue tones' },
    { title: 'Music Concert', prompt: 'energetic anime rock singer on stage, spotlight, crowd silhouettes, electric guitar, vibrant concert lighting, dynamic composition' },
    { title: 'Winter Snow Princess', prompt: 'elegant ice princess in white gown, snowflakes swirling, frozen palace background, sparkling crystals, ethereal cold beauty' },
    { title: 'Cat Girl Cafe', prompt: 'adorable cat girl maid in cozy cafe, cat ears and tail, serving tea, warm interior, kawaii style, cheerful expression' },
    { title: 'Post-Apocalypse Survivor', prompt: 'tough anime survivor in wasteland ruins, dusty coat, sunset horizon, muted earth tones, determined expression, cinematic' },
    { title: 'Celestial Goddess', prompt: 'goddess floating among stars and galaxies, flowing cosmic dress, divine golden aura, ethereal beauty, space fantasy anime' },
    { title: 'Rival Sword Duel', prompt: 'two anime swordsmen clashing blades, sparks flying, intense expressions, dojo at dusk, action anime style, motion blur' },
    { title: 'Peaceful Countryside', prompt: 'girl in sundress walking through lavender fields, windmill in distance, Studio Ghibli inspired, peaceful countryside, soft watercolor feel' }
  ];

  // Example gallery images (anime-style placeholders via picsum seeds)
  const EXAMPLE_IMAGES = Array.from({ length: 12 }, (_, i) => ({
    src: `https://picsum.photos/seed/animegen${i + 1}/400/400`,
    alt: `AI anime example ${i + 1}`
  }));

  // In-memory cache for full-res images (current session only)
  const sessionImages = new Map();

  // ---- State ----
  let selectedStyle = 'anime';
  let isGenerating = false;
  let progressTimer = null;

  // ---- DOM References ----
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const els = {
    navToggle: $('#navToggle'),
    navLinks: $('#navLinks'),
    quotaBadge: $('#quotaBadge'),
    exampleGallery: $('#exampleGallery'),
    generateForm: $('#generateForm'),
    prompt: $('#prompt'),
    templatesToggle: $('#templatesToggle'),
    templatesGrid: $('#templatesGrid'),
    styleOptions: $('#styleOptions'),
    size: $('#size'),
    count: $('#count'),
    generateBtn: $('#generateBtn'),
    progressPanel: $('#progressPanel'),
    progressBar: $('#progressBar'),
    progressStatus: $('#progressStatus'),
    progressEta: $('#progressEta'),
    resultsPlaceholder: $('#resultsPlaceholder'),
    resultsGrid: $('#resultsGrid'),
    historyEmpty: $('#historyEmpty'),
    historyList: $('#historyList'),
    lightboxModal: $('#lightboxModal'),
    lightboxImage: $('#lightboxImage'),
    lightboxClose: $('#lightboxClose'),
    proModal: $('#proModal'),
    proModalClose: $('#proModalClose'),
    proModalDismiss: $('#proModalDismiss'),
    proModalPricing: $('#proModalPricing'),
    upgradeProBtn: $('#upgradeProBtn'),
    toastContainer: $('#toastContainer'),
    paymentModal: $('#paymentModal'),
    paymentModalClose: $('#paymentModalClose'),
    paymentModalQr: $('#paymentModalQr'),
    paymentModalPrice: $('#paymentModalPrice'),
    paymentModalNote: $('#paymentModalNote'),
    paymentModalContact: $('#paymentModalContact'),
    activationFormModal: $('#activationFormModal'),
    activationCodeModal: $('#activationCodeModal'),
    paymentQrImage: $('#paymentQrImage'),
    paymentAmount: $('#paymentAmount'),
    paymentNote: $('#paymentNote'),
    paymentContact: $('#paymentContact'),
    activationForm: $('#activationForm'),
    activationCode: $('#activationCode'),
    paymentFlow: $('#paymentFlow'),
    proActiveBanner: $('#proActiveBanner'),
    proExpiryText: $('#proExpiryText'),
    proPriceDisplay: $('#proPriceDisplay')
  };

  let currentPayTab = 'wechat';
    isGenerating = false;
    if (els.generateBtn) {
      els.generateBtn.disabled = false;
      els.generateBtn.textContent = '✨ Generate Anime Art';
    }
    if (els.progressPanel) els.progressPanel.classList.remove('active');
  }

  function showConfigError() {
    if (els.generateBtn) {
      els.generateBtn.disabled = true;
      els.generateBtn.textContent = 'Missing config.js';
    }
    const banner = document.createElement('div');
    banner.style.cssText = 'position:fixed;top:64px;left:0;right:0;background:#fef2f2;color:#991b1b;padding:12px;text-align:center;z-index:9999;font-size:0.9rem';
    banner.textContent = 'Error: config.js not found. Ensure config.js is in the same folder as index.html.';
    document.body.prepend(banner);
  }

  function getConfig() {
    if (typeof CONFIG === 'undefined') {
      throw new Error('config.js not loaded. Please refresh the page or redeploy with config.js included.');
    }
    return CONFIG;
  }
  function init() {
    if (typeof CONFIG === 'undefined') {
      console.error('config.js failed to load — Generate button will not work.');
      showConfigError();
      return;
    }

    resetGenerateUI();
    cleanupLegacyHistory();
    renderExampleGallery();
    renderTemplates();
    bindEvents();
    initPaymentUI();
    updateQuotaBadge();
    updateProUI();
    renderHistory();
    highlightNav();
  }

  function bindEvents() {
    // Mobile nav
    els.navToggle.addEventListener('click', () => {
      els.navLinks.classList.toggle('open');
    });

    $$('.nav-links a').forEach((link) => {
      link.addEventListener('click', () => els.navLinks.classList.remove('open'));
    });

    // Style chips
    els.styleOptions.addEventListener('click', (e) => {
      const chip = e.target.closest('.style-chip');
      if (!chip) return;
      $$('.style-chip').forEach((c) => c.classList.remove('active'));
      chip.classList.add('active');
      selectedStyle = chip.dataset.style;
    });

    // Templates toggle
    els.templatesToggle.addEventListener('click', () => {
      els.templatesGrid.classList.toggle('open');
      const open = els.templatesGrid.classList.contains('open');
      els.templatesToggle.textContent = open
        ? '📚 Hide Prompt Templates ▴'
        : '📚 Browse 20 Prompt Templates ▾';
    });

    // Form submit
    els.generateForm.addEventListener('submit', (e) => {
      e.preventDefault();
      handleGenerate();
    });

    // Lightbox
    els.lightboxClose.addEventListener('click', closeLightbox);
    els.lightboxModal.addEventListener('click', (e) => {
      if (e.target === els.lightboxModal) closeLightbox();
    });

    // Pro / Payment — use delegation so tabs always work
    els.proModalClose?.addEventListener('click', closeProModal);
    els.proModalDismiss?.addEventListener('click', closeProModal);
    els.proModalPricing?.addEventListener('click', () => {
      closeProModal();
      openPaymentPanel();
    });
    els.upgradeProBtn?.addEventListener('click', openPaymentPanel);
    els.paymentModalClose?.addEventListener('click', closePaymentModal);
    els.paymentModal?.addEventListener('click', (e) => {
      if (e.target === els.paymentModal) closePaymentModal();
    });

    document.addEventListener('click', (e) => {
      const tab = e.target.closest('.payment-tab');
      if (tab?.dataset.payTab) setPayTab(tab.dataset.payTab);
    });

    els.activationForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      activatePro(els.activationCode?.value);
    });
    els.activationFormModal?.addEventListener('submit', (e) => {
      e.preventDefault();
      activatePro(els.activationCodeModal?.value);
    });

    // SEO article placeholders
    $$('[data-seo-article]').forEach((link) => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        showToast('SEO article coming soon! This is a placeholder link.', 'info');
      });
    });

    // Scroll spy for nav
    window.addEventListener('scroll', highlightNav);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeLightbox();
        closeProModal();
        closePaymentModal();
      }
    });
  }

  // ---- Example Gallery ----
  function renderExampleGallery() {
    els.exampleGallery.innerHTML = EXAMPLE_IMAGES.map(
      (img) => `
        <div class="gallery-item" data-src="${img.src}">
          <img src="${img.src}" alt="${img.alt}" loading="lazy">
          <div class="overlay"><span>Click to enlarge</span></div>
        </div>
      `
    ).join('');

    els.exampleGallery.addEventListener('click', (e) => {
      const item = e.target.closest('.gallery-item');
      if (!item) return;
      openLightbox(item.dataset.src);
    });
  }

  // ---- Prompt Templates ----
  function renderTemplates() {
    els.templatesGrid.innerHTML = PROMPT_TEMPLATES.map(
      (t, i) => `
        <button type="button" class="template-card" data-index="${i}">
          <strong>${t.title}</strong>
          <span>${t.prompt}</span>
        </button>
      `
    ).join('');

    els.templatesGrid.addEventListener('click', (e) => {
      const card = e.target.closest('.template-card');
      if (!card) return;
      const tpl = PROMPT_TEMPLATES[parseInt(card.dataset.index, 10)];
      els.prompt.value = tpl.prompt;
      showToast(`Template "${tpl.title}" applied!`, 'success');
    });
  }

  // ---- Quota System ----
  function getTodayKey() {
    return new Date().toISOString().slice(0, 10);
  }

  function getPaymentConfig() {
    return getConfig().PAYMENT || {};
  }

  function isProUser() {
    if (localStorage.getItem(STORAGE.PRO) !== 'true') return false;
    const expiry = localStorage.getItem(STORAGE.PRO_EXPIRY);
    if (!expiry) return true;
    if (Date.now() > parseInt(expiry, 10)) {
      deactivatePro();
      return false;
    }
    return true;
  }

  function deactivatePro() {
    localStorage.removeItem(STORAGE.PRO);
    localStorage.removeItem(STORAGE.PRO_EXPIRY);
    updateQuotaBadge();
    updateProUI();
  }

  function getProExpiryDate() {
    const expiry = localStorage.getItem(STORAGE.PRO_EXPIRY);
    if (!expiry) return null;
    return new Date(parseInt(expiry, 10));
  }

  function getQuota() {
    try {
      const raw = localStorage.getItem(STORAGE.QUOTA);
      const data = raw ? JSON.parse(raw) : { date: getTodayKey(), used: 0 };
      if (data.date !== getTodayKey()) {
        return { date: getTodayKey(), used: 0 };
      }
      return data;
    } catch {
      return { date: getTodayKey(), used: 0 };
    }
  }

  function saveQuota(quota) {
    localStorage.setItem(STORAGE.QUOTA, JSON.stringify(quota));
    updateQuotaBadge();
  }

  function getRemainingQuota() {
    if (isProUser()) return Infinity;
    const limit = getConfig().DAILY_FREE_LIMIT || 5;
    return Math.max(0, limit - getQuota().used);
  }

  function canGenerate(count) {
    if (isProUser()) return true;
    return getRemainingQuota() >= count;
  }

  function consumeQuota(amount) {
    if (isProUser()) return;
    const quota = getQuota();
    quota.used += amount;
    saveQuota(quota);
  }

  function updateQuotaBadge() {
    if (isProUser()) {
      els.quotaBadge.textContent = '👑 Pro — Unlimited';
      els.quotaBadge.style.background = 'linear-gradient(135deg,#fef3c7,#fde68a)';
      els.quotaBadge.style.color = '#92400e';
      return;
    }
    els.quotaBadge.style.background = '';
    els.quotaBadge.style.color = '';
    const limit = getConfig().DAILY_FREE_LIMIT || 5;
    const remaining = getRemainingQuota();
    els.quotaBadge.textContent = `${remaining} / ${limit} free today`;
  }

  // ---- Payment & Activation ----
  function initPaymentUI() {
    const pay = getPaymentConfig();
    const priceUsd = pay.PRICE_USD ?? 9.99;
    const priceCny = pay.PRICE_CNY ?? 68;

    if (els.proPriceDisplay) {
      els.proPriceDisplay.innerHTML = `$${priceUsd}<span>/month</span>`;
    }
    if (els.paymentAmount) {
      els.paymentAmount.textContent = `¥${priceCny} / $${priceUsd} per month`;
    }
    if (els.paymentModalPrice) {
      els.paymentModalPrice.textContent = `¥${priceCny} / $${priceUsd} — ${pay.PRO_DURATION_DAYS || 30} days`;
    }
    if (els.paymentNote) {
      els.paymentNote.textContent = pay.PAYMENT_NOTE || 'Please add payment note: AnimeGen Pro';
    }
    if (els.paymentModalNote) {
      els.paymentModalNote.textContent = pay.PAYMENT_NOTE || '';
    }
    const contact = [
      pay.CONTACT_WECHAT && `WeChat: ${pay.CONTACT_WECHAT}`,
      pay.CONTACT_EMAIL && `Email: ${pay.CONTACT_EMAIL}`
    ].filter(Boolean).join(' · ');
    if (els.paymentContact) els.paymentContact.textContent = contact;
    if (els.paymentModalContact) els.paymentModalContact.textContent = contact;

    setPayTab('wechat');
    updateProUI();
  }

  function setPayTab(tab) {
    currentPayTab = tab;
    $$('.payment-tab').forEach((t) => {
      t.classList.toggle('active', t.dataset.payTab === tab);
    });
    const pay = getPaymentConfig();
    const src = tab === 'wechat' ? pay.WECHAT_QR : pay.ALIPAY_QR;
    const fallback = tab === 'wechat' ? pay.WECHAT_QR_FALLBACK : pay.ALIPAY_QR_FALLBACK;
    const version = pay.QR_VERSION || '1';
    setQrImage(els.paymentQrImage, src, fallback, version);
    setQrImage(els.paymentModalQr, src, fallback, version);
  }

  function setQrImage(imgEl, primary, fallback, version) {
    if (!imgEl) return;
    const bust = (url) => url ? `${url}${url.includes('?') ? '&' : '?'}v=${version}` : '';
    const tryLoad = (src, isFallback) => {
      if (!src) {
        if (!isFallback && fallback) tryLoad(fallback, true);
        return;
      }
      imgEl.onerror = () => {
        if (!isFallback && fallback && src !== fallback) {
          tryLoad(fallback, true);
        }
      };
      imgEl.src = bust(src);
    };
    tryLoad(primary || fallback || '', false);
  }

  function updateProUI() {
    const isPro = isProUser();
    const pay = getPaymentConfig();

    if (els.paymentFlow) {
      els.paymentFlow.style.display = isPro ? 'none' : 'block';
    }
    if (els.proActiveBanner) {
      els.proActiveBanner.style.display = isPro ? 'flex' : 'none';
    }
    if (els.proExpiryText && isPro) {
      const exp = getProExpiryDate();
      els.proExpiryText.textContent = exp
        ? `Valid until ${exp.toLocaleDateString()}`
        : 'Unlimited generations enabled';
    }
    if (els.upgradeProBtn) {
      els.upgradeProBtn.textContent = isPro ? 'Pro Active ✓' : 'Upgrade to Pro';
      els.upgradeProBtn.disabled = false;
    }
  }

  /** Scroll to payment section and open modal */
  function openPaymentPanel() {
    if (isProUser()) {
      showToast('You already have Pro activated!', 'info');
      return;
    }
    try {
      setPayTab(currentPayTab);
      if (els.paymentModal) {
        els.paymentModal.classList.add('open');
        document.body.style.overflow = 'hidden';
      }
      const section = document.getElementById('paymentSection');
      if (section) {
        section.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      location.hash = 'pricing';
    } catch (err) {
      console.error('Payment panel error:', err);
      showToast('Payment panel failed to open. Please refresh the page.', 'error');
    }
  }

  function openPaymentModal() {
    openPaymentPanel();
  }

  function closePaymentModal() {
    els.paymentModal.classList.remove('open');
    document.body.style.overflow = '';
  }

  function getUsedCodes() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE.USED_CODES) || '[]');
    } catch {
      return [];
    }
  }

  function markCodeUsed(code) {
    const used = getUsedCodes();
    used.push(code);
    localStorage.setItem(STORAGE.USED_CODES, JSON.stringify(used));
  }

  function activatePro(rawCode) {
    const code = (rawCode || '').trim().toUpperCase();
    if (!code) {
      showToast('Please enter your activation code.', 'error');
      return;
    }

    const pay = getPaymentConfig();
    const validCodes = (pay.ACTIVATION_CODES || []).map((c) => c.trim().toUpperCase());

    if (!validCodes.includes(code)) {
      showToast('Invalid activation code. Please check and try again.', 'error');
      return;
    }

    if (getUsedCodes().includes(code)) {
      showToast('This code has already been used.', 'error');
      return;
    }

    const days = pay.PRO_DURATION_DAYS || 30;
    const expiry = Date.now() + days * 24 * 60 * 60 * 1000;

    localStorage.setItem(STORAGE.PRO, 'true');
    localStorage.setItem(STORAGE.PRO_EXPIRY, String(expiry));
    markCodeUsed(code);

    if (els.activationCode) els.activationCode.value = '';
    if (els.activationCodeModal) els.activationCodeModal.value = '';

    closePaymentModal();
    closeProModal();
    updateQuotaBadge();
    updateProUI();
    showToast(`Pro activated! Valid for ${days} days. Enjoy unlimited generations!`, 'success');
  }

  /** Clear old history format that stored full PNGs and filled localStorage */
  function cleanupLegacyHistory() {
    try {
      const raw = localStorage.getItem(STORAGE.HISTORY);
      if (!raw || raw.length < 500000) return;
      const history = JSON.parse(raw);
      const legacy = history.some((h) => h.images?.[0]?.startsWith?.('data:image/png'));
      if (legacy || raw.length > 2000000) {
        localStorage.removeItem(STORAGE.HISTORY);
        console.info('Cleared oversized history to prevent storage quota errors.');
      }
    } catch {
      localStorage.removeItem(STORAGE.HISTORY);
    }
  }

  // ---- History ----
  function getHistory() {
    try {
      const raw = localStorage.getItem(STORAGE.HISTORY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  function saveHistory(history) {
    const max = getConfig().MAX_HISTORY_ITEMS || 15;
    let trimmed = history.slice(0, max);

    while (trimmed.length >= 0) {
      try {
        if (trimmed.length === 0) {
          localStorage.removeItem(STORAGE.HISTORY);
          return;
        }
        localStorage.setItem(STORAGE.HISTORY, JSON.stringify(trimmed));
        return;
      } catch (err) {
        if (err.name === 'QuotaExceededError' && trimmed.length > 1) {
          trimmed = trimmed.slice(0, -1);
        } else if (err.name === 'QuotaExceededError') {
          localStorage.removeItem(STORAGE.HISTORY);
          throw new Error('Browser storage is full. Old history was cleared.');
        } else {
          throw err;
        }
      }
    }
  }

  /** Compress image to small JPEG thumbnail for localStorage */
  function createThumbnail(dataUrl, maxSize = 200, quality = 0.72) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => reject(new Error('Thumbnail failed'));
      img.src = dataUrl;
    });
  }

  async function addToHistory(record) {
    sessionImages.set(record.id, record.images);

    let thumb;
    try {
      thumb = await createThumbnail(record.images[0]);
    } catch {
      thumb = record.images[0];
    }

    const slim = {
      id: record.id,
      prompt: record.prompt,
      style: record.style,
      size: record.size,
      imageCount: record.images.length,
      thumbnail: thumb,
      timestamp: record.timestamp
    };

    const history = getHistory();
    history.unshift(slim);

    try {
      saveHistory(history);
    } catch (err) {
      sessionImages.delete(record.id);
      throw err;
    }

    renderHistory();
  }

  function deleteHistoryItem(id) {
    sessionImages.delete(id);
    const history = getHistory().filter((h) => h.id !== id);
    saveHistory(history);
    renderHistory();
    showToast('Record deleted.', 'success');
  }

  function renderHistory() {
    const history = getHistory();
    if (history.length === 0) {
      els.historyEmpty.style.display = 'block';
      els.historyList.innerHTML = '';
      return;
    }

    els.historyEmpty.style.display = 'none';
    els.historyList.innerHTML = history
      .map((item) => {
        const thumb = item.thumbnail || item.images?.[0] || '';
        const count = item.imageCount || item.images?.length || 1;
        const date = new Date(item.timestamp).toLocaleString();
        return `
          <article class="history-item" data-id="${item.id}">
            <img class="history-thumb" src="${thumb}" alt="Generated thumbnail">
            <div class="history-meta">
              <h4>${escapeHtml(truncate(item.prompt, 80))}</h4>
              <p>${item.style} · ${item.size} · ${count} image(s) · ${date}</p>
            </div>
            <div class="history-actions">
              <button type="button" class="btn btn-sm btn-outline" data-action="regenerate" data-id="${item.id}">Regenerate</button>
              <button type="button" class="btn btn-sm btn-ghost" data-action="view" data-id="${item.id}">View</button>
              <button type="button" class="btn btn-sm btn-danger" data-action="delete" data-id="${item.id}">Delete</button>
            </div>
          </article>
        `;
      })
      .join('');

    els.historyList.querySelectorAll('[data-action]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const action = btn.dataset.action;
        const item = getHistory().find((h) => h.id === id);
        if (!item) return;

        if (action === 'delete') {
          deleteHistoryItem(id);
        } else if (action === 'regenerate') {
          els.prompt.value = item.prompt;
          selectedStyle = item.style;
          $$('.style-chip').forEach((c) => {
            c.classList.toggle('active', c.dataset.style === item.style);
          });
          els.size.value = item.size;
          els.count.value = String(Math.min(item.imageCount || item.images?.length || 1, 4));
          location.hash = 'generator';
          showToast('Settings restored. Click Generate to recreate.', 'info');
        } else if (action === 'view') {
          const fullImages = sessionImages.get(id) || (item.images?.length ? item.images : [item.thumbnail].filter(Boolean));
          displayResults(fullImages, item.prompt);
          if (!sessionImages.has(id)) {
            showToast('Showing saved preview. Regenerate for full resolution.', 'info');
          }
          location.hash = 'generator';
        }
      });
    });
  }

  // ---- Image Generation ----
  async function handleGenerate() {
    if (isGenerating) return;

    let cfg;
    try {
      cfg = getConfig();
    } catch (err) {
      showToast(err.message, 'error');
      return;
    }

    const prompt = els.prompt.value.trim();
    if (!prompt) {
      showToast('Please enter a prompt in English.', 'error');
      return;
    }

    const count = parseInt(els.count.value, 10);
    const size = els.size.value;

    if (!cfg.API_KEY || cfg.API_KEY.includes('YOUR_API_KEY')) {
      showToast('Please set your API key in config.js first.', 'error');
      return;
    }

    if (!canGenerate(count)) {
      openProModal();
      return;
    }

    isGenerating = true;
    els.generateBtn.disabled = true;
    els.progressPanel.classList.add('active');
    els.resultsGrid.style.display = 'none';
    els.resultsPlaceholder.style.display = 'none';

    const fullPrompt = prompt + (STYLE_SUFFIXES[selectedStyle] || '');
    const apiSize = SIZE_TO_API[size] || '2048x2048';
    const totalEst = count * (cfg.EST_SECONDS_PER_IMAGE || 15);

    startProgress(0, count, totalEst);
    updateProgress(0, count, totalEst, `Connecting to Doubao Seedream 5.0 Lite...`);

    try {
      const images = await callSeedreamAPI(fullPrompt, apiSize, count, (done, status) => {
        updateProgress(done, count, totalEst, status);
      });

      if (!isProUser()) {
        consumeQuota(images.length);
      }

      finishProgress();
      displayResults(images, prompt);

      try {
        await addToHistory({
          id: generateId(),
          prompt,
          style: selectedStyle,
          size,
          images,
          timestamp: Date.now()
        });
      } catch (historyErr) {
        console.warn('History save failed:', historyErr);
        showToast('Images generated! History not saved — browser storage may be full.', 'info');
      }

      showToast(`Successfully generated ${count} image(s)!`, 'success');
    } catch (err) {
      console.error('Generation error:', err);
      showToast(err.message || 'Generation failed. Please try again.', 'error');
      els.resultsPlaceholder.style.display = 'flex';
      els.resultsGrid.style.display = 'none';
    } finally {
      isGenerating = false;
      els.generateBtn.disabled = false;
      stopProgress();
      els.progressPanel.classList.remove('active');
    }
  }

  /** Build Authorization header for Volcano Ark (Bearer + API Key) */
  function getAuthHeader() {
    const key = getConfig().API_KEY.trim();
    if (key.startsWith('Bearer ')) return key;
    // Volcano Ark keys usually start with a UUID or sk- prefix from console
    return `Bearer ${key}`;
  }

  /**
   * Call Volcano Ark · Doubao Seedream 5.0 Lite API
   * @param {Function} onProgress - callback(doneCount, statusText)
   * @returns {Promise<string[]>} array of data URLs
   */
  async function callSeedreamAPI(prompt, size, count, onProgress) {
    const cfg = getConfig();
    const payload = {
      model: cfg.MODEL_ID,
      prompt,
      size,
      response_format: 'b64_json',
      output_format: 'png',
      watermark: false,
      stream: false
    };

    if (count > 1) {
      payload.sequential_image_generation = 'auto';
      payload.sequential_image_generation_options = { max_images: count };
    } else {
      payload.sequential_image_generation = 'disabled';
    }

    let response;
    try {
      response = await fetch(cfg.API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: getAuthHeader()
        },
        body: JSON.stringify(payload)
      });
    } catch {
      throw new Error('Network error. Check your internet connection and try again.');
    }

    if (!response.ok) {
      let errMsg = `API error (${response.status})`;
      try {
        const errData = await response.json();
        const err = errData.error || errData;
        if (err.message) errMsg = err.message;
        else if (typeof err === 'string') errMsg = err;
        else if (errData.message) errMsg = errData.message;
      } catch {
        /* keep default */
      }

      if (response.status === 401) {
        errMsg = 'Invalid API key. Please check config.js.';
      } else if (response.status === 403) {
        errMsg = 'Access denied. Check if the model is activated in Volcano Ark console.';
      } else if (response.status === 404) {
        errMsg = 'Model not found. Update MODEL_ID in config.js to your endpoint ID (e.g. doubao-seedream-5-0-260128).';
      } else if (response.status === 429) {
        errMsg = 'Rate limit exceeded. Please wait and try again.';
      }

      throw new Error(errMsg);
    }

    const data = await response.json();
    onProgress?.(0, 'Parsing generated images...');

    const images = await parseSeedreamImages(data);

    if (images.length === 0) {
      throw new Error('No image data received from API. Check MODEL_ID in config.js.');
    }

    return images.slice(0, count);
  }

  /** Parse OpenAI-compatible images response into data URLs */
  async function parseSeedreamImages(data) {
    const items = data.data || data.images || [];
    const results = [];

    for (const item of items) {
      if (item.b64_json) {
        const mime = item.output_format === 'jpeg' ? 'image/jpeg' : 'image/png';
        results.push(`data:${mime};base64,${item.b64_json}`);
      } else if (item.url) {
        results.push(await urlToDataUrl(item.url));
      }
    }

    return results;
  }

  /** Fetch remote image URL and convert to data URL for storage */
  async function urlToDataUrl(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to download generated image.');
    const blob = await res.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('Failed to read image data.'));
      reader.readAsDataURL(blob);
    });
  }

  // ---- Display Results ----
  function displayResults(images, prompt) {
    els.resultsPlaceholder.style.display = 'none';
    els.resultsGrid.style.display = 'grid';
    els.resultsGrid.innerHTML = images
      .map(
        (src, i) => `
        <div class="result-card">
          <img src="${src}" alt="Generated anime art ${i + 1}">
          <div class="result-actions">
            <button type="button" class="btn btn-sm btn-primary" data-download="${i}">⬇ Download</button>
            <div class="share-dropdown">
              <button type="button" class="btn btn-sm btn-outline" data-share-toggle="${i}">↗ Share</button>
              <div class="share-menu" id="shareMenu${i}">
                <a href="#" data-share="twitter" data-index="${i}">Twitter / X</a>
                <a href="#" data-share="facebook" data-index="${i}">Facebook</a>
                <a href="#" data-share="pinterest" data-index="${i}">Pinterest</a>
                <button type="button" data-share="native" data-index="${i}">System Share...</button>
              </div>
            </div>
          </div>
        </div>
      `
      )
      .join('');

    // Store images for action handlers
    els.resultsGrid._images = images;
    els.resultsGrid._prompt = prompt;

    els.resultsGrid.querySelectorAll('[data-download]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.download, 10);
        downloadImage(images[idx], `animegen-${Date.now()}-${idx + 1}.png`);
      });
    });

    els.resultsGrid.querySelectorAll('[data-share-toggle]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const idx = btn.dataset.shareToggle;
        const menu = document.getElementById(`shareMenu${idx}`);
        $$('.share-menu').forEach((m) => {
          if (m !== menu) m.classList.remove('open');
        });
        menu.classList.toggle('open');
      });
    });

    els.resultsGrid.querySelectorAll('[data-share]').forEach((el) => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        const platform = el.dataset.share;
        const idx = parseInt(el.dataset.index, 10);
        shareImage(platform, images[idx], prompt);
        $$('.share-menu').forEach((m) => m.classList.remove('open'));
      });
    });

    document.addEventListener('click', closeShareMenus, { once: true });
  }

  function closeShareMenus() {
    $$('.share-menu').forEach((m) => m.classList.remove('open'));
  }

  // ---- Download ----
  function downloadImage(dataUrl, filename) {
    try {
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('Download started!', 'success');
    } catch {
      showToast('Download failed. Please try again.', 'error');
    }
  }

  // ---- Share ----
  function shareImage(platform, imageDataUrl, prompt) {
    const pageUrl = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(`Check out my AI anime art: "${truncate(prompt, 100)}" — created with AnimeGen AI`);
    const desc = encodeURIComponent(`AI anime art: ${truncate(prompt, 200)}`);

    if (platform === 'native' && navigator.share) {
      fetch(imageDataUrl)
        .then((r) => r.blob())
        .then((blob) => {
          const file = new File([blob], 'animegen.png', { type: 'image/png' });
          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            return navigator.share({
              title: 'My AI Anime Art',
              text: prompt,
              files: [file]
            });
          }
          return navigator.share({ title: 'My AI Anime Art', text: prompt, url: window.location.href });
        })
        .catch(() => showToast('Sharing cancelled or not supported.', 'info'));
      return;
    }

    if (platform === 'twitter') {
      window.open(`https://twitter.com/intent/tweet?text=${text}&url=${pageUrl}`, '_blank', 'noopener,noreferrer,width=600,height=400');
    } else if (platform === 'facebook') {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${pageUrl}&quote=${text}`, '_blank', 'noopener,noreferrer,width=600,height=400');
    } else if (platform === 'pinterest') {
      // Pinterest requires a public image URL; share page + description as fallback
      window.open(
        `https://pinterest.com/pin/create/button/?url=${pageUrl}&description=${desc}`,
        '_blank',
        'noopener,noreferrer,width=750,height=600'
      );
      showToast('Tip: Download the image first, then upload to Pinterest for best results.', 'info');
    }
  }

  // ---- Progress UI ----
  function startProgress(current, total, totalSeconds) {
    els.progressBar.style.width = '0%';
    updateProgress(current, total, totalSeconds, 'Connecting to Doubao Seedream 5.0 Lite...');
  }

  function updateProgress(done, total, totalSeconds, statusText) {
    const pct = total === 0 ? 0 : Math.round((done / total) * 100);
    const elapsed = (done / total) * totalSeconds;
    const remaining = Math.max(0, Math.ceil(totalSeconds - elapsed));

    els.progressBar.style.width = `${Math.max(pct, done === 0 ? 5 : pct)}%`;
    els.progressStatus.textContent = statusText;
    els.progressEta.textContent = remaining > 0 ? `~${remaining}s remaining` : 'Almost done...';
  }

  function finishProgress() {
    els.progressBar.style.width = '100%';
    els.progressStatus.textContent = 'Complete!';
    els.progressEta.textContent = 'Done';
  }

  function stopProgress() {
    if (progressTimer) {
      clearInterval(progressTimer);
      progressTimer = null;
    }
  }

  // ---- Modals ----
  function openLightbox(src) {
    els.lightboxImage.src = src;
    els.lightboxModal.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    els.lightboxModal.classList.remove('open');
    document.body.style.overflow = '';
  }

  function openProModal() {
    els.proModal.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeProModal() {
    els.proModal.classList.remove('open');
    document.body.style.overflow = '';
  }

  // ---- Toast Notifications ----
  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    els.toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s';
      setTimeout(() => toast.remove(), 300);
    }, 4500);
  }

  // ---- Nav Highlight ----
  function highlightNav() {
    const sections = ['home', 'generator', 'history', 'pricing', 'about'];
    let current = 'home';
    const scrollY = window.scrollY + 100;

    sections.forEach((id) => {
      const el = document.getElementById(id);
      if (el && el.offsetTop <= scrollY) current = id;
    });

    $$('.nav-links a').forEach((link) => {
      link.classList.toggle('active', link.dataset.nav === current);
    });
  }

  // ---- Utilities ----
  function generateId() {
    return `gen_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function truncate(str, len) {
    return str.length > len ? str.slice(0, len) + '…' : str;
  }

  // Boot
  document.addEventListener('DOMContentLoaded', init);
})();
