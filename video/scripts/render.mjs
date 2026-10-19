#!/usr/bin/env node
/**
 * Renders the Oyla videos into out/ and copies them where the README and the docs site use them.
 *
 *   node scripts/render.mjs [all | demo | demo-en | demo-tr | clips | teaser | posters
 *                            | social | social-en | social-tr | demo-captioned | captions
 *                            | voiced | demo-voiced-en | demo-voiced-tr | social-voiced-en | social-voiced-tr] ...
 *                           [--no-copy] [--concurrency=N]
 *
 * The project is bundled once, then each output is rendered in turn with two browser tabs, which
 * keeps memory use low enough for an 8 GB machine (--concurrency=N uses more on a bigger one).
 * --no-copy leaves everything in out/ and touches neither docs/media nor docs-site.
 *
 * The social cut, the captioned demo and the subtitle files are only written to out/: they are
 * for posting, not for the docs.
 *
 * `voiced` (not part of `all`) renders oyla-demo-<lang>-voiced.mp4 (with subtitles) and
 * oyla-social-<lang>-voiced.mp4 into out/: voiceover and music, AAC audio. It needs the voiceover
 * clips in public/audio/voiceover/oyla-<video>-<lang>/ (one per caption cue, made by
 * from out/captions/*.json by a voiceover script that is not in this repo) and the music in public/audio/ (MUSIC).
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
/**
 * Background music of the voiced renders, a file in public/. Both are CC0 (Loyalty Freak Music, see
 * public/audio/LICENSES.md). To use another track, copy it into public/audio/ and change it here.
 */
const MUSIC = {
  demo: "audio/02_LoyaltyFreakMusic_Static-Shoes_CC0.mp3",
  social: "audio/06_LoyaltyFreakMusic_Sweet-Sun_CC0.mp3",
};
/** A representative frame: the demo's live results, a clip's finished results. */
const DEMO_POSTER_FRAME = 630;
const CLIP_POSTER_FRAME = 140;

const args = process.argv.slice(2);
const options = args.filter((arg) => arg.startsWith("--"));
const requested = args.filter((arg) => !arg.startsWith("--"));
const noCopy = options.includes("--no-copy");
const concurrency = options.find((flag) => flag.startsWith("--concurrency="))?.split("=")[1] ?? "2";
const unknownOptions = options.filter((flag) => flag !== "--no-copy" && !flag.startsWith("--concurrency="));
if (unknownOptions.length > 0) {
  console.error(`Unknown option: ${unknownOptions.join(", ")}. Use --no-copy or --concurrency=N.`);
  process.exit(1);
}

const run = (command, commandArgs) => {
  console.log(`\n> ${command} ${commandArgs.join(" ")}`);
  const result = spawnSync(command, commandArgs, { cwd: video, stdio: "inherit" });
  if (result.status !== 0) process.exit(result.status ?? 1);
};
const remotion = (...args) => run("npx", ["remotion", ...args]);

const copy = (file, ...directories) => {
  if (noCopy) return;
  for (const directory of directories) {
    mkdirSync(directory, { recursive: true });
    copyFileSync(join(out, file), join(directory, file.split("/").pop()));
  }
};

const render = (id, file, ...flags) => remotion("render", bundle, id, join(out, file), `--concurrency=${concurrency}`, ...flags);
/**
 * H.264, yuv420p tagged as BT.709, no audio track. Frames are captured as PNG: from JPEG frames
 * the encoder would fall back to full-range yuvj420p and the colours would drift.
 */
const h264 = (crf) => ["--codec=h264", `--crf=${crf}`, "--image-format=png", "--pixel-format=yuv420p", "--color-space=bt709", "--muted"];
/** The same encoding with an AAC audio track: voiceover clips and music, ducked under the voice. */
const voiced = (video, lang, props = {}) => [
  ...h264(23).filter((flag) => flag !== "--muted"),
  "--audio-codec=aac",
  "--audio-bitrate=192k",
  `--props=${JSON.stringify({ ...props, musicSrc: MUSIC[video], musicVolume: 0.5, musicDuckedVolume: 0.25, voiceoverClips: `audio/voiceover/oyla-${video}-${lang}` })}`,
];
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
  "social-en": () => render("OylaSocial-en", "oyla-social-en.mp4", ...h264(23)),
  "social-tr": () => render("OylaSocial-tr", "oyla-social-tr.mp4", ...h264(23)),
  /** The 16:9 demo with the subtitles burned in (the docs keep the caption-free one). */
  "demo-captioned": () => {
    for (const lang of LANGS) {
      render(`OylaDemo-${lang}`, `oyla-demo-${lang}-captioned.mp4`, ...h264(23), `--props=${JSON.stringify({ captions: true })}`);
    }
  },
  "demo-voiced-en": () => render("OylaDemo-en", "oyla-demo-en-voiced.mp4", ...voiced("demo", "en", { captions: true })),
  "demo-voiced-tr": () => render("OylaDemo-tr", "oyla-demo-tr-voiced.mp4", ...voiced("demo", "tr", { captions: true })),
  "social-voiced-en": () => render("OylaSocial-en", "oyla-social-en-voiced.mp4", ...voiced("social", "en")),
  "social-voiced-tr": () => render("OylaSocial-tr", "oyla-social-tr-voiced.mp4", ...voiced("social", "tr")),
  /** The subtitle scripts as .srt, .vtt and .json, e.g. out/captions/oyla-social-tr.srt. */
  captions: () =>
    run(process.execPath, [
      "--disable-warning=MODULE_TYPELESS_PACKAGE_JSON",
      "--disable-warning=ExperimentalWarning",
      join(video, "scripts", "export-captions.mjs"),
      join(out, "captions"),
    ]),
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
jobs.social = () => {
  jobs.captions();
  jobs["social-en"]();
  jobs["social-tr"]();
};
jobs.voiced = () => {
  for (const lang of LANGS) jobs[`demo-voiced-${lang}`]();
  for (const lang of LANGS) jobs[`social-voiced-${lang}`]();
};
jobs.all = () => {
  jobs.demo();
  jobs.posters();
  jobs.clips();
  jobs.teaser();
  jobs.social();
  jobs["demo-captioned"]();
};

const unknown = requested.filter((name) => !(name in jobs));
if (unknown.length > 0) {
  console.error(`Unknown job: ${unknown.join(", ")}. Use: ${Object.keys(jobs).join(", ")}`);
  process.exit(1);
}

const needsBundle = (requested.length > 0 ? requested : ["all"]).some((name) => name !== "captions");
if (needsBundle) remotion("bundle", `--out-dir=${bundle}`);
for (const name of requested.length > 0 ? requested : ["all"]) jobs[name]();
