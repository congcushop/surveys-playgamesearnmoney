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
  checkinCoins: 10,              // daily login bonus (shared schema default; fallback when the RPC returns no amount)
  // NOTE: check-in amounts are paid by the server-side claim_checkin RPC
  // (surveys: 10 flat, +100 on a 7-day streak). The old
  // checkinStreakDay7Bonus / checkinStreakBonus keys were removed 23/11:
  // nothing read them, and a stale local number must never disagree
  // with what the server actually pays.

  withdrawals: {
    paypalMinUsd: 10,
    cryptoMinUsd: 3,             // LTC / USDT
    // NOTE: gift-card withdrawals are NOT offered on this site — the only
    // methods are PayPal and crypto (paypal | crypto_ltc | crypto_usdt).
    // Page copy must not promise a gift-card minimum.
    firstHoldHoursMin: 24,       // first withdrawal: manual review, 24–72h hold
    firstHoldHoursMax: 72,
    batchDays: ['Tue', 'Fri'],   // payouts processed in batches, 2x/week
    dailyPayoutCapUsd: 500,      // daily payout cap — payouts never exceed the float
  },

  // Level system — gradual withdrawals (user decision 22/11). Thresholds are
  // LIFETIME COINS EARNED (shared schema refresh_user_level()): L2 at 10,000
  // coins ($10 earned), L3 at 50,000 ($50 earned). No fast-path promise.
  levels: [
    { level: 1, name: 'Newcomer', minCoinsEarned: 0,     maxWithdrawUsd: 10 },
    { level: 2, name: 'Regular',  minCoinsEarned: 10000, maxWithdrawUsd: 25 },
    { level: 3, name: 'Pro',      minCoinsEarned: 50000, maxWithdrawUsd: 50 },
  ],

  // ---- Shared Supabase backend (SAME project as sites #1 and #3) ----
  // Fill in once the shared Supabase project is created. Until then the site
  // runs in "backend connecting" mode — no fake balances, no fake earnings.
  supabase: {
    url: 'https://hqkjcwjqxhbhenvanteu.supabase.co',      // e.g. https://xyzcompany.supabase.co
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhxa2pjd2pxeGhiaGVudmFudGV1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTUzODUxMjEsImV4cCI6MjExMDk2MTEyMX0.y_J73wKX30ZSkB6iXtLpm5dvB3P_jpbHJOQzdC4rbGY',  // publishable key only — NEVER the service_role key
  },
  // Edge Function that receives offerwall postbacks (deployed once, shared).
  postbackUrl: '', // e.g. https://xyzcompany.supabase.co/functions/v1/offerwall-postback

  // ---- Offerwalls (shared with sites #1/#3 — one account each, NOT per site) ----
  offerwalls: {
    offerwallGG: {
      // Placement iframe URL from the Offerwall.GG dashboard (per placement).
      // Append &userId=<USER_ID> at runtime — see js/offerwall.js.
      iframeUrl: 'https://offerwall.gg/wall/5cdd431f1439b328ed3d0da1e0990f2a',
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
  // LIVE stores — the same 6 approved Rakuten/Impact deals as site #1
  // (js/config.js cashback.stores). Rates are the approved offer rates —
  // never invent a rate or a tracking link. Wondershare is approved on
  // BOTH networks at 30% (Impact Brand 59772 AND Rakuten MID 37160 /
  // Offer 2137962) — ONE card, using the Rakuten deep link, because the
  // Impact tracking URL needs an {Ad ID} chosen per asset in the Impact
  // dashboard and no Ad ID is on file. Do NOT invent an Ad ID.
  // The user gets 50% of each store's commission as coins.
  cashback: {
    affiliateNetwork: 'rakuten', // Rakuten (Wondershare also Impact)
    stores: [
      { name: "Wondershare", category: "Software", cashbackPct: 30,
        desc: "Video, PDF & data tools — Dr.Fone Full Toolkit $139.95, Recoverit $79.99, MobileTrans $54.99.",
        network: "Rakuten + Impact",
        affiliateUrl: "https://click.linksynergy.com/link?id=%2fg%2fjHJaZtI4&offerid=2137962&type=2&murl=https%3A%2F%2Fwww.wondershare.com" },
      { name: "Keeper Security", category: "Security Software", cashbackPct: 10,
        desc: "Password manager & cybersecurity for families and teams. 10% base, up to $5 per action.",
        network: "Rakuten",
        affiliateUrl: "https://click.linksynergy.com/link?id=%2fg%2fjHJaZtI4&offerid=2065364&type=2&murl=https%3A%2F%2Fwww.keepersecurity.com" },
      { name: "Waterdrop Filter", category: "Home & Kitchen", cashbackPct: 8,
        desc: "Reverse-osmosis & gravity water filters for clean drinking water.",
        network: "Rakuten",
        affiliateUrl: "https://click.linksynergy.com/link?id=%2fg%2fjHJaZtI4&offerid=1888875&type=2&murl=https%3A%2F%2Fwww.waterdropfilter.com" },
      { name: "Easy Plumbing", category: "Home & Garden", cashbackPct: 5,
        desc: "KOHLER & Moen fixtures, faucets, sinks and bath furniture.",
        network: "Rakuten",
        affiliateUrl: "https://click.linksynergy.com/link?id=%2fg%2fjHJaZtI4&offerid=1898982&type=2&murl=https%3A%2F%2Fwww.easyplumbing.com" },
      { name: "KitchenAid", category: "Appliances", cashbackPct: 2,
        desc: "Stand mixers & major kitchen appliances.",
        network: "Rakuten", badge: "Ends 7 Dec 2026",
        affiliateUrl: "https://click.linksynergy.com/link?id=%2fg%2fjHJaZtI4&offerid=1972089&type=2&murl=https%3A%2F%2Fwww.kitchenaid.com" },
      { name: "Paw.com", category: "Pet Supplies", cashbackPct: 2,
        desc: "Pet beds, carriers & accessories.",
        network: "Rakuten",
        affiliateUrl: "https://click.linksynergy.com/link?id=%2fg%2fjHJaZtI4&offerid=1783560&type=2&murl=https%3A%2F%2Fwww.paw.com" },
    ],
  },

  // ---- Music lounge (retention only — tiny rewards, NOT a main earner) ----
  // Paid music-review supply like SliceThePie's is proprietary; there is no
  // offerwall music inventory. Music here is a retention feature.
  music: { audioProvider: '', sessionCoins: 5 },

  // ---- Monetag push notifications (opt-in only) ----
  push: { monetagPushTagUrl: '' },
};

window.SITE_CONFIG = SITE_CONFIG;
