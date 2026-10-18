import type React from "react";
import { colors, fontFamily } from "../theme";

type BrowserFrameProps = {
  readonly width: number;
  readonly url?: string;
  readonly children: React.ReactNode;
  readonly style?: React.CSSProperties;
};

/** Height of the address bar for a frame of the given width. */
export const browserBarHeight = (width: number) => Math.round(width * 0.036);

/** A plain window frame with the address bar, around a 16:10 screenshot. */
export const BrowserFrame: React.FC<BrowserFrameProps> = ({ width, url = "oyla.example.com", children, style }) => {
  const bar = browserBarHeight(width);
  return (
    <div
      style={{
        width,
        borderRadius: Math.max(10, width * 0.016),
        overflow: "hidden",
        backgroundColor: colors.paper,
        boxShadow: "0 30px 80px rgba(24, 24, 27, 0.16), 0 0 0 2px rgba(24, 24, 27, 0.06)",
        ...style,
      }}
    >
      <div
        style={{
          height: bar,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#fafafa",
          borderBottom: `2px solid ${colors.line}`,
        }}
      >
        <div
          style={{
            fontFamily,
            fontSize: bar * 0.42,
            color: colors.muted,
            backgroundColor: colors.paper,
            border: `1px solid ${colors.line}`,
            borderRadius: 999,
            padding: `${bar * 0.06}px ${bar * 0.6}px`,
          }}
        >
          {url}
        </div>
      </div>
      <div style={{ width, height: width / 1.6, position: "relative", overflow: "hidden" }}>{children}</div>
    </div>
  );
};
