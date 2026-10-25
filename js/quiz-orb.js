/* QuizOrb: ONE quiz orb for the page, built on the help orb architecture (Rebella js/help-orb.js): a single instance
   made by init(), a fixed home dock bottom-right with safe-area insets that lifts above the footer (avoid()), one dialog
   with a focus trap, Escape and focus returned to where it came from, and a spring back home.
   What is new here: when a "name this" question is asked the orb grows and travels to the centre of the screen, shows
   the question and its 2 / 3 / 5 / 10 options, then glides home once the learner is done with it.
   Motion (free-wheel rule): one value p (0 = home, 1 = centre) follows its target through a damped spring
   (natural period PHI^(0 + own step) s, damping ratio 1/PHI), integrated each frame, so a new target mid-flight just
   bends the path: nothing blocks, snaps or waits. Every visual is a continuous function of p, transform and opacity only.
   Reduced motion or Lite: no travel, a simple fade (time constant PHI^-3 s). The rAF loop runs only while p is moving.
   API: QuizOrb.ask(spec) · QuizOrb.home() · QuizOrb.intro() · QuizOrb.reset()
     spec = { term, q, opts[], a, picked, explain, bot, onPick(k), onTap('easy'|'hard') } */
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
      '.qorb-pan button:focus-visible{outline:3px solid #E3ECFA;outline-offset:2px}';
    document.head.appendChild(s);
  }
  // ---- geometry: home centre, centre target; every visual is a continuous function of p ----
  function geo() {
    var r = st.orb.getBoundingClientRect(), t = st.orb.style.transform; // read home rect with no transform applied
    st.orb.style.transform = ''; r = st.orb.getBoundingClientRect(); st.orb.style.transform = t;
    var ph = st.pan.offsetHeight || 300;
    st.g = { hx: r.left + r.width / 2, hy: r.top + r.height / 2, cx: innerWidth / 2, cy: innerHeight / 2, top: innerHeight / 2 - ph / 2 };
  }
  function draw() {
    var p = st.p, g = st.g, q = Math.max(0, Math.min(1, p)), o = st.orb, pan = st.pan;
    if (calm()) {                      // simple fade: nothing travels or scales
      o.style.transform = ''; o.style.opacity = String(1 - q * 0.618);
      pan.style.transform = 'translate(-50%,-50%)'; pan.style.opacity = String(q); st.scrim.style.opacity = String(q * 0.618); return;
    }
    var bx = (g.cx - g.hx) * p, by = (g.top - g.hy) * p, bs = 1 + (PHI - 1) * p;   // the orb grows by PHI and rides on the panel's top edge
    o.style.transform = 'translate(' + bx.toFixed(1) + 'px,' + by.toFixed(1) + 'px) scale(' + bs.toFixed(3) + ')'; o.style.opacity = '1';
    var ox = (g.hx - g.cx) * (1 - p), oy = (g.hy - g.cy) * (1 - p), ps = 0.236 + 0.764 * p;
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
    if (e.key === 'Escape') { e.preventDefault(); home(); return; }
    if (e.key === 'Tab') { var f = st.pan.querySelectorAll('button:not([disabled])'); if (!f.length) return; var a = f[0], z = f[f.length - 1];
      if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); } else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
      else if (!st.pan.contains(document.activeElement)) { e.preventDefault(); a.focus(); } }
  }
  function open(build) {
    if (st.t !== 1) st.returnTo = document.activeElement && document.activeElement !== document.body ? document.activeElement : st.orb;
    st.pan.innerHTML = '<button type="button" class="qo-x" aria-label="Later: send the orb back">Later</button>'; build(st.pan);
    st.pan.querySelector('.qo-x').onclick = function () { home(); };
    go(1); var f = st.pan.querySelector('.qo-opts button:not([disabled]), .qo-row .go'); try { (f || st.pan.querySelector('button')).focus({ preventScroll: true }); } catch (e) {}
    if (window.Adapt) Adapt.note('quiz-orb', 'open');
  }
  function home() {
    if (!st || st.t === 0) return; go(0);
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
      fb.appendChild(el('b', null, ok ? 'Spot on! ' : 'Here’s the term for that: ')); fb.appendChild(document.createTextNode(s.explain));
      row.innerHTML = '';
      [['easy', 'Too easy'], ['hard', 'Too hard']].forEach(function (x) { var b = el('button', null, x[1]); b.type = 'button'; b.setAttribute('aria-pressed', 'false');
        b.onclick = function () { if (b.getAttribute('aria-pressed') === 'true') return; b.setAttribute('aria-pressed', 'true'); s.onTap && s.onTap(x[0]); }; row.appendChild(b); });
      var g = el('button', 'go', 'Got it →'); g.type = 'button'; g.onclick = home; row.appendChild(g);
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
    st.scrim = el('div', 'qorb-scrim'); st.scrim.setAttribute('aria-hidden', 'true'); st.scrim.onclick = function () { home(); };
    st.pan = el('div', 'qorb-pan'); st.pan.hidden = true; st.pan.setAttribute('role', 'dialog'); st.pan.setAttribute('aria-modal', 'true');
    st.orb = el('button', 'qorb'); st.orb.type = 'button'; st.orb.id = 'quiz-orb'; st.orb.innerHTML = '<i aria-hidden="true">?</i>';
    st.orb.setAttribute('aria-label', 'Quiz orb. It brings the physics questions to the middle of the screen. Tap to open it.');
    st.orb.onclick = function () { if (st.t === 1) { home(); return; } if (st.spec && st.spec.picked == null) ask(st.spec); else intro(); };
    host.appendChild(st.scrim); host.appendChild(st.pan); host.appendChild(st.orb);
    document.addEventListener('keydown', keys, true);
    addEventListener('resize', function () { avoid(); if (st.t === 1) { geo(); draw(); } });
    addEventListener('scroll', avoid, { passive: true }); avoid();
    if (window.ResizeObserver) new ResizeObserver(function () { avoid(); }).observe(document.body);   // page content changed height
    return window.QuizOrb;
  }
  function reset() { if (!st) return; st.spec = null; st.t = 0; st.p = 0; st.v = 0; if (st.raf) cancelAnimationFrame(st.raf); st.raf = 0; st.pan.hidden = true; st.scrim.style.pointerEvents = 'none'; st.g = st.g || null; if (st.g) draw(); }
  window.QuizOrb = { init: init, ask: ask, picked: picked, home: home, intro: intro, reset: reset, state: function () { return st ? { p: st.p, t: st.t } : null; } };
})();
