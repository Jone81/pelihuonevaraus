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
        OutboxInterceptor interceptor = new OutboxInterceptor();

        DbContextOptions<ApplicationDbContext> options = new DbContextOptionsBuilder<ApplicationDbContext>()
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
        using ApplicationDbContext context = CreateDbContext();

        UserId userId = UserId.New();
        GamingStationId stationId = GamingStationId.New();
        ReservationId reservationId = ReservationId.New();

        DateTimeOffset fixedNow = new DateTimeOffset(2026, 11, 2, 8, 0, 0, TimeSpan.FromHours(2));
        TimeWindow timeWindow = TimeWindow.Create(
            fixedNow.AddHours(1),
            fixedNow.AddHours(3),
            ReservationType.Individual,
            fixedNow);

        Reservation reservation = Reservation.CreateIndividual(
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

        OutboxMessage? outboxMessage = await context.OutboxMessages.FirstOrDefaultAsync();
        Assert.NotNull(outboxMessage);
        Assert.Equal("ReservationCreatedDomainEvent", outboxMessage.Type);
        Assert.Contains(reservationId.ToString(), outboxMessage.Content);
        Assert.Null(outboxMessage.ProcessedOnUtc);
    }
}
