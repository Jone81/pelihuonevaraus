namespace Pelihuone.Contracts.Statistics;

public sealed record StationUsageStat(
    Guid StationId,
    string StationName,
    string StationType,
    int ReservationCount,
    double TotalHours);

public sealed record ReservationTypeStat(
    string ReservationType,
    int Count);

public sealed record StatisticsResponse(
    int TotalReservations,
    int ActiveReservations,
    int CancelledReservations,
    int TotalUsers,
    int TotalGames,
    int WishlistGamesCount,
    IReadOnlyList<StationUsageStat> StationUsage,
    IReadOnlyList<ReservationTypeStat> TypeBreakdown);
