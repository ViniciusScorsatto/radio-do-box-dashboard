import type {ReactNode} from 'react';
import {Img, staticFile} from 'remotion';
import type {
  F1PodiumEntry,
  F1RankingEntry,
  F1ScheduleEntry,
  F1ThemeConfig,
  TeamBadge,
} from '../lib/types';

export const F1Frame = ({
  theme,
  backgroundImagePath,
  children,
}: {
  theme: F1ThemeConfig;
  backgroundImagePath?: string;
  children: ReactNode;
}) => {
  const overlay =
    theme.variant === 'light'
      ? 'linear-gradient(180deg, rgba(255,255,255,0.10), rgba(203,213,230,0.10) 48%, rgba(48,58,78,0.12) 100%)'
      : 'linear-gradient(180deg, rgba(255,255,255,0.10), rgba(0,0,0,0.14) 40%, rgba(0,0,0,0.42) 100%)';

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        color: theme.text,
        fontFamily: '"Arial Black", "Avenir Next Condensed", "Segoe UI", sans-serif',
        background: theme.background,
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: backgroundImagePath ? 0.88 : 1,
        }}
      >
        {backgroundImagePath ? (
          <Img
            src={staticFile(backgroundImagePath.replace(/^\//, ''))}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        ) : null}
      </div>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            theme.variant === 'blue'
              ? 'radial-gradient(circle at 50% 18%, rgba(117,166,255,0.22), transparent 24%), radial-gradient(circle at 50% 100%, rgba(255,224,107,0.12), transparent 30%)'
              : theme.variant === 'light'
                ? 'radial-gradient(circle at 50% 8%, rgba(255,255,255,0.24), transparent 20%), radial-gradient(circle at 50% 100%, rgba(255,206,116,0.12), transparent 30%)'
                : 'radial-gradient(circle at 50% 12%, rgba(255,170,84,0.22), transparent 24%), radial-gradient(circle at 50% 100%, rgba(255,214,121,0.14), transparent 30%)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(135deg, transparent 0 38%, rgba(255,255,255,0.05) 38% 39%, transparent 39% 100%)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: theme.variant === 'light' ? 0.26 : 0.38,
          background:
            'repeating-linear-gradient(180deg, rgba(255,255,255,0.035) 0 1px, transparent 1px 28px)',
        }}
      />
      <div style={{position: 'absolute', inset: 0, background: overlay}} />
      {children}
    </div>
  );
};

export const F1Header = ({
  title,
  subtitle,
  theme,
}: {
  title: string;
  subtitle: string;
  theme: F1ThemeConfig;
}) => {
  const topFill =
    theme.variant === 'light'
      ? 'linear-gradient(180deg, rgba(255,255,255,0.88), rgba(226,232,242,0.8))'
      : 'linear-gradient(180deg, rgba(18,18,33,0.96), rgba(8,8,18,0.96))';
  const bottomFill =
    theme.variant === 'light'
      ? 'linear-gradient(180deg, rgba(249,251,255,0.92), rgba(225,230,236,0.84))'
      : 'linear-gradient(180deg, rgba(33,14,10,0.88), rgba(11,6,8,0.96))';

  return (
    <div style={{position: 'relative', height: 198}}>
      <SkewPanel
        top={6}
        left={94}
        width={878}
        height={92}
        skew={-10}
        fill={topFill}
        stroke={theme.accent}
        glow={`0 0 24px ${theme.accent}55`}
      >
        <div
          style={{
            fontSize: 62,
            lineHeight: 1,
            fontWeight: 900,
            letterSpacing: -1.8,
            textTransform: 'uppercase',
            color: theme.variant === 'light' ? '#1a253a' : theme.text,
          }}
        >
          {title}
        </div>
      </SkewPanel>

      <SkewPanel
        top={96}
        left={130}
        width={820}
        height={68}
        skew={-8}
        fill={bottomFill}
        stroke={theme.secondaryAccent}
        glow={`0 0 18px ${theme.secondaryAccent}44`}
      >
        <div
          style={{
            fontSize: 34,
            lineHeight: 1,
            fontWeight: 900,
            textTransform: 'uppercase',
            color: theme.variant === 'light' ? '#30405a' : theme.text,
          }}
        >
          {subtitle}
        </div>
      </SkewPanel>
    </div>
  );
};

const SkewPanel = ({
  top,
  left,
  width,
  height,
  skew,
  fill,
  stroke,
  glow,
  children,
}: {
  top: number;
  left: number;
  width: number;
  height: number;
  skew: number;
  fill: string;
  stroke: string;
  glow: string;
  children: ReactNode;
}) => (
  <div
    style={{
      position: 'absolute',
      top,
      left,
      width,
      height,
      transform: `skewX(${skew}deg)`,
      border: `3px solid ${stroke}`,
      boxShadow: glow,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: fill,
    }}
  >
    <div style={{transform: `skewX(${-skew}deg)`, display: 'flex', alignItems: 'center'}}>
      {children}
    </div>
  </div>
);

export const CountryBadge = ({
  code,
  theme,
}: {
  code?: string;
  theme: F1ThemeConfig;
}) => (
  <div
    style={{
      width: 132,
      height: 132,
      borderRadius: '50%',
      display: 'grid',
      placeItems: 'center',
      fontSize: 42,
      fontWeight: 900,
      color: theme.text,
      background:
        theme.variant === 'light'
          ? 'linear-gradient(180deg, rgba(255,255,255,0.92), rgba(219,226,237,0.78))'
          : 'linear-gradient(180deg, rgba(26,43,120,0.92), rgba(22,28,90,0.86))',
      border: `3px solid ${theme.secondaryAccent}`,
      boxShadow: `0 0 22px ${theme.accent}44`,
    }}
  >
    {code ?? 'F1'}
  </div>
);

export const RadioDoBoxMark = ({
  theme,
  logoPath,
}: {
  theme: F1ThemeConfig;
  logoPath?: string;
}) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      color: theme.variant === 'light' ? '#202c42' : '#f4d67d',
    }}
  >
    {logoPath ? (
      <Img
        src={staticFile(logoPath.replace(/^\//, ''))}
        style={{
          width: 210,
          objectFit: 'contain',
        }}
      />
    ) : (
      <>
        <div
          style={{
            width: 70,
            height: 70,
            borderRadius: 24,
            border: `4px solid ${theme.secondaryAccent}`,
            display: 'grid',
            placeItems: 'center',
            fontSize: 28,
            fontWeight: 900,
            background:
              theme.variant === 'light'
                ? 'linear-gradient(180deg, rgba(255,255,255,0.88), rgba(224,232,244,0.78))'
                : 'linear-gradient(180deg, rgba(11,12,23,0.96), rgba(5,7,15,0.92))',
            boxShadow: `0 0 18px ${theme.secondaryAccent}33`,
          }}
        >
          RB
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            lineHeight: 0.88,
            fontSize: 34,
            fontWeight: 900,
            textTransform: 'uppercase',
          }}
        >
          <span>Radio</span>
          <span>do Box</span>
        </div>
      </>
    )}
  </div>
);

export const F1PodiumStrip = ({
  podium,
  theme,
}: {
  podium: F1PodiumEntry[];
  theme: F1ThemeConfig;
}) => {
  const order: Record<number, number> = {2: 0, 1: 1, 3: 2};

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: podium.length === 1 ? '1fr' : '1fr 1.15fr 1fr',
        alignItems: 'end',
        gap: 18,
        minHeight: 292,
      }}
    >
      {podium
        .slice()
        .sort((a, b) => (order[a.position] ?? a.position) - (order[b.position] ?? b.position))
        .map((entry) => (
        <div
          key={`${entry.position}-${entry.name}`}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <div
            style={{
              fontSize: 110,
              lineHeight: 1,
              color: theme.secondaryAccent,
              textShadow: `0 0 18px ${entry.accentColor ?? theme.accent}55`,
            }}
          >
            {entry.position}
          </div>
          <div
            style={{
              width: entry.position === 1 ? 210 : 182,
              height: entry.position === 1 ? 198 : 168,
              borderRadius: 28,
              overflow: 'hidden',
              position: 'relative',
              background:
                theme.variant === 'light'
                  ? 'linear-gradient(180deg, rgba(255,255,255,0.92), rgba(231,237,246,0.76))'
                  : 'linear-gradient(180deg, rgba(10,12,28,0.96), rgba(4,5,14,0.94))',
              border: `3px solid ${entry.accentColor ?? theme.secondaryAccent}`,
              boxShadow: `0 0 22px ${(entry.accentColor ?? theme.accent)}44`,
            }}
          >
            {entry.badge.imagePath ? (
              <Img
                src={staticFile(entry.badge.imagePath.replace(/^\//, ''))}
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  objectPosition: 'center top',
                }}
              />
            ) : (
              <div style={{position: 'absolute', inset: 0, display: 'grid', placeItems: 'center'}}>
                <BadgeDisk badge={entry.badge} size={entry.position === 1 ? 100 : 88} theme={theme} />
              </div>
            )}
            <div
              style={{
                position: 'absolute',
                inset: 'auto 0 0 0',
                padding: '10px 12px',
                background: 'linear-gradient(180deg, transparent, rgba(0,0,0,0.88))',
                display: 'flex',
                justifyContent: 'center',
              }}
            >
              <div
                style={{
                  maxWidth: '100%',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  fontSize: entry.position === 1 ? 22 : 20,
                  lineHeight: 1,
                  fontWeight: 900,
                  textTransform: 'uppercase',
                  color: '#ffffff',
                }}
              >
                {entry.badge.sublabel ?? entry.team}
              </div>
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
              textAlign: 'center',
            }}
          >
            <div
              style={{
                fontSize: entry.position === 1 ? 31 : 27,
                lineHeight: 1.02,
                fontWeight: 900,
                color: theme.text,
                textTransform: 'uppercase',
              }}
            >
              {entry.name}
            </div>
            <div
              style={{
                fontSize: 22,
                lineHeight: 1,
                fontWeight: 700,
                color: theme.mutedText,
              }}
            >
              {entry.team}
            </div>
            {entry.stat ? (
              <div
                style={{
                  fontSize: 18,
                  lineHeight: 1,
                  fontWeight: 800,
                  color: theme.secondaryAccent,
                }}
              >
                {entry.stat}
              </div>
            ) : null}
          </div>
        </div>
        ))}
    </div>
  );
};

export const F1RankingList = ({
  entries,
  theme,
  compact = false,
}: {
  entries: F1RankingEntry[];
  theme: F1ThemeConfig;
  compact?: boolean;
}) => (
  <div style={{display: 'flex', flexDirection: 'column', gap: compact ? 8 : 10}}>
    {entries.map((entry) => (
      <div
        key={`${entry.position}-${entry.name}`}
        style={{
          position: 'relative',
          display: 'grid',
          gridTemplateColumns: compact ? '58px 58px minmax(0, 1fr) 132px' : '58px 64px minmax(0, 1fr) 164px',
          alignItems: 'center',
          minHeight: compact ? 62 : 72,
          padding: compact ? '6px 12px' : '8px 14px',
          borderRadius: 18,
          border: `2px solid ${entry.accentColor ?? theme.panelStroke}`,
          background: theme.panelFill,
          boxShadow: `0 0 18px ${(entry.accentColor ?? theme.accent)}22`,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(90deg, ${(entry.accentColor ?? theme.accent)}3d 0 22%, transparent 42%)`,
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            fontSize: compact ? 28 : 32,
            lineHeight: 1,
            fontWeight: 900,
            color: theme.secondaryAccent,
            textAlign: 'center',
          }}
        >
          {entry.position}
        </div>
        <BadgeDisk badge={entry.badge} size={compact ? 42 : 48} theme={theme} />
        <div
          style={{
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            paddingLeft: 10,
          }}
        >
          <div
            style={{
              fontSize: compact ? 25 : 28,
              lineHeight: 1,
              fontWeight: 900,
              color: theme.text,
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {entry.name}
          </div>
          {entry.team ? (
            <div
              style={{
                fontSize: compact ? 15 : 16,
                lineHeight: 1,
                fontWeight: 700,
                color: theme.mutedText,
                textTransform: 'uppercase',
              }}
            >
              {entry.team}
            </div>
          ) : null}
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: 2,
            textAlign: 'right',
          }}
        >
          {entry.value ? (
            <div
              style={{
                fontSize: compact ? 28 : 32,
                lineHeight: 1,
                fontWeight: 900,
                color: theme.secondaryAccent,
              }}
            >
              {entry.value}
            </div>
          ) : null}
          {entry.secondaryValue ? (
            <div
              style={{
                fontSize: compact ? 14 : 15,
                lineHeight: 1,
                fontWeight: 800,
                color: theme.mutedText,
                textTransform: 'uppercase',
              }}
            >
              {entry.secondaryValue}
            </div>
          ) : null}
        </div>
      </div>
    ))}
  </div>
);

export const F1ScheduleList = ({
  sessions,
  theme,
}: {
  sessions: F1ScheduleEntry[];
  theme: F1ThemeConfig;
}) => (
  <div style={{display: 'flex', flexDirection: 'column', gap: 12}}>
    {sessions.map((session, index) => (
      <div
        key={`${session.dayLabel}-${session.title}-${index}`}
        style={{
          display: 'grid',
          gridTemplateColumns: '220px minmax(0, 1fr)',
          alignItems: 'stretch',
          borderRadius: 20,
          overflow: 'hidden',
          border: `2px solid ${theme.panelStroke}`,
          background: theme.panelFill,
          boxShadow: `0 0 18px ${theme.accent}22`,
        }}
      >
        <div
          style={{
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: `linear-gradient(180deg, ${theme.accent}, ${theme.secondaryAccent})`,
            color: theme.variant === 'light' ? '#263248' : '#1b1008',
            fontSize: 24,
            lineHeight: 1,
            fontWeight: 900,
            textTransform: 'uppercase',
            textAlign: 'center',
          }}
        >
          {session.dayLabel}
        </div>
        <div
          style={{
            padding: '14px 18px',
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) auto',
            gap: 14,
            alignItems: 'center',
          }}
        >
          <div style={{display: 'flex', flexDirection: 'column', gap: 4}}>
            <div
              style={{
                fontSize: 28,
                lineHeight: 1,
                fontWeight: 900,
                color: theme.text,
                textTransform: 'uppercase',
              }}
            >
              {session.title}
            </div>
            {session.subtitle ? (
              <div
                style={{
                  fontSize: 16,
                  lineHeight: 1,
                  fontWeight: 700,
                  color: theme.mutedText,
                  textTransform: 'uppercase',
                }}
              >
                {session.subtitle}
              </div>
            ) : null}
          </div>
          <div
            style={{
              fontSize: 34,
              lineHeight: 1,
              fontWeight: 900,
              color: theme.secondaryAccent,
            }}
          >
            {session.timeLabel}
          </div>
        </div>
      </div>
    ))}
  </div>
);

export const BadgeDisk = ({
  badge,
  size,
  theme,
}: {
  badge: TeamBadge;
  size: number;
  theme: F1ThemeConfig;
}) => {
  const logoPath = badge.imagePath ?? badge.logoPath;

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        display: 'grid',
        placeItems: 'center',
        background:
          theme.variant === 'light'
            ? 'linear-gradient(180deg, rgba(255,255,255,0.92), rgba(223,231,244,0.88))'
            : 'linear-gradient(180deg, rgba(6,10,28,0.92), rgba(4,5,13,0.92))',
        border: `3px solid ${badge.accentColor ?? theme.secondaryAccent}`,
        boxShadow: `0 0 14px ${(badge.accentColor ?? theme.accent)}44`,
        overflow: 'hidden',
      }}
    >
      {logoPath ? (
        <Img
          src={staticFile(logoPath.replace(/^\//, ''))}
          style={{
            width: badge.imagePath ? '100%' : '80%',
            height: badge.imagePath ? '100%' : '80%',
            objectFit: badge.imagePath ? 'cover' : 'contain',
            objectPosition: badge.imagePath ? 'center top' : 'center center',
          }}
        />
      ) : (
        <div
          style={{
            fontSize: Math.round(size * 0.34),
            lineHeight: 1,
            fontWeight: 900,
            color: theme.text,
            textTransform: 'uppercase',
          }}
        >
          {badge.label}
        </div>
        )}
      {badge.imagePath && badge.logoPath ? (
        <div
          style={{
            position: 'absolute',
            right: -1,
            bottom: -1,
            width: Math.round(size * 0.38),
            height: Math.round(size * 0.38),
            borderRadius: '50%',
            background: 'rgba(10,10,18,0.92)',
            border: `2px solid ${badge.accentColor ?? theme.secondaryAccent}`,
            display: 'grid',
            placeItems: 'center',
            overflow: 'hidden',
          }}
        >
          <Img
            src={staticFile(badge.logoPath.replace(/^\//, ''))}
            style={{
              width: '72%',
              height: '72%',
              objectFit: 'contain',
            }}
          />
        </div>
      ) : null}
    </div>
  );
};
