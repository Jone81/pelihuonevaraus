using Microsoft.EntityFrameworkCore;
using Pelihuone.Domain.Enums;
using Pelihuone.Domain.Models;
using Pelihuone.Domain.ValueObjects;
using Pelihuone.Infrastructure.Outbox;
using Pelihuone.Infrastructure.Persistence;
using Pelihuone.Infrastructure.Repositories;

namespace Pelihuone.Infrastructure.Tests;

public class ReservationRepositoryTests
{
    private static ApplicationDbContext CreateDbContext()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .AddInterceptors(new OutboxInterceptor())
            .Options;

        return new ApplicationDbContext(options);
    }

    [Fact]
    public async Task HasConflictForStationAsync_WhenOverlappingActiveReservationExists_ReturnsTrue()
    {
        // Arrange
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

        var overlappingWindow = TimeWindow.Create(
            baseTime.AddHours(3), // 11:00
            baseTime.AddHours(5), // 13:00
            ReservationType.Individual,
            baseTime);

        // Act
        bool hasConflict = await repository.HasConflictForStationAsync(stationId, overlappingWindow);

        // Assert
        Assert.True(hasConflict);
    }

    [Fact]
    public async Task HasSharedTvConflictAsync_WhenPS5IsBooked_SwitchCannotBeBookedAtSameTime()
    {
        // Arrange (Sääntö 6)
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

        // Act
        bool hasConflict = await repository.HasSharedTvConflictAsync(switchRequestWindow);

        // Assert
        Assert.True(hasConflict);
    }

    [Fact]
    public async Task HasConflictForStationAsync_WhenRoomReservationExists_PreventsIndividualBooking()
    {
        // Arrange (Sääntö 4)
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

        // Act
        bool hasConflict = await repository.HasConflictForStationAsync(pcStationId, pcRequestWindow);

        // Assert
        Assert.True(hasConflict);
    }

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

        reservation.Cancel(baseTime.AddHours(1), userId, UserRole.User);

        await repository.AddAsync(reservation);
        await context.SaveChangesAsync();

        // Act
        bool hasConflict = await repository.HasConflictForStationAsync(stationId, window);

        // Assert
        Assert.False(hasConflict);
    }
}
