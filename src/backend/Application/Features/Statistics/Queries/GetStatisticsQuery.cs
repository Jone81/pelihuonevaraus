using MediatR;
using Pelihuone.Application.Abstractions.Caching;
using Pelihuone.Application.Abstractions.Services;
using Pelihuone.Application.Common;
using Pelihuone.Contracts.Statistics;

namespace Pelihuone.Application.Features.Statistics.Queries;

/// <summary>
/// Kysely järjestelmän käyttötilastojen hakemiseen lyhytaikaista välimuistia hyödyntäen.
/// </summary>
public sealed record GetStatisticsQuery()
    : IRequest<Result<StatisticsResponse>>, ICacheableQuery
{
    private static readonly string[] Tags = [Abstractions.Caching.CacheTags.Statistics];

    /// <inheritdoc />
    public string CacheKey => "statistics:summary";

    /// <inheritdoc />
    public TimeSpan? Expiration => TimeSpan.FromSeconds(30);

    /// <inheritdoc />
    public IReadOnlyCollection<string> CacheTags => Tags;
}

/// <summary>
/// Käsittelijä <see cref="GetStatisticsQuery"/>-kyselylle.
/// </summary>
public sealed class GetStatisticsQueryHandler
    : IRequestHandler<GetStatisticsQuery, Result<StatisticsResponse>>
{
    private readonly IStatisticsService _statisticsService;

    /// <summary>
    /// Alustaa uuden <see cref="GetStatisticsQueryHandler"/>-instanssin.
    /// </summary>
    /// <param name="statisticsService">Tilastopalvelu käyttötilastojen laskemiseen.</param>
    public GetStatisticsQueryHandler(IStatisticsService statisticsService)
    {
        _statisticsService = statisticsService;
    }

    /// <summary>
    /// Laskee ja palauttaa järjestelmän käyttötilastot.
    /// </summary>
    /// <param name="request">Tilastokysely.</param>
    /// <param name="cancellationToken">Peruutustunniste asynkronisen operaation keskeyttämiseen.</param>
    /// <returns>Käyttötilastojen yhteenveto tai virhetulos.</returns>
    public Task<Result<StatisticsResponse>> Handle(
        GetStatisticsQuery request,
        CancellationToken cancellationToken)
    {
        return _statisticsService.GetStatisticsAsync(cancellationToken);
    }
}
