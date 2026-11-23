using MediatR;
using Pelihuone.Application.Abstractions.Caching;
using Pelihuone.Application.Abstractions.Services;
using Pelihuone.Application.Common;
using Pelihuone.Contracts.GamingStations;

namespace Pelihuone.Application.Features.Stations.Queries;

/// <summary>
/// Kysely kaikkien pelipisteiden (myös huoltotilassa olevien) hakemiseen ylläpitonäkymää varten.
/// </summary>
public sealed record GetAdminStationsQuery()
    : IRequest<Result<IReadOnlyList<GamingStationResponse>>>, ICacheableQuery
{
    private static readonly string[] Tags = [Abstractions.Caching.CacheTags.Stations];

    /// <inheritdoc />
    public string CacheKey => "stations:admin";

    /// <inheritdoc />
    public TimeSpan? Expiration => TimeSpan.FromMinutes(5);

    /// <inheritdoc />
    public IReadOnlyCollection<string> CacheTags => Tags;
}

/// <summary>
/// Käsittelijä <see cref="GetAdminStationsQuery"/>-kyselylle.
/// </summary>
public sealed class GetAdminStationsQueryHandler
    : IRequestHandler<GetAdminStationsQuery, Result<IReadOnlyList<GamingStationResponse>>>
{
    private readonly IGamingStationService _gamingStationService;

    /// <summary>
    /// Alustaa uuden <see cref="GetAdminStationsQueryHandler"/>-instanssin.
    /// </summary>
    /// <param name="gamingStationService">Pelipistepalvelu ylläpidon pelipistelistauksen hakemiseen.</param>
    public GetAdminStationsQueryHandler(IGamingStationService gamingStationService)
    {
        _gamingStationService = gamingStationService;
    }

    /// <summary>
    /// Hakee kaikki pelipisteet ylläpitonäkymää varten.
    /// </summary>
    /// <param name="request">Ylläpidon pelipistekysely.</param>
    /// <param name="cancellationToken">Peruutustunniste asynkronisen operaation keskeyttämiseen.</param>
    /// <returns>Lista kaikista pelipisteistä tai virhetulos.</returns>
    public Task<Result<IReadOnlyList<GamingStationResponse>>> Handle(
        GetAdminStationsQuery request,
        CancellationToken cancellationToken)
    {
        return _gamingStationService.GetAllStationsForAdminAsync(cancellationToken);
    }
}
