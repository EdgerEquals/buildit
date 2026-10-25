/* QuizOrb: ONE quiz orb for the page, built on the help orb architecture (Rebella js/help-orb.js): a single instance
   made by init(), a fixed home dock bottom-right with safe-area insets that lifts above the footer (avoid()), one dialog
   with a focus trap, Escape and focus returned to where it came from, and a spring back home.
   What is new here: when a "name this" question is asked the orb grows and travels to the centre of the screen, shows
   the question and its 2 / 3 / 5 / 10 options, then glides home once the learner is done with it.
   Motion (free-wheel rule): one value p (0 = home, 1 = centre) follows its target through a damped spring
   (natural period PHI^(0 + own step) s, damping ratio 1/PHI), integrated each frame, so a new target mid-flight just
   bends the path: nothing blocks, snaps or waits. Every visual is a continuous function of p, transform and opacity only.
   Reduced motion or Lite: no travel, a simple fade (time constant PHI^-3 s). The rAF loop runs only while p is moving.
   API: QuizOrb.ask(spec) · QuizOrb.home() · QuizOrb.intro() · QuizOrb.reset() · QuizOrb.spotlight(elementId, prompt, o)
     spec = { term, q, opts[], a, picked, explain, bot, onPick(k), onTap('easy'|'hard'), onDone(), locked, okLabel, metLabel }
   POINT AND ENLARGE (spotlight): QuizOrb.spotlight(idOrSelector, prompt, o) points the orb at one part of the page: that
   part grows (by 1 + (PHI-1) * orbSize/partSize, so small parts grow most and big strips only a little) and glows, the
   scrim leaves a soft hole around it, and the orb's panel sits on the far side of the screen from it. prompt is either a
   string (a yes / not-quite question, e.g. "Is this the change you want?", o.choices + o.onPick(k)) or an ask() spec.
   The glow re-pulses on an exhaling phi cascade (Exhale, js/onboard.js) while nobody answers, then rests. Reduced
   motion or Lite: no growing, only the ring and glow. Released by home() or release(). Reusable for any later prompt.
   locked: no Later button, no Escape, no scrim tap, no orb tap to close: used by the required naming step only. */
(function () {
  'use strict';
  if (window.QuizOrb) return;
  var PHI = 1.6180339887, OWN = 0.25;
  try { var v = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--own-step')); if (isFinite(v)) OWN = v; } catch (e) {}
  var W = 2 * Math.PI / Math.pow(PHI, OWN), Z = 1 / PHI, TAU = Math.pow(PHI, -3 + OWN);
  var mq = window.matchMedia ? matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  var st = null;
  function calm() { return mq.matches || document.documentElement.classList.contains('lite'); }
  function css() {
    var s = document.createElement('style'); s.id = 'quiz-orb-css';
    s.textContent =
      '.qorb{position:fixed;right:calc(14px + env(safe-area-inset-right,0px));bottom:calc(14px + env(safe-area-inset-bottom,0px));z-index:40;width:48px;height:48px;border-radius:50%;padding:0;border:2px solid rgba(227,236,250,.75);' +
      'background:radial-gradient(circle at 34% 28%,#5A7DB5,#0B1F4D 58%,#050D1F);color:#fff;font:700 1.35rem/1 system-ui,sans-serif;box-shadow:0 2px 12px rgba(0,0,0,.45);cursor:pointer;transform-origin:50% 50%;will-change:transform;-webkit-tap-highlight-color:transparent}' +
      '.qorb i{display:block;font-style:normal;animation:qorbB var(--ph3,4.78s) ease-in-out infinite alternate}' +
      '@keyframes qorbB{from{transform:scale(1)}to{transform:scale(1.09)}}' +
      '.qorb:focus-visible{outline:3px solid #E3ECFA;outline-offset:3px}' +
      '.qorb-scrim{position:fixed;inset:0;z-index:38;background:#050D1F;opacity:0;pointer-events:none}' +
      '.qorb-pan{position:fixed;left:50%;top:50%;z-index:39;width:min(560px,calc(100vw - 24px));max-height:calc(100vh - 120px);overflow:auto;box-sizing:border-box;background:#102447;color:#fff;border:2px solid #9FB8E0;border-radius:18px;' +
      'padding:40px 16px 14px;box-shadow:0 18px 50px rgba(0,0,0,.55);opacity:0;transform:translate(-50%,-50%) scale(.236);will-change:transform,opacity}' +
      '.qorb-pan[hidden]{display:none}' +
      '.qorb-pan .qo-term{display:inline-block;font-size:.75rem;letter-spacing:.06em;text-transform:uppercase;color:#E3ECFA;font-weight:700;margin-bottom:4px}' +
      '.qorb-pan h2{margin:0 0 10px;font-size:clamp(1.05rem,4.2vw,1.3rem);line-height:1.35}' +
      '.qorb-pan .qo-opts{display:grid;gap:8px;margin:8px 0}.qorb-pan .qo-opts.many{grid-template-columns:1fr 1fr}' +
      '.qorb-pan .qo-opts button{text-align:left;border:2px solid #5A7DB5;background:#1B3A6B;color:#fff;border-radius:12px;padding:10px 12px;font-size:.98rem;min-height:44px}' +
      '.qorb-pan .qo-opts button.named{border-color:#7FD1A8}.qorb-pan .qo-opts button.met{border-color:#9FB8E0;border-style:dashed}' +
      '.qorb-pan .qo-fb{border-left:3px solid #7FD1A8;padding:6px 10px;margin:8px 0;background:rgba(127,209,168,.08);border-radius:0 8px 8px 0}' +
      '.qorb-pan .qo-fb.term{border-left-color:#9FB8E0;background:rgba(159,184,224,.1)}' +
      '.qorb-pan .qo-row{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-top:10px}' +
      '.qorb-pan .qo-row button{border:1px solid #5A7DB5;background:#0B1A33;color:#fff;border-radius:999px;padding:7px 14px;font-size:.9rem;min-height:40px}' +
      '.qorb-pan .qo-row .go{background:#9FB8E0;color:#0B1A33;border-color:#9FB8E0;font-weight:700;margin-left:auto}' +
      '.qorb-pan .qo-row button[aria-pressed=true]{background:#E3ECFA;color:#0B1A33}' +
      '.qorb-pan .qo-x{position:absolute;top:8px;right:8px;min-width:44px;min-height:34px;border:1px solid #5A7DB5;border-radius:999px;background:#0B1A33;color:#fff;font-size:.85rem}' +
      '.qorb-pan .qo-say{margin:0 0 8px;line-height:1.5}.qorb-pan .qo-sig{color:#9FB8E0;margin:0}' +
      '.qorb-pan button:focus-visible{outline:3px solid #E3ECFA;outline-offset:2px}' +
      '.qorb-spot{transform:scale(var(--qspot,1.618));filter:drop-shadow(0 0 6px #E3ECFA) drop-shadow(0 0 14px #9FB8E0);transition:transform var(--ph-1,.7s) cubic-bezier(.2,.9,.3,1.2),filter var(--ph-1,.7s);transform-origin:50% 50%}' +
      '.qorb-calm .qorb-spot,.lite .qorb-spot{transform:none}' +
      '.qorb-ring{position:fixed;z-index:39;pointer-events:none;border-radius:14px;border:3px solid #E3ECFA;box-shadow:0 0 0 4px rgba(159,184,224,.45),0 0 28px 8px rgba(159,184,224,.7);opacity:0;transition:opacity var(--ph-2,.4s)}' +
      '.qorb-ring.on{opacity:1}.qorb-ring.pulse{animation:qorbP var(--ph1,1.84s) ease-out 1}' +
      '@keyframes qorbP{0%{box-shadow:0 0 0 4px rgba(159,184,224,.45),0 0 28px 8px rgba(159,184,224,.7)}38.2%{box-shadow:0 0 0 10px rgba(227,236,250,.7),0 0 46px 16px rgba(159,184,224,.95)}100%{box-shadow:0 0 0 4px rgba(159,184,224,.45),0 0 28px 8px rgba(159,184,224,.7)}}';
    document.head.appendChild(s);
  }
  // ---- geometry: home centre, centre target; every visual is a continuous function of p ----
  function geo() {
    var r = st.orb.getBoundingClientRect(), t = st.orb.style.transform; // read home rect with no transform applied
    st.orb.style.transform = ''; r = st.orb.getBoundingClientRect(); st.orb.style.transform = t;
    var ph = st.pan.offsetHeight || 300;
    var cy = innerHeight / 2, sp = st.spot && st.spot.rect;
    if (sp) { var room = Math.max(0, (innerHeight - ph) / 2 - 12); cy += (sp.top + sp.height / 2 < innerHeight / 2 ? 1 : -1) * room; }   // far side from the part
    st.g = { hx: r.left + r.width / 2, hy: r.top + r.height / 2, cx: innerWidth / 2, cy: cy, top: cy - ph / 2 };
  }
  function draw() {
    var p = st.p, g = st.g, q = Math.max(0, Math.min(1, p)), o = st.orb, pan = st.pan;
    if (calm()) {                      // simple fade: nothing travels or scales
      o.style.transform = ''; o.style.opacity = String(1 - q * 0.618);
      pan.style.transform = 'translate(-50%,-50%) translate(0px,' + (g.cy - innerHeight / 2).toFixed(1) + 'px)'; pan.style.opacity = String(q); st.scrim.style.opacity = String(q * 0.618); return;
    }
    var bx = (g.cx - g.hx) * p, by = (g.top - g.hy) * p, bs = 1 + (PHI - 1) * p;   // the orb grows by PHI and rides on the panel's top edge
    o.style.transform = 'translate(' + bx.toFixed(1) + 'px,' + by.toFixed(1) + 'px) scale(' + bs.toFixed(3) + ')'; o.style.opacity = '1';
    var ox = (g.hx - g.cx) * (1 - p), oy = (g.hy - g.cy) * (1 - p) + (g.cy - innerHeight / 2), ps = 0.236 + 0.764 * p;   // + the offset away from a spotlit part
    pan.style.transform = 'translate(-50%,-50%) translate(' + ox.toFixed(1) + 'px,' + oy.toFixed(1) + 'px) scale(' + Math.max(0.05, ps).toFixed(3) + ')';
    pan.style.opacity = String(1 - Math.pow(1 - q, PHI)); st.scrim.style.opacity = String(q * 0.618);
  }
  function loop(ts) {
    var dt = Math.min(1 / 30, ((ts - (st.ts || ts)) / 1000) || 1 / 60); st.ts = ts;
    if (calm()) { st.p += (st.t - st.p) * (1 - Math.exp(-dt / TAU)); st.v = 0; }
    else { var a = -W * W * (st.p - st.t) - 2 * Z * W * st.v; st.v += a * dt; st.p += st.v * dt; }
    draw();
    if (Math.abs(st.p - st.t) + Math.abs(st.v) > 1e-3) { st.raf = requestAnimationFrame(loop); return; }
    st.p = st.t; st.v = 0; st.raf = 0; st.ts = 0; draw();
    if (st.t === 0) { st.pan.hidden = true; st.scrim.style.pointerEvents = 'none'; }
  }
  function go(target) {
    st.t = target;
    if (target === 1) { st.pan.hidden = false; st.scrim.style.pointerEvents = 'auto'; }
    geo(); st.pan.style.pointerEvents = target === 1 ? 'auto' : 'none';
    if (!st.raf) { st.ts = 0; st.raf = requestAnimationFrame(loop); }
  }
  // ---- the one dialog (focus trap, Escape, focus returned), as in the help orb ----
  function keys(e) {
    if (st.t !== 1) return;
    if (e.key === 'Escape') { e.preventDefault(); if (!locked()) home(); return; }
    if (e.key === 'Tab') { var f = st.pan.querySelectorAll('button:not([disabled])'); if (!f.length) return; var a = f[0], z = f[f.length - 1];
      if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); } else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
      else if (!st.pan.contains(document.activeElement)) { e.preventDefault(); a.focus(); } }
  }
  function open(build) {
    if (st.t !== 1) st.returnTo = document.activeElement && document.activeElement !== document.body ? document.activeElement : st.orb;
    st.pan.innerHTML = locked() ? '' : '<button type="button" class="qo-x" aria-label="Later: send the orb back">Later</button>'; build(st.pan);
    var x = st.pan.querySelector('.qo-x'); if (x) x.onclick = function () { home(); };
    go(1); var f = st.pan.querySelector('.qo-opts button:not([disabled]), .qo-row .go'); try { (f || st.pan.querySelector('button')).focus({ preventScroll: true }); } catch (e) {}
    if (window.Adapt) Adapt.note('quiz-orb', 'open');
  }
  function locked() { return !!(st && st.spec && st.spec.locked && st.spec.picked == null) || !!(st && st.hold); }
  function home() {
    if (!st || st.t === 0) return; release(); go(0);
    var b = st.returnTo; st.returnTo = null; if (b && b.focus && document.contains(b)) try { b.focus({ preventScroll: true }); } catch (e) {}
  }
  function el(tag, cls, text) { var x = document.createElement(tag); if (cls) x.className = cls; if (text != null) x.textContent = text; return x; }
  // the transparency message, in the bot's voice
  function introBody(pan, bot, then) {
    pan.appendChild(el('span', 'qo-term', 'Before we start'));
    pan.appendChild(el('h2', null, 'Nothing here is right or wrong.'));
    pan.appendChild(el('p', 'qo-say', 'It’s all you learning. As we go I’ll tell you the real terms and names for things, because what you can build depends on how clearly you can say what you mean.'));
    pan.appendChild(el('p', 'qo-say', 'So whatever you pick, I’ll just say “here’s the term for that”. If it feels too easy or too hard, tell me and I’ll change it.'));
    pan.appendChild(el('p', 'qo-sig', '— ' + (bot || 'your bot')));
    var row = el('div', 'qo-row'), b = el('button', 'go', then ? 'Let’s go →' : 'Got it'); b.type = 'button'; row.appendChild(b); pan.appendChild(row);
    b.onclick = function () { if (window.Learner) Learner.markIntro(); if (then) then(); else home(); };
  }
  function intro() { open(function (pan) { introBody(pan, st.spec && st.spec.bot); }); }
  function askBody(pan, s) {
    var tag = el('span', 'qo-term', s.label || 'Your turn'); pan.appendChild(tag);   // the term itself shows after the pick, or it gives the answer away
    var h = el('h2', null, s.q); h.id = 'qo-q'; pan.appendChild(h); pan.setAttribute('aria-labelledby', 'qo-q');
    var box = el('div', 'qo-opts' + (s.opts.length >= 5 ? ' many' : '')); box.setAttribute('role', 'group'); box.setAttribute('aria-labelledby', 'qo-q'); pan.appendChild(box);
    var fb = el('div'), row = el('div', 'qo-row'); fb.setAttribute('role', 'status'); pan.appendChild(fb); pan.appendChild(row);
    s.opts.forEach(function (o, k) { var b = el('button', null, o); b.type = 'button'; b.onclick = function () { if (s.picked == null) s.onPick(k); }; box.appendChild(b); });
    function mark() {
      box.querySelectorAll('button').forEach(function (b, k) { b.disabled = true; if (k === s.a) b.classList.add('named'); else if (k === s.picked) b.classList.add('met'); });
      tag.textContent = s.term; var ok = s.picked === s.a; fb.className = 'qo-fb' + (ok ? '' : ' term'); fb.innerHTML = '';
      fb.appendChild(el('b', null, ok ? (s.okLabel || 'Named it: ') : (s.metLabel || 'Here’s the term for that: '))); fb.appendChild(document.createTextNode(s.explain));
      row.innerHTML = '';
      [['easy', 'Too easy'], ['hard', 'Too hard']].forEach(function (x) { var b = el('button', null, x[1]); b.type = 'button'; b.setAttribute('aria-pressed', 'false');
        b.onclick = function () { if (b.getAttribute('aria-pressed') === 'true') return; b.setAttribute('aria-pressed', 'true'); s.onTap && s.onTap(x[0]); }; row.appendChild(b); });
      var g = el('button', 'go', s.onDone ? 'Next →' : 'Got it →'); g.type = 'button'; g.onclick = function () { if (s.onDone) s.onDone(); else home(); }; row.appendChild(g);
      try { g.focus({ preventScroll: true }); } catch (e) {}
    }
    s.mark = mark; if (s.picked != null) mark();
  }
  // ask: the first time on this device the transparency message comes first, then the question
  function ask(spec) {
    if (!st) init(); st.spec = spec;
    var q = function () { open(function (pan) { askBody(pan, spec); }); };
    if (window.Learner && !Learner.introSeen()) open(function (pan) { introBody(pan, spec.bot, q); }); else q();
  }
  // the page tells the orb an answer came in (from the orb or the inline card): both show the same feedback
  function picked(k) { if (st && st.spec) { st.spec.picked = k; if (st.t === 1 && st.spec.mark) st.spec.mark(); } }
  function avoid() {   // never sit on the footer: lift the dock above it while it is on screen
    if (!st) return; var f = document.getElementById('foot'), r = f && f.getBoundingClientRect();
    st.orb.style.bottom = r && r.top < innerHeight ? Math.round(innerHeight - r.top + 10) + 'px' : '';
    if (!st.raf && st.t === 0) { st.g = null; }
  }
  function init() {
    if (st) return window.QuizOrb;
    css();
    st = { p: 0, v: 0, t: 0, raf: 0, ts: 0, spec: null, returnTo: null, g: null };
    var host = document.getElementById('screen-app') || document.body;
    st.scrim = el('div', 'qorb-scrim'); st.scrim.setAttribute('aria-hidden', 'true'); st.scrim.onclick = function () { if (!locked()) home(); };
    st.ring = el('div', 'qorb-ring'); st.ring.setAttribute('aria-hidden', 'true');
    st.pan = el('div', 'qorb-pan'); st.pan.hidden = true; st.pan.setAttribute('role', 'dialog'); st.pan.setAttribute('aria-modal', 'true');
    st.orb = el('button', 'qorb'); st.orb.type = 'button'; st.orb.id = 'quiz-orb'; st.orb.innerHTML = '<i aria-hidden="true">?</i>';
    st.orb.setAttribute('aria-label', 'Quiz orb. It brings the questions to the middle of the screen. Tap to open it.');
    st.orb.onclick = function () { if (st.t === 1) { if (!locked()) home(); return; } if (st.spec && st.spec.picked == null) ask(st.spec); else intro(); };
    host.appendChild(st.scrim); host.appendChild(st.ring); host.appendChild(st.pan); host.appendChild(st.orb);
    document.addEventListener('keydown', keys, true);
    addEventListener('resize', function () { avoid(); place(); if (st.t === 1) { geo(); draw(); } });
    addEventListener('scroll', function () { avoid(); place(); }, { passive: true }); avoid();
    if (window.ResizeObserver) new ResizeObserver(function () { avoid(); }).observe(document.body);   // page content changed height
    return window.QuizOrb;
  }
  function reset() { if (!st) return; release(); st.hold = false; st.spec = null; st.t = 0; st.p = 0; st.v = 0; if (st.raf) cancelAnimationFrame(st.raf); st.raf = 0; st.pan.hidden = true; st.scrim.style.pointerEvents = 'none'; st.g = st.g || null; if (st.g) draw(); }
  // ---- point and enlarge: one part of the page grows and glows while the orb asks about it ----
  function find(id) { if (!id) return null; return document.getElementById(id) || (/^[.#\[]/.test(id) ? document.querySelector(id) : null); }
  function place() {
    var s = st && st.spot; if (!s) return;
    var r = s.el.getBoundingClientRect(), pad = 6; s.rect = r;
    if (!r.width && !r.height) { st.ring.classList.remove('on'); st.scrim.style.background = ''; return; }
    var R = st.ring.style; R.left = (r.left - pad) + 'px'; R.top = (r.top - pad) + 'px'; R.width = (r.width + 2 * pad) + 'px'; R.height = (r.height + 2 * pad) + 'px';
    st.ring.classList.add('on');
    var cx = r.left + r.width / 2, cy = r.top + r.height / 2, rx = r.width / 2 + pad * PHI * PHI, ry = r.height / 2 + pad * PHI * PHI;
    st.scrim.style.background = 'radial-gradient(' + rx.toFixed(0) + 'px ' + ry.toFixed(0) + 'px at ' + cx.toFixed(0) + 'px ' + cy.toFixed(0) + 'px,transparent 0,transparent 76.4%,#050D1F 100%)';
  }
  function release() {
    if (!st || !st.spot) return; var s = st.spot; st.spot = null;
    s.el.classList.remove('qorb-spot'); s.el.style.removeProperty('--qspot'); if (s.pulse) s.pulse.stop();
    st.ring.classList.remove('on', 'pulse'); st.scrim.style.background = ''; document.documentElement.classList.remove('qorb-calm');
  }
  function spotlight(id, prompt, o) {
    if (!st) init(); o = o || {}; release();
    var t = find(id);
    if (t === st.orb) t = null;   // the orb is already right there, riding on its own panel
    if (t) {
      try { t.scrollIntoView({ block: 'center', inline: 'nearest' }); } catch (e) {}
      var r = t.getBoundingClientRect(), big = Math.max(r.width, r.height, 1), orb = st.orb.offsetWidth || 48;
      t.style.setProperty('--qspot', (1 + (PHI - 1) * Math.min(1, orb / big)).toFixed(3));   // a ratio of the orb's own size
      if (calm()) document.documentElement.classList.add('qorb-calm');
      t.classList.add('qorb-spot'); st.spot = { el: t, rect: r };
      requestAnimationFrame(place); setTimeout(place, Math.pow(PHI, -1 + OWN) * 1000);   // again once it has grown
      if (window.Exhale) st.spot.pulse = Exhale.run(function () { if (!st.spot || st.spot.el !== t) return false; st.ring.classList.remove('pulse'); void st.ring.offsetWidth; st.ring.classList.add('pulse'); });
    }
    var spec = typeof prompt === 'string' ? null : prompt;
    if (spec) { spec.bot = spec.bot || o.bot; st.spec = spec; var q = function () { open(function (pan) { askBody(pan, spec); }); };
      if (window.Learner && !Learner.introSeen()) open(function (pan) { introBody(pan, spec.bot, q); }); else q();
      return { release: release, found: !!t }; }
    st.spec = null;
    open(function (pan) {
      var h = el('h2', null, prompt); h.id = 'qo-q'; pan.appendChild(h); pan.setAttribute('aria-labelledby', 'qo-q');
      var row = el('div', 'qo-row'); pan.appendChild(row);
      (o.choices || ['Yes', 'Not quite']).forEach(function (c, k) { var b = el('button', k ? null : 'go', c); b.type = 'button'; b.onclick = function () { if (o.onPick) o.onPick(k); home(); }; row.appendChild(b); });
    });
    return { release: release, found: !!t };
  }
  window.QuizOrb = { init: init, ask: ask, picked: picked, home: home, intro: intro, reset: reset, spotlight: spotlight, release: release, hold: function (on) { if (!st) init(); st.hold = !!on; }, state: function () { return st ? { p: st.p, t: st.t } : null; } };
})();
