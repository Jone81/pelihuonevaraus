import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import type { AppTab } from './Navbar';

interface FooterProps {
  onOpenIssueModal?: () => void;
  onOpenFloorPlan?: () => void;
  onNavigateTab?: (tab: AppTab) => void;
}

export const Footer: React.FC<FooterProps> = ({
  onOpenIssueModal,
  onOpenFloorPlan,
  onNavigateTab,
}) => {
  const { t, lang } = useLanguage();
  const isEn = lang === 'en';

  return (
    <footer className="w-full mt-auto flex-shrink-0 bg-[#0d0f13] text-[#9ca3af] relative border-t border-[#1f222b]">
      {/* Keltainen Xamk-raita */}
      <div className="w-full h-1 bg-[#fbba18] shadow-sm" aria-hidden="true" />

      {/* Monipalstainen linkkialue */}
      <div className="max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 py-5 min-w-0">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6 text-xs min-w-0">
          {/* Sarake 1: Varaus */}
          <div className="flex flex-col gap-1.5">
            <h4 className="text-white font-bold text-xs tracking-wider uppercase border-b border-[#222530] pb-1">
              {isEn ? 'Booking' : 'Varaa'}
            </h4>
            <button
              type="button"
              className="text-left text-gray-400 hover:text-[#fbba18] transition-colors py-0.5 cursor-pointer truncate"
              onClick={() => onNavigateTab?.('book')}
            >
              {t('nav.book') || (isEn ? 'Book Station' : 'Varaa laite')}
            </button>
            <button
              type="button"
              className="text-left text-gray-400 hover:text-[#fbba18] transition-colors py-0.5 cursor-pointer truncate"
              onClick={() => onNavigateTab?.('status')}
            >
              {t('nav.status') || (isEn ? 'Room Status' : 'Tilan tilanne')}
            </button>
          </div>

          {/* Sarake 2: Pelit & toivelista */}
          <div className="flex flex-col gap-1.5">
            <h4 className="text-white font-bold text-xs tracking-wider uppercase border-b border-[#222530] pb-1">
              {isEn ? 'Games' : 'Pelit'}
            </h4>
            <button
              type="button"
              className="text-left text-gray-400 hover:text-[#fbba18] transition-colors py-0.5 cursor-pointer truncate"
              onClick={() => onNavigateTab?.('games')}
            >
              {t('nav.games') || (isEn ? 'Catalog & Wishlist' : 'Pelit & toivelista')}
            </button>
          </div>

          {/* Sarake 3: Ohjeet & pohjakuva */}
          <div className="flex flex-col gap-1.5">
            <h4 className="text-white font-bold text-xs tracking-wider uppercase border-b border-[#222530] pb-1">
              {isEn ? 'Guidelines' : 'Ohjeet'}
            </h4>
            <button
              type="button"
              className="text-left text-gray-400 hover:text-[#fbba18] transition-colors py-0.5 cursor-pointer truncate"
              onClick={() => onNavigateTab?.('rules')}
            >
              {t('nav.rules') || (isEn ? 'Rules & Guide' : 'Säännöt & ohjeet')}
            </button>
            {onOpenFloorPlan && (
              <button
                type="button"
                className="text-left text-gray-400 hover:text-[#fbba18] transition-colors py-0.5 cursor-pointer truncate"
                onClick={onOpenFloorPlan}
              >
                {t('nav.floorplan') || (isEn ? 'Floor Plan' : 'Tilan pohjakuva')}
              </button>
            )}
          </div>

          {/* Sarake 4: Omat asiat */}
          <div className="flex flex-col gap-1.5">
            <h4 className="text-white font-bold text-xs tracking-wider uppercase border-b border-[#222530] pb-1">
              {isEn ? 'My Affairs' : 'Omat asiat'}
            </h4>
            <button
              type="button"
              className="text-left text-gray-400 hover:text-[#fbba18] transition-colors py-0.5 cursor-pointer truncate"
              onClick={() => onNavigateTab?.('my-bookings')}
            >
              {t('nav.myBookings') || (isEn ? 'My Bookings' : 'Omat varaukset')}
            </button>
            {onOpenIssueModal && (
              <button
                type="button"
                className="text-left text-gray-400 hover:text-[#ef4444] transition-colors py-0.5 cursor-pointer truncate"
                onClick={onOpenIssueModal}
              >
                {t('footer.report') || (isEn ? 'Report Issue' : 'Ilmoita viasta')}
              </button>
            )}
            <a
              href="https://discord.gg/xamk"
              target="_blank"
              rel="noopener noreferrer"
              className="text-left text-gray-400 hover:text-[#fbba18] transition-colors py-0.5 inline-flex items-center gap-1 truncate"
            >
              <span>{t('nav.discord') || 'Discord'}</span>
              <span className="text-[10px] text-gray-500">↗</span>
            </a>
          </div>

          {/* Sarake 5: Yhteystiedot */}
          <div className="flex flex-col gap-1.5">
            <h4 className="text-white font-bold text-xs tracking-wider uppercase border-b border-[#222530] pb-1">
              {isEn ? 'Contact' : 'Yhteystiedot'}
            </h4>
            <a
              href="mailto:gaming@xamk.fi"
              className="text-left text-gray-400 hover:text-[#fbba18] transition-colors py-0.5 truncate"
            >
              gaming@xamk.fi
            </a>
            <a
              href="https://www.xamk.fi/yhteystiedot/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-[#fbba18] transition-colors py-0.5 truncate"
            >
              {isEn ? 'Contact Form' : 'Ota yhteyttä'} ↗
            </a>
          </div>

          {/* Sarake 6: Xamk Info */}
          <div className="flex flex-col gap-1.5">
            <h4 className="text-white font-bold text-xs tracking-wider uppercase border-b border-[#222530] pb-1">
              Xamk
            </h4>
            <span className="text-gray-400 py-0.5 truncate">
              Kaakkois-Suomen AMK
            </span>
            <a
              href="https://www.xamk.fi"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#fbba18] hover:underline font-semibold py-0.5 truncate"
            >
              www.xamk.fi ↗
            </a>
          </div>
        </div>
      </div>

      {/* Alaviite: Keskitetty tekijänoikeusrivi */}
      <div className="border-t border-[#1f222b] py-2.5 px-4 text-center">
        <p className="text-[11px] text-gray-500 font-medium">
          © {new Date().getFullYear()} Kaakkois-Suomen ammattikorkeakoulu • Xamk Game Room
        </p>
      </div>
    </footer>
  );
};
