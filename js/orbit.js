/* Orbit emojis (tier 2, decorative). Three of the space set from Danny's pages, on this page's own ladder. All timing is
   CSS (css/style.css .orb-*), so js/ratio-pump.js scales it with one rate. This file only builds the layer, sets each
   emoji's phi numbers, fades the layer out once scrolled past innerHeight/PHI^5 and shows it on the Questions view only.
   Orbit.SET is read by the questions to show the live numbers. */
(function () {
  'use strict';
  if (window.Orbit) return;
  var PHI = 1.6180339887, G = 0.6180339887;
  var OWN = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--own-step')); if (!isFinite(OWN)) OWN = 0.25;
  //          emoji        travel n  dir(+1 cw)  tilt deg (360/PHI^6, 360/PHI^5)
  var SET = [['\uD83D\uDE80', 7,   1,  -20.06],    // rocket
             ['\u2B50',       7.5, -1,  20.06],    // star
             ['\uD83C\uDF0D', 8,   1,  -32.46]];   // globe
  var app = document.getElementById('screen-app'), vq = document.getElementById('view-q');
  if (!app) return;
  var L = document.createElement('div'); L.className = 'orb-layer'; L.setAttribute('aria-hidden', 'true');
  function build(host, sc) {
    return SET.map(function (d, j) {
      var k = j + 1, T = Math.pow(PHI, d[1] + OWN), ph = (k * G) % 1, sz = Math.pow(PHI, -0.5 * j);
      var o = document.createElement('div'); o.className = 'orb';
      o.innerHTML = '<span class="orb-x"><span class="orb-y"><span class="orb-u"><span class="orb-e"></span></span></span></span>';
      o.querySelector('.orb-e').textContent = d[0];
      var st = o.style; st.setProperty('--tilt', d[3] + 'deg'); st.setProperty('--T', T.toFixed(3) + 's');
      st.setProperty('--rx', sc ? (sc[0] * sz).toFixed(1) + 'px' : 'calc(' + (100 / Math.pow(PHI, 3) * sz).toFixed(2) + 'vw)');
      st.setProperty('--ry', sc ? (sc[1] * sz).toFixed(1) + 'px' : 'calc(' + (100 / Math.pow(PHI, 4) * sz).toFixed(2) + 'vh)');
      // y runs a quarter cycle behind x (clockwise) or ahead of it (anticlockwise): that phase difference makes the ellipse
      st.setProperty('--dx', (-T * ph).toFixed(3) + 's'); st.setProperty('--dy', (-T * ((ph + (d[2] > 0 ? 0.25 : 0.75)) % 1)).toFixed(3) + 's');
      st.setProperty('--sd', 'calc(var(--ph6) * -' + ((k * G * G * G) % 1).toFixed(3) + ')'); st.setProperty('--sdir', j % 2 ? 'reverse' : 'normal');
      st.setProperty('--pd', 'calc(var(--ph5) * -' + ((k * G * G) % 1).toFixed(3) + ')');
      host.appendChild(o);
      return { e: d[0], travelN: d[1] + OWN, travelS: T, dir: d[2] > 0 ? 'clockwise' : 'anticlockwise', tilt: d[3], spinN: 6 + OWN, spinDir: j % 2 ? 'anticlockwise' : 'clockwise', pulseN: 5 + OWN, size: sz };
    });
  }
  var info = build(L);
  app.appendChild(L);
  function sync() { L.hidden = app.hidden || (vq && vq.hidden); }
  var away = false;
  function onScroll() { var a = (window.scrollY || 0) > innerHeight / Math.pow(PHI, 5); if (a !== away) { away = a; document.documentElement.classList.toggle('orb-away', a); } }
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  if (window.MutationObserver) { var mo = new MutationObserver(sync); mo.observe(app, { attributes: true, attributeFilter: ['hidden'] }); if (vq) mo.observe(vq, { attributes: true, attributeFilter: ['hidden'] }); }
  sync();
  window.Orbit = { SET: info, demo: function (host, rx, ry) { return build(host, [rx, ry]); } };
  document.dispatchEvent(new CustomEvent('orbit:ready'));
})();
