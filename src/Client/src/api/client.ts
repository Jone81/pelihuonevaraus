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

export class ApiError extends Error {
  status: number;
  problem?: ProblemDetails;

  constructor(status: number, message: string, problem?: ProblemDetails) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.problem = problem;
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let problem: ProblemDetails | undefined;
    try {
      problem = (await res.json()) as ProblemDetails;
    } catch {
      // response might not be JSON
    }

    const message = problem?.detail || problem?.title || `Pyyntö epäonnistui statuskoodilla ${res.status}`;
    throw new ApiError(res.status, message, problem);
  }

  if (res.status === 204) {
    return {} as T;
  }

  return res.json() as Promise<T>;
}

export const api = {
  // Auth
  async login(email: string, displayName: string): Promise<User> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, displayName }),
    });
    return handleResponse<User>(res);
  },

  async getUser(id: string): Promise<User> {
    const res = await fetch(`/api/users/${id}`);
    return handleResponse<User>(res);
  },

  // Stations
  async getAllStations(): Promise<GamingStation[]> {
    const res = await fetch('/api/stations');
    return handleResponse<GamingStation[]>(res);
  },

  async getAvailableStations(startUtc: string, endUtc: string): Promise<GamingStation[]> {
    const params = new URLSearchParams({ startUtc, endUtc });
    const res = await fetch(`/api/stations/available?${params.toString()}`);
    return handleResponse<GamingStation[]>(res);
  },

  // Reservations
  async getActiveReservations(startUtc: string, endUtc: string): Promise<Reservation[]> {
    const params = new URLSearchParams({ startUtc, endUtc });
    const res = await fetch(`/api/reservations?${params.toString()}`);
    return handleResponse<Reservation[]>(res);
  },

  async getReservation(id: string): Promise<Reservation> {
    const res = await fetch(`/api/reservations/${id}`);
    return handleResponse<Reservation>(res);
  },

  async createReservation(request: CreateReservationRequest): Promise<Reservation> {
    const res = await fetch('/api/reservations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    return handleResponse<Reservation>(res);
  },

  async cancelReservation(id: string, request: CancelReservationRequest): Promise<Reservation> {
    const res = await fetch(`/api/reservations/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    return handleResponse<Reservation>(res);
  },

  async overrideReservation(request: OverrideReservationRequest): Promise<Reservation> {
    const res = await fetch('/api/reservations/override', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    return handleResponse<Reservation>(res);
  },

  // Games & Wishlist
  async getGames(platform?: string): Promise<Game[]> {
    const query = platform ? `?platform=${encodeURIComponent(platform)}` : '';
    const res = await fetch(`/api/games${query}`);
    return handleResponse<Game[]>(res);
  },

  async getWishlist(): Promise<Game[]> {
    const res = await fetch('/api/games/wishlist');
    return handleResponse<Game[]>(res);
  },

  async addWishlistGame(request: WishGameRequest): Promise<Game> {
    const res = await fetch('/api/games/wishlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    return handleResponse<Game>(res);
  },

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

  async toggleWishlistStatus(gameId: string, adminUserId: string): Promise<Game> {
    const res = await fetch(`/api/games/${gameId}/toggle-wishlist`, {
      method: 'PUT',
      headers: { 'X-User-Id': adminUserId },
    });
    return handleResponse<Game>(res);
  },

  async voteGame(gameId: string): Promise<Game> {
    const res = await fetch(`/api/games/${gameId}/vote`, {
      method: 'POST',
    });
    return handleResponse<Game>(res);
  },

  // News & Announcements
  async getNews(): Promise<NewsItem[]> {
    const res = await fetch('/api/news');
    return handleResponse<NewsItem[]>(res);
  },

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

  async deleteNews(newsId: string, adminUserId: string): Promise<void> {
    const res = await fetch(`/api/news/${newsId}`, {
      method: 'DELETE',
      headers: { 'X-User-Id': adminUserId },
    });
    await handleResponse<unknown>(res);
  },

  // Verification Code (OTP)
  async sendVerificationCode(email: string): Promise<{ message: string; devCode?: string }> {
    const res = await fetch('/api/auth/send-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    return handleResponse<{ message: string; devCode?: string }>(res);
  },

  async verifyCodeAndLogin(email: string, code: string, displayName?: string): Promise<User> {
    const res = await fetch('/api/auth/verify-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code, displayName }),
    });
    return handleResponse<User>(res);
  },

  // Users (Admin)
  async getAllUsers(adminUserId?: string): Promise<User[]> {
    const res = await fetch('/api/users', {
      headers: adminUserId ? { 'X-User-Id': adminUserId } : {},
    });
    return handleResponse<User[]>(res);
  },

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
  async getStatistics(): Promise<StatisticsResponse> {
    const res = await fetch('/api/statistics');
    return handleResponse<StatisticsResponse>(res);
  },

  // Settings (Admin)
  async getSettings(): Promise<SiteSettingsResponse> {
    const res = await fetch('/api/settings');
    return handleResponse<SiteSettingsResponse>(res);
  },

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
  async createIssueReport(request: CreateIssueReportRequest): Promise<IssueReportResponse> {
    const res = await fetch('/api/issues', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    return handleResponse<IssueReportResponse>(res);
  },

  async getIssueReports(adminUserId: string): Promise<IssueReportResponse[]> {
    const res = await fetch('/api/issues', {
      headers: { 'X-User-Id': adminUserId },
    });
    return handleResponse<IssueReportResponse[]>(res);
  },

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
