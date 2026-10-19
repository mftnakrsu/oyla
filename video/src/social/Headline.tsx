import type React from "react";
import { colors, fontFamily } from "../theme";
import { SAFE, SAFE_WIDTH } from "./layout";

type HeadlineProps = {
  readonly title: string;
  readonly body?: string;
  /** Title size in px; the body is 0.44 of it. */
  readonly size?: number;
  readonly style?: React.CSSProperties;
};

/** A scene's headline in the 9:16 video: top-left inside the safe area, big enough for a phone. */
export const Headline: React.FC<HeadlineProps> = ({ title, body, size = 96, style }) => (
  <div style={{ position: "absolute", left: SAFE.side, top: SAFE.top, width: SAFE_WIDTH, fontFamily, color: colors.ink, ...style }}>
    <div style={{ fontSize: size, fontWeight: 800, lineHeight: 1.05, letterSpacing: "-0.02em", textWrap: "balance" }}>{title}</div>
    {body ? (
      <div style={{ marginTop: size * 0.3, fontSize: size * 0.44, lineHeight: 1.3, color: colors.muted, textWrap: "pretty" }}>{body}</div>
    ) : null}
  </div>
);
