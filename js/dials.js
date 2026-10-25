/* GOLDEN-RATIO DIALS, ONE CLOSED LOOP (Kids Club core standard, 2026-10-25 20:02 AWST). PREVIEW: not live until Danny says go.
   Loaded at tier 1 AFTER unlock (js/app.js). No library, no network code path anywhere in this file.

   ONE DIAL SHAPE. A dial sits on the phi ladder: rung n = PHI^-n (1, .618, .382, .236, .146, .090 ...) or 'closed' (0).
   Feedback moves it one rung at a time, only between Danny's floor and ceiling; a push past them is kept as a proposal for
   Danny instead. What you see glides to the new rung (free-wheel, no snaps). Every move is logged on this device so it can
   be rolled back: Dials.rollback(). Each dial below uses this same shape.

   ONE RECORD (Stream 1). The dial state and the kid-pace reading live INSIDE the existing usage record (localStorage
   "buildit.adapt", key "dl", through Adapt.slot): no second store. Numbers only: gaps, counts per kind (roll, back, skip,
   answer, orb drop), session count, rungs. Never typed text, chat, passwords, names, places or what a button says.
   The same record tunes the dials AND gives the level reading (Dials.level(): pace band, tier depth, help amount).

   DIAL 1 info filter: the share passed up each rung of the on-device ladder, live -> session -> long-term -> ratio summary.
   Live events stay in memory and are never stored. Off-device gate: hard OFF (GATE below); there is no send path.
   DIAL 2 kid-pace retune range: how far today's pace may nudge animation speed and load-tier timing, in phi steps around
   the page's own ladder. DIAL 3 season pump: day length from the NOAA solar formulas (cited below), worked out on this
   device; it shifts palette warmth only, by a strength that is a dial rung. */
(function () {
  'use strict';
  if (window.Dials || !window.Adapt || !Adapt.slot) return;
  var PHI = 1.6180339887, GATE = false;   // off-device gate: OFF. Opening it needs Danny's rule 3 call first.

  // ===================== DANNY SETS THESE (PROPOSED; rungs only, n = PHI^-n, 'closed' = 0) =====================
  // Feedback moves a dial between floor and ceiling. Only Danny changes these lines.
  var RANGE = {
    info:   { ceil: 1, start: 2, floor: 5 },          // share passed up: .618 / .382 / .090
    pace:   { ceil: 2, start: 4, floor: 'closed' },   // retune half-width in phi steps: +-.382 (speed x0.83..x1.20) / +-.146 / none
    season: { ceil: 4, start: 5, floor: 'closed' }    // warmth strength: .146 / .090 / none
  };
  // ================================================================================================================

  function val(r) { return r === 'closed' ? 0 : Math.pow(PHI, -r); }
  function deeper(r) { return r === 'closed' ? 1e9 : r; }   // a bigger number = further down the ladder
  var own = 0.25; try { var o = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--own-step')); if (isFinite(o)) own = o; } catch (e) {}
  function sec(n) { return Math.pow(PHI, n + own); }        // this page's own ladder, PHI^(n + own step) s

  // ---- the one record ----
  var R = Adapt.slot('dl') || {};
  R.v = 1; R.s = (R.s | 0) + 1;
  R.r = R.r || {}; R.log = R.log || []; R.prop = R.prop || {};
  R.lt = R.lt || null;      // long-term profile (ratios and seconds)
  Object.keys(RANGE).forEach(function (k) { if (R.r[k] == null) R.r[k] = RANGE[k].start; R.r[k] = clamp(k, R.r[k]); });
  function clamp(k, r) { var g = RANGE[k]; if (deeper(r) < deeper(g.ceil)) return g.ceil; if (deeper(r) > deeper(g.floor)) return g.floor; return r; }
  function save() { Adapt.slot('dl', R); }

  // one rung at a time; outside Danny's range it becomes a proposal, never a move.
  // Open rungs run from the ceiling down; with a 'closed' floor, the step below the start rung closes the dial.
  function next(k, r, dir) {
    var g = RANGE[k]; if (dir > 0) return r === 'closed' ? g.start : r - 1;
    return r === 'closed' ? null : (g.floor === 'closed' && r >= g.start ? 'closed' : r + 1);
  }
  function move(k, dir, why) {
    var r = R.r[k], to = next(k, r, dir);
    if (to == null || (to !== 'closed' && to < 0) || clamp(k, to) !== to) { var p = R.prop[k] = R.prop[k] || { up: 0, down: 0 }; p[dir > 0 ? 'up' : 'down']++; return false; }
    R.log.push([R.s, k, r, to, why]); while (R.log.length > 13) R.log.shift();   // 13 = the page's own pump count (rule 9)
    R.r[k] = to; return true;
  }

  // ---- live layer (memory only) -> session layer ----
  var f1 = val(R.r.info) || val(RANGE.info.floor);
  var S = { n: 0, gap: 0, roll: 0, back: 0, skip: 0, ans: 0, drop: 0, lite: 0 }, lastT = 0, longest = sec(9);
  function live(kind) {
    var t = Date.now();
    if (lastT) { var g = (t - lastT) / 1000; if (g < longest) S.gap = S.gap ? S.gap + f1 * (g - S.gap) : g; }   // longer than the page's longest beat = away
    lastT = t; S.n++; if (kind) S[kind]++;
  }
  function kindOf(el) {
    if (!el || !el.closest) return null;
    if (el.closest('.roll')) return 'roll';
    if (el.closest('.bk,[id$="back"]')) return 'back';
    if (el.closest('.skip,[id*="skip"]')) return 'skip';
    if (el.closest('#q-lock,.tile,.choice button,.qo-opt,[data-pick]')) return 'ans';
    if (el.closest('#lite-btn')) return 'lite';
    return '';
  }
  document.addEventListener('click', function (e) { var k = kindOf(e.target); if (k !== null) live(k || null); }, { capture: true, passive: true });
  function hookOrb() { if (window.QuizOrb && QuizOrb.drop && !QuizOrb.drop._dl) { var d0 = QuizOrb.drop; QuizOrb.drop = function () { live('drop'); return d0.apply(this, arguments); }; QuizOrb.drop._dl = 1; } }   // help-orb drop targets: counted, never what was dropped on

  // ---- session -> long-term (share f1), on every hide; then the summary (ratios only) ----
  function rates(x) { var a = (x.ans || 0) + 1; return { gap: x.gap || 0, back: (x.back || 0) / a, skip: (x.skip || 0) / a, roll: (x.roll || 0) / a, drop: (x.drop || 0) / a }; }
  var folded = { n: 0 };
  function fold() {
    if (S.n - folded.n < 2) return;
    var now = rates(S), before = R.lt ? R.lt.back + R.lt.skip : null;
    if (!R.lt) R.lt = now; else Object.keys(now).forEach(function (k) { if (k === 'gap' && !R.lt.gap) R.lt.gap = now.gap; else if (k !== 'gap' || now.gap) R.lt[k] += f1 * (now[k] - R.lt[k]); });
    var lv = level();   // did this session change the reading? (checked by the next session)
    R.ps = { gap: now.gap, bs: now.back + now.skip, usual: before, lite: S.lite, ch: !lv0 || lv.pace !== lv0.pace || lv.help !== lv0.help || lv.depth !== lv0.depth };
    folded.n = S.n; save();
  }
  document.addEventListener('visibilitychange', function () { if (document.hidden) fold(); });
  addEventListener('pagehide', fold);
  document.addEventListener('bi:lock', fold);

  // ---- the level reading (the same record's second job) ----
  function level() {
    var lt = R.lt || rates(S), parts = (Adapt.data().parts) || {}, keys = Object.keys(parts);
    var used = keys.length ? keys.filter(function (k) { return Adapt.weight(k) > 0; }).length / keys.length : 0;
    var struggle = (lt.back + lt.skip + lt.drop) || 0;
    return {
      pace: lt.gap ? Math.round(Math.log(lt.gap) / Math.log(PHI) - own) + 0 : null,   // the rung of this page's ladder the kid's usual gap sits on
      depth: 1 + Math.round(used * 2),                                              // load tiers worth warming early: 1..3 of the page's tiers
      help: struggle ? Math.max(0, Math.round(-Math.log(struggle) / Math.log(PHI))) : null   // a rung: lower = more help wanted
    };
  }

  // ---- feedback: one rung per dial per session, checked against last session ----
  (function feedback() {
    var ps = R.ps, lt = R.lt; if (!ps || !lt) return;
    if (ps.done) return;   // each session is checked once, on the kid's own return rhythm (sessions, never clock times)
    if (ps.ch) move('info', 1, 'useful: it changed the reading'); else move('info', -1, 'not changing what helps');
    var z = lt.gap && ps.gap ? Math.log(lt.gap / ps.gap) / Math.log(PHI) : 0;
    if (ps.usual != null && ps.bs > ps.usual * PHI) move('pace', -1, 'more Back and Skip than usual');
    else if (Math.abs(z) >= val(R.r.pace)) move('pace', 1, 'pace pushed the edge, no extra Back or Skip');
    if (ps.lite) move('season', -1, 'Lite was switched on');
    else if (deeper(R.r.season) > deeper(RANGE.season.start)) move('season', 1, 'back toward the start rung');
    ps.done = 1;
  })();
  var lv0 = R.lt ? level() : null; save();

  // ---- glide: what you see follows the dial smoothly (damped, phi-timed; never a jump) ----
  var G = { pace: 0, season: 0 }, T = { pace: 0, season: 0 }, glideT = 0;
  function glide() {
    clearTimeout(glideT); var dt = sec(-2), tau = sec(3), a = 1 - Math.exp(-dt / tau), more = false;
    Object.keys(G).forEach(function (k) { G[k] += a * (T[k] - G[k]); if (Math.abs(T[k] - G[k]) > 1e-4) more = true; else G[k] = T[k]; });
    applyPace(); applySeason(); if (more) glideT = setTimeout(glide, dt * 1000);
  }

  // DIAL 2: nudge = half-width x tanh(z), z = today's pace against the kid's own usual, in phi steps
  function paceTarget() { var lt = R.lt, H = val(R.r.pace); if (!H || !lt || !lt.gap || !S.gap) return 0; return H * Math.tanh(Math.log(lt.gap / S.gap) / Math.log(PHI)); }
  var lastK = 1, subbed = 0;
  function applyPace() {
    var k = Math.pow(PHI, G.pace);   // >1 = a little quicker, <1 = calmer
    if (window.LoadTiers && LoadTiers.nudge) LoadTiers.nudge(-G.pace);
    if (!subbed && window.RatioPump && RatioPump.on) { subbed = 1; RatioPump.on(function () { lastK = 0; applyPace(); }); }
    if (Math.abs(k - lastK) < 1e-4 || !document.getAnimations || !window.RatioPump) return; lastK = k;
    var base = RatioPump.rate();
    document.getAnimations().forEach(function (an) { if (an.animationName && an.updatePlaybackRate) try { an.updatePlaybackRate(base * k); } catch (e) {} });
  }
  document.addEventListener('animationstart', function () { if (lastK !== 1) { lastK = 0; applyPace(); } }, true);

  // DIAL 3: season pump.
  // REFERENCE DATA (rule 11): NOAA Global Monitoring Laboratory, "General Solar Position Calculations"
  // (gml.noaa.gov/grad/solcalc/solareqns.PDF): fractional year, the solar declination series and its coefficients, and
  // the sunrise/sunset zenith of 90.833 deg. Fixed because they are published external data; pumped on top by the dial.
  function decl(doy) {
    var g = 2 * Math.PI / 365 * (doy - 1);
    return 0.006918 - 0.399912 * Math.cos(g) + 0.070257 * Math.sin(g) - 0.006758 * Math.cos(2 * g) + 0.000907 * Math.sin(2 * g) - 0.002697 * Math.cos(3 * g) + 0.00148 * Math.sin(3 * g);
  }
  function dayLen(lat, doy) {
    var p = lat * Math.PI / 180, d = decl(doy), c = Math.cos(90.833 * Math.PI / 180) / (Math.cos(p) * Math.cos(d)) - Math.tan(p) * Math.tan(d);
    return 2 * Math.acos(Math.max(-1, Math.min(1, c))) * 180 / Math.PI / 15;   // hours of daylight
  }
  // Latitude, coarse and on this device only: from the encrypted config after unlock (BI.lat(), if Danny adds one), else the
  // hemisphere and a coarse band from this browser's own time zone. Never stored, never sent, not in any public file.
  function latitude() {
    var c = window.BI && BI.lat && BI.lat(); if (c != null && isFinite(c)) return Math.round(c / 5) * 5;
    var tz = ''; try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) {}
    var south = /^(Australia|Antarctica)\/|^Pacific\/(Auckland|Chatham|Fiji|Noumea|Tongatapu)|^America\/(Argentina|Santiago|Sao_Paulo|Montevideo|Asuncion|La_Paz|Lima)|^Africa\/(Johannesburg|Maputo|Harare|Windhoek|Gaborone|Maseru|Mbabane|Lusaka)|^Indian\/(Mauritius|Reunion)/.test(tz);
    if (!south) { var y = new Date().getFullYear(), j = new Date(y, 0, 1).getTimezoneOffset(), u = new Date(y, 6, 1).getTimezoneOffset(); if (j < u) south = true; }
    return (south ? -1 : 1) * 30;   // the coarse mid-latitude band; Danny can give a better one in the encrypted config
  }
  var preview = /[?&]season=(summer|winter)/.exec(location.search);
  function seasonNow() {   // -1 shortest day .. +1 longest day, at this latitude
    var lat = latitude(), now = new Date(), doy = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 864e5);
    if (preview) return preview[1] === 'summer' ? 1 : -1;
    var lo = 99, hi = -1; for (var i = 1; i <= 365; i++) { var L = dayLen(lat, i); if (L < lo) lo = L; if (L > hi) hi = L; }
    return hi - lo > 1e-3 ? 2 * (dayLen(lat, doy) - lo) / (hi - lo) - 1 : 0;
  }
  // warmth: the surfaces lean toward the page's own warm colour (--bad) in long days and its own cool accent (--ac) in short ones
  var BASE = null, SURF = ['--bg', '--sf', '--sf2', '--me'];
  function rgb(h) { h = (h || '').trim().replace('#', ''); if (h.length === 3) h = h.replace(/./g, '$&$&'); var n = parseInt(h, 16); return isFinite(n) ? [n >> 16 & 255, n >> 8 & 255, n & 255] : null; }
  function applySeason() {
    var root = document.documentElement;
    if (!BASE) { var cs = getComputedStyle(root); BASE = {}; SURF.concat(['--bad', '--ac']).forEach(function (v) { BASE[v] = rgb(cs.getPropertyValue(v)); }); }
    var w = G.season, to = w >= 0 ? BASE['--bad'] : BASE['--ac'], m = Math.abs(w);
    SURF.forEach(function (v) { var b = BASE[v]; if (!b || !to) return;
      if (m < 1e-4) { root.style.removeProperty(v); return; }
      root.style.setProperty(v, 'rgb(' + b.map(function (c, i) { return Math.round(c + m * (to[i] - c)); }).join(',') + ')'); });
  }

  function retarget() { hookOrb(); T.pace = paceTarget(); T.season = val(R.r.season) * seasonNow(); glide(); }
  retarget(); setInterval(function () { if (!document.hidden) retarget(); }, sec(5) * 1000);

  var api = window.Dials = {
    v: 1, range: function () { return JSON.parse(JSON.stringify(RANGE)); },
    rungs: function () { return JSON.parse(JSON.stringify(R.r)); }, value: function (k) { return val(R.r[k]); },
    level: level,
    summary: function () { var lt = R.lt || {}; return { pace: level().pace, depth: level().depth, help: level().help, back: +(lt.back || 0).toFixed(3), skip: +(lt.skip || 0).toFixed(3) }; },   // ratios only
    gate: function () { return { open: GATE, wouldSend: GATE ? api.summary() : null }; },   // there is no send path in this file
    rollback: function (n) { n = n || 1; while (n-- > 0 && R.log.length) { var l = R.log.pop(); R.r[l[1]] = l[2]; } save(); retarget(); return api.rungs(); },
    report: function () { return { rungs: api.rungs(), level: level(), season: seasonNow(), gate: GATE, log: R.log.slice(), proposals: JSON.parse(JSON.stringify(R.prop)) }; }
  };
  // ---- preview panel for Danny (?dials=1): rungs, reading, last moves. Nothing here is sent anywhere. ----
  if (/[?&]dials=1/.test(location.search)) {
    var box = document.createElement('pre'); box.id = 'dials-pv'; box.setAttribute('aria-hidden', 'true');
    box.style.cssText = 'position:fixed;left:8px;bottom:56px;z-index:60;margin:0;padding:8px 10px;max-width:calc(100vw - 16px);font:12px/1.4 ui-monospace,monospace;background:var(--sf);color:var(--tx);border:1px solid var(--ln);border-radius:var(--r);opacity:.92;white-space:pre-wrap';
    document.body.appendChild(box);
    var show = function () { var x = api.report(); box.textContent = 'dials (preview)\ninfo ' + x.rungs.info + ' pace ' + x.rungs.pace + ' season ' + x.rungs.season + '\nseason ' + x.season.toFixed(3) + '  warmth ' + G.season.toFixed(3) + '\nreading ' + JSON.stringify(x.level) + '\ngate ' + (x.gate ? 'OPEN' : 'off'); };
    show(); setInterval(show, sec(1) * 1000);
  }
})();
