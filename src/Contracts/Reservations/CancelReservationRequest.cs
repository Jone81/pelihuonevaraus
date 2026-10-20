namespace Pelihuone.Contracts.Reservations;

public sealed record CancelReservationRequest(
    Guid UserId,
    string? Reason);
