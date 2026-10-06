/* ============================================================
   ui.js — Helpers + Custom Dropdown system
   ============================================================ */

var THEME_KEY = 'tradevault.theme.v5';

function $(id) { return document.getElementById(id); }
function $$(sel) { return document.querySelectorAll(sel); }

function fmtMoney(n) {
  var v = Number(n) || 0;
  var sign = v < 0 ? '-' : '';
  return sign + '₹' + Math.abs(v).toLocaleString('en-IN', {
    minimumFractionDigits: 2, maximumFractionDigits: 2
  });
}

function fmtShort(n) {
  var v = Number(n) || 0;
  var sign = v < 0 ? '-' : '';
  var a = Math.abs(v);
  if (a >= 100000) return sign + '₹' + (a / 100000).toFixed(2) + 'L';
  if (a >= 1000) return sign + '₹' + (a / 1000).toFixed(2) + 'k';
  return sign + '₹' + a.toFixed(2);
}

function uid(prefix) {
  return (prefix || 'id') + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}

function todayISO() { return new Date().toISOString().slice(0, 10); }

function toast(msg) {
  var el = $('toast');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(el._t);
  el._t = setTimeout(function () { el.classList.remove('show'); }, 2200);
}

/* ---------- Theme ---------- */
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);

  var meta = document.querySelector('meta[name="theme-color"]:not([media])');
  if (meta) meta.setAttribute('content', theme === 'dark' ? '#12100b' : '#faf8f0');

  var sel = $('themeSelect');
  if (sel) {
    sel.value = theme;
    if (sel._csUpdate) sel._csUpdate();
  }

  var icon = $('themeIcon');
  if (icon) {
    icon.innerHTML = theme === 'dark'
      ? '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>'
      : '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>';
  }
  try { localStorage.setItem(THEME_KEY, theme); } catch (e) {}
}

function toggleTheme() {
  var cur = document.documentElement.getAttribute('data-theme') || 'light';
  applyTheme(cur === 'dark' ? 'light' : 'dark');
}

/* ---------- Modal helpers ---------- */
function openModal(id) {
  var el = $(id);
  if (el) el.classList.add('show');
}

function closeModal(id) {
  var el = $(id);
  if (el) el.classList.remove('show');
}

function closeAllModals() {
  $$('.modal-backdrop').forEach(function (m) { m.classList.remove('show'); });
}

var _confirmCallback = null;
function showConfirm(title, message, callback) {
  $('confirmTitle').textContent = title;
  $('confirmMsg').textContent = message;
  _confirmCallback = callback;
  openModal('confirmModal');
}

/* ============================================================
   CUSTOM SELECT SYSTEM
   Replaces every <select> with a styled dropdown
   ============================================================ */

function initCustomSelects() {
  var allSelects = document.querySelectorAll('select');

  Array.prototype.forEach.call(allSelects, function (sel) {
    if (sel.dataset.csReady === '1') return;
    sel.dataset.csReady = '1';

    // Wrapper
    var wrap = document.createElement('div');
    wrap.className = 'cs-wrap';
    sel.parentNode.insertBefore(wrap, sel);
    wrap.appendChild(sel);
    sel.classList.add('cs-native');

    // Trigger button
    var trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'cs-trigger';
    trigger.innerHTML =
      '<span class="cs-label"></span>' +
      '<svg class="cs-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>';
    wrap.appendChild(trigger);

    // Menu
    var menu = document.createElement('div');
    menu.className = 'cs-menu';
    wrap.appendChild(menu);

    var labelEl = trigger.querySelector('.cs-label');

    function getSelectedText() {
      var opt = sel.options[sel.selectedIndex];
      return opt ? opt.textContent : '';
    }

    function refresh() {
      labelEl.textContent = getSelectedText();
      var opts = menu.querySelectorAll('.cs-option');
      Array.prototype.forEach.call(opts, function (o) {
        o.classList.toggle('active', o.dataset.value === sel.value);
      });
    }

    function buildMenu() {
      menu.innerHTML = '';
      Array.prototype.forEach.call(sel.options, function (opt) {
        var item = document.createElement('div');
        item.className = 'cs-option';
        item.textContent = opt.textContent;
        item.dataset.value = opt.value;
        if (opt.value === sel.value) item.classList.add('active');
        item.addEventListener('click', function (e) {
          e.stopPropagation();
          sel.value = opt.value;
          wrap.classList.remove('open');
          refresh();
          var evt = new Event('change', { bubbles: true });
          sel.dispatchEvent(evt);
          // Also fire input for input listeners
          var evt2 = new Event('input', { bubbles: true });
          sel.dispatchEvent(evt2);
        });
        menu.appendChild(item);
      });
    }

    function openMenu() {
      // close all other open menus first
      Array.prototype.forEach.call(document.querySelectorAll('.cs-wrap.open'), function (w) {
        if (w !== wrap) w.classList.remove('open');
      });
      buildMenu();
      wrap.classList.add('open');
    }

    trigger.addEventListener('click', function (e) {
      e.stopPropagation();
      if (wrap.classList.contains('open')) {
        wrap.classList.remove('open');
      } else {
        openMenu();
      }
    });

    // Override value setter so programmatic .value updates label automatically
    try {
      var protoDesc = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value');
      if (protoDesc && protoDesc.configurable !== false) {
        Object.defineProperty(sel, 'value', {
          configurable: true,
          enumerable: true,
          get: function () { return protoDesc.get.call(sel); },
          set: function (v) {
            protoDesc.set.call(sel, v);
            refresh();
          }
        });
      }
    } catch (e) {}

    // Watch external change events
    sel.addEventListener('change', refresh);

    // Expose refresh
    sel._csUpdate = refresh;

    // Initial
    refresh();
  });

  // Global close on outside click
  if (!document._csGlobalBound) {
    document._csGlobalBound = true;
    document.addEventListener('click', function () {
      Array.prototype.forEach.call(document.querySelectorAll('.cs-wrap.open'), function (w) {
        w.classList.remove('open');
      });
    });
  }
}

function refreshCustomSelectsIn(containerId) {
  var c = typeof containerId === 'string' ? $(containerId) : containerId;
  if (!c) return;
  Array.prototype.forEach.call(c.querySelectorAll('select'), function (s) {
    if (s._csUpdate) s._csUpdate();
  });
}

/* ---------- Table renderer ---------- */
function renderTable(list, compact) {
  var html = '<div class="table-wrap"><table><thead><tr>' +
    '<th>Date</th><th>Symbol</th><th>Side</th><th>Entry</th><th>Exit</th><th>Qty</th>' +
    '<th>Setup</th><th>P&L</th>' +
    (compact ? '' : '<th></th>') +
    '</tr></thead><tbody>';

  list.forEach(function (t) {
    var p = calcPnl(t);
    var cls = p > 0 ? 'pos' : p < 0 ? 'neg' : '';
    html += '<tr>' +
      '<td>' + (t.date || '—') + '</td>' +
      '<td><strong>' + escapeHtml(t.symbol || '') + '</strong></td>' +
      '<td><span class="pill ' + (t.side === 'BUY' ? 'pill-buy' : 'pill-sell') + '">' + (t.side === 'BUY' ? 'LONG' : 'SHORT') + '</span></td>' +
      '<td>' + (t.entry != null ? t.entry : '') + '</td>' +
      '<td>' + (t.exit != null ? t.exit : '') + '</td>' +
      '<td>' + (t.qty != null ? t.qty : '') + '</td>' +
      '<td>' + escapeHtml(t.setup || t.strategy || '—') + '</td>' +
      '<td class="' + cls + '"><strong>' + fmtMoney(p) + '</strong></td>' +
      (compact ? '' :
        '<td style="text-align:right;white-space:nowrap">' +
          '<button class="btn" data-action="view-trade" data-id="' + t.id + '" style="padding:5px 10px;font-size:12px;">View</button> ' +
          '<button class="btn" data-action="edit-trade" data-id="' + t.id + '" style="padding:5px 10px;font-size:12px;">Edit</button> ' +
          '<button class="btn btn-danger" data-action="delete-trade" data-id="' + t.id + '" style="padding:5px 10px;font-size:12px;">Del</button>' +
        '</td>') +
      '</tr>';
  });

  return html + '</tbody></table></div>';
}
