/**
 * @file AdminOverview.tsx
 * @description Ylläpitopaneelin yleiskatsaus-hubi (MyLeagueHub-tyylinen rakenne
 * neo-brutalistisella Xamk Game Room -ilmeellä). Näyttää 4 reaaliaikaista KPI-korttia
 * sekä ryhmitellyt klikattavat toimintokortit kaikkiin ylläpito-osioihin.
 */
import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Calendar,
  Monitor,
  AlertTriangle,
  Zap,
  Gamepad2,
  Newspaper,
  Users,
  BarChart3,
  Settings,
  CheckCircle2,
  ArrowRight,
  Wrench,
} from 'lucide-react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useRouter, type AdminSection } from '../../router';

/**
 * Yksittäisen yleiskatsauskortin tietomalli.
 */
interface OverviewActionCard {
  /** Kohdeosion tunniste */
  section: AdminSection;
  /** Otsikko suomeksi */
  titleFi: string;
  /** Otsikko englanniksi */
  titleEn: string;
  /** Lyhyt kuvaus suomeksi */
  descFi: string;
  /** Lyhyt kuvaus englanniksi */
  descEn: string;
  /** Oikean reunan iso ikoni */
  icon: React.ReactNode;
  /** Valinnainen live-tilateksti tai laskuri */
  badgeText?: string;
  /** Korostetaanko badge punaisella (esim. avoimet vikailmoitukset) */
  badgeDanger?: boolean;
}

/**
 * Toimintokorttien ryhmämalli.
 */
interface OverviewGroup {
  /** Ryhmän otsikko suomeksi */
  headingFi: string;
  /** Ryhmän otsikko englanniksi */
  headingEn: string;
  /** Ryhmään kuuluvat kortit */
  cards: OverviewActionCard[];
}

/**
 * Ylläpitopaneelin yleiskatsausnäkymä.
 */
export const AdminOverview: React.FC = () => {
  const { user, isAdmin, isSuperAdmin } = useAuth();
  const { lang } = useLanguage();
  const { setAdminSubTab, setActiveTab } = useRouter();
  const isEn = lang === 'en';

  // Haetaan yleiskatsauksen tunnusluvut
  const { data: allGames } = useQuery({
    queryKey: ['games'],
    queryFn: () => api.getGames(),
    enabled: isAdmin,
  });

  const { data: allNews } = useQuery({
    queryKey: ['news'],
    queryFn: () => api.getNews(),
    enabled: isAdmin,
  });

  const { data: allUsers } = useQuery({
    queryKey: ['users'],
    queryFn: () => api.getAllUsers(user?.id ?? ''),
    enabled: isAdmin,
  });

  const { data: adminStations } = useQuery({
    queryKey: ['admin-stations'],
    queryFn: () => api.getAllStationsForAdmin(),
    enabled: isAdmin,
  });

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: () => api.getSettings(),
    enabled: isAdmin,
  });

  const { data: allIssues } = useQuery({
    queryKey: ['issues'],
    queryFn: () => api.getIssueReports(user?.id ?? ''),
    enabled: isAdmin,
    refetchInterval: 10000,
  });

  const { data: upcomingReservations } = useQuery({
    queryKey: ['admin-reservations'],
    queryFn: () => {
      const start = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
      const end = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
      return api.getActiveReservations(start, end);
    },
    enabled: isAdmin,
  });

  const openIssuesCount = useMemo(
    () => (allIssues ?? []).filter((issue) => !issue.isResolved).length,
    [allIssues]
  );

  const activeStationsCount = useMemo(
    () => (adminStations ?? []).filter((station) => station.isActive).length,
    [adminStations]
  );

  const totalStationsCount = adminStations?.length ?? 8;

  const wishlistCount = useMemo(
    () => (allGames ?? []).filter((game) => game.isWishlist).length,
    [allGames]
  );

  const bannedUsersCount = useMemo(
    () => (allUsers ?? []).filter((u) => u.isBanned).length,
    [allUsers]
  );

  const handleOpenSection = (section: AdminSection) => {
    if (section === 'superadmin') {
      setActiveTab('superadmin');
    } else {
      setAdminSubTab(section);
    }
  };

  const gameRoomCards: OverviewActionCard[] = [
    {
      section: 'reservations',
      titleFi: 'Varaukset',
      titleEn: 'Reservations',
      descFi: 'Tarkastele seuraavan 14 vuorokauden aktiivisia varauksia ja peruuta tarvittaessa.',
      descEn: 'Review active bookings for the next 14 days and cancel reservations when needed.',
      icon: <Calendar className="w-6 h-6 shrink-0" strokeWidth={2.5} aria-hidden="true" />,
      badgeText: `${upcomingReservations?.length ?? 0} ${isEn ? 'active' : 'aktiivista'}`,
    },
    {
      section: 'stations',
      titleFi: 'Pelipisteet ja huolto',
      titleEn: 'Stations & maintenance',
      descFi: 'Hallinnoi pelitilan poikkeussulkua ja 8 pelipisteen laitekohtaista huoltotilaa.',
      descEn: 'Control room maintenance mode and individual status for all 8 gaming stations.',
      icon: <Monitor className="w-6 h-6 shrink-0" strokeWidth={2.5} aria-hidden="true" />,
      badgeText: `${activeStationsCount}/${totalStationsCount} ${isEn ? 'active' : 'käytössä'}`,
      badgeDanger: Boolean(settings?.isMaintenanceMode) || activeStationsCount < totalStationsCount,
    },
    {
      section: 'issues',
      titleFi: 'Vikailmoitukset',
      titleEn: 'Issue reports',
      descFi: 'Käsittele opiskelijoiden ilmoitukset laitevioista, oheislaitteista ja tilan kunnosta.',
      descEn: 'Review and resolve student reports about hardware, peripherals, and room condition.',
      icon: <AlertTriangle className="w-6 h-6 shrink-0" strokeWidth={2.5} aria-hidden="true" />,
      badgeText:
        openIssuesCount > 0
          ? `${openIssuesCount} ${isEn ? 'open' : 'avointa'}`
          : isEn
          ? 'All clear'
          : 'Kaikki kuitattu',
      badgeDanger: openIssuesCount > 0,
    },
  ];

  if (isSuperAdmin) {
    gameRoomCards.push({
      section: 'superadmin',
      titleFi: 'Tapahtumavaraukset',
      titleEn: 'Event bookings',
      descFi: 'Luo virallinen oppilaitostapahtuma ja peruuta päällekkäiset varaukset (Sääntö #10).',
      descEn: 'Schedule an official university event and cancel overlapping bookings (Rule #10).',
      icon: <Zap className="w-6 h-6 shrink-0" strokeWidth={2.5} aria-hidden="true" />,
      badgeText: 'SUPERADMIN',
    });
  }

  const groups: OverviewGroup[] = [
    {
      headingFi: 'Pelihuone',
      headingEn: 'Game Room',
      cards: gameRoomCards,
    },
    {
      headingFi: 'Sisältö',
      headingEn: 'Content',
      cards: [
        {
          section: 'games',
          titleFi: 'Pelit ja toivelista',
          titleEn: 'Games & wishlist',
          descFi: 'Lisää pelejä valikoimaan ja hyväksy opiskelijoiden äänestämiä toivepelejä.',
          descEn: 'Add games to the catalog and approve top-voted titles from the student wishlist.',
          icon: <Gamepad2 className="w-6 h-6 shrink-0" strokeWidth={2.5} aria-hidden="true" />,
          badgeText: `${allGames?.length ?? 0} ${isEn ? 'total' : 'yht.'} • ${wishlistCount} ${
            isEn ? 'wishes' : 'toivetta'
          }`,
        },
        {
          section: 'news',
          titleFi: 'Tiedotteet',
          titleEn: 'Announcements',
          descFi: 'Julkaise ja hallinnoi etusivun uutisia sekä yläbanneriin kiinnitettäviä tiedotteita.',
          descEn: 'Publish and manage landing page news and pinned top hero banner notices.',
          icon: <Newspaper className="w-6 h-6 shrink-0" strokeWidth={2.5} aria-hidden="true" />,
          badgeText: `${allNews?.length ?? 0} ${isEn ? 'published' : 'julkaistu'}`,
        },
      ],
    },
    {
      headingFi: 'Hallinto',
      headingEn: 'Administration',
      cards: [
        {
          section: 'users',
          titleFi: 'Käyttäjät ja estot',
          titleEn: 'Users & bans',
          descFi: 'Hallinnoi käyttäjärooleja sekä määräaikaisia ja pysyviä käyttöestoja.',
          descEn: 'Manage user access roles as well as temporary and permanent bans.',
          icon: <Users className="w-6 h-6 shrink-0" strokeWidth={2.5} aria-hidden="true" />,
          badgeText:
            bannedUsersCount > 0
              ? `${allUsers?.length ?? 0} • ${bannedUsersCount} ${isEn ? 'banned' : 'estetty'}`
              : `${allUsers?.length ?? 0} ${isEn ? 'users' : 'käyttäjää'}`,
          badgeDanger: bannedUsersCount > 0,
        },
        {
          section: 'statistics',
          titleFi: 'Tilastot ja käyttöaste',
          titleEn: 'Statistics & usage',
          descFi: 'Seuraa kokonaisvarauksia, pelipisteiden käyttöastetta ja varaustyyppien jakaumaa.',
          descEn: 'Track total bookings, station utilization hours, and reservation type breakdown.',
          icon: <BarChart3 className="w-6 h-6 shrink-0" strokeWidth={2.5} aria-hidden="true" />,
        },
        {
          section: 'settings',
          titleFi: 'Sivuston asetukset',
          titleEn: 'Site settings',
          descFi: 'Muokkaa aukioloaikoja, varauskiintiöitä, SharedTV-lukkoa ja Discord Webhookia.',
          descEn: 'Configure opening hours, booking quotas, SharedTV lock, and Discord Webhook.',
          icon: <Settings className="w-6 h-6 shrink-0" strokeWidth={2.5} aria-hidden="true" />,
        },
      ],
    },
  ];

  return (
    <div className="space-y-8">
      {/* Huoltotilavaroitus, jos koko pelihuone on huoltotilassa */}
      {settings?.isMaintenanceMode && (
        <div
          className="rounded-none bg-[#EF4444]/15 border-2 border-[#EF4444] shadow-[4px_4px_0px_#000000] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          role="alert"
        >
          <div className="flex items-start gap-3">
            <Wrench className="w-5 h-5 shrink-0 text-[#EF4444] mt-0.5" strokeWidth={2.5} aria-hidden="true" />
            <div>
              <div className="font-mono text-xs font-extrabold uppercase tracking-wider text-[#FCA5A5]">
                {isEn ? 'MAINTENANCE MODE ACTIVE' : 'HUOLTOTILA KÄYTÖSSÄ'}
              </div>
              <p className="text-sm text-[#F4F4F5] m-0 mt-0.5">
                {settings.maintenanceMessage ||
                  (isEn
                    ? 'New student bookings are currently blocked.'
                    : 'Uudet opiskelijavaraukset on tilapäisesti estetty.')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleOpenSection('stations')}
            className="px-3 py-2 rounded-none bg-[#121417] text-[#FACC15] border-2 border-[#FACC15] hover:bg-[#FACC15] hover:text-[#09090B] font-mono text-xs font-extrabold uppercase cursor-pointer shrink-0"
          >
            {isEn ? 'Manage status' : 'Hallinnoi tilaa'}
          </button>
        </div>
      )}

      {/* 4 KPI-korttia */}
      <section aria-label={isEn ? 'Key metrics' : 'Tunnusluvut'}>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {/* KPI 1: Aktiiviset varaukset */}
          <button
            type="button"
            onClick={() => handleOpenSection('reservations')}
            className="rounded-none bg-[#1C1F24] border-2 border-[#3F444E] hover:border-[#FACC15] shadow-[4px_4px_0px_#000000] p-5 flex flex-col gap-2 text-left cursor-pointer transition-colors"
          >
            <div className="flex items-center justify-between gap-2 w-full">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#A1A1AA]">
                {isEn ? 'Active bookings (14d)' : 'Aktiiviset varaukset (14 vrk)'}
              </span>
              <span className="inline-flex items-center justify-center w-9 h-9 rounded-none bg-[#121417] border-2 border-[#3F444E] text-[#FACC15]">
                <Calendar className="w-4 h-4 shrink-0" strokeWidth={2.5} aria-hidden="true" />
              </span>
            </div>
            <div className="font-mono text-3xl font-extrabold text-[#F4F4F5] leading-none">
              {upcomingReservations?.length ?? 0}
            </div>
            <div className="font-mono text-xs font-bold text-[#9CA3AF]">
              {isEn ? 'Upcoming and ongoing sessions' : 'Tulevat ja käynnissä olevat'}
            </div>
          </button>

          {/* KPI 2: Avoimet vikailmoitukset */}
          <button
            type="button"
            onClick={() => handleOpenSection('issues')}
            className={`rounded-none bg-[#1C1F24] border-2 shadow-[4px_4px_0px_#000000] p-5 flex flex-col gap-2 text-left cursor-pointer transition-colors ${
              openIssuesCount > 0
                ? 'border-[#EF4444] hover:border-[#FACC15]'
                : 'border-[#3F444E] hover:border-[#FACC15]'
            }`}
          >
            <div className="flex items-center justify-between gap-2 w-full">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#A1A1AA]">
                {isEn ? 'Open issue reports' : 'Avoimet vikailmoitukset'}
              </span>
              <span
                className={`inline-flex items-center justify-center w-9 h-9 rounded-none bg-[#121417] border-2 border-[#3F444E] ${
                  openIssuesCount > 0 ? 'text-[#EF4444]' : 'text-[#22C55E]'
                }`}
              >
                {openIssuesCount > 0 ? (
                  <AlertTriangle className="w-4 h-4 shrink-0" strokeWidth={2.5} aria-hidden="true" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 shrink-0" strokeWidth={2.5} aria-hidden="true" />
                )}
              </span>
            </div>
            <div
              className={`font-mono text-3xl font-extrabold leading-none ${
                openIssuesCount > 0 ? 'text-[#EF4444]' : 'text-[#22C55E]'
              }`}
            >
              {openIssuesCount}
            </div>
            <div className="font-mono text-xs font-bold text-[#9CA3AF]">
              {openIssuesCount > 0
                ? isEn
                  ? 'Requires administrator review'
                  : 'Vaatii ylläpidon tarkistusta'
                : isEn
                ? 'All reports resolved'
                : 'Ei avoimia vikailmoituksia'}
            </div>
          </button>

          {/* KPI 3: Aktiiviset pelipisteet */}
          <button
            type="button"
            onClick={() => handleOpenSection('stations')}
            className="rounded-none bg-[#1C1F24] border-2 border-[#3F444E] hover:border-[#FACC15] shadow-[4px_4px_0px_#000000] p-5 flex flex-col gap-2 text-left cursor-pointer transition-colors"
          >
            <div className="flex items-center justify-between gap-2 w-full">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#A1A1AA]">
                {isEn ? 'Active stations' : 'Aktiiviset pelipisteet'}
              </span>
              <span className="inline-flex items-center justify-center w-9 h-9 rounded-none bg-[#121417] border-2 border-[#3F444E] text-[#22C55E]">
                <Monitor className="w-4 h-4 shrink-0" strokeWidth={2.5} aria-hidden="true" />
              </span>
            </div>
            <div className="font-mono text-3xl font-extrabold text-[#F4F4F5] leading-none">
              {activeStationsCount} / {totalStationsCount}
            </div>
            <div className="font-mono text-xs font-bold text-[#9CA3AF]">
              {settings?.isMaintenanceMode
                ? isEn
                  ? 'Room in maintenance mode'
                  : 'Koko tila huoltotilassa'
                : isEn
                ? 'Ready for student bookings'
                : 'Käytettävissä varauksiin'}
            </div>
          </button>

          {/* KPI 4: Käyttäjät ja pelit */}
          <button
            type="button"
            onClick={() => handleOpenSection('users')}
            className="rounded-none bg-[#1C1F24] border-2 border-[#3F444E] hover:border-[#FACC15] shadow-[4px_4px_0px_#000000] p-5 flex flex-col gap-2 text-left cursor-pointer transition-colors"
          >
            <div className="flex items-center justify-between gap-2 w-full">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#A1A1AA]">
                {isEn ? 'Registered users' : 'Rekisteröityneet käyttäjät'}
              </span>
              <span className="inline-flex items-center justify-center w-9 h-9 rounded-none bg-[#121417] border-2 border-[#3F444E] text-[#3B82F6]">
                <Users className="w-4 h-4 shrink-0" strokeWidth={2.5} aria-hidden="true" />
              </span>
            </div>
            <div className="font-mono text-3xl font-extrabold text-[#F4F4F5] leading-none">
              {allUsers?.length ?? 0}
            </div>
            <div className="font-mono text-xs font-bold text-[#9CA3AF]">
              {allGames?.length ?? 0} {isEn ? 'games in catalog' : 'peliä järjestelmässä'}
            </div>
          </button>
        </div>
      </section>

      {/* MyLeagueHub-tyyliset ryhmitellyt toimintokortit */}
      <div className="space-y-8">
        {groups.map((group) => (
          <section key={group.headingEn} className="space-y-3.5">
            <div className="flex items-center gap-3">
              <h2 className="font-mono text-xs font-extrabold uppercase tracking-widest text-[#FACC15] m-0">
                {isEn ? group.headingEn : group.headingFi}
              </h2>
              <div className="flex-1 h-px bg-[#3F444E]" aria-hidden="true" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {group.cards.map((card) => (
                <button
                  key={card.section}
                  type="button"
                  onClick={() => handleOpenSection(card.section)}
                  className="group rounded-none bg-[#1C1F24] border-2 border-[#3F444E] border-l-4 border-l-[#FACC15] shadow-[4px_4px_0px_#000000] hover:border-[#FACC15] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_#000000] active:translate-x-0 active:translate-y-0 active:shadow-[2px_2px_0px_#000000] transition-all p-5 flex items-start justify-between gap-4 text-left cursor-pointer"
                >
                  <div className="flex flex-col gap-2 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-extrabold uppercase tracking-tight text-[#F4F4F5] group-hover:text-[#FACC15] transition-colors m-0">
                        {isEn ? card.titleEn : card.titleFi}
                      </h3>
                      {card.badgeText && (
                        <span
                          className={`px-1.5 py-0.5 rounded-none font-mono text-[10px] font-extrabold uppercase border border-black ${
                            card.badgeDanger
                              ? 'bg-[#EF4444] text-white'
                              : 'bg-[#121417] text-[#FACC15] border-[#3F444E]'
                          }`}
                        >
                          {card.badgeText}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-[#A1A1AA] leading-relaxed m-0">
                      {isEn ? card.descEn : card.descFi}
                    </p>

                    <span className="inline-flex items-center gap-1 pt-1 font-mono text-[11px] font-bold uppercase tracking-wider text-[#FACC15]">
                      <span>{isEn ? 'Open section' : 'Avaa osio'}</span>
                      <ArrowRight
                        className="w-3.5 h-3.5 shrink-0 transition-transform group-hover:translate-x-1"
                        strokeWidth={2.5}
                        aria-hidden="true"
                      />
                    </span>
                  </div>

                  <span
                    className="inline-flex items-center justify-center w-12 h-12 rounded-none bg-[#121417] border-2 border-[#3F444E] group-hover:border-[#FACC15] group-hover:bg-[#FACC15] group-hover:text-[#09090B] text-[#FACC15] transition-colors shrink-0"
                    aria-hidden="true"
                  >
                    {card.icon}
                  </span>
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
};
