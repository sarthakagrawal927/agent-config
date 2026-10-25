# Lyric-synced music videos

Two reference builds of the same song, *I'm Upping My P(doom)*:

- **mexicat/pdoom-video** (MIT code; the song and lyrics belong to their authors). It has
  karaoke typography, 17 "plates", TypeScript, three.js, bun and Vite, and renders at 1080p60
  or 4K60. Get it with `fetch.sh pdoom-video` and read `docs/TREATMENT.md` (style bible) and
  `docs/ENGINE.md` (engine).
- **JohnHeibel/PDoomVideo** (no licence: read only). This is the Clawd p5.brush version, nine
  chapters built by parallel subagents from one shared `ANIMATION_GUIDE.md`. Get it with
  `fetch.sh pdoom-clawd`.

## Pipeline

1. **Timing data first.** Everything is placed against the audio, never against guessed times.
   - Stems: Demucs `htdemucs_ft` (`uv run python -m demucs -n htdemucs_ft -o stems song.mp3`).
     Use a karaoke separator for the lead vocal when backing vocals double it.
   - Words: CTC forced alignment on the vocal stem, cross-checked with Whisper. Use agreement
     between models as confidence, and add manual anchors only where the plots show the
     automatic result is wrong. The output is `data/lyrics.json` (word-level, some syllables).
   - Music: tempo, beats, downbeats, sections, drum and vocal onsets, and loudness envelopes go
     into `data/audio.json`. The models download about 4 GB of weights, so delete the cache
     afterwards.
   - Run `fetch.sh pdoom-video` and use `analysis/align.py` and `analysis/analyze.py`
     (run with `uv`) as working references.
2. **Edit = timeline.** Scene windows are anchored to lyric lines and snapped to the beat grid.
   Scenes look lines up by content through a lyrics API and never hard-code times.
3. **Karaoke rules.** A word highlights exactly at its start and completes by its end. It may
   appear dim up to about 0.4 s early but never runs ahead of the voice. Each plate integrates
   the lyric *graphically* (written by a pen, riding a curve, typed as tokens, stamped on a
   form), so the words are part of the image rather than subtitles. Keep them title-safe.
4. **Style bible.** Write it before scenes. It covers one palette (one signal colour owns the
   glow), one type system, one grain, recurring motifs, and an explicit "not slop" list.
   Plates may change idiom, but they share the bible.
5. **Render.** Every frame is a deterministic function of song time, so the preview and the
   export match. Motion blur comes from averaging sub-frames over a short shutter, with an
   adaptive per-tile sample count (cheap on still areas, 100+ samples on whips). Run two headless
   renderers feeding one ffmpeg, in order. 4K means a true `--scale 2` render, not an upscale.
   Expect about an hour and more than 20 GB of RAM for a whole song at 4K.

## Simpler path

For a short lyric video, hand-time `cues.json` from a waveform (or beat-track it with
`librosa`), build the page on the generic harness, put the song at `film/out/audio.wav`, and
let the harness mux it. Keep the same karaoke rules.

Rights: a supplied song stays the user's or its author's. Credit it, and don't publish a track
the user has no right to.
