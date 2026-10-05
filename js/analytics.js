/* ============================================================
   analytics.js — Dashboard + Analytics
   ============================================================ */

function statsFor(list) {
  var pnls = list.map(calcPnl);
  var rMults = list.map(calcRMultiple).filter(function (v) { return v != null; });
  var wins = list.filter(function (t) { return calcPnl(t) > 0; });
  var losses = list.filter(function (t) { return calcPnl(t) < 0; });
  var total = list.length;
  var netPnl = pnls.reduce(function (s, v) { return s + v; }, 0);
  var totalR = rMults.reduce(function (s, v) { return s + v; }, 0);
  var winRate = total ? (wins.length / total) * 100 : 0;
  var totalWin = wins.reduce(function (s, t) { return s + calcPnl(t); }, 0);
  var totalLoss = Math.abs(losses.reduce(function (s, t) { return s + calcPnl(t); }, 0));
  var avgWin = wins.length ? totalWin / wins.length : 0;
  var avgLoss = losses.length ? totalLoss / losses.length : 0;
  var pf = totalLoss ? totalWin / totalLoss : (totalWin > 0 ? Infinity : 0);
  var expectancy = total ? netPnl / total : 0;

  var runR = 0, peakR = 0, maxDDR = 0;
  rMults.forEach(function (r) {
    runR += r;
    if (runR > peakR) peakR = runR;
    var dd = peakR - runR;
    if (dd > maxDDR) maxDDR = dd;
  });

  var sorted = list.slice().sort(function (a, b) {
    return (b.date || '').localeCompare(a.date || '') ||
           ((b.createdAt || 0) - (a.createdAt || 0));
  });
  var streak = 0, streakType = 'none';
  for (var i = 0; i < sorted.length; i++) {
    var p = calcPnl(sorted[i]);
    if (p > 0) { if (streakType === 'none') streakType = 'win'; else if (streakType === 'loss') break; streak++; }
    else if (p < 0) { if (streakType === 'none') streakType = 'loss'; else if (streakType === 'win') break; streak++; }
    else break;
  }

  return {
    total: total, netPnl: netPnl, totalR: totalR, winRate: winRate,
    wins: wins.length, losses: losses.length,
    avgWin: avgWin, avgLoss: avgLoss, pf: pf, expectancy: expectancy,
    maxDDR: maxDDR, streak: streak, streakType: streakType,
    best: pnls.length ? Math.max.apply(null, pnls) : 0,
    worst: pnls.length ? Math.min.apply(null, pnls) : 0
  };
}

function renderDashboard() {
  var s = statsFor(trades);

  var pnlEl = $('dashPnl');
  pnlEl.textContent = (s.netPnl >= 0 ? '+' : '') + fmtMoney(s.netPnl);
  pnlEl.className = 'stat-value ' + (s.netPnl > 0 ? 'pos' : s.netPnl < 0 ? 'neg' : '');
  $('dashPnlSub').textContent = s.total + ' trades';

  var trEl = $('dashTotalR');
  trEl.textContent = (s.totalR >= 0 ? '+' : '') + s.totalR.toFixed(2) + 'R';
  trEl.className = 'stat-value ' + (s.totalR > 0 ? 'pos' : s.totalR < 0 ? 'neg' : '');
  $('dashTotalRSub').textContent = 'Sum of R-multiples';

  $('dashWinRate').textContent = s.winRate.toFixed(1) + '%';
  $('dashWinSub').textContent = s.wins + ' wins / ' + s.total + ' total';
  $('dashTrades').textContent = s.total;

  $('dashPF').textContent = s.pf === Infinity ? '∞' : s.pf ? s.pf.toFixed(2) : '—';
  $('dashExp').textContent = s.total ? fmtShort(s.expectancy) : '—';
  $('dashMaxDD').textContent = s.maxDDR.toFixed(2) + 'R';
  $('dashBest').textContent = s.total ? fmtShort(s.best) : '—';
  $('dashAvgWin').textContent = s.wins ? fmtShort(s.avgWin) : '—';
  $('dashAvgLoss').textContent = s.losses ? fmtShort(-s.avgLoss) : '—';

  renderEquityCurve();
  renderStreak(s);

  var recent = tradesSorted().slice(0, 5);
  var cont = $('dashRecent');
  if (!recent.length) {
    cont.innerHTML = '<div class="empty"><strong>Your journal is empty</strong>Start with one completed trade.</div>';
  } else {
    cont.innerHTML = renderTable(recent, true);
  }
}

function renderEquityCurve() {
  var cont = $('equityCurve');
  if (!cont) return;
  var sorted = trades.slice().sort(function (a, b) {
    return (a.date || '').localeCompare(b.date || '') ||
           ((a.createdAt || 0) - (b.createdAt || 0));
  });
  if (sorted.length < 2) {
    cont.innerHTML = '<div class="curve-empty"><div><strong>No curve yet</strong>Your curve appears after trades are added.</div></div>';
    return;
  }

  var cum = 0;
  var points = [0];
  sorted.forEach(function (t) { cum += calcPnl(t); points.push(cum); });

  var min = Math.min.apply(null, points);
  var max = Math.max.apply(null, points);
  if (min === max) max = min + 1;
  var range = max - min;

  var W = 600, H = 180, pad = 16;
  var stepX = (W - pad * 2) / (points.length - 1);
  var coords = points.map(function (v, i) {
    var x = pad + i * stepX;
    var y = pad + (H - pad * 2) * (1 - (v - min) / range);
    return [x, y];
  });

  var path = coords.map(function (c, i) {
    return (i === 0 ? 'M' : 'L') + c[0].toFixed(1) + ' ' + c[1].toFixed(1);
  }).join(' ');
  var areaPath = path + ' L' + coords[coords.length - 1][0].toFixed(1) + ' ' + (H - pad) + ' L' + coords[0][0].toFixed(1) + ' ' + (H - pad) + ' Z';

  var lastPos = points[points.length - 1] >= 0;
  var color = lastPos ? '#16a34a' : '#dc2626';

  var svg = '<svg class="curve-svg" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none">' +
    '<defs><linearGradient id="curveGrad" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" stop-color="' + color + '" stop-opacity=".5"/>' +
      '<stop offset="1" stop-color="' + color + '" stop-opacity="0"/>' +
    '</linearGradient></defs>' +
    '<path class="curve-area" d="' + areaPath + '" fill="url(#curveGrad)"/>' +
    '<path class="curve-line" d="' + path + '" style="stroke:' + (lastPos ? 'var(--green)' : 'var(--red)') + '"/>' +
  '</svg>';

  cont.innerHTML = '<div class="curve-wrap">' + svg + '</div>';
  $('eqCurveSub').textContent = (points[points.length - 1] >= 0 ? '+' : '') + fmtMoney(points[points.length - 1]);
}

function renderStreak(s) {
  var cont = $('dashStreak');
  if (!cont) return;
  if (s.streakType === 'none' || s.streak === 0) {
    cont.innerHTML = '<div class="streak-big">0</div><div class="streak-label">No trades recorded yet.</div>';
    return;
  }
  var word = s.streakType === 'win' ? 'winning' : 'losing';
  var cls = s.streakType === 'win' ? 'pos' : 'neg';
  cont.innerHTML =
    '<div class="streak-big ' + cls + '">' + s.streak + ' ' + word + ' trade' + (s.streak > 1 ? 's' : '') + '</div>' +
    '<div class="streak-label">in current streak. Based on your latest recorded trades.</div>';
}

function renderAnalytics() {
  var period = $('anPeriod') ? $('anPeriod').value : 'all';
  var symbol = $('anSymbol') ? ($('anSymbol').value || '').toLowerCase() : '';

  var filtered = trades.slice();
  if (period !== 'all') {
    var days = parseInt(period, 10);
    var cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    var cutStr = cutoff.toISOString().slice(0, 10);
    filtered = filtered.filter(function (t) { return (t.date || '') >= cutStr; });
  }
  if (symbol) filtered = filtered.filter(function (t) { return (t.symbol || '').toLowerCase().indexOf(symbol) > -1; });

  var s = statsFor(filtered);

  $('anPF').textContent = s.pf === Infinity ? '∞' : s.pf ? s.pf.toFixed(2) : '—';
  $('anExp').textContent = s.total ? fmtShort(s.expectancy) : '—';
  $('anDD').textContent = s.maxDDR.toFixed(2) + 'R';

  var withPsych = filtered.filter(function (t) { return (t.psych || '').trim() !== ''; });
  var adherencePct = filtered.length ? Math.round((1 - withPsych.length / filtered.length) * 100) : 0;
  $('anAdherence').textContent = adherencePct + '%';

  renderRCurve(filtered);
  renderDirection(filtered);
  renderSetupPerf(filtered);
  renderPsych(filtered);
}

function renderRCurve(list) {
  var cont = $('rCurve');
  if (!cont) return;
  var sorted = list.slice().sort(function (a, b) {
    return (a.date || '').localeCompare(b.date || '') ||
           ((a.createdAt || 0) - (b.createdAt || 0));
  }).filter(function (t) { return calcRMultiple(t) != null; });

  if (sorted.length < 2) {
    cont.innerHTML = '<div class="curve-empty"><div><strong>No curve yet</strong>Your curve appears after trades are added.</div></div>';
    return;
  }

  var cum = 0;
  var points = [0];
  sorted.forEach(function (t) { cum += calcRMultiple(t) || 0; points.push(cum); });

  var min = Math.min.apply(null, points);
  var max = Math.max.apply(null, points);
  if (min === max) max = min + 1;
  var range = max - min;

  var W = 600, H = 180, pad = 16;
  var stepX = (W - pad * 2) / (points.length - 1);
  var coords = points.map(function (v, i) {
    var x = pad + i * stepX;
    var y = pad + (H - pad * 2) * (1 - (v - min) / range);
    return [x, y];
  });

  var path = coords.map(function (c, i) {
    return (i === 0 ? 'M' : 'L') + c[0].toFixed(1) + ' ' + c[1].toFixed(1);
  }).join(' ');
  var lastVal = points[points.length - 1];
  var color = lastVal >= 0 ? 'var(--green)' : 'var(--red)';

  cont.innerHTML = '<div class="curve-wrap"><svg class="curve-svg" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none">' +
    '<path class="curve-line" d="' + path + '" style="stroke:' + color + '"/>' +
  '</svg></div>';
}

function renderDirection(list) {
  var cont = $('anDirection');
  if (!cont) return;
  var groups = { BUY: [], SELL: [] };
  list.forEach(function (t) { if (groups[t.side]) groups[t.side].push(t); });

  var html = '';
  ['BUY', 'SELL'].forEach(function (side) {
    var arr = groups[side];
    var total = arr.length;
    var wins = arr.filter(function (t) { return calcPnl(t) > 0; }).length;
    var rSum = arr.reduce(function (s, t) { var r = calcRMultiple(t); return s + (r || 0); }, 0);
    var wr = total ? (wins / total) * 100 : 0;
    var name = side === 'BUY' ? 'Long' : 'Short';
    html += '<div class="dir-row">' +
      '<div>' +
        '<div class="dir-name">' + name + '</div>' +
        '<div class="dir-sub">' + total + ' trades · ' + wr.toFixed(0) + '% win</div>' +
      '</div>' +
      '<div class="dir-val ' + (rSum > 0 ? 'pos' : rSum < 0 ? 'neg' : '') + '">' + (rSum >= 0 ? '+' : '') + rSum.toFixed(2) + 'R</div>' +
    '</div>';
  });
  cont.innerHTML = html;
}

function renderSetupPerf(list) {
  var cont = $('anSetup');
  if (!cont) return;
  var map = {};
  list.forEach(function (t) {
    var s = (t.setup || '').trim() || 'Unassigned';
    if (!map[s]) map[s] = { count: 0, wins: 0, pnl: 0, r: 0 };
    map[s].count++;
    var p = calcPnl(t);
    map[s].pnl += p;
    if (p > 0) map[s].wins++;
    var r = calcRMultiple(t);
    if (r != null) map[s].r += r;
  });
  var keys = Object.keys(map);
  if (!keys.length || (keys.length === 1 && keys[0] === 'Unassigned' && map.Unassigned.count === list.length)) {
    cont.innerHTML = '<div class="empty">No setup data yet.</div>';
    return;
  }
  keys.sort(function (a, b) { return map[b].r - map[a].r; });
  cont.innerHTML = keys.map(function (k) {
    var d = map[k];
    var wr = d.count ? (d.wins / d.count) * 100 : 0;
    return '<div class="setup-row">' +
      '<div><div class="setup-name">' + escapeHtml(k) + '</div>' +
        '<div class="setup-meta">' + d.count + ' trades · ' + wr.toFixed(0) + '% win</div></div>' +
      '<div class="setup-val ' + (d.r > 0 ? 'pos' : d.r < 0 ? 'neg' : '') + '">' + (d.r >= 0 ? '+' : '') + d.r.toFixed(2) + 'R</div>' +
    '</div>';
  }).join('');
}

function renderPsych(list) {
  var cont = $('anPsych');
  if (!cont) return;
  var map = {};
  list.forEach(function (t) {
    var p = (t.psych || '').trim();
    if (!p) return;
    if (!map[p]) map[p] = { count: 0, r: 0, pnl: 0 };
    map[p].count++;
    var r = calcRMultiple(t);
    if (r != null) map[p].r += r;
    map[p].pnl += calcPnl(t);
  });
  var keys = Object.keys(map);
  if (!keys.length) {
    cont.innerHTML = '<div class="empty">No psychology data yet.</div>';
    return;
  }
  keys.sort(function (a, b) { return map[a].r - map[b].r; });
  cont.innerHTML = keys.map(function (k) {
    var d = map[k];
    return '<div class="setup-row">' +
      '<div><div class="setup-name">' + escapeHtml(k) + '</div>' +
        '<div class="setup-meta">' + d.count + ' trades</div></div>' +
      '<div class="setup-val ' + (d.r > 0 ? 'pos' : d.r < 0 ? 'neg' : '') + '">' + (d.r >= 0 ? '+' : '') + d.r.toFixed(2) + 'R</div>' +
    '</div>';
  }).join('');
}
