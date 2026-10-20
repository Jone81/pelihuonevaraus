using Pelihuone.Domain.Models;
using Pelihuone.Domain.ValueObjects;

namespace Pelihuone.Application.Abstractions.Repositories;

public interface IReservationRepository
{
    Task<Reservation?> GetByIdAsync(ReservationId id, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<Reservation>> GetActiveReservationsInWindowAsync(TimeWindow window, CancellationToken cancellationToken = default);

    Task<bool> HasConflictForStationAsync(
        GamingStationId stationId,
        TimeWindow window,
        ReservationId? excludeReservationId = null,
        CancellationToken cancellationToken = default);

    Task<bool> HasSharedTvConflictAsync(
        TimeWindow window,
        ReservationId? excludeReservationId = null,
        CancellationToken cancellationToken = default);

    Task<bool> HasRoomOrEventConflictAsync(
        TimeWindow window,
        ReservationId? excludeReservationId = null,
        CancellationToken cancellationToken = default);

    Task AddAsync(Reservation reservation, CancellationToken cancellationToken = default);

    Task UpdateAsync(Reservation reservation, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<Reservation>> GetAllAsync(CancellationToken cancellationToken = default);

    Task<IReadOnlyList<Reservation>> GetActiveReservationsForUserAsync(
        UserId userId,
        CancellationToken cancellationToken = default);
}
