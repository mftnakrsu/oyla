/**
 * The 9:16 frame (1080×1920) and the margins that stay clear of the apps' own overlays: the top
 * bar on Reels and TikTok, the like and share column on the right, the caption and the buttons at
 * the bottom. Headlines start at `top`; scene content ends at `contentBottom`; the subtitles sit
 * between that and `captionBottom` (measured from the bottom of the frame).
 */
export const SOCIAL = { width: 1080, height: 1920 } as const;
export const SAFE = { top: 230, side: 100, contentBottom: 1350, captionBottom: 390 } as const;
/** Width of a headline or a full-width block inside the side margins. */
export const SAFE_WIDTH = SOCIAL.width - 2 * SAFE.side;
