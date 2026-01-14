// js/reviews-1.js
// JK Fashion Empire - Reviews page interactions
// - Filter by rating, sort, verified-only toggle
// - Submit new review (client-side only)
// - Helpful / report interactions (client-side)
// - Load more reviews (simulated)
// - Updates average rating and total count

(function () {
  'use strict';

  /* ---------------------------
     Utilities
  ----------------------------*/
  function qs(selector, ctx) { return (ctx || document).querySelector(selector); }
  function qsa(selector, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(selector)); }
  function toNumber(v) { return Number(v) || 0; }
  function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

  /* ---------------------------
     State and DOM refs
  ----------------------------*/
  var reviewsList = qs('#reviews-list');
  var avgRatingEl = qs('#avg-rating');
  var totalReviewsEl = qs('#total-reviews');
  var filterButtons = qsa('.filter-btn');
  var sortSelect = qs('#sort-reviews');
  var verifiedOnlyCheckbox = qs('#verified-only');
  var reviewForm = qs('#review-form');
  var reviewsEmpty = qs('#reviews-empty');
  var loadMoreBtn = qs('#load-more');
  var writeReviewBtn = qs('#write-review-btn');
  var reviewFormCard = qs('#review-form-card');

  /* ---------------------------
     Helpers: compute stats and UI updates
  ----------------------------*/
  function getAllReviewNodes() {
    return qsa('#reviews-list article.card.review-card');
  }

  function computeStats(nodes) {
    var total = 0, sum = 0;
    nodes.forEach(function (n) {
      var r = toNumber(n.getAttribute('data-rating'));
      if (!isNaN(r)) { sum += r; total += 1; }
    });
    var avg = total ? (sum / total) : 0;
    return { total: total, avg: avg };
  }

  function updateSummary() {
    var nodes = getAllReviewNodes();
    var stats = computeStats(nodes);
    avgRatingEl.textContent = stats.avg ? stats.avg.toFixed(1) : '0.0';
    totalReviewsEl.textContent = stats.total;
  }

  /* ---------------------------
     Filtering & sorting
  ----------------------------*/
  function applyFiltersAndSort() {
    var activeFilter = (function () {
      var active = filterButtons.find(function (b) { return b.classList.contains('active'); });
      return active ? active.getAttribute('data-filter') : 'all';
    })();

    var sortBy = sortSelect ? sortSelect.value : 'newest';
    var verifiedOnly = verifiedOnlyCheckbox ? verifiedOnlyCheckbox.checked : false;

    var nodes = getAllReviewNodes();

    // Filter
    nodes.forEach(function (n) {
      var rating = toNumber(n.getAttribute('data-rating'));
      var verified = n.getAttribute('data-verified') === 'true';
      var show = true;

      if (verifiedOnly && !verified) show = false;
      if (activeFilter && activeFilter !== 'all') {
        var filterNum = parseInt(activeFilter, 10);
        if (!isNaN(filterNum)) {
          if (rating !== filterNum) show = false;
        }
      }

      n.style.display = show ? '' : 'none';
    });

    // Sort visible nodes
    var container = reviewsList;
    var visible = nodes.filter(function (n) { return n.style.display !== 'none'; });

    visible.sort(function (a, b) {
      if (sortBy === 'newest') {
        // assume DOM order is newest-first for simplicity; keep as-is
        return 0;
      } else if (sortBy === 'helpful') {
        var ah = toNumber(qs('.badge', a) ? qs('.badge', a).textContent : 0);
        var bh = toNumber(qs('.badge', b) ? qs('.badge', b).textContent : 0);
        return bh - ah;
      } else if (sortBy === 'highest') {
        return toNumber(b.getAttribute('data-rating')) - toNumber(a.getAttribute('data-rating'));
      } else if (sortBy === 'lowest') {
        return toNumber(a.getAttribute('data-rating')) - toNumber(b.getAttribute('data-rating'));
      }
      return 0;
    });

    // Re-append visible nodes in sorted order (keeps hidden ones in place)
    visible.forEach(function (n) { container.appendChild(n); });

    // Empty state
    var anyVisible = visible.length > 0;
    reviewsEmpty.style.display = anyVisible ? 'none' : '';
  }

  /* ---------------------------
     Event handlers
  ----------------------------*/
  // Filter buttons
  filterButtons.forEach(function (btn) {
    btn.addEventListener('click', function (ev) {
      ev.preventDefault();
      filterButtons.forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      applyFiltersAndSort();
    });
  });

  // Sort select
  if (sortSelect) {
    sortSelect.addEventListener('change', function () {
      applyFiltersAndSort();
    });
  }

  // Verified-only toggle
  if (verifiedOnlyCheckbox) {
    verifiedOnlyCheckbox.addEventListener('change', function () {
      applyFiltersAndSort();
    });
  }

  // Helpful / Report buttons (delegated)
  reviewsList.addEventListener('click', function (ev) {
    var helpfulBtn = ev.target.closest && ev.target.closest('[data-helpful]');
    if (helpfulBtn) {
      ev.preventDefault();
      var pressed = helpfulBtn.getAttribute('aria-pressed') === 'true';
      var badge = helpfulBtn.querySelector('.badge');
      var count = toNumber(badge ? badge.textContent : 0);
      if (pressed) {
        // undo
        count = Math.max(0, count - 1);
        helpfulBtn.setAttribute('aria-pressed', 'false');
      } else {
        count = count + 1;
        helpfulBtn.setAttribute('aria-pressed', 'true');
      }
      if (badge) badge.textContent = count;
      return;
    }

    var reportBtn = ev.target.closest && ev.target.closest('[data-report]');
    if (reportBtn) {
      ev.preventDefault();
      // mark reported (client-side only)
      reportBtn.textContent = 'Reported';
      reportBtn.disabled = true;
      reportBtn.setAttribute('aria-disabled', 'true');
      return;
    }
  });

  // Submit review (client-side)
  if (reviewForm) {
    reviewForm.addEventListener('submit', function (ev) {
      ev.preventDefault();

      var form = ev.target;
      var name = (form.name && form.name.value || '').trim();
      var email = (form.email && form.email.value || '').trim();
      var rating = (form.rating && form.rating.value) || '';
      var comment = (form.comment && form.comment.value || '').trim();

      // Basic validation
      if (!name) { flashInvalidField(form.name); return; }
      if (!rating) { flashInvalidField(form.rating); return; }
      if (!comment) { flashInvalidField(form.comment); return; }

      // Create review node
      var article = document.createElement('article');
      article.className = 'card review-card p-3';
      article.setAttribute('data-rating', rating);
      article.setAttribute('data-verified', 'false'); // new reviews default to unverified
      article.innerHTML = ''
        + '<div class="d-flex align-items-start gap-3">'
        + '  <div class="flex-shrink-0">'
        + '    <div class="rounded-circle bg-light d-flex align-items-center justify-content-center" style="width:56px;height:56px;">'
        + '      <span class="fw-bold text-brown">' + escapeHtml(name.charAt(0) || 'U') + '</span>'
        + '    </div>'
        + '  </div>'
        + '  <div class="flex-grow-1">'
        + '    <div class="d-flex align-items-center justify-content-between">'
        + '      <div><strong>' + escapeHtml(name) + '</strong><div class="small review-meta">' + (email ? escapeHtml(email) + ' · ' : '') + 'Just now</div></div>'
        + '      <div aria-hidden="true">' + renderStars(rating) + '</div>'
        + '    </div>'
        + '    <p class="mt-2 mb-2">' + escapeHtml(comment) + '</p>'
        + '    <div class="d-flex gap-3 align-items-center">'
        + '      <button class="helpful-btn" data-helpful="true" aria-pressed="false">Helpful <span class="badge bg-light text-muted ms-1">0</span></button>'
        + '      <button class="helpful-btn" data-report="true">Report</button>'
        + '    </div>'
        + '  </div>'
        + '</div>';

      // Prepend new review to top
      reviewsList.insertBefore(article, reviewsList.firstChild);

      // Reset form and update summary
      form.reset();
      updateSummary();
      applyFiltersAndSort();

      // Provide lightweight feedback
      var submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) {
        var original = submitBtn.textContent;
        submitBtn.textContent = 'Thanks';
        submitBtn.disabled = true;
        setTimeout(function () { submitBtn.textContent = original; submitBtn.disabled = false; }, 1400);
      }
    });
  }

  // Write review button toggles form visibility (scrolls into view)
  if (writeReviewBtn && reviewFormCard) {
    writeReviewBtn.addEventListener('click', function () {
      reviewFormCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
      var firstInput = reviewFormCard.querySelector('input, textarea, select');
      if (firstInput) firstInput.focus();
    });
  }

  // Load more (simulated): clones a few existing reviews and appends
  if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', function () {
      loadMoreBtn.disabled = true;
      loadMoreBtn.textContent = 'Loading...';
      setTimeout(function () {
        var sample = getAllReviewNodes();
        if (!sample.length) {
          loadMoreBtn.textContent = 'No more reviews';
          return;
        }
        // clone up to 3 reviews with slight modifications
        for (var i = 0; i < 3; i++) {
          var src = sample[i % sample.length];
          var clone = src.cloneNode(true);
          // update timestamp text if present
          var meta = clone.querySelector('.review-meta');
          if (meta) meta.textContent = 'A few moments ago';
          // reset helpful button state
          var helpful = clone.querySelector('[data-helpful]');
          if (helpful) { helpful.setAttribute('aria-pressed', 'false'); var b = helpful.querySelector('.badge'); if (b) b.textContent = '0'; }
          reviewsList.appendChild(clone);
        }
        updateSummary();
        applyFiltersAndSort();
        loadMoreBtn.disabled = false;
        loadMoreBtn.textContent = 'Load more reviews';
      }, 700);
    });
  }

  /* ---------------------------
     Small helpers used above
  ----------------------------*/
  function renderStars(rating) {
    var r = clamp(parseInt(rating, 10) || 0, 0, 5);
    var out = '';
    for (var i = 0; i < r; i++) out += '<span class="rating-star">★</span>';
    for (var j = r; j < 5; j++) out += '<span class="rating-empty">☆</span>';
    return out;
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, function (m) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m];
    });
  }

  function flashInvalidField(field) {
    if (!field) return;
    field.classList.add('is-invalid');
    setTimeout(function () { field.classList.remove('is-invalid'); }, 1400);
    try { field.focus(); } catch (e) {}
  }

  /* ---------------------------
     Initial setup
  ----------------------------*/
  // Ensure badges inside helpful buttons are normalized
  qsa('[data-helpful]').forEach(function (btn) {
    var badge = btn.querySelector('.badge');
    if (!badge) {
      var span = document.createElement('span');
      span.className = 'badge bg-light text-muted ms-1';
      span.textContent = '0';
      btn.appendChild(span);
    }
  });

  // Update summary on load
  updateSummary();
  applyFiltersAndSort();

  /* ---------------------------
     Expose small API for debugging (optional)
  ----------------------------*/
  window.__jkReviews = {
    updateSummary: updateSummary,
    applyFiltersAndSort: applyFiltersAndSort
  };

})();
