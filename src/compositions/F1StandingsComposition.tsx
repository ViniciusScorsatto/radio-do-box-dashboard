import {AbsoluteFill, Img, staticFile, useCurrentFrame} from 'remotion';
import {F1ProductionBed} from '../components/F1ProductionBed';
import {F1_DATA_FONT, F1_DISPLAY_FONT, F1FontFaces} from '../components/F1Typography';
import type {F1PodiumEntry, F1RankingEntry, F1ThemeConfig, TeamBadge} from '../lib/types';

type F1StandingsCompositionProps = {
  title: string;
  subtitle: string;
  countryCode?: string;
  themeConfig: F1ThemeConfig;
  leader?: F1PodiumEntry;
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

type BaseF1StandingsCompositionProps = F1StandingsCompositionProps & {
  forceConstructorLogos: boolean;
  maxRows: number;
};

const PAGE_SWITCH_FRAME = 180;
const DISPLAY_FONT = F1_DISPLAY_FONT;
const DATA_FONT = F1_DATA_FONT;
const DRIVER_STANDINGS_BACKGROUND_PATH = '/f1/backgrounds/mundial-de-pilotos.png';
const constructorTeamLogoOverrides: Record<string, string> = {
  'mercedes-amg-petronas': '/f1/teams/custom/mercedes.png',
  mercedes: '/f1/teams/custom/mercedes.png',
  'scuderia-ferrari': '/f1/teams/custom/ferrari.png',
  ferrari: '/f1/teams/custom/ferrari.png',
  'mclaren-racing': '/f1/teams/custom/mclaren.png',
  mclaren: '/f1/teams/custom/mclaren.png',
  'haas-f1-team': '/f1/teams/custom/haas.png',
  haas: '/f1/teams/custom/haas.png',
  'alpine-f1-team': '/f1/teams/custom/alpine.png',
  alpine: '/f1/teams/custom/alpine.png',
  'red-bull-racing': '/f1/teams/custom/red-bull.png',
  'red-bull': '/f1/teams/custom/red-bull.png',
  'racing-bulls': '/f1/teams/custom/racing-bulls.png',
  'audi-revolut-f1-team': '/f1/teams/custom/audi.png',
  audi: '/f1/teams/custom/audi.png',
  'williams-f1-team': '/f1/teams/custom/williams.png',
  williams: '/f1/teams/custom/williams.png',
  'cadillac-formula-1-team': '/f1/teams/custom/cadillac.png',
  cadillac: '/f1/teams/custom/cadillac.png',
  'aston-martin-f1-team': '/f1/teams/custom/aston-martin.png',
  'aston-martin': '/f1/teams/custom/aston-martin.png',
};
const constructorTeamShortNames: Record<string, string> = {
  'mercedes-amg-petronas': 'Mercedes',
  'scuderia-ferrari': 'Ferrari',
  'mclaren-racing': 'McLaren',
  'haas-f1-team': 'Haas',
  'alpine-f1-team': 'Alpine',
  'red-bull-racing': 'Red Bull',
  'racing-bulls': 'Racing Bulls',
  'audi-revolut-f1-team': 'Audi',
  'williams-f1-team': 'Williams',
  'cadillac-formula-1-team': 'Cadillac',
  'aston-martin-f1-team': 'Aston Martin',
};
const normalizeTeamKey = (value = '') =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
const getConstructorShortName = (value = '') => {
  const normalized = normalizeTeamKey(value);
  return constructorTeamShortNames[normalized] ?? value;
};
const displayStandingValue = (value?: string) => {
  const normalized = String(value ?? '').trim();
  return !normalized || normalized.toLowerCase() === 'null' ? '0' : normalized;
};
const resolveBadgeVisual = (
  badge: TeamBadge,
  options?: {forceConstructorLogos?: boolean; teamName?: string}
) => {
  const forceConstructorLogos = options?.forceConstructorLogos ?? false;
  const normalizedTeam = normalizeTeamKey(options?.teamName ?? badge.sublabel ?? '');
  const customLogoPath = constructorTeamLogoOverrides[normalizedTeam];
  const imagePath = forceConstructorLogos
    ? customLogoPath
    : badge.imagePath ?? customLogoPath ?? badge.logoPath;
  const isLogo = forceConstructorLogos || (!badge.imagePath && Boolean(imagePath));
  return {imagePath, isLogo};
};

const BaseF1StandingsComposition = ({
  title,
  subtitle,
  themeConfig,
  leader,
  entries,
  brandName,
  brandLogoPath,
  soundtrackPath,
  soundtrackVolume,
  voiceoverPath,
  introTitle,
  introSubtitle,
  forceConstructorLogos,
  maxRows,
}: BaseF1StandingsCompositionProps) => {
  const frame = useCurrentFrame();
  const rows = entries.length > 0 ? entries.slice(0, maxRows) : [];
  const headerSubtitle = sanitizeStandingsSubtitle(title, subtitle);
  const pageOneRows = rows.slice(1, 11);
  const pageTwoRows = rows.slice(11, maxRows);
  const hasSecondPageRows = pageTwoRows.length > 0;
  const showSecondPage = hasSecondPageRows && frame >= PAGE_SWITCH_FRAME;
  const effectiveLeader =
    leader ??
    (rows[0]
      ? {
          position: rows[0].position,
          name: rows[0].name,
          team: rows[0].team ?? '',
          badge: rows[0].badge,
          stat: rows[0].value ? `${rows[0].value} pts` : undefined,
          accentColor: rows[0].accentColor,
        }
      : undefined);

  return (
    <AbsoluteFill>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          overflow: 'hidden',
          color: '#0f1630',
          background:
            'linear-gradient(180deg, #fdfdff 0%, #f4f6fb 32%, #e7ecf5 68%, #dde4f0 100%)',
          fontFamily: DATA_FONT,
        }}
      >
        <F1FontFaces />
        <StandingsBackdrop accent={themeConfig.accent} />
        <StandingsHeader title={title} subtitle={headerSubtitle} />

        {!showSecondPage ? (
        <StandingsPage
            rows={pageOneRows}
            emphasizeTopThree
            leader={effectiveLeader}
            logoPath={brandLogoPath}
            isConstructorStandings={forceConstructorLogos}
            leaderTop={forceConstructorLogos ? 268 : 230}
            rowsTop={forceConstructorLogos ? 468 : 430}
          />
        ) : (
          <StandingsPage
            rows={pageTwoRows}
            logoPath={brandLogoPath}
            secondPage
            isConstructorStandings={forceConstructorLogos}
          />
        )}
      </div>
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

export const F1DriverStandingsComposition = (props: F1StandingsCompositionProps) => (
  <BaseF1StandingsComposition
    {...props}
    brandLogoPath="/branding/radio-do-box/red.png"
    forceConstructorLogos={false}
    maxRows={22}
  />
);

export const F1ConstructorStandingsComposition = (props: F1StandingsCompositionProps) => (
  <BaseF1StandingsComposition {...props} forceConstructorLogos maxRows={10} />
);

export const F1StandingsComposition = F1DriverStandingsComposition;

const StandingsBackdrop = ({accent}: {accent: string}) => (
  <>
    <Img
      src={staticFile(DRIVER_STANDINGS_BACKGROUND_PATH.replace(/^\//, ''))}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        objectFit: 'cover',
      }}
    />
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background:
          'linear-gradient(180deg, rgba(249,251,255,0.68) 0%, rgba(244,247,252,0.62) 20%, rgba(237,242,249,0.72) 44%, rgba(228,234,244,0.78) 70%, rgba(222,229,240,0.90) 100%)',
      }}
    />
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background:
          'radial-gradient(circle at 18% 22%, rgba(97, 216, 191, 0.12), transparent 16%), radial-gradient(circle at 84% 18%, rgba(255, 83, 78, 0.10), transparent 18%), radial-gradient(circle at 70% 78%, rgba(101, 112, 255, 0.10), transparent 22%)',
      }}
    />
    <div
      style={{
        position: 'absolute',
        inset: 0,
        opacity: 0.09,
        backgroundImage:
          'radial-gradient(rgba(20,30,60,0.28) 1.2px, transparent 1.2px)',
        backgroundSize: '24px 24px',
      }}
    />
    <div
      style={{
        position: 'absolute',
        top: 58,
        right: 54,
        width: 180,
        height: 180,
        borderRadius: 999,
        background: `${accent}18`,
        filter: 'blur(10px)',
      }}
    />
  </>
);

const StandingsHeader = ({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) => {
  const normalizedSubtitle = String(subtitle ?? '').trim();
  const shouldHideSubtitle = normalizedSubtitle.length === 0 || normalizedSubtitle.toLowerCase() === 'resultado da corrida';

  return (
    <div
      style={{
        position: 'absolute',
        top: 38,
        left: 44,
        right: 44,
      }}
    >
      <div style={{display: 'flex', flexDirection: 'column', gap: 10}}>
      <div
        style={{
          fontSize: 34,
          lineHeight: 1,
          fontWeight: 900,
          fontFamily: DISPLAY_FONT,
          color: '#21345f',
          letterSpacing: 0.3,
          textTransform: 'uppercase',
        }}
      >
        Classificacao do Campeonato
      </div>
      <div
        style={{
          fontSize: 66,
          lineHeight: 0.92,
          fontWeight: 900,
          fontFamily: DISPLAY_FONT,
          color: '#0a1024',
          textTransform: 'uppercase',
          maxWidth: 700,
        }}
      >
        {title}
      </div>
      {!shouldHideSubtitle ? (
        <div
          style={{
            fontSize: 28,
            lineHeight: 1,
            fontWeight: 500,
            fontFamily: DATA_FONT,
            color: '#55698f',
            textTransform: 'uppercase',
          }}
        >
          {subtitle}
        </div>
      ) : null}
      </div>
    </div>
  );
};

const sanitizeStandingsSubtitle = (title: string, subtitle: string) => {
  const normalizedTitle = String(title ?? '').toLowerCase();
  const normalizedSubtitle = String(subtitle ?? '').trim().toLowerCase();
  const isChampionshipTable =
    normalizedTitle.includes('mundial de pilotos') ||
    normalizedTitle.includes('mundial de construtores');
  const staleTemplateSubtitles = new Set([
    'media limpa da corrida',
    'média limpa da corrida',
    'resultado da corrida',
    'classificacao de largada',
    'classificação de largada',
    'ritmo de corrida',
  ]);

  if (isChampionshipTable && staleTemplateSubtitles.has(normalizedSubtitle)) {
    return '';
  }

  return subtitle;
};

const StandingsPage = ({
  rows,
  emphasizeTopThree = false,
  leader,
  logoPath,
  secondPage = false,
  isConstructorStandings = false,
  leaderTop = 230,
  rowsTop = 430,
}: {
  rows: F1RankingEntry[];
  emphasizeTopThree?: boolean;
  leader?: F1PodiumEntry;
  logoPath?: string;
  secondPage?: boolean;
  isConstructorStandings?: boolean;
  leaderTop?: number;
  rowsTop?: number;
}) => (
  <>
    {!secondPage && emphasizeTopThree && leader ? (
      <div
        style={{
          position: 'absolute',
          left: 44,
          right: 44,
          top: leaderTop,
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: 14,
        }}
      >
        <StandingsLeaderCard leader={leader} forceConstructorLogos={isConstructorStandings} />
      </div>
    ) : null}

    <div
      style={{
        position: 'absolute',
        left: 44,
        right: 44,
        top: secondPage ? 228 : rowsTop,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      {rows.map((entry) => (
        <StandingsRow
          key={`${entry.position}-${entry.name}`}
          entry={entry}
          forceConstructorLogos={isConstructorStandings}
        />
      ))}
    </div>

    {logoPath ? (
      <Img
        src={staticFile(logoPath.replace(/^\//, ''))}
        style={{
          position: 'absolute',
          right: 44,
          bottom: 34,
          width: 126,
          objectFit: 'contain',
          opacity: 0.78,
        }}
      />
    ) : null}
  </>
);

const StandingsLeaderCard = ({
  leader,
  forceConstructorLogos = false,
}: {
  leader: F1PodiumEntry;
  forceConstructorLogos?: boolean;
}) => {
  const {imagePath, isLogo} = resolveBadgeVisual(leader.badge, {
    forceConstructorLogos,
    teamName: leader.team || leader.name,
  });
  const logoOffsetX = forceConstructorLogos ? 24 : 0;
  const displayLeaderName = forceConstructorLogos ? getConstructorShortName(leader.name) : leader.name;
  const displayLeaderDetail = forceConstructorLogos
    ? leader.badge.sublabel || leader.team || leader.name
    : leader.team;

  return (
    <div
    style={{
      display: 'grid',
      gridTemplateColumns: '204px minmax(0, 1fr) 146px',
      alignItems: 'center',
      minHeight: 152,
      padding: '12px 24px 12px 12px',
      borderRadius: 34,
      background: 'linear-gradient(180deg, rgba(255,255,255,0.98), rgba(244,247,252,0.98))',
      border: '4px solid rgba(255, 207, 94, 0.92)',
      boxShadow: '0 0 46px rgba(255, 199, 82, 0.34)',
      overflow: 'hidden',
    }}
  >
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background:
          'linear-gradient(90deg, rgba(255,214,111,0.28) 0 30%, rgba(255,255,255,0.0) 54%)',
      }}
    />
    <div
      style={{
        position: 'relative',
        width: isLogo ? 138 : 178,
        height: isLogo ? 124 : 128,
        borderRadius: isLogo ? 18 : 28,
        background: isLogo
          ? 'transparent'
          : 'linear-gradient(180deg, rgba(23,29,54,0.96), rgba(14,17,33,0.96))',
        border: isLogo ? 'none' : '3px solid rgba(255, 207, 94, 0.92)',
        overflow: isLogo ? 'visible' : 'hidden',
        display: 'flex',
        alignItems: isLogo ? 'center' : 'flex-end',
        justifyContent: 'center',
        boxShadow: isLogo ? 'none' : '0 0 28px rgba(255, 199, 82, 0.28)',
        paddingRight: 0,
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: 8,
          top: -2,
          fontSize: 106,
          lineHeight: 0.8,
          color: 'rgba(255, 214, 111, 0.52)',
          fontWeight: 900,
          textShadow: '0 0 24px rgba(255, 214, 111, 0.18)',
          zIndex: 1,
        }}
      >
        1
      </div>
      {imagePath ? (
        <Img
          src={staticFile(imagePath.replace(/^\//, ''))}
          style={{
            width: isLogo ? 108 : 140,
            height: isLogo ? 108 : 140,
            objectFit: isLogo ? 'contain' : 'cover',
            objectPosition: isLogo ? 'center center' : 'center top',
            filter: isLogo ? 'drop-shadow(0 0 14px rgba(255,255,255,0.12))' : undefined,
            borderRadius: isLogo ? 18 : 0,
            border: isLogo ? '3px solid rgba(255, 255, 255, 0.72)' : 'none',
            transform: isLogo ? `translateX(${logoOffsetX}px)` : 'none',
            zIndex: 2,
          }}
        />
      ) : (
        <div
          style={{
            fontSize: 44,
            lineHeight: 1,
            fontWeight: 900,
            color: '#ffffff',
          }}
        >
          {leader.badge.label}
        </div>
      )}
    </div>

    <div
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      <div
        style={{
          fontSize: 46,
          lineHeight: 0.94,
          fontWeight: 600,
          fontFamily: DATA_FONT,
          color: '#10172e',
          textTransform: 'uppercase',
        }}
      >
        {displayLeaderName}
      </div>
      <div
        style={{
          fontSize: 26,
          lineHeight: 1,
          fontWeight: 600,
          fontFamily: DATA_FONT,
          color: leader.accentColor ?? '#2c406d',
          textTransform: 'uppercase',
        }}
      >
        {displayLeaderDetail}
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <div
          style={{
            fontSize: 18,
            lineHeight: 1,
            fontWeight: 900,
            color: '#5f6f92',
            textTransform: 'uppercase',
          }}
        >
          Lider do campeonato
        </div>
      </div>
    </div>

    <div
      style={{
        position: 'relative',
        textAlign: 'right',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}
    >
      <div
        style={{
          fontSize: 72,
          lineHeight: 0.9,
          fontWeight: 900,
          color: '#0e1530',
          textShadow: '0 0 18px rgba(255, 204, 104, 0.18)',
        }}
      >
        {leader.stat?.replace(/\s*pts/i, '') ?? '--'}
      </div>
      <div
        style={{
          fontSize: 24,
          lineHeight: 1,
          fontWeight: 900,
          color: '#5f6f92',
          textTransform: 'uppercase',
        }}
      >
        pts
      </div>
    </div>
  </div>
  );
};

const StandingsRow = ({
  entry,
  forceConstructorLogos = false,
}: {
  entry: F1RankingEntry;
  forceConstructorLogos?: boolean;
}) => {
  const isTopThree = entry.position <= 3;
  const chipStyle = getAccentChipStyle(entry.accentColor);
  const {imagePath, isLogo} = resolveBadgeVisual(entry.badge, {
    forceConstructorLogos,
    teamName: entry.name || entry.team || entry.badge.sublabel,
  });
  const displayName = forceConstructorLogos ? getConstructorShortName(entry.name) : entry.name;
  const displayTeamDetail = forceConstructorLogos
    ? entry.badge.sublabel || entry.name || 'Formula 1'
    : entry.team || entry.badge.sublabel || 'Formula 1';
  const medalFill =
    entry.position === 1
      ? 'linear-gradient(180deg, #ffe68d 0%, #ffbd4a 100%)'
      : entry.position === 2
        ? 'linear-gradient(180deg, #eef4ff 0%, #c4d0e5 100%)'
        : entry.position === 3
          ? 'linear-gradient(180deg, #ffaf75 0%, #d66a33 100%)'
          : 'linear-gradient(180deg, rgba(24,35,68,0.92), rgba(14,20,41,0.92))';
  const medalText = entry.position <= 3 ? '#1b1400' : '#ffffff';

  return (
    <div
      style={{
        position: 'relative',
        display: 'grid',
        gridTemplateColumns: '78px 106px minmax(0, 1fr) 124px',
        alignItems: 'center',
        minHeight: 86,
        padding: '6px 18px 6px 10px',
        borderRadius: 24,
        background: 'linear-gradient(180deg, rgba(255,255,255,0.985), rgba(242,246,252,0.985))',
        boxShadow: '0 8px 20px rgba(39, 58, 94, 0.11)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(90deg, ${(entry.accentColor ?? '#7b94ff')}25 0 34%, rgba(255,255,255,0) 55%)`,
        }}
      />

      <div
        style={{
          position: 'relative',
          width: 58,
          height: 60,
          borderRadius: 18,
          display: 'grid',
          placeItems: 'center',
          background: medalFill,
          color: medalText,
          fontSize: 32,
          lineHeight: 1,
          fontWeight: 900,
          boxShadow: isTopThree ? '0 0 20px rgba(255, 187, 70, 0.25)' : 'none',
        }}
      >
        {entry.position}
      </div>

      <div
        style={{
          position: 'relative',
          width: isLogo ? 74 : 86,
          height: 74,
          borderRadius: isLogo ? 16 : 20,
          overflow: isLogo ? 'visible' : 'hidden',
          display: 'flex',
          alignItems: isLogo ? 'center' : 'flex-end',
          justifyContent: 'center',
          background: isLogo
            ? 'transparent'
            : 'linear-gradient(180deg, rgba(27,35,66,0.98), rgba(20,25,46,0.98))',
        }}
      >
        {imagePath ? (
          <Img
            src={staticFile(imagePath.replace(/^\//, ''))}
            style={{
              width: isLogo ? 62 : 84,
              height: isLogo ? 62 : 88,
              objectFit: isLogo ? 'contain' : 'cover',
              objectPosition: isLogo ? 'center center' : 'center top',
              filter: isLogo ? 'drop-shadow(0 0 10px rgba(255,255,255,0.12))' : undefined,
              borderRadius: isLogo ? 14 : 0,
              border: isLogo ? '2px solid rgba(255, 255, 255, 0.62)' : 'none',
            }}
          />
        ) : (
          <div
            style={{
              fontSize: 26,
              lineHeight: 1,
              fontWeight: 900,
              color: '#ffffff',
            }}
          >
            {entry.badge.label}
          </div>
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
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            minWidth: 0,
          }}
        >
          {entry.driverNumber ? (
            <div
              style={{
                flexShrink: 0,
                padding: '4px 8px 3px',
                borderRadius: 999,
                background: chipStyle.background,
                color: chipStyle.color,
                fontSize: 14,
                lineHeight: 1,
                fontWeight: 700,
                fontFamily: DATA_FONT,
                boxShadow: chipStyle.boxShadow,
                border: chipStyle.border,
              }}
            >
              #{entry.driverNumber}
            </div>
          ) : null}
          <div
            style={{
            fontSize: 32,
            lineHeight: 0.96,
            fontWeight: 600,
            fontFamily: DATA_FONT,
            color: '#0e1733',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            minWidth: 0,
            flex: 1,
          }}
          >
            {displayName}
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            minWidth: 0,
          }}
        >
          <div
            style={{
              fontSize: 18,
              lineHeight: 1,
              fontWeight: 600,
              fontFamily: DATA_FONT,
              color: chipStyle.color,
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              alignSelf: 'flex-start',
              padding: '4px 10px 3px',
              borderRadius: 999,
              background: chipStyle.background,
              boxShadow: chipStyle.boxShadow,
              border: chipStyle.border,
              minWidth: 0,
            }}
          >
            {displayTeamDetail}
          </div>
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
        <div
          style={{
            fontSize: 38,
            lineHeight: 0.9,
            fontWeight: 700,
            fontFamily: DATA_FONT,
            color: '#111931',
          }}
        >
          {displayStandingValue(entry.value)}
        </div>
        {entry.secondaryValue ? (
          <div
            style={{
              fontSize: 16,
              lineHeight: 1,
              fontWeight: 700,
              fontFamily: DATA_FONT,
              color: '#ffffff',
              textTransform: 'uppercase',
              padding: '4px 10px 3px',
              borderRadius: 999,
              background: '#1b2750',
              boxShadow: '0 0 12px rgba(27, 39, 80, 0.18)',
            }}
          >
            {entry.secondaryValue}
          </div>
        ) : null}
        <div
          style={{
            fontSize: 17,
            lineHeight: 1,
            fontWeight: 500,
            fontFamily: DATA_FONT,
            color: '#6b7b9d',
            textTransform: 'uppercase',
          }}
        >
          pts
        </div>
      </div>
    </div>
  );
};

const getAccentChipStyle = (accentColor?: string) => {
  const accent = accentColor ?? '#586b90';
  const light = isLightColor(accent);

  if (light) {
    return {
      background: 'rgba(22, 31, 59, 0.94)',
      color: accent,
      border: `2px solid ${accent}`,
      boxShadow: `0 0 12px ${accent}20`,
    };
  }

  return {
    background: accent,
    color: '#ffffff',
    border: 'none',
    boxShadow: `0 0 12px ${accent}25`,
  };
};

const isLightColor = (color: string) => {
  const hex = color.replace('#', '');

  if (!/^[0-9a-fA-F]{6}$/.test(hex)) {
    return false;
  }

  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  return luminance > 0.72;
};
