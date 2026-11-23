/**
 * @file App.tsx
 * @description Sovelluksen juurikomponentti ja päänäkymärakenne (AppShell).
 * Käärii sovelluksen virherajaan (ErrorBoundary), React Query -välimuistiin,
 * kielikontekstiin, autentikaatiokontekstiin sekä reitittimeen.
 */
import React, { useState, Component, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { RouterProvider, useRouter } from './router';
import { Navbar } from './components/Navbar';
import { BookingCalendar } from './components/BookingCalendar';
import { RealtimeStatus } from './components/RealtimeStatus';
import { GamesCatalog } from './components/GamesCatalog';
import { MyReservations } from './components/MyReservations';
import { AdminPanel } from './components/AdminPanel';
import { SuperAdminPanel } from './components/SuperAdminPanel';
import { NewsBanner } from './components/NewsBanner';
import { NewsFeedPage } from './components/NewsFeedPage';
import { LoginModal } from './components/LoginModal';
import { FloorPlanModal } from './components/FloorPlanModal';
import { RulesAndGuide } from './components/RulesAndGuide';
import { LandingPage } from './components/LandingPage';
import { IssueReportModal } from './components/IssueReportModal';
import { DiscordIcon } from '@/components/ui/discord-icon';
import { useGameRoomRealtime } from './hooks/useGameRoomRealtime';

/**
 * React Query -asiakasinstanssi palvelinpyyntöjen välimuistitukseen ja hallintaan.
 * Asettaa oletuksena 10 sekunnin vanhenemisajan (staleTime) ja yhden uudelleenyrityksen.
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 10,
      retry: 1,
    },
  },
});

/**
 * Virherajakomponentin sisäinen tila.
 */
interface ErrorBoundaryState {
  /** Ilmaiseeko tila, että lapsikomponentissa on tapahtunut renderöintivirhe */
  hasError: boolean;
}

/**
 * Sovellustason virherajakomponentti (Error Boundary), joka nappaa odottamattomat
 * renderöintivirheet ja näyttää käyttäjäystävällisen virhenäkymän kaatumisen sijaan.
 */
class AppErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  /**
   * Päivittää tilan virheelliseksi, kun lapsikomponentti heittää poikkeuksen.
   */
  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  render() {
    // Jos virhe on havaittu, näytetään palautumisnäkymä ja uudelleenlatauspainike
    if (this.state.hasError) {
      return (
        <div className="p-8 text-center text-[#F4F4F5] bg-[#121417] min-h-screen flex flex-col items-center justify-center gap-4" role="alert">
          <h2 className="text-xl font-extrabold uppercase tracking-tight">Näkymän latauksessa tapahtui virhe</h2>
          <button
            type="button"
            className="rounded-none bg-[#FACC15] text-[#09090B] border-2 border-black shadow-[4px_4px_0px_#000000] px-5 py-3 min-h-[44px] font-mono font-bold uppercase tracking-wide cursor-pointer hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0px_#000000] transition-transform"
            onClick={() => window.location.reload()}
          >
            Lataa sivu uudelleen
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

/**
 * Sovelluksen varsinainen sisältökomponentti, joka päättää näytetäänkö
 * kirjautumattoman käyttäjän laskeutumissivu (LandingPage) vai kirjautuneen
 * käyttäjän päänäkymä välilehtineen, modaaleineen ja alatunnisteineen.
 */
export const AppContent: React.FC = () => {
  useGameRoomRealtime();
  const { user } = useAuth();
  const { lang, t } = useLanguage();
  const isEn = lang === 'en';
  const { activeTab, setActiveTab } = useRouter();

  // Modaali-ikkunoiden aukiolotilat
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isFloorPlanOpen, setIsFloorPlanOpen] = useState(false);
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);

  // Käyttäjän näyttönimi ja rooli alatunnistetta varten
  const displayName = user?.displayName || 'Matti Meikäläinen';
  const displayRole = user?.role ? user.role.toUpperCase() : 'USER';

  // Kirjautumattomalle käyttäjälle näytetään julkinen laskeutumissivu ja tarvittavat modaalit
  if (!user) {
    return (
      <>
        <LandingPage
          onOpenLogin={() => setIsLoginOpen(true)}
          onOpenIssueModal={() => setIsIssueModalOpen(true)}
          onOpenFloorPlan={() => setIsFloorPlanOpen(true)}
        />

        <FloorPlanModal
          isOpen={isFloorPlanOpen}
          onClose={() => setIsFloorPlanOpen(false)}
        />

        <IssueReportModal
          isOpen={isIssueModalOpen}
          onClose={() => setIsIssueModalOpen(false)}
        />

        <LoginModal
          isOpen={isLoginOpen}
          onClose={() => setIsLoginOpen(false)}
        />
      </>
    );
  }

  // Dedikoitu Admin Shell: ei julkista Navbaria, NewsBanneria tai 4-sarakkeista footeria
  if (activeTab === 'admin' || activeTab === 'superadmin') {
    return activeTab === 'superadmin' ? <SuperAdminPanel /> : <AdminPanel />;
  }

  // Kirjautuneen käyttäjän sovelluskehikko: navigaatio, tiedotebanneri, aktiivinen välilehti ja alatunniste
  return (
    <div className="min-h-screen flex flex-col bg-[#121417] text-[#F4F4F5]">
      <Navbar
        onOpenLogin={() => setIsLoginOpen(true)}
        onOpenFloorPlan={() => setIsFloorPlanOpen(true)}
        onOpenIssueModal={() => setIsIssueModalOpen(true)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Hero Banner directly below Navbar */}
      {/* Tiedotebanneri heti ylänavigaation alapuolella */}
      <NewsBanner />

      {/* Main Content Surface */}
      {/* Pääsisältöalue, joka renderöidään aktiivisen välilehden (activeTab) perusteella */}
      <main className="flex-1 bg-[#121417] text-[#F4F4F5] py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {activeTab === 'news' && <NewsFeedPage />}

          {activeTab === 'book' && (
            <BookingCalendar
              onRequireLogin={() => setIsLoginOpen(true)}
              onSuccessBooking={() => setActiveTab('my-bookings')}
              onOpenFloorPlan={() => setIsFloorPlanOpen(true)}
              onNavigateMyBookings={() => setActiveTab('my-bookings')}
            />
          )}

          {activeTab === 'status' && (
            <RealtimeStatus
              onOpenFloorPlan={() => setIsFloorPlanOpen(true)}
              onNavigateToBooking={() => setActiveTab('book')}
            />
          )}

          {activeTab === 'games' && <GamesCatalog />}

          {activeTab === 'rules' && (
            <RulesAndGuide onOpenFloorPlan={() => setIsFloorPlanOpen(true)} />
          )}

          {activeTab === 'my-bookings' && <MyReservations />}
        </div>
      </main>

      {/* Dark Separator Band + Gold Top Line + Multi-Column Xamk Footer */}
      {/* Koristeellinen kultainen erotinviiva ja monisarakkeinen Xamk-alatunniste */}
      <div className="h-1.5 w-full bg-[#FACC15] border-y-2 border-black" aria-hidden="true" />

      <footer className="bg-[#1C1F24] text-[#F4F4F5] border-t-2 border-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Column 1: Pelihuone */}
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-extrabold uppercase tracking-tight text-[#FACC15] border-b border-[#3F444E] pb-2">
              {isEn ? 'Game Room' : 'Pelihuone'}
            </h3>
            <ul className="flex flex-col gap-2 text-sm text-[#D4D4D8] list-none p-0 m-0">
              <li>
                <button type="button" className="font-mono font-bold text-left text-[#F4F4F5] hover:text-[#FACC15] hover:underline underline-offset-4 cursor-pointer bg-transparent border-0 p-0" onClick={() => setActiveTab('book')}>
                  {isEn ? 'Book station' : 'Varaa laite'}
                </button>
              </li>
              <li>
                <button type="button" className="font-mono font-bold text-left text-[#F4F4F5] hover:text-[#FACC15] hover:underline underline-offset-4 cursor-pointer bg-transparent border-0 p-0" onClick={() => setActiveTab('status')}>
                  {isEn ? 'Live status' : 'Tilan tilanne'}
                </button>
              </li>
              <li>
                <button type="button" className="font-mono font-bold text-left text-[#F4F4F5] hover:text-[#FACC15] hover:underline underline-offset-4 cursor-pointer bg-transparent border-0 p-0" onClick={() => setActiveTab('games')}>
                  {isEn ? 'Games and wishlist' : 'Pelit ja toivelista'}
                </button>
              </li>
              <li>
                <button type="button" className="font-mono font-bold text-left text-[#F4F4F5] hover:text-[#FACC15] hover:underline underline-offset-4 cursor-pointer bg-transparent border-0 p-0" onClick={() => setActiveTab('my-bookings')}>
                  {isEn ? 'My bookings' : 'Omat varaukset'}
                </button>
              </li>
            </ul>
          </div>

          {/* Column 2: Ohjeet ja tila */}
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-extrabold uppercase tracking-tight text-[#FACC15] border-b border-[#3F444E] pb-2">
              {isEn ? 'Guides & room' : 'Ohjeet ja tila'}
            </h3>
            <ul className="flex flex-col gap-2 text-sm text-[#D4D4D8] list-none p-0 m-0">
              <li>
                <button type="button" className="font-mono font-bold text-left text-[#F4F4F5] hover:text-[#FACC15] hover:underline underline-offset-4 cursor-pointer bg-transparent border-0 p-0" onClick={() => setActiveTab('rules')}>
                  {isEn ? 'Rules and guide' : 'Säännöt ja ohjeet'}
                </button>
              </li>
              <li>
                <button type="button" className="font-mono font-bold text-left text-[#F4F4F5] hover:text-[#FACC15] hover:underline underline-offset-4 cursor-pointer bg-transparent border-0 p-0" onClick={() => setIsFloorPlanOpen(true)}>
                  {isEn ? 'Floor plan' : 'Tilan pohjakuva'}
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Yhteisö ja tuki */}
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-extrabold uppercase tracking-tight text-[#FACC15] border-b border-[#3F444E] pb-2">
              {isEn ? 'Community & support' : 'Yhteisö ja tuki'}
            </h3>
            <ul className="flex flex-col gap-2 text-sm text-[#D4D4D8] list-none p-0 m-0">
              <li>
                <a href="https://discord.gg/xamk" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 font-mono font-bold text-[#F4F4F5] hover:text-[#FACC15] hover:underline underline-offset-4">
                  <DiscordIcon className="w-4 h-4 shrink-0" />
                  Discord
                </a>
              </li>
              <li>
                <button type="button" className="font-mono font-bold text-left text-[#F4F4F5] hover:text-[#FACC15] hover:underline underline-offset-4 cursor-pointer bg-transparent border-0 p-0" onClick={() => setIsIssueModalOpen(true)}>
                  {isEn ? 'Report issue' : 'Ilmoita viasta'}
                </button>
              </li>
            </ul>
          </div>

          {/* Column 4: User & Organization Info */}
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-extrabold uppercase tracking-tight text-[#FACC15] border-b border-[#3F444E] pb-2">
              {displayName} <span className="rounded-none inline-block ml-1.5 px-1.5 py-0.5 text-[11px] font-mono font-bold uppercase bg-[#FACC15] text-[#09090B] border border-black">{displayRole}</span>
            </h3>
            <ul className="flex flex-col gap-2 text-sm text-[#D4D4D8] list-none p-0 m-0">
              <li>
                <span>
                  {isEn
                    ? 'South-Eastern Finland UAS'
                    : 'Kaakkois-Suomen ammattikorkeakoulu'}
                </span>
              </li>
              <li>
                <span>Kotka, Kouvola, Mikkeli, Savonlinna</span>
              </li>
              <li>
                <span>T: (05) 3555 39 88</span>
              </li>
              <li>
                <a
                  href="https://www.xamk.fi"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono font-bold text-[#FACC15] hover:underline underline-offset-4"
                >
                  www.xamk.fi
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-[#3F444E] bg-[#121417] px-4 sm:px-6 lg:px-8 py-4 text-center text-xs font-mono font-bold uppercase tracking-wider text-[#A1A1AA]">
          <span>
            {t('footer.school')}, Xamk Game Room,{' '}
            {isEn ? 'all for the future' : 'tulevaisuutta varten'}
          </span>
        </div>
      </footer>

      {/* Globaalit modaali-ikkunat kirjautumiselle, pohjakuvalle ja vikailmoituksille */}
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
      />

      <FloorPlanModal
        isOpen={isFloorPlanOpen}
        onClose={() => setIsFloorPlanOpen(false)}
      />

      <IssueReportModal
        isOpen={isIssueModalOpen}
        onClose={() => setIsIssueModalOpen(false)}
      />
    </div>
  );
};

/**
 * Sovelluksen pääkomponentti, joka yhdistää kaikki kontekstitarjoajat (Provider)
 * ja virherajan yhtenäiseksi kokonaisuudeksi.
 */
export const App: React.FC = () => {
  return (
    <AppErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <LanguageProvider>
          <AuthProvider>
            <RouterProvider>
              <AppContent />
            </RouterProvider>
          </AuthProvider>
        </LanguageProvider>
      </QueryClientProvider>
    </AppErrorBoundary>
  );
};

export default App;
