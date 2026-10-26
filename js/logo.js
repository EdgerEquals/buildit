/* LOGO GROWS WITH THE PAGE (Kids Club "Logo grows with the page", extended to this page by Danny 2026-10-26 12:28 AWST; logo sound
   and motion standard). PREVIEW. Loaded after unlock only (tier 2, js/app.js); nothing before the password.
   ASSEMBLES FROM WHAT HE HAS BUILT. The logo is made only of what he has already done and picked on this page: one layer per step of
   his own page path (the naming step, the first learn round, then each first-build piece). Colours are his own picks (the piece
   colour directions he loved most, his love-most palette), else the page's own current colours; marks are the emoji set he picked
   for the orbit. Shapes are plain geometry (circles, ovals, a wave, bars, ticks), every size a PHI power of the logo's half-size.
   No name or letters anywhere.
   PROGRESS = steps done / steps in his own page path (Onboard, Pieces and his own answer sets already on this device: the naming
   mark, the learn mark, the first-build record, and his answers in this page's decrypted log). So a kid who finished onboarding
   before this existed sees his logo already built. Each newly done step glides in (free-wheel, B x PHI^-1, cascaded B x PHI^-4).
   HAND-OVER. The logo step is the next Build more item ("Make your logo yours"). Opening it stops auto-assembly for good: what is
   built becomes his start and is kept. A light hint shows once (the help orb's own grow-on-drop on the logo). From then on tapping
   the logo opens the logo view with tiles and buttons only (layers on/off, colours, bigger/smaller, marks, back to my start):
   no settings box, no typed field. His changes are his (on this device).
   SOUND. None until the first tap on the logo: the AudioContext is created inside that tap. The zoom life (js/logo-zoom-life.js),
   the sound engine (js/logo-sound.js) and Tone.js load only then, and never in Lite. One logo sounds at a time (LogoSound solo).
   Reduced motion: no glides or loops. Lite: the plain logo view, no zoom life and no sound (rule 2).
   PUMP TREE (rule 9): page 13 (js/phi-pumps.js) -> this logo 8 -> each visual layer 5 -> its motion parameter 3 -> its detail 2,
   all on anchor B (PhiPumps.B()). Only the open logo view runs them (one rAF while it is open).
   ON THIS DEVICE ONLY: localStorage 'buildit.logo' = {v, h (handed-over time or 0), hint, mute, seen (layer ids), own and start
   (layer ids with a picked colour, a size rung and the orbit mark set)}. Colours and emoji come only from offered options; never
   typed text, never a name, never sent anywhere. Logo.reset() clears it. */
(function () {
  'use strict';
  if (window.Logo) return;
  var PHI = 1.6180339887, G = 1 / PHI, KEY = 'buildit.logo', NS = 'http://www.w3.org/2000/svg';
  var $ = function (id) { return document.getElementById(id); };
  var RM = window.matchMedia ? matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  var own = 0.25; try { var o0 = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--own-step')); if (isFinite(o0)) own = o0; } catch (e) {}
  function lite() { return !!(window.Adapt && Adapt.lite && Adapt.lite()); }
  function f(n) { return Math.pow(PHI, n); }
  function Bs() { var b = window.PhiPumps && PhiPumps.B ? PhiPumps.B() : null; return b || f(3 + own); }   // anchor B; fallback the page's own breathing beat
  function T(n) { return Bs() * f(n); }   // seconds
  function cssv(n) { try { return getComputedStyle(document.documentElement).getPropertyValue(n).trim(); } catch (e) { return ''; } }
  var HEX = /^#[0-9A-F]{6}$/i;
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  // ---------------- the on-device record ----------------
  function load() { try { var d = JSON.parse(localStorage.getItem(KEY) || 'null'); if (d && d.v === 1) return d; } catch (e) {} return { v: 1, h: 0, hint: 0, mute: 0, seen: [], own: null, start: null }; }
  var R = load();
  function save() { try { localStorage.setItem(KEY, JSON.stringify(R)); } catch (e) {} }

  // ---------------- his page path and his picks ----------------
  function namingDone() { if (window.Onboard && Onboard.done) return !!Onboard.done(); try { var m = JSON.parse(localStorage.getItem('buildit.naming') || 'null'); return !!(m && m.done); } catch (e) { return false; } }
  function learnDone() { try { var m = JSON.parse(localStorage.getItem('buildit.learn') || 'null'); if (m && m.first) return true; } catch (e) {} return mine().some(function (m) { return m.part === 'learn'; }); }
  function mine() { try { return window.BI && BI.mine ? BI.mine() : []; } catch (e) { return []; } }
  function pieces() { try { return window.Pieces && Pieces.list ? Pieces.list() : []; } catch (e) { return []; } }
  // the step each layer comes from (order = his page path)
  var LAYERS = [
    { id: 'ring', from: 'naming', icon: '\u2B55', name: 'Ring' },
    { id: 'disc', from: 'learn', icon: '\u26AB', name: 'Middle' },
    { id: 'ball', from: 'bot', icon: '\uD83E\uDD16', name: 'Bot ball' },
    { id: 'orbit', from: 'orbit', icon: '\uD83D\uDE80', name: 'Orbit' },
    { id: 'light', from: 'light', icon: '\uD83D\uDFE2', name: 'Light' },
    { id: 'wave', from: 'tide', icon: '\uD83C\uDF0A', name: 'Wave' },
    { id: 'bars', from: 'dj', icon: '\uD83C\uDFB5', name: 'Beat bars' },
    { id: 'tint', from: 'colours', icon: '\uD83C\uDFA8', name: 'Colours' },
    { id: 'ticks', from: 'rhythm', icon: '\uD83C\uDF00', name: 'Rhythm ticks' }
  ];
  function path() {
    var P = pieces(), sent = window.Pieces && Pieces.sent ? Pieces.sent() : [], M = mine();
    var steps = [{ id: 'naming', done: namingDone() }, { id: 'learn', done: learnDone() }];
    P.forEach(function (pc) { steps.push({ id: pc.id, done: sent.indexOf(pc.id) >= 0 || M.some(function (m) { return m.part === pc.name; }) }); });
    if (!P.length) LAYERS.slice(2).forEach(function (l) { steps.push({ id: l.from, done: false }); });   // pieces not loaded yet: same path length
    return steps;
  }
  function progress() { var s = path(), d = s.filter(function (x) { return x.done; }).length; return { done: d, total: s.length, share: s.length ? d / s.length : 0, steps: s }; }
  // his love-most pick for one part: the live first-build record first, else his latest sent answer set for that piece
  function pickVal(pc, p) {
    var a = window.Pieces && Pieces.picks ? (Pieces.picks()[pc.id] || {})[p.id] : null;
    if (a && a.love && a.love.val) return a.love.val;
    var M = mine().filter(function (m) { return m.part === pc.name; }).sort(function (x, y) { return y.ts - x.ts; });
    for (var i = 0; i < M.length; i++) { var lines = String(M[i].text).split('\n');
      for (var k = 0; k < lines.length; k++) if (lines[k].indexOf('\u2022 ' + p.l + ' (now:') === 0) { var m = /love most: .*?\[([^\]]+)\]/.exec(lines[k]); if (m) return m[1]; } }
    return null;
  }
  function hexOf(v) { if (!v) return null; var all = String(v).match(/#[0-9A-F]{6}/ig); return all ? all[all.length - 1].toUpperCase() : null; }
  function pieceColour(pid, parId) {   // his pick, else the page's own current value for that part
    var pc = pieces().filter(function (x) { return x.id === pid; })[0]; if (!pc) return null;
    var p = pc.params.filter(function (x) { return x.id === parId; })[0]; if (!p) return null;
    return hexOf(pickVal(pc, p)) || hexOf(p.d);
  }
  function markSets() {   // the emoji sets on offer for the orbit (the page's own options), his pick first
    var sets = [], cur = (window.Orbit && Orbit.SET ? Orbit.SET.map(function (o) { return o.e; }).join(' ') : '');
    try { if (window.Pathways) Pathways.all({ id: 'orbit' }, { id: 'which', k: 'text' }).forEach(function (o) { if (o.val) sets.push(String(o.val)); }); } catch (e) {}
    if (cur && sets.indexOf(cur) < 0) sets.unshift(cur);
    return sets;
  }
  function pickedMarks() {
    var pc = pieces().filter(function (x) { return x.id === 'orbit'; })[0], p = pc && pc.params.filter(function (x) { return x.id === 'which'; })[0];
    var v = pc && p ? pickVal(pc, p) : null, sets = markSets();
    return v && sets.indexOf(v) >= 0 ? v : sets[0] || '';   // only an offered set, never typed text
  }
  function palette() {   // his love-most palette from the colour rounds (latest round wins), else null
    var pals = window.BI && BI.pals ? BI.pals() : [], M = mine().filter(function (m) { return m.part === 2; }).sort(function (x, y) { return y.ts - x.ts; });
    for (var i = 0; i < M.length; i++) { var lines = String(M[i].text).split('\n').reverse();
      for (var k = 0; k < lines.length; k++) { var m = /love most: (.+?) \u00B7 like least/.exec(lines[k]) || /\u2192 (.+?) \(over /.exec(lines[k]);
        if (m) { var hit = pals.filter(function (p) { return p.t === m[1]; })[0]; if (hit) return hit.pal; } } }
    return null;
  }
  // colours for every layer, from his picks (the "tint" step = his page colours) or the page's own palette
  function colours(tinted) {
    var pal = tinted ? palette() : null, c = function (pid, par, fb) { return (tinted && pieceColour(pid, par)) || fb; };
    var page = { ac: cssv('--ac'), ac2: cssv('--ac2'), sf: cssv('--sf2'), ln: cssv('--ln'), tx: cssv('--tx'), mu: cssv('--mu') };
    return {
      ring: c('colours', 'accent', (pal && pal.a) || (tinted ? page.ac : page.ln)), disc: c('colours', 'panel', (pal && pal.s) || page.sf),
      ball: pieceColour('bot', 'colour') || page.ac, light: pieceColour('light', 'colour') || page.ac2, wave: pieceColour('tide', 'colour') || page.mu,
      bars: (pal && pal.a2) || (tinted ? page.ac2 : page.mu), ticks: (pal && pal.tx) || page.tx, orbit: page.mu, tint: (pal && pal.a2) || page.ac2
    };
  }
  // the design: from his live progress until the hand-over, then his own copy for good
  function auto() {
    var pr = progress(), done = {}; pr.steps.forEach(function (s) { done[s.id] = s.done; });
    var tint = !!done.colours, col = colours(tint), L = {};
    LAYERS.forEach(function (l) { L[l.id] = { on: !!done[l.from], c: col[l.id] || null, s: 0 }; });
    return { layers: L, marks: pickedMarks(), tint: tint };
  }
  function design() { return R.h && R.own ? R.own : auto(); }

  // ---------------- drawing (viewBox: the unit circle; every size a PHI power of the half-size) ----------------
  // Built once per svg, then updated in place, so every change (a new step, a colour, a size, on/off) glides instead of jumping.
  function el(tag, at) { var e = document.createElementNS(NS, tag); for (var k in at) e.setAttribute(k, at[k]); return e; }
  function geom(svg, g, id, D) {
    while (g.firstChild) g.removeChild(g.firstChild);
    var cf = { 'data-cf': 1 }, cs = { 'data-cs': 1 }, M = function (a, b) { for (var k in b) a[k] = b[k]; return a; };
    switch (id) {
      case 'ring': g.appendChild(el('circle', M({ r: 1 - f(-4) / 2, fill: 'none', 'stroke-width': f(-4) }, cs))); break;
      case 'disc': g.appendChild(el('circle', M({ r: 1 - f(-4) }, cf))); break;
      case 'ball': g.appendChild(el('circle', M({ r: f(-2) }, cf))); g.appendChild(el('circle', { cx: -f(-3), cy: -f(-3), r: f(-4), fill: '#fff', opacity: f(-2) })); break;
      case 'orbit': { var rx = 1 - f(-3), ry = rx * G, rot = -360 * f(-4);
        var o = el('g', { transform: 'rotate(' + rot.toFixed(2) + ')', 'class': 'lg-spin' }); o.appendChild(el('ellipse', M({ rx: rx, ry: ry, fill: 'none', 'stroke-width': f(-6), 'stroke-dasharray': f(-4) + ' ' + f(-5) }, cs)));
        String(D.marks || '').split(' ').filter(Boolean).slice(0, 3).forEach(function (m, k) { var an = 2 * Math.PI * ((k * G) % 1) + Math.PI * f(-2), x = (rx * Math.cos(an)).toFixed(3), y = (ry * Math.sin(an)).toFixed(3);
          var t = el('text', { x: x, y: y, 'font-size': f(-2), 'text-anchor': 'middle', 'dominant-baseline': 'central', transform: 'rotate(' + (-rot).toFixed(2) + ' ' + x + ' ' + y + ')' }); t.textContent = m; o.appendChild(t); });
        g.setAttribute('data-m', D.marks || ''); g.appendChild(o); break; }
      case 'light': { var a2 = -Math.PI * f(-2), rr = 1 - f(-4) / 2; g.appendChild(el('circle', M({ cx: (rr * Math.cos(a2)).toFixed(3), cy: (rr * Math.sin(a2)).toFixed(3), r: f(-4), 'class': 'lg-glow' }, cf))); break; }
      case 'wave': { var y0 = f(-1) - f(-5), A = f(-4), wl = f(-1), d = 'M-1 ' + y0, n = 0;
        for (var x = -1; x < 1; x += wl / 2) { d += ' Q' + (x + wl / 4).toFixed(3) + ' ' + (y0 + (n++ % 2 ? A : -A)).toFixed(3) + ' ' + (x + wl / 2).toFixed(3) + ' ' + y0; }
        g.appendChild(el('path', M({ d: d, fill: 'none', 'stroke-width': f(-5), 'stroke-linecap': 'round', 'clip-path': 'url(#' + svg.id + '-clip)' }, cs))); break; }
      case 'bars': for (var k = -2; k <= 2; k++) { var hgt = f(-3) * f(-Math.abs(k)), base = -f(-2) - f(-5);
        g.appendChild(el('rect', M({ x: (k * f(-4) - f(-6)).toFixed(3), y: (base - hgt).toFixed(3), width: (2 * f(-6)).toFixed(3), height: hgt.toFixed(3), rx: f(-7) }, cf))); } break;
      case 'tint': g.appendChild(el('circle', M({ r: 1 - f(-4), fill: 'none', 'stroke-width': f(-7), opacity: G }, cs))); break;
      case 'ticks': for (var j = 0; j < 8; j++) { var an2 = 2 * Math.PI * ((j * G) % 1), r1 = 1 - f(-4), r0 = r1 - f(-4);   // 8 = Fibonacci
        g.appendChild(el('line', M({ x1: (r0 * Math.cos(an2)).toFixed(3), y1: (r0 * Math.sin(an2)).toFixed(3), x2: (r1 * Math.cos(an2)).toFixed(3), y2: (r1 * Math.sin(an2)).toFixed(3), 'stroke-width': f(-6), 'stroke-linecap': 'round' }, cs))); } break;
    }
  }
  function recolour(g, c) { c = c || 'currentColor'; var a = g.querySelectorAll('[data-cf]'), b = g.querySelectorAll('[data-cs]'), i;
    for (i = 0; i < a.length; i++) a[i].setAttribute('fill', c); for (i = 0; i < b.length; i++) b[i].setAttribute('stroke', c); }
  // seen: layer ids that appear at once on a fresh build (null = all); the other built layers glide in, cascaded
  function draw(svg, D, seen) {
    var build = !svg.querySelector('.lg'), pending = [];
    if (build) { var cp = el('clipPath', { id: svg.id + '-clip' }); cp.appendChild(el('circle', { r: 1 - f(-4) })); svg.appendChild(cp);
      LAYERS.forEach(function (l, i) { var g = el('g', { 'class': 'lg', 'data-l': l.id }); g.style.setProperty('--li', i); geom(svg, g, l.id, D); svg.appendChild(g); }); }
    LAYERS.forEach(function (l) {
      var st = D.layers[l.id] || {}, g = svg.querySelector('[data-l="' + l.id + '"]'); if (!g) return;
      if (l.id === 'orbit' && g.getAttribute('data-m') !== (D.marks || '')) geom(svg, g, 'orbit', D);
      recolour(g, st.c); g.style.setProperty('--ls', f(st.s || 0).toFixed(4));
      if (!build) { g.classList.toggle('on', !!st.on); return; }
      if (!st.on) return;
      if (!seen || seen.indexOf(l.id) >= 0) { g.style.transition = 'none'; g.classList.add('on'); } else pending.push(g);
    });
    if (build) { void svg.getBoundingClientRect(); svg.querySelectorAll('.lg').forEach(function (g) { g.style.transition = ''; });
      if (pending.length) requestAnimationFrame(function () { requestAnimationFrame(function () { pending.forEach(function (g) { g.classList.add('on'); }); }); }); }
  }
  function mkSvg(id) { var s = el('svg', { viewBox: '-1 -1 2 2', id: id, 'aria-hidden': 'true', focusable: 'false' }); return s; }

  // ---------------- styles (injected after unlock; ratios only) ----------------
  function css() {
    if ($('logo-css')) return; var s = document.createElement('style'); s.id = 'logo-css';
    var gl = T(-1).toFixed(3) + 's', cs = T(-4).toFixed(3) + 's';
    s.textContent =
      '.klogo{flex:none;padding:0;border:0;background:none;border-radius:50%;line-height:0;color:var(--mu);margin-right:.382em}.klogo svg{width:100%;height:100%;overflow:visible}' +
      '.lg{opacity:0;transform:scale(calc(var(--ls,1)*.382));transform-box:view-box;transform-origin:0 0;transition:opacity ' + gl + ' ease-out,transform ' + gl + ' cubic-bezier(.34,1.27,.64,1);transition-delay:calc(var(--li,0)*' + cs + ')}' +
      '.lg.on{opacity:1;transform:scale(var(--ls,1))}.lg circle,.lg path,.lg rect,.lg line,.lg ellipse{transition:fill ' + gl + ',stroke ' + gl + '}' +
      '.lz-ov{position:fixed;inset:0;z-index:70;background:var(--bg);display:flex;flex-direction:column;align-items:center;overflow:auto;padding:5.57vmin 5.57vmin 9vmin}' +
      '.lz-fig{position:relative;width:61.8vmin;height:61.8vmin;max-width:38.2vh;max-height:38.2vh;margin:3.44vmin auto;flex:none}.lz-fig>svg{position:relative;z-index:1;width:100%;height:100%;overflow:visible;color:var(--mu)}' +
      '.lz-top{width:100%;display:flex;justify-content:center;flex:none}.lz-ov.ed .lz-top{position:sticky;top:-5.57vmin;z-index:3;background:var(--bg);padding-bottom:2.13vmin}.lz-ov.ed .lz-fig{width:38.2vmin;height:38.2vmin}' +
      '.lz-p{max-width:38em;text-align:center;color:var(--mu);margin:.382em 0}.lz-p b{color:var(--tx)}' +
      '.lz-dots{display:flex;gap:.382em;justify-content:center;margin:.382em 0}.lz-dots i{width:.618em;height:.618em;border-radius:50%;background:var(--sf2);border:1px solid var(--ln)}.lz-dots i.d{background:var(--ac)}' +
      '.lz-row{display:flex;flex-wrap:wrap;gap:3.44vmin;justify-content:center;margin:.618em 0;max-width:38em}' +
      '.lz-t{min-width:14.59vmin;min-height:14.59vmin;border-radius:var(--r);border:1px solid var(--ln);background:var(--sf);color:var(--tx);font-size:1.27em;display:grid;place-items:center;padding:.236em}' +
      '.lz-t[aria-pressed=true]{background:var(--sf2);border-color:var(--ac);box-shadow:0 0 0 2px var(--ac)}.lz-t.off{opacity:.618}.lz-t small{display:block;font-size:.618em;color:var(--mu)}' +
      '.lz-sw{width:61.8%;height:61.8%;border-radius:50%;border:1px solid var(--ln)}.lz-h{font-size:.854em;color:var(--mu);margin:.618em 0 0;text-align:center}' +
      'html.lite .lg,.rm .lg{transition:none}@media (prefers-reduced-motion:reduce){.lg,.lg *{transition:none!important}}';
    document.head.appendChild(s);
  }

  // ---------------- the header logo ----------------
  var btn = null, svgH = null;
  function mount() {
    if (btn && document.body.contains(btn)) return;
    var brand = document.querySelector('#head .brand'), av = $('h-av'); if (!brand) return;
    css(); btn = document.createElement('button'); btn.type = 'button'; btn.id = 'h-logo'; btn.className = 'klogo'; btn.setAttribute('data-use', 'logo');
    btn.setAttribute('aria-label', 'Your logo. Tap to open it'); svgH = mkSvg('lg-h'); btn.appendChild(svgH);
    var sz = av ? (av.offsetHeight || +av.getAttribute('height')) : 0; if (sz) { btn.style.width = sz + 'px'; btn.style.height = sz + 'px'; }   // the avatar's own measured size
    brand.insertBefore(btn, av || brand.firstChild);
    btn.addEventListener('click', tap);
    if (window.PhiPumps) PhiPumps.provide('progress', function () { return progress().share; });
    if (window.QuizOrb && QuizOrb.part) QuizOrb.part('#h-logo', 'Your logo. It builds itself from what you build on your page. Tap it to open it big.', 'Logo');
    render();
  }
  // the header logo: layers he has seen before show at once; newly done ones glide in (cascade)
  function render() {
    if (!svgH) return; var D = design();
    draw(svgH, D, R.seen || []);
    R.seen = LAYERS.filter(function (l) { return (D.layers[l.id] || {}).on; }).map(function (l) { return l.id; }); save();
    if (ov) { var z = $('lg-z'); if (z) draw(z, D, null); }
  }
  var rq = 0;
  function later() { clearTimeout(rq); if (R.h) return; rq = setTimeout(function () { render(); if (ov && !R.h) controls(); }, T(-3) * 1000); }   // a new answer set landed: re-read his path

  // ---------------- the logo view (tap) ----------------
  var AC = null, ov = null, sel = 'ball', raf = 0, lastFocus = null;
  function tap() {
    // sound only after the first tap: the AudioContext is created HERE, inside the tap, and never before
    if (!lite() && !R.mute) { if (!AC) { var C = window.AudioContext || window.webkitAudioContext; if (C) try { AC = new C(); } catch (e) { AC = null; } } else if (AC.state === 'suspended') try { AC.resume(); } catch (e) {} }
    if (window.Adapt) Adapt.note('logo', 'open');
    openView();
  }
  function lifeScript(cb) { if (window.LogoZoomLife) return cb(); var s = document.createElement('script'); s.src = 'js/logo-zoom-life.js?v=1'; s.async = true; s.onload = cb; document.head.appendChild(s); }
  function openView() {
    if (!ov) { lastFocus = document.activeElement; ov = document.createElement('div'); ov.id = 'lz'; ov.className = 'lz-ov'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); ov.setAttribute('aria-label', 'Your logo');
      ov.innerHTML = '<div class="lz-top"><div class="lz-fig" id="lz-fig"></div></div><div id="lz-ctl"></div>'; document.body.appendChild(ov); document.addEventListener('keydown', onKey);
      var sv = mkSvg('lg-z'); $('lz-fig').appendChild(sv); draw(sv, design(), null);
      controls(); var c = $('lz-close'); if (c) try { c.focus({ preventScroll: true }); } catch (e) {} startLife();
    } else { draw($('lg-z'), design(), null); controls(); }
  }
  // the controls under the big logo (tiles and buttons only; re-drawn on each change, the logo itself glides)
  function controls() {
    var D = design(), pr = progress(), handed = !!R.h, h = '', box = $('lz-ctl'); if (!box) return; ov.classList.toggle('ed', handed);
    if (!handed) {
      h += '<p class="lz-p"><b>Your logo builds itself as you build your page.</b> Every step you finish adds a piece to it, in the colours you picked.</p>';
      h += '<div class="lz-dots" aria-hidden="true">' + pr.steps.map(function (s) { return '<i class="' + (s.done ? 'd' : '') + '"></i>'; }).join('') + '</div>';
      h += '<p class="lz-p">' + pr.done + ' of ' + pr.total + ' steps built so far.</p>';
      h += '<div class="lz-row">' + ((!window.Onboard || Onboard.done()) ? '<button type="button" class="btn" id="lz-mine">\u2728 Make it yours now</button>' : '') + sndBtn() + '<button type="button" class="btn ghost2" id="lz-close">Close</button></div>';
      if (window.Onboard && !Onboard.done()) h += '<p class="lz-h">You can make it yours after step 1, naming the parts of your page.</p>';
    } else {
      if (!R.hint) h += '<p class="lz-p" id="lz-hint"><b>This logo is yours now.</b> Tap it any time to change it.</p>';
      h += '<p class="lz-h">Pieces: tap one to pick it, tap again to add or take it away</p><div class="lz-row" id="lz-layers">' + LAYERS.map(function (l) { var s = D.layers[l.id] || {};
        return '<button type="button" class="lz-t' + (s.on ? '' : ' off') + '" data-layer="' + l.id + '" aria-pressed="' + (sel === l.id) + '" aria-label="' + esc(l.name) + (s.on ? ' (on)' : ' (off)') + '">' + l.icon + '<small>' + (s.on ? 'on' : 'off') + '</small></button>'; }).join('') + '</div>';
      var cur = D.layers[sel] || {};
      h += '<div class="lz-row"><button type="button" class="btn ghost2" id="lz-onoff">' + (cur.on ? 'Take away: ' : 'Add: ') + esc(nameOf(sel)) + '</button><button type="button" class="btn ghost2" id="lz-small">\u2796 Smaller</button><button type="button" class="btn ghost2" id="lz-big">\u2795 Bigger</button></div>';
      h += '<p class="lz-h">Colour for ' + esc(nameOf(sel)) + '</p><div class="lz-row" id="lz-cols">' + swatches().map(function (c) { return '<button type="button" class="lz-t" data-col="' + c + '" aria-pressed="' + (cur.c === c) + '" aria-label="Colour ' + c + '"><span class="lz-sw" style="background:' + c + '"></span></button>'; }).join('') + '</div>';
      if (sel === 'orbit') h += '<p class="lz-h">Orbit marks</p><div class="lz-row" id="lz-marks">' + markSets().slice(0, 8).map(function (m) { return '<button type="button" class="lz-t" data-mark="' + esc(m) + '" aria-pressed="' + (D.marks === m) + '">' + esc(m.split(' ').join('')) + '</button>'; }).join('') + '</div>';
      h += '<div class="lz-row"><button type="button" class="btn ghost2" id="lz-start">\u21BA Back to my start</button>' + sndBtn() + '<button type="button" class="btn" id="lz-close">\u2713 Done</button></div>';
    }
    var foc = document.activeElement && document.activeElement.id;
    box.innerHTML = h; wire(); if (foc && $(foc)) try { $(foc).focus({ preventScroll: true }); } catch (e) {}
    if (handed && !R.hint) { R.hint = 1; save(); }
  }
  function nameOf(id) { for (var i = 0; i < LAYERS.length; i++) if (LAYERS[i].id === id) return LAYERS[i].name; return id; }
  function sndBtn() { if (lite()) return ''; var on = !R.mute; return '<button type="button" class="btn ghost2" id="lz-snd" aria-pressed="' + on + '">' + (on ? '\uD83D\uDD0A Sound on' : '\uD83D\uDD07 Sound off') + '</button>'; }
  function swatches() {   // only colours he picked or the page already has (Fibonacci count)
    var D = design(), L = [], add = function (c) { if (c && HEX.test(c) && L.indexOf(c.toUpperCase()) < 0) L.push(c.toUpperCase()); };
    var a = colours(true), b = colours(false); Object.keys(a).forEach(function (k) { add(a[k]); add(b[k]); });
    var pal = palette(); if (pal) Object.keys(pal).forEach(function (k) { add(pal[k]); });
    ['--ac', '--ac2', '--ok', '--bad', '--mu', '--tx'].forEach(function (v) { add(cssv(v)); });
    Object.keys(D.layers).forEach(function (k) { add(D.layers[k].c); });
    return L.slice(0, 13);
  }
  function edit(fn) { if (!R.h || !R.own) return; fn(R.own); save(); render(); controls(); }
  function wire() {
    var q = function (id, fn) { var e = $(id); if (e) e.onclick = fn; };
    q('lz-close', closeView);
    q('lz-mine', function () { step(); });
    q('lz-snd', function () { R.mute = R.mute ? 0 : 1; save();
      if (!R.mute && !lite()) { if (!AC) { var C = window.AudioContext || window.webkitAudioContext; if (C) try { AC = new C(); } catch (e) {} } else try { AC.resume(); } catch (e) {} }   // inside this tap
      else if (AC) try { AC.suspend(); } catch (e) {}
      startLife();
      var b = $('lz-snd'); if (b) { b.setAttribute('aria-pressed', String(!R.mute)); b.textContent = R.mute ? '\uD83D\uDD07 Sound off' : '\uD83D\uDD0A Sound on'; } });
    var ly = ov.querySelectorAll('[data-layer]'); for (var i = 0; i < ly.length; i++) ly[i].onclick = function () { var id = this.getAttribute('data-layer');
      if (sel === id) edit(function (o) { o.layers[id].on = !o.layers[id].on; }); else { sel = id; controls(); } };
    q('lz-onoff', function () { edit(function (o) { o.layers[sel].on = !o.layers[sel].on; }); });
    q('lz-big', function () { edit(function (o) { var s = o.layers[sel]; s.on = true; s.s = Math.min(2, (s.s || 0) + 1); }); });      // +-2 rungs: Fibonacci
    q('lz-small', function () { edit(function (o) { var s = o.layers[sel]; s.on = true; s.s = Math.max(-2, (s.s || 0) - 1); }); });
    var cs = ov.querySelectorAll('[data-col]'); for (var j = 0; j < cs.length; j++) cs[j].onclick = function () { var c = this.getAttribute('data-col'); if (!HEX.test(c)) return; edit(function (o) { o.layers[sel].c = c; o.layers[sel].on = true; }); };
    var ms = ov.querySelectorAll('[data-mark]'); for (var k = 0; k < ms.length; k++) ms[k].onclick = function () { var m = this.getAttribute('data-mark'); if (markSets().indexOf(m) < 0) return; edit(function (o) { o.marks = m; o.layers.orbit.on = true; }); };
    q('lz-start', function () { if (!R.start) return; edit(function (o) { var s = JSON.parse(JSON.stringify(R.start)); o.layers = s.layers; o.marks = s.marks; o.tint = s.tint; }); });
  }
  function startLife() {
    pumpLoop(true); if (lite()) return;
    lifeScript(function () { if (!ov) return; var fg = $('lz-fig'); if (fg) LogoZoomLife.start(fg, R.mute ? null : AC, { logo: 'kid-logo' }); });
  }
  // the pump tree in motion while the view is open: logo 8 -> layer 5 -> parameter 3 -> detail 2 (PhiPumps)
  var nodes = null;
  function pumpLoop(on) {
    cancelAnimationFrame(raf); raf = 0; if (!on || RM.matches || lite() || !window.PhiPumps) return;
    if (!nodes) { var lg = PhiPumps.logo('kid-logo'); nodes = {}; LAYERS.forEach(function (l, i) { var a = PhiPumps.node('layer:' + l.id, 5, -2, f(-5), lg, i + 2), b = PhiPumps.node('param:' + l.id, 3, -3, f(-6), a, i + 13), c = PhiPumps.node('detail:' + l.id, 2, -4, f(-7), b, i + 21); nodes[l.id] = { n: [a, b, c], s: null }; }); }
    var last = 0, op = 'opacity ' + T(-1).toFixed(3) + 's ease-out';
    function frame(ms) {
      var sv = $('lg-z'); if (!ov || !sv) return; var t = PhiPumps.now(), dt = last ? (ms - last) / 1000 : 0, k = 1 - Math.exp(-dt / T(-2)); last = ms; var D = design();
      LAYERS.forEach(function (l) { var g = sv.querySelector('[data-l="' + l.id + '"]'); if (!g) return; var N = nodes[l.id], st = D.layers[l.id] || {}, tg = st.on ? f(st.s || 0) : f(st.s || 0) * f(-2);
        N.s = N.s == null ? tg : N.s + k * (tg - N.s);   // damped glide toward his size rung (free-wheel, no snap)
        g.style.transition = op; g.style.transform = 'scale(' + (N.s * N.n[0].out(t)).toFixed(4) + ')';
        var sp = g.querySelector('.lg-spin'); if (sp) sp.setAttribute('transform', 'rotate(' + (-360 * f(-4) + 360 * f(-3) * N.n[1].modes(t)).toFixed(2) + ')');
        var gw = g.querySelector('.lg-glow'); if (gw) gw.setAttribute('opacity', (G + (1 - G) * (0.5 + 0.5 * N.n[2].modes(t))).toFixed(3)); });
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
  }
  function onKey(e) { if (e.key === 'Escape' && ov) { e.preventDefault(); closeView(); } }
  function closeView() {
    if (!ov) return; pumpLoop(false); if (window.LogoZoomLife) LogoZoomLife.stop();
    if (AC) { var a = AC; setTimeout(function () { if (!ov) try { a.suspend(); } catch (e) {} }, T(-1) * 1000); }
    document.removeEventListener('keydown', onKey); ov.remove(); ov = null;
    if (lastFocus && lastFocus.focus) try { lastFocus.focus(); } catch (e) {}
  }

  // ---------------- the logo step: hand-over (for good) ----------------
  function handover() {
    if (R.h) return false;
    var D = auto(); R.h = Date.now(); R.own = JSON.parse(JSON.stringify(D)); R.start = JSON.parse(JSON.stringify(D)); R.hint = 0; save();
    render(); if (window.BuildMore) BuildMore.refresh(); return true;
  }
  function step() {
    var first = handover();
    if (ov) closeView();
    if (first && window.QuizOrb && QuizOrb.drop && btn) {   // the one-time light hint: the help orb's own grow-on-drop, on the logo
      try { window.scrollTo(0, 0); } catch (e) {}
      var d = QuizOrb.drop(btn, { text: 'This logo is yours now. It keeps what you built. Tap it any time to change it.', onEnd: function () { R.hint = 1; save(); } });
      if (d) return;
    }
    tap();
  }

  // ---------------- life cycle ----------------
  function init() { mount(); }
  document.addEventListener('bi:answers', later);
  document.addEventListener('bi:open', function () { setTimeout(init, 0); });
  document.addEventListener('bi:lock', function () { closeView(); if (btn) btn.remove(); btn = null; svgH = null; if (AC) try { AC.close(); } catch (e) {} AC = null; });
  window.Logo = { step: step, handed: function () { return !!R.h; }, progress: progress, design: design, open: tap, refresh: function () { render(); },
    reset: function () { try { localStorage.removeItem(KEY); } catch (e) {} R = load(); render(); if (window.BuildMore) BuildMore.refresh(); } };
  function boot() { init(); setTimeout(function () { render(); }, T(-1) * 1000); }   // once Pieces / Dials have settled
  if (!window.PhiPumps) { var s = document.createElement('script'); s.src = 'js/phi-pumps.js?v=1'; s.async = true; s.onload = s.onerror = boot; document.head.appendChild(s); } else boot();
})();
