// ============================================================================
// SurveyCoins — site #2 (surveys-led) — CENTRAL CONFIG
// Domain: surveys.playgamesearnmoney.com
// ONE place for every integration. Fill in IDs after each account is approved.
// Nothing here is live until its ID is filled in; empty values = slot shows a
// clearly-marked placeholder and the feature shows an honest "connecting" state.
// NEVER put secrets (postback secrets, API keys) in this file — those live in
// Supabase secrets / the Edge Function, never in client-side code.
// ============================================================================

const SITE_CONFIG = {
  siteName: 'SurveyCoins',
  siteTagline: 'Answer surveys. Earn real cash.',
  domain: 'surveys.playgamesearnmoney.com',
  baseUrl: 'https://surveys.playgamesearnmoney.com',
  supportEmail: 'support@playgamesearnmoney.com',

  // ---- Coin economy (LOCKED — do not change without owner approval) ----
  coinsPerDollar: 1000,          // 1,000 coins = $1
  userShare: 0.60,               // user gets 60% of offerwall value, site keeps 40%
  referralRate: 0.10,            // referrer earns 10% of referral earnings, from site margin
  signupBonusCoins: 250,         // $0.25 — LOCKED until first offer completes
  checkinCoins: 10,              // daily login bonus (shared schema default)
  checkinStreakDay7Bonus: 100,   // day-7 streak bonus
  checkinStreakBonus: 10,        // extra coins per consecutive day, capped at +100

  withdrawals: {
    paypalMinUsd: 5,
    cryptoMinUsd: 1,             // LTC / USDT
    // NOTE: gift-card withdrawals are in the report spec but NOT in the shared
    // schema's method check (paypal | crypto_ltc | crypto_usdt). Adding them
    // needs a one-line schema change — see INTEGRATION_STATUS.md.
    firstHoldHoursMin: 24,       // first withdrawal: manual review, 24–72h hold
    firstHoldHoursMax: 72,
    batchDays: ['Tue', 'Fri'],   // payouts processed in batches, 2x/week
    dailyPayoutCapUsd: 500,      // daily payout cap — payouts never exceed the float
  },

  // Level system — gradual withdrawals (user decision 22/11). Thresholds are
  // LIFETIME COINS EARNED (shared schema refresh_user_level()): L2 at 10,000
  // coins ($10 earned), L3 at 50,000 ($50 earned). No fast-path promise.
  levels: [
    { level: 1, name: 'Newcomer', minCoinsEarned: 0,     maxWithdrawUsd: 5  },
    { level: 2, name: 'Regular',  minCoinsEarned: 10000, maxWithdrawUsd: 10 },
    { level: 3, name: 'Pro',      minCoinsEarned: 50000, maxWithdrawUsd: 25 },
  ],

  // ---- Shared Supabase backend (SAME project as sites #1 and #3) ----
  // Fill in once the shared Supabase project is created. Until then the site
  // runs in "backend connecting" mode — no fake balances, no fake earnings.
  supabase: {
    url: '',      // e.g. https://xyzcompany.supabase.co
    anonKey: '',  // publishable key only — NEVER the service_role key
  },
  // Edge Function that receives offerwall postbacks (deployed once, shared).
  postbackUrl: '', // e.g. https://xyzcompany.supabase.co/functions/v1/offerwall-postback

  // ---- Offerwalls (shared with sites #1/#3 — one account each, NOT per site) ----
  offerwalls: {
    offerwallGG: {
      // Placement iframe URL from the Offerwall.GG dashboard (per placement).
      // Append &subid=<USER_ID> at runtime — see js/offerwall.js.
      iframeUrl: '',
    },
    adgem: {
      // AdGem Web Offerwall URL from dashboard.adgem.com (Property -> Web).
      // player_id=<USER_ID> is appended at runtime.
      iframeUrl: '',
    },
  },

  // ---- Extra survey routers ----
  routers: {
    cpx: {
      // CPX Research survey wall: app ID from the CPX dashboard.
      appId: '',
      iframeUrl: '', // e.g. https://offers.cpx-research.com/index.php?app_id=APP_ID&ext_user_id=USER_ID
    },
    theoremReach: {
      // TheoremReach survey wall: api key / placement from the dashboard.
      apiKey: '',
      iframeUrl: '',
    },
  },

  // ---- Ad networks (ALL 11 — safe formats only, see js/ads.js) ----
  // For each network, paste the tag/script URL exactly as its dashboard gives
  // it after approval. Empty = network not loaded, slot shows a placeholder.
  // RULES (non-negotiable): NO popunders. NEVER reward ad views/clicks.
  // Display ads live ONLY in ad slots — never inside the offerwall, task flow,
  // or withdrawal flow. Only ONE in-page-push provider is active at a time
  // (see inPagePushProvider) — multiple push scripts stacked would spam users.
  ads: {
    inPagePushProvider: 'monetag', // the single active IPP provider; others off
    infolinks:  { pid: '', wsid: '' },          // in-text + in-fold only
    monetag:    { tagUrl: '', pushTagUrl: '' }, // in-page push only (IPP)
    adsterra:   { bannerTagUrl: '', nativeTagUrl: '' }, // banners + native only
    adcash:     { bannerTagUrl: '', nativeTagUrl: '' }, // display + native
    hilltopads: { bannerTagUrl: '' },
    clickadu:   { bannerTagUrl: '' },
    richads:    { nativeTagUrl: '' },
    evadav:     { bannerTagUrl: '', nativeTagUrl: '' },
    mondiad:    { bannerTagUrl: '', nativeTagUrl: '' },
    medianet:   { cid: '' },                    // contextual display/native
    // popads: NOT INSTALLED — PopAds is popunder-only and popunders are banned
    // by the owner's safe-formats rule. Do not add it.
  },

  // ---- Rewarded video (Phase 2, installed at launch) ----
  // Provider + unit ID from the rewarded-video provider dashboard.
  // Users watch VOLUNTARILY for coins — the legal rewarded format.
  rewardedVideo: { provider: '', unitId: '', coinsPerView: 10 },

  // ---- Cashback shopping (Phase 2, installed at launch) ----
  // Affiliate network links go here once the affiliate accounts exist.
  // No store is listed until its affiliate deal is real — no fake stores.
  cashback: {
    affiliateNetwork: '', // e.g. 'rakuten' / 'awin' / 'impact' + account id
    stores: [],            // { name, logo, cashbackPct, affiliateUrl }
  },

  // ---- Music lounge (retention only — tiny rewards, NOT a main earner) ----
  // Paid music-review supply like SliceThePie's is proprietary; there is no
  // offerwall music inventory. Music here is a retention feature.
  music: { audioProvider: '', sessionCoins: 5 },

  // ---- Monetag push notifications (opt-in only) ----
  push: { monetagPushTagUrl: '' },
};

window.SITE_CONFIG = SITE_CONFIG;
