import { AbsoluteFill, Easing, Interactive, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { Stamp } from "../components/Stamp";
import { colors, fontFamily } from "../theme";

const OpeningSceneInner = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ backgroundColor: colors.page, alignItems: "center", justifyContent: "center", fontFamily }}>
      <div style={{ display: "flex", alignItems: "center", gap: 56 }}>
        <Stamp
          size={250}
          style={{
            opacity: interpolate(frame, [0.2 * fps, 0.32 * fps], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
            scale: interpolate(frame, [0.2 * fps, 0.55 * fps], [1.7, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.bezier(0.2, 0.9, 0.3, 1.25),
            }),
          }}
        />
        <div
          style={{
            fontSize: 210,
            fontWeight: 800,
            letterSpacing: "-0.03em",
            color: colors.ink,
            opacity: interpolate(frame, [0.7 * fps, 1.1 * fps], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
            translate: interpolate(frame, [0.7 * fps, 1.1 * fps], ["40px 0px", "0px 0px"], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.bezier(0.16, 1, 0.3, 1),
            }),
          }}
        >
          Oyla
        </div>
      </div>
      <div
        style={{
          marginTop: 60,
          fontSize: 54,
          color: colors.muted,
          opacity: interpolate(frame, [1.4 * fps, 1.9 * fps], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
        }}
      >
        Live polls for talks, classes and meetings
      </div>
    </AbsoluteFill>
  );
};

export const OpeningScene = Interactive.create({ Component: OpeningSceneInner, layout: "absolute-fill" });
