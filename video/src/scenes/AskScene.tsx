import { AbsoluteFill, CanvasImage, Easing, Interactive, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { BrowserFrame } from "../components/BrowserFrame";
import { Caption } from "../components/Caption";
import { colors } from "../theme";

const AskSceneInner = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ backgroundColor: colors.page }}>
      <Caption
        title="Ask a question"
        body="Multiple choice, word clouds, open questions and scales. No account needed."
        style={{ position: "absolute", left: 120, top: 300, width: 600 }}
      />
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
        <CanvasImage src={staticFile("shots/editor-en-light.png")} fit="cover" style={{ position: "absolute", width: "100%", height: "100%" }} />
        <CanvasImage
          src={staticFile("shots/editor-types-en-light.png")}
          fit="cover"
          style={{
            position: "absolute",
            width: "100%",
            height: "100%",
            opacity: interpolate(frame, [3 * fps, 3.4 * fps], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
          }}
        />
      </BrowserFrame>
    </AbsoluteFill>
  );
};

export const AskScene = Interactive.create({ Component: AskSceneInner, layout: "absolute-fill" });
