import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { LanguageSwitcher } from './LanguageSwitcher';
import { Button } from '@/components/ui/button';
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
  const { t } = useLanguage();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Sulje mobiilivalikko kun painetaan Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileMenuOpen]);

  // Estä taustasisällön vieritys mobiilivalikon ollessa auki
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
    <header className="navbar">
      <div className="navbar-container">
        {/* Logo ja otsikko */}
        <div className="navbar-brand">
          <img src="/xamk-logo.png" alt="Xamk" className="navbar-xamk-logo" />
          <div className="navbar-brand-text">
            <h1 className="navbar-title">{t('nav.title')}</h1>
            <span className="navbar-subtitle">{t('nav.subtitle')}</span>
          </div>
        </div>

        {/* Työpöytänäkymän toiminnot (piilotetaan mobiilissa) */}
        <div className="navbar-desktop-actions">
          {onOpenIssueModal && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="btn-touch border-[#ef4444]/40 text-[#ef4444] hover:bg-[#ef4444]/10"
              onClick={onOpenIssueModal}
              title={t('issue.desc')}
            >
              {t('issue.reportBtn')}
            </Button>
          )}

          {/* Kielivalitsin (FI / EN) */}
          <LanguageSwitcher />

          {user ? (
            <div className="user-profile">
              <div className="user-info">
                <span className="user-name">{user.displayName}</span>
                <span className={`role-badge role-${user.role.toLowerCase()}`}>
                  {user.role}
                </span>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="btn-touch border-[#2b313d] bg-[#1c2027] text-white hover:bg-[#242933] hover:border-[#fbba18]/60 hover:text-[#fbba18] font-medium shadow-sm transition-all"
                onClick={logout}
                aria-label={t('nav.logout')}
              >
                {t('nav.logout')}
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              variant="xamk"
              size="sm"
              className="btn-touch"
              onClick={onOpenLogin}
              aria-label={t('nav.login')}
            >
              {t('nav.login')}
            </Button>
          )}
        </div>

        {/* Mobiilinäkymän toiminnot: Kielivalitsin + Hampurilaispainike */}
        <div className="navbar-mobile-actions">
          <LanguageSwitcher className="mobile-lang-switcher" />

          <button
            type="button"
            className={`hamburger-btn ${isMobileMenuOpen ? 'is-active' : ''}`}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label={isMobileMenuOpen ? t('nav.closeMenu') : t('nav.openMenu')}
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-nav-drawer"
          >
            <span className="hamburger-box">
              <span className="hamburger-line top-line"></span>
              <span className="hamburger-line middle-line"></span>
              <span className="hamburger-line bottom-line"></span>
            </span>
          </button>
        </div>
      </div>

      {/* Työpöytänäkymän välilehtipalkki (piilotettu mobiilissa, korvattu hampurilaisvalikolla) */}
      <nav className="navbar-tabs desktop-tabs-only" aria-label="Päävalikko">
        <button
          type="button"
          className={`tab-btn btn-touch ${activeTab === 'book' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('book')}
        >
          {t('nav.book')}
        </button>
        <button
          type="button"
          className={`tab-btn btn-touch ${activeTab === 'status' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('status')}
        >
          {t('nav.status')}
        </button>
        <button
          type="button"
          className={`tab-btn btn-touch ${activeTab === 'games' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('games')}
        >
          {t('nav.games')}
        </button>
        <button
          type="button"
          className={`tab-btn btn-touch ${activeTab === 'rules' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('rules')}
        >
          {t('nav.rules')}
        </button>
        <button
          type="button"
          className="tab-btn btn-touch"
          onClick={onOpenFloorPlan}
        >
          {t('nav.floorplan')}
        </button>
        <a
          href="https://discord.gg/xamk"
          target="_blank"
          rel="noopener noreferrer"
          className="tab-btn btn-touch discord-tab-link"
          title="Xamk Gaming Discord"
        >
          {t('nav.discord')}
        </a>
        {user && (
          <button
            type="button"
            className={`tab-btn btn-touch ${activeTab === 'my-bookings' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('my-bookings')}
          >
            {t('nav.myBookings')}
          </button>
        )}
        {isAdmin && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className={`tab-btn btn-touch tab-admin flex items-center gap-1.5 ${
                  activeTab === 'admin' || activeTab === 'superadmin' ? 'tab-active' : ''
                }`}
                aria-label="Ylläpitovalikko"
              >
                <span>{t('nav.admin')}</span>
                <span className="text-[10px] opacity-75">▼</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-[#1c2027] border-[#2b313d] text-foreground p-1.5 rounded-xl shadow-2xl">
              <DropdownMenuLabel className="text-xs text-[#9da3ae] px-3 py-1.5 font-semibold uppercase tracking-wider">
                Ylläpito / Admin
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-[#2b313d] my-1" />
              <DropdownMenuItem
                className={`cursor-pointer rounded-lg px-3 py-2 text-sm font-medium hover:bg-[#242933] hover:text-[#fbba18] flex items-center gap-2 ${
                  activeTab === 'admin' ? 'bg-[#242933] text-[#fbba18] font-bold' : ''
                }`}
                onClick={() => handleTabClick('admin')}
              >
                <span>{t('nav.admin')} (Hallintapaneeli)</span>
              </DropdownMenuItem>
              {isSuperAdmin && (
                <DropdownMenuItem
                  className={`cursor-pointer rounded-lg px-3 py-2 text-sm font-medium hover:bg-[#242933] hover:text-[#fbba18] flex items-center gap-2 ${
                    activeTab === 'superadmin' ? 'bg-[#242933] text-[#fbba18] font-bold' : ''
                  }`}
                  onClick={() => handleTabClick('superadmin')}
                >
                  <span>{t('nav.superadmin')} (Tapahtumajyräys)</span>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </nav>

      {/* Mobiilin Hampurilaisvalikko (Drawer & Backdrop) */}
      {isMobileMenuOpen && (
        <div className="mobile-menu-backdrop" onClick={() => setIsMobileMenuOpen(false)}>
          <div
            id="mobile-nav-drawer"
            className="mobile-menu-drawer"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={t('nav.menu')}
          >
            {/* Drawer Header */}
            <div className="mobile-drawer-header">
              <div className="mobile-drawer-title">
                <span className="mobile-drawer-badge">XAMK GAME ROOM</span>
                <h3>{t('nav.menu')}</h3>
              </div>
              <button
                type="button"
                className="btn-close btn-touch mobile-drawer-close"
                onClick={() => setIsMobileMenuOpen(false)}
                aria-label={t('nav.closeMenu')}
              >
                ✕
              </button>
            </div>

            {/* Käyttäjän tiedot & Kirjautuminen mobiilissa */}
            <div className="mobile-user-section">
              {user ? (
                <div className="mobile-user-card">
                  <div className="mobile-user-avatar">
                    <span>{user.displayName.charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="mobile-user-info">
                    <span className="mobile-user-name">{user.displayName}</span>
                    <span className="mobile-user-email">{user.email}</span>
                    <span className={`role-badge role-${user.role.toLowerCase()}`}>
                      {user.role}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm mobile-logout-btn"
                    onClick={handleLogout}
                  >
                    {t('nav.logout')}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  className="btn btn-primary btn-touch btn-large"
                  onClick={handleLogin}
                >
                  {t('nav.login')}
                </button>
              )}
            </div>

            {/* Navigointilinkit mobiilissa */}
            <nav className="mobile-nav-list" aria-label="Mobiilin päävalikko">
              <button
                type="button"
                className={`mobile-nav-item ${activeTab === 'book' ? 'item-active' : ''}`}
                onClick={() => handleTabClick('book')}
              >
                <span className="mobile-nav-text">{t('nav.book')}</span>
                {activeTab === 'book' && <span className="active-dot">●</span>}
              </button>

              <button
                type="button"
                className={`mobile-nav-item ${activeTab === 'status' ? 'item-active' : ''}`}
                onClick={() => handleTabClick('status')}
              >
                <span className="mobile-nav-text">{t('nav.status')}</span>
                {activeTab === 'status' && <span className="active-dot">●</span>}
              </button>

              <button
                type="button"
                className={`mobile-nav-item ${activeTab === 'games' ? 'item-active' : ''}`}
                onClick={() => handleTabClick('games')}
              >
                <span className="mobile-nav-text">{t('nav.games')}</span>
                {activeTab === 'games' && <span className="active-dot">●</span>}
              </button>

              <button
                type="button"
                className={`mobile-nav-item ${activeTab === 'rules' ? 'item-active' : ''}`}
                onClick={() => handleTabClick('rules')}
              >
                <span className="mobile-nav-text">{t('nav.rules')}</span>
                {activeTab === 'rules' && <span className="active-dot">●</span>}
              </button>

              <button
                type="button"
                className="mobile-nav-item"
                onClick={handleFloorPlanClick}
              >
                <span className="mobile-nav-text">{t('nav.floorplan')}</span>
              </button>

              {user && (
                <button
                  type="button"
                  className={`mobile-nav-item ${activeTab === 'my-bookings' ? 'item-active' : ''}`}
                  onClick={() => handleTabClick('my-bookings')}
                >
                  <span className="mobile-nav-text">{t('nav.myBookings')}</span>
                  {activeTab === 'my-bookings' && <span className="active-dot">●</span>}
                </button>
              )}

              {isAdmin && (
                <button
                  type="button"
                  className={`mobile-nav-item item-admin ${activeTab === 'admin' ? 'item-active' : ''}`}
                  onClick={() => handleTabClick('admin')}
                >
                  <span className="mobile-nav-text">{t('nav.admin')}</span>
                  {activeTab === 'admin' && <span className="active-dot">●</span>}
                </button>
              )}

              {isSuperAdmin && (
                <button
                  type="button"
                  className={`mobile-nav-item item-superadmin ${activeTab === 'superadmin' ? 'item-active' : ''}`}
                  onClick={() => handleTabClick('superadmin')}
                >
                  <span className="mobile-nav-text">{t('nav.superadmin')}</span>
                  {activeTab === 'superadmin' && <span className="active-dot">●</span>}
                </button>
              )}
            </nav>

            {/* Mobiilivalikon toissijaiset toiminnot */}
            <div className="mobile-drawer-extra">
              {onOpenIssueModal && (
                <button
                  type="button"
                  className="mobile-extra-btn issue-extra-btn"
                  onClick={handleIssueClick}
                >
                  <span>{t('issue.reportBtn')}</span>
                </button>
              )}

              <a
                href="https://discord.gg/xamk"
                target="_blank"
                rel="noopener noreferrer"
                className="mobile-extra-btn discord-extra-btn"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <span>{t('footer.discord')}</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
