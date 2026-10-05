/* ============================================================
   backtesting.js — Backtest log CRUD
   ============================================================ */

var backtests = [];
var editingBacktestId = null;

function loadBacktests() {
  backtests = readStore(KEYS.backtests, []);
  if (!Array.isArray(backtests)) backtests = [];
}

function saveBacktests() {
  writeStore(KEYS.backtests, backtests);
}

function renderBacktests() {
  var cont = $('backtestList');
  if (!backtests.length) {
    cont.innerHTML = '<div class="empty">No backtests yet. Test your strategies historically.</div>';
    return;
  }

  cont.innerHTML = backtests.map(function (b) {
    var pnlCls = (b.pnl || 0) > 0 ? 'pos' : (b.pnl || 0) < 0 ? 'neg' : '';
    return '<div class="item-card">' +
      '<div class="item-head">' +
        '<div>' +
          '<div class="item-title">' + escapeHtml(b.name) + '</div>' +
          '<div class="item-meta">' + escapeHtml(b.strategy || 'No strategy') + ' · ' + (b.start || '?') + ' to ' + (b.end || '?') + '</div>' +
        '</div>' +
        '<div class="item-actions">' +
          '<button class="btn" data-action="edit-backtest" data-id="' + b.id + '" style="padding:5px 10px;font-size:12px;">Edit</button> ' +
          '<button class="btn btn-danger" data-action="delete-backtest" data-id="' + b.id + '" style="padding:5px 10px;font-size:12px;">Delete</button>' +
        '</div>' +
      '</div>' +
      '<div class="mini-stats" style="margin-top:8px">' +
        '<div class="mini"><div class="k">Trades</div><div class="v">' + (b.trades || 0) + '</div></div>' +
        '<div class="mini"><div class="k">Win Rate</div><div class="v">' + (b.winRate || 0) + '%</div></div>' +
        '<div class="mini"><div class="k">Net P&L</div><div class="v ' + pnlCls + '">' + fmtShort(b.pnl || 0) + '</div></div>' +
        '<div class="mini"><div class="k">Max DD</div><div class="v neg">' + fmtShort(b.dd || 0) + '</div></div>' +
      '</div>' +
      (b.notes ? '<div class="item-body">' + escapeHtml(b.notes) + '</div>' : '') +
    '</div>';
  }).join('');
}

function openBacktestModal(item) {
  editingBacktestId = item ? item.id : null;
  $('backtestModalTitle').textContent = item ? 'Edit Backtest' : 'New Backtest';
  $('btId').value = item ? item.id : '';
  $('btName').value = item ? item.name : '';
  $('btStrategy').value = item ? (item.strategy || '') : '';
  $('btSymbols').value = item ? (item.symbols || '') : '';
  $('btStart').value = item ? (item.start || '') : '';
  $('btEnd').value = item ? (item.end || '') : '';
  $('btTrades').value = item ? (item.trades || '') : '';
  $('btWinRate').value = item ? (item.winRate || '') : '';
  $('btPnl').value = item ? (item.pnl || '') : '';
  $('btDD').value = item ? (item.dd || '') : '';
  $('btNotes').value = item ? (item.notes || '') : '';
  openModal('backtestModal');
  setTimeout(function () { $('btName').focus(); }, 60);
}

function closeBacktestModal() {
  closeModal('backtestModal');
  editingBacktestId = null;
  var f = $('backtestForm');
  if (f) f.reset();
}

function submitBacktest(e) {
  if (e) e.preventDefault();
  var name = ($('btName').value || '').trim();
  if (!name) { toast('Name is required'); return; }

  var data = {
    id: editingBacktestId || uid('bt'),
    name: name,
    strategy: ($('btStrategy').value || '').trim(),
    symbols: ($('btSymbols').value || '').trim(),
    start: $('btStart').value,
    end: $('btEnd').value,
    trades: parseInt($('btTrades').value, 10) || 0,
    winRate: parseFloat($('btWinRate').value) || 0,
    pnl: parseFloat($('btPnl').value) || 0,
    dd: parseFloat($('btDD').value) || 0,
    notes: ($('btNotes').value || '').trim(),
    createdAt: Date.now()
  };

  if (editingBacktestId) {
    for (var i = 0; i < backtests.length; i++) {
      if (backtests[i].id === editingBacktestId) { data.createdAt = backtests[i].createdAt || Date.now(); backtests[i] = data; break; }
    }
    toast('Backtest updated');
  } else {
    backtests.push(data);
    toast('Backtest added');
  }

  saveBacktests();
  closeBacktestModal();
  renderBacktests();
}

function editBacktest(id) {
  var item = backtests.filter(function (b) { return b.id === id; })[0];
  if (item) openBacktestModal(item);
}

function deleteBacktest(id) {
  showConfirm('Delete Backtest', 'Delete this backtest permanently?', function () {
    backtests = backtests.filter(function (b) { return b.id !== id; });
    saveBacktests();
    toast('Backtest deleted');
    renderBacktests();
  });
}
