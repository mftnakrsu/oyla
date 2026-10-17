import { AbsoluteFill, CanvasImage, Interactive, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { BrowserFrame } from "../components/BrowserFrame";
import { colors, fontFamily } from "../theme";

const fill = { position: "absolute", width: "100%", height: "100%" } as const;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const TypesSceneInner = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  // Which screenshot is on screen: 0 word cloud, 1 scale, 2 open question.
  const shown = frame < 1.7 * fps ? 0 : frame < 3.4 * fps ? 1 : 2;
  const items = ["Multiple choice", "Word cloud", "Scale", "Open question"];
  return (
    <AbsoluteFill style={{ backgroundColor: colors.page, fontFamily }}>
      <div style={{ position: "absolute", left: 120, top: 250, width: 560 }}>
        <div style={{ fontSize: 96, fontWeight: 800, lineHeight: 1.05, letterSpacing: "-0.02em", color: colors.ink }}>
          Four question types
        </div>
        <div style={{ marginTop: 44, display: "flex", flexDirection: "column", gap: 18 }}>
          {items.map((item, index) => {
            const active = index === shown + 1;
            return (
              <div
                key={item}
                style={{
                  fontSize: 46,
                  fontWeight: active ? 800 : 500,
                  color: active ? colors.ink : colors.muted,
                  borderLeft: `8px solid ${active ? colors.series : "transparent"}`,
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
        <CanvasImage src={staticFile("shots/present-cloud-en-light.png")} fit="cover" style={fill} />
        <CanvasImage
          src={staticFile("shots/present-scale-en-light.png")}
          fit="cover"
          style={{ ...fill, opacity: interpolate(frame, [1.6 * fps, 1.8 * fps], [0, 1], clamp) }}
        />
        <CanvasImage
          src={staticFile("shots/present-open-en-light.png")}
          fit="cover"
          style={{ ...fill, opacity: interpolate(frame, [3.3 * fps, 3.5 * fps], [0, 1], clamp) }}
        />
      </BrowserFrame>
    </AbsoluteFill>
  );
};

export const TypesScene = Interactive.create({ Component: TypesSceneInner, layout: "absolute-fill" });
