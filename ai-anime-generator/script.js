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
    PRO: 'animeGen_isPro'
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
    toastContainer: $('#toastContainer')
  };

  // ---- Initialization ----
  function init() {
    renderExampleGallery();
    renderTemplates();
    bindEvents();
    updateQuotaBadge();
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

    // Pro modal
    els.proModalClose.addEventListener('click', closeProModal);
    els.proModalDismiss.addEventListener('click', closeProModal);
    els.proModalPricing.addEventListener('click', closeProModal);
    els.upgradeProBtn.addEventListener('click', () => {
      showToast('Pro upgrade is a demo feature. Set isPro in console: localStorage.setItem("animeGen_isPro","true")', 'info');
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

  function isProUser() {
    return localStorage.getItem(STORAGE.PRO) === 'true';
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
    const limit = CONFIG.DAILY_FREE_LIMIT || 5;
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
      els.quotaBadge.textContent = 'Pro — Unlimited';
      return;
    }
    const limit = CONFIG.DAILY_FREE_LIMIT || 5;
    const remaining = getRemainingQuota();
    els.quotaBadge.textContent = `${remaining} / ${limit} free today`;
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
    const max = CONFIG.MAX_HISTORY_ITEMS || 50;
    const trimmed = history.slice(0, max);
    localStorage.setItem(STORAGE.HISTORY, JSON.stringify(trimmed));
  }

  function addToHistory(record) {
    const history = getHistory();
    history.unshift(record);
    saveHistory(history);
    renderHistory();
  }

  function deleteHistoryItem(id) {
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
        const thumb = item.images[0] || '';
        const date = new Date(item.timestamp).toLocaleString();
        return `
          <article class="history-item" data-id="${item.id}">
            <img class="history-thumb" src="${thumb}" alt="Generated thumbnail">
            <div class="history-meta">
              <h4>${escapeHtml(truncate(item.prompt, 80))}</h4>
              <p>${item.style} · ${item.size} · ${item.images.length} image(s) · ${date}</p>
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
          els.count.value = String(Math.min(item.images.length, 4));
          location.hash = 'generator';
          showToast('Settings restored. Click Generate to recreate.', 'info');
        } else if (action === 'view') {
          displayResults(item.images, item.prompt);
          location.hash = 'generator';
        }
      });
    });
  }

  // ---- Image Generation ----
  async function handleGenerate() {
    if (isGenerating) return;

    const prompt = els.prompt.value.trim();
    if (!prompt) {
      showToast('Please enter a prompt in English.', 'error');
      return;
    }

    const count = parseInt(els.count.value, 10);
    const size = els.size.value;

    if (!CONFIG.API_KEY || CONFIG.API_KEY.includes('YOUR_API_KEY')) {
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
    const totalEst = count * (CONFIG.EST_SECONDS_PER_IMAGE || 15);

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

      addToHistory({
        id: generateId(),
        prompt,
        style: selectedStyle,
        size,
        images,
        timestamp: Date.now()
      });

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
    const key = CONFIG.API_KEY.trim();
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
    const payload = {
      model: CONFIG.MODEL_ID,
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
      response = await fetch(CONFIG.API_URL, {
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
