import { AbsoluteFill, Easing, Interactive, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { Stamp } from "../components/Stamp";
import { colors, fontFamily } from "../theme";

const OutroSceneInner = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ backgroundColor: colors.page, alignItems: "center", justifyContent: "center", fontFamily }}>
      <div style={{ display: "flex", alignItems: "center", gap: 44 }}>
        <Stamp
          size={190}
          style={{
            scale: interpolate(frame, [0.1 * fps, 0.45 * fps], [1.6, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.bezier(0.2, 0.9, 0.3, 1.25),
            }),
          }}
        />
        <div style={{ fontSize: 160, fontWeight: 800, letterSpacing: "-0.03em", color: colors.ink }}>Oyla</div>
      </div>
      <div
        style={{
          marginTop: 64,
          textAlign: "center",
          opacity: interpolate(frame, [0.6 * fps, 1.1 * fps], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
        }}
      >
        <div style={{ fontSize: 64, fontWeight: 800, color: colors.ink }}>oyla.mefby.com</div>
        <div style={{ marginTop: 16, fontSize: 46, color: colors.muted }}>github.com/mftnakrsu/oyla</div>
      </div>
    </AbsoluteFill>
  );
};

export const OutroScene = Interactive.create({ Component: OutroSceneInner, layout: "absolute-fill" });
