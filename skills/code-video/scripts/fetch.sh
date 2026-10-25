#!/bin/sh
# Fetch a code-video source library at its reviewed commit (read-only reference material).
#   sh fetch.sh <source> [extra sparse paths...]   → prints DIR=<path> on the last line
#   sh fetch.sh list                               → the sources and their pins
# Sources land in ${CODE_VIDEO_HOME:-~/.cache/code-video}/<source>. Big assets are skipped (blob filter / sparse).
# To move a pin, review the upstream diff, then edit the commit below.
set -e
HOME_DIR=${CODE_VIDEO_HOME:-$HOME/.cache/code-video}

pin() {
  case "$1" in
    lemo-opuscar)    echo "https://github.com/lemomo-ai/lemo-opuscar.git 413a6bd6d78ebd3bdd5abaec9538a26867f890df sparse" ;;
    mg-styles-15)    echo "https://github.com/Vincentwei1021/mg-styles-15.git 49052d80bfaf9fa8412cc9710530e5e95a3b8d8c blob" ;;
    pdoom-video)     echo "https://github.com/mexicat/pdoom-video.git fa164b74fd0b26a99375715b619c55b4a0fb3d05 blob" ;;
    pdoom-clawd)     echo "https://github.com/JohnHeibel/PDoomVideo.git fa546a38092e75f2b079e6a86d6abc54dd525d17 blob" ;;
    animation-base)  echo "https://github.com/JohnHeibel/ClaudeAnimationBase.git 0ac8bf2b31942376cb6b8c4074715595d512acd2 blob" ;;
    opus-prompts)    echo "https://github.com/joeseesun/opus-video-prompts.git 7977c807781d4ba7c235247b8899a72575a30d00 full" ;;
    awesome-opus)    echo "https://github.com/yihui-dev/awesome-opus5-5-videos.git 92aee2f586ac0715cb3cbcb6384834f98a33383d full" ;;
    awesome-claude)  echo "https://github.com/athemeroy/awesome-claude-5-5-videos.git 87e5cbfaa4bf1f6516a6c69be58c42a9b85a1041 blob" ;;
    open-gen-ai)     echo "https://github.com/Anil-matcha/Open-Generative-AI.git f48e5b7b74b39152b3c635aa29ee93ef1dd1afaf blob" ;;
    *) return 1 ;;
  esac
}
ALL="lemo-opuscar mg-styles-15 pdoom-video pdoom-clawd animation-base opus-prompts awesome-opus awesome-claude open-gen-ai"

[ -n "$1" ] || { echo "usage: sh fetch.sh <source|list> [extra sparse paths...]"; exit 1; }
if [ "$1" = list ]; then for s in $ALL; do echo "$s $(pin $s)"; done; exit 0; fi
spec=$(pin "$1") || { echo "✗ unknown source '$1' (sources: $ALL)"; exit 1; }
name=$1; shift
set -- $spec "$@"; url=$1; sha=$2; mode=$3; shift 3
dir="$HOME_DIR/$name"
command -v git >/dev/null || { echo "✗ git is needed"; exit 1; }

if [ ! -d "$dir/.git" ]; then
  mkdir -p "$dir"
  git -C "$dir" init -q
  git -C "$dir" remote add origin "$url"
fi
case $mode in
  sparse) filter="--filter=blob:none" ;;
  blob)   filter="--filter=blob:limit=300k" ;;
  *)      filter="" ;;
esac
if [ "$(git -C "$dir" rev-parse -q --verify HEAD 2>/dev/null)" != "$sha" ]; then
  git -C "$dir" fetch -q --depth 1 $filter origin "$sha"
  if [ $mode = sparse ]; then
    # Lemo-Opuscar: guides, core/ tools and every STYLE.md; demo sources and posters only on request.
    git -C "$dir" sparse-checkout set --no-cone '/*' '!/styles/*/demo/' '!/styleboard/' '!/docs/frames/' '!/docs/*.jpg' '!/styles/*/poster.jpg'
  fi
  git -C "$dir" -c advice.detachedHead=false checkout -q "$sha"
fi
# Extra paths, e.g. a Lemo style's demo: sh fetch.sh lemo-opuscar /styles/impasto/demo/
if [ $# -gt 0 ] && [ $mode = sparse ]; then git -C "$dir" sparse-checkout add "$@"; fi
echo "DIR=$dir"
