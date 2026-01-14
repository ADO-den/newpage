// js/women-Gowns.js
// Minimal, non-invasive interactions for Traditional Gowns page.
// - Lazy load images
// - Filter by category and sort
// - Size validation and order via WhatsApp
// - Preview modal (created on demand)
// - Safe "load more" that doesn't break layout

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
  var grid = qs('#featured .row') || qs('#featured');
  var filterBtns = qsa('[data-filter]');
  var sortSelect = qs('#sort-select');
  var loadMoreBtn = qs('#load-more');
  var previewOverlay = null; // created lazily

  /* Product helpers */
  function getProducts() {
    // only select top-level product cards inside the grid row
    return qsa('#featured > .container .row > .col-12, #featured .row > .col-12, #featured .row > [class*="col-"]')
      .map(function (col) {
        // find a product-card inside the column
        var card = col.querySelector('.product-card');
        return card ? card : null;
      })
      .filter(Boolean);
  }

  /* Fallback simpler selector if above returns nothing */
  function getProductsFallback() {
    return qsa('#featured .product-card');
  }

  function allProducts() {
    var p = getProducts();
    return p.length ? p : getProductsFallback();
  }

  /* Lazy load images (safe) */
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

  /* Filtering & sorting (non-destructive) */
  function applyFilters() {
    var activeBtn = filterBtns.find(function (b) { return b.classList.contains('active'); });
    var activeFilter = activeBtn ? activeBtn.getAttribute('data-filter') : 'all';
    var sortVal = sortSelect ? sortSelect.value : 'popular';

    var products = allProducts();

    // Filter: only toggle display property
    var visible = products.filter(function (p) {
      var cats = (p.getAttribute('data-category') || '').split(/\s+/).map(function (s) { return s.toLowerCase(); });
      var matches = (activeFilter === 'all') || cats.indexOf((activeFilter || '').toLowerCase()) !== -1;
      p.style.display = matches ? '' : 'none';
      return matches;
    });

    // Sort visible nodes safely: re-append columns (not cards) to preserve grid structure
    if (sortVal && visible.length && grid) {
      // find the column wrapper for each visible card
      var cols = visible.map(function (card) {
        var col = closest(card, '[class*="col-"]') || card.parentNode;
        return { col: col, card: card, price: parsePrice(card.getAttribute('data-price') || (card.querySelector('.price') || {}).textContent || ''), isNew: card.getAttribute('data-new') === 'true' || card.getAttribute('data-newest') === 'true' };
      });

      if (sortVal === 'price-low') {
        cols.sort(function (a, b) { return a.price - b.price; });
      } else if (sortVal === 'price-high') {
        cols.sort(function (a, b) { return b.price - a.price; });
      } else if (sortVal === 'new') {
        cols.sort(function (a, b) { return (b.isNew === true) - (a.isNew === true); });
      } // 'popular' keep DOM order

      // append columns into a fragment then to grid row to avoid reflow per append
      var frag = document.createDocumentFragment();
      cols.forEach(function (c) { frag.appendChild(c.col); });
      // append only the visible columns; this preserves layout structure
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
    var title = (card.querySelector('.card-title') || {}).textContent || '';
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
      var title = (card && (card.querySelector('.card-title') || {})).textContent || 'Traditional gown';
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

  /* Safe "Load more" implementation */
  if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', function () {
      loadMoreBtn.disabled = true;
      var originalText = loadMoreBtn.textContent;
      loadMoreBtn.textContent = 'Loading...';

      setTimeout(function () {
        var products = allProducts();
        if (!products.length) {
          loadMoreBtn.textContent = 'No more items';
          loadMoreBtn.disabled = true;
          return;
        }

        // We'll clone the first N columns (not cards) to preserve grid column structure.
        var columns = [];
        // find column wrappers for the first few products
        products.slice(0, 4).forEach(function (card) {
          var col = closest(card, '[class*="col-"]') || card.parentNode;
          if (col) columns.push(col);
        });

        if (!columns.length) {
          // fallback: clone cards and wrap them in a column
          products.slice(0, 4).forEach(function (card) {
            var cloneCard = card.cloneNode(true);
            // remove ids from clone to avoid duplicates
            qsa('[id]', cloneCard).forEach(function (el) { el.removeAttribute('id'); });
            // reset selects
            var sel = cloneCard.querySelector('.size-select');
            if (sel) sel.value = '';
            var wrapper = document.createElement('div');
            wrapper.className = 'col-12 col-sm-6 col-md-4 col-lg-3';
            wrapper.appendChild(cloneCard);
            columns.push(wrapper);
          });
        } else {
          // clone columns safely
          columns = columns.map(function (col) {
            var cloneCol = col.cloneNode(true);
            // remove ids inside clone
            qsa('[id]', cloneCol).forEach(function (el) { el.removeAttribute('id'); });
            // reset selects inside clone
            qsa('.size-select', cloneCol).forEach(function (sel) { sel.value = ''; });
            return cloneCol;
          });
        }

        // append clones using a fragment
        var frag = document.createDocumentFragment();
        columns.forEach(function (c) { frag.appendChild(c); });
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
  window.__womenGowns = {
    applyFilters: applyFilters,
    openPreview: openPreview,
    closePreview: closePreview
  };

})();
