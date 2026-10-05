/* ============================================================
   app.js — Navigation, init, event wiring
   ============================================================ */

var currentPage = 'dashboard';

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
    if (gotoBtn) {
      go(gotoBtn.dataset.goto);
      return;
    }
  });
}

function bindModalDismiss() {
  $$('.modal-backdrop').forEach(function (backdrop) {
    backdrop.addEventListener('click', function (e) {
      if (e.target === backdrop) {
        closeModal(backdrop.id);
      }
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

  $('themeBtn').addEventListener('click', toggleTheme);
  $('addTradeTop').addEventListener('click', function () { openTradeModal(); });

  $('tradeForm').addEventListener('submit', submitTrade);
  $('playbookForm').addEventListener('submit', submitPlaybook);
  $('reviewForm').addEventListener('submit', submitReview);
  $('backtestForm').addEventListener('submit', submitBacktest);

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

  // Analytics filters
  if ($('anPeriod')) $('anPeriod').addEventListener('change', renderAnalytics);
  if ($('anSymbol')) $('anSymbol').addEventListener('input', renderAnalytics);

  // Review period tabs
  initReviewTabs();

  // Risk calculator
  initRisk();

  // Settings
  initSettings();

  // Global bindings
  bindGlobalActions();
  bindModalDismiss();

  // Service worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js').catch(function () {});
  }

  go('dashboard');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
