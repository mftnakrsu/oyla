import type React from "react";
import { useCurrentFrame } from "remotion";
import { cloudWords, openCards } from "../data/shots";
import { copy, type Lang } from "../i18n";
import { type Arrival, arrivals, inOrder } from "./results/arrivals";
import { CloudResults, McResults, OpenResults, OWN_CARD, ScaleResults } from "./results/Results";
import { Cover, DESKTOP, Shot } from "./Shot";

export type QuestionType = "multiple-choice" | "word-cloud" | "scale" | "open-ended";

export type ResultsTiming = {
  /** First and last answer from the rest of the audience. */
  readonly start: number;
  readonly end: number;
  /** When the phone's own answer lands. */
  readonly own: number;
  /** When the results are reset, so a clip can loop. */
  readonly reset?: number;
};

const shotOf: Record<QuestionType, string> = {
  "multiple-choice": "mc",
  "word-cloud": "cloud",
  scale: "scale",
  "open-ended": "open",
};

/**
 * The order the answer cards arrive in (cards are numbered in reading order): top-down in each
 * column, so no card ever floats above an empty slot. The phone's card, third column second row,
 * comes right after the one above it.
 */
const CARD_ORDER = [0, 1, 2, OWN_CARD, 3, 4, 6, 7];

const answersFor = (type: QuestionType, lang: Lang, timing: ResultsTiming): Arrival[] => {
  const { poll } = copy[lang];
  const seed = `${type}-${lang}`;
  switch (type) {
    case "multiple-choice":
      return arrivals(poll.votes, timing.start, timing.end, seed, { item: 0, at: timing.own });
    case "scale":
      return arrivals(poll.scaleVotes, timing.start, timing.end, seed, { item: 3, at: timing.own });
    case "word-cloud": {
      const words = cloudWords[lang];
      const own = Math.max(0, words.findIndex((w) => w.text === poll.word));
      return arrivals(words.map(() => 1), timing.start, timing.end, seed, { item: own, at: timing.own });
    }
    case "open-ended":
      return inOrder(
        CARD_ORDER.filter((card) => card < openCards[lang].length),
        timing.start,
        { item: OWN_CARD, at: timing.own },
      );
  }
};

type PresenterProps = {
  readonly type: QuestionType;
  readonly lang: Lang;
  /** Displayed width in px. */
  readonly width: number;
  readonly timing: ResultsTiming;
};

/** The presenter screen: the real screenshot, with its results redrawn as the answers arrive. */
export const Presenter: React.FC<PresenterProps> = ({ type, lang, width, timing }) => {
  const frame = useCurrentFrame();
  const answers = answersFor(type, lang, timing);
  const props = { lang, frame, answers, reset: timing.reset };
  return (
    <Shot src={`shots/present-${shotOf[type]}-${lang}-light.png`} width={width} native={DESKTOP}>
      <Cover x={0} y={300} width={DESKTOP.width} height={960} />
      {type === "multiple-choice" ? <McResults {...props} /> : null}
      {type === "scale" ? <ScaleResults {...props} /> : null}
      {type === "word-cloud" ? <CloudResults {...props} /> : null}
      {type === "open-ended" ? <OpenResults {...props} /> : null}
    </Shot>
  );
};
