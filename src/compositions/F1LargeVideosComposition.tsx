import {AbsoluteFill, Img, staticFile} from 'remotion';
import {BadgeDisk} from '../components/F1Shared';
import type {
  F1ConstructorStandingsJob,
  F1DriverStandingsJob,
  F1PodiumEntry,
  F1RaceResultsJob,
  F1RankingEntry,
  F1ThemeConfig,
  TeamBadge,
} from '../lib/types';

type F1LargeVideosJob = F1RaceResultsJob | F1DriverStandingsJob | F1ConstructorStandingsJob;

type F1LargeVideosCompositionProps = {
  job: F1LargeVideosJob;
};

const DISPLAY_FONT = '"Arial Black", "Impact", "Avenir Next Condensed", sans-serif';
const DATA_FONT = '"Avenir Next", "Segoe UI", sans-serif';
const LOGO_PATH = '/branding/radio-do-box/red.png';
const RESULTS_BACKGROUND_PATH = '/f1/backgrounds/fundo-corrida.png';
const STANDINGS_BACKGROUND_PATH = '/f1/backgrounds/mundial-de-pilotos.png';
const GOLD = '#ffe66d';
const RADIO_RED = '#e10600';

const constructorLogoOverrides: Record<string, string> = {
  mercedes: '/f1/teams/custom/mercedes.png',
  'mercedes-amg-petronas': '/f1/teams/custom/mercedes.png',
  ferrari: '/f1/teams/custom/ferrari.png',
  'scuderia-ferrari': '/f1/teams/custom/ferrari.png',
  mclaren: '/f1/teams/custom/mclaren.png',
  'mclaren-racing': '/f1/teams/custom/mclaren.png',
  haas: '/f1/teams/custom/haas.png',
  'haas-f1-team': '/f1/teams/custom/haas.png',
  alpine: '/f1/teams/custom/alpine.png',
  'alpine-f1-team': '/f1/teams/custom/alpine.png',
  'red-bull': '/f1/teams/custom/red-bull.png',
  'red-bull-racing': '/f1/teams/custom/red-bull.png',
  'racing-bulls': '/f1/teams/custom/racing-bulls.png',
  audi: '/f1/teams/custom/audi.png',
  'audi-revolut-f1-team': '/f1/teams/custom/audi.png',
  williams: '/f1/teams/custom/williams.png',
  'williams-f1-team': '/f1/teams/custom/williams.png',
  cadillac: '/f1/teams/custom/cadillac.png',
  'cadillac-formula-1-team': '/f1/teams/custom/cadillac.png',
  'aston-martin': '/f1/teams/custom/aston-martin.png',
  'aston-martin-f1-team': '/f1/teams/custom/aston-martin.png',
};

const normalizeKey = (value = '') =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const valueOrDash = (value?: string) => {
  const normalized = String(value ?? '').trim();
  return normalized && normalized.toLowerCase() !== 'null' ? normalized : '-';
};

const looksLikeRaceDuration = (value?: string) =>
  /^\d+:\d{2}:\d{2}(?:[.,]\d+)?$/.test(String(value ?? '').trim());

const formatRaceResultDiff = (row: F1RankingEntry) => {
  const value = valueOrDash(row.value);
  if (row.position !== 1 && looksLikeRaceDuration(value)) {
    return 'mesma volta';
  }

  const lapsMatch = value.match(/^\+?\s*(\d+)\s*laps?$/i);
  if (lapsMatch) {
    const laps = Number(lapsMatch[1]);
    return `+${laps} ${laps === 1 ? 'volta' : 'voltas'}`;
  }

  return value;
};

const normalizeRaceResultRows = (rows: F1RankingEntry[]) => {
  const seen = new Set<string>();

  return rows.filter((row) => {
    const key = row.position ? `position-${row.position}` : normalizeKey(row.name);
    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
};

const resolveConstructorLogo = (entry: F1RankingEntry | F1PodiumEntry) => {
  const key = normalizeKey(entry.team || entry.name || entry.badge.sublabel || entry.badge.label);
  return constructorLogoOverrides[key] ?? entry.badge.imagePath ?? entry.badge.logoPath;
};

export const F1LargeVideosComposition = ({job}: F1LargeVideosCompositionProps) => {
  const theme = job.themeConfig;
  const isRaceResults = job.template === 'race-results';
  const isConstructorStandings = job.template === 'constructor-standings';
  const backgroundPath = isRaceResults ? RESULTS_BACKGROUND_PATH : STANDINGS_BACKGROUND_PATH;

  return (
    <AbsoluteFill>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          overflow: 'hidden',
          color: '#f8fbff',
          background: '#080a10',
          fontFamily: DATA_FONT,
        }}
      >
        <Backdrop backgroundPath={backgroundPath} theme={theme} />
        <TopBar
          title={job.title}
          subtitle={job.subtitle}
        />
        {isRaceResults ? (
          <RaceResultsBoard job={job} theme={theme} />
        ) : (
          <StandingsBoard job={job} theme={theme} isConstructorStandings={isConstructorStandings} />
        )}
        <Footer job={job} theme={theme} />
      </div>
    </AbsoluteFill>
  );
};

const Backdrop = ({
  backgroundPath,
  theme,
}: {
  backgroundPath: string;
  theme: F1ThemeConfig;
}) => (
  <>
    <Img
      src={staticFile(backgroundPath.replace(/^\//, ''))}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        opacity: 0.34,
      }}
    />
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background:
          'linear-gradient(90deg, rgba(7,7,9,0.98) 0%, rgba(17,12,14,0.94) 48%, rgba(5,7,11,0.98) 100%)',
      }}
    />
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background:
          'linear-gradient(135deg, transparent 0 40%, rgba(255,255,255,0.08) 40% 40.6%, transparent 40.6% 100%)',
      }}
    />
    <div
      style={{
        position: 'absolute',
        inset: 0,
        opacity: 0.13,
        backgroundImage:
          'linear-gradient(90deg, rgba(255,255,255,0.18) 1px, transparent 1px), linear-gradient(180deg, rgba(255,255,255,0.14) 1px, transparent 1px)',
        backgroundSize: '96px 96px',
      }}
    />
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background:
          'radial-gradient(circle at 18% 28%, rgba(225,6,0,0.22), transparent 26%), radial-gradient(circle at 85% 76%, rgba(0,210,190,0.10), transparent 26%), linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.36) 100%)',
      }}
    />
    <div
      style={{
        position: 'absolute',
        left: -120,
        top: 172,
        width: 920,
        height: 8,
        transform: 'rotate(-13deg)',
        background: `linear-gradient(90deg, transparent, ${RADIO_RED}, transparent)`,
        boxShadow: `0 0 28px ${RADIO_RED}66`,
      }}
    />
    <div
      style={{
        position: 'absolute',
        right: -100,
        bottom: 184,
        width: 760,
        height: 8,
        transform: 'rotate(-13deg)',
        background: `linear-gradient(90deg, transparent, ${theme.secondaryAccent}, transparent)`,
        boxShadow: `0 0 26px ${theme.secondaryAccent}66`,
      }}
    />
  </>
);

const TopBar = ({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) => {
  return (
    <div
      style={{
        position: 'absolute',
        left: 68,
        right: 68,
        top: 48,
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) auto',
        gap: 28,
        alignItems: 'center',
      }}
    >
      <div style={{minWidth: 0}}>
        <div
          style={{
            fontFamily: DISPLAY_FONT,
            fontSize: 76,
            lineHeight: 0.94,
            fontWeight: 900,
            color: '#ffffff',
            textTransform: 'uppercase',
            textShadow: '0 5px 26px rgba(0,0,0,0.52)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {title}
        </div>
        <div
          style={{
            marginTop: 10,
            color: '#d8e2f2',
            fontSize: 30,
            lineHeight: 1,
            fontWeight: 800,
            textTransform: 'uppercase',
          }}
        >
          {subtitle}
        </div>
      </div>
      <Img
        src={staticFile(LOGO_PATH.replace(/^\//, ''))}
        style={{
          width: 248,
          maxHeight: 142,
          objectFit: 'contain',
          filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.45))',
        }}
      />
    </div>
  );
};

const RaceResultsBoard = ({job, theme}: {job: F1RaceResultsJob; theme: F1ThemeConfig}) => {
  const podium = job.podium.slice(0, 3);
  const podiumRows = podium.map((entry) => ({
    ...entry,
    value: entry.value ?? entry.stat,
    secondaryValue: entry.secondaryValue,
  }));
  const tableRows = normalizeRaceResultRows([...podiumRows, ...job.entries])
    .slice(0, 24)
    .map((entry) => ({
      ...entry,
      value: formatRaceResultDiff(entry),
    }));
  const winner = podium.find((entry) => entry.position === 1) ?? podium[0];
  const chasePack = podium.filter((entry) => entry.position !== winner?.position).slice(0, 2);

  return (
    <div
      style={{
        position: 'absolute',
        left: 68,
        right: 68,
        top: 250,
        bottom: 96,
        display: 'grid',
        gridTemplateColumns: '720px minmax(0, 1fr)',
        gap: 34,
      }}
    >
      <div style={{display: 'grid', gridTemplateRows: 'minmax(0, 1fr) 188px 92px', gap: 14}}>
        {winner ? <WinnerFeature entry={winner} theme={theme} /> : null}
        <div style={{display: 'grid', gridTemplateRows: '1fr 1fr', gap: 14}}>
          {chasePack.map((entry) => (
            <PodiumMini key={`${entry.position}-${entry.name}`} entry={entry} theme={theme} />
          ))}
        </div>
        {job.fastestLap ? <FastestLapCard fastestLap={job.fastestLap} theme={theme} /> : null}
      </div>
      <BroadcastTable
        rows={tableRows}
        theme={theme}
        title="Resultado Completo"
        valueLabel="Dif."
        columns={2}
        compact
      />
    </div>
  );
};

const FastestLapCard = ({
  fastestLap,
  theme,
}: {
  fastestLap: NonNullable<F1RaceResultsJob['fastestLap']>;
  theme: F1ThemeConfig;
}) => {
  const portraitPath = fastestLap.badge?.imagePath ?? fastestLap.badge?.logoPath;

  return (
    <div
      style={{
        minHeight: 0,
        height: '100%',
        display: 'grid',
        gridTemplateColumns: '58px minmax(0, 1fr) auto',
        alignItems: 'center',
        gap: 12,
        padding: '12px 16px',
        border: `2px solid ${theme.secondaryAccent}88`,
        background:
          'linear-gradient(135deg, rgba(10,14,24,0.96), rgba(28,20,14,0.92))',
        boxShadow: `0 18px 42px ${theme.secondaryAccent}22`,
      }}
    >
      <div
        style={{
          display: 'grid',
          placeItems: 'center',
          width: 48,
          height: 48,
          borderRadius: 999,
          background: `${fastestLap.accentColor ?? theme.accent}22`,
          border: `2px solid ${(fastestLap.accentColor ?? theme.accent)}88`,
          overflow: 'hidden',
        }}
      >
        {portraitPath ? (
          <Img
            src={staticFile(portraitPath.replace(/^\//, ''))}
            style={{
              width: fastestLap.badge?.imagePath ? '100%' : '74%',
              height: fastestLap.badge?.imagePath ? '100%' : '74%',
              objectFit: fastestLap.badge?.imagePath ? 'cover' : 'contain',
              objectPosition: fastestLap.badge?.imagePath ? 'center top' : 'center center',
            }}
          />
        ) : (
          <span style={{fontFamily: DISPLAY_FONT, color: '#fff'}}>VR</span>
        )}
      </div>
      <div style={{minWidth: 0}}>
        <div
          style={{
            color: theme.secondaryAccent,
            fontSize: 10,
            lineHeight: 1,
            fontWeight: 900,
            letterSpacing: 1.8,
            textTransform: 'uppercase',
          }}
        >
          Volta mais rápida
        </div>
        <div
          style={{
            marginTop: 6,
            color: '#fff',
            fontFamily: DISPLAY_FONT,
            fontSize: 20,
            lineHeight: 1,
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {fastestLap.name}
        </div>
        {fastestLap.team ? (
          <div
            style={{
              marginTop: 4,
              color: '#aebbd0',
              fontSize: 10,
              lineHeight: 1,
              fontWeight: 900,
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {fastestLap.team}
          </div>
        ) : null}
      </div>
      <div
        style={{
          color: theme.secondaryAccent,
          fontFamily: DISPLAY_FONT,
          fontSize: 26,
          lineHeight: 1,
          whiteSpace: 'nowrap',
        }}
      >
        {fastestLap.value}
      </div>
    </div>
  );
};

const StandingsBoard = ({
  job,
  theme,
  isConstructorStandings,
}: {
  job: F1DriverStandingsJob | F1ConstructorStandingsJob;
  theme: F1ThemeConfig;
  isConstructorStandings: boolean;
}) => {
  const leader = job.leader;
  const rows = isConstructorStandings ? job.entries.slice(1, 10) : job.entries.slice(1, 22);

  return (
    <div
      style={{
        position: 'absolute',
        left: 68,
        right: 68,
        top: 248,
        bottom: 96,
        display: 'grid',
        gridTemplateColumns: '548px minmax(0, 1fr)',
        gap: 28,
      }}
    >
      <LeaderPanel
        leader={leader}
        fallback={job.entries[0]}
        theme={theme}
        isConstructor={isConstructorStandings}
      />
      <BroadcastTable
        rows={rows}
        theme={theme}
        title={isConstructorStandings ? 'Tabela de Construtores' : 'Tabela de Pilotos'}
        valueLabel="Pontos"
        isConstructor={isConstructorStandings}
        columns={isConstructorStandings ? 1 : 2}
        compact={!isConstructorStandings}
      />
    </div>
  );
};

const WinnerFeature = ({entry, theme}: {entry: F1PodiumEntry; theme: F1ThemeConfig}) => (
  <div
    style={{
      position: 'relative',
      overflow: 'hidden',
      minHeight: 0,
      padding: 28,
      border: `2px solid ${(entry.accentColor ?? theme.accent)}80`,
      background:
        'linear-gradient(135deg, rgba(8,12,24,0.96), rgba(24,17,19,0.86) 58%, rgba(8,10,18,0.92))',
      boxShadow: `0 22px 60px ${(entry.accentColor ?? theme.accent)}28`,
    }}
  >
    <div
      style={{
        position: 'absolute',
        right: -80,
        top: -120,
        width: 330,
        height: 330,
        borderRadius: 999,
        background: `${entry.accentColor ?? theme.accent}22`,
      }}
    />
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: 12,
        background: entry.accentColor ?? theme.accent,
      }}
    />
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '238px minmax(0, 1fr)',
        gap: 26,
        alignItems: 'center',
        height: '100%',
      }}
    >
      <div
        style={{
          position: 'relative',
          height: 356,
          display: 'grid',
          placeItems: 'center',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02))',
          border: '1px solid rgba(255,255,255,0.12)',
        }}
      >
        <PositionPill position={1} accent={entry.accentColor ?? theme.accent} large />
        <Portrait badge={entry.badge} theme={theme} accent={entry.accentColor} large />
      </div>
      <div style={{minWidth: 0}}>
        <div
          style={{
            color: theme.secondaryAccent,
            fontSize: 22,
            lineHeight: 1,
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: 1.2,
          }}
        >
          Vencedor da corrida
        </div>
        <div
          style={{
            marginTop: 16,
            fontFamily: DISPLAY_FONT,
            fontSize: 56,
            lineHeight: 0.94,
            fontWeight: 900,
            color: '#ffffff',
            textTransform: 'uppercase',
          }}
        >
          {entry.name}
        </div>
        <div
          style={{
            marginTop: 12,
            fontSize: 26,
            lineHeight: 1,
            color: '#c7d2e3',
            fontWeight: 900,
            textTransform: 'uppercase',
          }}
        >
          {entry.team}
        </div>
        {entry.stat ? (
          <div
            style={{
              marginTop: 28,
              display: 'inline-flex',
              alignItems: 'baseline',
              gap: 10,
              padding: '11px 16px',
              background: `${entry.accentColor ?? theme.accent}24`,
              color: GOLD,
              fontFamily: DISPLAY_FONT,
              fontSize: 34,
              lineHeight: 1,
              textTransform: 'uppercase',
            }}
          >
            {entry.stat}
          </div>
        ) : null}
      </div>
    </div>
  </div>
);

const PodiumMini = ({entry, theme}: {entry: F1PodiumEntry; theme: F1ThemeConfig}) => (
  <div
    style={{
      position: 'relative',
      display: 'grid',
      gridTemplateColumns: '76px minmax(0, 1fr) 112px',
      gap: 16,
      alignItems: 'center',
      padding: '13px 16px',
      overflow: 'hidden',
      border: `2px solid ${(entry.accentColor ?? theme.accent)}68`,
      background: 'linear-gradient(135deg, rgba(8,12,24,0.94), rgba(20,18,28,0.80))',
    }}
  >
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        height: 5,
        background: entry.accentColor ?? theme.accent,
      }}
    />
    <PositionPill position={entry.position} accent={entry.accentColor ?? theme.accent} />
    <div
      style={{
        position: 'absolute',
        right: 12,
        top: 9,
        bottom: 7,
        width: 96,
        overflow: 'hidden',
        borderLeft: `2px solid ${entry.accentColor ?? theme.accent}`,
        background: 'linear-gradient(180deg, rgba(255,255,255,0.10), rgba(255,255,255,0.02))',
      }}
    >
      {entry.badge.imagePath ? (
        <Img
          src={staticFile(entry.badge.imagePath.replace(/^\//, ''))}
          style={{
            width: '86%',
            height: '100%',
            margin: '0 auto',
            display: 'block',
            objectFit: 'contain',
            objectPosition: 'center center',
          }}
        />
      ) : (
        <div style={{width: '100%', height: '100%', display: 'grid', placeItems: 'center'}}>
          <BadgeDisk badge={entry.badge} size={58} theme={theme} />
        </div>
      )}
    </div>
    <div style={{minWidth: 0}}>
      <div
        style={{
          fontFamily: DISPLAY_FONT,
          fontSize: 30,
          lineHeight: 1,
          fontWeight: 900,
          color: '#ffffff',
          textTransform: 'uppercase',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {entry.name}
      </div>
      <div
        style={{
          marginTop: 8,
          fontSize: 15,
          lineHeight: 1,
          color: '#b9c6d8',
          fontWeight: 800,
          textTransform: 'uppercase',
        }}
      >
        {entry.team}
      </div>
    </div>
    <div />
  </div>
);

const PositionPill = ({
  position,
  accent,
  large = false,
}: {
  position: number;
  accent: string;
  large?: boolean;
}) => (
  <div
    style={{
      width: large ? 84 : 62,
      height: large ? 48 : 40,
      display: 'grid',
      placeItems: 'center',
      color: '#05070d',
      fontFamily: DISPLAY_FONT,
      fontSize: large ? 34 : 27,
      lineHeight: 1,
      fontWeight: 900,
      background: `linear-gradient(135deg, ${GOLD}, #fff7a8)`,
      borderLeft: `8px solid ${accent}`,
      boxShadow: '0 10px 24px rgba(0,0,0,0.26)',
      clipPath: 'polygon(0 0, 100% 0, 86% 100%, 0 100%)',
      position: large ? 'absolute' : 'relative',
      left: large ? 16 : undefined,
      top: large ? 14 : undefined,
      zIndex: 2,
    }}
  >
    {position}
  </div>
);

const LeaderPanel = ({
  leader,
  fallback,
  theme,
  isConstructor,
}: {
  leader?: F1PodiumEntry;
  fallback?: F1RankingEntry;
  theme: F1ThemeConfig;
  isConstructor: boolean;
}) => {
  const entry = leader
    ? {
        position: leader.position,
        name: leader.name,
        team: leader.team,
        badge: leader.badge,
        value: leader.stat?.replace(/\s*pts$/i, ''),
        secondaryValue: 'lider',
        accentColor: leader.accentColor,
      }
    : fallback;

  if (!entry) {
    return null;
  }

  const logoPath = isConstructor ? resolveConstructorLogo(entry) : entry.badge.imagePath;

  return (
    <div
      style={{
        position: 'relative',
        overflow: 'hidden',
        padding: 32,
        border: `2px solid ${(entry.accentColor ?? theme.accent)}8a`,
        background:
          'linear-gradient(160deg, rgba(6,10,20,0.96), rgba(21,29,43,0.88) 64%, rgba(6,10,18,0.92))',
        boxShadow: `0 24px 60px ${(entry.accentColor ?? theme.accent)}28`,
      }}
    >
      <div
        style={{
          position: 'absolute',
          right: -70,
          top: -70,
          width: 270,
          height: 270,
          borderRadius: 999,
          background: `${entry.accentColor ?? theme.accent}1f`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: 12,
          background: entry.accentColor ?? theme.accent,
        }}
      />
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 12,
          color: GOLD,
          fontSize: 26,
          lineHeight: 1,
          fontWeight: 900,
          textTransform: 'uppercase',
        }}
      >
        <span style={{width: 44, height: 5, background: entry.accentColor ?? theme.accent}} />
        Lider do Mundial
      </div>
      <div
        style={{
          marginTop: 28,
          height: 312,
          display: 'grid',
          placeItems: 'center',
          background:
            'linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.025))',
          border: '1px solid rgba(255,255,255,0.12)',
        }}
      >
        {logoPath ? (
          <Img
            src={staticFile(logoPath.replace(/^\//, ''))}
            style={{
              width: isConstructor ? 238 : 282,
              height: isConstructor ? 172 : 302,
              objectFit: isConstructor ? 'contain' : 'cover',
              objectPosition: 'center top',
              filter: 'drop-shadow(0 18px 28px rgba(0,0,0,0.38))',
            }}
          />
        ) : (
          <BadgeDisk badge={entry.badge} size={180} theme={theme} />
        )}
      </div>
      <div
        style={{
          marginTop: 28,
          fontFamily: DISPLAY_FONT,
          fontSize: 56,
          lineHeight: 0.94,
          fontWeight: 900,
          color: '#ffffff',
          textTransform: 'uppercase',
        }}
      >
        {entry.name}
      </div>
      {entry.team ? (
        <div
          style={{
            marginTop: 12,
            fontSize: 28,
            lineHeight: 1,
            fontWeight: 800,
            color: '#bdcadb',
            textTransform: 'uppercase',
          }}
        >
          {entry.team}
        </div>
      ) : null}
      <div
        style={{
          position: 'absolute',
          left: 32,
          right: 32,
          bottom: 28,
          height: 112,
          padding: '14px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderTop: `4px solid ${entry.accentColor ?? theme.accent}`,
          background: 'rgba(0,0,0,0.24)',
        }}
      >
        <div
          style={{
            color: '#c9d4e4',
            fontSize: 18,
            lineHeight: 1,
            fontWeight: 900,
            textTransform: 'uppercase',
          }}
        >
          Pontos
        </div>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'baseline',
            gap: 12,
            color: GOLD,
          }}
        >
          <span style={{fontFamily: DISPLAY_FONT, fontSize: 86, lineHeight: 0.86}}>
            {valueOrDash(entry.value)}
          </span>
          <span style={{fontSize: 28, fontWeight: 900, textTransform: 'uppercase'}}>pts</span>
        </div>
      </div>
    </div>
  );
};

const BroadcastTable = ({
  rows,
  theme,
  title,
  valueLabel,
  isConstructor = false,
  columns = 1,
  compact = false,
}: {
  rows: F1RankingEntry[];
  theme: F1ThemeConfig;
  title: string;
  valueLabel: string;
  isConstructor?: boolean;
  columns?: 1 | 2;
  compact?: boolean;
}) => (
  <div
    style={{
      minWidth: 0,
      display: 'flex',
      flexDirection: 'column',
      background: 'rgba(5, 9, 17, 0.86)',
      border: '1px solid rgba(255,255,255,0.16)',
      boxShadow: '0 24px 58px rgba(0,0,0,0.28)',
    }}
  >
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) 164px',
        alignItems: 'center',
        padding: compact ? '14px 22px' : '18px 26px',
        borderBottom: `4px solid ${theme.secondaryAccent}`,
        background:
          'linear-gradient(90deg, rgba(255,255,255,0.10), rgba(255,255,255,0.02))',
      }}
    >
      <div
        style={{
          fontFamily: DISPLAY_FONT,
          fontSize: compact ? 32 : 36,
          lineHeight: 1,
          color: '#ffffff',
          textTransform: 'uppercase',
        }}
      >
        {title}
      </div>
      <div
        style={{
          color: theme.secondaryAccent,
          fontSize: 18,
          lineHeight: 1,
          fontWeight: 900,
          textTransform: 'uppercase',
          textAlign: 'right',
        }}
      >
        {valueLabel}
      </div>
    </div>
    <div
      style={{
        display: columns === 2 ? 'none' : 'grid',
        gridTemplateColumns: '80px 76px minmax(0, 1fr) 142px',
        padding: compact ? '8px 20px' : '10px 24px',
        color: '#8796aa',
        fontSize: 12,
        lineHeight: 1,
        fontWeight: 900,
        textTransform: 'uppercase',
        letterSpacing: 1.2,
        borderBottom: '1px solid rgba(255,255,255,0.10)',
      }}
    >
      <span style={{textAlign: 'center'}}>Pos</span>
      <span />
      <span>Piloto / Equipe</span>
      <span style={{textAlign: 'right'}}>{valueLabel}</span>
    </div>
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: columns === 2 ? '1fr 1fr' : '1fr',
        gap: columns === 2 ? 16 : 0,
        padding: columns === 2 ? '12px 16px 16px' : 0,
        minHeight: 0,
      }}
    >
      {splitRows(rows, columns).map((group, groupIndex) => (
        <div key={`group-${groupIndex}`} style={{display: 'flex', flexDirection: 'column', gap: 0, minWidth: 0}}>
          {columns === 2 ? (
            <CompactColumnHeader valueLabel={valueLabel} />
          ) : null}
          {group.map((row) => (
            <TableRow
              key={`${row.position}-${row.name}`}
              row={row}
              theme={theme}
              isConstructor={isConstructor}
              compact={compact}
            />
          ))}
        </div>
      ))}
    </div>
  </div>
);

const splitRows = (rows: F1RankingEntry[], columns: 1 | 2) => {
  if (columns === 1) {
    return [rows];
  }

  const midpoint = Math.ceil(rows.length / 2);
  return [rows.slice(0, midpoint), rows.slice(midpoint)];
};

const CompactColumnHeader = ({valueLabel}: {valueLabel: string}) => (
  <div
    style={{
      display: 'grid',
      gridTemplateColumns: '46px 52px minmax(0, 1fr) 96px',
      padding: '0 12px 8px 0',
      color: '#8796aa',
      fontSize: 10,
      lineHeight: 1,
      fontWeight: 900,
      textTransform: 'uppercase',
      letterSpacing: 1,
    }}
  >
    <span style={{textAlign: 'center'}}>Pos</span>
    <span />
    <span>Piloto / Equipe</span>
    <span style={{textAlign: 'right'}}>{valueLabel}</span>
  </div>
);

const TableRow = ({
  row,
  theme,
  isConstructor,
  compact,
}: {
  row: F1RankingEntry;
  theme: F1ThemeConfig;
  isConstructor: boolean;
  compact: boolean;
}) => {
  const logoPath = isConstructor ? resolveConstructorLogo(row) : row.badge.imagePath;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: compact ? '46px 52px minmax(0, 1fr) 96px' : '80px 76px minmax(0, 1fr) 142px',
        alignItems: 'center',
        minHeight: compact ? 51 : isConstructor ? 74 : 64,
        padding: compact ? '5px 12px 5px 0' : '7px 24px 7px 0',
        borderBottom: '1px solid rgba(255,255,255,0.10)',
        background:
          row.position % 2 === 0
            ? `linear-gradient(90deg, ${row.accentColor ?? theme.accent}22 0 6px, rgba(255,255,255,0.038) 6px 100%)`
            : `linear-gradient(90deg, ${row.accentColor ?? theme.accent}22 0 6px, rgba(255,255,255,0.016) 6px 100%)`,
      }}
    >
      <div
        style={{
          color: row.position <= 3 ? GOLD : theme.secondaryAccent,
          fontFamily: DISPLAY_FONT,
          fontSize: compact ? 25 : 34,
          lineHeight: 1,
          textAlign: 'center',
        }}
      >
        {row.position}
      </div>
      <div style={{display: 'grid', placeItems: 'center'}}>
        {logoPath ? (
          <Img
            src={staticFile(logoPath.replace(/^\//, ''))}
            style={{
              width: compact ? 38 : isConstructor ? 54 : 48,
              height: compact ? 38 : isConstructor ? 44 : 48,
              objectFit: isConstructor ? 'contain' : 'cover',
              objectPosition: 'center top',
              borderRadius: isConstructor ? 0 : 999,
            }}
          />
        ) : (
          <BadgeDisk badge={row.badge} size={compact ? 38 : 44} theme={theme} />
        )}
      </div>
      <div style={{minWidth: 0, paddingLeft: compact ? 8 : 12}}>
        <div
          style={{
            color: '#ffffff',
            fontFamily: DISPLAY_FONT,
            fontSize: compact ? 18 : isConstructor ? 30 : 27,
            lineHeight: 1,
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {row.name}
        </div>
        {!isConstructor && row.team ? (
          <div
            style={{
              marginTop: compact ? 3 : 4,
              color: '#aebbd0',
              fontSize: compact ? 11 : 15,
              lineHeight: 1,
              fontWeight: 800,
              textTransform: 'uppercase',
            }}
          >
            {row.team}
          </div>
        ) : null}
      </div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: 4,
          minWidth: 0,
        }}
      >
        <div
          style={{
            color: row.position <= 3 ? GOLD : theme.secondaryAccent,
            fontFamily: DISPLAY_FONT,
            fontSize: compact ? 16 : 31,
            lineHeight: 1,
            whiteSpace: 'nowrap',
          }}
        >
          {valueOrDash(row.value)}
        </div>
        {row.secondaryValue ? (
          <div
            style={{
              maxWidth: compact ? 104 : 142,
              color: '#96a5ba',
              fontSize: compact ? 9 : 12,
              lineHeight: 1,
              fontWeight: 900,
              textTransform: 'uppercase',
              textAlign: 'right',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {row.secondaryValue}
          </div>
        ) : null}
      </div>
    </div>
  );
};

const Portrait = ({
  badge,
  theme,
  accent,
  large = false,
}: {
  badge: TeamBadge;
  theme: F1ThemeConfig;
  accent?: string;
  large?: boolean;
}) => (
  <div
    style={{
      width: large ? 208 : 148,
      height: large ? 272 : 148,
      overflow: 'hidden',
      border: `3px solid ${accent ?? theme.accent}`,
      background: 'rgba(255,255,255,0.08)',
      display: 'grid',
      placeItems: 'center',
    }}
  >
    {badge.imagePath ? (
      <Img
        src={staticFile(badge.imagePath.replace(/^\//, ''))}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            objectPosition: 'center bottom',
          }}
        />
    ) : (
      <BadgeDisk badge={badge} size={92} theme={theme} />
    )}
  </div>
);

const Footer = ({job, theme}: {job: F1LargeVideosJob; theme: F1ThemeConfig}) => (
  <div
    style={{
      position: 'absolute',
      left: 68,
      right: 68,
      bottom: 34,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      color: '#b9c6d8',
      fontSize: 18,
      fontWeight: 900,
      textTransform: 'uppercase',
      letterSpacing: 1.2,
    }}
  >
    <div style={{display: 'flex', alignItems: 'center', gap: 14}}>
      <span style={{width: 54, height: 5, background: theme.secondaryAccent}} />
      <span>{job.competitionName || 'Formula 1'}</span>
      <span style={{color: theme.secondaryAccent}}>Temporada {job.season}</span>
    </div>
  </div>
);
