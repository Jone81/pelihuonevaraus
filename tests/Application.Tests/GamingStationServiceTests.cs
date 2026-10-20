using NSubstitute;
using Pelihuone.Application.Abstractions.Repositories;
using Pelihuone.Application.GamingStations;
using Pelihuone.Domain.Enums;
using Pelihuone.Domain.Models;
using Pelihuone.Domain.ValueObjects;

namespace Pelihuone.Application.Tests;

public class GamingStationServiceTests
{
    private readonly IGamingStationRepository _stationRepository = Substitute.For<IGamingStationRepository>();
    private readonly IReservationRepository _reservationRepository = Substitute.For<IReservationRepository>();
    private readonly GamingStationService _service;

    public GamingStationServiceTests()
    {
        _service = new GamingStationService(_stationRepository, _reservationRepository);
    }

    [Fact]
    public async Task GetAvailableStationsAsync_WhenPS5IsReserved_BothPS5AndSwitchAreExcluded()
    {
        // Arrange (Reaaliaikainen laskenta + Sääntö 6 SharedTV)
        var pcStation = GamingStation.Create(GamingStationId.New(), "PC 1", GamingStationType.PC);
        var ps5Station = GamingStation.Create(GamingStationId.New(), "PlayStation 5", GamingStationType.PlayStation5);
        var switchStation = GamingStation.Create(GamingStationId.New(), "Nintendo Switch", GamingStationType.NintendoSwitch);

        _stationRepository.GetAllActiveAsync(Arg.Any<CancellationToken>())
            .Returns([pcStation, ps5Station, switchStation]);

        var baseTime = new DateTimeOffset(2026, 11, 1, 8, 0, 0, TimeSpan.FromHours(2));
        var queryWindow = TimeWindow.Create(baseTime.AddHours(2), baseTime.AddHours(4), ReservationType.Individual, baseTime);

        // Vain PS5 on varattu tietokannassa
        var ps5Reservation = Reservation.CreateIndividual(
            ReservationId.New(),
            UserId.New(),
            ps5Station.Id,
            queryWindow,
            baseTime);

        _reservationRepository.GetActiveReservationsInWindowAsync(Arg.Any<TimeWindow>(), Arg.Any<CancellationToken>())
            .Returns([ps5Reservation]);

        // Act
        var result = await _service.GetAvailableStationsAsync(queryWindow.StartUtc, queryWindow.EndUtc);

        // Assert
        Assert.True(result.IsSuccess);
        Assert.Single(result.Value); // Vain PC 1 on vapaana!
        Assert.Equal(pcStation.Id.Value, result.Value[0].Id);
    }

    [Fact]
    public async Task GetAvailableStationsAsync_WhenRoomReservationActive_ReturnsEmptyList()
    {
        // Arrange (Sääntö 4: Tilavarauksen aikana mikään piste ei ole vapaana)
        var pcStation = GamingStation.Create(GamingStationId.New(), "PC 1", GamingStationType.PC);
        _stationRepository.GetAllActiveAsync(Arg.Any<CancellationToken>())
            .Returns([pcStation]);

        var baseTime = new DateTimeOffset(2026, 11, 1, 8, 0, 0, TimeSpan.FromHours(2));
        var queryWindow = TimeWindow.Create(baseTime.AddHours(2), baseTime.AddHours(4), ReservationType.Individual, baseTime);

        var roomReservation = Reservation.CreateRoom(
            ReservationId.New(),
            UserId.New(),
            queryWindow,
            baseTime);

        _reservationRepository.GetActiveReservationsInWindowAsync(Arg.Any<TimeWindow>(), Arg.Any<CancellationToken>())
            .Returns([roomReservation]);

        // Act
        var result = await _service.GetAvailableStationsAsync(queryWindow.StartUtc, queryWindow.EndUtc);

        // Assert
        Assert.True(result.IsSuccess);
        Assert.Empty(result.Value);
    }
}
