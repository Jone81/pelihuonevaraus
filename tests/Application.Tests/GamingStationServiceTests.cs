using NSubstitute;
using Pelihuone.Application.Abstractions.Repositories;
using Pelihuone.Application.Common;
using Pelihuone.Application.GamingStations;
using Pelihuone.Contracts.GamingStations;
using Pelihuone.Domain.Enums;
using Pelihuone.Domain.Models;
using Pelihuone.Domain.ValueObjects;

namespace Pelihuone.Application.Tests;

/// <summary>
/// Yksikkötestit <see cref="GamingStationService"/>-palveluluokalle ja pelipisteiden reaaliaikaiselle saatavuuslaskennalle.
/// </summary>
public class GamingStationServiceTests
{
    private readonly IGamingStationRepository _stationRepository = Substitute.For<IGamingStationRepository>();
    private readonly IReservationRepository _reservationRepository = Substitute.For<IReservationRepository>();
    private readonly GamingStationService _service;

    /// <summary>
    /// Alustaa uuden <see cref="GamingStationServiceTests"/>-testiluokan ja luo testattavan palvelun mock-riippuvuuksilla.
    /// </summary>
    public GamingStationServiceTests()
    {
        // Alustetaan palvelu korvatuilla repositorioilla
        _service = new GamingStationService(_stationRepository, _reservationRepository);
    }

    /// <summary>
    /// Varmistaa, että kun PlayStation 5 on varattuna, sekä PS5 että saman TV:n jakava Nintendo Switch suodatetaan pois vapaiden laitteiden listalta.
    /// </summary>
    [Fact]
    public async Task GetAvailableStationsAsync_WhenPS5IsReserved_BothPS5AndSwitchAreExcluded()
    {
        // Arrange (Reaaliaikainen laskenta + Sääntö 6 SharedTV)
        GamingStation pcStation = GamingStation.Create(GamingStationId.New(), "PC 1", GamingStationType.PC);
        GamingStation ps5Station = GamingStation.Create(GamingStationId.New(), "PlayStation 5", GamingStationType.PlayStation5);
        GamingStation switchStation = GamingStation.Create(GamingStationId.New(), "Nintendo Switch", GamingStationType.NintendoSwitch);

        _stationRepository.GetAllActiveAsync(Arg.Any<CancellationToken>())
            .Returns([pcStation, ps5Station, switchStation]);

        DateTimeOffset baseTime = new DateTimeOffset(2026, 11, 1, 8, 0, 0, TimeSpan.FromHours(2));
        TimeWindow queryWindow = TimeWindow.Create(baseTime.AddHours(2), baseTime.AddHours(4), ReservationType.Individual, baseTime);

        // Vain PS5 on varattu tietokannassa
        Reservation ps5Reservation = Reservation.CreateIndividual(
            ReservationId.New(),
            UserId.New(),
            ps5Station.Id,
            queryWindow,
            baseTime);

        _reservationRepository.GetActiveReservationsInWindowAsync(Arg.Any<TimeWindow>(), Arg.Any<CancellationToken>())
            .Returns([ps5Reservation]);

        // Act: Haetaan vapaat pelipisteet kyseiselle aikaikkunalle
        Result<IReadOnlyList<GamingStationResponse>> result = await _service.GetAvailableStationsAsync(queryWindow.StartUtc, queryWindow.EndUtc);

        // Assert: Sekä PS5 että Switch ovat poissa, joten vain PC 1 on vapaana
        Assert.True(result.IsSuccess);
        Assert.Single(result.Value); // Vain PC 1 on vapaana!
        Assert.Equal(pcStation.Id.Value, result.Value[0].Id);
    }

    /// <summary>
    /// Varmistaa, että kun koko pelihuoneelle on voimassa oleva tilavaraus, yksikään yksittäinen pelipiste ei ole vapaana.
    /// </summary>
    [Fact]
    public async Task GetAvailableStationsAsync_WhenRoomReservationActive_ReturnsEmptyList()
    {
        // Arrange (Sääntö 4: Tilavarauksen aikana mikään piste ei ole vapaana)
        GamingStation pcStation = GamingStation.Create(GamingStationId.New(), "PC 1", GamingStationType.PC);
        _stationRepository.GetAllActiveAsync(Arg.Any<CancellationToken>())
            .Returns([pcStation]);

        DateTimeOffset baseTime = new DateTimeOffset(2026, 11, 1, 8, 0, 0, TimeSpan.FromHours(2));
        TimeWindow queryWindow = TimeWindow.Create(baseTime.AddHours(2), baseTime.AddHours(4), ReservationType.Individual, baseTime);

        // Luodaan koko huoneen kattava tilavaraus
        Reservation roomReservation = Reservation.CreateRoom(
            ReservationId.New(),
            UserId.New(),
            queryWindow,
            baseTime);

        _reservationRepository.GetActiveReservationsInWindowAsync(Arg.Any<TimeWindow>(), Arg.Any<CancellationToken>())
            .Returns([roomReservation]);

        // Act: Tarkistetaan vapaat pelipisteet tilavarauksen ajalta
        Result<IReadOnlyList<GamingStationResponse>> result = await _service.GetAvailableStationsAsync(queryWindow.StartUtc, queryWindow.EndUtc);

        // Assert: Vapaiden pelipisteiden listan tulee olla tyhjä
        Assert.True(result.IsSuccess);
        Assert.Empty(result.Value);
    }
}
