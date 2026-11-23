using MediatR;
using Pelihuone.Application.Abstractions.Caching;
using Pelihuone.Application.Abstractions.Notifications;
using Pelihuone.Application.Abstractions.Services;
using Pelihuone.Application.Common;
using Pelihuone.Contracts.Games;

namespace Pelihuone.Application.Features.Games.Commands;

/// <summary>
/// Komento uuden pelin lisäämiseen viralliseen pelivalikoimaan (ylläpitäjä).
/// </summary>
/// <param name="Request">Uuden pelin tiedot.</param>
/// <param name="UserId">Toiminnon suorittavan ylläpitäjän tunniste.</param>
public sealed record CreateGameCommand(CreateGameRequest Request, Guid UserId)
    : IRequest<Result<GameResponse>>;

/// <summary>
/// Käsittelijä <see cref="CreateGameCommand"/>-komennolle.
/// </summary>
public sealed class CreateGameCommandHandler
    : IRequestHandler<CreateGameCommand, Result<GameResponse>>
{
    private readonly IGameService _gameService;
    private readonly ICacheService _cacheService;
    private readonly IRealtimeNotifier _realtimeNotifier;

    /// <summary>
    /// Alustaa uuden <see cref="CreateGameCommandHandler"/>-instanssin.
    /// </summary>
    /// <param name="gameService">Pelipalvelu pelin luomiseen.</param>
    /// <param name="cacheService">Välimuistipalvelu peli- ja tilastovälimuistin invalidoimiseen.</param>
    /// <param name="realtimeNotifier">Reaaliaikailmoitin pelikirjaston muutoksen välittämiseen.</param>
    public CreateGameCommandHandler(
        IGameService gameService,
        ICacheService cacheService,
        IRealtimeNotifier realtimeNotifier)
    {
        _gameService = gameService;
        _cacheService = cacheService;
        _realtimeNotifier = realtimeNotifier;
    }

    /// <summary>
    /// Lisää uuden pelin, invalidoi peli- ja tilastovälimuistit ja ilmoittaa muutoksesta reaaliajassa onnistuessaan.
    /// </summary>
    /// <param name="request">Pelin luontikomento.</param>
    /// <param name="cancellationToken">Peruutustunniste asynkronisen operaation keskeyttämiseen.</param>
    /// <returns>Luotu peli tai virhetulos.</returns>
    public async Task<Result<GameResponse>> Handle(
        CreateGameCommand request,
        CancellationToken cancellationToken)
    {
        Result<GameResponse> result = await _gameService.CreateGameAsync(
            request.Request,
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
