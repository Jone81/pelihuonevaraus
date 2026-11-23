using MediatR;
using Pelihuone.Application.Abstractions.Caching;
using Pelihuone.Application.Abstractions.Notifications;
using Pelihuone.Application.Abstractions.Services;
using Pelihuone.Application.Common;
using Pelihuone.Contracts.Settings;

namespace Pelihuone.Application.Features.Settings.Commands;

/// <summary>
/// Komento sivuston yleisten asetusten päivittämiseen.
/// </summary>
/// <param name="Request">Päivitettävät sivustoasetukset.</param>
public sealed record UpdateSiteSettingsCommand(UpdateSiteSettingsRequest Request)
    : IRequest<Result<SiteSettingsResponse>>;

/// <summary>
/// Käsittelijä <see cref="UpdateSiteSettingsCommand"/>-komennolle.
/// </summary>
public sealed class UpdateSiteSettingsCommandHandler
    : IRequestHandler<UpdateSiteSettingsCommand, Result<SiteSettingsResponse>>
{
    private readonly ISettingsService _settingsService;
    private readonly ICacheService _cacheService;
    private readonly IRealtimeNotifier _realtimeNotifier;

    /// <summary>
    /// Alustaa uuden <see cref="UpdateSiteSettingsCommandHandler"/>-instanssin.
    /// </summary>
    /// <param name="settingsService">Asetuspalvelu asetusten tallentamiseen.</param>
    /// <param name="cacheService">Välimuistipalvelu asetusvälimuistin invalidoimiseen.</param>
    /// <param name="realtimeNotifier">Reaaliaikailmoitin asetusmuutoksen välittämiseen asiakasohjelmille.</param>
    public UpdateSiteSettingsCommandHandler(
        ISettingsService settingsService,
        ICacheService cacheService,
        IRealtimeNotifier realtimeNotifier)
    {
        _settingsService = settingsService;
        _cacheService = cacheService;
        _realtimeNotifier = realtimeNotifier;
    }

    /// <summary>
    /// Päivittää sivuston asetukset, invalidoi asetusvälimuistin ja lähettää reaaliaikailmoituksen onnistuessaan.
    /// </summary>
    /// <param name="request">Asetusten päivityskomento.</param>
    /// <param name="cancellationToken">Peruutustunniste asynkronisen operaation keskeyttämiseen.</param>
    /// <returns>Päivitetyt sivustoasetukset tai virhetulos.</returns>
    public async Task<Result<SiteSettingsResponse>> Handle(
        UpdateSiteSettingsCommand request,
        CancellationToken cancellationToken)
    {
        Result<SiteSettingsResponse> result = await _settingsService.UpdateSettingsAsync(
            request.Request,
            cancellationToken);

        if (result.IsSuccess)
        {
            await _cacheService.RemoveByTagAsync(CacheTags.Settings, cancellationToken);
            await _realtimeNotifier.NotifySettingsChangedAsync(cancellationToken);
        }

        return result;
    }
}
