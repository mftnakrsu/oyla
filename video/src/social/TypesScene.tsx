import { AbsoluteFill, Img, Interactive, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { BrowserFrame } from "../components/BrowserFrame";
import { copy, type Lang } from "../i18n";
import { colors, fontFamily } from "../theme";
import { Headline } from "./Headline";
import { SAFE, SAFE_WIDTH } from "./layout";

const fill = { position: "absolute", left: 0, top: 0, width: "100%", height: "100%" } as const;

/** Word cloud, scale and open question on the big screen, with the four types listed below. */
const SocialTypesSceneInner = ({ lang }: { readonly lang: Lang }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const text = copy[lang].types;
  // Which screenshot is on screen: 0 word cloud, 1 scale, 2 open question.
  const shown = frame < 1.5 * fps ? 0 : frame < 3 * fps ? 1 : 2;
  return (
    <AbsoluteFill style={{ backgroundColor: colors.page, fontFamily }}>
      <Headline title={text.title} />
      <BrowserFrame width={960} style={{ position: "absolute", left: 60, top: 490 }}>
        <Img src={staticFile(`shots/present-cloud-${lang}-light.png`)} style={fill} />
        <Img
          src={staticFile(`shots/present-scale-${lang}-light.png`)}
          style={{ ...fill, opacity: interpolate(frame, [1.4 * fps, 1.6 * fps], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}
        />
        <Img
          src={staticFile(`shots/present-open-${lang}-light.png`)}
          style={{ ...fill, opacity: interpolate(frame, [2.9 * fps, 3.1 * fps], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}
        />
      </BrowserFrame>
      <div
        style={{
          position: "absolute",
          left: SAFE.side,
          top: 1165,
          width: SAFE_WIDTH,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 16,
        }}
      >
        {text.items.map((item, index) => {
          const active = index === shown + 1;
          return (
            <div
              key={item}
              style={{
                padding: "14px 24px",
                borderRadius: 999,
                border: `4px solid ${active ? colors.brand : colors.line}`,
                backgroundColor: colors.paper,
                fontSize: 36,
                fontWeight: active ? 800 : 500,
                color: active ? colors.ink : colors.muted,
                textAlign: "center",
                whiteSpace: "nowrap",
              }}
            >
              {item}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

export const SocialTypesScene = Interactive.create({ Component: SocialTypesSceneInner, layout: "absolute-fill" });
