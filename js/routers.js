// ============================================================================
// SurveyCoins — extra survey routers (CPX Research + TheoremReach)
// Survey-led site: these two routers sit ALONGSIDE the offerwalls so users
// always have surveys available. Coins credit via the same server postback.
// ============================================================================

const Routers = (() => {
  const cfg = window.SITE_CONFIG;

  function pendingCard(title, body) {
    return `<div class="border border-dashed border-slate-300 rounded-xl p-6 text-center bg-slate-50">
      <div class="text-2xl mb-2">📋</div>
      <div class="font-bold text-slate-700">${title}</div>
      <p class="text-sm text-slate-500 mt-1">${body}</p>
    </div>`;
  }

  async function mountCPX(containerId) {
    const el = document.getElementById(containerId);
    if (!el) return;
    const url = cfg.routers.cpx.iframeUrl;
    if (!url) {
      el.innerHTML = pendingCard('CPX Research — connecting soon',
        'Extra paid surveys from CPX Research will appear here once the router account is created. Typical surveys pay $0.30–$3 each.');
      return;
    }
    const uid = await Backend.getOfferwallUserId();
    const src = url + (url.includes('?') ? '&' : '?') + 'ext_user_id=' + encodeURIComponent(uid || 'guest');
    el.innerHTML = `<iframe src="${src}" class="w-full rounded-xl border border-slate-200 bg-white" style="height:640px" title="CPX Research surveys" loading="lazy"></iframe>`;
  }

  async function mountTheoremReach(containerId) {
    const el = document.getElementById(containerId);
    if (!el) return;
    const url = cfg.routers.theoremReach.iframeUrl;
    if (!url) {
      el.innerHTML = pendingCard('TheoremReach — connecting soon',
        'Extra paid surveys from TheoremReach will appear here once the router account is created.');
      return;
    }
    const uid = await Backend.getOfferwallUserId();
    const src = url + (url.includes('?') ? '&' : '?') + 'user_id=' + encodeURIComponent(uid || 'guest');
    el.innerHTML = `<iframe src="${src}" class="w-full rounded-xl border border-slate-200 bg-white" style="height:640px" title="TheoremReach surveys" loading="lazy"></iframe>`;
  }

  return { mountCPX, mountTheoremReach };
})();

window.Routers = Routers;
