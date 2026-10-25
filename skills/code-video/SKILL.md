---
name: code-video
description: Make a video entirely in code (no video model) — the agent writes a page that draws any frame for time t, renders it headless, synthesises sound and muxes an MP4. Covers hand-painted character cartoons (Clawd kit, p5.brush), 59 named film styles (Lemo-Opuscar: ink wash, ukiyo-e, satellite briefing, teardown, newsreel…), 15 motion-design styles (flat vector, isometric, 3D render, synthwave, HUD…), lyric-synced music videos, explainers, launch/promo films and films cut from public-domain archive footage. Use when asked for a video, animation, short film, launch video, promo, explainer, music video or motion graphics made by writing code, or for "Opus 5.5 style" videos and their prompts. Not for trimming or converting existing video files.
---

# code-video — films made by writing code

The model never outputs pixels. It writes a **deterministic page**: `renderAt(t)` draws the
frame for time `t` with Canvas, SVG, WebGL/three.js, p5.brush or shaders. Headless Chrome
captures every frame, a script synthesises the music and effects on the same cue list, and
ffmpeg muxes the MP4. It is strong at motion graphics, hand-drawn and ink animation,
explainers, launch films and lyric videos. It is weak at photoreal people and live action
(see **Beyond this skill**).

`<skill>` below means this skill's directory. Library sources are fetched read-only at
reviewed commits with `sh <skill>/scripts/fetch.sh <source>`. It prints `DIR=<path>`, and
`fetch.sh list` shows every source.

**Sandboxed agents** (for example Codex in `workspace-write`) have two limits. They can't
write the shared cache, so set `CODE_VIDEO_HOME=<project>/.sources`. They also can't launch
headless Chrome, because seatbelt blocks it. In that case write the code and run Python and
ffmpeg inside the sandbox, but have the parent agent (or the user) run the Chrome renderers
outside it.

## 1. Pick the route

| The request | Route | Start here |
|---|---|---|
| A character cartoon: hand-painted, acting, story beats (Clawd or the user's own character) | **Clawd kit** | Copy `<skill>/assets/clawd-kit/` into the project and read its `ANIMATION_GUIDE.md` |
| A film in a **named look** (ink wash, ukiyo-e, woodcut, newsreel, satellite briefing, exploded teardown, pixel RPG, 80s cel anime… 59 styles) or "help me pick a style" | **Lemo-Opuscar** | `fetch.sh lemo-opuscar`, then follow `$DIR/AGENTS.md` (see [references/routes.md](references/routes.md)) |
| A short, punchy **motion-design** piece: logo sting, brand film, 10-s showreel, flat vector, isometric, 3D render look, liquid, morph, Bauhaus, synthwave, HUD, sticker explainer, 9:16 variety captions | **MG styles** | Pick from [references/routes.md](references/routes.md) and adapt `<skill>/references/mg-prompts/<style>.md` |
| A **music video** or lyric video for a supplied song | **Lyric sync** | [references/music-video.md](references/music-video.md) |
| An explainer, launch or promo video, or anything else | **Generic harness** | §2 below. Borrow a prompt pattern from [references/prompts.md](references/prompts.md) |
| Real archive footage, photos or sound (history, documentary, newsreel) | Any route plus the **archive** | [references/archive-org.md](references/archive-org.md) |

For a request with no style named, suggest two or three routes or styles that fit the topic.
Pick the best one yourself unless the user wants to choose.

## 2. The core contract (every route)

1. **Deterministic frames.** Every pixel is a function of `t` alone. Don't use CSS
   transitions, timers, `Date.now()` or state carried between frames. Use seeded randomness
   (`hash(i)`, a per-element seed) and reseed jitter on a fixed clock for "boil". Then frames
   render in parallel and in any order, and the preview matches the export.
2. **Storyboard before code.** Write `STORYBOARD.md` (or Lemo's `TREATMENT.md`) with a
   logline, world and palette, motif, and shots with times and transitions. For each shot,
   list its **reads**: what the viewer must understand, in order, with a start and end time.
   Show it to the user only when they asked to review one.
3. **Build shot by shot** and block the key poses as stills before adding motion.
4. **Look at it.** You can't see motion by reading code. Render contact sheets of every
   shot, frame strips of every key move and transition, and full-resolution crops of faces
   and type. Fix what you see, then look again. Full checklist: [references/craft.md](references/craft.md).
5. **Sound is code too.** An `audio.py` (or Web Audio rendered offline) synthesises music and
   effects from the same `cues.json` the picture uses. Master to −14 LUFS integrated with
   true peak ≤ −1 dBTP. Narration comes from TTS only when asked for (Lemo's `core/tts` has a
   local Kokoro voice).
6. **Independent review.** For anything beyond a quick draft, run the jury prompt in
   [references/mg-rubric.md](references/mg-rubric.md) in a *separate* agent (a Claude
   subagent or a Codex `-s read-only` run). Then apply one or two revision rounds.
7. **Deliver** `out/video.mp4`, the source, the storyboard and a contact sheet, and say where
   they are.

### Generic harness (the mg-styles renderer)

```bash
mkdir -p <project>/film/out && cp -R <skill>/assets/harness <project>/harness
cd <project>/harness && npm install            # puppeteer-core only; uses the system Chrome
# film/index.html defines window.DEMO = {width,height,fps,duration}, window.renderAt = async t => {...},
# then sets window.__ready = true. Optional film/out/audio.wav is muxed automatically.
cd <project> && node harness/render.mjs film --stills 0.5,2,4   # check frames → film/out/stills/
node harness/render.mjs film                                   # → film/out/video.mp4
#   --mb 4 --shutter 0.5 motion blur · --scale 0.5 drafts · --workers 2 · --w/--h/--fps/--duration overrides
```

The page must live in a **subfolder** of the folder that holds `harness/`, because the
renderer serves its parent directory. Chrome path: `MG_CHROME`. Linux GPU flags: `MG_GPU_ARGS`.
Open `harness/preview.html` to scrub. Contact sheet: `ffmpeg -i film/out/video.mp4 -vf
"fps=2,scale=320:-1,tile=6x4" -frames:v 1 film/out/sheet.jpg`.

## 3. Taste rules that hold across routes

- **One idea, one hook, one hero moment, one ending that rhymes with the opening.**
- **Time for the viewer, not the code.** Quick actions, held meanings, and one read at a
  time. Generated films fail most often at timing.
- **Ban the template look.** No particle explosions, RGB split, lens-flare soup, purple/cyan
  neon, glowing brains, Matrix rain, bouncy-ease-everything, or a centred-title-over-gradient
  look. List the bans in the storyboard.
- **Show, don't caption.** Text only where it is the point (kinetic type, a lyric, a label
  that *is* the joke). Use real fonts loaded before `__ready`, never fallbacks or tofu.
- **Fictional brands and copy** unless the user supplies theirs. Use only licensed or
  public-domain media, and credit it.
- Effort matters: high/xhigh reasoning produces more detailed, more ambitious scenes. Long
  films cost real money (a multi-minute MV can run to hundreds of dollars), so draft at
  `--scale 0.5` and render full resolution once.

## Companion skills

When they are installed, read them alongside this one: `animate` for every motion decision
(curve, duration, interruption), `better-typography` for on-screen type, `better-ui` for any
rebuilt product UI, and `design-workflow` for taste and the slop check on a product's own
brand. For a website launch video in the Hyperframes pipeline, `brag` and `brag-slim` are the
alternative route.

## Beyond this skill

These need something other than code and local tools. Name them to the user rather than
faking them:

- **Photoreal footage, real people, lip-sync** → an external video model (Seedance, Kling,
  Veo, Runway). The usual pattern is: the code film directs, composites and edits, and the
  model supplies plates. The connected **Higgsfield** MCP (claude.ai) is one route.
  [Open-Generative-AI](https://github.com/Anil-matcha/Open-Generative-AI) (`fetch.sh open-gen-ai`)
  is a self-hosted studio UI for 600+ image/video models, but every generation goes through
  the paid **MuAPI** service with the user's own API key and billing. Treat it as an app the
  user runs, not something an agent can do for free, and ignore its "no content filters"
  pitch.
- **Browsing finished films for inspiration**: [pdoom.video](https://pdoom.video) is a
  directory of about 1,000 code-made films, half with their prompts. It is a website with no
  API, so read it in a browser. The same prompts are mostly in the fetched prompt libraries.
- **Licensed music and voice clones**: songs the user supplies keep their own rights.
  Synthesised scores are safe. Cloning a real voice needs that person's consent.
- **Publishing** (YouTube, X) is the user's call.

Sources, pins and licences: [references/sources.md](references/sources.md).
