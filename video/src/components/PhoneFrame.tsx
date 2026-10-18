import type React from "react";
import { colors } from "../theme";

type PhoneFrameProps = {
  readonly height: number;
  readonly children: React.ReactNode;
  readonly style?: React.CSSProperties;
};

const bezelOf = (height: number) => height * 0.028;

/** Width of the screen inside a phone of the given height (screenshots are 1170×1992). */
export const phoneScreenWidth = (height: number) => (height - bezelOf(height) * 2) * (1170 / 1992);

/** Phone body around a 390×664 screenshot (Playwright's iPhone 13 viewport, at 3×). */
export const PhoneFrame: React.FC<PhoneFrameProps> = ({ height, children, style }) => {
  const bezel = bezelOf(height);
  const screenHeight = height - bezel * 2;
  const screenWidth = phoneScreenWidth(height);
  return (
    <div
      style={{
        width: screenWidth + bezel * 2,
        height,
        padding: bezel,
        borderRadius: height * 0.075,
        backgroundColor: colors.ink,
        boxShadow: "0 30px 80px rgba(24, 24, 27, 0.22)",
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
