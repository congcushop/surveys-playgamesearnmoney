// ============================================================================
// SurveyCoins — offerwall embeds (Offerwall.GG + AdGem, SHARED with sites #1/#3)
// - One account per network for all 3 sites — do NOT create per-site accounts.
// - The wall runs inside an iframe; the user's coins are credited ONLY by the
//   server-side postback Edge Function (HMAC verified). Never trust the client.
// - The iframe area is a REWARD zone: no display ads are ever rendered inside
//   or around it (see ads.js separation rule).
// ============================================================================

const Offerwall = (() => {
  const cfg = window.SITE_CONFIG;

  function pendingCard(title, body) {
    return `<div class="border border-dashed border-slate-300 rounded-xl p-6 text-center bg-slate-50">
      <div class="text-2xl mb-2">🔌</div>
      <div class="font-bold text-slate-700">${title}</div>
      <p class="text-sm text-slate-500 mt-1">${body}</p>
    </div>`;
  }

  async function mountGG(containerId) {
    const el = document.getElementById(containerId);
    if (!el) return;
    const url = cfg.offerwalls.offerwallGG.iframeUrl;
    if (!url) {
      el.innerHTML = pendingCard('Offerwall.GG — connecting soon',
        'The full offer wall (surveys, games, trials, apps) will appear here once the Offerwall.GG placement is created. Your coins are credited automatically when an offer completes.');
      return;
    }
    const uid = await Backend.getOfferwallUserId();
    const src = url + (url.includes('?') ? '&' : '?') + 'subid=' + encodeURIComponent(uid || 'guest');
    el.innerHTML = `<iframe src="${src}" class="w-full rounded-xl border border-slate-200 bg-white" style="height:720px" title="Offerwall" loading="lazy"></iframe>`;
  }

  async function mountAdGem(containerId) {
    const el = document.getElementById(containerId);
    if (!el) return;
    const url = cfg.offerwalls.adgem.iframeUrl;
    if (!url) {
      el.innerHTML = pendingCard('AdGem wall — connecting soon',
        'A second offer wall with extra surveys, games and trials will appear here once the AdGem Property is approved.');
      return;
    }
    const uid = await Backend.getOfferwallUserId();
    const src = url + (url.includes('?') ? '&' : '?') + 'player_id=' + encodeURIComponent(uid || 'guest');
    el.innerHTML = `<iframe src="${src}" class="w-full rounded-xl border border-slate-200 bg-white" style="height:720px" title="AdGem offerwall" loading="lazy"></iframe>`;
  }

  return { mountGG, mountAdGem };
})();

window.Offerwall = Offerwall;
