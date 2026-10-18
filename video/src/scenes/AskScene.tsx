import { AbsoluteFill, Easing, Img, Interactive, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { BrowserFrame } from "../components/BrowserFrame";
import { Caption } from "../components/Caption";
import { copy, type Lang } from "../i18n";
import { colors } from "../theme";

const fill = { position: "absolute", left: 0, top: 0, width: "100%", height: "100%" } as const;

const AskSceneInner = ({ lang }: { readonly lang: Lang }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const text = copy[lang].ask;
  return (
    <AbsoluteFill style={{ backgroundColor: colors.page }}>
      <Caption title={text.title} body={text.body} style={{ position: "absolute", left: 120, top: 290, width: 580 }} />
      <BrowserFrame
        width={1040}
        style={{
          position: "absolute",
          left: 760,
          top: 196,
          opacity: interpolate(frame, [0, 0.5 * fps], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
          translate: interpolate(frame, [0, 0.7 * fps], ["120px 0px", "0px 0px"], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
        }}
      >
        <Img src={staticFile(`shots/editor-${lang}-light.png`)} style={fill} />
        <Img
          src={staticFile(`shots/editor-types-${lang}-light.png`)}
          style={{
            ...fill,
            opacity: interpolate(frame, [3 * fps, 3.4 * fps], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
          }}
        />
      </BrowserFrame>
    </AbsoluteFill>
  );
};

export const AskScene = Interactive.create({ Component: AskSceneInner, layout: "absolute-fill" });
