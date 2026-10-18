import type React from "react";
import { colors } from "../theme";

type StampProps = {
  readonly size: number;
  readonly color?: string;
  readonly style?: React.CSSProperties;
};

/** The Oyla logo, drawn like the app's: double ring and check mark, turned -8°. */
export const Stamp: React.FC<StampProps> = ({ size, color = colors.stamp, style }) => (
  <svg viewBox="0 0 120 120" width={size} height={size} style={{ rotate: "-8deg", ...style }}>
    <g fill="none" stroke={color}>
      <circle cx="60" cy="60" r="55" strokeWidth="7" />
      <circle cx="60" cy="60" r="38" strokeWidth="3" />
      <path d="M40 62l13 13 27-30" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  </svg>
);
