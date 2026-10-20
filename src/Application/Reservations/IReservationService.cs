using Pelihuone.Application.Common;
using Pelihuone.Contracts.Reservations;

namespace Pelihuone.Application.Reservations;

public interface IReservationService
{
    Task<Result<ReservationResponse>> CreateReservationAsync(
        CreateReservationRequest request,
        CancellationToken cancellationToken = default);

    Task<Result<ReservationResponse>> CancelReservationAsync(
        Guid reservationId,
        CancelReservationRequest request,
        CancellationToken cancellationToken = default);

    Task<Result<ReservationResponse>> OverrideAndCreateEventAsync(
        CreateReservationRequest request,
        string overrideReason,
        CancellationToken cancellationToken = default);

    Task<Result<ReservationResponse>> GetByIdAsync(
        Guid reservationId,
        CancellationToken cancellationToken = default);

    Task<Result<IReadOnlyList<ReservationResponse>>> GetActiveReservationsAsync(
        DateTimeOffset startUtc,
        DateTimeOffset endUtc,
        CancellationToken cancellationToken = default);
}
