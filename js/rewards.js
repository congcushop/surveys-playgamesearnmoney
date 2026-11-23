// ============================================================================
// SurveyCoins — rewards helpers: daily check-in, streaks, levels, referral
// ============================================================================

const Rewards = (() => {
  const cfg = window.SITE_CONFIG;

  function fmtCoins(coins) { return Number(coins || 0).toLocaleString(); }
  function fmtUsd(coins) { return '$' + (coins / cfg.coinsPerDollar).toFixed(2); }

  async function renderBalance(selector) {
    const el = document.querySelector(selector);
    if (!el) return;
    // Balance renders on dark hero gradients (dashboard / withdraw) AND on
    // white .card panels (surveys, games, trials, videos, music, cashback) —
    // pick text colors that are readable on the actual background.
    const onLight = el.classList.contains('card') || !!el.closest('.card');
    const big = onLight ? 'text-slate-900' : 'text-white';
    const sub = onLight ? 'text-slate-600' : 'text-white/90';
    const faint = onLight ? 'text-slate-500' : 'text-white/80';
    // Loading state first: the card must never sit empty while the query
    // runs (that was reported as "no number" in the E2E test).
    if (!el.dataset.loaded) el.innerHTML = `<div class="text-3xl font-extrabold ${big}">🪙 … <span class="text-lg ${faint} font-bold">coins</span></div>`;
    const bal = await Backend.getBalance();
    if (!bal.connected) {
      el.innerHTML = `<div class="text-sm ${sub}">Balance connects once the backend is live. <a class="underline" href="auth.html">Create your free account</a> to start earning.</div>`;
      return;
    }
    if (bal.error) {
      // A failed balance query must be VISIBLE, not a silent empty card.
      el.innerHTML = `<div class="text-3xl font-extrabold ${big}">🪙 0 <span class="text-lg ${faint} font-bold">coins</span></div>
      <div class="text-sm font-bold ${sub} mt-1">Balance could not be loaded — please reload the page. (${bal.error})</div>`;
      return;
    }
    el.dataset.loaded = '1';
    const lvl = await Backend.getLevelInfo();
    el.innerHTML = `
      <div class="text-3xl font-extrabold ${big}">🪙 ${fmtCoins(bal.coins)} <span class="text-lg ${faint} font-bold">coins</span></div>
      <div class="font-bold ${sub}">= ${fmtUsd(bal.coins)} · Level ${lvl.current.level} ${lvl.current.name} · max $${lvl.current.maxWithdrawUsd} per withdrawal</div>
      ${lvl.next ? `<div class="text-sm font-bold ${faint} mt-1">Earn $${((lvl.next.minCoinsEarned - lvl.lifetimeCoins) / cfg.coinsPerDollar).toFixed(2)} more to reach Level ${lvl.next.level} ($${lvl.next.maxWithdrawUsd} per withdrawal).</div>` : `<div class="text-sm font-bold ${faint} mt-1">Top level reached — max $${lvl.current.maxWithdrawUsd} per withdrawal.</div>`}`;
  }

  async function renderTransactions(selector, limit = 10) {
    const el = document.querySelector(selector);
    if (!el) return;
    const tx = await Backend.getTransactions(limit);
    if (!tx.connected) {
      el.innerHTML = '<p class="text-sm text-slate-500">Your earning history will show here once the backend is live.</p>';
      return;
    }
    if (!tx.rows.length) {
      el.innerHTML = '<p class="text-sm text-slate-500">No earnings yet — complete your first survey or offer and it will show up here.</p>';
      return;
    }
    // Canonical ledger columns: source + meta.offer (no label/type columns).
    const labelFor = (r) => {
      const offer = r.meta && r.meta.offer ? `: ${r.meta.offer}` : '';
      switch (r.source) {
        case 'offerwall_gg': return 'Offerwall offer' + offer;
        case 'adgem': return 'AdGem offer' + offer;
        case 'cpx': return 'CPX survey' + offer;
        case 'theoremreach': return 'TheoremReach survey' + offer;
        case 'checkin': return 'Daily check-in';
        case 'signup_bonus': return 'Signup bonus';
        case 'referral': return 'Referral earnings';
        case 'cashback': return 'Cashback';
        case 'rewarded_video': return 'Rewarded video';
        case 'music': return 'Music session';
        case 'withdrawal': return 'Withdrawal';
        default: return r.source || 'Transaction';
      }
    };
    el.innerHTML = tx.rows.map(r => {
      const sign = r.amount_coins >= 0 ? '+' : '';
      const date = new Date(r.created_at).toLocaleDateString();
      return `<div class="flex justify-between py-2 border-b border-slate-100 text-sm">
        <span>${labelFor(r)} <span class="text-slate-400">· ${date}</span></span>
        <span class="font-semibold ${r.amount_coins >= 0 ? 'text-green-600' : 'text-red-500'}">${sign}${fmtCoins(r.amount_coins)}</span>
      </div>`;
    }).join('');
  }

  function bindCheckin(buttonId, resultId) {
    const btn = document.getElementById(buttonId);
    if (!btn) return;
    // Grey the button out on load when today is already claimed, so the
    // page never shows a live "Check in" button next to a done message.
    Backend.checkinStatus().then((st) => {
      if (st.done) {
        btn.disabled = true;
        btn.textContent = `Checked in ✓ +${st.coins} coins`;
        const out = document.getElementById(resultId);
        if (out) out.textContent = 'Already checked in today — come back tomorrow!';
      }
    }).catch(() => {});
    btn.addEventListener('click', async () => {
      btn.disabled = true;
      const res = await Backend.checkin();
      const out = document.getElementById(resultId);
      if (out) {
        out.textContent = res.ok
          ? `+${res.coins} coins — see you tomorrow for your streak!`
          : (res.error || 'Check-in failed. Please try again.');
      }
      if (res.ok) {
        btn.textContent = `Checked in ✓ +${res.coins} coins`;
        await renderBalance('[data-balance]');
      } else {
        btn.disabled = false;
      }
    });
  }

  async function renderReferral() {
    const info = await Backend.getReferralInfo();
    const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    set('ref-link', info.link || 'Sign in to get your referral link.');
    set('ref-code', info.code || '—');
    set('ref-count', String(info.referrals || 0));
    set('ref-earned', fmtCoins(info.earnedCoins || 0));
    const copyBtn = document.getElementById('ref-copy');
    if (copyBtn && info.link) {
      copyBtn.addEventListener('click', async () => {
        try { await navigator.clipboard.writeText(info.link); copyBtn.textContent = 'Copied ✓'; }
        catch (e) { copyBtn.textContent = 'Copy the link above'; }
      });
    }
  }

  async function renderProofs(selector) {
    const el = document.querySelector(selector);
    if (!el) return;
    const proofs = await Backend.getProofs(12);
    if (!proofs.connected || !proofs.rows.length) {
      el.innerHTML = `<div class="border border-dashed border-slate-300 rounded-xl p-8 text-center bg-slate-50">
        <div class="text-2xl mb-2">💸</div>
        <p class="font-bold text-slate-700">No payouts published yet</p>
        <p class="text-sm text-slate-500 mt-1">The first real payouts will be published here with the amount, method and date — only real, paid withdrawals, never screenshots of unpaid balances.</p>
      </div>`;
      return;
    }
    el.innerHTML = proofs.rows.map(p => {
      const date = p.paid_at ? new Date(p.paid_at).toLocaleDateString() : '';
      const methodLabel = p.method === 'paypal' ? 'PayPal' : p.method === 'crypto_ltc' ? 'Litecoin' : p.method === 'crypto_usdt' ? 'USDT' : p.method;
      return `<div class="bg-white border border-slate-200 rounded-xl p-4">
        <div class="text-2xl font-extrabold text-green-600">$${Number(p.amount_usd).toFixed(2)}</div>
        <div class="text-sm text-slate-600">via ${methodLabel} · ${date}</div>
        <div class="text-xs text-slate-400">${p.display_name || 'a SurveyCoins user'}</div>
      </div>`;
    }).join('');
  }

  return { fmtCoins, fmtUsd, renderBalance, renderTransactions, bindCheckin, renderReferral, renderProofs };
})();

window.Rewards = Rewards;
