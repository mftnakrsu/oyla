import React from "react";
import { Easing, Img, interpolate, staticFile } from "remotion";
import { cloudWords, openCards } from "../../data/shots";
import { copy, formatAverage, type Lang } from "../../i18n";
import { clamp, colors } from "../../theme";
import { TextAt } from "../Shot";
import { type Arrival, arrived, grown } from "./arrivals";

/*
 * The presenter's results, redrawn over the screenshots in their own pixels (2160×1350). Sizes
 * follow the app's markup (question-types/<type>/Results.tsx), whose em is 25.9 px here; the
 * positions are measured on the screenshots.
 */
const EM = 25.9;
const LEFT = 51;
const RIGHT = 2109;

/** 0 before `reset`, then eases to 1 over 15 frames, like the app's 500 ms transitions. */
const resetProgress = (frame: number, reset: number | undefined) =>
  reset === undefined ? 0 : interpolate(frame, [reset, reset + 15], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });

const percent = (part: number, total: number) => (total === 0 ? 0 : Math.round((part / total) * 100));

type ChartProps = {
  readonly lang: Lang;
  readonly frame: number;
  readonly answers: readonly Arrival[];
  /** When the presenter resets the results: numbers go back to 0 and the bars shrink away. */
  readonly reset?: number;
};

const BAR_TOPS = [531, 669, 808, 947];

/** Multiple choice: one bar per option, as wide as its share of the leader's votes. */
export const McResults: React.FC<ChartProps> = ({ lang, frame, answers, reset }) => {
  const { poll, results } = copy[lang];
  const live = reset === undefined || frame < reset;
  const at = live ? frame : reset;
  const counts = poll.options.map((_, i) => (live ? arrived(answers, i, frame) : 0));
  const growth = poll.options.map((_, i) => grown(answers, i, at));
  const total = counts.reduce((a, b) => a + b, 0);
  const max = Math.max(1, ...growth);
  const shrink = 1 - resetProgress(frame, reset);
  return (
    <>
      {poll.options.map((label, i) => {
        const top = BAR_TOPS[i] ?? 531 + 138 * i;
        const count = counts[i] ?? 0;
        return (
          <React.Fragment key={label}>
            <TextAt x={LEFT} y={top - 22} size={1.6 * EM} weight={700}>
              {label}
            </TextAt>
            <TextAt x={RIGHT} y={top - 21} size={1.45 * EM} color={colors.muted} align="right">
              <span style={{ fontWeight: 700, color: colors.ink }}>{percent(count, total)}%</span>{" "}
              <span style={{ fontSize: "0.85em" }}>({count})</span>
            </TextAt>
            <div
              style={{
                position: "absolute",
                left: LEFT,
                top,
                height: 42,
                width: Math.max(4, ((growth[i] ?? 0) / max) * (RIGHT - LEFT) * shrink),
                backgroundColor: colors.series,
                borderRadius: "0 8px 8px 0",
              }}
            />
          </React.Fragment>
        );
      })}
      <TextAt x={LEFT} y={1053} size={1.15 * EM} color={colors.muted}>
        {results.votes(total)}
      </TextAt>
    </>
  );
};

const COLUMNS = [
  [335, 678],
  [693, 1035],
  [1050, 1393],
  [1409, 1750],
  [1766, 2109],
] as const;
const AXIS = 876;
const TALLEST = 277;

/** Scale 1–5: the average as the headline, and one column per value. */
export const ScaleResults: React.FC<ChartProps> = ({ lang, frame, answers, reset }) => {
  const { poll, results } = copy[lang];
  const live = reset === undefined || frame < reset;
  const at = live ? frame : reset;
  const counts = COLUMNS.map((_, i) => (live ? arrived(answers, i, frame) : 0));
  const growth = COLUMNS.map((_, i) => grown(answers, i, at));
  const total = counts.reduce((a, b) => a + b, 0);
  const sum = counts.reduce((acc, count, i) => acc + count * (i + 1), 0);
  const max = Math.max(1, ...growth);
  const shrink = 1 - resetProgress(frame, reset);
  return (
    <>
      <TextAt x={LEFT} y={758} size={5 * EM} weight={800}>
        {total === 0 ? "–" : formatAverage(sum / total, lang)}
      </TextAt>
      <TextAt x={LEFT} y={826} size={1.3 * EM} weight={700}>
        {results.average}
      </TextAt>
      <TextAt x={LEFT} y={870} size={1.15 * EM} color={colors.muted}>
        {results.answers(total)}
      </TextAt>
      {COLUMNS.map(([a, b], i) => {
        const height = Math.max(4, ((growth[i] ?? 0) / max) * TALLEST * shrink);
        return (
          <React.Fragment key={a}>
            <div
              style={{
                position: "absolute",
                left: a,
                top: AXIS - height,
                width: b - a,
                height,
                backgroundColor: colors.series,
                borderRadius: "8px 8px 0 0",
              }}
            />
            <TextAt x={(a + b) / 2} y={AXIS - height - 21} size={1.3 * EM} weight={700} align="center">
              {counts[i]}
            </TextAt>
            <TextAt x={(a + b) / 2} y={924} size={1.35 * EM} weight={700} color={colors.muted} align="center">
              {i + 1}
            </TextAt>
          </React.Fragment>
        );
      })}
      <div style={{ position: "absolute", left: 335, top: AXIS, width: RIGHT - 335, height: 4, backgroundColor: colors.axis }} />
      <TextAt x={335} y={980} size={1.15 * EM} color={colors.muted}>
        {poll.scaleLow}
      </TextAt>
      <TextAt x={RIGHT} y={980} size={1.15 * EM} color={colors.muted} align="right">
        {poll.scaleHigh}
      </TextAt>
    </>
  );
};

type PiecesProps = {
  readonly lang: Lang;
  readonly frame: number;
  /** One arrival per word or card; `item` is its index. */
  readonly answers: readonly Arrival[];
  /** When the results are cleared: everything fades out. */
  readonly reset?: number;
};

/** "Waiting for the first answer", shown while a cloud or an answer list is empty. */
const Waiting: React.FC<{ readonly lang: Lang; readonly opacity: number }> = ({ lang, opacity }) => (
  <TextAt x={1080} y={434} size={1.25 * EM} color={colors.muted} align="center" style={{ opacity }}>
    {copy[lang].results.waiting}
  </TextAt>
);

const firstAt = (answers: readonly Arrival[]) => Math.min(...answers.map((a) => a.at));

/** Word cloud: each word of the real cloud appears where the app placed it. */
export const CloudResults: React.FC<PiecesProps> = ({ lang, frame, answers, reset }) => {
  const fadeOut = reset === undefined ? 1 : interpolate(frame, [reset, reset + 12], [1, 0], clamp);
  const first = firstAt(answers);
  const waiting = interpolate(frame, [first, first + 4], [1, 0], clamp) + (reset === undefined ? 0 : interpolate(frame, [reset + 10, reset + 18], [0, 1], clamp));
  return (
    <>
      <Waiting lang={lang} opacity={waiting} />
      {cloudWords[lang].map((word, i) => {
        const at = answers.find((a) => a.item === i)?.at ?? 0;
        return (
          <Img
            key={word.file}
            src={staticFile(word.file)}
            style={{
              position: "absolute",
              left: word.x,
              top: word.y,
              width: word.width,
              height: word.height,
              opacity: interpolate(frame, [at, at + 6], [0, 1], clamp) * fadeOut,
              scale: interpolate(frame, [at, at + 14], [0.6, 1], { ...clamp, easing: Easing.bezier(0.16, 1, 0.3, 1) }),
            }}
          />
        );
      })}
    </>
  );
};

/** The card the phone sends in the open question (the third column, second row). */
export const OWN_CARD = 5;

/** Open question: the answers arrive as cards, sliding in like the app's slip-in. */
export const OpenResults: React.FC<PiecesProps> = ({ lang, frame, answers, reset }) => {
  const { results } = copy[lang];
  const live = reset === undefined || frame < reset;
  const fadeOut = reset === undefined ? 1 : interpolate(frame, [reset, reset + 12], [1, 0], clamp);
  const count = answers.filter((a) => a.at <= (live ? frame : (reset ?? frame))).length;
  const first = firstAt(answers);
  const waiting = interpolate(frame, [first, first + 4], [1, 0], clamp) + (reset === undefined ? 0 : interpolate(frame, [reset + 10, reset + 18], [0, 1], clamp));
  return (
    <>
      <Waiting lang={lang} opacity={waiting} />
      {count > 0 ? (
        <TextAt x={LEFT} y={362} size={1.05 * EM} color={colors.muted} style={{ opacity: fadeOut }}>
          {results.answers(count)}
        </TextAt>
      ) : null}
      {openCards[lang].map((card, i) => {
        const at = answers.find((a) => a.item === i)?.at ?? 0;
        return (
          <Img
            key={card.file}
            src={staticFile(card.file)}
            style={{
              position: "absolute",
              left: card.x,
              top: card.y,
              width: card.width,
              height: card.height,
              opacity: interpolate(frame, [at, at + 8], [0, 1], clamp) * fadeOut,
              translate: interpolate(frame, [at, at + 10], ["0px -14px", "0px 0px"], { ...clamp, easing: Easing.out(Easing.cubic) }),
            }}
          />
        );
      })}
    </>
  );
};
