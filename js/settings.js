/* ============================================================
   settings.js — Export / Import / Clear data
   ============================================================ */

function exportAllData() {
  var payload = {
    version: 5,
    exportedAt: new Date().toISOString(),
    trades: trades,
    playbook: playbook,
    reviews: reviews,
    backtests: backtests
  };

  var blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = 'tradevault-backup-' + todayISO() + '.json';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  toast('Backup downloaded');
}

function importAllData(file) {
  var reader = new FileReader();
  reader.onload = function (e) {
    try {
      var data = JSON.parse(e.target.result);
      if (Array.isArray(data)) {
        // Legacy: only trades array
        trades = data;
        saveTrades();
        toast('Imported ' + trades.length + ' trades');
        go('dashboard');
        return;
      }
      if (typeof data !== 'object' || data === null) throw new Error('Invalid format');

      showConfirm('Import Data', 'This will replace all existing data. Continue?', function () {
        if (Array.isArray(data.trades)) { trades = data.trades; saveTrades(); }
        if (Array.isArray(data.playbook)) { playbook = data.playbook; savePlaybook(); }
        if (Array.isArray(data.reviews)) { reviews = data.reviews; saveReviews(); }
        if (Array.isArray(data.backtests)) { backtests = data.backtests; saveBacktests(); }
        toast('Data imported');
        go('dashboard');
      });
    } catch (err) {
      toast('Invalid JSON file');
    }
  };
  reader.readAsText(file);
}

function clearAllData() {
  showConfirm('Clear All Data', 'This will permanently delete all trades, strategies, reviews, and backtests. Are you sure?', function () {
    trades = [];
    playbook = [];
    reviews = [];
    backtests = [];
    saveTrades();
    savePlaybook();
    saveReviews();
    saveBacktests();
    toast('All data cleared');
    go('dashboard');
  });
}

function initSettings() {
  $('themeSelect').addEventListener('change', function (e) { applyTheme(e.target.value); });
  $('exportBtn').addEventListener('click', exportAllData);
  $('importBtn').addEventListener('click', function () { $('importFile').click(); });
  $('importFile').addEventListener('change', function (e) {
    if (e.target.files[0]) importAllData(e.target.files[0]);
    e.target.value = '';
  });
  $('clearBtn').addEventListener('click', clearAllData);
}
