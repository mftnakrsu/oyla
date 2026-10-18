import { AbsoluteFill, Easing, Interactive, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { Caption } from "../components/Caption";
import { PhoneAnswer } from "../components/Phone";
import { PhoneFrame, phoneScreenWidth } from "../components/PhoneFrame";
import { PHONE, Shot, Tap } from "../components/Shot";
import { copy, type Lang } from "../i18n";
import { colors } from "../theme";

/** The Join button on the phone's home screen (its position differs per language). */
const JOIN_Y: Record<Lang, number> = { en: 942, tr: 807 };

const JoinSceneInner = ({ lang }: { readonly lang: Lang }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const text = copy[lang].join;
  return (
    <AbsoluteFill style={{ backgroundColor: colors.page }}>
      <PhoneFrame
        height={900}
        style={{
          position: "absolute",
          left: 240,
          top: 90,
          translate: interpolate(frame, [0, 0.7 * fps], ["0px 80px", "0px 0px"], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
        }}
      >
        <PhoneAnswer type="multiple-choice" lang={lang} width={phoneScreenWidth(900)} timing={{ pick: 2.9 * fps, send: 3.8 * fps }} />
        <Shot
          src={`shots/phone-home-${lang}-light.png`}
          width={phoneScreenWidth(900)}
          native={PHONE}
          style={{ opacity: interpolate(frame, [2.05 * fps, 2.35 * fps], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}
        >
          <Tap x={585} y={JOIN_Y[lang]} at={1.5 * fps} />
        </Shot>
      </PhoneFrame>
      <Caption title={text.title} body={text.body} style={{ position: "absolute", left: 900, top: 300, width: 860 }} />
    </AbsoluteFill>
  );
};

export const JoinScene = Interactive.create({ Component: JoinSceneInner, layout: "absolute-fill" });
