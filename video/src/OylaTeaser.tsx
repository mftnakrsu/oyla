import { AbsoluteFill, CanvasImage, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { BrowserFrame } from "./components/BrowserFrame";
import { LiveBars } from "./components/LiveBars";
import { PhoneFrame } from "./components/PhoneFrame";
import { colors, fontFamily } from "./theme";

const fill = { position: "absolute", width: "100%", height: "100%" } as const;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** 8 s loop for the README GIF: a phone votes, the presenter's bars fill up. */
export const OylaTeaser = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ backgroundColor: colors.page, fontFamily }}>
      <PhoneFrame height={900} style={{ position: "absolute", left: 90, top: 90 }}>
        <CanvasImage src={staticFile("shots/phone-mc-en-light.png")} fit="cover" style={fill} />
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "90.5%",
            width: 120,
            height: 120,
            marginLeft: -60,
            marginTop: -60,
            borderRadius: 999,
            backgroundColor: "rgba(255, 255, 255, 0.55)",
            opacity: interpolate(frame, [0.9 * fps, 1 * fps, 1.4 * fps], [0, 1, 0], clamp),
            scale: interpolate(frame, [0.9 * fps, 1.4 * fps], [0.3, 1.4], clamp),
          }}
        />
        <CanvasImage
          src={staticFile("shots/phone-thanks-en-light.png")}
          fit="cover"
          style={{ ...fill, opacity: interpolate(frame, [1.45 * fps, 1.6 * fps, 7.5 * fps, 7.9 * fps], [0, 1, 1, 0], clamp) }}
        />
      </PhoneFrame>
      <BrowserFrame width={1200} style={{ position: "absolute", left: 640, top: 160 }}>
        <div style={{ position: "absolute", inset: 0, backgroundColor: colors.page, display: "flex", flexDirection: "column" }}>
          <div style={{ backgroundColor: colors.paper, borderBottom: `2px solid ${colors.line}`, padding: "18px 32px", fontSize: 26, color: colors.muted }}>
            Go to <b style={{ color: colors.ink }}>oyla.mefby.com</b> and enter <b style={{ color: colors.ink, letterSpacing: "0.06em" }}>859 847</b>
          </div>
          <div style={{ padding: "26px 40px 0", flex: 1 }}>
            <div style={{ fontSize: 44, fontWeight: 800, letterSpacing: "-0.02em", color: colors.ink, marginBottom: 30 }}>
              Which feature should we build next?
            </div>
            <LiveBars
              options={["Offline mode", "Dark mode", "CSV export", "Team spaces"]}
              votes={[9, 6, 3, 6]}
              startFrame={1.5 * fps}
              endFrame={5.5 * fps}
              fontSize={25}
            />
          </div>
        </div>
      </BrowserFrame>
    </AbsoluteFill>
  );
};
