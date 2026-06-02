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
    liveaction: ', photorealistic AI live-action style, real human proportions, cinematic photography, hyperrealistic skin and fabric texture, movie poster quality, dramatic atmosphere, 8K photo realism',
    chibi: ', chibi style, cute Q-version character, oversized head, kawaii expression, simple background, adorable proportions'
  };

  // Map UI size to Seedream API pixel size (max quality)
  const SIZE_TO_API = {
    '1024x1024': '2048x2048',
    '1536x2048': '2592x3456',
    '2048x2048': '3072x3072',
    '3840x2160': '4096x2304',
    '2160x3840': '2304x4096'
  };

  // Faster API sizes — shorter render time
  const SIZE_TO_API_FAST = {
    '1024x1024': '2048x2048',
    '1536x2048': '1728x2304',
    '2048x2048': '2048x2048',
    '3840x2160': '2848x1600',
    '2160x3840': '1600x2848'
  };

  const SIZE_LABELS = {
    '1024x1024': '2K HD',
    '1536x2048': '3K Portrait',
    '2048x2048': '3K Square',
    '3840x2160': '4K Ultra HD',
    '2160x3840': '4K Portrait'
  };

  const SIZE_HINTS = {
    '1024x1024': '2K HD — Fastest (~8s)',
    '1536x2048': '3K vertical — ideal for phone wallpapers',
    '2048x2048': '3K square — social media posts',
    '3840x2160': '4K Ultra HD — best for wallpapers & prints',
    '2160x3840': '4K vertical — mobile & poster format'
  };

  const HD_QUALITY_SUFFIX = ', ultra high resolution, 4K quality, sharp focus, intricate details, professional anime illustration';

  const SIZE_EST_SECONDS = {
    '1024x1024': 10,
    '1536x2048': 14,
    '2048x2048': 16,
    '3840x2160': 22,
    '2160x3840': 22
  };

  const SIZE_EST_SECONDS_FAST = {
    '1024x1024': 8,
    '1536x2048': 10,
    '2048x2048': 12,
    '3840x2160': 16,
    '2160x3840': 16
  };

  function getApiSize(uiSize) {
    const cfg = getConfig();
    const map = cfg.FAST_GENERATION !== false ? SIZE_TO_API_FAST : SIZE_TO_API;
    return map[uiSize] || '2048x2048';
  }

  function getEstSecondsPerImage(uiSize) {
    const cfg = getConfig();
    const map = cfg.FAST_GENERATION !== false ? SIZE_EST_SECONDS_FAST : SIZE_EST_SECONDS;
    return map[uiSize] || cfg.EST_SECONDS_PER_IMAGE || 12;
  }

  function buildGenerationPrompt(prompt, size) {
    const style = STYLE_SUFFIXES[selectedStyle] || '';
    const epicBg = ', epic grand scale background, vast cinematic environment, atmospheric depth';
    if (is4KSize(size)) {
      return prompt + style + epicBg + HD_QUALITY_SUFFIX;
    }
    return prompt + style + epicBg + ', high quality, detailed illustration';
  }

  // Prompt writing checklist — used for live blue tips below textarea
  const PROMPT_CHECKS = [
    {
      id: 'character',
      patterns: /\b(girl|boy|woman|man|warrior|princess|knight|idol|witch|ninja|mermaid|goddess|pilot|student|maid|samurai|vampire|spirit|hero|character|person)\b/i,
      ok: 'Character defined — who is in the scene is clear.',
      miss: 'Add <strong>who</strong> appears: e.g. silver-haired warrior princess, cyberpunk samurai, cat girl guardian.'
    },
    {
      id: 'appearance',
      patterns: /\b(hair|eyes|skin|face|expression|smile|outfit|dress|uniform|armor|cloak|ears|tail|heterochromia|blonde|silver|pink|blue eyes)\b/i,
      ok: 'Appearance details present — hair, eyes, or outfit described.',
      miss: 'Describe <strong>appearance</strong>: hair color & length, eye color, expression, clothing material and colors.'
    },
    {
      id: 'background',
      patterns: /\b(background|sky|cloud|mountain|city|forest|palace|temple|ocean|nebula|galaxy|battlefield|ruins|lake|street|castle|horizon|valley|rooftop|kingdom|arena|shrine|aurora|megacity|cliff|sea of clouds)\b/i,
      ok: 'Epic background included — environment adds scale and mood.',
      miss: 'Add a <strong>grand background</strong>: floating celestial palace, cosmic nebula, ancient temple ruins, aurora over mountains, neon megacity skyline.'
    },
    {
      id: 'lighting',
      patterns: /\b(light|lighting|sunlight|moonlight|golden hour|rim light|god rays|volumetric|glow|neon|spotlight|shadow|backlit|sunset|sunrise|dramatic)\b/i,
      ok: 'Lighting described — helps depth and cinematic feel.',
      miss: 'Add <strong>lighting</strong>: cinematic golden hour, epic god rays, dramatic rim light, moonlight through storm clouds, neon reflections.'
    },
    {
      id: 'camera',
      patterns: /\b(close-up|portrait|full body|wide shot|cinematic|angle|depth of field|bokeh|low angle|bird eye|IMAX|composition|dynamic pose|establishing shot)\b/i,
      ok: 'Camera / composition specified — guides framing and scale.',
      miss: 'Add <strong>camera angle</strong>: wide cinematic establishing shot, low-angle heroic view, full-body dynamic pose, extreme depth of field.'
    },
    {
      id: 'mood',
      patterns: /\b(mood|atmosphere|melancholic|epic|mystical|dreamy|intense|peaceful|heroic|dark|ethereal|wind|petals|rain|snow|mist|particles|magical)\b/i,
      ok: 'Mood & atmosphere set — emotional tone is clear.',
      miss: 'Add <strong>mood & atmosphere</strong>: wind and cherry petals, swirling snow, magical particles, melancholic sunset, epic storm energy.'
    },
    {
      id: 'quality',
      patterns: /\b(masterpiece|best quality|highly detailed|8k|4k|ultra hd|wallpaper|award|detailed|sharp focus|hyperrealistic)\b/i,
      ok: 'Quality tags added — helps render fine detail at HD / 4K.',
      miss: 'Add <strong>quality tags</strong>: masterpiece, best quality, highly detailed, 8k wallpaper, sharp focus.'
    }
  ];

  // 20 high-quality prompt templates
  const PROMPT_TEMPLATES = [
    { title: 'Cherry Blossom Girl', prompt: 'beautiful anime girl with long pink hair standing on cliff edge, vast cherry blossom valley stretching to horizon, petals swirling in wind, epic golden hour god rays, masterpiece' },
    { title: 'Cyber Samurai', prompt: 'futuristic samurai warrior on skyscraper rooftop, neon megacity skyline below, katana glowing blue, rain and lightning, cyberpunk anime style, dramatic wide shot' },
    { title: 'Magic Academy Student', prompt: 'young witch student in ornate uniform, floating magical academy above clouds, spell circles glowing, epic fantasy sky, detailed illustration' },
    { title: 'Space Pilot', prompt: 'confident female space pilot in sleek mecha suit, cockpit view of massive nebula and distant planets, sci-fi anime aesthetic, cinematic scale' },
    { title: 'Forest Spirit', prompt: 'ethereal forest spirit with antlers, ancient giant trees and bioluminescent forest, mist and god rays, mystical epic atmosphere, fantasy anime art' },
    { title: 'Street Fashion Idol', prompt: 'trendy anime idol in colorful street fashion, towering neon Tokyo skyline at night, confident pose, epic urban scale, magazine cover quality' },
    { title: 'Dragon Rider', prompt: 'brave knight riding a majestic red dragon soaring above sea of clouds, epic mountain range below, wind in hair, cinematic IMAX wide shot' },
    { title: 'Live-Action Hero', prompt: 'photorealistic AI warrior on ancient temple ruins at dawn, vast misty mountains, dramatic rim light, cinematic live-action photography, hyperrealistic detail' },
    { title: 'Dark Vampire Lord', prompt: 'elegant vampire lord in towering gothic cathedral, crimson eyes, moonlight through stained glass, epic dark fantasy scale, dramatic shadows' },
    { title: 'Cosmic Rooftop', prompt: 'student on rooftop under aurora borealis and star-filled sky, sprawling city lights below, epic melancholic atmosphere, shoujo style' },
    { title: 'Mecha Battle', prompt: 'giant mecha in apocalyptic battlefield, massive explosions and burning skyline, dynamic action lines, epic mecha anime scale' },
    { title: 'Underwater Kingdom', prompt: 'anime mermaid with iridescent tail in vast underwater crystal kingdom, sun rays piercing deep ocean, epic aquatic fantasy scale' },
    { title: 'Ninja in Moonlight', prompt: 'stealthy ninja on ancient temple roof under full moon, cherry blossoms and mountain vista, epic Japanese landscape, cool blue tones' },
    { title: 'Music Concert', prompt: 'energetic anime rock singer on massive stadium stage, epic spotlight beams, sea of crowd lights, vibrant concert atmosphere' },
    { title: 'Winter Snow Princess', prompt: 'elegant ice princess in white gown, towering frozen palace and aurora sky, snowflakes swirling, sparkling crystals, ethereal epic beauty' },
    { title: 'Celestial Cat Guardian', prompt: 'mystical cat girl guardian on floating island above clouds, celestial palace in background, epic fantasy sky, kawaii yet grand scale' },
    { title: 'Post-Apocalypse Survivor', prompt: 'tough anime survivor overlooking vast wasteland ruins, crimson sunset horizon, epic desolate landscape, cinematic wide shot' },
    { title: 'Celestial Goddess', prompt: 'goddess floating among galaxies and cosmic nebula, flowing stellar dress, divine golden aura, epic space fantasy scale' },
    { title: 'Rival Sword Duel', prompt: 'two anime swordsmen clashing on crumbling cliff edge, storm clouds and lightning, epic duel atmosphere, action anime style' },
    { title: 'Epic Countryside', prompt: 'girl in sundress in endless lavender fields under dramatic sunset sky, windmill and mountains on horizon, Studio Ghibli epic scale, soft watercolor feel' }
  ];

  // Example gallery pool — random subset shown each visit
  const EXAMPLE_POOL = [
    { title: 'Cherry Blossom Girl', seed: 'anime-sakura' },
    { title: 'Cyber Samurai', seed: 'anime-cyber' },
    { title: 'Magic Academy', seed: 'anime-magic' },
    { title: 'Space Pilot', seed: 'anime-space' },
    { title: 'Forest Spirit', seed: 'anime-forest' },
    { title: 'Street Idol', seed: 'anime-idol' },
    { title: 'Dragon Rider', seed: 'anime-dragon' },
    { title: 'Cafe Scene', seed: 'anime-cafe' },
    { title: 'Vampire Lord', seed: 'anime-vampire' },
    { title: 'Rooftop Sunset', seed: 'anime-rooftop' },
    { title: 'Mecha Battle', seed: 'anime-mecha' },
    { title: 'Underwater Dream', seed: 'anime-mermaid' },
    { title: 'Moonlit Ninja', seed: 'anime-ninja' },
    { title: 'Concert Night', seed: 'anime-concert' },
    { title: 'Snow Princess', seed: 'anime-snow' },
    { title: 'Cat Girl Maid', seed: 'anime-catgirl' },
    { title: 'Wasteland Hero', seed: 'anime-wasteland' },
    { title: 'Cosmic Goddess', seed: 'anime-goddess' },
    { title: 'Sword Duel', seed: 'anime-duel' },
    { title: 'Countryside Walk', seed: 'anime-country' },
    { title: 'Neon City', seed: 'anime-neon' },
    { title: 'Fantasy Knight', seed: 'anime-knight' },
    { title: 'Shrine Maiden', seed: 'anime-shrine' },
    { title: 'Steampunk Girl', seed: 'anime-steam' }
  ];

  let galleryRotateTimer = null;
  let gallerySessionSeed = 0;

  // In-memory cache for full-res images (current session only)
  const sessionImages = new Map();

  // ---- State ----
  let selectedStyle = 'anime';
  let isGenerating = false;
  let progressTimer = null;
  let progressState = null;

  // ---- DOM References ----
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const els = {
    navToggle: $('#navToggle'),
    navLinks: $('#navLinks'),
    quotaBadge: $('#quotaBadge'),
    exampleGallery: $('#exampleGallery'),
    galleryTrack1: $('#galleryTrack1'),
    galleryTrack2: $('#galleryTrack2'),
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
    progressTotal: $('#progressTotal'),
    progressElapsed: $('#progressElapsed'),
    progressTime: $('#progressTime'),
    resultsPlaceholder: $('#resultsPlaceholder'),
    resultsSummary: $('#resultsSummary'),
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
    paymentQrLabel: $('#paymentQrLabel'),
    paymentModalQrLabel: $('#paymentModalQrLabel'),
    paymentAmount: $('#paymentAmount'),
    paymentNote: $('#paymentNote'),
    paymentContact: $('#paymentContact'),
    activationForm: $('#activationForm'),
    activationCode: $('#activationCode'),
    paymentFlow: $('#paymentFlow'),
    proActiveBanner: $('#proActiveBanner'),
    proExpiryText: $('#proExpiryText'),
    proPriceDisplay: $('#proPriceDisplay'),
    promptCharCount: $('#promptCharCount'),
    promptQuality: $('#promptQuality'),
    promptTips: $('#promptTips'),
    promptTipsList: $('#promptTipsList'),
    sizeHint: $('#sizeHint')
  };

  let currentPayTab = 'wechat';

  function resetGenerateUI() {
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
    initPromptHelpers();
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

    els.prompt?.addEventListener('input', updatePromptFeedback);
    els.size?.addEventListener('change', updateSizeHint);

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
    els.upgradeProBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      openPaymentPanel();
    });

    document.addEventListener('click', (e) => {
      const tab = e.target.closest('.payment-tab');
      if (!tab?.dataset.payTab) return;
      e.preventDefault();
      setPayTab(tab.dataset.payTab);
    });

    els.paymentModalClose?.addEventListener('click', closePaymentModal);
    els.paymentModal?.addEventListener('click', (e) => {
      if (e.target === els.paymentModal) closePaymentModal();
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

  // ---- Example Gallery (auto-scroll + random each visit) ----
  function getGallerySessionSeed() {
    let seed = sessionStorage.getItem('animeGen_gallerySeed');
    if (!seed) {
      seed = String(Date.now());
      sessionStorage.setItem('animeGen_gallerySeed', seed);
    }
    return seed;
  }

  function shuffleArray(arr) {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function pickExampleImages(count) {
    gallerySessionSeed = getGallerySessionSeed();
    const batch = Math.floor(Date.now() / 60000);
    return shuffleArray(EXAMPLE_POOL)
      .slice(0, count)
      .map((item, i) => ({
        src: `https://picsum.photos/seed/${item.seed}-${gallerySessionSeed}-${batch}-${i}/520/520`,
        alt: item.title,
        title: item.title
      }));
  }

  function galleryItemHtml(img) {
    return `
      <div class="gallery-item" data-src="${img.src}">
        <img src="${img.src}" alt="${escapeHtml(img.alt)}" loading="lazy">
        <div class="overlay"><span>${escapeHtml(img.title)}</span></div>
      </div>
    `;
  }

  function fillGalleryTrack(trackEl, images) {
    if (!trackEl) return;
    const doubled = [...images, ...images];
    trackEl.innerHTML = doubled.map(galleryItemHtml).join('');
  }

  function renderExampleGallery() {
    const row1 = pickExampleImages(8);
    const row2 = pickExampleImages(8);

    fillGalleryTrack(els.galleryTrack1, row1);
    fillGalleryTrack(els.galleryTrack2, row2);

    if (!els.exampleGallery._bound) {
      els.exampleGallery.addEventListener('click', (e) => {
        const item = e.target.closest('.gallery-item');
        if (!item) return;
        openLightbox(item.dataset.src);
      });
      els.exampleGallery._bound = true;
    }

    if (galleryRotateTimer) clearInterval(galleryRotateTimer);
    galleryRotateTimer = setInterval(refreshExampleGallery, 45000);
  }

  function refreshExampleGallery() {
    els.exampleGallery?.classList.add('gallery-refreshing');
    setTimeout(() => {
      renderExampleGalleryTracksOnly();
      els.exampleGallery?.classList.remove('gallery-refreshing');
    }, 400);
  }

  function renderExampleGalleryTracksOnly() {
    fillGalleryTrack(els.galleryTrack1, pickExampleImages(8));
    fillGalleryTrack(els.galleryTrack2, pickExampleImages(8));
  }

  // ---- Prompt Helpers ----
  function initPromptHelpers() {
    updatePromptFeedback();
    updateSizeHint();
  }

  function analyzePrompt(text) {
    const lower = text.toLowerCase();
    const hits = [];
    const misses = [];

    PROMPT_CHECKS.forEach((check) => {
      const found = check.patterns.test(lower);
      if (found) hits.push(check);
      else misses.push(check);
    });

    return { hits, misses, len: text.length };
  }

  function buildPromptTips(analysis) {
    const { hits, misses, len } = analysis;
    const items = [];

    if (len === 0) {
      return [
        'Start with <strong>character + epic background</strong> in one sentence — e.g. "silver-haired warrior on cliff edge, vast floating palace above clouds".',
        'Then layer in <strong>appearance</strong> (hair, eyes, outfit), <strong>lighting</strong> (golden hour, god rays), and <strong>camera</strong> (wide cinematic shot).',
        'Finish with quality tags: <strong>masterpiece, best quality, highly detailed, 8k wallpaper</strong>.',
        'English prompts work best. More specific detail = sharper 4K output.'
      ];
    }

    if (len < 40) {
      items.push('Your prompt is short — AI will guess missing details. Expand each layer below.');
    } else if (len < 100) {
      items.push('Good length so far — add the missing layers below for richer HD / 4K results.');
    } else if (hits.length >= 5) {
      items.push('✨ Strong, well-layered prompt — ready for high-detail generation.');
    } else {
      items.push('Solid length — polish the remaining layers for even better composition.');
    }

    misses.slice(0, 4).forEach((check) => {
      items.push(check.miss);
    });

    hits.slice(0, 3).forEach((check) => {
      items.push(`✓ ${check.ok}`);
    });

    if (len >= 120 && misses.length === 0) {
      items.push('Tip: Try Live-Action AI style for photorealistic cinematic results, or Anime for classic illustration.');
    }

    return items.slice(0, 6);
  }

  function updatePromptFeedback() {
    const text = els.prompt?.value.trim() || '';
    const len = text.length;
    const analysis = analyzePrompt(text);

    if (els.promptCharCount) {
      els.promptCharCount.textContent = `${len} / 2000`;
    }

    let quality = 'Add epic background details';
    let qualityClass = 'low';

    if (len === 0) {
      quality = 'Start writing your prompt';
    } else if (analysis.misses.length >= 5) {
      quality = `${analysis.hits.length}/7 layers — keep adding detail`;
      qualityClass = 'low';
    } else if (analysis.misses.length >= 2) {
      quality = `${analysis.hits.length}/7 layers — good progress`;
      qualityClass = 'mid';
    } else {
      quality = `${analysis.hits.length}/7 layers — excellent prompt`;
      qualityClass = 'high';
    }

    if (els.promptQuality) {
      els.promptQuality.textContent = quality;
      els.promptQuality.className = `prompt-quality ${qualityClass}`;
    }

    const tips = buildPromptTips(analysis);
    if (els.promptTipsList) {
      els.promptTipsList.innerHTML = tips.map((tip) => `<li>${tip}</li>`).join('');
    }
  }

  function updateSizeHint() {
    const size = els.size?.value || '1024x1024';
    const fast = getConfig().FAST_GENERATION !== false;
    const base = SIZE_HINTS[size] || '';
    if (els.sizeHint) {
      els.sizeHint.textContent = fast
        ? `${base} · Fast mode ON (~${getEstSecondsPerImage(size)}s per image)`
        : base;
    }
  }

  function getSizeLabel(size) {
    return SIZE_LABELS[size] || size;
  }

  function is4KSize(size) {
    return size === '3840x2160' || size === '2160x3840' || size === '2048x2048';
  }
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
      updatePromptFeedback();
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
    try {
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
    } catch (err) {
      console.error('Payment UI init failed:', err);
    }
  }

  function resolveAssetUrl(path) {
    if (!path) return '';
    if (/^(https?:|data:)/.test(path)) return path;
    return new URL(path, document.baseURI || window.location.href).href;
  }

  function getQrSources(tab) {
    const pay = getPaymentConfig();
    const embedded = typeof PAYMENT_QR !== 'undefined' ? PAYMENT_QR : null;

    if (tab === 'wechat') {
      return [embedded?.WECHAT, pay.WECHAT_QR, pay.WECHAT_QR_FALLBACK].filter(Boolean);
    }
    return [embedded?.ALIPAY, pay.ALIPAY_QR, pay.ALIPAY_QR_FALLBACK].filter(Boolean);
  }

  function setPayTab(tab) {
    if (tab !== 'wechat' && tab !== 'alipay') return;
    currentPayTab = tab;

    document.querySelectorAll('.payment-tab').forEach((t) => {
      t.classList.toggle('active', t.dataset.payTab === tab);
    });

    const label = tab === 'wechat' ? 'WeChat Pay' : 'Alipay';
    const version = getPaymentConfig().QR_VERSION || '1';

    if (els.paymentQrLabel) els.paymentQrLabel.textContent = label;
    if (els.paymentModalQrLabel) els.paymentModalQrLabel.textContent = label;

    const sources = getQrSources(tab);
    [els.paymentQrImage, els.paymentModalQr].forEach((img) => {
      if (img) setQrImage(img, sources, `${version}-${tab}`, label);
    });
  }

  function setQrImage(imgEl, sources, version, label) {
    if (!imgEl || !sources.length) return;

    let index = 0;

    const tryLoad = () => {
      if (index >= sources.length) {
        imgEl.alt = `${label} — image not found`;
        return;
      }

      const path = sources[index++];
      const url = path.startsWith('data:')
        ? path
        : `${resolveAssetUrl(path)}${path.includes('?') ? '&' : '?'}v=${version}`;

      imgEl.onload = () => {
        imgEl.style.opacity = '1';
        imgEl.alt = `${label} QR code`;
      };
      imgEl.onerror = tryLoad;
      imgEl.style.opacity = '1';
      imgEl.src = url;
    };

    tryLoad();
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

  /** Jump to payment section and open pay modal */
  function openPaymentPanel() {
    if (isProUser()) {
      showToast('You already have Pro activated!', 'info');
      return;
    }

    closeProModal();

    const section = document.getElementById('paymentSection');
    if (section) {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
      section.classList.add('payment-highlight');
      setTimeout(() => section.classList.remove('payment-highlight'), 2000);
    }

    setPayTab(currentPayTab || 'wechat');

    if (els.paymentModal) {
      els.paymentModal.classList.add('open');
      document.body.style.overflow = 'hidden';
    }

    if (location.hash !== '#pricing') {
      history.pushState(null, '', '#pricing');
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
          displayResults(fullImages, item.prompt, item.size);
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
    if (els.resultsSummary) {
      els.resultsSummary.style.display = 'none';
      els.resultsSummary.innerHTML = '';
    }

    const fullPrompt = buildGenerationPrompt(prompt, size);
    const apiSize = getApiSize(size);
    const estPerImage = getEstSecondsPerImage(size);
    const totalEst = count * estPerImage;

    startProgressTimer(count, totalEst);
    setProgressStatus('Sending request to AI model...');

    const genStartMs = Date.now();

    try {
      const images = await callSeedreamAPI(fullPrompt, apiSize, count, (done, status) => {
        setProgressDone(done);
        setProgressStatus(status);
      });

      const totalSec = Math.floor((Date.now() - genStartMs) / 1000);

      if (!isProUser()) {
        consumeQuota(images.length);
      }

      finishProgress(totalSec);
      displayResults(images, prompt, size, totalSec);

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

      showToast(`Done in ${totalSec}s — ${count} image(s) generated!`, 'success');
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

    onProgress?.(0, 'Waiting for AI response...');

    const data = await response.json();
    onProgress?.(0, 'Downloading image data...');

    const images = await parseSeedreamImages(data);

    onProgress?.(images.length, 'Rendering complete');

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
  function displayResults(images, prompt, size, totalSec) {
    const sizeLabel = getSizeLabel(size || els.size?.value || '');
    els.resultsPlaceholder.style.display = 'none';

    if (els.resultsSummary) {
      if (typeof totalSec === 'number' && totalSec >= 0) {
        els.resultsSummary.style.display = 'flex';
        els.resultsSummary.innerHTML = `
          <span class="results-summary-label">✓ Generation complete</span>
          <span class="results-summary-time">Total generation time: <strong>${totalSec}s</strong></span>
        `;
      } else {
        els.resultsSummary.style.display = 'none';
        els.resultsSummary.innerHTML = '';
      }
    }

    els.resultsGrid.style.display = 'grid';
    els.resultsGrid.innerHTML = images
      .map(
        (src, i) => `
        <div class="result-card">
          <div class="result-img-wrap">
            <span class="hd-badge">${escapeHtml(sizeLabel)}</span>
            <img src="${src}" alt="Generated anime art ${i + 1}" class="result-hd-img" data-full="${src}">
          </div>
          <div class="result-actions">
            <button type="button" class="btn btn-sm btn-primary" data-download="${i}">⬇ Download ${escapeHtml(sizeLabel)}</button>
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
    els.resultsGrid._sizeLabel = sizeLabel;

    els.resultsGrid.querySelectorAll('.result-hd-img').forEach((img) => {
      img.addEventListener('click', () => openLightbox(img.dataset.full || img.src));
    });

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

  // ---- Progress UI (fixed total — no jumping estimates) ----
  function startProgressTimer(imageCount, estimatedTotalSec) {
    const totalSec = Math.max(1, estimatedTotalSec);
    progressState = {
      startMs: Date.now(),
      imageCount,
      done: 0,
      totalSec,
      lastElapsed: -1,
      lastRemaining: -1
    };
    els.progressBar.style.width = '0%';
    if (els.progressTotal) {
      els.progressTotal.textContent = `Total: ${totalSec}s`;
    }
    tickProgressClock();
    if (progressTimer) clearInterval(progressTimer);
    progressTimer = setInterval(tickProgressClock, 1000);
  }

  function setProgressDone(done) {
    if (!progressState) return;
    progressState.done = done;
    tickProgressClock();
  }

  function setProgressStatus(text) {
    if (els.progressStatus) els.progressStatus.textContent = text;
  }

  function tickProgressClock() {
    if (!progressState) return;

    const { startMs, imageCount, done, totalSec } = progressState;
    const elapsed = Math.floor((Date.now() - startMs) / 1000);
    const remaining = Math.max(0, totalSec - elapsed);
    const progressPct = done >= imageCount
      ? 100
      : Math.min(99, (Math.min(elapsed, totalSec) / totalSec) * 100);

    if (els.progressBar) {
      els.progressBar.style.width = `${Math.round(progressPct)}%`;
    }

    if (elapsed !== progressState.lastElapsed || remaining !== progressState.lastRemaining) {
      progressState.lastElapsed = elapsed;
      progressState.lastRemaining = remaining;

      if (els.progressElapsed) {
        if (remaining > 0) {
          els.progressElapsed.textContent = `${elapsed}s elapsed · ${remaining}s remaining`;
        } else if (done >= imageCount) {
          els.progressElapsed.textContent = `${elapsed}s elapsed · finishing...`;
        } else {
          els.progressElapsed.textContent = `${elapsed}s elapsed · almost done...`;
        }
      }
    }
  }

  function finishProgress(totalSec) {
    if (progressTimer) {
      clearInterval(progressTimer);
      progressTimer = null;
    }
    if (els.progressBar) els.progressBar.style.width = '100%';
    if (els.progressStatus) els.progressStatus.textContent = 'Complete!';
    if (els.progressTotal) els.progressTotal.textContent = `Total: ${totalSec}s`;
    if (els.progressElapsed) {
      els.progressElapsed.textContent = `${totalSec}s elapsed · 0s remaining`;
    }
    progressState = null;
  }

  function stopProgress() {
    if (progressTimer) {
      clearInterval(progressTimer);
      progressTimer = null;
    }
    progressState = null;
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
