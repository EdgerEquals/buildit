/* "Your page, piece by piece": for every piece already on screen, a card with the piece live, its real parameters
   (read from the same phi numbers the page runs on) and two directions for each one ("this way or that way?", js/pathways.js), then a short physics
   challenge on the terms behind it (multiple choice, true/false, explain it in your own words), with the right answer
   explained as "here's the term for that" (never marked wrong). Name-this questions go through the quiz orb
   (js/quiz-orb.js) with 2 / 3 / 5 / 10 options picked by the on-device learner model (js/learner.js, docs/learning-model.md).
   Each finished piece goes encrypted through the page's own send path (window.BI.send, kind:'answers') as a
   PROPOSE-ONLY request: nothing picked here changes the page; it all waits for Danny's yes. Progress is kept encrypted
   in localStorage ('buildit-pieces'). Nothing personal in this file. */
(function () {
  'use strict';
  if (window.Pieces) return;
  var PHI = 1.6180339887, QK = 'buildit-pieces', QREV = 2;
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
  // Year 7 wording: short sentences, everyday words, the real term with a one-line meaning. Every number is read from the
  // same phi ladder the page runs on. "ar" = how you would build that part on an Arduino (values worked out from the same numbers).
  var ms = function (n) { return Math.round(P(n) * 1000); };
  var LOW = Math.round(255 / (PHI * PHI));   // 38.2% brightness as an analogWrite value
  function PIECES() {
    var o0 = orbitOf(0), o1 = orbitOf(1), o2 = orbitOf(2);
    return [
      { id: 'bot', name: 'Your bot', icon: '🤖', demo: function () { return '<img src="img/bot-avatar.svg?v=2" width="88" height="88" alt="">'; },
        lead: 'The shiny navy ball at the top, in the chat and at the bottom. It breathes, blinks, wobbles, shines and hops. Each move has its own beat.',
        params: [
          { id: 'colour', l: 'Colour', v: 'navy #0B1F4D, white eyes', k: 'colour', h: 'The body colour. The eyes stay white.' },
          { id: 'breathe', l: 'Breathing (grows and shrinks)', v: per(3), k: SPEED, h: 'Period = how long one full breath takes. Hz = how many breaths per second.',
            ar: 'Fade an LED up and down once every ' + ms(3) + ' ms with analogWrite(pin, 0–255). That is PWM.' },
          { id: 'breathe-size', l: 'Breathing size', v: '3.4% (φ⁻⁷)', k: SIZE, h: 'Amplitude = how big the move is. Here it grows 3.4% and back.' },
          { id: 'blink', l: 'Blink', v: per(2), k: SPEED, h: 'One blink cycle takes this long.',
            ar: 'LED blink sketch: digitalWrite(LED_BUILTIN, HIGH); delay(' + Math.round(ms(2) / 2) + '); then LOW; delay(' + Math.round(ms(2) / 2) + ');' },
          { id: 'wobble', l: 'Wobble (tilts side to side)', v: per(4) + ' · ±2.06° (φ^1.5)', k: SPEED, h: 'It tilts a tiny bit left, then right, then back.',
            ar: 'A servo can do this: myServo.write(' + (90 - Math.round(Math.pow(PHI, 1.5))) + ') then myServo.write(' + (90 + Math.round(Math.pow(PHI, 1.5))) + '). write() takes whole degrees, so ±2.06° becomes ±2°.' },
          { id: 'wobble-size', l: 'Wobble size', v: '±2.06°', k: SIZE, h: 'How far it tilts each way, in degrees.' },
          { id: 'shine', l: 'Shine sweeping across', v: per(5), k: SPEED, h: 'A light shine slides across the ball.' },
          { id: 'hop', l: 'Hop', v: per(6) + ' · jumps 14.6% of its height (φ⁻⁴)', k: SPEED, h: 'A small jump, then it lands softly.' },
          { id: 'hop-size', l: 'Hop height', v: '14.6% (φ⁻⁴)', k: SIZE, h: 'How high it jumps, as a part of its own height.' }
        ],
        quiz: [
          { t: 'Period', q: 'Your bot breathes once every ' + f2(P(3)) + ' seconds. What is the name for "how long one full cycle takes"?', o: ['period', 'frequency', 'amplitude', 'phase'], a: 0,
            x: 'Period (T) = how long one full cycle takes, in seconds. Frequency = how many cycles happen each second.' },
          { t: 'Frequency', q: 'How many breaths per second is that?', o: [(1 / P(3)).toFixed(2) + ' Hz', f2(P(3)) + ' Hz', '1 Hz', (P(3) * 60).toFixed(0) + ' Hz'], a: 0,
            x: 'f = 1 / T. So 1 ÷ ' + f2(P(3)) + ' ≈ ' + (1 / P(3)).toFixed(2) + ' breaths each second. Hz (hertz) means "per second".' },
          { t: 'Period vs frequency', tf: true, q: 'True or false: if the breathing gets slower, the frequency goes up.', a: 1,
            x: 'False. Slower = a longer period = fewer cycles each second. So the frequency goes down. They always move opposite ways.' },
          { t: 'delay()', q: 'On an Arduino, which command makes the board wait, so you can blink an LED every ' + f2(P(2)) + ' s?', o: ['delay()', 'analogWrite()', 'tone()', 'Servo.write()'], a: 0,
            x: 'delay(ms) = wait this many milliseconds. Half the blink on, half off: delay(' + Math.round(ms(2) / 2) + ') twice makes one ' + f2(P(2)) + ' s blink.' },
          { t: 'Servo.write()', q: 'You want a real motor to wobble like your bot. Which Arduino command sets a servo to an angle?', o: ['Servo.write()', 'delay()', 'digitalWrite()', 'tone()'], a: 0,
            x: 'Servo.write(angle) = turn the servo to that angle, 0 to 180 degrees. 90 is the middle.' }
        ] },
      { id: 'orbit', name: 'Orbiting emojis', icon: '🚀', demo: function (el) { if (window.Orbit) { var h = document.createElement('div'); h.className = 'dm-orbit'; el.appendChild(h); Orbit.demo(h, 70, 34); return null; } return '<span style="font-size:2rem">🚀 ⭐ 🌍</span>'; },
        lead: 'Three space emojis loop around your page in ovals. They spin slowly and fade in and out. Each path is two swings at once: one side to side, one up and down.',
        params: [
          { id: 'which', l: 'Which emojis', v: o0.e + ' ' + o1.e + ' ' + o2.e, k: 'text', h: 'Type the emojis you want instead.' },
          { id: 'orbit-speed', l: 'Time for one lap', v: o0.e + ' ' + f2(P(7)) + ' s · ' + o1.e + ' ' + f2(P(7.5)) + ' s · ' + o2.e + ' ' + f2(P(8)) + ' s', k: SPEED, h: 'φ^' + (7 + OWN) + ', φ^' + (7.5 + OWN) + ', φ^' + (8 + OWN) + ' s. A lap is one period.' },
          { id: 'orbit-dir', l: 'Direction', v: o0.e + ' ' + o0.dir + ' · ' + o1.e + ' ' + o1.dir + ' · ' + o2.e + ' ' + o2.dir, k: DIR, h: 'Which way round each one goes.' },
          { id: 'orbit-size', l: 'Size of the ovals', v: '23.6% of the screen wide (1/φ³), 14.6% tall (1/φ⁴); each one φ^-0.5 smaller', k: SIZE, h: 'Wider than tall, so the path is an oval.' },
          { id: 'spin', l: 'Spinning on the spot', v: per(6) + ', two one way, one the other', k: SPEED, h: 'Each emoji also turns around its own middle.' },
          { id: 'fade', l: 'Fading in and out', v: per(5) + ' · between 14.6% and 38.2% visible', k: SPEED, h: 'They get see-through, then clearer, then see-through again.' },
          { id: 'bright', l: 'How see-through', v: 'faintest 14.6% (φ⁻⁴), brightest 38.2% (φ⁻²)', k: ['Keep', 'Brighter', 'Fainter'], h: '100% would be fully solid.',
            ar: 'For an LED, analogWrite(pin, ' + Math.round(255 / Math.pow(PHI, 4)) + ') to analogWrite(pin, ' + LOW + ') gives the same 14.6% to 38.2% brightness.' }
        ],
        quiz: [
          { t: 'Phase', q: 'The up-and-down swing is a quarter of a cycle behind the side-to-side swing. What is the name for "where a motion is up to in its cycle"?', o: ['phase', 'amplitude', 'damping', 'resonance'], a: 0,
            x: 'Phase = where something is up to in its cycle. A full cycle is 360°, so a quarter cycle is 90°.' },
          { t: 'Amplitude', tf: true, q: 'True or false: the side-to-side swing is wider than the up-and-down swing, so the path is an oval, not a circle.', a: 0,
            x: 'True. Amplitude = how big a swing is. Two equal swings make a circle. Unequal ones stretch it into an oval (an ellipse).' },
          { t: 'Lissajous curves', q: 'Challenge: if the up-and-down swing went twice as fast as the side-to-side one, what shape would the path make?', o: ['a figure-8 shape', 'a bigger oval', 'a straight line', 'a square'], a: 0,
            x: 'A 1 : 2 speed ratio draws a figure-8. These shapes are called Lissajous curves. Scientists see them on oscilloscopes.' },
          { t: 'Direction', q: 'What makes an emoji go the other way round?', o: ['Making the up-down swing a quarter cycle AHEAD instead of behind', 'Making it faster', 'Making the oval bigger', 'Changing the emoji'], a: 0,
            x: 'Direction comes from the phase difference. Up-down behind = one way round. Ahead = the other way.' }
        ] },
      { id: 'light', name: 'Status light', icon: '🟢', demo: function () { return '<span class="dm-led"></span>'; },
        lead: 'The small light at the bottom. It breathes slowly when things are quiet. It goes faster for a new message, and fastest when a question is waiting. It turns orange when you are offline.',
        params: [
          { id: 'colour', l: 'Colour', v: 'mint green #7FD1A8 (orange #FF9B73 offline)', k: 'colour', h: 'Green = online. Orange = offline.' },
          { id: 'idle', l: 'Quiet breathing', v: per(5), k: SPEED, h: 'Slow and calm when nothing is happening.' },
          { id: 'new', l: 'New message', v: per(3), k: SPEED, h: 'A shorter period, so it pulses faster.' },
          { id: 'urgent', l: 'Question waiting', v: per(1), k: SPEED, h: 'The fastest pulse: someone is waiting for you.' },
          { id: 'range', l: 'Dim to bright', v: '38.2% (φ⁻²) to 100%', k: ['Keep', 'Brighter', 'Softer'], h: 'How dim it gets, and how bright.',
            ar: 'On an Arduino: analogWrite(pin, ' + LOW + ') up to analogWrite(pin, 255). Duty cycle = how much of the time the pin is on: ' + LOW + '/255 ≈ 38.2%.' }
        ],
        quiz: [
          { t: 'Threshold', q: 'The light only turns orange once the connection really drops. What is the name for "a level you must cross before something changes"?', o: ['threshold', 'period', 'wavelength', 'frequency'], a: 0,
            x: 'Threshold = the trigger level. Below it, nothing happens. Cross it, and things switch. A smoke alarm works like this.' },
          { t: 'Frequency', tf: true, q: 'True or false: going from quiet breathing (' + f2(P(5)) + ' s) to a new message (' + f2(P(3)) + ' s) makes the frequency go UP.', a: 0,
            x: 'True. Shorter period = higher frequency. ' + (1 / P(5)).toFixed(3) + ' Hz becomes ' + (1 / P(3)).toFixed(2) + ' Hz, about φ² = 2.6 times faster.' },
          { t: 'PWM', q: 'An Arduino pin can only be fully ON or fully OFF. It dims an LED by switching on and off very fast. What is that called?', o: ['PWM', 'tone()', 'delay()', 'threshold'], a: 0,
            x: 'PWM (pulse width modulation) = switching on and off very fast. analogWrite(pin, 0–255) sets how much of the time it is on.' },
          { t: 'Duty cycle', q: 'analogWrite(pin, 255) keeps the pin on all the time. What is the name for "how much of the time it is on"?', o: ['duty cycle', 'period', 'pitch', 'wavelength'], a: 0,
            x: 'Duty cycle = the part of each cycle the pin is on. 255 = 100%. ' + LOW + ' ≈ 38.2%, the light\'s dimmest point.' },
          { t: 'In your own words', open: true, q: 'Explain the difference between period and frequency in your own words. An example helps!',
            x: 'One way to say it: period = how LONG one cycle takes (seconds). Frequency = how MANY cycles fit in one second (Hz). Multiply them and you always get 1.' }
        ] },
      { id: 'tide', name: 'Tide line', icon: '🌊', demo: function () { return '<span class="tide" style="position:relative;top:0;width:100%;height:8px;display:block"><i></i></span>'; },
        lead: 'The thin wave along the top of the footer. It flows sideways. It slowly gets brighter, then softer.',
        params: [
          { id: 'colour', l: 'Colour', v: 'light blue #8FB3D1', k: 'colour', h: 'The colour of the wave line.' },
          { id: 'flow', l: 'Flow speed (one wavelength)', v: per(6), k: SPEED, h: 'Wavelength = the distance from one wave top to the next.',
            ar: 'With millis() you can tell where you are in the cycle without stopping: (millis() % ' + ms(6) + ') / ' + ms(6) + '.0 goes from 0 to 1 again and again.' },
          { id: 'flow-dir', l: 'Flow direction', v: 'right to left', k: DIR, h: 'Which way the wave moves.' },
          { id: 'swell', l: 'Swell (brighter / softer)', v: per(4) + ' · 61.8% to 100%', k: SPEED, h: 'It gets brighter, then softer, over and over.' },
          { id: 'height', l: 'Wave height', v: '6 px peaks over an 80 px wavelength', k: SIZE, h: 'Amplitude = how tall the waves are.' }
        ],
        quiz: [
          { t: 'Wavelength', q: 'What is the name for "the distance from one wave top to the next"?', o: ['wavelength', 'amplitude', 'period', 'threshold'], a: 0,
            x: 'Wavelength (λ) = the length of one full wave. Wave speed = wavelength × frequency. This wave moves 80 px every ' + f2(P(6)) + ' s.' },
          { t: 'Damping', q: 'A swing that nobody pushes gets smaller each time, because it loses energy. What is that called?', o: ['damping', 'resonance', 'amplifying', 'refraction'], a: 0,
            x: 'Damping = losing energy, so the swing gets smaller. Car shock absorbers are dampers. The page\'s logo uses a damped spring.' },
          { t: 'Resonance', q: 'You push a swing at just the right beat, so it goes higher every time. What is that called?', o: ['resonance', 'damping', 'phase', 'a threshold'], a: 0,
            x: 'Resonance = pushing at the thing\'s own natural beat, so it grows each time. A singer can break a glass this way.' },
          { t: 'millis()', q: 'Which Arduino command tells you how many milliseconds since the board started, so you can time a wave without stopping?', o: ['millis()', 'delay()', 'analogWrite()', 'tone()'], a: 0,
            x: 'millis() = milliseconds since the board started. Unlike delay(), it never pauses your code, so lots of things can move at once.' }
        ] },
      { id: 'dj', name: 'DJ (sound)', icon: '🎵', demo: function () { return '<span class="dm-eq">' + '<i></i>'.repeat(9) + '</span>'; },
        lead: 'Tap ♫ DJ at the top. The music is made live by maths in your browser. There are no music files. It only plays after you tap Play.',
        params: [
          { id: 'bpm', l: 'Tempo', v: '60 ÷ φ^(−1 + s/2) beats per minute (about 97 BPM normally), kept between 62 and 157', k: SPEED, h: 'Tempo = how many beats per minute (BPM).',
            ar: 'One beat every 60000 ÷ BPM ms. At about 97 BPM that is about ' + Math.round(60000 / (60 * PHI)) + ' ms, which is φ⁻¹ s.' },
          { id: 'fade', l: 'Crossfade between tracks', v: f2(P(5)) + ' s (φ^' + (5 + OWN) + '), equal-power', k: ['Keep', 'Quicker', 'Longer'], h: 'One song fades out while the next fades in.' },
          { id: 'track', l: 'Track length', v: f2(P(9)) + ' s (φ^' + (9 + OWN) + ')', k: ['Keep', 'Shorter', 'Longer'], h: 'How long each track plays.' },
          { id: 'volume', l: 'Volume', v: '0.55 × φ^(−s/4), kept between 25% and 80%', k: ['Keep', 'Louder', 'Quieter'], h: 'How loud. It changes a little with the pumps.' },
          { id: 'genre', l: 'Style', v: 'picked by mood: calm = ambient, playful = indie-pop, excited = electronic …', k: 'text', h: 'Which styles would you like?' },
          { id: 'pumps', l: 'What changes the music', v: 'time of day, weather, how urgent things are, mood. Each adds phi steps to s', k: ['Keep', 'Change'], h: 'These are the "pumps" that push the music faster or slower.',
            ar: 'A buzzer plays a note with tone(pin, 440). That is the note A, 440 Hz. noTone(pin) stops it.' }
        ],
        quiz: [
          { t: 'Beats and hertz', q: '120 BPM means 120 beats each minute. How many beats each second is that?', o: ['2 Hz', '120 Hz', '0.5 Hz', '12 Hz'], a: 0,
            x: '120 ÷ 60 seconds = 2 beats each second = 2 Hz. Each beat lasts 0.5 s (the period).' },
          { t: 'Pitch', tf: true, q: 'True or false: a higher note means the sound wave shakes faster (a higher frequency).', a: 0,
            x: 'True. Pitch = how high or low a note sounds. It is how our ears hear frequency. The note A is 440 Hz.' },
          { t: 'Octaves', q: 'Going up one octave does what to a note\'s frequency?', o: ['doubles it', 'adds 100 Hz', 'halves it', 'multiplies it by φ'], a: 0,
            x: 'Octave = double the frequency. 440 Hz up one octave is 880 Hz. That is why they sound like the "same" note, just higher.' },
          { t: 'tone()', q: 'Which Arduino command plays a note on a buzzer at a frequency you choose?', o: ['tone()', 'analogWrite()', 'delay()', 'Servo.write()'], a: 0,
            x: 'tone(pin, frequency) = play a note at that many Hz. tone(8, 880) plays A one octave above 440. A basic Arduino can only play one tone() at a time.' },
          { t: 'Equal-power crossfade', q: 'Challenge: the DJ fades one track out with a cosine curve and the next in with a sine curve. Why? Because sin² + cos² always equals…', o: ['1, so the total loudness stays steady', '0, so it goes silent', '2, so it gets louder', 'φ'], a: 0,
            x: 'sin² + cos² = 1 at every moment. Sound power goes with the square of the size of the wave, so the two tracks always add up to the same loudness. No dip in the middle.' }
        ] },
      { id: 'colours', name: 'Page colours', icon: '🎨', demo: function () { return '<span class="dm-sw"><i style="background:#0B1A33"></i><i style="background:#102447"></i><i style="background:#1B3A6B"></i><i style="background:#9FB8E0"></i><i style="background:#E3ECFA"></i><i style="background:#FFFFFF"></i></span>'; },
        lead: 'Your navy colours: background, panels, buttons and text. Every text colour was checked so it is easy to read (contrast at least 4.5 to 1).',
        params: [
          { id: 'bg', l: 'Background', v: 'navy #0B1A33', k: 'colour', h: 'The colour behind everything.' },
          { id: 'panel', l: 'Panels', v: '#102447', k: 'colour', h: 'The boxes that hold the questions.' },
          { id: 'accent', l: 'Buttons and highlights', v: 'soft blue #9FB8E0', k: 'colour', h: 'Buttons and things you can tap.' },
          { id: 'text', l: 'Text', v: 'white #FFFFFF (17.4 : 1 contrast on navy)', k: 'colour', h: 'Contrast ratio = how much brighter the text is than the background.',
            ar: 'An RGB LED mixes red, green and blue. Navy #0B1F4D is analogWrite(redPin, 11), (greenPin, 31), (bluePin, 77). Hex 0B = 11, 1F = 31, 4D = 77.' }
        ],
        quiz: [
          { t: 'Light is a wave', q: 'Colour is light\'s frequency. Which colour has the HIGHER frequency?', o: ['blue light', 'red light', 'they\'re the same'], a: 0,
            x: 'Blue light shakes about 650 trillion times a second (Hz). Red is about 450 trillion. Higher frequency = shorter wavelength.' },
          { t: 'Reflection', tf: true, q: 'True or false: navy looks dark because it bounces back only a little light, mostly blue.', a: 0,
            x: 'True. Reflection = light bouncing off something. Navy soaks up most light and bounces back a little blue.' },
          { t: 'Ratios', q: 'White text on navy has a contrast ratio of 17.4 : 1. What does a bigger contrast ratio mean?', o: ['easier to read', 'harder to read', 'brighter colours', 'nothing'], a: 0,
            x: 'Contrast ratio = how much brighter the light colour is than the dark one. Text needs at least 4.5 : 1. 17.4 : 1 is very clear.' },
          { t: 'analogWrite()', q: 'You want an RGB LED to glow navy. Which Arduino command sets each colour\'s brightness from 0 to 255?', o: ['analogWrite()', 'digitalWrite()', 'tone()', 'millis()'], a: 0,
            x: 'analogWrite(pin, 0–255) sets brightness using PWM. digitalWrite() can only do fully on or fully off.' }
        ] },
      { id: 'rhythm', name: 'Your page\'s rhythm', icon: '🌀', demo: function () { var h = ''; for (var n = 1; n <= 8; n++) h += '<i style="height:' + (8 + n * 9) + 'px" title="φ^' + (n + OWN) + '"></i>'; return '<span class="dm-ladder">' + h + '</span>'; },
        lead: 'The secret behind every move. Each time on your page is the golden ratio φ ≈ 1.618 raised to a power (φ¹, φ², φ³ …). Your page runs a quarter step off everyone else\'s, so it has its own rhythm.',
        params: [
          { id: 'step', l: 'Your rhythm step', v: '+' + OWN + ' (every time × φ^' + OWN + ' ≈ ' + Math.pow(PHI, OWN).toFixed(3) + ', a bit calmer)', k: ['Keep', 'Faster', 'Slower'], h: 'One setting moves every motion on the page together.',
            ar: 'On an Arduino, keep one number for each part: the next time it should change. Check millis() every loop(), so every part keeps its own beat without delay().' },
          { id: 'dial', l: 'Whole-page speed dial', v: '0.75 (everything 25% slower)', k: SPEED, h: 'Turns the speed of the whole page up or down.' },
          { id: 'pump', l: 'Calm pump', v: 'moon phase and time of day can slow everything by up to a quarter step (× 0.887)', k: ['Keep', 'Turn off'], h: 'Real-world things gently slow the page down.' },
          { id: 'amount', l: 'How much moves overall', v: '4 moving pieces: bot, 3 emojis, light, tide', k: ['Keep', 'More', 'Less'], h: 'How busy the page looks.' }
        ],
        quiz: [
          { t: 'The φ ladder', q: 'One thing takes φ³ ≈ 4.24 s. The next step up is φ⁴. About how long is that?', o: ['6.85 s', '5.24 s', '8.47 s', '4.24 s'], a: 0,
            x: 'Each step is φ times the one before: 4.236 × 1.618 ≈ 6.854 s. Fun fact: φ² = φ + 1.' },
          { t: 'Irrational ratios', tf: true, q: 'True or false: φ can\'t be written as a fraction, so moves timed with different φ powers never repeat the exact same pattern.', a: 0,
            x: 'True. An irrational number can\'t be written as a fraction of whole numbers. So the moves never line up into a short loop. That keeps the page feeling alive. Sunflower seeds use the same trick.' },
          { t: 'Your step', q: 'Your page is a quarter step slower: every time is multiplied by φ^0.25. About how much is that?', o: ['1.128', '1.25', '0.25', '1.618'], a: 0,
            x: 'φ^0.25 ≈ 1.128. So everything takes about 12.8% longer than the base ladder.' },
          { t: 'millis()', q: 'Challenge: on an Arduino, why use millis() instead of delay() to run lots of different beats at once?', o: ['delay() stops everything while it waits; millis() lets the code keep going', 'millis() makes LEDs brighter', 'delay() only works with servos', 'they do the same thing'], a: 0,
            x: 'delay() freezes the whole board while it waits. millis() just tells the time, so each part can check "is it my turn yet?" and many beats run together.' },
          { t: 'In your own words', open: true, q: 'Why does timing everything with φ stop the page looking like a robot loop? Explain it your way.',
            x: 'One way to say it: moves of 2 s and 4 s line up every 4 s and repeat forever. With φ they never line up exactly, so the pattern keeps changing.' }
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
      '<p class="pz-lead"><b>For each part: this way or that way?</b> Tap the way you would take it. Roll shows two other ways. Leave a part alone and it stays as it is. Nothing changes straight away: your picks go to ' + esc(BI.host()) + ', who says yes or no.</p><ul class="pz-params" id="pz-params"></ul>' +
      '<label class="sr" for="pz-note">Anything else about this piece?</label><textarea id="pz-note" class="pz-note" rows="2" maxlength="400" placeholder="Anything else about this piece? (optional)"></textarea>' +
      '<div class="btnrow"><button type="button" class="btn bk" id="pz-back">&larr; Back</button><button type="button" class="btn" id="pz-next">Physics challenge &rarr;</button></div>';
    var d = $('pz-demo'), dh = pc.demo(d); if (dh) d.innerHTML = dh;
    var ul = $('pz-params');
    pc.params.forEach(function (p) {
      var li = document.createElement('li'); li.className = 'pz-p';
      li.innerHTML = '<div class="pl"><b>' + esc(p.l) + '</b></div><span class="pv">' + esc(p.v) + '</span>' + (p.h ? '<span class="ph">' + esc(p.h) + '</span>' : '') + (p.ar ? '<span class="ph ar"><b>Arduino:</b> ' + esc(p.ar) + '</span>' : '') + '<div class="pz-ch" role="group" aria-label="' + esc(p.l) + '"></div>';
      var ch = li.querySelector('.pz-ch'), cur = a[p.id], ways = document.createElement('div'); ch.appendChild(ways);
      // pathways: two concrete directions from the current value + Roll (js/pathways.js); no Keep / Change
      if (window.Pathways) Pathways.render(ways, pc, p, a, save);
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
    $('pz-next').onclick = function () { S.stage = 'quiz'; S.qi = 0; save(); renderQuiz(); window.scrollTo(0, 0); };
    if (window.Adapt) Adapt.note('piece-' + pc.id, 'open');
  }

  function renderQuiz() {
    var pc = LIST[S.i], qz = pc.quiz[S.qi], el = $('pz'), R = S.quiz[pc.id] = S.quiz[pc.id] || {}, prev = R[S.qi];
    el.innerHTML = head(pc, S.i, 'physics challenge ' + (S.qi + 1) + ' of ' + pc.quiz.length) + '<span class="pz-term" id="pz-term">' + esc(qz.open || (prev && prev.pick != null) ? qz.t : qz.tf ? 'True or false' : 'Your turn') + '</span><h3 class="pz-q">' + esc(qz.q) + '</h3><div id="pz-body"></div>' +
      '<div class="btnrow"><button type="button" class="btn bk" id="pz-qback">&larr; Back</button><button type="button" class="btn" id="pz-qnext" hidden>Next &rarr;</button></div>';
    var body = $('pz-body');
    function feedback(ok, extra) { var f = document.createElement('div'); f.className = 'pz-fb' + (ok ? '' : ' term'); f.innerHTML = '<b>' + (ok ? ['Spot on!', 'Nailed it!', 'Exactly right!'][S.qi % 3] : 'Here\'s the term for that:') + '</b> '; f.appendChild(document.createTextNode(qz.x + (extra || ''))); body.appendChild(f); $('pz-qnext').hidden = false; }
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
    pc.params.forEach(function (p) { lines.push('• ' + p.l + ' (now: ' + p.v + ') → ' + (window.Pathways ? Pathways.label(a[p.id]) : (a[p.id] || 'no answer'))); });
    if (S.notes[pc.id]) lines.push('Note: ' + S.notes[pc.id]);
    pc.quiz.forEach(function (q, k) { var r = R[k]; if (q.open) { lines.push('Explain (' + q.t + '): ' + (r && r.text ? r.text : 'skipped')); return; } asked++; if (r && r.ok) right++; else miss.push(q.t); });
    lines.push('Physics: ' + right + '/' + asked + ' named first time' + (miss.length ? ' (terms met: ' + miss.join(', ') + ')' : ''));
    if (window.Learner) lines.push(Learner.summary());
    return { lines: lines, right: right, asked: asked };
  }
  async function finishPiece() {
    var pc = LIST[S.i], sm = summary(pc), el = $('pz');
    el.innerHTML = head(pc, S.i, 'done') + '<h2>' + (sm.right === sm.asked ? 'Every term named! 🎉' : 'Nice work! New terms unlocked.') + '</h2><p class="pz-score">Terms you named straight off: ' + sm.right + ' of ' + sm.asked + '.</p>' +
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
    el.innerHTML = '<h2>All pieces done! 🚀</h2><p class="pz-score">Terms named straight off: ' + ok + ' of ' + tot + ' overall.</p><p class="pz-lead">' + esc(BI.host()) + ' has your picks for every piece and will say yes or no. You can go through any piece again, or ask ' + esc(BI.bot()) + ' something in the chat.</p>' +
      '<div class="btnrow"><button type="button" class="btn" id="pz-again">Go through again</button><button type="button" class="btn ghost2" id="pz-home">Back to start</button></div>';
    $('pz-again').onclick = function () { S.i = 0; S.stage = 'params'; save(); renderParams(); };
    $('pz-home').onclick = function () { show(false); resume(); };
  }
  function resume() { var r = $('pz-resume'); if (!r || !S) return; if (S.i > 0 && S.i < LIST.length) { r.hidden = false; r.textContent = 'You were up to piece ' + (S.i + 1) + ' of ' + LIST.length + '. Start picks up from there.'; } else r.hidden = true; }
  async function open() {
    if (!window.BI || !BI.ready()) return;
    LIST = PIECES(); await load(); resume(); if (window.QuizOrb) QuizOrb.init();
    var go = $('pz-go'); go.onclick = function () { if (!LIST) LIST = PIECES(); LIST = PIECES(); show(true); if (S.i >= LIST.length) renderDone(); else if (S.stage === 'quiz') renderQuiz(); else renderParams(); };
  }
  document.addEventListener('bi:open', open);
  document.addEventListener('bi:lock', function () { if (window.QuizOrb) QuizOrb.reset(); S = null; $('pz').hidden = true; $('pz').innerHTML = ''; });
  window.Pieces = { open: open, list: function () { return PIECES(); } };
  open();
})();
