using Pelihuone.Application.Abstractions.Repositories;
using Pelihuone.Application.Common;
using Pelihuone.Contracts.GamingStations;
using Pelihuone.Domain.Enums;
using Pelihuone.Domain.ValueObjects;

namespace Pelihuone.Application.GamingStations;

public sealed class GamingStationService : IGamingStationService
{
    private readonly IGamingStationRepository _stationRepository;
    private readonly IReservationRepository _reservationRepository;

    public GamingStationService(
        IGamingStationRepository stationRepository,
        IReservationRepository reservationRepository)
    {
        _stationRepository = stationRepository;
        _reservationRepository = reservationRepository;
    }

    public async Task<Result<IReadOnlyList<GamingStationResponse>>> GetAllStationsAsync(
        CancellationToken cancellationToken = default)
    {
        var stations = await _stationRepository.GetAllActiveAsync(cancellationToken);

        var responses = stations.Select(s => new GamingStationResponse(
            s.Id.Value,
            s.Name,
            s.Type.ToString(),
            s.UsesSharedTv,
            s.IsActive)).ToList();

        return Result.Success<IReadOnlyList<GamingStationResponse>>(responses);
    }

    public async Task<Result<IReadOnlyList<GamingStationResponse>>> GetAvailableStationsAsync(
        DateTimeOffset startUtc,
        DateTimeOffset endUtc,
        CancellationToken cancellationToken = default)
    {
        if (startUtc >= endUtc)
        {
            return Result.Failure<IReadOnlyList<GamingStationResponse>>(
                Error.Validation("TimeWindow.Invalid", "Alkuajan on oltava ennen loppuaikaa."));
        }

        var window = TimeWindow.FromExact(startUtc, endUtc);
        var stations = await _stationRepository.GetAllActiveAsync(cancellationToken);
        var activeReservations = await _reservationRepository.GetActiveReservationsInWindowAsync(window, cancellationToken);

        // Jos tilassa on tilavaraus tai tapahtuma, yksikään piste ei ole vapaana
        bool roomIsFullyBooked = activeReservations.Any(r => r.Type is ReservationType.Room or ReservationType.Event);
        if (roomIsFullyBooked)
        {
            return Result.Success<IReadOnlyList<GamingStationResponse>>([]);
        }

        var reservedStationIds = activeReservations
            .Where(r => r.GamingStationId.HasValue)
            .Select(r => r.GamingStationId!.Value)
            .ToHashSet();

        // Sääntö 6: SharedTV - jos toinen konsoli (PS5/Switch) on varattu, kumpikaan ei ole vapaana
        bool isSharedTvInUse = stations
            .Where(s => s.UsesSharedTv && reservedStationIds.Contains(s.Id))
            .Any();

        var availableStations = stations
            .Where(s => !reservedStationIds.Contains(s.Id))
            .Where(s => !s.UsesSharedTv || !isSharedTvInUse)
            .Select(s => new GamingStationResponse(
                s.Id.Value,
                s.Name,
                s.Type.ToString(),
                s.UsesSharedTv,
                s.IsActive))
            .ToList();

        return Result.Success<IReadOnlyList<GamingStationResponse>>(availableStations);
    }
}
