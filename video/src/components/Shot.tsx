import type React from "react";
import { Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { clamp, colors, fontFamily } from "../theme";

/** Screenshot sizes: the presenter and editor shots are 2160×1350, the phone shots 1170×1992. */
export const DESKTOP = { width: 2160, height: 1350 } as const;
export const PHONE = { width: 1170, height: 1992 } as const;

type ShotProps = {
  readonly src: string;
  /** Displayed width in px; the height follows the screenshot. */
  readonly width: number;
  readonly native: { readonly width: number; readonly height: number };
  /** Drawn on top, in the screenshot's own pixels. */
  readonly children?: React.ReactNode;
  readonly style?: React.CSSProperties;
};

/** A real screenshot of the app, with an optional layer that redraws parts of it natively. */
export const Shot: React.FC<ShotProps> = ({ src, width, native, children, style }) => {
  const k = width / native.width;
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width, height: native.height * k, overflow: "hidden", ...style }}>
      <Img src={staticFile(src)} style={{ position: "absolute", left: 0, top: 0, width: "100%", height: "100%" }} />
      {children ? (
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: native.width,
            height: native.height,
            transformOrigin: "0 0",
            scale: k,
            fontFamily,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {children}
        </div>
      ) : null}
    </div>
  );
};

/** Paints over part of a screenshot with a flat colour, so it can be redrawn. */
export const Cover: React.FC<{
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly color?: string;
}> = ({ x, y, width, height, color = colors.page }) => (
  <div style={{ position: "absolute", left: x, top: y, width, height, backgroundColor: color }} />
);

type TextAtProps = {
  readonly x: number;
  /** The baseline. */
  readonly y: number;
  readonly size: number;
  readonly weight?: number;
  readonly color?: string;
  readonly align?: "left" | "center" | "right";
  readonly children: React.ReactNode;
  readonly style?: React.CSSProperties;
};

/**
 * Text placed by its baseline. Atkinson Hyperlegible Next uses its typo metrics (ascent 0.984,
 * descent 0.316), so with line-height 1 the baseline sits 0.834 em below the top of the box.
 */
export const TextAt: React.FC<TextAtProps> = ({ x, y, size, weight = 400, color = colors.ink, align = "left", children, style }) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y - 0.834 * size,
      fontSize: size,
      lineHeight: 1,
      fontWeight: weight,
      color,
      whiteSpace: "nowrap",
      translate: align === "right" ? "-100% 0" : align === "center" ? "-50% 0" : undefined,
      ...style,
    }}
  >
    {children}
  </div>
);

type TapProps = {
  /** Where the finger lands, in screenshot pixels. */
  readonly x: number;
  readonly y: number;
  readonly at: number;
  readonly color?: string;
};

/** A touch: a soft disc that grows and fades where the finger lands. */
export const Tap: React.FC<TapProps> = ({ x, y, at, color = "rgba(255, 255, 255, 0.5)" }) => {
  const frame = useCurrentFrame();
  return (
    <div
      style={{
        position: "absolute",
        left: x - 90,
        top: y - 90,
        width: 180,
        height: 180,
        borderRadius: 999,
        backgroundColor: color,
        opacity: interpolate(frame, [at, at + 3, at + 16], [0, 1, 0], clamp),
        scale: interpolate(frame, [at, at + 16], [0.35, 1.25], clamp),
      }}
    />
  );
};
