/* ============================================================
   storage.js — Central localStorage management
   ============================================================ */

var KEYS = {
  trades: 'tradevault.trades.v5',
  playbook: 'tradevault.playbook.v5',
  reviews: 'tradevault.reviews.v5',
  backtests: 'tradevault.backtests.v5',
  theme: 'tradevault.theme.v5'
};

function readStore(key, fallback) {
  try {
    var raw = localStorage.getItem(key);
    if (!raw) return fallback;
    var parsed = JSON.parse(raw);
    return parsed != null ? parsed : fallback;
  } catch (e) {
    return fallback;
  }
}

function writeStore(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    toast('Storage error');
    return false;
  }
}

function clearStore() {
  try {
    Object.keys(KEYS).forEach(function (k) {
      localStorage.removeItem(KEYS[k]);
    });
    return true;
  } catch (e) {
    return false;
  }
}
