/**
 * @file OpeningHoursWidget.tsx
 * @description Yläpalkkiin sijoitettava aukioloaika- ja tiedotekomponentti,
 * joka sisältää 3D-syvyydellä pyörivän Xamk X -tunnusmerkin (`XamkXEmblem3D`),
 * pelihuoneen aukioloajat sekä kiinnitetyn tai uusimman tiedotteen.
 */
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { useLanguage } from '../context/LanguageContext';
import type { NewsItem } from '../types';

/**
 * Xamk X -tunnusmerkin SVG-polku (`viewBox="0 0 64 64"`).
 */
const XAMK_X_PATH =
  'M6 6 H25 L32 13 L39 6 H58 V25 L51 32 L58 39 V58 H39 L32 51 L25 58 H6 V39 L13 32 L6 25 Z';

/**
 * Yksittäisen 3D-syvyyskerroksen määrittely Xamk X -logolle.
 */
interface XamkXLayer {
  /** Syvyysakselin siirtymä pikseleinä (`translateZ`) */
  zOffsetPx: number;
  /** Kerroksen viivaväri (etu- ja takapinta kirkas keltainen, välikerrokset tummempaa kultaa) */
  stroke: string;
}

/**
 * 7 syvyyskerrosta, jotka luovat Xamk X -logolle aidon 3D-paksuuden sen pyöriessä Y-akselin ympäri.
 */
const XAMK_X_LAYERS: readonly XamkXLayer[] = [
  { zOffsetPx: -3, stroke: '#FACC15' },
  { zOffsetPx: -2, stroke: '#CA8A04' },
  { zOffsetPx: -1, stroke: '#A16207' },
  { zOffsetPx: 0, stroke: '#A16207' },
  { zOffsetPx: 1, stroke: '#A16207' },
  { zOffsetPx: 2, stroke: '#CA8A04' },
  { zOffsetPx: 3, stroke: '#FACC15' },
];

/**
 * XamkXEmblem3D-komponentin ominaisuudet (props).
 */
interface XamkXEmblem3DProps {
  /** Logon leveys ja korkeus pikseleinä (oletus 34 px) */
  size?: number;
}

/**
 * Puhtaalla CSS 3D -tekniikalla pyörivä Xamk X -tunnusmerkki, jossa on monikerroksinen 3D-syvyys.
 * Kunnioittaa selaimen `prefers-reduced-motion: reduce` -asetusta.
 */
export const XamkXEmblem3D: React.FC<XamkXEmblem3DProps> = ({ size = 34 }) => {
  return (
    <div
      className="xamk-x-3d-scene shrink-0"
      style={{ width: `${size}px`, height: `${size}px` }}
      aria-hidden="true"
    >
      <div
        className="xamk-x-3d-spinner"
        style={{ width: `${size}px`, height: `${size}px` }}
      >
        {XAMK_X_LAYERS.map((layer) => (
          <svg
            key={layer.zOffsetPx}
            viewBox="0 0 64 64"
            width={size}
            height={size}
            className="xamk-x-3d-layer"
            style={{ transform: `translateZ(${layer.zOffsetPx}px)` }}
            aria-hidden="true"
          >
            <path
              d={XAMK_X_PATH}
              fill="none"
              stroke={layer.stroke}
              strokeWidth="3.4"
              strokeLinejoin="miter"
            />
          </svg>
        ))}
      </div>
    </div>
  );
};

/**
 * OpeningHoursWidget-komponentin ominaisuudet (props).
 */
export interface OpeningHoursWidgetProps {
  /** Valinnainen klikkauskäsittelijä tiedotetekstille (esim. vieritys tiedoteosioon) */
  onNewsClick?: () => void;
  /** Käytetäänkö tiiviimpää mobiilinauhan esitystapaa */
  compact?: boolean;
  /** Valinnaiset lisäluokat ulkokehykselle */
  className?: string;
}

/**
 * Yläpalkin aukioloaika- ja tiedoteikkuna 3D-pyörivällä Xamk X -logolla.
 */
export const OpeningHoursWidget: React.FC<OpeningHoursWidgetProps> = ({
  onNewsClick,
  compact = false,
  className = '',
}) => {
  const { lang, t } = useLanguage();
  const isEn = lang === 'en';

  // Haetaan uutis- ja tiedotelista taustajärjestelmästä React Query -välimuistilla
  const { data: newsList } = useQuery<NewsItem[]>({
    queryKey: ['news'],
    queryFn: () => api.getNews(),
  });

  // Valitaan ensisijaisesti kiinnitetty tiedote tai listan uusin tiedote
  const pinnedNews: NewsItem | undefined =
    newsList?.find((item) => item.isPinned) ?? newsList?.[0];

  const hasVisibleNews: boolean = Boolean(
    pinnedNews && !pinnedNews.title.includes('Tervetuloa Xamk Game Roomiin')
  );

  const subtitleText: string =
    hasVisibleNews && pinnedNews ? pinnedNews.title : t('landing.subtitle');

  const openingHoursLabel: string = isEn
    ? 'Opening hours Mon-Fri 08:00-18:00'
    : 'Aukioloajat ma-pe klo 08:00-18:00';

  const containerClassName: string = compact
    ? `flex items-center gap-2.5 min-w-0 w-full ${className}`.trim()
    : `rounded-none bg-[#1C1F24] border border-[#3F444E] shadow-[2px_2px_0px_#000000] px-3 py-1.5 flex items-center gap-3 min-w-0 max-w-lg w-full ${className}`.trim();

  return (
    <div
      className={containerClassName}
      aria-label={isEn ? 'Opening hours and announcements' : 'Aukioloajat ja tiedotteet'}
    >
      <XamkXEmblem3D size={compact ? 26 : 34} />

      <div className="min-w-0 flex-1 leading-tight">
        <p
          className={
            compact
              ? 'text-[11px] font-extrabold uppercase tracking-tight text-[#FACC15] truncate'
              : 'text-[11px] xl:text-xs font-extrabold uppercase tracking-tight text-[#FACC15] truncate'
          }
        >
          {openingHoursLabel}
        </p>

        {onNewsClick && hasVisibleNews ? (
          <button
            type="button"
            className="block w-full text-left font-mono text-[11px] text-[#D4D4D8] hover:text-[#FACC15] truncate cursor-pointer bg-transparent border-0 p-0 mt-0.5 transition-colors"
            onClick={onNewsClick}
            title={
              isEn
                ? 'Click to view announcements'
                : 'Klikkaa siirtyäksesi tiedotteisiin'
            }
          >
            {subtitleText}
          </button>
        ) : (
          <p
            className="font-mono text-[11px] text-[#D4D4D8] truncate mt-0.5"
            title={subtitleText}
          >
            {subtitleText}
          </p>
        )}
      </div>
    </div>
  );
};
