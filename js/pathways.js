/* PATHWAYS (Danny 2026-10-25 16:12 AWST): instead of Keep / Change, every part of a piece offers two concrete directions,
   "this way or that way?", each with a plain description, and Roll shows other pairs. No yes/no, no like/dislike.
   Directions are phi-ratio steps away from the CURRENT value, one each way: pair k steps by PHI^STEP[k] with STEP the
   ladder 1/PHI^2, 1/PHI, 1, PHI (a touch / a bit / much / way). Nothing fixed: timings are PHI^(n + own step) s and
   move by PHI^(+-step); sizes and levels multiply by PHI^(+-step); colours move lightness by PHI^(+-step) of the room left, or hue by
   360/PHI^4 * PHI^(j/2). Parts with no scale (direction, emojis, style) offer pairs from their own list of directions.
   The page shows only the words. The value behind each direction (e.g. "4.78 s -> 2.95 s (x PHI^-1)") goes with the
   encrypted answers for Danny. Shown as ROLL PAIRS (love most / like least, below). Propose-only: picking a direction changes nothing on the page. No personal data. */
(function () {
  'use strict';
  if (window.Pathways) return;
  var PHI = 1.6180339887, OWN = 0.25;
  try { var v = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--own-step')); if (isFinite(v)) OWN = v; } catch (e) {}
  var STEP = [-2, -1, 0, 1].map(function (j) { return Math.pow(PHI, j); }), ADV = ['a touch', 'a bit', 'much', 'way'];
  var P = function (n) { return Math.pow(PHI, n + OWN); }, f2 = function (x) { return x >= 10 ? x.toFixed(1) : x.toFixed(2); };
  var cap = function (s) { return s.charAt(0).toUpperCase() + s.slice(1); };
  // up / dn: the two ways, {x} = how far. Every b is the page's own current value (its phi expression where it has one). n: timing on the ladder (up = quicker). b + u: a level (up = more). c: a colour. alt: a list of directions.
  var T = function (up, dn, n) { return { up: up, dn: dn, n: n }; }, B = function (up, dn, b, u) { return { up: up, dn: dn, b: b, u: u }; };
  var M = {
    'bot/colour': { c: '#0B1F4D' },
    'bot/breathe': T('{x} quicker, bouncy little breaths', '{x} slower, calm, deep breaths', 3),
    'bot/breathe-size': B('{x} bigger, fuller breaths', '{x} smaller, gentler breaths', 100 * Math.pow(PHI, -7), '%'),
    'bot/blink': T('Blinks {x} more often, chatty and awake', 'Blinks {x} less often, sleepy and slow', 2),
    'bot/wobble': T('{x} quicker, jiggly wobble', '{x} slower, swaying wobble', 4),
    'bot/wobble-size': B('{x} bigger tilts, more wobbly', '{x} smaller tilts, steadier', Math.pow(PHI, 1.5), '°'),
    'bot/shine': T('The shine sweeps across {x} more often', 'The shine sweeps across {x} less often', 5),
    'bot/hop': T('Hops {x} more often, full of beans', 'Hops {x} less often, relaxed', 6),
    'bot/hop-size': B('{x} higher, springier hops', '{x} lower, softer hops', 100 * Math.pow(PHI, -4), '%'),
    'orbit/which': { alt: [['🐉 🔥 ⚡', 'Dragon, fire and lightning'], ['🐠 🐙 🐚', 'Sea creatures'], ['🛸 👾 🌌', 'Aliens and deep space'], ['⚽ 🏀 🏆', 'Sport'], ['🎮 🕹️ 💾', 'Gaming'], ['🦖 🌋 🦴', 'Dinosaurs'], ['🤖 ⚙️ 🔋', 'Robots and gears'], ['🏎️ 🏁 🔧', 'Racing']] },
    'orbit/orbit-speed': T('Laps {x} faster, zippier', 'Laps {x} slower, floatier', 7.5),
    'orbit/orbit-dir': { alt: [['All three go the same way round'], ['Each one swaps to the other way'], ['They take turns changing direction'], ['One zooms the opposite way to the others']] },
    'orbit/orbit-size': B('{x} bigger, wider loops', '{x} smaller, tighter loops', 100 * Math.pow(PHI, -3), '% of the screen wide'),
    'orbit/spin': T('They spin {x} faster', 'They spin {x} slower', 6),
    'orbit/fade': T('They fade in and out {x} quicker', 'They fade in and out {x} slower', 5),
    'orbit/bright': B('{x} brighter, easier to see', '{x} fainter, more in the background', 100 * Math.pow(PHI, -2), '% at the brightest'),
    'light/colour': { c: '#7FD1A8' },
    'light/idle': T('The quiet glow is {x} quicker', 'The quiet glow is {x} slower and calmer', 5),
    'light/new': T('A new message makes it glow {x} quicker', 'A new message makes it glow {x} slower', 3),
    'light/urgent': T('A waiting question makes it glow {x} quicker', 'A waiting question makes it glow {x} slower', 1),
    'light/range': B('It stays {x} brighter when dim', 'It gets {x} darker when dim', 100 * Math.pow(PHI, -2), '% at the dimmest'),
    'tide/colour': { c: '#8FB3D1' },
    'tide/flow': T('The wave flows {x} faster', 'The wave flows {x} slower', 6),
    'tide/flow-dir': { alt: [['Flows left to right instead'], ['Sways back and forth'], ['Two waves flowing past each other'], ['Flows in short bursts, then rests']] },
    'tide/swell': T('It gets brighter and softer {x} quicker', 'It gets brighter and softer {x} slower', 4),
    'tide/height': B('{x} taller, choppier waves', '{x} flatter, calmer waves', 6, ' px'),
    'dj/bpm': B('{x} faster, more energetic beat', '{x} slower, more chilled beat', 60 * PHI, ' BPM'),
    'dj/fade': T('{x} quicker crossfades between songs', '{x} longer, smoother crossfades', 5),
    'dj/track': T('{x} shorter tracks, more variety', '{x} longer tracks, more time with each', 9),
    'dj/volume': B('{x} louder', '{x} quieter', 55, '%'),
    'dj/genre': { alt: [['More chill and dreamy'], ['More upbeat and punchy'], ['More epic, like a movie'], ['More retro, like an arcade'], ['More electronic'], ['More like real instruments']] },
    'dj/pumps': { alt: [['The music follows the weather more'], ['The music follows your mood more'], ['The music follows the time of day more'], ['The music follows how busy the page is more']] },
    'colours/bg': { c: '#0B1A33' }, 'colours/panel': { c: '#102447' }, 'colours/accent': { c: '#9FB8E0' },
    'colours/text': { alt: [['Soft blue-white', '', '#E3ECFA'], ['Warm cream', '', '#FFF6E0'], ['Minty white', '', '#E8FFF0'], ['Lavender white', '', '#F3EDFF']] },
    'rhythm/step': B('Everything moves {x} quicker', 'Everything moves {x} calmer', 1, '× page speed'),
    'rhythm/dial': B('The whole page runs {x} faster', 'The whole page runs {x} slower', 0.75, ' dial'),
    'rhythm/pump': { alt: [['Even calmer at night'], ['The same speed day and night'], ['Calmer on rainy days too'], ['Calmer when the moon is full']] },
    'rhythm/amount': B('{x} more things moving', '{x} fewer things moving', 4, ' moving pieces')
  };
  var GENERIC = { Faster: 'quicker', Slower: 'slower', Bigger: 'bigger', Smaller: 'smaller', Brighter: 'brighter', Fainter: 'fainter', Softer: 'softer', Louder: 'louder', Quieter: 'quieter', Quicker: 'quicker', Longer: 'longer', Shorter: 'shorter', More: 'more', Less: 'less' };
  function meta(pc, p) {
    var m = M[pc.id + '/' + p.id]; if (m) return m;
    if (p.k === 'colour') return { c: '#0B1F4D' };
    if (Array.isArray(p.k)) { var w = p.k.filter(function (x) { return GENERIC[x]; }); if (w.length >= 2) return B('{x} ' + GENERIC[w[0]], '{x} ' + GENERIC[w[1]], 1, '×'); }
    return { alt: [['Go the other way'], ['Mix it up']] };
  }
  // ---- colours: hex <-> HSL, steps are phi ratios ----
  function hsl(hex) { var r = parseInt(hex.slice(1, 3), 16) / 255, g = parseInt(hex.slice(3, 5), 16) / 255, b = parseInt(hex.slice(5, 7), 16) / 255, mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn, h = 0, s = 0;
    if (d) { s = d / (1 - Math.abs(2 * l - 1)); h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h *= 60; if (h < 0) h += 360; } return [h, s, l]; }
  function hex(h, s, l) { var c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = l - c / 2, rgb = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
    return '#' + rgb.map(function (v) { var t = Math.round((v + m) * 255); return ('0' + Math.max(0, Math.min(255, t)).toString(16)).slice(-2); }).join('').toUpperCase(); }
  var HUES = [[15, 'red'], [45, 'orange'], [70, 'yellow'], [160, 'green'], [195, 'teal'], [255, 'blue'], [290, 'purple'], [335, 'pink'], [360, 'red']];
  var hueName = function (h) { for (var i = 0; i < HUES.length; i++) if (h < HUES[i][0]) return HUES[i][1]; return 'red'; };
  // ---- the pairs for one part: [{t, sw?, val}, {t, sw?, val}] ----
  function pair(pc, p, k) {
    var m = meta(pc, p), j = k % STEP.length, s = STEP[j], x = ADV[j], tag = function (sg) { return ' (× φ^' + sg + s.toFixed(3) + ')'; };
    if (m.alt) { var L = m.alt, a = L[(2 * k) % L.length], b = L[(2 * k + 1) % L.length];
      var one = function (o) { return { t: o[1] ? o[0] + '  ' + o[1] : o[0], sw: o[2], val: o[2] || o[0] }; }; return [one(a), one(b)]; }
    var up = function (str) { return cap(str.replace('{x}', x)); };
    if (m.c) {
      var c = hsl(m.c), h = c[0], sa = c[1], l = c[2];
      if (j % 2 === 0) {   // lighter / deeper, lightness by PHI^(+-s) (toward white or black as a ratio of the room left)
        var lu = l < 0.5 ? Math.min(0.5, l * Math.pow(PHI, s)) : 1 - (1 - l) / Math.pow(PHI, s), ld = l / Math.pow(PHI, s), hu = hex(h, sa, lu), hd = hex(h, sa, ld);
        return [{ t: cap(x) + ' lighter shade', sw: hu, val: m.c + ' → ' + hu }, { t: cap(x) + ' deeper shade', sw: hd, val: m.c + ' → ' + hd }];
      }
      var dh = 360 / Math.pow(PHI, 4) * Math.pow(PHI, (j - 1) / 2), s2 = Math.max(sa, 1 / (PHI * PHI * PHI)), h1 = (h + dh) % 360, h2 = (h - dh + 360) % 360, c1 = hex(h1, s2, l), c2 = hex(h2, s2, l);
      return [{ t: 'Shift ' + x + ' toward ' + hueName(h1), sw: c1, val: m.c + ' → ' + c1 }, { t: 'Shift ' + x + ' toward ' + hueName(h2), sw: c2, val: m.c + ' → ' + c2 }];
    }
    if (m.n != null) { var t0 = P(m.n), tq = t0 / Math.pow(PHI, s), ts = t0 * Math.pow(PHI, s);
      return [{ t: up(m.up), val: f2(t0) + ' s → ' + f2(tq) + ' s' + tag('-') }, { t: up(m.dn), val: f2(t0) + ' s → ' + f2(ts) + ' s' + tag('') }]; }
    var bu = m.b * Math.pow(PHI, s), bd = m.b / Math.pow(PHI, s), fx = function (v) { return (Math.abs(v) >= 10 ? v.toFixed(1) : v.toFixed(2)) + (m.u || ''); };
    return [{ t: up(m.up), val: fx(m.b) + ' → ' + fx(bu) + tag('') }, { t: up(m.dn), val: fx(m.b) + ' → ' + fx(bd) + tag('-') }];
  }
  var count = function (pc, p) { var m = meta(pc, p); return m.alt ? Math.max(1, Math.floor(m.alt.length / 2)) : STEP.length; };
  // ---- the view: two direction tiles + Roll, in the page's own tile style ----
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  // ROLL PAIRS (Kids Club standard, Danny 2026-10-25 16:20 AWST): two roll boxes per part. LEFT = the way he loves most,
  // RIGHT = the way he likes least. Each box rolls through every offered direction for that part (all pairs, both ways)
  // on golden-ratio steps (index += len / PHI, so a roll never repeats a short loop), the right box skips the left pick.
  // "Lock it in" (or Enter inside the part) saves the pair and moves to the next part. Picks are kept on Back.
  var GA = 1 / PHI;
  function all(pc, p) { var L = []; for (var k = 0; k < count(pc, p); k++) pair(pc, p, k).forEach(function (o) { if (!L.some(function (x) { return x.t === o.t; })) L.push(o); }); return L; }
  function render(box, pc, p, ans, save, onLock) {
    var L = all(pc, p), rk = '_r_' + p.id, cur = ans[p.id];
    var at = function (t) { for (var i = 0; i < L.length; i++) if (L[i].t === t) return i; return -1; };
    if (!ans[rk] || ans[rk].length !== 2) ans[rk] = cur && cur.love ? [Math.max(0, at(cur.love.t)), Math.max(0, at(cur.least.t))] : [Math.min(2, L.length - 1) & ~1, Math.min(3, L.length - 1)];
    if (ans[rk][0] === ans[rk][1]) ans[rk][1] = (ans[rk][0] + 1) % L.length;
    function roll(side) {
      var r = ans[rk], other = r[1 - side], i = r[side], tries = 0;
      do { i = (i + Math.max(1, Math.round(L.length * GA))) % L.length; tries++; } while ((i === other || i === r[side]) && tries <= L.length);
      if (i === other) i = (other + 1) % L.length;
      r[side] = i; if (ans[p.id] && ans[p.id].love) delete ans[p.id].locked; save(); draw(side);
    }
    function lock() { var r = ans[rk]; ans[p.id] = { love: L[r[0]], least: L[r[1]], locked: true }; save(); draw(); if (onLock) onLock(); }
    function draw(swapped) {
      var r = ans[rk]; cur = ans[p.id]; box.innerHTML = '';
      var row = document.createElement('div'); row.className = 'pw-row'; box.appendChild(row);
      [['I love this most', 'love'], ['Not really me', 'least']].forEach(function (lab, side) {
        var o = L[r[side]], col = document.createElement('div'); col.className = 'pw-col ' + lab[1];
        var l = document.createElement('span'); l.className = 'pw-lab'; l.textContent = (side ? '💭 ' : '💙 ') + lab[0]; col.appendChild(l);
        var b = document.createElement('button'); b.type = 'button'; b.className = 'pw-way' + (swapped === side ? ' swap' : '');
        b.setAttribute('aria-label', lab[0] + ': ' + o.t + '. Tap to roll another way.');
        b.setAttribute('aria-pressed', String(!!(cur && cur.locked)));
        b.innerHTML = (o.sw ? '<span class="pw-sw" style="background:' + esc(o.sw) + '"></span>' : '<span class="pw-ar" aria-hidden="true">' + (side ? '↘' : '↗') + '</span>') + '<span>' + esc(o.t) + '</span>';
        b.onclick = function () { roll(side); };
        col.appendChild(b);
        var rb = document.createElement('button'); rb.type = 'button'; rb.className = 'btn roll pw-roll'; rb.innerHTML = '&#x1F3B2; Roll'; rb.setAttribute('aria-label', 'Roll the ' + (side ? 'like least' : 'love most') + ' box for ' + p.l);
        rb.onclick = function () { roll(side); }; col.appendChild(rb);
        row.appendChild(col);
      });
      var lk = document.createElement('button'); lk.type = 'button'; lk.className = 'btn pw-lock'; lk.textContent = cur && cur.locked ? '✓ Locked in' : 'Lock it in ↵';
      lk.setAttribute('aria-pressed', String(!!(cur && cur.locked))); lk.onclick = lock; box.appendChild(lk);
      if (cur && typeof cur === 'string' && cur !== 'Keep') { var e = document.createElement('p'); e.className = 'pw-was'; e.textContent = 'Your earlier pick: ' + cur; box.appendChild(e); }
      else if (cur && cur.t && !cur.love) { var e2 = document.createElement('p'); e2.className = 'pw-was'; e2.textContent = 'Your earlier pick: ' + cur.t; box.appendChild(e2); }
    }
    box.onkeydown = function (e) { if (e.key === 'Enter' && !(e.target && /^(INPUT|TEXTAREA)$/.test(e.target.tagName))) { e.preventDefault(); lock(); } };
    draw();
  }
  // label for the encrypted answers: the words he picked plus the value behind them (for Danny)
  function label(a) { if (!a) return 'no pick (stays as it is)'; if (typeof a === 'string') return a;
    if (a.love) return 'love most: ' + a.love.t + ' [' + a.love.val + '] · like least: ' + a.least.t + ' [' + a.least.val + ']' + (a.locked ? '' : ' (not locked in)');
    return a.t + ' [' + a.val + ']'; }
  var s = document.createElement('style'); s.id = 'pathways-css';
  s.textContent = '.pz-ch>div{flex:1 1 100%}.pw-row{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:2px}' +
    '.pz-ch .pw-way{display:flex;gap:8px;align-items:flex-start;text-align:left;border:2px solid var(--ln);background:var(--sf2);color:var(--tx);border-radius:12px;padding:10px;min-height:56px;font-size:.92rem;line-height:1.3;font-weight:400}' +
    '.pz-ch .pw-way[aria-pressed=true]{background:var(--sf2);color:var(--tx);border-color:var(--ac2);box-shadow:0 0 0 3px rgba(227,236,250,.3);font-weight:700}.pz-ch .pw-way.swap{animation:swap var(--ph-2) ease-out}' +
    '.pw-ar{font-size:1.1rem;line-height:1;color:var(--ac)}.pw-sw{flex:none;width:22px;height:22px;border-radius:6px;border:1px solid rgba(255,255,255,.5)}' +
    '.pw-col{display:flex;flex-direction:column;gap:6px}.pw-lab{font-size:.8rem;font-weight:700;color:var(--ac2)}.pw-col.least .pw-lab{color:var(--mu)}.pz-ch .pw-way{flex:1}' +
    '.pz-ch .pw-lock{margin-top:8px;border-radius:999px;padding:7px 16px;font-size:.9rem}.pz-ch .pw-lock[aria-pressed=true]{background:var(--ok);color:var(--bg);border-color:var(--ok)}' +
    '.pz-ch .pw-roll{margin-top:0;align-self:flex-start;padding:6px 12px;font-size:.88rem;border-radius:999px}.pw-was{margin:4px 0 0;font-size:.82rem;color:var(--mu)}' +
    '.pw-own{display:flex;align-items:center;gap:8px;font-size:.85rem;color:var(--mu);margin-top:4px}.pw-own input[type=text]{flex:1;min-width:0}' +
    '@media (max-width:360px){.pw-row{grid-template-columns:1fr}}';
  document.head.appendChild(s);
  window.Pathways = { pair: pair, count: count, all: all, render: render, label: label, steps: STEP.slice() };
})();
