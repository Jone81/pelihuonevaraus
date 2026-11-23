using Microsoft.Extensions.DependencyInjection;
using Pelihuone.Application.Abstractions.Caching;
using Pelihuone.Infrastructure.Caching;

namespace Pelihuone.Infrastructure.Tests.Caching;

/// <summary>
/// Yksikkötestit <see cref="HybridCacheService"/>-välimuistipalvelulle.
/// </summary>
public sealed class HybridCacheServiceTests
{
    private static readonly string[] StationTags = ["stations"];
    private static readonly string[] GameTags = ["games"];

    private static ServiceProvider CreateServiceProvider()
    {
        ServiceCollection services = new ServiceCollection();
        services.AddHybridCache();
        services.AddSingleton<ICacheService, HybridCacheService>();
        return services.BuildServiceProvider();
    }

    /// <summary>
    /// Varmistaa, että toinen haku samalla avaimella palauttaa välimuistissa olevan arvon kutsumatta tehdasfunktiota uudelleen.
    /// </summary>
    [Fact]
    public async Task GetOrCreateAsync_WhenCalledTwiceWithSameKey_ReturnsCachedValueWithoutInvokingFactoryAgain()
    {
        // Arrange
        using ServiceProvider serviceProvider = CreateServiceProvider();
        ICacheService cacheService = serviceProvider.GetRequiredService<ICacheService>();
        int factoryInvocations = 0;

        // Act
        string firstResult = await cacheService.GetOrCreateAsync(
            "test-key-1",
            _ =>
            {
                factoryInvocations++;
                return ValueTask.FromResult("cached-value");
            },
            TimeSpan.FromMinutes(5));

        string secondResult = await cacheService.GetOrCreateAsync(
            "test-key-1",
            _ =>
            {
                factoryInvocations++;
                return ValueTask.FromResult("new-value");
            },
            TimeSpan.FromMinutes(5));

        // Assert
        Assert.Equal("cached-value", firstResult);
        Assert.Equal("cached-value", secondResult);
        Assert.Equal(1, factoryInvocations);
    }

    /// <summary>
    /// Varmistaa, että <c>RemoveAsync</c> poistaa merkinnän välimuistista, jolloin seuraava haku kutsuu tehdasfunktiota uudelleen.
    /// </summary>
    [Fact]
    public async Task RemoveAsync_WhenKeyExists_ClearsCachedEntry()
    {
        // Arrange
        using ServiceProvider serviceProvider = CreateServiceProvider();
        ICacheService cacheService = serviceProvider.GetRequiredService<ICacheService>();
        int factoryInvocations = 0;

        string initialValue = await cacheService.GetOrCreateAsync(
            "test-key-remove",
            _ =>
            {
                factoryInvocations++;
                return ValueTask.FromResult($"value-{factoryInvocations}");
            });

        // Act
        await cacheService.RemoveAsync("test-key-remove");

        string refreshedValue = await cacheService.GetOrCreateAsync(
            "test-key-remove",
            _ =>
            {
                factoryInvocations++;
                return ValueTask.FromResult($"value-{factoryInvocations}");
            });

        // Assert
        Assert.Equal("value-1", initialValue);
        Assert.Equal("value-2", refreshedValue);
        Assert.Equal(2, factoryInvocations);
    }

    /// <summary>
    /// Varmistaa, että <c>RemoveByTagAsync</c> poistaa kaikki annettuun tunnisteeseen kuuluvat merkinnät mutta säilyttää muut merkinnät.
    /// </summary>
    [Fact]
    public async Task RemoveByTagAsync_WhenTagMatches_ClearsOnlyTaggedEntries()
    {
        // Arrange
        using ServiceProvider serviceProvider = CreateServiceProvider();
        ICacheService cacheService = serviceProvider.GetRequiredService<ICacheService>();
        int stationFirstInvocations = 0;
        int stationSecondInvocations = 0;
        int gameInvocations = 0;

        await cacheService.GetOrCreateAsync(
            "stations:1",
            _ =>
            {
                stationFirstInvocations++;
                return ValueTask.FromResult($"station-1-v{stationFirstInvocations}");
            },
            tags: StationTags);

        await cacheService.GetOrCreateAsync(
            "stations:2",
            _ =>
            {
                stationSecondInvocations++;
                return ValueTask.FromResult($"station-2-v{stationSecondInvocations}");
            },
            tags: StationTags);

        await cacheService.GetOrCreateAsync(
            "games:1",
            _ =>
            {
                gameInvocations++;
                return ValueTask.FromResult($"game-1-v{gameInvocations}");
            },
            tags: GameTags);

        // Act
        await cacheService.RemoveByTagAsync("stations");

        string refreshedStationFirst = await cacheService.GetOrCreateAsync(
            "stations:1",
            _ =>
            {
                stationFirstInvocations++;
                return ValueTask.FromResult($"station-1-v{stationFirstInvocations}");
            },
            tags: StationTags);

        string refreshedStationSecond = await cacheService.GetOrCreateAsync(
            "stations:2",
            _ =>
            {
                stationSecondInvocations++;
                return ValueTask.FromResult($"station-2-v{stationSecondInvocations}");
            },
            tags: StationTags);

        string cachedGame = await cacheService.GetOrCreateAsync(
            "games:1",
            _ =>
            {
                gameInvocations++;
                return ValueTask.FromResult($"game-1-v{gameInvocations}");
            },
            tags: GameTags);

        // Assert
        Assert.Equal("station-1-v2", refreshedStationFirst);
        Assert.Equal("station-2-v2", refreshedStationSecond);
        Assert.Equal("game-1-v1", cachedGame);
        Assert.Equal(2, stationFirstInvocations);
        Assert.Equal(2, stationSecondInvocations);
        Assert.Equal(1, gameInvocations);
    }
}
