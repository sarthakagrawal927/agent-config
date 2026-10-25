# Real material from the Internet Archive

Use it for newsreels, documentaries, collage, archive light tables and "Edit & Documentary"
styles. Developer hub: https://archive.org/developers/ . Before running bulk jobs, read its
"Bots, LLMs, and Automated Access" page.

## Find

```bash
# advanced search (no key needed); mediatype: movies | audio | image | texts
curl -s 'https://archive.org/advancedsearch.php?q=collection%3Aprelinger+AND+subject%3A%22automobiles%22&fl[]=identifier&fl[]=title&fl[]=year&fl[]=licenseurl&rows=50&output=json'
# item metadata: files, formats, rights fields
curl -s https://archive.org/metadata/<identifier> | jq '.metadata | {title, date, licenseurl, rights}, ([.files[] | {name, format, size}] | .[0:20])'
# download one file
curl -L -o clip.mp4 'https://archive.org/download/<identifier>/<file>'
```

The official CLI is `uvx --from internetarchive ia search 'collection:prelinger' --itemlist`,
`ia metadata <id>` and `ia download <id> --glob='*.mp4'`. Docs:
https://archive.org/developers/internetarchive/cli.html

Good public-domain or CC pools include `collection:prelinger` (ephemeral films, mostly public
domain), `collection:feature_films`, `collection:nasa`, `collection:fedflix` (US government
works), `collection:georgeblood` (78 rpm audio; check the item), and `collection:opensource_audio`
(mixed licences, so check every item).

## Rights check (every item, every time)

- The Archive "does not assert any new copyright" over what it hosts, so hosting doesn't make
  an item public domain.
- Accept an item only when its `licenseurl` is CC0, a public-domain mark or a permissive CC
  licence, or when its metadata or collection documents public-domain or US-government status.
  Record the identifier, the licence and the URL in `CREDITS.md` and in the film's end credits
  when the licence requires attribution.
- If the status is unclear, don't use the item and tell the user why.
- Be polite: fetch serially, download only what the film uses, and cache it locally.

## Using footage in a code film

Transcode to an edit-friendly intermediate first:
`ffmpeg -i in.mp4 -vf fps=24,scale=1920:-2 -c:v libx264 -crf 12 -g 1 clip.mp4`. Then either
pre-extract frames as `t`-addressed images, or seek a `<video>` element to `t` inside
`renderAt` and await its `seeked` event. Lemo's Edit & Documentary styles ship material tools
(`demo/tools/footage.py`); read the style's `STYLE.md` for those, before writing the treatment.
