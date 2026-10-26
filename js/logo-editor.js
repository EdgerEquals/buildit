/* LOGO EDITOR (Kids Club "Logo editor flow"; loaded only when he opens the editor: the edit button by the X, the logo step's
   "Now", Build more, or the ask-your-bot link <page>#logo-edit). Renders inside the logo view (js/logo.js); everything is on
   this device and live on this site at once (Live, no approval), with Step back and Back to my original always near the top.
   1 QUESTIONS  emergent direction questions built from his own path (each piece he has built), in the questionnaire's shape:
                two roll boxes (left: love most, applied live; right: like least, remembered so it comes last next time), Back,
                Skip and Stop. Each visit asks the 5 (Fibonacci) he answered longest ago; resume on refresh (record in his logo state).
   2 TILES      pieces on/off, smaller/bigger, colours (only his picks or the page's own), orbit marks.
   3 START FROM drawing or writing by hand (an on-device canvas, finger or stylus), typing, chat with his bot (a pointer to it,
                nothing sent), or a vector file (SVG only, cleaned on this device: no scripts, no outside links, no event
                handlers, no styles, no embedded images).
   WORDS GO LIVE (Kids Club, 13:15 AWST): every change, words included, goes live with no hold. Wherever words can get in
   (typing, drawing or writing, an SVG with text) the editor shows a short tip in his own voice: keep your real name off.
   Ratios only; sizes from the page's own scale. */
(function () {
  'use strict';
  if (window.LogoEditor || !window.Logo || !Logo._k) return;
  var K = Logo._k, f = K.f, esc = K.esc, $ = function (id) { return document.getElementById(id); };
  var sel = 'ball', mode = '', note = '', strokes = [], ink = null, TIP = '<p class="lz-h le-tip">\uD83D\uDCA1 Tip: I\'ll keep my real name off my logo.</p>';
  var CSS = '.le-card{border:1px solid var(--ln);border-radius:var(--r);background:var(--sf);padding:.618em 1em;margin:.618em 0;max-width:38em;width:100%;text-align:center}' +
    '.le-roll{display:flex;gap:1em;justify-content:center;flex-wrap:wrap}.le-box{flex:1 1 13em;display:flex;flex-direction:column;align-items:center;gap:.382em}' +
    '.le-box b{font-size:.854em;color:var(--mu);font-weight:normal}.le-sp{display:flex;align-items:center;gap:.382em}.le-v{min-width:8em;min-height:2.618em;display:grid;place-items:center;border:1px solid var(--ln);border-radius:var(--r);background:var(--sf2);padding:.236em .618em}' +
    '.le-cv{width:61.8vmin;height:61.8vmin;max-width:38.2vh;max-height:38.2vh;touch-action:none;border-radius:50%;border:1px dashed var(--ln);background:var(--sf2);display:block;margin:.618em auto}' +
    '.le-in{font:inherit;padding:.618em;border-radius:var(--r);border:1px solid var(--ln);background:var(--sf2);color:var(--tx);width:13em;max-width:100%}';
  if (!$('le-css')) { var st = document.createElement('style'); st.id = 'le-css'; st.textContent = CSS; document.head.appendChild(st); }
  function R() { return K.R(); }
  function D() { return K.design(); }
  function nameOf(id) { for (var i = 0; i < K.LAYERS.length; i++) if (K.LAYERS[i].id === id) return K.LAYERS[i].name; return id; }
  function swatches() {   // only colours he picked or the page already has (13, Fibonacci)
    var L = [], add = function (c) { if (c && K.HEX.test(c) && L.indexOf(c.toUpperCase()) < 0) L.push(c.toUpperCase()); };
    var a = K.colours(true), b = K.colours(false); Object.keys(a).forEach(function (k) { add(a[k]); add(b[k]); });
    var pal = K.palette(); if (pal) Object.keys(pal).forEach(function (k) { add(pal[k]); });
    ['--ac', '--ac2', '--ok', '--bad', '--mu', '--tx'].forEach(function (v) { add(K.cssv(v)); });
    var d = D(); Object.keys(d.layers).forEach(function (k) { add(d.layers[k].c); });
    return L.slice(0, 13);
  }

  // ---------------- 1 emergent questions (from his own path) ----------------
  function qAll() {
    var d = D(), Q = [];
    K.LAYERS.forEach(function (l) { var s = d.layers[l.id] || {};
      if (!s.on) { Q.push({ id: 'add:' + l.id, q: 'Your ' + nameOf(l.id) + ' is hidden. Bring it back?', o: [['on', '\u2705 Bring it back'], ['off', '\uD83D\uDE48 Keep it hidden']] }); return; }
      Q.push({ id: 'size:' + l.id, q: 'Your ' + nameOf(l.id) + ': which way should it grow?', o: [['+', '\u2795 Bigger'], ['-', '\u2796 Smaller'], ['=', '\uD83D\uDC4C Just like now'], ['off', '\uD83D\uDE48 Hide it']] });
      Q.push({ id: 'col:' + l.id, q: 'Which colour for your ' + nameOf(l.id) + '?', o: swatches().map(function (c) { return [c, '<span class="lz-sw" style="display:inline-block;width:1.27em;height:1.27em;background:' + c + '"></span>']; }) });
      if (l.id === 'orbit') Q.push({ id: 'marks', q: 'Which marks should fly round your orbit?', o: K.markSets().slice(0, 8).map(function (m) { return [m, esc(m.split(' ').join(''))]; }) });
    });
    return Q;
  }
  function qState() { var r = R(); r.qs = r.qs || { at: {}, ll: {}, v: null }; return r.qs; }
  function visit() {   // this visit's questions: the 5 he answered longest ago (or never), resumed if he left part-way
    var S = qState(), all = qAll(), ids = all.map(function (q) { return q.id; });
    if (S.v && S.v.i < S.v.ids.length && S.v.ids.every(function (id) { return ids.indexOf(id) >= 0; })) return S.v;
    var pick = all.slice().sort(function (a, b) { return (S.at[a.id] || 0) - (S.at[b.id] || 0); }).slice(0, 5).map(function (q) { return q.id; });
    S.v = { ids: pick, i: 0, e: [], L: 0, Rr: 0 }; K.save(); return S.v;
  }
  function qById(id) { var all = qAll(); for (var i = 0; i < all.length; i++) if (all[i].id === id) return all[i]; return null; }
  function ordered(q) { var ll = qState().ll[q.id], o = q.o.slice(); if (ll) o.sort(function (a, b) { return (a[0] === ll) - (b[0] === ll); }); return o; }   // his like-least comes last
  function qCard() {
    var S = qState(); if (S.stop) return '<div class="le-card"><button type="button" class="btn ghost2" id="le-qgo">\uD83D\uDCAC Ask me about my logo</button></div>';
    var V = visit(); if (V.i >= V.ids.length) return '<div class="le-card"><p class="lz-p"><b>That\'s all for now.</b> More questions next time you open it.</p></div>';
    var q = qById(V.ids[V.i]); if (!q) { V.i++; return qCard(); }
    var o = ordered(q), L = o[V.L % o.length], Rr = o[(V.Rr + o.length - 1) % o.length];
    return '<div class="le-card" id="le-q"><p class="lz-h">Question ' + (V.i + 1) + ' of ' + V.ids.length + '</p><p class="lz-p"><b>' + esc(q.q) + '</b></p><div class="le-roll">' +
      '<div class="le-box"><b>I love this most</b><div class="le-sp"><button type="button" class="lz-x" data-roll="L-">\u25C0</button><span class="le-v">' + L[1] + '</span><button type="button" class="lz-x" data-roll="L+">\u25B6</button></div></div>' +
      '<div class="le-box"><b>I like this least</b><div class="le-sp"><button type="button" class="lz-x" data-roll="R-">\u25C0</button><span class="le-v">' + Rr[1] + '</span><button type="button" class="lz-x" data-roll="R+">\u25B6</button></div></div></div>' +
      '<div class="lz-row"><button type="button" class="btn ghost2" id="le-qback"' + (V.i ? '' : ' disabled') + '>\u2190 Back</button><button type="button" class="btn" id="le-qok">\u2713 Confirm</button><button type="button" class="btn ghost2" id="le-qskip">Skip</button><button type="button" class="btn ghost2" id="le-qstop">Stop for now</button></div></div>';
  }
  function apply(q, v) {
    var p = q.id.split(':'), id = p[1];
    if (p[0] === 'add') { if (v === 'on') K.edit(function (o) { o.layers[id].on = true; }); return v === 'on'; }
    if (p[0] === 'size') { if (v === '=') return false; K.edit(function (o) { var s = o.layers[id]; if (v === 'off') s.on = false; else s.s = Math.max(-2, Math.min(2, (s.s || 0) + (v === '+' ? 1 : -1))); }); return true; }
    if (p[0] === 'col') { if (!K.HEX.test(v)) return false; K.edit(function (o) { o.layers[id].c = v; }); return true; }
    if (q.id === 'marks') { if (K.markSets().indexOf(v) < 0) return false; K.edit(function (o) { o.marks = v; }); return true; }
    return false;
  }
  function qWire() {
    var S = qState(), V = S.v;
    var go = $('le-qgo'); if (go) go.onclick = function () { S.stop = 0; S.v = null; K.save(); render(); };
    if (!$('le-q')) return; var q = qById(V.ids[V.i]), o = ordered(q);
    Array.prototype.forEach.call(document.querySelectorAll('[data-roll]'), function (b) { b.onclick = function () { var k = this.getAttribute('data-roll'), d = k[1] === '+' ? 1 : o.length - 1;
      if (k[0] === 'L') V.L = (V.L + d) % o.length; else V.Rr = (V.Rr + d) % o.length; K.save(); render(); }; });
    function next(ans) { V.e[V.i] = ans ? 1 : 0; S.at[q.id] = Date.now(); V.i++; V.L = 0; V.Rr = 0; K.save(); render(); }
    $('le-qok').onclick = function () { var love = o[V.L % o.length][0], least = o[(V.Rr + o.length - 1) % o.length][0]; if (least !== love) S.ll[q.id] = least; next(apply(q, love)); };
    $('le-qskip').onclick = function () { next(false); };
    $('le-qstop').onclick = function () { S.stop = 1; K.save(); render(); };
    $('le-qback').onclick = function () { if (!V.i) return; V.i--; if (V.e[V.i]) K.back(); V.e[V.i] = 0; V.L = 0; V.Rr = 0; K.save(); render(); };
    $('le-q').onkeydown = function (e) { if (e.key === 'Enter' && e.target.tagName !== 'BUTTON') $('le-qok').click(); };
  }

  // ---------------- 3 start from: draw, type, chat, vector file ----------------
  var MAXB = 144 * 1000;   // largest vector file read (144 kB, Fibonacci): keeps the on-device record small
  function clean(src) {   // SVG only, cleaned on this device. Returns {svg, text, removed} or null
    var doc; try { doc = new DOMParser().parseFromString(src, 'image/svg+xml'); } catch (e) { return null; }
    var root = doc && doc.documentElement; if (!root || root.localName !== 'svg' || doc.getElementsByTagName('parsererror').length) return null;
    var OK = /^(svg|g|path|circle|ellipse|rect|line|polyline|polygon|defs|lineargradient|radialgradient|stop|clippath|mask|symbol|use|text|tspan)$/, text = false, removed = 0;
    function attrs(e) { for (var i = e.attributes.length - 1; i >= 0; i--) { var a = e.attributes[i], n = a.name.toLowerCase(), v = a.value;
      if (/^on/.test(n) || n === 'style' || n === 'xml:base' || (/(^|:)href$/.test(n) && v.trim().charAt(0) !== '#') || /url\(\s*['"]?\s*(?!#)/i.test(v) || /javascript:|data:|vbscript:/i.test(v)) { e.removeAttribute(a.name); removed++; } } }
    (function walk(n) { var c = n.firstElementChild; while (c) { var nx = c.nextElementSibling, nm = c.localName.toLowerCase();
      if (!OK.test(nm)) { n.removeChild(c); removed++; } else { if (nm === 'text' || nm === 'tspan') text = true; attrs(c); walk(c); } c = nx; } })(root);
    attrs(root);
    if (!root.getAttribute('viewBox') && root.getAttribute('width') && root.getAttribute('height')) root.setAttribute('viewBox', '0 0 ' + parseFloat(root.getAttribute('width')) + ' ' + parseFloat(root.getAttribute('height')));
    return { svg: new XMLSerializer().serializeToString(root), text: text, removed: removed };
  }
  function startRow() {
    var d = D(), a = d.art, h = '<p class="lz-h">Start from something of your own</p><div class="lz-row">' +
      [['draw', '\u270D\uFE0F Draw or write'], ['type', '\u2328\uFE0F Type'], ['chat', '\uD83D\uDCAC With my bot'], ['svg', '\uD83D\uDCC4 Vector file']].map(function (m) {
        return '<button type="button" class="btn ghost2" data-mode="' + m[0] + '" aria-pressed="' + (mode === m[0]) + '">' + m[1] + '</button>'; }).join('') +
      (a ? '<button type="button" class="btn ghost2" id="le-noart">\uD83D\uDDD1 Take mine out</button>' : '') + '</div>';
    if (mode === 'draw') h += '<div class="le-card"><p class="lz-p">Draw or write with your finger or pen.</p><canvas class="le-cv" id="le-cv"></canvas><div class="lz-row">' +
      '<button type="button" class="btn ghost2" id="le-undo">\u21B6 Undo a line</button><button type="button" class="btn ghost2" id="le-clear">Clear</button></div>' +
      TIP + '<div class="lz-row"><button type="button" class="btn" id="le-dpic">\u2713 Put it in my logo</button></div></div>';
    if (mode === 'type') h += '<div class="le-card"><p class="lz-p">Type a word or a few letters for your logo.</p>' + TIP +
      '<input class="le-in" id="le-txt" maxlength="21" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Words for your logo"><div class="lz-row"><button type="button" class="btn" id="le-tok">Put it in my logo</button></div></div>';
    if (mode === 'chat') h += '<div class="le-card"><p class="lz-p"><b>Ask your bot.</b> Write \u201Cedit my logo\u201D in your chat with your bot. It sends you a button that opens this editor. Making your whole logo by chatting with your bot comes later.</p></div>';
    if (mode === 'svg') h += '<div class="le-card"><p class="lz-p">Pick an SVG file. It is cleaned on this device first.</p>' + TIP + '<input type="file" id="le-file" accept=".svg,image/svg+xml"></div>';
    if (note) h += '<p class="lz-p" id="le-note">' + esc(note) + '</p>';
    return h;
  }
  function setArt(a) { K.edit(function (o) { o.art = a; }); }
  function inkColour() { var d = D(); return ink || (d.layers.ring && d.layers.ring.c) || K.cssv('--tx'); }
  function canvasWire() {
    var cv = $('le-cv'); if (!cv) return; var x = cv.getContext('2d'), cur = null, r = 1 - f(-3);
    function size() { var w = cv.clientWidth, dp = Math.min(2, window.devicePixelRatio || 1); cv.width = w * dp; cv.height = w * dp; x.setTransform(dp, 0, 0, dp, 0, 0); paint(); }
    function toU(e) { var b = cv.getBoundingClientRect(); return [((e.clientX - b.left) / b.width * 2 - 1) * r, ((e.clientY - b.top) / b.height * 2 - 1) * r]; }
    function paint() { var w = cv.clientWidth; x.clearRect(0, 0, w, w); x.strokeStyle = inkColour(); x.lineWidth = w / 2 * f(-5); x.lineCap = x.lineJoin = 'round';
      strokes.concat(cur ? [cur] : []).forEach(function (s) { x.beginPath(); s.forEach(function (p, i) { var X = (p[0] / r + 1) / 2 * w, Y = (p[1] / r + 1) / 2 * w; if (i) x.lineTo(X, Y); else x.moveTo(X, Y); }); x.stroke(); }); }
    cv.onpointerdown = function (e) { cv.setPointerCapture(e.pointerId); cur = [toU(e)]; paint(); };
    cv.onpointermove = function (e) { if (!cur) return; var p = toU(e), l = cur[cur.length - 1]; if (Math.abs(p[0] - l[0]) + Math.abs(p[1] - l[1]) > f(-7)) { cur.push(p); paint(); } };
    cv.onpointerup = cv.onpointercancel = function () { if (cur && cur.length) strokes.push(cur); cur = null; paint(); };
    $('le-undo').onclick = function () { strokes.pop(); paint(); }; $('le-clear').onclick = function () { strokes = []; paint(); };
    function save() { if (!strokes.length) { note = 'Draw something first.'; return render(); }
      var d = strokes.map(function (s) { return s.map(function (p, i) { return (i ? 'L' : 'M') + p[0].toFixed(3) + ' ' + p[1].toFixed(3); }).join(''); });
      strokes = []; mode = ''; note = 'Your drawing is in your logo.';
      setArt({ k: 'draw', d: d, c: inkColour() }); }
    $('le-dpic').onclick = save;
    size();
  }
  function startWire() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-mode]'), function (b) { b.onclick = function () { var m = this.getAttribute('data-mode'); mode = mode === m ? '' : m; note = ''; render(); }; });
    var na = $('le-noart'); if (na) na.onclick = function () { note = ''; K.edit(function (o) { delete o.art; }); };
    canvasWire();
    var tk = $('le-tok'); if (tk) tk.onclick = function () { var v = String($('le-txt').value || '').replace(/[\u0000-\u001F<>]/g, '').trim().slice(0, 21); if (!v) return;
      mode = ''; note = 'Your words are in your logo.'; setArt({ k: 'type', t: v, c: inkColour() }); };
    var fi = $('le-file'); if (fi) fi.onchange = function () { var fl = fi.files && fi.files[0]; if (!fl) return;
      if (!/\.svg$/i.test(fl.name) && fl.type !== 'image/svg+xml') { note = 'Only SVG vector files, please.'; return render(); }
      if (fl.size > MAXB) { note = 'That file is too big for a logo. Try a smaller SVG.'; return render(); }
      var rd = new FileReader(); rd.onload = function () { var c = clean(String(rd.result || '')); if (!c) { note = 'That file could not be read as an SVG.'; return render(); }
        mode = ''; note = 'Your file is in your logo' + (c.removed ? ' (cleaned: ' + c.removed + ' unsafe bit' + (c.removed === 1 ? '' : 's') + ' taken out)' : '') + '.' + (c.text ? ' \uD83D\uDCA1 Tip: I\'ll keep my real name off my logo.' : '');
        setArt({ k: 'svg', svg: c.svg }); }; rd.readAsText(fl); };
  }

  // ---------------- render ----------------
  function render(box) {
    box = box || $('lz-ctl'); if (!box) return; var r = R(), d = D(), cur = d.layers[sel] || {}, h = '';
    if (!r.edSeen) { h += '<p class="lz-p" id="lz-hint"><b>This is your logo editor.</b> Changes show straight away. Tapping your logo brings it back any time.</p>'; r.edSeen = 1; K.save(); }
    h += '<div class="lz-row"><button type="button" class="btn ghost2" id="lz-back"' + (r.hist.length ? '' : ' disabled') + '>\u21B6 Step back' + (r.hist.length ? ' (' + r.hist.length + ')' : '') + '</button><button type="button" class="btn ghost2" id="lz-start">\u21BA Back to my original</button></div>';
    h += qCard();
    h += '<p class="lz-h">Pieces: tap one to pick it, tap again to add or take it away</p><div class="lz-row" id="lz-layers">' + K.LAYERS.map(function (l) { var s = d.layers[l.id] || {};
      return '<button type="button" class="lz-t' + (s.on ? '' : ' off') + '" data-layer="' + l.id + '" aria-pressed="' + (sel === l.id) + '" aria-label="' + esc(l.name) + (s.on ? ' (on)' : ' (off)') + '">' + l.icon + '<small>' + (s.on ? 'on' : 'off') + '</small></button>'; }).join('') + '</div>';
    h += '<div class="lz-row"><button type="button" class="btn ghost2" id="lz-onoff">' + (cur.on ? 'Take away: ' : 'Add: ') + esc(nameOf(sel)) + '</button><button type="button" class="btn ghost2" id="lz-small">\u2796 Smaller</button><button type="button" class="btn ghost2" id="lz-big">\u2795 Bigger</button></div>';
    h += '<p class="lz-h">Colour for ' + esc(nameOf(sel)) + '</p><div class="lz-row" id="lz-cols">' + swatches().map(function (c) { return '<button type="button" class="lz-t" data-col="' + c + '" aria-pressed="' + (cur.c === c) + '" aria-label="Colour ' + c + '"><span class="lz-sw" style="background:' + c + '"></span></button>'; }).join('') + '</div>';
    if (sel === 'orbit') h += '<p class="lz-h">Orbit marks</p><div class="lz-row" id="lz-marks">' + K.markSets().slice(0, 8).map(function (m) { return '<button type="button" class="lz-t" data-mark="' + esc(m) + '" aria-pressed="' + (d.marks === m) + '">' + esc(m.split(' ').join('')) + '</button>'; }).join('') + '</div>';
    h += startRow();
    h += '<div class="lz-row">' + K.sndBtn() + '<button type="button" class="btn" id="lz-done">\u2713 Done</button></div>';
    var foc = document.activeElement && document.activeElement.id;
    box.innerHTML = h; wire(); qWire(); startWire();
    if (foc && $(foc)) try { $(foc).focus({ preventScroll: true }); } catch (e) {}
  }
  function wire() {
    var q = function (id, fn) { var e = $(id); if (e) e.onclick = fn; };
    q('lz-done', K.close); q('lz-snd', K.sndClick); q('lz-back', K.back);
    q('lz-start', function () { var r = R(); if (!r.start) return; K.edit(function (o) { var s = JSON.parse(JSON.stringify(r.start)); o.layers = s.layers; o.marks = s.marks; o.tint = s.tint; delete o.art; }); });
    Array.prototype.forEach.call(document.querySelectorAll('[data-layer]'), function (b) { b.onclick = function () { var id = this.getAttribute('data-layer');
      if (sel === id) K.edit(function (o) { o.layers[id].on = !o.layers[id].on; }); else { sel = id; render(); } }; });
    q('lz-onoff', function () { K.edit(function (o) { o.layers[sel].on = !o.layers[sel].on; }); });
    q('lz-big', function () { K.edit(function (o) { var s = o.layers[sel]; s.on = true; s.s = Math.min(2, (s.s || 0) + 1); }); });      // +-2 rungs: Fibonacci
    q('lz-small', function () { K.edit(function (o) { var s = o.layers[sel]; s.on = true; s.s = Math.max(-2, (s.s || 0) - 1); }); });
    Array.prototype.forEach.call(document.querySelectorAll('[data-col]'), function (b) { b.onclick = function () { var c = this.getAttribute('data-col'); if (!K.HEX.test(c)) return;
      if (mode === 'draw') { ink = c; return render(); } K.edit(function (o) { o.layers[sel].c = c; o.layers[sel].on = true; }); }; });
    Array.prototype.forEach.call(document.querySelectorAll('[data-mark]'), function (b) { b.onclick = function () { var m = this.getAttribute('data-mark'); if (K.markSets().indexOf(m) < 0) return; K.edit(function (o) { o.marks = m; o.layers.orbit.on = true; }); }; });
  }
  window.LogoEditor = { render: render, clean: clean };
})();
