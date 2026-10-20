namespace Pelihuone.Contracts.Reservations;

public sealed record ReservationResponse(
    Guid Id,
    Guid UserId,
    string ReservationType,
    Guid? GamingStationId,
    DateTimeOffset StartUtc,
    DateTimeOffset EndUtc,
    double DurationMinutes,
    string Status,
    DateTimeOffset CreatedAtUtc,
    string? CancellationReason,
    string? BookerName = null,
    string? BookerEmail = null);
