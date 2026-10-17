import type React from "react";
import { colors, fontFamily } from "../theme";

type CaptionProps = {
  readonly title: string;
  readonly body?: string;
  readonly style?: React.CSSProperties;
};

/** Scene headline and one supporting line, sized for 1920×1080. */
export const Caption: React.FC<CaptionProps> = ({ title, body, style }) => (
  <div style={{ fontFamily, color: colors.ink, ...style }}>
    <div style={{ fontSize: 96, fontWeight: 800, lineHeight: 1.05, letterSpacing: "-0.02em" }}>{title}</div>
    {body ? (
      <div style={{ marginTop: 28, fontSize: 46, lineHeight: 1.3, color: colors.muted }}>{body}</div>
    ) : null}
  </div>
);
