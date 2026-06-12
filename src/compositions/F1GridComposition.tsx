import {AbsoluteFill, Img, staticFile, useCurrentFrame} from 'remotion';
import {F1Frame, F1Header, RadioDoBoxMark} from '../components/F1Shared';
import {F1ProductionBed} from '../components/F1ProductionBed';
import type {F1PodiumEntry, F1RankingEntry, F1ThemeConfig} from '../lib/types';

type F1GridCompositionProps = {
  template?: 'race-results' | 'qualifying-grid';
  title: string;
  subtitle: string;
  countryCode?: string;
  themeConfig: F1ThemeConfig;
  podium: F1PodiumEntry[];
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

const PAGE_SWITCH_FRAME = 180;
const RACE_RESULTS_PAGE_ONE_COUNT = 8;
const RACE_RESULTS_DENSE_THRESHOLD = 12;
const DISPLAY_FONT = '"Impact", "Haettenschweiler", "Arial Narrow Bold", sans-serif';
const RESULTS_BACKGROUND_PATH = '/f1/backgrounds/fundo-corrida.png';
const podiumNumberColors: Record<number, string> = {
  1: 'rgba(255, 215, 76, 0.22)',
  2: 'rgba(228, 235, 245, 0.2)',
  3: 'rgba(205, 127, 69, 0.22)',
};

export const F1GridComposition = ({
  template,
  title,
  subtitle,
  themeConfig,
  podium,
  entries,
  brandName,
  brandLogoPath,
  soundtrackPath,
  soundtrackVolume,
  voiceoverPath,
  introTitle,
  introSubtitle,
}: F1GridCompositionProps) => {
  const frame = useCurrentFrame();
  const isRaceResults = template === 'race-results' || (!template && subtitle.toLowerCase().includes('resultado'));
  const headerSubtitle = isRaceResults ? 'Resultado da Corrida' : 'Classificação de Largada';
  const raceRowsPageOne = entries.slice(0, RACE_RESULTS_PAGE_ONE_COUNT);
  const raceRowsPageTwo = entries.slice(RACE_RESULTS_PAGE_ONE_COUNT);
  const qualifyingRowsPageOne = entries.slice(0, 7);
  const qualifyingRowsPageTwo = entries.slice(7, 19);

  const showSecondPage = isRaceResults
    ? frame >= PAGE_SWITCH_FRAME
    : qualifyingRowsPageTwo.length > 0 && frame >= PAGE_SWITCH_FRAME;

  return (
    <AbsoluteFill>
      <F1Frame theme={themeConfig}>
        <div
          style={{
            position: 'relative',
            height: '100%',
            padding: '28px 34px 34px',
            overflow: 'hidden',
            fontFamily: DISPLAY_FONT,
          }}
        >
          {isRaceResults ? <ResultsBackdrop /> : null}
          <F1Header
            title={title}
            subtitle={headerSubtitle}
            theme={themeConfig}
          />

          {!showSecondPage ? (
            <ResultsPageOne
              podium={podium}
              rows={isRaceResults ? raceRowsPageOne : qualifyingRowsPageOne}
              brandLogoPath={brandLogoPath}
            />
          ) : (
            <ResultsPageTwo
              rows={isRaceResults ? raceRowsPageTwo : qualifyingRowsPageTwo}
              brandLogoPath={brandLogoPath}
              topOffset={isRaceResults ? 214 : 188}
            />
          )}

          {!showSecondPage && !isRaceResults ? (
            <div
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: 38,
                display: 'flex',
                justifyContent: 'center',
              }}
            >
              <RadioDoBoxMark theme={themeConfig} logoPath={brandLogoPath} />
            </div>
          ) : null}
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

const ResultsBackdrop = () => (
  <>
    <Img
      src={staticFile(RESULTS_BACKGROUND_PATH.replace(/^\//, ''))}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        opacity: 0.88,
      }}
    />
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background:
          'linear-gradient(180deg, rgba(11,6,9,0.82) 0%, rgba(20,7,10,0.78) 22%, rgba(23,8,9,0.68) 48%, rgba(8,7,12,0.86) 100%)',
      }}
    />
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background:
          'radial-gradient(circle at 50% 14%, rgba(255,188,95,0.24), transparent 22%), radial-gradient(circle at 12% 78%, rgba(255,86,62,0.20), transparent 28%), radial-gradient(circle at 90% 26%, rgba(255,34,126,0.20), transparent 24%), radial-gradient(circle at 82% 72%, rgba(114,74,255,0.14), transparent 24%)',
      }}
    />
    <div
      style={{
        position: 'absolute',
        inset: 0,
        backgroundImage:
          'radial-gradient(rgba(255,86,164,0.26) 1.2px, transparent 1.2px), radial-gradient(rgba(255,193,84,0.14) 1px, transparent 1px)',
        backgroundSize: '28px 28px, 18px 18px',
        backgroundPosition: '0 0, 9px 9px',
        opacity: 0.26,
      }}
    />
    <div
      style={{
        position: 'absolute',
        inset: 0,
        backgroundImage:
          'linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(180deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
        backgroundSize: '86px 86px',
        opacity: 0.08,
        transform: 'perspective(1000px) rotateX(76deg) translateY(440px) scale(1.4)',
        transformOrigin: 'bottom center',
      }}
    />
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: -120,
        width: 520,
        height: 6,
        background: 'linear-gradient(90deg, transparent, rgba(255,110,58,0.82), transparent)',
        boxShadow: '0 0 24px rgba(255,110,58,0.52)',
        transform: 'rotate(-28deg)',
      }}
    />
    <div
      style={{
        position: 'absolute',
        bottom: 320,
        right: -80,
        width: 460,
        height: 6,
        background: 'linear-gradient(90deg, transparent, rgba(255,58,149,0.72), transparent)',
        boxShadow: '0 0 24px rgba(255,58,149,0.48)',
        transform: 'rotate(-28deg)',
      }}
    />
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background:
          'linear-gradient(120deg, transparent 0 30%, rgba(255,255,255,0.08) 30% 31%, transparent 31% 100%), linear-gradient(180deg, transparent, rgba(0,0,0,0.32))',
      }}
    />
  </>
);

const ResultsPageOne = ({
  podium,
  rows,
  brandLogoPath,
}: {
  podium: F1PodiumEntry[];
  rows: F1RankingEntry[];
  brandLogoPath?: string;
}) => {
  const orderedPodium = [
    podium.find((entry) => entry.position === 2),
    podium.find((entry) => entry.position === 1),
    podium.find((entry) => entry.position === 3),
  ].filter(Boolean) as F1PodiumEntry[];

  return (
    <>
      <div
        style={{
          position: 'absolute',
          top: 210,
          left: 38,
          right: 38,
          display: 'grid',
          gridTemplateColumns: '1fr 1.12fr 1fr',
          gap: 16,
          alignItems: 'end',
        }}
      >
        {orderedPodium.map((entry) => (
          <PodiumCard key={`${entry.position}-${entry.name}`} entry={entry} />
        ))}
      </div>

      <div
        style={{
          position: 'absolute',
          left: 38,
          right: 38,
          top: 748,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        {rows.map((entry) => (
          <ResultRow key={`${entry.position}-${entry.name}`} entry={entry} size="medium" />
        ))}
      </div>
    </>
  );
};

const ResultsPageTwo = ({
  rows,
  brandLogoPath,
  topOffset = 214,
}: {
  rows: F1RankingEntry[];
  brandLogoPath?: string;
  topOffset?: number;
}) => {
  const rowSize = rows.length > RACE_RESULTS_DENSE_THRESHOLD ? 'compact' : 'medium';

  return (
    <>
      <div
        style={{
          position: 'absolute',
          left: 38,
          right: 38,
          top: topOffset,
          display: 'flex',
          flexDirection: 'column',
          gap: rowSize === 'compact' ? 5 : 6,
        }}
      >
        {rows.map((entry) => (
          <ResultRow key={`${entry.position}-${entry.name}`} entry={entry} size={rowSize} />
        ))}
      </div>
      {rows.length <= 10 ? <ResultsBrandMark logoPath={brandLogoPath} /> : null}
    </>
  );
};

const ResultsBrandMark = ({logoPath}: {logoPath?: string}) => {
  if (!logoPath) {
    return null;
  }

  return (
    <Img
      src={staticFile(logoPath.replace(/^\//, ''))}
      style={{
        position: 'absolute',
        left: '50%',
        bottom: 42,
        width: 156,
        transform: 'translateX(-50%)',
        objectFit: 'contain',
        opacity: 0.88,
        filter: 'drop-shadow(0 0 16px rgba(255, 211, 109, 0.18))',
      }}
    />
  );
};

const PodiumCard = ({entry}: {entry: F1PodiumEntry}) => {
  const isWinner = entry.position === 1;
  const podiumNumberColor = podiumNumberColors[entry.position] ?? 'rgba(255,255,255,0.08)';

  return (
    <div
      style={{
        position: 'relative',
        padding: isWinner ? '20px 14px 18px' : '16px 12px 14px',
        borderRadius: 34,
        border: `3px solid ${entry.accentColor ?? '#ffd978'}`,
        background: `linear-gradient(180deg, ${(entry.accentColor ?? '#ffd978')}44 0%, rgba(10,12,26,0.96) 18%, rgba(5,6,14,0.96) 62%, rgba(24,10,14,0.96) 100%)`,
        boxShadow: `0 0 38px ${(entry.accentColor ?? '#ffd978')}44`,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(180deg, ${(entry.accentColor ?? '#ffd978')}30, transparent 28%)`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: isWinner ? 12 : 8,
          top: isWinner ? 22 : 18,
          fontSize: isWinner ? 210 : 176,
          lineHeight: 0.8,
          fontWeight: 900,
          color: podiumNumberColor,
          pointerEvents: 'none',
          fontFamily: DISPLAY_FONT,
          textShadow:
            entry.position === 1
              ? '0 0 22px rgba(255, 215, 76, 0.22)'
              : entry.position === 2
                ? '0 0 20px rgba(228, 235, 245, 0.18)'
                : '0 0 20px rgba(205, 127, 69, 0.2)',
        }}
      >
        {entry.position}
      </div>

      {entry.badge.imagePath ? (
        <Img
          src={staticFile(entry.badge.imagePath.replace(/^\//, ''))}
          style={{
            width: '100%',
            height: isWinner ? 280 : 238,
            objectFit: 'cover',
            objectPosition: 'center top',
            borderRadius: 22,
          }}
        />
      ) : null}

      <div
        style={{
          marginTop: 12,
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          gap: 5,
        }}
      >
        <div
          style={{
            fontSize: isWinner ? 34 : 28,
            lineHeight: 1,
            fontWeight: 900,
            color: '#fff7e8',
            textTransform: 'uppercase',
            textShadow: `0 0 18px ${(entry.accentColor ?? '#ffd978')}44`,
            fontFamily: DISPLAY_FONT,
            letterSpacing: 0.4,
          }}
        >
          {compactName(entry.name)}
        </div>
        <div
          style={{
            fontSize: 18,
            lineHeight: 1.05,
            fontWeight: 800,
            color: '#ffcf76',
            textTransform: 'uppercase',
          }}
        >
          {entry.team}
        </div>
        {entry.stat ? (
          <div
            style={{
              fontSize: 16,
              lineHeight: 1,
              fontWeight: 900,
              color: '#ffffff',
            }}
          >
            {entry.stat}
          </div>
        ) : null}
      </div>
    </div>
  );
};

const ResultRow = ({
  entry,
  size,
}: {
  entry: F1RankingEntry;
  size: 'large' | 'medium' | 'compact';
}) => (
  <div
    style={{
      position: 'relative',
      display: 'grid',
      gridTemplateColumns:
        size === 'large'
          ? '82px 122px minmax(0, 1fr) 184px'
          : size === 'medium'
            ? '80px 120px minmax(0, 1fr) 186px'
            : '66px 82px minmax(0, 1fr) 150px',
      alignItems: 'center',
      minHeight: size === 'large' ? 116 : size === 'medium' ? 90 : 74,
      padding:
        size === 'large'
          ? '10px 18px 10px 14px'
          : size === 'medium'
            ? '6px 18px 6px 12px'
            : '5px 14px 5px 10px',
      borderRadius: size === 'compact' ? 22 : 28,
      background:
        'linear-gradient(180deg, rgba(10,12,28,0.98), rgba(7,7,16,0.98) 52%, rgba(28,10,16,0.98) 100%)',
      border: `2px solid ${entry.accentColor ?? '#ffd978'}`,
      boxShadow: `0 0 24px ${(entry.accentColor ?? '#ffd978')}30`,
      overflow: 'hidden',
    }}
  >
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: `linear-gradient(90deg, ${(entry.accentColor ?? '#ffd978')}34 0 26%, transparent 44%)`,
      }}
    />

    <div
      style={{
        position: 'relative',
        width: size === 'large' ? 64 : size === 'medium' ? 56 : 50,
        height: size === 'large' ? 64 : size === 'medium' ? 58 : 50,
        borderRadius: size === 'compact' ? 16 : 20,
        display: 'grid',
        placeItems: 'center',
        fontSize: size === 'large' ? 32 : size === 'medium' ? 34 : 27,
        lineHeight: 1,
        fontWeight: 900,
        color: '#fff7ea',
        background: 'linear-gradient(180deg, rgba(13,14,31,0.94), rgba(8,8,18,0.98))',
        border: `2px solid ${entry.accentColor ?? '#ffd978'}`,
        boxShadow: `0 0 18px ${(entry.accentColor ?? '#ffd978')}33`,
        fontFamily: DISPLAY_FONT,
      }}
      >
        {entry.position}
      </div>

    <div
      style={{
        position: 'relative',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      {entry.badge.imagePath ? (
        <Img
          src={staticFile(entry.badge.imagePath.replace(/^\//, ''))}
          style={{
            width: size === 'large' ? 108 : size === 'medium' ? 108 : 82,
            height: size === 'large' ? 118 : size === 'medium' ? 118 : 76,
            objectFit: 'cover',
            objectPosition: 'center top',
            borderRadius: 20,
            boxShadow: `0 0 22px ${(entry.accentColor ?? '#ffd978')}3f`,
          }}
        />
      ) : (
        <div
          style={{
            width: size === 'large' ? 72 : 62,
            height: size === 'large' ? 72 : 62,
            borderRadius: '50%',
            background: entry.accentColor ?? '#ffd978',
          }}
        />
      )}
    </div>

    <div
      style={{
        position: 'relative',
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: 5,
      }}
    >
        <div
          style={{
            fontSize: size === 'large' ? 31 : size === 'medium' ? 35 : 26,
          lineHeight: 1,
          fontWeight: 900,
          color: '#fff7e8',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          textTransform: 'uppercase',
          textShadow: `0 0 12px ${(entry.accentColor ?? '#ffd978')}28`,
          fontFamily: DISPLAY_FONT,
          letterSpacing: 0.4,
        }}
      >
        {entry.name}
      </div>
        <div
          style={{
          fontSize: size === 'large' ? 15 : size === 'medium' ? 16 : 12,
          lineHeight: 1,
          fontWeight: 800,
          color: '#ffd36d',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          textTransform: 'uppercase',
        }}
      >
        {entry.team}
      </div>
    </div>

    <div
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: 4,
      }}
    >
      {entry.value ? (
        <div
          style={{
            fontSize: size === 'large' ? 29 : size === 'medium' ? 31 : 24,
            lineHeight: 1,
            fontWeight: 900,
            color: '#fff3d0',
            textAlign: 'right',
            textShadow: '0 0 12px rgba(255,209,107,0.18)',
            fontFamily: DISPLAY_FONT,
          }}
        >
          {entry.value}
        </div>
      ) : null}
      {entry.secondaryValue ? (
        <div
          style={{
            fontSize: size === 'large' ? 14 : size === 'medium' ? 16 : 13,
            lineHeight: 1,
            fontWeight: 800,
            color: '#ffcf76',
            textTransform: 'uppercase',
            textAlign: 'right',
          }}
        >
          {entry.secondaryValue}
        </div>
      ) : null}
    </div>
  </div>
);

const compactName = (name: string) => {
  const parts = name.split(/\s+/);
  if (parts.length <= 2) {
    return name;
  }

  return `${parts[0]} ${parts[parts.length - 1]}`;
};
