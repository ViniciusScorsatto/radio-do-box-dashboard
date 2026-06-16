import {AbsoluteFill, Img, staticFile} from 'remotion';
import {F1Frame, RadioDoBoxMark} from '../components/F1Shared';
import {F1ProductionBed} from '../components/F1ProductionBed';
import {F1_DATA_FONT, F1_DISPLAY_FONT} from '../components/F1Typography';
import type {F1CircuitInsightsStat, F1ThemeConfig} from '../lib/types';

type F1CircuitInsightsCompositionProps = {
  title: string;
  subtitle: string;
  themeConfig: F1ThemeConfig;
  keyPoints: string[];
  stats: F1CircuitInsightsStat[];
  historicalNote: string;
  trackImagePath?: string;
  brandName: string;
  brandLogoPath?: string;
  backgroundImagePath?: string;
  soundtrackPath?: string;
  soundtrackVolume?: number;
  voiceoverPath?: string;
  introTitle?: string;
  introSubtitle?: string;
};

const DISPLAY_FONT = F1_DISPLAY_FONT;
const DATA_FONT = F1_DATA_FONT;

const isUsableCircuitImage = (imagePath?: string) => Boolean(imagePath);

export const F1CircuitInsightsComposition = ({
  title,
  subtitle,
  themeConfig,
  keyPoints,
  stats,
  historicalNote,
  trackImagePath,
  brandName,
  brandLogoPath,
  backgroundImagePath,
  soundtrackPath,
  soundtrackVolume,
  voiceoverPath,
  introTitle,
  introSubtitle,
}: F1CircuitInsightsCompositionProps) => {
  const visiblePoints = keyPoints.slice(0, 4);
  const visibleStats = stats.filter((stat) => stat.label.toLowerCase() !== 'próxima sessão').slice(0, 5);
  const hasCircuitImage = isUsableCircuitImage(trackImagePath);

  return (
    <AbsoluteFill>
      <F1Frame theme={themeConfig} backgroundImagePath={backgroundImagePath}>
        <div
          style={{
            position: 'relative',
            height: '100%',
            padding: '34px 38px 34px',
            display: 'flex',
            flexDirection: 'column',
            fontFamily: DATA_FONT,
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'radial-gradient(circle at 70% 22%, rgba(255,138,61,0.28), transparent 22%), radial-gradient(circle at 30% 72%, rgba(255,227,109,0.13), transparent 24%)',
              pointerEvents: 'none',
            }}
          />

          <div style={{position: 'relative', zIndex: 1}}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 18px 7px',
                borderRadius: 999,
                background: 'rgba(7,7,12,0.72)',
                border: `2px solid ${themeConfig.secondaryAccent}`,
                color: themeConfig.secondaryAccent,
                fontSize: 24,
                fontFamily: DISPLAY_FONT,
                fontWeight: 700,
                lineHeight: 1,
                textTransform: 'uppercase',
                letterSpacing: 0,
              }}
            >
              Guia do Circuito
            </div>
            <div
              style={{
                marginTop: 14,
                color: themeConfig.text,
                fontSize: 86,
                fontFamily: DISPLAY_FONT,
                fontWeight: 900,
                lineHeight: 0.88,
                textTransform: 'uppercase',
                textShadow: `0 0 22px ${themeConfig.accent}55`,
              }}
            >
              {title}
            </div>
              {subtitle &&
              !['guia do circuito', 'circuito insights'].includes(subtitle.toLowerCase()) ? (
                <div
                  style={{
                    marginTop: 8,
                    color: themeConfig.mutedText,
                    fontSize: 30,
                    fontFamily: DATA_FONT,
                    fontWeight: 500,
                    lineHeight: 1,
                    textTransform: 'uppercase',
                  }}
                >
                  {subtitle}
                </div>
              ) : null}
          </div>

          <div
            style={{
              position: 'relative',
              zIndex: 1,
              marginTop: 24,
              borderRadius: 28,
              border: `3px solid ${themeConfig.panelStroke}`,
              background:
                'linear-gradient(180deg, rgba(5,6,12,0.86), rgba(18,6,7,0.92)), radial-gradient(circle at 50% 48%, rgba(255,138,61,0.22), transparent 46%)',
              boxShadow: `0 0 34px ${themeConfig.accent}2f`,
              minHeight: 610,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                position: 'absolute',
                inset: 0,
                opacity: 0.22,
                backgroundImage:
                  'linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(180deg, rgba(255,255,255,0.06) 1px, transparent 1px)',
                backgroundSize: '42px 42px',
              }}
            />
            <div
              style={{
                position: 'absolute',
                top: 22,
                left: 24,
                color: themeConfig.secondaryAccent,
                fontSize: 28,
                lineHeight: 1,
                textTransform: 'uppercase',
                letterSpacing: 1.1,
              }}
            >
              Mapa do traçado
            </div>
            {hasCircuitImage ? (
              <Img
                src={staticFile(trackImagePath!.replace(/^\//, ''))}
                style={{
                  position: 'absolute',
                  inset: '72px 34px 76px',
                  width: 'calc(100% - 68px)',
                  height: 'calc(100% - 148px)',
                  objectFit: 'contain',
                  filter: `drop-shadow(0 0 24px ${themeConfig.secondaryAccent}55)`,
                }}
              />
            ) : (
              <CircuitFallback theme={themeConfig} />
            )}
            <div
              style={{
                position: 'absolute',
                left: 24,
                right: 24,
                bottom: 18,
                padding: '14px 18px 12px',
                borderRadius: 18,
                background: 'rgba(5,6,12,0.82)',
                border: `2px solid ${themeConfig.secondaryAccent}80`,
                color: themeConfig.text,
                fontSize: 30,
                lineHeight: 1,
                textTransform: 'uppercase',
              }}
            >
              {historicalNote}
            </div>
          </div>

          <div
            style={{
              position: 'relative',
              zIndex: 1,
              display: 'grid',
              gridTemplateColumns: 'repeat(5, 1fr)',
              gap: 12,
              marginTop: 18,
            }}
          >
            {visibleStats.map((stat) => (
              <div
                key={`${stat.label}-${stat.value}`}
                style={{
                  minHeight: 112,
                  borderRadius: 18,
                  border: `2px solid ${themeConfig.panelStroke}`,
                  background: themeConfig.panelFill,
                  padding: '12px 14px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                <div
                  style={{
                    color: themeConfig.secondaryAccent,
                    fontSize: 18,
                    lineHeight: 1,
                    textTransform: 'uppercase',
                    letterSpacing: 0.8,
                  }}
                >
                  {stat.label}
                </div>
                <div
                  style={{
                    color: themeConfig.text,
                    fontSize: 25,
                    lineHeight: 1.02,
                    textTransform: 'uppercase',
                  }}
                >
                  {stat.value}
                </div>
              </div>
            ))}
          </div>

          <div
            style={{
              position: 'relative',
              zIndex: 1,
              marginTop: 18,
              borderRadius: 24,
              border: `2px solid ${themeConfig.panelStroke}`,
              background: themeConfig.panelFill,
              padding: '18px 20px',
            }}
          >
            <div
              style={{
                color: themeConfig.secondaryAccent,
                fontSize: 30,
                lineHeight: 1,
                textTransform: 'uppercase',
                marginBottom: 12,
              }}
            >
              Pontos-chave
            </div>
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 18px'}}>
              {visiblePoints.map((point, index) => (
                <div
                  key={`${index}-${point}`}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '28px minmax(0, 1fr)',
                    gap: 8,
                    color: themeConfig.text,
                    fontSize: 24,
                    lineHeight: 1.1,
                    textTransform: 'uppercase',
                  }}
                >
                  <span style={{color: themeConfig.secondaryAccent}}>•</span>
                  <span>{point}</span>
                </div>
              ))}
            </div>
          </div>

          <div
            style={{
              marginTop: 'auto',
              position: 'relative',
              zIndex: 1,
              display: 'flex',
              justifyContent: 'flex-end',
              transform: 'scale(0.34)',
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

const CircuitFallback = ({theme}: {theme: F1ThemeConfig}) => (
  <div
    style={{
      position: 'absolute',
      inset: '92px 56px 96px',
      display: 'grid',
      placeItems: 'center',
    }}
  >
    <svg viewBox="0 0 760 420" style={{width: '100%', height: '100%', overflow: 'visible'}}>
      <path
        d="M112 260 C112 150 210 92 302 128 C398 166 348 266 462 250 C610 230 674 338 558 374 C460 404 414 326 318 336 C214 348 112 338 112 260Z"
        fill="none"
        stroke="rgba(255,255,255,0.18)"
        strokeWidth="46"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M112 260 C112 150 210 92 302 128 C398 166 348 266 462 250 C610 230 674 338 558 374 C460 404 414 326 318 336 C214 348 112 338 112 260Z"
        fill="none"
        stroke={theme.secondaryAccent}
        strokeWidth="14"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="78 28"
      />
      <circle cx="112" cy="260" r="20" fill={theme.accent} />
      <text x="104" y="224" fill={theme.text} fontSize="34" fontFamily="Barlow Condensed">
        START
      </text>
    </svg>
    <div
      style={{
        position: 'absolute',
        bottom: -18,
        color: theme.mutedText,
        fontSize: 22,
        lineHeight: 1,
        textTransform: 'uppercase',
        opacity: 0.72,
      }}
    >
      Imagem oficial indisponível
    </div>
  </div>
);
