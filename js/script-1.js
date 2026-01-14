// js/script-1.js
// JK Fashion Empire - interactive behaviors
// - WhatsApp ordering (order-btn)
// - Smooth anchor scrolling
// - Simple search toggle (if search input exists)
// - Lazy image loading (IntersectionObserver)
// - Small UX helpers (size validation feedback)

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

  function openWhatsApp(phone, message) {
    // phone should be in E.164 without plus, e.g. 2348136754060
    var url = 'https://wa.me/' + encodeURIComponent(phone) + '?text=' + encodeURIComponent(message);
    window.open(url, '_blank');
  }

  function flashInvalid(el) {
    if (!el) return;
    el.classList.add('is-invalid');
    setTimeout(function () {
      el.classList.remove('is-invalid');
    }, 1600);
  }

  /* ---------------------------
     WhatsApp Order Button
     - Buttons must have class .order-btn and data-phone attribute
     - Product card should contain .card-title and .price
     - Optional select with class .size-select
  ----------------------------*/
  document.addEventListener('click', function (e) {
    var btn = e.target.closest && e.target.closest('.order-btn');
    if (!btn) return;

    e.preventDefault();

    var card = closest(btn, '.product-card') || closest(btn, '.card') || btn.closest('article') || btn.parentNode;
    if (!card) card = document.body;

    var titleEl = card.querySelector('.card-title') || card.querySelector('h5') || card.querySelector('.product-title');
    var priceEl = card.querySelector('.price') || card.querySelector('.card-text.price');
    var sizeSelect = card.querySelector('.size-select') || card.querySelector('select');

    var title = titleEl ? titleEl.textContent.trim() : 'Product';
    var price = priceEl ? priceEl.textContent.trim() : '';
    var size = sizeSelect ? sizeSelect.value.trim() : '';

    // Validate size if select exists
    if (sizeSelect && (!size || size === '')) {
      flashInvalid(sizeSelect);
      // Optionally focus the select for accessibility
      try { sizeSelect.focus(); } catch (err) {}
      return;
    }

    // Optional color or variant
    var variantEl = card.querySelector('.variant') || card.querySelector('.color');
    var variant = variantEl ? variantEl.textContent.trim() : '';

    // Phone number from button data attribute
    var phone = btn.getAttribute('data-phone') || btn.dataset.phone || '2348136754060';

    // Build message
    var messageParts = [];
    messageParts.push('Hello, I am interested in the ' + title);
    if (variant) messageParts.push('Variant: ' + variant);
    if (size) messageParts.push('Size: ' + size);
    if (price) messageParts.push('Price: ' + price);
    messageParts.push('Please confirm availability, delivery fee, and payment options. Thank you.');

    var message = messageParts.join(' | ');

    openWhatsApp(phone, message);
  });

  /* ---------------------------
     Smooth scroll for internal anchors
  ----------------------------*/
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a) return;
    var href = a.getAttribute('href');
    if (!href || href === '#') return;
    var target = document.querySelector(href);
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    // update URL hash without jumping
    history.replaceState(null, '', href);
  });

  /* ---------------------------
     Search toggle (if you have a search icon and input)
     - Add data-search-toggle attribute to the search icon/button
     - Add id="site-search" to the search input wrapper or input
  ----------------------------*/
  document.addEventListener('click', function (e) {
    var toggle = e.target.closest && e.target.closest('[data-search-toggle]');
    if (!toggle) return;
    e.preventDefault();
    var search = document.getElementById('site-search');
    if (!search) return;
    search.classList.toggle('d-none');
    // focus the input if present
    var input = search.querySelector('input') || search;
    try { input.focus(); } catch (err) {}
  });

  /* ---------------------------
     Lazy load images using IntersectionObserver
     - Images should use data-src and optionally data-srcset
     - Example: <img data-src="images/..." class="lazy" alt="">
  ----------------------------*/
  (function setupLazyLoad() {
    var lazyImages = [].slice.call(document.querySelectorAll('img.lazy'));
    if (!lazyImages.length) return;

    if ('IntersectionObserver' in window) {
      var imgObserver = new IntersectionObserver(function (entries, observer) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            var img = entry.target;
            var src = img.getAttribute('data-src');
            var srcset = img.getAttribute('data-srcset');
            if (src) img.src = src;
            if (srcset) img.srcset = srcset;
            img.classList.remove('lazy');
            img.classList.add('lazy-loaded');
            imgObserver.unobserve(img);
          }
        });
      }, { rootMargin: '120px 0px', threshold: 0.01 });

      lazyImages.forEach(function (img) { imgObserver.observe(img); });
    } else {
      // Fallback: load all images immediately
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
     Small accessibility: enable Enter key on focused order buttons
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
     Optional: simple newsletter form handler (no backend)
     - Form should have id="newsletter-form" and an input[name="email"]
  ----------------------------*/
  var newsletter = document.getElementById('newsletter-form');
  if (newsletter) {
    newsletter.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var email = newsletter.querySelector('input[name="email"]');
      if (!email) return;
      var val = (email.value || '').trim();
      // basic email check
      if (!val || !/^\S+@\S+\.\S+$/.test(val)) {
        email.classList.add('is-invalid');
        setTimeout(function () { email.classList.remove('is-invalid'); }, 1400);
        return;
      }
      // show a friendly message (no backend)
      var btn = newsletter.querySelector('button[type="submit"]');
      var original = btn ? btn.innerHTML : null;
      if (btn) {
        btn.disabled = true;
        btn.innerHTML = 'Subscribed';
      }
      // small visual confirmation
      var msg = document.createElement('div');
      msg.className = 'mt-2 small text-success';
      msg.textContent = 'Thanks — we will keep you updated.';
      newsletter.appendChild(msg);
      setTimeout(function () {
        if (btn) { btn.disabled = false; btn.innerHTML = original; }
        try { newsletter.reset(); } catch (err) {}
      }, 2200);
    });
  }

  /* ---------------------------
     End of script
  ----------------------------*/
})();
// js/men.js
// JK Fashion Empire - Men page interactions
// Features:
// - WhatsApp ordering (order-btn) with size/variant validation
// - Smooth internal anchor scrolling
// - Lazy image loading (data-src + IntersectionObserver)
// - Simple product filter by category buttons (if present)
// - Newsletter form lightweight handler
// - Small accessibility helpers

(function () {
  'use strict';

  /* ---------------------------
     Utility helpers
  ----------------------------*/
  function closest(el, selector) {
    while (el && el !== document) {
      if (el.matches && el.matches(selector)) return el;
      el = el.parentNode;
    }
    return null;
  }

  function openWhatsApp(phone, message) {
    // phone must be digits only (E.164 without +). Example: 2348136754060
    var url = 'https://wa.me/' + encodeURIComponent(phone) + '?text=' + encodeURIComponent(message);
    window.open(url, '_blank');
  }

  function flashInvalid(el) {
    if (!el) return;
    el.classList.add('is-invalid');
    setTimeout(function () { el.classList.remove('is-invalid'); }, 1400);
  }

  /* ---------------------------
     WhatsApp Order Button Handler
     - Buttons must have class .order-btn and data-phone attribute
     - Product card should contain .card-title and .price
     - Optional select with class .size-select
     - Optional element with class .variant for color/variant text
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

    // Validate size if select exists
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
     Smooth scroll for internal anchors
  ----------------------------*/
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a) return;
    var href = a.getAttribute('href');
    if (!href || href === '#') return;
    var target = document.querySelector(href);
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    // update URL hash without jumping
    try { history.replaceState(null, '', href); } catch (err) {}
  });

  /* ---------------------------
     Lazy load images using IntersectionObserver
     - Images should use data-src and class "lazy"
     - Example: <img data-src="images/..." class="lazy" alt="">
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
     Simple product filter (optional)
     - If you have buttons with data-filter attributes and product cards with data-category,
       this will show/hide products without reloading.
     - Example filter button: <button data-filter="casual">Casual</button>
     - Example product: <div class="product-card" data-category="casual traditional">
  ----------------------------*/
  (function setupFilters() {
    var filterButtons = [].slice.call(document.querySelectorAll('[data-filter]'));
    if (!filterButtons.length) return;

    filterButtons.forEach(function (btn) {
      btn.addEventListener('click', function (ev) {
        ev.preventDefault();
        var filter = btn.getAttribute('data-filter');
        // toggle active class
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
      });
    });
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
        // remove message after a short delay
        setTimeout(function () { if (msg && msg.parentNode) msg.parentNode.removeChild(msg); }, 2000);
      }, 1800);
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
     Optional: quick product preview modal (if you include a modal in HTML)
     - Product cards can have a .preview-btn with data-target="#previewModal"
     - This block will populate modal content if present
  ----------------------------*/
  (function setupPreviewModal() {
    var modalEl = document.getElementById('productPreviewModal');
    if (!modalEl) return;
    var modalTitle = modalEl.querySelector('.modal-title');
    var modalBody = modalEl.querySelector('.modal-body');

    document.addEventListener('click', function (e) {
      var previewBtn = e.target.closest && e.target.closest('.preview-btn');
      if (!previewBtn) return;
      e.preventDefault();
      var card = closest(previewBtn, '.product-card') || previewBtn.parentNode;
      var title = (card.querySelector('.card-title') || {}).textContent || '';
      var img = card.querySelector('img') ? card.querySelector('img').src : '';
      var price = (card.querySelector('.price') || {}).textContent || '';

      if (modalTitle) modalTitle.textContent = title;
      if (modalBody) {
        modalBody.innerHTML = '';
        if (img) {
          var imgEl = document.createElement('img');
          imgEl.src = img;
          imgEl.alt = title;
          imgEl.style.maxWidth = '100%';
          imgEl.style.borderRadius = '8px';
          modalBody.appendChild(imgEl);
        }
        var p = document.createElement('p');
        p.className = 'mt-3';
        p.textContent = price;
        modalBody.appendChild(p);
      }

      // show bootstrap modal
      try {
        var bsModal = new bootstrap.Modal(modalEl);
        bsModal.show();
      } catch (err) {}
    });
  })();

  /* ---------------------------
     End of men.js
  ----------------------------*/
})();

// js/Agbada.js
// JK Fashion Empire - Agbada page interactions
// - WhatsApp ordering with size validation
// - Category filtering (data-filter)
// - Sort select (client-side by price/newest)
// - Lazy image loading (data-src + IntersectionObserver)
// - Optional preview modal population
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
     WhatsApp order button
     - Buttons must have class .order-btn and data-phone attribute
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

    var title = titleEl ? titleEl.textContent.trim() : 'Product';
    var price = priceEl ? priceEl.textContent.trim() : '';
    var size = sizeSelect ? (sizeSelect.value || '').trim() : '';
    var variant = variantEl ? variantEl.textContent.trim() : '';

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
     Sort select (basic client-side)
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
     Lazy load images (data-src + class "lazy")
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
     Preview modal population (optional)
     - Modal id: productPreviewModal
     - Trigger: .preview-btn inside product card
  ----------------------------*/
  (function setupPreviewModal() {
    var modalEl = document.getElementById('productPreviewModal');
    if (!modalEl) return;
    var modalTitle = modalEl.querySelector('.modal-title');
    var modalBody = modalEl.querySelector('.modal-body');

    document.addEventListener('click', function (e) {
      var previewBtn = e.target.closest && e.target.closest('.preview-btn');
      if (!previewBtn) return;
      e.preventDefault();

      var card = closest(previewBtn, '.product-card') || previewBtn.parentNode;
      var title = (card.querySelector('.card-title') || {}).textContent || '';
      var imgSrc = card.querySelector('img') ? (card.querySelector('img').getAttribute('data-src') || card.querySelector('img').src) : '';
      var price = (card.querySelector('.price') || {}).textContent || '';
      var desc = card.getAttribute('data-desc') || '';

      if (modalTitle) modalTitle.textContent = title;
      if (modalBody) {
        modalBody.innerHTML = '';
        if (imgSrc) {
          var imgEl = document.createElement('img');
          imgEl.src = imgSrc;
          imgEl.alt = title;
          imgEl.style.maxWidth = '100%';
          imgEl.style.borderRadius = '8px';
          modalBody.appendChild(imgEl);
        }
        if (price) {
          var p = document.createElement('p');
          p.className = 'mt-3 fw-bold';
          p.textContent = price;
          modalBody.appendChild(p);
        }
        if (desc) {
          var d = document.createElement('p');
          d.className = 'mt-2 text-muted';
          d.textContent = desc;
          modalBody.appendChild(d);
        }
      }

      try {
        var bsModal = new bootstrap.Modal(modalEl);
        bsModal.show();
      } catch (err) {}
    });
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

})();

// js/kaftan.js
// JK Fashion Empire - Kaftan page interactions
// - WhatsApp ordering with size validation
// - Category filtering (data-filter)
// - Sort select (client-side by price/newest)
// - Lazy image loading (data-src + IntersectionObserver)
// - Optional preview modal population
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
     WhatsApp order button
     - Buttons must have class .order-btn and data-phone attribute
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

    var title = titleEl ? titleEl.textContent.trim() : 'Product';
    var price = priceEl ? priceEl.textContent.trim() : '';
    var size = sizeSelect ? (sizeSelect.value || '').trim() : '';
    var variant = variantEl ? variantEl.textContent.trim() : '';

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
     Sort select (basic client-side)
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
     Lazy load images (data-src + class "lazy")
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
     Preview modal population (optional)
     - Modal id: productPreviewModal
     - Trigger: .preview-btn inside product card
  ----------------------------*/
  (function setupPreviewModal() {
    var modalEl = document.getElementById('productPreviewModal');
    if (!modalEl) return;
    var modalTitle = modalEl.querySelector('.modal-title');
    var modalBody = modalEl.querySelector('.modal-body');

    document.addEventListener('click', function (e) {
      var previewBtn = e.target.closest && e.target.closest('.preview-btn');
      if (!previewBtn) return;
      e.preventDefault();

      var card = closest(previewBtn, '.product-card') || previewBtn.parentNode;
      var title = (card.querySelector('.card-title') || {}).textContent || '';
      var imgSrc = card.querySelector('img') ? (card.querySelector('img').getAttribute('data-src') || card.querySelector('img').src) : '';
      var price = (card.querySelector('.price') || {}).textContent || '';
      var desc = card.getAttribute('data-desc') || '';

      if (modalTitle) modalTitle.textContent = title;
      if (modalBody) {
        modalBody.innerHTML = '';
        if (imgSrc) {
          var imgEl = document.createElement('img');
          imgEl.src = imgSrc;
          imgEl.alt = title;
          imgEl.style.maxWidth = '100%';
          imgEl.style.borderRadius = '8px';
          modalBody.appendChild(imgEl);
        }
        if (price) {
          var p = document.createElement('p');
          p.className = 'mt-3 fw-bold';
          p.textContent = price;
          modalBody.appendChild(p);
        }
        if (desc) {
          var d = document.createElement('p');
          d.className = 'mt-2 text-muted';
          d.textContent = desc;
          modalBody.appendChild(d);
        }
      }

      try {
        var bsModal = new bootstrap.Modal(modalEl);
        bsModal.show();
      } catch (err) {}
    });
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
     End of kaftan.js
  ----------------------------*/
})();



// js/standard.js
// JK Fashion Empire - Standard Wears page interactions
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
     WhatsApp Order Button Handler
     - Buttons must have class .order-btn and data-phone attribute
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

    var title = titleEl ? titleEl.textContent.trim() : 'Product';
    var price = priceEl ? priceEl.textContent.trim() : '';
    var size = sizeSelect ? (sizeSelect.value || '').trim() : '';
    var variant = variantEl ? variantEl.textContent.trim() : '';

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
     Category filtering (buttons with data-filter)
     - Buttons: data-filter="sets" etc.
     - Product cards: data-category="sets combos"
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
     Sort select (basic client-side)
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
     End of standard.js
  ----------------------------*/
})();
