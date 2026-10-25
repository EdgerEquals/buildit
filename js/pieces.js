/* "Your page, piece by piece": for every piece already on screen, a card with the piece live, its parts in plain words
   and two directions for each one ("this way or that way?", js/pathways.js), then (where there is one) a short Arduino challenge, answered as "here's the
   term for that" (never marked wrong). Name-this questions go through the quiz orb (js/quiz-orb.js) with 2 / 3 / 5 / 10
   options picked by the on-device learner model (js/learner.js, docs/learning-model.md).
   PHYSICS STAYS IN THE BACKGROUND: the page still runs on the phi ladder (P(), per(), ratio pump, load tiers), but no
   physics words, phi expressions, Hz or % are shown. The real numbers ride along as each part's `d` and go only to the
   page owner inside the encrypted answers.
   Each finished piece goes encrypted through the page's own send path (window.BI.send, kind:'answers') as a
   PROPOSE-ONLY request: nothing picked here changes the page; it all waits for Danny's yes. Progress is kept encrypted
   in localStorage ('buildit-pieces'). Kids Club gate: the Start button stays locked until the naming step
   (js/onboard.js) is done. Nothing personal in this file. */
(function () {
  'use strict';
  if (window.Pieces) return;
  var PHI = 1.6180339887, QK = 'buildit-pieces', QREV = 3;
  var OWN = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--own-step')); if (!isFinite(OWN)) OWN = 0.25;
  var $ = function (id) { return document.getElementById(id); };
  var P = function (n) { return Math.pow(PHI, n + OWN); };
  var f2 = function (x) { return x >= 10 ? x.toFixed(1) : x.toFixed(2); };
  function per(n) { var t = P(n); return 'every ' + f2(t) + ' s (φ^' + (n + OWN) + ') · ' + (1 / t).toFixed(t > 10 ? 3 : 2) + ' Hz'; }
  var SPEED = ['Keep', 'Faster', 'Slower'], SIZE = ['Keep', 'Bigger', 'Smaller'], DIR = ['Keep', 'Other way'];
  var NAVY = ['#0B1A33', '#0B1F4D', '#102447', '#1B3A6B', '#1E3F8A', '#24467F'];
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function orbitOf(i) { var o = window.Orbit && Orbit.SET[i]; return o || { e: ['🚀', '⭐', '🌍'][i], travelN: [7, 7.5, 8][i] + OWN, dir: i % 2 ? 'anticlockwise' : 'clockwise' }; }

  // ---------- the pieces (all on screen now) ----------
  // Year 7 wording: short sentences, everyday words. Every hidden number (d) is read from the
  // same phi ladder the page runs on. "ar" = how you would build that part on an Arduino (values worked out from the same numbers).
  var ms = function (n) { return Math.round(P(n) * 1000); };
  var LOW = Math.round(255 / (PHI * PHI));   // 38.2% brightness as an analogWrite value
  function PIECES() {
    var o0 = orbitOf(0), o1 = orbitOf(1), o2 = orbitOf(2);
    // v = what the page shows (plain words only); d = the real numbers, sent to the page owner with the answers, never shown
    return [
      { id: 'bot', name: 'Your bot', icon: '🤖', demo: function () { return '<img src="img/bot-avatar.svg?v=2" width="88" height="88" alt="">'; },
        lead: 'The shiny navy ball at the top, in the chat and at the bottom. It breathes, blinks, wobbles, shines and hops. Each move has its own beat.',
        params: [
          { id: 'colour', l: 'Colour', v: 'navy, with white eyes', d: '#0B1F4D', k: 'colour', h: 'The body colour. The eyes stay white.' },
          { id: 'breathe', l: 'Breathing (grows and shrinks)', v: 'slow and gentle', d: per(3), k: SPEED, h: 'It gets a little bigger, then smaller again.',
            ar: 'Fade an LED up and down slowly with analogWrite(pin, 0–255), waiting ' + ms(3) + ' ms for one full fade.' },
          { id: 'breathe-size', l: 'Breathing size', v: 'tiny, you only just notice it', d: '3.4% (φ⁻⁷)', k: SIZE, h: 'How much bigger it gets when it breathes in.' },
          { id: 'blink', l: 'Blink', v: 'every few seconds', d: per(2), k: SPEED, h: 'How often its eyes blink.',
            ar: 'LED blink sketch: digitalWrite(LED_BUILTIN, HIGH); delay(' + Math.round(ms(2) / 2) + '); then LOW; delay(' + Math.round(ms(2) / 2) + ');' },
          { id: 'wobble', l: 'Wobble (tilts side to side)', v: 'slow and small', d: per(4) + ' · ±2.06° (φ^1.5)', k: SPEED, h: 'It tilts a tiny bit left, then right, then back.',
            ar: 'A servo motor can do this: myServo.write(' + (90 - Math.round(Math.pow(PHI, 1.5))) + ') then myServo.write(' + (90 + Math.round(Math.pow(PHI, 1.5))) + '). 90 is the middle.' },
          { id: 'wobble-size', l: 'Wobble size', v: 'just a little tilt', d: '±2.06°', k: SIZE, h: 'How far it tilts each way.' },
          { id: 'shine', l: 'Shine sweeping across', v: 'now and then', d: per(5), k: SPEED, h: 'A light shine slides across the ball.' },
          { id: 'hop', l: 'Hop', v: 'once in a while, a small jump', d: per(6) + ' · jumps 14.6% of its height (φ⁻⁴)', k: SPEED, h: 'A small jump, then it lands softly.' },
          { id: 'hop-size', l: 'Hop height', v: 'low', d: '14.6% (φ⁻⁴)', k: SIZE, h: 'How high it jumps.' }
        ],
        quiz: [
          { t: 'delay()', q: 'On an Arduino, which command makes the board wait, so you can blink an LED on and off?', o: ['delay()', 'analogWrite()', 'tone()', 'Servo.write()'], a: 0,
            x: 'delay() waits for that many milliseconds. delay(' + Math.round(ms(2) / 2) + ') with the LED on, then the same with it off, makes one blink like your bot\'s.' },
          { t: 'Servo.write()', q: 'You want a real motor to wobble like your bot. Which Arduino command turns a servo to an angle?', o: ['Servo.write()', 'delay()', 'digitalWrite()', 'tone()'], a: 0,
            x: 'Servo.write(angle) turns the servo to that angle, from 0 to 180. 90 is the middle.' }
        ] },
      { id: 'orbit', name: 'Orbiting emojis', icon: '🚀', demo: function (el) { if (window.Orbit) { var h = document.createElement('div'); h.className = 'dm-orbit'; el.appendChild(h); Orbit.demo(h, 70, 34); return null; } return '<span style="font-size:2rem">🚀 ⭐ 🌍</span>'; },
        lead: 'Three space emojis loop around your page in ovals. They spin slowly and fade in and out.',
        params: [
          { id: 'which', l: 'Which emojis', v: o0.e + ' ' + o1.e + ' ' + o2.e, k: 'text', h: 'Type the emojis you want instead.' },
          { id: 'orbit-speed', l: 'Time for one lap', v: 'slow, each one a bit different', d: o0.e + ' ' + f2(P(7)) + ' s · ' + o1.e + ' ' + f2(P(7.5)) + ' s · ' + o2.e + ' ' + f2(P(8)) + ' s', k: SPEED, h: 'How long each one takes to go all the way round.' },
          { id: 'orbit-dir', l: 'Direction', v: o0.e + ' ' + o0.dir + ' · ' + o1.e + ' ' + o1.dir + ' · ' + o2.e + ' ' + o2.dir, k: DIR, h: 'Which way round each one goes.' },
          { id: 'orbit-size', l: 'Size of the ovals', v: 'medium, wider than tall', d: '23.6% of the screen wide (1/φ³), 14.6% tall (1/φ⁴); each one φ^-0.5 smaller', k: SIZE, h: 'How big a loop each one makes.' },
          { id: 'spin', l: 'Spinning on the spot', v: 'slow, two one way and one the other', d: per(6), k: SPEED, h: 'Each emoji also turns around its own middle.' },
          { id: 'fade', l: 'Fading in and out', v: 'slowly', d: per(5) + ' · 14.6%–38.2% visible', k: SPEED, h: 'They get see-through, then clearer, then see-through again.' },
          { id: 'bright', l: 'How see-through', v: 'quite faint, so they stay in the background', d: 'faintest 14.6% (φ⁻⁴), brightest 38.2% (φ⁻²)', k: ['Keep', 'Brighter', 'Fainter'], h: 'Fully solid would hide what is behind them.',
            ar: 'For a dim LED, analogWrite(pin, ' + Math.round(255 / Math.pow(PHI, 4)) + ') up to analogWrite(pin, ' + LOW + '). 255 would be full brightness.' }
        ],
        quiz: [] },
      { id: 'light', name: 'Status light', icon: '🟢', demo: function () { return '<span class="dm-led"></span>'; },
        lead: 'The small light at the bottom. It glows slowly when things are quiet. It goes quicker for a new message, and quickest when a question is waiting. It turns orange when you are offline.',
        params: [
          { id: 'colour', l: 'Colour', v: 'mint green (orange when offline)', d: '#7FD1A8 / #FF9B73', k: 'colour', h: 'Green = online. Orange = offline.' },
          { id: 'idle', l: 'Quiet glow', v: 'slow and calm', d: per(5), k: SPEED, h: 'How it glows when nothing is happening.' },
          { id: 'new', l: 'New message', v: 'quicker', d: per(3), k: SPEED, h: 'How it glows when a new message comes in.' },
          { id: 'urgent', l: 'Question waiting', v: 'quickest', d: per(1), k: SPEED, h: 'Someone is waiting for you.' },
          { id: 'range', l: 'Dim to bright', v: 'from quite dim to fully bright', d: '38.2% (φ⁻²) to 100%', k: ['Keep', 'Brighter', 'Softer'], h: 'How dim it gets, and how bright.',
            ar: 'On an Arduino: analogWrite(pin, ' + LOW + ') up to analogWrite(pin, 255).' }
        ],
        quiz: [
          { t: 'PWM', q: 'An Arduino pin can only be fully ON or fully OFF. It dims an LED by switching on and off very fast. What is that called?', o: ['PWM', 'tone()', 'delay()', 'millis()'], a: 0,
            x: 'PWM (pulse width modulation) means switching on and off very fast. analogWrite(pin, 0–255) picks how dim or bright it looks.' }
        ] },
      { id: 'tide', name: 'Tide line', icon: '🌊', demo: function () { return '<span class="tide" style="position:relative;top:0;width:100%;height:8px;display:block"><i></i></span>'; },
        lead: 'The thin wave along the top of the footer. It flows sideways. It slowly gets brighter, then softer.',
        params: [
          { id: 'colour', l: 'Colour', v: 'light blue', d: '#8FB3D1', k: 'colour', h: 'The colour of the wave line.' },
          { id: 'flow', l: 'Flow speed', v: 'slow', d: per(6), k: SPEED, h: 'How fast the wave slides along.',
            ar: 'millis() tells you how long the board has been on, so you can move things without stopping: (millis() % ' + ms(6) + ') / ' + ms(6) + '.0 goes from 0 to 1 again and again.' },
          { id: 'flow-dir', l: 'Flow direction', v: 'right to left', k: DIR, h: 'Which way the wave moves.' },
          { id: 'swell', l: 'Getting brighter and softer', v: 'slowly', d: per(4) + ' · 61.8% to 100%', k: SPEED, h: 'It gets brighter, then softer, over and over.' },
          { id: 'height', l: 'Wave height', v: 'small, gentle bumps', d: '6 px peaks over 80 px', k: SIZE, h: 'How tall the bumps are.' }
        ],
        quiz: [
          { t: 'millis()', q: 'Which Arduino command tells you how many milliseconds since the board started, so you can move a wave without stopping?', o: ['millis()', 'delay()', 'analogWrite()', 'tone()'], a: 0,
            x: 'millis() = milliseconds since the board started. Unlike delay(), it never pauses your code, so lots of things can move at once.' }
        ] },
      { id: 'dj', name: 'DJ (sound)', icon: '🎵', demo: function () { return '<span class="dm-eq">' + '<i></i>'.repeat(9) + '</span>'; },
        lead: 'Tap ♫ DJ at the top. The music is made live in your browser. There are no music files. It only plays after you tap Play.',
        params: [
          { id: 'bpm', l: 'Tempo (how fast the beat is)', v: 'medium, a bit slower when things are calm', d: '60 ÷ φ^(−1 + s/2) BPM (~97), 62–157', k: SPEED, h: 'How quick the music feels.',
            ar: 'On an Arduino, a beat is just a wait between notes: delay(' + Math.round(60000 / (60 * PHI)) + ') between each one gives about the same beat.' },
          { id: 'fade', l: 'Crossfade between tracks', v: 'slow and smooth', d: f2(P(5)) + ' s (φ^' + (5 + OWN) + '), equal-power', k: ['Keep', 'Quicker', 'Longer'], h: 'One song fades out while the next fades in.' },
          { id: 'track', l: 'Track length', v: 'a few minutes', d: f2(P(9)) + ' s (φ^' + (9 + OWN) + ')', k: ['Keep', 'Shorter', 'Longer'], h: 'How long each track plays.' },
          { id: 'volume', l: 'Volume', v: 'medium', d: '0.55 × φ^(−s/4), 25–80%', k: ['Keep', 'Louder', 'Quieter'], h: 'How loud it plays.' },
          { id: 'genre', l: 'Style', v: 'picked by mood: calm = ambient, playful = indie-pop, excited = electronic …', k: 'text', h: 'Which styles would you like?' },
          { id: 'pumps', l: 'What changes the music', v: 'time of day, weather, how busy things are, mood', d: 'each adds phi steps to s', k: ['Keep', 'Change'], h: 'These push the music a bit faster or slower.',
            ar: 'A buzzer plays a note with tone(pin, 440). noTone(pin) stops it.' }
        ],
        quiz: [
          { t: 'tone()', q: 'Which Arduino command plays a note on a buzzer?', o: ['tone()', 'analogWrite()', 'delay()', 'Servo.write()'], a: 0,
            x: 'tone(pin, note) plays a note. A bigger number is a higher note: tone(8, 880) is higher than tone(8, 440). noTone(8) stops it.' }
        ] },
      { id: 'colours', name: 'Page colours', icon: '🎨', demo: function () { return '<span class="dm-sw"><i style="background:#0B1A33"></i><i style="background:#102447"></i><i style="background:#1B3A6B"></i><i style="background:#9FB8E0"></i><i style="background:#E3ECFA"></i><i style="background:#FFFFFF"></i></span>'; },
        lead: 'Your navy colours: background, panels, buttons and text. Every text colour was checked so it is easy to read.',
        params: [
          { id: 'bg', l: 'Background', v: 'navy', d: '#0B1A33', k: 'colour', h: 'The colour behind everything.' },
          { id: 'panel', l: 'Panels', v: 'a lighter navy', d: '#102447', k: 'colour', h: 'The boxes that hold the questions.' },
          { id: 'accent', l: 'Buttons and highlights', v: 'soft blue', d: '#9FB8E0', k: 'colour', h: 'Buttons and things you can tap.' },
          { id: 'text', l: 'Text', v: 'white, easy to read on navy', d: '#FFFFFF (17.4 : 1)', k: 'colour', h: 'The colour of the words.',
            ar: 'An RGB LED mixes red, green and blue. Navy is analogWrite(redPin, 11), analogWrite(greenPin, 31), analogWrite(bluePin, 77).' }
        ],
        quiz: [
          { t: 'analogWrite()', q: 'You want an RGB LED to glow navy. Which Arduino command sets each colour\'s brightness from 0 to 255?', o: ['analogWrite()', 'digitalWrite()', 'tone()', 'millis()'], a: 0,
            x: 'analogWrite(pin, 0–255) sets how bright each colour is. digitalWrite() can only do fully on or fully off.' }
        ] },
      { id: 'rhythm', name: 'How busy your page feels', icon: '🌀', demo: function () { var h = ''; for (var n = 1; n <= 8; n++) h += '<i style="height:' + (8 + n * 9) + 'px"></i>'; return '<span class="dm-ladder">' + h + '</span>'; },
        lead: 'Every move on your page shares one beat, so it all feels calm together. You can make the whole page quicker or calmer in one go.',
        params: [
          { id: 'step', l: 'Overall speed', v: 'calm', d: 'own step +' + OWN + ' (× ' + Math.pow(PHI, OWN).toFixed(3) + ')', k: ['Keep', 'Faster', 'Slower'], h: 'One setting moves every motion on the page together.',
            ar: 'On an Arduino, keep one number for each part: the next time it should change. Check millis() every loop(), so every part keeps its own beat without delay().' },
          { id: 'dial', l: 'Whole-page speed dial', v: 'a little slower than normal', d: '0.75', k: SPEED, h: 'Turns the speed of the whole page up or down.' },
          { id: 'pump', l: 'Calmer at night', v: 'the page slows down a little late at night', d: 'moon phase + time of day, up to × 0.887', k: ['Keep', 'Turn off'], h: 'Real-world things gently slow the page down.' },
          { id: 'amount', l: 'How much moves overall', v: 'your bot, 3 emojis, the light and the wave', k: ['Keep', 'More', 'Less'], h: 'How busy the page looks.' }
        ],
        quiz: [
          { t: 'millis()', q: 'Challenge: on an Arduino, why use millis() instead of delay() to run lots of moves at once?', o: ['delay() stops everything while it waits; millis() lets the code keep going', 'millis() makes LEDs brighter', 'delay() only works with servos', 'they do the same thing'], a: 0,
            x: 'delay() freezes the whole board while it waits. millis() just tells the time, so each part can check "is it my turn yet?" and many moves run together.' }
        ] }
    ];
  }

  // ---------- state ----------
  var S = null, LIST = null;
  function fresh() { return { v: 1, qrev: QREV, i: 0, stage: 'params', qi: 0, ans: {}, quiz: {}, notes: {}, sent: {} }; }
  async function load() { S = fresh(); try { var raw = localStorage.getItem(QK); if (raw) { var s = await BI.dec(JSON.parse(raw)); if (s && s.v === 1) S = s; } } catch (e) { localStorage.removeItem(QK); }
    if (S.qrev !== QREV) { S.quiz = {}; S.qrev = QREV; if (S.stage === 'quiz') { S.stage = 'params'; S.qi = 0; } } }   // questions were rewritten: old quiz answers would not match
  async function save() { try { localStorage.setItem(QK, JSON.stringify(await BI.enc(S))); } catch (e) {} }
  function show(on) { ['q-start', 'q-quiz', 'q-break', 'q-done'].forEach(function (p) { if (on) $(p).hidden = true; }); $('pz').hidden = !on; if (!on) $('q-start').hidden = false; window.scrollTo(0, 0); }

  function prog(i) { var h = '<div class="pz-prog" aria-hidden="true">'; for (var k = 0; k < LIST.length; k++) h += '<i class="' + (k < i ? 'done' : k === i ? 'now' : '') + '"></i>'; return h + '</div>'; }
  function head(pc, i, sub) { return '<p class="phase">Piece ' + (i + 1) + ' of ' + LIST.length + ' · ' + sub + '</p>' + prog(i) + '<div class="pz-head"><span style="font-size:1.6rem" aria-hidden="true">' + pc.icon + '</span><h2>' + esc(pc.name) + '</h2></div>'; }

  function renderParams() {
    var pc = LIST[S.i], el = $('pz'), a = S.ans[pc.id] = S.ans[pc.id] || {};
    el.innerHTML = head(pc, S.i, 'which way should it go?') + '<div class="pz-demo" id="pz-demo"></div><p class="pz-lead">' + esc(pc.lead) + '</p>' +
      '<p class="pz-lead"><b>For each part: which way do you love most, and which is not really you?</b> Roll each box until it feels right, then Lock it in (or press Enter). Leave a part alone and it stays as it is. Nothing changes straight away: your picks go to ' + esc(BI.host()) + ', who says yes or no.</p><ul class="pz-params" id="pz-params"></ul>' +
      '<label class="sr" for="pz-note">Anything else about this piece?</label><textarea id="pz-note" class="pz-note" rows="2" maxlength="400" placeholder="Anything else about this piece? (optional)"></textarea>' +
      '<div class="btnrow"><button type="button" class="btn bk" id="pz-back">&larr; Back</button><button type="button" class="btn" id="pz-next">' + (pc.quiz.length ? 'Arduino challenge &rarr;' : 'Done with this piece &rarr;') + '</button></div>';
    var d = $('pz-demo'), dh = pc.demo(d); if (dh) d.innerHTML = dh;
    var ul = $('pz-params');
    pc.params.forEach(function (p) {
      var li = document.createElement('li'); li.className = 'pz-p';
      li.innerHTML = '<div class="pl"><b>' + esc(p.l) + '</b></div><span class="pv">' + esc(p.v) + '</span>' + (p.h ? '<span class="ph">' + esc(p.h) + '</span>' : '') + (p.ar ? '<span class="ph ar"><b>Arduino:</b> ' + esc(p.ar) + '</span>' : '') + '<div class="pz-ch" role="group" aria-label="' + esc(p.l) + '"></div>';
      var ch = li.querySelector('.pz-ch'), cur = a[p.id], ways = document.createElement('div'); ch.appendChild(ways);
      // pathways: two concrete directions from the current value + Roll (js/pathways.js); no Keep / Change
      if (window.Pathways) Pathways.render(ways, pc, p, a, save, function () { var nx = li.nextElementSibling, f = nx && nx.querySelector('.pw-way'); if (f) { try { f.focus({ preventScroll: true }); nx.scrollIntoView({ block: 'center', behavior: 'smooth' }); } catch (e) {} } else { var n = $('pz-next'); if (n) n.focus(); } });
      if (p.k === 'colour' || p.k === 'text') {   // or make up your own direction
        var own = document.createElement('label'); own.className = 'pw-own'; own.textContent = p.k === 'colour' ? 'or pick your own colour ' : 'or type your own ';
        var inp = document.createElement('input'); inp.type = p.k === 'colour' ? 'color' : 'text'; inp.setAttribute('aria-label', p.l + ': your own idea');
        if (p.k === 'colour') { inp.value = cur && cur.own && /^#[0-9a-f]{6}$/i.test(cur.own) ? cur.own : '#0B1F4D'; inp.oninput = function () { a[p.id] = { t: 'My own colour', val: inp.value, own: inp.value }; save(); Pathways.render(ways, pc, p, a, save); }; }
        else { inp.maxLength = 60; inp.placeholder = 'your idea…'; if (cur && cur.own) inp.value = cur.own; inp.onchange = function () { var v = inp.value.trim().slice(0, 60); if (v) { a[p.id] = { t: 'My own: ' + v, val: v, own: v }; save(); Pathways.render(ways, pc, p, a, save); } }; }
        own.appendChild(inp); ch.appendChild(own);
      }
      ul.appendChild(li);
    });
    $('pz-note').value = S.notes[pc.id] || '';
    $('pz-note').oninput = function () { S.notes[pc.id] = $('pz-note').value.slice(0, 400); save(); };
    $('pz-back').disabled = S.i === 0;
    $('pz-back').onclick = function () { if (S.i > 0) { S.i--; S.stage = 'params'; save(); renderParams(); window.scrollTo(0, 0); } };
    $('pz-next').onclick = function () { if (!pc.quiz.length) { finishPiece(); window.scrollTo(0, 0); return; } S.stage = 'quiz'; S.qi = 0; save(); renderQuiz(); window.scrollTo(0, 0); };
    if (window.Adapt) Adapt.note('piece-' + pc.id, 'open');
  }

  function renderQuiz() {
    var pc = LIST[S.i], qz = pc.quiz[S.qi], el = $('pz'), R = S.quiz[pc.id] = S.quiz[pc.id] || {}, prev = R[S.qi];
    el.innerHTML = head(pc, S.i, 'Arduino challenge ' + (S.qi + 1) + ' of ' + pc.quiz.length) + '<span class="pz-term" id="pz-term">' + esc(qz.open || (prev && prev.pick != null) ? qz.t : qz.tf ? 'True or false' : 'Your turn') + '</span><h3 class="pz-q">' + esc(qz.q) + '</h3><div id="pz-body"></div>' +
      '<div class="btnrow"><button type="button" class="btn bk" id="pz-qback">&larr; Back</button><button type="button" class="btn" id="pz-qnext" hidden>Next &rarr;</button></div>';
    var body = $('pz-body');
    function feedback(ok, extra) { var f = document.createElement('div'); f.className = 'pz-fb' + (ok ? '' : ' term'); f.innerHTML = '<b>' + (ok ? 'Named it:' : 'Here\'s the term for that:') + '</b> '; f.appendChild(document.createTextNode(qz.x + (extra || ''))); body.appendChild(f); $('pz-qnext').hidden = false; }
    if (qz.open) {
      body.innerHTML = '<label class="sr" for="pz-open">Your answer</label><textarea id="pz-open" class="pz-note" rows="3" maxlength="600" placeholder="Type your explanation…"></textarea><div class="btnrow"><button type="button" class="btn send" id="pz-osend">Check it</button><button type="button" class="btn skip" id="pz-oskip">Skip</button></div>';
      if (prev && prev.text) $('pz-open').value = prev.text;
      $('pz-osend').onclick = function () { var v = $('pz-open').value.trim(); if (!v) { $('pz-open').focus(); return; } R[S.qi] = { text: v.slice(0, 600) }; save(); body.querySelectorAll('.pz-fb').forEach(function (x) { x.remove(); }); feedback(true, ' (' + BI.host() + ' will read yours too.)'); };
      $('pz-oskip').onclick = function () { R[S.qi] = { skipped: true }; save(); next(); };
      if (prev && prev.text) feedback(true);
    } else {
      // options come from the learner model (count 2/3/5/10 from the level, shuffled, kept once shown); older saves keep theirs
      var B = prev && prev.opts ? { opts: prev.opts, a: prev.a } : prev && prev.pick != null ? { opts: qz.tf ? ['True', 'False'] : qz.o, a: qz.a }
        : window.Learner ? Learner.build(qz, pc.id + ':' + S.qi) : { opts: qz.tf ? ['True', 'False'] : qz.o, a: qz.a };
      if (!prev) { R[S.qi] = { opts: B.opts, a: B.a }; save(); }
      var box = document.createElement('div'); box.className = 'pz-opts'; body.appendChild(box);
      B.opts.forEach(function (o, k) {
        var b = document.createElement('button'); b.type = 'button'; b.textContent = o; box.appendChild(b);
        b.onclick = function () { choose(k); };
      });
      function choose(k) {
        var r = R[S.qi]; if (r && r.pick != null) return;
        R[S.qi] = { opts: B.opts, a: B.a, pick: k, ok: k === B.a }; save();
        if (window.Learner) Learner.record(qz.t, k === B.a);
        mark(); if (window.QuizOrb) QuizOrb.picked(k);
      }
      function mark() { var r = R[S.qi]; $('pz-term').textContent = qz.t; box.querySelectorAll('button').forEach(function (b, k) { b.disabled = true; if (k === B.a) b.classList.add('named'); else if (k === r.pick) b.classList.add('met'); }); feedback(r.ok); }
      if (prev && prev.pick != null) mark();
      else if (window.QuizOrb) QuizOrb.ask({ term: qz.t, label: qz.tf ? 'True or false' : 'Your turn', q: qz.q, opts: B.opts, a: B.a, explain: qz.x, bot: BI.bot(), onPick: choose, onTap: function (t) { if (window.Learner) Learner.tap(t); } });
    }
    $('pz-qback').onclick = function () { if (window.QuizOrb) QuizOrb.home(); if (S.qi > 0) { S.qi--; save(); renderQuiz(); } else { S.stage = 'params'; save(); renderParams(); } window.scrollTo(0, 0); };
    $('pz-qnext').onclick = next;
    function next() { if (window.QuizOrb) QuizOrb.home(); if (S.qi < pc.quiz.length - 1) { S.qi++; save(); renderQuiz(); } else finishPiece(); window.scrollTo(0, 0); }
  }

  function summary(pc) {
    var a = S.ans[pc.id] || {}, R = S.quiz[pc.id] || {}, lines = [], right = 0, asked = 0, miss = [];
    pc.params.forEach(function (p) { lines.push('• ' + p.l + ' (now: ' + p.v + (p.d ? ' · ' + p.d : '') + ') → ' + (window.Pathways ? Pathways.label(a[p.id]) : (a[p.id] || 'no answer'))); });
    if (S.notes[pc.id]) lines.push('Note: ' + S.notes[pc.id]);
    pc.quiz.forEach(function (q, k) { var r = R[k]; if (q.open) { lines.push('Explain (' + q.t + '): ' + (r && r.text ? r.text : 'skipped')); return; } asked++; if (r && r.ok) right++; else miss.push(q.t); });
    if (asked) lines.push('Arduino terms: ' + right + '/' + asked + ' named first time' + (miss.length ? ' (terms met: ' + miss.join(', ') + ')' : ''));
    if (window.Learner) lines.push(Learner.summary());
    return { lines: lines, right: right, asked: asked };
  }
  async function finishPiece() {
    var pc = LIST[S.i], sm = summary(pc), el = $('pz');
    el.innerHTML = head(pc, S.i, 'done') + '<h2>Piece done! 🎉</h2>' +
      '<p class="sendstat" id="pz-stat">Sending your picks to ' + esc(BI.host()) + '…</p><div class="btnrow"><button type="button" class="btn bk" id="pz-dback">&larr; Back</button><button type="button" class="btn" id="pz-cont">' + (S.i < LIST.length - 1 ? 'Next piece &rarr;' : 'Finish') + '</button></div>';
    $('pz-dback').onclick = function () { S.stage = 'params'; save(); renderParams(); window.scrollTo(0, 0); };   // back to this piece, picks kept
    $('pz-cont').onclick = function () { if (S.i < LIST.length - 1) { S.i++; S.stage = 'params'; save(); renderParams(); } else { S.i = LIST.length; save(); renderDone(); } window.scrollTo(0, 0); };
    var head1 = '[Answers · Piece ' + (S.i + 1) + '/' + LIST.length + ' · ' + pc.name + (S.sent[pc.id] ? ' · updated' : '') + ' · propose-only]';
    var st = await BI.send(head1 + '\n' + sm.lines.join('\n').slice(0, 1700), { kind: 'answers', part: pc.name });
    S.sent[pc.id] = Date.now(); save();
    var s = $('pz-stat'); if (s) { s.className = 'sendstat ' + (st === 'failed' ? 'bad' : 'ok'); s.textContent = st === 'failed' ? 'Couldn’t send yet (no connection?). It’s saved in the chat. Tap Try again there.' : '✓ Sent to ' + BI.host() + ' (encrypted). Nothing changes until ' + BI.host() + ' says yes.'; }
  }
  function renderDone() {
    var el = $('pz'), tot = 0, ok = 0;
    LIST.forEach(function (pc) { var s = summary(pc); tot += s.asked; ok += s.right; });
    el.innerHTML = '<h2>All pieces done! 🚀</h2><p class="pz-lead">' + esc(BI.host()) + ' has your picks for every piece and will say yes or no. You can go through any piece again, or ask ' + esc(BI.bot()) + ' something in the chat.</p>' +
      '<div class="btnrow"><button type="button" class="btn" id="pz-again">Go through again</button><button type="button" class="btn ghost2" id="pz-home">Back to start</button></div>';
    $('pz-again').onclick = function () { S.i = 0; S.stage = 'params'; save(); renderParams(); };
    $('pz-home').onclick = function () { show(false); resume(); };
  }
  function resume() { var r = $('pz-resume'); if (!r || !S) return; if (S.i > 0 && S.i < LIST.length) { r.hidden = false; r.textContent = 'You were up to piece ' + (S.i + 1) + ' of ' + LIST.length + '. Start picks up from there.'; } else r.hidden = true; }
  async function open() {
    if (!window.BI || !BI.ready()) return;
    LIST = PIECES(); await load(); resume(); if (window.QuizOrb) QuizOrb.init();
    var go = $('pz-go'); go.onclick = function () { if (window.Onboard && !Onboard.done()) { Onboard.start(); return; } if (!LIST) LIST = PIECES(); LIST = PIECES(); show(true); if (S.i >= LIST.length) renderDone(); else if (S.stage === 'quiz') renderQuiz(); else renderParams(); };
  }
  document.addEventListener('bi:open', open);
  document.addEventListener('bi:lock', function () { if (window.QuizOrb) QuizOrb.reset(); S = null; $('pz').hidden = true; $('pz').innerHTML = ''; });
  window.Pieces = { open: open, list: function () { return PIECES(); } };
  open();
})();
