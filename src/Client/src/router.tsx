/**
 * @file router.tsx
 * @description Kevyt selaimen History API -pohjainen reititin ja konteksti.
 * Hallinnoi sovelluksen päävälilehtiä (AppTab) ja ylläpitopaneelin alavälilehtiä (AdminSubTab)
 * synkronoiden ne suoraan URL-polun kanssa.
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

/**
 * Sovelluksen päävälilehtien tunnisteet.
 */
export type AppTab = 'book' | 'status' | 'games' | 'rules' | 'my-bookings' | 'admin' | 'superadmin';

/**
 * Ylläpitopaneelin (AdminPanel) alavälilehtien tunnisteet.
 */
export type AdminSubTab = 'games' | 'news' | 'users' | 'settings' | 'statistics' | 'issues';

/**
 * Lista sallituista ylläpitopaneelin alavälilehdistä polkujen validointia varten.
 */
const VALID_ADMIN_SUBTABS: AdminSubTab[] = [
  'games',
  'news',
  'users',
  'settings',
  'statistics',
  'issues',
];

/**
 * Muuntaa annetun päävälilehden ja valinnaisen admin-alavälilehden vastaavaksi URL-poluksi.
 *
 * @param tab - Valittu päävälilehti
 * @param adminSubTab - Valinnainen admin-näkymän alavälilehti
 * @returns Selaimen osoiteriville asetettava polku
 */
function tabToPath(tab: AppTab, adminSubTab?: AdminSubTab): string {
  switch (tab) {
    case 'book':
      return '/book';
    case 'status':
      return '/status';
    case 'games':
      return '/games';
    case 'rules':
      return '/rules';
    case 'my-bookings':
      return '/my-bookings';
    case 'admin':
      return adminSubTab ? `/admin/${adminSubTab}` : '/admin/games';
    case 'superadmin':
      return '/superadmin';
    default:
      return '/book';
  }
}

/**
 * Jäsentää selaimen URL-polun (pathname) ja palauttaa sitä vastaavan päävälilehden
 * sekä admin-alavälilehden. Tukee sekä englannin- että suomenkielisiä polkuja.
 *
 * @param pathname - Selaimen nykyinen polku (esim. `/admin/users` tai `/varaa`)
 * @returns Objekti, joka sisältää aktiivisen päävälilehden (`tab`) ja alavälilehden (`adminSubTab`)
 */
function pathToRoute(pathname: string): {
  tab: AppTab;
  adminSubTab: AdminSubTab;
} {
  // Poistetaan mahdolliset lopun kauttaviivat
  const clean = pathname.replace(/\/+$/, '') || '/';

  if (clean === '/' || clean === '/book' || clean === '/varaa') {
    return { tab: 'book', adminSubTab: 'games' };
  }
  if (clean === '/status' || clean === '/tilanne') {
    return { tab: 'status', adminSubTab: 'games' };
  }
  if (clean === '/games' || clean === '/pelit') {
    return { tab: 'games', adminSubTab: 'games' };
  }
  if (clean === '/rules' || clean === '/saannot') {
    return { tab: 'rules', adminSubTab: 'games' };
  }
  if (clean === '/my-bookings' || clean === '/omat-varaukset') {
    return { tab: 'my-bookings', adminSubTab: 'games' };
  }
  if (clean === '/superadmin') {
    return { tab: 'superadmin', adminSubTab: 'games' };
  }
  // Tarkistetaan admin-reitit ja niiden alavälilehdet
  if (clean === '/admin' || clean.startsWith('/admin/')) {
    const parts = clean.split('/').filter(Boolean);
    const maybeSub = parts[1] as AdminSubTab | undefined;
    const subTab: AdminSubTab =
      maybeSub && VALID_ADMIN_SUBTABS.includes(maybeSub) ? maybeSub : 'games';
    return { tab: 'admin', adminSubTab: subTab };
  }

  // Tuntemattomat polut ohjataan oletuksena varausnäkymään
  return { tab: 'book', adminSubTab: 'games' };
}

/**
 * Reititinkontekstin tarjoama rajapinta komponenteille.
 */
interface RouterContextValue {
  /** Nykyinen URL-polku */
  pathname: string;
  /** Nykyinen aktiivinen päävälilehti */
  activeTab: AppTab;
  /** Nykyinen aktiivinen ylläpitopaneelin alavälilehti */
  adminSubTab: AdminSubTab;
  /** Funktio suoraan URL-polkuun siirtymiseen */
  navigate: (path: string, options?: { replace?: boolean }) => void;
  /** Funktio päävälilehden vaihtamiseen */
  setActiveTab: (tab: AppTab) => void;
  /** Funktio ylläpitopaneelin alavälilehden vaihtamiseen */
  setAdminSubTab: (subTab: AdminSubTab) => void;
}

const RouterContext = createContext<RouterContextValue | undefined>(undefined);

/**
 * Reititinkontekstin tarjoajakomponentti (Provider), joka kuuntelee selaimen
 * `popstate`-tapahtumia ja tarjoaa navigointifunktiot lapsikomponenteille.
 */
export const RouterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [pathname, setPathname] = useState<string>(() => window.location.pathname || '/');

  // Kuunnellaan selaimen Edellinen/Seuraava-painikkeita (popstate)
  useEffect(() => {
    const handlePopState = () => {
      setPathname(window.location.pathname || '/');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Siirtää selaimen uuteen osoitteeseen ja rullaa sivun ylös
  const navigate = useCallback((to: string, options?: { replace?: boolean }) => {
    const target = to.startsWith('/') ? to : `/${to}`;
    if (window.location.pathname !== target) {
      if (options?.replace) {
        window.history.replaceState({}, '', target);
      } else {
        window.history.pushState({}, '', target);
      }
    }
    setPathname(target);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const { tab: activeTab, adminSubTab } = pathToRoute(pathname);

  // Vaihtaa aktiivista päävälilehteä säilyttäen admin-alavälilehden tarvittaessa
  const setActiveTab = useCallback(
    (tab: AppTab) => {
      const nextPath = tabToPath(tab, tab === 'admin' ? adminSubTab : undefined);
      navigate(nextPath);
    },
    [adminSubTab, navigate]
  );

  // Vaihtaa admin-paneelin alavälilehteä
  const setAdminSubTab = useCallback(
    (subTab: AdminSubTab) => {
      navigate(tabToPath('admin', subTab));
    },
    [navigate]
  );

  return (
    <RouterContext.Provider
      value={{
        pathname,
        activeTab,
        adminSubTab,
        navigate,
        setActiveTab,
        setAdminSubTab,
      }}
    >
      {children}
    </RouterContext.Provider>
  );
};

/**
 * Hook reititinkontekstin käyttämiseen komponenteissa.
 * Heittää virheen, jos sitä kutsutaan `RouterProvider`-komponentin ulkopuolella.
 */
// eslint-disable-next-line react-refresh/only-export-components
export const useRouter = (): RouterContextValue => {
  const ctx = useContext(RouterContext);
  if (!ctx) {
    throw new Error('useRouter must be used within a RouterProvider');
  }
  return ctx;
};
