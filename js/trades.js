/* ============================================================
   trades.js — Trade CRUD, modal, calculations
   ============================================================ */

var trades = [];
var editingTradeId = null;

function calcPnl(t) {
  var entry = Number(t.entry) || 0;
  var exit = Number(t.exit) || 0;
  var qty = Number(t.qty) || 0;
  var diff = t.side === 'BUY' ? (exit - entry) : (entry - exit);
  return diff * qty;
}

function loadTrades() {
  trades = readStore(KEYS.trades, []);
  if (!Array.isArray(trades)) trades = [];
}

function saveTrades() {
  writeStore(KEYS.trades, trades);
}

function tradesSorted() {
  return trades.slice().sort(function (a, b) {
    return (b.date || '').localeCompare(a.date || '') ||
           ((b.createdAt || 0) - (a.createdAt || 0));
  });
}

function openTradeModal(trade) {
  editingTradeId = trade ? trade.id : null;
  $('tradeModalTitle').textContent = trade ? 'Edit Trade' : 'Add Trade';
  $('tradeId').value = trade ? trade.id : '';
  $('tSymbol').value = trade ? (trade.symbol || '') : '';
  $('tSide').value = trade ? (trade.side || 'BUY') : 'BUY';
  $('tEntry').value = trade ? (trade.entry != null ? trade.entry : '') : '';
  $('tExit').value = trade ? (trade.exit != null ? trade.exit : '') : '';
  $('tQty').value = trade ? (trade.qty != null ? trade.qty : '') : '';
  $('tDate').value = trade ? (trade.date || todayISO()) : todayISO();
  $('tStop').value = trade ? (trade.stop != null ? trade.stop : '') : '';
  $('tTarget').value = trade ? (trade.target != null ? trade.target : '') : '';
  $('tStrategy').value = trade ? (trade.strategy || '') : '';
  $('tNotes').value = trade ? (trade.notes || '') : '';
  $('saveTradeBtn').textContent = trade ? 'Update Trade' : 'Save Trade';
  openModal('tradeModal');
  setTimeout(function () { $('tSymbol').focus(); }, 60);
}

function closeTradeModal() {
  closeModal('tradeModal');
  editingTradeId = null;
  var f = $('tradeForm');
  if (f) f.reset();
}

function submitTrade(e) {
  if (e) e.preventDefault();

  var current = editingTradeId
    ? trades.filter(function (t) { return t.id === editingTradeId; })[0]
    : null;

  var data = {
    id: editingTradeId || uid('t'),
    symbol: ($('tSymbol').value || '').trim().toUpperCase(),
    side: $('tSide').value,
    entry: parseFloat($('tEntry').value),
    exit: parseFloat($('tExit').value),
    qty: parseFloat($('tQty').value),
    date: $('tDate').value,
    stop: $('tStop').value !== '' ? parseFloat($('tStop').value) : null,
    target: $('tTarget').value !== '' ? parseFloat($('tTarget').value) : null,
    strategy: ($('tStrategy').value || '').trim(),
    notes: ($('tNotes').value || '').trim(),
    createdAt: current ? (current.createdAt || Date.now()) : Date.now()
  };

  if (!data.symbol || isNaN(data.entry) || isNaN(data.exit) || isNaN(data.qty) || !data.date) {
    toast('Please fill all required fields');
    return;
  }

  if (editingTradeId) {
    for (var i = 0; i < trades.length; i++) {
      if (trades[i].id === editingTradeId) { trades[i] = data; break; }
    }
    toast('Trade updated');
  } else {
    trades.push(data);
    toast('Trade added');
  }

  saveTrades();
  closeTradeModal();
  go(currentPage || 'dashboard');
}

function deleteTrade(id) {
  showConfirm('Delete Trade', 'Are you sure you want to delete this trade?', function () {
    trades = trades.filter(function (t) { return t.id !== id; });
    saveTrades();
    toast('Trade deleted');
    go(currentPage || 'dashboard');
  });
}

function editTrade(id) {
  var t = trades.filter(function (x) { return x.id === id; })[0];
  if (t) openTradeModal(t);
}
