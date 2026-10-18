import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

/** Light-mode tokens of the default Emerald theme, as in packages/web/src/index.css. */
export const colors = {
  page: "#f4f4f5",
  paper: "#ffffff",
  ink: "#18181b",
  muted: "#52525b",
  line: "#e4e4e7",
  brand: "#047857",
  stamp: "#059669",
  series: "#059669",
  /** The scale chart's axis: border-ink/20 on the page. */
  axis: "#c8c8ca",
  /** Terminal text and its prompt, on ink. */
  terminal: "#e4e4e7",
  prompt: "#34d399",
} as const;

export type ThemeId = "emerald" | "indigo" | "navy" | "blue";

/** The four presentation themes; the picker in the editor shows each as brand + series dots. */
export const themes: Record<ThemeId, { readonly brand: string; readonly series: string }> = {
  emerald: { brand: "#047857", series: "#059669" },
  indigo: { brand: "#4f46e5", series: "#6366f1" },
  navy: { brand: "#1e3a8a", series: "#ea580c" },
  blue: { brand: "#2563eb", series: "#2563eb" },
};

export const themeOrder: readonly ThemeId[] = ["emerald", "indigo", "navy", "blue"];

export const fontFamily = "Atkinson Hyperlegible Next";
export const monoFamily = "Menlo, ui-monospace, monospace";

// The same variable font as the app, in its two subsets: Latin, and Latin Extended for ğ, ş and İ.
loadFont({
  family: fontFamily,
  url: staticFile("fonts/atkinson.woff2"),
  weight: "200 800",
  unicodeRange:
    "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD",
});
loadFont({
  family: fontFamily,
  url: staticFile("fonts/atkinson-ext.woff2"),
  weight: "200 800",
  unicodeRange:
    "U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF",
});

/** Shared extrapolation for interpolate() calls that should hold their end values. */
export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
