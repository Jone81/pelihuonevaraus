using MediatR;
using Pelihuone.Application.Abstractions.Caching;
using Pelihuone.Application.Abstractions.Services;
using Pelihuone.Application.Common;
using Pelihuone.Contracts.GamingStations;

namespace Pelihuone.Application.Features.Stations.Queries;

/// <summary>
/// Kysely kaikkien aktiivisten pelipisteiden hakemiseen välimuistia hyödyntäen.
/// </summary>
public sealed record GetStationsQuery()
    : IRequest<Result<IReadOnlyList<GamingStationResponse>>>, ICacheableQuery
{
    private static readonly string[] Tags = [Abstractions.Caching.CacheTags.Stations];

    /// <inheritdoc />
    public string CacheKey => "stations:all";

    /// <inheritdoc />
    public TimeSpan? Expiration => TimeSpan.FromMinutes(5);

    /// <inheritdoc />
    public IReadOnlyCollection<string> CacheTags => Tags;
}

/// <summary>
/// Käsittelijä <see cref="GetStationsQuery"/>-kyselylle.
/// </summary>
public sealed class GetStationsQueryHandler
    : IRequestHandler<GetStationsQuery, Result<IReadOnlyList<GamingStationResponse>>>
{
    private readonly IGamingStationService _gamingStationService;

    /// <summary>
    /// Alustaa uuden <see cref="GetStationsQueryHandler"/>-instanssin.
    /// </summary>
    /// <param name="gamingStationService">Pelipistepalvelu aktiivisten pelipisteiden hakemiseen.</param>
    public GetStationsQueryHandler(IGamingStationService gamingStationService)
    {
        _gamingStationService = gamingStationService;
    }

    /// <summary>
    /// Hakee kaikki aktiiviset pelipisteet.
    /// </summary>
    /// <param name="request">Pelipistekysely.</param>
    /// <param name="cancellationToken">Peruutustunniste asynkronisen operaation keskeyttämiseen.</param>
    /// <returns>Lista aktiivisista pelipisteistä tai virhetulos.</returns>
    public Task<Result<IReadOnlyList<GamingStationResponse>>> Handle(
        GetStationsQuery request,
        CancellationToken cancellationToken)
    {
        return _gamingStationService.GetAllStationsAsync(cancellationToken);
    }
}
