# Learning model

This is the background design approach for the questions on this page. It is shared lingo between the page's owner and
its bot, written down so the code and anyone extending it work the same way. It is not shown on the page as a lecture:
the page carries one line ("We're building this in together, one real term at a time") and, the first time the quiz orb
appears, a short message in the bot's voice.

## Shared lingo

| Phrase | What it means in practice |
| --- | --- |
| **Name it to build it** | What you can build depends on how clearly you can say what you mean. The real names of the page's parts (header, footer, avatar, tide line, quiz orb...) and their properties (colour, speed, direction, size, see-through), plus Arduino terms, are tools, so the questions hand them over. |
| **Here's the term for that** | The only feedback for a pick that isn't the target term. Nothing is right or wrong; a "miss" is a term met, not a mark. No "wrong" or "incorrect" wording anywhere. |
| **Named it** | Picked the target term straight off. Counted as "named first time" in the summary. |
| **Met it** | Saw the term with its explanation. Still counts as learning (recall target PHI^-2, not zero). |
| **Stretched, not stuck** | Difficulty aims for naming about 61.8% (1/PHI) straight off: hard enough to grow, easy enough to keep going. |
| **Free-wheel** | Every ladder in the system (level, options, term depth, motion) moves continuously through damped, phi-tuned couplings. Steps only time changes; nothing freezes or hard-gates. |
| **Propose-only** | Answers and picks go encrypted to the page owner. Nothing on the page changes without the owner's yes. |
| **Plain words, real term** | Short sentences and everyday words, and always the real name with a one-line meaning ("Footer = the strip along the bottom"). |
| **Screen to circuit** | Most on-screen parts link to how you would do it on an Arduino (delay(), millis(), analogWrite(), Servo.write(), tone()), in plain words with the code arguments. |
| **Here's the name for that** | The naming step's feedback for a pick that isn't the target. |
| **On-device first** | The learner model lives in this browser. Only a compact numeric summary travels, inside the encrypted answers. |

## How the code expresses it

| File | Role |
| --- | --- |
| `js/pieces.js` | Content: each piece's parts in plain words (`v`), the real numbers behind them (`d`, sent only to the page owner inside the encrypted answers, never shown), the two directions per part (`js/pathways.js`) and an Arduino challenge where there is one. `ar`: how you would build it on an Arduino. |
| `js/onboard.js` | The exhaling cascade (`window.Exhale`), the required naming step and the "what you want to learn" prompt. Also the optional Build more rounds for both, and the loader for `js/buildmore.js`. |
| `js/buildmore.js` | The optional Build more area on the dashboard. Loads on tap or in an idle slot. |
| `js/learner.js` | The learner model and the lingo bank (term to depth). Builds options and records results. |
| `js/quiz-orb.js` | The view: the quiz orb that brings a name-this question to the centre of the screen and glides home after. Built on the help orb architecture (single instance, home dock, one dialog with focus trap, spring home). `QuizOrb.spotlight(elementId, prompt)` is the reusable point-and-enlarge piece. |

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
- **Term depth:** distractors for name-this questions come from the lingo bank, weighted `PHI^(-PHI^2 * |depth - 2L/3|)`, and the question author's own distractors are weighted PHI^3 higher. Near-synonyms of the answer are never used as distractors. The bank has two families, the interface vocabulary (names of page parts and their properties) and Arduino (LED, delay(), millis(), digitalWrite(), analogWrite(), PWM, tone(), Servo.write() ...); a term from the other family is weighted PHI^-2. Near-synonyms (button / lock button, avatar / icon, PWM / analogWrite()) never appear together as answer and distractor. Physics terms are no longer in the bank. Number and sentence questions keep their own options and use the largest ladder count that fits; true/false is always 2.
- **Summary sent with each piece's encrypted answers:** level, option range, recall and exposure count per term, and the easy/hard tap counts. No free text, no names.

### Quiz orb motion

One value `p` (0 = home, 1 = centre) follows its target through a damped spring with a natural period of PHI^(0 + own step) s and a damping ratio of 1/PHI, integrated every frame while it moves. The orb grows by PHI and rides the panel's top edge; the panel scales from 0.236 to 1 out of the orb's home spot. Everything is transform and opacity. With reduced motion or Lite, nothing travels: a simple fade with a time constant of PHI^-3 s.

## Adapter point for the shared schema

When the shared `js/phi-adapt.js` exists and exposes `window.PhiAdapt.learner` with `record`, `tap`, `level`, `summary`
and `data`, load it before `js/learner.js`. Every call is then forwarded to it, and this file only builds options. The
schema above is the one to map into it.

## Physics stays in the background (Danny, 2026-10-25 16:00 AWST)

Physics is the engine, not the lesson. The page still runs entirely on Danny's golden-ratio architecture (the phi ladder
`PHI^(n + own step)`, the ratio pump, load tiers, the quiz orb's spring), but nothing about physics is said or shown on the page:
no periods, Hz, phi expressions or % values, and no physics terms in the questions. Each part shows plain words ("slow and gentle").
The real numbers still go to the page owner with the encrypted answers. Any background timing of prompts or re-asks uses the
same **exhaling cascade** as the reminder system (`window.Exhale` in `js/onboard.js`, the same shape as the dad-ping repeater):
a first gap, then each gap x PHI, until the next beat would pass the page's longest beat (PHI^(9 + own step) s), then it rests.

## The naming step (required)

Learning what everything on the page is called is **not optional**. It is the first part of onboarding, it can't be skipped,
closed or Escaped, and until it is done the pieces ("which way should it go?"), Build more and the extra questions stay
locked. The page itself, chat, DJ and Lite still work.

- The quiz orb points at each part with `QuizOrb.spotlight(id, spec)`: that part grows (by `1 + (PHI-1) * orbSize/partSize`)
  and glows, the scrim leaves a soft hole around it, and the orb's panel moves to the far side of the screen. The glow
  re-pulses on the exhaling cascade while unanswered. Reduced motion or Lite: no growing, just the ring and glow.
- Feedback: "Named it" or "Here's the name for that". Nothing is right or wrong.
- A part met but not named comes back later in the queue, `round(n / PHI^4 * PHI^k)` questions later (k = times met), so
  the re-asks exhale. The step ends once every part has been named.
- Storage: the finished mark is in localStorage `buildit.naming` (`{v, done}`). Half-done progress is the quiz's resume record `naming` (see "Quiz resume on refresh"). Both are on this device only and never sent.
- Light first build: the required step asks the 13 page parts only (see below). The 5 properties are the optional "Name more" round in Build more.
- `QuizOrb.spotlight(id, "Is this the change you want?", { choices, onPick })` is the same piece, ready for the after-change prompt.

**Exception to rule 6.** Rule 6 (free-wheel) says nothing hard-gates. This naming gate is an explicit exception made by
Danny on 2026-10-25 at 16:00 AWST: "if they can't get through that initial part, it's not for them". Everything inside the
step still free-wheels (springs, dithered option counts, the exhaling re-ask cascade); only the gate itself is hard.

## What you want to learn

The onboarding prompt about the education layer uses the same tile + Roll component as the extra questions: "do more of
this, less of that", as a roll pair: the left box ("I want more of this") and the right box ("Less of this for now") each
roll through things to learn or build (Arduino, naming things, building my page, sound, motion, colours, coding, circuits
...), and Lock it in (or Enter) confirms. Back keeps the picks. The
answers go encrypted to the page owner as `kind:'answers'`, propose-only.

## Grow on drop (core orb behaviour) and the auto drop on parameter questions

`QuizOrb.drop(el, o)` is the orb's one drop handler (Kids Club core help orb standard, 2026-10-25 16:29 AWST). Whatever the
orb is dropped on grows (`1 + (PHI-1) * orbSize/partSize`), comes forward over the orb layer with a glow ring, and the help
bubble shows the orb's own help text for that part (registered with `QuizOrb.part(selector, text)`; the texts are the same
ones the naming step teaches). It settles back through the same phi-ladder transition when the bubble closes, the orb moves
away, or the caller leaves. Three callers, no grow code of their own:

- **Real drops:** drag the orb onto any part of the page and let go.
- **Virtual drops (auto drop):** a Keep/Change piece about a background parameter with a visible part (bot -> avatar, orbit
  emojis, status light, tide line, DJ pill) drops the orb on that part when the piece opens, and leaving the piece
  (Next, Back, finishing) settles it back. If the part isn't on screen, nothing happens.
- **Spotlight:** `QuizOrb.spotlight(id, prompt)` = a drop with no bubble plus the orb's panel (the naming step, and the
  "Is this the change you want?" prompt).

## Quiz resume on refresh

Every quiz keeps one on-device record in `localStorage` under `buildit.resume.<id>`. The ids are `naming`, `learn`, `pieces` and `extra`. Each record holds `{id, v, pos, len, a}`, where `a` is the answers encrypted with the page key. The record is updated on every answer, never expires, is never sent, and is kept apart from the usage loop (`Adapt`).
- While a record exists, the homepage button reads "Continue…" in place of the start label, with a small "Start over" beside it.
- Finishing a quiz or pressing Start over clears its record.
- If the quiz version changed, it resumes at the same relative position: `round(pos / len × new length)`. Ratios only.
- The shared helper is `window.Resume` in js/app.js.

## Light first build and Build more (Danny, 2026-10-25 16:05 AWST)

The first time through asks only the **T0** questions: the first `ceil(n / PHI^2)` of each set (about 0.382, a ratio, never a fixed number), highest priority first, in the order listed. All of them are skippable.

| Set | First time (T0) | Waits in Build more |
|---|---|---|
| Each piece's parts | first `ceil(n / PHI^2)`, e.g. 4 of the bot's 9 | the later parts |
| Arduino challenges | none | all |
| What you want to learn | `ceil(5 / PHI^2)` = 2 questions | the other 3 |
| Naming | the 13 page parts (required) | the 5 properties (optional) |
| Extra questions | none | all |

- Every part goes into each piece's encrypted answers: either asked now, answered before (marked "from before"), or "kept as it is now (default; not asked yet, in Build more)". That way Danny always has the whole piece.
- There is a "Skip this piece" button on every piece the first time through.
- Pieces he already sent count as done, and his existing answers are kept. The old `buildit-pieces` store moves into the `pieces` resume record once. Build more starts from his latest answers.
- Build more is the optional area on the dashboard (the start panel). It has four rounds: more about each piece, name more, more of what you want to learn, and the extra questions. `js/buildmore.js` loads when he taps "Open Build more", or in an idle slot once naming is done.
- Each round has its own resume record: `more`, `naming-more`, `learn-more`, `extra`. Each one gets Continue / Start over.
- This note shows at the end of the first build and on the dashboard: "You can come back any time and build more on your dashboard."

**Interpretation of "the naming step stays required but light".** T0 for naming is every part you can see on the first page: header, avatar, page title, DJ pill, tab, lock button, orbit emojis, panel, quiz orb, footer, status light, tide line and Lite switch. Those 13 are all required, so every piece visible on the first page gets named. The properties (colour, size, speed, direction, see-through) are not parts you can point at on their own, so they move to Build more. That round is optional: it has a Later button and does not gate anything. If Danny meant T0 to be fewer than every visible part, the set to trim is `REQ` in js/onboard.js.
