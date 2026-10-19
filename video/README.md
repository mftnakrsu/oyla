# Oyla video

The product demo, the vertical social cut, the question-type clips for the docs and the README
teaser, made with [Remotion](https://www.remotion.dev/). Every scene is built on the app's real
screenshots (`../docs/media/screenshots`, copied into `public/shots`). Where something moves, it is redrawn
natively on top of the screenshot at the app's own sizes: the multiple-choice bars and the scale
columns, the typing on the phone, and the "unselected" option before a tap. The word cloud and the
open-question cards are cut out of the screenshots, so they look exactly like the app.

## What it makes

| Composition | Output | Copied to |
| --- | --- | --- |
| `OylaDemo-en`, `OylaDemo-tr` | `oyla-demo-<lang>.mp4`: 39.5 s, 1920×1080, 30 fps, H.264, no audio | `../docs/media/`, `../docs-site/public/media/` |
| (stills of the same, frame 630) | `oyla-demo-<lang>-poster.png` | `../docs/media/`, `../docs-site/public/media/` |
| `clip-<type>-<lang>` | `clips/<type>-<lang>.mp4`: 6 s loop, 1280×720, 30 fps, H.264, no audio | `../docs-site/public/media/clips/` |
| (stills of the same, frame 140) | `clips/<type>-<lang>.png` | `../docs-site/public/media/clips/` |
| `OylaTeaser` | `oyla-teaser.gif`: 8 s loop, 960×540, 15 fps | `../docs/media/` |
| `OylaSocial-en`, `OylaSocial-tr` | `oyla-social-<lang>.mp4`: 25.5 s, 1080×1920 (9:16), 30 fps, H.264, no audio, subtitles burned in | stays in `out/` |
| `OylaDemo-<lang>` with `captions: true` | `oyla-demo-<lang>-captioned.mp4`: the demo with subtitles burned in | stays in `out/` |
| (subtitle scripts) | `captions/oyla-demo-<lang>.srt`, `.vtt`, `.json`, `captions/oyla-social-<lang>.srt`, `.vtt`, `.json` | stays in `out/` |
| `OylaDemo-<lang>` (with subtitles), `OylaSocial-<lang>`, with voiceover and music | `oyla-demo-<lang>-voiced.mp4`, `oyla-social-<lang>-voiced.mp4`: AAC audio (`npm run render:voiced`) | stays in `out/` |

`<lang>` is `en` or `tr`; `<type>` is `multiple-choice`, `word-cloud`, `open-ended` or `scale`.
The clips loop without a seam: their first and last frames show the same resting state.

The demo takes a `lang` input prop; both languages are registered as their own composition. Every
word on screen lives in `src/i18n.ts`, one dictionary per language. The scenes are also registered
on their own (folder _Scenes_ in the Studio) for previewing.

## Social cut, subtitles and audio

`OylaSocial` is a 9:16 cut for LinkedIn, X, Reels and Shorts, built from the same screenshots and
components as the demo but laid out for a phone (`src/social/`). The first frame already states the
promise in big type, so it doubles as the cover. Everything stays inside the margins in
`src/social/layout.ts`, clear of the apps' own buttons and captions: nothing above 230 px, nothing
in the 100 px side margins or in the bottom 390 px.

Subtitles are timed data in `src/captions.ts`: start and end in milliseconds and the text, per
composition and language. They are burned in by `components/Subtitles.tsx`, and
`scripts/export-captions.mjs` (`npm run render:captions`) writes the same cues as `.srt` and `.vtt`
to `out/captions/`, ready for a text-to-speech voiceover or a platform's own subtitle upload. When
you edit a line, keep it within its scene (the scene times are in the comment above each script).

Both the demo and the social cut take these props:

| Prop | Default | |
| --- | --- | --- |
| `captions` | `false` for `OylaDemo`, `true` for `OylaSocial` | Burned-in subtitles. Off, the demo renders exactly as before; on, its scenes shrink to 90 % to make room for them. |
| `musicSrc`, `musicVolume` | none, `0.4` | Background music: a file in `public/` (e.g. `audio/music.mp3`) or a URL. Fades in over 0.5 s and out over the last 1.5 s. |
| `musicDuckedVolume` | half of `musicVolume` | The music volume while a voiceover line plays (it dips under every caption cue). |
| `voiceoverSrc`, `voiceoverVolume` | none, `1` | A voiceover track, e.g. generated from the `.srt` files. |
| `voiceoverClips` | none | A folder in `public/` with one clip per caption cue (`01.wav`, `02.wav`, …), each played from the start of its cue and cut at its end. |

Without a source the videos stay silent. With audio, render without `--muted` (the `h264()` flags in
`scripts/render.mjs` drop the audio track), for example:

```bash
npx remotion render OylaSocial-en out/oyla-social-en-music.mp4 \
  --props='{"musicSrc":"audio/music.mp3","voiceoverSrc":"audio/voiceover-en.mp3"}'
```

### Voiced renders

`npm run render:voiced` (not part of `npm run render`) writes `oyla-demo-<lang>-voiced.mp4` (with
subtitles) and `oyla-social-<lang>-voiced.mp4` to `out/`. The voice is one clip per caption cue in
`public/audio/voiceover/oyla-<video>-<lang>/`, made from `out/captions/*.json` by
a separate voiceover script that is not in this repository (Chatterbox Multilingual with
one fixed voice; best of several takes, checked with Whisper, trimmed, -16 LUFS). A
cue's optional `say` in `src/captions.ts` is what the voice reads instead of the subtitle (e.g.
"Em Ay Ti" for "MIT"), only a respelling: the voice says the same words as the subtitle. Every cue is voiced,
and each clip fits inside its cue; a line too long for that is shortened in `text`. After changing a line, re-export the captions, regenerate its clip and check
that it still fits its cue. The music is the `MUSIC` constant in `scripts/render.mjs` (files in
`public/audio/`, CC0): 0.5 between lines, ducked to 0.25 under the voice.

## Commands

```bash
npm install
npm run dev              # Remotion Studio, to preview and tweak scenes
npm run render           # everything below, then copies the files where they are used
npm run render:demo:en   # or render:demo:tr, render:demo (both)
npm run render:posters
npm run render:clips
npm run render:teaser
npm run render:social    # the 9:16 cut in both languages, plus the .srt/.vtt files
npm run render:demo:captioned
npm run render:voiced    # demo and social cut with voiceover and music → out/*-voiced.mp4
npm run render:captions  # only the .srt/.vtt/.json files (Node 22.18+, which runs TypeScript directly)
npm run lint             # eslint and tsc
```

Add `-- --no-copy` to keep everything in `out/` (nothing is copied into `docs/` or `docs-site/`),
and `-- --concurrency=8` on a machine with more memory, e.g.
`npm run render -- --no-copy --concurrency=8`.

`npm run render` takes several minutes. It bundles the project once, then renders each output in
turn with two browser tabs (`--concurrency=2`), so it fits in 8 GB of memory. Outputs are written to
`out/` first; see `scripts/render.mjs`.

## Refreshing the screenshots

1. From the repo root, capture new screenshots (see the comment at the top of
   `scripts/capture-screenshots.mjs`).
2. Here, run `npm run shots` (`scripts/prepare-shots.py`, needs Python 3 with Pillow, numpy and
   scipy). It copies the screenshots into `public/shots`, cuts out each word of the word cloud and
   each open-question card, makes the unselected phone states, and writes their positions to
   `src/data/shots.ts`. The word cloud rectangles in the script are measured by hand: if the cloud
   screenshots change, check them (the script stops if a letter falls outside every rectangle).
3. Render.

## macOS older than 15

Remotion's bundled headless Chrome needs macOS 15 or later. On older systems, point Remotion at
another Chromium, for example the headless shell Playwright installs for the end-to-end tests
(`remotion.config.ts` reads this variable):

```bash
export REMOTION_BROWSER_EXECUTABLE=$(ls -d $HOME/Library/Caches/ms-playwright/chromium_headless_shell-*/chrome-headless-shell-mac-arm64/chrome-headless-shell | tail -1)
npm run render
```

## License

The code is MIT like the rest of Oyla. Remotion itself has its own license: free for individuals
and companies of up to three people; see [remotion.pro/license](https://www.remotion.pro/license).
Atkinson Hyperlegible Next (`public/fonts`) is under the SIL Open Font License.
