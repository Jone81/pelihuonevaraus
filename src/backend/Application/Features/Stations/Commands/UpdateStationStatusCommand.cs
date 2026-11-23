using MediatR;
using Pelihuone.Application.Abstractions.Caching;
using Pelihuone.Application.Abstractions.Notifications;
using Pelihuone.Application.Abstractions.Services;
using Pelihuone.Application.Common;
using Pelihuone.Contracts.GamingStations;

namespace Pelihuone.Application.Features.Stations.Commands;

/// <summary>
/// Komento pelipisteen käyttötilan (aktiivinen / huollossa) ja valinnaisen nimen päivittämiseen.
/// </summary>
/// <param name="StationId">Päivitettävän pelipisteen tunniste.</param>
/// <param name="Request">Päivityspyynnön tiedot.</param>
public sealed record UpdateStationStatusCommand(Guid StationId, UpdateGamingStationStatusRequest Request)
    : IRequest<Result<GamingStationResponse>>;

/// <summary>
/// Käsittelijä <see cref="UpdateStationStatusCommand"/>-komennolle.
/// </summary>
public sealed class UpdateStationStatusCommandHandler
    : IRequestHandler<UpdateStationStatusCommand, Result<GamingStationResponse>>
{
    private readonly IGamingStationService _gamingStationService;
    private readonly ICacheService _cacheService;
    private readonly IRealtimeNotifier _realtimeNotifier;

    /// <summary>
    /// Alustaa uuden <see cref="UpdateStationStatusCommandHandler"/>-instanssin.
    /// </summary>
    /// <param name="gamingStationService">Pelipistepalvelu pelipisteen tilan päivittämiseen.</param>
    /// <param name="cacheService">Välimuistipalvelu pelipistevälimuistin invalidoimiseen.</param>
    /// <param name="realtimeNotifier">Reaaliaikailmoitin tilamuutoksen välittämiseen asiakasohjelmille.</param>
    public UpdateStationStatusCommandHandler(
        IGamingStationService gamingStationService,
        ICacheService cacheService,
        IRealtimeNotifier realtimeNotifier)
    {
        _gamingStationService = gamingStationService;
        _cacheService = cacheService;
        _realtimeNotifier = realtimeNotifier;
    }

    /// <summary>
    /// Päivittää pelipisteen tilan, invalidoi pelipistevälimuistin ja lähettää reaaliaikailmoituksen onnistuessaan.
    /// </summary>
    /// <param name="request">Pelipisteen tilapäivityskomento.</param>
    /// <param name="cancellationToken">Peruutustunniste asynkronisen operaation keskeyttämiseen.</param>
    /// <returns>Päivitetyn pelipisteen tiedot tai virhetulos.</returns>
    public async Task<Result<GamingStationResponse>> Handle(
        UpdateStationStatusCommand request,
        CancellationToken cancellationToken)
    {
        Result<GamingStationResponse> result = await _gamingStationService.UpdateStationStatusAsync(
            request.StationId,
            request.Request,
            cancellationToken);

        if (result.IsSuccess)
        {
            await _cacheService.RemoveByTagAsync(CacheTags.Stations, cancellationToken);
            await _realtimeNotifier.NotifyStationStatusChangedAsync(cancellationToken);
        }

        return result;
    }
}
