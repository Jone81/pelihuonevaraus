namespace Pelihuone.Contracts.Reservations;

public sealed record CreateReservationRequest(
    string IdempotencyKey,
    Guid UserId,
    int ReservationType,
    Guid? GamingStationId,
    DateTimeOffset StartUtc,
    DateTimeOffset EndUtc);
