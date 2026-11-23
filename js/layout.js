// ============================================================================
// SurveyCoins — shared layout (header / nav / footer / sticky ad banner)
// Injected into every page via <div id="site-header"> and <div id="site-footer">.
// The sticky bottom banner is an AD SLOT ONLY — it never appears inside the
// offerwall, task flow, or withdrawal flow (ads stay separate from rewards).
// ============================================================================

const Layout = (() => {
  const NAV = [
    { href: 'dashboard.html', label: 'Earn' },
    { href: 'surveys.html', label: 'Surveys' },
    { href: 'games.html', label: 'Games' },
    { href: 'trials.html', label: 'Trials' },
    { href: 'videos.html', label: 'Videos' },
    { href: 'music.html', label: 'Music' },
    { href: 'cashback.html', label: 'Cashback' },
    { href: 'withdraw.html', label: 'Withdraw' },
    { href: 'referral.html', label: 'Referral' },
    { href: 'proofs.html', label: 'Payout proofs' },
  ];

  function currentPage() {
    const p = location.pathname.split('/').pop() || 'index.html';
    return p;
  }

  function headerHTML(balance) {
    const page = currentPage();
    const links = NAV.map(n => {
      const active = page === n.href ? 'bg-white/25 text-white font-bold' : 'text-white/85 hover:text-white hover:bg-white/10';
      return `<a href="${n.href}" class="${active} px-2.5 py-1.5 rounded-full text-sm whitespace-nowrap transition">${n.label}</a>`;
    }).join('');
    const signedIn = balance && balance.connected && !balance.needsAuth;
    const balanceChip = signedIn
      ? `<a href="withdraw.html" class="coin-chip text-sm" title="Your balance — 1,000 coins = $1">
           <span class="coin-bob">🪙</span><span>${balance.coins.toLocaleString()} coins</span>
           <span class="text-xs font-bold opacity-80">($${balance.usd.toFixed(2)})</span>
         </a>`
      : `<a href="auth.html" class="btn-sunny text-sm px-4 py-1.5">Join free 🎉</a>`;
    const signOutBtn = signedIn
      ? `<button id="signout-btn" class="text-white/85 hover:text-white text-sm font-bold px-2 py-1.5" title="Sign out">Sign out</button>`
      : '';
    return `
    <header class="sticky top-0 z-40 shadow-lg" style="background: linear-gradient(90deg,#0f766e,#0d9488 55%,#059669)">
      <div class="max-w-6xl mx-auto px-4 py-3 flex items-center gap-4">
        <a href="index.html" class="flex items-center gap-2 shrink-0">
          <span class="text-2xl coin-bob">📋</span>
          <span class="font-black text-lg tracking-tight text-white">Survey<span class="text-amber-300">Coins</span></span>
        </a>
        <nav class="hidden lg:flex items-center gap-1 overflow-x-auto">${links}</nav>
        <div class="ml-auto flex items-center gap-2">
          ${balanceChip}
          ${signOutBtn}
          <button id="mobile-nav-btn" class="lg:hidden text-2xl px-2 text-white" aria-label="Menu">☰</button>
        </div>
      </div>
      <nav id="mobile-nav" class="hidden lg:hidden px-4 pb-3 flex flex-wrap gap-1" style="background:rgba(0,0,0,.15)">${links}</nav>
    </header>`;
  }

  function footerHTML() {
    return `
    <footer class="mt-12 text-teal-100" style="background: linear-gradient(180deg,#134e4a,#042f2e)">
      <div class="max-w-6xl mx-auto px-4 py-8 grid gap-6 md:grid-cols-4 text-sm">
        <div>
          <div class="text-white font-bold mb-2">🪙 SurveyCoins</div>
          <p>Answer surveys, play games and try apps — earn coins and cash out real money. 1,000 coins = $1. 18+ only.</p>
        </div>
        <div>
          <div class="text-white font-bold mb-2">Earn</div>
          <a class="block hover:text-white py-0.5" href="surveys.html">Paid surveys</a>
          <a class="block hover:text-white py-0.5" href="games.html">Play games</a>
          <a class="block hover:text-white py-0.5" href="trials.html">Free trials</a>
          <a class="block hover:text-white py-0.5" href="cashback.html">Cashback shopping</a>
        </div>
        <div>
          <div class="text-white font-bold mb-2">Account</div>
          <a class="block hover:text-white py-0.5" href="dashboard.html">Dashboard</a>
          <a class="block hover:text-white py-0.5" href="withdraw.html">Withdraw</a>
          <a class="block hover:text-white py-0.5" href="referral.html">Refer friends</a>
          <a class="block hover:text-white py-0.5" href="proofs.html">Payout proofs</a>
        </div>
        <div>
          <div class="text-white font-bold mb-2">Legal</div>
          <a class="block hover:text-white py-0.5" href="terms.html">Terms of Service</a>
          <a class="block hover:text-white py-0.5" href="privacy.html">Privacy Policy</a>
          <a class="block hover:text-white py-0.5" href="disclosure.html">Affiliate Disclosure</a>
          <a class="block hover:text-white py-0.5" href="about.html">About &amp; Contact</a>
        </div>
      </div>
      <div class="border-t border-slate-800">
        <div class="max-w-6xl mx-auto px-4 py-4 text-xs">
          SurveyCoins is a rewards platform. Earnings depend on completed offers and vary by user and location — we never promise a fixed income. Advertisers pay us; we share 60% with you. Some links are affiliate links — see the Affiliate Disclosure. Must be 18 or older. © 2026 SurveyCoins (playgamesearnmoney.com).
        </div>
      </div>
    </footer>
    <!-- Sticky bottom ad banner slot (display ads only; never inside reward flows) -->
    <div id="sticky-ad" class="fixed bottom-0 left-0 right-0 z-30 hidden">
      <div class="max-w-6xl mx-auto px-2 pb-2">
        <div class="relative bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden">
          <button id="sticky-ad-close" class="absolute top-1 right-2 text-slate-400 text-xs z-10" aria-label="Close ad">✕</button>
          <div data-ad-slot="sticky" class="min-h-[50px] flex items-center justify-center text-xs text-slate-400">Advertisement</div>
        </div>
      </div>
    </div>`;
  }

  function testBannerHTML() {
    return `<div class="bg-red-600 text-white text-center text-sm font-bold py-2 px-4">LOCAL TEST MODE — no real coins, no real payouts. Add ?localtest=1 only for testing.</div>`;
  }

  function loadingHeaderHTML() {
    // Neutral loading state: never show the logged-out "Join free" button
    // (or a balance) before the session is known — that was the flicker.
    return `
    <header class="sticky top-0 z-40 shadow-lg" style="background: linear-gradient(90deg,#0f766e,#0d9488 55%,#059669)">
      <div class="max-w-6xl mx-auto px-4 py-3 flex items-center gap-4">
        <a href="index.html" class="flex items-center gap-2 shrink-0">
          <span class="text-2xl coin-bob">📋</span>
          <span class="font-black text-lg tracking-tight text-white">Survey<span class="text-amber-300">Coins</span></span>
        </a>
        <div class="ml-auto flex items-center gap-2">
          <span class="text-white/70 text-sm px-4 py-1.5">…</span>
        </div>
      </div>
    </header>`;
  }

  async function renderHeader() {
    const headerEl = document.getElementById('site-header');
    if (!headerEl) return;
    let balance = null;
    try {
      if (Backend.connected()) balance = await Backend.getBalance();
    } catch (e) { /* backend unavailable — header keeps the loading state */ }
    headerEl.innerHTML = headerHTML(balance);
    bindHeaderButtons();
  }

  function bindHeaderButtons() {
    const btn = document.getElementById('mobile-nav-btn');
    const nav = document.getElementById('mobile-nav');
    if (btn && nav) btn.addEventListener('click', () => nav.classList.toggle('hidden'));
    const signOut = document.getElementById('signout-btn');
    if (signOut) signOut.addEventListener('click', async () => { await Backend.signOut(); location.reload(); });
  }

  async function init() {
    const headerEl = document.getElementById('site-header');
    const footerEl = document.getElementById('site-footer');
    const st = Backend.init();
    if (st.localTest && headerEl) headerEl.insertAdjacentHTML('beforebegin', testBannerHTML());
    // Safety net: if the session check hangs, show guest content after 6s
    // instead of leaving auth-gated content hidden forever.
    setTimeout(() => document.body.classList.add('auth-ready'), 6000);
    // Loading header first (no wrong logged-out state), real header once
    // the session is known.
    if (headerEl) headerEl.innerHTML = loadingHeaderHTML();
    if (footerEl) footerEl.innerHTML = footerHTML();
    await renderHeader();
    // Round-2 FOUC fix: reveal auth-dependent content ONLY once the
    // session is known — the header already resolved it above via
    // getBalance(), so this just marks the body for the page content.
    const u = await Backend.getUser().catch(() => null);
    document.body.classList.add('auth-ready');
    document.body.classList.toggle('auth-logged-in', !!u);
    // Re-render when the auth state settles/changes (covers a session that
    // restores a moment after the first render).
    Backend.onAuthChange(async () => {
      renderHeader();
      const u2 = await Backend.getUser().catch(() => null);
      document.body.classList.add('auth-ready');
      document.body.classList.toggle('auth-logged-in', !!u2);
    });
    const closeBtn = document.getElementById('sticky-ad-close');
    if (closeBtn) closeBtn.addEventListener('click', () => document.getElementById('sticky-ad').classList.add('hidden'));
  }

  return { init };
})();

window.Layout = Layout;
