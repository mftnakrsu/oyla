# Oyla video

The product demo, the question-type clips for the docs and the README teaser, made with
[Remotion](https://www.remotion.dev/). Every scene is built on the app's real screenshots
(`../docs/media/screenshots`, copied into `public/shots`). Where something moves, it is redrawn
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

`<lang>` is `en` or `tr`; `<type>` is `multiple-choice`, `word-cloud`, `open-ended` or `scale`.
The clips loop without a seam: their first and last frames show the same resting state.

The demo takes a `lang` input prop; both languages are registered as their own composition. Every
word on screen lives in `src/i18n.ts`, one dictionary per language. The scenes are also registered
on their own (folder _Scenes_ in the Studio) for previewing.

## Commands

```bash
npm install
npm run dev              # Remotion Studio, to preview and tweak scenes
npm run render           # everything below, then copies the files where they are used
npm run render:demo:en   # or render:demo:tr, render:demo (both)
npm run render:posters
npm run render:clips
npm run render:teaser
npm run lint             # eslint and tsc
```

`npm run render` takes a few minutes. It bundles the project once, then renders each output in
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
