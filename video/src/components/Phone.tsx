import type React from "react";
import { Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { copy, type Lang } from "../i18n";
import { clamp, colors } from "../theme";
import type { QuestionType } from "./Presenter";
import { Cover, PHONE, Shot, Tap, TextAt } from "./Shot";

export type PhoneTiming = {
  /** Option tapped (multiple choice, scale) or typing starts (word cloud, open question). */
  readonly pick: number;
  /** Typing ends (word cloud, open question). */
  readonly typed?: number;
  /** The send button is tapped; "Answer sent" follows. */
  readonly send: number;
  /** Back to the unanswered question, so a clip can loop. */
  readonly reset?: number;
};

const fill = { position: "absolute", left: 0, top: 0, width: "100%", height: "100%" } as const;

/** Where things are on the phone screenshots (1170×1992). */
const layout = {
  "multiple-choice": { shot: "mc", send: 1827 },
  scale: { shot: "scale", send: 1203 },
  "word-cloud": { shot: "cloud", send: 1203, counter: 1044, max: 25 },
  "open-ended": { shot: "open", send: 1467, counter: 1308, max: 280 },
} as const;

type PhoneAnswerProps = {
  readonly type: QuestionType;
  readonly lang: Lang;
  /** Displayed screen width in px. */
  readonly width: number;
  readonly timing: PhoneTiming;
};

/** A participant answers on their phone: the real screens, with the tap or the typing redrawn. */
export const PhoneAnswer: React.FC<PhoneAnswerProps> = ({ type, lang, width, timing }) => {
  const frame = useCurrentFrame();
  const { pick, send, reset } = timing;
  const spot = layout[type];
  // The unanswered state is back in place while "Answer sent" still covers the screen.
  const idle =
    reset === undefined
      ? interpolate(frame, [pick + 1, pick + 4], [1, 0], clamp)
      : interpolate(frame, [pick + 1, pick + 4, reset - 2, reset - 1], [1, 0, 0, 1], clamp);
  const thanks =
    reset === undefined
      ? interpolate(frame, [send + 6, send + 12], [0, 1], clamp)
      : interpolate(frame, [send + 6, send + 12, reset, reset + 9], [0, 1, 1, 0], clamp);
  return (
    <Shot src={`shots/phone-${spot.shot}-${lang}-light.png`} width={width} native={PHONE}>
      {type === "multiple-choice" ? (
        <>
          <Img src={staticFile(`shots/phone-mc-idle-${lang}.png`)} style={{ position: "absolute", left: 48, top: 807, width: 1074, height: 192, opacity: idle }} />
          <Tap x={430} y={903} at={pick} color="rgba(4, 120, 87, 0.16)" />
        </>
      ) : null}
      {type === "scale" ? (
        <>
          <Img src={staticFile(`shots/phone-scale-idle-${lang}.png`)} style={{ position: "absolute", left: 708, top: 807, width: 195, height: 168, opacity: idle }} />
          <Tap x={805} y={891} at={pick} color="rgba(4, 120, 87, 0.16)" />
        </>
      ) : null}
      {type === "word-cloud" || type === "open-ended" ? (
        <Typing type={type} lang={lang} timing={timing} />
      ) : null}
      <Tap x={585} y={spot.send} at={send} />
      <Img src={staticFile(`shots/phone-thanks-${lang}-light.png`)} style={{ ...fill, opacity: thanks }} />
    </Shot>
  );
};

/** The answer being typed into the focused field, with its caret and the characters-left count. */
const Typing: React.FC<{ readonly type: "word-cloud" | "open-ended"; readonly lang: Lang; readonly timing: PhoneTiming }> = ({ type, lang, timing }) => {
  const frame = useCurrentFrame();
  const { poll, results } = copy[lang];
  const text = type === "word-cloud" ? poll.word : poll.openAnswer;
  const spot = layout[type];
  const { pick, typed = pick + text.length * 2, reset } = timing;
  const shown = reset !== undefined && frame >= reset ? 0 : Math.round(interpolate(frame, [pick, typed], [0, text.length], clamp));
  const typing = frame >= pick && frame <= typed + 4;
  // Blinks every second; 30 divides the clip length, so the loop stays seamless.
  const caretOn = typing || frame % 30 < 15;
  return (
    <>
      <Cover x={56} y={815} width={1058} height={type === "word-cloud" ? 152 : 380} color={colors.paper} />
      <TextAt x={101} y={909.5} size={54}>
        {text.slice(0, shown)}
        {/* Out of the flow, so the caret never moves the baseline. */}
        <span style={{ position: "relative", display: "inline-block", width: 0, height: 0 }}>
          <span
            style={{
              position: "absolute",
              left: 3,
              bottom: -14,
              width: 5,
              height: 64,
              backgroundColor: colors.ink,
              opacity: caretOn ? 1 : 0,
            }}
          />
        </span>
      </TextAt>
      <Cover x={40} y={spot.counter - 40} width={700} height={52} />
      <TextAt x={48} y={spot.counter} size={42} color={colors.muted}>
        {results.charactersLeft(spot.max - shown)}
      </TextAt>
    </>
  );
};
