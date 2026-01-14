// js/women-Gowns.js
// Interactions for Traditional Gowns page: lazy load, filter, sort, preview, size validation, order via WhatsApp, load more.

(function () {
  'use strict';

  /* Utilities */
  function qs(sel, ctx) { return (ctx || document).querySelector(sel); }
  function qsa(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
  function closest(el, sel) { while (el && el !== document) { if (el.matches && el.matches(sel)) return el; el = el.parentNode; } return null; }
  function parsePrice(text) { if (!text) return 0; return Number(String(text).replace(/[^\d]/g, '')) || 0; }
  function debounce(fn, wait) { var t; return function () { var args = arguments, ctx = this; clearTimeout(t); t = setTimeout(function () { fn.apply(ctx, args); }, wait); }; }
  function openWhatsApp(phone, message) { var url = 'https://wa.me/' + encodeURIComponent(phone) + '?text=' + encodeURIComponent(message); window.open(url, '_blank'); }

  /* DOM refs */
  var grid = qs('#gowns .row') || qs('#gowns');
  var filterBtns = qsa('[data-filter]');
  var sortSelect = qs('#sort-select');
  var loadMoreBtn = qs('#load-more');
  var previewOverlay = null; // created on demand

  /* Product helpers */
  function getProducts() {
    return qsa('#gowns .product-card, #gowns article.product-card, #gowns .card.product-card');
  }

  /* Lazy load images (IntersectionObserver) */
  function initLazy() {
    var imgs = qsa('img.lazy');
    if (!imgs.length) return;
    if ('IntersectionObserver' in window) {
      var obs = new IntersectionObserver(function (entries, observer) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            var img = entry.target;
            var src = img.getAttribute('data-src');
            var srcset = img.getAttribute('data-srcset');
            if (src) img.src = src;
            if (srcset) img.srcset = srcset;
            img.classList.remove('lazy');
            img.classList.add('lazy-loaded');
            observer.unobserve(img);
          }
        });
      }, { rootMargin: '120px 0px', threshold: 0.01 });
      imgs.forEach(function (i) { obs.observe(i); });
    } else {
      imgs.forEach(function (i) {
        var s = i.getAttribute('data-src');
        if (s) i.src = s;
        i.classList.remove('lazy');
        i.classList.add('lazy-loaded');
      });
    }
  }

  /* Filtering & sorting */
  function applyFilters() {
    var activeBtn = filterBtns.find(function (b) { return b.classList.contains('active'); });
    var activeFilter = activeBtn ? activeBtn.getAttribute('data-filter') : 'all';
    var sortVal = sortSelect ? sortSelect.value : 'popular';

    var products = getProducts();

    // Filter
    var visible = products.filter(function (p) {
      var cats = (p.getAttribute('data-category') || '').split(/\s+/).map(function (s) { return s.toLowerCase(); });
      var matchesFilter = (activeFilter === 'all') || cats.indexOf((activeFilter || '').toLowerCase()) !== -1;
      p.style.display = matchesFilter ? '' : 'none';
      return matchesFilter;
    });

    // Sort visible nodes (stable-ish by appending in new order)
    if (sortVal && visible.length) {
      var container = grid;
      var mapped = visible.map(function (n) {
        var price = parsePrice(n.getAttribute('data-price') || (n.querySelector('.price') || {}).textContent || '');
        var isNew = n.getAttribute('data-new') === 'true' || n.getAttribute('data-newest') === 'true';
        return { node: n, price: price, isNew: isNew };
      });

      if (sortVal === 'price-low') {
        mapped.sort(function (a, b) { return a.price - b.price; });
      } else if (sortVal === 'price-high') {
        mapped.sort(function (a, b) { return b.price - a.price; });
      } else if (sortVal === 'new') {
        mapped.sort(function (a, b) { return (b.isNew === true) - (a.isNew === true); });
      } // 'popular' keeps DOM order

      mapped.forEach(function (m) { container.appendChild(m.node); });
    }
  }

  /* Filter button behavior */
  filterBtns.forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      filterBtns.forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      applyFilters();
    });
  });

  if (sortSelect) sortSelect.addEventListener('change', applyFilters);

  /* Preview overlay creation */
  function createPreview() {
    var overlay = document.createElement('div');
    overlay.className = 'preview-overlay';
    overlay.style.display = 'none';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');

    overlay.innerHTML = ''
      + '<div class="preview-panel" role="document">'
      + '  <button id="gown-preview-close" aria-label="Close preview" style="position:absolute;right:12px;top:12px;background:transparent;border:0;font-size:22px;cursor:pointer;">✕</button>'
      + '  <img id="gown-preview-img" src="" alt="" />'
      + '  <div class="preview-body">'
      + '    <h3 id="gown-preview-title"></h3>'
      + '    <p id="gown-preview-text" class="meta"></p>'
      + '    <div style="margin-top:12px;display:flex;gap:8px;">'
      + '      <button id="gown-preview-order" class="btn btn-brown">Order this gown</button>'
      + '      <button id="gown-preview-contact" class="btn btn-outline-brown">Contact Tailoring Team</button>'
      + '    </div>'
      + '  </div>'
      + '</div>';

    document.body.appendChild(overlay);

    overlay.addEventListener('click', function (ev) {
      if (ev.target === overlay) closePreview();
    });

    qs('#gown-preview-close', overlay).addEventListener('click', closePreview);

    return overlay;
  }

  function openPreview(card) {
    if (!previewOverlay) previewOverlay = createPreview();
    var imgEl = card.querySelector('img.card-img-top') || card.querySelector('img');
    var title = (card.querySelector('.card-title') || card.querySelector('h5') || {}).textContent || '';
    var desc = (card.querySelector('.card-text') || {}).textContent || '';
    var price = (card.querySelector('.price') || {}).textContent || '';

    var previewImg = qs('#gown-preview-img', previewOverlay);
    var previewTitle = qs('#gown-preview-title', previewOverlay);
    var previewText = qs('#gown-preview-text', previewOverlay);
    var previewOrder = qs('#gown-preview-order', previewOverlay);
    var previewContact = qs('#gown-preview-contact', previewOverlay);

    if (imgEl) {
      var src = imgEl.getAttribute('data-src') || imgEl.src || '';
      previewImg.src = src;
      previewImg.alt = title || 'Gown preview';
    }
    previewTitle.textContent = title;
    previewText.textContent = (price ? price + ' · ' : '') + (desc || '');

    previewOrder.onclick = function () {
      var orderBtn = card.querySelector('.order-btn');
      if (orderBtn) orderBtn.click();
      closePreview();
    };

    previewContact.onclick = function () {
      openWhatsApp('2348136754060', 'Hello Tailoring Team, I would like to ask about the "' + (title || 'gown') + '".');
    };

    previewOverlay.style.display = 'flex';
    previewOverlay.setAttribute('aria-hidden', 'false');
    previewOrder.focus();
  }

  function closePreview() {
    if (!previewOverlay) return;
    previewOverlay.style.display = 'none';
    previewOverlay.setAttribute('aria-hidden', 'true');
  }

  /* Delegated click handlers: preview and order */
  document.addEventListener('click', function (e) {
    var previewTrigger = e.target.closest && e.target.closest('[data-preview]');
    if (previewTrigger) {
      e.preventDefault();
      var card = closest(previewTrigger, '.product-card') || closest(previewTrigger, '.card.product-card') || previewTrigger.parentNode;
      if (card) openPreview(card);
      return;
    }

    var orderBtn = e.target.closest && e.target.closest('.order-btn');
    if (orderBtn) {
      e.preventDefault();
      var card = closest(orderBtn, '.product-card') || closest(orderBtn, '.card.product-card') || orderBtn.parentNode;
      var title = (card && (card.querySelector('.card-title') || card.querySelector('h5'))) ? (card.querySelector('.card-title') || card.querySelector('h5')).textContent.trim() : 'Traditional gown';
      var price = (card && card.querySelector('.price')) ? card.querySelector('.price').textContent.trim() : '';
      var phone = orderBtn.getAttribute('data-phone') || orderBtn.dataset.phone || '2348136754060';

      // Validate size if present
      var sizeSelect = card.querySelector('.size-select');
      if (sizeSelect && !sizeSelect.value) {
        sizeSelect.classList.add('is-invalid');
        setTimeout(function () { sizeSelect.classList.remove('is-invalid'); sizeSelect.focus(); }, 900);
        return;
      }

      var sizeText = sizeSelect ? ('Size: ' + sizeSelect.value) : '';
      var messageParts = [
        'Hello, I would like to order: ' + title,
        price ? ('Price: ' + price) : '',
        sizeText,
        'Please confirm availability, lead time and delivery fee.',
        'Buyer: [Your name] | Recipient: [Recipient name] | Address: [Delivery address]'
      ].filter(Boolean);

      openWhatsApp(phone, messageParts.join(' | '));
      return;
    }
  });

  // close preview with Escape
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closePreview();
  });

  /* Load more simulation */
  if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', function () {
      loadMoreBtn.disabled = true;
      loadMoreBtn.textContent = 'Loading...';
      setTimeout(function () {
        var products = getProducts();
        if (!products.length) {
          loadMoreBtn.textContent = 'No more items';
          return;
        }
        for (var i = 0; i < 4; i++) {
          var src = products[i % products.length];
          var clone = src.cloneNode(true);
          clone.style.display = '';
          // reset any interactive state on clone
          var select = clone.querySelector('.size-select');
          if (select) select.value = '';
          grid.appendChild(clone);
        }
        initLazy();
        loadMoreBtn.disabled = false;
        loadMoreBtn.textContent = 'Load more';
      }, 700);
    });
  }

  /* Accessibility: show focus outlines for keyboard users */
  (function focusOutline() {
    var body = document.body;
    function handleFirstTab(e) {
      if (e.key === 'Tab') {
        body.classList.add('user-is-tabbing');
        window.removeEventListener('keydown', handleFirstTab);
      }
    }
    window.addEventListener('keydown', handleFirstTab);
  })();

  /* Initialize */
  initLazy();
  applyFilters();

  // Expose small API for debugging
  window.__womenGowns = {
    applyFilters: applyFilters,
    openPreview: openPreview,
    closePreview: closePreview
  };

})();
