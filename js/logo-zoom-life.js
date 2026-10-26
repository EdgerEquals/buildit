/* LOGO ZOOM LIFE: the enlarged logo view's motion and sound (this page's own copy of the Kids Club zoom engine, made generic:
   no other page's logo, art, creatures or names; logo sound and motion standard). Loaded only when the logo is tapped (js/logo.js),
   never before unlock and never in Lite. Everything stops when the view closes.
   1 SHIMMER  a soft light band glides across the logo, clipped to its circle. Period B x PHI, glide B x PHI^-1.
   2 STARS    faint still stars on a small canvas behind the logo, plus 5 (Fibonacci) highlight stars that twinkle just outside the
              logo's edge; star k repeats every B x PHI^(k - 1), each twinkle B x PHI^-1, first at its period x frac(k / PHI).
   3 GLOW     the halo breathes over B x PHI^2; its echo comes back off an undrawn wall B x PHI^-1 later.
   4 SOUND    the music bed from js/logo-sound.js (this page's copy, plain Web Audio, lazy) on the AudioContext made inside the tap,
              plus tiny glass sparkles on each twinkle and an air swish on each shimmer. No master volume and no output gain node:
              each sound goes straight to the device, whose own volume is the one overall control. Levels come from the amplitude
              matrix hook (LogoSound.level: matrix level x quiet hours; pending Danny). Pitches are ratios of the live base
              (LogoSound.base: the kid's rhythm, ranged by the page's feeds), sparkles five octaves over it. No sound until
              logo-sound.js has loaded, so nothing here has a pitch or level of its own.
   B = PhiPumps.B() (anchor B: moon clock + the kid's own rhythm); every value is B x PHI^n or a PHI power. Colours come from the
   page palette and the logo's own layers. Reduced motion: no shimmer, twinkles or breathing; the still stars, glow and sounds stay.
   API: LogoZoomLife.start(fig, audioContext, {logo, colours}) / stop() / running(). */
(function () {
  'use strict';
  if (window.LogoZoomLife) return;
  var PHI = 1.6180339887, G = 1 / PHI;
  var RM = window.matchMedia ? matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  var own = 0; try { var o0 = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--own-step')); if (isFinite(o0)) own = o0; } catch (e) {}
  function Bs() { var b = window.PhiPumps && PhiPumps.B ? PhiPumps.B() : null; return b || Math.pow(PHI, 3 + own); }   // fallback: the page's own breathing beat
  function T(n) { return Bs() * Math.pow(PHI, n) * 1000; }   // ms
  function cssv(n) { try { return getComputedStyle(document.documentElement).getPropertyValue(n).trim(); } catch (e) { return ''; } }
  var CSS = '.lz-bg,.lz-fx{position:absolute;inset:0;pointer-events:none}.lz-bg{z-index:0}.lz-fx{z-index:2;overflow:hidden;border-radius:50%}' +
    '.lz-sheen{position:absolute;top:-25%;bottom:-25%;left:-61.8%;width:38.2%;background:linear-gradient(90deg,transparent,rgba(255,255,255,.236),transparent);transform:translateX(0)}' +
    '.lz-star{position:absolute;width:6.18%;height:6.18%;margin:-3.09% 0 0 -3.09%;opacity:0;border-radius:50%;background:radial-gradient(circle,var(--tx) 0 14.6%,var(--ac2) 23.6%,transparent 61.8%)}' +
    '.lz-glow{position:absolute;inset:-14.6%;border-radius:50%;pointer-events:none;z-index:0;opacity:.382;background:radial-gradient(circle,var(--ac) 0,transparent 61.8%)}' +
    '.lz-wall{position:absolute;inset:-23.6%;border-radius:50%;pointer-events:none;z-index:0;opacity:0;background:radial-gradient(circle,transparent 61.8%,var(--ac2) 76.4%,transparent 90.2%)}';
  function style() { if (document.getElementById('lz-css')) return; var s = document.createElement('style'); s.id = 'lz-css'; s.textContent = CSS; document.head.appendChild(s); }
  var st = null;
  function out() { return st && st.ac && st.ac.state === 'running' && window.LogoSound ? st.ac.destination : null; }   // straight to the device: no master gain
  function rootHz() { return LogoSound.base() * 32; }   // five octaves over the live base (2^5, an interval)
  function lv(k) { return LogoSound.level(k); }   // amplitude matrix hook x quiet hours
  var PENTA = [0, 2, 4, 7, 9];   // major pentatonic, in semitones (a musical scale, not a tuning value)
  function sparkle(k, lvl, delay) {
    var o = out(); if (!o) return; var ac = st.ac, t = ac.currentTime + (delay || 0) + Math.pow(PHI, -10); lvl = lvl * lv('sparkle');
    var f = rootHz() * Math.pow(2, PENTA[((k % 5) + 5) % 5] / 12), d = Bs() * Math.pow(PHI, -5);
    [1, PHI * PHI, PHI * PHI * PHI].forEach(function (r, i) {   // a bright sine plus two quiet inharmonic partials (glass)
      var os = ac.createOscillator(), g = ac.createGain(); os.type = 'sine'; os.frequency.value = f * r;
      var a = lvl * Math.pow(PHI, -2 * i); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(a, t + Math.pow(PHI, -11)); g.gain.exponentialRampToValueAtTime(Math.max(a * Math.pow(PHI, -12), 1e-6), t + d * Math.pow(PHI, -i));
      os.connect(g); g.connect(o); os.start(t); os.stop(t + d * PHI); });
  }
  var noise = null;
  function swish(dur, lvl) {
    var o = out(); if (!o) return; var ac = st.ac, t = ac.currentTime + Math.pow(PHI, -10); lvl = lvl * lv('swish');
    if (!noise || noise.sampleRate !== ac.sampleRate) { var n = Math.floor(ac.sampleRate * dur); noise = ac.createBuffer(1, n, ac.sampleRate); var c = noise.getChannelData(0); for (var i = 0; i < n; i++) c[i] = Math.random() * 2 - 1; }
    var s = ac.createBufferSource(), hp = ac.createBiquadFilter(), bp = ac.createBiquadFilter(), g = ac.createGain(), f0 = rootHz();
    s.buffer = noise; hp.type = 'highpass'; hp.frequency.value = f0; bp.type = 'bandpass'; bp.Q.value = G;
    bp.frequency.setValueAtTime(f0 * PHI, t); bp.frequency.exponentialRampToValueAtTime(f0 * PHI * PHI * PHI, t + dur);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(lvl, t + dur * G * G); g.gain.linearRampToValueAtTime(0, t + dur);
    s.connect(hp); hp.connect(bp); bp.connect(g); g.connect(o); s.start(t); s.stop(t + dur);
  }
  function later(fn, ms) { var h = setTimeout(function () { if (!st) return; st.timers.splice(st.timers.indexOf(h), 1); fn(); }, ms); st.timers.push(h); }
  function anim(el, k, o) { try { var a = el.animate(k, o); st.anims.push(a); return a; } catch (e) { return null; } }
  function snd(n) { try { if (st && st.snd) st.snd.event(n); } catch (e) {} }
  function music() {
    if (!st || !st.ac || !st.out) return; var me = st;
    function go() { if (me !== st || me.snd || !window.LogoSound) return; try { me.snd = LogoSound.create(me.ac, me.out, { logo: me.id, events: { 'star-drop': Math.pow(PHI, -3), shimmer: Math.pow(PHI, -3) } }); } catch (e) {} }
    if (window.LogoSound) return go();
    var sc = document.createElement('script'); sc.src = 'js/logo-sound.js?v=3'; sc.async = true; sc.onload = go; document.head.appendChild(sc);
  }
  function shimmer() {
    if (!st || !st.sheen) return; snd('shimmer'); var dur = T(-1);
    anim(st.sheen, [{ transform: 'translateX(0)' }, { transform: 'translateX(' + (PHI * PHI * 100).toFixed(1) + '%)' }], { duration: dur, easing: 'ease-in-out' });
    swish(dur / 1000, 1); later(shimmer, T(1));
  }
  function twinkle(k) {
    var el = st.stars[k - 1]; if (!el) return;
    anim(el, [{ opacity: 0, transform: 'scale(.382)' }, { opacity: 1, transform: 'scale(1)' }, { opacity: 0, transform: 'scale(.382)' }], { duration: T(-1), easing: 'ease-in-out' });
    sparkle(k, 1, 0); later(function () { twinkle(k); }, T(k - 1));
  }
  function bgStars(cv) {
    var w = cv.clientWidth, h = cv.clientHeight, d = Math.min(PHI, window.devicePixelRatio || 1); if (!w || !h) return;
    cv.width = Math.round(w * d); cv.height = Math.round(h * d); var x = cv.getContext('2d'); x.scale(d, d);
    var n = 89, c = cssv('--tx') || '#fff';   // 89 = Fibonacci
    for (var i = 0; i < n; i++) { var a = 2 * Math.PI * ((i * G) % 1), r = Math.sqrt((i + G) / n) * Math.max(w, h) / 2;
      x.globalAlpha = Math.pow(PHI, -3 - (i % 3)); x.fillStyle = c; x.beginPath(); x.arc(w / 2 + r * Math.cos(a), h / 2 + r * Math.sin(a), Math.max(w, h) * Math.pow(PHI, -12), 0, 2 * Math.PI); x.fill(); }
  }
  function start(fig, ac, o) {
    stop(); o = o || {}; if (!fig) return; style();
    st = { fig: fig, ac: ac || null, id: o.logo || 'kid-logo', timers: [], anims: [], stars: [], snd: null, out: null };
    var cv = document.createElement('canvas'); cv.className = 'lz-bg'; cv.setAttribute('aria-hidden', 'true'); fig.insertBefore(cv, fig.firstChild); st.cv = cv;
    var glow = document.createElement('div'); glow.className = 'lz-glow'; fig.insertBefore(glow, cv.nextSibling); st.glow = glow;
    var wall = document.createElement('div'); wall.className = 'lz-wall'; fig.insertBefore(wall, glow.nextSibling); st.wall = wall;
    var fx = document.createElement('div'); fx.className = 'lz-fx'; fx.setAttribute('aria-hidden', 'true'); fig.appendChild(fx); st.fx = fx;
    requestAnimationFrame(function () { if (st && st.cv === cv) bgStars(cv); });
    if (ac) { st.out = ac.destination; music(); }
    if (RM.matches) { glow.style.opacity = String(G); return; }
    var sheen = document.createElement('i'); sheen.className = 'lz-sheen'; fx.appendChild(sheen); st.sheen = sheen;
    for (var k = 1; k <= 5; k++) { var s = document.createElement('i'); s.className = 'lz-star'; var a = 2 * Math.PI * ((k * G) % 1), r = 50 * (1 + Math.pow(PHI, -3));
      s.style.left = (50 + r * Math.cos(a)).toFixed(1) + '%'; s.style.top = (50 + r * Math.sin(a)).toFixed(1) + '%'; fig.appendChild(s); st.stars.push(s); }
    anim(glow, [{ opacity: Math.pow(PHI, -2), transform: 'scale(1)' }, { opacity: G, transform: 'scale(' + (1 + Math.pow(PHI, -4)).toFixed(3) + ')' }, { opacity: Math.pow(PHI, -2), transform: 'scale(1)' }], { duration: T(2), iterations: Infinity, easing: 'ease-in-out' });
    anim(wall, [{ opacity: 0 }, { opacity: Math.pow(PHI, -3) }, { opacity: 0 }], { duration: T(2), delay: T(-1), iterations: Infinity, easing: 'ease-in-out' });
    later(shimmer, T(0));
    for (var j = 1; j <= 5; j++) (function (k) { later(function () { twinkle(k); }, T(k - 1) * ((k * G) % 1)); })(j);
  }
  function stop() {
    if (!st) return; var s = st; st = null;
    s.timers.forEach(clearTimeout); s.anims.forEach(function (a) { try { a.cancel(); } catch (e) {} });
    if (s.snd) { try { s.snd.stop(Math.pow(PHI, -2)); } catch (e) {} }
    [s.cv, s.glow, s.wall, s.fx].concat(s.stars).forEach(function (e) { if (e && e.parentNode) e.parentNode.removeChild(e); });
  }
  window.LogoZoomLife = { start: start, stop: stop, running: function () { return !!st; } };
})();
