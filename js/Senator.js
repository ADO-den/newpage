// js/men-Senator.js
// JK Fashion Empire - Men's Senator page interactions
// - WhatsApp ordering with size validation
// - Category filtering (data-filter)
// - Sort select (client-side by price/newest)
// - Lazy image loading (data-src + IntersectionObserver)
// - Newsletter form lightweight handler
// - Accessibility helpers

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

    var title = titleEl ? titleEl.textContent.trim() : 'Senator set';
    var price = priceEl ? priceEl.textContent.trim() : '';
    var size = sizeSelect ? (sizeSelect.value || '').trim() : '';
    var variant = variantEl ? variantEl.textContent.trim() : '';

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
    parts.push('Please confirm availability, delivery fee, and payment options. Thank you.');

    var message = parts.join(' | ');

    openWhatsApp(phone, message);
  });

  /* ---------------------------
     Category filtering
     - Buttons with data-filter
     - Product cards with data-category (space-separated)
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
     - select id="sort-select" or select[data-sort]
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
     - Images should use data-src and class "lazy"
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
      }, { rootMargin: '120px 0px', threshold: 0.01 });

      lazyImages.forEach(function (img) { observer.observe(img); });
    } else {
      // fallback: load immediately
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
     Newsletter form handler (no backend)
     - Form id: newsletter-form
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
     End of men-Senator.js
  ----------------------------*/
})();
