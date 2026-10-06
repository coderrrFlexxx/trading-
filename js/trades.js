/* ============================================================
   trades.js — Trade CRUD, modal, calculations
   Compatible with the current TradeVault trade form.
   ============================================================ */

var trades = [];
var editingTradeId = null;
var pendingTradeImages = [];

function calcPnl(t) {
  var entry = Number(t.entry) || 0;
  var exit = Number(t.exit) || 0;
  var qty = Number(t.qty) || 0;
  var diff = t.side === 'BUY' ? (exit - entry) : (entry - exit);
  return diff * qty;
}

function calcRMultiple(t) {
  if (t.stop == null || t.stop === '' || t.entry == null || t.qty == null) return null;
  var risk = Math.abs(Number(t.entry) - Number(t.stop)) * Number(t.qty);
  if (!risk || risk === 0) return null;
  return calcPnl(t) / risk;
}

function loadTrades() {
  trades = readStore(KEYS.trades, []);
  if (!Array.isArray(trades)) trades = [];
}

function saveTrades() {
  writeStore(KEYS.trades, trades);
}

function tradesSorted() {
  return trades.slice().sort(function (a, b) {
    return (b.date || '').localeCompare(a.date || '') ||
           ((b.createdAt || 0) - (a.createdAt || 0));
  });
}

function setField(id, value) {
  var el = $(id);
  if (el) el.value = value == null ? '' : value;
}

function getField(id) {
  var el = $(id);
  return el ? el.value : '';
}

function openTradeModal(trade) {
  editingTradeId = trade ? trade.id : null;
  pendingTradeImages = trade && Array.isArray(trade.images)
    ? trade.images.slice()
    : [];

  setField('tradeId', trade ? trade.id : '');

  var title = $('tradeModalTitle');
  if (title) {
    title.textContent = trade ? 'Edit Trade' : 'Add Trade';
  }

  setField(
    'tDate',
    trade ? (trade.date || todayISO()) : todayISO()
  );

  setField(
    'tSymbol',
    trade ? (trade.symbol || '') : ''
  );

  setField(
    'tSide',
    trade ? (trade.side || 'BUY') : 'BUY'
  );

  setField(
    'tSetup',
    trade ? (trade.setup || trade.strategy || '') : ''
  );

  setField(
    'tTimeframe',
    trade ? (trade.timeframe || '') : ''
  );

  setField(
    'tQty',
    trade ? (trade.qty != null ? trade.qty : '') : ''
  );

  setField(
    'tEntry',
    trade ? (trade.entry != null ? trade.entry : '') : ''
  );

  setField(
    'tExit',
    trade ? (trade.exit != null ? trade.exit : '') : ''
  );

  setField(
    'tStop',
    trade ? (trade.stop != null ? trade.stop : '') : ''
  );

  setField(
    'tTarget',
    trade ? (trade.target != null ? trade.target : '') : ''
  );

  setField(
    'tNetPnl',
    trade
      ? (trade.netPnl != null ? trade.netPnl : calcPnl(trade))
      : ''
  );

  setField(
    'tResultR',
    trade
      ? (
          trade.resultR != null
            ? trade.resultR
            : (
                calcRMultiple(trade) != null
                  ? calcRMultiple(trade).toFixed(2)
                  : ''
              )
        )
      : ''
  );

  setField(
    'tAdherence',
    trade ? (trade.adherence || 'followed') : 'followed'
  );

  setField(
    'tEmotion',
    trade ? (trade.emotion || trade.psych || '') : ''
  );

  setField(
    'tMistake',
    trade ? (trade.mistake || '') : ''
  );

  setField(
    'tEntryReason',
    trade ? (trade.entryReason || '') : ''
  );

  setField(
    'tExitReason',
    trade ? (trade.exitReason || '') : ''
  );

  setField(
    'tNotes',
    trade ? (trade.notes || '') : ''
  );

  var saveBtn = $('saveTradeBtn');

  if (saveBtn) {
    saveBtn.textContent = trade
      ? 'Update Trade'
      : 'Save Trade';
  }

  renderTradeImagePreview();
  updateTradeMiniBoxes();

  openModal('tradeModal');

  setTimeout(function () {
    var symbol = $('tSymbol');

    if (symbol) {
      symbol.focus();
    }
  }, 60);
}

function closeTradeModal() {
  closeModal('tradeModal');

  editingTradeId = null;
  pendingTradeImages = [];

  var f = $('tradeForm');

  if (f) {
    f.reset();
  }
}

function updateTradeMiniBoxes() {
  var entry = parseFloat(getField('tEntry'));
  var stop = parseFloat(getField('tStop'));
  var target = parseFloat(getField('tTarget'));
  var qty = parseFloat(getField('tQty'));

  var riskAmt =
    (!isNaN(entry) && !isNaN(stop) && !isNaN(qty))
      ? Math.abs(entry - stop) * qty
      : null;

  var plannedRR = null;

  var side = getField('tSide') || 'BUY';

  if (
    !isNaN(entry) &&
    !isNaN(stop) &&
    !isNaN(target)
  ) {
    var riskPerUnit = Math.abs(entry - stop);

    var rewardPerUnit =
      side === 'SELL'
        ? (entry - target)
        : (target - entry);

    if (riskPerUnit > 0) {
      plannedRR = rewardPerUnit / riskPerUnit;
    }
  }

  var riskEl = $('tRiskAmt');
  var riskPctEl = $('tRiskPct');
  var rrEl = $('tPlannedRR');

  if (riskEl) {
    riskEl.textContent =
      riskAmt == null ? '—' : fmtMoney(riskAmt);
  }

  if (riskPctEl) {
    riskPctEl.textContent =
      riskAmt == null ? '—' : '—';
  }

  if (rrEl) {
    rrEl.textContent =
      plannedRR == null
        ? '—'
        : plannedRR.toFixed(2) + 'R';
  }
}

function handleImageFiles(fileList) {
  if (!fileList || !fileList.length) {
    return;
  }

  Array.prototype.forEach.call(fileList, function (file) {
    if (
      !file ||
      !file.type ||
      file.type.indexOf('image/') !== 0
    ) {
      return;
    }

    var reader = new FileReader();

    reader.onload = function (e) {
      if (e.target && e.target.result) {
        pendingTradeImages.push(e.target.result);
        renderTradeImagePreview();
      }
    };

    reader.readAsDataURL(file);
  });
}

function renderTradeImagePreview() {
  var el = $('tPreview');

  if (!el) {
    return;
  }

  if (!pendingTradeImages.length) {
    el.innerHTML = '';
    return;
  }

  el.innerHTML = pendingTradeImages
    .map(function (src, i) {
      return (
        '<div class="img-preview-item">' +
          '<img src="' +
          src +
          '" alt="Trade chart ' +
          (i + 1) +
          '">' +
          '<button type="button" class="img-remove" ' +
          'data-img-index="' +
          i +
          '" aria-label="Remove image">×</button>' +
        '</div>'
      );
    })
    .join('');
}

function submitTrade(e) {
  if (e) {
    e.preventDefault();
  }

  var current = editingTradeId
    ? trades.filter(function (t) {
        return t.id === editingTradeId;
      })[0]
    : null;

  var data = {
    id: editingTradeId || uid('t'),

    symbol: getField('tSymbol')
      .trim()
      .toUpperCase(),

    side: getField('tSide') || 'BUY',

    entry: parseFloat(getField('tEntry')),

    exit: parseFloat(getField('tExit')),

    qty: parseFloat(getField('tQty')),

    date: getField('tDate'),

    stop:
      getField('tStop') !== ''
        ? parseFloat(getField('tStop'))
        : null,

    target:
      getField('tTarget') !== ''
        ? parseFloat(getField('tTarget'))
        : null,

    setup: getField('tSetup').trim(),

    /* Backward compatibility */
    strategy: getField('tSetup').trim(),

    timeframe: getField('tTimeframe').trim(),

    netPnl:
      getField('tNetPnl') !== ''
        ? parseFloat(getField('tNetPnl'))
        : null,

    resultR:
      getField('tResultR') !== ''
        ? parseFloat(getField('tResultR'))
        : calcRMultiple({
            entry: parseFloat(getField('tEntry')),
            exit: parseFloat(getField('tExit')),
            qty: parseFloat(getField('tQty')),
            stop:
              getField('tStop') !== ''
                ? parseFloat(getField('tStop'))
                : null,
            side: getField('tSide') || 'BUY'
          }),

    adherence:
      getField('tAdherence') || 'followed',

    emotion: getField('tEmotion').trim(),

    /* Backward compatibility */
    psych: getField('tEmotion').trim(),

    mistake: getField('tMistake').trim(),

    entryReason:
      getField('tEntryReason').trim(),

    exitReason:
      getField('tExitReason').trim(),

    notes:
      getField('tNotes').trim(),

    images:
      pendingTradeImages.slice(),

    createdAt:
      current
        ? (current.createdAt || Date.now())
        : Date.now()
  };

  if (
    !data.symbol ||
    isNaN(data.entry) ||
    isNaN(data.exit) ||
    isNaN(data.qty) ||
    !data.date
  ) {
    toast('Please fill all required fields');
    return;
  }

  if (editingTradeId) {
    for (var i = 0; i < trades.length; i++) {
      if (trades[i].id === editingTradeId) {
        trades[i] = data;
        break;
      }
    }

    toast('Trade updated');

  } else {

    trades.push(data);

    toast('Trade added');
  }

  saveTrades();

  closeTradeModal();

  go(currentPage || 'dashboard');
}

function deleteTrade(id) {
  showConfirm(
    'Delete Trade',
    'Are you sure you want to delete this trade?',
    function () {

      trades = trades.filter(function (t) {
        return t.id !== id;
      });

      saveTrades();

      toast('Trade deleted');

      go(currentPage || 'dashboard');
    }
  );
}

function editTrade(id) {
  var t = trades.filter(function (x) {
    return x.id === id;
  })[0];

  if (t) {
    openTradeModal(t);
  }
}

/* Remove selected chart image */
document.addEventListener('click', function (e) {

  var btn =
    e.target &&
    e.target.closest
      ? e.target.closest('[data-img-index]')
      : null;

  if (!btn) {
    return;
  }

  var idx =
    parseInt(
      btn.getAttribute('data-img-index'),
      10
    );

  if (!isNaN(idx)) {

    pendingTradeImages.splice(idx, 1);

    renderTradeImagePreview();
  }
});
