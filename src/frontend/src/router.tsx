/**
 * @file router.tsx
 * @description React Router -reitityksen polkumääritykset ja tyyppiabstraktiot
 * pää- ja admin-näkymien URL-polkujen muodostamiseen ja jäsentämiseen.
 */

/**
 * Sovelluksen päävälilehtien tunnisteet.
 */
export type AppTab = 'news' | 'book' | 'status' | 'games' | 'rules' | 'my-bookings' | 'admin' | 'superadmin';

/**
 * Ylläpitopaneelin (AdminPanel) alavälilehtien tunnisteet.
 */
export type AdminSubTab =
  | 'overview'
  | 'reservations'
  | 'stations'
  | 'issues'
  | 'games'
  | 'news'
  | 'users'
  | 'statistics'
  | 'settings';

/**
 * Ylläpitopaneelin ja SuperAdmin-näkymän yhteinen osiotunniste sivupalkkinavigaatiolle.
 */
export type AdminSection = AdminSubTab | 'superadmin';

/**
 * Lista sallituista ylläpitopaneelin alavälilehdistä polkujen validointia varten.
 */
const VALID_ADMIN_SUBTABS: AdminSubTab[] = [
  'overview',
  'reservations',
  'stations',
  'issues',
  'games',
  'news',
  'users',
  'statistics',
  'settings',
];

/**
 * Muuntaa annetun päävälilehden ja valinnaisen admin-alavälilehden vastaavaksi URL-poluksi.
 *
 * @param tab - Valittu päävälilehti
 * @param adminSubTab - Valinnainen admin-näkymän alavälilehti
 * @returns React Router -navigaatioon sopiva polku
 */
export function tabToPath(tab: AppTab, adminSubTab?: AdminSubTab): string {
  switch (tab) {
    case 'news':
      return '/';
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
      return adminSubTab && adminSubTab !== 'overview' ? `/admin/${adminSubTab}` : '/admin';
    case 'superadmin':
      return '/superadmin';
    default:
      return '/book';
  }
}

/**
 * Muuntaa ylläpitopaneelin osiotunnisteen (`AdminSection`) URL-poluksi.
 *
 * @param section - Ylläpito-osion tunniste
 * @returns Kohdepolku (`/superadmin`, `/admin` tai `/admin/<osio>`)
 */
export function adminSectionToPath(section: AdminSection): string {
  if (section === 'superadmin') return '/superadmin';
  return tabToPath('admin', section);
}

/**
 * Selvittää aktiivisen päävälilehden selaimen URL-polun perusteella.
 *
 * @param pathname - Nykyinen URL-polku
 * @returns Vastaava `AppTab`-tunniste
 */
export function pathnameToAppTab(pathname: string): AppTab {
  const clean = pathname.replace(/\/+$/, '') || '/';
  if (clean === '/' || clean === '/uutiset' || clean === '/news') return 'news';
  if (clean === '/book' || clean === '/varaa') return 'book';
  if (clean === '/status' || clean === '/tilanne') return 'status';
  if (clean === '/games' || clean === '/pelit') return 'games';
  if (clean === '/rules' || clean === '/saannot') return 'rules';
  if (clean === '/my-bookings' || clean === '/omat-varaukset') return 'my-bookings';
  if (clean === '/superadmin' || clean === '/admin/override') return 'superadmin';
  if (clean === '/admin' || clean.startsWith('/admin/')) return 'admin';
  return 'book';
}

/**
 * Selvittää aktiivisen admin-alavälilehden selaimen URL-polun perusteella.
 *
 * @param pathname - Nykyinen URL-polku
 * @returns Vastaava `AdminSubTab`-tunniste
 */
export function pathnameToAdminSubTab(pathname: string): AdminSubTab {
  const clean = pathname.replace(/\/+$/, '') || '/';
  if (clean === '/admin' || !clean.startsWith('/admin/')) return 'overview';
  const parts = clean.split('/').filter(Boolean);
  const maybeSub = parts[1] as AdminSubTab | undefined;
  return maybeSub && VALID_ADMIN_SUBTABS.includes(maybeSub) ? maybeSub : 'overview';
}
