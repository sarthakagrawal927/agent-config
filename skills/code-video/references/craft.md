# Craft: making a code film read like a film

Distilled from JohnHeibel's ANIMATION_GUIDE (Clawd kit), the mg-styles-15 jury rubric, the
Lemo-Opuscar director guide and creator notes collected in the Opus 5.5 prompt libraries. The
Clawd kit's own `ANIMATION_GUIDE.md` is the full version for character work.

## Three goals

- **Made, not generated.** It should look like someone made it on purpose: a solid medium
  (brush, ink, knife, cel, vector, a specific 3D look), a palette with no pure black or white,
  and hand-feel where the style calls for it.
- **Alive.** Something always moves: idles, camera drift and push, boil, grain, ambient motion.
  A frozen frame reads as a bug.
- **One piece.** Plan the whole film before drawing it. Keep one world, one palette arc
  (cold night to warm dawn), one motif that pays off, and an ending that rhymes with the
  opening. Motion and screen direction carry across cuts.

## Timing: model the viewer

The viewer sees the film once, at full speed, for the first time. You know what happens
because you wrote it; they don't.

- **Write the reads.** For each shot, list what the viewer must understand, in order, with a
  start and end time. Each read needs time for the eye to find it, time to understand it and a
  beat to register. Small, distant or subtle things take longer than big, central, obvious ones.
- **One read at a time.** Put cause and reaction in sequence, never on top of each other.
- **Fast actions, slow meanings.** Anticipate a move, then hold after it. The contrast between
  quick and held is the rhythm. One constant speed, fast or slow, is flat.
- **Lead the eye** with motion, brightness, size or a character's gaze before the important read.
- **The reads set the length.** Don't squeeze reads into a shot and don't pad one. The last
  read needs time to land before the film ends.
- **Count frames.** At 24 fps a read under about 12 frames is usually missed.
- **Lock to the beat.** One BPM drives idles, bounces and cuts. Hits land on beats or onsets.

## Animation principles (code moves everything at once, so fix that)

Use anticipation, squash and stretch (keep the volume), slow in and slow out (no raw `lerp`),
weight, arcs, overlapping action with follow-through (the eyes lead, then the body, and the
props settle last), no twinning (offset arms, blinks and crowd phases), exaggeration, strong
key poses that read as stills, showing the thought (notice, think, act), and secondary action
that never competes. Faces act through a change; they never snap from one expression to another.

## Transitions at every seam

Into the first shot, between every pair of shots and out of the last. Choose one that belongs
to the story: brush wipe, iris or shaped iris, whip pan with smear, match cut (same shape or
motion), cut on action, a carried camera move, or a push from paper or black. A hard cut is
allowed only on action or as a deliberate smash cut. Props arrive and leave on arcs; they
never pop.

## Medium discipline

- Commit to one rendering idiom per film or plate and paint everything through it. Plain
  `rect`/`ellipse` in a painted film looks like 2000s Flash.
- Boil: reseed jitter on a clock (about 12 Hz). Give each element its own seed so one moving
  thing doesn't make everything jitter. Use `hash(i)` for anything that must stay put.
- Fake depth with overlap, scale and atmosphere in a 2D style. Use real 3D only when the
  style is 3D.
- Light is additive (glow); pigment mixes subtractively. Glow under the grain.
- Type: real fonts with kerning and typographic punctuation, a title-safe margin (at least
  96 px at 1080p), and no outlined or haloed type unless the style requires it.

## The review loop (budget for it; it's cheap)

```bash
# whole film: 2 frames per second, tiled
ffmpeg -i out/video.mp4 -vf "fps=2,scale=320:-1,tile=6x5" -frames:v 1 out/check/sheet.jpg
# every frame of one moment (a take, a jump, a transition)
ffmpeg -ss 2.1 -t 0.5 -i out/video.mp4 -vf "scale=320:-1,tile=6x2" -frames:v 1 out/check/strip.jpg
# full-res crop of a face or type
ffmpeg -ss 2.3 -i out/video.mp4 -vf "crop=500:400:760:420" -frames:v 1 out/check/crop.png
```

Render stills **before** the full video. In the harness that's `--stills`, and the Clawd kit
uses `render.mjs --sheet/--strip/--crop`. Open every image and check:

- **Read:** is each shot's event clear from its sheet alone? Is the subject big enough and
  separated from the background?
- **Timing:** read a 0.1–0.15 s-step sheet in order and ask where the eye is and whether the
  viewer understands yet.
- **Motion:** anticipation and follow-through present; no pops, constant speeds or mirrored limbs.
- **Contacts:** feet on the ground, props in hands, throws leaving from the hand.
- **Transitions:** check the first and last 0.5 s of every shot.
- **Rules:** no stray text, fallback fonts, banding, aliasing, clipping or dead stretches.
- **Spec:** duration, resolution and fps exact; audio present; −14 LUFS, true peak ≤ −1 dBTP
  (`ffmpeg -i out/video.mp4 -af ebur128=peak=true -f null -`); no unintended black frames.

Then run an independent jury ([mg-rubric.md](mg-rubric.md)). It scores style fidelity,
concept/wow, motion craft, design/typography, finish/texture, sound/sync and technical, then
lists 5–10 fixes with timecodes. Most first renders score 5–7, and the published references
reached about 8 after two rounds.

## Prompting yourself, or a subagent

- Give structure like a director: total length, number of scenes, what each scene says, and
  shot language (match cut, whip pan, kinetic type). References beat adjectives.
- Write a **ban list** in the brief.
- Ask for the storyboard first. Then each shot can be revised on its own.
- Parallel subagents work well when each owns whole shots or plates. Share one guide (palette,
  helpers, timing rules) so the seams match. PDoomVideo was built this way.
- Keep API keys for external TTS, music or video models in `.env`, deny reads of it, and
  never put them in the page.
