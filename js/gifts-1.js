// js/gifts-1.js
// JK Fashion Empire - Gifts page interactions
// - Order via WhatsApp with package + add-ons selection
// - Preview overlay for package contents
// - Add-on selection and price calculation
// - Simple "request quote" handler and contact shortcuts
// - Lightweight accessibility helpers

(function () {
  'use strict';

  /* ---------------------------
     Utilities
  ----------------------------*/
  function qs(selector, ctx) { return (ctx || document).querySelector(selector); }
  function qsa(selector, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(selector)); }
  function closest(el, selector) {
    while (el && el !== document) {
      if (el.matches && el.matches(selector)) return el;
      el = el.parentNode;
    }
    return null;
  }
  function formatCurrency(n) {
    return '₦' + (Number(n) || 0).toLocaleString();
  }
  function parsePrice(text) {
    if (!text) return 0;
    var digits = String(text).replace(/[^\d]/g, '');
    return parseInt(digits || '0', 10);
  }
  function openWhatsApp(phone, message) {
    var url = 'https://wa.me/' + encodeURIComponent(phone) + '?text=' + encodeURIComponent(message);
    window.open(url, '_blank');
  }
  function flashInvalid(el) {
    if (!el) return;
    el.classList.add('is-invalid');
    setTimeout(function () { el.classList.remove('is-invalid'); }, 1400);
    try { el.focus(); } catch (e) {}
  }

  /* ---------------------------
     DOM refs
  ----------------------------*/
  var orderButtons = qsa('.order-btn');
  var previewTriggers = qsa('[data-preview]');
  var addOnList = qsa('.card.p-3 .list-unstyled li'); // generic selector for add-ons list items
  var previewOverlay = null;
  var previewImage = null;
  var previewTitle = null;
  var previewBody = null;

  /* ---------------------------
     Create preview overlay (reusable)
  ----------------------------*/
  function createPreviewOverlay() {
    var overlay = document.createElement('div');
    overlay.className = 'preview-overlay';
    overlay.style.display = 'none';
    overlay.innerHTML = ''
      + '<div class="preview-panel" role="dialog" aria-modal="true" aria-label="Package preview">'
      + '  <button type="button" class="btn-close" aria-label="Close preview" style="position:absolute;right:12px;top:12px;"></button>'
      + '  <img class="preview-img" src="" alt="Preview image" />'
      + '  <div class="preview-body">'
      + '    <h3 class="preview-title"></h3>'
      + '    <p class="preview-text small text-muted"></p>'
      + '    <div class="preview-actions mt-3 d-flex gap-2"></div>'
      + '  </div>'
      + '</div>';
    document.body.appendChild(overlay);

    previewImage = overlay.querySelector('.preview-img');
    previewTitle = overlay.querySelector('.preview-title');
    previewBody = overlay.querySelector('.preview-text');

    overlay.querySelector('.btn-close').addEventListener('click', function () {
      overlay.style.display = 'none';
    });

    overlay.addEventListener('click', function (ev) {
      if (ev.target === overlay) overlay.style.display = 'none';
    });

    return overlay;
  }

  previewOverlay = createPreviewOverlay();

  /* ---------------------------
     Preview handlers
  ----------------------------*/
  function handlePreviewClick(ev) {
    var trigger = ev.currentTarget;
    var card = closest(trigger, '.product-card') || closest(trigger, '.card') || trigger.parentNode;
    if (!card) return;

    var img = card.querySelector('img.card-img-top') || card.querySelector('img');
    var titleEl = card.querySelector('.card-title') || card.querySelector('h5');
    var priceEl = card.querySelector('.price');
    var includes = card.querySelectorAll('ul li');

    var src = img ? (img.getAttribute('data-src') || img.src) : '';
    var title = titleEl ? titleEl.textContent.trim() : '';
    var price = priceEl ? priceEl.textContent.trim() : '';
    var text = price ? price + ' · ' : '';
    if (includes && includes.length) {
      var items = [].slice.call(includes).map(function (li) { return li.textContent.trim(); });
      text += 'Includes: ' + items.join(', ');
    } else {
      text += card.querySelector('.card-text') ? card.querySelector('.card-text').textContent.trim() : '';
    }

    if (previewImage && src) previewImage.src = src;
    if (previewTitle) previewTitle.textContent = title;
    if (previewBody) previewBody.textContent = text;

    // actions: order and contact
    var actions = previewOverlay.querySelector('.preview-actions');
    actions.innerHTML = '';
    var orderBtn = document.createElement('button');
    orderBtn.className = 'btn btn-brown';
    orderBtn.textContent = 'Order this package';
    orderBtn.addEventListener('click', function () {
      // simulate clicking the package's order button
      var orderBtnInCard = card.querySelector('.order-btn');
      if (orderBtnInCard) orderBtnInCard.click();
      previewOverlay.style.display = 'none';
    });

    var contactBtn = document.createElement('button');
    contactBtn.className = 'btn btn-outline-brown';
    contactBtn.textContent = 'Contact Gifts Team';
    contactBtn.addEventListener('click', function () {
      openWhatsApp('2348136754060', 'Hello Gifts Team, I would like to ask about the "' + (title || 'package') + '".');
    });

    actions.appendChild(orderBtn);
    actions.appendChild(contactBtn);

    previewOverlay.style.display = 'flex';
  }

  previewTriggers.forEach(function (btn) {
    btn.addEventListener('click', function (ev) {
      ev.preventDefault();
      handlePreviewClick(ev);
    });
  });

  /* ---------------------------
     Add-ons selection and price calculation
     - We expect add-ons to be listed with a price text at the right
     - Each list item can have data-price attribute or price text
  ----------------------------*/
  function getAddOnItems() {
    // find add-ons by scanning list items that contain a price-like text
    var lists = qsa('.list-unstyled');
    var items = [];
    lists.forEach(function (list) {
      var lis = [].slice.call(list.querySelectorAll('li'));
      lis.forEach(function (li) {
        // skip if li contains no price-like text
        var priceMatch = li.textContent.match(/₦\s?[\d,]+|From\s?₦\s?[\d,]+|[\d,]+\s?₦/);
        var price = 0;
        if (li.dataset && li.dataset.price) {
          price = parsePrice(li.dataset.price);
        } else if (priceMatch) {
          price = parsePrice(priceMatch[0]);
        }
        items.push({ el: li, price: price });
      });
    });
    return items;
  }

  var addOnItems = getAddOnItems();

  // Enhance add-on items with checkbox UI
  addOnItems.forEach(function (item) {
    var li = item.el;
    // avoid double-wrapping
    if (li.querySelector('input[type="checkbox"]')) return;
    var label = document.createElement('label');
    label.style.display = 'flex';
    label.style.alignItems = 'center';
    label.style.justifyContent = 'space-between';
    label.style.width = '100%';
    var left = document.createElement('div');
    left.innerHTML = li.innerHTML.split(/\s{2,}/)[0] || li.textContent;
    var right = document.createElement('div');
    right.style.minWidth = '80px';
    right.style.textAlign = 'right';
    right.innerHTML = '<span class="addon-price">' + (item.price ? formatCurrency(item.price) : '') + '</span>';
    var checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'addon-checkbox';
    checkbox.dataset.price = item.price || 0;
    checkbox.style.marginRight = '10px';

    var leftWrap = document.createElement('div');
    leftWrap.style.display = 'flex';
    leftWrap.style.alignItems = 'center';
    leftWrap.appendChild(checkbox);
    var textSpan = document.createElement('span');
    textSpan.innerHTML = left.innerHTML;
    leftWrap.appendChild(textSpan);

    label.appendChild(leftWrap);
    label.appendChild(right);

    // clear li and append label
    li.innerHTML = '';
    li.appendChild(label);
  });

  /* ---------------------------
     Order button handler
     - Buttons have class .order-btn and data-package attribute
     - When clicked, open a lightweight order modal (built-in) to collect recipient details
  ----------------------------*/
  function createOrderModal() {
    var modal = document.createElement('div');
    modal.id = 'gift-order-modal';
    modal.style-1.cssText = 'position:fixed;inset:0;display:none;align-items:center;justify-content:center;background:rgba(0,0,0,0.6);z-index:1300;padding:20px;';
    modal.innerHTML = ''
      + '<div style="width:100%;max-width:720px;background:#fff;border-radius:12px;overflow:hidden;">'
      + '  <div style="padding:16px 18px;">'
      + '    <div class="d-flex align-items-center justify-content-between mb-2">'
      + '      <h4 id="order-modal-title" style="margin:0;font-weight:800;color:#222;">Order package</h4>'
      + '      <button type="button" id="order-modal-close" aria-label="Close" style="background:transparent;border:0;font-size:20px;cursor:pointer;">✕</button>'
      + '    </div>'
      + '    <form id="order-modal-form" class="row g-2" novalidate>'
      + '      <div class="col-12 col-md-6"><label class="form-label small">Your name</label><input name="buyerName" class="form-control" required /></div>'
      + '      <div class="col-12 col-md-6"><label class="form-label small">Your phone</label><input name="buyerPhone" class="form-control" placeholder="+234..." required /></div>'
      + '      <div class="col-12"><label class="form-label small">Recipient name</label><input name="recipientName" class="form-control" required /></div>'
      + '      <div class="col-12"><label class="form-label small">Delivery address</label><input name="address" class="form-control" required /></div>'
      + '      <div class="col-12 col-md-6"><label class="form-label small">Delivery date (optional)</label><input type="date" name="deliveryDate" class="form-control" /></div>'
      + '      <div class="col-12 col-md-6"><label class="form-label small">Include a note (optional)</label><input name="note" class="form-control" placeholder="Happy birthday!" /></div>'
      + '      <div class="col-12"><div id="order-selected-package" class="small text-muted mb-2"></div></div>'
      + '      <div class="col-12 d-flex gap-2 align-items-center">'
      + '        <button class="btn btn-brown" type="submit">Send order via WhatsApp</button>'
      + '        <button class="btn btn-outline-secondary" type="button" id="order-cancel">Cancel</button>'
      + '        <div class="ms-auto small text-muted" id="order-total"></div>'
      + '      </div>'
      + '    </form>'
      + '  </div>'
      + '</div>';
    document.body.appendChild(modal);

    modal.querySelector('#order-modal-close').addEventListener('click', function () { modal.style.display = 'none'; });
    modal.querySelector('#order-cancel').addEventListener('click', function () { modal.style.display = 'none'; });

    return modal;
  }

  var orderModal = createOrderModal();

  function calculateTotal(basePrice, selectedAddOnCheckboxes) {
    var total = Number(basePrice) || 0;
    selectedAddOnCheckboxes.forEach(function (cb) {
      total += Number(cb.dataset.price) || 0;
    });
    return total;
  }

  function handleOrderClick(ev) {
    ev.preventDefault();
    var btn = ev.currentTarget;
    var card = closest(btn, '.product-card') || closest(btn, '.card') || btn.parentNode;
    if (!card) return;

    var packageName = btn.dataset.package || card.getAttribute('data-package') || card.querySelector('.card-title') && card.querySelector('.card-title').textContent.trim();
    var priceEl = card.querySelector('.price');
    var basePrice = priceEl ? parsePrice(priceEl.textContent) : 0;

    // populate modal
    var selectedPackageEl = orderModal.querySelector('#order-selected-package');
    selectedPackageEl.textContent = (packageName ? packageName + ' · ' : '') + formatCurrency(basePrice);

    // reset form
    var form = orderModal.querySelector('#order-modal-form');
    form.reset();

    // show current add-ons (checkboxes from page)
    var addonCheckboxes = [].slice.call(document.querySelectorAll('.addon-checkbox'));
    // compute default total (none selected)
    var totalEl = orderModal.querySelector('#order-total');
    totalEl.textContent = 'Total: ' + formatCurrency(basePrice);

    // attach change listeners to update total live
    function updateTotal() {
      var selected = addonCheckboxes.filter(function (cb) { return cb.checked; });
      var total = calculateTotal(basePrice, selected);
      totalEl.textContent = 'Total: ' + formatCurrency(total);
    }

    // ensure we don't attach duplicate listeners
    addonCheckboxes.forEach(function (cb) {
      cb.removeEventListener('change', updateTotal);
      cb.addEventListener('change', updateTotal);
    });

    // submit handler
    function onSubmit(ev2) {
      ev2.preventDefault();
      var data = {
        buyerName: form.buyerName.value.trim(),
        buyerPhone: form.buyerPhone.value.trim(),
        recipientName: form.recipientName.value.trim(),
        address: form.address.value.trim(),
        deliveryDate: form.deliveryDate.value,
        note: form.note.value.trim()
      };

      // basic validation
      if (!data.buyerName) { flashInvalid(form.buyerName); return; }
      if (!data.buyerPhone) { flashInvalid(form.buyerPhone); return; }
      if (!data.recipientName) { flashInvalid(form.recipientName); return; }
      if (!data.address) { flashInvalid(form.address); return; }

      var selectedAddons = addonCheckboxes.filter(function (cb) { return cb.checked; }).map(function (cb) {
        return { label: cb.parentNode ? cb.parentNode.textContent.trim() : 'Add-on', price: Number(cb.dataset.price) || 0 };
      });

      var total = calculateTotal(basePrice, addonCheckboxes.filter(function (cb) { return cb.checked; }));

      // build message
      var parts = [];
      parts.push('Hello, I would like to order: ' + (packageName || 'Gift package'));
      parts.push('Buyer: ' + data.buyerName + ' (' + data.buyerPhone + ')');
      parts.push('Recipient: ' + data.recipientName);
      parts.push('Address: ' + data.address);
      if (data.deliveryDate) parts.push('Delivery date: ' + data.deliveryDate);
      if (data.note) parts.push('Note: ' + data.note);
      if (selectedAddons.length) {
        parts.push('Add-ons: ' + selectedAddons.map(function (a) { return a.label + ' (' + formatCurrency(a.price) + ')'; }).join('; '));
      }
      parts.push('Total: ' + formatCurrency(total));
      parts.push('Please confirm availability and delivery fee. Thank you.');

      var message = parts.join(' | ');

      // open WhatsApp to gifts team
      openWhatsApp(btn.getAttribute('data-phone') || '2348136754060', message);

      // cleanup
      form.removeEventListener('submit', onSubmit);
      orderModal.style.display = 'none';
    }

    form.removeEventListener('submit', onSubmit);
    form.addEventListener('submit', onSubmit);

    // show modal
    orderModal.style.display = 'flex';
    // focus first input
    setTimeout(function () {
      var first = form.querySelector('input, textarea, select');
      if (first) first.focus();
    }, 120);
  }

  orderButtons.forEach(function (btn) {
    btn.addEventListener('click', handleOrderClick);
  });

  /* ---------------------------
     Request quote / corporate contact shortcuts
  ----------------------------*/
  var quoteLinks = qsa('a[href^="mailto:gifts@"], a[href*="Corporate%20Gifts"], a[href*="Corporate%20Gifts%20Inquiry"]');
  quoteLinks.forEach(function (lnk) {
    lnk.addEventListener('click', function () {
      // no-op: allow default mailto or external behavior; we keep this hook for analytics or future enhancements
    });
  });

  /* ---------------------------
     Small accessibility helpers
  ----------------------------*/
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      if (previewOverlay && previewOverlay.style.display === 'flex') previewOverlay.style.display = 'none';
      if (orderModal && orderModal.style.display === 'flex') orderModal.style.display = 'none';
    }
  });

  /* ---------------------------
     Initialize lazy images (simple)
  ----------------------------*/
  (function initLazy() {
    var lazy = [].slice.call(document.querySelectorAll('img.lazy'));
    if (!lazy.length) return;
    if ('IntersectionObserver' in window) {
      var obs = new IntersectionObserver(function (entries, o) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            var img = entry.target;
            var src = img.getAttribute('data-src');
            var srcset = img.getAttribute('data-srcset');
            if (src) img.src = src;
            if (srcset) img.srcset = srcset;
            img.classList.remove('lazy');
            img.classList.add('lazy-loaded');
            o.unobserve(img);
          }
        });
      }, { rootMargin: '120px 0px', threshold: 0.01 });
      lazy.forEach(function (img) { obs.observe(img); });
    } else {
      lazy.forEach(function (img) {
        var src = img.getAttribute('data-src');
        if (src) img.src = src;
        img.classList.remove('lazy');
        img.classList.add('lazy-loaded');
      });
    }
  })();

  /* ---------------------------
     End of gifts-1.js
  ----------------------------*/
})();
