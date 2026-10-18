import { AbsoluteFill, useVideoConfig } from "remotion";
import { BrowserFrame } from "./components/BrowserFrame";
import { PhoneAnswer } from "./components/Phone";
import { PhoneFrame, phoneScreenWidth } from "./components/PhoneFrame";
import { Presenter } from "./components/Presenter";
import { colors } from "./theme";

/**
 * 8 s loop for the README GIF: a phone votes, the presenter's bars fill up, then the results are
 * reset. Frames 234–239 and 0–14 show the same resting state, so the GIF loops without a seam.
 */
export const OylaTeaser: React.FC = () => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ backgroundColor: colors.page }}>
      <PhoneFrame height={900} style={{ position: "absolute", left: 76, top: 90 }}>
        <PhoneAnswer
          type="multiple-choice"
          lang="en"
          width={phoneScreenWidth(900)}
          timing={{ pick: 0.5 * fps, send: 1.15 * fps, reset: 7.3 * fps }}
        />
      </PhoneFrame>
      <BrowserFrame width={1180} style={{ position: "absolute", left: 664, top: 172 }}>
        <Presenter
          type="multiple-choice"
          lang="en"
          width={1180}
          timing={{ start: 1.2 * fps, end: 5.6 * fps, own: 1.4 * fps, reset: 7.3 * fps }}
        />
      </BrowserFrame>
    </AbsoluteFill>
  );
};
