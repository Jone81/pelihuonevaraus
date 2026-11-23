using System.Text.Json;
using MediatR;
using NSubstitute;
using Pelihuone.Application.Abstractions.Caching;
using Pelihuone.Application.Common;
using Pelihuone.Application.Common.Behaviors;
using Pelihuone.Application.Features.Stations.Queries;
using Pelihuone.Contracts.GamingStations;

namespace Pelihuone.Application.Tests.Behaviors;

/// <summary>
/// Yksikkötestit <see cref="CachingBehavior{TRequest, TResponse}"/>-putkikäyttäytymiselle ja <see cref="Result{TValue}"/>-serialisoinnille.
/// </summary>
public sealed class CachingBehaviorTests
{
    /// <summary>
    /// Välimuistitettava testikysely.
    /// </summary>
    public sealed record TestCacheableQuery() : IRequest<Result<string>>, ICacheableQuery
    {
        private static readonly string[] Tags = [Abstractions.Caching.CacheTags.Stations];

        /// <inheritdoc />
        public string CacheKey => "test:cacheable";

        /// <inheritdoc />
        public TimeSpan? Expiration => TimeSpan.FromMinutes(3);

        /// <inheritdoc />
        public IReadOnlyCollection<string> CacheTags => Tags;
    }

    /// <summary>
    /// Ei-välimuistitettava testikysely.
    /// </summary>
    public sealed record TestNonCacheableQuery() : IRequest<Result<string>>;

    /// <summary>
    /// Varmistaa, että ei-välimuistitettava kysely ohittaa <see cref="ICacheService"/>-palvelun ja kutsuu käsittelijää suoraan.
    /// </summary>
    [Fact]
    public async Task Handle_NonCacheableQuery_BypassesCacheService()
    {
        ICacheService cacheService = Substitute.For<ICacheService>();
        CachingBehavior<TestNonCacheableQuery, Result<string>> behavior = new(cacheService);

        Result<string> result = await behavior.Handle(
            new TestNonCacheableQuery(),
            () => Task.FromResult(Result.Success("live-data")),
            CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.Equal("live-data", result.Value);
        await cacheService.DidNotReceiveWithAnyArgs().GetOrCreateAsync<Result<string>>(
            default!,
            default!,
            default,
            default,
            default);
    }

    /// <summary>
    /// Varmistaa, että välimuistitettava kysely käyttää <see cref="ICacheService.GetOrCreateAsync{T}"/>-metodia
    /// oikealla avaimella, vanhenemisajalla ja tunnisteilla.
    /// </summary>
    [Fact]
    public async Task Handle_CacheableQuery_SuccessResult_UsesCache()
    {
        ICacheService cacheService = Substitute.For<ICacheService>();
        cacheService
            .GetOrCreateAsync(
                Arg.Any<string>(),
                Arg.Any<Func<CancellationToken, ValueTask<Result<string>>>>(),
                Arg.Any<TimeSpan?>(),
                Arg.Any<IReadOnlyCollection<string>?>(),
                Arg.Any<CancellationToken>())
            .Returns(callInfo =>
            {
                Func<CancellationToken, ValueTask<Result<string>>> factory =
                    callInfo.Arg<Func<CancellationToken, ValueTask<Result<string>>>>();
                CancellationToken ct = callInfo.Arg<CancellationToken>();
                return factory(ct).AsTask();
            });

        CachingBehavior<TestCacheableQuery, Result<string>> behavior = new(cacheService);
        TestCacheableQuery query = new();

        Result<string> result = await behavior.Handle(
            query,
            () => Task.FromResult(Result.Success("cached-data")),
            CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.Equal("cached-data", result.Value);
        await cacheService.Received(1).GetOrCreateAsync(
            "test:cacheable",
            Arg.Any<Func<CancellationToken, ValueTask<Result<string>>>>(),
            TimeSpan.FromMinutes(3),
            Arg.Is<IReadOnlyCollection<string>?>(tags => tags != null && tags.Contains(CacheTags.Stations)),
            CancellationToken.None);
    }

    /// <summary>
    /// Varmistaa, että epäonnistunut <see cref="Result{TValue}"/> keskeyttää välimuistitallennuksen ennen serialisointia
    /// ja palauttaa virhetuloksen kutsujalle poikkeusta heittämättä.
    /// </summary>
    [Fact]
    public async Task Handle_CacheableQuery_FailureResult_DoesNotSerializeOrCacheFailure()
    {
        bool storedInCache = false;
        ICacheService cacheService = Substitute.For<ICacheService>();
        cacheService
            .GetOrCreateAsync(
                Arg.Any<string>(),
                Arg.Any<Func<CancellationToken, ValueTask<Result<string>>>>(),
                Arg.Any<TimeSpan?>(),
                Arg.Any<IReadOnlyCollection<string>?>(),
                Arg.Any<CancellationToken>())
            .Returns(async callInfo =>
            {
                Func<CancellationToken, ValueTask<Result<string>>> factory =
                    callInfo.Arg<Func<CancellationToken, ValueTask<Result<string>>>>();
                CancellationToken ct = callInfo.Arg<CancellationToken>();
                Result<string> value = await factory(ct);
                // Simuloidaan HybridCachen JSON-serialisointia tallennuksen yhteydessä
                _ = JsonSerializer.Serialize(value);
                storedInCache = true;
                return value;
            });

        CachingBehavior<TestCacheableQuery, Result<string>> behavior = new(cacheService);
        Error expectedError = Error.NotFound("Test.NotFound", "Tietoa ei löytynyt.");

        Result<string> result = await behavior.Handle(
            new TestCacheableQuery(),
            () => Task.FromResult(Result.Failure<string>(expectedError)),
            CancellationToken.None);

        Assert.False(storedInCache);
        Assert.True(result.IsFailure);
        Assert.Equal("Test.NotFound", result.Error.Code);
    }

    /// <summary>
    /// Varmistaa, että onnistunut <see cref="Result{TValue}"/> pelipistelistalla serialisoituu ja deserialisoituu
    /// oikein <see cref="JsonSerializer"/>-luokalla HybridCache-yhteensopivuutta varten.
    /// </summary>
    [Fact]
    public void Result_SuccessWithStationList_RoundTripsWithSystemTextJson()
    {
        Guid stationId = Guid.NewGuid();
        IReadOnlyList<GamingStationResponse> stations =
        [
            new GamingStationResponse(stationId, "PC 1", "PC", false, true)
        ];
        Result<IReadOnlyList<GamingStationResponse>> original = Result.Success(stations);

        string json = JsonSerializer.Serialize(original);
        Result<IReadOnlyList<GamingStationResponse>>? deserialized =
            JsonSerializer.Deserialize<Result<IReadOnlyList<GamingStationResponse>>>(json);

        Assert.NotNull(deserialized);
        Assert.True(deserialized.IsSuccess);
        Assert.Equal(Error.None, deserialized.Error);
        Assert.Single(deserialized.Value);
        Assert.Equal(stationId, deserialized.Value[0].Id);
        Assert.Equal("PC 1", deserialized.Value[0].Name);
        Assert.True(deserialized.Value[0].IsActive);
    }

    /// <summary>
    /// Varmistaa, että "Vapaana nyt" -kysely (<see cref="GetAvailableStationsQuery"/>) ei koskaan toteuta
    /// <see cref="ICacheableQuery"/>-rajapintaa.
    /// </summary>
    [Fact]
    public void GetAvailableStationsQuery_DoesNotImplementICacheableQuery()
    {
        bool isCacheable = typeof(ICacheableQuery).IsAssignableFrom(typeof(GetAvailableStationsQuery));

        Assert.False(isCacheable);
    }
}
