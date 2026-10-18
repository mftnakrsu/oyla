import { Composition, Folder } from "remotion";
import { QuestionClip } from "./clips/QuestionClip";
import { OylaDemo } from "./OylaDemo";
import { OylaTeaser } from "./OylaTeaser";
import { AskScene } from "./scenes/AskScene";
import { JoinScene } from "./scenes/JoinScene";
import { LiveScene } from "./scenes/LiveScene";
import { OpeningScene } from "./scenes/OpeningScene";
import { OutroScene } from "./scenes/OutroScene";
import { SelfHostScene } from "./scenes/SelfHostScene";
import { ThemesScene } from "./scenes/ThemesScene";
import { TypesScene } from "./scenes/TypesScene";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Folder name="Demo">
        <Composition id="OylaDemo-en" component={OylaDemo} durationInFrames={1185} fps={30} width={1920} height={1080} defaultProps={{ lang: "en" }} />
        <Composition id="OylaDemo-tr" component={OylaDemo} durationInFrames={1185} fps={30} width={1920} height={1080} defaultProps={{ lang: "tr" }} />
        <Composition id="OylaTeaser" component={OylaTeaser} durationInFrames={240} fps={30} width={1920} height={1080} />
      </Folder>
      <Folder name="Clips">
        <Composition id="clip-multiple-choice-en" component={QuestionClip} durationInFrames={180} fps={30} width={1280} height={720} defaultProps={{ type: "multiple-choice", lang: "en" }} />
        <Composition id="clip-multiple-choice-tr" component={QuestionClip} durationInFrames={180} fps={30} width={1280} height={720} defaultProps={{ type: "multiple-choice", lang: "tr" }} />
        <Composition id="clip-word-cloud-en" component={QuestionClip} durationInFrames={180} fps={30} width={1280} height={720} defaultProps={{ type: "word-cloud", lang: "en" }} />
        <Composition id="clip-word-cloud-tr" component={QuestionClip} durationInFrames={180} fps={30} width={1280} height={720} defaultProps={{ type: "word-cloud", lang: "tr" }} />
        <Composition id="clip-open-ended-en" component={QuestionClip} durationInFrames={180} fps={30} width={1280} height={720} defaultProps={{ type: "open-ended", lang: "en" }} />
        <Composition id="clip-open-ended-tr" component={QuestionClip} durationInFrames={180} fps={30} width={1280} height={720} defaultProps={{ type: "open-ended", lang: "tr" }} />
        <Composition id="clip-scale-en" component={QuestionClip} durationInFrames={180} fps={30} width={1280} height={720} defaultProps={{ type: "scale", lang: "en" }} />
        <Composition id="clip-scale-tr" component={QuestionClip} durationInFrames={180} fps={30} width={1280} height={720} defaultProps={{ type: "scale", lang: "tr" }} />
      </Folder>
      <Folder name="Scenes">
        <Composition id="Opening" component={OpeningScene} durationInFrames={120} fps={30} width={1920} height={1080} defaultProps={{ lang: "en" }} />
        <Composition id="Ask" component={AskScene} durationInFrames={180} fps={30} width={1920} height={1080} defaultProps={{ lang: "en" }} />
        <Composition id="Join" component={JoinScene} durationInFrames={180} fps={30} width={1920} height={1080} defaultProps={{ lang: "en" }} />
        <Composition id="Live" component={LiveScene} durationInFrames={225} fps={30} width={1920} height={1080} defaultProps={{ lang: "en" }} />
        <Composition id="Types" component={TypesScene} durationInFrames={150} fps={30} width={1920} height={1080} defaultProps={{ lang: "en" }} />
        <Composition id="Themes" component={ThemesScene} durationInFrames={150} fps={30} width={1920} height={1080} defaultProps={{ lang: "en" }} />
        <Composition id="SelfHost" component={SelfHostScene} durationInFrames={150} fps={30} width={1920} height={1080} defaultProps={{ lang: "en" }} />
        <Composition id="Outro" component={OutroScene} durationInFrames={135} fps={30} width={1920} height={1080} defaultProps={{ lang: "en" }} />
      </Folder>
    </>
  );
};
