// js/traditional-collection.js
// Unified, non-destructive interactions for Traditional collection pages.
// Features: lazy loading, filter, sort, preview modal, order via WhatsApp, load more, accessibility.

(function () {
  'use strict';

  /* -------------------------
     Configuration
     ------------------------- */
  var CONFIG = {
    containerSelector: 'main',            // root container for the collection page (will search inside)
    rowSelector: '.row',                  // grid row selector inside the container
    columnSelector: '[class*="col-"]',    // column wrapper selector (preserve grid)
    cardSelector: '.product-card',        // product card selector
    lazyImageSelector: 'img.lazy',        // lazy image selector
    filterButtonSelector: '[data-filter]',// filter buttons
    sortSelectSelector: '#sort-select',   // sort select
    loadMoreSelector: '#load-more',       // load more button
    previewAttr: 'data-preview',          // attribute to trigger preview
    orderButtonSelector: '.order-btn',    // order button selector
    defaultPhone: '2348136754060',       // fallback WhatsApp phone
    lazyRootMargin: '120px 0px',
    lazyThreshold: 0.01
  };

  /* -------------------------
     Utilities
     ------------------------- */
  function qs(sel, ctx) { return (ctx || document).querySelector(sel); }
  function qsa(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
  function closest(el, sel) { while (el && el !== document) { if (el.matches && el.matches(sel)) return el; el = el.parentNode; } return null; }
  function parsePrice(text) { if (!text) return 0; return Number(String(text).replace(/[^\d]/g, '')) || 0; }
  function debounce(fn, wait) { var t; return function () { var args = arguments, ctx = this; clearTimeout(t); t = setTimeout(function () { fn.apply(ctx, args); }, wait); }; }
  function openWhatsApp(phone, message) {
    var url = 'https://wa.me/' + encodeURIComponent(phone) + '?text=' + encodeURIComponent(message);
    window.open(url, '_blank');
  }
  function removeIds(root) { qsa('[id]', root).forEach(function (el) { el.removeAttribute('id'); }); }

  /* -------------------------
     DOM references (resolved per page)
     ------------------------- */
  function resolveContext(container) {
    var ctx = container || document;
    var row = qs(CONFIG.rowSelector, ctx);
    var filterBtns = qsa(CONFIG.filterButtonSelector, ctx);
    var sortSelect = qs(CONFIG.sortSelectSelector, ctx);
    var loadMoreBtn = qs(CONFIG.loadMoreSelector, ctx);
    return { ctx: ctx, row: row, filterBtns: filterBtns, sortSelect: sortSelect, loadMoreBtn: loadMoreBtn };
  }

  /* -------------------------
     Lazy loading
     ------------------------- */
  var lazyObserver = null;
  function initLazy(root) {
    var imgs = qsa(CONFIG.lazyImageSelector, root);
    if (!imgs.length) return;
    if ('IntersectionObserver' in window) {
      if (!lazyObserver) {
        lazyObserver = new IntersectionObserver(function (entries, observer) {
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
        }, { rootMargin: CONFIG.lazyRootMargin, threshold: CONFIG.lazyThreshold });
      }
      imgs.forEach(function (i) { lazyObserver.observe(i); });
    } else {
      imgs.forEach(function (i) {
        var s = i.getAttribute('data-src');
        if (s) i.src = s;
        i.classList.remove('lazy');
        i.classList.add('lazy-loaded');
      });
    }
  }

  /* -------------------------
     Grid helpers (non-destructive)
     ------------------------- */
  function getColumns(container) {
    var row = container.row;
    if (!row) return [];
    return Array.prototype.slice.call(row.querySelectorAll(CONFIG.columnSelector)).filter(function (col) {
      return !!col.querySelector(CONFIG.cardSelector);
    });
  }
  function getCards(container) {
    return getColumns(container).map(function (col) { return col.querySelector(CONFIG.cardSelector); }).filter(Boolean);
  }

  /* -------------------------
     Filtering & Sorting
     ------------------------- */
  function applyFilters(container) {
    var activeBtn = container.filterBtns.find(function (b) { return b.classList.contains('active'); });
    var activeFilter = activeBtn ? activeBtn.getAttribute('data-filter') : 'all';
    var sortVal = container.sortSelect ? container.sortSelect.value : 'popular';

    var cols = getColumns(container);

    // Filter: toggle column visibility only
    var visibleCols = cols.filter(function (col) {
      var card = col.querySelector(CONFIG.cardSelector);
      if (!card) return false;
      var cats = (card.getAttribute('data-category') || '').split(/\s+/).map(function (s) { return s.toLowerCase(); });
      var matches = (activeFilter === 'all') || cats.indexOf((activeFilter || '').toLowerCase()) !== -1;
      col.style.display = matches ? '' : 'none';
      return matches;
    });

    // Sort: re-append columns in chosen order (preserves grid)
    if (sortVal && visibleCols.length && container.row) {
      var mapped = visibleCols.map(function (col) {
        var card = col.querySelector(CONFIG.cardSelector);
        var price = parsePrice(card.getAttribute('data-price') || (card.querySelector('.price') || {}).textContent || '');
        var isNew = card.getAttribute('data-new') === 'true' || card.getAttribute('data-newest') === 'true';
        return { col: col, price: price, isNew: isNew };
      });

      if (sortVal === 'price-low') mapped.sort(function (a, b) { return a.price - b.price; });
      else if (sortVal === 'price-high') mapped.sort(function (a, b) { return b.price - a.price; });
      else if (sortVal === 'new') mapped.sort(function (a, b) { return (b.isNew === true) - (a.isNew === true); });

      var frag = document.createDocumentFragment();
      mapped.forEach(function (m) { frag.appendChild(m.col); });
      container.row.appendChild(frag);
    }
  }

  /* -------------------------
     Preview modal (created on demand)
     ------------------------- */
  var previewOverlay = null;
  function createPreview() {
    if (previewOverlay) return previewOverlay;
    var overlay = document.createElement('div');
    overlay.className = 'preview-overlay';
    overlay.style.display = 'none';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');

    overlay.innerHTML = ''
      + '<div class="preview-panel" role="document">'
      + '  <button id="collection-preview-close" aria-label="Close preview" style="position:absolute;right:12px;top:12px;background:transparent;border:0;font-size:22px;cursor:pointer;">✕</button>'
      + '  <img id="collection-preview-img" src="" alt="" />'
      + '  <div class="preview-body">'
      + '    <h3 id="collection-preview-title"></h3>'
      + '    <p id="collection-preview-text" class="meta"></p>'
      + '    <div style="margin-top:12px;display:flex;gap:8px;">'
      + '      <button id="collection-preview-order" class="btn btn-brown">Order this item</button>'
      + '      <button id="collection-preview-contact" class="btn btn-outline-brown">Contact Team</button>'
      + '    </div>'
      + '  </div>'
      + '</div>';

    document.body.appendChild(overlay);
    overlay.addEventListener('click', function (ev) { if (ev.target === overlay) closePreview(); });
    qs('#collection-preview-close', overlay).addEventListener('click', closePreview);
    previewOverlay = overlay;
    return overlay;
  }

  function openPreview(card) {
    var overlay = createPreview();
    var imgEl = card.querySelector('img.card-img-top') || card.querySelector('img');
    var title = (card.querySelector('.card-title') || {}).textContent || '';
    var desc = (card.querySelector('.card-text') || {}).textContent || '';
    var price = (card.querySelector('.price') || {}).textContent || '';

    var previewImg = qs('#collection-preview-img', overlay);
    var previewTitle = qs('#collection-preview-title', overlay);
    var previewText = qs('#collection-preview-text', overlay);
    var previewOrder = qs('#collection-preview-order', overlay);
    var previewContact = qs('#collection-preview-contact', overlay);

    if (imgEl) {
      var src = imgEl.getAttribute('data-src') || imgEl.src || '';
      previewImg.src = src;
      previewImg.alt = title || 'Preview';
    }
    previewTitle.textContent = title;
    previewText.textContent = (price ? price + ' · ' : '') + (desc || '');

    previewOrder.onclick = function () {
      var orderBtn = card.querySelector(CONFIG.orderButtonSelector);
      if (orderBtn) orderBtn.click();
      closePreview();
    };
    previewContact.onclick = function () {
      openWhatsApp(CONFIG.defaultPhone, 'Hello, I would like to ask about the "' + (title || 'item') + '".');
    };

    overlay.style.display = 'flex';
    overlay.setAttribute('aria-hidden', 'false');
    previewOrder.focus();
  }

  function closePreview() {
    if (!previewOverlay) return;
    previewOverlay.style.display = 'none';
    previewOverlay.setAttribute('aria-hidden', 'true');
  }

  /* -------------------------
     Delegated interactions (preview & order)
     ------------------------- */
  document.addEventListener('click', function (e) {
    // Preview triggers
    var previewTrigger = e.target.closest && e.target.closest('[' + CONFIG.previewAttr + ']');
    if (previewTrigger) {
      e.preventDefault();
      var card = closest(previewTrigger, CONFIG.cardSelector) || previewTrigger.parentNode;
      if (card) openPreview(card);
      return;
    }

    // Order triggers
    var orderBtn = e.target.closest && e.target.closest(CONFIG.orderButtonSelector);
    if (orderBtn) {
      e.preventDefault();
      var card = closest(orderBtn, CONFIG.cardSelector) || orderBtn.parentNode;
      var title = (card && (card.querySelector('.card-title') || {})).textContent || 'item';
      var price = (card && card.querySelector('.price')) ? card.querySelector('.price').textContent.trim() : '';
      var phone = orderBtn.getAttribute('data-phone') || orderBtn.dataset.phone || CONFIG.defaultPhone;

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

  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closePreview(); });

  /* -------------------------
     Safe "Load more"
     ------------------------- */
  function safeLoadMore(container) {
    var cols = getColumns(container);
    if (!cols.length) return;
    var toClone = cols.slice(0, Math.min(4, cols.length));
    var clones = toClone.map(function (col) {
      var cloneCol = col.cloneNode(true);
      removeIds(cloneCol);
      qsa('.size-select', cloneCol).forEach(function (sel) { sel.value = ''; });
      return cloneCol;
    });
    var frag = document.createDocumentFragment();
    clones.forEach(function (c) { frag.appendChild(c); });
    container.row.appendChild(frag);
    initLazy(container.ctx);
  }

  /* -------------------------
     Initialization per page
     ------------------------- */
  function initCollection(containerRoot) {
    var container = resolveContext(containerRoot);
    if (!container.row) return;

    // init lazy images inside this container
    initLazy(container.ctx);

    // wire filters
    container.filterBtns.forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        container.filterBtns.forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        applyFilters(container);
      });
    });

    if (container.sortSelect) container.sortSelect.addEventListener('change', debounce(function () { applyFilters(container); }, 120));

    if (container.loadMoreBtn) {
      container.loadMoreBtn.addEventListener('click', function () {
        container.loadMoreBtn.disabled = true;
        var original = container.loadMoreBtn.textContent;
        container.loadMoreBtn.textContent = 'Loading...';
        setTimeout(function () {
          safeLoadMore(container);
          container.loadMoreBtn.disabled = false;
          container.loadMoreBtn.textContent = original;
        }, 700);
      });
    }

    // initial filter application
    applyFilters(container);
  }

  /* -------------------------
     Auto-init: find main collection containers and initialize
     ------------------------- */
  function autoInit() {
    // common collection IDs used in this project
    var selectors = ['#featured', '#heritage', '#irobuba', '#wrapper-sets', '#gowns'];
    selectors.forEach(function (sel) {
      var el = qs(sel);
      if (el) initCollection(el);
    });

    // fallback: initialize the first main element with a row and product cards
    if (!document.querySelector(CONFIG.cardSelector)) return;
    var mainEl = qs(CONFIG.containerSelector);
    if (mainEl) initCollection(mainEl);
  }

  // run on DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoInit);
  } else {
    autoInit();
  }

  /* -------------------------
     Public API for debugging
     ------------------------- */
  window.__TraditionalCollection = {
    initCollection: initCollection,
    applyFilters: function (root) { initCollection(root); },
    openPreview: function (card) { if (card) openPreview(card); },
    closePreview: closePreview,
    safeLoadMore: function (root) { var c = resolveContext(root); if (c.row) safeLoadMore(c); }
  };

})();
