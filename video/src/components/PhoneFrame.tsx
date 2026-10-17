import type React from "react";
import { colors } from "../theme";

type PhoneFrameProps = {
  readonly height: number;
  readonly children: React.ReactNode;
  readonly style?: React.CSSProperties;
};

/** Phone body around a 390×664 screenshot (Playwright's iPhone 13 viewport). */
export const PhoneFrame: React.FC<PhoneFrameProps> = ({ height, children, style }) => {
  const bezel = height * 0.028;
  const screenHeight = height - bezel * 2;
  const screenWidth = screenHeight * (1170 / 1992);
  return (
    <div
      style={{
        width: screenWidth + bezel * 2,
        height,
        padding: bezel,
        borderRadius: height * 0.075,
        backgroundColor: colors.ink,
        boxShadow: "0 30px 80px rgba(26, 28, 36, 0.25)",
        ...style,
      }}
    >
      <div
        style={{
          position: "relative",
          width: screenWidth,
          height: screenHeight,
          borderRadius: height * 0.055,
          overflow: "hidden",
          backgroundColor: colors.page,
        }}
      >
        {children}
      </div>
    </div>
  );
};
