// ============================================================================
// SurveyCoins — backend adapter (shared Supabase backend, same as sites #1/#3)
// - Talks to Supabase Auth + the append-only coin ledger (see shared/schema.sql).
// - Balances are NEVER computed client-side from claimed rewards: coins only
//   arrive via server-side postbacks (Edge Function) or admin-approved rows.
// - If the Supabase project is not configured yet, every call returns
//   { connected: false } and the UI shows an honest "backend connecting" state.
//   No fake balances, no fake earnings, ever.
// - LOCAL TEST MODE: add ?localtest=1 to the URL to test flows against an
//   in-memory mock (localStorage). A visible banner says LOCAL TEST MODE.
//   Never linked from any page; never used in production.
// ============================================================================

const Backend = (() => {
  const cfg = window.SITE_CONFIG;
  let supabaseClient = null;
  let localTest = false;

  function isLocalTest() {
    try { return new URLSearchParams(window.location.search).get('localtest') === '1'; } catch (e) { return false; }
  }

  function init() {
    localTest = isLocalTest();
    if (localTest) { LocalTest.seed(); return { connected: false, localTest: true }; }
    if (!cfg.supabase.url || !cfg.supabase.anonKey) return { connected: false, localTest: false };
    if (window.supabase) {
      supabaseClient = window.supabase.createClient(cfg.supabase.url, cfg.supabase.anonKey);
      return { connected: true, localTest: false };
    }
    return { connected: false, localTest: false };
  }

  function connected() { return !!supabaseClient || localTest; }
  function isLocalTestMode() { return localTest; }

  async function getSession() {
    if (localTest) return LocalTest.session();
    if (!supabaseClient) return null;
    const { data } = await supabaseClient.auth.getSession();
    return data.session || null;
  }

  async function getUser() {
    const s = await getSession();
    return s ? s.user : null;
  }

  async function signUp(email, password) {
    if (localTest) return LocalTest.signUp(email, password);
    if (!supabaseClient) return { ok: false, error: 'Backend not connected yet.' };
    const { data, error } = await supabaseClient.auth.signUp({ email, password, options: { data: { site: 'surveys' } } });
    if (error) return { ok: false, error: error.message };
    await ensureProfile(data.user);
    return { ok: true, user: data.user };
  }

  async function signIn(email, password) {
    if (localTest) return LocalTest.signIn(email, password);
    if (!supabaseClient) return { ok: false, error: 'Backend not connected yet.' };
    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (error) return { ok: false, error: error.message };
    await ensureProfile(data.user);
    return { ok: true, user: data.user };
  }

  // Profile row: normally created by the auth.users trigger (see shared
  // fix-checkin-grants.sql). This is only a fallback for rows the trigger
  // missed — it never overwrites an existing row (so a trigger-generated
  // referral_code is kept). The referral claim below uses the new INSERT
  // policy on `referrals` (auth.uid() = referred_id) + GRANT INSERT.
  async function ensureProfile(user) {
    if (!user || !supabaseClient) return;
    try {
      const { data: existing } = await supabaseClient.from('profiles').select('id').eq('id', user.id).maybeSingle();
      if (!existing) {
        await supabaseClient.from('profiles').insert({
          id: user.id, email: user.email, site: 'surveys',
          referral_code: user.id.slice(0, 8).toUpperCase(),
        });
      }
      const ref = (() => { try { return localStorage.getItem('sc_ref'); } catch (e) { return null; } })();
      if (ref) {
        const { data } = await supabaseClient.from('profiles').select('id').eq('referral_code', ref).single();
        if (data && data.id !== user.id) {
          await supabaseClient.from('referrals').insert({ referrer_id: data.id, referred_id: user.id });
          await supabaseClient.from('profiles').update({ referred_by: data.id }).eq('id', user.id);
        }
      }
    } catch (e) { /* best-effort only */ }
  }

  // Re-render hook for auth changes (INITIAL_SESSION / SIGNED_IN /
  // SIGNED_OUT). Layout subscribes so the header never stays stuck in the
  // wrong (logged-out) state when the session restores late.
  function onAuthChange(cb) {
    if (!supabaseClient) return () => {};
    const { data } = supabaseClient.auth.onAuthStateChange((_event, session) => cb(session));
    return () => { try { data.subscription.unsubscribe(); } catch (e) {} };
  }

  async function signOut() {
    if (localTest) return LocalTest.signOut();
    if (supabaseClient) await supabaseClient.auth.signOut();
  }

  // Balance = the derived user_balances view (ONE query: balance + lifetime
  // + level). Never sum the whole ledger client-side on every render.
  async function getBalance() {
    if (localTest) return LocalTest.getBalance();
    if (!supabaseClient) return { connected: false, coins: 0, usd: 0 };
    const user = await getUser();
    if (!user) return { connected: true, coins: 0, usd: 0, needsAuth: true };
    const { data, error } = await supabaseClient
      .from('user_balances')
      .select('balance_coins, lifetime_coins_earned, level')
      .eq('user_id', user.id)
      .maybeSingle();
    if (error) return { connected: true, coins: 0, usd: 0, error: error.message };
    const coins = Number((data && data.balance_coins) || 0);
    return {
      connected: true, coins, usd: coins / cfg.coinsPerDollar,
      lifetimeCoins: Number((data && data.lifetime_coins_earned) || 0),
      level: (data && data.level) || 1,
    };
  }

  async function getTransactions(limit = 20) {
    if (localTest) return LocalTest.getTransactions(limit);
    if (!supabaseClient) return { connected: false, rows: [] };
    const user = await getUser();
    if (!user) return { connected: true, rows: [] };
    const { data } = await supabaseClient
      .from('coin_transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);
    return { connected: true, rows: data || [] };
  }

  // Lifetime coins EARNED — the level basis. Read from the same view as
  // the balance (one query); the ledger-sum fallback stays for safety.
  async function getLifetimeEarned() {
    if (localTest) return LocalTest.getLifetimeEarned();
    if (!supabaseClient) return 0;
    const user = await getUser();
    if (!user) return 0;
    const { data } = await supabaseClient
      .from('user_balances').select('lifetime_coins_earned').eq('user_id', user.id).maybeSingle();
    if (data && typeof data.lifetime_coins_earned === 'number') return data.lifetime_coins_earned;
    const { data: rows } = await supabaseClient
      .from('coin_transactions').select('amount_coins, source').eq('user_id', user.id);
    return (rows || []).reduce((s, r) => s + (r.amount_coins > 0 && ['offerwall_gg', 'adgem', 'cpx', 'theoremreach', 'cashback', 'rewarded_video', 'music'].includes(r.source) ? r.amount_coins : 0), 0);
  }

  function levelFor(lifetimeCoins) {
    let current = cfg.levels[0];
    for (const lv of cfg.levels) if (lifetimeCoins >= lv.minCoinsEarned) current = lv;
    const next = cfg.levels.find(lv => lv.minCoinsEarned > lifetimeCoins) || null;
    return { current, next, lifetimeCoins };
  }

  async function getLevelInfo() {
    const n = await getLifetimeEarned();
    return levelFor(n);
  }

  // Withdrawal request: validated client-side AND by DB constraints.
  // Canonical schema: method in ('paypal','crypto_ltc','crypto_usdt'),
  // status starts at 'pending'. First withdrawal always goes to manual review.
  async function requestWithdrawal({ method, amountUsd, address }) {
    if (localTest) return LocalTest.requestWithdrawal({ method, amountUsd, address });
    if (!supabaseClient) return { ok: false, error: 'Backend not connected yet.' };
    const user = await getUser();
    if (!user) return { ok: false, error: 'Please sign in first.' };
    if (!['paypal', 'crypto_ltc', 'crypto_usdt'].includes(method)) {
      return { ok: false, error: 'Unknown payout method.' };
    }
    const bal = await getBalance();
    const min = method === 'paypal' ? cfg.withdrawals.paypalMinUsd : cfg.withdrawals.cryptoMinUsd;
    if (amountUsd < min) return { ok: false, error: `Minimum withdrawal is $${min} for ${method === 'paypal' ? 'PayPal' : 'crypto'}.` };
    if (amountUsd > bal.usd) return { ok: false, error: 'Amount exceeds your balance.' };
    const lvl = await getLevelInfo();
    if (amountUsd > lvl.current.maxWithdrawUsd) {
      // lvl.next is null at the top level — guard it (was a crash: reading
      // minCoinsEarned of null when a Level 3 user exceeded the cap).
      const nextMsg = lvl.next
        ? ` Earn $${((lvl.next.minCoinsEarned - lvl.lifetimeCoins) / cfg.coinsPerDollar).toFixed(2)} more to reach Level ${lvl.next.level}.`
        : ' You are already at the top level.';
      return { ok: false, error: `Your level (${lvl.current.name}) can withdraw up to $${lvl.current.maxWithdrawUsd} per request.${nextMsg}` };
    }
    if (!address) return { ok: false, error: 'Please enter your PayPal email or crypto wallet address.' };
    const coins = Math.round(amountUsd * cfg.coinsPerDollar);
    const prior = await getWithdrawals();
    const isFirst = !prior.rows.length;
    const { error } = await supabaseClient.from('withdrawals').insert({
      user_id: user.id,
      method,
      amount_usd: amountUsd,
      amount_coins: coins,
      payout_address: address,
      status: 'pending',
      is_first: isFirst,
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true, note: 'Request received. First withdrawals are manually reviewed within 24–72 hours. Payouts are processed in batches on Tuesdays and Fridays.' };
  }

  async function getWithdrawals() {
    if (localTest) return LocalTest.getWithdrawals();
    if (!supabaseClient) return { connected: false, rows: [] };
    const user = await getUser();
    if (!user) return { connected: true, rows: [] };
    const { data } = await supabaseClient
      .from('withdrawals')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);
    return { connected: true, rows: data || [] };
  }

  async function getReferralInfo() {
    if (localTest) return LocalTest.getReferralInfo();
    const user = await getUser();
    if (!user) return { connected: !!supabaseClient, code: '', link: '', referrals: 0, earnedCoins: 0 };
    let code = user.id.slice(0, 8);
    try {
      const { data } = await supabaseClient.from('profiles').select('referral_code').eq('id', user.id).single();
      if (data && data.referral_code) code = data.referral_code;
    } catch (e) { /* fallback to id slice */ }
    let referrals = 0, earnedCoins = 0;
    try {
      const { count } = await supabaseClient.from('referrals').select('id', { count: 'exact', head: true }).eq('referrer_id', user.id);
      referrals = count || 0;
      const { data: rows } = await supabaseClient.from('coin_transactions').select('amount_coins').eq('user_id', user.id).eq('source', 'referral');
      earnedCoins = (rows || []).reduce((s, r) => s + (r.amount_coins || 0), 0);
    } catch (e) { /* best-effort */ }
    return { connected: true, code, link: `${cfg.baseUrl}/auth.html?ref=${code}`, referrals, earnedCoins };
  }

  // Daily check-in — server-side via the claim_checkin RPC (SECURITY
  // DEFINER): one row per user per day, coins credited in the ledger by
  // the function itself. The old code inserted into daily_checkins
  // directly (42501: no GRANT) and never wrote the ledger row at all.
  async function checkin() {
    if (localTest) return LocalTest.checkin();
    if (!supabaseClient) return { ok: false, error: 'Backend not connected yet.' };
    const user = await getUser();
    if (!user) return { ok: false, error: 'Please sign in first.' };
    const { data, error } = await supabaseClient.rpc('claim_checkin', { p_site: 'surveys' });
    if (error) return { ok: false, error: error.message };
    if (data && data.already) return { ok: false, error: 'Already checked in today — come back tomorrow.' };
    return { ok: true, coins: (data && data.coins) || cfg.checkinCoins, streak: (data && data.streak) || 1 };
  }

  // Today's check-in state (for greying out the button on load).
  async function checkinStatus() {
    if (localTest) return { done: LocalTest.state().checkinDone, coins: cfg.checkinCoins, streak: 1 };
    if (!supabaseClient) return { done: false, coins: 0, streak: 0 };
    const user = await getUser();
    if (!user) return { done: false, coins: 0, streak: 0 };
    const today = new Date().toISOString().slice(0, 10);
    const { data } = await supabaseClient.from('daily_checkins')
      .select('coins_awarded, streak').eq('user_id', user.id)
      .eq('checkin_date', today).maybeSingle();
    if (!data) return { done: false, coins: 0, streak: 0 };
    return { done: true, coins: data.coins_awarded, streak: data.streak };
  }

  // Real payout proofs only — the public payout_proofs table (admin inserts
  // a row only after a withdrawal is actually PAID). Empty until the first
  // real user is paid. NEVER seed fake proofs.
  async function getProofs(limit = 12) {
    if (localTest) return LocalTest.getProofs(limit);
    if (!supabaseClient) return { connected: false, rows: [] };
    const { data } = await supabaseClient
      .from('payout_proofs')
      .select('display_name, amount_usd, method, paid_at')
      .order('paid_at', { ascending: false })
      .limit(limit);
    return { connected: true, rows: data || [] };
  }

  // Stable per-user id passed to offerwalls/routers as subid / player_id.
  async function getOfferwallUserId() {
    const user = await getUser();
    return user ? user.id : null;
  }

  // ---- Local test adapter (flag-gated, localStorage only) ----
  // Mirrors the canonical shared schema columns (source / meta / status).
  const LocalTest = {
    KEY: 'sc_localtest_v1',
    seed() {
      if (!localStorage.getItem(this.KEY)) {
        localStorage.setItem(this.KEY, JSON.stringify({
          user: { id: 'local-test-user', email: 'test@local.test' },
          coins: 2500,
          tx: [
            { source: 'cpx', meta: { offer: 'Survey: Shopping habits' }, amount_coins: 1200, created_at: new Date(Date.now() - 86400000).toISOString() },
            { source: 'theoremreach', meta: { offer: 'Survey: Streaming services' }, amount_coins: 800, created_at: new Date(Date.now() - 172800000).toISOString() },
            { source: 'checkin', meta: {}, amount_coins: 10, created_at: new Date().toISOString() },
            { source: 'signup_bonus', meta: {}, amount_coins: 250, created_at: new Date(Date.now() - 172800000).toISOString() },
          ],
          lifetimeEarned: 2000,
          withdrawals: [],
          checkinDone: false,
        }));
      }
    },
    state() { return JSON.parse(localStorage.getItem(this.KEY)); },
    save(s) { localStorage.setItem(this.KEY, JSON.stringify(s)); },
    session() { return { user: this.state().user }; },
    signUp() { return { ok: true, user: this.state().user }; },
    signIn() { return { ok: true, user: this.state().user }; },
    signOut() { return { ok: true }; },
    getBalance() { const s = this.state(); return { connected: true, localTest: true, coins: s.coins, usd: s.coins / cfg.coinsPerDollar }; },
    getTransactions(limit) { return { connected: true, rows: this.state().tx.slice(0, limit) }; },
    getLifetimeEarned() { return this.state().lifetimeEarned; },
    requestWithdrawal({ method, amountUsd }) {
      const s = this.state();
      if (!['paypal', 'crypto_ltc', 'crypto_usdt'].includes(method)) {
        return { ok: false, error: 'Unknown payout method.' };
      }
      const min = method === 'paypal' ? cfg.withdrawals.paypalMinUsd : cfg.withdrawals.cryptoMinUsd;
      if (amountUsd < min) return { ok: false, error: `Minimum withdrawal is $${min} for ${method === 'paypal' ? 'PayPal' : 'crypto'}.` };
      if (amountUsd > s.coins / cfg.coinsPerDollar) return { ok: false, error: 'Amount exceeds your balance.' };
      s.withdrawals.unshift({ method, amount_usd: amountUsd, status: 'pending', created_at: new Date().toISOString() });
      this.save(s);
      return { ok: true, note: 'LOCAL TEST: request recorded (not real). First withdrawals are manually reviewed within 24–72 hours.' };
    },
    getWithdrawals() { return { connected: true, rows: this.state().withdrawals }; },
    getReferralInfo() { return { connected: true, code: 'localtes', link: `${cfg.baseUrl}/auth.html?ref=localtes`, referrals: 0, earnedCoins: 0 }; },
    checkin() {
      const s = this.state();
      if (s.checkinDone) return { ok: false, error: 'Already checked in today — come back tomorrow.' };
      s.coins += cfg.checkinCoins; s.checkinDone = true;
      s.tx.unshift({ source: 'checkin', meta: {}, amount_coins: cfg.checkinCoins, created_at: new Date().toISOString() });
      this.save(s);
      return { ok: true, coins: cfg.checkinCoins };
    },
    getProofs() { return { connected: true, rows: [] }; },
  };

  return {
    init, connected, isLocalTestMode, getSession, getUser, onAuthChange,
    signUp, signIn, signOut, getBalance, getTransactions, getLifetimeEarned,
    levelFor, getLevelInfo, requestWithdrawal, getWithdrawals,
    getReferralInfo, checkin, checkinStatus, getProofs, getOfferwallUserId,
  };
})();

window.Backend = Backend;
