import {AbsoluteFill} from 'remotion';
import {F1Frame, RadioDoBoxMark} from '../components/F1Shared';
import {F1ProductionBed} from '../components/F1ProductionBed';
import type {F1RankingEntry, F1ThemeConfig} from '../lib/types';
import {normalizeF1DriverDisplayName} from '../lib/f1-display-names';

type F1RacePaceCompositionProps = {
  title: string;
  subtitle: string;
  raceName?: string;
  themeConfig: F1ThemeConfig;
  paceSummary: string;
  entries: F1RankingEntry[];
  brandName: string;
  brandLogoPath?: string;
  backgroundImagePath?: string;
  soundtrackPath?: string;
  soundtrackVolume?: number;
  voiceoverPath?: string;
  introTitle?: string;
  introSubtitle?: string;
};

export const F1RacePaceComposition = ({
  title,
  subtitle,
  raceName,
  themeConfig,
  paceSummary,
  entries,
  brandName,
  brandLogoPath,
  backgroundImagePath,
  soundtrackPath,
  soundtrackVolume,
  voiceoverPath,
  introTitle,
  introSubtitle,
}: F1RacePaceCompositionProps) => {
  const visibleEntries = entries.slice(0, 10);

  return (
    <AbsoluteFill>
      <F1Frame theme={themeConfig} backgroundImagePath={backgroundImagePath}>
        <div
          style={{
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            padding: '72px 42px 116px',
            gap: 24,
          }}
        >
          <div style={{display: 'flex', flexDirection: 'column', gap: 10}}>
            <div
              style={{
                fontSize: 20,
                fontWeight: 800,
                color: themeConfig.secondaryAccent,
                letterSpacing: 1.2,
                textTransform: 'uppercase',
              }}
            >
              {raceName || subtitle}
            </div>
            <div
              style={{
                fontSize: 72,
                fontWeight: 900,
                lineHeight: 0.9,
                color: themeConfig.text,
                textTransform: 'uppercase',
                letterSpacing: -1.6,
              }}
            >
              {title}
            </div>
            <div
              style={{
                fontSize: 30,
                fontWeight: 800,
                color: themeConfig.mutedText,
                textTransform: 'uppercase',
              }}
            >
              {paceSummary}
            </div>
          </div>

          <div style={{display: 'flex', flexDirection: 'column', gap: 12}}>
            {visibleEntries.map((entry) => {
              const accent = entry.accentColor ?? themeConfig.accent;
              const isLeader = entry.position === 1;
              return (
                <div
                  key={`${entry.position}-${entry.name}`}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '84px minmax(0, 1fr) 172px 190px',
                    alignItems: 'center',
                    gap: 14,
                    borderRadius: 20,
                    padding: isLeader ? '16px 18px' : '12px 16px',
                    border: `2px solid ${isLeader ? themeConfig.secondaryAccent : `${accent}a8`}`,
                    boxShadow: isLeader
                      ? `0 0 24px ${themeConfig.secondaryAccent}44`
                      : `0 0 16px ${accent}22`,
                    background:
                      themeConfig.variant === 'light'
                        ? 'linear-gradient(180deg, rgba(255,255,255,0.94), rgba(235,242,252,0.9))'
                        : 'linear-gradient(180deg, rgba(8,14,34,0.95), rgba(6,10,25,0.95))',
                  }}
                >
                  <div
                    style={{
                      width: 72,
                      height: 72,
                      borderRadius: 18,
                      display: 'grid',
                      placeItems: 'center',
                      color: isLeader ? '#0c1224' : themeConfig.text,
                      fontSize: isLeader ? 42 : 34,
                      fontWeight: 900,
                      background: isLeader
                        ? `linear-gradient(180deg, ${themeConfig.secondaryAccent}, #f0b93d)`
                        : 'linear-gradient(180deg, rgba(28,45,98,0.92), rgba(18,28,66,0.92))',
                    }}
                  >
                    {entry.position}
                  </div>

                  <div style={{display: 'flex', flexDirection: 'column', minWidth: 0}}>
                    <div
                      style={{
                        fontSize: isLeader ? 40 : 34,
                        fontWeight: 900,
                        color: themeConfig.text,
                        whiteSpace: 'nowrap',
                        textOverflow: 'ellipsis',
                        overflow: 'hidden',
                        textTransform: 'uppercase',
                        lineHeight: 1,
                      }}
                    >
                      {normalizeF1DriverDisplayName(entry.name)}
                    </div>
                    <div
                      style={{
                        marginTop: 3,
                        fontSize: 22,
                        fontWeight: 800,
                        color: accent,
                        textTransform: 'uppercase',
                        whiteSpace: 'nowrap',
                        textOverflow: 'ellipsis',
                        overflow: 'hidden',
                      }}
                    >
                      {entry.team ?? ''}
                    </div>
                  </div>

                  <div
                    style={{
                      textAlign: 'right',
                      fontSize: isLeader ? 36 : 32,
                      fontWeight: 900,
                      color: themeConfig.text,
                      letterSpacing: 0.4,
                    }}
                  >
                    {entry.value ?? '--'}
                  </div>

                  <div
                    style={{
                      textAlign: 'right',
                      fontSize: 24,
                      fontWeight: 800,
                      color: entry.position === 1 ? themeConfig.secondaryAccent : themeConfig.mutedText,
                      letterSpacing: 0.2,
                    }}
                  >
                    {entry.secondaryValue ?? '--'}
                  </div>
                </div>
              );
            })}
          </div>

          <div
            style={{
              marginTop: 'auto',
              display: 'flex',
              justifyContent: 'flex-end',
              transform: 'scale(0.42)',
              transformOrigin: 'right bottom',
            }}
          >
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
