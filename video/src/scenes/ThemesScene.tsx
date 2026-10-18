import { AbsoluteFill, Easing, Img, Interactive, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { BrowserFrame } from "../components/BrowserFrame";
import { Caption } from "../components/Caption";
import { PhoneFrame } from "../components/PhoneFrame";
import { copy, type Lang } from "../i18n";
import { colors, fontFamily, themeOrder, themes } from "../theme";

const fill = { position: "absolute", left: 0, top: 0, width: "100%", height: "100%" } as const;

/** When each theme takes over (in seconds); each one crossfades in over 0.27 s. */
const SWITCH_AT = [0, 1.35, 2.4, 3.45];

const ThemesSceneInner = ({ lang }: { readonly lang: Lang }) => {
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
      <Caption title={text.title} body={text.body} style={{ position: "absolute", left: 120, top: 200, width: 620 }} />
      {/* The theme picker, as in the editor: two dots per theme, the chosen one outlined. */}
      <div style={{ position: "absolute", left: 120, top: 620, width: 660, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
        {themeOrder.map((theme, index) => (
          <div
            key={theme}
            style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
              gap: 16,
              minHeight: 104,
              padding: "14px 18px",
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
              <div style={{ width: 40, height: 40, borderRadius: 999, border: `4px solid ${colors.paper}`, backgroundColor: themes[theme].brand }} />
              <div style={{ width: 40, height: 40, marginLeft: -12, borderRadius: 999, border: `4px solid ${colors.paper}`, backgroundColor: themes[theme].series }} />
            </div>
            <div style={{ fontSize: 30, fontWeight: 700, lineHeight: 1.15, color: colors.ink }}>{text.names[theme]}</div>
          </div>
        ))}
      </div>
      <BrowserFrame
        width={960}
        style={{
          position: "absolute",
          left: 840,
          top: 160,
          translate: interpolate(frame, [0, 0.7 * fps], ["80px 0px", "0px 0px"], {
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
        height={540}
        style={{
          position: "absolute",
          left: 1530,
          top: 470,
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
    </AbsoluteFill>
  );
};

export const ThemesScene = Interactive.create({ Component: ThemesSceneInner, layout: "absolute-fill" });
