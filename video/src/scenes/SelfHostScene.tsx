import { AbsoluteFill, Interactive, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { Caption } from "../components/Caption";
import { colors } from "../theme";

const COMMAND = "docker run -p 3000:3000 -v oyla-data:/data oyla";

const SelfHostSceneInner = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const typed = Math.floor(interpolate(frame, [0.6 * fps, 2.4 * fps], [0, COMMAND.length], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  const cursorOn = Math.floor(frame / (0.5 * fps)) % 2 === 0;
  return (
    <AbsoluteFill style={{ backgroundColor: colors.page }}>
      <Caption
        title="Open source. Runs anywhere."
        body="One Docker container and one SQLite file. MIT licensed."
        style={{ position: "absolute", left: 120, top: 200, width: 1500 }}
      />
      <div
        style={{
          position: "absolute",
          left: 120,
          top: 560,
          width: 1680,
          padding: "48px 56px",
          borderRadius: 24,
          backgroundColor: colors.ink,
          color: "#ECEEF4",
          fontFamily: "Menlo, ui-monospace, monospace",
          fontSize: 50,
        }}
      >
        <span style={{ color: "#8FD0F5" }}>$ </span>
        {COMMAND.slice(0, typed)}
        <span style={{ opacity: cursorOn ? 1 : 0 }}>▍</span>
      </div>
    </AbsoluteFill>
  );
};

export const SelfHostScene = Interactive.create({ Component: SelfHostSceneInner, layout: "absolute-fill" });
