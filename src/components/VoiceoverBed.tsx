import {Audio, staticFile, useVideoConfig} from 'remotion';

type VoiceoverBedProps = {
  voiceoverPath?: string;
  volume?: number;
  fadeSeconds?: number;
};

export const VoiceoverBed = ({
  voiceoverPath,
  volume = 0.82,
  fadeSeconds = 0.2,
}: VoiceoverBedProps) => {
  const {fps} = useVideoConfig();

  if (!voiceoverPath) {
    return null;
  }

  const fadeFrames = Math.max(1, Math.round(fadeSeconds * fps));

  return (
    <Audio
      src={staticFile(voiceoverPath.replace(/^\//, ''))}
      volume={(frame) => {
        const fadeInProgress = Math.min(1, frame / fadeFrames);
        return volume * fadeInProgress;
      }}
    />
  );
};
