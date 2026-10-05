/* ============================================================
   playbook.js — Strategies CRUD
   ============================================================ */

var playbook = [];
var editingPlaybookId = null;

function loadPlaybook() {
  playbook = readStore(KEYS.playbook, []);
  if (!Array.isArray(playbook)) playbook = [];
}

function savePlaybook() {
  writeStore(KEYS.playbook, playbook);
}

function renderPlaybook() {
  var cont = $('playbookList');
  if (!playbook.length) {
    cont.innerHTML = '<div class="empty">No strategies yet. Add your first strategy to build your playbook.</div>';
    return;
  }

  cont.innerHTML = playbook.map(function (p) {
    var rulesHtml = '';
    if (p.rules) {
      rulesHtml = '<div class="item-body">' + escapeHtml(p.rules) + '</div>';
    }
    return '<div class="item-card">' +
      '<div class="item-head">' +
        '<div>' +
          '<div class="item-title">' + escapeHtml(p.name) + '</div>' +
          '<div class="item-meta">' + (p.rules ? p.rules.split('\n').filter(Boolean).length + ' rules' : 'No rules') + '</div>' +
        '</div>' +
        '<div class="item-actions">' +
          '<button class="btn" data-action="edit-playbook" data-id="' + p.id + '" style="padding:5px 10px;font-size:12px;">Edit</button> ' +
          '<button class="btn btn-danger" data-action="delete-playbook" data-id="' + p.id + '" style="padding:5px 10px;font-size:12px;">Delete</button>' +
        '</div>' +
      '</div>' +
      (p.description ? '<div class="item-body">' + escapeHtml(p.description) + '</div>' : '') +
      rulesHtml +
    '</div>';
  }).join('');
}

function openPlaybookModal(item) {
  editingPlaybookId = item ? item.id : null;
  $('playbookModalTitle').textContent = item ? 'Edit Strategy' : 'New Strategy';
  $('pbId').value = item ? item.id : '';
  $('pbName').value = item ? item.name : '';
  $('pbDesc').value = item ? (item.description || '') : '';
  $('pbRules').value = item ? (item.rules || '') : '';
  openModal('playbookModal');
  setTimeout(function () { $('pbName').focus(); }, 60);
}

function closePlaybookModal() {
  closeModal('playbookModal');
  editingPlaybookId = null;
  var f = $('playbookForm');
  if (f) f.reset();
}

function submitPlaybook(e) {
  if (e) e.preventDefault();
  var name = ($('pbName').value || '').trim();
  if (!name) { toast('Strategy name is required'); return; }

  var data = {
    id: editingPlaybookId || uid('pb'),
    name: name,
    description: ($('pbDesc').value || '').trim(),
    rules: ($('pbRules').value || '').trim(),
    createdAt: Date.now()
  };

  if (editingPlaybookId) {
    for (var i = 0; i < playbook.length; i++) {
      if (playbook[i].id === editingPlaybookId) { data.createdAt = playbook[i].createdAt || Date.now(); playbook[i] = data; break; }
    }
    toast('Strategy updated');
  } else {
    playbook.push(data);
    toast('Strategy added');
  }

  savePlaybook();
  closePlaybookModal();
  renderPlaybook();
}

function editPlaybook(id) {
  var item = playbook.filter(function (p) { return p.id === id; })[0];
  if (item) openPlaybookModal(item);
}

function deletePlaybook(id) {
  showConfirm('Delete Strategy', 'Delete this strategy permanently?', function () {
    playbook = playbook.filter(function (p) { return p.id !== id; });
    savePlaybook();
    toast('Strategy deleted');
    renderPlaybook();
  });
}
