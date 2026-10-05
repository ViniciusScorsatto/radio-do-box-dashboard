import { createRef } from "react";
import { createRoot } from "react-dom/client";
import { Player, type PlayerRef } from "@remotion/player";
import {
  ShortVideo,
  videoMetadata,
  shortDuration,
  type OnlineJob,
} from "./ShortVideo";
const roots = {
  player: createRoot(document.getElementById("player")!),
  "image-player": createRoot(document.getElementById("image-player")!),
};
const refs = {
  player: createRef<PlayerRef>(),
  "image-player": createRef<PlayerRef>(),
};
(window as unknown as { pausePreviews: () => void }).pausePreviews = () =>
  Object.values(refs).forEach((ref) => ref.current?.pause());
// staticFile uses /public in both the browser and the renderer.
(window as unknown as { remotion_staticBase: string }).remotion_staticBase =
  "/public";
(
  window as unknown as {
    showPreview: (job: OnlineJob, target?: keyof typeof roots) => void;
  }
).showPreview = (job, target = "player") => {
  roots[target].render(
    <Player
      key={JSON.stringify(job)}
      ref={refs[target]}
      component={ShortVideo}
      inputProps={{ job }}
      durationInFrames={shortDuration(job)}
      fps={videoMetadata.fps}
      compositionWidth={videoMetadata.width}
      compositionHeight={videoMetadata.height}
      controls
      style={{ width: "100%", maxHeight: "72vh", aspectRatio: "9 / 16" }}
      errorFallback={() => (
        <p>Não foi possível carregar esta prévia. Prepare novamente.</p>
      )}
    />,
  );
};
