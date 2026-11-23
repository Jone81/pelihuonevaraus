using MediatR;
using Pelihuone.Application.Abstractions.Caching;
using Pelihuone.Application.Abstractions.Notifications;
using Pelihuone.Application.Abstractions.Services;
using Pelihuone.Application.Common;
using Pelihuone.Contracts.Games;

namespace Pelihuone.Application.Features.Games.Commands;

/// <summary>
/// Komento pelin tilan vaihtamiseen toivelistan ja virallisen pelivalikoiman välillä (ylläpitäjä).
/// </summary>
/// <param name="GameId">Päivitettävän pelin tunniste.</param>
/// <param name="UserId">Toiminnon suorittavan ylläpitäjän tunniste.</param>
public sealed record ToggleWishlistCommand(Guid GameId, Guid UserId)
    : IRequest<Result<GameResponse>>;

/// <summary>
/// Käsittelijä <see cref="ToggleWishlistCommand"/>-komennolle.
/// </summary>
public sealed class ToggleWishlistCommandHandler
    : IRequestHandler<ToggleWishlistCommand, Result<GameResponse>>
{
    private readonly IGameService _gameService;
    private readonly ICacheService _cacheService;
    private readonly IRealtimeNotifier _realtimeNotifier;

    /// <summary>
    /// Alustaa uuden <see cref="ToggleWishlistCommandHandler"/>-instanssin.
    /// </summary>
    /// <param name="gameService">Pelipalvelu pelin tilan vaihtamiseen.</param>
    /// <param name="cacheService">Välimuistipalvelu peli- ja tilastovälimuistin invalidoimiseen.</param>
    /// <param name="realtimeNotifier">Reaaliaikailmoitin pelikirjaston muutoksen välittämiseen.</param>
    public ToggleWishlistCommandHandler(
        IGameService gameService,
        ICacheService cacheService,
        IRealtimeNotifier realtimeNotifier)
    {
        _gameService = gameService;
        _cacheService = cacheService;
        _realtimeNotifier = realtimeNotifier;
    }

    /// <summary>
    /// Vaihtaa pelin toivelistatilan, invalidoi peli- ja tilastovälimuistit ja ilmoittaa muutoksesta reaaliajassa onnistuessaan.
    /// </summary>
    /// <param name="request">Toivelistatilan vaihtokomento.</param>
    /// <param name="cancellationToken">Peruutustunniste asynkronisen operaation keskeyttämiseen.</param>
    /// <returns>Päivitetty peli tai virhetulos.</returns>
    public async Task<Result<GameResponse>> Handle(
        ToggleWishlistCommand request,
        CancellationToken cancellationToken)
    {
        Result<GameResponse> result = await _gameService.ToggleWishlistStatusAsync(
            request.GameId,
            request.UserId,
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
