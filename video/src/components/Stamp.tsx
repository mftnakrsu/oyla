import type React from "react";
import { colors } from "../theme";

type StampProps = {
  readonly size: number;
  readonly label?: string;
  readonly style?: React.CSSProperties;
};

/** The Oyla rubber stamp, drawn like the app's logo: double ring and check mark at -8°. */
export const Stamp: React.FC<StampProps> = ({ size, label, style }) => {
  const id = `ring-${size}`;
  return (
    <svg viewBox="0 0 120 120" width={size} height={size} style={{ rotate: "-8deg", ...style }}>
      <defs>
        <path id={id} d="M60 60 m-41 0 a41 41 0 1 1 82 0 a41 41 0 1 1 -82 0" />
      </defs>
      <g fill="none" stroke={colors.stamp}>
        <circle cx="60" cy="60" r="55" strokeWidth="7" />
        <circle cx="60" cy="60" r={label ? 30 : 38} strokeWidth="3" />
        <path
          d={label ? "M47 61l9 9 17-19" : "M40 62l13 13 27-30"}
          strokeWidth={label ? 7 : 10}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {label ? (
          <text fill={colors.stamp} stroke="none" fontSize="15" fontWeight="800" letterSpacing="3">
            <textPath href={`#${id}`} startOffset="50%" textAnchor="middle">
              {`${label.toUpperCase()} ★ ${label.toUpperCase()} ★`}
            </textPath>
          </text>
        ) : null}
      </g>
    </svg>
  );
};
