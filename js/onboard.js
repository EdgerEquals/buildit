/* ONBOARD: Kids Club onboarding on this page (loaded after unlock, with the questions).
   1. EXHALE: the background timing pattern from Danny's golden-ratio reminder cascade (the dad-ping repeater): a first
      gap, then each gap x PHI, until the next one would pass the page's longest beat, then it rests. Used for every
      background re-ask and re-nudge. Never shown on the page.
   2. NAMING STEP (required, Danny 2026-10-25 16:00 AWST): learning what every part of the page is called. The quiz orb
      points at each part (QuizOrb.spotlight: the part grows and glows), asks its name, and answers with "here's the name
      for that" (nothing right or wrong). No skip, no close, no Escape. A part not named yet comes back later in the queue,
      spaced on the exhaling cascade (in questions). Until every part is named, the Keep / Change pieces and the extra
      questions stay locked; the page itself, chat, DJ and Lite still work. This hard gate is an explicit exception to
      rule 6 (docs/learning-model.md). Progress is on this device only (localStorage 'buildit.naming': part ids and
      counts, no text).
   3. WHAT YOU WANT TO LEARN: "more of this, less of that" as a roll pair (left box: I want more of this, right box: less
      of this for now), the same tile + Roll + Lock it in component as the extra questions.
      Sent encrypted as kind:'answers', propose-only, like every other answer set.
   Nothing personal in this file. */
(function () {
  'use strict';
  if (window.Onboard) return;
  var PHI = 1.6180339887, OWN = 0.25;
  try { var v = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--own-step')); if (isFinite(v)) OWN = v; } catch (e) {}
  var $ = function (id) { return document.getElementById(id); };
  var sec = function (n) { return Math.pow(PHI, n + OWN); };
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- 1. the exhaling cascade (same shape as the reminder repeater: base, gap *= ratio, stop at the cap) ----------
  var Exhale = {
    // offsets (s) of each beat: first gap, each gap x ratio, stopping once the total would pass `cap`
    offsets: function (first, ratio, cap) { var out = [], g = first, t = 0; while (t + g <= cap) { t += g; out.push(t); g *= ratio; } return out; },
    // in questions: where a re-ask goes, k = how many times it has been met (0-based)
    slot: function (base, k) { return Math.max(1, Math.round(base * Math.pow(PHI, k))); },
    // run fn on the cascade (defaults: first PHI^2 s, ratio PHI, rest after the page's longest beat PHI^9); fn() === false stops it
    run: function (fn, o) {
      o = o || {}; var offs = Exhale.offsets(o.first || sec(2), o.ratio || PHI, o.cap || sec(9)), t0 = Date.now(), tm = null, i = 0, live = true;
      function next() { if (!live || i >= offs.length) return; tm = setTimeout(function () { if (!live) return; if (fn(i) === false) { live = false; return; } i++; next(); }, Math.max(0, offs[i] * 1000 - (Date.now() - t0))); }
      next(); return { stop: function () { live = false; clearTimeout(tm); } };
    }
  };
  window.Exhale = Exhale;

  // ---------- 2. the naming step ----------
  // sel = element id or selector on this page. t = the name (interface vocabulary). o = the author's options (t first).
  var ITEMS = [
    { id: 'head', sel: 'head', t: 'header', q: 'This strip across the top of your page. What is it called?', o: ['header', 'footer', 'panel', 'tab'],
      x: 'Header = the strip across the top. It holds your page title, the DJ pill, the tabs and the lock button.' },
    { id: 'avatar', sel: 'h-av', t: 'avatar', q: 'This small picture of your bot, up in the header. What is it called?', o: ['avatar', 'status light', 'badge', 'page title'],
      x: 'Avatar = a small picture that stands for someone. This one is your bot.' },
    { id: 'title', sel: 'h-title', t: 'page title', q: 'These words at the top of the page. What are they called?', o: ['page title', 'header', 'banner', 'button'],
      x: 'Page title = the name of the page. It shows in the header and on the browser tab.' },
    { id: 'dj', sel: 'dj-pill', t: 'DJ pill', q: 'This rounded button with ♫ on it. What is it called?', o: ['DJ pill', 'tab', 'status light', 'slider'],
      x: 'DJ pill = a pill-shaped button. Tap it to open the DJ and play music.' },
    { id: 'tabs', sel: 'tab-q', t: 'tab', q: 'This switches between Questions and Chat. What is it called?', o: ['tab', 'header', 'panel', 'DJ pill'],
      x: 'Tab = one of a row of switches. Each tab shows a different part of the page.' },
    { id: 'lock', sel: 'lock-btn', t: 'lock button', q: 'Tap this and the page closes until the password is typed again. What is it called?', o: ['lock button', 'Lite switch', 'send button', 'tab'],
      x: 'Lock button = locks your page. The password opens it again.' },
    { id: 'orbit', sel: '.orb-layer', t: 'orbit emojis', q: 'These space emojis that loop around your page. What are they called?', o: ['orbit emojis', 'avatar', 'status light', 'quiz orb'],
      gone: 'The space emojis that loop around your page (they rest while Lite is on). What are they called?',
      x: 'Orbit emojis = emojis that go round and round in loops, like planets in orbit.' },
    { id: 'panel', sel: 'q-start', t: 'panel', q: 'This box that holds your questions and buttons. What is it called?', o: ['panel', 'footer', 'tab', 'pop-up'],
      x: 'Panel = a box that groups things together on a page.' },
    { id: 'orb', sel: 'quiz-orb', t: 'quiz orb', q: 'The round button with a ? that brought this question to you. What is it called?', o: ['quiz orb', 'avatar', 'status light', 'DJ pill'],
      x: 'Quiz orb = the round button that brings questions to the middle of the screen, then glides back to its corner.' },
    { id: 'foot', sel: 'foot', t: 'footer', q: 'This strip along the bottom of your page. What is it called?', o: ['footer', 'header', 'panel', 'tide line'],
      x: 'Footer = the strip along the bottom. It holds the status light, the Lite switch and who made the page.' },
    { id: 'led', sel: 'f-led', t: 'status light', q: 'This little light in the footer. What is it called?', o: ['status light', 'avatar', 'tide line', 'quiz orb'],
      x: 'Status light = a light that shows what is happening: green when online, a quicker glow for a new message.' },
    { id: 'tide', sel: '.foot .tide', t: 'tide line', q: 'This thin wave along the top edge of the footer. What is it called?', o: ['tide line', 'status light', 'header', 'slider'],
      x: 'Tide line = the thin wave that flows along the edge of the footer.' },
    { id: 'lite', sel: 'lite-btn', t: 'Lite switch', q: 'This button in the footer makes the page lighter and calmer. What is it called?', o: ['Lite switch', 'lock button', 'tab', 'DJ pill'],
      x: 'Lite switch = turns Lite mode on and off. Lite has less moving, so the page is quicker.' },
    // properties: what can change about a part
    { id: 'p-colour', sel: 'f-led', t: 'colour', q: 'The status light is green now and turns orange when you are offline. What is changing?', o: ['colour', 'size', 'speed', 'direction'],
      x: 'Colour = what colour something is. Every part of your page has one you can change.' },
    { id: 'p-size', sel: 'h-av', t: 'size', q: 'Your bot gets a little bigger and smaller as it breathes. What is changing?', o: ['size', 'colour', 'direction', 'see-through'],
      x: 'Size = how big something is. Bigger or smaller is a change of size.' },
    { id: 'p-speed', sel: '.orb-layer', t: 'speed', q: 'Some emojis take longer than others to go all the way round. What is different?', o: ['speed', 'size', 'colour', 'direction'],
      x: 'Speed = how fast something moves. Slower means it takes longer.' },
    { id: 'p-dir', sel: '.orb-layer', t: 'direction', q: 'Two emojis go one way round and one goes the other way. What is different?', o: ['direction', 'speed', 'size', 'colour'],
      x: 'Direction = which way something moves.' },
    { id: 'p-see', sel: '.orb-layer', t: 'see-through', q: 'The emojis fade so you can see the page behind them. What is that called?', o: ['see-through', 'colour', 'size', 'speed'],
      x: 'See-through = how much you can see through something. Fully solid hides what is behind it.' }
  ];
  var NKEY = 'buildit.naming', N = null, running = false;
  function nfresh() { return { v: 1, named: {}, met: {}, q: [], done: 0 }; }
  function nload() { try { var d = JSON.parse(localStorage.getItem(NKEY) || 'null'); if (d && d.v === 1) return d; } catch (e) {} return nfresh(); }
  function nsave() { try { localStorage.setItem(NKEY, JSON.stringify(N)); } catch (e) {} }
  function item(id) { for (var i = 0; i < ITEMS.length; i++) if (ITEMS[i].id === id) return ITEMS[i]; return null; }
  function namedCount() { return ITEMS.filter(function (it) { return N.named[it.id]; }).length; }
  function done() { if (!N) N = nload(); return !!N.done || ITEMS.every(function (it) { return N.named[it.id]; }); }
  // where a met part comes back: the first gap is a ratio of the set (n / PHI^4), each later gap PHI times longer
  var BASE = function () { return ITEMS.length / Math.pow(PHI, 4); };
  function queue() {
    var have = {}; N.q = N.q.filter(function (id) { if (!item(id) || N.named[id] || have[id]) return false; have[id] = 1; return true; });
    ITEMS.forEach(function (it) { if (!N.named[it.id] && !have[it.id]) N.q.push(it.id); });
  }
  function start() {
    if (!window.QuizOrb || !window.BI || !BI.ready()) return;
    N = N || nload(); queue();
    if (!N.q.length) return finish();
    running = true; document.documentElement.classList.add('ob-naming');
    $('view-q').hidden = false; $('view-c').hidden = true;   // the parts it points at are on the Questions view
    QuizOrb.init(); QuizOrb.hold(true); askNext();
  }
  function askNext() {
    queue(); if (!N.q.length) return finish();
    var it = item(N.q[0]), seed = 'name:' + it.id + ':' + (N.met[it.id] || 0), nm = namedCount();
    var B = window.Learner ? Learner.build({ t: it.t, o: it.o, a: 0 }, seed) : { opts: it.o.slice(), a: 0 };
    var el = document.getElementById(it.sel) || document.querySelector(it.sel), seen = el && (el.getClientRects().length > 0) && !el.closest('[hidden]');
    var spec = { locked: true, term: it.t, label: 'Name it · ' + (nm + 1) + ' of ' + ITEMS.length, q: seen ? it.q : (it.gone || it.q), opts: B.opts, a: B.a, explain: it.x, bot: BI.bot(),
      okLabel: 'Named it: ', metLabel: 'Here’s the name for that: ',
      onPick: function (k) {
        if (spec.picked != null) return; spec.picked = k; var ok = k === B.a;
        if (window.Learner) Learner.record(it.t, ok);
        N.q.shift();
        if (ok) N.named[it.id] = Date.now();
        else { var m = N.met[it.id] = (N.met[it.id] || 0) + 1; N.q.splice(Math.min(N.q.length, Exhale.slot(BASE(), m - 1)), 0, it.id); }   // comes back later, exhaling
        nsave(); prog(); if (window.Adapt) Adapt.note('naming', 'answer');
        if (spec.mark) spec.mark();
      },
      onTap: function (t) { if (window.Learner) Learner.tap(t); },
      onDone: function () { askNext(); } };
    QuizOrb.spotlight(seen ? it.sel : null, spec);
  }
  function finish() {
    running = false; N.done = N.done || Date.now(); nsave(); document.documentElement.classList.remove('ob-naming');
    if (window.QuizOrb) { QuizOrb.hold(false); QuizOrb.home(); }
    gate(); learnOpen();
  }
  // ---- the gate on the start panel ----
  function prog() { var p = $('ob-prog'); if (p) p.textContent = namedCount() + ' of ' + ITEMS.length + ' parts named'; }
  function gate() {
    var qs = $('q-start'); if (!qs) return;
    var g = $('ob-gate'), d = done();
    if (!g) { g = document.createElement('div'); g.id = 'ob-gate'; g.className = 'ob-gate'; var ld = $('q-lead'); qs.insertBefore(g, ld ? ld.nextSibling : qs.firstChild); }
    if (!d) g.innerHTML = '<p class="phase">Step 1 · everyone does this one</p><h2>Name every part of your page</h2>' +
      '<p class="pz-lead">To build your page, you need the names for its parts. The quiz orb points at each part, makes it bigger, and asks what it is called. The rest opens once every part has a name.</p>' +
      '<div class="btnrow"><button type="button" class="btn big" id="ob-go" data-use="naming">' + (namedCount() ? 'Keep naming' : 'Start naming') + '</button></div><p class="muted" id="ob-prog"></p>';
    else g.innerHTML = '<div class="btnrow"><button type="button" class="btn ghost2" id="ob-learn-go" data-use="learn">What do you want to learn?</button></div>';
    ['pz-go', 'q-go'].forEach(function (id) { var b = $(id); if (!b) return; b.disabled = !d; b.setAttribute('aria-disabled', String(!d)); b.title = d ? '' : 'Opens after step 1: naming the parts of your page'; });
    if (!d) { $('ob-go').onclick = start; prog(); } else $('ob-learn-go').onclick = learnOpen;
  }

  // ---------- 3. what you want to learn: more of this, less of that (tile + Roll, as in the extra questions) ----------
  var T = function (t, e) { return { t: t, e: e }; };
  var LPOOL = [T('Arduino', '🔌'), T('Naming things', '🏷️'), T('Building my page', '🛠️'), T('Sound and music', '🎵'), T('Motion', '🌀'), T('Colours', '🎨'),
    T('Coding', '💻'), T('Circuits and wiring', '⚡'), T('Robots and servos', '🤖'), T('Design and layout', '✏️'), T('LEDs and lights', '💡'), T('Sensors', '📡'), T('Making games', '🎮'), T('Writing my own code', '⌨️')];
  var LQ = [['Arduino', 'Naming things'], ['Building my page', 'Sound and music'], ['Motion', 'Colours'], ['Coding', 'Circuits and wiring'], ['Robots and servos', 'Design and layout']];
  var LKEY = 'buildit-learn', L = null;
  function lfresh() { return { v: 1, i: 0, ans: LQ.map(function (p) { return { opts: p.slice(), pick: null }; }), sent: 0 }; }
  async function lload() { L = lfresh(); try { var raw = localStorage.getItem(LKEY); if (raw) { var s = await BI.dec(JSON.parse(raw)); if (s && s.v === 1) L = s; } } catch (e) { localStorage.removeItem(LKEY); } }
  async function lsave() { try { localStorage.setItem(LKEY, JSON.stringify(await BI.enc(L))); } catch (e) {} }
  function lcard() {
    var c = $('ob-learn'); if (c) return c;
    c = document.createElement('section'); c.className = 'panel'; c.id = 'ob-learn'; c.hidden = true; c.setAttribute('aria-live', 'polite');
    c.innerHTML = '<p class="phase" id="ol-phase">What you want to learn</p><div class="dots" id="ol-dots" aria-hidden="true"></div><p class="count" id="ol-count"></p>' +
      '<h2 class="qtext" id="ol-text"></h2><p class="pdesc">Do more of this, less of that. Roll each box until it feels right, then lock it in.</p>' +
      '<div class="choices" id="ol-choices"><div class="choice"><span class="rp-lab love">&#x1F499; I want more of this</span><button type="button" class="tile" id="ol-t0"></button><button type="button" class="btn roll" data-i="0">&#x1F3B2; Roll</button></div>' +
      '<div class="choice"><span class="rp-lab least">&#x1F4AD; Less of this for now</span><button type="button" class="tile" id="ol-t1"></button><button type="button" class="btn roll" data-i="1">&#x1F3B2; Roll</button></div></div>' +
      '<div class="btnrow rp-row"><button type="button" class="btn big" id="ol-lock">Lock it in &crarr;</button></div>' +
      '<div class="btnrow"><button type="button" class="btn bk" id="ol-back">&larr; Back</button><button type="button" class="btn skip" id="ol-skip">Skip</button></div><p class="sendstat" id="ol-stat" role="status"></p>';
    var qs = $('q-start'); qs.parentNode.insertBefore(c, qs.nextSibling);
    [0, 1].forEach(function (i) {
      // roll pairs: each box rolls on golden-ratio steps through the pool, the right box skips the left pick
      var roll = function () {
        var a = L.ans[L.i], n = LPOOL.length, st = Math.max(1, Math.round(n / PHI)), k = 0;
        for (var j = 0; j < n; j++) if (LPOOL[j].t === a.opts[i]) k = j;
        for (var g = 0; g < n; g++) { k = (k + st) % n; if (a.opts.indexOf(LPOOL[k].t) < 0) break; }
        a.opts[i] = LPOOL[k].t; a.pick = null; lsave(); lrender();
        var t = $('ol-t' + i); t.classList.remove('swap'); void t.offsetWidth; t.classList.add('swap');
      };
      $('ol-t' + i).onclick = roll; c.querySelector('.roll[data-i="' + i + '"]').onclick = roll;
    });
    var lock = function () { L.ans[L.i].pick = 'pair'; lsave(); lrender(); setTimeout(ladvance, (window.LoadTiers && LoadTiers.ms) ? LoadTiers.ms(reduce ? -4 : -1.5) : 520); };
    $('ol-lock').onclick = lock;
    c.addEventListener('keydown', function (e) { if (e.key === 'Enter' && !(e.target && e.target.closest && e.target.closest('#ol-back, #ol-skip, #ol-lock'))) { e.preventDefault(); lock(); } });
    $('ol-back').onclick = function () { if (L.i > 0) { L.i--; lsave(); lrender(); } else lclose(); };
    $('ol-skip').onclick = ladvance;
    return c;
  }
  var lfind = function (t) { for (var i = 0; i < LPOOL.length; i++) if (LPOOL[i].t === t) return LPOOL[i]; return T(t, '✨'); };
  function lrender() {
    var a = L.ans[L.i];
    $('ol-dots').innerHTML = LQ.map(function (x, i) { return '<i class="' + (i < L.i ? 'done' : i === L.i ? 'now' : '') + '"></i>'; }).join('');
    $('ol-count').textContent = 'Question ' + (L.i + 1) + ' of ' + LQ.length;
    $('ol-text').textContent = L.i ? 'Next: more of which one?' : 'What should your page help you do more of?';
    a.opts.forEach(function (t, i) { var o = lfind(t), b = $('ol-t' + i); b.innerHTML = '<span class="emo" aria-hidden="true"></span><span class="txt"></span>';
      b.querySelector('.emo').textContent = o.e; b.querySelector('.txt').textContent = o.t;
      b.classList.toggle('picked', a.pick === 'pair'); b.setAttribute('aria-pressed', String(a.pick === 'pair')); });
    $('ol-back').disabled = L.i === 0;   // Back on every screen after the first
  }
  function lline(a) { return a.pick == null ? 'skipped (' + a.opts.join(' / ') + ')' : a.pick === 'pair' ? 'More ' + a.opts[0] + ', less ' + a.opts[1] : 'More ' + a.opts[a.pick] + ', less ' + a.opts[1 - a.pick]; }
  async function ladvance() {
    if (L.i < LQ.length - 1) { L.i++; lsave(); lrender(); return; }
    var head = '[Answers · What I want to learn' + (L.sent ? ' · updated' : '') + ' · propose-only]', lines = L.ans.map(function (a, i) { return (i + 1) + '. ' + lline(a); });
    var st = $('ol-stat'); st.className = 'sendstat'; st.textContent = 'Sending your picks to ' + BI.host() + '…';
    var r = await BI.send(head + '\n' + lines.join('\n'), { kind: 'answers', part: 'learn' });
    L.sent = Date.now(); L.i = 0; lsave();
    st.className = 'sendstat ' + (r === 'failed' ? 'bad' : 'ok'); st.textContent = r === 'failed' ? 'Couldn’t send yet (no connection?). It’s saved in the chat.' : '✓ Sent to ' + BI.host() + ' (encrypted). Nothing changes until ' + BI.host() + ' says yes.';
    setTimeout(lclose, sec(1) * 1000);
  }
  async function learnOpen() {
    if (!done()) return start();
    if (!L) await lload(); lcard();
    ['q-start', 'q-quiz', 'q-break', 'q-done', 'pz'].forEach(function (id) { var e = $(id); if (e) e.hidden = true; });
    $('ob-learn').hidden = false; $('ol-stat').textContent = ''; lrender(); window.scrollTo(0, 0);
    if (window.Adapt) Adapt.note('learn', 'open');
  }
  function lclose() { var c = $('ob-learn'); if (c) c.hidden = true; $('q-start').hidden = false; window.scrollTo(0, 0); }

  function css() { if ($('ob-css')) return; var s = document.createElement('style'); s.id = 'ob-css';
    s.textContent = '.ob-gate{border:1px solid var(--ac);border-radius:var(--r);padding:14px;margin:12px 0;background:var(--sf2)}.ob-gate h2{margin:4px 0 6px}.ob-gate .btnrow{margin-top:8px}' +
      '#q-start .btn[aria-disabled=true]{opacity:.5;cursor:not-allowed}';
    document.head.appendChild(s); }
  // the orb's own help text for each part comes from the same naming content (one source), so any drop on it can say it
  function parts() { if (!window.QuizOrb || !QuizOrb.part) return; ITEMS.forEach(function (it) { if (it.id.indexOf('p-') !== 0) QuizOrb.part(it.sel, it.x); }); }
  function open() { if (!window.BI || !BI.ready()) return; css(); N = nload(); parts(); gate(); }
  document.addEventListener('bi:open', open);
  document.addEventListener('bi:lock', function () { running = false; L = null; var c = $('ob-learn'); if (c) c.remove(); var g = $('ob-gate'); if (g) g.remove(); document.documentElement.classList.remove('ob-naming'); });
  window.Onboard = { done: done, start: start, learn: learnOpen, items: function () { return ITEMS.map(function (i) { return i.id; }); }, running: function () { return running; } };
  open();
})();
