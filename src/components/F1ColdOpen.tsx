import {AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {F1_DISPLAY_FONT} from './F1Typography';

type F1ColdOpenProps = {
  accentColor: string;
  secondaryAccent: string;
  brandName: string;
  brandLogoPath?: string;
  introTitle?: string;
  introSubtitle?: string;
};

const DISPLAY_FONT = F1_DISPLAY_FONT;

const telemetryRows = [
  ['DRS', 'ABERTO', '+12 KM/H'],
  ['SETOR 1', 'ROXO', '-0.182'],
  ['PIT WALL', 'RITMO', 'OK'],
  ['RADIO', 'BOX', 'AGORA'],
];

const gridRows = [
  ['P1', 'NOR', '1:28.421'],
  ['P2', 'VER', '+0.084'],
  ['P3', 'LEC', '+0.191'],
  ['P4', 'HAM', '+0.276'],
];

const strategyRows = [
  ['PNEU', 'MÉDIO'],
  ['JANELA', 'V18-24'],
  ['RISCO', 'SC 42%'],
];

const gapRows = [
  ['VOLTA', '34/56'],
  ['GAP', '+0.842'],
  ['PACE', '-0.118'],
];

export const F1ColdOpen = ({
  accentColor,
  secondaryAccent,
  brandName,
  brandLogoPath,
  introTitle,
  introSubtitle,
}: F1ColdOpenProps) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const fadeOutStart = Math.round(fps * 1.28);
  const fadeOutEnd = Math.round(fps * 1.5);

  const opacity = interpolate(frame, [0, 4], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const flash = interpolate(frame, [0, 2, 9], [0.86, 0.36, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const revSweep = interpolate(frame, [0, 17, fadeOutStart], [-42, 108, 128], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const sweepOpacity = interpolate(frame, [0, 12, 22, 28], [0.88, 0.88, 0.22, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const logoScale = interpolate(frame, [0, 7, 15], [0.72, 1.12, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const titleY = interpolate(frame, [3, 14], [36, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const titleOpacity = interpolate(frame, [4, 14], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const leftPanelX = interpolate(frame, [0, 12], [-180, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const rightPanelX = interpolate(frame, [0, 12], [180, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const dataShift = interpolate(frame % 18, [0, 17], [0, -64], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const exitWipe = interpolate(frame, [fadeOutStart - 3, fadeOutEnd], [-140, 120], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const sweepPosition = Math.min(103, revSweep);

  if (frame >= fadeOutEnd) {
    return null;
  }

  return (
    <AbsoluteFill
      style={{
        pointerEvents: 'none',
        zIndex: 2147483647,
        isolation: 'isolate',
        opacity,
        background:
          'radial-gradient(circle at 50% 42%, rgba(255,92,47,0.28), transparent 30%), linear-gradient(180deg, #050507 0%, #100607 48%, #040406 100%)',
        color: '#fff7e7',
        fontFamily: DISPLAY_FONT,
        overflow: 'hidden',
      }}
    >
      <AbsoluteFill
        style={{
          backgroundImage:
            'linear-gradient(90deg, rgba(255,255,255,0.055) 1px, transparent 1px), linear-gradient(180deg, rgba(255,255,255,0.035) 1px, transparent 1px)',
          backgroundSize: '72px 72px',
          opacity: 0.42,
        }}
      />
      <AbsoluteFill
        style={{
          background:
            `linear-gradient(112deg, transparent 0 ${sweepPosition - 4}%, ${accentColor} 0 ${sweepPosition}%, transparent 0), linear-gradient(112deg, transparent 0 ${sweepPosition - 1.5}%, ${secondaryAccent}CC 0 ${sweepPosition + 1.5}%, transparent 0)`,
          mixBlendMode: 'screen',
          opacity: sweepOpacity,
        }}
      />
      <AbsoluteFill
        style={{
          background:
            'radial-gradient(circle at 18% 22%, rgba(255,220,84,0.22), transparent 18%), radial-gradient(circle at 84% 76%, rgba(255,58,45,0.24), transparent 22%)',
        }}
      />

      <div
        style={{
          position: 'absolute',
          top: 144,
          left: 46,
          width: 310,
          height: 490,
          transform: `translateX(${leftPanelX}px) rotate(-4deg)`,
          border: `3px solid ${secondaryAccent}`,
          borderRadius: 28,
          background: 'linear-gradient(180deg, rgba(12,12,20,0.9), rgba(2,3,8,0.74))',
          boxShadow: `0 0 34px ${secondaryAccent}55`,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '24px 24px 10px',
            color: secondaryAccent,
            fontSize: 32,
            letterSpacing: 1.8,
          }}
        >
          LIVE DATA
        </div>
        <div style={{transform: `translateY(${dataShift}px)`}}>
          {[...telemetryRows, ...telemetryRows].map(([label, value, delta], index) => (
            <div
              key={`${label}-${index}`}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 10,
                margin: '10px 18px',
                padding: '15px 16px',
                borderRadius: 16,
                background: index % 2 === 0 ? 'rgba(255,255,255,0.09)' : 'rgba(255,87,34,0.13)',
                border: '1px solid rgba(255,255,255,0.12)',
              }}
            >
              <span style={{fontSize: 24, color: '#ffffff'}}>{label}</span>
              <span style={{fontSize: 24, color: accentColor, textAlign: 'right'}}>{value}</span>
              <span style={{gridColumn: '1 / -1', color: '#ffffffaa', fontSize: 20}}>{delta}</span>
            </div>
          ))}
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          top: 184,
          right: 46,
          width: 330,
          height: 520,
          transform: `translateX(${rightPanelX}px) rotate(4deg)`,
          border: `3px solid ${accentColor}`,
          borderRadius: 28,
          background: 'linear-gradient(180deg, rgba(14,11,16,0.92), rgba(4,4,8,0.82))',
          boxShadow: `0 0 34px ${accentColor}55`,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '24px 24px 10px',
            color: accentColor,
            fontSize: 32,
            letterSpacing: 1.8,
          }}
        >
          TIMING
        </div>
        <div style={{transform: `translateY(${-dataShift}px)`}}>
          {[...gridRows, ...gridRows].map(([pos, code, time], index) => (
            <div
              key={`${pos}-${index}`}
              style={{
                display: 'grid',
                gridTemplateColumns: '58px 1fr',
                gap: 10,
                alignItems: 'center',
                margin: '11px 18px',
                padding: '13px 14px',
                borderRadius: 16,
                background: index % 2 === 0 ? 'rgba(255,255,255,0.10)' : 'rgba(255,218,75,0.12)',
                border: '1px solid rgba(255,255,255,0.12)',
              }}
            >
              <span style={{fontSize: 26, color: secondaryAccent}}>{pos}</span>
              <span style={{fontSize: 30, color: '#ffffff'}}>{code}</span>
              <span style={{gridColumn: '2', color: '#ffffffaa', fontSize: 20}}>{time}</span>
            </div>
          ))}
        </div>
      </div>

      <MiniDataCard
        title="ESTRATÉGIA"
        rows={strategyRows}
        accent={secondaryAccent}
        top={1240}
        left={70}
        rotate={4}
        delay={9}
      />
      <MiniDataCard
        title="GAPS"
        rows={gapRows}
        accent={accentColor}
        top={1304}
        left={700}
        rotate={-5}
        delay={12}
      />

      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          transform: `translateY(${titleY}px)`,
          opacity: titleOpacity,
          textAlign: 'center',
          padding: '0 120px',
        }}
      >
        {brandLogoPath ? (
          <Img
            src={staticFile(brandLogoPath.replace(/^\//, ''))}
            style={{
              width: 260,
              height: 180,
              objectFit: 'contain',
              transform: `scale(${logoScale})`,
              filter: `drop-shadow(0 0 24px ${secondaryAccent}66)`,
              marginBottom: 18,
            }}
          />
        ) : (
          <div
            style={{
              transform: `scale(${logoScale})`,
              fontSize: 58,
              color: secondaryAccent,
              marginBottom: 22,
            }}
          >
            {brandName}
          </div>
        )}
        <div
          style={{
            fontSize: 92,
            lineHeight: 0.86,
            letterSpacing: -1.4,
            textTransform: 'uppercase',
            textShadow: `0 0 22px ${accentColor}88`,
          }}
        >
          {introTitle || 'Radio do Box'}
        </div>
        {introSubtitle ? (
          <div
            style={{
              marginTop: 20,
              padding: '12px 28px',
              borderRadius: 999,
              color: '#070707',
              fontSize: 34,
              textTransform: 'uppercase',
              background: `linear-gradient(90deg, ${secondaryAccent}, ${accentColor})`,
              boxShadow: `0 0 28px ${accentColor}66`,
            }}
          >
            {introSubtitle}
          </div>
        ) : null}
      </div>

      <AbsoluteFill
        style={{
          opacity: flash,
          background: '#fff4d8',
          mixBlendMode: 'screen',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          transform: `translateX(${exitWipe}%) skewX(-14deg)`,
          background: `linear-gradient(90deg, transparent, ${secondaryAccent}, ${accentColor})`,
          boxShadow: `0 0 38px ${accentColor}`,
        }}
      />
    </AbsoluteFill>
  );
};

const MiniDataCard = ({
  title,
  rows,
  accent,
  top,
  left,
  rotate,
  delay,
}: {
  title: string;
  rows: string[][];
  accent: string;
  top: number;
  left: number;
  rotate: number;
  delay: number;
}) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [delay, delay + 9], [0, 0.84], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const y = interpolate(frame, [delay, delay + 12], [38, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        position: 'absolute',
        top,
        left,
        width: 310,
        transform: `translateY(${y}px) rotate(${rotate}deg)`,
        opacity,
        borderRadius: 24,
        border: `2px solid ${accent}`,
        background: 'linear-gradient(180deg, rgba(14,14,22,0.82), rgba(5,5,9,0.72))',
        boxShadow: `0 0 26px ${accent}44`,
        padding: '18px 18px 16px',
      }}
    >
      <div
        style={{
          color: accent,
          fontSize: 28,
          lineHeight: 1,
          letterSpacing: 1.2,
          marginBottom: 12,
        }}
      >
        {title}
      </div>
      <div style={{display: 'flex', flexDirection: 'column', gap: 8}}>
        {rows.map(([label, value]) => (
          <div
            key={`${title}-${label}`}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderRadius: 12,
              background: 'rgba(255,255,255,0.08)',
              padding: '10px 12px',
              fontSize: 22,
              color: '#fff8ea',
            }}
          >
            <span style={{opacity: 0.78}}>{label}</span>
            <span style={{color: accent}}>{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
