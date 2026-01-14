// js/men-Agbada.js
// JK Fashion Empire - Men's Agbada page interactions
// - WhatsApp ordering with size validation and custom measurements note
// - Category filtering (data-filter)
// - Sort select (client-side by price/newest)
// - Lazy image loading (data-src + IntersectionObserver)
// - Lightweight detail preview modal (no external libs required)
// - Newsletter form handler and accessibility helpers

(function () {
  'use strict';

  /* ---------------------------
     Utilities
  ----------------------------*/
  function closest(el, selector) {
    while (el && el !== document) {
      if (el.matches && el.matches(selector)) return el;
      el = el.parentNode;
    }
    return null;
  }

  function openWhatsApp(phone, message) {
    var url = 'https://wa.me/' + encodeURIComponent(phone) + '?text=' + encodeURIComponent(message);
    window.open(url, '_blank');
  }

  function flashInvalid(el) {
    if (!el) return;
    el.classList.add('is-invalid');
    setTimeout(function () { el.classList.remove('is-invalid'); }, 1400);
  }

  function parsePrice(text) {
    if (!text) return 0;
    var digits = text.replace(/[^\d]/g, '');
    return parseInt(digits || '0', 10);
  }

  /* ---------------------------
     Order button handler
     - Buttons must have class .order-btn and optional data-phone
     - Product card should contain .card-title and .price
     - Optional select with class .size-select
     - If user wants custom measurements, they can include them in the message
  ----------------------------*/
  document.addEventListener('click', function (e) {
    var btn = e.target.closest && e.target.closest('.order-btn');
    if (!btn) return;

    e.preventDefault();

    var card = closest(btn, '.product-card') || closest(btn, '.card') || btn.parentNode;
    if (!card) card = document.body;

    var titleEl = card.querySelector('.card-title') || card.querySelector('h5') || card.querySelector('.product-title');
    var priceEl = card.querySelector('.price') || card.querySelector('.card-text.price');
    var sizeSelect = card.querySelector('.size-select') || card.querySelector('select.size');
    var variantEl = card.querySelector('.variant') || card.querySelector('.color');
    var customInput = card.querySelector('.custom-measurements'); // optional textarea inside card

    var title = titleEl ? titleEl.textContent.trim() : 'Agbada';
    var price = priceEl ? priceEl.textContent.trim() : '';
    var size = sizeSelect ? (sizeSelect.value || '').trim() : '';
    var variant = variantEl ? variantEl.textContent.trim() : '';
    var custom = customInput ? (customInput.value || '').trim() : '';

    // Require size selection if a selector exists
    if (sizeSelect && (!size || size === '')) {
      flashInvalid(sizeSelect);
      try { sizeSelect.focus(); } catch (err) {}
      return;
    }

    var phone = btn.getAttribute('data-phone') || btn.dataset.phone || '2348136754060';

    var parts = [];
    parts.push('Hello, I am interested in: ' + title);
    if (variant) parts.push('Variant: ' + variant);
    if (size) parts.push('Size: ' + size);
    if (price) parts.push('Price: ' + price);
    if (custom) parts.push('Measurements/Notes: ' + custom);
    parts.push('Please confirm availability, delivery fee, tailoring options, and payment methods. Thank you.');

    var message = parts.join(' | ');

    openWhatsApp(phone, message);
  });

  /* ---------------------------
     Category filtering
  ----------------------------*/
  (function setupFilters() {
    var filterButtons = [].slice.call(document.querySelectorAll('[data-filter]'));
    if (!filterButtons.length) return;

    filterButtons.forEach(function (btn) {
      btn.addEventListener('click', function (ev) {
        ev.preventDefault();
        var filter = btn.getAttribute('data-filter');

        filterButtons.forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');

        var products = [].slice.call(document.querySelectorAll('.product-card'));
        products.forEach(function (p) {
          var cats = (p.getAttribute('data-category') || '').split(/\s+/).filter(Boolean);
          if (!filter || filter === 'all' || cats.indexOf(filter) !== -1) {
            p.style.display = '';
            p.classList.remove('d-none');
          } else {
            p.style.display = 'none';
            p.classList.add('d-none');
          }
        });

        var productsSection = document.getElementById('products');
        if (productsSection) productsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  })();

  /* ---------------------------
     Sort select (client-side)
  ----------------------------*/
  (function setupSort() {
    var sortSelect = document.getElementById('sort-select') || document.querySelector('select[data-sort]');
    if (!sortSelect) return;

    sortSelect.addEventListener('change', function () {
      var val = sortSelect.value;
      var grid = document.querySelector('#products .row');
      if (!grid) return;

      var cols = [].slice.call(grid.querySelectorAll('.col-6, .col-md-4, .col-lg-3')).filter(Boolean);
      var mapped = cols.map(function (col) {
        var card = col.querySelector('.product-card') || col.querySelector('.card');
        var priceText = card ? (card.querySelector('.price') || {}).textContent || '' : '';
        var price = parsePrice(priceText);
        var newest = card ? card.getAttribute('data-newest') === 'true' : false;
        return { col: col, price: price, newest: newest };
      });

      if (val === 'price-low') {
        mapped.sort(function (a, b) { return a.price - b.price; });
      } else if (val === 'price-high') {
        mapped.sort(function (a, b) { return b.price - a.price; });
      } else if (val === 'new') {
        mapped.sort(function (a, b) { return (b.newest === true) - (a.newest === true); });
      }

      mapped.forEach(function (m) { grid.appendChild(m.col); });
      grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  })();

  /* ---------------------------
     Lazy load images using IntersectionObserver
  ----------------------------*/
  (function setupLazyLoad() {
    var lazyImages = [].slice.call(document.querySelectorAll('img.lazy'));
    if (!lazyImages.length) return;

    if ('IntersectionObserver' in window) {
      var observer = new IntersectionObserver(function (entries, obs) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            var img = entry.target;
            var src = img.getAttribute('data-src');
            var srcset = img.getAttribute('data-srcset');
            if (src) img.src = src;
            if (srcset) img.srcset = srcset;
            img.classList.remove('lazy');
            img.classList.add('lazy-loaded');
            obs.unobserve(img);
          }
        });
      }, { rootMargin: '160px 0px', threshold: 0.01 });

      lazyImages.forEach(function (img) { observer.observe(img); });
    } else {
      lazyImages.forEach(function (img) {
        var src = img.getAttribute('data-src');
        var srcset = img.getAttribute('data-srcset');
        if (src) img.src = src;
        if (srcset) img.srcset = srcset;
        img.classList.remove('lazy');
        img.classList.add('lazy-loaded');
      });
    }
  })();

  /* ---------------------------
     Lightweight detail preview modal
     - Expects a simple modal container in the page with id="preview-modal"
     - If not present, creates a minimal overlay for quick preview
  ----------------------------*/
  (function setupPreview() {
    function createModal() {
      var modal = document.createElement('div');
      modal.id = 'preview-modal';
      modal.style.position = 'fixed';
      modal.style.top = '0';
      modal.style.left = '0';
      modal.style.width = '100%';
      modal.style.height = '100%';
      modal.style.display = 'none';
      modal.style.alignItems = 'center';
      modal.style.justifyContent = 'center';
      modal.style.background = 'rgba(0,0,0,0.6)';
      modal.style.zIndex = '1200';
      modal.innerHTML = '<div class="preview-modal" role="dialog" aria-modal="true" style="max-width:900px;margin:16px;">' +
        '<button aria-label="Close preview" id="preview-close" style="position:absolute;right:18px;top:18px;background:transparent;border:0;color:#fff;font-size:22px;cursor:pointer;">✕</button>' +
        '<img id="preview-image" class="hero" src="" alt="Preview image" style="width:100%;height:420px;object-fit:cover;display:block;" />' +
        '<div style="padding:16px;"><h3 id="preview-title" style="margin:0 0 8px 0;font-weight:800;color:#222;"></h3><p id="preview-price" style="margin:0;color:#666;font-weight:700;"></p></div>' +
        '</div>';
      document.body.appendChild(modal);

      modal.querySelector('#preview-close').addEventListener('click', function () {
        modal.style.display = 'none';
      });

      modal.addEventListener('click', function (ev) {
        if (ev.target === modal) modal.style.display = 'none';
      });

      return modal;
    }

    var modal = document.getElementById('preview-modal') || createModal();

    document.addEventListener('click', function (e) {
      var trigger = e.target.closest && e.target.closest('[data-preview]');
      if (!trigger) return;
      e.preventDefault();

      var card = closest(trigger, '.product-card') || closest(trigger, '.card') || trigger.parentNode;
      if (!card) return;

      var img = card.querySelector('img.card-img-top') || card.querySelector('img');
      var titleEl = card.querySelector('.card-title') || card.querySelector('h5');
      var priceEl = card.querySelector('.price');

      var src = img ? (img.getAttribute('data-src') || img.src) : '';
      var title = titleEl ? titleEl.textContent.trim() : '';
      var price = priceEl ? priceEl.textContent.trim() : '';

      var previewImg = modal.querySelector('#preview-image');
      var previewTitle = modal.querySelector('#preview-title');
      var previewPrice = modal.querySelector('#preview-price');

      if (previewImg && src) previewImg.src = src;
      if (previewTitle) previewTitle.textContent = title;
      if (previewPrice) previewPrice.textContent = price;

      modal.style.display = 'flex';
    });
  })();

  /* ---------------------------
     Newsletter form handler (no backend)
  ----------------------------*/
  (function setupNewsletter() {
    var form = document.getElementById('newsletter-form');
    if (!form) return;

    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var input = form.querySelector('input[name="email"]');
      if (!input) return;
      var email = (input.value || '').trim();
      if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
        flashInvalid(input);
        try { input.focus(); } catch (err) {}
        return;
      }

      var submitBtn = form.querySelector('button[type="submit"]');
      var originalText = submitBtn ? submitBtn.innerHTML : null;
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = 'Subscribed';
      }

      var msg = document.createElement('div');
      msg.className = 'mt-2 small text-success';
      msg.textContent = 'Thanks — we will keep you updated.';
      form.appendChild(msg);

      setTimeout(function () {
        if (submitBtn) { submitBtn.disabled = false; submitBtn.innerHTML = originalText; }
        try { form.reset(); } catch (err) {}
        setTimeout(function () { if (msg && msg.parentNode) msg.parentNode.removeChild(msg); }, 2000);
      }, 1600);
    });
  })();

  /* ---------------------------
     Accessibility: Enter key triggers focused order button
  ----------------------------*/
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      var active = document.activeElement;
      if (active && active.classList && active.classList.contains('order-btn')) {
        active.click();
      }
    }
  });

  /* ---------------------------
     End of men-Agbada.js
  ----------------------------*/
})();
