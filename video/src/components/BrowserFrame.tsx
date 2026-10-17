import type React from "react";
import { colors, fontFamily } from "../theme";

type BrowserFrameProps = {
  readonly width: number;
  readonly url?: string;
  readonly children: React.ReactNode;
  readonly style?: React.CSSProperties;
};

/** A plain window frame with the address bar, sized to a 16:10 screenshot. */
export const BrowserFrame: React.FC<BrowserFrameProps> = ({ width, url = "oyla.mefby.com", children, style }) => {
  const bar = Math.round(width * 0.036);
  return (
    <div
      style={{
        width,
        borderRadius: 18,
        overflow: "hidden",
        backgroundColor: colors.paper,
        boxShadow: "0 30px 80px rgba(26, 28, 36, 0.18), 0 0 0 2px rgba(26, 28, 36, 0.06)",
        ...style,
      }}
    >
      <div
        style={{
          height: bar,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#F6F7F9",
          borderBottom: `2px solid ${colors.line}`,
        }}
      >
        <div
          style={{
            fontFamily,
            fontSize: bar * 0.42,
            color: colors.muted,
            backgroundColor: colors.paper,
            borderRadius: 999,
            padding: `${bar * 0.08}px ${bar * 0.6}px`,
          }}
        >
          {url}
        </div>
      </div>
      <div style={{ width, height: width / 1.6, position: "relative" }}>{children}</div>
    </div>
  );
};
