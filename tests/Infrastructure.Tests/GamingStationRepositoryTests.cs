using Microsoft.EntityFrameworkCore;
using Pelihuone.Domain.Enums;
using Pelihuone.Domain.Models;
using Pelihuone.Domain.ValueObjects;
using Pelihuone.Infrastructure.Outbox;
using Pelihuone.Infrastructure.Persistence;
using Pelihuone.Infrastructure.Repositories;

namespace Pelihuone.Infrastructure.Tests;

/// <summary>
/// Yksikkö- ja integraatiotestit <see cref="GamingStationRepository"/>-tietovarastoluokalle EF Core InMemory -tietokantaa käyttäen.
/// </summary>
public class GamingStationRepositoryTests
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
    /// Varmistaa, että <see cref="GamingStationRepository.GetAllActiveAsync"/> palauttaa vain aktiiviset pelipisteet aakkosjärjestyksessä nimen mukaan.
    /// </summary>
    [Fact]
    public async Task GetAllActiveAsync_ReturnsOnlyActiveStationsOrderedByName()
    {
        // Arrange: Lisätään kantaan kaksi aktiivista ja yksi epäaktiivinen pelipiste
        using var context = CreateDbContext();
        var repository = new GamingStationRepository(context);

        var activeStationB = GamingStation.Create(GamingStationId.New(), "Station B", GamingStationType.PC, isActive: true);
        var activeStationA = GamingStation.Create(GamingStationId.New(), "Station A", GamingStationType.PC, isActive: true);
        var inactiveStation = GamingStation.Create(GamingStationId.New(), "Station C", GamingStationType.PC, isActive: false);

        await repository.AddAsync(activeStationB);
        await repository.AddAsync(activeStationA);
        await repository.AddAsync(inactiveStation);
        await context.SaveChangesAsync();

        // Act: Haetaan kaikki aktiiviset pelipisteet
        var result = await repository.GetAllActiveAsync();

        // Assert: Vain aktiiviset pisteet palautetaan ja ne ovat nimen mukaisessa järjestyksessä
        Assert.Equal(2, result.Count);
        Assert.Equal("Station A", result[0].Name);
        Assert.Equal("Station B", result[1].Name);
    }
}
