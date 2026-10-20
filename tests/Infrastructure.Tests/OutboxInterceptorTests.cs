using Microsoft.EntityFrameworkCore;
using Pelihuone.Domain.Enums;
using Pelihuone.Domain.Models;
using Pelihuone.Domain.ValueObjects;
using Pelihuone.Infrastructure.Outbox;
using Pelihuone.Infrastructure.Persistence;

namespace Pelihuone.Infrastructure.Tests;

public class OutboxInterceptorTests
{
    private static ApplicationDbContext CreateDbContext()
    {
        var interceptor = new OutboxInterceptor();

        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .AddInterceptors(interceptor)
            .Options;

        return new ApplicationDbContext(options);
    }

    [Fact]
    public async Task SaveChangesAsync_WhenEntityHasDomainEvents_InsertsOutboxMessagesAndClearsEntityEvents()
    {
        // Arrange
        using var context = CreateDbContext();

        var userId = UserId.New();
        var stationId = GamingStationId.New();
        var reservationId = ReservationId.New();

        var fixedNow = new DateTimeOffset(2026, 11, 1, 8, 0, 0, TimeSpan.FromHours(2));
        var timeWindow = TimeWindow.Create(
            fixedNow.AddHours(1),
            fixedNow.AddHours(3),
            ReservationType.Individual,
            fixedNow);

        var reservation = Reservation.CreateIndividual(
            reservationId,
            userId,
            stationId,
            timeWindow,
            fixedNow);

        Assert.NotEmpty(reservation.DomainEvents);

        await context.Reservations.AddAsync(reservation);

        // Act
        await context.SaveChangesAsync();

        // Assert
        Assert.Empty(reservation.DomainEvents);

        var outboxMessage = await context.OutboxMessages.FirstOrDefaultAsync();
        Assert.NotNull(outboxMessage);
        Assert.Equal("ReservationCreatedDomainEvent", outboxMessage.Type);
        Assert.Contains(reservationId.ToString(), outboxMessage.Content);
        Assert.Null(outboxMessage.ProcessedOnUtc);
    }
}
