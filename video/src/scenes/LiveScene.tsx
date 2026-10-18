import { AbsoluteFill, Easing, Interactive, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { BrowserFrame } from "../components/BrowserFrame";
import { PhoneAnswer } from "../components/Phone";
import { PhoneFrame, phoneScreenWidth } from "../components/PhoneFrame";
import { Presenter } from "../components/Presenter";
import { copy, type Lang } from "../i18n";
import { colors, fontFamily } from "../theme";

const LiveSceneInner = ({ lang }: { readonly lang: Lang }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ backgroundColor: colors.page, fontFamily }}>
      <div style={{ position: "absolute", left: 120, top: 70, fontSize: 92, fontWeight: 800, letterSpacing: "-0.02em", color: colors.ink }}>
        {copy[lang].live.title}
      </div>
      <BrowserFrame width={1180} style={{ position: "absolute", left: 120, top: 216 }}>
        <Presenter type="multiple-choice" lang={lang} width={1180} timing={{ start: 0.5 * fps, end: 5.6 * fps, own: 1.4 * fps }} />
      </BrowserFrame>
      <PhoneFrame
        height={640}
        style={{
          position: "absolute",
          left: 1390,
          top: 300,
          opacity: interpolate(frame, [0.2 * fps, 0.7 * fps], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
          translate: interpolate(frame, [0.2 * fps, 0.9 * fps], ["60px 0px", "0px 0px"], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
        }}
      >
        <PhoneAnswer type="multiple-choice" lang={lang} width={phoneScreenWidth(640)} timing={{ pick: -30, send: -20 }} />
      </PhoneFrame>
    </AbsoluteFill>
  );
};

export const LiveScene = Interactive.create({ Component: LiveSceneInner, layout: "absolute-fill" });
