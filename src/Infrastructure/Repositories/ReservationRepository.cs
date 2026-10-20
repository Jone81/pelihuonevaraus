using Microsoft.EntityFrameworkCore;
using Pelihuone.Application.Abstractions.Repositories;
using Pelihuone.Domain.Enums;
using Pelihuone.Domain.Models;
using Pelihuone.Domain.ValueObjects;
using Pelihuone.Infrastructure.Persistence;

namespace Pelihuone.Infrastructure.Repositories;

public sealed class ReservationRepository : IReservationRepository
{
    private readonly ApplicationDbContext _context;

    public ReservationRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Reservation?> GetByIdAsync(ReservationId id, CancellationToken cancellationToken = default)
    {
        var reservation = await _context.Reservations
            .FirstOrDefaultAsync(r => r.Id == id, cancellationToken);

        reservation?.ClearDomainEvents();
        return reservation;
    }

    public async Task<IReadOnlyList<Reservation>> GetActiveReservationsInWindowAsync(
        TimeWindow window,
        CancellationToken cancellationToken = default)
    {
        return await _context.Reservations
            .AsNoTracking()
            .Where(r =>
                r.Status == ReservationStatus.Active &&
                r.TimeWindow.StartUtc < window.EndUtc &&
                r.TimeWindow.EndUtc > window.StartUtc)
            .ToListAsync(cancellationToken);
    }

    public async Task<bool> HasConflictForStationAsync(
        GamingStationId stationId,
        TimeWindow window,
        ReservationId? excludeReservationId = null,
        CancellationToken cancellationToken = default)
    {
        return await _context.Reservations
            .AsNoTracking()
            .AnyAsync(r =>
                r.Status == ReservationStatus.Active &&
                (!excludeReservationId.HasValue || r.Id != excludeReservationId.Value) &&
                r.TimeWindow.StartUtc < window.EndUtc &&
                r.TimeWindow.EndUtc > window.StartUtc &&
                (r.GamingStationId == stationId ||
                 r.Type == ReservationType.Room ||
                 r.Type == ReservationType.Event),
                cancellationToken);
    }

    public async Task<bool> HasSharedTvConflictAsync(
        TimeWindow window,
        ReservationId? excludeReservationId = null,
        CancellationToken cancellationToken = default)
    {
        var sharedTvStationIds = await _context.GamingStations
            .AsNoTracking()
            .Where(s => s.Type == GamingStationType.PlayStation5 || s.Type == GamingStationType.NintendoSwitch)
            .Select(s => s.Id)
            .ToListAsync(cancellationToken);

        return await _context.Reservations
            .AsNoTracking()
            .AnyAsync(r =>
                r.Status == ReservationStatus.Active &&
                (!excludeReservationId.HasValue || r.Id != excludeReservationId.Value) &&
                r.TimeWindow.StartUtc < window.EndUtc &&
                r.TimeWindow.EndUtc > window.StartUtc &&
                (r.Type == ReservationType.Room ||
                 r.Type == ReservationType.Event ||
                 (r.GamingStationId.HasValue && sharedTvStationIds.Contains(r.GamingStationId.Value))),
                cancellationToken);
    }

    public async Task<bool> HasRoomOrEventConflictAsync(
        TimeWindow window,
        ReservationId? excludeReservationId = null,
        CancellationToken cancellationToken = default)
    {
        return await _context.Reservations
            .AsNoTracking()
            .AnyAsync(r =>
                r.Status == ReservationStatus.Active &&
                (!excludeReservationId.HasValue || r.Id != excludeReservationId.Value) &&
                r.TimeWindow.StartUtc < window.EndUtc &&
                r.TimeWindow.EndUtc > window.StartUtc,
                cancellationToken);
    }

    public async Task AddAsync(Reservation reservation, CancellationToken cancellationToken = default)
    {
        await _context.Reservations.AddAsync(reservation, cancellationToken);
    }

    public Task UpdateAsync(Reservation reservation, CancellationToken cancellationToken = default)
    {
        _context.Reservations.Update(reservation);
        return Task.CompletedTask;
    }

    public async Task<IReadOnlyList<Reservation>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await _context.Reservations
            .AsNoTracking()
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<Reservation>> GetActiveReservationsForUserAsync(
        UserId userId,
        CancellationToken cancellationToken = default)
    {
        return await _context.Reservations
            .AsNoTracking()
            .Where(r => r.UserId == userId && r.Status == ReservationStatus.Active)
            .ToListAsync(cancellationToken);
    }
}
