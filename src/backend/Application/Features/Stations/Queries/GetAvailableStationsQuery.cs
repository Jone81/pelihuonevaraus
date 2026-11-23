using MediatR;
using Pelihuone.Application.Abstractions.Services;
using Pelihuone.Application.Common;
using Pelihuone.Contracts.GamingStations;

namespace Pelihuone.Application.Features.Stations.Queries;

/// <summary>
/// Kysely annetulla aikavälillä vapaana olevien pelipisteiden hakemiseen.
/// Ei toteuta <c>ICacheableQuery</c>-rajapintaa, koska "vapaana nyt" -laskentaa ei koskaan välimuistiteta.
/// </summary>
/// <param name="StartUtc">Haettavan aikavälin alkuaika UTC-muodossa.</param>
/// <param name="EndUtc">Haettavan aikavälin loppuaika UTC-muodossa.</param>
public sealed record GetAvailableStationsQuery(DateTimeOffset StartUtc, DateTimeOffset EndUtc)
    : IRequest<Result<IReadOnlyList<GamingStationResponse>>>;

/// <summary>
/// Käsittelijä <see cref="GetAvailableStationsQuery"/>-kyselylle.
/// </summary>
public sealed class GetAvailableStationsQueryHandler
    : IRequestHandler<GetAvailableStationsQuery, Result<IReadOnlyList<GamingStationResponse>>>
{
    private readonly IGamingStationService _gamingStationService;

    /// <summary>
    /// Alustaa uuden <see cref="GetAvailableStationsQueryHandler"/>-instanssin.
    /// </summary>
    /// <param name="gamingStationService">Pelipistepalvelu reaaliaikaiseen saatavuuslaskentaan.</param>
    public GetAvailableStationsQueryHandler(IGamingStationService gamingStationService)
    {
        _gamingStationService = gamingStationService;
    }

    /// <summary>
    /// Hakee annetulle aikavälille vapaana olevat pelipisteet suoraan ajantasaisesta varaustilanteesta.
    /// </summary>
    /// <param name="request">Vapaiden pelipisteiden kysely.</param>
    /// <param name="cancellationToken">Peruutustunniste asynkronisen operaation keskeyttämiseen.</param>
    /// <returns>Lista vapaista pelipisteistä tai virhetulos.</returns>
    public Task<Result<IReadOnlyList<GamingStationResponse>>> Handle(
        GetAvailableStationsQuery request,
        CancellationToken cancellationToken)
    {
        return _gamingStationService.GetAvailableStationsAsync(
            request.StartUtc,
            request.EndUtc,
            cancellationToken);
    }
}
