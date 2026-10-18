#!/usr/bin/env node
/**
 * Renders the Oyla videos into out/ and copies them where the README and the docs site use them.
 *
 *   node scripts/render.mjs [all | demo | demo-en | demo-tr | clips | teaser | posters] ...
 *
 * The project is bundled once, then each output is rendered in turn with two browser tabs, which
 * keeps memory use low enough for an 8 GB machine.
 */
import { spawnSync } from "node:child_process";
import { copyFileSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const video = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const repo = resolve(video, "..");
const out = join(video, "out");
const bundle = join(out, "bundle");
const docsMedia = join(repo, "docs", "media");
const siteMedia = join(repo, "docs-site", "public", "media");
const siteClips = join(siteMedia, "clips");

const LANGS = ["en", "tr"];
const TYPES = ["multiple-choice", "word-cloud", "open-ended", "scale"];
/** A representative frame: the demo's live results, a clip's finished results. */
const DEMO_POSTER_FRAME = 630;
const CLIP_POSTER_FRAME = 140;

const remotion = (...args) => {
  console.log(`\n> remotion ${args.join(" ")}`);
  const result = spawnSync("npx", ["remotion", ...args], { cwd: video, stdio: "inherit" });
  if (result.status !== 0) process.exit(result.status ?? 1);
};

const copy = (file, ...directories) => {
  for (const directory of directories) {
    mkdirSync(directory, { recursive: true });
    copyFileSync(join(out, file), join(directory, file.split("/").pop()));
  }
};

const render = (id, file, ...flags) => remotion("render", bundle, id, join(out, file), "--concurrency=2", ...flags);
/**
 * H.264, yuv420p tagged as BT.709, no audio track. Frames are captured as PNG: from JPEG frames
 * the encoder would fall back to full-range yuvj420p and the colours would drift.
 */
const h264 = (crf) => ["--codec=h264", `--crf=${crf}`, "--image-format=png", "--pixel-format=yuv420p", "--color-space=bt709", "--muted"];
const still = (id, file, frame) => remotion("still", bundle, id, join(out, file), `--frame=${frame}`, "--image-format=png");

const jobs = {
  "demo-en": () => {
    render("OylaDemo-en", "oyla-demo-en.mp4", ...h264(23));
    copy("oyla-demo-en.mp4", docsMedia, siteMedia);
  },
  "demo-tr": () => {
    render("OylaDemo-tr", "oyla-demo-tr.mp4", ...h264(23));
    copy("oyla-demo-tr.mp4", docsMedia, siteMedia);
  },
  clips: () => {
    for (const type of TYPES) {
      for (const lang of LANGS) {
        render(`clip-${type}-${lang}`, `clips/${type}-${lang}.mp4`, ...h264(27));
        still(`clip-${type}-${lang}`, `clips/${type}-${lang}.png`, CLIP_POSTER_FRAME);
        copy(`clips/${type}-${lang}.mp4`, siteClips);
        copy(`clips/${type}-${lang}.png`, siteClips);
      }
    }
  },
  teaser: () => {
    render("OylaTeaser", "oyla-teaser.gif", "--codec=gif", "--every-nth-frame=2", "--scale=0.5");
    copy("oyla-teaser.gif", docsMedia);
  },
  posters: () => {
    for (const lang of LANGS) {
      still(`OylaDemo-${lang}`, `oyla-demo-${lang}-poster.png`, DEMO_POSTER_FRAME);
      copy(`oyla-demo-${lang}-poster.png`, docsMedia, siteMedia);
    }
  },
};
jobs.demo = () => {
  jobs["demo-en"]();
  jobs["demo-tr"]();
};
jobs.all = () => {
  jobs.demo();
  jobs.posters();
  jobs.clips();
  jobs.teaser();
};

const requested = process.argv.slice(2);
const unknown = requested.filter((name) => !(name in jobs));
if (unknown.length > 0) {
  console.error(`Unknown job: ${unknown.join(", ")}. Use: ${Object.keys(jobs).join(", ")}`);
  process.exit(1);
}

remotion("bundle", `--out-dir=${bundle}`);
for (const name of requested.length > 0 ? requested : ["all"]) jobs[name]();
