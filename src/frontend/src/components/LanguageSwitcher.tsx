/**
 * @file LanguageSwitcher.tsx
 * @description Kompakti kielivalitsinkomponentti (Suomi / English), joka näyttää
 * valitun kielen lipun (SVG) ja tekstin sekä vaihtaa kielen klikattaessa.
 */
import React from 'react';
import { useLanguage } from '../context/LanguageContext';

/**
 * LanguageSwitcher-komponentin ominaisuudet (props).
 */
interface LanguageSwitcherProps {
  /** Valinnainen CSS-lisäluokka ulommalle ryhmäelementille */
  className?: string;
}

/**
 * Suomen lipun SVG-ikonikomponentti.
 */
const FinlandFlag: React.FC = () => (
  <svg
    viewBox="0 0 18 11"
    width="16"
    height="11"
    aria-hidden="true"
    className="inline-block shrink-0 rounded-none border border-black"
  >
    <rect width="18" height="11" fill="#ffffff" />
    <rect width="18" height="3" y="4" fill="#003580" />
    <rect width="3" height="11" x="5" fill="#003580" />
  </svg>
);

/**
 * Yhdistyneen kuningaskunnan (UK) lipun SVG-ikonikomponentti englannin kielelle.
 */
const UKFlag: React.FC = () => (
  <svg
    viewBox="0 0 60 30"
    width="16"
    height="11"
    aria-hidden="true"
    className="inline-block shrink-0 rounded-none border border-black"
  >
    <clipPath id="uk-flag-clip">
      <path d="M0,0 v30 h60 v-30 z" />
    </clipPath>
    <g clipPath="url(#uk-flag-clip)">
      <path d="M0,0 v30 h60 v-30 z" fill="#012169" />
      <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6" />
      <path d="M0,0 L60,30 M60,0 L0,30" stroke="#C8102E" strokeWidth="4" />
      <path d="M30,0 v30 M0,15 h60" stroke="#fff" strokeWidth="10" />
      <path d="M30,0 v30 M0,15 h60" stroke="#C8102E" strokeWidth="6" />
    </g>
  </svg>
);

/**
 * Kielivalitsin, joka vaihtaa sovelluksen kielen suomen ('fi') ja englannin ('en') välillä.
 */
export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ className = '' }) => {
  const { lang, setLang } = useLanguage();

  // Vaihtaa kielen vastakkaiseksi nykyisestä valinnasta
  const toggleLanguage = () => {
    setLang(lang === 'fi' ? 'en' : 'fi');
  };

  return (
    <div
      className={`inline-flex items-center ${className}`}
      role="group"
      aria-label="Kielivalitsin / Language selector"
    >
      <button
        type="button"
        className="rounded-none inline-flex items-center gap-2 px-3 py-2 min-h-[40px] bg-[#1C1F24] text-[#F4F4F5] border-2 border-black shadow-[3px_3px_0px_#000000] font-mono font-bold text-xs uppercase tracking-wider cursor-pointer hover:bg-[#FACC15] hover:text-[#09090B] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_#000000] transition-colors"
        onClick={toggleLanguage}
        title={lang === 'fi' ? 'Switch to English' : 'Vaihda kieleksi Suomi'}
      >
        {lang === 'fi' ? <FinlandFlag /> : <UKFlag />}
        <span className="hidden sm:inline font-mono font-bold">{lang === 'fi' ? 'Suomi' : 'English'}</span>
        <span className="sm:hidden font-mono font-bold text-[11px]">{lang === 'fi' ? 'FI' : 'EN'}</span>
      </button>
    </div>
  );
};
