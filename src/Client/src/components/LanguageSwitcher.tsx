import React from 'react';
import { useLanguage } from '../context/LanguageContext';

interface LanguageSwitcherProps {
  className?: string;
}

const FinlandFlag: React.FC = () => (
  <svg
    viewBox="0 0 18 11"
    width="16"
    height="11"
    aria-hidden="true"
    className="flag-icon"
    style={{ borderRadius: '2px', display: 'inline-block', flexShrink: 0 }}
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
    height="11"
    aria-hidden="true"
    className="flag-icon"
    style={{ borderRadius: '2px', display: 'inline-block', flexShrink: 0 }}
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

  const toggleLanguage = () => {
    setLang(lang === 'fi' ? 'en' : 'fi');
  };

  return (
    <div
      className={`lang-switcher-compact ${className}`}
      role="group"
      aria-label="Kielivalitsin / Language selector"
    >
      <button
        type="button"
        className="lang-pill-btn btn-touch"
        onClick={toggleLanguage}
        title={lang === 'fi' ? 'Switch to English' : 'Vaihda kieleksi Suomi'}
      >
        {lang === 'fi' ? <FinlandFlag /> : <UKFlag />}
        <span className="lang-text">{lang === 'fi' ? 'Suomi' : 'English'}</span>
      </button>
    </div>
  );
};
