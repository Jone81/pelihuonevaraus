using Pelihuone.Application.Common;
using Pelihuone.Contracts.GamingStations;

namespace Pelihuone.Application.GamingStations;

/// <summary>
/// Sovelluspalvelurajapinta pelipisteiden ja niiden saatavuustietojen hakemiseen.
/// </summary>
public interface IGamingStationService
{
    /// <summary>
    /// Hakee kaikki aktiiviset pelipisteet.
    /// </summary>
    Task<Result<IReadOnlyList<GamingStationResponse>>> GetAllStationsAsync(
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Hakee annetulle aikavälille vapaana olevat pelipisteet ottaen huomioon tilavaraukset ja SharedTV-rajoitteet.
    /// </summary>
    Task<Result<IReadOnlyList<GamingStationResponse>>> GetAvailableStationsAsync(
        DateTimeOffset startUtc,
        DateTimeOffset endUtc,
        CancellationToken cancellationToken = default);
}
