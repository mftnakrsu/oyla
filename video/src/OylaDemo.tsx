import { linearTiming, TransitionSeries } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { AbsoluteFill, useVideoConfig } from "remotion";
import { captionScripts } from "./captions";
import { Soundtrack, type SoundtrackProps } from "./components/Soundtrack";
import { Subtitles } from "./components/Subtitles";
import type { Lang } from "./i18n";
import { AskScene } from "./scenes/AskScene";
import { JoinScene } from "./scenes/JoinScene";
import { LiveScene } from "./scenes/LiveScene";
import { OpeningScene } from "./scenes/OpeningScene";
import { OutroScene } from "./scenes/OutroScene";
import { SelfHostScene } from "./scenes/SelfHostScene";
import { ThemesScene } from "./scenes/ThemesScene";
import { TypesScene } from "./scenes/TypesScene";
import { colors } from "./theme";

export type OylaDemoProps = SoundtrackProps & {
  readonly lang: Lang;
  /** Burned-in subtitles from src/captions.ts. Off renders the original, caption-free demo. */
  readonly captions?: boolean;
};

/** With subtitles, the scenes shrink to 90 % from the top centre, freeing the bottom 108 px. */
const CAPTIONED_STAGE = 0.9;

/**
 * 39.5 s product demo: 8 scenes with 0.5 s fades between them
 * (4 + 6 + 6 + 7.5 + 5 + 5 + 5 + 4.5 s, minus 7 × 0.5 s = 1185 frames at 30 fps).
 */
export const OylaDemo: React.FC<OylaDemoProps> = ({ lang, captions = false, ...soundtrack }) => {
  const { fps } = useVideoConfig();
  const scenes = (
    <TransitionSeries>
      <TransitionSeries.Sequence name="Opening" durationInFrames={4 * fps}>
        <OpeningScene lang={lang} />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: 0.5 * fps })} />
      <TransitionSeries.Sequence name="Ask" durationInFrames={6 * fps}>
        <AskScene lang={lang} />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: 0.5 * fps })} />
      <TransitionSeries.Sequence name="Join" durationInFrames={6 * fps}>
        <JoinScene lang={lang} />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: 0.5 * fps })} />
      <TransitionSeries.Sequence name="Live" durationInFrames={7.5 * fps}>
        <LiveScene lang={lang} />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: 0.5 * fps })} />
      <TransitionSeries.Sequence name="Types" durationInFrames={5 * fps}>
        <TypesScene lang={lang} />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: 0.5 * fps })} />
      <TransitionSeries.Sequence name="Themes" durationInFrames={5 * fps}>
        <ThemesScene lang={lang} />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: 0.5 * fps })} />
      <TransitionSeries.Sequence name="Self-host" durationInFrames={5 * fps}>
        <SelfHostScene lang={lang} />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: 0.5 * fps })} />
      <TransitionSeries.Sequence name="Outro" durationInFrames={4.5 * fps}>
        <OutroScene lang={lang} />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  );
  return (
    <>
      {captions ? (
        <AbsoluteFill style={{ backgroundColor: colors.page }}>
          <AbsoluteFill style={{ scale: CAPTIONED_STAGE, transformOrigin: "50% 0%" }}>{scenes}</AbsoluteFill>
          <Subtitles cues={captionScripts.demo.cues[lang]} fontSize={42} maxWidth={1560} bottom={34} />
        </AbsoluteFill>
      ) : (
        scenes
      )}
      <Soundtrack cues={captionScripts.demo.cues[lang]} {...soundtrack} />
    </>
  );
};
