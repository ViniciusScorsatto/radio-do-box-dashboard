import {
  AbsoluteFill,
  Html5Audio,
  Img,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
export type ImageJob = {
  template: "uploaded-images";
  title: string;
  durationInFrames: number;
  images: Array<{ id: string; path: string; durationInFrames: number }>;
  soundtrackPath: string;
  soundtrackVolume: number;
};
export function ImageShort({ job }: { job: ImageJob }) {
  const frame = useCurrentFrame();
  const { durationInFrames, fps } = useVideoConfig();
  const fade = Math.min(1, Math.max(0, (durationInFrames - 1 - frame) / fps));
  let from = 0;
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {job.images.map((image, index) => {
        const start = from;
        from += image.durationInFrames;
        return (
          <Sequence
            key={`${image.id}-${index}`}
            from={start}
            durationInFrames={image.durationInFrames}
          >
            <Img
              src={staticFile(image.path)}
              style={{ width: "100%", height: "100%", objectFit: "contain" }}
            />
          </Sequence>
        );
      })}
      {job.soundtrackVolume > 0 && (
        <Html5Audio
          src={staticFile(job.soundtrackPath)}
          loop
          volume={job.soundtrackVolume * fade}
        />
      )}
    </AbsoluteFill>
  );
}
