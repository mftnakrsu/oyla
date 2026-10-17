import { AbsoluteFill, CanvasImage, Easing, Interactive, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { BrowserFrame } from "../components/BrowserFrame";
import { LiveBars } from "../components/LiveBars";
import { PhoneFrame } from "../components/PhoneFrame";
import { colors, fontFamily } from "../theme";

const LiveSceneInner = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ backgroundColor: colors.page, fontFamily }}>
      <div style={{ position: "absolute", left: 120, top: 64, fontSize: 96, fontWeight: 800, letterSpacing: "-0.02em", color: colors.ink }}>
        Results update live
      </div>
      <BrowserFrame width={1240} style={{ position: "absolute", left: 120, top: 220 }}>
        <div style={{ position: "absolute", inset: 0, backgroundColor: colors.page, display: "flex", flexDirection: "column" }}>
          <div
            style={{
              backgroundColor: colors.paper,
              borderBottom: `2px solid ${colors.line}`,
              padding: "18px 32px",
              fontSize: 26,
              color: colors.muted,
            }}
          >
            Go to <b style={{ color: colors.ink }}>oyla.mefby.com</b> and enter <b style={{ color: colors.ink, letterSpacing: "0.06em" }}>859 847</b>
          </div>
          <div style={{ padding: "26px 40px 0", flex: 1 }}>
            <div style={{ fontSize: 44, fontWeight: 800, letterSpacing: "-0.02em", color: colors.ink, marginBottom: 30 }}>
              Which feature should we build next?
            </div>
            <LiveBars
              options={["Offline mode", "Dark mode", "CSV export", "Team spaces"]}
              votes={[9, 6, 3, 6]}
              startFrame={0.6 * fps}
              endFrame={5.5 * fps}
              fontSize={25}
            />
          </div>
        </div>
      </BrowserFrame>
      <PhoneFrame
        height={640}
        style={{
          position: "absolute",
          left: 1400,
          top: 330,
          opacity: interpolate(frame, [0.2 * fps, 0.7 * fps], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
          translate: interpolate(frame, [0.2 * fps, 0.9 * fps], ["60px 0px", "0px 0px"], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
        }}
      >
        <CanvasImage src={staticFile("shots/phone-thanks-en-light.png")} fit="cover" style={{ position: "absolute", width: "100%", height: "100%" }} />
      </PhoneFrame>
    </AbsoluteFill>
  );
};

export const LiveScene = Interactive.create({ Component: LiveSceneInner, layout: "absolute-fill" });
