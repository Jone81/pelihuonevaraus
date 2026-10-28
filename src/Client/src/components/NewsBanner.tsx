import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { useLanguage } from '../context/LanguageContext';

const XamkXEmblem: React.FC = () => (
  <svg
    viewBox="0 0 64 64"
    width="54"
    height="54"
    aria-hidden="true"
    className="xamk-x-emblem-svg"
  >
    <path
      d="M6 6 H25 L32 13 L39 6 H58 V25 L51 32 L58 39 V58 H39 L32 51 L25 58 H6 V39 L13 32 L6 25 Z"
      fill="none"
      stroke="#e5a812"
      strokeWidth="3.2"
      strokeLinejoin="miter"
    />
  </svg>
);

export const NewsBanner: React.FC = () => {
  const { lang } = useLanguage();
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
                {pinnedNews
                  ? pinnedNews.title
                  : isEn
                  ? 'Welcome Mon–Fri to the official gaming lounge of South-Eastern Finland University of Applied Sciences!'
                  : 'Tervetuloa ma–pe klo 08–18 Kaakkois-Suomen ammattikorkeakoulun pelihuoneeseen!'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
