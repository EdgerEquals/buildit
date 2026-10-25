/* "Your page, piece by piece": for every piece already on screen, a card with the piece live, its real parameters
   (read from the same phi numbers the page runs on) and a Keep / Change choice for each one, then a short physics
   challenge on the terms behind it (multiple choice, true/false, explain it in your own words), with the right answer
   explained. Each finished piece goes encrypted through the page's own send path (window.BI.send, kind:'answers') as a
   PROPOSE-ONLY request: nothing picked here changes the page; it all waits for Danny's yes. Progress is kept encrypted
   in localStorage ('buildit-pieces'). Nothing personal in this file. */
(function () {
  'use strict';
  if (window.Pieces) return;
  var PHI = 1.6180339887, QK = 'buildit-pieces';
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
  function PIECES() {
    var o0 = orbitOf(0), o1 = orbitOf(1), o2 = orbitOf(2);
    return [
      { id: 'bot', name: 'Your bot', icon: '🤖', demo: function () { return '<img src="img/bot-avatar.svg?v=2" width="88" height="88" alt="">'; },
        lead: 'The glossy navy ball in the header, in the chat and in the footer. It breathes, blinks, wobbles, shines and hops, each on its own rhythm.',
        params: [
          { id: 'colour', l: 'Colour', v: 'navy #0B1F4D, white eyes', k: 'colour', h: 'Body colour (the eyes stay white).' },
          { id: 'breathe', l: 'Breathing (grows and shrinks)', v: per(3), k: SPEED, h: 'Grows by φ⁻⁷ ≈ 3.4% and back.' },
          { id: 'breathe-size', l: 'Breathing size', v: '3.4% (φ⁻⁷)', k: SIZE },
          { id: 'blink', l: 'Blink', v: per(2), k: SPEED },
          { id: 'wobble', l: 'Wobble (tilts side to side)', v: per(4) + ' · ±2.06° (φ^1.5)', k: SPEED },
          { id: 'wobble-size', l: 'Wobble size', v: '±2.06°', k: SIZE },
          { id: 'shine', l: 'Shine sweeping across', v: per(5), k: SPEED },
          { id: 'hop', l: 'Hop', v: per(6) + ' · jumps 14.6% of its height (φ⁻⁴)', k: SPEED },
          { id: 'hop-size', l: 'Hop height', v: '14.6% (φ⁻⁴)', k: SIZE }
        ],
        quiz: [
          { t: 'Period', q: 'The bot breathes once every ' + f2(P(3)) + ' seconds. That time for one full cycle is called its…', o: ['period', 'frequency', 'amplitude', 'phase'], a: 0,
            x: 'Period (T) is the time for ONE full cycle, in seconds. Frequency is how many cycles happen per second.' },
          { t: 'Frequency', q: 'So its breathing frequency is about…', o: [(1 / P(3)).toFixed(2) + ' Hz', f2(P(3)) + ' Hz', '1 Hz', (P(3) * 60).toFixed(0) + ' Hz'], a: 0,
            x: 'f = 1 / T. One cycle every ' + f2(P(3)) + ' s is 1 ÷ ' + f2(P(3)) + ' ≈ ' + (1 / P(3)).toFixed(2) + ' cycles per second (hertz, Hz).' },
          { t: 'Period vs frequency', tf: true, q: 'True or false: if you make the breathing slower, its frequency goes up.', a: 1,
            x: 'False. Slower means a LONGER period, and since f = 1/T, a longer period means a LOWER frequency. They always move opposite ways.' }
        ] },
      { id: 'orbit', name: 'Orbiting emojis', icon: '🚀', demo: function (el) { if (window.Orbit) { var h = document.createElement('div'); h.className = 'dm-orbit'; el.appendChild(h); Orbit.demo(h, 70, 34); return null; } return '<span style="font-size:2rem">🚀 ⭐ 🌍</span>'; },
        lead: 'Three space emojis that loop around the middle of your page in ovals, spin slowly and fade in and out. Each path is two back-and-forth swings at the same time: one side to side, one up and down.',
        params: [
          { id: 'which', l: 'Which emojis', v: o0.e + ' ' + o1.e + ' ' + o2.e, k: 'text', h: 'Type the emojis you would like instead.' },
          { id: 'orbit-speed', l: 'Time for one lap', v: o0.e + ' ' + f2(P(7)) + ' s · ' + o1.e + ' ' + f2(P(7.5)) + ' s · ' + o2.e + ' ' + f2(P(8)) + ' s', k: SPEED, h: 'φ^' + (7 + OWN) + ', φ^' + (7.5 + OWN) + ', φ^' + (8 + OWN) + ' s.' },
          { id: 'orbit-dir', l: 'Direction', v: o0.e + ' ' + o0.dir + ' · ' + o1.e + ' ' + o1.dir + ' · ' + o2.e + ' ' + o2.dir, k: DIR },
          { id: 'orbit-size', l: 'Size of the ovals', v: '23.6% of the screen wide (1/φ³), 14.6% tall (1/φ⁴); each one φ^-0.5 smaller', k: SIZE },
          { id: 'spin', l: 'Spinning on the spot', v: per(6) + ', two one way, one the other', k: SPEED },
          { id: 'fade', l: 'Fading in and out', v: per(5) + ' · between 14.6% and 38.2% visible', k: SPEED },
          { id: 'bright', l: 'How see-through', v: 'faintest 14.6% (φ⁻⁴), brightest 38.2% (φ⁻²)', k: ['Keep', 'Brighter', 'Fainter'] }
        ],
        quiz: [
          { t: 'Phase', q: 'Each emoji\'s up-and-down swing runs a quarter of a cycle behind its side-to-side swing. "How far through its cycle" a motion is, is called its…', o: ['phase', 'amplitude', 'damping', 'resonance'], a: 0,
            x: 'Phase is the position within a cycle, often measured as an angle: a full cycle is 360°, so a quarter cycle is a 90° phase difference. Two equal swings 90° apart trace a circle or an oval.' },
          { t: 'Amplitude', tf: true, q: 'True or false: the side-to-side swing is wider than the up-and-down one, so the path is an oval (ellipse), not a circle.', a: 0,
            x: 'True. Amplitude is how BIG a swing is. Equal amplitudes 90° apart make a circle; unequal ones stretch it into an ellipse.' },
          { t: 'Lissajous curves', q: 'Challenge: if the up-and-down swing went exactly twice as fast as the side-to-side one, the path would become…', o: ['a figure-8 shape', 'a bigger oval', 'a straight line', 'a square'], a: 0,
            x: 'A 1:2 frequency ratio draws a figure-8. These shapes are called Lissajous curves, and scientists use them on oscilloscopes to compare two frequencies.' },
          { t: 'Direction', q: 'What flips an emoji from clockwise to anticlockwise?', o: ['Making the up-down swing a quarter cycle AHEAD instead of behind', 'Making it faster', 'Making the oval bigger', 'Changing the emoji'], a: 0,
            x: 'Direction comes from the sign of the phase difference: up-down behind = one way round, ahead = the other way.' }
        ] },
      { id: 'light', name: 'Status light', icon: '🟢', demo: function () { return '<span class="dm-led"></span>'; },
        lead: 'The small light in the footer. It breathes slowly when all is quiet, faster when a new message arrives, and fastest when a question is waiting for you. It turns orange when you\'re offline.',
        params: [
          { id: 'colour', l: 'Colour', v: 'mint green #7FD1A8 (orange #FF9B73 offline)', k: 'colour' },
          { id: 'idle', l: 'Quiet breathing', v: per(5), k: SPEED },
          { id: 'new', l: 'New message', v: per(3), k: SPEED },
          { id: 'urgent', l: 'Question waiting', v: per(1), k: SPEED },
          { id: 'range', l: 'Dim to bright', v: '38.2% (φ⁻²) to 100%', k: ['Keep', 'Brighter', 'Softer'] }
        ],
        quiz: [
          { t: 'Threshold', q: 'The light only switches to "offline" once the connection actually drops. A level that must be crossed before something changes is a…', o: ['threshold', 'period', 'wavelength', 'frequency'], a: 0,
            x: 'A threshold is a trigger level. Below it nothing happens; cross it and the state flips, like a smoke alarm going off only above a certain smoke level.' },
          { t: 'Frequency', tf: true, q: 'True or false: going from quiet breathing (' + f2(P(5)) + ' s) to new-message pulsing (' + f2(P(3)) + ' s) RAISES the light\'s frequency.', a: 0,
            x: 'True. Shorter period, higher frequency: ' + (1 / P(5)).toFixed(3) + ' Hz becomes ' + (1 / P(3)).toFixed(2) + ' Hz, about φ² = 2.6 times faster.' },
          { t: 'In your own words', open: true, q: 'Explain the difference between period and frequency, in your own words. An example helps!',
            x: 'One way to say it: period is how LONG one cycle takes (seconds per cycle); frequency is how MANY cycles fit in a second (cycles per second, Hz). Multiply them and you always get 1.' }
        ] },
      { id: 'tide', name: 'Tide line', icon: '🌊', demo: function () { return '<span class="tide" style="position:relative;top:0;width:100%;height:8px;display:block"><i></i></span>'; },
        lead: 'The thin wave along the top of the footer. It flows sideways and gently swells brighter and softer.',
        params: [
          { id: 'colour', l: 'Colour', v: 'light blue #8FB3D1', k: 'colour' },
          { id: 'flow', l: 'Flow speed (one wavelength)', v: per(6), k: SPEED },
          { id: 'flow-dir', l: 'Flow direction', v: 'right to left', k: DIR },
          { id: 'swell', l: 'Swell (brighter / softer)', v: per(4) + ' · 61.8% to 100%', k: SPEED },
          { id: 'height', l: 'Wave height', v: '6 px peaks over an 80 px wavelength', k: SIZE }
        ],
        quiz: [
          { t: 'Wavelength', q: 'The distance from one wave peak to the next is called the…', o: ['wavelength', 'amplitude', 'period', 'threshold'], a: 0,
            x: 'Wavelength (λ) is the length of one full wave. Wave speed = wavelength × frequency, so this wave moves 80 px per ' + f2(P(6)) + ' s.' },
          { t: 'Damping', q: 'A swing nobody pushes gets smaller each time because energy is lost to friction and air. That is called…', o: ['damping', 'resonance', 'amplifying', 'refraction'], a: 0,
            x: 'Damping removes energy from an oscillation, so the amplitude shrinks over time. Car shock absorbers are dampers. Danny\'s logo uses a damped spring model.' },
          { t: 'Resonance', q: 'Pushing a swing at exactly its natural frequency so it goes higher every time is called…', o: ['resonance', 'damping', 'phase', 'a threshold'], a: 0,
            x: 'Resonance: driving something at its natural frequency adds energy every cycle, so the amplitude grows. A singer can shatter a wine glass this way.' }
        ] },
      { id: 'dj', name: 'DJ (sound)', icon: '🎵', demo: function () { return '<span class="dm-eq">' + '<i></i>'.repeat(9) + '</span>'; },
        lead: 'Tap ♫ DJ at the top. The music is made live in your browser by maths, so there are no music files. It only plays after you tap Play.',
        params: [
          { id: 'bpm', l: 'Tempo', v: '60 ÷ φ^(−1 + s/2) beats per minute (about 97 BPM normally), kept between 62 and 157', k: SPEED },
          { id: 'fade', l: 'Crossfade between tracks', v: f2(P(5)) + ' s (φ^' + (5 + OWN) + '), equal-power', k: ['Keep', 'Quicker', 'Longer'] },
          { id: 'track', l: 'Track length', v: f2(P(9)) + ' s (φ^' + (9 + OWN) + ')', k: ['Keep', 'Shorter', 'Longer'] },
          { id: 'volume', l: 'Volume', v: '0.55 × φ^(−s/4), kept between 25% and 80%', k: ['Keep', 'Louder', 'Quieter'] },
          { id: 'genre', l: 'Style', v: 'picked by mood: calm = ambient, playful = indie-pop, excited = electronic …', k: 'text', h: 'Which styles would you like?' },
          { id: 'pumps', l: 'What changes the music', v: 'time of day, weather, how urgent things are, mood. Each adds phi steps to s', k: ['Keep', 'Change'] }
        ],
        quiz: [
          { t: 'Beats and hertz', q: '120 BPM (beats per minute) is a frequency of…', o: ['2 Hz', '120 Hz', '0.5 Hz', '12 Hz'], a: 0,
            x: '120 beats ÷ 60 seconds = 2 beats per second = 2 Hz. The period of each beat is 0.5 s.' },
          { t: 'Pitch', tf: true, q: 'True or false: a higher-pitched note means the sound wave vibrates at a higher frequency.', a: 0,
            x: 'True. Pitch is how we hear frequency. The A above middle C is 440 Hz; the DJ works out every note as 440 × 2^((note − 69) ÷ 12).' },
          { t: 'Octaves', q: 'Going up one octave does what to a note\'s frequency?', o: ['doubles it', 'adds 100 Hz', 'halves it', 'multiplies it by φ'], a: 0,
            x: 'An octave is a 2:1 frequency ratio. That is why notes an octave apart sound like the "same" note, higher.' },
          { t: 'Equal-power crossfade', q: 'Challenge: the DJ fades one track down with a cosine curve and the next up with a sine curve. Why? Because sin² + cos² always equals…', o: ['1, so the total loudness stays steady', '0, so it goes silent', '2, so it gets louder', 'φ'], a: 0,
            x: 'Sound power goes with amplitude squared. Since sin²θ + cos²θ = 1 for every θ, the two tracks always add up to the same power, so there\'s no dip in the middle of the mix.' }
        ] },
      { id: 'colours', name: 'Page colours', icon: '🎨', demo: function () { return '<span class="dm-sw"><i style="background:#0B1A33"></i><i style="background:#102447"></i><i style="background:#1B3A6B"></i><i style="background:#9FB8E0"></i><i style="background:#E3ECFA"></i><i style="background:#FFFFFF"></i></span>'; },
        lead: 'Your navy palette: background, panels, buttons and text. Every text colour was checked to be easy to read (contrast at least 4.5 to 1).',
        params: [
          { id: 'bg', l: 'Background', v: 'navy #0B1A33', k: 'colour' },
          { id: 'panel', l: 'Panels', v: '#102447', k: 'colour' },
          { id: 'accent', l: 'Buttons and highlights', v: 'soft blue #9FB8E0', k: 'colour' },
          { id: 'text', l: 'Text', v: 'white #FFFFFF (17.4 : 1 contrast on navy)', k: 'colour' }
        ],
        quiz: [
          { t: 'Light is a wave', q: 'Colour is light\'s frequency. Which has the HIGHER frequency?', o: ['blue light', 'red light', 'they\'re the same'], a: 0,
            x: 'Blue light vibrates at about 650 trillion Hz and red at about 450 trillion Hz. Higher frequency means a shorter wavelength: blue ≈ 470 nm, red ≈ 680 nm.' },
          { t: 'Reflection', tf: true, q: 'True or false: navy looks dark because the surface reflects only a little light, mostly at blue wavelengths.', a: 0,
            x: 'True. A colour is the light an object sends back to your eyes. Navy absorbs most light and returns a small amount of blue.' },
          { t: 'Ratios', q: 'White text on navy has a contrast ratio of 17.4 : 1. What does a bigger contrast ratio mean?', o: ['easier to read', 'harder to read', 'brighter colours', 'nothing'], a: 0,
            x: 'Contrast ratio compares how bright the lighter colour is with the darker one. Readable text needs at least 4.5 : 1, and 17.4 : 1 is very clear.' }
        ] },
      { id: 'rhythm', name: 'Your page\'s rhythm', icon: '🌀', demo: function () { var h = ''; for (var n = 1; n <= 8; n++) h += '<i style="height:' + (8 + n * 9) + 'px" title="φ^' + (n + OWN) + '"></i>'; return '<span class="dm-ladder">' + h + '</span>'; },
        lead: 'The secret behind every motion: each time on your page is the golden ratio φ ≈ 1.618 raised to a power (φ¹, φ², φ³ …). Your page runs a quarter step off everyone else\'s, so it has its own rhythm signature.',
        params: [
          { id: 'step', l: 'Your rhythm step', v: '+' + OWN + ' (every time × φ^' + OWN + ' ≈ ' + Math.pow(PHI, OWN).toFixed(3) + ', a bit calmer)', k: ['Keep', 'Faster', 'Slower'], h: 'One setting moves every motion on the page together.' },
          { id: 'dial', l: 'Whole-page speed dial', v: '0.75 (everything 25% slower)', k: SPEED },
          { id: 'pump', l: 'Calm pump', v: 'moon phase and time of day can slow everything by up to a quarter step (× 0.887)', k: ['Keep', 'Turn off'] },
          { id: 'amount', l: 'How much moves overall', v: '4 moving pieces: bot, 3 emojis, light, tide', k: ['Keep', 'More', 'Less'] }
        ],
        quiz: [
          { t: 'The φ ladder', q: 'If one thing takes φ³ ≈ 4.24 s, the next rung up, φ⁴, takes about…', o: ['6.85 s', '5.24 s', '8.47 s', '4.24 s'], a: 0,
            x: 'Each rung is φ times the one below: 4.236 × 1.618 ≈ 6.854 s. The golden ratio also has a party trick: φ² = φ + 1.' },
          { t: 'Irrational ratios', tf: true, q: 'True or false: because φ is irrational, two motions timed on different φ powers never fall back into exactly the same pattern.', a: 0,
            x: 'True. An irrational number can\'t be written as a fraction of whole numbers, so the motions never line up into a short repeating loop. That keeps the page feeling alive instead of robotic. Sunflower seeds use the same trick to pack evenly.' },
          { t: 'Your step', q: 'Your page is a quarter step slower: every time is multiplied by φ^0.25. That is about…', o: ['1.128', '1.25', '0.25', '1.618'], a: 0,
            x: 'φ^0.25 is the fourth root of 1.618, about 1.128, so everything takes about 12.8% longer than on the base ladder.' },
          { t: 'In your own words', open: true, q: 'Why does timing everything with φ stop the page from looking like a robot loop? Explain it your way.',
            x: 'One way to say it: if two motions had periods of 2 s and 4 s, they would line up every 4 s and repeat the same pattern forever. With φ ratios they never exactly line up, so the pattern keeps changing.' }
        ] }
    ];
  }

  // ---------- state ----------
  var S = null, LIST = null;
  function fresh() { return { v: 1, i: 0, stage: 'params', qi: 0, ans: {}, quiz: {}, notes: {}, sent: {} }; }
  async function load() { S = fresh(); try { var raw = localStorage.getItem(QK); if (raw) { var s = await BI.dec(JSON.parse(raw)); if (s && s.v === 1) S = s; } } catch (e) { localStorage.removeItem(QK); } }
  async function save() { try { localStorage.setItem(QK, JSON.stringify(await BI.enc(S))); } catch (e) {} }
  function show(on) { ['q-start', 'q-quiz', 'q-break', 'q-done'].forEach(function (p) { if (on) $(p).hidden = true; }); $('pz').hidden = !on; if (!on) $('q-start').hidden = false; window.scrollTo(0, 0); }

  function prog(i) { var h = '<div class="pz-prog" aria-hidden="true">'; for (var k = 0; k < LIST.length; k++) h += '<i class="' + (k < i ? 'done' : k === i ? 'now' : '') + '"></i>'; return h + '</div>'; }
  function head(pc, i, sub) { return '<p class="phase">Piece ' + (i + 1) + ' of ' + LIST.length + ' · ' + sub + '</p>' + prog(i) + '<div class="pz-head"><span style="font-size:1.6rem" aria-hidden="true">' + pc.icon + '</span><h2>' + esc(pc.name) + '</h2></div>'; }

  function renderParams() {
    var pc = LIST[S.i], el = $('pz'), a = S.ans[pc.id] = S.ans[pc.id] || {};
    el.innerHTML = head(pc, S.i, 'keep it or change it') + '<div class="pz-demo" id="pz-demo"></div><p class="pz-lead">' + esc(pc.lead) + '</p>' +
      '<p class="pz-lead"><b>For each part: is it right, or would you change it?</b> Nothing changes straight away: your picks go to ' + esc(BI.host()) + ' to say yes.</p><ul class="pz-params" id="pz-params"></ul>' +
      '<label class="sr" for="pz-note">Anything else about this piece?</label><textarea id="pz-note" class="pz-note" rows="2" maxlength="400" placeholder="Anything else about this piece? (optional)"></textarea>' +
      '<div class="btnrow"><button type="button" class="btn bk" id="pz-back">&larr; Back</button><button type="button" class="btn" id="pz-next">Physics challenge &rarr;</button></div>';
    var d = $('pz-demo'), dh = pc.demo(d); if (dh) d.innerHTML = dh;
    var ul = $('pz-params');
    pc.params.forEach(function (p) {
      var li = document.createElement('li'); li.className = 'pz-p';
      li.innerHTML = '<div class="pl"><b>' + esc(p.l) + '</b></div><span class="pv">' + esc(p.v) + '</span>' + (p.h ? '<span class="ph">' + esc(p.h) + '</span>' : '') + '<div class="pz-ch" role="group" aria-label="' + esc(p.l) + '"></div>';
      var ch = li.querySelector('.pz-ch'), cur = a[p.id];
      function btn(label, val, cls, style) { var b = document.createElement('button'); b.type = 'button'; if (cls) b.className = cls; if (style) b.style.background = style; b.textContent = cls === 'sw' ? '' : label; if (cls === 'sw') b.setAttribute('aria-label', label);
        b.setAttribute('aria-pressed', String(cur === val)); b.onclick = function () { a[p.id] = val; save(); renderKeep(); }; ch.appendChild(b); }
      function renderKeep() { cur = a[p.id]; ch.querySelectorAll('button').forEach(function (b) { b.setAttribute('aria-pressed', String((b.dataset.v || b.textContent || b.getAttribute('aria-label')) === cur)); }); }
      if (p.k === 'colour') {
        btn('Keep', 'Keep');
        NAVY.concat(['#0A3D3F', '#2B1B5A', '#111417']).forEach(function (c) { btn('Colour ' + c, c, 'sw', c); ch.lastChild.dataset.v = c; });
        var ci = document.createElement('input'); ci.type = 'color'; ci.value = /^#[0-9a-f]{6}$/i.test(cur || '') ? cur : '#0B1F4D'; ci.setAttribute('aria-label', 'Pick any colour');
        ci.oninput = function () { a[p.id] = ci.value; save(); renderKeep(); }; ch.appendChild(ci);
      } else if (p.k === 'text') {
        btn('Keep', 'Keep');
        var ti = document.createElement('input'); ti.type = 'text'; ti.maxLength = 60; ti.placeholder = 'or type…'; ti.setAttribute('aria-label', p.l + ': your idea'); if (cur && cur !== 'Keep') ti.value = cur;
        ti.onchange = function () { var v = ti.value.trim().slice(0, 60); if (v) { a[p.id] = v; save(); renderKeep(); } }; ch.appendChild(ti);
      } else p.k.forEach(function (o) { btn(o, o); });
      ul.appendChild(li);
    });
    $('pz-note').value = S.notes[pc.id] || '';
    $('pz-note').oninput = function () { S.notes[pc.id] = $('pz-note').value.slice(0, 400); save(); };
    $('pz-back').disabled = S.i === 0;
    $('pz-back').onclick = function () { if (S.i > 0) { S.i--; S.stage = 'params'; save(); renderParams(); window.scrollTo(0, 0); } };
    $('pz-next').onclick = function () { S.stage = 'quiz'; S.qi = 0; save(); renderQuiz(); window.scrollTo(0, 0); };
    if (window.Adapt) Adapt.note('piece-' + pc.id, 'open');
  }

  function renderQuiz() {
    var pc = LIST[S.i], qz = pc.quiz[S.qi], el = $('pz'), R = S.quiz[pc.id] = S.quiz[pc.id] || {}, prev = R[S.qi];
    el.innerHTML = head(pc, S.i, 'physics challenge ' + (S.qi + 1) + ' of ' + pc.quiz.length) + '<span class="pz-term">' + esc(qz.t) + '</span><h3 class="pz-q">' + esc(qz.q) + '</h3><div id="pz-body"></div>' +
      '<div class="btnrow"><button type="button" class="btn bk" id="pz-qback">&larr; Back</button><button type="button" class="btn" id="pz-qnext" hidden>Next &rarr;</button></div>';
    var body = $('pz-body');
    function feedback(ok, extra) { var f = document.createElement('div'); f.className = 'pz-fb' + (ok ? '' : ' miss'); f.innerHTML = '<b>' + (ok ? ['Spot on!', 'Nailed it!', 'Exactly right!'][S.qi % 3] : 'Good try, here\'s the trick:') + '</b> '; f.appendChild(document.createTextNode(qz.x + (extra || ''))); body.appendChild(f); $('pz-qnext').hidden = false; }
    if (qz.open) {
      body.innerHTML = '<label class="sr" for="pz-open">Your answer</label><textarea id="pz-open" class="pz-note" rows="3" maxlength="600" placeholder="Type your explanation…"></textarea><div class="btnrow"><button type="button" class="btn send" id="pz-osend">Check it</button><button type="button" class="btn skip" id="pz-oskip">Skip</button></div>';
      if (prev && prev.text) $('pz-open').value = prev.text;
      $('pz-osend').onclick = function () { var v = $('pz-open').value.trim(); if (!v) { $('pz-open').focus(); return; } R[S.qi] = { text: v.slice(0, 600) }; save(); body.querySelectorAll('.pz-fb').forEach(function (x) { x.remove(); }); feedback(true, ' (' + BI.host() + ' will read yours too.)'); };
      $('pz-oskip').onclick = function () { R[S.qi] = { skipped: true }; save(); next(); };
      if (prev && prev.text) feedback(true);
    } else {
      var opts = qz.tf ? ['True', 'False'] : qz.o, box = document.createElement('div'); box.className = 'pz-opts'; body.appendChild(box);
      opts.forEach(function (o, k) {
        var b = document.createElement('button'); b.type = 'button'; b.textContent = o; box.appendChild(b);
        b.onclick = function () { if (R[S.qi] != null && R[S.qi].pick != null) return; R[S.qi] = { pick: k, ok: k === qz.a }; save(); mark(); };
      });
      function mark() { var r = R[S.qi]; box.querySelectorAll('button').forEach(function (b, k) { b.disabled = true; if (k === qz.a) b.classList.add('right'); else if (k === r.pick) b.classList.add('wrong'); }); feedback(r.ok); }
      if (prev && prev.pick != null) mark();
    }
    $('pz-qback').onclick = function () { if (S.qi > 0) { S.qi--; save(); renderQuiz(); } else { S.stage = 'params'; save(); renderParams(); } window.scrollTo(0, 0); };
    $('pz-qnext').onclick = next;
    function next() { if (S.qi < pc.quiz.length - 1) { S.qi++; save(); renderQuiz(); } else finishPiece(); window.scrollTo(0, 0); }
  }

  function summary(pc) {
    var a = S.ans[pc.id] || {}, R = S.quiz[pc.id] || {}, lines = [], right = 0, asked = 0, miss = [];
    pc.params.forEach(function (p) { lines.push('• ' + p.l + ' (now: ' + p.v + ') → ' + (a[p.id] || 'no answer')); });
    if (S.notes[pc.id]) lines.push('Note: ' + S.notes[pc.id]);
    pc.quiz.forEach(function (q, k) { var r = R[k]; if (q.open) { lines.push('Explain (' + q.t + '): ' + (r && r.text ? r.text : 'skipped')); return; } asked++; if (r && r.ok) right++; else miss.push(q.t); });
    lines.push('Physics: ' + right + '/' + asked + ' right' + (miss.length ? ' (to go over: ' + miss.join(', ') + ')' : ''));
    return { lines: lines, right: right, asked: asked };
  }
  async function finishPiece() {
    var pc = LIST[S.i], sm = summary(pc), el = $('pz');
    el.innerHTML = head(pc, S.i, 'done') + '<h2>' + (sm.right === sm.asked ? 'Perfect score! 🎉' : 'Nice work!') + '</h2><p class="pz-score">Physics challenge: ' + sm.right + ' of ' + sm.asked + ' right.</p>' +
      '<p class="sendstat" id="pz-stat">Sending your picks to ' + esc(BI.host()) + '…</p><div class="btnrow"><button type="button" class="btn" id="pz-cont">' + (S.i < LIST.length - 1 ? 'Next piece &rarr;' : 'Finish') + '</button></div>';
    $('pz-cont').onclick = function () { if (S.i < LIST.length - 1) { S.i++; S.stage = 'params'; save(); renderParams(); } else { S.i = LIST.length; save(); renderDone(); } window.scrollTo(0, 0); };
    var head1 = '[Answers · Piece ' + (S.i + 1) + '/' + LIST.length + ' · ' + pc.name + (S.sent[pc.id] ? ' · updated' : '') + ' · propose-only]';
    var st = await BI.send(head1 + '\n' + sm.lines.join('\n').slice(0, 1700), { kind: 'answers', part: pc.name });
    S.sent[pc.id] = Date.now(); save();
    var s = $('pz-stat'); if (s) { s.className = 'sendstat ' + (st === 'failed' ? 'bad' : 'ok'); s.textContent = st === 'failed' ? 'Couldn’t send yet (no connection?). It’s saved in the chat. Tap Try again there.' : '✓ Sent to ' + BI.host() + ' (encrypted). Nothing changes until ' + BI.host() + ' says yes.'; }
  }
  function renderDone() {
    var el = $('pz'), tot = 0, ok = 0;
    LIST.forEach(function (pc) { var s = summary(pc); tot += s.asked; ok += s.right; });
    el.innerHTML = '<h2>All pieces done! 🚀</h2><p class="pz-score">Physics: ' + ok + ' of ' + tot + ' right overall.</p><p class="pz-lead">' + esc(BI.host()) + ' has your picks for every piece and will say yes or no. You can go through any piece again, or ask ' + esc(BI.bot()) + ' something in the chat.</p>' +
      '<div class="btnrow"><button type="button" class="btn" id="pz-again">Go through again</button><button type="button" class="btn ghost2" id="pz-home">Back to start</button></div>';
    $('pz-again').onclick = function () { S.i = 0; S.stage = 'params'; save(); renderParams(); };
    $('pz-home').onclick = function () { show(false); resume(); };
  }
  function resume() { var r = $('pz-resume'); if (!r || !S) return; if (S.i > 0 && S.i < LIST.length) { r.hidden = false; r.textContent = 'You were up to piece ' + (S.i + 1) + ' of ' + LIST.length + '. Start picks up from there.'; } else r.hidden = true; }
  async function open() {
    if (!window.BI || !BI.ready()) return;
    LIST = PIECES(); await load(); resume();
    var go = $('pz-go'); go.onclick = function () { if (!LIST) LIST = PIECES(); LIST = PIECES(); show(true); if (S.i >= LIST.length) renderDone(); else if (S.stage === 'quiz') renderQuiz(); else renderParams(); };
  }
  document.addEventListener('bi:open', open);
  document.addEventListener('bi:lock', function () { S = null; $('pz').hidden = true; $('pz').innerHTML = ''; });
  window.Pieces = { open: open, list: function () { return PIECES(); } };
  open();
})();
