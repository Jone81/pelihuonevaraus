export type UserRole = 'User' | 'Admin' | 'SuperAdmin';

export interface User {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
}

export type ReservationType = 1 | 2 | 3; // 1 = Individual, 2 = Room, 3 = Event

export interface GamingStation {
  id: string;
  name: string;
  stationCode?: string;
  type: string;
  usesSharedTv: boolean;
  isActive: boolean;
}

export interface Reservation {
  id: string;
  userId: string;
  reservationType: string;
  gamingStationId?: string | null;
  gameRoomId?: string | null;
  startUtc: string;
  endUtc: string;
  durationMinutes: number;
  status: 'Active' | 'Cancelled';
  createdAtUtc: string;
  cancellationReason?: string | null;
  bookerName?: string | null;
  bookerEmail?: string | null;
}

export interface CreateReservationRequest {
  idempotencyKey: string;
  userId: string;
  reservationType: ReservationType;
  gamingStationId?: string | null;
  startUtc: string;
  endUtc: string;
}

export interface CancelReservationRequest {
  userId: string;
  reason?: string;
}

export interface OverrideReservationRequest {
  reservationRequest: CreateReservationRequest;
  reason: string;
}

export interface Game {
  id: string;
  name: string;
  platform: string;
  description: string;
  isWishlist: boolean;
  votesCount?: number;
}

export interface CreateIssueReportRequest {
  reporterEmail?: string;
  reporterName?: string;
  target: string;
  title: string;
  description: string;
}

export interface IssueReportResponse {
  id: string;
  reporterEmail: string;
  reporterName: string;
  target: string;
  title: string;
  description: string;
  createdAt: string;
  isResolved: boolean;
  resolvedAt?: string | null;
  adminNotes?: string | null;
}

export interface ResolveIssueReportRequest {
  adminNotes?: string;
}

export interface WishGameRequest {
  name: string;
  platform: string;
  description: string;
}

export interface CreateGameRequest {
  name: string;
  platform: string;
  description: string;
  isWishlist?: boolean;
}

export interface NewsItem {
  id: string;
  title: string;
  content: string;
  authorUserId: string;
  createdAtUtc: string;
  isPinned: boolean;
}

export interface CreateNewsRequest {
  title: string;
  content: string;
  authorUserId: string;
  isPinned?: boolean;
}

export interface ProblemDetails {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  instance?: string;
  code?: string;
  traceId?: string;
}

export interface StationUsageStat {
  stationId: string;
  stationName: string;
  stationType: string;
  reservationCount: number;
  totalHours: number;
}

export interface ReservationTypeStat {
  reservationType: string;
  count: number;
}

export interface StatisticsResponse {
  totalReservations: number;
  activeReservations: number;
  cancelledReservations: number;
  totalUsers: number;
  totalGames: number;
  wishlistGamesCount: number;
  stationUsage: StationUsageStat[];
  typeBreakdown: ReservationTypeStat[];
}

export interface SiteSettingsResponse {
  discordWebhookUrl: string;
  openingHoursText: string;
  maxAdvanceBookingMonths: number;
  maxIndividualHours: number;
  maxStudentRoomHours: number;
}

export interface UpdateSiteSettingsRequest {
  discordWebhookUrl?: string;
}
