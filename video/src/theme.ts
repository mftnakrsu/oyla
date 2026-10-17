import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

// The same tokens as the web app (packages/web/src/index.css), so the video looks like Oyla.
export const colors = {
  page: "#EEF0F4",
  paper: "#FFFFFF",
  ink: "#1A1C24",
  muted: "#5D6272",
  line: "#D5D9E2",
  stamp: "#D92D3A",
  series: "#0072B2",
} as const;

export const fontFamily = "Atkinson Hyperlegible Next";

loadFont({
  family: fontFamily,
  url: staticFile("fonts/atkinson.woff2"),
  weight: "200 800",
});
