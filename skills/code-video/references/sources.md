# Sources, pins and licences

Reviewed 2026-10-25. Pins live in `scripts/fetch.sh`. To move one, review the upstream diff,
then edit its commit.

| Source | Licence | Pin | Used how |
|---|---|---|---|
| [JohnHeibel/ClaudeAnimationBase](https://github.com/JohnHeibel/ClaudeAnimationBase) | MIT | `0ac8bf2` | **Vendored** as `assets/clawd-kit/` (without the 6 MB `docs/emotions.webp`); its guide is distilled in `references/craft.md` |
| [Vincentwei1021/mg-styles-15](https://github.com/Vincentwei1021/mg-styles-15) | MIT | `49052d8` | **Vendored**: `harness/render.mjs` + `preview.html` → `assets/harness/`; 15 prompts → `references/mg-prompts/`; `rubric.md` → `references/mg-rubric.md`. Demos fetched on demand |
| [lemomo-ai/lemo-opuscar](https://github.com/lemomo-ai/lemo-opuscar) | MIT | `413a6bd` | Fetched (sparse, about 30 MB) and followed through its own `AGENTS.md` in skill mode |
| [mexicat/pdoom-video](https://github.com/mexicat/pdoom-video) | MIT (code only; the song and lyrics are not covered) | `fa164b7` | Fetched; lyric-alignment and render pipeline in `references/music-video.md` |
| [JohnHeibel/PDoomVideo](https://github.com/JohnHeibel/PDoomVideo) | none stated | `fa546a3` | Fetched read-only as a worked example; not copied |
| [joeseesun/opus-video-prompts](https://github.com/joeseesun/opus-video-prompts) | none stated (prompts belong to their authors) | `7977c80` | Fetched read-only; patterns summarised with attribution in `references/prompts.md` |
| [yihui-dev/awesome-opus5-5-videos](https://github.com/yihui-dev/awesome-opus5-5-videos) | MIT (prompts belong to their authors) | `92aee2f` | Fetched; searchable `data/videos.json` |
| [athemeroy/awesome-claude-5-5-videos](https://github.com/athemeroy/awesome-claude-5-5-videos) | CC BY 4.0 | `87e5cbf` | Fetched; research findings cited in `references/prompts.md` |
| [Anil-matcha/Open-Generative-AI](https://github.com/Anil-matcha/Open-Generative-AI) | MIT | `f48e5b7` | Not used by the pipeline. It is a self-hosted UI over the paid MuAPI service; see **Beyond this skill** |
| [archive.org/developers](https://archive.org/developers/) | per item | — | Search, metadata and download recipes plus the rights check in `references/archive-org.md` |
| [pdoom.video](https://pdoom.video) | per film | — | Inspiration directory; browse only (no API) |

Vendored files keep their upstream `LICENSE` beside them. Fetched sources go to
`${CODE_VIDEO_HOME:-~/.cache/code-video}/<source>` and are read-only reference: copy what a
film needs into its own project folder, and never build inside the cache.
