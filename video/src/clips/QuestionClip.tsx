import { AbsoluteFill } from "remotion";
import { BrowserFrame } from "../components/BrowserFrame";
import { PhoneAnswer, type PhoneTiming } from "../components/Phone";
import { PhoneFrame, phoneScreenWidth } from "../components/PhoneFrame";
import { Presenter, type QuestionType, type ResultsTiming } from "../components/Presenter";
import { copy, type Lang } from "../i18n";
import { colors } from "../theme";

export type QuestionClipProps = {
  readonly type: QuestionType;
  readonly lang: Lang;
};

/** Frame at which the results are reset and the phone goes back to the question. */
const RESET = 150;

/**
 * One 6 s loop per question type (180 frames at 30 fps): a phone answers, the presenter's results
 * build up, then both go back to where they started. Frames 165–179 and 0–11 show the same
 * resting state, so the clip loops without a seam.
 */
const timingOf = (type: QuestionType, lang: Lang): { phone: PhoneTiming; results: ResultsTiming } => {
  if (type === "multiple-choice" || type === "scale") {
    return {
      phone: { pick: 16, send: 40, reset: RESET },
      results: { start: 14, end: 128, own: 46, reset: RESET },
    };
  }
  const { poll } = copy[lang];
  const text = type === "word-cloud" ? poll.word : poll.openAnswer;
  const perCharacter = text.length > 20 ? 1 : text.length > 8 ? 2 : 3;
  const typed = 10 + text.length * perCharacter;
  const send = typed + 10;
  return {
    phone: { pick: 10, typed, send, reset: RESET },
    results: { start: 14, end: 128, own: send + 6, reset: RESET },
  };
};

const PHONE_HEIGHT = 560;
const BROWSER_WIDTH = 820;

export const QuestionClip: React.FC<QuestionClipProps> = ({ type, lang }) => {
  const timing = timingOf(type, lang);
  return (
    <AbsoluteFill style={{ backgroundColor: colors.page }}>
      <PhoneFrame height={PHONE_HEIGHT} style={{ position: "absolute", left: 44, top: 80 }}>
        <PhoneAnswer type={type} lang={lang} width={phoneScreenWidth(PHONE_HEIGHT)} timing={timing.phone} />
      </PhoneFrame>
      <BrowserFrame width={BROWSER_WIDTH} style={{ position: "absolute", left: 416, top: 89 }}>
        <Presenter type={type} lang={lang} width={BROWSER_WIDTH} timing={timing.results} />
      </BrowserFrame>
    </AbsoluteFill>
  );
};
