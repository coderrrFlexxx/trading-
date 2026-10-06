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

  try {
    if (page === 'dashboard' && typeof renderDashboard === 'function') renderDashboard();
    if (page === 'trades' && typeof renderTrades === 'function') renderTrades();
    if (page === 'calendar' && typeof renderCalendar === 'function') renderCalendar();
    if (page === 'analytics' && typeof renderAnalytics === 'function') renderAnalytics();
    if (page === 'playbook' && typeof renderPlaybook === 'function') renderPlaybook();
    if (page === 'reviews' && typeof renderReviews === 'function') renderReviews();
    if (page === 'backtesting' && typeof renderBacktests === 'function') renderBacktests();
  } catch (err) { console.error('Render error:', err); }
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
    (typeof trades !== 'undefined' && trades ? trades : []).forEach(function (t) {
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
  try {
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
  } catch (err) { console.error('Trades render error:', err); }
}

/* ============================================================
   MASTER CLICK HANDLER
   ============================================================ */
function masterClickHandler(e) {
  var target = e.target;

  // 1. Bottom nav — open page
  var navBtn = target.closest ? target.closest('.nav-item') : null;
  if (navBtn && navBtn.dataset.page) {
    e.preventDefault();
    go(navBtn.dataset.page);
    return;
  }

  // 2. View/Edit/Delete
  var actionBtn = target.closest ? target.closest('[data-action]') : null;
  if (actionBtn) {
    var action = actionBtn.dataset.action;
    var id = actionBtn.dataset.id;
    try {
      if (action === 'edit-trade') editTrade(id);
      else if (action === 'delete-trade') deleteTrade(id);
      else if (action === 'view-trade') viewTradeDetail(id);
      else if (action === 'edit-playbook') editPlaybook(id);
      else if (action === 'delete-playbook') deletePlaybook(id);
      else if (action === 'edit-review') editReview(id);
      else if (action === 'delete-review') deleteReview(id);
      else if (action === 'edit-backtest') editBacktest(id);
      else if (action === 'delete-backtest') deleteBacktest(id);
    } catch (err) { console.error('Action error:', err); }
    return;
  }

  // 3. Close modal
  var closeBtn = target.closest ? target.closest('[data-close]') : null;
  if (closeBtn) {
    closeModal(closeBtn.dataset.close);
    if (closeBtn.dataset.close === 'tradeModal' && typeof editingTradeId !== 'undefined') editingTradeId = null;
    if (closeBtn.dataset.close === 'playbookModal' && typeof editingPlaybookId !== 'undefined') editingPlaybookId = null;
    if (closeBtn.dataset.close === 'reviewModal' && typeof editingReviewId !== 'undefined') editingReviewId = null;
    if (closeBtn.dataset.close === 'backtestModal' && typeof editingBacktestId !== 'undefined') editingBacktestId = null;
    return;
  }

  // 4. Goto buttons
  var gotoBtn = target.closest ? target.closest('[data-goto]') : null;
  if (gotoBtn && gotoBtn.dataset.goto) {
    go(gotoBtn.dataset.goto);
    return;
  }

  // 5. Add Trade
  if (target.closest && target.closest('#addTradeTop')) {
    if (typeof openTradeModal === 'function') openTradeModal();
    return;
  }

  // 6. Theme toggle
  if (target.closest && target.closest('#themeBtn')) {
    toggleTheme();
    return;
  }

  // 7. Remove screenshot
  var rem = target.closest ? target.closest('[data-remove-img]') : null;
  if (rem && typeof removeScreenshot === 'function') {
    removeScreenshot(parseInt(rem.dataset.removeImg, 10));
    return;
  }

  // 8. Calendar prev/next
  if (target.closest && target.closest('#calPrev')) {
    calCurrent.setMonth(calCurrent.getMonth() - 1);
    renderCalendar();
    return;
  }
  if (target.closest && target.closest('#calNext')) {
    calCurrent.setMonth(calCurrent.getMonth() + 1);
    renderCalendar();
    return;
  }

  // 9. Add buttons
  if (target.closest && target.closest('#addPlaybookBtn') && typeof openPlaybookModal === 'function') { openPlaybookModal(); return; }
  if (target.closest && target.closest('#addReviewBtn') && typeof openReviewModal === 'function') { openReviewModal(); return; }
  if (target.closest && target.closest('#addBacktestBtn') && typeof openBacktestModal === 'function') { openBacktestModal(); return; }

  // 10. Modal backdrop
  if (target.classList && target.classList.contains('modal-backdrop') && target.classList.contains('show')) {
    closeModal(target.id);
    return;
  }

  // 11. Confirm OK
  if (target.closest && target.closest('#confirmOk')) {
    closeModal('confirmModal');
    if (typeof _confirmCallback === 'function') {
      var cb = _confirmCallback;
      _confirmCallback = null;
      cb();
    }
    return;
  }
}

function masterKeyHandler(e) {
  if (e.key === 'Escape') {
    var open = document.querySelector('.modal-backdrop.show');
    if (open) closeModal(open.id);
  }
}

function masterChangeHandler(e) {
  var t = e.target;
  if (!t || !t.id) return;

  if (t.id === 'filterSide' || t.id === 'filterResult') { renderTrades(); return; }
  if (t.id === 'anPeriod') { if (typeof renderAnalytics === 'function') renderAnalytics(); return; }
  if (t.id === 'themeSelect') { applyTheme(t.value); return; }
  if (t.id === 'tCamera' && typeof handleImageFiles === 'function') { handleImageFiles(t.files); t.value = ''; return; }
  if (t.id === 'tGallery' && typeof handleImageFiles === 'function') { handleImageFiles(t.files); t.value = ''; return; }
  if (t.id === 'importFile' && typeof importData === 'function' && t.files[0]) { importData(t.files[0]); t.value = ''; return; }
  if (t.id === 'rSide' || t.id === 'rBalance' || t.id === 'rRiskPct' || t.id === 'rEntry' || t.id === 'rStop' || t.id === 'rTarget') {
    if (typeof calcRisk === 'function') calcRisk();
    return;
  }
}

function masterInputHandler(e) {
  var t = e.target;
  if (!t || !t.id) return;

  if (t.id === 'filterSearch') { renderTrades(); return; }
  if (t.id === 'anSymbol') { if (typeof renderAnalytics === 'function') renderAnalytics(); return; }
  if (t.id === 'tEntry' || t.id === 'tStop' || t.id === 'tTarget' || t.id === 'tQty') {
    if (typeof updateTradeMiniBoxes === 'function') updateTradeMiniBoxes();
    return;
  }
  if (t.id === 'rBalance' || t.id === 'rRiskPct' || t.id === 'rEntry' || t.id === 'rStop' || t.id === 'rTarget') {
    if (typeof calcRisk === 'function') calcRisk();
    return;
  }
}

function masterSubmitHandler(e) {
  var f = e.target;
  if (!f || !f.id) return;
  if (f.id === 'tradeForm' && typeof submitTrade === 'function') { submitTrade(e); return; }
  if (f.id === 'playbookForm' && typeof submitPlaybook === 'function') { submitPlaybook(e); return; }
  if (f.id === 'reviewForm' && typeof submitReview === 'function') { submitReview(e); return; }
  if (f.id === 'backtestForm' && typeof submitBacktest === 'function') { submitBacktest(e); return; }
}

function init() {
  try {
    var savedTheme = null;
    try { savedTheme = localStorage.getItem(KEYS.theme); } catch (e) {}
    applyTheme(savedTheme === 'dark' ? 'dark' : 'light');

    if (typeof loadTrades === 'function') loadTrades();
    if (typeof loadPlaybook === 'function') loadPlaybook();
    if (typeof loadReviews === 'function') loadReviews();
    if (typeof loadBacktests === 'function') loadBacktests();

    // Setup custom dropdowns — inside try/catch so it never breaks app
    try { if (typeof initCustomSelects === 'function') initCustomSelects(); }
    catch (e) { console.error('Custom selects failed:', e); }

    // Global listeners
    document.addEventListener('click', masterClickHandler, false);
    document.addEventListener('keydown', masterKeyHandler, false);
    document.addEventListener('change', masterChangeHandler, true);
    document.addEventListener('input', masterInputHandler, true);
    document.addEventListener('submit', masterSubmitHandler, false);

    if (typeof initReviewTabs === 'function') initReviewTabs();
    if (typeof initRisk === 'function') initRisk();
    if (typeof initSettings === 'function') initSettings();

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(function (regs) {
        regs.forEach(function (r) { r.update(); });
      }).catch(function () {});
      navigator.serviceWorker.register('service-worker.js').catch(function () {});
    }

    go('dashboard');
  } catch (err) {
    console.error('Init error:', err);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
