using Pelihuone.Application.Common;
using Pelihuone.Contracts.GamingStations;

namespace Pelihuone.Application.GamingStations;

/// <summary>
/// Sovelluspalvelurajapinta pelipisteiden, niiden saatavuustietojen sekä huoltotilan hallintaan.
/// </summary>
public interface IGamingStationService
{
    /// <summary>
    /// Hakee kaikki aktiiviset pelipisteet.
    /// </summary>
    /// <param name="cancellationToken">Peruutustunniste asynkronisen operaation keskeyttämiseen.</param>
    /// <returns>Onnistunut tulos, joka sisältää aktiiviset pelipisteet.</returns>
    Task<Result<IReadOnlyList<GamingStationResponse>>> GetAllStationsAsync(
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Hakee kaikki pelipisteet (sekä käytössä olevat että huoltotilaan asetetut) ylläpitonäkymää varten.
    /// </summary>
    /// <param name="cancellationToken">Peruutustunniste asynkronisen operaation keskeyttämiseen.</param>
    /// <returns>Onnistunut tulos, joka sisältää kaikki pelipisteet.</returns>
    Task<Result<IReadOnlyList<GamingStationResponse>>> GetAllStationsForAdminAsync(
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Hakee annetulle aikavälille vapaana olevat pelipisteet ottaen huomioon tilavaraukset ja SharedTV-rajoitteet.
    /// </summary>
    /// <param name="startUtc">Varauksen alkamisaika UTC-muodossa.</param>
    /// <param name="endUtc">Varauksen päättymisaika UTC-muodossa.</param>
    /// <param name="cancellationToken">Peruutustunniste asynkronisen operaation keskeyttämiseen.</param>
    /// <returns>Onnistunut tulos, joka sisältää aikavälillä vapaana olevat pelipisteet.</returns>
    Task<Result<IReadOnlyList<GamingStationResponse>>> GetAvailableStationsAsync(
        DateTimeOffset startUtc,
        DateTimeOffset endUtc,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Päivittää yksittäisen pelipisteen käyttötilan (aktiivinen / huollossa) ja valinnaisesti nimen.
    /// </summary>
    /// <param name="stationId">Päivitettävän pelipisteen tunniste.</param>
    /// <param name="request">Päivityspyynnön tiedot.</param>
    /// <param name="cancellationToken">Peruutustunniste asynkronisen operaation keskeyttämiseen.</param>
    /// <returns>Onnistunut tulos päivitetyllä pelipisteellä tai virhe, jos laitetta ei löydy.</returns>
    Task<Result<GamingStationResponse>> UpdateStationStatusAsync(
        Guid stationId,
        UpdateGamingStationStatusRequest request,
        CancellationToken cancellationToken = default);
}
