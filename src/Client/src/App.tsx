import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { Navbar, type AppTab } from './components/Navbar';
import { BookingCalendar } from './components/BookingCalendar';
import { RealtimeStatus } from './components/RealtimeStatus';
import { GamesCatalog } from './components/GamesCatalog';
import { MyReservations } from './components/MyReservations';
import { AdminPanel } from './components/AdminPanel';
import { SuperAdminPanel } from './components/SuperAdminPanel';
import { LoginModal } from './components/LoginModal';
import { FloorPlanModal } from './components/FloorPlanModal';
import { RulesAndGuide } from './components/RulesAndGuide';
import { LandingPage } from './components/LandingPage';
import { IssueReportModal } from './components/IssueReportModal';
import { HeroBanner } from './components/HeroBanner';
import { Footer } from './components/Footer';

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
  const [activeTab, setActiveTab] = useState<AppTab>('book');
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isFloorPlanOpen, setIsFloorPlanOpen] = useState(false);
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);

  // Jos käyttäjä EI OLE kirjautunut: Ensimmäinen sivu on LandingPage
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

  // Kun käyttäjä on kirjautunut: Aukeaa päänäkymä mallin mukaisella värimaailmalla
  return (
    <div className="flex flex-col min-h-screen bg-[#0a0b0d] text-white">
      {/* 1. Yläpalkki (Pikimusta tausta) */}
      <Navbar
        onOpenLogin={() => setIsLoginOpen(true)}
        onOpenFloorPlan={() => setIsFloorPlanOpen(true)}
        onOpenIssueModal={() => setIsIssueModalOpen(true)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* 2. Hero-banneri valokuvalla ja aukioloajoilla */}
      <HeroBanner />

      {/* 3. KESKIALUE HARMAA (#23262d) EROTTUVUUDEN TAKIA */}
      <main className="flex-1 w-full max-w-full overflow-hidden bg-[#23262d] border-y border-[#181a20] py-6 sm:py-8 lg:py-10">
        <div className="max-w-[1720px] w-full mx-auto px-3 sm:px-6 lg:px-8">
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
        </div>
      </main>

      {/* 4. Alapalkki (Kultainen korostusviiva + musta tausta) */}
      <Footer
        onOpenIssueModal={() => setIsIssueModalOpen(true)}
        onOpenFloorPlan={() => setIsFloorPlanOpen(true)}
        onNavigateTab={(tab) => setActiveTab(tab)}
      />

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
