import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Clock, ShieldCheck } from 'lucide-react';

export const HeroBanner: React.FC = () => {
  const { lang } = useLanguage();
  const isEn = lang === 'en';

  return (
    <section
      className="relative w-full max-w-full overflow-hidden bg-[#0a0b0d] select-none border-b border-[#1c1f26]"
      aria-label="Xamk Game Room Hero"
    >
      <div className="relative w-full min-h-[140px] sm:min-h-[170px] md:min-h-[190px] flex items-center overflow-hidden">
        {/* Taustakuva */}
        <img
          src="/gaming-room-banner.jpg"
          alt="Xamk Game Room"
          className="absolute inset-0 w-full h-full object-cover object-center scale-105"
          loading="eager"
        />

        {/* Elokuvamainen peli-liukuväri luettavuudelle */}
        <div
          className="absolute inset-0 bg-gradient-to-r from-[#0a0b0d] via-[#0a0b0d]/85 to-[#0a0b0d]/70"
          aria-hidden="true"
        />
        <div
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#fbba18]/10 via-transparent to-transparent"
          aria-hidden="true"
        />

        {/* Sisältökerros */}
        <div className="relative z-10 w-full max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-5 flex flex-col md:flex-row items-center justify-between gap-3 sm:gap-6 min-w-0">
          {/* Vasen puoli: Ytimekäs ja ilmava otsikko ilman turhia tekstimassoja */}
          <div className="flex flex-col items-center md:items-start text-center md:text-left min-w-0">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white tracking-tight leading-tight">
              {isEn ? 'Welcome to ' : 'Tervetuloa '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#fbba18] via-[#ffd56b] to-[#d89619]">
                Xamk Game Roomiin
              </span>
            </h1>
          </div>

          {/* Oikea puoli: Aukioloaikojen lasipaneeli (Cockpit Status Card) */}
          <div className="flex items-center gap-3.5 sm:gap-4 bg-[#111318]/90 backdrop-blur-md border border-[#fbba18]/35 px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl shadow-2xl w-full sm:w-auto max-w-full sm:max-w-md min-w-0 box-border group hover:border-[#fbba18]/60 transition-colors">
            <img
              src="/xamk-x-logo.png"
              alt="Xamk"
              className="w-8 h-8 sm:w-10 sm:h-10 object-contain flex-shrink-0 drop-shadow-md"
            />
            <div className="flex flex-col text-left min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                  {isEn ? 'Lounge Open' : 'Tila avoinna'}
                </span>
                <span className="text-gray-500 text-[10px]">•</span>
                <span className="text-gray-400 text-[10px] flex items-center gap-0.5">
                  <ShieldCheck className="w-2.5 h-2.5 text-[#fbba18]" />
                  <span>Max 4h / pv</span>
                </span>
              </div>
              <span className="text-white font-extrabold text-xs sm:text-sm tracking-wide font-sans flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-[#fbba18]" />
                <span>{isEn ? 'Mon–Fri 08:00–18:00' : 'Ma–Pe klo 08:00–18:00'}</span>
              </span>
              <span className="text-gray-400 text-[10px] sm:text-[11px] leading-tight mt-0.5">
                {isEn ? 'Campus gaming stations & console lounge' : 'Varaa pelipiste ja tule viihtymään!'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
