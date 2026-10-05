/* ============================================================
   risk.js — Position size calculator
   ============================================================ */

function calcRisk() {
  var balance = parseFloat($('rBalance').value) || 0;
  var riskPct = parseFloat($('rRiskPct').value) || 0;
  var entry = parseFloat($('rEntry').value) || 0;
  var stop = parseFloat($('rStop').value) || 0;
  var target = parseFloat($('rTarget').value) || 0;
  var side = $('rSide').value;

  var out = $('riskResult');
  if (!balance || !riskPct || !entry || !stop) {
    out.innerHTML = '<div class="empty">Fill account balance, risk %, entry and stop loss to see results.</div>';
    return;
  }

  var riskAmount = (balance * riskPct) / 100;
  var perUnitRisk = Math.abs(entry - stop);
  if (perUnitRisk <= 0) {
    out.innerHTML = '<div class="empty">Stop loss must differ from entry price.</div>';
    return;
  }

  var qty = riskAmount / perUnitRisk;
  var positionValue = qty * entry;

  var rr = 0;
  if (target && entry !== target) {
    var reward = Math.abs(target - entry);
    rr = reward / perUnitRisk;
  }

  var potentialProfit = target ? Math.abs(target - entry) * qty : 0;

  var html = '<div class="mini-stats">' +
    '<div class="mini"><div class="k">Risk Amount</div><div class="v neg">' + fmtMoney(riskAmount) + '</div></div>' +
    '<div class="mini"><div class="k">Position Size</div><div class="v">' + qty.toFixed(2) + ' units</div></div>' +
    '<div class="mini"><div class="k">Position Value</div><div class="v">' + fmtMoney(positionValue) + '</div></div>' +
    '<div class="mini"><div class="k">Risk per Unit</div><div class="v">' + fmtMoney(perUnitRisk) + '</div></div>' +
    (rr ? '<div class="mini"><div class="k">Risk : Reward</div><div class="v">' + rr.toFixed(2) + ' : 1</div></div>' : '') +
    (potentialProfit ? '<div class="mini"><div class="k">Potential Profit</div><div class="v pos">' + fmtMoney(potentialProfit) + '</div></div>' : '') +
    '<div class="mini"><div class="k">Direction</div><div class="v">' + side + '</div></div>' +
  '</div>';

  out.innerHTML = html;
}

function initRisk() {
  ['rBalance', 'rRiskPct', 'rEntry', 'rStop', 'rTarget', 'rSide'].forEach(function (id) {
    var el = $(id);
    if (el) {
      el.addEventListener('input', calcRisk);
      el.addEventListener('change', calcRisk);
    }
  });
}
