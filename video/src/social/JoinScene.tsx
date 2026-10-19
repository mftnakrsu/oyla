import { AbsoluteFill, Easing, Interactive, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { PhoneAnswer } from "../components/Phone";
import { PhoneFrame, phoneScreenWidth } from "../components/PhoneFrame";
import { PHONE, Shot, Tap } from "../components/Shot";
import { copy, type Lang } from "../i18n";
import { colors } from "../theme";
import { Headline } from "./Headline";
import { SOCIAL } from "./layout";

/** The Join button on the phone's home screen (its position differs per language). */
const JOIN_Y: Record<Lang, number> = { en: 942, tr: 807 };
const PHONE_HEIGHT = 880;
/** Phone body width: the screen plus the bezel on both sides (see PhoneFrame). */
const PHONE_WIDTH = phoneScreenWidth(PHONE_HEIGHT) + 2 * PHONE_HEIGHT * 0.028;

/** One phone, big: the home screen, a tap on Join, then the question is answered and sent. */
const SocialJoinSceneInner = ({ lang }: { readonly lang: Lang }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ backgroundColor: colors.page }}>
      <Headline title={copy[lang].join.title} />
      <PhoneFrame
        height={PHONE_HEIGHT}
        style={{
          position: "absolute",
          left: (SOCIAL.width - PHONE_WIDTH) / 2,
          top: 470,
          translate: interpolate(frame, [0, 0.7 * fps], ["0px 80px", "0px 0px"], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
        }}
      >
        <PhoneAnswer
          type="multiple-choice"
          lang={lang}
          width={phoneScreenWidth(PHONE_HEIGHT)}
          timing={{ pick: 2.9 * fps, send: 3.8 * fps }}
        />
        <Shot
          src={`shots/phone-home-${lang}-light.png`}
          width={phoneScreenWidth(PHONE_HEIGHT)}
          native={PHONE}
          style={{ opacity: interpolate(frame, [2.05 * fps, 2.35 * fps], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}
        >
          <Tap x={585} y={JOIN_Y[lang]} at={1.5 * fps} />
        </Shot>
      </PhoneFrame>
    </AbsoluteFill>
  );
};

export const SocialJoinScene = Interactive.create({ Component: SocialJoinSceneInner, layout: "absolute-fill" });
