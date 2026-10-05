/* ============================================================
   risk.js — Risk Calculator
   ============================================================ */

var lastRiskCalc = null;

function calcRisk() {
  var balance = parseFloat($('rBalance').value) || 0;
  var riskPct = parseFloat($('rRiskPct').value) || 0;
  var entry = parseFloat($('rEntry').value) || 0;
  var stop = parseFloat($('rStop').value) || 0;
  var target = parseFloat($('rTarget').value) || 0;
  var side = $('rSide').value;

  var out = $('riskResult');
  if (!out) return;

  if (!balance || !riskPct || !entry || !stop) {
    out.innerHTML =
      '<div class="risk-box"><div class="k">₹ Risk</div><div class="v">—</div></div>' +
      '<div class="risk-box"><div class="k">Risk / Unit</div><div class="v">—</div></div>' +
      '<div class="risk-box"><div class="k">Position Size</div><div class="v">—</div></div>' +
      '<div class="risk-box"><div class="k">R:R</div><div class="v">—</div></div>' +
      '<div class="risk-box"><div class="k">Target Profit ₹</div><div class="v">—</div></div>' +
      '<div class="risk-box"><div class="k">Capital Used ₹</div><div class="v">—</div></div>';
    lastRiskCalc = null;
    return;
  }

  var riskAmount = (balance * riskPct) / 100;
  var perUnitRisk = Math.abs(entry - stop);
  if (perUnitRisk <= 0) { lastRiskCalc = null; return; }

  var qty = riskAmount / perUnitRisk;
  var positionValue = qty * entry;
  var rr = 0, potentialProfit = 0;
  if (target && entry !== target) {
    var reward = Math.abs(target - entry);
    rr = reward / perUnitRisk;
    potentialProfit = reward * qty;
  }

  out.innerHTML =
    '<div class="risk-box"><div class="k">₹ Risk</div><div class="v neg">' + fmtMoney(riskAmount) + '</div></div>' +
    '<div class="risk-box"><div class="k">Risk / Unit</div><div class="v">' + fmtMoney(perUnitRisk) + '</div></div>' +
    '<div class="risk-box"><div class="k">Position Size</div><div class="v">' + qty.toFixed(2) + '</div></div>' +
    '<div class="risk-box"><div class="k">R:R</div><div class="v">' + (rr ? rr.toFixed(2) + ' : 1' : '—') + '</div></div>' +
    '<div class="risk-box"><div class="k">Target Profit ₹</div><div class="v pos">' + (potentialProfit ? fmtMoney(potentialProfit) : '—') + '</div></div>' +
    '<div class="risk-box"><div class="k">Capital Used ₹</div><div class="v">' + fmtMoney(positionValue) + '</div></div>';

  lastRiskCalc = {
    entry: entry, stop: stop, target: target, qty: qty, side: side
  };
}

function useRiskInTrade() {
  if (!lastRiskCalc) { toast('Fill the risk calculator first'); return; }
  var d = lastRiskCalc;
  openTradeModal();
  $('tEntry').value = d.entry;
  $('tStop').value = d.stop;
  $('tTarget').value = d.target;
  $('tQty').value = d.qty.toFixed(2);
  $('tSide').value = d.side;
}

function initRisk() {
  ['rBalance', 'rRiskPct', 'rEntry', 'rStop', 'rTarget', 'rSide'].forEach(function (id) {
    var el = $(id);
    if (el) {
      el.addEventListener('input', calcRisk);
      el.addEventListener('change', calcRisk);
    }
  });
  var btn = $('useInAddTrade');
  if (btn) btn.addEventListener('click', useRiskInTrade);
  calcRisk();
}
