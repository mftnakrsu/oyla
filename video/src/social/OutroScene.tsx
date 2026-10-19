import { AbsoluteFill, Easing, Interactive, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { Stamp } from "../components/Stamp";
import { copy, type Lang } from "../i18n";
import { colors, fontFamily } from "../theme";
import { SAFE } from "./layout";

/** Logo and the two links, stacked and centred in the safe area. */
const SocialOutroSceneInner = ({ lang }: { readonly lang: Lang }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const text = copy[lang].outro;
  return (
    <AbsoluteFill style={{ backgroundColor: colors.page, fontFamily }}>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: SAFE.top,
          height: SAFE.contentBottom - SAFE.top,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 40 }}>
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
            marginTop: 90,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 10,
            textAlign: "center",
            opacity: interpolate(frame, [0.6 * fps, 1.1 * fps], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
            translate: interpolate(frame, [0.6 * fps, 1.1 * fps], ["0px 24px", "0px 0px"], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.bezier(0.16, 1, 0.3, 1),
            }),
          }}
        >
          <div style={{ fontSize: 40, color: colors.muted }}>{text.docs}</div>
          <div style={{ fontSize: 60, fontWeight: 800, color: colors.ink }}>oyla.mefby.com</div>
          <div style={{ marginTop: 40, fontSize: 40, color: colors.muted }}>{text.code}</div>
          <div style={{ fontSize: 56, fontWeight: 800, color: colors.ink }}>github.com/mftnakrsu/oyla</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const SocialOutroScene = Interactive.create({ Component: SocialOutroSceneInner, layout: "absolute-fill" });
