/**
 * @file AdminSidebar.tsx
 * @description Ylläpitopaneelin vasen sivupalkki työpöydälle (kokoon taitettava 256px / 72px)
 * ja liukuvalikko (drawer) mobiililaitteille. Ryhmittelee ylläpito-osiot selkeästi
 * Pelihuone-, Sisältö- ja Hallinto-ryhmiin sekä tarjoaa paluun pelihuoneeseen,
 * kielenvaihdon ja käyttäjäkortin uloskirjautumisella.
 */
import React, { useEffect } from 'react';
import {
  LayoutDashboard,
  Calendar,
  Monitor,
  AlertTriangle,
  Zap,
  Gamepad2,
  Newspaper,
  Users,
  BarChart3,
  Settings,
  ArrowLeft,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useRouter, type AdminSection } from '../../router';

/**
 * Yksittäisen sivupalkin navigaatiokohteen määritys.
 */
interface SidebarNavItem {
  /** Osion tunniste */
  id: AdminSection;
  /** Suomenkielinen nimi */
  labelFi: string;
  /** Englanninkielinen nimi */
  labelEn: string;
  /** Lucide-ikoni */
  icon: React.ReactNode;
  /** Valinnainen punainen laskuribadge (esim. avoimet vikailmoitukset) */
  badge?: number;
}

/**
 * Sivupalkin ryhmän määritys.
 */
interface SidebarNavGroup {
  /** Ryhmän otsikko suomeksi */
  titleFi: string;
  /** Ryhmän otsikko englanniksi */
  titleEn: string;
  /** Ryhmään kuuluvat navigaatiokohteet */
  items: SidebarNavItem[];
}

/**
 * AdminSidebar-komponentin ominaisuudet.
 */
export interface AdminSidebarProps {
  /** Parhaillaan aktiivinen admin-osio */
  activeSection: AdminSection;
  /** Käsittelijä osion vaihtamiseen */
  onNavigate: (section: AdminSection) => void;
  /** Avoimien vikailmoitusten määrä live-badgea varten */
  openIssuesCount: number;
  /** Onko työpöydän sivupalkki taitettu kapeaksi (72px) */
  collapsed: boolean;
  /** Vaihtaa työpöydän sivupalkin leveyttä */
  onToggleCollapse: () => void;
  /** Onko mobiilidrawer auki */
  mobileOpen: boolean;
  /** Sulkee mobiilidrawerin */
  onCloseMobile: () => void;
}

/**
 * Ylläpitopaneelin sivupalkki (työpöytä + mobiilidrawer).
 */
export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  activeSection,
  onNavigate,
  openIssuesCount,
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
}) => {
  const { user, logout, isSuperAdmin } = useAuth();
  const { lang, setLang } = useLanguage();
  const { navigate } = useRouter();
  const isEn = lang === 'en';

  // Suljetaan mobiilidrawer Escape-näppäimellä
  useEffect(() => {
    if (!mobileOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCloseMobile();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileOpen, onCloseMobile]);

  // Estetään taustan vieritys mobiilidrawerin ollessa auki
  useEffect(() => {
    if (mobileOpen) {
      document.body.classList.add('mobile-menu-lock');
    } else {
      document.body.classList.remove('mobile-menu-lock');
    }
    return () => {
      document.body.classList.remove('mobile-menu-lock');
    };
  }, [mobileOpen]);

  const gameRoomItems: SidebarNavItem[] = [
    {
      id: 'reservations',
      labelFi: 'Varaukset',
      labelEn: 'Reservations',
      icon: <Calendar className="w-4 h-4 shrink-0" strokeWidth={2.5} aria-hidden="true" />,
    },
    {
      id: 'stations',
      labelFi: 'Pelipisteet ja huolto',
      labelEn: 'Stations & maintenance',
      icon: <Monitor className="w-4 h-4 shrink-0" strokeWidth={2.5} aria-hidden="true" />,
    },
    {
      id: 'issues',
      labelFi: 'Vikailmoitukset',
      labelEn: 'Issue reports',
      icon: <AlertTriangle className="w-4 h-4 shrink-0" strokeWidth={2.5} aria-hidden="true" />,
      badge: openIssuesCount,
    },
  ];

  if (isSuperAdmin) {
    gameRoomItems.push({
      id: 'superadmin',
      labelFi: 'Tapahtumavaraukset',
      labelEn: 'Event bookings',
      icon: <Zap className="w-4 h-4 shrink-0" strokeWidth={2.5} aria-hidden="true" />,
    });
  }

  const navGroups: SidebarNavGroup[] = [
    {
      titleFi: 'Pelihuone',
      titleEn: 'Game Room',
      items: gameRoomItems,
    },
    {
      titleFi: 'Sisältö',
      titleEn: 'Content',
      items: [
        {
          id: 'games',
          labelFi: 'Pelit ja toivelista',
          labelEn: 'Games & wishlist',
          icon: <Gamepad2 className="w-4 h-4 shrink-0" strokeWidth={2.5} aria-hidden="true" />,
        },
        {
          id: 'news',
          labelFi: 'Tiedotteet',
          labelEn: 'Announcements',
          icon: <Newspaper className="w-4 h-4 shrink-0" strokeWidth={2.5} aria-hidden="true" />,
        },
      ],
    },
    {
      titleFi: 'Hallinto',
      titleEn: 'Administration',
      items: [
        {
          id: 'users',
          labelFi: 'Käyttäjät ja estot',
          labelEn: 'Users & bans',
          icon: <Users className="w-4 h-4 shrink-0" strokeWidth={2.5} aria-hidden="true" />,
        },
        {
          id: 'statistics',
          labelFi: 'Tilastot ja käyttöaste',
          labelEn: 'Statistics & usage',
          icon: <BarChart3 className="w-4 h-4 shrink-0" strokeWidth={2.5} aria-hidden="true" />,
        },
        {
          id: 'settings',
          labelFi: 'Sivuston asetukset',
          labelEn: 'Site settings',
          icon: <Settings className="w-4 h-4 shrink-0" strokeWidth={2.5} aria-hidden="true" />,
        },
      ],
    },
  ];

  const displayName = user?.displayName || 'Admin';
  const displayRole = isSuperAdmin ? 'SUPERADMIN' : 'ADMIN';

  const handleSelectSection = (section: AdminSection) => {
    onNavigate(section);
    onCloseMobile();
  };

  const handleBackToRoom = () => {
    onCloseMobile();
    navigate('/book');
  };

  const handleLogout = () => {
    onCloseMobile();
    logout();
  };

  /**
   * Renderöi sivupalkin sisällön joko täysleveänä (mobiilidrawer / auki oleva työpöytäpalkki)
   * tai kapeana ikoni-tilana (`isCompact = true`).
   */
  const renderSidebarBody = (isCompact: boolean, isMobileDrawer: boolean) => (
    <div className="flex flex-col h-full bg-[#0E0F11] text-[#F4F4F5] select-none">
      {/* Ylätunniste: Brändi + collapse / sulkunappi */}
      <div
        className={`flex items-center border-b-2 border-[#3F444E] bg-[#121417] min-h-[64px] shrink-0 ${
          isCompact ? 'justify-center px-2' : 'justify-between px-4'
        }`}
      >
        {!isCompact && (
          <button
            type="button"
            onClick={() => handleSelectSection('overview')}
            className="inline-flex items-center gap-2.5 min-w-0 bg-transparent border-0 p-0 cursor-pointer text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FACC15]"
          >
            <img
              src="/xamk_logo_tiivis_kehys_keltainen_rgb.png"
              alt="Xamk"
              className="h-7 w-auto object-contain shrink-0"
            />
            <div className="flex flex-col leading-tight min-w-0">
              <span className="text-xs font-extrabold uppercase tracking-tight text-[#F4F4F5] truncate">
                XAMK GAME ROOM
              </span>
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#FACC15]">
                ADMIN PANEL
              </span>
            </div>
          </button>
        )}

        {isMobileDrawer ? (
          <button
            type="button"
            onClick={onCloseMobile}
            className="inline-flex items-center justify-center w-9 h-9 rounded-none bg-[#1C1F24] text-[#F4F4F5] border-2 border-[#3F444E] hover:border-[#FACC15] hover:text-[#FACC15] cursor-pointer shrink-0"
            aria-label={isEn ? 'Close menu' : 'Sulje valikko'}
          >
            <X className="w-4 h-4 shrink-0" strokeWidth={2.5} aria-hidden="true" />
          </button>
        ) : (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="inline-flex items-center justify-center w-9 h-9 rounded-none bg-[#1C1F24] text-[#F4F4F5] border-2 border-[#3F444E] hover:border-[#FACC15] hover:text-[#FACC15] cursor-pointer shrink-0"
            aria-label={
              isCompact
                ? isEn
                  ? 'Expand sidebar'
                  : 'Laajenna sivupalkki'
                : isEn
                ? 'Collapse sidebar'
                : 'Pienennä sivupalkki'
            }
            title={
              isCompact
                ? isEn
                  ? 'Expand sidebar'
                  : 'Laajenna sivupalkki'
                : isEn
                ? 'Collapse sidebar'
                : 'Pienennä sivupalkki'
            }
          >
            {isCompact ? (
              <PanelLeftOpen className="w-4 h-4 shrink-0" strokeWidth={2.5} aria-hidden="true" />
            ) : (
              <PanelLeftClose className="w-4 h-4 shrink-0" strokeWidth={2.5} aria-hidden="true" />
            )}
          </button>
        )}
      </div>

      {/* Navigaatio-osio */}
      <nav
        className="flex-1 overflow-y-auto px-2.5 py-4 space-y-5"
        aria-label={isEn ? 'Admin navigation' : 'Ylläpidon navigaatio'}
      >
        {/* Ylin linkki: Yleiskatsaus */}
        <div>
          <button
            type="button"
            onClick={() => handleSelectSection('overview')}
            title={isCompact ? (isEn ? 'Overview' : 'Yleiskatsaus') : undefined}
            aria-current={activeSection === 'overview' ? 'page' : undefined}
            className={`w-full flex items-center rounded-none font-mono text-xs uppercase tracking-wider border-2 transition-colors cursor-pointer ${
              isCompact ? 'justify-center px-2 py-2.5' : 'justify-start gap-2.5 px-3 py-2.5'
            } ${
              activeSection === 'overview'
                ? 'bg-[#FACC15] text-[#09090B] border-black font-extrabold shadow-[3px_3px_0px_#000000]'
                : 'bg-transparent text-[#D4D4D8] border-transparent font-bold hover:bg-[#1C1F24] hover:text-[#F4F4F5] hover:border-[#3F444E]'
            }`}
          >
            <LayoutDashboard className="w-4 h-4 shrink-0" strokeWidth={2.5} aria-hidden="true" />
            {!isCompact && <span className="truncate">{isEn ? 'Overview' : 'Yleiskatsaus'}</span>}
          </button>
        </div>

        {/* Ryhmitellyt linkit */}
        {navGroups.map((group) => (
          <div key={group.titleEn} className="space-y-1.5">
            {!isCompact ? (
              <div className="px-3 text-[10px] font-mono font-bold uppercase tracking-widest text-[#71717A]">
                {isEn ? group.titleEn : group.titleFi}
              </div>
            ) : (
              <div className="mx-2 border-t border-[#3F444E]" aria-hidden="true" />
            )}

            <div className="space-y-1">
              {group.items.map((item) => {
                const isActive = activeSection === item.id;
                const label = isEn ? item.labelEn : item.labelFi;
                const hasBadge = item.badge !== undefined && item.badge > 0;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectSection(item.id)}
                    title={isCompact ? label : undefined}
                    aria-current={isActive ? 'page' : undefined}
                    className={`relative w-full flex items-center rounded-none font-mono text-xs uppercase tracking-wider border-2 transition-colors cursor-pointer ${
                      isCompact ? 'justify-center px-2 py-2.5' : 'justify-between gap-2 px-3 py-2.5'
                    } ${
                      isActive
                        ? 'bg-[#FACC15] text-[#09090B] border-black font-extrabold shadow-[3px_3px_0px_#000000]'
                        : 'bg-transparent text-[#D4D4D8] border-transparent font-bold hover:bg-[#1C1F24] hover:text-[#F4F4F5] hover:border-[#3F444E]'
                    }`}
                  >
                    <span className="inline-flex items-center gap-2.5 min-w-0">
                      {item.icon}
                      {!isCompact && <span className="truncate">{label}</span>}
                    </span>

                    {hasBadge && !isCompact && (
                      <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-none bg-[#EF4444] text-white border border-black font-mono text-[11px] font-extrabold shrink-0">
                        {item.badge}
                      </span>
                    )}

                    {hasBadge && isCompact && (
                      <span
                        className="absolute top-1 right-1 inline-flex items-center justify-center min-w-[16px] h-4 px-1 rounded-none bg-[#EF4444] text-white border border-black font-mono text-[10px] font-extrabold leading-none"
                        aria-label={`${item.badge}`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Alaosa: Paluu pelihuoneeseen, kielenvaihto ja käyttäjäkortti */}
      <div className="border-t-2 border-[#3F444E] bg-[#121417] p-2.5 space-y-2 shrink-0">
        {/* Takaisin pelihuoneeseen */}
        <button
          type="button"
          onClick={handleBackToRoom}
          title={isCompact ? (isEn ? 'Back to game room' : 'Takaisin pelihuoneeseen') : undefined}
          className={`w-full flex items-center rounded-none bg-[#1C1F24] text-[#F4F4F5] border-2 border-[#3F444E] hover:border-[#FACC15] hover:text-[#FACC15] font-mono text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
            isCompact ? 'justify-center px-2 py-2.5' : 'justify-start gap-2.5 px-3 py-2.5'
          }`}
        >
          <ArrowLeft className="w-4 h-4 shrink-0" strokeWidth={2.5} aria-hidden="true" />
          {!isCompact && (
            <span className="truncate">
              {isEn ? 'Back to game room' : 'Takaisin pelihuoneeseen'}
            </span>
          )}
        </button>

        {/* Kielenvaihto (FI / EN) */}
        {isCompact ? (
          <button
            type="button"
            onClick={() => setLang(lang === 'fi' ? 'en' : 'fi')}
            title={isEn ? 'Switch language to Finnish' : 'Vaihda kieli englanniksi'}
            className="w-full flex items-center justify-center px-2 py-2 rounded-none bg-[#1C1F24] text-[#FACC15] border-2 border-[#3F444E] hover:border-[#FACC15] font-mono text-xs font-extrabold uppercase cursor-pointer"
          >
            {lang.toUpperCase()}
          </button>
        ) : (
          <div
            className="grid grid-cols-2 border-2 border-[#3F444E] bg-[#1C1F24]"
            role="group"
            aria-label={isEn ? 'Language selection' : 'Kielivalinta'}
          >
            <button
              type="button"
              onClick={() => setLang('fi')}
              aria-pressed={lang === 'fi'}
              className={`py-1.5 font-mono text-xs font-extrabold uppercase cursor-pointer transition-colors ${
                lang === 'fi'
                  ? 'bg-[#FACC15] text-[#09090B]'
                  : 'bg-transparent text-[#A1A1AA] hover:text-[#F4F4F5]'
              }`}
            >
              FI
            </button>
            <button
              type="button"
              onClick={() => setLang('en')}
              aria-pressed={lang === 'en'}
              className={`py-1.5 font-mono text-xs font-extrabold uppercase border-l-2 border-[#3F444E] cursor-pointer transition-colors ${
                lang === 'en'
                  ? 'bg-[#FACC15] text-[#09090B]'
                  : 'bg-transparent text-[#A1A1AA] hover:text-[#F4F4F5]'
              }`}
            >
              EN
            </button>
          </div>
        )}

        {/* Käyttäjäkortti */}
        {isCompact ? (
          <div className="flex flex-col items-center gap-2 pt-1">
            <div
              className="inline-flex items-center justify-center w-9 h-9 rounded-none bg-[#FACC15] text-[#09090B] border-2 border-black font-mono text-xs font-extrabold"
              title={`${displayName} (${displayRole})`}
            >
              {displayName.charAt(0).toUpperCase()}
            </div>
            <button
              type="button"
              onClick={handleLogout}
              title={isEn ? 'Log out' : 'Kirjaudu ulos'}
              aria-label={isEn ? 'Log out' : 'Kirjaudu ulos'}
              className="w-full inline-flex items-center justify-center py-2 rounded-none bg-[#1C1F24] text-[#EF4444] border-2 border-[#3F444E] hover:border-[#EF4444] hover:bg-[#EF4444] hover:text-white cursor-pointer transition-colors"
            >
              <LogOut className="w-4 h-4 shrink-0" strokeWidth={2.5} aria-hidden="true" />
            </button>
          </div>
        ) : (
          <div className="rounded-none bg-[#1C1F24] border-2 border-[#3F444E] p-2.5 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="inline-flex items-center justify-center w-9 h-9 rounded-none bg-[#FACC15] text-[#09090B] border-2 border-black font-mono text-xs font-extrabold shrink-0">
                {displayName.charAt(0).toUpperCase()}
              </span>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-extrabold text-[#F4F4F5] truncate">
                  {displayName}
                </span>
                <span className="inline-block w-fit mt-0.5 px-1.5 py-0.5 rounded-none bg-[#FACC15] text-[#09090B] border border-black font-mono text-[9px] font-extrabold uppercase leading-none">
                  {displayRole}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              title={isEn ? 'Log out' : 'Kirjaudu ulos'}
              aria-label={isEn ? 'Log out' : 'Kirjaudu ulos'}
              className="inline-flex items-center justify-center w-8 h-8 rounded-none bg-[#121417] text-[#EF4444] border border-[#3F444E] hover:border-[#EF4444] hover:bg-[#EF4444] hover:text-white cursor-pointer transition-colors shrink-0"
            >
              <LogOut className="w-4 h-4 shrink-0" strokeWidth={2.5} aria-hidden="true" />
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Työpöydän kiinteä vasen sivupalkki (lg+) */}
      <aside
        className={`hidden lg:flex flex-col sticky top-0 h-screen shrink-0 border-r-2 border-[#3F444E] transition-[width] duration-150 ${
          collapsed ? 'w-[72px]' : 'w-64'
        }`}
      >
        {renderSidebarBody(collapsed, false)}
      </aside>

      {/* Mobiilin liukuvalikko (drawer, alle lg) */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex lg:hidden"
          onClick={onCloseMobile}
          role="presentation"
        >
          <div
            id="admin-mobile-drawer"
            className="w-72 max-w-[85vw] h-full border-r-2 border-[#FACC15] shadow-[6px_0px_0px_#000000]"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={isEn ? 'Admin navigation menu' : 'Ylläpidon valikko'}
          >
            {renderSidebarBody(false, true)}
          </div>
        </div>
      )}
    </>
  );
};
