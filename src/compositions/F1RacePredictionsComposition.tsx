import {AbsoluteFill, Img, staticFile} from 'remotion';
import {F1Frame, RadioDoBoxMark} from '../components/F1Shared';
import {F1ProductionBed} from '../components/F1ProductionBed';
import {F1_DATA_FONT, F1_DISPLAY_FONT} from '../components/F1Typography';
import type {
  F1PredictionAuthor,
  F1RacePredictionType,
  F1RankingEntry,
  F1ThemeConfig,
} from '../lib/types';

type F1RacePredictionsCompositionProps = {
  title: string;
  subtitle: string;
  raceName?: string;
  predictionType: F1RacePredictionType;
  predictionAuthor: F1PredictionAuthor;
  authorName: string;
  authorImagePath: string;
  themeConfig: F1ThemeConfig;
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

const DISPLAY_FONT = F1_DISPLAY_FONT;
const DATA_FONT = F1_DATA_FONT;

const typeLabel = (type: F1RacePredictionType) =>
  type === 'qualifying' ? 'CLASSIFICAÇÃO' : 'CORRIDA';

const isEmeAuthor = (author: F1PredictionAuthor) => author === 'eme' || author === 'emeline';

const assetSrc = (path?: string) => (path ? staticFile(path.replace(/^\//, '')) : undefined);

const predictionIconPath = (author: F1PredictionAuthor) =>
  isEmeAuthor(author)
    ? '/branding/radio-do-box/icons/prediction-flags.png'
    : '/branding/radio-do-box/icons/prediction-microphone.png';

const hostPalette = (author: F1PredictionAuthor, theme: F1ThemeConfig) =>
  isEmeAuthor(author)
    ? {
        accent: '#039BE5',
        secondaryAccent: '#18E4FF',
        glow: 'rgba(24, 228, 255, 0.48)',
        panel: 'rgba(4, 18, 36, 0.92)',
        panelMid: 'rgba(0, 92, 138, 0.72)',
        backdrop:
          'linear-gradient(180deg, rgba(3,11,20,0.18), rgba(0,0,0,0.68)), radial-gradient(circle at 12% 18%, rgba(24,228,255,0.30), transparent 24%), radial-gradient(circle at 78% 18%, rgba(3,155,229,0.18), transparent 28%), repeating-linear-gradient(115deg, rgba(255,255,255,0.035) 0 2px, transparent 2px 34px)',
        footer: '#18E4FF',
      }
    : {
        accent: theme.accent,
        secondaryAccent: theme.secondaryAccent,
        glow: `${theme.accent}66`,
        panel: 'rgba(7,7,10,0.92)',
        panelMid: 'rgba(55,13,8,0.88)',
        backdrop:
          'linear-gradient(180deg, rgba(5,5,8,0.28), rgba(0,0,0,0.7)), repeating-linear-gradient(115deg, rgba(255,255,255,0.045) 0 2px, transparent 2px 34px)',
        footer: theme.secondaryAccent,
      };

export const F1RacePredictionsComposition = ({
  title,
  subtitle,
  raceName,
  predictionType,
  predictionAuthor,
  authorName,
  authorImagePath,
  themeConfig,
  entries,
  brandName,
  brandLogoPath,
  backgroundImagePath,
  soundtrackPath,
  soundtrackVolume,
  voiceoverPath,
  introTitle,
  introSubtitle,
}: F1RacePredictionsCompositionProps) => {
  const topTen = entries.slice(0, 10);
  const podium = topTen.slice(0, 3);
  const remaining = topTen.slice(3);
  const label = typeLabel(predictionType);
  const compactRaceName = raceName || subtitle;
  const palette = hostPalette(predictionAuthor, themeConfig);

  return (
    <AbsoluteFill>
      <F1Frame theme={themeConfig} backgroundImagePath={backgroundImagePath}>
        <div
          style={{
            position: 'relative',
            height: '100%',
            padding: '58px 64px 72px',
            overflow: 'hidden',
            fontFamily: DISPLAY_FONT,
          }}
        >
          <PredictionBackdrop palette={palette} />

          <div style={{position: 'relative', zIndex: 2, height: '100%'}}>
            <HostHero
              authorName={authorName}
              imagePath={authorImagePath}
              author={predictionAuthor}
              palette={palette}
            />
            <header
              style={{
                position: 'relative',
                zIndex: 4,
                marginLeft: 326,
                paddingTop: 132,
                minHeight: 270,
              }}
            >
              <div>
                <div
                  style={{
                    marginTop: 0,
                    fontSize: 78,
                    lineHeight: 0.9,
                    fontWeight: 900,
                    color: themeConfig.text,
                    textTransform: 'uppercase',
                    letterSpacing: 0,
                    textShadow: '0 12px 28px rgba(0,0,0,0.55)',
                  }}
                >
                  PALPITES {label}
                </div>
                <div
                  style={{
                    marginTop: 8,
                    fontFamily: DATA_FONT,
                    fontSize: 25,
                    lineHeight: 1.1,
                    fontWeight: 500,
                    color: themeConfig.mutedText,
                    textTransform: 'uppercase',
                    letterSpacing: 0,
                  }}
                >
                  {compactRaceName}
                </div>
              </div>
            </header>

            <section
              style={{
                position: 'absolute',
                top: 356,
                left: 0,
                right: 0,
                zIndex: 3,
                display: 'grid',
                gridTemplateColumns: '0.96fr 1.1fr 0.96fr',
                gap: 14,
                alignItems: 'end',
              }}
            >
              {[podium[1], podium[0], podium[2]].filter(Boolean).map((entry) => (
                <TopDriverCard key={`${entry.position}-${entry.name}`} entry={entry} />
              ))}
            </section>

            <section
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: 730,
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              {remaining.map((entry) => (
                <PredictionRow key={`${entry.position}-${entry.name}`} entry={entry} />
              ))}
            </section>

            <div
              style={{
                position: 'absolute',
                right: -16,
                bottom: -4,
                transform: 'scale(0.68)',
                transformOrigin: 'right bottom',
              }}
            >
              <RadioDoBoxMark theme={themeConfig} logoPath={brandLogoPath} />
            </div>
            <PredictionTypeFooter label={label} raceName={compactRaceName} theme={themeConfig} palette={palette} />
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

const PredictionBackdrop = ({palette}: {palette: ReturnType<typeof hostPalette>}) => (
  <>
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: palette.backdrop,
      }}
    />
    <div
      style={{
        position: 'absolute',
        left: -80,
        right: -80,
        top: 196,
        height: 12,
        background: `linear-gradient(90deg, transparent, ${palette.accent}, ${palette.secondaryAccent}, transparent)`,
        boxShadow: `0 0 28px ${palette.glow}`,
        transform: 'skewY(-7deg)',
      }}
    />
    <div
      style={{
        position: 'absolute',
        left: -140,
        right: -120,
        bottom: 96,
        height: 86,
        background:
          `linear-gradient(90deg, transparent 0 14%, ${palette.accent}88 14% 26%, ${palette.secondaryAccent}66 26% 30%, transparent 30% 100%)`,
        transform: 'skewY(-8deg)',
      }}
    />
  </>
);

const HostHero = ({
  authorName,
  imagePath,
  author,
  palette,
}: {
  authorName: string;
  imagePath: string;
  author: F1PredictionAuthor;
  palette: ReturnType<typeof hostPalette>;
}) => (
  <div
    style={{
      position: 'absolute',
      top: -34,
      left: -124,
      width: 972,
      height: 820,
      overflow: 'visible',
      zIndex: 2,
      pointerEvents: 'none',
    }}
  >
    <div
      style={{
        position: 'absolute',
        top: -130,
        left: -18,
        width: 670,
        height: 760,
        overflow: 'visible',
        WebkitMaskImage: 'linear-gradient(180deg, #000 0%, #000 68%, rgba(0,0,0,0.72) 80%, transparent 100%)',
        maskImage: 'linear-gradient(180deg, #000 0%, #000 68%, rgba(0,0,0,0.72) 80%, transparent 100%)',
      }}
    >
      <Img
        src={assetSrc(imagePath)}
        style={{
          position: 'absolute',
          top: 30,
          left: isEmeAuthor(author) ? -34 : -10,
          width: isEmeAuthor(author) ? 596 : 564,
          height: isEmeAuthor(author) ? 894 : 846,
          objectFit: 'contain',
          objectPosition: 'left top',
          filter: `drop-shadow(0 18px 26px rgba(0,0,0,0.75)) drop-shadow(0 0 22px ${palette.accent}80)`,
          WebkitMaskImage:
            'linear-gradient(90deg, #000 0%, #000 58%, rgba(0,0,0,0.64) 76%, transparent 100%)',
          maskImage:
            'linear-gradient(90deg, #000 0%, #000 58%, rgba(0,0,0,0.64) 76%, transparent 100%)',
        }}
      />
    </div>
    <div
      style={{
        position: 'absolute',
        left: 350,
        top: 72,
        width: 300,
        height: 86,
        padding: '0 26px',
        display: 'flex',
        alignItems: 'center',
        border: `3px solid ${palette.secondaryAccent}`,
        background: `linear-gradient(90deg, ${palette.panel}, ${palette.panelMid}, ${palette.panel})`,
        boxShadow: `0 0 24px ${palette.glow}`,
        transform: 'skewX(-12deg)',
      }}
    >
      <div
        style={{
          marginRight: 18,
          width: 46,
          height: 46,
          display: 'grid',
          placeItems: 'center',
          transform: 'skewX(12deg)',
        }}
      >
        <Img
          src={assetSrc(predictionIconPath(author))}
          style={{
            width: isEmeAuthor(author) ? 44 : 36,
            height: isEmeAuthor(author) ? 44 : 36,
            objectFit: 'contain',
            filter: `drop-shadow(0 0 10px ${isEmeAuthor(author) ? palette.secondaryAccent : palette.accent}aa)`,
          }}
        />
      </div>
      <div
        style={{
          fontSize: 58,
          lineHeight: 1,
          fontWeight: 900,
          color: '#fff',
          fontFamily: DISPLAY_FONT,
          textTransform: 'uppercase',
          textShadow: `0 0 18px ${palette.glow}`,
          transform: 'skewX(12deg)',
          letterSpacing: 0,
        }}
      >
        {authorName}
      </div>
    </div>
  </div>
);

const TopDriverCard = ({entry}: {entry: F1RankingEntry}) => {
  const accent = entry.accentColor ?? entry.badge.accentColor ?? '#E10600';
  const isWinner = entry.position === 1;
  const src = assetSrc(entry.badge.imagePath);

  return (
    <div
      style={{
        height: isWinner ? 364 : 318,
        position: 'relative',
        border: `3px solid ${isWinner ? '#fff' : accent}`,
        background: `linear-gradient(180deg, ${accent}cc, rgba(10,10,14,0.95) 68%)`,
        overflow: 'hidden',
        boxShadow: `0 0 28px ${accent}55`,
        transform: 'skewX(-5deg)',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 12,
          left: 18,
          fontSize: isWinner ? 118 : 96,
          lineHeight: 0.85,
          fontWeight: 900,
          fontFamily: DISPLAY_FONT,
          color: 'rgba(255,255,255,0.92)',
          letterSpacing: 0,
          transform: 'skewX(5deg)',
        }}
      >
        {entry.position}
      </div>
      {src ? (
        <Img
          src={src}
          style={{
            position: 'absolute',
            left: '50%',
            bottom: 84,
            width: isWinner ? 252 : 218,
            height: isWinner ? 250 : 216,
            objectFit: 'contain',
            transform: 'translateX(-50%) skewX(5deg)',
            filter: 'drop-shadow(0 18px 22px rgba(0,0,0,0.55))',
          }}
        />
      ) : null}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          minHeight: 88,
          padding: '10px 14px',
          background: 'linear-gradient(180deg, rgba(8,8,12,0.86), rgba(3,3,6,0.98))',
          transform: 'skewX(5deg)',
        }}
      >
        <div
          style={{
            fontSize: isWinner ? 27 : 24,
            lineHeight: 1,
            fontWeight: 600,
            fontFamily: DATA_FONT,
            color: '#fff',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            letterSpacing: 0,
          }}
        >
          {entry.name}
        </div>
        <div
          style={{
            marginTop: 6,
            fontFamily: DATA_FONT,
            fontSize: 16,
            lineHeight: 1,
            fontWeight: 600,
            color: accent,
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            letterSpacing: 0,
          }}
        >
          {entry.team || entry.badge.sublabel}
        </div>
      </div>
    </div>
  );
};

const PredictionRow = ({entry}: {entry: F1RankingEntry}) => {
  const accent = entry.accentColor ?? entry.badge.accentColor ?? '#E10600';
  const logoSrc = assetSrc(entry.badge.logoPath);
  const driverSrc = assetSrc(entry.badge.imagePath);

  return (
    <div
      style={{
        height: 100,
        display: 'grid',
        gridTemplateColumns: '64px 86px minmax(0, 1fr) 116px',
        alignItems: 'center',
        gap: 12,
        padding: '0 18px',
        borderLeft: `8px solid ${accent}`,
        borderTop: '1px solid rgba(255,255,255,0.12)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        background: 'linear-gradient(90deg, rgba(18,18,24,0.96), rgba(8,8,13,0.92))',
      }}
    >
      <div
        style={{
          fontSize: 40,
          fontWeight: 900,
          fontFamily: DISPLAY_FONT,
          color: '#fff',
          letterSpacing: 0,
        }}
      >
        {entry.position}
      </div>
      <div
        style={{
          width: 70,
          height: 76,
          display: 'grid',
          placeItems: 'center',
          background: `${accent}26`,
          border: `1px solid ${accent}aa`,
          overflow: 'hidden',
        }}
      >
        {driverSrc ? (
          <Img
            src={driverSrc}
            style={{
              width: 70,
              height: 76,
              objectFit: 'contain',
              objectPosition: 'center bottom',
              filter: 'drop-shadow(0 8px 10px rgba(0,0,0,0.52))',
            }}
          />
        ) : (
          <span style={{fontSize: 22, fontWeight: 900, color: accent}}>{entry.badge.label}</span>
        )}
      </div>
      <div style={{minWidth: 0}}>
        <div
          style={{
            fontSize: 32,
            lineHeight: 1,
            fontWeight: 600,
            fontFamily: DATA_FONT,
            color: '#fff',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            letterSpacing: 0,
          }}
        >
          {entry.name}
        </div>
        <div
          style={{
            marginTop: 7,
            fontFamily: DATA_FONT,
            fontSize: 18,
            lineHeight: 1,
            fontWeight: 600,
            color: accent,
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            letterSpacing: 0,
          }}
        >
          {entry.team || entry.badge.sublabel}
        </div>
      </div>
      <div
        style={{
          justifySelf: 'end',
          width: 82,
          height: 52,
          display: 'grid',
          placeItems: 'center',
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.14)',
        }}
      >
        {logoSrc ? (
          <Img src={logoSrc} style={{maxWidth: 64, maxHeight: 40, objectFit: 'contain'}} />
        ) : (
          <span
            style={{
              fontFamily: DATA_FONT,
              fontSize: 20,
              fontWeight: 700,
              color: '#d9d9df',
              textTransform: 'uppercase',
              letterSpacing: 0,
            }}
          >
            {entry.badge.label}
          </span>
        )}
      </div>
    </div>
  );
};

const PredictionTypeFooter = ({
  label,
  raceName,
  theme,
  palette,
}: {
  label: string;
  raceName: string;
  theme: F1ThemeConfig;
  palette: ReturnType<typeof hostPalette>;
}) => (
  <div
    style={{
      position: 'absolute',
      left: 4,
      right: 300,
      bottom: 16,
      color: '#fff',
      textTransform: 'uppercase',
      textShadow: '0 10px 22px rgba(0,0,0,0.85)',
    }}
  >
    <div
      style={{
        fontFamily: DATA_FONT,
        fontSize: 30,
        lineHeight: 1,
        fontWeight: 900,
        color: '#fff',
        letterSpacing: 0,
      }}
    >
      PALPITES
    </div>
    <div
      style={{
        marginTop: 2,
        fontSize: 70,
        lineHeight: 0.9,
        fontWeight: 900,
        color: palette.footer,
        letterSpacing: 0,
      }}
    >
      {label}
    </div>
    <div
      style={{
        marginTop: 6,
        fontSize: 38,
        lineHeight: 0.95,
        fontWeight: 900,
        color: '#fff',
        letterSpacing: 0,
      }}
    >
      {raceName}
    </div>
  </div>
);
