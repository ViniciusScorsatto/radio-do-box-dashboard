import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {F1Frame, RadioDoBoxMark} from '../components/F1Shared';
import {F1ProductionBed} from '../components/F1ProductionBed';
import {F1_DATA_FONT, F1_DISPLAY_FONT} from '../components/F1Typography';
import type {F1ThemeConfig} from '../lib/types';

export type F1EditorialCompositionProps = {
  title: string;
  subtitle: string;
  themeConfig: F1ThemeConfig;
  headline: string;
  deck?: string;
  body?: string;
  sourceLabel: string;
  articleUrl: string;
  brandName: string;
  brandLogoPath?: string;
  soundtrackPath?: string;
  soundtrackVolume?: number;
  voiceoverPath?: string;
  introTitle?: string;
  introSubtitle?: string;
  backgroundImagePath?: string;
};

export const F1EditorialComposition = ({
  themeConfig,
  headline,
  deck,
  body,
  sourceLabel,
  brandName,
  brandLogoPath,
  soundtrackPath,
  soundtrackVolume,
  voiceoverPath,
  backgroundImagePath,
}: F1EditorialCompositionProps) => {
  const frame = useCurrentFrame();
  const reveal = interpolate(frame, [0, 28], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill>
      <F1Frame theme={themeConfig} backgroundImagePath={backgroundImagePath}>
        <div style={{position: 'absolute', inset: 0, padding: '48px 42px', display: 'flex', flexDirection: 'column', gap: 28, fontFamily: F1_DATA_FONT, opacity: reveal}}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <div style={{fontSize: 24, letterSpacing: 4, fontWeight: 800, color: themeConfig.accent}}>NOTÍCIA OFICIAL</div>
            <div style={{fontSize: 20, letterSpacing: 1.5, color: themeConfig.mutedText}}>{sourceLabel}</div>
          </div>
          <div style={{height: 10, background: `linear-gradient(90deg, ${themeConfig.accent}, ${themeConfig.secondaryAccent}, transparent)`, transform: 'skewX(-18deg)'}} />
          <div style={{fontFamily: F1_DISPLAY_FONT, fontSize: 76, lineHeight: 0.92, fontWeight: 900, textTransform: 'uppercase', letterSpacing: -1, maxWidth: 930}}>{headline}</div>
          {deck ? <div style={{fontSize: 31, lineHeight: 1.12, fontWeight: 700, color: themeConfig.secondaryAccent, maxWidth: 900}}>{deck}</div> : null}
          <div style={{marginTop: 8, padding: '28px 26px', border: `1px solid ${themeConfig.panelStroke}`, background: themeConfig.panelFill, boxShadow: `0 16px 40px ${themeConfig.accent}22`}}>
            <div style={{fontSize: 24, lineHeight: 1.25, color: themeConfig.text}}>{body?.slice(0, 420) || 'Roteiro baseado na publicação oficial.'}</div>
            <div style={{marginTop: 24, fontSize: 19, color: themeConfig.mutedText}}>Fonte: {sourceLabel}</div>
          </div>
          <div style={{marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'end'}}>
            <RadioDoBoxMark theme={themeConfig} logoPath={brandLogoPath} />
            <div style={{fontSize: 18, color: themeConfig.mutedText, maxWidth: 430, textAlign: 'right'}}>Conteúdo editorial oficial • confira o link da matéria na descrição</div>
          </div>
        </div>
      </F1Frame>
      <F1ProductionBed theme={themeConfig} brandName={brandName} brandLogoPath={brandLogoPath} soundtrackPath={soundtrackPath} soundtrackVolume={soundtrackVolume} voiceoverPath={voiceoverPath} />
    </AbsoluteFill>
  );
};
