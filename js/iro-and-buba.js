// js/women-irobuba.js
// Interactions for Iro & Buba page:
// - Lazy image loading
// - Category filter and sort
// - Size validation and order via WhatsApp
// - Preview modal (created on demand)
// - Safe "load more" that preserves grid layout
// - Accessibility helpers

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
  var grid = qs('#irobuba .row') || qs('#irobuba');
  var filterBtns = qsa('[data-filter]');
  var sortSelect = qs('#sort-select');
  var loadMoreBtn = qs('#load-more');
  var previewOverlay = null; // created lazily

  /* Helpers to get product columns and cards (preserve grid structure) */
  function getColumns() {
    return qsa('#irobuba .row > [class*="col-"]').filter(function (col) { return !!col.querySelector('.product-card'); });
  }
  function getCards() {
    return getColumns().map(function (col) { return col.querySelector('.product-card'); }).filter(Boolean);
  }

  /* Lazy load images (IntersectionObserver) */
  function initLazy() {
    var imgs = qsa('#irobuba img.lazy');
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

  /* Filtering & sorting (non-destructive) */
  function applyFilters() {
    var activeBtn = filterBtns.find(function (b) { return b.classList.contains('active'); });
    var activeFilter = activeBtn ? activeBtn.getAttribute('data-filter') : 'all';
    var sortVal = sortSelect ? sortSelect.value : 'popular';

    var cols = getColumns();

    // Filter: toggle column visibility
    var visibleCols = cols.filter(function (col) {
      var card = col.querySelector('.product-card');
      if (!card) return false;
      var cats = (card.getAttribute('data-category') || '').split(/\s+/).map(function (s) { return s.toLowerCase(); });
      var matches = (activeFilter === 'all') || cats.indexOf((activeFilter || '').toLowerCase()) !== -1;
      col.style.display = matches ? '' : 'none';
      return matches;
    });

    // Sort visible columns safely
    if (sortVal && visibleCols.length && grid) {
      var mapped = visibleCols.map(function (col) {
        var card = col.querySelector('.product-card');
        var price = parsePrice(card.getAttribute('data-price') || (card.querySelector('.price') || {}).textContent || '');
        var isNew = card.getAttribute('data-new') === 'true' || card.getAttribute('data-newest') === 'true';
        return { col: col, price: price, isNew: isNew };
      });

      if (sortVal === 'price-low') {
        mapped.sort(function (a, b) { return a.price - b.price; });
      } else if (sortVal === 'price-high') {
        mapped.sort(function (a, b) { return b.price - a.price; });
      } else if (sortVal === 'new') {
        mapped.sort(function (a, b) { return (b.isNew === true) - (a.isNew === true); });
      } // 'popular' keep DOM order

      var frag = document.createDocumentFragment();
      mapped.forEach(function (m) { frag.appendChild(m.col); });
      grid.appendChild(frag);
    }
  }

  /* Wire filter buttons */
  filterBtns.forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      filterBtns.forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      applyFilters();
    });
  });

  if (sortSelect) sortSelect.addEventListener('change', debounce(applyFilters, 120));

  /* Preview overlay (created on demand) */
  function createPreview() {
    var overlay = document.createElement('div');
    overlay.className = 'preview-overlay';
    overlay.style.display = 'none';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');

    overlay.innerHTML = ''
      + '<div class="preview-panel" role="document">'
      + '  <button id="irobuba-preview-close" aria-label="Close preview" style="position:absolute;right:12px;top:12px;background:transparent;border:0;font-size:22px;cursor:pointer;">✕</button>'
      + '  <img id="irobuba-preview-img" src="" alt="" />'
      + '  <div class="preview-body">'
      + '    <h3 id="irobuba-preview-title"></h3>'
      + '    <p id="irobuba-preview-text" class="meta"></p>'
      + '    <div style="margin-top:12px;display:flex;gap:8px;">'
      + '      <button id="irobuba-preview-order" class="btn btn-brown">Order this set</button>'
      + '      <button id="irobuba-preview-contact" class="btn btn-outline-brown">Contact Tailoring Team</button>'
      + '    </div>'
      + '  </div>'
      + '</div>';

    document.body.appendChild(overlay);

    overlay.addEventListener('click', function (ev) {
      if (ev.target === overlay) closePreview();
    });

    qs('#irobuba-preview-close', overlay).addEventListener('click', closePreview);

    return overlay;
  }

  function openPreview(card) {
    if (!previewOverlay) previewOverlay = createPreview();
    var imgEl = card.querySelector('img.card-img-top') || card.querySelector('img');
    var title = (card.querySelector('.card-title') || {}).textContent || '';
    var desc = (card.querySelector('.card-text') || {}).textContent || '';
    var price = (card.querySelector('.price') || {}).textContent || '';

    var previewImg = qs('#irobuba-preview-img', previewOverlay);
    var previewTitle = qs('#irobuba-preview-title', previewOverlay);
    var previewText = qs('#irobuba-preview-text', previewOverlay);
    var previewOrder = qs('#irobuba-preview-order', previewOverlay);
    var previewContact = qs('#irobuba-preview-contact', previewOverlay);

    if (imgEl) {
      var src = imgEl.getAttribute('data-src') || imgEl.src || '';
      previewImg.src = src;
      previewImg.alt = title || 'Preview';
    }
    previewTitle.textContent = title;
    previewText.textContent = (price ? price + ' · ' : '') + (desc || '');

    previewOrder.onclick = function () {
      var orderBtn = card.querySelector('.order-btn');
      if (orderBtn) orderBtn.click();
      closePreview();
    };

    previewContact.onclick = function () {
      openWhatsApp('2348136754060', 'Hello Tailoring Team, I would like to ask about the "' + (title || 'set') + '".');
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
      var title = (card && (card.querySelector('.card-title') || {})).textContent || 'Iro & Buba set';
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

  /* Close preview with Escape */
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closePreview();
  });

  /* Safe "Load more" implementation */
  if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', function () {
      loadMoreBtn.disabled = true;
      var originalText = loadMoreBtn.textContent;
      loadMoreBtn.textContent = 'Loading...';

      setTimeout(function () {
        var cols = getColumns();
        if (!cols.length) {
          loadMoreBtn.textContent = 'No more items';
          loadMoreBtn.disabled = true;
          return;
        }

        // Clone first few columns safely
        var toClone = cols.slice(0, 4);
        var clones = toClone.map(function (col) {
          var cloneCol = col.cloneNode(true);
          // remove duplicate ids inside clone
          qsa('[id]', cloneCol).forEach(function (el) { el.removeAttribute('id'); });
          // reset selects inside clone
          qsa('.size-select', cloneCol).forEach(function (sel) { sel.value = ''; });
          return cloneCol;
        });

        var frag = document.createDocumentFragment();
        clones.forEach(function (c) { frag.appendChild(c); });
        grid.appendChild(frag);

        // re-init lazy for new images
        initLazy();

        loadMoreBtn.disabled = false;
        loadMoreBtn.textContent = originalText;
      }, 700);
    });
  }

  /* Accessibility: focus outlines for keyboard users */
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
  window.__womenIroBuba = {
    applyFilters: applyFilters,
    openPreview: openPreview,
    closePreview: closePreview
  };

})();
