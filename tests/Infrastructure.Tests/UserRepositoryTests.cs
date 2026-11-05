using Microsoft.EntityFrameworkCore;
using Pelihuone.Domain.Enums;
using Pelihuone.Domain.Models;
using Pelihuone.Domain.ValueObjects;
using Pelihuone.Infrastructure.Outbox;
using Pelihuone.Infrastructure.Persistence;
using Pelihuone.Infrastructure.Repositories;

namespace Pelihuone.Infrastructure.Tests;

/// <summary>
/// Yksikkö- ja integraatiotestit <see cref="UserRepository"/>-tietovarastoluokalle.
/// </summary>
public class UserRepositoryTests
{
    // Luo eristetyn muistinsisäisen tietokantakontekstin kutakin testiä varten
    private static ApplicationDbContext CreateDbContext()
    {
        DbContextOptions<ApplicationDbContext> options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .AddInterceptors(new OutboxInterceptor())
            .Options;

        return new ApplicationDbContext(options);
    }

    /// <summary>
    /// Varmistaa, että käyttäjän lisääminen ja hakeminen oppilaitossähköpostilla toimii odotetusti.
    /// </summary>
    [Fact]
    public async Task AddAndGetByEmailAsync_FindsUserCorrectly()
    {
        // Arrange: Luodaan ja tallennetaan uusi käyttäjä tietokantaan
        using ApplicationDbContext context = CreateDbContext();
        UserRepository repository = new UserRepository(context);

        UserId userId = UserId.New();
        SchoolEmail email = SchoolEmail.Create("opiskelija@edu.xamk.fi");
        DateTimeOffset now = DateTimeOffset.UtcNow;

        User user = User.Create(userId, email, "Matti Meikäläinen", UserRole.User, now);

        await repository.AddAsync(user);
        await context.SaveChangesAsync();

        // Act: Haetaan tallennettu käyttäjä sähköpostiosoitteen perusteella
        User? result = await repository.GetByEmailAsync(email);

        // Assert: Varmistetaan, että käyttäjä löytyi ja tiedot täsmäävät
        Assert.NotNull(result);
        Assert.Equal(userId, result.Id);
        Assert.Equal("Matti Meikäläinen", result.DisplayName);
    }
}
