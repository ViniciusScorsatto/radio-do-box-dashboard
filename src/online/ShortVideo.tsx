import { ImageShort, type ImageJob } from "./ImageShort";
import { F1GridComposition } from "../compositions/F1GridComposition";
import {
  F1ConstructorStandingsComposition,
  F1DriverStandingsComposition,
} from "../compositions/F1StandingsComposition";
import {
  F1EditorialComposition,
  type F1EditorialCompositionProps,
} from "../compositions/F1EditorialComposition";
import type { F1VideoJob } from "../lib/types";
export const videoMetadata = {
  durationInFrames: 360,
  fps: 30,
  width: 1080,
  height: 1920,
};
export type OnlineJob = F1VideoJob | ImageJob;
export type ShortProps = { job?: OnlineJob };
export const shortDuration = (job?: OnlineJob) =>
  job?.template === "uploaded-images"
    ? job.durationInFrames
    : videoMetadata.durationInFrames;
export function ShortVideo({ job }: ShortProps) {
  if (!job) throw new Error("Prepare uma prévia antes de renderizar.");
  if (job.template === "uploaded-images") return <ImageShort job={job} />;
  if (job.template === "race-results" || job.template === "qualifying-grid")
    return <F1GridComposition {...job} />;
  if (job.template === "driver-standings")
    return <F1DriverStandingsComposition {...job} />;
  if (job.template === "constructor-standings")
    return <F1ConstructorStandingsComposition {...job} />;
  if (job.template === "editorial")
    return (
      <F1EditorialComposition
        {...(job as unknown as F1EditorialCompositionProps)}
      />
    );
  throw new Error("Template indisponível online.");
}
