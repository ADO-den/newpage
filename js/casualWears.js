// js/casual.js (fixed WhatsApp handling + existing features)
// JK Fashion Empire - Casual Wears page interactions
// - WhatsApp ordering with size validation
// - Category filtering (data-filter)
// - Sort select (client-side by price/newest)
// - Lazy image loading (data-src + IntersectionObserver)
// - Newsletter form lightweight handler
// - Accessibility helpers

(function () {
  'use strict';

  /* ---------------------------
     Helpers
  ----------------------------*/
  function closest(el, selector) {
    while (el && el !== document) {
      if (el.matches && el.matches(selector)) return el;
      el = el.parentNode;
    }
    return null;
  }

  // Ensure phone is digits only and has a country code; returns null if invalid
  function normalizePhone(raw) {
    if (!raw) return null;
    // Remove non-digit characters
    var digits = String(raw).replace(/[^\d]/g, '');
    if (!digits) return null;
    // If it already starts with country code (e.g., 234...), accept it
    // Otherwise, you can decide to prepend a default country code (here we assume Nigeria 234)
    if (digits.length >= 10 && digits[0] !== '0') {
      return digits;
    }
    // If it starts with a leading 0 (local format), replace with 234
    if (digits.length >= 10 && digits[0] === '0') {
      return '234' + digits.replace(/^0+/, '');
    }
    return null;
  }

  function openWhatsApp(phone, message) {
    // phone: raw phone string (may include + or spaces)
    // message: plain text message
    var normalized = normalizePhone(phone);
    if (!normalized) {
      // fallback to the known default if normalization fails
      normalized = '2348136754060';
      console.warn('Invalid phone provided for WhatsApp; using fallback:', normalized);
    }

    // Build URL correctly: https://wa.me/<phone>?text=<encoded message>
    var encodedMessage = encodeURIComponent(String(message || '').trim());
    var url = 'https://wa.me/' + normalized + (encodedMessage ? ('?text=' + encodedMessage) : '');
    // Open in a new tab/window
    try {
      window.open(url, '_blank');
    } catch (err) {
      // As a last resort, navigate the current window
      window.location.href = url;
    }
  }

  function flashInvalid(el) {
    if (!el) return;
    el.classList.add('is-invalid');
    setTimeout(function () { el.classList.remove('is-invalid'); }, 1400);
  }

  function parsePrice(text) {
    if (!text) return 0;
    var digits = String(text).replace(/[^\d]/g, '');
    return parseInt(digits || '0', 10);
  }

  /* ---------------------------
     WhatsApp Order Button Handler
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

    var title = titleEl ? titleEl.textContent.trim() : 'Product';
    var price = priceEl ? priceEl.textContent.trim() : '';
    var size = sizeSelect ? (sizeSelect.value || '').trim() : '';
    var variant = variantEl ? variantEl.textContent.trim() : '';

    if (sizeSelect && (!size || size === '')) {
      flashInvalid(sizeSelect);
      try { sizeSelect.focus(); } catch (err) {}
      return;
    }

    // Prefer data-phone on the button, then dataset, then fallback default
    var phoneAttr = btn.getAttribute('data-phone') || btn.dataset.phone || '2348136754060';

    var parts = [];
    parts.push('Hello, I am interested in: ' + title);
    if (variant) parts.push('Variant: ' + variant);
    if (size) parts.push('Size: ' + size);
    if (price) parts.push('Price: ' + price);
    parts.push('Please confirm availability, delivery fee, and payment options. Thank you.');

    var message = parts.join(' | ');

    openWhatsApp(phoneAttr, message);
  });

  /* ---------------------------
     Category filtering (buttons with data-filter)
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
     Sort select (basic)
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
      }, { rootMargin: '120px 0px', threshold: 0.01 });

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
     End of casual.js
  ----------------------------*/
})();
