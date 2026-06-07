import {AbsoluteFill, Img, staticFile} from 'remotion';
import {F1Frame, RadioDoBoxMark} from '../components/F1Shared';
import {F1ProductionBed} from '../components/F1ProductionBed';
import type {
  F1TeammateBattleJob,
  F1TeammateBattleScoreBlock,
  F1ThemeConfig,
} from '../lib/types';
import {normalizeF1DriverDisplayName} from '../lib/f1-display-names';

type F1TeammateBattleCompositionProps = {
  title: string;
  subtitle: string;
  raceName?: string;
  teamName: string;
  contextSubtitle?: string;
  themeConfig: F1ThemeConfig;
  driver1: F1TeammateBattleJob['driver1'];
  driver2: F1TeammateBattleJob['driver2'];
  qualifyingScore: F1TeammateBattleJob['qualifyingScore'];
  raceFinishScore: F1TeammateBattleJob['raceFinishScore'];
  championshipPoints: F1TeammateBattleJob['championshipPoints'];
  podiums?: F1TeammateBattleJob['podiums'];
  wins?: F1TeammateBattleJob['wins'];
  bestRaceFinish?: F1TeammateBattleJob['bestRaceFinish'];
  highestGridPosition?: F1TeammateBattleJob['highestGridPosition'];
  dnfCount?: F1TeammateBattleJob['dnfCount'];
  dnsCount?: F1TeammateBattleJob['dnsCount'];
  dsqCount?: F1TeammateBattleJob['dsqCount'];
  championshipLeader: F1TeammateBattleJob['championshipLeader'];
  brandName: string;
  brandLogoPath?: string;
  backgroundImagePath?: string;
  soundtrackPath?: string;
  soundtrackVolume?: number;
  voiceoverPath?: string;
  introTitle?: string;
  introSubtitle?: string;
};

const DISPLAY_FONT = '"Impact", "Haettenschweiler", "Arial Narrow Bold", sans-serif';

const compareScore = (block: F1TeammateBattleScoreBlock): 'left' | 'right' | 'tie' => {
  const higherIsBetter = block.higherIsBetter ?? true;

  if (block.driver1 === block.driver2) {
    return 'tie';
  }

  if (higherIsBetter) {
    return block.driver1 > block.driver2 ? 'left' : 'right';
  }

  return block.driver1 < block.driver2 ? 'left' : 'right';
};

const displayValue = (
  block: F1TeammateBattleScoreBlock,
  side: 'driver1' | 'driver2'
) =>
  side === 'driver1'
    ? block.driver1Display ?? String(block.driver1)
    : block.driver2Display ?? String(block.driver2);

const DriverHero = ({
  side,
  driver,
  accent,
}: {
  side: 'left' | 'right';
  driver: F1TeammateBattleJob['driver1'];
  accent: string;
}) => {
  const displayName = normalizeF1DriverDisplayName(driver.name);

  return (
  <div
    style={{
      position: 'relative',
      height: 430,
      overflow: 'hidden',
      borderRadius: side === 'left' ? '0 34px 34px 0' : '34px 0 0 34px',
      border: `2px solid ${accent}`,
      background: `linear-gradient(180deg, ${accent}34, rgba(3,5,13,0.96))`,
      boxShadow: `0 0 28px ${accent}40`,
    }}
  >
    {driver.badge.imagePath ? (
      <Img
        src={staticFile(driver.badge.imagePath.replace(/^\//, ''))}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: 'center top',
          filter: 'contrast(1.08) saturate(1.05)',
        }}
      />
    ) : null}
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background:
          side === 'left'
            ? 'linear-gradient(90deg, rgba(0,0,0,0.08), rgba(0,0,0,0.72))'
            : 'linear-gradient(270deg, rgba(0,0,0,0.08), rgba(0,0,0,0.72))',
      }}
    />
    <div
      style={{
        position: 'absolute',
        bottom: 24,
        left: side === 'left' ? 26 : undefined,
        right: side === 'right' ? 26 : undefined,
        textAlign: side,
        textTransform: 'uppercase',
        fontFamily: DISPLAY_FONT,
      }}
    >
      <div
        style={{
          fontSize: 34,
          lineHeight: 0.9,
          color: '#ffffff',
          textShadow: '0 4px 16px rgba(0,0,0,0.85)',
        }}
      >
        {displayName.split(' ').slice(0, -1).join(' ') || displayName}
      </div>
      <div
        style={{
          fontSize: 52,
          lineHeight: 0.86,
          color: accent,
          textShadow: `0 0 16px ${accent}70`,
        }}
      >
        {displayName.split(' ').slice(-1)[0]}
      </div>
    </div>
  </div>
  );
};

const StatBattleRow = ({
  block,
  accent,
}: {
  block: F1TeammateBattleScoreBlock;
  accent: string;
}) => {
  const winner = compareScore(block);
  const higherIsBetter = block.higherIsBetter ?? true;
  const maxValue = Math.max(block.driver1, block.driver2, 1);
  const leftVisualValue = higherIsBetter ? block.driver1 : maxValue + 1 - block.driver1;
  const rightVisualValue = higherIsBetter ? block.driver2 : maxValue + 1 - block.driver2;
  const total = Math.max(leftVisualValue + rightVisualValue, 1);
  const leftPercent =
    block.driver1 === block.driver2 ? 50 : (leftVisualValue / total) * 100;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '160px 1fr 160px',
        alignItems: 'center',
        gap: 18,
        borderTop: `2px solid ${accent}88`,
        padding: '17px 0 14px',
      }}
    >
      <div
        style={{
          fontSize: 58,
          lineHeight: 0.9,
          color: winner === 'left' ? accent : '#f7f9ff',
          textAlign: 'left',
          textShadow: winner === 'left' ? `0 0 16px ${accent}78` : 'none',
        }}
      >
        {displayValue(block, 'driver1')}
      </div>
      <div style={{display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center'}}>
        <div
          style={{
            fontSize: 28,
            lineHeight: 1,
            color: '#ffffff',
            textTransform: 'uppercase',
            letterSpacing: 1,
          }}
        >
          {block.label}
        </div>
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: 34,
            border: '2px solid rgba(255,255,255,0.85)',
            background: '#ffffff',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${Math.max(4, Math.min(96, leftPercent))}%`,
              height: '100%',
              background: accent,
            }}
          />
        </div>
      </div>
      <div
        style={{
          fontSize: 58,
          lineHeight: 0.9,
          color: winner === 'right' ? accent : '#f7f9ff',
          textAlign: 'right',
          textShadow: winner === 'right' ? `0 0 16px ${accent}78` : 'none',
        }}
      >
        {displayValue(block, 'driver2')}
      </div>
    </div>
  );
};

export const F1TeammateBattleComposition = ({
  title,
  subtitle,
  raceName,
  teamName,
  contextSubtitle,
  themeConfig,
  driver1,
  driver2,
  qualifyingScore,
  raceFinishScore,
  championshipPoints,
  podiums,
  wins,
  bestRaceFinish,
  highestGridPosition,
  dnfCount,
  dnsCount,
  dsqCount,
  championshipLeader,
  brandName,
  brandLogoPath,
  backgroundImagePath,
  soundtrackPath,
  soundtrackVolume,
  voiceoverPath,
  introTitle,
  introSubtitle,
}: F1TeammateBattleCompositionProps) => {
  const accent = driver1.accentColor ?? driver2.accentColor ?? themeConfig.accent;
  const secondaryAccent = themeConfig.secondaryAccent || '#ffe06b';
  const scoreRows = [
    raceFinishScore,
    qualifyingScore,
    championshipPoints,
    wins,
    podiums,
    bestRaceFinish,
    highestGridPosition,
    dnfCount,
    dnsCount,
    dsqCount,
  ].filter((row) => row && row.hasData !== false) as F1TeammateBattleScoreBlock[];
  const displayContextSubtitle =
    contextSubtitle || (raceName ? `Após o ${raceName.replace(/^GP\s+/i, 'GP de ')}` : '');

  return (
    <AbsoluteFill>
      <F1Frame theme={themeConfig} backgroundImagePath={backgroundImagePath}>
        <div
          style={{
            position: 'relative',
            height: '100%',
            padding: '54px 42px 106px',
            fontFamily: DISPLAY_FONT,
            color: '#ffffff',
            background:
              'radial-gradient(circle at 50% 8%, rgba(255,255,255,0.08), transparent 24%), linear-gradient(180deg, rgba(0,0,0,0.1), rgba(0,0,0,0.4))',
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: '0 42px auto',
              height: 8,
              background: accent,
              boxShadow: `0 0 24px ${accent}`,
            }}
          />

          <div
            style={{
              textAlign: 'center',
              textTransform: 'uppercase',
              marginTop: 18,
              marginBottom: 22,
            }}
          >
            <div style={{fontSize: 58, lineHeight: 0.9, color: '#ffffff'}}>
              {subtitle || 'Head-to-Head de Equipe'}
            </div>
            <div style={{fontSize: 30, color: secondaryAccent, marginTop: 10}}>
              {teamName}
            </div>
            {displayContextSubtitle ? (
              <div style={{fontSize: 24, color: '#dce6ff', marginTop: 8, opacity: 0.82}}>
                {displayContextSubtitle}
              </div>
            ) : null}
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 124px 1fr',
              gap: 16,
              alignItems: 'start',
            }}
          >
            <DriverHero side="left" driver={driver1} accent={accent} />
            <div
              style={{
                height: 124,
                borderRadius: 26,
                background: accent,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `0 0 28px ${accent}70`,
              }}
            >
              <div
                style={{
                  transform: 'scale(0.34)',
                  transformOrigin: 'center',
                }}
              >
                <RadioDoBoxMark theme={themeConfig} logoPath={brandLogoPath} />
              </div>
            </div>
            <DriverHero side="right" driver={driver2} accent={accent} />
          </div>

          <div
            style={{
              marginTop: 30,
              borderRadius: 32,
              padding: '18px 34px 22px',
              background:
                'linear-gradient(135deg, rgba(6,7,13,0.96), rgba(18,19,24,0.94)), repeating-linear-gradient(135deg, rgba(255,255,255,0.04) 0 2px, transparent 2px 8px)',
              border: `3px solid ${accent}`,
              boxShadow: `0 0 34px ${accent}3f`,
            }}
          >
            {scoreRows.map((row) => (
              <StatBattleRow key={row.label} block={row} accent={accent} />
            ))}
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
