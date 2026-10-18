import { linearTiming, TransitionSeries } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { useVideoConfig } from "remotion";
import type { Lang } from "./i18n";
import { AskScene } from "./scenes/AskScene";
import { JoinScene } from "./scenes/JoinScene";
import { LiveScene } from "./scenes/LiveScene";
import { OpeningScene } from "./scenes/OpeningScene";
import { OutroScene } from "./scenes/OutroScene";
import { SelfHostScene } from "./scenes/SelfHostScene";
import { ThemesScene } from "./scenes/ThemesScene";
import { TypesScene } from "./scenes/TypesScene";

export type OylaDemoProps = {
  readonly lang: Lang;
};

/**
 * 39.5 s product demo: 8 scenes with 0.5 s fades between them
 * (4 + 6 + 6 + 7.5 + 5 + 5 + 5 + 4.5 s, minus 7 × 0.5 s = 1185 frames at 30 fps).
 */
export const OylaDemo: React.FC<OylaDemoProps> = ({ lang }) => {
  const { fps } = useVideoConfig();
  return (
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
};
