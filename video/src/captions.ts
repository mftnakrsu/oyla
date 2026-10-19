/**
 * The subtitle script of the demo and the social video, per language: what is said while each
 * part plays. It is burned into the videos (components/Subtitles.tsx) and exported as .srt and
 * .vtt by scripts/export-captions.mjs, so a voiceover can be generated from the same lines.
 *
 * Times are in milliseconds from the start of the composition. Keep each line short (one line on
 * the 16:9 demo, at most two on the 9:16 video) and leave a small gap between cues.
 *
 * This file is also imported by Node directly (type stripping), so it may only use erasable
 * TypeScript: type-only imports, no enums.
 */
import type { Lang } from "./i18n";

export type Cue = {
  readonly startMs: number;
  readonly endMs: number;
  readonly text: string;
  /**
   * What the voiceover says instead of `text`, when the subtitle would be read wrong by the
   * text-to-speech voice (abbreviations, web addresses, product names). Only the voiceover uses
   * it; the subtitles always show `text`. It is only a respelling: the voice says
   * the same words as the subtitle. A line too long to fit its cue when spoken is shortened in
   * `text` itself. Ellipses are dropped from either.
   */
  readonly say?: string;
};

export type CaptionScript = {
  /** Length of the composition the cues belong to. */
  readonly durationMs: number;
  /** Output file name without extension and language, e.g. oyla-demo → oyla-demo-en.srt. */
  readonly file: string;
  readonly cues: Record<Lang, readonly Cue[]>;
};

/**
 * OylaDemo, 39.5 s. Scenes (with their 0.5 s fades): Opening 0–4, Ask 3.5–9.5, Join 9–15,
 * Live 14.5–22, Types 21.5–26.5, Themes 26–31, Self-host 30.5–35.5, Outro 35–39.5.
 */
const demo: CaptionScript = {
  durationMs: 39500,
  file: "oyla-demo",
  cues: {
    en: [
      { startMs: 500, endMs: 3400, text: "This is Oyla: live polls for talks and classes." },
      { startMs: 3900, endMs: 6400, text: "Create a presentation and add your questions." },
      { startMs: 6500, endMs: 9000, text: "Pick one of four question types." },
      { startMs: 9400, endMs: 11700, text: "Your audience opens the link on their phone…" },
      { startMs: 11800, endMs: 14400, text: "…picks an answer. No app, no sign-up." },
      { startMs: 14900, endMs: 18200, text: "Every vote shows up on the big screen right away." },
      { startMs: 18300, endMs: 21400, text: "No refreshing: the results update live for everyone." },
      { startMs: 21900, endMs: 26000, text: "Word clouds, scales and open questions work the same way." },
      { startMs: 26400, endMs: 30400, text: "Choose one of four themes; the screen and every phone follow it." },
      { startMs: 30600, endMs: 32900, text: "Open source and MIT licensed.", say: "Open source and M I T licensed." },
      { startMs: 33000, endMs: 35300, text: "Run it on your own server with Docker." },
      { startMs: 35400, endMs: 39200, text: "Docs at oyla.mefby.com, code on GitHub.", say: "Docs at oyla dot mefby dot com, code on GitHub." },
    ],
    tr: [
      { startMs: 500, endMs: 3400, text: "Oyla: sunumlar ve dersler için canlı anketler." },
      { startMs: 3900, endMs: 6400, text: "Bir sunum oluşturun ve sorularınızı ekleyin." },
      { startMs: 6500, endMs: 9000, text: "Dört soru tipinden birini seçin." },
      { startMs: 9400, endMs: 11700, text: "Katılımcılar bağlantıyı telefonlarında açar…" },
      { startMs: 11800, endMs: 14400, text: "…cevabı gönderir; üyelik gerekmez.", say: "Cevabı gönderir; üyelik gerekmez." },
      { startMs: 14900, endMs: 18200, text: "Her oy anında büyük ekrana düşer." },
      { startMs: 18300, endMs: 21400, text: "Yenilemeye gerek yok: sonuçlar canlı güncellenir." },
      { startMs: 21900, endMs: 26000, text: "Kelime bulutu, ölçek ve açık uçlu sorular da aynı şekilde çalışır." },
      { startMs: 26400, endMs: 30400, text: "Dört temadan birini seçin; ekran da telefonlar da uyar." },
      { startMs: 30600, endMs: 32900, text: "Oyla açık kaynak ve MIT lisanslı.", say: "Oyla açık kaynak ve Em Ay Ti lisanslı." },
      { startMs: 33000, endMs: 35300, text: "Docker'la kendi sunucunuza kurun.", say: "Doker'la kendi sunucunuza kurun." },
      { startMs: 35400, endMs: 39200, text: "Belgeler oyla.mefby.com'da, kod GitHub'da.", say: "Belgeler oyla nokta mefbi nokta kom'da, kod Githab'da." },
    ],
  },
};

/**
 * OylaSocial, 25.5 s. Scenes (with their 0.5 s fades): Hook 0–3.5, Ask 3–7, Join 6.5–11.5,
 * Types 11–15.5, Themes 15–19, Self-host 18.5–22.5, Outro 22–25.5.
 */
const social: CaptionScript = {
  durationMs: 25500,
  file: "oyla-social",
  cues: {
    en: [
      { startMs: 300, endMs: 2900, text: "Every vote shows up on the big screen, live." },
      { startMs: 3300, endMs: 6300, text: "Write a question and pick its type." },
      { startMs: 6800, endMs: 9200, text: "People join with a code or a QR scan." },
      { startMs: 9300, endMs: 11200, text: "One tap to answer. No sign-up." },
      { startMs: 11400, endMs: 14800, text: "Word clouds, scales and open questions update live too." },
      { startMs: 15300, endMs: 18300, text: "Pick a theme; the big screen and every phone follow." },
      { startMs: 18800, endMs: 21800, text: "Open source. Run it on your own server with Docker." },
      { startMs: 22300, endMs: 25300, text: "Free and MIT licensed. Find it on GitHub.", say: "Free and M I T licensed. Find it on GitHub." },
    ],
    tr: [
      { startMs: 300, endMs: 2900, text: "Her oy, anında büyük ekranda." },
      { startMs: 3300, endMs: 6300, text: "Sorunuzu yazın, soru tipini seçin." },
      { startMs: 6800, endMs: 9200, text: "Kodla ya da QR ile katılırlar.", say: "Kodla ya da Kü Ar ile katılırlar." },
      { startMs: 9300, endMs: 11200, text: "Uygulama da üyelik de yok." },
      { startMs: 11400, endMs: 14800, text: "Kelime bulutu ve ölçek de canlı güncellenir." },
      { startMs: 15300, endMs: 18300, text: "Bir tema seçin; ekran da telefonlar da uyar." },
      { startMs: 18800, endMs: 21800, text: "Açık kaynak. Docker ile kendi sunucunuzda.", say: "Açık kaynak. Doker ile kendi sunucunuzda." },
      { startMs: 22300, endMs: 25300, text: "Ücretsiz ve MIT lisanslı. GitHub'da.", say: "Ücretsiz ve Em Ay Ti lisanslı. Githab'da." },
    ],
  },
};

export const captionScripts = { demo, social } as const;
