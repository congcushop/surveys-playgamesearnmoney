// ============================================================================
// SurveyCoins — Monetag push notifications (OPT-IN ONLY)
// - Never auto-subscribed. The user clicks "Enable notifications" themselves.
// - Only loads when a Monetag push tag URL is configured in js/config.js.
// - Push is for new-survey / payout alerts only — never ads disguised as alerts.
// ============================================================================

const Push = (() => {
  const cfg = window.SITE_CONFIG;

  function loadScript(src) {
    return new Promise((resolve) => {
      const s = document.createElement('script');
      s.src = src; s.async = true;
      s.onload = () => resolve(true);
      s.onerror = () => resolve(false);
      document.head.appendChild(s);
    });
  }

  function bind(buttonId, statusId) {
    const btn = document.getElementById(buttonId);
    const status = document.getElementById(statusId);
    if (!btn) return;
    const tagUrl = cfg.push.monetagPushTagUrl;
    if (!tagUrl) {
      btn.disabled = true;
      btn.textContent = 'Notifications — coming soon';
      if (status) status.textContent = 'Push alerts will be available once the notification service is connected. We never send ads as notifications.';
      return;
    }
    if (window.Notification && Notification.permission === 'granted') {
      btn.textContent = 'Notifications enabled ✓';
      btn.disabled = true;
      if (status) status.textContent = 'You will be alerted about new high-paying surveys and your payout status.';
      return;
    }
    btn.addEventListener('click', async () => {
      const ok = await loadScript(tagUrl);
      if (ok) {
        btn.textContent = 'Notifications enabled ✓';
        btn.disabled = true;
        if (status) status.textContent = 'Thanks! You will be alerted about new surveys and payouts. You can turn this off anytime in your browser settings.';
      } else if (status) {
        status.textContent = 'Could not enable notifications right now — please try again later.';
      }
    });
  }

  return { bind };
})();

window.Push = Push;
