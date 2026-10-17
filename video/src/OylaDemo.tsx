import { linearTiming, TransitionSeries } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { useVideoConfig } from "remotion";
import { AskScene } from "./scenes/AskScene";
import { JoinScene } from "./scenes/JoinScene";
import { LiveScene } from "./scenes/LiveScene";
import { OpeningScene } from "./scenes/OpeningScene";
import { OutroScene } from "./scenes/OutroScene";
import { SelfHostScene } from "./scenes/SelfHostScene";
import { TypesScene } from "./scenes/TypesScene";

/** 36 s product demo: 7 scenes, 15-frame fades between them. */
export const OylaDemo = () => {
  const { fps } = useVideoConfig();
  return (
    <TransitionSeries>
      <TransitionSeries.Sequence name="Opening" durationInFrames={4 * fps}>
        <OpeningScene />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: 0.5 * fps })} />
      <TransitionSeries.Sequence name="Ask" durationInFrames={6 * fps}>
        <AskScene />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: 0.5 * fps })} />
      <TransitionSeries.Sequence name="Join" durationInFrames={7 * fps}>
        <JoinScene />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: 0.5 * fps })} />
      <TransitionSeries.Sequence name="Live" durationInFrames={8 * fps}>
        <LiveScene />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: 0.5 * fps })} />
      <TransitionSeries.Sequence name="Types" durationInFrames={5 * fps}>
        <TypesScene />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: 0.5 * fps })} />
      <TransitionSeries.Sequence name="Self-host" durationInFrames={5 * fps}>
        <SelfHostScene />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: 0.5 * fps })} />
      <TransitionSeries.Sequence name="Outro" durationInFrames={4 * fps}>
        <OutroScene />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  );
};
