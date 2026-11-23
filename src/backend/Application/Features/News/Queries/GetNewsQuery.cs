using MediatR;
using Pelihuone.Application.Abstractions.Caching;
using Pelihuone.Application.Abstractions.Services;
using Pelihuone.Application.Common;
using Pelihuone.Contracts.News;

namespace Pelihuone.Application.Features.News.Queries;

/// <summary>
/// Kysely kaikkien tiedotteiden ja uutisten hakemiseen välimuistia hyödyntäen.
/// </summary>
public sealed record GetNewsQuery()
    : IRequest<Result<IReadOnlyList<NewsResponse>>>, ICacheableQuery
{
    private static readonly string[] Tags = [Abstractions.Caching.CacheTags.News];

    /// <inheritdoc />
    public string CacheKey => "news:all";

    /// <inheritdoc />
    public TimeSpan? Expiration => TimeSpan.FromMinutes(2);

    /// <inheritdoc />
    public IReadOnlyCollection<string> CacheTags => Tags;
}

/// <summary>
/// Käsittelijä <see cref="GetNewsQuery"/>-kyselylle.
/// </summary>
public sealed class GetNewsQueryHandler
    : IRequestHandler<GetNewsQuery, Result<IReadOnlyList<NewsResponse>>>
{
    private readonly INewsService _newsService;

    /// <summary>
    /// Alustaa uuden <see cref="GetNewsQueryHandler"/>-instanssin.
    /// </summary>
    /// <param name="newsService">Uutispalvelu tiedotteiden hakemiseen.</param>
    public GetNewsQueryHandler(INewsService newsService)
    {
        _newsService = newsService;
    }

    /// <summary>
    /// Hakee kaikki näytettävät uutiset ja tiedotteet.
    /// </summary>
    /// <param name="request">Tiedotekysely.</param>
    /// <param name="cancellationToken">Peruutustunniste asynkronisen operaation keskeyttämiseen.</param>
    /// <returns>Lista tiedotteista tai virhetulos.</returns>
    public Task<Result<IReadOnlyList<NewsResponse>>> Handle(
        GetNewsQuery request,
        CancellationToken cancellationToken)
    {
        return _newsService.GetAllNewsAsync(cancellationToken);
    }
}
