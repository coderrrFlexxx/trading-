/* ============================================================
   ui.js — Shared helpers: DOM, formatters, toast, theme, modals
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

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

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
  var sel = $('themeSelect');
  if (sel) sel.value = theme;
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

/* Confirm modal with callback */
var _confirmCallback = null;
function showConfirm(title, message, callback) {
  $('confirmTitle').textContent = title;
  $('confirmMsg').textContent = message;
  _confirmCallback = callback;
  openModal('confirmModal');
}

/* ---------- Table renderer ---------- */
function renderTable(list, compact, actions) {
  var html = '<div class="table-wrap"><table><thead><tr>' +
    '<th>Date</th><th>Symbol</th><th>Side</th><th>Entry</th><th>Exit</th><th>Qty</th>' +
    '<th>Strategy</th><th>P&L</th>' +
    (compact ? '' : '<th></th>') +
    '</tr></thead><tbody>';

  list.forEach(function (t) {
    var p = calcPnl(t);
    var cls = p > 0 ? 'pos' : p < 0 ? 'neg' : '';
    html += '<tr>' +
      '<td>' + (t.date || '—') + '</td>' +
      '<td><strong>' + escapeHtml(t.symbol || '') + '</strong></td>' +
      '<td><span class="pill ' + (t.side === 'BUY' ? 'pill-buy' : 'pill-sell') + '">' + (t.side || '') + '</span></td>' +
      '<td>' + (t.entry != null ? t.entry : '') + '</td>' +
      '<td>' + (t.exit != null ? t.exit : '') + '</td>' +
      '<td>' + (t.qty != null ? t.qty : '') + '</td>' +
      '<td>' + escapeHtml(t.strategy || '—') + '</td>' +
      '<td class="' + cls + '"><strong>' + fmtMoney(p) + '</strong></td>' +
      (compact ? '' :
        '<td style="text-align:right;white-space:nowrap">' +
          '<button class="btn" data-action="edit-trade" data-id="' + t.id + '" style="padding:5px 10px;font-size:12px;">Edit</button> ' +
          '<button class="btn btn-danger" data-action="delete-trade" data-id="' + t.id + '" style="padding:5px 10px;font-size:12px;">Delete</button>' +
        '</td>') +
      '</tr>';
  });

  return html + '</tbody></table></div>';
}
