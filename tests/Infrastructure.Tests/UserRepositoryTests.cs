using Microsoft.EntityFrameworkCore;
using Pelihuone.Domain.Enums;
using Pelihuone.Domain.Models;
using Pelihuone.Domain.ValueObjects;
using Pelihuone.Infrastructure.Outbox;
using Pelihuone.Infrastructure.Persistence;
using Pelihuone.Infrastructure.Repositories;

namespace Pelihuone.Infrastructure.Tests;

public class UserRepositoryTests
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
    public async Task AddAndGetByEmailAsync_FindsUserCorrectly()
    {
        // Arrange
        using var context = CreateDbContext();
        var repository = new UserRepository(context);

        var userId = UserId.New();
        var email = SchoolEmail.Create("opiskelija@edu.xamk.fi");
        var now = DateTimeOffset.UtcNow;

        var user = User.Create(userId, email, "Matti Meikäläinen", UserRole.User, now);

        await repository.AddAsync(user);
        await context.SaveChangesAsync();

        // Act
        var result = await repository.GetByEmailAsync(email);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(userId, result.Id);
        Assert.Equal("Matti Meikäläinen", result.DisplayName);
    }
}
