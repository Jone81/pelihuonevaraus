import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { useLanguage } from '../context/LanguageContext';

const XamkXEmblem: React.FC = () => (
  <svg
    viewBox="0 0 100 100"
    className="xamk-x-emblem"
    aria-hidden="true"
    focusable="false"
  >
    <path
      d="M 12 12 L 34 12 L 50 34 L 66 12 L 88 12 L 88 34 L 66 50 L 88 66 L 88 88 L 66 88 L 50 66 L 34 88 L 12 88 L 12 66 L 34 50 L 12 34 Z"
      fill="none"
      stroke="#d49a15"
      strokeWidth="11"
      strokeLinejoin="miter"
      strokeMiterlimit="10"
    />
  </svg>
);

export const NewsBanner: React.FC = () => {
  const { lang, t } = useLanguage();
  const isEn = lang === 'en';

  const { data: newsList } = useQuery({
    queryKey: ['news'],
    queryFn: () => api.getNews(),
  });

  const pinnedNews = newsList?.find((n) => n.isPinned) || newsList?.[0];

  return (
    <section className="xamk-hero-banner" aria-label={isEn ? 'Welcome banner' : 'Tervetulobanneri'}>
      <div className="xamk-hero-overlay">
        <div className="xamk-hero-container">
          {/* Left: Xamk Highlighted Headline Strips */}
          <div className="xamk-hero-headline-group">
            <h1 className="xamk-hero-title">
              <span className="xamk-highlight-strip">
                {isEn ? 'Welcome to Xamk' : 'Tervetuloa Xamk'}
              </span>
              <span className="xamk-highlight-strip">
                {isEn ? 'Game Room!' : 'Game Roomiin!'}
              </span>
            </h1>
          </div>

          {/* Right: Black Floating Info Box with Xamk X Emblem */}
          <div className="xamk-hero-info-box">
            <div className="xamk-hero-emblem-wrap">
              <XamkXEmblem />
            </div>
            <div className="xamk-hero-info-text">
              <h2 className="xamk-hero-info-heading">
                {isEn
                  ? 'Opening hours Mon–Fri 08:00–18:00'
                  : 'Aukioloajat ma–pe klo 08:00–18:00'}
              </h2>
              <p className="xamk-hero-info-sub">
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
