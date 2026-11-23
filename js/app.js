// ============================================================================
// SurveyCoins — page bootstrapper. Each page calls App.boot({ ... }) with the
// modules it needs. Keeps every page's wiring in one place.
// ============================================================================

const App = (() => {
  async function boot(opts = {}) {
    await Layout.init();
    await Ads.init();
    if (opts.balance) await Rewards.renderBalance('[data-balance]');
    if (opts.transactions) await Rewards.renderTransactions('[data-transactions]', opts.transactions);
    if (opts.checkin) Rewards.bindCheckin('checkin-btn', 'checkin-result');
    if (opts.level) await Rewards.renderLevel();
    if (opts.offerwallGG) await Offerwall.mountGG('offerwall-gg');
    if (opts.adgem) await Offerwall.mountAdGem('offerwall-adgem');
    if (opts.cpx) await Routers.mountCPX('router-cpx');
    if (opts.theorem) await Routers.mountTheoremReach('router-theorem');
    if (opts.referral) await Rewards.renderReferral();
    if (opts.proofs) await Rewards.renderProofs('[data-proofs]');
    if (opts.push) Push.bind('push-btn', 'push-status');
  }

  return { boot };
})();

window.App = App;
