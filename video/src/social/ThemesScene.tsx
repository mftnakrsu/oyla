import { AbsoluteFill, Easing, Img, Interactive, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { BrowserFrame } from "../components/BrowserFrame";
import { PhoneFrame } from "../components/PhoneFrame";
import { copy, type Lang } from "../i18n";
import { colors, fontFamily, themeOrder, themes } from "../theme";
import { Headline } from "./Headline";
import { SAFE } from "./layout";

const fill = { position: "absolute", left: 0, top: 0, width: "100%", height: "100%" } as const;

/** When each theme takes over (in seconds); each one crossfades in over 0.27 s. */
const SWITCH_AT = [0, 1, 1.9, 2.8];

/** The big screen and a phone switch through the four themes; the picker below follows. */
const SocialThemesSceneInner = ({ lang }: { readonly lang: Lang }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const text = copy[lang].themes;
  // 1 while a theme is on screen; each later theme fades in over the previous one.
  const shown = (index: number) => {
    const at = (SWITCH_AT[index] ?? 0) * fps;
    const next = SWITCH_AT[index + 1];
    const fadeIn = index === 0 ? 1 : interpolate(frame, [at, at + 8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    const fadeOut = next === undefined ? 1 : interpolate(frame, [next * fps, next * fps + 8], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    return fadeIn * fadeOut;
  };
  return (
    <AbsoluteFill style={{ backgroundColor: colors.page, fontFamily }}>
      <Headline title={text.title} />
      <BrowserFrame
        width={960}
        style={{
          position: "absolute",
          left: 60,
          top: 400,
          translate: interpolate(frame, [0, 0.7 * fps], ["0px 60px", "0px 0px"], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
        }}
      >
        {themeOrder.map((theme, index) => (
          <Img key={theme} src={staticFile(`shots/theme-${theme}-present-${lang}.png`)} style={{ ...fill, opacity: shown(index) }} />
        ))}
      </BrowserFrame>
      <PhoneFrame
        height={460}
        style={{
          position: "absolute",
          left: 726,
          top: 860,
          translate: interpolate(frame, [0.1 * fps, 0.8 * fps], ["0px 60px", "0px 0px"], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
        }}
      >
        {themeOrder.map((theme, index) => (
          <Img key={theme} src={staticFile(`shots/theme-${theme}-phone-${lang}.png`)} style={{ ...fill, opacity: shown(index) }} />
        ))}
      </PhoneFrame>
      {/* The theme picker, as in the editor: two dots per theme, the chosen one outlined. */}
      <div
        style={{
          position: "absolute",
          left: SAFE.side,
          top: 1080,
          width: 590,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 16,
        }}
      >
        {themeOrder.map((theme, index) => (
          <div
            key={theme}
            style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
              gap: 14,
              minHeight: 100,
              padding: "12px 16px",
              borderRadius: 22,
              border: `4px solid ${colors.line}`,
              backgroundColor: colors.paper,
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: -4,
                borderRadius: 22,
                border: `4px solid ${themes[theme].brand}`,
                opacity: shown(index),
              }}
            />
            <div style={{ display: "flex", flexShrink: 0 }}>
              <div style={{ width: 38, height: 38, borderRadius: 999, border: `4px solid ${colors.paper}`, backgroundColor: themes[theme].brand }} />
              <div style={{ width: 38, height: 38, marginLeft: -12, borderRadius: 999, border: `4px solid ${colors.paper}`, backgroundColor: themes[theme].series }} />
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, lineHeight: 1.15, color: colors.ink }}>{text.names[theme]}</div>
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

export const SocialThemesScene = Interactive.create({ Component: SocialThemesSceneInner, layout: "absolute-fill" });
