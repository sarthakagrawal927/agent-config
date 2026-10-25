# Prompt patterns and the prompt libraries

Use these when the user wants a quick start, wants to remake a known video, or gives a
one-line request that needs structure. The prompts belong to their authors. Quote them with
the author and post link, and adapt the pattern rather than republishing prompts wholesale.

## The libraries (fetch on demand)

| Source | What | Fetch |
|---|---|---|
| yihui-dev/awesome-opus5-5-videos (MIT) | 703 prompts with author, category (`motion`, `3d`, `explainer`, `interactive`), tech tags and post URL in `data/videos.json`; 418 have live remakes on skillry.dev | `fetch.sh awesome-opus` |
| joeseesun/opus-video-prompts (no licence; read only) | 18 curated, complete prompts in Chinese and English from the first week, plus writing lessons | `fetch.sh opus-prompts` |
| athemeroy/awesome-claude-5-5-videos (CC BY 4.0) | Research: 424 source posts across Opus, Sonnet, Haiku and Fable, a domain×style atlas, colour study, workflow and cost analysis, prompt playbook | `fetch.sh awesome-claude` |
| pdoom.video (website) | About 1,000 films, 501 with prompts, filterable by tool (Canvas, SVG, three.js, shaders, Remotion, GSAP, Blender) | browse |

```bash
# find prompts by category and tech, shortest first
jq -r '[.[] | select(.category=="explainer" and (.tech_tags|index("threejs")))] | sort_by(.prompt|length) | .[:10][] | "\(.author)  \(.post_url)\n  \(.prompt[:300])\n"' "$DIR/data/videos.json"
```

From the athemeroy research, choose the medium from the domain: games and interactive work
lean toward 3D (70%), ads and launch films toward motion graphics and UI (72%), and education
and stories vary most. Motion-graphics work splits about 57/43 between dark-neutral and
light-neutral palettes, so pick deliberately rather than averaging.

## Patterns that work

**One-liner (fast, cheap, surprisingly good).** Deedy's launch film came from
`make a modern slick and punchy video for a modern startup that works on inference`, which
took about a minute and $2. Good for a first draft; then iterate one note at a time ("slower",
"more energy", "add a pricing scene").

**Five-scene explainer template** (after @alex_prompter): role ("expert motion designer"),
length, scene list (problem → what we do → how, in 3 steps → one proof point → name), the
brand colours, then the business description.

**Director's brief (high-end product film, after @twoclipping)**. This is the strongest
pattern for launch films. Use these sections:
- `<inputs>`: ask for the product name and promise, 3–5 UI moments, one accent colour, the
  real clips, and a song with a clear drop and a commercial licence.
- `<direction>`: one idea per shot, lots of empty space, one accent, one clean sans with tight
  tracking, masked type reveals, match cuts. **Banned:** shockwave rings, particle bursts, RGB
  split, camera shake, lens flares, neon glow, grid floors, flashing backgrounds, bouncy easing.
- `<structure>`: bars at a fixed BPM, with one move per bar written out.
- `<build>`: compute everything inside `seek(t)` from time alone; real clips as frame
  sequences swapped per frame; numpy beat grid calibrated to real kick hits; 3 sub-frames
  blended for motion blur; each sound effect's *measured peak* placed on its event;
  loudnorm to −14 LUFS; probe 20+ frames before the full render.
- `<gotchas>`: never put opacity or filter on a `preserve-3d` element (fade its wrapper);
  measure element positions at runtime for match cuts.
- `<start>`: ask for the inputs, then show a storyboard on the beat grid before any code.

**Spec-type character piece (pixel wizard, prehistoric island).** Give exact sprite or scene
specs, the palette, the frame grid and the beats. This works best when the look must be precise.

**Adapt existing footage** (a talking head turned into a line-art explainer): supply the video,
have the agent transcribe it and cut chapters, then redraw it in a style with the original
audio kept.

**Hybrid with a video model** (fal character images → Seedance plates → JS re-paint frame by
frame): see **Beyond this skill** in SKILL.md.

## Lessons from the first wave of creators

- Storyboard first, code second, so single shots can be revised.
- Give structure like a director and use references rather than adjectives.
- A ban list removes most of the template look.
- Use deterministic rendering only. Stateful animation flickers under parallel rendering.
- Make it watch its own output and rework it before the final render.
- Use high effort and put API docs for TTS, music or video tools in the project. Keep keys in
  `.env` with reads denied.
- "One-shot" results often took two or more rounds, so budget for iteration. A multi-minute MV
  can cost about $200 in one session.
