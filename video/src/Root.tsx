import { Composition } from "remotion";
import { OylaDemo } from "./OylaDemo";
import { OylaTeaser } from "./OylaTeaser";
import { AskScene } from "./scenes/AskScene";
import { JoinScene } from "./scenes/JoinScene";
import { LiveScene } from "./scenes/LiveScene";
import { OpeningScene } from "./scenes/OpeningScene";
import { OutroScene } from "./scenes/OutroScene";
import { SelfHostScene } from "./scenes/SelfHostScene";
import { TypesScene } from "./scenes/TypesScene";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition id="OylaDemo" component={OylaDemo} durationInFrames={1080} fps={30} width={1920} height={1080} />
      <Composition id="OylaTeaser" component={OylaTeaser} durationInFrames={240} fps={30} width={1920} height={1080} />
      <Composition id="Opening" component={OpeningScene} durationInFrames={120} fps={30} width={1920} height={1080} />
      <Composition id="Ask" component={AskScene} durationInFrames={180} fps={30} width={1920} height={1080} />
      <Composition id="Join" component={JoinScene} durationInFrames={210} fps={30} width={1920} height={1080} />
      <Composition id="Live" component={LiveScene} durationInFrames={240} fps={30} width={1920} height={1080} />
      <Composition id="Types" component={TypesScene} durationInFrames={150} fps={30} width={1920} height={1080} />
      <Composition id="SelfHost" component={SelfHostScene} durationInFrames={150} fps={30} width={1920} height={1080} />
      <Composition id="Outro" component={OutroScene} durationInFrames={120} fps={30} width={1920} height={1080} />
    </>
  );
};
