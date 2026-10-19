import { AbsoluteFill, Easing, Img, Interactive, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { BrowserFrame } from "../components/BrowserFrame";
import { copy, type Lang } from "../i18n";
import { colors } from "../theme";
import { Headline } from "./Headline";

const fill = { position: "absolute", left: 0, top: 0, width: "100%", height: "100%" } as const;

/**
 * Where the camera zooms in on the editor: the question-type menu, as a transform origin in the
 * screenshot (fractions of its width and height), and how far.
 */
const MENU_ORIGIN = "76% 20%";
const MENU_ZOOM = 1.75;

/** The editor, then a zoom onto its question-type menu, so the type names read on a phone. */
const SocialAskSceneInner = ({ lang }: { readonly lang: Lang }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ backgroundColor: colors.page }}>
      <Headline title={copy[lang].ask.title} />
      <BrowserFrame
        width={960}
        style={{
          position: "absolute",
          left: 60,
          top: 520,
          opacity: interpolate(frame, [0, 0.5 * fps], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
          translate: interpolate(frame, [0, 0.7 * fps], ["0px 80px", "0px 0px"], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
        }}
      >
        <div
          style={{
            ...fill,
            transformOrigin: MENU_ORIGIN,
            scale: interpolate(frame, [1.3 * fps, 2.3 * fps], [1, MENU_ZOOM], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.bezier(0.65, 0, 0.35, 1),
            }),
          }}
        >
          <Img src={staticFile(`shots/editor-${lang}-light.png`)} style={fill} />
          <Img
            src={staticFile(`shots/editor-types-${lang}-light.png`)}
            style={{
              ...fill,
              opacity: interpolate(frame, [1.8 * fps, 2.2 * fps], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
            }}
          />
        </div>
      </BrowserFrame>
    </AbsoluteFill>
  );
};

export const SocialAskScene = Interactive.create({ Component: SocialAskSceneInner, layout: "absolute-fill" });
