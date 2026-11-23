using MediatR;
using Pelihuone.Application.Abstractions.Caching;
using Pelihuone.Application.Abstractions.Services;
using Pelihuone.Application.Common;
using Pelihuone.Contracts.Games;

namespace Pelihuone.Application.Features.Games.Queries;

/// <summary>
/// Kysely opiskelijoiden ehdottamien toivelistapelien hakemiseen välimuistia hyödyntäen.
/// </summary>
public sealed record GetWishlistGamesQuery()
    : IRequest<Result<IReadOnlyList<GameResponse>>>, ICacheableQuery
{
    private static readonly string[] Tags = [Abstractions.Caching.CacheTags.Games];

    /// <inheritdoc />
    public string CacheKey => "games:wishlist";

    /// <inheritdoc />
    public TimeSpan? Expiration => TimeSpan.FromMinutes(2);

    /// <inheritdoc />
    public IReadOnlyCollection<string> CacheTags => Tags;
}

/// <summary>
/// Käsittelijä <see cref="GetWishlistGamesQuery"/>-kyselylle.
/// </summary>
public sealed class GetWishlistGamesQueryHandler
    : IRequestHandler<GetWishlistGamesQuery, Result<IReadOnlyList<GameResponse>>>
{
    private readonly IGameService _gameService;

    /// <summary>
    /// Alustaa uuden <see cref="GetWishlistGamesQueryHandler"/>-instanssin.
    /// </summary>
    /// <param name="gameService">Pelipalvelu toivelistapelien hakemiseen.</param>
    public GetWishlistGamesQueryHandler(IGameService gameService)
    {
        _gameService = gameService;
    }

    /// <summary>
    /// Hakee kaikki toivelistalla olevat pelit.
    /// </summary>
    /// <param name="request">Toivelistakysely.</param>
    /// <param name="cancellationToken">Peruutustunniste asynkronisen operaation keskeyttämiseen.</param>
    /// <returns>Lista toivelistapeleistä tai virhetulos.</returns>
    public Task<Result<IReadOnlyList<GameResponse>>> Handle(
        GetWishlistGamesQuery request,
        CancellationToken cancellationToken)
    {
        return _gameService.GetWishlistAsync(cancellationToken);
    }
}
