/* LEARNER: the on-device learner model behind the physics challenges (see docs/learning-model.md).
   One idea runs the whole file: "name it to build it". Every quiz answer is a chance to hand over the real term, never
   a mark against the learner, and the difficulty follows the learner instead of a fixed script.
   - Stored ONLY in this browser: localStorage "buildit.learner". Holds numbers and fixed term ids, never typed text.
   - Per term: exposures n, recall strength s (0..1), last seen, interval rung k. Recall decays as
       r = s * PHI^(-days / PHI^k)            (phi-spaced intervals: each clean recall stretches the next by PHI)
   - Level L is continuous on 0..3 (L = 3 * logistic(x)). x follows a target xt through a damped spring
     (natural period PHI^2 answers, damping ratio 1/PHI), so the level glides, overshoots a little and settles: no steps.
       named it: xt += PHI^-3   ·   met a new term: xt -= PHI^-2   ·   "too easy": +PHI^-1   ·   "too hard": -PHI^-1
     Equilibrium sits where p * PHI^-3 = (1 - p) * PHI^-2, i.e. naming about 61.8% (1/PHI) straight off: stretched, not stuck.
   - Options: index = floor(L' + u) on the ladder 2 / 3 / 5 / 10, where u is the golden-ratio sequence frac(n * 0.618) and
     L' = L nudged by this term's own recall. The dither means the level is never frozen by a threshold: a level of 1.4
     gives 3 options 60% of the time and 5 options 40%, spread evenly. Quantisation only times the change.
   - Term depth: distractor terms are weighted by PHI^(-PHI^2 * |depth - 2L/3|), so deeper terms appear as the level rises;
     terms from the other family (physics vs Arduino) are weighted PHI^-2, so they turn up now and then without crowding.
   ADAPTER POINT: if the shared js/phi-adapt.js is loaded first and exposes window.PhiAdapt.learner with the same method
   names (record, tap, level, summary, data), every call is forwarded there and this file only builds the options. */
(function () {
  'use strict';
  if (window.Learner) return;
  var PHI = 1.6180339887, GA = 0.6180339887, KEY = 'buildit.learner', DAY = 864e5, LADDER = [2, 3, 5, 10];
  var ext = window.PhiAdapt && window.PhiAdapt.learner && typeof window.PhiAdapt.learner.record === 'function' ? window.PhiAdapt.learner : null;
  // ---- the shared lingo: term -> depth (0 everyday, 1 physics words, 2 deeper ideas) ----
  var BANK = { period: 0, frequency: 0, amplitude: 0, cycle: 0, speed: 0, wave: 0, pitch: 0, rhythm: 0, loudness: 0,
    phase: 1, wavelength: 1, damping: 1, resonance: 1, threshold: 1, hertz: 1, octave: 1, reflection: 1, oscillation: 1, ratio: 1, refraction: 1, amplifying: 1,
    'Lissajous curve': 2, harmonic: 2, 'natural frequency': 2, interference: 2, modulation: 2, attenuation: 2, ellipse: 2, 'irrational number': 2,
    'golden angle': 2, 'spring constant': 2, 'equal-power curve': 2, 'beat frequency': 2,
    // Arduino lingo (same depth scale)
    LED: 0, pin: 0, 'delay()': 0, 'digitalWrite()': 1, 'analogWrite()': 1, PWM: 1, 'duty cycle': 1, 'millis()': 1, 'tone()': 1, servo: 1,
    'Servo.write()': 2, 'noTone()': 2, 'analogRead()': 2, 'square wave': 2, microcontroller: 2, 'setup()': 2, 'loop()': 2 };
  var ARDUINO = ['LED', 'pin', 'delay()', 'digitalWrite()', 'analogWrite()', 'PWM', 'duty cycle', 'millis()', 'tone()', 'servo', 'Servo.write()', 'noTone()', 'analogRead()', 'square wave', 'microcontroller', 'setup()', 'loop()'];
  var grp = function (k) { return ARDUINO.indexOf(k) >= 0 ? 1 : 0; };
  // near-synonyms that would make a distractor unfair for that answer
  var CLOSE = { period: ['cycle'], frequency: ['hertz', 'pitch'], amplitude: ['loudness'], damping: ['attenuation'], resonance: ['natural frequency'], hertz: ['frequency'],
    PWM: ['duty cycle', 'analogWrite()'], 'duty cycle': ['PWM'], 'analogWrite()': ['PWM'], 'Servo.write()': ['servo'], 'tone()': ['square wave'] };
  var norm = function (s) { return String(s).trim().replace(/^an? /i, '').toLowerCase(); };
  var bankKey = {}; Object.keys(BANK).forEach(function (k) { bankKey[norm(k)] = k; });

  function fresh() { return { v: 1, x: -2.944, xt: -2.944, vx: 0, n: 0, easy: 0, hard: 0, intro: 0, terms: {} }; }   // L ~ 0.15: starts simple
  function load() { try { var d = JSON.parse(localStorage.getItem(KEY) || 'null'); if (d && d.v === 1) return d; } catch (e) {} return fresh(); }
  var D = load();
  function save() { try { localStorage.setItem(KEY, JSON.stringify(D)); } catch (e) {} }
  function level() { if (ext && ext.level) return ext.level(); return 3 / (1 + Math.exp(-D.x)); }
  // damped spring step for the level: one answer = one unit of "learning time", integrated in PHI^-3 slices
  function settle() {
    var w = 2 * Math.PI / (PHI * PHI), z = 1 / PHI, dt = Math.pow(PHI, -3), t = 0;
    while (t < 1) { var a = -w * w * (D.x - D.xt) - 2 * z * w * D.vx; D.vx += a * dt; D.x += D.vx * dt; t += dt; }
  }
  function termId(t) { return String(t).replace(/[^\w -]/g, '').slice(0, 32); }
  function recall(t) {
    var r = D.terms[termId(t)]; if (!r) return 0;
    return r.s * Math.pow(PHI, -((Date.now() - r.last) / DAY) / Math.pow(PHI, r.k));
  }
  function record(t, ok) {
    if (ext) return ext.record(t, ok);
    var id = termId(t), r = D.terms[id] = D.terms[id] || { n: 0, s: 0, last: Date.now(), k: 0 }, r0 = recall(t);
    // meeting a term with its explanation still teaches it a little (target PHI^-2); naming it locks it in (target 1)
    r.s = r0 + ((ok ? 1 : 1 / (PHI * PHI)) - r0) / PHI; r.k = ok ? r.k + 1 : r.k / PHI; r.n++; r.last = Date.now();
    D.xt += ok ? Math.pow(PHI, -3) : -Math.pow(PHI, -2); settle(); save();
  }
  function tap(kind) {
    if (ext && ext.tap) return ext.tap(kind);
    if (kind === 'easy') { D.easy++; D.xt += 1 / PHI; } else if (kind === 'hard') { D.hard++; D.xt -= 1 / PHI; } else return;
    settle(); save();
  }
  // seeded generator so a question keeps the same options when re-shown
  function rng(seed) { var h = 2166136261; for (var i = 0; i < seed.length; i++) { h ^= seed.charCodeAt(i); h = Math.imul(h, 16777619); }
    return function () { h += 0x6D2B79F5; var t = h; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function want(term) {
    var L = level() + (recall(term) - 0.5) / PHI, u = (D.n * GA) % 1;
    return LADDER[Math.max(0, Math.min(3, Math.floor(L + u)))];
  }
  // build the options for one question: {opts, a, n}. Term ("name this") questions draw extra distractors from the lingo bank.
  function build(q, seed) {
    var R = rng(seed + ':' + D.n), right, pool, isTerm, n; R(); R(); R();   // warm up: similar seeds start apart
    if (q.tf) { D.n++; save(); return { opts: ['True', 'False'], a: q.a, n: 2 }; }
    right = q.o[q.a]; isTerm = q.o.every(function (o) { return bankKey[norm(o)]; });
    n = want(q.t);
    var others = q.o.filter(function (o, k) { return k !== q.a; }), pick = [];
    if (isTerm) {
      var rk = bankKey[norm(right)], ban = [norm(right)].concat((CLOSE[rk] || []).map(norm)), Dd = level() * 2 / 3;
      pool = Object.keys(BANK).filter(function (k) { return ban.indexOf(norm(k)) < 0; }).map(function (k) {
        var own = others.some(function (o) { return norm(o) === norm(k); });
        return { o: own ? others.filter(function (o) { return norm(o) === norm(k); })[0] : k, w: Math.pow(PHI, -PHI * PHI * Math.abs(BANK[k] - Dd)) * (own ? PHI * PHI * PHI : 1) * (grp(k) === grp(rk) ? 1 : 1 / (PHI * PHI)) };
      });
      while (pick.length < n - 1 && pool.length) {          // weighted draw without replacement
        var tot = 0, i; pool.forEach(function (p) { tot += p.w; }); var x = R() * tot;
        for (i = 0; i < pool.length - 1 && (x -= pool[i].w) > 0; i++);
        pick.push(pool.splice(i, 1)[0].o);
      }
    } else {
      var cap = others.length + 1; while (LADDER.indexOf(n) > 0 && n > cap) n = LADDER[LADDER.indexOf(n) - 1];
      n = Math.min(n, cap); pick = others.slice().sort(function () { return R() - 0.5; }).slice(0, n - 1);
    }
    var opts = pick.concat([right]);
    for (var j = opts.length - 1; j > 0; j--) { var m = Math.floor(R() * (j + 1)), t = opts[j]; opts[j] = opts[m]; opts[m] = t; }
    D.n++; save();
    return { opts: opts, a: opts.indexOf(right), n: opts.length };
  }
  // compact, anonymised summary for the encrypted answers: numbers and term ids only, never free text
  function summary() {
    if (ext && ext.summary) return ext.summary();
    var L = level(), ts = Object.keys(D.terms).sort(function (a, b) { return D.terms[b].last - D.terms[a].last; }).slice(0, 13);
    var lo = LADDER[Math.min(3, Math.floor(L))], hi = LADDER[Math.min(3, Math.floor(L) + 1)];
    return 'Learning (on-device, no text): level ' + L.toFixed(2) + '/3 → ' + (lo === hi ? lo : lo + '–' + hi) + ' options · ' +
      ts.map(function (t) { var r = D.terms[t]; return t + ' ' + recall(t).toFixed(2) + '×' + r.n; }).join(' · ') + (ts.length ? ' · ' : '') +
      'too easy ' + D.easy + ' / too hard ' + D.hard;
  }
  window.Learner = { schema: 1, level: level, recall: recall, record: record, tap: tap, build: build, summary: summary, want: want,
    introSeen: function () { return !!D.intro; }, markIntro: function () { D.intro = Date.now(); save(); },
    data: function () { return ext && ext.data ? ext.data() : JSON.parse(JSON.stringify(D)); },
    reset: function () { D = fresh(); save(); } };
})();
