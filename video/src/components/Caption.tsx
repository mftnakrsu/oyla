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
    <div style={{ fontSize: 92, fontWeight: 800, lineHeight: 1.06, letterSpacing: "-0.02em", textWrap: "balance" }}>{title}</div>
    {body ? (
      <div style={{ marginTop: 32, fontSize: 46, lineHeight: 1.32, color: colors.muted, textWrap: "pretty" }}>{body}</div>
    ) : null}
  </div>
);
