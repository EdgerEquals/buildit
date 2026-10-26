/* "IS THIS THE CHANGE YOU WANT?" (Danny's auto-authority rule 3): once his picks are live, the quiz orb's own spotlight
   (QuizOrb.spotlight: the part grows and glows, js/quiz-orb.js) points at each changed piece in turn and asks, gently.
   Yes / Not quite. Answers stay on this device ('buildit.pickscheck'); if anything is "Not quite", ONE encrypted answers
   message goes to his bot and Dad through the page's own send path, naming only the pieces. Skippable (Later). Loads at
   tier 2 after unlock; runs once per round of live picks (ROUND). Nothing personal in this file. */
(function () {
  'use strict';
  if (window.PicksCheck) return;
  var ROUND = 'picks-2026-10-26', KEY = 'buildit.pickscheck', PHI = 1.6180339887;
  var LIST = [   // the pieces that changed this round, the spot on the page, and the change in his own picked words
    ['Your bot', '#h-av', 'Your bot is deeper blue now, with bigger, quicker breaths, and it blinks much more often.'],
    ['Orbiting emojis', '.orb-layer .orb-e', 'Robots, gears and a battery now loop much faster in bigger ovals, all the same way round.'],
    ['Status light', '.led', 'The status light is a bit bluer, glows way quicker and pulses faster.'],
    ['Tide line', '.tide', 'The tide line is a much deeper blue and flows much faster.'],
    ['DJ', '#dj-pill', 'The DJ plays a bit faster, with much longer crossfades and a bit shorter tracks.'],
    ['Page colours and speed', '#q-start', 'The background leans purple, the panels are much lighter, and everything moves quicker.']
  ];
  function rec() { try { return JSON.parse(localStorage.getItem(KEY) || 'null') || {}; } catch (e) { return {}; } }
  function put(r) { try { localStorage.setItem(KEY, JSON.stringify(r)); } catch (e) {} }
  function ready() {
    var vq = document.getElementById('view-q');
    return window.BI && BI.ready() && window.QuizOrb && QuizOrb.spotlight && (!window.Onboard || Onboard.done()) && !document.getElementById('cm-ask') && !(vq && vq.hidden) && !(window.Onboard && Onboard.running && Onboard.running());
  }
  function finish(r) {
    r.done = 1; put(r);
    var no = LIST.filter(function (x, i) { return r.a && r.a[i] === 1; }).map(function (x) { return x[0]; });
    if (no.length && BI.send) BI.send('[Answers · Is this the change you want?] Not quite yet: ' + no.join(', '), { kind: 'answers', part: 'Is this the change you want?' });
  }
  function ask(i) {
    var r = rec(); if (r.round !== ROUND) r = { round: ROUND, a: {} };
    while (i < LIST.length && !document.querySelector(LIST[i][1])) i++;
    if (i >= LIST.length) { finish(r); return; }
    var x = LIST[i];
    QuizOrb.spotlight(x[1], x[2] + ' Is this the change you want?', { choices: ['Yes, love it', 'Not quite'], onPick: function (k) {
      r.a[i] = k; put(r); setTimeout(function () { ask(i + 1); }, Math.pow(PHI, -1) * 1000);
    } });
  }
  function go() { var r = rec(); if (r.round === ROUND && r.done) return; if (!ready()) { setTimeout(go, Math.pow(PHI, 5) * 1000); return; } ask(0); }
  document.addEventListener('bi:lock', function () { if (window.QuizOrb && QuizOrb.home) try { QuizOrb.home(); } catch (e) {} });
  window.PicksCheck = { round: ROUND, start: function () { ask(0); } };
  setTimeout(go, Math.pow(PHI, 4) * 1000);
})();
