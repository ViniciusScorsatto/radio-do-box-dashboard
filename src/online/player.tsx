import { createRoot } from "react-dom/client";
import { Player } from "@remotion/player";
import { ShortVideo, videoMetadata } from "./ShortVideo";
import type { F1VideoJob } from "../lib/types";
const root = createRoot(document.getElementById("player")!);
// staticFile uses /public in both the browser and the renderer.
(window as unknown as { remotion_staticBase: string }).remotion_staticBase =
  "/public";
(window as unknown as { showPreview: (job: F1VideoJob) => void }).showPreview =
  (job) => {
    root.render(
      <Player
        component={ShortVideo}
        inputProps={{ job }}
        durationInFrames={videoMetadata.durationInFrames}
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
