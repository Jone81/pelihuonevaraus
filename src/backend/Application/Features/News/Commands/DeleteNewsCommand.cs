using MediatR;
using Pelihuone.Application.Abstractions.Caching;
using Pelihuone.Application.Abstractions.Notifications;
using Pelihuone.Application.Abstractions.Services;
using Pelihuone.Application.Common;

namespace Pelihuone.Application.Features.News.Commands;

/// <summary>
/// Komento olemassa olevan tiedotteen tai uutisen poistamiseen (ylläpitäjä).
/// </summary>
/// <param name="NewsId">Poistettavan tiedotteen tunniste.</param>
/// <param name="UserId">Toiminnon suorittavan ylläpitäjän tunniste.</param>
public sealed record DeleteNewsCommand(Guid NewsId, Guid UserId)
    : IRequest<Result<bool>>;

/// <summary>
/// Käsittelijä <see cref="DeleteNewsCommand"/>-komennolle.
/// </summary>
public sealed class DeleteNewsCommandHandler
    : IRequestHandler<DeleteNewsCommand, Result<bool>>
{
    private readonly INewsService _newsService;
    private readonly ICacheService _cacheService;
    private readonly IRealtimeNotifier _realtimeNotifier;

    /// <summary>
    /// Alustaa uuden <see cref="DeleteNewsCommandHandler"/>-instanssin.
    /// </summary>
    /// <param name="newsService">Uutispalvelu tiedotteen poistamiseen.</param>
    /// <param name="cacheService">Välimuistipalvelu tiedotevälimuistin invalidoimiseen.</param>
    /// <param name="realtimeNotifier">Reaaliaikailmoitin tiedotemuutoksen välittämiseen.</param>
    public DeleteNewsCommandHandler(
        INewsService newsService,
        ICacheService cacheService,
        IRealtimeNotifier realtimeNotifier)
    {
        _newsService = newsService;
        _cacheService = cacheService;
        _realtimeNotifier = realtimeNotifier;
    }

    /// <summary>
    /// Poistaa tiedotteen, invalidoi tiedotevälimuistin ja ilmoittaa muutoksesta reaaliajassa onnistuessaan.
    /// </summary>
    /// <param name="request">Tiedotteen poistokomento.</param>
    /// <param name="cancellationToken">Peruutustunniste asynkronisen operaation keskeyttämiseen.</param>
    /// <returns>Tieto poiston onnistumisesta tai virhetulos.</returns>
    public async Task<Result<bool>> Handle(
        DeleteNewsCommand request,
        CancellationToken cancellationToken)
    {
        Result<bool> result = await _newsService.DeleteNewsAsync(
            request.NewsId,
            request.UserId,
            cancellationToken);

        if (result.IsSuccess)
        {
            await _cacheService.RemoveByTagAsync(CacheTags.News, cancellationToken);
            await _realtimeNotifier.NotifyNewsChangedAsync(cancellationToken);
        }

        return result;
    }
}
