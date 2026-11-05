using Microsoft.EntityFrameworkCore;
using Pelihuone.Domain.Enums;
using Pelihuone.Domain.Models;
using Pelihuone.Domain.ValueObjects;
using Pelihuone.Infrastructure.Outbox;
using Pelihuone.Infrastructure.Persistence;

namespace Pelihuone.Infrastructure.Tests;

/// <summary>
/// Yksikkötestit <see cref="OutboxInterceptor"/>-siepparille, joka muuntaa entiteettien toimialuetapahtumat Outbox-viesteiksi tallennuksen yhteydessä.
/// </summary>
public class OutboxInterceptorTests
{
    // Luo uuden muistinsisäisen tietokantakontekstin, johon on kytketty OutboxInterceptor
    private static ApplicationDbContext CreateDbContext()
    {
        var interceptor = new OutboxInterceptor();

        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .AddInterceptors(interceptor)
            .Options;

        return new ApplicationDbContext(options);
    }

    /// <summary>
    /// Varmistaa, että <c>SaveChangesAsync</c> tallentaa entiteetin toimialuetapahtumat <c>OutboxMessages</c>-tauluun ja tyhjentää entiteetin tapahtumalistan.
    /// </summary>
    [Fact]
    public async Task SaveChangesAsync_WhenEntityHasDomainEvents_InsertsOutboxMessagesAndClearsEntityEvents()
    {
        // Arrange: Luodaan uusi varaus, joka nostaa ReservationCreatedDomainEvent-toimialuetapahtuman
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

        // Act: Tallennetaan muutokset tietokantaan, jolloin OutboxInterceptor aktivoituu
        await context.SaveChangesAsync();

        // Assert: Entiteetin tapahtumalista on tyhjennetty ja Outbox-viesti löytyy tietokannasta
        Assert.Empty(reservation.DomainEvents);

        var outboxMessage = await context.OutboxMessages.FirstOrDefaultAsync();
        Assert.NotNull(outboxMessage);
        Assert.Equal("ReservationCreatedDomainEvent", outboxMessage.Type);
        Assert.Contains(reservationId.ToString(), outboxMessage.Content);
        Assert.Null(outboxMessage.ProcessedOnUtc);
    }
}
