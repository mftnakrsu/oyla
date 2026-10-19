import { AbsoluteFill, Easing, Interactive, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { BrowserFrame } from "../components/BrowserFrame";
import { Presenter } from "../components/Presenter";
import { copy, type Lang } from "../i18n";
import { clamp, colors, fontFamily } from "../theme";
import { Headline } from "./Headline";
import { SAFE, SAFE_WIDTH } from "./layout";

/**
 * The first 3.5 s: the promise in big type, readable from frame 0 (it doubles as the thumbnail),
 * and the presenter's bars already filling up underneath.
 */
const SocialHookSceneInner = ({ lang }: { readonly lang: Lang }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const text = copy[lang].social.hook;
  return (
    <AbsoluteFill style={{ backgroundColor: colors.page }}>
      <Headline
        title={text.title}
        size={112}
        style={{
          transformOrigin: "0% 0%",
          scale: interpolate(frame, [0, 0.4 * fps], [1.04, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
        }}
      />
      {/* The three promises as pills, popping in one after the other. */}
      <div style={{ position: "absolute", left: SAFE.side, top: 500, width: SAFE_WIDTH, display: "flex", flexWrap: "wrap", gap: 16 }}>
        {text.tags.map((tag, index) => (
          <div
            key={tag}
            style={{
              padding: "10px 26px",
              borderRadius: 999,
              border: `4px solid ${colors.brand}`,
              backgroundColor: colors.paper,
              color: colors.brand,
              fontFamily,
              fontSize: 40,
              fontWeight: 700,
              whiteSpace: "nowrap",
              opacity: interpolate(frame, [(0.2 + 0.15 * index) * fps, (0.35 + 0.15 * index) * fps], [0, 1], clamp),
              scale: interpolate(frame, [(0.2 + 0.15 * index) * fps, (0.45 + 0.15 * index) * fps], [0.85, 1], {
                ...clamp,
                easing: Easing.bezier(0.2, 0.9, 0.3, 1.25),
              }),
            }}
          >
            {tag}
          </div>
        ))}
      </div>
      <BrowserFrame
        width={960}
        style={{
          position: "absolute",
          left: 60,
          top: 700,
          translate: interpolate(frame, [0, 0.6 * fps], ["0px 60px", "0px 0px"], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
        }}
      >
        <Presenter type="multiple-choice" lang={lang} width={960} timing={{ start: 0.15 * fps, end: 3 * fps, own: 1.1 * fps }} />
      </BrowserFrame>
    </AbsoluteFill>
  );
};

export const SocialHookScene = Interactive.create({ Component: SocialHookSceneInner, layout: "absolute-fill" });
