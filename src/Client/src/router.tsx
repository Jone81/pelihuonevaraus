import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export type AppTab = 'book' | 'status' | 'games' | 'rules' | 'my-bookings' | 'admin' | 'superadmin';
export type AdminSubTab = 'games' | 'news' | 'users' | 'settings' | 'statistics' | 'issues';

const VALID_ADMIN_SUBTABS: AdminSubTab[] = [
  'games',
  'news',
  'users',
  'settings',
  'statistics',
  'issues',
];

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

function pathToRoute(pathname: string): {
  tab: AppTab;
  adminSubTab: AdminSubTab;
} {
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
  if (clean === '/admin' || clean.startsWith('/admin/')) {
    const parts = clean.split('/').filter(Boolean);
    const maybeSub = parts[1] as AdminSubTab | undefined;
    const subTab: AdminSubTab =
      maybeSub && VALID_ADMIN_SUBTABS.includes(maybeSub) ? maybeSub : 'games';
    return { tab: 'admin', adminSubTab: subTab };
  }

  return { tab: 'book', adminSubTab: 'games' };
}

interface RouterContextValue {
  pathname: string;
  activeTab: AppTab;
  adminSubTab: AdminSubTab;
  navigate: (path: string, options?: { replace?: boolean }) => void;
  setActiveTab: (tab: AppTab) => void;
  setAdminSubTab: (subTab: AdminSubTab) => void;
}

const RouterContext = createContext<RouterContextValue | undefined>(undefined);

export const RouterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [pathname, setPathname] = useState<string>(() => window.location.pathname || '/');

  useEffect(() => {
    const handlePopState = () => {
      setPathname(window.location.pathname || '/');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

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

  const setActiveTab = useCallback(
    (tab: AppTab) => {
      const nextPath = tabToPath(tab, tab === 'admin' ? adminSubTab : undefined);
      navigate(nextPath);
    },
    [adminSubTab, navigate]
  );

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

// eslint-disable-next-line react-refresh/only-export-components
export const useRouter = (): RouterContextValue => {
  const ctx = useContext(RouterContext);
  if (!ctx) {
    throw new Error('useRouter must be used within a RouterProvider');
  }
  return ctx;
};
