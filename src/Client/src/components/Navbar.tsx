import React, { useState, useEffect } from 'react';
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

export type { AppTab };

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
  const { lang, t } = useLanguage();
  const { adminSubTab, setAdminSubTab } = useRouter();
  const isEn = lang === 'en';
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

  const handleAdminSubTabClick = (subTab: AdminSubTab) => {
    setAdminSubTab(subTab);
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

  const displayName = user?.displayName || 'Matti Meikäläinen';
  const displayRole = user?.role ? user.role.toUpperCase() : 'USER';

  return (
    <header className="xamk-topbar">
      <div className="xamk-topbar-inner">
        {/* Left: Xamk Brand Logo & Title */}
        <button
          type="button"
          className="xamk-brand-btn min-w-0 flex-shrink"
          onClick={() => handleTabClick('book')}
          aria-label="Pelihuonevaraus etusivu"
        >
          <img
            src="/xamk_logo_tiivis_kehys_keltainen_rgb.png"
            alt="Xamk"
            className="xamk-logo-img h-6 sm:h-7 md:h-8 w-auto object-contain flex-shrink-0"
          />
          <div className="xamk-brand-titles min-w-0">
            <span className="xamk-brand-main text-[11px] sm:text-xs md:text-sm font-extrabold uppercase truncate">
              {isEn ? 'GAME ROOM BOOKING' : 'PELIHUONEVARAUS'}
            </span>
            <span className="xamk-brand-sub text-[8px] sm:text-[9px] md:text-[10px] font-bold tracking-widest uppercase truncate">
              XAMK GAME ROOM
            </span>
          </div>
        </button>

        {/* Center: Inline Desktop Navigation Links (Only when logged in) */}
        {user && (
          <nav className="xamk-nav-center desktop-tabs-only" aria-label="Päävalikko">
            <button
              type="button"
              className={`xamk-nav-link btn-touch ${activeTab === 'book' ? 'xamk-nav-active' : ''}`}
              onClick={() => setActiveTab('book')}
            >
              <span className="nav-item-icon" aria-hidden="true">📅</span>
              <span>{isEn ? 'Book Station' : 'Varaa laite'}</span>
            </button>

            <button
              type="button"
              className={`xamk-nav-link btn-touch ${activeTab === 'status' ? 'xamk-nav-active' : ''}`}
              onClick={() => setActiveTab('status')}
            >
              <span className="nav-dot-green" aria-hidden="true" />
              <span>{isEn ? 'Live Status' : 'Tilan tilanne'}</span>
            </button>

            <button
              type="button"
              className={`xamk-nav-link btn-touch ${activeTab === 'games' ? 'xamk-nav-active' : ''}`}
              onClick={() => setActiveTab('games')}
            >
              <span className="nav-item-icon" aria-hidden="true">🎮</span>
              <span>{isEn ? 'Games & Wishlist' : 'Pelit & Toivelista'}</span>
            </button>

            <button
              type="button"
              className={`xamk-nav-link btn-touch ${activeTab === 'rules' ? 'xamk-nav-active' : ''}`}
              onClick={() => setActiveTab('rules')}
            >
              <span className="nav-item-icon" aria-hidden="true">💬</span>
              <span>{isEn ? 'Rules & Guide' : 'Säännöt & Ohjeet'}</span>
            </button>

            <button
              type="button"
              className="xamk-nav-link btn-touch"
              onClick={onOpenFloorPlan}
            >
              <span className="nav-item-icon nav-icon-blue" aria-hidden="true">🗺️</span>
              <span>{isEn ? 'Floor Plan' : 'Tilan pohjakuva'}</span>
            </button>

            <a
              href="https://discord.gg/xamk"
              target="_blank"
              rel="noopener noreferrer"
              className="xamk-nav-link btn-touch"
              title="Xamk Gaming Discord"
            >
              <span className="nav-item-icon" aria-hidden="true">👾</span>
              <span>Discord</span>
            </a>

            <button
              type="button"
              className={`xamk-nav-link btn-touch ${activeTab === 'my-bookings' ? 'xamk-nav-active' : ''}`}
              onClick={() => setActiveTab('my-bookings')}
            >
              <span className="nav-item-icon" aria-hidden="true">📋</span>
              <span>{isEn ? 'My Bookings' : 'Omat varaukset'}</span>
            </button>

            {isAdmin && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className={`xamk-nav-link btn-touch ${
                      activeTab === 'admin' || activeTab === 'superadmin' ? 'xamk-nav-active' : ''
                    }`}
                    aria-label="Ylläpitovalikko"
                  >
                    <span className="nav-item-icon" aria-hidden="true">⚙️</span>
                    <span>Admin</span>
                    <span className="text-[10px] opacity-75">▼</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="xamk-dropdown-menu">
                  <DropdownMenuLabel>
                    {isEn ? 'Admin Control Panel' : 'Ylläpidon hallinta'}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className={
                      activeTab === 'admin' && adminSubTab === 'games' ? 'dropdown-item-active' : ''
                    }
                    onClick={() => handleAdminSubTabClick('games')}
                  >
                    <span>🎮</span>
                    <span>{isEn ? 'Games & Wishlist' : 'Pelit & Toivelista'}</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className={
                      activeTab === 'admin' && adminSubTab === 'news' ? 'dropdown-item-active' : ''
                    }
                    onClick={() => handleAdminSubTabClick('news')}
                  >
                    <span>📰</span>
                    <span>{isEn ? 'News & Announcements' : 'Uutiset & Tiedotteet'}</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className={
                      activeTab === 'admin' && adminSubTab === 'users' ? 'dropdown-item-active' : ''
                    }
                    onClick={() => handleAdminSubTabClick('users')}
                  >
                    <span>👥</span>
                    <span>{isEn ? 'Users & Roles' : 'Käyttäjät & Roolit'}</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className={
                      activeTab === 'admin' && adminSubTab === 'settings' ? 'dropdown-item-active' : ''
                    }
                    onClick={() => handleAdminSubTabClick('settings')}
                  >
                    <span>⚙️</span>
                    <span>{isEn ? 'Settings & Discord' : 'Asetukset & Discord'}</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className={
                      activeTab === 'admin' && adminSubTab === 'statistics' ? 'dropdown-item-active' : ''
                    }
                    onClick={() => handleAdminSubTabClick('statistics')}
                  >
                    <span>📊</span>
                    <span>{isEn ? 'Statistics & Usage' : 'Tilastot & Käyttöaste'}</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className={
                      activeTab === 'admin' && adminSubTab === 'issues' ? 'dropdown-item-active' : ''
                    }
                    onClick={() => handleAdminSubTabClick('issues')}
                  >
                    <span>⚠️</span>
                    <span>{isEn ? 'Issue Reports' : 'Vikailmoitukset'}</span>
                  </DropdownMenuItem>
                  {isSuperAdmin && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className={activeTab === 'superadmin' ? 'dropdown-item-active' : ''}
                        onClick={() => handleTabClick('superadmin')}
                      >
                        <span>⚡</span>
                        <span>{t('nav.superadmin')}</span>
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </nav>
        )}

        {/* Right: Report Issue + Language Switcher + User Profile */}
        <div className="xamk-topbar-right navbar-desktop-actions">
          {user && onOpenIssueModal && (
            <button
              type="button"
              className="xamk-issue-link btn-touch"
              onClick={onOpenIssueModal}
              title={t('issue.desc')}
            >
              <span className="issue-warn-icon" aria-hidden="true">⚠️</span>
              <span>{isEn ? 'Report issue' : 'Ilmoita viasta'}</span>
            </button>
          )}

          <LanguageSwitcher />

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="xamk-user-pill btn-touch"
                  aria-label="Käyttäjävalikko"
                >
                  <span className="xamk-user-name">{displayName}</span>
                  <span className="xamk-user-role-tag">{displayRole}</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="xamk-dropdown-menu">
                <DropdownMenuLabel>
                  <div className="xamk-dropdown-user-header">
                    <strong>{displayName}</strong>
                    <span>{user.email}</span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleTabClick('my-bookings')}>
                  <span>📋</span>
                  <span>{isEn ? 'My Bookings' : 'Omat varaukset'}</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onOpenLogin}>
                  <span>🔑</span>
                  <span>{isEn ? 'Switch Account' : 'Vaihda käyttäjää'}</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="dropdown-item-danger"
                  onClick={handleLogout}
                >
                  <span>🚪</span>
                  <span>{t('nav.logout')}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <button
              type="button"
              className="xamk-confirm-pill-btn btn-touch"
              style={{ minHeight: '34px', padding: '5px 16px', fontSize: '0.78rem' }}
              onClick={onOpenLogin}
            >
              <span>{t('nav.login')}</span>
              <span className="confirm-arrow" aria-hidden="true">→</span>
            </button>
          )}
        </div>

        {/* Mobile Actions */}
        <div className="navbar-mobile-actions">
          <LanguageSwitcher className="mobile-lang-switcher" />
          {user ? (
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
          ) : (
            <button
              type="button"
              className="xamk-confirm-pill-btn btn-touch"
              style={{ minHeight: '34px', padding: '5px 12px', fontSize: '0.76rem' }}
              onClick={onOpenLogin}
            >
              <span className="hidden sm:inline">{t('nav.login')}</span>
              <span className="sm:hidden">{isEn ? 'Log in' : 'Kirjaudu'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile Drawer */}
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

            <div className="mobile-user-section">
              <div className="mobile-user-card">
                <div className="mobile-user-avatar">
                  <span>{displayName.charAt(0).toUpperCase()}</span>
                </div>
                <div className="mobile-user-info">
                  <span className="mobile-user-name">{displayName}</span>
                  <span className="mobile-user-email">
                    {user?.email || 'matti.meikalainen@edu.xamk.fi'}
                  </span>
                  <span className="role-badge role-user">{displayRole}</span>
                </div>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm mobile-logout-btn"
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

            <nav className="mobile-nav-list" aria-label="Mobiilin päävalikko">
              <button
                type="button"
                className={`mobile-nav-item ${activeTab === 'book' ? 'item-active' : ''}`}
                onClick={() => handleTabClick('book')}
              >
                <span className="mobile-nav-text">{t('nav.book')}</span>
              </button>
              <button
                type="button"
                className={`mobile-nav-item ${activeTab === 'status' ? 'item-active' : ''}`}
                onClick={() => handleTabClick('status')}
              >
                <span className="mobile-nav-text">{t('nav.status')}</span>
              </button>
              <button
                type="button"
                className={`mobile-nav-item ${activeTab === 'games' ? 'item-active' : ''}`}
                onClick={() => handleTabClick('games')}
              >
                <span className="mobile-nav-text">{t('nav.games')}</span>
              </button>
              <button
                type="button"
                className={`mobile-nav-item ${activeTab === 'rules' ? 'item-active' : ''}`}
                onClick={() => handleTabClick('rules')}
              >
                <span className="mobile-nav-text">{t('nav.rules')}</span>
              </button>
              <button
                type="button"
                className="mobile-nav-item"
                onClick={handleFloorPlanClick}
              >
                <span className="mobile-nav-text">{t('nav.floorplan')}</span>
              </button>
              <button
                type="button"
                className={`mobile-nav-item ${activeTab === 'my-bookings' ? 'item-active' : ''}`}
                onClick={() => handleTabClick('my-bookings')}
              >
                <span className="mobile-nav-text">{t('nav.myBookings')}</span>
              </button>
              {isAdmin && (
                <button
                  type="button"
                  className={`mobile-nav-item item-admin ${activeTab === 'admin' ? 'item-active' : ''}`}
                  onClick={() => handleTabClick('admin')}
                >
                  <span className="mobile-nav-text">{t('nav.admin')}</span>
                </button>
              )}
              {isSuperAdmin && (
                <button
                  type="button"
                  className={`mobile-nav-item item-superadmin ${activeTab === 'superadmin' ? 'item-active' : ''}`}
                  onClick={() => handleTabClick('superadmin')}
                >
                  <span className="mobile-nav-text">{t('nav.superadmin')}</span>
                </button>
              )}
            </nav>

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
