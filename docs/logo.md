# Logo grows with the page (PREVIEW, not live)

Kids Club standards: "Logo sound and motion standard (global)" and "Logo grows with the page" (extended to this page by the page
owner, 26 Oct 2026). Source of truth: the Kids Club shared layer on the box; this file only says how this page does it.
Branch `preview-logo-2026-10-26`, built on the unmerged sky-clocks preview (`preview-seasonpumps-2026-10-25`): quiet hours and the
moon clock come from its on-device sky clocks. Rollback for the live page: tag `pre-logo-2026-10-26`.

## Files (this page's own copies; nothing loads another page's files)
| File | What | When it loads |
|---|---|---|
| `js/logo.js` | the logo: assembly, hand-over, the logo view and its tiles | tier 2, after unlock |
| `js/phi-pumps.js` | the page pump root (13) and registry, anchor B | with `js/logo.js` |
| `js/logo-editor.js` | the logo editor: questions, tiles, draw / type / chat / vector file | first time he opens the editor |
| `js/logo-zoom-life.js` | the open logo view's stars, glow, shimmer and sparkles (generic copy of the Kids Club zoom file, no other logo's art, creatures or names) | first tap on the logo, never in Lite |
| `js/logo-sound.js` | the logo sound engine (the Kids Club engine's sequencer, rendered with plain Web Audio: no music library) | first tap, never in Lite |
| `tools/phi_selfcheck.py` | rule 12 self-check ALERT on fixed numbers (report only) | never shipped to the page |

## How it assembles
- His page path: the naming step, the first learn round, then each first-build piece (bot, orbit, light, tide, DJ, colours,
  rhythm). Each step adds one layer: ring, middle, bot ball, orbit with marks, light, wave, beat bars, colours, rhythm ticks.
- Progress = steps done / steps in his path. Done comes from what is already on this device: the naming mark, the learn mark,
  the first-build record, and his own answer sets in the decrypted log. A kid who finished before this existed sees his logo built.
- Colours are his love-most picks (piece colour directions, his love-most palette); otherwise the page's current colours. Marks are
  the emoji set he picked for the orbit (only an offered set). Shapes are plain geometry, every size a PHI power of the half-size.
- A newly done step glides in: B x PHI^-1, each layer B x PHI^-4 after the one before (free-wheel cascade).

## Hand-over (the logo step)
- The logo step is the first Build more item, "Make your logo yours" (also "Make it yours now" in the logo view, after step 1).
- Opening it stops auto-assembly for good. What is built is kept as his start (and "Back to my original" returns to it).
- The one-time light hint is the help orb's own grow-on-drop on the logo: "This logo is yours now... Tap it any time to change it."
- After that, tapping the logo opens the logo view: tiles and buttons only (pieces on/off, bigger/smaller, colours, orbit marks,
  step back, back to my original, sound on/off). No settings box and no typed field.

## One start, independent per site (Kids Club, 26 Oct 2026)
**The shared start recipe** (`startFrom()` in `js/logo.js`, recipe 1). Any of his sites computes his start the same way:
1. Path: the naming step, the first learn round, then each first-build piece in page order (bot, orbit, light, tide, DJ, colours,
   rhythm). Each step gives one layer: ring, middle, bot ball, orbit, light, wave, beat bars, colours, rhythm ticks.
2. On/off: a layer is on when its step is done (from his own records and answer sets on that device).
3. Colour: his love-most pick for that part; for the ring, middle and bars, his love-most palette once the colours step is done.
4. Marks: the orbit emoji set he picked (an offered set only). Size: rung 0 for every layer. Tint: on once colours is done.
Inputs are his own path and picks only, so the same answers give the same start on every site. Where he made no pick, a layer
falls back to that site's own page colour, so those layers can differ between sites until he picks (flagged for the page owner).

**Independent after that.** The start is taken once, at the hand-over, and kept as "my original". From then on this site keeps
its own state under `buildit.logo:<site path>`. Another site's key never matches, so nothing is shared or overwritten.
An earlier unscoped preview record on this site is moved to this site's key once.

**Live, no approval.** His tile edits apply on this site at once (header logo and the open view), with no approval step.
"Back to my original" sits near the top of the editor at all times. "Step back" undoes his last edits one at a time (the
last 8 are kept, a Fibonacci count; "Back to my original" can be stepped back too). All on this device, this site only.

## Logo editor flow (Kids Club, 26 Oct 2026)
- Tap the logo: its view opens. After the hand-over a small "edit" button sits next to the close X (the X's height, one phi step
  wider). Edit opens the editor; the X or Done closes it. Every change is already saved on this device; closing keeps it.
- The logo step (Build more, after the first build) asks "Make your logo now or later?". Now opens the editor. Later keeps the
  built logo as it is, shows a one-time hint, and the step stays in Build more. Either way it is the hand-over.
- Questions: each visit asks up to 5 direction questions built from his own path: for each piece he built, which way it should
  grow, which colour, which orbit marks, and whether to bring back a hidden piece. Two roll boxes (left: love most, applied at
  once; right: like least, kept so it comes last next time), Back (undoes that answer), Skip, Stop for now. Part-way visits
  resume after a refresh. The 5 asked are the ones he answered longest ago, so the logo builds out over time.
- Start from: draw or write by hand (on-device canvas, finger or stylus), type (up to 21 characters), "with my bot" (tells him
  to ask his bot; nothing is sent), or a vector file (SVG only, up to 144 kB). The file is cleaned on this device before use:
  only shape, gradient and text elements are kept; scripts, styles, foreignObject, images, links and animation are removed, as
  are event handlers, outside or script links and url() references. It is then drawn as an image, which cannot run scripts or
  load anything.
- Loading: the editor file loads only when he first opens the editor. Nothing new loads before unlock.

## Words in a logo wait for Dad (interim)
Kids Club's interim safety rule: a change with words in it stays private until Dad says yes. That covers typed words,
handwriting he marks as "letters or words", and an SVG with text elements. This page has no handwriting reader, so he
is asked whether his drawing has letters or words in it.
- How it is held: his logo state already lives only in this browser's storage for this site; it is never in a public file and
  never sent. A held change is marked `text: true` and the view shows "Waiting for Dad". The page also keeps `pub`, the latest
  design with no words. Any public view of his logo (none exists yet) may only use `Logo.publicDesign()`, which never contains
  words. "Back to my original", "Step back" and "Take mine out" remove a held change at once.
- Dad's yes: there is no on-page way for Dad to approve yet. Asking Dad is the kid's bot's job, and no bot or relay code was
  changed here.

## Ask your bot to edit the logo
- Link (this site): `https://edgerequals.github.io/buildit/#logo-edit`. Opening it shows the normal unlock; once unlocked, the
  logo editor opens on his own logo (hand-over first if needed). The `#logo-edit` part is then cleared from the address. No
  sound starts, because it is not a tap. The link carries nothing about him.
- What his bot should reply (button label, then text):
  - Button: `✏️ Edit my logo` → `https://edgerequals.github.io/buildit/#logo-edit`
  - Text: `Here's your logo editor: https://edgerequals.github.io/buildit/#logo-edit. Open it and unlock your page. Your changes show straight away, and you can always tap "Back to my original".`
  - If he has more than one site, the bot asks which one first; each site has its own link and its own logo state.

## Sound and motion
- No AudioContext until his first tap on the logo; it is created inside that tap. The sound engine and zoom life load then.
- One logo sounds at a time (LogoSound solo). Lite: plain logo view, no zoom life, no sound. Reduced motion: no glides or loops.
- Loudness (Kids Club loudness standard): no master volume and no overall gain node. The device's own volume is the one overall
  control; the page never reads or sets it. Every level, gain, velocity, send and fade comes from the amplitude matrix hook
  (`AMP` / `amp()` at the top of `js/logo-sound.js`; `LogoSound.level()` for the zoom sounds). The matrix is not defined yet, so
  the hook holds the engine's existing levels unchanged, each line marked PENDING-DANNY. When it is defined, set
  `LogoSound.matrix = function (name) { return level; }` or replace the table.
- Quiet hours: each level x quiet. Sun height at the coarse point (sky clocks) eases quiet to PHI^-n at rest, n = Dial 3's rung.
  Day length sets how long the quiet lasts. No wall-clock schedule.
- Pitch (Kids Club pitch standard): no root note. Base = (1/B) x PHI^n (Pump A: anchor B carries his own usage rhythm, so a busier
  rhythm lifts the base). Pump B: the mix of this page's feeds (sun height, M2 tide, moon, S2 clock, ratio pump) sets a soft floor
  and headroom in whole phi rungs around the sky-only base. The weather feed in the standard does not exist on this page and none
  is added. Start rung and the most floor / headroom rungs are the PITCH hook, PENDING-DANNY. Every note, register, cutoff,
  partial and filter is a ratio of the base; every time is the spec grid step x PHI^n.
- Pump tree: page 13, logo 8, each sound or motion layer 5, each chain parameter 3, each detail 2; all on anchor B.

## Anchor B (Rule phi, no fixed seed)
- Pump 1, moon: the lunar tide clock (M2 period x PHI^-18, swung by perigee/apogee). Pump 3, his own rhythm: his measured gap
  between taps, taking over in phi steps with each session. Pump 2, temperature: NOT WIRED (no weather feed on this page, and
  no network call was added). Flagged for the page owner.

## On this device only
`localStorage 'buildit.logo:<site path>'`: handed-over time, hint shown, sound off, layers seen, his logo and his original (layer
ids, picked colours, size rungs, an offered mark set), and his last 8 edits for Step back. No typed text, no names, nothing sent. `Logo.reset()` clears this site's record only.

## Self-check alert (rule 12)
`python3 tools/phi_selfcheck.py js/logo.js js/phi-pumps.js js/logo-zoom-life.js js/logo-sound.js`: the logo, pump and zoom files report
0. The sound engine reports the musical pattern values still fixed (beat positions, the pluck walk, chord degrees, the spec's ladder
thresholds) and lists the matrix and pitch hook values apart as PENDING (held for the page owner, not new values).
