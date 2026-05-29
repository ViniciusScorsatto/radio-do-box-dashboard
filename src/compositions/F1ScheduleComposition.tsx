import {AbsoluteFill} from 'remotion';
import {F1Frame, F1Header, F1ScheduleList, RadioDoBoxMark} from '../components/F1Shared';
import {F1ProductionBed} from '../components/F1ProductionBed';
import type {F1ScheduleEntry, F1ThemeConfig} from '../lib/types';

type F1ScheduleCompositionProps = {
  title: string;
  subtitle: string;
  themeConfig: F1ThemeConfig;
  sessions: F1ScheduleEntry[];
  brandName: string;
  brandLogoPath?: string;
  backgroundImagePath?: string;
  soundtrackPath?: string;
  soundtrackVolume?: number;
  voiceoverPath?: string;
  introTitle?: string;
  introSubtitle?: string;
};

export const F1ScheduleComposition = ({
  title,
  subtitle,
  themeConfig,
  sessions,
  brandName,
  brandLogoPath,
  backgroundImagePath,
  soundtrackPath,
  soundtrackVolume,
  voiceoverPath,
  introTitle,
  introSubtitle,
}: F1ScheduleCompositionProps) => {
  return (
    <AbsoluteFill>
      <F1Frame theme={themeConfig} backgroundImagePath={backgroundImagePath}>
        <div
          style={{
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            padding: '28px 34px 26px',
          }}
        >
          <F1Header title={title} subtitle={subtitle} theme={themeConfig} />
          <div style={{flex: 1, display: 'flex', alignItems: 'center'}}>
            <F1ScheduleList sessions={sessions} theme={themeConfig} />
          </div>
          <div style={{marginTop: 'auto', paddingTop: 16}}>
            <RadioDoBoxMark theme={themeConfig} logoPath={brandLogoPath} />
          </div>
        </div>
      </F1Frame>
      <F1ProductionBed
        theme={themeConfig}
        brandName={brandName}
        brandLogoPath={brandLogoPath}
        soundtrackPath={soundtrackPath}
        soundtrackVolume={soundtrackVolume}
        voiceoverPath={voiceoverPath}
        introTitle={introTitle}
        introSubtitle={introSubtitle}
      />
    </AbsoluteFill>
  );
};
