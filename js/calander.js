/* ============================================================
   calendar.js — Monthly calendar view
   ============================================================ */

var calCurrent = new Date();

function renderCalendar() {
  var year = calCurrent.getFullYear();
  var month = calCurrent.getMonth();

  var monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                    'July', 'August', 'September', 'October', 'November', 'December'];
  $('calMonth').textContent = monthNames[month] + ' ' + year;

  var firstDay = new Date(year, month, 1).getDay();
  var daysInMonth = new Date(year, month + 1, 0).getDate();
  var today = new Date();
  var isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;

  var byDate = {};
  trades.forEach(function (t) {
    if (!t.date) return;
    var d = t.date.slice(0, 10);
    if (!byDate[d]) byDate[d] = { pnl: 0, count: 0 };
    byDate[d].pnl += calcPnl(t);
    byDate[d].count++;
  });

  var html = '';
  for (var i = 0; i < firstDay; i++) {
    html += '<div class="cal-day empty-day"></div>';
  }

  var monthPnl = 0, monthTrades = 0, monthWins = 0, monthLosses = 0;

  for (var d = 1; d <= daysInMonth; d++) {
    var dateStr = year + '-' + String(month + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0');
    var dayData = byDate[dateStr];
    var cls = 'cal-day';
    if (isCurrentMonth && today.getDate() === d) cls += ' today';

    var pnlTxt = '';
    if (dayData) {
      cls += ' has-trades';
      if (dayData.pnl > 0) cls += ' win-day';
      else if (dayData.pnl < 0) cls += ' loss-day';
      pnlTxt = '<div class="d-pnl ' + (dayData.pnl > 0 ? 'pos' : dayData.pnl < 0 ? 'neg' : '') + '">' + fmtShort(dayData.pnl) + '</div>';
      monthPnl += dayData.pnl;
      monthTrades += dayData.count;
      if (dayData.pnl > 0) monthWins++;
      else if (dayData.pnl < 0) monthLosses++;
    }

    html += '<div class="' + cls + '" data-date="' + dateStr + '">' +
      '<div class="d-num">' + d + '</div>' +
      pnlTxt +
    '</div>';
  }

  $('calGrid').innerHTML = html;

  var summary = $('calSummary');
  summary.innerHTML =
    '<div class="mini"><div class="k">Month P&L</div><div class="v ' + (monthPnl > 0 ? 'pos' : monthPnl < 0 ? 'neg' : '') + '">' + fmtShort(monthPnl) + '</div></div>' +
    '<div class="mini"><div class="k">Trades</div><div class="v">' + monthTrades + '</div></div>' +
    '<div class="mini"><div class="k">Win Days</div><div class="v pos">' + monthWins + '</div></div>' +
    '<div class="mini"><div class="k">Loss Days</div><div class="v neg">' + monthLosses + '</div></div>';
}
