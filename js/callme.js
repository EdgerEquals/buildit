/* CALL-ME (Kids Club "What would you like to be called", Danny 2026-10-26 13:29 AWST): the first step after unlock,
   before step 1 (naming the parts). One question, one kind tip. A kid who already did step 1 sees it once, softly.
   What he types is his call-me word: kept on this device only ('buildit.callme'), never sent, never in the encrypted
   config, never treated as a name. The page greets him with it; blank = the page's old greeting. Changeable any time
   from Build more. Motion: one fade, PHI steps of the page's own step, eased (free-wheel); none under reduced motion. */
(function () {
  'use strict';
  if (window.CallMe) return;
  var KEY = 'buildit.callme', PHI = 1.6180339887, OWN = 0,   // read from the page's own --own-step below
      $ = function (id) { return document.getElementById(id); };
  try { var v = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--own-step')); if (isFinite(v)) OWN = v; } catch (e) {}
  var MAX = 21;   // Fibonacci count of characters
  // NAME KIND (Kids Club "name check on every word", Danny 14:51 AWST): where something he types would show, a match with any word of
  // his real name (BI.nameLike: in memory after unlock, from the encrypted config) gets a kind fix-it line and Surprise me. It only
  // suggests: Keep mine always works. Nothing about the match is stored or sent.
  var ADJ = ['Cosmic', 'Turbo', 'Pixel', 'Rocket', 'Solar', 'Neon', 'Thunder', 'Galaxy', 'Laser', 'Comet', 'Atomic', 'Mega', 'Stealth'];
  var ANI = ['Otter', 'Falcon', 'Gecko', 'Panda', 'Tiger', 'Fox', 'Shark', 'Owl', 'Wolf', 'Koala', 'Dragon', 'Robot', 'Lynx'];
  var NK = { n: Math.floor(Math.random() * ADJ.length * ANI.length) };
  // COUNTS ONLY (Danny 14:54 AWST): each name-check episode (one box, from the first match until he moves on) is counted, never its
  // text: trips, retries (matched again after a fix-it line), Surprise me taps, Keep mine taps, and Pump A pace there (z = PHI rungs
  // slower than his usual, from js/stuck.js). Sent as one silent encrypted signal when the episode ends. A trip loop (3 trips, a
  // Fibonacci count) or a pace drop (z >= 1) raises the usual generic stuck signal through the same path, once per episode.
  var EP = {}, WHERE = { name: 'callme', word: 'logo', look: 'look' };
  function z() { var s = window.Stuck && Stuck.state && Stuck.state(); return s && s.pace && s.usual ? Math.log(s.pace / s.usual) / Math.log(PHI) : 0; }
  function sig(o) { try { if (window.BI && BI.signal) BI.signal(o); } catch (e) {} }
  function stuckOpen() { var s = window.Stuck && Stuck.state && Stuck.state(); return !!(s && s.step && s.open && s.open.indexOf(s.step) >= 0); }
  function trip(w) {
    var e = EP[w] || (EP[w] = { trips: 0, retries: 0, surprise: 0, keep: 0, z: 0, st: 0 }); e.trips++; if (e.trips > 1) e.retries++;
    var zz = z(); if (zz > e.z) e.z = zz;
    if (!e.st && (e.trips >= 3 || zz >= 1) && !stuckOpen()) { e.st = 1; sig({ kind: 'stuck', step: 'name:' + w, label: 'name check · ' + w, before: 'name' }); }
  }
  function end(w) {
    var e = EP[w]; if (!e) return; delete EP[w];
    sig({ kind: 'namecheck', where: w, trips: e.trips, retries: e.retries, surprise: e.surprise, keep: e.keep, z: Math.round(e.z * 100) / 100, loop: e.trips >= 3 ? 1 : 0 });
    if (e.st) sig({ kind: 'recovered', step: 'name:' + w, label: 'name check · ' + w, before: 'name' });
  }
  document.addEventListener('bi:lock', function () { Object.keys(EP).forEach(end); });
  var NameKind = {
    like: function (t) { return !!(window.BI && BI.nameLike && BI.nameLike(t)); },
    done: function (what) { end(WHERE[what] || 'callme'); },   // the box moved on (saved, kept, closed): end the episode, send the counts
    surprise: function () { NK.n += Math.round(ADJ.length * ANI.length / PHI); var k = NK.n % (ADJ.length * ANI.length); return ADJ[k % ADJ.length] + ' ' + ANI[Math.floor(k / ADJ.length)]; },
    // line(after, {what, surprise(), onSurprise(v), onKeep()}): shows once under `after`; returns the element (remove it to hide)
    line: function (after, o) {
      css(); var w = WHERE[o.what] || 'callme'; trip(w); var old = after.parentNode && after.parentNode.querySelector('.nk'); if (old) old.remove();
      var p = document.createElement('div'); p.className = 'nk'; p.setAttribute('role', 'status');
      p.innerHTML = '<p>\uD83D\uDCA1 That looks a lot like your real name. Online, a made-up ' + (o.what || 'name') + ' keeps you safer. Want to try a fun one?</p>' +
        '<div class="btnrow"><button type="button" class="btn nk-s">\uD83C\uDFB2 Surprise me</button><button type="button" class="btn ghost2 nk-k">Keep mine</button></div>';
      after.parentNode.insertBefore(p, after.nextSibling);
      p.querySelector('.nk-s').onclick = function () { if (EP[w]) EP[w].surprise++; var v = (o.surprise || NameKind.surprise)(); p.remove(); if (o.onSurprise) o.onSurprise(v); };
      p.querySelector('.nk-k').onclick = function () { if (EP[w]) EP[w].keep++; p.remove(); if (o.onKeep) o.onKeep(); };
      return p;
    }
  };
  window.NameKind = NameKind;
  function rec() { try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { return null; } }
  function put(r) { try { localStorage.setItem(KEY, JSON.stringify(r)); } catch (e) {} }
  function clean(s) { return String(s || '').replace(/[\u0000-\u001f\u007f<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, MAX); }
  function word() { var r = rec(); return r && typeof r.t === 'string' ? clean(r.t) : ''; }
  function stepDone() { if (window.Onboard && Onboard.done && Onboard.done()) return true; try { var m = JSON.parse(localStorage.getItem('buildit.naming') || 'null'); return !!(m && m.done); } catch (e) { return false; } }
  function greet() { var h = $('q-hello'); if (h && window.BI) h.textContent = 'Hey ' + BI.name() + '!'; }
  function css() { if ($('cm-css')) return; var s = document.createElement('style'); s.id = 'cm-css';
    s.textContent = '.cm{border:1px solid var(--ac);border-radius:var(--r);padding:.618em;margin:.618em 0;background:var(--sf2);opacity:0;transition:opacity ' + Math.pow(PHI, OWN - 1).toFixed(3) + 's ease-out}.cm.in{opacity:1}' +
      '.cm.soft{border-style:dashed}.cm h2{margin:.236em 0 .382em}.cm input{width:100%;box-sizing:border-box;font:inherit;padding:.5em;border-radius:var(--r);border:1px solid var(--ac);background:var(--sf);color:inherit}' +
      '.cm .btnrow{margin-top:8px}.nk{border:1px dashed var(--ac);border-radius:var(--r);padding:.382em .618em;margin:.382em 0;background:var(--sf2)}.nk p{margin:.236em 0}.nk .btnrow{margin-top:.382em}html.cm-first #ob-gate{display:none}@media (prefers-reduced-motion:reduce){.cm{transition:none}}';
    document.head.appendChild(s); }
  function close(c) { if (c) c.remove(); document.documentElement.classList.remove('cm-first'); if (window.BuildMore) BuildMore.refresh(); }
  // soft = he already did step 1: a lighter card, nothing waits on it
  function ask(soft) {
    var qs = $('q-start'), old = $('cm-ask'); if (!qs) return; if (old) old.remove(); css();
    var c = document.createElement('div'); c.id = 'cm-ask'; c.className = 'cm' + (soft ? ' soft' : ''); c.setAttribute('role', 'group'); c.setAttribute('aria-labelledby', 'cm-q');
    c.innerHTML = (soft ? '' : '<p class="phase">First, one quick question</p>') + '<h2 id="cm-q">What would you like to be called?</h2>' +
      '<p class="pz-lead">\uD83D\uDCA1 Tip: we recommend not using your real name. A nickname or anything fun works.</p>' +
      '<input id="cm-in" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" aria-labelledby="cm-q">' +
      '<div class="btnrow"><button type="button" class="btn" id="cm-ok">That\u2019s me</button><button type="button" class="btn ghost2" id="cm-later">' + (word() ? 'Keep it' : 'Not now') + '</button></div>' +
      '<p class="muted">Only this device keeps it. You can change it any time in Build more.</p>';
    var lead = $('q-lead'); qs.insertBefore(c, lead || qs.firstChild);
    var inp = $('cm-in'); inp.maxLength = MAX; inp.value = word();
    if (!soft) document.documentElement.classList.add('cm-first');
    requestAnimationFrame(function () { c.classList.add('in'); });
    function save() { var t = clean(inp.value); put({ v: 1, t: t, seen: 1 }); greet(); close(c); NameKind.done('name'); }
    function ok() { var t = clean(inp.value); if (t && NameKind.like(t)) { NameKind.line(inp, { what: 'name', onSurprise: function (v) { inp.value = v; try { inp.focus({ preventScroll: true }); } catch (e) {} }, onKeep: save }); return; } save(); }
    $('cm-ok').onclick = ok; inp.onkeydown = function (e) { if (e.key === 'Enter') ok(); };
    $('cm-later').onclick = function () { var r = rec() || { v: 1, t: '' }; r.seen = 1; put(r); close(c); };
    if (!soft) try { inp.focus({ preventScroll: true }); } catch (e) {}
  }
  function open() { if (!window.BI || !BI.ready()) return; greet(); if ($('cm-ask')) return; var r = rec(); if (r && r.seen) return; var soft = stepDone(); if (soft) put({ v: 1, t: word(), seen: 1 }); ask(soft); }
  document.addEventListener('bi:open', open);
  document.addEventListener('bi:lock', function () { close($('cm-ask')); });
  window.CallMe = { word: word, ask: function () { ask(true); }, key: KEY };
  open();
})();
