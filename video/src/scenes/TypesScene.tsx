import { AbsoluteFill, Img, Interactive, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { BrowserFrame } from "../components/BrowserFrame";
import { copy, type Lang } from "../i18n";
import { colors, fontFamily } from "../theme";

const fill = { position: "absolute", left: 0, top: 0, width: "100%", height: "100%" } as const;

const TypesSceneInner = ({ lang }: { readonly lang: Lang }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const text = copy[lang].types;
  // Which screenshot is on screen: 0 word cloud, 1 scale, 2 open question.
  const shown = frame < 1.7 * fps ? 0 : frame < 3.4 * fps ? 1 : 2;
  return (
    <AbsoluteFill style={{ backgroundColor: colors.page, fontFamily }}>
      <div style={{ position: "absolute", left: 120, top: 250, width: 560 }}>
        <div style={{ fontSize: 92, fontWeight: 800, lineHeight: 1.06, letterSpacing: "-0.02em", color: colors.ink }}>{text.title}</div>
        <div style={{ marginTop: 44, display: "flex", flexDirection: "column", gap: 18 }}>
          {text.items.map((item, index) => {
            const active = index === shown + 1;
            return (
              <div
                key={item}
                style={{
                  fontSize: 46,
                  fontWeight: active ? 800 : 500,
                  color: active ? colors.ink : colors.muted,
                  borderLeft: `8px solid ${active ? colors.brand : "transparent"}`,
                  paddingLeft: 24,
                }}
              >
                {item}
              </div>
            );
          })}
        </div>
      </div>
      <BrowserFrame width={1080} style={{ position: "absolute", left: 720, top: 210 }}>
        <Img src={staticFile(`shots/present-cloud-${lang}-light.png`)} style={fill} />
        <Img
          src={staticFile(`shots/present-scale-${lang}-light.png`)}
          style={{ ...fill, opacity: interpolate(frame, [1.6 * fps, 1.8 * fps], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}
        />
        <Img
          src={staticFile(`shots/present-open-${lang}-light.png`)}
          style={{ ...fill, opacity: interpolate(frame, [3.3 * fps, 3.5 * fps], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}
        />
      </BrowserFrame>
    </AbsoluteFill>
  );
};

export const TypesScene = Interactive.create({ Component: TypesSceneInner, layout: "absolute-fill" });
