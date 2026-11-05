using Microsoft.EntityFrameworkCore;
using Pelihuone.Domain.Enums;
using Pelihuone.Domain.Models;
using Pelihuone.Domain.ValueObjects;
using Pelihuone.Infrastructure.Outbox;
using Pelihuone.Infrastructure.Persistence;
using Pelihuone.Infrastructure.Repositories;

namespace Pelihuone.Infrastructure.Tests;

/// <summary>
/// Yksikkö- ja integraatiotestit <see cref="ReservationRepository"/>-tietovarastoluokalle ja varauskonfliktikyselyille.
/// </summary>
public class ReservationRepositoryTests
{
    // Luo eristetyn muistinsisäisen tietokantakontekstin kutakin testiä varten
    private static ApplicationDbContext CreateDbContext()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .AddInterceptors(new OutboxInterceptor())
            .Options;

        return new ApplicationDbContext(options);
    }

    /// <summary>
    /// Varmistaa, että <see cref="ReservationRepository.HasConflictForStationAsync"/> tunnistaa päällekkäisen aktiivisen varauksen samalle pelipisteelle.
    /// </summary>
    [Fact]
    public async Task HasConflictForStationAsync_WhenOverlappingActiveReservationExists_ReturnsTrue()
    {
        // Arrange: Tallennetaan kantaan varaus klo 10:00 - 12:00
        using var context = CreateDbContext();
        var repository = new ReservationRepository(context);

        var userId = UserId.New();
        var stationId = GamingStationId.New();
        var baseTime = new DateTimeOffset(2026, 11, 1, 8, 0, 0, TimeSpan.FromHours(2));

        var existingWindow = TimeWindow.Create(
            baseTime.AddHours(2), // 10:00
            baseTime.AddHours(4), // 12:00
            ReservationType.Individual,
            baseTime);

        var existingReservation = Reservation.CreateIndividual(
            ReservationId.New(),
            userId,
            stationId,
            existingWindow,
            baseTime);

        await repository.AddAsync(existingReservation);
        await context.SaveChangesAsync();

        // Luodaan päällekkäinen aikaikkuna klo 11:00 - 13:00
        var overlappingWindow = TimeWindow.Create(
            baseTime.AddHours(3), // 11:00
            baseTime.AddHours(5), // 13:00
            ReservationType.Individual,
            baseTime);

        // Act: Tarkistetaan, onko pelipisteellä konfliktia
        bool hasConflict = await repository.HasConflictForStationAsync(stationId, overlappingWindow);

        // Assert: Konfliktin tulee löytyä
        Assert.True(hasConflict);
    }

    /// <summary>
    /// Varmistaa, että PlayStation 5:n voimassa oleva varaus aiheuttaa jaetun TV:n konfliktin Nintendo Switchin varausyritykselle samalla aikavälillä (Sääntö 6).
    /// </summary>
    [Fact]
    public async Task HasSharedTvConflictAsync_WhenPS5IsBooked_SwitchCannotBeBookedAtSameTime()
    {
        // Arrange (Sääntö 6): Lisätään PS5 ja Switch sekä varataan PS5 klo 10:00 - 12:00
        using var context = CreateDbContext();
        var repository = new ReservationRepository(context);

        var ps5Station = GamingStation.Create(GamingStationId.New(), "PlayStation 5", GamingStationType.PlayStation5);
        var switchStation = GamingStation.Create(GamingStationId.New(), "Nintendo Switch", GamingStationType.NintendoSwitch);

        await context.GamingStations.AddRangeAsync(ps5Station, switchStation);

        var userId = UserId.New();
        var baseTime = new DateTimeOffset(2026, 11, 1, 8, 0, 0, TimeSpan.FromHours(2));

        var ps5Window = TimeWindow.Create(
            baseTime.AddHours(2), // 10:00
            baseTime.AddHours(4), // 12:00
            ReservationType.Individual,
            baseTime);

        var ps5Reservation = Reservation.CreateIndividual(
            ReservationId.New(),
            userId,
            ps5Station.Id,
            ps5Window,
            baseTime);

        await repository.AddAsync(ps5Reservation);
        await context.SaveChangesAsync();

        var switchRequestWindow = TimeWindow.Create(
            baseTime.AddHours(3), // 11:00
            baseTime.AddHours(5), // 13:00
            ReservationType.Individual,
            baseTime);

        // Act: Tarkistetaan jaetun TV:n konflikti päällekkäiselle ajalle
        bool hasConflict = await repository.HasSharedTvConflictAsync(switchRequestWindow);

        // Assert: Jaetun TV:n konfliktin tulee olla tosi
        Assert.True(hasConflict);
    }

    /// <summary>
    /// Varmistaa, että koko tilan kattava huonevaraus estää yksittäisen pelipisteen varaamisen samanaikaisesti (Sääntö 4).
    /// </summary>
    [Fact]
    public async Task HasConflictForStationAsync_WhenRoomReservationExists_PreventsIndividualBooking()
    {
        // Arrange (Sääntö 4): Luodaan koko pelihuoneen tilavaraus klo 09:00 - 15:00
        using var context = CreateDbContext();
        var repository = new ReservationRepository(context);

        var pcStationId = GamingStationId.New();
        var userId = UserId.New();
        var baseTime = new DateTimeOffset(2026, 11, 1, 8, 0, 0, TimeSpan.FromHours(2));

        var roomWindow = TimeWindow.Create(
            baseTime.AddHours(1), // 09:00
            baseTime.AddHours(7), // 15:00
            ReservationType.Room,
            baseTime);

        var roomReservation = Reservation.CreateRoom(
            ReservationId.New(),
            userId,
            roomWindow,
            baseTime);

        await repository.AddAsync(roomReservation);
        await context.SaveChangesAsync();

        var pcRequestWindow = TimeWindow.Create(
            baseTime.AddHours(2), // 10:00
            baseTime.AddHours(4), // 12:00
            ReservationType.Individual,
            baseTime);

        // Act: Tarkistetaan yksittäisen PC-pisteen konflikti tilavarauksen aikana
        bool hasConflict = await repository.HasConflictForStationAsync(pcStationId, pcRequestWindow);

        // Assert: Tilavarauksen tulee estää yksittäisen pelipisteen varaus
        Assert.True(hasConflict);
    }

    /// <summary>
    /// Varmistaa, että peruutettu varaus ei aiheuta konfliktia uudelle varaukselle samalle aikavälille (Sääntö 5).
    /// </summary>
    [Fact]
    public async Task HasConflictForStationAsync_WhenReservationIsCancelled_DoesNotCauseConflict()
    {
        // Arrange (Sääntö 5: peruttu varaus ei estä uutta varausta)
        using var context = CreateDbContext();
        var repository = new ReservationRepository(context);

        var stationId = GamingStationId.New();
        var userId = UserId.New();
        var baseTime = new DateTimeOffset(2026, 11, 1, 8, 0, 0, TimeSpan.FromHours(2));

        var window = TimeWindow.Create(
            baseTime.AddHours(2), // 10:00
            baseTime.AddHours(4), // 12:00
            ReservationType.Individual,
            baseTime);

        var reservation = Reservation.CreateIndividual(
            ReservationId.New(),
            userId,
            stationId,
            window,
            baseTime);

        // Peruutetaan varaus ennen sen alkamista
        reservation.Cancel(baseTime.AddHours(1), userId, UserRole.User);

        await repository.AddAsync(reservation);
        await context.SaveChangesAsync();

        // Act: Tarkistetaan konflikti samalle aikaikkunalle
        bool hasConflict = await repository.HasConflictForStationAsync(stationId, window);

        // Assert: Peruutetun varauksen ei tule aiheuttaa konfliktia
        Assert.False(hasConflict);
    }
}
