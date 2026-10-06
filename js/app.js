/* ============================================================
   app.js — Navigation, calendar, init
   ============================================================ */

var currentPage = 'dashboard';
var calCurrent = new Date();

var PAGES = ['dashboard', 'trades', 'calendar', 'analytics', 'playbook',
             'reviews', 'risk', 'backtesting', 'settings'];

function go(page) {
  if (PAGES.indexOf(page) === -1) page = 'dashboard';
  currentPage = page;

  PAGES.forEach(function (p) {
    var sec = $('page-' + p);
    if (sec) sec.classList.toggle('hidden', p !== page);
  });

  $$('.nav-item').forEach(function (b) {
    b.classList.toggle('active', b.dataset.page === page);
  });

  window.scrollTo({ top: 0, behavior: 'smooth' });

  if (page === 'dashboard') renderDashboard();
  if (page === 'trades') renderTrades();
  if (page === 'calendar') renderCalendar();
  if (page === 'analytics') renderAnalytics();
  if (page === 'playbook') renderPlaybook();
  if (page === 'reviews') renderReviews();
  if (page === 'backtesting') renderBacktests();
}

function renderCalendar() {
  try {
    var year = calCurrent.getFullYear();
    var month = calCurrent.getMonth();
    var monthNames = ['January','February','March','April','May','June',
                      'July','August','September','October','November','December'];

    var monthEl = $('calMonth');
    if (monthEl) monthEl.textContent = monthNames[month] + ' ' + year;

    var gridEl = $('calGrid');
    if (!gridEl) return;

    var firstDay = new Date(year, month, 1).getDay();
    var daysInMonth = new Date(year, month + 1, 0).getDate();
    var today = new Date();
    var isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;

    var byDate = {};
    (trades || []).forEach(function (t) {
      if (!t.date) return;
      var d = String(t.date).slice(0, 10);
      if (!byDate[d]) byDate[d] = { pnl: 0, count: 0 };
      byDate[d].pnl += calcPnl(t);
      byDate[d].count++;
    });

    var html = '';
    for (var i = 0; i < firstDay; i++) html += '<div class="cal-day empty-day"></div>';

    var monthPnl = 0, monthTrades = 0, monthWins = 0, monthLosses = 0;

    for (var d = 1; d <= daysInMonth; d++) {
      var mm = String(month + 1); if (mm.length < 2) mm = '0' + mm;
      var dd = String(d); if (dd.length < 2) dd = '0' + dd;
      var dateStr = year + '-' + mm + '-' + dd;
      var dayData = byDate[dateStr];
      var cls = 'cal-day';
      if (isCurrentMonth && today.getDate() === d) cls += ' today';

      var pnlTxt = '';
      if (dayData) {
        cls += ' has-trades';
        if (dayData.pnl > 0) cls += ' win-day';
        else if (dayData.pnl < 0) cls += ' loss-day';
        var sign = dayData.pnl > 0 ? 'pos' : dayData.pnl < 0 ? 'neg' : '';
        pnlTxt = '<div class="d-pnl ' + sign + '">' + fmtShort(dayData.pnl) + '</div>';
        monthPnl += dayData.pnl;
        monthTrades += dayData.count;
        if (dayData.pnl > 0) monthWins++;
        else if (dayData.pnl < 0) monthLosses++;
      }

      html += '<div class="' + cls + '" data-date="' + dateStr + '">' +
        '<div class="d-num">' + d + '</div>' + pnlTxt + '</div>';
    }

    gridEl.innerHTML = html;

    var summary = $('calSummary');
    if (summary) {
      summary.innerHTML =
        '<div class="mini"><div class="k">Month P&L</div><div class="v ' + (monthPnl > 0 ? 'pos' : monthPnl < 0 ? 'neg' : '') + '">' + fmtShort(monthPnl) + '</div></div>' +
        '<div class="mini"><div class="k">Trades</div><div class="v">' + monthTrades + '</div></div>' +
        '<div class="mini"><div class="k">Win Days</div><div class="v pos">' + monthWins + '</div></div>' +
        '<div class="mini"><div class="k">Loss Days</div><div class="v neg">' + monthLosses + '</div></div>';
    }
  } catch (err) { console.error('Calendar error:', err); }
}

function renderTrades() {
  var q = ($('filterSearch').value || '').toLowerCase();
  var side = $('filterSide').value;
  var res = $('filterResult').value;

  var list = tradesSorted();
  if (q) list = list.filter(function (t) { return (t.symbol || '').toLowerCase().indexOf(q) > -1; });
  if (side) list = list.filter(function (t) { return t.side === side; });
  if (res === 'win') list = list.filter(function (t) { return calcPnl(t) > 0; });
  if (res === 'loss') list = list.filter(function (t) { return calcPnl(t) < 0; });

  var cont = $('tradesList');
  if (!list.length) {
    cont.innerHTML = '<div class="empty">No trades match your filters.</div>';
    return;
  }
  cont.innerHTML = renderTable(list, false);
}

function bindGlobalActions() {
  document.addEventListener('click', function (e) {
    var target = e.target;

    var btn = target.closest ? target.closest('[data-action]') : null;
    if (btn) {
      var action = btn.dataset.action;
      var id = btn.dataset.id;
      if (action === 'edit-trade') editTrade(id);
      else if (action === 'delete-trade') deleteTrade(id);
      else if (action === 'view-trade') viewTradeDetail(id);
      else if (action === 'edit-playbook') editPlaybook(id);
      else if (action === 'delete-playbook') deletePlaybook(id);
      else if (action === 'edit-review') editReview(id);
      else if (action === 'delete-review') deleteReview(id);
      else if (action === 'edit-backtest') editBacktest(id);
      else if (action === 'delete-backtest') deleteBacktest(id);
      return;
    }

    var closeBtn = target.closest ? target.closest('[data-close]') : null;
    if (closeBtn) {
      closeModal(closeBtn.dataset.close);
      if (closeBtn.dataset.close === 'tradeModal') editingTradeId = null;
      if (closeBtn.dataset.close === 'playbookModal') editingPlaybookId = null;
      if (closeBtn.dataset.close === 'reviewModal') editingReviewId = null;
      if (closeBtn.dataset.close === 'backtestModal') editingBacktestId = null;
      return;
    }

    var gotoBtn = target.closest ? target.closest('[data-goto]') : null;
    if (gotoBtn) { go(gotoBtn.dataset.goto); return; }
  });
}

function bindModalDismiss() {
  $$('.modal-backdrop').forEach(function (backdrop) {
    backdrop.addEventListener('click', function (e) {
      if (e.target === backdrop) closeModal(backdrop.id);
    });
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      var open = document.querySelector('.modal-backdrop.show');
      if (open) closeModal(open.id);
    }
  });

  var okBtn = $('confirmOk');
  if (okBtn) {
    okBtn.addEventListener('click', function () {
      closeModal('confirmModal');
      if (typeof _confirmCallback === 'function') {
        var cb = _confirmCallback;
        _confirmCallback = null;
        cb();
      }
    });
  }
}

function init() {
  var savedTheme = null;
  try { savedTheme = localStorage.getItem(KEYS.theme); } catch (e) {}
  applyTheme(savedTheme === 'dark' ? 'dark' : 'light');

  loadTrades();
  loadPlaybook();
  loadReviews();
  loadBacktests();

  // Init custom dropdowns FIRST (before wiring listeners)
  initCustomSelects();

  $('themeBtn').addEventListener('click', toggleTheme);
  $('addTradeTop').addEventListener('click', function () { openTradeModal(); });

  $('tradeForm').addEventListener('submit', submitTrade);
  $('playbookForm').addEventListener('submit', submitPlaybook);
  $('reviewForm').addEventListener('submit', submitReview);
  $('backtestForm').addEventListener('submit', submitBacktest);

  ['tEntry', 'tStop', 'tTarget', 'tQty'].forEach(function (id) {
    var el = $(id);
    if (el) el.addEventListener('input', updateTradeMiniBoxes);
  });

  // Screenshots
  var cam = $('tCamera');
  if (cam) cam.addEventListener('change', function (e) {
    handleImageFiles(e.target.files); e.target.value = '';
  });
  var gal = $('tGallery');
  if (gal) gal.addEventListener('change', function (e) {
    handleImageFiles(e.target.files); e.target.value = '';
  });
  document.addEventListener('click', function (e) {
    var rem = e.target.closest ? e.target.closest('[data-remove-img]') : null;
    if (rem) removeScreenshot(parseInt(rem.dataset.removeImg, 10));
  });

  $$('.nav-item').forEach(function (btn) {
    btn.addEventListener('click', function () { go(btn.dataset.page); });
  });

  $('filterSearch').addEventListener('input', renderTrades);
  $('filterSide').addEventListener('change', renderTrades);
  $('filterResult').addEventListener('change', renderTrades);

  $('calPrev').addEventListener('click', function () {
    calCurrent.setMonth(calCurrent.getMonth() - 1);
    renderCalendar();
  });
  $('calNext').addEventListener('click', function () {
    calCurrent.setMonth(calCurrent.getMonth() + 1);
    renderCalendar();
  });

  $('addPlaybookBtn').addEventListener('click', function () { openPlaybookModal(); });
  $('addReviewBtn').addEventListener('click', function () { openReviewModal(); });
  $('addBacktestBtn').addEventListener('click', function () { openBacktestModal(); });

  if ($('anPeriod')) $('anPeriod').addEventListener('change', renderAnalytics);
  if ($('anSymbol')) $('anSymbol').addEventListener('input', renderAnalytics);

  initReviewTabs();
  initRisk();
  initSettings();

  bindGlobalActions();
  bindModalDismiss();

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(function (regs) {
      regs.forEach(function (r) { r.update(); });
    }).catch(function () {});
    navigator.serviceWorker.register('service-worker.js').catch(function () {});
  }

  go('dashboard');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
