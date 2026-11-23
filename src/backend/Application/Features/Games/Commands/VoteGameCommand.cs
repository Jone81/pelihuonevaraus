using MediatR;
using Pelihuone.Application.Abstractions.Caching;
using Pelihuone.Application.Abstractions.Notifications;
using Pelihuone.Application.Abstractions.Services;
using Pelihuone.Application.Common;
using Pelihuone.Contracts.Games;

namespace Pelihuone.Application.Features.Games.Commands;

/// <summary>
/// Komento kannatusäänen antamiseen toivelistalla olevalle pelille.
/// </summary>
/// <param name="GameId">Äänestettävän pelin tunniste.</param>
public sealed record VoteGameCommand(Guid GameId)
    : IRequest<Result<GameResponse>>;

/// <summary>
/// Käsittelijä <see cref="VoteGameCommand"/>-komennolle.
/// </summary>
public sealed class VoteGameCommandHandler
    : IRequestHandler<VoteGameCommand, Result<GameResponse>>
{
    private readonly IGameService _gameService;
    private readonly ICacheService _cacheService;
    private readonly IRealtimeNotifier _realtimeNotifier;

    /// <summary>
    /// Alustaa uuden <see cref="VoteGameCommandHandler"/>-instanssin.
    /// </summary>
    /// <param name="gameService">Pelipalvelu kannatusäänen rekisteröimiseen.</param>
    /// <param name="cacheService">Välimuistipalvelu peli- ja tilastovälimuistin invalidoimiseen.</param>
    /// <param name="realtimeNotifier">Reaaliaikailmoitin pelikirjaston muutoksen välittämiseen.</param>
    public VoteGameCommandHandler(
        IGameService gameService,
        ICacheService cacheService,
        IRealtimeNotifier realtimeNotifier)
    {
        _gameService = gameService;
        _cacheService = cacheService;
        _realtimeNotifier = realtimeNotifier;
    }

    /// <summary>
    /// Lisää kannatusäänen pelille, invalidoi peli- ja tilastovälimuistit ja ilmoittaa muutoksesta reaaliajassa onnistuessaan.
    /// </summary>
    /// <param name="request">Pelin äänestyskomento.</param>
    /// <param name="cancellationToken">Peruutustunniste asynkronisen operaation keskeyttämiseen.</param>
    /// <returns>Päivitetty peli tai virhetulos.</returns>
    public async Task<Result<GameResponse>> Handle(
        VoteGameCommand request,
        CancellationToken cancellationToken)
    {
        Result<GameResponse> result = await _gameService.UpvoteWishlistGameAsync(
            request.GameId,
            cancellationToken);

        if (result.IsSuccess)
        {
            await _cacheService.RemoveByTagAsync(CacheTags.Games, cancellationToken);
            await _cacheService.RemoveByTagAsync(CacheTags.Statistics, cancellationToken);
            await _realtimeNotifier.NotifyGamesChangedAsync(cancellationToken);
        }

        return result;
    }
}
