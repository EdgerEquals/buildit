/* PHI PUMPS: this page's pump root (rule 9) and entity registry (rule 10). This page's own copy of the Kids Club engine file
   (logo sound and motion standard); it changes only through this page's bot and never loads another page's files.
   PUMP TREE, Fibonacci counts down the tree: page 13 -> logo 8 -> each sound or motion layer 5 -> each chain parameter 3 ->
   each small detail 2. A node with N pumps = N slow sine modes; mode j has period B x PHI^(k0 + j) (whole phi steps, Rule phi)
   and phase 2 pi frac((j + 1 + seed) / PHI) (golden angle). Output = parent output x (1 + depth x mean of its modes), so a
   parent's output is the input-power scaler of every child. Depths are phi powers (page PHI^-4, then one step less each level).
   ANCHOR B (Rule phi, anchor B: no fixed seed). B is the base period every logo timing hangs off:
     pump 1 moon: the lunar tide clock (M2) from the on-device sky clocks (js/dials.js), B1 = P_M2 x PHI^-18, swung by its
                  own perigee/apogee ratio: B1 x swing^(c_M2 / 2). (18 = the whole phi step that lands the 12.42 h clock
                  nearest a resting breath; an exponent, not a value.)
     pump 2 temperature: NOT WIRED. This page has no weather feed and none is added here (no network call). FLAGGED for Danny.
     pump 3 the kid's own rhythm: his measured gap between taps (js/dials.js, numbers only), taking over in phi steps:
                  weight w = 1 - PHI^-(sessions - 1); B = B1^(1 - w) x gap^w (a geometric glide, so it is a ratio throughout).
   Floors after (Rule phi, WCAG 2.3.1 / 2.2.2): no looping motion faster than B x PHI^-2; reduced motion stops loops.
   Cheap: no timers, no rAF, no storage; values are computed only when something reads them. Loaded with the logo (after unlock).
   REGISTRY: page entities are provided once and logos subscribe by name (all -1..1 unless noted; null = this page has none):
     pump:page        the page pump root output (around 1)
     daytime          sun height at the coarse point (sky clocks): -1 rest .. +1 day, smooth through dusk and dawn
     quiet            logo loudness share (0..1): 1 by day, PHI^-n at rest, eased by the same sun signal, so day length sets
                      how long the quiet lasts; n = Dial 3's rung (js/dials.js season rung; closed = no quiet hours)
     tide             the lunar tide clock M2 (sky clocks, no feed)
     clock            the solar tide clock S2 (sky clocks; replaces the wall-clock drift)
     moon             -cos(mean elongation): -1 new .. +1 full (Meeus, sky clocks)
     ratio-pump       RatioPump.pump() mapped to -1..+1 across its own range (PHI^-1/4 .. 1)
     phi-adapt:<id>   on-device usage weight for a part id, 1 - exp(-weight / PHI^3) (js/adapt.js), 0..1
     component:theme  -1 (this page is dark)
     progress         the logo's own assembly share (0..1, js/logo.js)
   API: PhiPumps.node(name, n, k0, depth, parent, seed) · PhiPumps.page · PhiPumps.logo(id) · PhiPumps.B() · PhiPumps.now()
        PhiPumps.provide(name, fn) · PhiPumps.subscribe(name) -> {name, get()} · PhiPumps.names() · PhiPumps.tree() */
(function () {
  'use strict';
  if (window.PhiPumps) return;
  var PHI = 1.6180339887, G = 1 / PHI;
  var RM = window.matchMedia ? matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  function now() { return ((window.performance && performance.now) ? performance.now() : Date.now()) / 1000; }
  function sky() { try { return window.Dials && Dials.sky ? Dials.sky() : null; } catch (e) { return null; } }
  function pumpOf(P, id) { if (!P) return null; for (var i = 0; i < P.length; i++) if (P[i].id === id) return P[i]; return null; }
  // ---- anchor B (seconds, measured) ----
  var lastB = null;
  function B() {
    var P = sky(), m = pumpOf(P, 'M2'), r = window.Dials && Dials.rhythm ? Dials.rhythm() : null, b1 = null;
    if (m) b1 = m.p * 864e2 * Math.pow(PHI, -18) * Math.pow(m.sw, m.c / 2);   // days -> seconds is a unit change only
    var gap = r && (r.usual || r.gap), w = gap && r.sessions > 1 ? 1 - Math.pow(PHI, -(r.sessions - 1)) : 0;
    var b = b1 && gap ? Math.pow(b1, 1 - w) * Math.pow(gap, w) : (b1 || gap || lastB);
    if (!b) return null;   // neither pump is running: callers keep their own page ladder
    lastB = b; return b;
  }
  function floorPeriod(p) { var b = lastB || B(); return b ? Math.max(p, b * Math.pow(PHI, -2)) : p; }
  // ---- nodes ----
  function node(name, n, k0, depth, parent, seed) {
    seed = seed || 0; var ph = [];
    for (var j = 0; j < n; j++) ph.push(2 * Math.PI * (((j + 1 + seed) * G) % 1));
    function period(j) { var b = lastB || B() || 1; return floorPeriod(b * Math.pow(PHI, k0 + j)); }
    function modes(t) { if (RM.matches) return 0; if (t == null) t = now(); var s = 0; for (var j = 0; j < n; j++) s += Math.sin(2 * Math.PI * t / period(j) + ph[j]); return s / n; }
    return { name: name, n: n, k0: k0, depth: depth, parent: parent || null, period: period, modes: modes,
      out: function (t) { if (t == null) t = now(); var p = parent ? parent.out(t) : 1; return p * (1 + depth * modes(t)); } };
  }
  var page = node('page', 13, 0, Math.pow(PHI, -4), null, 0), reg = {}, logos = {};
  function provide(n, fn) { reg[n] = fn; }
  function subscribe(n) { return { name: n, get: function () {
    var f = reg[n], m = /^phi-adapt:(.+)$/.exec(n);
    if (!f && m) f = function () { var w = 0; try { w = window.Adapt ? Adapt.weight(m[1]) : 0; } catch (e) {} return 1 - Math.exp(-w / Math.pow(PHI, 3)); };
    if (!f) return null; try { var v = f(); return (typeof v === 'number' && isFinite(v)) ? v : null; } catch (e) { return null; } } }; }
  function sun() { var P = sky(), s = pumpOf(P, 'sun'); return s ? s.c : null; }
  provide('pump:page', function () { return page.out(); });
  provide('daytime', sun);
  provide('quiet', function () {
    var s = sun(); if (s == null) return null;
    var r = window.Dials && Dials.rungs ? Dials.rungs().season : 'closed', n = r === 'closed' || r == null ? 0 : +r;
    return Math.pow(PHI, -n * (1 - s) / 2);   // day 1, rest PHI^-n, smooth through dusk and dawn
  });
  provide('tide', function () { var q = pumpOf(sky(), 'M2'); return q ? q.c : null; });
  provide('clock', function () { var q = pumpOf(sky(), 'S2'); return q ? q.c : null; });
  provide('moon', function () { var P = sky(); return P && P.D != null ? -Math.cos(P.D * Math.PI / 180) : null; });
  provide('ratio-pump', function () { var R = window.RatioPump; if (!R || !R.pump) return null; var p = +R.pump(), lo = Math.pow(PHI, -0.25); return isFinite(p) ? Math.max(-1, Math.min(1, 2 * (p - lo) / (1 - lo) - 1)) : null; });
  provide('component:theme', function () { return document.documentElement.getAttribute('data-theme') === 'light' ? 1 : -1; });
  function logo(id) { return logos[id] || (logos[id] = node('logo:' + id, 8, -1, Math.pow(PHI, -5), page, 1)); }   // one shared 8-pump node per logo
  window.PhiPumps = { node: node, now: now, PHI: PHI, page: page, logo: logo, B: B, floor: floorPeriod, provide: provide, subscribe: subscribe,
    names: function () { return Object.keys(reg); },
    tree: function () { return { page: page.n, logos: Object.keys(logos).map(function (k) { return [k, logos[k].n]; }), B: lastB }; } };
})();
