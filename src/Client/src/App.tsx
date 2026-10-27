import React, { useState, useEffect, Component, type ReactNode } from 'react';
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
import { LoginModal } from './components/LoginModal';
import { FloorPlanModal } from './components/FloorPlanModal';
import { RulesAndGuide } from './components/RulesAndGuide';
import { LandingPage } from './components/LandingPage';
import { IssueReportModal } from './components/IssueReportModal';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 10,
      retry: 1,
    },
  },
});

interface ErrorBoundaryState {
  hasError: boolean;
}

class AppErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 text-center text-white bg-[#151618] min-h-screen flex flex-col items-center justify-center gap-4" role="alert">
          <h2 className="text-xl font-bold">Näkymän latauksessa tapahtui virhe</h2>
          <button
            type="button"
            className="xamk-confirm-pill-btn btn-touch"
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

export const AppContent: React.FC = () => {
  const { user } = useAuth();
  const { lang, t } = useLanguage();
  const isEn = lang === 'en';
  const { pathname, activeTab, setActiveTab, navigate } = useRouter();
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isFloorPlanOpen, setIsFloorPlanOpen] = useState(false);
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);

  // Sync root '/' to '/book' when authenticated so every view has an explicit path
  useEffect(() => {
    if (user && (pathname === '/' || pathname === '')) {
      navigate('/book', { replace: true });
    }
  }, [user, pathname, navigate]);

  const displayName = user?.displayName || 'Matti Meikäläinen';
  const displayRole = user?.role ? user.role.toUpperCase() : 'USER';

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

  return (
    <div className="xamk-app-shell">
      <Navbar
        onOpenLogin={() => setIsLoginOpen(true)}
        onOpenFloorPlan={() => setIsFloorPlanOpen(true)}
        onOpenIssueModal={() => setIsIssueModalOpen(true)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Hero Banner directly below Navbar */}
      <NewsBanner />

      {/* Main Content Surface */}
      <main className="xamk-main-surface">
        <div className="xamk-main-container">
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

          {activeTab === 'admin' && <AdminPanel />}

          {activeTab === 'superadmin' && <SuperAdminPanel />}
        </div>
      </main>

      {/* Dark Separator Band + Gold Top Line + Multi-Column Xamk Footer */}
      <div className="xamk-footer-gold-line" aria-hidden="true" />

      <footer className="xamk-footer">
        <div className="xamk-footer-grid">
          {/* Column 1: Varaa */}
          <div className="xamk-footer-col">
            <h3 className="xamk-footer-heading">{isEn ? 'Book' : 'Varaa'}</h3>
            <ul className="xamk-footer-links">
              <li>
                <button type="button" onClick={() => setActiveTab('book')}>
                  {isEn ? 'Book Station' : 'Varaa laite'}
                </button>
              </li>
              <li>
                <button type="button" onClick={() => setActiveTab('status')}>
                  {isEn ? 'Live Status' : 'Tilan tilanne'}
                </button>
              </li>
              <li>
                <button type="button" onClick={() => setActiveTab('games')}>
                  {isEn ? 'Games & Wishlist' : 'Pelit & Toivelista'}
                </button>
              </li>
              <li>
                <button type="button" onClick={() => setActiveTab('book')}>
                  {isEn ? 'Reservation System' : 'Maksuton varausjärjestelmä'}
                </button>
              </li>
            </ul>
          </div>

          {/* Column 2: Tietoa */}
          <div className="xamk-footer-col">
            <h3 className="xamk-footer-heading">{isEn ? 'Home' : 'Tietoa'}</h3>
            <ul className="xamk-footer-links">
              <li>
                <button type="button" onClick={() => setActiveTab('games')}>
                  {isEn ? 'Game Wishlist' : 'Pelien toivelista'}
                </button>
              </li>
              <li>
                <button type="button" onClick={() => setActiveTab('rules')}>
                  {isEn ? 'Guides' : 'Ohjeet'}
                </button>
              </li>
              <li>
                <button type="button" onClick={() => setActiveTab('status')}>
                  {isEn ? 'Availability' : 'Saatavuus'}
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Pohjakuva */}
          <div className="xamk-footer-col">
            <h3 className="xamk-footer-heading">{isEn ? 'Floor Plan' : 'Pohjakuva'}</h3>
            <ul className="xamk-footer-links">
              <li>
                <button type="button" onClick={() => setActiveTab('rules')}>
                  {isEn ? 'Rules' : 'Säännöt'}
                </button>
              </li>
              <li>
                <button type="button" onClick={() => setActiveTab('rules')}>
                  {isEn ? 'Rules & Guide' : 'Säännöt & Ohjeet'}
                </button>
              </li>
              <li>
                <button type="button" onClick={() => setIsFloorPlanOpen(true)}>
                  {isEn ? 'Room Layout' : 'Tilan pohjakuva'}
                </button>
              </li>
            </ul>
          </div>

          {/* Column 4: Omat tiedot */}
          <div className="xamk-footer-col">
            <h3 className="xamk-footer-heading">{isEn ? 'My Links' : 'Omat tiedot'}</h3>
            <ul className="xamk-footer-links">
              <li>
                <a href="https://discord.gg/xamk" target="_blank" rel="noopener noreferrer">
                  Discord
                </a>
              </li>
              <li>
                <button type="button" onClick={() => setIsIssueModalOpen(true)}>
                  {isEn ? 'Report Issue' : 'Ilmoita viasta'}
                </button>
              </li>
              <li>
                <button type="button" onClick={() => setActiveTab('my-bookings')}>
                  {isEn ? 'My Bookings' : 'Omat varaukset'}
                </button>
              </li>
            </ul>
          </div>

          {/* Column 5: Contact info */}
          <div className="xamk-footer-col">
            <h3 className="xamk-footer-heading">Contact info</h3>
            <ul className="xamk-footer-links">
              <li>
                <span>
                  {isEn
                    ? 'South-Eastern Finland UAS'
                    : 'Kaakkois-Suomen ammattikorkeakoulu'}
                </span>
              </li>
              <li>
                <button type="button" onClick={() => setIsIssueModalOpen(true)}>
                  {isEn ? 'Contact us' : 'Ota yhteyttä'}
                </button>
              </li>
              <li>
                <span>{isEn ? 'Campus Game Room' : 'Kampuksen pelitila'}</span>
              </li>
              <li>
                <span>Kotka • Kouvola • Mikkeli • Savonlinna</span>
              </li>
            </ul>
          </div>

          {/* Column 6: User & Organization Info */}
          <div className="xamk-footer-col">
            <h3 className="xamk-footer-heading">
              {displayName} <span className="xamk-footer-role">{displayRole}</span>
            </h3>
            <ul className="xamk-footer-links">
              <li>
                <span>Kaakkois-Suomen ammattikorkeakoulu</span>
              </li>
              <li>
                <span>
                  Xamk Game Room — {isEn ? 'All for the future' : 'Tulevaisuutta varten'}
                </span>
              </li>
              <li>
                <span>T: (05) 3555 39 88</span>
              </li>
              <li>
                <a
                  href="https://www.xamk.fi"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="xamk-footer-domain-link"
                >
                  www.xamk.fi
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="xamk-footer-bottom-bar">
          <span>
            {t('footer.school')} • Xamk Game Room •{' '}
            {isEn ? 'All for the future' : 'Tulevaisuutta varten'}
          </span>
        </div>
      </footer>

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
