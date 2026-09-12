import {SoundtrackBed} from './SoundtrackBed';
import {VoiceoverBed} from './VoiceoverBed';
import type {F1ThemeConfig} from '../lib/types';

type F1ProductionBedProps = {
  theme: F1ThemeConfig;
  brandName: string;
  brandLogoPath?: string;
  soundtrackPath?: string;
  soundtrackVolume?: number;
  voiceoverPath?: string;
  introTitle?: string;
  introSubtitle?: string;
};

export const F1ProductionBed = ({
  soundtrackPath,
  soundtrackVolume,
  voiceoverPath,
}: F1ProductionBedProps) => (
  <div style={{position: 'absolute', inset: 0, zIndex: 9999, pointerEvents: 'none'}}>
    <SoundtrackBed
      soundtrackPath={soundtrackPath}
      volume={soundtrackVolume ?? 0.3}
      fadeSeconds={0.2}
      duckUntilSeconds={voiceoverPath ? 3.1 : 0}
      duckVolumeMultiplier={0.25}
    />
    <VoiceoverBed voiceoverPath={voiceoverPath} volume={1} />
  </div>
);
