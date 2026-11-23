using MediatR;
using Pelihuone.Application.Abstractions.Caching;
using Pelihuone.Application.Abstractions.Notifications;
using Pelihuone.Application.Abstractions.Services;
using Pelihuone.Application.Common;
using Pelihuone.Contracts.Games;

namespace Pelihuone.Application.Features.Games.Commands;

/// <summary>
/// Komento uuden pelitoiveen lisäämiseen toivelistalle.
/// </summary>
/// <param name="Request">Pelitoiveen tiedot.</param>
public sealed record SuggestWishlistGameCommand(WishGameRequest Request)
    : IRequest<Result<GameResponse>>;

/// <summary>
/// Käsittelijä <see cref="SuggestWishlistGameCommand"/>-komennolle.
/// </summary>
public sealed class SuggestWishlistGameCommandHandler
    : IRequestHandler<SuggestWishlistGameCommand, Result<GameResponse>>
{
    private readonly IGameService _gameService;
    private readonly ICacheService _cacheService;
    private readonly IRealtimeNotifier _realtimeNotifier;

    /// <summary>
    /// Alustaa uuden <see cref="SuggestWishlistGameCommandHandler"/>-instanssin.
    /// </summary>
    /// <param name="gameService">Pelipalvelu toivelistapelin lisäämiseen.</param>
    /// <param name="cacheService">Välimuistipalvelu peli- ja tilastovälimuistin invalidoimiseen.</param>
    /// <param name="realtimeNotifier">Reaaliaikailmoitin pelikirjaston muutoksen välittämiseen.</param>
    public SuggestWishlistGameCommandHandler(
        IGameService gameService,
        ICacheService cacheService,
        IRealtimeNotifier realtimeNotifier)
    {
        _gameService = gameService;
        _cacheService = cacheService;
        _realtimeNotifier = realtimeNotifier;
    }

    /// <summary>
    /// Lisää pelitoiveen toivelistalle, invalidoi peli- ja tilastovälimuistit ja ilmoittaa muutoksesta reaaliajassa onnistuessaan.
    /// </summary>
    /// <param name="request">Pelitoiveen komento.</param>
    /// <param name="cancellationToken">Peruutustunniste asynkronisen operaation keskeyttämiseen.</param>
    /// <returns>Lisätty toivelistapeli tai virhetulos.</returns>
    public async Task<Result<GameResponse>> Handle(
        SuggestWishlistGameCommand request,
        CancellationToken cancellationToken)
    {
        Result<GameResponse> result = await _gameService.AddWishlistGameAsync(
            request.Request,
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
