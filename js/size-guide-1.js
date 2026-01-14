(function(){
  function createModal(){
    if(document.getElementById('size-guide-overlay')) return;
    var html = `
<div id="size-guide-overlay" class="sg-overlay" role="dialog" aria-modal="true" aria-labelledby="sg-title">
  <div class="sg-modal" role="document">
    <div class="sg-header">
      <div class="sg-title" id="sg-title">Size Guide — Select options</div>
      <button class="sg-close" aria-label="Close size guide">×</button>
    </div>
    <div class="sg-body">
      <div class="sg-controls">
        <label>Age
          <select id="sg-age">
            <option value="adult">Adult (18+)</option>
            <option value="teen">Teen (13-17)</option>
            <option value="child">Child (0-12)</option>
            <option value="senior">Senior (65+)</option>
          </select>
        </label>
        <label>Gender
          <select id="sg-gender">
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="unisex">Unisex</option>
          </select>
        </label>
        <label>Body type
          <select id="sg-body">
            <option value="average">Average</option>
            <option value="slim">Slim</option>
            <option value="plus">Plus / Curvy</option>
            <option value="short">Short</option>
            <option value="tall">Tall</option>
          </select>
        </label>
      </div>
      <div class="sg-result" id="sg-result">Choose options to see our suggested sizes.</div>
      <div style="margin-top:12px;font-size:.9rem;color:#444">Notes: This guide offers quick recommendations. For precise fits provide measurements when ordering.</div>
    </div>
  </div>
</div>
<button class="sg-floating" id="sg-open">Size Guide</button>
`;
    var wrap = document.createElement('div'); wrap.innerHTML = html;
    document.body.appendChild(wrap);

    var overlay = document.getElementById('size-guide-overlay');
    var btnClose = overlay.querySelector('.sg-close');
    var openBtn = document.getElementById('sg-open');
    var age = document.getElementById('sg-age');
    var gender = document.getElementById('sg-gender');
    var body = document.getElementById('sg-body');
    var result = document.getElementById('sg-result');

    function compute(){
      var a = age.value, g = gender.value, b = body.value;
      var rec = '';
      // Simple recommendation mapping
      if(a==='child'){
        rec = 'Kids sizes (use age as guide): 0-2: 1-2T, 3-5: 3-5, 6-8: 6-8, 9-12: 9-12. For narrower fits choose one size down.';
      } else if(a==='teen'){
        rec = 'Teens: XS - M depending on height. If slim → XS/S, if average → S/M, if tall → M, if plus → L.';
      } else {
        // adults/senior mapping by gender/body
        if(b==='slim') rec = (g==='female')? 'Recommended: XS-S (consider S for taller frames).' : 'Recommended: S-M (consider M for taller frames).';
        else if(b==='average') rec = (g==='female')? 'Recommended: S-M (most adults).' : 'Recommended: M-L (most adults).';
        else if(b==='plus') rec = (g==='female')? 'Recommended: L-XL (measure bust/chest and hip).' : 'Recommended: L-XXL (measure chest and waist).';
        else if(b==='short') rec = 'Recommended: take shorter/regular lengths; consider sizing normally but shorten where possible.';
        else if(b==='tall') rec = 'Recommended: choose tall/long options if available; consider one size up for length.';
        else rec = 'Recommended: S-M (default).';
        // refine by gender where helpful
        if(g==='unisex') rec += ' Use chest/waist measurements to be precise.';
      }
      result.textContent = rec;
    }

    openBtn.addEventListener('click', function(){ overlay.style.display='flex'; age.focus(); compute(); });
    btnClose.addEventListener('click', function(){ overlay.style.display='none'; });
    overlay.addEventListener('click', function(e){ if(e.target===overlay) overlay.style.display='none'; });
    [age,gender,body].forEach(function(el){ el.addEventListener('change', compute); });

    // Intercept links to size-guide.html and open modal instead
    document.addEventListener('click', function(e){
      var a = e.target.closest && e.target.closest('a');
      if(!a) return;
      var href = a.getAttribute('href');
      if(!href) return;
      if(href.indexOf('size-guide.html')!==-1 || href.endsWith('/size-guide') || href.endsWith('#size-guide')){
        e.preventDefault();
        overlay.style.display='flex'; age.focus(); compute();
      }
    });

    // also expose open function
    window.openSizeGuide = function(){ overlay.style.display='flex'; age.focus(); compute(); };
  }

  // inject after DOM ready
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', createModal);
  else createModal();
})();
