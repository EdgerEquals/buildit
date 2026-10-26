/* FIT (Kids Club 'every screen fits the smallest phone, in its measured space', Danny 15:41 / 15:53 AWST; portrait rule 17:03 / 17:20).
   Measures the space the content really gets: the visual viewport after the safe areas, minus the sticky header. --fit-s is that
   space's short side, x PHI^-1 in portrait (portrait means smaller); demo and preview boxes are PHI-ratios of it (css/style.css).
   Fit.check(main, row): if the main item and its whole first row are not on the first screen, --fit-k steps down by PHI^-1/2 (at most
   PHI^-3/2, then stops: reader text never shrinks). Re-fits on resize, rotation, Safari's bars and fonts loading. No layout reads per frame. */
(function () {
  'use strict';
  if (window.Fit) return;
  var PHI = 1.6180339887, de = document.documentElement, k = 0, last = null, rq = 0;
  var probe = document.createElement('i'); probe.style.cssText = 'position:fixed;visibility:hidden;pointer-events:none;padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)';
  function inset() { if (!probe.parentNode) document.body.appendChild(probe); var c = getComputedStyle(probe); return [c.paddingTop, c.paddingRight, c.paddingBottom, c.paddingLeft].map(function (v) { return parseFloat(v) || 0; }); }
  function measure() {
    var v = window.visualViewport, s = inset(), h = document.getElementById('head'), hb = h && h.offsetParent !== null ? h.getBoundingClientRect().height : 0;
    var w = (v ? v.width : innerWidth) - s[1] - s[3], ht = (v ? v.height : innerHeight) - s[0] - s[2] - hb;
    var S = Math.min(w, ht) * (ht > w ? 1 / PHI : 1);   // phi: portrait = short side x PHI^-1
    de.style.setProperty('--fit-s', Math.max(0, S).toFixed(1) + 'px'); de.style.setProperty('--fit-k', Math.pow(PHI, -k / 2).toFixed(4));
    if (last) check(last[0], last[1], true);
  }
  function check(main, row, again) {
    last = [main, row]; if (!again) k = 0;
    var m = typeof main === 'string' ? document.querySelector(main) : main, r = typeof row === 'string' ? document.querySelector(row) : row; if (!m || !r) return true;
    for (var i = 0; i < 4; i++) {
      var h = document.getElementById('head'), top = h ? h.getBoundingClientRect().bottom : 0, a = m.getBoundingClientRect(), b = r.getBoundingClientRect();
      if (a.top >= top - 1 && b.bottom <= innerHeight + 1) return true;
      if (k >= 3) return false; k++; de.style.setProperty('--fit-k', Math.pow(PHI, -k / 2).toFixed(4));   // phi: step PHI^-1/2, three steps at most
    }
    return false;
  }
  function soon() { if (!rq) rq = requestAnimationFrame(function () { rq = 0; measure(); }); }
  addEventListener('resize', soon); addEventListener('orientationchange', soon);
  if (window.visualViewport) visualViewport.addEventListener('resize', soon);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(soon);
  window.Fit = { check: check, measure: measure, state: function () { return { s: de.style.getPropertyValue('--fit-s'), k: k }; } };
  measure();
})();
