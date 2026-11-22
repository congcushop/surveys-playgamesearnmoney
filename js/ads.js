// ============================================================================
// SurveyCoins — ad network loader (ALL 11 networks, SAFE FORMATS ONLY)
// - Loads a network ONLY when its ID/tag URL is filled in js/config.js.
// - Safe formats only: banners, native, in-text, in-page push.
//   NO popunders (PopAds is popunder-only and is NOT installed — see config).
// - NEVER reward users for viewing/clicking ads. Ads live ONLY in [data-ad-slot]
//   containers and page-level in-text / in-page-push — never inside the
//   offerwall iframe area, task flow, or withdrawal flow.
// - Only ONE in-page-push provider is active at a time (config.ads
//   .inPagePushProvider) — multiple push scripts would stack notifications
//   on the user. Other networks' IPP code stays disabled behind that flag.
// - Unconfigured networks leave a clearly-marked placeholder slot so the
//   layout stays intact and the integration status is visible.
// ============================================================================

const Ads = (() => {
  const cfg = window.SITE_CONFIG;
  const loaded = [];

  function loadScript(src, attrs = {}) {
    return new Promise((resolve) => {
      const s = document.createElement('script');
      s.src = src; s.async = true;
      Object.entries(attrs).forEach(([k, v]) => s.setAttribute(k, v));
      s.onload = () => resolve(true);
      s.onerror = () => resolve(false);
      document.head.appendChild(s);
    });
  }

  function markSlot(slotEl, network, label) {
    if (!slotEl) return;
    slotEl.setAttribute('data-network', network);
    slotEl.innerHTML = `<div class="text-xs text-slate-400 border border-dashed border-slate-300 rounded p-3 text-center">
      Advertisement · ${label} — configure ID in js/config.js to activate</div>`;
  }

  function fillSlots(selector, network, render) {
    document.querySelectorAll(selector).forEach((el) => {
      if (el.dataset.filled) return;
      el.dataset.filled = '1';
      render(el);
    });
  }

  async function initInfolinks() {
    const c = cfg.ads.infolinks;
    if (!c.pid || !c.wsid) return;
    window.infolinks_pid = c.pid;
    window.infolinks_wsid = c.wsid;
    const ok = await loadScript('https://resources.infolinks.com/js/infolinks_main.js');
    if (ok) loaded.push('Infolinks (in-text + in-fold)');
  }

  async function initMonetagIPP() {
    if (cfg.ads.inPagePushProvider !== 'monetag') return;
    const c = cfg.ads.monetag;
    if (!c.tagUrl) return;
    // MultiTag must be configured in the Monetag dashboard for IN-PAGE PUSH
    // ONLY — popunder, classic push and SmartLink stay OFF.
    const ok = await loadScript(c.tagUrl);
    if (ok) loaded.push('Monetag (in-page push only)');
  }

  async function initMediaNet() {
    const c = cfg.ads.medianet;
    if (!c.cid) return;
    const ok = await loadScript(`https://contextual.media.net/dmedianet.js?cid=${encodeURIComponent(c.cid)}`);
    if (ok) {
      loaded.push('Media.net (contextual display)');
      fillSlots('[data-ad-slot="incontent"]', 'medianet', (el) => {
        el.innerHTML = '<div id="medianet_units"></div>';
      });
    }
  }

  // Generic banner/native loader: tag URL comes from the network dashboard.
  async function initTagNetwork(key, label, slotSelector) {
    const c = cfg.ads[key];
    if (!c) return;
    const tagUrl = c.bannerTagUrl || c.nativeTagUrl;
    if (!tagUrl) return;
    const ok = await loadScript(tagUrl);
    if (ok) {
      loaded.push(`${label} (banner/native)`);
      fillSlots(slotSelector, key, (el) => {
        el.innerHTML = `<div class="ad-unit" data-network="${key}"></div>`;
      });
    }
  }

  function markEmptySlots() {
    // Any slot still empty gets an honest placeholder (no fake ads).
    document.querySelectorAll('[data-ad-slot]').forEach((el) => {
      if (!el.dataset.filled && !el.innerHTML.trim()) {
        el.innerHTML = '<div class="text-xs text-slate-400 border border-dashed border-slate-300 rounded p-3 text-center">Advertisement</div>';
      }
    });
  }

  async function init() {
    try {
      await initInfolinks();
      await initMonetagIPP();
      await initMediaNet();
      // Banner/native networks — each fills its assigned slot when configured.
      await initTagNetwork('adsterra', 'Adsterra', '[data-ad-slot="sidebar"]');
      await initTagNetwork('mondiad', 'Mondiad', '[data-ad-slot="sidebar"]');
      await initTagNetwork('adcash', 'Adcash', '[data-ad-slot="sticky"]');
      await initTagNetwork('hilltopads', 'HilltopAds', '[data-ad-slot="sidebar2"]');
      await initTagNetwork('clickadu', 'Clickadu', '[data-ad-slot="sidebar2"]');
      await initTagNetwork('richads', 'RichAds', '[data-ad-slot="footer"]');
      await initTagNetwork('evadav', 'Evadav', '[data-ad-slot="footer"]');
      markEmptySlots();
      // Show the sticky banner only when a real tag loaded into it.
      const sticky = document.getElementById('sticky-ad');
      const stickySlot = document.querySelector('[data-ad-slot="sticky"]');
      if (sticky && stickySlot && stickySlot.querySelector('.ad-unit')) sticky.classList.remove('hidden');
      window.__adsLoaded = loaded;
      if (window.console) console.log('[Ads] loaded:', loaded.length ? loaded.join(', ') : 'none configured yet');
    } catch (e) {
      if (window.console) console.warn('[Ads] init error', e);
    }
  }

  return { init, loaded: () => loaded.slice() };
})();

window.Ads = Ads;
