import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { LanguageSwitcher } from './LanguageSwitcher';
import {
  Calendar,
  Activity,
  Gamepad2,
  BookOpen,
  Map,
  MessageSquare,
  ClipboardList,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  LogOut,
  LogIn,
  Menu,
  X,
  Shield,
  Zap,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

export type AppTab = 'book' | 'status' | 'games' | 'rules' | 'my-bookings' | 'admin' | 'superadmin';

interface NavbarProps {
  onOpenLogin: () => void;
  onOpenFloorPlan: () => void;
  onOpenIssueModal?: () => void;
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenLogin,
  onOpenFloorPlan,
  onOpenIssueModal,
  activeTab,
  setActiveTab,
}) => {
  const { user, logout, isSuperAdmin, isAdmin } = useAuth();
  const { t, lang } = useLanguage();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileMenuOpen]);

  const handleTabClick = (tab: AppTab) => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
  };

  const handleFloorPlanClick = () => {
    setIsMobileMenuOpen(false);
    onOpenFloorPlan();
  };

  const handleIssueClick = () => {
    setIsMobileMenuOpen(false);
    onOpenIssueModal?.();
  };

  const handleLogout = () => {
    setIsMobileMenuOpen(false);
    logout();
  };

  const handleLogin = () => {
    setIsMobileMenuOpen(false);
    onOpenLogin();
  };

  return (
    <header className="w-full max-w-full overflow-hidden bg-[#0a0b0d] border-b border-[#1c1f26] sticky top-0 z-50 select-none">
      <div className="max-w-[1720px] w-full mx-auto px-3 sm:px-6 lg:px-8 py-2 sm:py-2.5 flex items-center justify-between gap-2 sm:gap-4 min-w-0">
        {/* Vasen laita: Virallinen XAMK Hero -logo ja otsikot (Aina näkyvissä myös mobiilissa) */}
        <div
          className="flex items-center gap-2 sm:gap-2.5 cursor-pointer select-none group min-w-0 flex-shrink-0"
          onClick={() => handleTabClick('book')}
        >
          <img
            src="/xamk-hero-logo.png"
            alt="Xamk Logo"
            className="h-6 sm:h-7 md:h-8 w-auto object-contain flex-shrink-0"
          />
          <div className="flex flex-col leading-tight min-w-0">
            <span className="text-white font-extrabold tracking-wide text-[11px] sm:text-xs md:text-sm uppercase truncate">
              {t('nav.title')}
            </span>
            <span className="text-[#d89619] text-[8px] sm:text-[9px] md:text-[10px] font-bold tracking-widest uppercase truncate">
              {t('nav.subtitle')}
            </span>
          </div>
        </div>

        {/* Keskialue: Navigaatiotelakka työpöydällä */}
        <nav className="hidden xl:flex items-center gap-1 bg-[#12141a]/90 backdrop-blur-md p-1 rounded-xl border border-[#262a36] min-w-0">
          <button
            type="button"
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'book'
                ? 'border border-[#d89619] bg-[#d89619]/15 text-[#fbba18] shadow-xs font-bold'
                : 'text-gray-300 hover:text-white hover:bg-white/5'
            }`}
            onClick={() => handleTabClick('book')}
          >
            <Calendar className="w-3.5 h-3.5 text-[#d89619]" />
            <span>{t('nav.book')}</span>
          </button>

          <button
            type="button"
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'status'
                ? 'border border-[#d89619] bg-[#d89619]/15 text-[#fbba18] shadow-xs font-bold'
                : 'text-gray-300 hover:text-white hover:bg-white/5'
            }`}
            onClick={() => handleTabClick('status')}
          >
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            <span>{t('nav.status')}</span>
          </button>

          <button
            type="button"
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'games'
                ? 'border border-[#d89619] bg-[#d89619]/15 text-[#fbba18] shadow-xs font-bold'
                : 'text-gray-300 hover:text-white hover:bg-white/5'
            }`}
            onClick={() => handleTabClick('games')}
          >
            <Gamepad2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>{t('nav.games')}</span>
          </button>

          <button
            type="button"
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'rules'
                ? 'border border-[#d89619] bg-[#d89619]/15 text-[#fbba18] shadow-xs font-bold'
                : 'text-gray-300 hover:text-white hover:bg-white/5'
            }`}
            onClick={() => handleTabClick('rules')}
          >
            <BookOpen className="w-3.5 h-3.5 text-purple-400" />
            <span>{t('nav.rules')}</span>
          </button>

          <button
            type="button"
            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-300 hover:text-white hover:bg-white/5 transition-all flex items-center gap-1.5 cursor-pointer"
            onClick={onOpenFloorPlan}
          >
            <Map className="w-3.5 h-3.5 text-amber-400" />
            <span>{t('nav.floorplan')}</span>
          </button>

          <a
            href="https://discord.gg/xamk"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-300 hover:text-white hover:bg-white/5 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <MessageSquare className="w-3.5 h-3.5 text-[#5865F2]" />
            <span>Discord</span>
          </a>

          {user && (
            <button
              type="button"
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'my-bookings'
                  ? 'border border-[#d89619] bg-[#d89619]/15 text-[#fbba18] shadow-xs font-bold'
                  : 'text-gray-300 hover:text-white hover:bg-white/5'
              }`}
              onClick={() => handleTabClick('my-bookings')}
            >
              <ClipboardList className="w-3.5 h-3.5 text-emerald-400" />
              <span>{t('nav.myBookings')}</span>
            </button>
          )}

          {isAdmin && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer ${
                    activeTab === 'admin' || activeTab === 'superadmin'
                      ? 'border border-[#d89619] bg-[#d89619]/15 text-[#fbba18] font-bold'
                      : 'text-gray-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Shield className="w-3.5 h-3.5 text-[#fbba18]" />
                  <span>Admin</span>
                  <ChevronDown className="w-3 h-3 text-gray-400" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52 bg-[#14161f] border border-[#2b313d] text-white p-1 rounded-xl shadow-2xl">
                <DropdownMenuLabel className="text-[11px] text-gray-400 px-3 py-1 uppercase tracking-wider font-bold">
                  Ylläpito
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-[#2b313d] my-1" />
                <DropdownMenuItem
                  className="cursor-pointer px-3 py-2 text-xs font-medium hover:bg-[#202430] hover:text-[#fbba18] flex items-center gap-2"
                  onClick={() => handleTabClick('admin')}
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>{t('nav.admin')}</span>
                </DropdownMenuItem>
                {isSuperAdmin && (
                  <DropdownMenuItem
                    className="cursor-pointer px-3 py-2 text-xs font-medium hover:bg-[#202430] hover:text-[#fbba18] flex items-center gap-2"
                    onClick={() => handleTabClick('superadmin')}
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    <span>{t('nav.superadmin')}</span>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </nav>

        {/* Oikea laita: Ilmoita viasta + Kielivalitsin + Käyttäjäinfo */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0 min-w-0">
          {onOpenIssueModal && (
            <button
              type="button"
              className="hidden lg:flex items-center gap-1 text-xs font-bold text-[#d89619] hover:text-[#fbba18] transition-colors px-2 py-1 cursor-pointer"
              onClick={onOpenIssueModal}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{t('footer.report')}</span>
            </button>
          )}

          <LanguageSwitcher />

          {user ? (
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#14161f] border border-[#262935] text-xs">
                <span className="text-white font-bold truncate max-w-[120px]">{user.displayName}</span>
                <span className="text-[#d89619] font-bold text-[9px] uppercase bg-[#d89619]/10 px-1 py-0.5 rounded border border-[#d89619]/30">
                  {user.role}
                </span>
              </div>
              <button
                type="button"
                className="hidden xl:flex p-1.5 px-2.5 py-1 rounded-lg bg-[#1a1d26] hover:bg-[#242835] border border-[#2e3342] text-xs font-medium text-gray-300 hover:text-white transition-all cursor-pointer items-center gap-1"
                onClick={handleLogout}
                title={t('nav.logout')}
              >
                <LogOut className="w-3.5 h-3.5 text-gray-400" />
                <span>{t('nav.logout')}</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="px-2.5 sm:px-3 py-1.5 rounded-lg bg-[#d89619] hover:bg-[#c48410] active:bg-[#a66f0d] text-[#0a0b0d] font-bold text-xs uppercase tracking-wide cursor-pointer shadow-md flex items-center gap-1.5 flex-shrink-0"
              onClick={handleLogin}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t('nav.login')}</span>
              <span className="sm:hidden">{lang === 'en' ? 'Login' : 'Kirjaudu'}</span>
            </button>
          )}

          {/* Mobiilivalikon avauspainike - Aina näkyvissä ja flex-shrink-0 */}
          <button
            type="button"
            className="xl:hidden p-1.5 rounded-lg bg-[#14161f] border border-[#2b313d] text-gray-300 hover:text-white cursor-pointer flex-shrink-0"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Valikko"
          >
            {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobiilivalikko (Mobiili-optimoitu 48px kosketusalueilla) */}
      {isMobileMenuOpen && (
        <div className="xl:hidden bg-[#0d0f14] border-t border-[#1c1f26] px-4 py-4 flex flex-col gap-2 max-w-full animate-in fade-in slide-in-from-top-2 duration-200 shadow-2xl">
          {user && (
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#14161f] border border-[#252936] mb-1">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-[#fbba18]/15 border border-[#fbba18]/30 flex items-center justify-center text-[#fbba18] font-bold text-xs flex-shrink-0">
                  {user.displayName.charAt(0).toUpperCase()}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-white font-bold text-xs truncate">{user.displayName}</span>
                  <span className="text-gray-400 text-[10px] truncate">{user.email}</span>
                </div>
              </div>
              <span className="text-[#d89619] font-bold text-[10px] uppercase bg-[#d89619]/15 px-2 py-0.5 rounded border border-[#d89619]/30 flex-shrink-0">
                {user.role}
              </span>
            </div>
          )}

          {/* Päänavigaation kortit */}
          <div className="flex flex-col gap-2">
            <button
              type="button"
              className={`w-full min-h-[48px] px-3.5 py-2.5 rounded-xl border flex items-center justify-between transition-all cursor-pointer active:scale-[0.99] ${
                activeTab === 'book'
                  ? 'bg-[#fbba18]/10 border-[#fbba18]/60 text-[#fbba18] font-bold shadow-md'
                  : 'bg-[#14161f] border-[#262a36] text-gray-200 hover:bg-[#1c202a] hover:text-white'
              }`}
              onClick={() => handleTabClick('book')}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg flex-shrink-0 ${activeTab === 'book' ? 'bg-[#fbba18]/20 text-[#fbba18]' : 'bg-[#0e1015] text-[#d89619]'}`}>
                  <Calendar className="w-4 h-4" />
                </div>
                <span className="text-xs sm:text-sm font-semibold tracking-wide">{t('nav.book')}</span>
              </div>
              <ChevronRight className={`w-4 h-4 ${activeTab === 'book' ? 'text-[#fbba18]' : 'text-gray-500'}`} />
            </button>

            <button
              type="button"
              className={`w-full min-h-[48px] px-3.5 py-2.5 rounded-xl border flex items-center justify-between transition-all cursor-pointer active:scale-[0.99] ${
                activeTab === 'status'
                  ? 'bg-[#fbba18]/10 border-[#fbba18]/60 text-[#fbba18] font-bold shadow-md'
                  : 'bg-[#14161f] border-[#262a36] text-gray-200 hover:bg-[#1c202a] hover:text-white'
              }`}
              onClick={() => handleTabClick('status')}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg flex-shrink-0 ${activeTab === 'status' ? 'bg-[#fbba18]/20 text-[#fbba18]' : 'bg-[#0e1015] text-emerald-400'}`}>
                  <Activity className="w-4 h-4" />
                </div>
                <span className="text-xs sm:text-sm font-semibold tracking-wide">{t('nav.status')}</span>
              </div>
              <ChevronRight className={`w-4 h-4 ${activeTab === 'status' ? 'text-[#fbba18]' : 'text-gray-500'}`} />
            </button>

            <button
              type="button"
              className={`w-full min-h-[48px] px-3.5 py-2.5 rounded-xl border flex items-center justify-between transition-all cursor-pointer active:scale-[0.99] ${
                activeTab === 'games'
                  ? 'bg-[#fbba18]/10 border-[#fbba18]/60 text-[#fbba18] font-bold shadow-md'
                  : 'bg-[#14161f] border-[#262a36] text-gray-200 hover:bg-[#1c202a] hover:text-white'
              }`}
              onClick={() => handleTabClick('games')}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg flex-shrink-0 ${activeTab === 'games' ? 'bg-[#fbba18]/20 text-[#fbba18]' : 'bg-[#0e1015] text-cyan-400'}`}>
                  <Gamepad2 className="w-4 h-4" />
                </div>
                <span className="text-xs sm:text-sm font-semibold tracking-wide">{t('nav.games')}</span>
              </div>
              <ChevronRight className={`w-4 h-4 ${activeTab === 'games' ? 'text-[#fbba18]' : 'text-gray-500'}`} />
            </button>

            <button
              type="button"
              className={`w-full min-h-[48px] px-3.5 py-2.5 rounded-xl border flex items-center justify-between transition-all cursor-pointer active:scale-[0.99] ${
                activeTab === 'rules'
                  ? 'bg-[#fbba18]/10 border-[#fbba18]/60 text-[#fbba18] font-bold shadow-md'
                  : 'bg-[#14161f] border-[#262a36] text-gray-200 hover:bg-[#1c202a] hover:text-white'
              }`}
              onClick={() => handleTabClick('rules')}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg flex-shrink-0 ${activeTab === 'rules' ? 'bg-[#fbba18]/20 text-[#fbba18]' : 'bg-[#0e1015] text-purple-400'}`}>
                  <BookOpen className="w-4 h-4" />
                </div>
                <span className="text-xs sm:text-sm font-semibold tracking-wide">{t('nav.rules')}</span>
              </div>
              <ChevronRight className={`w-4 h-4 ${activeTab === 'rules' ? 'text-[#fbba18]' : 'text-gray-500'}`} />
            </button>

            <button
              type="button"
              className="w-full min-h-[48px] px-3.5 py-2.5 rounded-xl bg-[#14161f] border border-[#262a36] text-gray-200 hover:bg-[#1c202a] hover:text-white flex items-center justify-between transition-all cursor-pointer active:scale-[0.99]"
              onClick={handleFloorPlanClick}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[#0e1015] text-amber-400 flex-shrink-0">
                  <Map className="w-4 h-4" />
                </div>
                <span className="text-xs sm:text-sm font-semibold tracking-wide">{t('nav.floorplan')}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-500" />
            </button>

            <a
              href="https://discord.gg/xamk"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full min-h-[48px] px-3.5 py-2.5 rounded-xl bg-[#14161f] border border-[#262a36] text-gray-200 hover:bg-[#1c202a] hover:text-white flex items-center justify-between transition-all cursor-pointer active:scale-[0.99]"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[#0e1015] text-[#5865F2] flex-shrink-0">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <span className="text-xs sm:text-sm font-semibold tracking-wide">Discord</span>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-500" />
            </a>

            {user && (
              <button
                type="button"
                className={`w-full min-h-[48px] px-3.5 py-2.5 rounded-xl border flex items-center justify-between transition-all cursor-pointer active:scale-[0.99] ${
                  activeTab === 'my-bookings'
                    ? 'bg-[#fbba18]/10 border-[#fbba18]/60 text-[#fbba18] font-bold shadow-md'
                    : 'bg-[#14161f] border-[#262a36] text-gray-200 hover:bg-[#1c202a] hover:text-white'
                }`}
                onClick={() => handleTabClick('my-bookings')}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg flex-shrink-0 ${activeTab === 'my-bookings' ? 'bg-[#fbba18]/20 text-[#fbba18]' : 'bg-[#0e1015] text-emerald-400'}`}>
                    <ClipboardList className="w-4 h-4" />
                  </div>
                  <span className="text-xs sm:text-sm font-semibold tracking-wide">{t('nav.myBookings')}</span>
                </div>
                <ChevronRight className={`w-4 h-4 ${activeTab === 'my-bookings' ? 'text-[#fbba18]' : 'text-gray-500'}`} />
              </button>
            )}
          </div>

          {/* Ylläpito-osio */}
          {isAdmin && (
            <div className="pt-3 mt-1 border-t border-[#1c1f26] flex flex-col gap-2">
              <span className="text-[10px] text-gray-400 uppercase tracking-wider font-bold px-1">
                Ylläpito
              </span>
              <button
                type="button"
                className={`w-full min-h-[48px] px-3.5 py-2.5 rounded-xl border flex items-center justify-between transition-all cursor-pointer active:scale-[0.99] ${
                  activeTab === 'admin'
                    ? 'bg-[#fbba18]/10 border-[#fbba18]/60 text-[#fbba18] font-bold shadow-md'
                    : 'bg-[#14161f] border-[#262a36] text-gray-200 hover:bg-[#1c202a] hover:text-white'
                }`}
                onClick={() => handleTabClick('admin')}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg flex-shrink-0 ${activeTab === 'admin' ? 'bg-[#fbba18]/20 text-[#fbba18]' : 'bg-[#0e1015] text-[#fbba18]'}`}>
                    <Shield className="w-4 h-4" />
                  </div>
                  <span className="text-xs sm:text-sm font-semibold tracking-wide">{t('nav.admin')}</span>
                </div>
                <ChevronRight className={`w-4 h-4 ${activeTab === 'admin' ? 'text-[#fbba18]' : 'text-gray-500'}`} />
              </button>
              {isSuperAdmin && (
                <button
                  type="button"
                  className={`w-full min-h-[48px] px-3.5 py-2.5 rounded-xl border flex items-center justify-between transition-all cursor-pointer active:scale-[0.99] ${
                    activeTab === 'superadmin'
                      ? 'bg-[#fbba18]/10 border-[#fbba18]/60 text-[#fbba18] font-bold shadow-md'
                      : 'bg-[#14161f] border-[#262a36] text-gray-200 hover:bg-[#1c202a] hover:text-white'
                  }`}
                  onClick={() => handleTabClick('superadmin')}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg flex-shrink-0 ${activeTab === 'superadmin' ? 'bg-[#fbba18]/20 text-[#fbba18]' : 'bg-[#0e1015] text-amber-400'}`}>
                      <Zap className="w-4 h-4" />
                    </div>
                    <span className="text-xs sm:text-sm font-semibold tracking-wide">{t('nav.superadmin')}</span>
                  </div>
                  <ChevronRight className={`w-4 h-4 ${activeTab === 'superadmin' ? 'text-[#fbba18]' : 'text-gray-500'}`} />
                </button>
              )}
            </div>
          )}

          {/* Alaosa: Vikailmoitus ja Uloskirjautuminen */}
          <div className="pt-3 mt-1 border-t border-[#1c1f26] flex flex-col gap-2">
            {onOpenIssueModal && (
              <button
                type="button"
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-[#14161f] border border-[#262a36] hover:border-[#fbba18]/40 text-[#fbba18] flex items-center justify-between transition-all cursor-pointer active:scale-[0.99]"
                onClick={handleIssueClick}
              >
                <div className="flex items-center gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-[#fbba18]" />
                  <span className="text-xs font-semibold">{t('footer.report')}</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-gray-500" />
              </button>
            )}

            {user && (
              <button
                type="button"
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 text-rose-300 flex items-center justify-between transition-all cursor-pointer active:scale-[0.99]"
                onClick={handleLogout}
              >
                <div className="flex items-center gap-2.5">
                  <LogOut className="w-4 h-4" />
                  <span className="text-xs font-semibold">{t('nav.logout')}</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-rose-400/50" />
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
