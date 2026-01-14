// js/women-sneakers-1.js
// Interactions for Sneakers page:
// - Lazy image loading
// - Category filter and sort
// - Size validation and order via WhatsApp
// - Preview modal created on demand
// - Load more clones
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
  function removeIds(root) { qsa('[id]', root).forEach(function (el) { el.removeAttribute('id'); }); }

  /* Page selectors */
  var ROOT = qs('#sneakers') || document;
  var ROW = qs('#sneakers .row', ROOT) || qs('.row', ROOT);
  var FILTER_BTNS = qsa('[data-filter]', ROOT);
  var SORT_SELECT = qs('#sort-select', ROOT);
  var LOAD_MORE = qs('#load-more', ROOT);
  var DEFAULT_PHONE = '2348136754060';

  /* Grid helpers */
  function getColumns() {
    if (!ROW) return [];
    return Array.prototype.slice.call(ROW.querySelectorAll('[class*="col-"]')).filter(function (col) {
      return !!col.querySelector('.product-card');
    });
  }

  /* Lazy loading images */
  var lazyObserver = null;
  function initLazy() {
    var imgs = qsa('img.lazy', ROOT);
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
        }, { rootMargin: '120px 0px', threshold: 0.01 });
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

  /* Filtering and sorting */
  function applyFilters() {
    var activeBtn = FILTER_BTNS.find(function (b) { return b.classList.contains('active'); });
    var activeFilter = activeBtn ? activeBtn.getAttribute('data-filter') : 'all';
    var sortVal = SORT_SELECT ? SORT_SELECT.value : 'popular';

    var cols = getColumns();

    var visibleCols = cols.filter(function (col) {
      var card = col.querySelector('.product-card');
      if (!card) return false;
      var cats = (card.getAttribute('data-category') || '').split(/\s+/).map(function (s) { return s.toLowerCase(); });
      var matches = (activeFilter === 'all') || cats.indexOf((activeFilter || '').toLowerCase()) !== -1;
      col.style.display = matches ? '' : 'none';
      return matches;
    });

    if (sortVal && visibleCols.length && ROW) {
      var mapped = visibleCols.map(function (col) {
        var card = col.querySelector('.product-card');
        var price = parsePrice(card.getAttribute('data-price') || (card.querySelector('.price') || {}).textContent || '');
        var isNew = card.getAttribute('data-new') === 'true' || card.getAttribute('data-newest') === 'true';
        return { col: col, price: price, isNew: isNew };
      });

      if (sortVal === 'price-low') mapped.sort(function (a, b) { return a.price - b.price; });
      else if (sortVal === 'price-high') mapped.sort(function (a, b) { return b.price - a.price; });
      else if (sortVal === 'new') mapped.sort(function (a, b) { return (b.isNew === true) - (a.isNew === true); });

      var frag = document.createDocumentFragment();
      mapped.forEach(function (m) { frag.appendChild(m.col); });
      ROW.appendChild(frag);
    }
  }

  /* Wire filter buttons */
  FILTER_BTNS.forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      FILTER_BTNS.forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      applyFilters();
    });
  });

  if (SORT_SELECT) SORT_SELECT.addEventListener('change', debounce(applyFilters, 120));

  /* Preview modal */
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
      + '  <button id="sneak-preview-close" aria-label="Close preview" style="position:absolute;right:12px;top:12px;background:transparent;border:0;font-size:22px;cursor:pointer;">✕</button>'
      + '  <img id="sneak-preview-img" src="" alt="" />'
      + '  <div class="preview-body">'
      + '    <h3 id="sneak-preview-title"></h3>'
      + '    <p id="sneak-preview-text" class="meta"></p>'
      + '    <div style="margin-top:12px;display:flex;gap:8px;">'
      + '      <button id="sneak-preview-order" class="btn btn-brown">Order this pair</button>'
      + '      <button id="sneak-preview-contact" class="btn btn-outline-brown">Contact Tailoring Team</button>'
      + '    </div>'
      + '  </div>'
      + '</div>';

    document.body.appendChild(overlay);
    overlay.addEventListener('click', function (ev) { if (ev.target === overlay) closePreview(); });
    qs('#sneak-preview-close', overlay).addEventListener('click', closePreview);
    previewOverlay = overlay;
    return overlay;
  }

  function openPreview(card) {
    var overlay = createPreview();
    var imgEl = card.querySelector('img.card-img-top') || card.querySelector('img');
    var title = (card.querySelector('.card-title') || {}).textContent || '';
    var desc = (card.querySelector('.card-text') || {}).textContent || '';
    var price = (card.querySelector('.price') || {}).textContent || '';

    var previewImg = qs('#sneak-preview-img', overlay);
    var previewTitle = qs('#sneak-preview-title', overlay);
    var previewText = qs('#sneak-preview-text', overlay);
    var previewOrder = qs('#sneak-preview-order', overlay);
    var previewContact = qs('#sneak-preview-contact', overlay);

    if (imgEl) {
      var src = imgEl.getAttribute('data-src') || imgEl.src || '';
      previewImg.src = src;
      previewImg.alt = title || 'Sneaker preview';
    }
    previewTitle.textContent = title;
    previewText.textContent = (price ? price + ' · ' : '') + (desc || '');

    previewOrder.onclick = function () {
      var orderBtn = card.querySelector('.order-btn');
      if (orderBtn) orderBtn.click();
      closePreview();
    };

    previewContact.onclick = function () {
      openWhatsApp(DEFAULT_PHONE, 'Hello Tailoring Team, I would like to ask about the "' + (title || 'sneaker') + '".');
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

  /* Delegated click handling: preview and order */
  document.addEventListener('click', function (e) {
    var previewTrigger = e.target.closest && e.target.closest('[data-preview]');
    if (previewTrigger) {
      e.preventDefault();
      var card = closest(previewTrigger, '.product-card') || previewTrigger.parentNode;
      if (card) openPreview(card);
      return;
    }

    var orderBtn = e.target.closest && e.target.closest('.order-btn');
    if (orderBtn) {
      e.preventDefault();
      var card = closest(orderBtn, '.product-card') || orderBtn.parentNode;
      var title = (card && (card.querySelector('.card-title') || {})).textContent || 'Sneakers';
      var price = (card && card.querySelector('.price')) ? card.querySelector('.price').textContent.trim() : '';
      var phone = orderBtn.getAttribute('data-phone') || orderBtn.dataset.phone || DEFAULT_PHONE;

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
  if (LOAD_MORE) {
    LOAD_MORE.addEventListener('click', function () {
      LOAD_MORE.disabled = true;
      var originalText = LOAD_MORE.textContent;
      LOAD_MORE.textContent = 'Loading...';

      setTimeout(function () {
        var cols = getColumns();
        if (!cols.length) {
          LOAD_MORE.textContent = 'No more items';
          LOAD_MORE.disabled = true;
          return;
        }

        // Clone first 4 columns to simulate more items
        var toClone = cols.slice(0, 4);
        var clones = toClone.map(function (col) {
          var cloneCol = col.cloneNode(true);
          removeIds(cloneCol);
          qsa('.size-select', cloneCol).forEach(function (sel) { sel.value = ''; });
          return cloneCol;
        });

        var frag = document.createDocumentFragment();
        clones.forEach(function (c) { frag.appendChild(c); });
        ROW.appendChild(frag);

        // re-init lazy for new images
        initLazy();

        LOAD_MORE.disabled = false;
        LOAD_MORE.textContent = originalText;
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
  window.__womenSneakers = {
    applyFilters: applyFilters,
    openPreview: openPreview,
    closePreview: closePreview
  };

})();
