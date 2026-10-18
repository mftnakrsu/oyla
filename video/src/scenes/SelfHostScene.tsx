import { AbsoluteFill, Interactive, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { Caption } from "../components/Caption";
import { copy, type Lang } from "../i18n";
import { colors, monoFamily } from "../theme";

/** The two commands from the Docker guide: build the image, run it with a volume for the data. */
const COMMANDS = ["docker build -t oyla .", "docker run -d -p 3000:3000 -v oyla-data:/data oyla"];

const SelfHostSceneInner = ({ lang }: { readonly lang: Lang }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const text = copy[lang].selfHost;
  const typedFirst = Math.floor(interpolate(frame, [0.6 * fps, 1.3 * fps], [0, COMMANDS[0].length], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  const typedSecond = Math.floor(interpolate(frame, [1.6 * fps, 2.9 * fps], [0, COMMANDS[1].length], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  const onSecond = frame >= 1.45 * fps;
  const cursorOn = Math.floor(frame / (0.5 * fps)) % 2 === 0 || (frame > 0.6 * fps && frame < 2.9 * fps);
  const cursor = <span style={{ opacity: cursorOn ? 1 : 0 }}>▍</span>;
  return (
    <AbsoluteFill style={{ backgroundColor: colors.page }}>
      <Caption title={text.title} body={text.body} style={{ position: "absolute", left: 120, top: 230, width: 1500 }} />
      <div
        style={{
          position: "absolute",
          left: 120,
          top: 610,
          width: 1680,
          padding: "44px 56px",
          borderRadius: 24,
          backgroundColor: colors.ink,
          color: colors.terminal,
          fontFamily: monoFamily,
          fontSize: 46,
          lineHeight: 1.6,
        }}
      >
        <div>
          <span style={{ color: colors.prompt }}>$ </span>
          {COMMANDS[0].slice(0, typedFirst)}
          {onSecond ? null : cursor}
        </div>
        <div style={{ opacity: onSecond ? 1 : 0 }}>
          <span style={{ color: colors.prompt }}>$ </span>
          {COMMANDS[1].slice(0, typedSecond)}
          {onSecond ? cursor : null}
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const SelfHostScene = Interactive.create({ Component: SelfHostSceneInner, layout: "absolute-fill" });
