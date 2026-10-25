# Learning model

This is the background design approach for the questions on this page. It is shared lingo between the page's owner and
its bot, written down so the code and anyone extending it work the same way. It is not shown on the page as a lecture:
the page carries one line ("We're building this in together, one real term at a time") and, the first time the quiz orb
appears, a short message in the bot's voice.

## Shared lingo

| Phrase | What it means in practice |
| --- | --- |
| **Name it to build it** | What you can build depends on how clearly you can say what you mean. Real terms (period, frequency, damping, threshold...) are tools, so the questions hand them over. |
| **Here's the term for that** | The only feedback for a pick that isn't the target term. Nothing is right or wrong; a "miss" is a term met, not a mark. No "wrong" or "incorrect" wording anywhere. |
| **Named it** | Picked the target term straight off. Counted as "named first time" in the summary. |
| **Met it** | Saw the term with its explanation. Still counts as learning (recall target PHI^-2, not zero). |
| **Stretched, not stuck** | Difficulty aims for naming about 61.8% (1/PHI) straight off: hard enough to grow, easy enough to keep going. |
| **Free-wheel** | Every ladder in the system (level, options, term depth, motion) moves continuously through damped, phi-tuned couplings. Steps only time changes; nothing freezes or hard-gates. |
| **Propose-only** | Answers and picks go encrypted to the page owner. Nothing on the page changes without the owner's yes. |
| **Plain words, real term** | Short sentences and everyday words, and always the real name with a one-line meaning ("Period = how long one full cycle takes"). |
| **Screen to circuit** | Every on-screen parameter links to how you would do it on an Arduino (delay()/millis(), analogWrite() PWM and duty cycle, Servo.write(), tone()). |
| **On-device first** | The learner model lives in this browser. Only a compact numeric summary travels, inside the encrypted answers. |

## How the code expresses it

| File | Role |
| --- | --- |
| `js/pieces.js` | Content: each piece's parameters and its physics challenge (term `t`, question, options, explanation `x`), in plain Year 7 wording. Each parameter can carry `ar`: how you would build it on an Arduino, with numbers worked out from the same phi values. |
| `js/learner.js` | The learner model and the lingo bank (term to depth). Builds options and records results. |
| `js/quiz-orb.js` | The view: the quiz orb that brings a name-this question to the centre of the screen and glides home after. Built on the help orb architecture (single instance, home dock, one dialog with focus trap, spring home). |

### Learner model (localStorage `buildit.learner`, schema v1)

```
{ v:1, x, xt, vx,            // level state: L = 3 * logistic(x); x follows xt through a damped spring
  n,                         // questions built (drives the golden-ratio dither)
  easy, hard,                // explicit "too easy" / "too hard" taps
  intro,                     // when the transparency message was seen (ms), 0 = not yet
  terms: { <term>: { n, s, last, k } } }   // exposures, recall strength 0..1, last seen ms, interval rung
```

Numbers and fixed term ids only. Typed answers ("in your own words") are never stored here.

- **Recall decay, phi-spaced:** `r = s * PHI^(-days / PHI^k)`. Naming a term moves `s` a 1/PHI step towards 1 and adds a rung (the next interval is PHI times longer); meeting it moves `s` towards PHI^-2 and divides the rung by PHI.
- **Level:** continuous 0..3. Targets move by +PHI^-3 for a term named, -PHI^-2 for a term met, and +/-PHI^-1 for a "too easy"/"too hard" tap. The level follows through a spring (natural period PHI^2 answers, damping ratio 1/PHI), so it glides and settles. The balance point of the +PHI^-3 / -PHI^-2 pair is 61.8% named.
- **Option count:** the ladder 2 / 3 / 5 / 10. Index = `floor(L' + u)`, with `u = frac(n * 0.618...)` and `L'` the level nudged by that term's own recall. The dither makes the expected count a smooth function of the level, with no threshold.
- **Term depth:** distractors for name-this questions come from the lingo bank, weighted `PHI^(-PHI^2 * |depth - 2L/3|)`, and the question author's own distractors are weighted PHI^3 higher. Near-synonyms of the answer are never used as distractors. The bank has two families, physics and Arduino (LED, delay(), millis(), digitalWrite(), analogWrite(), PWM, duty cycle, tone(), Servo.write() ...); a term from the other family is weighted PHI^-2. Near-synonyms such as PWM and duty cycle never appear together as answer and distractor. Number and sentence questions keep their own options and use the largest ladder count that fits; true/false is always 2.
- **Summary sent with each piece's encrypted answers:** level, option range, recall and exposure count per term, and the easy/hard tap counts. No free text, no names.

### Quiz orb motion

One value `p` (0 = home, 1 = centre) follows its target through a damped spring with a natural period of PHI^(0 + own step) s and a damping ratio of 1/PHI, integrated every frame while it moves. The orb grows by PHI and rides the panel's top edge; the panel scales from 0.236 to 1 out of the orb's home spot. Everything is transform and opacity. With reduced motion or Lite, nothing travels: a simple fade with a time constant of PHI^-3 s.

## Adapter point for the shared schema

When the shared `js/phi-adapt.js` exists and exposes `window.PhiAdapt.learner` with `record`, `tap`, `level`, `summary`
and `data`, load it before `js/learner.js`. Every call is then forwarded to it, and this file only builds options. The
schema above is the one to map into it.
