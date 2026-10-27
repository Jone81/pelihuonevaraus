import React from 'react';
import { useLanguage } from '../context/LanguageContext';

interface LanguageSwitcherProps {
  className?: string;
}

const FinlandFlag: React.FC = () => (
  <svg
    viewBox="0 0 18 11"
    width="16"
    height="10"
    aria-hidden="true"
    className="flag-icon"
    style={{ borderRadius: '2px', display: 'inline-block', flexShrink: 0, border: '1px solid rgba(255,255,255,0.1)' }}
  >
    <rect width="18" height="11" fill="#ffffff" />
    <rect width="18" height="3" y="4" fill="#003580" />
    <rect width="3" height="11" x="5" fill="#003580" />
  </svg>
);

const UKFlag: React.FC = () => (
  <svg
    viewBox="0 0 60 30"
    width="16"
    height="10"
    aria-hidden="true"
    className="flag-icon"
    style={{ borderRadius: '2px', display: 'inline-block', flexShrink: 0, border: '1px solid rgba(255,255,255,0.1)' }}
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

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ className = '' }) => {
  const { lang, setLang } = useLanguage();

  return (
    <div
      className={`lang-switcher flex items-center bg-[#14161f] border border-[#2b313d] rounded-lg p-0.5 ${className}`}
      role="group"
      aria-label="Kielivalitsin / Language selector"
    >
      <button
        type="button"
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs transition-all cursor-pointer ${
          lang === 'fi'
            ? 'bg-[#1e2230] text-[#fbba18] font-bold border border-[#d89619]/40 shadow-xs'
            : 'text-gray-400 hover:text-white'
        }`}
        onClick={() => setLang('fi')}
        aria-pressed={lang === 'fi'}
        title="Suomeksi (Finnish)"
      >
        <FinlandFlag />
        <span className="hidden sm:inline text-xs font-semibold">Suomi</span>
        <span className="sm:hidden text-[10px] font-bold">FI</span>
      </button>

      <button
        type="button"
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs transition-all cursor-pointer ${
          lang === 'en'
            ? 'bg-[#1e2230] text-[#fbba18] font-bold border border-[#d89619]/40 shadow-xs'
            : 'text-gray-400 hover:text-white'
        }`}
        onClick={() => setLang('en')}
        aria-pressed={lang === 'en'}
        title="In English"
      >
        <UKFlag />
        <span className="hidden sm:inline text-xs font-semibold">English</span>
        <span className="sm:hidden text-[10px] font-bold">EN</span>
      </button>
    </div>
  );
};
