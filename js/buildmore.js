/* BUILD MORE: the optional area on the dashboard (Kids Club standard: light first build). The first time through asks
   only the T0 questions, about 1/PHI^2 of each set, highest priority first. Everything else waits here, and he can come
   back any time:
   - more about each piece: the later parts of each piece and the Arduino challenges (js/pieces.js, mode 'more')
   - name more: what can change about a part (colour, size, speed, direction, see-through), optional (js/onboard.js)
   - more of what you want to learn: the rest of the learn questions (js/onboard.js)
   - the extra questions (js/app.js)
   - your logo (js/logo.js): the logo step. Opening it hands the logo over to him for good
   This file loads when he taps "Open Build more", or in an idle slot after the page opens. Every round has its own
   on-device resume record (Continue / Start over). Nothing personal in this file. */
(function () {
  'use strict';
  if (window.BuildMore) return;
  var $ = function (id) { return document.getElementById(id); };
  var TILES = [
    // the logo step (Kids Club "Logo grows with the page"): the next item after the first build. Opening it is the hand-over (js/logo.js)
    { id: 'bm-logo', label: '\u2728 Make your logo yours', cont: '\u2728 Change your logo', rid: 'logo', run: function () { if (window.Logo) Logo.step(); }, over: null, own: function (b) { b.textContent = window.Logo && Logo.handed() ? '\u2728 Change your logo' : '\u2728 Make your logo yours'; return true; } },
    { id: 'bm-pieces', label: 'More about each piece', cont: 'Continue: more about each piece', rid: 'more', run: function () { Pieces.more(); }, over: null, own: function (b) { if (window.Pieces && Pieces.moreBtn) { Pieces.moreBtn(b); return true; } } },
    { id: 'bm-name', label: 'Name more: what can change', cont: 'Continue naming more', rid: 'naming-more', run: function () { Onboard.nameMore(); }, over: function () { Onboard.resetNameMore(); } },
    { id: 'bm-learn', label: 'More of what you want to learn', cont: 'Continue: what you want to learn', rid: 'learn-more', run: function () { Onboard.learnMore(); }, over: function () { Onboard.resetLearnMore(); } }
  ];
  function refresh() {
    var box = $('bm-tiles'); if (!box) return;
    $('bm-list').hidden = false; var go = $('bm-go'); if (go) go.hidden = true;
    var open = !window.Onboard || Onboard.done();
    TILES.forEach(function (t) {
      var b = $(t.id); if (!b) { b = document.createElement('button'); b.type = 'button'; b.className = 'btn ghost2'; b.id = t.id; b.setAttribute('data-use', t.id); box.appendChild(b); }
      b.onclick = function () { if (window.Onboard && !Onboard.done()) { Onboard.start(); return; } t.run(); };
      if (!(t.own && t.own(b))) { if (window.Resume) Resume.button(b, t.rid, t.label, t.over, t.cont); else b.textContent = t.label; }
      b.disabled = !open; b.setAttribute('aria-disabled', String(!open)); b.title = open ? '' : 'Opens after step 1: naming the parts of your page';
      var so = $(t.id + '-over'); if (so) so.disabled = !open;
    });
  }
  document.addEventListener('bi:lock', function () { var box = $('bm-tiles'); if (box) box.innerHTML = ''; var l = $('bm-list'); if (l) l.hidden = true; var go = $('bm-go'); if (go) go.hidden = false; });
  window.BuildMore = { refresh: refresh };
  refresh();
})();
