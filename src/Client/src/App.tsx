import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { Navbar, type AppTab } from './components/Navbar';
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
      staleTime: 1000 * 10, // 10 sekuntia
      retry: 1,
    },
  },
});

export const AppContent: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<AppTab>('book');
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isFloorPlanOpen, setIsFloorPlanOpen] = useState(false);
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);

  // Jos käyttäjä EI OLE kirjautunut: Ensimmäinen sivu on LandingPage (Xamk logo, uutiset & kirjautuminen)
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

  // Kun kirjautuminen onnistuu: aukeaa varausjärjestelmä
  return (
    <>
      <Navbar
        onOpenLogin={() => setIsLoginOpen(true)}
        onOpenFloorPlan={() => setIsFloorPlanOpen(true)}
        onOpenIssueModal={() => setIsIssueModalOpen(true)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      <main className="main-content">
        {/* Tärkeät tiedotteet aina näkyvillä yläosassa */}
        <NewsBanner />

        {activeTab === 'book' && (
          <BookingCalendar
            onRequireLogin={() => setIsLoginOpen(true)}
            onSuccessBooking={() => setActiveTab('my-bookings')}
            onOpenFloorPlan={() => setIsFloorPlanOpen(true)}
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
      </main>

      <footer className="footer">
        <div className="footer-content">
          <span>{t('footer.school')}</span>
          <span className="footer-separator">•</span>
          <span className="footer-gold">Xamk Game Room</span>
          <span className="footer-separator">•</span>
          <button
            type="button"
            className="footer-link-btn"
            onClick={() => setIsIssueModalOpen(true)}
          >
            {t('footer.report')}
          </button>
          <span className="footer-separator">•</span>
          <a
            href="https://discord.gg/xamk"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-discord-link"
          >
            {t('footer.discord')}
          </a>
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
    </>
  );
};

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
};

export default App;
