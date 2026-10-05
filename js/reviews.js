/* ============================================================
   reviews.js — Trade reviews CRUD with period tabs
   ============================================================ */

var reviews = [];
var editingReviewId = null;
var reviewPeriodFilter = 'all';

function loadReviews() {
  reviews = readStore(KEYS.reviews, []);
  if (!Array.isArray(reviews)) reviews = [];
}

function saveReviews() {
  writeStore(KEYS.reviews, reviews);
}

function renderReviews() {
  var cont = $('reviewsList');
  if (!cont) return;

  var list = reviews.slice();
  if (reviewPeriodFilter !== 'all') {
    list = list.filter(function (r) { return (r.period || 'daily') === reviewPeriodFilter; });
  }

  if (!list.length) {
    cont.innerHTML = '<div class="empty"><strong>No reviews</strong>Create a review when you have something to learn from.</div>';
    return;
  }

  list.sort(function (a, b) { return (b.date || '').localeCompare(a.date || ''); });

  cont.innerHTML = list.map(function (r) {
    var stars = '★★★★★'.slice(0, r.rating || 0) + '☆☆☆☆☆'.slice(0, 5 - (r.rating || 0));
    var badge = (r.period || 'daily').charAt(0).toUpperCase() + (r.period || 'daily').slice(1);
    return '<div class="item-card">' +
      '<div class="item-head">' +
        '<div>' +
          '<div class="item-title">' + escapeHtml(r.title) + '</div>' +
          '<div class="item-meta">' + (r.date || '') + ' · ' + badge + ' · ' + escapeHtml(r.mood || 'Neutral') + ' · <span class="stars">' + stars + '</span></div>' +
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

function initReviewTabs() {
  var tabs = $('reviewTabs');
  if (!tabs) return;
  tabs.addEventListener('click', function (e) {
    var t = e.target.closest('.tab');
    if (!t) return;
    tabs.querySelectorAll('.tab').forEach(function (x) { x.classList.remove('active'); });
    t.classList.add('active');
    reviewPeriodFilter = t.dataset.period;
    renderReviews();
  });
}

function openReviewModal(item) {
  editingReviewId = item ? item.id : null;
  $('reviewModalTitle').textContent = item ? 'Edit Review' : 'New Review';
  $('rvId').value = item ? item.id : '';
  $('rvTitle').value = item ? item.title : '';
  $('rvDate').value = item ? (item.date || todayISO()) : todayISO();
  $('rvPeriod').value = item ? (item.period || 'daily') : 'daily';
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
    period: $('rvPeriod').value || 'daily',
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
