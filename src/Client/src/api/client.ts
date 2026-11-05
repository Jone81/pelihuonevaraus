/**
 * @file client.ts
 * @description HTTP-asiakas (API client) taustajärjestelmän REST-rajapinnan kutsumiseen.
 * Sisältää yhtenäisen virheenkäsittelyn (`ApiError` ja RFC 7807 `ProblemDetails`) sekä
 * kaikki sovelluksen tarvitsemat API-metodit.
 */
import type {
  CancelReservationRequest,
  CreateGameRequest,
  CreateIssueReportRequest,
  CreateNewsRequest,
  CreateReservationRequest,
  Game,
  GamingStation,
  IssueReportResponse,
  NewsItem,
  OverrideReservationRequest,
  ProblemDetails,
  Reservation,
  ResolveIssueReportRequest,
  SiteSettingsResponse,
  StatisticsResponse,
  UpdateSiteSettingsRequest,
  User,
  WishGameRequest,
} from '../types';

/**
 * Mukautettu virheluokka API-kutsujen epäonnistumisille.
 * Kuljettaa mukanaan HTTP-statuskoodin sekä mahdollisen backendin palauttaman ProblemDetails-objektin.
 */
export class ApiError extends Error {
  /** HTTP-vastauksen statuskoodi (esim. 400, 404, 409) */
  status: number;
  /** Taustajärjestelmän palauttama RFC 7807 -muotoinen virhekuvaus */
  problem?: ProblemDetails;

  constructor(status: number, message: string, problem?: ProblemDetails) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.problem = problem;
  }
}

/**
 * Käsittelee `fetch`-kutsun HTTP-vastauksen: tarkistaa onnistumisen, jäsentää JSON-datan
 * tai heittää `ApiError`-poikkeuksen virhetilanteissa.
 *
 * @param res - Fetch-rajapinnan palauttama Response-objekti
 * @returns Jäsennetty vastausdata tyypitettynä
 */
async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let problem: ProblemDetails | undefined;
    try {
      problem = (await res.json()) as ProblemDetails;
    } catch {
      // response might not be JSON
      // Vastaus ei välttämättä ole JSON-muotoinen (esim. tyhjä 500-virhe)
    }

    const message = problem?.detail || problem?.title || `Pyyntö epäonnistui statuskoodilla ${res.status}`;
    throw new ApiError(res.status, message, problem);
  }

  // 204 No Content -vastauksissa palautetaan tyhjä objekti
  if (res.status === 204) {
    return {} as T;
  }

  return res.json() as Promise<T>;
}

/**
 * Kokoelma kaikkia sovelluksen käyttämiä REST API -kutsuja ryhmiteltynä toiminnallisuuksittain.
 */
export const api = {
  // Auth
  /**
   * Kirjaa käyttäjän sisään sähköpostin ja näyttönimen perusteella (pikakirjautuminen/kehitystila).
   */
  async login(email: string, displayName: string): Promise<User> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, displayName }),
    });
    return handleResponse<User>(res);
  },

  /**
   * Hakee yksittäisen käyttäjän tiedot tunnisteen (ID) perusteella.
   */
  async getUser(id: string): Promise<User> {
    const res = await fetch(`/api/users/${id}`);
    return handleResponse<User>(res);
  },

  // Stations
  /**
   * Hakee kaikki järjestelmään rekisteröidyt pelipisteet ja laitteet.
   */
  async getAllStations(): Promise<GamingStation[]> {
    const res = await fetch('/api/stations');
    return handleResponse<GamingStation[]>(res);
  },

  /**
   * Hakee annetulla UTC-aikavälillä vapaana olevat pelipisteet.
   */
  async getAvailableStations(startUtc: string, endUtc: string): Promise<GamingStation[]> {
    const params = new URLSearchParams({ startUtc, endUtc });
    const res = await fetch(`/api/stations/available?${params.toString()}`);
    return handleResponse<GamingStation[]>(res);
  },

  // Reservations
  /**
   * Hakee kaikki aktiiviset varaukset annetulta UTC-aikaväliltä.
   */
  async getActiveReservations(startUtc: string, endUtc: string): Promise<Reservation[]> {
    const params = new URLSearchParams({ startUtc, endUtc });
    const res = await fetch(`/api/reservations?${params.toString()}`);
    return handleResponse<Reservation[]>(res);
  },

  /**
   * Hakee yksittäisen varauksen tiedot tunnisteen perusteella.
   */
  async getReservation(id: string): Promise<Reservation> {
    const res = await fetch(`/api/reservations/${id}`);
    return handleResponse<Reservation>(res);
  },

  /**
   * Luo uuden laite-, tila- tai tapahtumavarauksen.
   */
  async createReservation(request: CreateReservationRequest): Promise<Reservation> {
    const res = await fetch('/api/reservations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    return handleResponse<Reservation>(res);
  },

  /**
   * Peruuttaa olemassa olevan varauksen.
   */
  async cancelReservation(id: string, request: CancelReservationRequest): Promise<Reservation> {
    const res = await fetch(`/api/reservations/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    return handleResponse<Reservation>(res);
  },

  /**
   * SuperAdmin-toiminto: jyrää päällekkäiset varaukset ja luo uuden prioriteettivarauksen.
   */
  async overrideReservation(request: OverrideReservationRequest): Promise<Reservation> {
    const res = await fetch('/api/reservations/override', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    return handleResponse<Reservation>(res);
  },

  // Games & Wishlist
  /**
   * Hakee pelivalikoiman pelit, valinnaisesti suodatettuna alustan (esim. PC, PS5) mukaan.
   */
  async getGames(platform?: string): Promise<Game[]> {
    const query = platform ? `?platform=${encodeURIComponent(platform)}` : '';
    const res = await fetch(`/api/games${query}`);
    return handleResponse<Game[]>(res);
  },

  /**
   * Hakee opiskelijoiden toivelistalla olevat pelit.
   */
  async getWishlist(): Promise<Game[]> {
    const res = await fetch('/api/games/wishlist');
    return handleResponse<Game[]>(res);
  },

  /**
   * Lisää uuden peliehdotuksen opiskelijoiden toivelistalle.
   */
  async addWishlistGame(request: WishGameRequest): Promise<Game> {
    const res = await fetch('/api/games/wishlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    return handleResponse<Game>(res);
  },

  /**
   * Admin-toiminto: lisää uuden pelin suoraan pelivalikoimaan tai toivelistalle.
   */
  async createGame(request: CreateGameRequest, adminUserId: string): Promise<Game> {
    const res = await fetch('/api/games', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': adminUserId,
      },
      body: JSON.stringify(request),
    });
    return handleResponse<Game>(res);
  },

  /**
   * Admin-toiminto: vaihtaa pelin tilan toivelistan ja asennetun pelivalikoiman välillä.
   */
  async toggleWishlistStatus(gameId: string, adminUserId: string): Promise<Game> {
    const res = await fetch(`/api/games/${gameId}/toggle-wishlist`, {
      method: 'PUT',
      headers: { 'X-User-Id': adminUserId },
    });
    return handleResponse<Game>(res);
  },

  /**
   * Antaa äänen toivelistalla olevalle pelille.
   */
  async voteGame(gameId: string): Promise<Game> {
    const res = await fetch(`/api/games/${gameId}/vote`, {
      method: 'POST',
    });
    return handleResponse<Game>(res);
  },

  // News & Announcements
  /**
   * Hakee kaikki julkaistut uutiset ja tiedotteet.
   */
  async getNews(): Promise<NewsItem[]> {
    const res = await fetch('/api/news');
    return handleResponse<NewsItem[]>(res);
  },

  /**
   * Admin-toiminto: luo uuden tiedotteen tai uutisen.
   */
  async createNews(request: CreateNewsRequest, adminUserId: string): Promise<NewsItem> {
    const res = await fetch('/api/news', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': adminUserId,
      },
      body: JSON.stringify(request),
    });
    return handleResponse<NewsItem>(res);
  },

  /**
   * Admin-toiminto: poistaa tiedotteen tunnisteen perusteella.
   */
  async deleteNews(newsId: string, adminUserId: string): Promise<void> {
    const res = await fetch(`/api/news/${newsId}`, {
      method: 'DELETE',
      headers: { 'X-User-Id': adminUserId },
    });
    await handleResponse<unknown>(res);
  },

  // Verification Code (OTP)
  /**
   * Lähettää kertakäyttöisen 6-numeroisen vahvistuskoodin (OTP) käyttäjän sähköpostiin.
   */
  async sendVerificationCode(email: string): Promise<{ message: string; devCode?: string }> {
    const res = await fetch('/api/auth/send-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    return handleResponse<{ message: string; devCode?: string }>(res);
  },

  /**
   * Tarkistaa sähköpostiin lähetetyn OTP-vahvistuskoodin ja kirjaa käyttäjän sisään.
   */
  async verifyCodeAndLogin(email: string, code: string, displayName?: string): Promise<User> {
    const res = await fetch('/api/auth/verify-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code, displayName }),
    });
    return handleResponse<User>(res);
  },

  // Users (Admin)
  /**
   * Admin-toiminto: hakee kaikki rekisteröityneet käyttäjät.
   */
  async getAllUsers(adminUserId?: string): Promise<User[]> {
    const res = await fetch('/api/users', {
      headers: adminUserId ? { 'X-User-Id': adminUserId } : {},
    });
    return handleResponse<User[]>(res);
  },

  /**
   * Admin-toiminto: päivittää käyttäjän käyttöoikeusroolin (User, Admin, SuperAdmin).
   */
  async updateUserRole(userId: string, role: string, adminUserId?: string): Promise<User> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (adminUserId) headers['X-User-Id'] = adminUserId;
    const res = await fetch(`/api/users/${userId}/role`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ role }),
    });
    return handleResponse<User>(res);
  },

  // Statistics (Admin)
  /**
   * Admin-toiminto: hakee varausjärjestelmän käyttötilastot ja laitteiden käyttöasteet.
   */
  async getStatistics(): Promise<StatisticsResponse> {
    const res = await fetch('/api/statistics');
    return handleResponse<StatisticsResponse>(res);
  },

  // Settings (Admin)
  /**
   * Admin-toiminto: hakee sivuston yleiset asetukset (kuten Discord-webhookin ja aikarajat).
   */
  async getSettings(): Promise<SiteSettingsResponse> {
    const res = await fetch('/api/settings');
    return handleResponse<SiteSettingsResponse>(res);
  },

  /**
   * Admin-toiminto: tallentaa päivitetyt sivuston asetukset.
   */
  async updateSettings(request: UpdateSiteSettingsRequest, adminUserId?: string): Promise<SiteSettingsResponse> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (adminUserId) headers['X-User-Id'] = adminUserId;
    const res = await fetch('/api/settings', {
      method: 'PUT',
      headers,
      body: JSON.stringify(request),
    });
    return handleResponse<SiteSettingsResponse>(res);
  },

  // Issues & Bug Reports
  /**
   * Lähettää uuden vikailmoituksen tai palautteen ylläpidolle.
   */
  async createIssueReport(request: CreateIssueReportRequest): Promise<IssueReportResponse> {
    const res = await fetch('/api/issues', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    return handleResponse<IssueReportResponse>(res);
  },

  /**
   * Admin-toiminto: hakee kaikki käyttäjien lähettämät vikailmoitukset.
   */
  async getIssueReports(adminUserId: string): Promise<IssueReportResponse[]> {
    const res = await fetch('/api/issues', {
      headers: { 'X-User-Id': adminUserId },
    });
    return handleResponse<IssueReportResponse[]>(res);
  },

  /**
   * Admin-toiminto: merkitsee vikailmoituksen ratkaistuksi ja tallentaa ylläpidon muistiinpanot.
   */
  async resolveIssueReport(
    issueId: string,
    request: ResolveIssueReportRequest,
    adminUserId: string
  ): Promise<IssueReportResponse> {
    const res = await fetch(`/api/issues/${issueId}/resolve`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': adminUserId,
      },
      body: JSON.stringify(request),
    });
    return handleResponse<IssueReportResponse>(res);
  },
};
