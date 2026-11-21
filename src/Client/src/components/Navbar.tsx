/**
 * @file Navbar.tsx
 * @description Sovelluksen päänavigaatiopalkki (ylätunniste) työpöytä- ja mobiilinäkymille.
 * Sisältää Xamk-logon, päävälilehtien linkit, Admin-pudotusvalikon, kielivalitsimen,
 * käyttäjävalikon sekä mobiililaitteiden sivuvalikon (Drawer).
 */
import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Gamepad2,
  BookOpen,
  Map,
  ClipboardList,
  Settings,
  ChevronDown,
  Newspaper,
  Users,
  BarChart3,
  AlertTriangle,
  Zap,
  User,
  LogOut,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { LanguageSwitcher } from './LanguageSwitcher';
import { useRouter, type AppTab, type AdminSubTab } from '../router';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { DiscordIcon } from '@/components/ui/discord-icon';

export type { AppTab };

/**
 * Navbar-komponentin ominaisuudet (props).
 */
interface NavbarProps {
  /** Funktio kirjautumismodaalin avaamiseen */
  onOpenLogin: () => void;
  /** Funktio pohjakuvamodaalin avaamiseen */
  onOpenFloorPlan: () => void;
  /** Valinnainen funktio vikailmoitusmodaalin avaamiseen */
  onOpenIssueModal?: () => void;
  /** Nykyinen aktiivinen päävälilehti */
  activeTab: AppTab;
  /** Funktio päävälilehden vaihtamiseen */
  setActiveTab: (tab: AppTab) => void;
}

/**
 * Responsiivinen ylänavigaatiopalkki.
 */
export const Navbar: React.FC<NavbarProps> = ({
  onOpenLogin,
  onOpenFloorPlan,
  onOpenIssueModal,
  activeTab,
  setActiveTab,
}) => {
  const { user, logout, isSuperAdmin, isAdmin } = useAuth();
  const { lang, t } = useLanguage();
  const { adminSubTab, setAdminSubTab } = useRouter();
  const isEn = lang === 'en';

  // Mobiilivalikon (hampurilaisvalikko) aukiolotila
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Suljetaan mobiilivalikko Escape-näppäimellä
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileMenuOpen]);

  // Lukitaan taustasivun vieritys, kun mobiilivalikko on auki
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.classList.add('mobile-menu-lock');
    } else {
      document.body.classList.remove('mobile-menu-lock');
    }
    return () => {
      document.body.classList.remove('mobile-menu-lock');
    };
  }, [isMobileMenuOpen]);

  // Vaihtaa päävälilehteä ja sulkee mobiilivalikon
  const handleTabClick = (tab: AppTab) => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
  };

  // Vaihtaa ylläpitopaneelin alavälilehteä ja sulkee mobiilivalikon
  const handleAdminSubTabClick = (subTab: AdminSubTab) => {
    setAdminSubTab(subTab);
    setIsMobileMenuOpen(false);
  };

  // Avaa pohjakuvamodaalin ja sulkee mobiilivalikon
  const handleFloorPlanClick = () => {
    setIsMobileMenuOpen(false);
    onOpenFloorPlan();
  };

  // Avaa vikailmoitusmodaalin ja sulkee mobiilivalikon
  const handleIssueClick = () => {
    setIsMobileMenuOpen(false);
    onOpenIssueModal?.();
  };

  // Kirjaa käyttäjän ulos ja sulkee mobiilivalikon
  const handleLogout = () => {
    setIsMobileMenuOpen(false);
    logout();
  };

  const displayName = user?.displayName || 'Matti Meikäläinen';
  const displayRole = user?.role ? user.role.toUpperCase() : 'USER';

  return (
    <header className="sticky top-0 z-40 w-full bg-[#121417] text-[#F4F4F5] border-b-2 border-[#3F444E]">
      {/* Rivi 1: Yläpalkki (brändi ja pikatoiminnot) */}
      <div className="max-w-[1440px] mx-auto px-3 sm:px-5 min-h-[56px] py-2 flex items-center justify-between gap-3">
        {/* Left: Xamk Brand Logo & Title */}
        {/* Vasen reuna: Xamk-brändilogo ja sovelluksen otsikko */}
        <button
          type="button"
          className="inline-flex items-center gap-2.5 text-left min-w-0 shrink-0 cursor-pointer bg-transparent border-0 p-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FACC15]"
          onClick={() => handleTabClick('book')}
          aria-label="Pelihuonevaraus etusivu"
        >
          <img
            src="/xamk_logo_tiivis_kehys_keltainen_rgb.png"
            alt="Xamk"
            className="h-6 sm:h-7 md:h-8 w-auto object-contain shrink-0"
          />
          <div className="flex flex-col leading-tight min-w-0">
            <span className="text-[11px] sm:text-xs md:text-sm font-extrabold uppercase tracking-tight text-[#F4F4F5] truncate sm:overflow-visible sm:whitespace-nowrap">
              {isEn ? 'GAME ROOM BOOKING' : 'PELIHUONEVARAUS'}
            </span>
            <span className="text-[8px] sm:text-[9px] md:text-[10px] font-mono font-bold tracking-widest uppercase text-[#FACC15] truncate sm:overflow-visible sm:whitespace-nowrap">
              XAMK GAME ROOM
            </span>
          </div>
        </button>

        {/* Right: Report Issue + Language Switcher + User Profile */}
        {/* Oikea reuna: Vikailmoituslinkki, kielivalitsin ja käyttäjäprofiilin valikko */}
        <div className="hidden lg:flex items-center gap-2 shrink-0">
          {user && onOpenIssueModal && (
            <button
              type="button"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 min-h-[36px] text-xs font-mono font-bold uppercase rounded-none bg-[#1C1F24] text-[#FACC15] border border-[#3F444E] hover:border-[#FACC15] transition-colors cursor-pointer whitespace-nowrap"
              onClick={onOpenIssueModal}
              title={t('issue.desc')}
            >
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-[#FACC15]" strokeWidth={2.5} aria-hidden="true" />
              <span>{isEn ? 'Report issue' : 'Ilmoita viasta'}</span>
            </button>
          )}

          <LanguageSwitcher />

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 px-3 py-1.5 min-h-[36px] rounded-none bg-[#1C1F24] text-[#F4F4F5] border border-[#3F444E] hover:border-[#FACC15] transition-colors cursor-pointer"
                  aria-label="Käyttäjävalikko"
                >
                  <span className="text-xs font-mono font-bold max-w-[140px] truncate">{displayName}</span>
                  <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold uppercase rounded-none bg-[#FACC15] text-[#09090B] border border-black">{displayRole}</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="rounded-none bg-[#1C1F24] text-[#F4F4F5] border-2 border-[#3F444E] shadow-[4px_4px_0px_#000000] min-w-[220px] p-1">
                <DropdownMenuLabel>
                  <div className="flex flex-col gap-0.5">
                    <strong className="text-sm font-extrabold text-[#F4F4F5]">{displayName}</strong>
                    <span className="text-xs font-mono text-[#A1A1AA] font-normal">{user.email}</span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleTabClick('my-bookings')}>
                  <ClipboardList className="w-4 h-4 shrink-0" strokeWidth={2.5} aria-hidden="true" />
                  <span>{isEn ? 'My bookings' : 'Omat varaukset'}</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onOpenLogin}>
                  <User className="w-4 h-4 shrink-0" strokeWidth={2.5} aria-hidden="true" />
                  <span>{isEn ? 'Switch account' : 'Vaihda käyttäjää'}</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-[#EF4444] hover:bg-[#EF4444] hover:text-white font-mono font-bold"
                  onClick={handleLogout}
                >
                  <LogOut className="w-4 h-4 shrink-0" strokeWidth={2.5} aria-hidden="true" />
                  <span>{t('nav.logout')}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-none bg-[#FACC15] text-[#09090B] border-2 border-black shadow-[3px_3px_0px_#000000] font-mono font-bold uppercase cursor-pointer hover:bg-[#EAB308] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
              style={{ minHeight: '34px', padding: '5px 16px', fontSize: '0.78rem' }}
              onClick={onOpenLogin}
            >
              <span>{t('nav.login')}</span>
            </button>
          )}
        </div>

        {/* Mobile Actions */}
        {/* Mobiilinäkymän pikatoiminnot ja hampurilaisvalikkopainike */}
        <div className="flex lg:hidden items-center gap-2 shrink-0">
          <LanguageSwitcher className="shrink-0" />
          {user ? (
            <button
              type="button"
              className={`inline-flex items-center justify-center w-10 h-10 rounded-none bg-[#1C1F24] border-2 cursor-pointer transition-colors ${
                isMobileMenuOpen ? 'border-[#FACC15]' : 'border-[#3F444E] hover:border-[#FACC15]'
              }`}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label={isMobileMenuOpen ? t('nav.closeMenu') : t('nav.openMenu')}
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-nav-drawer"
            >
              <span className="flex flex-col justify-between w-5 h-4">
                <span className={`block h-0.5 w-full transition-transform ${isMobileMenuOpen ? 'translate-y-[7px] rotate-45 bg-[#FACC15]' : 'bg-[#F4F4F5]'}`}></span>
                <span className={`block h-0.5 w-full bg-[#F4F4F5] transition-opacity ${isMobileMenuOpen ? 'opacity-0' : ''}`}></span>
                <span className={`block h-0.5 w-full transition-transform ${isMobileMenuOpen ? '-translate-y-[7px] -rotate-45 bg-[#FACC15]' : 'bg-[#F4F4F5]'}`}></span>
              </span>
            </button>
          ) : (
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-none bg-[#FACC15] text-[#09090B] border-2 border-black shadow-[3px_3px_0px_#000000] font-mono font-bold uppercase cursor-pointer hover:bg-[#EAB308] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
              style={{ minHeight: '34px', padding: '5px 12px', fontSize: '0.76rem' }}
              onClick={onOpenLogin}
            >
              <span className="hidden sm:inline">{t('nav.login')}</span>
              <span className="sm:hidden">{isEn ? 'Log in' : 'Kirjaudu'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Rivi 2: Päänavigaatiopalkki (näytetään kirjautuneille työpöytänäkymässä) */}
      {user && (
        <div className="hidden lg:block w-full bg-[#1C1F24] border-t-2 border-black">
          <nav
            className="max-w-[1440px] mx-auto px-3 sm:px-5 py-1.5 flex flex-wrap items-center gap-1.5"
            aria-label="Päävalikko"
          >
            <button
              type="button"
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 min-h-[34px] text-xs font-mono font-bold uppercase tracking-tight rounded-none border transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === 'book'
                  ? 'bg-[#FACC15] text-[#09090B] border-black shadow-[2px_2px_0px_#000000]'
                  : 'bg-transparent text-[#D4D4D8] border-transparent hover:bg-[#121417] hover:text-[#F4F4F5] hover:border-[#3F444E]'
              }`}
              onClick={() => setActiveTab('book')}
            >
              <Calendar className="w-3.5 h-3.5 shrink-0" strokeWidth={2.5} aria-hidden="true" />
              <span>{isEn ? 'Book station' : 'Varaa laite'}</span>
            </button>

            <button
              type="button"
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 min-h-[34px] text-xs font-mono font-bold uppercase tracking-tight rounded-none border transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === 'status'
                  ? 'bg-[#FACC15] text-[#09090B] border-black shadow-[2px_2px_0px_#000000]'
                  : 'bg-transparent text-[#D4D4D8] border-transparent hover:bg-[#121417] hover:text-[#F4F4F5] hover:border-[#3F444E]'
              }`}
              onClick={() => setActiveTab('status')}
            >
              <span className="inline-block w-2 h-2 rounded-full bg-[#22C55E] shrink-0" aria-hidden="true" />
              <span>{isEn ? 'Live status' : 'Tilan tilanne'}</span>
            </button>

            <button
              type="button"
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 min-h-[34px] text-xs font-mono font-bold uppercase tracking-tight rounded-none border transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === 'games'
                  ? 'bg-[#FACC15] text-[#09090B] border-black shadow-[2px_2px_0px_#000000]'
                  : 'bg-transparent text-[#D4D4D8] border-transparent hover:bg-[#121417] hover:text-[#F4F4F5] hover:border-[#3F444E]'
              }`}
              onClick={() => setActiveTab('games')}
            >
              <Gamepad2 className="w-3.5 h-3.5 shrink-0" strokeWidth={2.5} aria-hidden="true" />
              <span>{isEn ? 'Games and wishlist' : 'Pelit ja toivelista'}</span>
            </button>

            <button
              type="button"
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 min-h-[34px] text-xs font-mono font-bold uppercase tracking-tight rounded-none border transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === 'rules'
                  ? 'bg-[#FACC15] text-[#09090B] border-black shadow-[2px_2px_0px_#000000]'
                  : 'bg-transparent text-[#D4D4D8] border-transparent hover:bg-[#121417] hover:text-[#F4F4F5] hover:border-[#3F444E]'
              }`}
              onClick={() => setActiveTab('rules')}
            >
              <BookOpen className="w-3.5 h-3.5 shrink-0" strokeWidth={2.5} aria-hidden="true" />
              <span>{isEn ? 'Rules and guide' : 'Säännöt ja ohjeet'}</span>
            </button>

            <button
              type="button"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 min-h-[34px] text-xs font-mono font-bold uppercase tracking-tight rounded-none border border-transparent bg-transparent text-[#D4D4D8] hover:bg-[#121417] hover:text-[#F4F4F5] hover:border-[#3F444E] transition-colors cursor-pointer whitespace-nowrap"
              onClick={onOpenFloorPlan}
            >
              <Map className="w-3.5 h-3.5 shrink-0 text-[#3B82F6]" strokeWidth={2.5} aria-hidden="true" />
              <span>{isEn ? 'Floor plan' : 'Tilan pohjakuva'}</span>
            </button>

            <a
              href="https://discord.gg/xamk"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 min-h-[34px] text-xs font-mono font-bold uppercase tracking-tight rounded-none border border-transparent bg-transparent text-[#D4D4D8] hover:bg-[#121417] hover:text-[#F4F4F5] hover:border-[#3F444E] transition-colors cursor-pointer whitespace-nowrap"
              title="Xamk Gaming Discord"
            >
              <DiscordIcon className="w-3.5 h-3.5 shrink-0" />
              <span>Discord</span>
            </a>

            <button
              type="button"
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 min-h-[34px] text-xs font-mono font-bold uppercase tracking-tight rounded-none border transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === 'my-bookings'
                  ? 'bg-[#FACC15] text-[#09090B] border-black shadow-[2px_2px_0px_#000000]'
                  : 'bg-transparent text-[#D4D4D8] border-transparent hover:bg-[#121417] hover:text-[#F4F4F5] hover:border-[#3F444E]'
              }`}
              onClick={() => setActiveTab('my-bookings')}
            >
              <ClipboardList className="w-3.5 h-3.5 shrink-0" strokeWidth={2.5} aria-hidden="true" />
              <span>{isEn ? 'My bookings' : 'Omat varaukset'}</span>
            </button>

            {/* Admin-pudotusvalikko ylläpitäjille ja pääkäyttäjille */}
            {isAdmin && (
              <DropdownMenu>
                <div className="inline-flex items-stretch">
                  <button
                    type="button"
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 min-h-[34px] text-xs font-mono font-bold uppercase tracking-tight rounded-none border transition-colors cursor-pointer whitespace-nowrap ${
                      activeTab === 'admin' || activeTab === 'superadmin'
                        ? 'bg-[#FACC15] text-[#09090B] border-black shadow-[2px_2px_0px_#000000]'
                        : 'bg-[#121417] text-[#FACC15] border-[#FACC15] hover:bg-[#FACC15] hover:text-[#09090B]'
                    }`}
                    onClick={() => setActiveTab('admin')}
                  >
                    <Settings className="w-3.5 h-3.5 shrink-0" strokeWidth={2.5} aria-hidden="true" />
                    <span>Admin</span>
                  </button>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className={`inline-flex items-center justify-center px-2 py-1.5 min-h-[34px] text-xs font-mono font-bold uppercase tracking-tight rounded-none border border-l-0 transition-colors cursor-pointer whitespace-nowrap ${
                        activeTab === 'admin' || activeTab === 'superadmin'
                          ? 'bg-[#FACC15] text-[#09090B] border-black shadow-[2px_2px_0px_#000000]'
                          : 'bg-[#121417] text-[#FACC15] border-[#FACC15] hover:bg-[#FACC15] hover:text-[#09090B]'
                      }`}
                      aria-label="Ylläpitovalikko"
                    >
                      <ChevronDown className="w-3.5 h-3.5 shrink-0" strokeWidth={2.5} aria-hidden="true" />
                    </button>
                  </DropdownMenuTrigger>
                </div>
                <DropdownMenuContent align="end" className="rounded-none bg-[#1C1F24] text-[#F4F4F5] border-2 border-[#3F444E] shadow-[4px_4px_0px_#000000] min-w-[220px] p-1">
                  <DropdownMenuLabel>
                    {isEn ? 'Admin control panel' : 'Ylläpidon hallinta'}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className={
                      activeTab === 'admin' && adminSubTab === 'games' ? 'bg-[#FACC15] text-[#09090B] font-extrabold' : ''
                    }
                    onClick={() => handleAdminSubTabClick('games')}
                  >
                    <Gamepad2 className="w-4 h-4 shrink-0" strokeWidth={2.5} aria-hidden="true" />
                    <span>{isEn ? 'Games and wishlist' : 'Pelit ja toivelista'}</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className={
                      activeTab === 'admin' && adminSubTab === 'news' ? 'bg-[#FACC15] text-[#09090B] font-extrabold' : ''
                    }
                    onClick={() => handleAdminSubTabClick('news')}
                  >
                    <Newspaper className="w-4 h-4 shrink-0" strokeWidth={2.5} aria-hidden="true" />
                    <span>{isEn ? 'News and announcements' : 'Uutiset ja tiedotteet'}</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className={
                      activeTab === 'admin' && adminSubTab === 'users' ? 'bg-[#FACC15] text-[#09090B] font-extrabold' : ''
                    }
                    onClick={() => handleAdminSubTabClick('users')}
                  >
                    <Users className="w-4 h-4 shrink-0" strokeWidth={2.5} aria-hidden="true" />
                    <span>{isEn ? 'Users and roles' : 'Käyttäjät ja roolit'}</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className={
                      activeTab === 'admin' && adminSubTab === 'settings' ? 'bg-[#FACC15] text-[#09090B] font-extrabold' : ''
                    }
                    onClick={() => handleAdminSubTabClick('settings')}
                  >
                    <Settings className="w-4 h-4 shrink-0" strokeWidth={2.5} aria-hidden="true" />
                    <span>{isEn ? 'Settings and Discord' : 'Asetukset ja Discord'}</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className={
                      activeTab === 'admin' && adminSubTab === 'statistics' ? 'bg-[#FACC15] text-[#09090B] font-extrabold' : ''
                    }
                    onClick={() => handleAdminSubTabClick('statistics')}
                  >
                    <BarChart3 className="w-4 h-4 shrink-0" strokeWidth={2.5} aria-hidden="true" />
                    <span>{isEn ? 'Statistics and usage' : 'Tilastot ja käyttöaste'}</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className={
                      activeTab === 'admin' && adminSubTab === 'issues' ? 'bg-[#FACC15] text-[#09090B] font-extrabold' : ''
                    }
                    onClick={() => handleAdminSubTabClick('issues')}
                  >
                    <AlertTriangle className="w-4 h-4 shrink-0" strokeWidth={2.5} aria-hidden="true" />
                    <span>{isEn ? 'Issue reports' : 'Vikailmoitukset'}</span>
                  </DropdownMenuItem>
                  {isSuperAdmin && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className={activeTab === 'superadmin' ? 'bg-[#FACC15] text-[#09090B] font-extrabold' : ''}
                        onClick={() => handleTabClick('superadmin')}
                      >
                        <Zap className="w-4 h-4 shrink-0" strokeWidth={2.5} aria-hidden="true" />
                        <span>{t('nav.superadmin')}</span>
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </nav>
        </div>
      )}

      {/* Mobile Drawer */}
      {/* Mobiilinäkymän sivuvalikko (Drawer) */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex justify-end" onClick={() => setIsMobileMenuOpen(false)}>
          <div
            id="mobile-nav-drawer"
            className="w-full max-w-xs h-full bg-[#121417] text-[#F4F4F5] border-l-2 border-[#FACC15] flex flex-col overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={t('nav.menu')}
          >
            <div className="flex items-center justify-between p-4 border-b border-[#3F444E] bg-[#1C1F24]">
              <div className="flex flex-col">
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#FACC15]">XAMK GAME ROOM</span>
                <h3 className="text-lg font-extrabold uppercase tracking-tight text-[#F4F4F5]">{t('nav.menu')}</h3>
              </div>
              <button
                type="button"
                className="inline-flex items-center justify-center w-10 h-10 rounded-none bg-[#121417] text-[#F4F4F5] border border-[#3F444E] hover:border-[#FACC15] hover:text-[#FACC15] cursor-pointer"
                onClick={() => setIsMobileMenuOpen(false)}
                aria-label={t('nav.closeMenu')}
              >
                <X className="w-4 h-4 shrink-0" strokeWidth={2.5} aria-hidden="true" />
              </button>
            </div>

            <div className="p-4 border-b border-[#3F444E]">
              <div className="rounded-none bg-[#1C1F24] border border-[#3F444E] shadow-[4px_4px_0px_#000000] p-3 flex flex-col gap-3">
                <div className="inline-flex items-center justify-center w-10 h-10 shrink-0 rounded-none bg-[#FACC15] text-[#09090B] border-2 border-black font-mono font-extrabold text-base">
                  <span>{displayName.charAt(0).toUpperCase()}</span>
                </div>
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="text-sm font-extrabold text-[#F4F4F5] truncate">{displayName}</span>
                  <span className="text-xs font-mono text-[#A1A1AA] truncate">
                    {user?.email || 'matti.meikalainen@edu.xamk.fi'}
                  </span>
                  <span className="inline-block w-fit mt-1 px-2 py-0.5 text-[10px] font-mono font-bold uppercase rounded-none bg-[#FACC15] text-[#09090B] border border-black">{displayRole}</span>
                </div>
                <button
                  type="button"
                  className="w-full py-2 px-3 rounded-none bg-[#121417] text-[#F4F4F5] border border-[#3F444E] hover:border-[#EF4444] hover:text-[#EF4444] font-mono font-bold text-xs uppercase cursor-pointer"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    if (user) {
                      logout();
                    } else {
                      onOpenLogin();
                    }
                  }}
                >
                  {user ? t('nav.logout') : t('nav.login')}
                </button>
              </div>
            </div>

            <nav className="flex flex-col p-4 gap-2 flex-1" aria-label="Mobiilin päävalikko">
              <button
                type="button"
                className={`w-full text-left px-3 py-3 rounded-none font-mono font-bold text-sm uppercase border cursor-pointer transition-colors ${
                  activeTab === 'book'
                    ? 'bg-[#FACC15] text-[#09090B] border-black shadow-[3px_3px_0px_#000000]'
                    : 'bg-[#1C1F24] text-[#F4F4F5] border-[#3F444E] hover:border-[#FACC15]'
                }`}
                onClick={() => handleTabClick('book')}
              >
                <span>{t('nav.book')}</span>
              </button>
              <button
                type="button"
                className={`w-full text-left px-3 py-3 rounded-none font-mono font-bold text-sm uppercase border cursor-pointer transition-colors ${
                  activeTab === 'status'
                    ? 'bg-[#FACC15] text-[#09090B] border-black shadow-[3px_3px_0px_#000000]'
                    : 'bg-[#1C1F24] text-[#F4F4F5] border-[#3F444E] hover:border-[#FACC15]'
                }`}
                onClick={() => handleTabClick('status')}
              >
                <span>{t('nav.status')}</span>
              </button>
              <button
                type="button"
                className={`w-full text-left px-3 py-3 rounded-none font-mono font-bold text-sm uppercase border cursor-pointer transition-colors ${
                  activeTab === 'games'
                    ? 'bg-[#FACC15] text-[#09090B] border-black shadow-[3px_3px_0px_#000000]'
                    : 'bg-[#1C1F24] text-[#F4F4F5] border-[#3F444E] hover:border-[#FACC15]'
                }`}
                onClick={() => handleTabClick('games')}
              >
                <span>{t('nav.games')}</span>
              </button>
              <button
                type="button"
                className={`w-full text-left px-3 py-3 rounded-none font-mono font-bold text-sm uppercase border cursor-pointer transition-colors ${
                  activeTab === 'rules'
                    ? 'bg-[#FACC15] text-[#09090B] border-black shadow-[3px_3px_0px_#000000]'
                    : 'bg-[#1C1F24] text-[#F4F4F5] border-[#3F444E] hover:border-[#FACC15]'
                }`}
                onClick={() => handleTabClick('rules')}
              >
                <span>{t('nav.rules')}</span>
              </button>
              <button
                type="button"
                className="w-full text-left px-3 py-3 rounded-none font-mono font-bold text-sm uppercase border cursor-pointer transition-colors bg-[#1C1F24] text-[#F4F4F5] border-[#3F444E] hover:border-[#FACC15]"
                onClick={handleFloorPlanClick}
              >
                <span>{t('nav.floorplan')}</span>
              </button>
              <button
                type="button"
                className={`w-full text-left px-3 py-3 rounded-none font-mono font-bold text-sm uppercase border cursor-pointer transition-colors ${
                  activeTab === 'my-bookings'
                    ? 'bg-[#FACC15] text-[#09090B] border-black shadow-[3px_3px_0px_#000000]'
                    : 'bg-[#1C1F24] text-[#F4F4F5] border-[#3F444E] hover:border-[#FACC15]'
                }`}
                onClick={() => handleTabClick('my-bookings')}
              >
                <span>{t('nav.myBookings')}</span>
              </button>
              {isAdmin && (
                <button
                  type="button"
                  className={`w-full text-left px-3 py-3 rounded-none font-mono font-bold text-sm uppercase border cursor-pointer transition-colors ${
                    activeTab === 'admin'
                      ? 'bg-[#FACC15] text-[#09090B] border-black shadow-[3px_3px_0px_#000000]'
                      : 'bg-[#1C1F24] text-[#3B82F6] border-[#3B82F6] hover:bg-[#3B82F6] hover:text-white'
                  }`}
                  onClick={() => handleTabClick('admin')}
                >
                  <span>{t('nav.admin')}</span>
                </button>
              )}
              {isSuperAdmin && (
                <button
                  type="button"
                  className={`w-full text-left px-3 py-3 rounded-none font-mono font-bold text-sm uppercase border cursor-pointer transition-colors ${
                    activeTab === 'superadmin'
                      ? 'bg-[#FACC15] text-[#09090B] border-black shadow-[3px_3px_0px_#000000]'
                      : 'bg-[#1C1F24] text-[#FACC15] border-[#FACC15] hover:bg-[#FACC15] hover:text-[#09090B]'
                  }`}
                  onClick={() => handleTabClick('superadmin')}
                >
                  <span>{t('nav.superadmin')}</span>
                </button>
              )}
            </nav>

            <div className="p-4 border-t border-[#3F444E] flex flex-col gap-2 bg-[#1C1F24]">
              {onOpenIssueModal && (
                <button
                  type="button"
                  className="w-full py-2.5 px-3 rounded-none bg-[#121417] text-[#FACC15] border border-[#FACC15] font-mono font-bold text-xs uppercase text-center cursor-pointer hover:bg-[#FACC15] hover:text-[#09090B]"
                  onClick={handleIssueClick}
                >
                  <span>{t('issue.reportBtn')}</span>
                </button>
              )}
              <a
                href="https://discord.gg/xamk"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-3 rounded-none bg-[#3B82F6] text-white border-2 border-black shadow-[3px_3px_0px_#000000] font-mono font-bold text-xs uppercase text-center inline-flex items-center justify-center gap-2 hover:bg-[#2563EB]"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <DiscordIcon className="w-4 h-4 shrink-0" />
                <span>{t('footer.discord')}</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
