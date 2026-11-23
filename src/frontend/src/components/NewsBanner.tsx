/**
 * @file NewsBanner.tsx
 * @description Ylänavigaation alapuolella näytettävä Xamk-henkinen Hero- ja tiedotebanneri.
 * Hakee viimeisimmät tiedotteet palvelimelta ja nostaa kiinnitetyn (`isPinned`) tai
 * uusimman tiedotteen esiin aukioloaikojen yhteyteen.
 */
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { useLanguage } from '../context/LanguageContext';

/**
 * Xamkin visuaalisen ilmeen mukainen keltainen X-tunnusmerkki (SVG).
 */
const XamkXEmblem: React.FC = () => (
  <svg
    viewBox="0 0 64 64"
    width="54"
    height="54"
    aria-hidden="true"
    className="shrink-0"
  >
    <path
      d="M6 6 H25 L32 13 L39 6 H58 V25 L51 32 L58 39 V58 H39 L32 51 L25 58 H6 V39 L13 32 L6 25 Z"
      fill="none"
      stroke="#FACC15"
      strokeWidth="3.2"
      strokeLinejoin="miter"
    />
  </svg>
);

/**
 * Tervetulo- ja uutisbannerikomponentti.
 */
export const NewsBanner: React.FC = () => {
  const { lang, t } = useLanguage();
  const isEn = lang === 'en';

  // Haetaan uutis- ja tiedotelista taustajärjestelmästä
  const { data: newsList } = useQuery({
    queryKey: ['news'],
    queryFn: () => api.getNews(),
  });

  // Valitaan ensisijaisesti kiinnitetty tiedote tai listan ensimmäinen tiedote
  const pinnedNews = newsList?.find((n) => n.isPinned) || newsList?.[0];

  return (
    <section className="bg-[#121417] text-[#F4F4F5] border-b-2 border-black" aria-label={isEn ? 'Welcome banner' : 'Tervetulobanneri'}>
      <div className="bg-[#1C1F24] border-b border-[#3F444E]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          {/* Left: Xamk Highlighted Headline Strips */}
          {/* Vasen puoli: Xamk-korostuspalkit pääotsikolle */}
          <div className="flex flex-col items-start">
            <h1 className="bg-[#FACC15] text-[#09090B] border-[3px] border-black shadow-[6px_6px_0px_#000000] -rotate-1 inline-block px-6 py-3 rounded-none font-extrabold uppercase tracking-tight text-2xl sm:text-3xl lg:text-4xl leading-tight">
              <span className="block">
                {isEn ? 'Welcome to Xamk' : 'Tervetuloa Xamk'}
              </span>
              <span className="block">
                {isEn ? 'Game Room' : 'Game Roomiin'}
              </span>
            </h1>
          </div>

          {/* Right: Black Floating Info Box with Xamk X Emblem */}
          {/* Oikea puoli: kelluva musta infolaatikko X-logolla, aukioloajoilla ja tiedotteella */}
          <div className="rounded-none bg-[#1C1F24] text-[#F4F4F5] border-2 border-[#3F444E] shadow-[4px_4px_0px_#000000] p-5 flex items-center gap-4 max-w-xl w-full">
            <div className="shrink-0">
              <XamkXEmblem />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="font-extrabold uppercase tracking-tight text-base sm:text-lg text-[#FACC15]">
                {isEn
                  ? 'Opening hours Mon-Fri 08:00-18:00'
                  : 'Aukioloajat ma-pe klo 08:00-18:00'}
              </h2>
              <p className="font-mono text-xs sm:text-sm text-[#F4F4F5] mt-1">
                {pinnedNews && !pinnedNews.title.includes('Tervetuloa Xamk Game Roomiin')
                  ? pinnedNews.title
                  : t('landing.subtitle')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
