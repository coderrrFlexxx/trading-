/* ============================================================
   reviews.js — Trade reviews CRUD
   ============================================================ */

var reviews = [];
var editingReviewId = null;

function loadReviews() {
  reviews = readStore(KEYS.reviews, []);
  if (!Array.isArray(reviews)) reviews = [];
}

function saveReviews() {
  writeStore(KEYS.reviews, reviews);
}

function renderReviews() {
  var cont = $('reviewsList');
  if (!reviews.length) {
    cont.innerHTML = '<div class="empty">No reviews yet. Start journaling your learnings.</div>';
    return;
  }

  var sorted = reviews.slice().sort(function (a, b) {
    return (b.date || '').localeCompare(a.date || '');
  });

  cont.innerHTML = sorted.map(function (r) {
    var stars = '★★★★★'.slice(0, r.rating || 0) + '☆☆☆☆☆'.slice(0, 5 - (r.rating || 0));
    return '<div class="item-card">' +
      '<div class="item-head">' +
        '<div>' +
          '<div class="item-title">' + escapeHtml(r.title) + '</div>' +
          '<div class="item-meta">' + (r.date || '') + ' · ' + escapeHtml(r.mood || 'Neutral') + ' · <span class="stars">' + stars + '</span></div>' +
        '</div>' +
        '<div class="item-actions">' +
          '<button class="btn" data-action="edit-review" data-id="' + r.id + '" style="padding:5px 10px;font-size:12px;">Edit</button> ' +
          '<button class="btn btn-danger" data-action="delete-review" data-id="' + r.id + '" style="padding:5px 10px;font-size:12px;">Delete</button>' +
        '</div>' +
      '</div>' +
      (r.worked ? '<div class="item-body"><strong>Worked:</strong> ' + escapeHtml(r.worked) + '</div>' : '') +
      (r.failed ? '<div class="item-body"><strong>Failed:</strong> ' + escapeHtml(r.failed) + '</div>' : '') +
      (r.lessons ? '<div class="item-body"><strong>Lessons:</strong> ' + escapeHtml(r.lessons) + '</div>' : '') +
    '</div>';
  }).join('');
}

function openReviewModal(item) {
  editingReviewId = item ? item.id : null;
  $('reviewModalTitle').textContent = item ? 'Edit Review' : 'New Review';
  $('rvId').value = item ? item.id : '';
  $('rvTitle').value = item ? item.title : '';
  $('rvDate').value = item ? (item.date || todayISO()) : todayISO();
  $('rvRating').value = item ? (item.rating || 3) : 3;
  $('rvMood').value = item ? (item.mood || 'Neutral') : 'Neutral';
  $('rvWorked').value = item ? (item.worked || '') : '';
  $('rvFailed').value = item ? (item.failed || '') : '';
  $('rvLessons').value = item ? (item.lessons || '') : '';
  openModal('reviewModal');
  setTimeout(function () { $('rvTitle').focus(); }, 60);
}

function closeReviewModal() {
  closeModal('reviewModal');
  editingReviewId = null;
  var f = $('reviewForm');
  if (f) f.reset();
}

function submitReview(e) {
  if (e) e.preventDefault();
  var title = ($('rvTitle').value || '').trim();
  if (!title) { toast('Title is required'); return; }

  var data = {
    id: editingReviewId || uid('rv'),
    title: title,
    date: $('rvDate').value || todayISO(),
    rating: parseInt($('rvRating').value, 10) || 3,
    mood: $('rvMood').value,
    worked: ($('rvWorked').value || '').trim(),
    failed: ($('rvFailed').value || '').trim(),
    lessons: ($('rvLessons').value || '').trim(),
    createdAt: Date.now()
  };

  if (editingReviewId) {
    for (var i = 0; i < reviews.length; i++) {
      if (reviews[i].id === editingReviewId) { data.createdAt = reviews[i].createdAt || Date.now(); reviews[i] = data; break; }
    }
    toast('Review updated');
  } else {
    reviews.push(data);
    toast('Review added');
  }

  saveReviews();
  closeReviewModal();
  renderReviews();
}

function editReview(id) {
  var item = reviews.filter(function (r) { return r.id === id; })[0];
  if (item) openReviewModal(item);
}

function deleteReview(id) {
  showConfirm('Delete Review', 'Delete this review permanently?', function () {
    reviews = reviews.filter(function (r) { return r.id !== id; });
    saveReviews();
    toast('Review deleted');
    renderReviews();
  });
}
