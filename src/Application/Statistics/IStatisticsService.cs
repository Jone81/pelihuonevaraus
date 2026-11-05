using Pelihuone.Application.Common;
using Pelihuone.Contracts.Statistics;

namespace Pelihuone.Application.Statistics;

/// <summary>
/// Sovelluspalvelurajapinta järjestelmän käyttötilastojen ja analytiikan kokoamiseen.
/// </summary>
public interface IStatisticsService
{
    /// <summary>
    /// Laskee ja palauttaa yhteenvedon varauksista, käyttäjistä, peleistä ja pelipisteiden käyttöasteesta.
    /// </summary>
    Task<Result<StatisticsResponse>> GetStatisticsAsync(CancellationToken cancellationToken = default);
}
