/* ============================================================
   analytics.js — Dashboard, analytics, charts
   ============================================================ */

function renderDashboard() {
  var total = trades.length;
  var pnl = trades.reduce(function (s, t) { return s + calcPnl(t); }, 0);
  var winArr = trades.filter(function (t) { return calcPnl(t) > 0; });
  var lossArr = trades.filter(function (t) { return calcPnl(t) < 0; });
  var winRate = total ? (winArr.length / total) * 100 : 0;
  var avgWin = winArr.length ? winArr.reduce(function (s, t) { return s + calcPnl(t); }, 0) / winArr.length : 0;
  var avgLoss = lossArr.length ? Math.abs(lossArr.reduce(function (s, t) { return s + calcPnl(t); }, 0) / lossArr.length) : 0;
  var rr = avgLoss ? (avgWin / avgLoss) : 0;

  var pnlEl = $('dashPnl');
  pnlEl.textContent = fmtMoney(pnl);
  pnlEl.className = 'stat-value ' + (pnl > 0 ? 'pos' : pnl < 0 ? 'neg' : '');
  $('dashPnlSub').textContent = total + ' trades';
  $('dashWinRate').textContent = winRate.toFixed(1) + '%';
  $('dashWinSub').textContent = winArr.length + ' wins / ' + total + ' total';
  $('dashTrades').textContent = total;
  $('dashRR').textContent = rr ? rr.toFixed(2) + ' : 1' : '—';

  var recent = tradesSorted().slice(0, 5);
  var cont = $('dashRecent');
  if (!recent.length) {
    cont.innerHTML = '<div class="empty">No trades yet. Click "Add Trade" to get started.</div>';
    return;
  }
  cont.innerHTML = renderTable(recent, true);
}

function renderAnalytics() {
  var winArr = trades.filter(function (t) { return calcPnl(t) > 0; });
  var lossArr = trades.filter(function (t) { return calcPnl(t) < 0; });
  var beArr = trades.filter(function (t) { return calcPnl(t) === 0; });
  var total = trades.length;
  var winRate = total ? (winArr.length / total) * 100 : 0;

  $('donut').style.setProperty('--p', winRate.toFixed(1));
  $('donutVal').textContent = winRate.toFixed(0) + '%';
  $('legendWins').textContent = winArr.length + ' Wins';
  $('legendLosses').textContent = lossArr.length + ' Losses';
  $('legendBE').textContent = beArr.length + ' Breakeven';

  var recent = tradesSorted().slice(0, 20).reverse();
  var chart = $('pnlChart');
  if (!recent.length) {
    chart.innerHTML = '<div class="empty" style="width:100%">No data yet.</div>';
  } else {
    var maxAbs = Math.max.apply(null, recent.map(function (t) {
      return Math.abs(calcPnl(t));
    }).concat([1]));

    chart.innerHTML = recent.map(function (t) {
      var p = calcPnl(t);
      var h = Math.max((Math.abs(p) / maxAbs) * 100, 4);
      var cls = p > 0 ? 'pos' : p < 0 ? 'neg' : '';
      return '<div class="bar-wrap" title="' + escapeHtml(t.symbol) + ' ' + fmtMoney(p) + '">' +
        '<div style="flex:1;display:flex;align-items:flex-end;width:100%">' +
          '<div class="bar ' + cls + '" style="height:' + h + '%"></div>' +
        '</div>' +
        '<div class="bar-label">' + escapeHtml((t.symbol || '').slice(0, 4)) + '</div>' +
      '</div>';
    }).join('');
  }

  var pnls = trades.map(calcPnl);
  var best = pnls.length ? Math.max.apply(null, pnls) : 0;
  var worst = pnls.length ? Math.min.apply(null, pnls) : 0;
  var totalWin = winArr.reduce(function (s, t) { return s + calcPnl(t); }, 0);
  var totalLoss = Math.abs(lossArr.reduce(function (s, t) { return s + calcPnl(t); }, 0));
  var avgWin = winArr.length ? totalWin / winArr.length : 0;
  var avgLoss = lossArr.length ? totalLoss / lossArr.length : 0;
  var pf = totalLoss ? (totalWin / totalLoss) : (totalWin > 0 ? Infinity : 0);
  var expectancy = total ? (pnls.reduce(function (s, v) { return s + v; }, 0) / total) : 0;

  $('aBest').textContent = fmtShort(best);
  $('aWorst').textContent = fmtShort(worst);
  $('aAvgWin').textContent = fmtShort(avgWin);
  $('aAvgLoss').textContent = fmtShort(avgLoss);
  $('aPF').textContent = pf === Infinity ? '∞' : pf ? pf.toFixed(2) : '—';
  $('aExp').textContent = fmtShort(expectancy);

  renderStrategyBreakdown();
}

function renderStrategyBreakdown() {
  var map = {};
  trades.forEach(function (t) {
    var s = (t.strategy || 'Unassigned').trim() || 'Unassigned';
    if (!map[s]) map[s] = { count: 0, wins: 0, pnl: 0 };
    map[s].count++;
    var p = calcPnl(t);
    map[s].pnl += p;
    if (p > 0) map[s].wins++;
  });

  var cont = $('strategyBreakdown');
  var keys = Object.keys(map);
  if (!keys.length) {
    cont.innerHTML = '<div class="empty">No strategy data available.</div>';
    return;
  }

  keys.sort(function (a, b) { return map[b].pnl - map[a].pnl; });

  var html = '<div class="table-wrap"><table><thead><tr>' +
    '<th>Strategy</th><th>Trades</th><th>Win Rate</th><th>Net P&L</th>' +
    '</tr></thead><tbody>';

  keys.forEach(function (k) {
    var d = map[k];
    var wr = d.count ? (d.wins / d.count) * 100 : 0;
    var cls = d.pnl > 0 ? 'pos' : d.pnl < 0 ? 'neg' : '';
    html += '<tr>' +
      '<td><strong>' + escapeHtml(k) + '</strong></td>' +
      '<td>' + d.count + '</td>' +
      '<td>' + wr.toFixed(1) + '%</td>' +
      '<td class="' + cls + '"><strong>' + fmtMoney(d.pnl) + '</strong></td>' +
    '</tr>';
  });

  cont.innerHTML = html + '</tbody></table></div>';
}
