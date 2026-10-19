import { linearTiming, TransitionSeries } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { AbsoluteFill, useVideoConfig } from "remotion";
import { captionScripts } from "./captions";
import { Soundtrack, type SoundtrackProps } from "./components/Soundtrack";
import { Subtitles } from "./components/Subtitles";
import type { Lang } from "./i18n";
import { SocialAskScene } from "./social/AskScene";
import { SocialHookScene } from "./social/HookScene";
import { SocialJoinScene } from "./social/JoinScene";
import { SAFE, SAFE_WIDTH } from "./social/layout";
import { SocialOutroScene } from "./social/OutroScene";
import { SocialSelfHostScene } from "./social/SelfHostScene";
import { SocialThemesScene } from "./social/ThemesScene";
import { SocialTypesScene } from "./social/TypesScene";
import { colors } from "./theme";

export type OylaSocialProps = SoundtrackProps & {
  readonly lang: Lang;
  /** Burned-in subtitles from src/captions.ts (on by default: most people watch muted). */
  readonly captions?: boolean;
};

/**
 * 25.5 s vertical cut (1080×1920) for LinkedIn, X, Reels and Shorts: 7 scenes with 0.5 s fades
 * (3.5 + 4 + 5 + 4.5 + 4 + 4 + 3.5 s, minus 6 × 0.5 s = 765 frames at 30 fps).
 */
export const OylaSocial: React.FC<OylaSocialProps> = ({ lang, captions = true, ...soundtrack }) => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ backgroundColor: colors.page }}>
      <TransitionSeries>
        <TransitionSeries.Sequence name="Hook" durationInFrames={3.5 * fps}>
          <SocialHookScene lang={lang} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: 0.5 * fps })} />
        <TransitionSeries.Sequence name="Ask" durationInFrames={4 * fps}>
          <SocialAskScene lang={lang} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: 0.5 * fps })} />
        <TransitionSeries.Sequence name="Join" durationInFrames={5 * fps}>
          <SocialJoinScene lang={lang} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: 0.5 * fps })} />
        <TransitionSeries.Sequence name="Types" durationInFrames={4.5 * fps}>
          <SocialTypesScene lang={lang} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: 0.5 * fps })} />
        <TransitionSeries.Sequence name="Themes" durationInFrames={4 * fps}>
          <SocialThemesScene lang={lang} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: 0.5 * fps })} />
        <TransitionSeries.Sequence name="Self-host" durationInFrames={4 * fps}>
          <SocialSelfHostScene lang={lang} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: 0.5 * fps })} />
        <TransitionSeries.Sequence name="Outro" durationInFrames={3.5 * fps}>
          <SocialOutroScene lang={lang} />
        </TransitionSeries.Sequence>
      </TransitionSeries>
      {captions ? (
        <Subtitles cues={captionScripts.social.cues[lang]} fontSize={50} maxWidth={SAFE_WIDTH + 40} bottom={SAFE.captionBottom} />
      ) : null}
      <Soundtrack cues={captionScripts.social.cues[lang]} {...soundtrack} />
    </AbsoluteFill>
  );
};
