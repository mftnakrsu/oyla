import { AbsoluteFill, CanvasImage, Easing, Interactive, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Caption } from "../components/Caption";
import { PhoneFrame } from "../components/PhoneFrame";
import { colors } from "../theme";

const fill = { position: "absolute", width: "100%", height: "100%" } as const;

const JoinSceneInner = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ backgroundColor: colors.page }}>
      <PhoneFrame
        height={900}
        style={{
          position: "absolute",
          left: 240,
          top: 90,
          translate: interpolate(frame, [0, 0.7 * fps], ["0px 80px", "0px 0px"], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
          scale: interpolate(frame, [4.4 * fps, 4.5 * fps, 4.7 * fps], [1, 0.97, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
        }}
      >
        <CanvasImage src={staticFile("shots/phone-home-en-light.png")} fit="cover" style={fill} />
        <CanvasImage
          src={staticFile("shots/phone-mc-en-light.png")}
          fit="cover"
          style={{ ...fill, opacity: interpolate(frame, [2.1 * fps, 2.4 * fps], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}
        />
        {/* A tap on "Send vote". */}
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
            opacity: interpolate(frame, [3.7 * fps, 3.8 * fps, 4.2 * fps], [0, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
            scale: interpolate(frame, [3.7 * fps, 4.2 * fps], [0.3, 1.4], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
          }}
        />
        <CanvasImage
          src={staticFile("shots/phone-thanks-en-light.png")}
          fit="cover"
          style={{ ...fill, opacity: interpolate(frame, [4.3 * fps, 4.45 * fps], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}
        />
      </PhoneFrame>
      <Caption
        title="Everyone joins from their phone"
        body="Open oyla.mefby.com and type the code, or scan the QR code. No app, no sign-up."
        style={{ position: "absolute", left: 900, top: 330, width: 860 }}
      />
    </AbsoluteFill>
  );
};

export const JoinScene = Interactive.create({ Component: JoinSceneInner, layout: "absolute-fill" });
