/* Private Build It page: chat + dashboard in one page, one password gate.
   Same mechanism as the Simmie chat page (simmie-chat js/app.js): config.enc.json (salt + AES-GCM config) opens with the
   password-derived key (PBKDF2-HMAC-SHA256 250k); messages go encrypted to this page's OWN ntfy relay topic;
   replies come from this folder's OWN encrypted log.enc.json + live encrypted pings. Separate storage keys, topic,
   log and box state (chat.py), so nothing of the other chat is visible or mixed.
   The person's name, the page title and every answer exist only inside the encrypted config / log and on the page
   after the password; nothing personal is in this public file.
   Answers to the questions are delivered the same way as chat messages: one encrypted message per finished part
   (kind:'answers'), so they reach the box and land in the encrypted log. Progress is kept encrypted in localStorage. */
(function () {
  'use strict';
  const C = window.SimmieCrypto;
  const SKEY = 'buildit-key', PKEY = 'buildit-pending', QKEY = 'buildit-progress';   // own keys (own origin too)
  const $ = (id) => document.getElementById(id);
  const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const Tiers = window.LoadTiers || { add: (n, f) => setTimeout(f, 0), prefetch: () => {} };
  const showGate = (n) => ['loading', 'notready', 'login'].forEach((s) => { $('screen-' + s).hidden = s !== n; });

  let meta = null, key = null, cfg = null;
  const msgs = new Map();
  let pollTimer = null, lastSentAt = 0, es = null, lastLogText = '', lastLiveId = '', typingUntil = 0, esRetry = null, chatStarted = false;

  // ================= gate (mirrors js/app.js) =================
  async function boot() {
    try {
      const r = await fetch('config.enc.json?t=' + Date.now(), { cache: 'no-store' });
      if (!r.ok) throw 0;
      meta = await r.json();
      if (!meta || !meta.kdf || !meta.config) throw 0;
    } catch (e) { showGate('notready'); return; }
    const saved = sessionStorage.getItem(SKEY);
    if (saved) {
      try { key = await C.importKey(saved); cfg = await C.decryptJSON(key, meta.config); return openApp(); }
      catch (e) { sessionStorage.removeItem(SKEY); key = null; }
    }
    showGate('login'); $('pw').focus();
  }
  $('pw-toggle').addEventListener('click', () => {
    const i = $('pw'), on = i.type === 'password'; i.type = on ? 'text' : 'password';
    $('pw-toggle').textContent = on ? 'Hide' : 'Show'; $('pw-toggle').setAttribute('aria-label', on ? 'Hide password' : 'Show password');
  });
  $('login-form').addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const btn = $('login-btn'), err = $('login-error'); err.hidden = true; btn.disabled = true; btn.textContent = 'Checking…';
    try {
      const k = await C.deriveKey($('pw').value.trim(), meta.kdf.salt, meta.kdf.iter);
      cfg = await C.decryptJSON(k, meta.config);
      key = k; sessionStorage.setItem(SKEY, await C.exportKey(k)); $('pw').value = '';
      openApp();
    } catch (e) { err.textContent = "That password didn't work. Try again?"; err.hidden = false; }
    finally { btn.disabled = false; btn.textContent = 'Open'; }
  });
  $('lock-btn').addEventListener('click', () => lockOut(''));
  function lockOut(msg) {
    sessionStorage.removeItem(SKEY); key = null; cfg = null; msgs.clear(); $('log').innerHTML = ''; lastLogText = '';
    clearTimeout(pollTimer); stopLive(); chatStarted = false;
    document.title = 'Private page'; $('h-title').textContent = 'My page';
    $('screen-app').hidden = true; $('gate').hidden = false; document.dispatchEvent(new CustomEvent('bi:lock'));
    const err = $('login-error'); if (msg) { err.textContent = msg; err.hidden = false; } else err.hidden = true;
    showGate('login'); $('pw').focus();
  }

  // ================= app shell =================
  const NAME = () => (cfg && cfg.name) || 'there';
  const HOST = () => (cfg && cfg.host) || 'Danny';
  const BOT = () => (cfg && cfg.bot) || 'your bot';   // ONE setting: `bot` in the encrypted config (renamable by the user)
  async function openApp() {
    $('gate').hidden = true; $('screen-app').hidden = false;
    const title = cfg.title || 'My chat page';
    document.title = title; $('h-title').textContent = title;
    document.querySelectorAll('[data-host]').forEach((e) => { e.textContent = HOST(); });
    $('f-credit').textContent = 'Made by ' + HOST() + ', with help from Simmie';
    $('q-hello').textContent = 'Hey ' + NAME() + '!';
    $('q-lead').textContent = "Let's build your page together. Everything on your screen right now (your bot, the orbiting emojis, the light, the wave, the DJ and the colours) is a piece you can keep or change. Nothing here is public: only " + HOST() + ' sees your answers, and nothing changes until ' + HOST() + ' says yes.';
    setBotName();
    await loadProgress(); quizStart();
    await loadPending();
    // tier 1: the piece-by-piece questions (most important after unlock); tier 2 (idle, PHI^-2 apart, usage-ordered):
    // chat poll + live line, orbit emojis, the ratio pump; tier 3: DJ engine + zoom mark prefetch. DJ itself loads on tap.
    // the learner model and the quiz orb load with the questions (tier 1), in order: model, orb, then the questions
    if (!window.Pieces) { ['js/learner.js?v=2', 'js/quiz-orb.js?v=2', 'js/pathways.js?v=2', 'js/pieces.js?v=4'].forEach((u) => { const sp = document.createElement('script'); sp.src = u; sp.async = false; document.head.appendChild(sp); }); }
    else document.dispatchEvent(new CustomEvent('bi:open'));
    Tiers.add(2, startChat, 'chat', false);
    if (Tiers.script) { Tiers.script('js/orbit.js?v=1', 2, null, 'orbit'); Tiers.script('js/ratio-pump.js?v=1', 2, { 'data-site': 'buildit', 'data-freq': '0.75' }, 'pump', false); }
    Tiers.add(3, () => { const l = document.createElement('link'); l.rel = 'prefetch'; l.href = 'js/autodj.js?v=1'; document.head.appendChild(l); }, 'prefetch autodj');
    Tiers.prefetch('img/mark-head.svg?v=1');   // tier 3: an extra-questions preview
  }
  function setBotName() { document.querySelectorAll('.botav').forEach((im) => { if (im.id === 'h-av') { im.alt = BOT(); im.title = BOT(); } }); }
  // ---- API for js/pieces.js (same key, same relay, same encrypted log; nothing new leaves the page) ----
  window.BI = {
    ready: () => !!key, host: () => HOST(), name: () => NAME(), bot: () => BOT(),
    enc: (o) => C.encryptJSON(key, o), dec: (o) => C.decryptJSON(key, o),
    async send(text, extra) { const m = { id: newId(), ts: Date.now(), from: 'user', text, ...(extra || {}) }; addMsg(m, 'pending'); render(); await deliver(msgs.get(m.id)); return msgs.get(m.id).state; },
    state: (id) => (msgs.get(id) || {}).state
  };
  // ---- DJ (sound): the engine (js/autodj.js) loads only when the DJ panel is first opened ----
  let djLoaded = false;
  $('dj-pill').onclick = () => {
    const pop = $('dj-pop'), open = pop.hidden; pop.hidden = !open; $('dj-pill').setAttribute('aria-expanded', String(open));
    if (open && window.Adapt) Adapt.note('dj', 'open');
    if (open && !djLoaded) { djLoaded = true; const sc = document.createElement('script'); sc.src = 'js/autodj.js?v=1'; sc.async = true; document.head.appendChild(sc); }
  };
  new MutationObserver(() => $('dj-pill').classList.toggle('on', $('dj-play').getAttribute('aria-pressed') === 'true')).observe($('dj-play'), { attributes: true, attributeFilter: ['aria-pressed'] });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !$('dj-pop').hidden) { $('dj-pop').hidden = true; $('dj-pill').setAttribute('aria-expanded', 'false'); $('dj-pill').focus(); } });
  // ---- Lite: the lighter, calmer version of the page (on-device preference) ----
  function liteSync() { const on = !!(window.Adapt && Adapt.lite()); $('lite-btn').setAttribute('aria-pressed', String(on)); }
  $('lite-btn').onclick = () => { if (!window.Adapt) return; Adapt.setLite(!Adapt.lite()); liteSync(); if (!Adapt.lite() && Tiers.script && !window.Orbit) Tiers.script('js/orbit.js?v=1', 2, null, 'orbit'); };
  liteSync();
  // ---- status light = message-status layer: idle / new / from Danny / urgent (a question waiting) ----
  function ledState() {
    const list = [...msgs.values()], led = $('f-led'); if (!led) return;
    const waitingQ = list.some((m) => m.kind === 'question' && answerFor(m) === null);
    const unseen = !$('chat-new').hidden, lastNew = list.filter((m) => m.from !== 'user').sort((a, b) => a.ts - b.ts).pop();
    led.dataset.st = waitingQ ? 'urgent' : unseen && lastNew && lastNew.from === 'dad' ? 'dad' : unseen ? 'new' : '';
  }
  function startChat() { if (chatStarted || !key) return; chatStarted = true; render(); pollLog(); startLive(); }
  function tab(which) {
    const q = which === 'q';
    $('view-q').hidden = !q; $('view-c').hidden = q;
    $('tab-q').classList.toggle('on', q); $('tab-c').classList.toggle('on', !q);
    $('tab-q').setAttribute('aria-selected', String(q)); $('tab-c').setAttribute('aria-selected', String(!q));
    if (!q) { $('chat-new').hidden = true; startChat(); render(); if (window.Adapt) Adapt.note('chat', 'open'); }
    window.scrollTo(0, 0);
  }
  $('tab-q').onclick = () => tab('q'); $('tab-c').onclick = () => tab('c');
  // ---- rename the bot (the user's own call, an exception to propose-only): sent as an encrypted message, the box applies it ----
  $('ren-btn').onclick = () => { const f = $('ren-form'), open = f.hidden; f.hidden = !open; $('ren-btn').setAttribute('aria-expanded', String(open));
    if (open) { $('ren-in').value = BOT(); $('ren-msg').textContent = ''; $('ren-in').focus(); $('ren-in').select(); } };
  $('ren-form').addEventListener('submit', async (ev) => {
    ev.preventDefault(); const n = $('ren-in').value.replace(/[\u0000-\u001f\u007f]/g, '').replace(/\s+/g, ' ').trim().slice(0, 40);
    if (!n || !key) { $('ren-msg').textContent = 'Type a name first.'; return; }
    if (n === BOT()) { $('ren-form').hidden = true; return; }
    const m = { id: newId(), ts: Date.now(), from: 'user', text: '[Rename bot] ' + n, kind: 'rename-bot', name: n };
    cfg.bot = n; addMsg(m, 'pending'); $('ren-msg').textContent = 'Saved. Your bot is now called ' + n + '.';
    setTimeout(() => { $('ren-form').hidden = true; $('ren-btn').setAttribute('aria-expanded', 'false'); }, 1400);
    render(); await deliver(msgs.get(m.id));
  });
  $('q-tochat').onclick = () => tab('c');
  document.addEventListener('visibilitychange', () => { document.body.classList.toggle('paused', document.hidden); });
  function online() { const on = navigator.onLine; $('f-led').classList.toggle('off', !on); $('f-stat').textContent = on ? 'Private · encrypted' : 'Offline · answers wait'; }
  addEventListener('online', online); addEventListener('offline', online); online();

  // ================= questions =================
  const PHIR = 1.6180339887;
  const O = (t, e) => ({ t, e });
  const P = (n, b, s, a, a2, tx) => ({ t: n, pal: { b, s, a, a2, tx } });
  // Part 1: context, to get a feel for the theme. yn = Yes / No; tot = this or that (+ Roll from POOL)
  const PART1 = [
    { id: 'build', type: 'tot', q: 'Which way should your page lean?', opts: [O('Building and making things', '🛠️'), O('Exploring and finding things out', '🧭')] },
    { id: 'spaceocean', type: 'tot', q: 'Which sounds cooler?', opts: [O('Space missions', '🚀'), O('The deep ocean', '🌊')] },
    { id: 'specops', type: 'tot', q: 'Pick a style to go with', opts: [O('Special ops: briefings, night vision, codes', '🕶️'), O('Explorer: maps, logbooks, discoveries', '🗺️')] },
    { id: 'gaming', type: 'tot', q: 'Which way for the fun stuff?', opts: [O('Gaming', '🎮'), O('Making and inventing', '💡')] },
    { id: 'sportmusic', type: 'tot', q: 'Which one is more you?', opts: [O('Sport', '⚽'), O('Music', '🎸')] },
    { id: 'robots', type: 'tot', q: 'Which way for the tech side?', opts: [O('Robots and machines', '🤖'), O('Apps and websites', '🌐')] },
    { id: 'naturecity', type: 'tot', q: 'Which would you rather explore?', opts: [O('Nature and animals', '🦎'), O('Cities and tech', '🏙️')] },
    { id: 'vibe', type: 'tot', q: 'What vibe do you want for your page?', opts: [O('Calm and clean', '🧘'), O('Loud and full of action', '💥')] },
    { id: 'look', type: 'tot', q: 'Which style looks better?', opts: [O('Retro pixel arcade', '👾'), O('Sleek and futuristic', '🛸')] },
    { id: 'dark', type: 'tot', q: 'Which way for the light?', opts: [O('Dark, like night mode', '🌑'), O('Bright, like daytime', '☀️')] },
    { id: 'moving', type: 'tot', q: 'How busy should it look?', opts: [O('Lots moving on the screen', '🌀'), O('Calm, a few things moving', '🍃')] },
    { id: 'content', type: 'tot', q: 'What should your page have more of?', opts: [O('Facts and how things work', '🔬'), O('Games and challenges', '🏆')] },
    { id: 'helper', type: 'tot', q: 'What should your bot help with most?', opts: [O('Planning builds and projects', '🧰'), O('Learning new things', '📚')] }
  ];
  const POOL = [O('Dinosaurs', '🦖'), O('Cars and racing', '🏎️'), O('Planes and flying', '✈️'), O('Building blocks', '🧱'), O('Superheroes', '🦸'),
    O('Magic and wizards', '🪄'), O('Ancient history', '🏛️'), O('Coding and computers', '💻'), O('Drones', '🚁'), O('Martial arts', '🥋'),
    O('Cooking', '🍳'), O('Volcanoes', '🌋'), O('Animals', '🐾'), O('Inventions', '💡'), O('Space', '🪐'), O('Knights and castles', '🏰'),
    O('Skateboarding', '🛹'), O('Football', '🏉'), O('Science experiments', '🧪'), O('Art and drawing', '🎨'), O('Trains', '🚂'), O('Sharks', '🦈')];
  // Part 2: colour palettes, two side by side + Roll (the questionnaire set-up). bg, surface, accent, accent 2, text
  const PALS = [
    P('Navy', '#0B1A33', '#102447', '#9FB8E0', '#1B3A6B', '#FFFFFF'), P('Night Ops', '#0B0F0A', '#1A2418', '#6B8E23', '#C2B280', '#E8EDE3'), P('Stealth', '#050505', '#161616', '#E10600', '#7A7A7A', '#F2F2F2'),
    P('Deep Space', '#05060F', '#141A33', '#7B5CFF', '#00D1FF', '#EDEBFF'), P('Ocean Depths', '#021B26', '#06384A', '#00B3B3', '#7FE7DC', '#E6FBFF'),
    P('Volcano', '#140806', '#2B120C', '#FF5A1F', '#FFC23D', '#FFF1E6'), P('Jungle', '#07140C', '#123020', '#2ECC71', '#C7F464', '#ECFFF2'),
    P('Arctic', '#0B1620', '#16283A', '#9ED8F5', '#FFFFFF', '#EAF6FF'), P('Neon Arcade', '#0A0014', '#1E0638', '#A64DFF', '#2BFFF5', '#F3EDFF'),
    P('Desert Recon', '#1A140C', '#33281A', '#D9A25F', '#8FB3A3', '#FFF6E8'), P('Gold and Carbon', '#0C0C0C', '#1F1F1F', '#E8B931', '#9C9C9C', '#FFF8E1'),
    P('Racing', '#0D0D12', '#1C1C26', '#FF3B30', '#FFD60A', '#FFFFFF'), P('Galaxy', '#0E0820', '#22164A', '#B388FF', '#C9B8FF', '#F3EDFF'),
    P('Electric Blue', '#020814', '#0A1E3C', '#1E90FF', '#00FFC6', '#E8F4FF'), P('Forest Ranger', '#0F1A12', '#20352A', '#8DB580', '#E0C068', '#F0F5EC'),
    P('Workshop', '#111417', '#22282E', '#FF8C1A', '#8FA3B5', '#EEF2F5'), P('Cyber Lime', '#0A0D05', '#1B2410', '#B6FF00', '#00E5FF', '#F4FFE0'),
    P('Sunset', '#1A0B14', '#3A1730', '#FF7A59', '#FFC15E', '#FFEFE6'), P('Black and White', '#000000', '#1A1A1A', '#FFFFFF', '#888888', '#FFFFFF')];
  const PART2 = [[0, 3], [4, 5], [8, 10], [13, 15], [6, 11]].map((pr, i) => ({ id: 'pal' + (i + 1), type: 'pal', q: ['Which colours feel more like you?', 'Which one would you pick for your page?', 'Which palette looks better?', 'Pick your favourite of these two', 'Last colour round: which one?'][i], opts: [PALS[pr[0]], PALS[pr[1]]] }));
  // Part 3: pieces of Danny's dashboard, this way or that way each (two directions + Roll), with a tiny CSS preview (no extra downloads except the 4 KB mark)
  const rain = '<div class="pv-rain">' + ['ｱ1ｳ0ｶ7ﾂ2', '7ｷﾂ2ﾅ0ﾊ', 'ﾊ0ﾏ1ｼ9ﾗ', '9ﾗｴ3ﾜﾀ1', 'ﾀ1ﾔ0ﾆ4ﾎ', '4ﾎｹ1ﾓﾁ0', 'ﾁ0ﾐ8ﾙｻ1', 'ｻ1ﾈ0ﾑｱ1', 'ﾜ3ｷ0ﾅ7ｼ'].map((s, i) => '<span style="animation-delay:-' + (i * 0.618 * 4.236 % 4.236).toFixed(2) + 's">' + s.split('').join('\n') + '</span>').join('') + '</div>';
  const stars = '<div class="pv-space">' + [[12, 20], [30, 70], [48, 30], [66, 60], [80, 18], [90, 75], [22, 50], [58, 12]].map((p, i) => '<i style="left:' + p[0] + '%;top:' + p[1] + '%;animation-delay:-' + (i * 0.618 * 4.236 % 4.236).toFixed(2) + 's"></i>').join('') + '</div>';
  const PART3 = [
    { id: 'mark', w: 'A simple still badge in the header', q: 'A logo mark in the header', d: 'A small animated logo at the top, like the orbiting equals sign on {host}’s page.', pv: () => '<img src="img/mark-head.svg?v=1" alt="" width="76" height="76" decoding="async">' },
    { id: 'zoom', w: 'Hold the logo to see it spin', q: 'Tap the logo to make it big', d: 'Tap your logo and it opens up large, so you can look at the details.', pv: () => '<span class="pv-zoom"></span>' },
    { id: 'orbit', w: 'Satellites zipping across now and then', q: 'Things orbiting around the header', d: 'Little planets and bodies circling slowly around the top of the page.', pv: () => '<span class="pv-orbit"><i></i></span>' },
    { id: 'waves', w: 'A soft glow pulsing from the logo', q: 'Energy waves from the logo', d: 'Rings that ripple out from the logo, bounce off an edge and fade.', pv: () => '<span class="pv-waves"><i></i><i></i><i></i></span>' },
    { id: 'rain', w: 'Falling stars in the background', q: 'Matrix code rain', d: 'Green computer code falling down the background, like the movie.', pv: () => rain },
    { id: 'tty', w: 'A mission log you open with a button', q: 'A mission log terminal in the footer', d: 'A little terminal at the bottom where Simmie types status lines.', pv: () => '<div class="pv-tty"><b>simmie&gt;</b> <span>all systems nominal_</span></div>' },
    { id: 'bars', w: 'Live dials, like a car dashboard', q: 'Live bar graphs', d: 'Three small bars showing real things, like activity, progress and connection speed.', pv: () => '<span class="pv-bars"><i></i><i></i><i></i></span>' },
    { id: 'footline', w: 'One fact of the day at the top', q: 'A cycling line at the bottom', d: 'Quotes, “on this day”, a word of the day and science facts, taking turns.', pv: () => '<div class="pv-line"><span>“Make it simple, but significant.” · On this day: first flight, 1903 · Word: ingenious · Fact: light takes 8 min from the Sun</span></div>' },
    { id: 'ticker', w: 'A fact that pops up when you tap your bot', q: 'A fun-fact ticker in the header', d: 'Facts scrolling past along the top of the page.', pv: () => '<div class="pv-line"><span>fact = "Octopuses have three hearts" ; fact = "A day on Venus is longer than its year" ;</span></div>' },
    { id: 'weather', w: 'Page colours that change with the weather', q: 'A weather chip', d: 'Today’s weather in the header, with little faces that react to it.', pv: () => '<span class="pv-wx"><b>☀️</b> 24° <b>😎</b></span>' },
    { id: 'critters', w: 'Robots marching along the footer', q: 'Critters and a tide line in the footer', d: 'A strip of animals drifting by, over a gentle wave.', pv: () => '<div class="pv-crit"><span>🦊 🐨 🦘 🐙 🦎 🐞 🐸 🦔 🐌 🦉</span></div><span class="pv-tide"></span>' },
    { id: 'lanes', w: 'Paper planes gliding across now and then', q: 'Animals and rockets crossing the page', d: 'Every so often something trots, hops or flies across the header or footer.', pv: () => '<span class="pv-lane">🐎</span>' },
    { id: 'lights', w: 'A progress bar that fills up', q: 'Status lights', d: 'Small lights that show what’s going on, like your progress and whether you’re online.', pv: () => '<span class="pv-leds"><span><i></i>STEP</span><span><i></i>DONE</span><span><i></i>LINK</span></span>' },
    { id: 'dj', w: 'Sound effects when you tap things', q: 'A music DJ button', d: 'Music made right in the page, only when you tap play.', pv: () => '<span class="pv-dj">' + '<i></i>'.repeat(9) + '</span>' },
    { id: 'space', w: 'A slow ocean scene behind everything', q: 'A space video in the background', d: 'A slow, dark space scene moving behind everything.', pv: () => stars },
    { id: 'themes', w: 'Stickers you collect as you answer', q: 'Backgrounds that change with your answers', d: 'Floating pictures behind the questions that match what you pick.', pv: () => '<div class="pv-float">' + ['🚀', '⚽', '🎸', '🦖', '🧱'].map((e, i) => '<span style="left:' + (10 + i * 19) + '%;top:' + (30 + (i % 2) * 22) + '%;animation-delay:-' + (i * 0.618 * 6.854 % 6.854).toFixed(2) + 's">' + e + '</span>').join('') + '</div>' },
    { id: 'quiz', w: 'Mini challenges that unlock new parts', q: 'More questions like these later', d: 'Polls and this-or-that questions on your page from time to time.', pv: () => '<span class="pv-quiz"><span>This</span><span>That</span></span>' }
  ].map((x) => ({ ...x, type: 'way', opts: [O(x.q, '✨'), O(x.w, '🔀')] }));
  const WAYS = PART3.map((x) => x.opts[1]).concat(PART3.map((x) => x.opts[0]));   // Roll draws other directions from these
  const PARTS = [{ n: 1, name: 'About you', qs: PART1 }, { n: 2, name: 'Colours', qs: PART2 }, { n: 3, name: 'Pieces of ' + 'the dashboard', qs: PART3 }];
  const STEPS = []; PARTS.forEach((p) => p.qs.forEach((q, i) => STEPS.push({ part: p.n, idx: i, q })));

  // progress: {qi, ans:{id:{pick, opts?, notes:[]}}, sent:{1:ts,...}, started}
  let S = null;
  function fresh() { return { qi: 0, ans: {}, sent: {}, started: false, v: 1 }; }
  async function loadProgress() {
    S = fresh();
    try { const raw = localStorage.getItem(QKEY); if (raw) { const s = await C.decryptJSON(key, JSON.parse(raw)); if (s && s.v === 1) S = s; } } catch (e) { localStorage.removeItem(QKEY); }
  }
  async function saveProgress() { try { localStorage.setItem(QKEY, JSON.stringify(await C.encryptJSON(key, S))); } catch (e) {} }
  const A = (q) => { const a = S.ans[q.id] = S.ans[q.id] || { pick: null, notes: [], opts: q.opts ? q.opts.map((o) => o.t) : null }; if (q.opts && !a.opts) { a.opts = q.opts.map((o) => o.t); a.pick = null; } return a; };   // older yes/no saves get the two directions
  function optsOf(q) {
    if (q.type === 'yn') return [O('Yes', '👍'), O('No', '👎')];
    const a = A(q);
    const all = q.type === 'pal' ? PALS : q.type === 'way' ? WAYS : POOL.concat(q.opts);
    return a.opts.map((t, i) => all.find((o) => o.t === t) || q.opts[i]);
  }
  const panels = ['q-start', 'q-quiz', 'q-break', 'q-done'];
  function panel(id) { panels.forEach((p) => { $(p).hidden = p !== id; }); }
  function quizStart() {
    if (S.started && S.qi > 0 && S.qi < STEPS.length) { $('q-resume').hidden = false; $('q-resume').textContent = 'You were up to question ' + (S.qi + 1) + ' of ' + STEPS.length + '. Start picks up from there.'; }
    else $('q-resume').hidden = true;
    if (S.started && S.qi >= STEPS.length) return done();
    panel('q-start');
  }
  $('q-go').onclick = () => { $('pz').hidden = true; S.started = true; if (S.qi >= STEPS.length) S.qi = 0; saveProgress(); panel('q-quiz'); renderQ(); };
  $('q-again').onclick = () => { S.qi = 0; saveProgress(); panel('q-quiz'); renderQ(); };
  const palHTML = (p) => '<span class="pal" style="--pb:' + p.b + ';--ps:' + p.s + ';--pa:' + p.a + ';--pa2:' + p.a2 + ';--pt:' + p.tx + '"><span class="ph1"><i></i><b></b></span><span class="pbody"><span class="ln1"></span><span class="ln2"></span><span class="pbtn">Go</span></span><span class="sw"><i style="background:' + p.b + '"></i><i style="background:' + p.s + '"></i><i style="background:' + p.a + '"></i><i style="background:' + p.a2 + '"></i><i style="background:' + p.tx + '"></i></span></span>';
  function tileHTML(q, o) { return q.type === 'pal' ? palHTML(o.pal) + '<span class="txt"></span>' : '<span class="emo" aria-hidden="true"></span><span class="txt"></span>'; }
  function renderQ() {
    const st = STEPS[S.qi], q = st.q, a = A(q), part = PARTS[st.part - 1];
    $('q-phase').textContent = 'Extra questions · part ' + st.part + ' of 3 · ' + (st.part === 3 ? 'Pieces of ' + HOST() + '’s dashboard' : part.name);
    $('q-dots').innerHTML = part.qs.map((x, i) => '<i class="' + (i < st.idx ? 'done' : i === st.idx ? 'now' : '') + '"></i>').join('');
    $('q-count').textContent = 'Question ' + (st.idx + 1) + ' of ' + part.qs.length;
    $('q-text').textContent = (q.type === 'yn' && q.e ? q.e + ' ' : '') + (q.type === 'way' ? 'This way or that way?' : q.q);
    const pv = $('q-prev'), ds = $('q-desc');
    if (q.pv) { pv.innerHTML = q.pv(); pv.hidden = false; ds.textContent = q.d.replace('{host}', HOST()); ds.hidden = false; } else { pv.innerHTML = ''; pv.hidden = true; ds.hidden = true; }
    $('q-choices').classList.toggle('yn', q.type === 'yn');
    optsOf(q).forEach((o, i) => {
      const t = $('t' + i); t.innerHTML = tileHTML(q, o);
      const em = t.querySelector('.emo'); if (em) em.textContent = o.e;
      t.querySelector('.txt').textContent = o.t;
      t.classList.toggle('picked', a.pick === 'pair'); t.setAttribute('aria-pressed', String(a.pick === 'pair'));
      t.setAttribute('aria-label', (i ? 'Not really me: ' : 'I love this most: ') + (q.type === 'pal' ? 'palette ' : '') + o.t + '. Tap to roll another.');
    });
    $('q-note').value = ''; $('q-saved').textContent = '';
    $('q-notes').innerHTML = ''; a.notes.forEach((n) => { const li = document.createElement('li'); li.textContent = '✉️ ' + n; $('q-notes').appendChild(li); });
    $('q-back').disabled = S.qi === 0;
  }
  function advance() {
    const st = STEPS[S.qi]; S.qi++;
    const finishedPart = S.qi >= STEPS.length || STEPS[S.qi].part !== st.part;
    saveProgress();
    if (finishedPart) { const p = st.part; sendPart(p); if (S.qi >= STEPS.length) done(); else partBreak(p); }
    else renderQ();
  }
  // ROLL PAIRS (Kids Club standard, Danny 2026-10-25 16:20 AWST): LEFT box = what he loves most, RIGHT box = what he likes
  // least. Each box rolls (tap the box or its Roll) through the options on golden-ratio steps (index += len / PHI, never a
  // short loop); the right box skips the left pick. Lock it in (or Enter) saves the pair and moves on. Back keeps the picks.
  function roll(i) {
    const q = STEPS[S.qi].q, a = A(q); if (q.type === 'yn') return;
    const list = q.type === 'pal' ? PALS : q.type === 'way' ? WAYS : POOL.concat(q.opts.filter((o) => !POOL.some((x) => x.t === o.t)));
    const n = list.length, step = Math.max(1, Math.round(n / PHIR)); let k = list.findIndex((o) => o.t === a.opts[i]); if (k < 0) k = 0;
    for (let g = 0; g < n; g++) { k = (k + step) % n; if (!a.opts.includes(list[k].t)) break; }
    a.opts[i] = list[k].t; a.pick = null; saveProgress(); renderQ();
    const t = $('t' + i); t.classList.remove('swap'); void t.offsetWidth; t.classList.add('swap');
  }
  [0, 1].forEach((i) => { $('t' + i).onclick = () => roll(i); });
  document.querySelectorAll('.roll').forEach((b) => { b.onclick = () => roll(+b.dataset.i); });
  function lockIn() { const q = STEPS[S.qi].q, a = A(q); a.pick = 'pair'; saveProgress(); renderQ(); setTimeout(advance, Tiers.ms ? Tiers.ms(reduce ? -4 : -1.5) : 520); }   // PHI^(-1.5 + step) s, PHI^(-4 + step) s reduced
  $('q-lock').onclick = lockIn;
  document.addEventListener('keydown', (e) => { if (e.key !== 'Enter' || $('q-quiz').hidden || $('view-q').hidden || (e.target && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName))) return; if (e.target && e.target.closest && e.target.closest('#q-back, #q-skip, #q-addnote, #q-lock')) return; e.preventDefault(); lockIn(); });
  $('q-addnote').onclick = () => {
    const v = $('q-note').value.trim(); if (!v) { $('q-saved').textContent = 'Type something first.'; return; }
    A(STEPS[S.qi].q).notes.push(v.slice(0, 400)); saveProgress(); renderQ(); $('q-saved').textContent = 'Added. It goes with your answers.';
  };
  $('q-skip').onclick = () => advance();
  $('q-back').onclick = () => { if (S.qi > 0) { S.qi--; saveProgress(); renderQ(); } };
  function partBreak(p) {
    panel('q-break');
    $('q-break-h').textContent = p === 1 ? 'Nice one! Part 1 done.' : 'Great picks! Part 2 done.';
    $('q-break-p').textContent = p === 1 ? 'Next up: colours. Roll the left box to the palette you love most and the right box to the one that is not really you, then lock it in.' : 'Last part: pieces from ' + HOST() + '’s dashboard. Roll the left box to the way you love most and the right box to the one that is not really you.';
    sendStatus('q-break-s', p);
    window.scrollTo(0, 0);
  }
  $('q-break-go').onclick = () => { panel('q-quiz'); renderQ(); };
  $('q-break-back').onclick = () => { if (S.qi > 0) S.qi--; saveProgress(); panel('q-quiz'); renderQ(); window.scrollTo(0, 0); };   // picks are kept
  $('q-done-back').onclick = () => { S.qi = STEPS.length - 1; saveProgress(); panel('q-quiz'); renderQ(); window.scrollTo(0, 0); };
  function answerLabel(q, a) {
    if (!a || a.pick == null) return 'skipped';
    const o = optsOf(q); if (a.pick === 'pair') return 'love most: ' + o[0].t + ' · like least: ' + o[1].t;
    return q.type === 'yn' ? (a.pick === 0 ? 'Yes' : 'No') : o[a.pick].t + ' (over ' + o[1 - a.pick].t + ')';
  }
  function done() {
    panel('q-done');
    const ol = $('q-sum'); ol.innerHTML = '';
    PARTS.forEach((p) => {
      const h = document.createElement('li'), sub = document.createElement('ol'), ht = document.createElement('p'); ht.className = 'ph'; ht.textContent = 'Part ' + p.n + ' · ' + (p.n === 3 ? 'Pieces' : p.name);
      h.appendChild(ht); h.appendChild(sub); ol.appendChild(h);
      p.qs.forEach((q) => {
        const a = S.ans[q.id], li = document.createElement('li'), b = document.createElement('b'), s = document.createElement('small');
        b.textContent = q.q.replace(/\?$/, '') + ': '; li.appendChild(b); li.appendChild(document.createTextNode(answerLabel(q, a)));
        if (a && a.notes.length) { s.textContent = '✉️ ' + a.notes.join(' · '); li.appendChild(s); }
        sub.appendChild(li);
      });
    });
    sendStatus('q-done-s', 0); window.scrollTo(0, 0);
  }

  // ---- delivering answers: one encrypted message per part (split if long), same relay as chat ----
  function partLines(p) {
    const part = PARTS[p - 1];
    return part.qs.map((q, i) => { const a = S.ans[q.id]; return (i + 1) + '. ' + q.q.replace(/\?$/, '') + ' → ' + answerLabel(q, a) + (a && a.notes.length ? ' | note: ' + a.notes.join(' / ') : ''); });
  }
  async function sendPart(p) {
    const lines = partLines(p), head = '[Answers · Part ' + p + ' · ' + PARTS[p - 1].name + (S.sent[p] ? ' · updated' : '') + ']';
    const chunks = []; let cur = [];
    const bytes = (s) => new TextEncoder().encode(s).length;
    lines.forEach((l) => { if (cur.length && bytes(head + '\n' + cur.concat(l).join('\n')) > 2000) { chunks.push(cur); cur = []; } cur.push(l); });
    if (cur.length) chunks.push(cur);
    const ids = [];
    for (let k = 0; k < chunks.length; k++) {
      const text = head + (chunks.length > 1 ? ' (' + (k + 1) + '/' + chunks.length + ')' : '') + '\n' + chunks[k].join('\n');
      const m = { id: newId(), ts: Date.now(), from: 'user', text, kind: 'answers', part: p };
      ids.push(m.id); addMsg(m, 'pending');
    }
    S.sent[p] = Date.now(); S.sentIds = S.sentIds || {}; S.sentIds[p] = ids; saveProgress();
    for (const id of ids) await deliver(msgs.get(id));
  }
  function partState(p) {
    const ids = (S.sentIds || {})[p] || []; if (!ids.length) return null;
    const st = ids.map((id) => (msgs.get(id) || {}).state || 'logged');
    return st.includes('failed') ? 'failed' : st.includes('pending') ? 'pending' : 'sent';
  }
  function sendStatus(elId, p) {
    const el = $(elId); if (!el) return;
    const ps = p ? [p] : [1, 2, 3], states = ps.map(partState);
    el.className = 'sendstat'; el.innerHTML = '';
    if (states.includes('failed')) {
      el.classList.add('bad'); el.textContent = 'Some answers didn’t send yet (no connection?).';
      const b = document.createElement('button'); b.className = 'btn'; b.type = 'button'; b.textContent = 'Try again';
      b.onclick = async () => { for (const q of ps) for (const id of (S.sentIds || {})[q] || []) { const m = msgs.get(id); if (m && m.state === 'failed') await deliver(m); } };
      el.appendChild(b);
    } else if (states.includes('pending')) el.textContent = 'Sending your answers to ' + HOST() + '…';
    else if (states.some((s) => s)) { el.classList.add('ok'); el.textContent = '✓ Sent to ' + HOST() + ' (encrypted)'; }
  }
  function refreshStatus() { if (!$('q-break').hidden) sendStatus('q-break-s', STEPS[Math.max(0, S.qi - 1)].part); if (!$('q-done').hidden) sendStatus('q-done-s', 0); }

  // ================= chat (mirrors js/app.js, own topic + log) =================
  const newId = () => 'd-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
  async function savePending() {
    const list = [...msgs.values()].filter((m) => m.state === 'pending' || m.state === 'sent' || m.state === 'failed')
      .map(({ id, ts, from, text, state, reply_to, answer, comment, kind, part, name }) => ({ id, ts, from, text, reply_to, answer, comment, kind, part, name, state: state === 'failed' ? 'failed' : 'sent' }));
    try { localStorage.setItem(PKEY, JSON.stringify(await C.encryptJSON(key, list))); } catch (e) {}
  }
  async function loadPending() {
    try { const raw = localStorage.getItem(PKEY); if (!raw) return; (await C.decryptJSON(key, JSON.parse(raw))).forEach((m) => { if (!msgs.has(m.id)) msgs.set(m.id, m); }); }
    catch (e) { localStorage.removeItem(PKEY); }
  }
  function logUrls() {
    const repo = cfg.repo || 'EdgerEquals/buildit', br = cfg.branch || 'main', path = cfg.path ? cfg.path + '/' : '', t = Date.now();
    return [`https://raw.githubusercontent.com/${repo}/${br}/${path}log.enc.json?t=${t}`,
      `https://api.github.com/repos/${repo}/contents/${path}log.enc.json?ref=${br}&t=${t}`, `log.enc.json?t=${t}`];
  }
  async function fetchLog() {
    for (const u of logUrls()) {
      try { const o = { cache: 'no-store' }; if (u.includes('api.github.com')) o.headers = { Accept: 'application/vnd.github.raw+json' };
        const r = await fetch(u, o); if (r.ok) return await r.text(); } catch (e) {}
    }
    return null;
  }
  async function pollLog() {
    clearTimeout(pollTimer); if (!key) return;
    const text = await fetchLog();
    if (text && text !== lastLogText) {
      lastLogText = text;
      try {
        const data = JSON.parse(text); let ok = 0, fresh = 0;
        for (const box of data.entries || []) { try { if (addMsg(await C.decryptJSON(key, box), 'logged')) fresh++; ok++; } catch (e) {} }
        if ((data.entries || []).length && !ok && await passwordChanged()) return;
        await savePending(); render(); refreshStatus(); if (fresh) newBadge();
      } catch (e) {}
    }
    schedulePoll();
  }
  async function passwordChanged() {
    try { const r = await fetch('config.enc.json?t=' + Date.now(), { cache: 'no-store' }); if (!r.ok) return false; const m = await r.json();
      try { await C.decryptJSON(key, m.config); return false; } catch (e) {}
      meta = m; lockOut('The password has been changed. Type the new one to open your page.'); return true; } catch (e) { return false; }
  }
  function schedulePoll() {
    clearTimeout(pollTimer); if (!key || document.hidden) return;
    const since = Date.now() - lastSentAt; pollTimer = setTimeout(pollLog, since < 120000 ? 5000 : since < 600000 ? 15000 : 20000);
  }
  document.addEventListener('visibilitychange', () => { if (!key || !chatStarted) return; if (document.hidden) { clearTimeout(pollTimer); return; } startLive(true); pollLog(); });
  addEventListener('online', () => { if (key && chatStarted) { startLive(true); pollLog(); } });
  function stopLive() { clearTimeout(esRetry); if (es) { es.close(); es = null; } }
  function startLive(force) {
    if (!key || !cfg || !cfg.relay || !window.EventSource) return;
    if (es && !force && es.readyState !== 2) return; if (es && force && es.readyState === 1) return;
    stopLive();
    try {
      es = new EventSource(`${cfg.relay.base}/${cfg.relay.topic}/sse${lastLiveId ? '?since=' + encodeURIComponent(lastLiveId) : ''}`);
      es.onmessage = async (ev) => {
        try {
          const outer = JSON.parse(ev.data); if (outer.event !== 'message') return; if (outer.id) lastLiveId = outer.id;
          const m = await C.decryptJSON(key, JSON.parse(outer.message));
          if (m.type === 'typing') { if (Date.now() - (+m.ts || 0) < 300000) { typingUntil = Date.now() + 180000; render(); } return; }
          if (m.from === 'bot' || m.from === 'dad') { if (addMsg(m, 'logged')) newBadge(); if (m.from === 'bot') typingUntil = 0; render(); }
          else if (msgs.has(m.id) && msgs.get(m.id).state === 'pending') { msgs.get(m.id).state = 'sent'; render(); refreshStatus(); }
        } catch (e) {}
      };
      es.onerror = () => { if (es && es.readyState === 2) { clearTimeout(esRetry); esRetry = setTimeout(() => startLive(true), 3000); } };
    } catch (e) {}
  }
  function newBadge() { if ($('view-c').hidden) $('chat-new').hidden = false; }
  function addMsg(m, state) {
    if (!m || !m.id || typeof m.text !== 'string') return false;
    const cur = msgs.get(m.id); if (cur && cur.state === 'logged') return false;
    const from = m.from === 'bot' || m.from === 'dad' ? m.from : 'user';
    const rec = { id: m.id, ts: +m.ts || Date.now(), from, text: m.text, state };
    if (m.kind === 'answers' && from === 'user') { rec.kind = 'answers'; rec.part = typeof m.part === 'string' ? m.part.slice(0, 40) : (+m.part || 0); }
    if (m.kind === 'rename-bot' && from === 'user' && typeof m.name === 'string') { rec.kind = 'rename-bot'; rec.name = m.name.slice(0, 40); }
    if (from !== 'user' && m.kind === 'question') {
      rec.kind = 'question'; rec.options = Array.isArray(m.options) && m.options.length ? m.options.map(String).filter((o) => o && o !== ASK).slice(0, 2) : ['Yes', 'No'];
      if (rec.options.length < 2) rec.options = ['Yes', 'No'];
    }
    if (from === 'user' && m.reply_to) { rec.reply_to = String(m.reply_to); rec.answer = String(m.answer || ''); if (m.comment) rec.comment = String(m.comment); }
    msgs.set(m.id, rec); setTimeout(ledState, 0); return !cur && from !== 'user';
  }
  const senderName = (from) => (from === 'dad' ? HOST() : BOT());
  const ASK = 'Ask more';
  function answerFor(q) {
    for (const m of msgs.values()) if (m.from === 'user' && m.state !== 'failed' && m.reply_to === q.id) return m.comment ? m.answer + ': ' + m.comment : m.answer;
    return null;
  }
  async function answerQuestion(q, opt, comment) {
    if (answerFor(q) !== null) return;
    const m = { id: newId(), ts: Date.now(), from: 'user', text: '[Answer to ' + senderName(q.from) + ': "' + q.text + '"] ' + (comment ? opt + ': ' + comment : opt), reply_to: q.id, answer: opt };
    if (comment) m.comment = comment;
    addMsg(m, 'pending'); render(); await deliver(msgs.get(m.id));
  }
  async function deliver(rec) {
    if (!rec || !key || !cfg) return; rec.state = 'pending'; render(); refreshStatus();
    try {
      const plain = { id: rec.id, ts: rec.ts, from: 'user', text: rec.text };
      if (rec.kind === 'answers') { plain.kind = 'answers'; plain.part = rec.part; }
      if (rec.kind === 'rename-bot') { plain.kind = 'rename-bot'; plain.name = rec.name; }
      if (rec.reply_to) { plain.reply_to = rec.reply_to; plain.answer = rec.answer; if (rec.comment) plain.comment = rec.comment; }
      const body = JSON.stringify({ v: 1, ...(await C.encryptJSON(key, plain)) });
      if (body.length > 3800) throw new Error('too long');
      const r = await fetch(`${cfg.relay.base}/${cfg.relay.topic}`, { method: 'POST', body, headers: { 'Content-Type': 'text/plain' } });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      rec.state = 'sent'; lastSentAt = Date.now(); rec.err = '';
    } catch (e) { rec.state = 'failed'; rec.err = String(e.message || e) === 'too long' ? 'Too long, try splitting it up.' : "Didn't send."; }
    await savePending(); render(); refreshStatus(); schedulePoll();
  }
  $('send-form').addEventListener('submit', async (ev) => {
    ev.preventDefault(); const t = $('msg'), text = t.value.trim(); if (!text || !key) return;
    t.value = ''; const m = { id: newId(), ts: Date.now(), from: 'user', text: text.slice(0, 1500) };
    addMsg(m, 'pending'); render(); await deliver(msgs.get(m.id));
  });
  $('msg').addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); $('send-form').requestSubmit(); } });

  const fmtTime = (ts) => new Date(ts).toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit' });
  const fmtDay = (ts) => new Date(ts).toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' });
  const URL_RE = /\bhttps?:\/\/[^\s<>"'`]+/gi;
  function linkified(text) {
    const frag = document.createDocumentFragment(), s = String(text); let at = 0, m; URL_RE.lastIndex = 0;
    while ((m = URL_RE.exec(s))) {
      let u = m[0].replace(/[.,!?;:'")\]}]+$/, ''); let href = null; try { const x = new URL(u); if (x.protocol === 'https:' || x.protocol === 'http:') href = x.href; } catch (e) {}
      if (!href) continue;
      if (m.index > at) frag.appendChild(document.createTextNode(s.slice(at, m.index)));
      const a = document.createElement('a'); a.className = 'msg-link'; a.href = href; a.target = '_blank'; a.rel = 'noopener noreferrer'; a.textContent = u; frag.appendChild(a);
      at = m.index + u.length; URL_RE.lastIndex = at;
    }
    if (at < s.length) frag.appendChild(document.createTextNode(s.slice(at)));
    return frag;
  }
  let askOpen = '', askDraft = '';
  function render() {
    const log = $('log'); if (!log || !key) return;
    const list = [...msgs.values()].sort((a, b) => a.ts - b.ts); log.innerHTML = '';
    const rn = list.filter((m) => m.kind === 'rename-bot' && m.state !== 'failed').pop(); if (rn && cfg) cfg.bot = rn.name;
    $('bot-name').textContent = BOT(); setBotName(); ledState();
    if (!list.length) { const e = document.createElement('div'); e.className = 'empty'; e.innerHTML = '<p class="big">Hi! 👋</p><p></p>'; e.lastChild.textContent = 'Type below and press Send. ' + BOT() + ' will reply here.'; log.appendChild(e); }
    let day = '';
    for (const m of list) {
      const d = fmtDay(m.ts); if (d !== day) { day = d; const s = document.createElement('div'); s.className = 'day'; s.textContent = d; log.appendChild(s); }
      const b = document.createElement('div'), mine = m.from === 'user';
      b.className = 'msg ' + (mine ? 'me' : 'them') + (m.from === 'dad' ? ' host' : '') + (m.kind === 'answers' ? ' answers' : '') + (m.state === 'pending' ? ' pending' : '') + (m.state === 'failed' ? ' failed' : '');
      if (!mine) { const w = document.createElement('span'); w.className = 'sender'; w.textContent = senderName(m.from); b.appendChild(w); }
      if (m.kind === 'rename-bot') { b.className = 'msg sys'; b.textContent = '✏️ You renamed your bot to “' + m.name + '”'; log.appendChild(b); continue; }
      if (m.kind === 'answers') {
        const det = document.createElement('details'), sm = document.createElement('summary'), body = document.createElement('div');
        sm.textContent = typeof m.part === 'string' ? '📋 Your answers: ' + m.part : '📋 Your answers, part ' + (m.part || '?'); body.textContent = m.text.replace(/^\[[^\]]*\]\s*/, ''); det.appendChild(sm); det.appendChild(body); b.appendChild(det);
      } else if (m.reply_to) {
        const qm = msgs.get(m.reply_to), qq = document.createElement('span'); qq.className = 'quote'; qq.textContent = 'Answer to ' + (qm ? senderName(qm.from) + ': ' + qm.text : 'a question'); b.appendChild(qq);
        b.appendChild(document.createTextNode(m.comment ? m.answer + ': ' + m.comment : m.answer));
      }
      else b.appendChild(linkified(m.text));
      if (!mine && m.kind === 'question') b.appendChild(qControls(m));
      const meta = document.createElement('span'); meta.className = 'meta';
      meta.textContent = fmtTime(m.ts) + (mine ? (m.state === 'pending' ? ' · sending…' : m.state === 'sent' ? ' · sent ✓' : m.state === 'failed' ? ' · ' + (m.err || "didn't send") : ' · ✓✓') : '');
      if (m.state === 'failed') { const r = document.createElement('button'); r.className = 'retry'; r.type = 'button'; r.textContent = 'Try again'; r.onclick = () => deliver(m); meta.appendChild(r); }
      b.appendChild(meta); log.appendChild(b);
    }
    const lastMine = list.filter((m) => m.from === 'user' && m.state !== 'failed' && m.kind !== 'answers' && m.kind !== 'rename-bot').pop();
    const lastTheirs = list.filter((m) => m.from === 'bot').pop();
    const waiting = lastMine && (!lastTheirs || lastTheirs.ts < lastMine.ts) && Date.now() - lastMine.ts < 1200000;
    const typing = waiting && Date.now() < typingUntil;
    $('typing-text').textContent = typing ? BOT() + ' is typing…' : 'Waiting for ' + BOT() + '…';
    $('typing').hidden = !waiting;
    const box = askOpen && document.querySelector('.askf textarea');
    if (box) { box.focus(); box.setSelectionRange(box.value.length, box.value.length); } else log.scrollTop = log.scrollHeight;
  }
  function qControls(m) {
    const ans = answerFor(m), wrap = document.createElement('div'), row = document.createElement('div'); row.className = 'qbtns'; wrap.appendChild(row);
    const picked = ans === null ? null : (ans.startsWith(ASK) ? ASK : ans);
    m.options.concat([ASK]).forEach((opt) => {
      const btn = document.createElement('button'); btn.type = 'button'; btn.className = picked === opt ? 'picked' : ''; btn.textContent = (picked === opt ? '✓ ' : '') + opt; btn.disabled = ans !== null;
      btn.onclick = () => { if (opt === ASK) { askOpen = askOpen === m.id ? '' : m.id; render(); return; } row.querySelectorAll('button').forEach((x) => { x.disabled = true; }); askOpen = ''; answerQuestion(m, opt); };
      row.appendChild(btn);
    });
    if (ans !== null) { const n = document.createElement('span'); n.className = 'qnote'; n.textContent = 'You answered: ' + ans; wrap.appendChild(n); }
    else if (askOpen === m.id) {
      const f = document.createElement('form'); f.className = 'askf'; const t = document.createElement('textarea'); t.rows = 2; t.maxLength = 1000; t.value = askDraft; t.placeholder = 'Type your question or comment…';
      t.setAttribute('aria-label', 'Your question or comment'); t.oninput = () => { askDraft = t.value; };
      const s = document.createElement('button'); s.type = 'submit'; s.className = 'btn'; s.textContent = 'Send';
      f.onsubmit = (e) => { e.preventDefault(); const v = t.value.trim(); if (!v) return; askOpen = ''; askDraft = ''; answerQuestion(m, ASK, v); };
      f.appendChild(t); f.appendChild(s); wrap.appendChild(f);
    }
    return wrap;
  }
  setInterval(() => { if (key && !askOpen && !$('view-c').hidden) render(); }, 30000);

  boot();
})();
