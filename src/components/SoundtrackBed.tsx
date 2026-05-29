import {Audio, staticFile, useVideoConfig} from 'remotion';

type SoundtrackBedProps = {
  soundtrackPath?: string;
  volume?: number;
  fadeSeconds?: number;
  duckUntilSeconds?: number;
  duckVolumeMultiplier?: number;
};

export const SoundtrackBed = ({
  soundtrackPath,
  volume = 0.2,
  fadeSeconds = 0.2,
  duckUntilSeconds = 0,
  duckVolumeMultiplier = 0.45,
}: SoundtrackBedProps) => {
  const {fps, durationInFrames} = useVideoConfig();

  if (!soundtrackPath) {
    return null;
  }

  const fadeFrames = Math.max(1, Math.round(fadeSeconds * fps));
  const maxFrameIndex = Math.max(durationInFrames - 1, 0);

  return (
    <Audio
      src={staticFile(soundtrackPath.replace(/^\//, ''))}
      volume={(frame) => {
        const fadeInProgress = Math.min(1, frame / fadeFrames);
        const fadeOutStart = Math.max(0, durationInFrames - fadeFrames);
        const fadeOutProgress =
          frame >= fadeOutStart
            ? Math.max(0, (maxFrameIndex - frame) / fadeFrames)
            : 1;

        const duckFrames = Math.round(duckUntilSeconds * fps);
        const duckMultiplier = frame <= duckFrames ? duckVolumeMultiplier : 1;

        return volume * duckMultiplier * Math.min(fadeInProgress, fadeOutProgress);
      }}
    />
  );
};
