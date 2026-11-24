using MediatR;
using Pelihuone.Application.Abstractions.Caching;
using Pelihuone.Application.Abstractions.Notifications;
using Pelihuone.Application.Abstractions.Services;
using Pelihuone.Application.Common;
using Pelihuone.Contracts.News;

namespace Pelihuone.Application.Features.News.Commands;

/// <summary>
/// Komento olemassa olevan tiedotteen tai uutisen muokkaamiseen (ylläpitäjä).
/// </summary>
/// <param name="NewsId">Muokattavan tiedotteen tunniste.</param>
/// <param name="Request">Päivitetyt tiedotteen kentät.</param>
/// <param name="UserId">Toiminnon suorittavan ylläpitäjän tunniste.</param>
public sealed record UpdateNewsCommand(Guid NewsId, UpdateNewsRequest Request, Guid UserId)
    : IRequest<Result<NewsResponse>>;

/// <summary>
/// Käsittelijä <see cref="UpdateNewsCommand"/>-komennolle.
/// </summary>
public sealed class UpdateNewsCommandHandler
    : IRequestHandler<UpdateNewsCommand, Result<NewsResponse>>
{
    private readonly INewsService _newsService;
    private readonly ICacheService _cacheService;
    private readonly IRealtimeNotifier _realtimeNotifier;

    /// <summary>
    /// Alustaa uuden <see cref="UpdateNewsCommandHandler"/>-instanssin.
    /// </summary>
    /// <param name="newsService">Uutispalvelu tiedotteen muokkaamiseen.</param>
    /// <param name="cacheService">Välimuistipalvelu tiedotevälimuistin invalidoimiseen.</param>
    /// <param name="realtimeNotifier">Reaaliaikailmoitin tiedotemuutoksen välittämiseen.</param>
    public UpdateNewsCommandHandler(
        INewsService newsService,
        ICacheService cacheService,
        IRealtimeNotifier realtimeNotifier)
    {
        _newsService = newsService;
        _cacheService = cacheService;
        _realtimeNotifier = realtimeNotifier;
    }

    /// <summary>
    /// Päivittää tiedotteen, invalidoi tiedotevälimuistin ja ilmoittaa muutoksesta reaaliajassa onnistuessaan.
    /// </summary>
    /// <param name="request">Tiedotteen päivityskomento.</param>
    /// <param name="cancellationToken">Peruutustunniste asynkronisen operaation keskeyttämiseen.</param>
    /// <returns>Päivitetty tiedote tai virhetulos.</returns>
    public async Task<Result<NewsResponse>> Handle(
        UpdateNewsCommand request,
        CancellationToken cancellationToken)
    {
        Result<NewsResponse> result = await _newsService.UpdateNewsAsync(
            request.NewsId,
            request.Request,
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
