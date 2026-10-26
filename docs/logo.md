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
- Opening it stops auto-assembly for good. What is built is kept as his start (and "Back to my start" returns to it).
- The one-time light hint is the help orb's own grow-on-drop on the logo: "This logo is yours now... Tap it any time to change it."
- After that, tapping the logo opens the logo view: tiles and buttons only (pieces on/off, bigger/smaller, colours, orbit marks,
  back to my start, sound on/off). No settings box and no typed field.

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
`localStorage 'buildit.logo'`: handed-over time, hint shown, sound off, layers seen, and his logo (layer ids, picked colours, size
rungs, an offered mark set). No typed text, no names, nothing sent. `Logo.reset()` clears it.

## Self-check alert (rule 12)
`python3 tools/phi_selfcheck.py js/logo.js js/phi-pumps.js js/logo-zoom-life.js js/logo-sound.js`: the logo, pump and zoom files report
0. The sound engine reports the musical pattern values still fixed (beat positions, the pluck walk, chord degrees, the spec's ladder
thresholds) and lists the matrix and pitch hook values apart as PENDING (held for the page owner, not new values).
