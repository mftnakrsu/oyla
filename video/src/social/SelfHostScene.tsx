import { AbsoluteFill, Interactive, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { copy, type Lang } from "../i18n";
import { colors, monoFamily } from "../theme";
import { Headline } from "./Headline";
import { SAFE, SAFE_WIDTH } from "./layout";

/** The Docker guide's two commands; the long one is split with a backslash to fit the width. */
const BUILD = "docker build -t oyla .";
const RUN = ["docker run -d -p 3000:3000 \\", "    -v oyla-data:/data oyla"] as const;

const SocialSelfHostSceneInner = ({ lang }: { readonly lang: Lang }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const text = copy[lang].selfHost;
  const typedBuild = Math.floor(interpolate(frame, [0.5 * fps, 1.1 * fps], [0, BUILD.length], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  const runLength = RUN[0].length + RUN[1].length;
  const typedRun = Math.floor(interpolate(frame, [1.3 * fps, 2.6 * fps], [0, runLength], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  const onRun = frame >= 1.2 * fps;
  const onSecondLine = typedRun > RUN[0].length;
  const cursorOn = Math.floor(frame / (0.5 * fps)) % 2 === 0 || (frame > 0.5 * fps && frame < 2.6 * fps);
  const cursor = <span style={{ opacity: cursorOn ? 1 : 0 }}>▍</span>;
  const prompt = <span style={{ color: colors.prompt }}>$ </span>;
  return (
    <AbsoluteFill style={{ backgroundColor: colors.page }}>
      <Headline title={text.title} body={text.body} />
      <div
        style={{
          position: "absolute",
          left: SAFE.side,
          top: 780,
          width: SAFE_WIDTH,
          padding: "40px 44px",
          borderRadius: 24,
          backgroundColor: colors.ink,
          color: colors.terminal,
          fontFamily: monoFamily,
          fontSize: 38,
          lineHeight: 1.6,
          whiteSpace: "pre",
        }}
      >
        <div>
          {prompt}
          {BUILD.slice(0, typedBuild)}
          {onRun ? null : cursor}
        </div>
        <div style={{ opacity: onRun ? 1 : 0 }}>
          {prompt}
          {RUN[0].slice(0, typedRun)}
          {onRun && !onSecondLine ? cursor : null}
        </div>
        <div style={{ opacity: onSecondLine ? 1 : 0 }}>
          {RUN[1].slice(0, Math.max(0, typedRun - RUN[0].length))}
          {onSecondLine ? cursor : null}
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const SocialSelfHostScene = Interactive.create({ Component: SocialSelfHostSceneInner, layout: "absolute-fill" });
