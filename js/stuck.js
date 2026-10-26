/* STUCK ALERT TO DAD (Kids Club standard, Danny 2026-10-26 13:35 AWST). Nothing changes on his screen.
   Pump A = the dials' Stream 1 tap rhythm (js/dials.js: his usual gap and the page's f1 share). On each step (the screen
   in view: its panel and the page's own heading) this keeps a step pace: an f1-smoothed gap, seeded with his usual gap,
   and the open gap since his last tap is folded in as it grows. z = how many PHI rungs slower than his usual.
   z >= 1 -> ONE encrypted relay message {kind:'stuck', step, label, before}; quiet on that step until z <= 0 (a one-rung
   band, so no flicker), then {kind:'recovered'}. Counted only while the page is visible (document.visibilityState);
   time away (hidden, or past the page's longest beat) never counts. step = an opaque id; label = the page's own heading;
   before = the kind of his last tap (roll, back, skip, ans, drop, tap). Never his words, never his call-me word.
   The box collector turns 'stuck' into the generic Dad ping and keeps the detail in a private log. */
(function () {
  'use strict';
  if (window.Stuck) return;
  var PHI = 1.6180339887, LN = Math.log(PHI), own = 0;
  try { var v = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--own-step')); if (isFinite(v)) own = v; } catch (e) {}
  var sec = function (n) { return Math.pow(PHI, n + own); };
  var cur = null, pace = 0, lastT = 0, before = 'tap', open = {}, tm = 0;
  function hash(s) { var h = 0; for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return (h >>> 0).toString(36); }   // 31: the usual string-hash multiplier (REFERENCE)
  function step() {
    var app = document.getElementById('screen-app'); if (!app || app.hidden) return null;
    var p = [].slice.call(app.querySelectorAll('section.panel')).filter(function (x) { return !x.hidden && x.offsetParent !== null; })[0]; if (!p) return null;
    var hd = p.querySelector('#q-phase, .phase, h2'), label = hd ? hd.textContent.replace(/\s+/g, ' ').trim().slice(0, 55) : '';   // 55: Fibonacci characters
    return { id: (p.id || 'panel') + ':' + hash(label), label: (p.id || 'panel') + (label ? ' · ' + label : '') };
  }
  function rh() { return window.Dials && Dials.rhythm ? Dials.rhythm() : null; }
  function enter(s, r) { cur = s; pace = r.usual; lastT = Date.now(); }
  function beat(g, kind) {
    var r = rh(); if (!r || !r.usual) return; var s = step(); if (!s) return;
    if (!cur || cur.id !== s.id) enter(s, r);
    else if (g > 0 && g < r.longest) pace += r.f1 * (g - pace);
    lastT = Date.now(); before = kind || 'tap';
  }
  function send(kind, s) {
    if (!window.BI || !BI.ready() || !BI.signal) return;
    BI.signal({ kind: kind, step: s.id, label: s.label, before: before });
  }
  function tick() {
    clearTimeout(tm); tm = setTimeout(tick, sec(2) * 1000);
    if (document.visibilityState !== 'visible' || !window.BI || !BI.ready()) return;
    var r = rh(); if (!r || !r.usual) return; var s = step(); if (!s) return;
    if (!cur || cur.id !== s.id) { enter(s, r); return; }
    var gap = (Date.now() - lastT) / 1000, p = pace;
    if (gap >= r.longest) return;   // past the page's longest beat = away, not stuck
    if (gap > p) p += r.f1 * (gap - p);   // the open gap, folded in as it grows
    var z = Math.log(p / r.usual) / LN;
    if (!open[s.id] && z >= 1) { open[s.id] = 1; send('stuck', s); }
    else if (open[s.id] && z <= 0) { delete open[s.id]; send('recovered', s); }
  }
  function hook() { if (window.Dials && Dials.onBeat) { Dials.onBeat(beat); tick(); } else setTimeout(hook, sec(2) * 1000); }
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible') lastT = Date.now(); });   // time hidden never counts
  document.addEventListener('bi:lock', function () { cur = null; open = {}; });
  window.Stuck = { state: function () { var r = rh(); return { step: cur && cur.id, pace: pace, usual: r && r.usual, open: Object.keys(open) }; } };
  hook();
})();
