/**
 * @file AdminPanel.tsx
 * @description Ylläpitäjän (Admin ja SuperAdmin) hallintapaneelin pääkomponentti.
 * Käärii modulaariset aliosiot (`AdminOverview`, `AdminReservationsView`, `AdminStationsView`,
 * `AdminIssuesView`, `AdminGamesView`, `AdminNewsView`, `AdminUsersView`,
 * `AdminStatisticsView` ja `AdminSettingsView`) dedikoituun `AdminLayout`-kehykseen.
 */
import React, { useState } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { pathnameToAdminSubTab, type AdminSubTab } from '../router';
import { AdminLayout } from './admin/AdminLayout';
import { AdminOverview } from './admin/AdminOverview';
import { AdminReservationsView } from './admin/AdminReservationsView';
import { AdminStationsView } from './admin/AdminStationsView';
import { AdminIssuesView } from './admin/AdminIssuesView';
import { AdminGamesView } from './admin/AdminGamesView';
import { AdminNewsView } from './admin/AdminNewsView';
import { AdminUsersView } from './admin/AdminUsersView';
import { AdminStatisticsView } from './admin/AdminStatisticsView';
import { AdminSettingsView } from './admin/AdminSettingsView';

/**
 * Sivukohtainen otsikko- ja kuvaustieto kullekin admin-alavälilehdelle.
 */
interface AdminPageMeta {
  /** Otsikko suomeksi */
  titleFi: string;
  /** Otsikko englanniksi */
  titleEn: string;
  /** Alaotsikko suomeksi */
  subtitleFi: string;
  /** Alaotsikko englanniksi */
  subtitleEn: string;
}

/**
 * Otsikko- ja kuvaustaulukko kaikille ylläpitopaneelin osioille.
 */
const PAGE_META: Record<AdminSubTab, AdminPageMeta> = {
  overview: {
    titleFi: 'Yleiskatsaus',
    titleEn: 'Overview',
    subtitleFi:
      'Hallinnoi pelihuoneen varauksia, pelipisteitä, vikailmoituksia, sisältöä, käyttäjiä ja sivuston asetuksia yhdestä paikasta.',
    subtitleEn:
      'Manage game room reservations, stations, issue reports, content, users, and site settings from one hub.',
  },
  reservations: {
    titleFi: 'Varaukset',
    titleEn: 'Reservations',
    subtitleFi:
      'Tarkastele seuraavan 14 vuorokauden aktiivisia varauksia ja peruuta yksittäisiä varauksia tarvittaessa.',
    subtitleEn:
      'Review active reservations for the next 14 days and cancel individual bookings when needed.',
  },
  stations: {
    titleFi: 'Pelipisteet ja huolto',
    titleEn: 'Stations & maintenance',
    subtitleFi:
      'Hallinnoi pelitilan poikkeussulkua sekä yksittäisten pelipisteiden (PC 1–6, PS5 ja Switch) huoltotilaa.',
    subtitleEn:
      'Control room-wide maintenance mode and individual status for all gaming stations (PC 1–6, PS5, and Switch).',
  },
  issues: {
    titleFi: 'Vikailmoitukset',
    titleEn: 'Issue reports',
    subtitleFi:
      'Käsittele ja kuittaa opiskelijoiden lähettämät ilmoitukset laitevioista, oheislaitteista ja tilan kunnosta.',
    subtitleEn:
      'Review and resolve student reports regarding hardware, peripherals, and room condition.',
  },
  games: {
    titleFi: 'Pelit ja toivelista',
    titleEn: 'Games & wishlist',
    subtitleFi:
      'Lisää asennettuja pelejä valikoimaan ja hyväksy opiskelijoiden äänestämiä toivepelejä.',
    subtitleEn:
      'Add installed games to the catalog and approve top-voted student wishlist titles.',
  },
  news: {
    titleFi: 'Tiedotteet',
    titleEn: 'Announcements',
    subtitleFi:
      'Julkaise uusia tiedotteita etusivulle ja kiinnitä tärkeitä ilmoituksia yläbanneriin.',
    subtitleEn:
      'Publish announcements to the landing page and pin important notices to the top banner.',
  },
  users: {
    titleFi: 'Käyttäjät ja estot',
    titleEn: 'Users & bans',
    subtitleFi:
      'Hallinnoi rekisteröityjen käyttäjien rooleja sekä määräaikaisia ja pysyviä käyttöestoja.',
    subtitleEn:
      'Manage registered user roles as well as temporary and permanent access bans.',
  },
  statistics: {
    titleFi: 'Tilastot ja käyttöaste',
    titleEn: 'Statistics & usage',
    subtitleFi:
      'Seuraa pelihuoneen kokonaisvarauksia, pelipisteiden käyttöastetta ja varaustyyppien jakaumaa.',
    subtitleEn:
      'Track overall booking volume, station utilization hours, and reservation type breakdown.',
  },
  settings: {
    titleFi: 'Sivuston asetukset',
    titleEn: 'Site settings',
    subtitleFi:
      'Muokkaa pelihuoneen aukioloaikoja, varauskiintiöitä, SharedTV-lukkoa sekä Discord Webhook -ilmoituksia.',
    subtitleEn:
      'Configure opening hours, booking quotas, SharedTV lock, and Discord Webhook notifications.',
  },
};

/**
 * Ylläpitäjän hallintapaneelikomponentti.
 */
export const AdminPanel: React.FC = () => {
  const { isAdmin } = useAuth();
  const { lang } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const adminSubTab = pathnameToAdminSubTab(location.pathname);
  const isEn = lang === 'en';

  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Varmistetaan, että vain Admin- tai SuperAdmin-käyttäjät näkevät paneelin
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#121417] text-[#F4F4F5] flex items-center justify-center p-6">
        <div className="max-w-lg w-full rounded-none bg-[#1C1F24] border-2 border-[#EF4444] shadow-[5px_5px_0px_#000000] p-6 space-y-4">
          <div className="font-mono text-sm font-bold text-[#FCA5A5]">
            {isEn
              ? 'Only administrators have access to this control panel.'
              : 'Vain ylläpitäjillä on pääsy tähän paneeliin.'}
          </div>
          <button
            type="button"
            onClick={() => navigate('/book')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-none bg-[#FACC15] text-[#09090B] border-2 border-black shadow-[3px_3px_0px_#000000] font-mono text-xs font-extrabold uppercase cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 shrink-0" strokeWidth={2.5} aria-hidden="true" />
            <span>{isEn ? 'Back to game room' : 'Takaisin pelihuoneeseen'}</span>
          </button>
        </div>
      </div>
    );
  }

  const meta = PAGE_META[adminSubTab] ?? PAGE_META.overview;
  const cleanPath = location.pathname.replace(/\/+$/, '');
  const resolvedTitle =
    cleanPath === '/admin/games/new'
      ? isEn
        ? 'Add new game'
        : 'Lisää uusi peli'
      : cleanPath === '/admin/news/new'
      ? isEn
        ? 'Publish new announcement'
        : 'Julkaise uusi tiedote'
      : cleanPath.startsWith('/admin/news/edit')
      ? isEn
        ? 'Edit announcement'
        : 'Muokkaa tiedotetta'
      : isEn
      ? meta.titleEn
      : meta.titleFi;
  const resolvedSubtitle =
    cleanPath.startsWith('/admin/news/edit')
      ? isEn
        ? 'Edit the headline, body text, or pinned status of a published announcement.'
        : 'Muokkaa julkaistun tiedotteen otsikkoa, sisältöä tai kiinnitystä yläbanneriin.'
      : isEn
      ? meta.subtitleEn
      : meta.subtitleFi;

  const handleClearMessages = () => {
    setStatusMessage(null);
    setErrorMessage(null);
  };

  return (
    <AdminLayout
      activeSection={adminSubTab}
      pageTitle={resolvedTitle}
      pageSubtitle={resolvedSubtitle}
      statusMessage={statusMessage}
      errorMessage={errorMessage}
      onSectionChange={handleClearMessages}
    >
      <Routes>
        <Route index element={<AdminOverview />} />
        <Route
          path="reservations"
          element={<AdminReservationsView onStatus={setStatusMessage} onError={setErrorMessage} />}
        />
        <Route
          path="stations"
          element={<AdminStationsView onStatus={setStatusMessage} onError={setErrorMessage} />}
        />
        <Route
          path="issues"
          element={<AdminIssuesView onStatus={setStatusMessage} onError={setErrorMessage} />}
        />
        <Route
          path="games"
          element={<AdminGamesView mode="list" onStatus={setStatusMessage} onError={setErrorMessage} />}
        />
        <Route
          path="games/new"
          element={<AdminGamesView mode="new" onStatus={setStatusMessage} onError={setErrorMessage} />}
        />
        <Route
          path="news"
          element={<AdminNewsView mode="list" onStatus={setStatusMessage} onError={setErrorMessage} />}
        />
        <Route
          path="news/new"
          element={<AdminNewsView mode="new" onStatus={setStatusMessage} onError={setErrorMessage} />}
        />
        <Route
          path="news/edit"
          element={<AdminNewsView mode="edit" onStatus={setStatusMessage} onError={setErrorMessage} />}
        />
        <Route
          path="news/edit/:newsId"
          element={<AdminNewsView mode="edit" onStatus={setStatusMessage} onError={setErrorMessage} />}
        />
        <Route
          path="users"
          element={<AdminUsersView onStatus={setStatusMessage} onError={setErrorMessage} />}
        />
        <Route path="statistics" element={<AdminStatisticsView />} />
        <Route
          path="settings"
          element={<AdminSettingsView onStatus={setStatusMessage} onError={setErrorMessage} />}
        />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </AdminLayout>
  );
};
