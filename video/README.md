# Oyla video

The product demo (`OylaDemo`, 36 s, 1920×1080) and the README teaser (`OylaTeaser`, 8 s GIF),
made with [Remotion](https://www.remotion.dev/). The scenes use the app's real screenshots from
`../docs/media/screenshots` (copied into `public/shots`) and redraw the live bar chart natively.

```bash
npm install
npm run dev          # Remotion Studio, to preview and tweak scenes
npm run render       # out/oyla-demo.mp4, out/oyla-teaser.gif, out/oyla-demo-poster.png
```

Then copy the outputs where they are used:

```bash
cp out/oyla-teaser.gif out/oyla-demo.mp4 out/oyla-demo-poster.png ../docs/media/
cp out/oyla-demo.mp4 out/oyla-demo-poster.png ../docs-site/public/media/
```

To refresh the screenshots first, run `node scripts/capture-screenshots.mjs` from the repo root
(see the comment at the top of that script) and copy the files the scenes use into `public/shots`.

## macOS older than 15

Remotion's bundled headless Chrome needs macOS 15 or later. On older systems, point Remotion at
another Chromium, for example the one Playwright installs for the end-to-end tests:

```bash
export REMOTION_BROWSER_EXECUTABLE="$HOME/Library/Caches/ms-playwright/chromium_headless_shell-<version>/chrome-headless-shell-mac-arm64/chrome-headless-shell"
npm run render
```

## License

The code is MIT like the rest of Oyla. Remotion itself has its own license: free for individuals
and companies of up to three people; see [remotion.pro/license](https://www.remotion.pro/license).
