using Pelihuone.Application.Abstractions.Repositories;
using Pelihuone.Application.Common;
using Pelihuone.Contracts.GamingStations;
using Pelihuone.Domain.Enums;
using Pelihuone.Domain.ValueObjects;

namespace Pelihuone.Application.GamingStations;

/// <summary>
/// Toteuttaa pelipisteiden listauksen ja saatavuuslaskennan liiketoimintalogiikan.
/// </summary>
public sealed class GamingStationService : IGamingStationService
{
    private readonly IGamingStationRepository _stationRepository;
    private readonly IReservationRepository _reservationRepository;

    /// <summary>
    /// Alustaa uuden <see cref="GamingStationService"/>-instanssin.
    /// </summary>
    public GamingStationService(
        IGamingStationRepository stationRepository,
        IReservationRepository reservationRepository)
    {
        _stationRepository = stationRepository;
        _reservationRepository = reservationRepository;
    }

    /// <summary>
    /// Hakee kaikki käytössä olevat pelipisteet.
    /// </summary>
    public async Task<Result<IReadOnlyList<GamingStationResponse>>> GetAllStationsAsync(
        CancellationToken cancellationToken = default)
    {
        // Haetaan aktiiviset pelipisteet ja muunnetaan ne vastausmalleiksi
        var stations = await _stationRepository.GetAllActiveAsync(cancellationToken);

        var responses = stations.Select(s => new GamingStationResponse(
            s.Id.Value,
            s.Name,
            s.Type.ToString(),
            s.UsesSharedTv,
            s.IsActive)).ToList();

        return Result.Success<IReadOnlyList<GamingStationResponse>>(responses);
    }

    /// <summary>
    /// Hakee vapaat pelipisteet annetulle aikavälille huomioiden koko tilan varaukset ja SharedTV-säännöt.
    /// </summary>
    public async Task<Result<IReadOnlyList<GamingStationResponse>>> GetAvailableStationsAsync(
        DateTimeOffset startUtc,
        DateTimeOffset endUtc,
        CancellationToken cancellationToken = default)
    {
        // Validoidaan, että aikaväli on looginen
        if (startUtc >= endUtc)
        {
            return Result.Failure<IReadOnlyList<GamingStationResponse>>(
                Error.Validation("TimeWindow.Invalid", "Alkuajan on oltava ennen loppuaikaa."));
        }

        // Haetaan tarkasteltavan aikaikkunan aktiiviset pelipisteet ja päällekkäiset varaukset
        var window = TimeWindow.FromExact(startUtc, endUtc);
        var stations = await _stationRepository.GetAllActiveAsync(cancellationToken);
        var activeReservations = await _reservationRepository.GetActiveReservationsInWindowAsync(window, cancellationToken);

        // Jos tilassa on tilavaraus tai tapahtuma, yksikään piste ei ole vapaana
        bool roomIsFullyBooked = activeReservations.Any(r => r.Type is ReservationType.Room or ReservationType.Event);
        if (roomIsFullyBooked)
        {
            return Result.Success<IReadOnlyList<GamingStationResponse>>([]);
        }

        // Kerätään suoraan varattujen pelipisteiden tunnisteet
        var reservedStationIds = activeReservations
            .Where(r => r.GamingStationId.HasValue)
            .Select(r => r.GamingStationId!.Value)
            .ToHashSet();

        // Sääntö 6: SharedTV - jos toinen konsoli (PS5/Switch) on varattu, kumpikaan ei ole vapaana
        bool isSharedTvInUse = stations
            .Where(s => s.UsesSharedTv && reservedStationIds.Contains(s.Id))
            .Any();

        // Suodatetaan jäljelle vain ne pelipisteet, joita ei ole varattu ja joiden näyttölaite on vapaana
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
