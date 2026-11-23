/**
 * @file AdminLayout.tsx
 * @description Dedikoitu ylläpitopaneelin ulkoasukehys (Admin Shell), jota käyttävät
 * sekä AdminPanel että SuperAdminPanel. Sisältää työpöydän kokoon taitettavan sivupalkin,
 * mobiilin yläpalkin hampurilaisvalikolla (drawer), paluupalkin yleiskatsaukseen,
 * sivun otsikkorivin ja yhtenäiset tilaviestit.
 */
import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Menu, ArrowLeft, CheckCircle2, AlertTriangle } from 'lucide-react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useRouter, type AdminSection } from '../../router';
import { AdminSidebar } from './AdminSidebar';

/** LocalStorage-avain sivupalkin kokoon taitetun tilan tallentamiseen */
const SIDEBAR_STORAGE_KEY = 'pelihuone_admin_sidebar_collapsed';

/**
 * AdminLayout-komponentin ominaisuudet.
 */
export interface AdminLayoutProps {
  /** Parhaillaan aktiivinen osio */
  activeSection: AdminSection;
  /** Sivun pääotsikko */
  pageTitle: string;
  /** Valinnainen alaotsikko tai kuvaus */
  pageSubtitle?: string;
  /** Valinnainen onnistumisilmoitus */
  statusMessage?: string | null;
  /** Valinnainen virheilmoitus */
  errorMessage?: string | null;
  /** Valinnainen oikean reunan toimintopainike (esim. "+ Lisää peli") */
  headerAction?: React.ReactNode;
  /** Valinnainen kutsu tilaviestien tyhjentämiseen osion vaihtuessa */
  onSectionChange?: () => void;
  /** Sivun varsinainen sisältö */
  children: React.ReactNode;
}

/**
 * Dedikoitu Admin- ja SuperAdmin-näkymien kehyskomponentti.
 */
export const AdminLayout: React.FC<AdminLayoutProps> = ({
  activeSection,
  pageTitle,
  pageSubtitle,
  statusMessage,
  errorMessage,
  headerAction,
  onSectionChange,
  children,
}) => {
  const { user, isAdmin } = useAuth();
  const { lang } = useLanguage();
  const { setAdminSubTab, setActiveTab } = useRouter();
  const isEn = lang === 'en';

  // Työpöydän sivupalkin leveys (tallennetaan localStorageen)
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(SIDEBAR_STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  // Mobiilidrawerin aukiolotila
  const [mobileOpen, setMobileOpen] = useState(false);

  // Haetaan avoimet vikailmoitukset sivupalkin live-badgea varten
  const { data: allIssues } = useQuery({
    queryKey: ['issues'],
    queryFn: () => api.getIssueReports(user?.id ?? ''),
    enabled: isAdmin,
    refetchInterval: 10000,
  });

  const openIssuesCount = useMemo(
    () => (allIssues ?? []).filter((issue) => !issue.isResolved).length,
    [allIssues]
  );

  const handleToggleCollapse = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next));
      } catch {
        // Ohitetaan localStorage-virhe, jos selain estää tallennuksen
      }
      return next;
    });
  };

  const handleNavigateSection = (section: AdminSection) => {
    onSectionChange?.();
    if (section === 'superadmin') {
      setActiveTab('superadmin');
    } else {
      setAdminSubTab(section);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#121417] text-[#F4F4F5]">
      {/* Mobiilin kiinteä yläpalkki (alle lg) */}
      <header className="lg:hidden sticky top-0 z-40 w-full bg-[#0E0F11] border-b-2 border-[#3F444E] px-3 py-2.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="inline-flex items-center justify-center w-10 h-10 rounded-none bg-[#1C1F24] text-[#F4F4F5] border-2 border-[#3F444E] hover:border-[#FACC15] hover:text-[#FACC15] cursor-pointer shrink-0"
            aria-label={isEn ? 'Open admin menu' : 'Avaa ylläpitovalikko'}
            aria-expanded={mobileOpen}
            aria-controls="admin-mobile-drawer"
          >
            <Menu className="w-5 h-5 shrink-0" strokeWidth={2.5} aria-hidden="true" />
          </button>

          <div className="flex items-center gap-2 min-w-0">
            <img
              src="/xamk_logo_tiivis_kehys_keltainen_rgb.png"
              alt="Xamk"
              className="h-6 w-auto object-contain shrink-0"
            />
            <div className="flex flex-col leading-tight min-w-0">
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#FACC15]">
                ADMIN
              </span>
              <span className="text-xs font-extrabold uppercase tracking-tight text-[#F4F4F5] truncate">
                {pageTitle}
              </span>
            </div>
          </div>
        </div>

        {openIssuesCount > 0 && (
          <button
            type="button"
            onClick={() => handleNavigateSection('issues')}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-none bg-[#EF4444] text-white border-2 border-black shadow-[2px_2px_0px_#000000] font-mono text-xs font-extrabold uppercase cursor-pointer shrink-0"
            aria-label={
              isEn
                ? `${openIssuesCount} open issue reports`
                : `${openIssuesCount} avointa vikailmoitusta`
            }
          >
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" strokeWidth={2.5} aria-hidden="true" />
            <span>{openIssuesCount}</span>
          </button>
        )}
      </header>

      {/* Sivupalkki (työpöytä + mobiilidrawer) */}
      <AdminSidebar
        activeSection={activeSection}
        onNavigate={handleNavigateSection}
        openIssuesCount={openIssuesCount}
        collapsed={collapsed}
        onToggleCollapse={handleToggleCollapse}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      {/* Pääsisältöalue */}
      <main className="flex-1 min-w-0 bg-[#121417] text-[#F4F4F5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
          {/* Paluupalkki yleiskatsaukseen kaikilla aliosioilla */}
          {activeSection !== 'overview' && (
            <div>
              <button
                type="button"
                onClick={() => handleNavigateSection('overview')}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-none bg-[#1C1F24] text-[#F4F4F5] border-2 border-[#3F444E] hover:border-[#FACC15] hover:text-[#FACC15] shadow-[3px_3px_0px_#000000] font-mono text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors"
              >
                <ArrowLeft className="w-4 h-4 shrink-0" strokeWidth={2.5} aria-hidden="true" />
                <span>{isEn ? 'Back to overview' : 'Takaisin yleiskatsaukseen'}</span>
              </button>
            </div>
          )}

          {/* Sivun otsikkorivi */}
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 pb-4 border-b-2 border-[#3F444E]">
            <div className="space-y-1.5 max-w-3xl">
              <div className="font-mono text-xs font-bold uppercase tracking-widest text-[#FACC15]">
                XAMK GAME ROOM — {activeSection === 'superadmin' ? 'SUPERADMIN' : 'ADMIN'}
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-tight text-[#F4F4F5] m-0 text-left">
                {pageTitle}
              </h1>
              <div className="w-16 h-1 bg-[#FACC15]" />
              {pageSubtitle && (
                <p className="text-sm text-[#A1A1AA] leading-relaxed m-0 pt-1">
                  {pageSubtitle}
                </p>
              )}
            </div>

            {headerAction && <div className="shrink-0">{headerAction}</div>}
          </div>

          {/* Tilaviestit */}
          {statusMessage && (
            <div
              className="rounded-none bg-[#22C55E]/15 border-2 border-[#22C55E] shadow-[4px_4px_0px_#000000] px-4 py-3 font-mono text-sm font-bold text-[#86EFAC] flex items-center gap-2"
              role="alert"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0 text-[#22C55E]" strokeWidth={2.5} aria-hidden="true" />
              <span>{statusMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div
              className="rounded-none bg-[#EF4444]/15 border-2 border-[#EF4444] shadow-[4px_4px_0px_#000000] px-4 py-3 font-mono text-sm font-bold text-[#FCA5A5] flex items-center gap-2"
              role="alert"
            >
              <AlertTriangle className="w-4 h-4 shrink-0 text-[#EF4444]" strokeWidth={2.5} aria-hidden="true" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Sivukohtainen sisältö */}
          {children}
        </div>
      </main>
    </div>
  );
};
