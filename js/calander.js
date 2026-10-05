/* ============================================================
   calendar.js — Monthly calendar view (FIXED)
   ============================================================ */

var calCurrent = new Date();

function renderCalendar() {
  try {
    var year = calCurrent.getFullYear();
    var month = calCurrent.getMonth();
    var monthNames = ['January','February','March','April','May','June',
                      'July','August','September','October','November','December'];
    var el = $('calMonth');
    if (el) el.textContent = monthNames[month] + ' ' + year;

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
    for (var i = 0; i < firstDay; i++) {
      html += '<div class="cal-day empty-day"></div>';
    }

    var monthPnl = 0, monthTrades = 0, monthWins = 0, monthLosses = 0;

    for (var d = 1; d <= daysInMonth; d++) {
      var mm = String(month + 1);
      if (mm.length < 2) mm = '0' + mm;
      var dd = String(d);
      if (dd.length < 2) dd = '0' + dd;
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
        '<div class="d-num">' + d + '</div>' +
        pnlTxt +
      '</div>';
    }

    var grid = $('calGrid');
    if (grid) grid.innerHTML = html;

    var summary = $('calSummary');
    if (summary) {
      summary.innerHTML =
        '<div class="mini"><div class="k">Month P&L</div><div class="v ' + (monthPnl > 0 ? 'pos' : monthPnl < 0 ? 'neg' : '') + '">' + fmtShort(monthPnl) + '</div></div>' +
        '<div class="mini"><div class="k">Trades</div><div class="v">' + monthTrades + '</div></div>' +
        '<div class="mini"><div class="k">Win Days</div><div class="v pos">' + monthWins + '</div></div>' +
        '<div class="mini"><div class="k">Loss Days</div><div class="v neg">' + monthLosses + '</div></div>';
    }
  } catch (err) {
    console.error('Calendar error:', err);
  }
}
