using MediatR;
using Pelihuone.Application.Abstractions.Caching;
using Pelihuone.Application.Abstractions.Services;
using Pelihuone.Application.Common;
using Pelihuone.Contracts.Games;
using Pelihuone.Domain.Enums;

namespace Pelihuone.Application.Features.Games.Queries;

/// <summary>
/// Kysely pelikirjaston pelien hakemiseen (kaikki pelit tai suodatettuna alustan mukaan) välimuistia hyödyntäen.
/// </summary>
/// <param name="Platform">Valinnainen pelialustasuodatin.</param>
public sealed record GetGamesQuery(GamingPlatform? Platform = null)
    : IRequest<Result<IReadOnlyList<GameResponse>>>, ICacheableQuery
{
    private static readonly string[] Tags = [Abstractions.Caching.CacheTags.Games];

    /// <inheritdoc />
    public string CacheKey => Platform.HasValue ? $"games:platform:{Platform.Value}" : "games:all";

    /// <inheritdoc />
    public TimeSpan? Expiration => TimeSpan.FromMinutes(2);

    /// <inheritdoc />
    public IReadOnlyCollection<string> CacheTags => Tags;
}

/// <summary>
/// Käsittelijä <see cref="GetGamesQuery"/>-kyselylle.
/// </summary>
public sealed class GetGamesQueryHandler
    : IRequestHandler<GetGamesQuery, Result<IReadOnlyList<GameResponse>>>
{
    private readonly IGameService _gameService;

    /// <summary>
    /// Alustaa uuden <see cref="GetGamesQueryHandler"/>-instanssin.
    /// </summary>
    /// <param name="gameService">Pelipalvelu pelivalikoiman hakemiseen.</param>
    public GetGamesQueryHandler(IGameService gameService)
    {
        _gameService = gameService;
    }

    /// <summary>
    /// Hakee kaikki pelit tai annetulle pelialustalle kuuluvat pelit.
    /// </summary>
    /// <param name="request">Pelikirjastokysely.</param>
    /// <param name="cancellationToken">Peruutustunniste asynkronisen operaation keskeyttämiseen.</param>
    /// <returns>Lista peleistä tai virhetulos.</returns>
    public Task<Result<IReadOnlyList<GameResponse>>> Handle(
        GetGamesQuery request,
        CancellationToken cancellationToken)
    {
        return request.Platform.HasValue
            ? _gameService.GetGamesByPlatformAsync(request.Platform.Value, cancellationToken)
            : _gameService.GetAllGamesAsync(cancellationToken);
    }
}
