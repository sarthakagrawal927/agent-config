# Routes and style indexes

## Clawd kit (hand-painted character cartoons)

Vendored from [JohnHeibel/ClaudeAnimationBase](https://github.com/JohnHeibel/ClaudeAnimationBase)
(MIT) at `<skill>/assets/clawd-kit/`. It uses p5.js and p5.brush, with 31 emotions, five key
views, hats, emotes, dances, camera, glow, paper and brush-wipe or iris transitions.

```bash
cp -R <skill>/assets/clawd-kit <project> && cd <project> && npm install
# read ANIMATION_GUIDE.md fully, write STORYBOARD.md, then src/scenes/<film>.js and swap it into studio.html
node render.mjs --sheet=0.1,0.8,1.6 --cols=6 --w=320 --out=out/check/sheet.jpg
node render.mjs --clip --out=out/video.mp4
```

The kit's rules are: everything goes through p5.brush, no text, an event in every shot, flat 2D
with drawn turnarounds and no 3D projection, transitions always, and a storyboard first. The
user's prompt overrides any of them. Swap Clawd for the user's own character with the same
tools. Without a discrete GPU the watercolour fills are slow (seconds per frame), so use flat
washes for drafts. The animated emotion sheet (`docs/emotions.webp`, 6 MB) is not vendored, but
the `.jpg` sheets are. For a full worked example with nine chapters, a song and parallel
subagents, run `fetch.sh pdoom-clawd` (no licence: read it, don't copy it).

## Lemo-Opuscar (59 named film styles)

```bash
sh <skill>/scripts/fetch.sh lemo-opuscar            # → DIR (sparse: guides, core/, every STYLE.md)
LEMO_OPUSCAR_HOME="$DIR" sh "$DIR/plugin/skills/lemo-opuscar/scripts/setup.sh" deps   # Node pkgs, headless shell, Python core
# add `voice` (Kokoro TTS) or `music` only when the film needs them
sh <skill>/scripts/fetch.sh lemo-opuscar /styles/<slug>/demo/   # a style's demo: only AFTER TREATMENT.md
```

Then read `$DIR/AGENTS.md` and follow it in **skill mode** (`$DIR/plugin/skills/lemo-opuscar/SKILL.md`).
In skill mode the project folder is `<name>/` in the user's folder, tools run from `$DIR` with
absolute project paths, and pages use `/core/lib.js` URLs. `STYLE.md` is fixed and the story is
yours. Write the treatment first and read the demo later, only for technique. Don't run the
upstream `setup.sh` without `LEMO_OPUSCAR_HOME`, because it would clone an unpinned copy to
`~/lemo-opuscar`. Gallery with every demo: https://lemomo-ai.github.io/lemo-opuscar/

Styles (folder in `styles/README.md`):

- **Edit & Documentary:** Caption News, 1920s Newsreel, Live Countdown Split-screen, Time-lapse Symphony, Visual Investigation, Constructivist Montage, Sports Telestrator, Broadcast News Package
- **Evidence Films:** Satellite Briefing, Engineering Briefing Board, LiDAR Survey, Projection on White Model, Data Physicalization, Exploded Teardown, Microscope Story, Archive Light Table
- **Hand-drawn & Painting:** Crayon Picture Book, Watercolor Brush, Chinese Ink Wash, Impasto Oil Painting, One-line Drawing, Whiteboard Explainer, Urban Sketch · Pen & Wash
- **East Asian Traditions:** Shadow Puppetry, Ukiyo-e, Red Paper-cut, Paper-cut Lightbox
- **Print & Printmaking:** Risograph Print, Halftone Dossier, Woodcut Print, Copperplate Engraving, Silkscreen Travel Poster
- **Graphic & Type:** Swiss Motion Graphics, 60s Spy Title Sequence, Art Deco, Blueprint, Stained Glass, Pictogram Motion, ASCII / CRT Terminal
- **Information & Keynote:** Data Storytelling, Isometric Infographic, Dark Tech Keynote, Living Screencast, Sci-fi Hologram HUD
- **Cartoon & Anime:** 1930s Rubber Hose Cartoon, 80s Cel Anime, Sci-Fi Sitcom Toon, Mid-century Cartoon
- **Games:** 16-bit Pixel RPG, HD-2D, Microgame Frenzy, Game Show Flat
- **Cinema & Eras:** 1920s Silent Film, Liminal Found Footage
- **Materials & 3D:** Brick Toy, Paper Pop-up Book, Tilt-Shift Miniature, Low-poly Isometric Island, Glass Product Render

The user's own saved styles live in `~/lemo-my-styles/` (see `$DIR/MY-STYLES.md`).

## MG styles (15 motion-design styles, 10 s each)

From [Vincentwei1021/mg-styles-15](https://github.com/Vincentwei1021/mg-styles-15) (MIT). Each
prompt in `<skill>/references/mg-prompts/` is a full brief. It sets the output spec, a suggested
technical route, a creative seed with beats, and the **signature features** the film is judged
against. To use one, keep the shared sections and the signature features, replace the creative
seed with the user's topic and brand, and render with the generic harness. For a reference
implementation, `fetch.sh mg-styles-15` gets `demos/<slug>/`.

| Style | Prompt | Technical route in the original |
|---|---|---|
| Frame-by-Frame / Line Boil | `05-cel-boil.md` | Canvas2D variable-width brush, boil cycled on 2s, paper multiply |
| Isometric 2.5D | `03-isometric.md` | three.js orthographic iso camera, soft shadows + AO |
| Flat Vector | `01-flat-vector.md` | SVG + GSAP custom ease/bounce/morph, motion blur on fast moves |
| Line Art | `02-line-art.md` | SVG stroke-dashoffset draw-on, camera follows the pen tip |
| 3D Render (C4D/Blender look) | `04-3d-render.md` | Blender CLI (Cycles/EEVEE) → PNG sequence, HTML overlay for type and grain |
| Shape Morph | `08-morph.md` | SVG + flubber/MorphSVG, colour-field wipes |
| Sticker Explainer | `19-paperclip.md` | one huge canvas with a camera transform, SVG charts, white-outlined photo stickers |
| Cyberpunk HUD / FUI | `22-hud.md` | SVG/Canvas FUI layers + three.js wireframe hologram, glow/scanline post |
| Collage / Cut-out | `06-collage.md` | CC0/PD photo cut-outs, halftone filters, motion stepped at 12 fps |
| Aurora & Glassmorphism | `12-aurora-glass.md` | WebGL aurora shader + SDF glass refraction + backdrop-filter cards |
| Geometric Bauhaus | `09-bauhaus.md` | SVG/Canvas + GSAP on a strict modular grid, 120 BPM |
| 80s Synthwave / VHS | `10-synthwave.md` | WebGL grid, sun and mountains, chrome text, VHS pass |
| Pixel Art | `20-pixel.md` | 320×180 canvas ×6 nearest-neighbour, sprites as pixel arrays |
| Liquid Motion | `07-liquid.md` | WebGL2 SDF metaballs with gradient lighting, SDF logo |
| Variety Captions (9:16) | `18-hanazi.md` | layered text-stroke 花字 captions, spring pops, over CC0 footage |

To write a new style prompt, copy the shared sections of any of these and fill in Style,
Output, Suggested technical route, Creative seed (beats by the second, 3–6 hex colours, type
mood, sound) and testable Signature features ("overshoot with cubic-bezier(0.34,1.56,0.64,1),
staggered 2–4 frames", not "make it bouncy"). Watch all 15 at
https://vincentwei1021.github.io/mg-styles-15/
